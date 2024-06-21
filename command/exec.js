import path from "path";
import util from "util";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import cp, { exec as _exec } from "child_process";
let exec = util.promisify(_exec).bind(cp);

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
  	let o
    try {
            o = await exec(m.text);
          } catch (e) {
            o = e;
          } finally {
            let { stdout, stderr } = o;
            if (typeof stdout === "string" && stdout.trim()) m.reply(stdout);
            if (typeof stderr === "string" && stderr.trim()) m.reply(stderr);
          }
  }

  return !0;
}
