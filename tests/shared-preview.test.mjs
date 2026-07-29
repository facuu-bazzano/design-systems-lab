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
  assert.match(page, /Eliminar paleta “/);
  assert.match(page, /Método para crear paleta/);
});

test("palette deletion exposes a neutral icon trigger and explicit dependency impact", async () => {
  const page = await readFile(new URL("app/page.tsx", projectRoot), "utf8");

  assert.match(page, /Trash2/);
  assert.match(page, /paletteDependencies/);
  assert.match(page, /asignaciones semánticas quedarían sin foundation/);
  assert.match(page, /tokens de componente perderían su valor resuelto/);
});

test("library browser groups broad palette sources without ambiguous publication badges", async () => {
  const page = await readFile(new URL("app/page.tsx", projectRoot), "utf8");

  assert.match(page, /colorLibraries/);
  assert.match(page, /Agregar colecci/);
  assert.match(page, /Buscar paleta/);
  assert.doesNotMatch(page, /preset\.fidelity/);
});

test("the shared brand mark replaces the visible laboratory wordmark", async () => {
  const page = await readFile(new URL("app/page.tsx", projectRoot), "utf8");
  const labUi = await readFile(new URL("app/components/ui/LabUI.tsx", projectRoot), "utf8");
  const brandMark = await readFile(new URL("app/components/BrandMark.tsx", projectRoot), "utf8");
  const layout = await readFile(new URL("app/layout.tsx", projectRoot), "utf8");

  assert.match(page, /starter-mark/);
  assert.match(page, /setup-header-start/);
  assert.match(labUi, /ui-brand-mark/);
  assert.match(brandMark, /aria-label="Laboratorio de Sistemas de Dise/);
  assert.match(brandMark, /logo-for-light-mode\.png/);
  assert.match(brandMark, /logo-for-dark-mode\.png/);
  assert.match(layout, /prefers-color-scheme: light/);
  assert.match(layout, /prefers-color-scheme: dark/);
  assert.doesNotMatch(page, /starter-kicker[^>]*>Laboratorio de Sistemas de Dise/);
});
