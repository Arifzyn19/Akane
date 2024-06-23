export default {
  command: ["afk"],
  description: "Set your status to AFK",
  name: "afk",
  tags: "utility",

  run: async (m, { conn, text, args }) => {
    let name = m.pushName || conn.getName(m.sender);
    let user = global.db.data.users[m.sender];

    user.afk = +new Date();
    user.afkReason = text || "No Reason";

    m.reply(
      `${name} sedang AFK dengan alasan: ${text ? text : "tidak ada alasan"}`,
    );
  },
};
