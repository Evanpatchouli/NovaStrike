import fs from "node:fs";
import path from "node:path";

function printUsage() {
  console.log("Usage: pnpm version:app <x.y.z>");
}

const nextVersion = process.argv[2];
if (!nextVersion) {
  printUsage();
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(nextVersion)) {
  console.error(`Invalid version: ${nextVersion}`);
  printUsage();
  process.exit(1);
}

const rootDir = process.cwd();
const targets = [path.join(rootDir, "package.json"), path.join(rootDir, "apps", "desktop", "package.json")];

for (const file of targets) {
  const text = fs.readFileSync(file, "utf8");
  const json = JSON.parse(text);
  json.version = nextVersion;
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`Updated ${path.relative(rootDir, file)} -> ${nextVersion}`);
}

