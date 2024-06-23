import fs from "fs";
import chalk from "chalk";
import { fileURLToPath } from "url";
import Function from "../system/lib/function.js";

//—————「 Setings your bot 」—————//
global.name = "Akane - Bot";
global.wm = "Made from love";

global.author = "Arifzyn";
global.packname = "Created Sticker By";
global.link = "https://github.com/Arifzyn19";

global.owner = ["6288213503541", "6285691464024"];
global.pairingNumber = "62856914640248"; 

global.prefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|/~!?@#%^&.©^]/i;
global.thumbnail = fs.readFileSync("./storage/media/images.jpg");
global.ucapan = Function.timeSpeech();
global.func = Function;

global.msg = {
  owner: "Features can only be accessed owner!",
  group: "Features only accessible in group!",
  private: "Features only accessible private chat!",
  admin: "Features can only be accessed by group admin!",
  botAdmin: "Bot is not admin, can't use the features!",
  bot: "Features only accessible by me",
  premium: "Features only accessible by premium users",
  media: "Reply media...",
  query: "No Query?",
  error:
    "Seems to have encountered an unexpected error, please repeat your command for a while again",
  quoted: "Reply message...",
  wait: "Wait a minute...",
  urlInvalid: "Url Invalid",
  notFound: "Result Not Found!",
};

global.APIs = {
  arifzyn: "https://api.arifzyn.tech",
  rose: "https://api.itsrose.rest",
  xyro: "https://api.xyro.fund",
  akane: "https://akane.my.id",
  itzpire: "https://www.itzpire.com",
};

global.APIKeys = {
  "https://api.arifzyn.tech": process.env.APIKEY || "",
  "https://api.itsrose.rest": process.env.ROSE_KEY || "",
  "https://api.xyro.fund": "xyroKey",
};

global.API = (name, path = "/", query = {}, apikeyqueryname) => {
  const baseUrl = name in global.APIs ? global.APIs[name] : name;
  const apiKey = apikeyqueryname ? global.APIKeys[baseUrl] : "";
  const queryParams = new URLSearchParams({
    ...query,
    ...(apikeyqueryname && apiKey ? { [apikeyqueryname]: apiKey } : {}),
  });
  
  return baseUrl + path + (queryParams.toString() ? "?" + queryParams : "");
};

//—————「 Don"t change it 」—————//
let file = fileURLToPath(import.meta.url);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright("Update config.js"));
  import(`${file}?update=${Date.now()}`);
});
