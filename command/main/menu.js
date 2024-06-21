export default {
  command: ["menu", "help"],
  description: "Menampilkan list menu",
  name: "menu",
  tags: "main",

  run: async (m, { conn }) => {
    let htki = "───『",
      htka = "』───"; 
    let header = "Hai owner ada yang bisa dibantu?\n";
    let body =
      "This bot is designed to help WhatsApp users with various features, starting from downloading videos or music, creating stickers, and many other functions.\n\n┌  ◦  *Creator* : Arifzyn\n│  ◦  *Instagram* : arifzxa19\n╰───────···\n\nPlease click on the list below to see the menu for client bot!";
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
    ];

    conn.sendListM(
      m.chat,
      body,
      wm,   
      btn,
      global.thumbnail,
      m,
    );
  },
};