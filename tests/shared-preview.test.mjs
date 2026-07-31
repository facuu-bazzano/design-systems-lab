import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("catalog and scenarios reuse the same canonical project preview renderer", async () => {
  const catalog = await readFile(new URL("app/components/Catalog.tsx", projectRoot), "utf8");
  const health = await readFile(new URL("app/components/HealthView.tsx", projectRoot), "utf8");
  const scenarios = await readFile(new URL("app/components/ScenarioExplorer.tsx", projectRoot), "utf8");
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");

  assert.match(catalog, /ProjectAlertPreview/);
  assert.match(catalog, /export function ProjectComponentPreview/);
  assert.match(scenarios, /import \{ ProjectComponentPreview \} from "\.\/Catalog"/);
  assert.match(scenarios, /<ProjectComponentPreview/);
  assert.match(health, /onOpenScenarios/);
  assert.doesNotMatch(health, /ProjectAlertPreview/);
  assert.doesNotMatch(health, /scenario-alert/);
  assert.doesNotMatch(css, /\.ds-alert|\.finding-item|\.scenario-alert/);
  assert.equal(css.match(/\.project-alert\{[^}]*border:/g)?.length, 1);
  assert.doesNotMatch(css, /\.project-alert\{[^}]*border-left/);
});

test("scenario suite covers the complete catalog and separates platform structures", async () => {
  const registry = await readFile(new URL("app/lib/scenario-registry.ts", projectRoot), "utf8");
  const catalogRegistry = await readFile(new URL("app/lib/catalog-registry.ts", projectRoot), "utf8");
  const scenarios = await readFile(new URL("app/components/ScenarioExplorer.tsx", projectRoot), "utf8");
  const css = await readFile(new URL("app/globals.css", projectRoot), "utf8");
  const catalogIds = [...catalogRegistry.matchAll(/entry\("([^"]+)"/g)].map((match) => match[1]);
  const scenarioBlock = registry.match(/scenarioRegistry:[\s\S]*?export const scenarioCoverage/)?.[0] || "";
  const scenarioIds = [...scenarioBlock.matchAll(/"([a-z-]+)"/g)].map((match) => match[1]).filter((id) => catalogIds.includes(id));
  assert.deepEqual([...new Set(scenarioIds)].sort(), [...new Set(catalogIds)].sort());
  assert.match(css, /platform-mobile \.scenario-product-shell/);
  assert.match(css, /platform-tablet \.scenario-product-shell/);
  assert.match(css, /platform-desktop \.scenario-product-shell/);
  assert.match(scenarios, /showGrid/);
});

test("the single resolver exports typography, spacing and layout variables", async () => {
  const resolver = await readFile(new URL("app/lib/token-resolver.ts", projectRoot), "utf8");
  assert.match(resolver, /resolveResponsiveScale/);
  assert.match(resolver, /resolveLayout/);
  assert.match(resolver, /--ds-type-\$\{role\}-size/);
  assert.match(resolver, /--ds-spacing-multiplier/);
  assert.match(resolver, /--ds-columns/);
  assert.match(resolver, /--ds-baseline/);
});

test("foundation configuration views expose focused previews and scenarios are a first-class section", async () => {
  const page = await readFile(new URL("app/page.tsx", projectRoot), "utf8");
  const model = await readFile(new URL("app/lib/model.ts", projectRoot), "utf8");

  assert.match(page, /<FoundationPreview project=\{project\} focus="color"/);
  assert.match(page, /<FoundationPreview project=\{project\} focus="typography"/);
  assert.match(page, /<FoundationPreview project=\{project\} focus="layout"/);
  assert.match(page, /id: "scenarios"/);
  assert.match(model, /\| "scenarios" \|/);
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
