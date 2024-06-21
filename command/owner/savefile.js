export default {
  command: ["sf", "savefile"],
  example: "%p%cmd menu.js",
  name: "sf",
  tags: "owner",

  owner: true,
  quoted: true,

  run: async (m, { conn }) => {
    let path = `${m.text}`;
    await func.fs.writeFileSync(path, m.quoted.body);
    m.reply(`tersimpan di ${path}`);
  },
};
