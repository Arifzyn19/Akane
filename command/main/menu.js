export default {
  command: ["alyzz", "ahyzz"],
  description: "Menampilkan list menu",
  name: "menu",
  tags: "main",

  run: async (m, { conn }) => {
    let htki = "───『",
      htka = "』───";
    let header = "Hai owner ada yang bisa dibantu?\n";
    let body =
      "This bot is designed to help WhatsApp users with various features, starting from downloading videos or music, creating stickers, and many other functions.\n\n┌  ◦  *Creator* : alyzz\n│  ◦  *Instagram* : alyzz_ceo\n╰───────···\n\nPlease click on the list below to see the menu for client bot.";
    let btn = [
      {
        title: htki + " MAIN " + htka,
        rows: [
          {
            title: "⚡ SPEED BOT",
            id: ".ping",
            description: "Menampilkan kecepatan respon BOT",
          },
          {
            title: "💌 OWNER BOT",
            id: ".owner",
            description: "Menampilkan List owner BOT",
          },
          {
            title: "📔 SCRIPT BOT",
            id: ".sc",
            description: "Source Code",
          },
        ],
      },
      {
        title: htki + " SUPPORT " + htka,
        rows: [
          {
            title: "🔖 SEWA",
            id: ".sewa",
            description: "Menampilkan list harga sewa BOT",
          },
          {
            title: "🌟 LIST PREMIUM",
            id: ".premlist",
            description: "Menampilkan list harga premium",
          },
          {
            title: "💹 DONASI",
            id: ".donasi",
            description: "Support BOT agar lebih fast respon",
          },
        ],
      },
      {
        title: htki + " MENU " + htka,
        rows: [
          {
            title: "🧧 All Menu",
            id: ".menulist all",
            description: "Menampilkan semua menu",
          },
          {
            title: "🤵‍ Admin Menu",
            id: ".menulist admin",
            description: "Menampilkan menu admin",
          },
          {
            title: "🎭 Anonymous Menu",
            id: ".menulist anonymous",
            description: "Menampilkan menu anonymous",
          },
          {
            title: "🎙️ Audio Menu",
            id: ".menulist audio",
            description: "Menampilkan menu audio",
          },
          {
            title: "💾 Database Menu",
            id: ".menulist database",
            description: "Menampilkan menu database",
          },
          {
            title: "📥 Downloader Menu",
            id: ".menulist downloader",
            description: "Menampilkan menu download",
          },
          {
            title: "📔 Edukasi Menu",
            id: ".menulist edukasi",
            description: "Menampilkan menu edukasi",
          },
          {
            title: "🪄 Fun Menu",
            id: ".menulist fun",
            description: "Menampilkan menu fun",
          },
          {
            title: "🎮 Game Menu",
            id: ".menulist game",
            description: "Menampilkan menu game",
          },
          {
            title: "👨‍👩‍👦‍👦 Group Menu",
            id: ".menulist group",
            description: "Menampilkan menu group",
          },
          {
            title: "ℹ️ Info Menu",
            id: ".menulist info",
            description: "Menampilkan menu info",
          },
          {
            title: "📡 Internet Menu",
            id: ".menulist internet",
            description: "Menampilkan menu internet",
          },
          {
            title: "🗝️ Jadibot Menu",
            id: ".menulist jadibot",
            description: "Menampilkan menu jadibot",
          },
          {
            title: "🐚 Kerang Menu",
            id: ".menulist kerang",
            description: "Menampilkan menu kerang",
          },
          {
            title: "📮 Main Menu",
            id: ".menulist main",
            description: "Menampilkan menu main",
          },
          {
            title: "🎨 Maker Menu",
            id: ".menulist maker",
            description: "Menampilkan menu maker",
          },
          {
            title: "🎶 Music Menu",
            id: ".menulist music",
            description: "Menampilkan menu music",
          },
          {
            title: "🔞 Nsfw Menu",
            id: ".menulist nsfw",
            description: "Menampilkan menu nsfw",
          },
          {
            title: "✏️ Nulis Menu",
            id: ".menulist nulis",
            description: "Menampilkan menu nulis",
          },
          {
            title: "🧑🏻‍💻 Owner Menu",
            id: ".menulist owner",
            description: "Menampilkan menu owner",
          },
          {
            title: "💎 Premium Menu",
            id: ".menulist premium",
            description: "Menampilkan menu premium",
          },
          {
            title: "📜 Primbon Menu",
            id: ".menulist primbon",
            description: "Menampilkan menu primbon",
          },
          {
            title: "💬 Quotes Menu",
            id: ".menulist quotes",
            description: "Menampilkan menu quotes",
          },
          {
            title: "🕋 Quran Menu",
            id: ".menulist quran",
            description: "Menampilkan menu Al Qur'an",
          },
          {
            title: "🪄 AI Menu",
            id: ".menulist ai",
            description: "Menampilkan menu Ai",
          },
          {
            title: "🕹️ RPG Menu",
            id: ".menulist rpg",
            description: "Menampilkan menu RPG",
          },
          {
            title: "🏮 Sticker Menu",
            id: ".menulist sticker",
            description: "Menampilkan menu stiker",
          },
          {
            title: "🛠️ Tools Menu",
            id: ".menulist tools",
            description: "Menampilkan menu peralatan",
          },
        ],
      },
    ];

    conn.sendListWithImage(
      m.chat,
      body,
      global.wm,
      header,
      btn,
      global.thumbnail,
      m,
    );
  },
};
