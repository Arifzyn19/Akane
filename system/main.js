import "../storage/config.js";
import { Client, Serialize } from "./lib/serialize.js";
import Database from "./lib/database.js";

import fs from "fs";
import util from "util";
import path from 'path';
import pino from "pino";
import chalk from "chalk";
import readline from "readline";
import chokidar from "chokidar";
import { Boom } from "@hapi/boom";
import NodeCache from "node-cache";
import baileys from "@whiskeysockets/baileys";

const store = baileys.makeInMemoryStore({
  logger: pino({ level: "fatal" }).child({ level: "fatal" }),
});
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const database = new Database();

async function start() {
  process.on("uncaughtException", (err) => console.error(err));
  process.on("unhandledRejection", (err) => console.error(err));

  global.db = database.db;
  await database.loadDatabase();

  const msgRetryCounterCache = new NodeCache();
  const { state, saveCreds } =
    await baileys.useMultiFileAuthState("./system/session");
  const conn = baileys.default({
    logger: pino({ level: "fatal" }).child({ level: "fatal" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: baileys.makeCacheableSignalKeyStore(
        state.keys,
        pino({ level: "fatal" }).child({ level: "fatal" }),
      ),
    },
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      let jid = baileys.jidNormalizedUser(key.remoteJid);
      let msg = await store.loadMessage(jid, key.id);

      return msg?.message || "";
    },
    msgRetryCounterCache,
    defaultQueryTimeoutMs: undefined,
  });

  store.bind(conn.ev);

  conn.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id = baileys.jidNormalizedUser(contact.id);
      if (store && store.contacts)
        store.contacts[id] = { id, name: contact.notify };
    }
  });

  await Client({ conn, store });
  global.conn = conn;

  if (!conn.authState.creds.registered) {
    let phoneNumber;

    if (!!global.pairingNumber) {
      phoneNumber = global.pairingNumber.replace(/[^0-9]/g, "");

      if (
        !Object.keys(baileys.PHONENUMBER_MCC).some((v) =>
          phoneNumber.startsWith(v),
        )
      ) {
        console.log(
          chalk.bgBlack(
            chalk.redBright(
              "Start with your country's WhatsApp code, Example : 62xxx",
            ),
          ),
        );
        process.exit(0);
      }
    } else {
      phoneNumber = await question(
        chalk.bgBlack(chalk.greenBright("Please type your WhatsApp number : ")),
      );
      phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

      if (
        !Object.keys(baileys.PHONENUMBER_MCC).some((v) =>
          phoneNumber.startsWith(v),
        )
      ) {
        console.log(
          chalk.bgBlack(
            chalk.redBright(
              "Start with your country's WhatsApp code, Example : 62xxx",
            ),
          ),
        );

        phoneNumber = await question(
          chalk.bgBlack(
            chalk.greenBright("Please type your WhatsApp number : "),
          ),
        );
        phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
        rl.close();
      }
    }

    setTimeout(async () => {
      let code = await conn.requestPairingCode(phoneNumber);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      console.log(
        chalk.black(chalk.bgGreen("Your Pairing Code : ")),
        chalk.black(chalk.white(code)),
      );
    }, 3000);
  }

  conn.ev.on("connection.update", async (update) => {
    const { lastDisconnect, connection, qr } = update;

    if (connection) conn.logger.info(`Connection Status : ${connection}`);
    if (connection === "close") {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;

      if (reason === baileys.DisconnectReason.badSession) {
        console.log("File Sesi Rusak, Harap Hapus Sesi dan Pindai Lagi");
        process.send("reset");
      } else if (reason === baileys.DisconnectReason.connectionClosed) {
        console.log("Koneksi ditutup, menyambung kembali....");
        await start();
      } else if (reason === baileys.DisconnectReason.connectionLost) {
        console.log("Koneksi Hilang dari Server, menyambung kembali...");
        await start();
      } else if (reason === baileys.DisconnectReason.connectionReplaced) {
        console.log(
          "Koneksi Diganti, Sesi Baru Dibuka, Harap Tutup Sesi Saat Ini Terlebih Dahulu",
        );
        process.exit(1);
      } else if (reason === baileys.DisconnectReason.loggedOut) {
        console.log("Perangkat Keluar, Silakan Pindai Lagi");
        process.exit(1);
      } else if (reason === baileys.DisconnectReason.restartRequired) {
        console.log("Diperlukan Mulai Ulang, Mulai Ulang...");
        await start();
      } else if (reason === baileys.DisconnectReason.timedOut) {
        console.log("Waktu Sambungan Habis, Mulai Ulang...");
        process.send("reset");
      } else if (reason === baileys.DisconnectReason.multideviceMismatch) {
        console.log("Ketidakcocokan multi perangkat, harap pindai lagi");
        process.exit(0);
      } else {
        console.log(reason);
        process.send("reset");
      }
    }

    /*if (connection === "open") {
            console.clear()
            func.loading()
            await baileys.delay(5500)
        }*/
  });

  conn.ev.on("creds.update", saveCreds);
  conn.ev.on("messages.upsert", async (message) => {
    if (!message.messages) return;
    
    const m = await Serialize(conn, message.messages[0]);
    await (
      await import(`./handler.js?v=${Date.now()}`)
    ).handler(conn, m, message);
  });
  
  conn.ev.on("group-participants.update", async (message) => {
    await (
      await import(`./handler.js?v=${Date.now()}`)
    ).participantsUpdate(message);
  });

  conn.ev.on("groups.update", async (update) => {
    await (await import(`./handler.js?v=${Date.now()}`)).groupsUpdate(update);
  });

  conn.ev.on("call", async (json) => {
    await (await import(`./handler.js?v=${Date.now()}`)).rejectCall(json);
  });
  
  conn.ev.on("presence.update", async (presenceUpdateEvent) => {
    try {
      await (await import(`./handler.js?v=${Date.now()}`)).presenceUpdate(presenceUpdateEvent);
    } catch (error) {
      console.error('Error handling presence update:', error);
    }
  });

  setInterval(async () => {
    if (global.db.data) await global.db.write().catch(console.error);
  }, 60 * 1000);

  return conn;
}

global.plugins = {};

async function filesInit() {
  const cmdFiles = path.join(process.cwd(), "command/**/*.js");
  const commandsFiles = (await import("glob")).default.sync(cmdFiles);

  for (let file of commandsFiles) {
    try {
      const module = await import(`file://${file}`);
      global.plugins[file] = module.default || module;
    } catch (e) {
      console.log(
        chalk.bold.bgRgb(247, 38, 33)("ERROR: "),
        chalk.rgb(255, 38, 0)(util.format(e)),
      );
      delete global.plugins[file];
    }
  }
}

function watchFiles() {
  const commandDir = path.join(process.cwd(), "command");
  const subDirs = getSubdirectories(commandDir);

  subDirs.forEach(dir => {
    fs.watch(dir, { recursive: false }, (eventType, filename) => {
      if (filename) {
        const filePath = path.join(dir, filename);

        if (eventType === 'rename') {
          if (fs.existsSync(filePath)) {
            console.log(
              chalk.bold.bgRgb(51, 204, 51)("INFO: "),
              chalk.cyan(`File added - "${filePath}"`)
            );
            reloadPlugin("add", filePath);
          } else {
            console.log(
              chalk.bold.bgRgb(255, 153, 0)("WARNING: "),
              chalk.redBright(`File deleted - "${filePath}"`)
            );
            reloadPlugin("delete", filePath);
          }
        } else if (eventType === 'change') {
          console.log(
            chalk.bold.bgRgb(51, 204, 51)("INFO: "),
            chalk.cyan(`File changed - "${filePath}"`)
          );
          reloadPlugin("change", filePath);
        }
      }
    });
  });
}

function getSubdirectories(dir) {
  const subdirs = [dir];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      subdirs.push(...getSubdirectories(filePath));
    }
  }

  return subdirs;
}

function reloadPlugin(type, file) {
  const filename = (file) => file.replace(/^.*[\\\/]/, "");

  switch (type) {
    case "delete":
      delete global.plugins[file];
      break;
    case "add":
    case "change":
      (async () => {
        try {
          const module = await import(`file://${file}?update=${Date.now()}`);
          global.plugins[file] = module.default || module;
        } catch (e) {
          console.log(
            chalk.bold.bgRgb(247, 38, 33)("ERROR: "),
            chalk.rgb(255, 38, 0)(util.format(e)),
          );
        } finally {
          global.plugins = Object.fromEntries(
            Object.entries(global.plugins).sort(([a], [b]) =>
              a.localeCompare(b),
            ),
          );
        }
      })();
      break;
  }
}

start();
filesInit();
watchFiles();
