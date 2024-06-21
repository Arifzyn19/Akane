import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { createRequire } from "module";

export async function before(m) {
  if (m.isBaileys) return;
  if (!m.isOwner) return;

  if ([">", "=>"].some((a) => m.body.toLowerCase().startsWith(a))) {
    let __dirname = path.dirname(fileURLToPath(import.meta.url));
    let require = createRequire(__dirname),
      _return = "";

    try {
      _return = /await/i.test(m.text)
        ? eval("(async() => { " + m.text + " })()")
        : eval(m.text);
    } catch (e) {
      _return = e;
    }

    new Promise((resolve, reject) => {
      try {
        resolve(_return);
      } catch (err) {
        reject(err);
      }
    })
      ?.then((res) => m.reply(func.format(res)))
      ?.catch((err) => m.reply(func.format(err)));
  }

  if (["$", "exec"].some((a) => m.body.toLowerCase().startsWith(a))) {
    try {
      exec(m.text, async (err, stdout) => {
        if (err) return m.reply(func.format(err));
        if (stdout) return m.reply(func.format(stdout));
      });
    } catch (e) {
      m.reply(func.format(e));
    }
  }

  return !0;
}
