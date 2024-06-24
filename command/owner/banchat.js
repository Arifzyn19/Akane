export default {
  command: ["banchat", "bnc"],
  name: "banchat",
  tags: "owner",

  owner: true,

  run: async (m) => {
    try {
      let chat = db.data.chats[m.chat];
      chat.isBanned = true;

      m.reply("Chat has been banned.");
    } catch (error) {
      console.error(error);
      m.reply("An error occurred while trying to ban the chat.");
    }
  },
};
