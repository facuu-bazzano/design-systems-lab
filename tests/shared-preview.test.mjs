import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("catalog and health reuse the same project preview components", async () => {
  const catalog = await readFile(new URL("app/components/Catalog.tsx", projectRoot), "utf8");
  const health = await readFile(new URL("app/components/HealthView.tsx", projectRoot), "utf8");

  assert.match(catalog, /ProjectAlertPreview/);
  assert.match(health, /ProjectAlertPreview/);
  assert.doesNotMatch(health, /scenario-alert/);
});

test("forced catalog states remain bounded and respect real disabled semantics", async () => {
  const previews = await readFile(new URL("app/components/ProjectPreviews.tsx", projectRoot), "utf8");

  assert.match(previews, /state === "Open"/);
  assert.match(previews, /project-select-popup-static/);
  assert.doesNotMatch(previews, /open=\{forcedOpen\}/);
  assert.match(previews, /disabled=\{state === "Disabled"\}/);
});

test("health correction and color palette workflows expose their completion actions", async () => {
  const page = await readFile(new URL("app/page.tsx", projectRoot), "utf8");

  assert.match(page, /Marcar .* como validada/);
  assert.match(page, /Eliminar definitivamente/);
  assert.match(page, /Método para crear paleta/);
});
