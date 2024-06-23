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
import syntaxerror from "syntax-error";
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

import { platform } from "process";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
global.__filename = function filename(
  pathURL = import.meta.url,
  rmPrefix = platform !== "win32",
) {
  return rmPrefix
    ? /file:\/\/\//.test(pathURL)
      ? fileURLToPath(pathURL)
      : pathURL
    : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};

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
console.log(__dirname) 

global.plugins = {};
const pluginFolder = path.join(process.cwd(), "command");
const pluginFilter = (filename) => /\.js$/.test(filename);

async function filesInit() {
	const cmdFolder = path.join(process.cwd(), 'command/**/*.js');
  const commandsFiles = (await import("glob")).default.sync(cmdFolder);

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

global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    let relativePath = path.relative(pluginFolder, filename);
    let dir = global.__filename(path.join(pluginFolder, relativePath), true);
    if (filename in global.plugins) {
      if (fs.existsSync(dir))
        conn.logger.info(`re - require plugin '${filename}'`);
      else {
        conn.logger.warn(`deleted plugin '${filename}'`);
        return delete global.plugins[filename];
      }
    } else conn.logger.info(`requiring new plugin '${filename}'`);
    let err = syntaxerror(fs.readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });
    if (err)
      conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`);
    else
      try {
        console.log(global.__filename(dir));
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`);
        global.plugins[filename] = module.default || module;
      } catch (e) {
        conn.logger.error(`error require plugin '${filename}\n${format(e)}'`);
      } finally {
        global.plugins = Object.fromEntries(
          Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
        );
      }
  }
};

Object.freeze(global.reload);

function watchDirRecursively(dir) {
  fs.watch(dir, { persistent: true }, (_eventType, filename) => {
    if (filename) {
      global.reload(null, path.join(dir, filename));
    }
  });

  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${dir}:`, err);
      return;
    }
    for (const file of files) {
      if (file.isDirectory()) {
        watchDirRecursively(path.join(dir, file.name));
      }
    }
  });
}

start();
filesInit();
watchDirRecursively(pluginFolder);