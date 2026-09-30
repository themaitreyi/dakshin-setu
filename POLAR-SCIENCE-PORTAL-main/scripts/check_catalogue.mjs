import fs from "node:fs";
import ts from "typescript";
import assert from "node:assert/strict";
const data = JSON.parse(fs.readFileSync("public/catalogue/records.json", "utf8"));
globalThis.fetch = async () => ({ ok: true, json: async () => data });
const source = fs.readFileSync("src/lib/offline-catalogue.ts", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { offlineRead } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
assert.equal((await offlineRead("/resources")).items.length, 31);
for (const item of data.items) {
  assert.equal((await offlineRead("/resources/" + item.id)).title, item.title);
  assert.ok(item.description && item.source_url);
  if (item.file_url) assert.ok(fs.statSync("public" + item.file_url).size > 1000);
}
const found = await offlineRead("/search", { body: JSON.stringify({ query: "himadari" }) });
assert.ok(found.hits.length > 0);
assert.equal(
  (await offlineRead("/search", { body: JSON.stringify({ query: "zzzzzzzzzzz" }) })).hits.length,
  0,
);
console.log("PASS: 31 detail records, original file paths, search and typo correction.");
