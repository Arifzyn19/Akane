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
    const sections = [
      {
        title: "System Information ( info )",
        rows: [
          {
            title: "Creator Bot",
            id: ".owner",
            description: "Bot owner info, who created it ( information )",
          },
          {
            title: "Info System",
            id: ".info",
            description: "Viewing System Info on Bots ( information )",
          },
          {
            title: "Script Info",
            id: ".sc",
            description: "Source Code Bot WhatsApp Info ( information )",
          },
          {
            title: "Donasi Info",
            id: ".donasi",
            description: "Donate to Support Bot ( information )",
          },
        ],
      },
    ];

    conn.sendListM(m.chat, body, wm, "", sections, m);
  },
};
