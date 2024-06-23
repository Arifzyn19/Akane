import axios from "axios";
import FormData from "form-data";

export default {
  command: ["upscale", "hd", "remini"],
  name: "upscale",
  tags: "tools",

  run: async (m, { conn }) => {
    const quoted = m.isQuoted ? m.quoted : m;

    if (/image/i.test(quoted.mime)) {
      const media = await quoted.download();

      try {
        const image = await enhance(media, "enhance");
        m.reply(image, { caption: "Done" });
      } catch (e) {
        conn.logger.error(e);
        m.reply("error");
      }
    } else {
      m.reply(`Reply/Kirim image dengan caption ${m.prefix + m.command}`);
    }
  },
};

const enhance = (urlPath, method) => {
  return new Promise(async (resolve, reject) => {
    let Methods = ["enhance", "recolor", "dehaze"];
    Methods.includes(method) ? (method = method) : (method = Methods[0]);
    let buffer,
      Form = new FormData(),
      scheme = "https" + "://" + "inferenceengine" + ".vyro" + ".ai/" + method;
    Form.append("model_version", 1, {
      "Content-Transfer-Encoding": "binary",
      contentType: "multipart/form-data; charset=uttf-8",
    });
    Form.append("image", Buffer.from(urlPath), {
      filename: "enhance_image_body.jpg",
      contentType: "image/jpeg",
    });
    Form.submit(
      {
        url: scheme,
        host: "inferenceengine" + ".vyro" + ".ai",
        path: "/" + method,
        protocol: "https:",
        headers: {
          "User-Agent": "okhttp/4.9.3",
          Connection: "Keep-Alive",
          "Accept-Encoding": "gzip",
        },
      },
      function (err, res) {
        if (err) reject();
        let data = [];
        res
          .on("data", function (chunk, resp) {
            data.push(chunk);
          })
          .on("end", () => {
            resolve(Buffer.concat(data));
          });
        res.on("error", (e) => {
          reject();
        });
      },
    );
  });
};
