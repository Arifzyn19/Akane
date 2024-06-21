export default {
	command: ["sf", "savefile"],
	example: "%p%cmd menu.js", //%p = prefix, %cmd = command, %text = teks
	name: "sf",
	tags: "owner",
	
	owner: true,
	quoted: true,
	
	run: async (m, { conn }) => {
		let path = `${text}`;
		await func.fs.writeFileSync(path, m.quoted.text);
		m.reply(`tersimpan di ${path}`);
	}
}