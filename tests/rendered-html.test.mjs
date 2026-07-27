import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const outputRoot = new URL("../out/", import.meta.url);
const basePath = "/design-systems-lab";

test("exports the complete laboratory as static HTML", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");
  assert.match(html, /<title>Laboratorio de Sistemas de DiseÃ±o<\/title>/i);
  assert.match(html, /Design System/);
  assert.match(html, /Nova Design System/);
  assert.match(html, /Preview en vivo/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
  await access(new URL(".nojekyll", outputRoot));
});

test("prefixes every root asset for the GitHub Pages repository path", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");
  const assetUrls = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith("/"));

  assert.ok(assetUrls.length > 0);
  for (const url of assetUrls) {
    assert.ok(url.startsWith(`${basePath}/`), `${url} omits the repository base path`);
    const localPath = url.slice(basePath.length + 1).split("?")[0];
    await access(new URL(localPath, outputRoot));
  }
});

test("keeps product capabilities in one central project model", async () => {
  const page = await readFile(new URL("app/page.tsx", projectRoot), "utf8");
  assert.match(page, /type DesignSystemProject/);
  assert.match(page, /localStorage\.setItem/);
  assert.match(page, /importProject/);
  assert.match(page, /exportProject/);
  assert.match(page, /contrastRatio/);
  assert.match(page, /toTokenExport/);
  assert.match(page, /toCss/);
  assert.match(page, /setDevice\("mobile"\)/);
  assert.match(page, /semanticTokens/);
});
