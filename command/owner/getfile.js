import fs from 'fs';

export default {
  command: ["getfile", "gf"],
  example: "Contoh: %p%cmd menu.js",
  name: "getfile",
  tags: "owner",

  owner: true,
  
  run: async (m, { conn }) => {
    let path = `${m.text}`; 
    
    try {
      if (fs.existsSync(path)) {
        let text = fs.readFileSync(path, "utf8");
        await m.reply(text)
      } else {
        await m.reply(`File ${path} tidak ditemukan.`);
      }
    } catch (error) {
      console.error(`Error reading file: ${error}`);
      m.reply(`Terjadi kesalahan saat membaca file: ${error.message}`);
    }
  }
};