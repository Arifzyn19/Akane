export default {
  command: ["instagram", "ig"],
  description: "Download Instagram reel/video/image",
  example: "Contoh: %p%cmd <Instagram URL>", //%p = prefix, %cmd = command, %text = teks
  name: "instagram",
  tags: "download",

  run: async (m, { conn }) => {
    const url = m.args[0];

    if (!func.isUrl(url))
      return m.reply(
        `Invalid URL\n\nContoh: ${m.prefix + m.command} https://www.instagram.com/reel/C65wgBxraJ5/`,
      );

    let response;
    const apiUrl = API("itzpire", "/download/instagram", { url: url });

    try {
      response = await func.fetchJson(apiUrl);
    } catch (err) {
      console.error(`Error fetching Instagram reel:`, err);
      return m.reply("An error occurred while fetching the Instagram reel.");
    }

    if (!response || response.status !== "success" || !response.data) {
      return m.reply("Failed to fetch Instagram reel/video/image.");
    }

    const { author, data } = response;
    const videoUrl = data.url;

    if (!videoUrl) {
      return m.reply("Video URL not found.");
    }

    const replyText = `
      *Author:* ${author || "Unknown"}
      *Type:* ${data.type || "Unknown"}
    `;

    try {
      await m.reply(videoUrl, { caption: replyText });
    } catch (err) {
      conn.logger.error(err);
      m.reply("error");
    }
  },
};
