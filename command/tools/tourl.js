export default {
	command: ["tourl"],
	description: "Convert media to url",
	name: "tourl",
	tags: "tools",
	
	run: async (m) => {
		const quoted = m.isQuoted ? m.quoted : m 
		if (!quoted.isMedia) return m.reply("Reply media messages");
        if (Number(quoted.msg?.fileLength) > 350000000) throw "Kegeden mas";
        let media = await quoted.download();
        let url =
          /image|video/i.test(quoted.msg.mimetype) &&
          !/webp/i.test(quoted.msg.mimetype)
            ? await func.upload.telegra(media)
            : await func.upload.pomf(media);
        await m.reply(`> ${url}`) 
	}
}