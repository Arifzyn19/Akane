import fs, { existsSync, watch } from "fs";
import { join, resolve } from "path";
import * as os from "os";
import syntaxerror from "syntax-error";
import Helper from "./helper.js";

const __dirname = Helper.__dirname(import.meta);
const rootDirectory = Helper.__dirname(join(__dirname, "../"));
const pluginFolder = Helper.__dirname(join(__dirname, "../../command"));
const pluginFilter = (filename) => /\.js$/.test(filename);

async function importFile(module) {
  module = Helper.__filename(module);
  const module_ = await import(`${module}?id=${Date.now()}`);
  const result = module_ && "default" in module_ ? module_.default : module_;
  return result;
}

let watcher = {};
let plugins = {};
let pluginFolders = [];

/**
 * Load files from plugin folder as plugins
 */
async function loadPluginFiles(
  pluginFolder = pluginFolder,
  pluginFilter = pluginFilter,
  opts = { recursiveRead: false },
) {
  const folder = resolve(pluginFolder);
  if (folder in watcher) return;
  pluginFolders.push(folder);

  const paths = await fs.promises.readdir(pluginFolder);
  await Promise.all(
    paths.map(async (path) => {
      const resolved = join(folder, path);
      const dirname = Helper.__filename(resolved, true);
      const formattedFilename = formatFilename(resolved);
      try {
        const stats = await fs.promises.lstat(dirname);
        if (!stats.isFile()) {
          if (opts.recursiveRead)
            await loadPluginFiles(dirname, pluginFilter, opts);
          return;
        }

        const filename = Helper.__filename(resolved);
        const isValidFile = pluginFilter(filename);
        if (!isValidFile) return;
        const module = await importFile(filename);
        if (module) plugins[formattedFilename] = module;
      } catch (e) {
        opts.logger?.error(e, `error while requiring ${formattedFilename}`);
        delete plugins[formattedFilename];
      }
    }),
  );

  const watching = watch(
    folder,
    reload.bind(null, {
      logger: opts.logger,
      pluginFolder,
      pluginFilter,
    }),
  );
  watching.on("close", () => deletePluginFolder(folder, true));
  watcher[folder] = watching;

  return (plugins = sortedPlugins(plugins));
}

/**
 * Delete and stop watching the folder
 */
function deletePluginFolder(folder, isAlreadyClosed = false) {
  const resolved = resolve(folder);
  if (!(resolved in watcher)) return;
  if (!isAlreadyClosed) watcher[resolved].close();
  delete watcher[resolved];
  pluginFolders.splice(pluginFolders.indexOf(resolved), 1);
}

/**
 * Reload file to load latest changes
 */
async function reload(
  { logger, pluginFolder = pluginFolder, pluginFilter = pluginFilter },
  _ev,
  filename,
) {
  if (pluginFilter(filename)) {
    const file = Helper.__filename(join(pluginFolder, filename), true);
    const formattedFilename = formatFilename(file);
    if (formattedFilename in plugins) {
      if (existsSync(file))
        logger?.info(`updated plugin - '${formattedFilename}'`);
      else {
        logger?.warn(`deleted plugin - '${formattedFilename}'`);
        return delete plugins[formattedFilename];
      }
    } else logger?.info(`new plugin - '${formattedFilename}'`);
    const src = await fs.promises.readFile(file);
    let err = syntaxerror(src, filename, {
      sourceType: "module",
      allowAwaitOutsideFunction: true,
    });
    if (err)
      logger?.error(err, `syntax error while loading '${formattedFilename}'`);
    else
      try {
        const module = await importFile(file);
        if (module) plugins[formattedFilename] = module;
      } catch (e) {
        logger?.error(e, `error require plugin '${formattedFilename}'`);
        delete plugins[formattedFilename];
      } finally {
        plugins = sortedPlugins(plugins);
      }
  }
}

/**
 * Format filename to a relative path
 */
function formatFilename(filename) {
  let dir = join(rootDirectory, "./");
  if (os.platform() === "win32") dir = dir.replace(/\\/g, "\\\\");
  const regex = new RegExp(`^${dir}`);
  const formatted = filename.replace(regex, "");
  return formatted;
}

/**
 * Sort plugins by their keys
 */
function sortedPlugins(plugins) {
  return Object.fromEntries(
    Object.entries(plugins).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export {
  pluginFolder,
  pluginFilter,
  plugins,
  watcher,
  pluginFolders,
  loadPluginFiles,
  deletePluginFolder,
  reload,
};
