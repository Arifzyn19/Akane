import fs from "fs";
import path from "path";

export default {
  command: ["getcmd", "getcommand"],
  example: "Contoh: %p%cmd main/menu",
  name: "getcmd",
  tags: "owner",
  description: "Mengambil isi dari sebuah cmd",

  owner: true,

  run: async (m, { conn }) => {
    let filePath = m.text.trim();

    try {
      let fullPath = path.join(process.cwd(), "command", filePath + ".js");

      if (fs.existsSync(fullPath)) {
        fs.readFile(fullPath, "utf8", (err, data) => {
          if (err) {
            console.error(`Error reading file: ${err}`);
            m.reply(`Terjadi kesalahan saat membaca file: ${err.message}`);
          } else {
            conn.sendMessage(m.chat, { text: data }, { quoted: m });
          }
        });
      } else {
        await m.reply(`File ${filePath} tidak ditemukan.`);
      }
    } catch (error) {
      console.error(`Error accessing file: ${error}`);
      m.reply(`Terjadi kesalahan saat mengakses file: ${error.message}`);
    }
  },
};