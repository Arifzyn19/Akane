import "../storage/config.js";
import { Client, Serialize } from "./lib/serialize.js";
import Database from "./lib/database.js";

import fs from "fs";
import util from "util";
import path from "path";
import pino from "pino";
import chalk from "chalk";
import readline from "readline";
import chokidar from "chokidar";
import syntaxerror from "syntax-error";
import { Boom } from "@hapi/boom";
import NodeCache from "node-cache";
import baileys, { jidNormalizedUser } from "@whiskeysockets/baileys";
import {
  plugins,
  loadPluginFiles,
  reload,
  pluginFolder,
  pluginFilter,
} from "./lib/plugins.js";

const logger = pino({
  level: "fatal",
  timestamp: () => `,"time":"${new Date().toJSON()}"`,
}).child({ level: "fatal", class: "conn" });

const store = baileys.makeInMemoryStore({ logger });
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
    logger,
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

  await Client({ conn, store });
  global.conn = conn;

  loadPluginFiles(pluginFolder, pluginFilter, {
    logger: conn.logger,
    recursiveRead: true,
  })
    .then((_) => console.log(Object.keys(plugins)))
    .catch(console.error);

  if (!conn.authState.creds.registered) {
    let phoneNumber;

    if (!!global.pairingNumber) {
      phoneNumber = global.pairingNumber.replace(/[^0-9]/g, "");
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

    if (connection === "open") {
      conn.logger.info("Connecting Success...");
    }
  });

  conn.ev.on("creds.update", saveCreds);

  // add contacts update to store
  conn.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id;
      try {
        id = jidNormalizedUser(contact.id);
        if (!id) {
          console.error(
            `jidNormalizedUser failed or returned undefined for contact id: ${contact.id}`,
          );
          continue;
        }
      } catch (error) {
        console.error(
          `Error normalizing JID for contact id: ${contact.id}`,
          error,
        );
        continue;
      }

      if (store && store.contacts) {
        if (!store.contacts[id]) {
          console.warn(
            `No existing contact found for id: ${id}. Creating new contact entry.`,
          );
        }

        store.contacts[id] = {
          ...(store.contacts?.[id] || {}),
          ...(contact || {}),
        };
      }
    }
  });

  // add contacts upsert to store
  conn.ev.on("contacts.upsert", (update) => {
    for (let contact of update) {
      let id = jidNormalizedUser(contact.id);
      if (store && store.contacts)
        store.contacts[id] = { ...(contact || {}), isContact: true };
    }
  });

  // nambah perubahan grup ke store
  conn.ev.on("groups.update", (updates) => {
    for (const update of updates) {
      const id = update.id;
      if (store.groupMetadata[id]) {
        store.groupMetadata[id] = {
          ...(store.groupMetadata[id] || {}),
          ...(update || {}),
        };
      }
    }
  });

  conn.ev.on("messages.upsert", async (message) => {
    if (!message.messages) return;

    const m = await Serialize(conn, message.messages[0]);

    if (store.groupMetadata && Object.keys(store.groupMetadata).length === 0)
      store.groupMetadata = await client.groupFetchAllParticipating();

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
      await (
        await import(`./handler.js?v=${Date.now()}`)
      ).presenceUpdate(presenceUpdateEvent);
    } catch (error) {
      console.error("Error handling presence update:", error);
    }
  });

  setInterval(async () => {
    if (global.db.data) await global.db.write().catch(console.error);
  }, 60 * 1000);

  return conn;
}

start();
