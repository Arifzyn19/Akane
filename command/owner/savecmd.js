import fs from "fs";
import path from "path";

export default {
  command: ["savecmd", "savecommand"],
  example: "Contoh: .savecmd main/menu",
  name: "savecmd",
  tags: "owner",
  description: "Simpan atau edit isi dari file command",
  owner: true,
  quoted: false, // tidak perlu di-quote selalu, bisa dari file juga

  run: async (m, { conn }) => {
    const filePath = m.text.trim();
    const fullPath = path.join(process.cwd(), "command", filePath + ".js");

    // Fungsi untuk menyimpan konten baru ke file
    const saveContent = async (content) => {
      try {
        fs.writeFileSync(fullPath, content, "utf8");
        await m.reply(`File ${filePath}.js berhasil disimpan.`);
      } catch (error) {
        console.error(`Error saving command file: ${error}`);
        await m.reply(
          `Terjadi kesalahan saat menyimpan file command: ${error.message}`,
        );
      }
    };

    if (m.quoted) {
      const quotedContent = m.quoted.body?.trim() || "";
      if (quotedContent) {
        await saveContent(quotedContent);
        return;
      }

      // Jika quoted adalah file, unduh filenya
      const quotedFile = await m.quoted.download();
      if (quotedFile) {
        await saveContent(quotedFile.toString("utf8"));
        return;
      }
    } else if (m.mimetype) {
      // Jika bukan quoted tetapi ada file yang dilampirkan
      const attachedFile = await m.download();
      if (attachedFile) {
        await saveContent(attachedFile.toString("utf8"));
        return;
      }
    }

    await m.reply(
      "Isi baru dari file command tidak ditemukan atau format file tidak didukung.",
    );
  },
};
