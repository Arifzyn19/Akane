export function before(m, { conn }) {
  let user = global.db.data.users[m.sender];

  // Mengakhiri status AFK saat mengirim pesan
  if (user.afk > -1) {
    m.reply(`
Anda telah berhenti AFK${user.afkReason ? " setelah " + user.afkReason : ""}
Selama ${((new Date() - user.afk) / 1000 / 60).toFixed(1)} menit
        `);
    user.afk = -1;
    user.afkReason = "";
  }

  // Memeriksa apakah pengguna yang ditandai sedang AFK
  let jids = [
    ...new Set([
      ...(m.mentionedJid || []),
      ...(m.quoted ? [m.quoted.sender] : []),
    ]),
  ];
  for (let jid of jids) {
    let mentionedUser = global.db.data.users[jid];
    if (!mentionedUser) continue;
    let afkTime = mentionedUser.afk;
    if (!afkTime || afkTime < 0) continue;
    let reason = mentionedUser.afkReason || "";
    m.reply(`
Jangan tag dia!
Dia sedang AFK ${reason ? "dengan alasan " + reason : "tanpa alasan"}
Selama ${((new Date() - afkTime) / 1000 / 60).toFixed(1)} menit
        `);
  }
  return true;
}
