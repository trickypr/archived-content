const { readFileSync, writeFileSync } = require("fs");
const { readdir, stat } = require("fs").promises;
const path = require("path");
const { isAbsolute, join } = path;

async function walkDirectory(dirName) {
  const output = [];

  if (!isAbsolute(dirName)) {
    log.askForReport();
    log.error("Please provide an absolute input to walkDirectory");
  }

  try {
    const directoryContents = await readdir(dirName);

    for (const file of directoryContents) {
      const fullPath = join(dirName, file);
      const fStat = await stat(fullPath);

      if (fStat.isDirectory()) {
        for (const newFile of await walkDirectory(fullPath)) {
          output.push(newFile);
        }
      } else {
        output.push(fullPath);
      }
    }
  } catch (e) {
    console.error(e);
  }

  return output;
}

(async () => {
  /** @type {string[]} */
  const files = await walkDirectory(path.join(process.cwd(), "files"));

  files
    .map((file) => ({ path: file, content: readFileSync(file, "utf8") }))
    .map((file) => ({
      ...file,
      content: file.content
        .replace(/{{/g, "<!-- {{")
        .replace(/}}/g, "}} -->")
        .replace(/<!-- <!-- {{/g, "<!-- {{")
        .replace(/}} --> -->/g, "}} -->")
        .replace(/{%/g, "<!-- {-%")
        .replace(/%}/g, "%-} -->"),
    }))
    .map((file) => ({
      ...file,
      content: file.content
        .split("\n")
        .map((line) => (line.includes("{{ Svg") ? "" : line))
        .join("\n"),
    }))
    .forEach(({ path, content }) => writeFileSync(path, content));
})();
