import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "campaign");
const out = resolve(root, "dist");
const client = resolve(out, "client");

await rm(out, { recursive: true, force: true });
await mkdir(resolve(client, "assets"), { recursive: true });
await mkdir(resolve(out, "assets"), { recursive: true });
await mkdir(resolve(out, "server"), { recursive: true });

for (const name of ["index.html", "404.html"]) {
  await cp(resolve(source, name), resolve(client, name));
  await cp(resolve(source, name), resolve(out, name));
}

for (const name of ["styles.css", "site.js", "og-priority.png", "og-work-value.png", "og-petition.png"]) {
  await cp(resolve(source, name), resolve(client, "assets", name));
  await cp(resolve(source, name), resolve(out, "assets", name));
}

await writeFile(resolve(out, "server", "index.js"), `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
`);

console.log("Built the standalone くらしの最低線 site into dist/");
