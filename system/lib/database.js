import { Low, JSONFile } from "lowdb";
import path from "path";

export default class Database {
  constructor(filename) {
    this.fileName = path.join(
      process.cwd(),
      "storage",
      filename || "database.json",
    );
    this.db = new Low(new JSONFile(this.fileName));
    this.READ = false;
    this.data = null;
  }

  async loadDatabase() {
    if (this.READ) {
      return new Promise((resolve) => {
        const intervalId = setInterval(async () => {
          if (!this.READ) {
            clearInterval(intervalId);
            resolve(this.data === null ? this.loadDatabase() : this.data);
          }
        }, 1000);
      });
    }

    if (this.data !== null) return;

    this.READ = true;
    await this.db.read().catch(console.error);
    this.READ = false;
    this.data = {
      users: {},
      chats: {},
      stats: {},
      msgs: {},
      sticker: {},
      settings: {},
      ...(this.db.data || {}),
    };

    // Set default data if undefined
    this.db.data = this.data;
  }

  async writeDatabase() {
    this.db.data = this.data;
    await this.db.write().catch(console.error);
  }

  load(m, db) {
    const isNumber = (x) => typeof x === "number" && !isNaN(x);
    const isBoolean = (x) => typeof x === "boolean" && Boolean(x);
    let user = db.data.users[m.sender],
      chat = db.data.chats[m.chat],
      sett = db.data.settings;

    if (typeof user !== "object") db.data.users[m.sender] = {};
    if (user) {
      if (!("lastChat" in user)) user.lastChat = new Date() * 1;
      if (!isBoolean(user.banned)) user.banned = false;
      if (!("bannedReason" in user)) user.bannedReason = "";
      if (!isNumber(user.afk)) user.afk = -1;
      if (!("afkReason" in user)) user.afkReason = "";
      if (!isBoolean(user.registered)) user.registered = false;
      if (!isNumber(user.warn)) user.warn = 0;
      
      if (!user.registered) {
        if (!isNumber(user.age)) user.age = 0;
        if (!("name" in user)) user.name = m.pushName;
        if (!isNumber(user.regTime)) user.regTime = -1;
      }

      if (!isNumber(user.limit)) user.limit = 50;
      if (!isNumber(user.glimit)) user.glimit = 30;
      if (!isNumber(user.balance)) user.balance = 0;
      if (!isNumber(user.exp)) user.exp = 0;
      if (!isNumber(user.level)) user.level = 1;
      if (!isNumber(user.hit)) user.hit = 1;
      
      if (!isNumber(user.lastclaim)) user.lastclaim = 0;
      if (!isBoolean(user.autolevelup)) user.autolevelup = false;
      if (!user.grade) user.grade = "Newbie";

      if (!isBoolean(user.premium)) user.premium = false;
      if (!isNumber(user.premiumTime)) user.premiumTime = 0;
    } else {
      db.data.users[m.sender] = {
        lastChat: new Date() * 1,
        name: m.pushName,
        banned: false,
        bannedReason: "",
        afk: -1,
        afkReason: "",
        age: 0,
        registered: false,
        regTime: -1,
        warn: 0,

        limit: 50,
        glimit: 30,
        balance: 0,
        exp: 100,
        level: 1,
        hit: 0,

        lastclaim: 0,
        grade: "Newbie",
        autolevelup: false,

        premium: false,
        premiumTime: 0,
      };
    }
    let openai = db.data.users[m.sender].openai;
    if (typeof openai !== "object") db.data.users[m.sender].openai = {};
    if (openai) {
      if (!("messages" in openai)) openai.messages = [];
      if (!("model" in openai)) openai.model = "";
      if (!isBoolean(openai.chat)) openai.chat = false;
    } else {
      db.data.users[m.sender].openai = {
        messages: [],
        chat: false,
        model: "",
      };
    }
    let life = db.data.users[m.sender].life;
    if (typeof life !== "object") db.data.users[m.sender].life = {};
    if (life) {
      if (!("name" in life)) life.name = "";
      if (!("gender" in life)) life.gender = "";
      if (!("age" in life)) life.age = "";
      if (!isBoolean(life.verified)) life.verified = false;

      if (!("waifu" in life)) life.waifu = "";
      if (!isNumber(life.exp)) life.exp = 0;
      if (!isNumber(life.lastkencan)) life.lastkencan = 0;
      if (!isNumber(life.money)) life.money = 0;
      if (!isNumber(life.gamepas)) life.gamepas = 0;

      if (!isNumber(life.id)) life.id = 0;
      if (!("about" in life)) life.about = "";
    } else {
      db.data.users[m.sender].life = {
        name: "",
        gender: "",
        age: "",
        verified: false,

        waifu: "",
        exp: 0,
        lastkencan: 0,
        money: 0,
        gamepas: 0,

        id: "",
        about: "",
      };
    }

    if (m.isGroup) {
      if (typeof chat !== "object") db.data.chats[m.chat] = {};
      if (chat) {
        if (!isBoolean(chat.antibot)) chat.antibot = false;
        if (!isBoolean(chat.antidelete)) chat.antidelete = true;
        if (!isBoolean(chat.antilink)) chat.antilink = false;
        if (!isBoolean(chat.antispam)) chat.antispam = false;
        if (!isBoolean(chat.antitoxic)) chat.antitoxic = false;
        if (!isBoolean(chat.detect)) chat.detect = true;
        if (!isNumber(chat.expired)) chat.expired = 0;
        if (!isBoolean(chat.isBanned)) chat.isBanned = false;
        if (!isBoolean(chat.nsfw)) chat.nsfw = false;
        if (!isBoolean(chat.simi)) chat.simi = false;
        if (!isBoolean(chat.viewOnce)) chat.viewonce = false;
        if (!isBoolean(chat.welcome)) chat.welcome = true;
      } else {
        db.data.chats[m.chat] = {
          antibot: false,
          antidelete: true,
          antilink: false,
          antispam: false,
          antitoxic: false,
          detect: true,
          expired: 0,
          isBanned: false,
          nsfw: false,
          simi: false,
          viewonce: false,
          welcome: true,
        };
      }
    }

    if (typeof sett !== "object") db.data.settings = {};
    if (sett) {
      if (!isBoolean(sett.anticall)) sett.anticall = true;
      if (!isBoolean(sett.autoread)) sett.autoread = false;
      if (!isBoolean(sett.gconly)) sett.gconly = false;
      if (!isBoolean(sett.pconly)) sett.pconly = false;
      if (!isBoolean(sett.queque)) sett.queque = false;
      if (!isBoolean(sett.self)) sett.self = false;
    } else {
      db.data.settings = {
        anticall: true,
        autoread: false,
        gconly: false,
        pconly: false,
        queque: false,
        self: false,
      };
    }
  }
}
