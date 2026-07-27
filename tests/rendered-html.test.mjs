import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const outputRoot = new URL("../out/", import.meta.url);
const basePath = "/design-systems-lab";

test("exports the complete laboratory as static HTML", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");
  assert.match(html, /<title>Laboratorio de Sistemas de Dise.o<\/title>/i);
  assert.match(html, /Sistema inicial validado/);
  assert.match(html, /Preparación<\/span><b>100%/);
  assert.match(html, /Mobile first/);
  assert.match(html, /Salud del sistema/);
  assert.match(html, /Thumbnail para Figma/);
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

test("keeps v3 capabilities in one serializable project model", async () => {
  const model = await readFile(new URL("app/lib/model.ts", projectRoot), "utf8");
  const page = await readFile(new URL("app/page.tsx", projectRoot), "utf8");
  const catalog = await readFile(new URL("app/components/Catalog.tsx", projectRoot), "utf8");
  const health = await readFile(new URL("app/lib/health.ts", projectRoot), "utf8");
  const exporters = await readFile(new URL("app/lib/exporters.ts", projectRoot), "utf8");
  assert.match(model, /schemaVersion: 3/);
  assert.match(model, /semanticTokens: SemanticToken\[\]/);
  assert.match(model, /componentTokens: ComponentToken\[\]/);
  assert.match(model, /migrateProject/);
  assert.match(model, /mobile-landscape/);
  assert.match(page, /localStorage\.setItem/);
  assert.match(page, /importProject/);
  assert.match(page, /downloadThumbnail/);
  assert.match(catalog, /@radix-ui\/react-checkbox/);
  assert.match(catalog, /@radix-ui\/react-radio-group/);
  assert.match(catalog, /@radix-ui\/react-switch/);
  assert.match(catalog, /@radix-ui\/react-select/);
  assert.match(catalog, /@radix-ui\/react-tabs/);
  assert.match(catalog, /Asignar/);
  assert.match(health, /contrastRatio/);
  assert.match(health, /proposalPending/);
  assert.match(exporters, /buildDocumentation/);
  assert.match(exporters, /buildTokenSubset/);
  assert.match(exporters, /resolveProjectTokens/);
});
