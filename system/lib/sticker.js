import Func from "./function.js";

import fs from "fs";
import path from "path";
import axios from "axios";
import Crypto from "crypto";
import ff from "fluent-ffmpeg";
import webp from "node-webpmux";
import { fileTypeFromBuffer } from "file-type";

async function imageToWebp(media) {
  const tmpFileOut = path.join(
    process.cwd(),
    "storage/tmp",
    await Func.getRandom("webp"),
  );
  const tmpFileIn = path.join(
    process.cwd(),
    "storage/tmp",
    await Func.getRandom("jpg"),
  );

  fs.writeFileSync(tmpFileIn, media);

  await new Promise((resolve, reject) => {
    ff(tmpFileIn)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
        "-vcodec",
        "libwebp",
        "-vf",
        "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
      ])
      .toFormat("webp")
      .save(tmpFileOut);
  });

  const buff = fs.readFileSync(tmpFileOut);
  fs.promises.unlink(tmpFileOut);
  fs.promises.unlink(tmpFileIn);
  return buff;
}

async function videoToWebp(media) {
  const tmpFileOut = path.join(
    process.cwd(),
    "storage/tmp",
    await Func.getRandom("webp"),
  );
  const tmpFileIn = path.join(
    process.cwd(),
    "storage/tmp",
    await Func.getRandom("mp4"),
  );

  fs.writeFileSync(tmpFileIn, media);

  await new Promise((resolve, reject) => {
    ff(tmpFileIn)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
        "-vcodec",
        "libwebp",
        "-vf",
        "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
        "-loop",
        "0",
        "-ss",
        "00:00:00.0",
        "-t",
        "00:00:05.0",
        "-preset",
        "default",
        "-an",
        "-vsync",
        "0",
      ])
      .toFormat("webp")
      .save(tmpFileOut);
  });

  const buff = fs.readFileSync(tmpFileOut);
  fs.promises.unlink(tmpFileOut);
  fs.promises.unlink(tmpFileIn);
  return buff;
}

async function writeExif(media, metadata) {
  let wMedia = /webp/.test(media.mimetype)
    ? media.data
    : /image/.test(media.mimetype)
      ? await imageToWebp(media.data)
      : /video/.test(media.mimetype)
        ? await videoToWebp(media.data)
        : "";
  const tmpFileOut = path.join(
    process.cwd(),
    "storage/tmp",
    await Func.getRandom("webp"),
  );
  const tmpFileIn = path.join(
    process.cwd(),
    "storage/tmp",
    await Func.getRandom("webp", "15"),
  );

  fs.writeFileSync(tmpFileIn, wMedia);

  if (Object.keys(metadata).length != 0) {
    const img = new webp.Image();
    const opt = {
      packId: metadata?.packId ? metadata.packId : "https://nhentai.net",
      packName: metadata?.packName ? metadata.packName : "Stiker dibuat oleh :",
      packPublish: metadata?.packPublish ? metadata.packPublish : "Arifzyn",
      packEmail: metadata?.packEmail
        ? metadata.packEmail
        : "arifzyn906@gmail.com",
      packWebsite: metadata?.packWebsite
        ? metadata.packWebsite
        : "https://nhentai.net",
      androidApp: metadata?.androidApp
        ? metadata.androidApp
        : "https://play.google.com/store/apps/details?id=com.bitsmedia.android.muslimpro",
      iOSApp: metadata?.iOSApp
        ? metadata.iOSApp
        : "https://apps.apple.com/id/app/muslim-pro-al-quran-adzan/id388389451?|=id",
      emojis: metadata?.emojis ? metadata.emojis : [],
      isAvatar: metadata?.isAvatar ? metadata.isAvatar : 0,
    };
    const json = {
      "sticker-pack-id": opt.packId,
      "sticker-pack-name": opt.packName,
      "sticker-pack-publisher": opt.packPublish,
      "sticker-pack-publisher-email": opt.packEmail,
      "sticker-pack-publisher-website": opt.packWebsite,
      "android-app-store-link": opt.androidApp,
      "ios-app-store-link": opt.iOSApp,
      emojis: opt.emojis,
      "is-avatar-sticker": opt.isAvatar,
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);

    exif.writeUIntLE(jsonBuff.length, 14, 4);
    await img.load(tmpFileIn);
    fs.promises.unlink(tmpFileIn);
    img.exif = exif;
    await img.save(tmpFileOut);

    return tmpFileOut;
  }
}

async function webp2mp4File(source) {
  return new Promise((resolve, reject) => {
    const form = new Func.FormData();
    let isUrl = typeof source === "string" && /https?:\/\//.test(source);

    form.append("new-image-url", isUrl ? source : "");
    form.append("new-image", isUrl ? "" : source, Date.now() + "-image.webp");
    Func.axios({
      method: "post",
      url: "https://s6.ezgif.com/webp-to-mp4",
      data: form,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${form._boundary}`,
      },
    })
      .then(({ data }) => {
        const bodyFormThen = new Func.FormData();
        const $ = Func.cheerio.load(data);
        const file = $("input[name='file']").attr("value");
        const token = $("input[name='token']").attr("value");
        const convert = $("input[name='file']").attr("value");

        bodyFormThen.append("file", file);
        bodyFormThen.append("convert", "Convert WebP to MP4!");
        Func.axios({
          method: "post",
          url: "https://ezgif.com/webp-to-mp4/" + file,
          data: bodyFormThen,
          headers: {
            "Content-Type": `multipart/form-data; boundary=${bodyFormThen._boundary}`,
          },
        })
          .then(({ data }) => {
            const $ = Func.cheerio.load(data);
            const result =
              "https:" +
              $("div#output > p.outfile > video > source").attr("src");

            resolve(result);
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

async function uploadFile(buffer) {
  const form = new Func.FormData();
  const { ext } = await fileTypeFromBuffer(buffer);

  form.append("file", buffer, await Func.getRandom(ext));
  let a = await axios.post("https://filezone.my.id/upload", form, {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,id;q=0.8",
      "content-type": `multipart/form-data; boundary=${form._boundary}`,
    },
  });
  return a.data.result;
}

export { uploadFile, imageToWebp, videoToWebp, writeExif, webp2mp4File };
