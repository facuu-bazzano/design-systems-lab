import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the design system laboratory", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Laboratorio de Sistemas de Diseño<\/title>/i);
  assert.match(html, /Design System/);
  assert.match(html, /Nova Design System/);
  assert.match(html, /Preview en vivo/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("keeps the product capabilities in one central project model", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
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
