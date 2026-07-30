import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
async function loadTs(path, dependencies = {}) {
  const source = await readFile(new URL(path, root), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const loadedModule = { exports: {} };
  const localRequire = (id) => dependencies[id] || (() => { throw new Error(`Unknown test dependency ${id}`); })();
  new Function("exports", "module", "require", code)(loadedModule.exports, loadedModule, localRequire);
  return loadedModule.exports;
}

const model = await loadTs("app/lib/model.ts");
const generatedColorLibraries = JSON.parse(await readFile(new URL("app/lib/color-library.generated.json", root), "utf8"));
const colorPresets = await loadTs("app/lib/color-presets.ts", { "./model": model, "./color-library.generated.json": generatedColorLibraries });
const registry = await loadTs("app/lib/catalog-registry.ts");
const resolver = await loadTs("app/lib/token-resolver.ts", { "./model": model, react: {} });
const health = await loadTs("app/lib/health.ts", { "./model": model, "./token-resolver": resolver });
const exporters = await loadTs("app/lib/exporters.ts", { "./catalog-registry": registry, "./model": model, "./token-resolver": resolver, "./health": health });
const figmaMcp = await loadTs("app/lib/figma-mcp.ts", { "./model": model, "./health": health });

test("validated starter resolves all essential variables in light and dark", () => {
  const project = model.createInitialProject();
  assert.equal(project.schemaVersion, 3);
  for (const theme of ["light", "dark"]) {
    const snapshot = resolver.resolveProjectTokens(project, theme, "mobile");
    assert.equal(snapshot.ready, true, `${theme} has missing tokens: ${snapshot.missing.join(", ")}`);
    assert.equal(snapshot.missing.length, 0);
    assert.ok(snapshot.cssVariables["--ds-surface"]);
    assert.ok(snapshot.cssVariables["--ds-input-error"]);
  }
});

test("validated starter has high health and no blockers", () => {
  const result = health.analyzeProject(model.createInitialProject());
  assert.equal(result.status, "ready");
  assert.equal(result.counts.blocking, 0);
  assert.equal(result.counts.warning, 0, result.findings.map((finding) => `${finding.mode}/${finding.area}: ${finding.cause}`).join("\n"));
  assert.equal(result.score, 100);
});

test("responsive review findings keep an exact platform correction target", () => {
  const project = model.createInitialProject();
  project.platforms.desktop.enabled = true;
  project.platforms.desktop.proposalPending = true;
  const pending = health.analyzeProject(project);
  const finding = pending.findings.find((item) => item.id === "platform-desktop");
  assert.equal(pending.score, 95);
  assert.equal(finding.section, "scales");
  assert.equal(finding.platformId, "desktop");
  project.platforms.desktop.proposalPending = false;
  assert.equal(health.analyzeProject(project).score, 100);
});

test("manual and preset palettes remain editable foundations", () => {
  const manual = model.makeManualPalette("Marca", { 100: "#F5F5F5", 500: "#3366FF", 900: "#101828" });
  assert.equal(manual.creationMethod, "manual");
  assert.equal(manual.scale[500], "#3366FF");
  const ant = colorPresets.paletteFromPreset(colorPresets.colorPresets.find((preset) => preset.id === "ant-blue"));
  assert.equal(ant.creationMethod, "preset");
  assert.equal(ant.scale[600], "#1677FF");
  assert.equal(ant.origin, "Ant Design");
});

test("color library exposes broad, grouped and editable foundations", () => {
  assert.equal(colorPresets.colorLibraries.length, 11);
  assert.equal(colorPresets.colorPresets.length, 220);
  assert.ok(colorPresets.colorLibraries.every((library) => library.presets.length >= 5));
  assert.ok(colorPresets.colorLibraries.find((library) => library.id === "radix").presets.some((preset) => preset.name.includes("Dark")));
  assert.ok(colorPresets.colorLibraries.find((library) => library.id === "heroui").presets.some((preset) => preset.name.includes("Success")));
});

test("blank project is pending rather than failed", () => {
  const project = model.createBlankProject();
  const result = health.analyzeProject(project);
  const snapshot = resolver.resolveProjectTokens(project, "light", "mobile");
  assert.equal(result.status, "not-evaluated");
  assert.equal(result.score, null);
  assert.equal(result.counts.blocking, 0);
  assert.equal(snapshot.status, "pending");
});

test("v2 projects are upgraded to a complete v3 baseline", () => {
  const upgraded = model.migrateProject({ schemaVersion: 2, id: "legacy", meta: { name: "Importado", description: "", brandMark: "I", updatedAt: "" }, foundations: { colors: [], typography: model.createInitialProject().foundations.typography, scales: model.createInitialProject().foundations.scales, layoutBase: model.createInitialProject().foundations.layoutBase, customFoundations: [] }, semanticTokens: [], componentTokens: [], themes: [] });
  assert.equal(upgraded.schemaVersion, 3);
  assert.equal(resolver.resolveProjectTokens(upgraded, "light", "mobile").ready, true);
});

test("the former Nova starter upgrades to the validated starter", () => {
  const upgraded = model.migrateProject({ ...model.createInitialProject(), schemaVersion: 2, id: "ds-nova", meta: { name: "Nova Design System", description: "Anterior", brandMark: "N", updatedAt: "" }, semanticTokens: [] });
  assert.equal(upgraded.meta.name, "Sistema inicial validado");
  assert.equal(health.analyzeProject(upgraded).score, 100);
});

test("exports selective tokens, shared CSS variables and structured documentation", () => {
  const project = model.createInitialProject();
  project.foundations.colors[0].scale[950] = "#151044";
  const subset = exporters.buildTokenSubset(project, ["colors", "semantics"]);
  assert.ok(Object.keys(subset.color).length > 0);
  assert.ok(Object.keys(subset.semantic).length > 0);
  assert.equal("typography" in subset, false);
  const css = exporters.buildCss(project, ["semantics", "components", "themes"]);
  assert.match(css, /--ds-surface:/);
  assert.match(css, /data-theme="oscuro"/);
  assert.match(exporters.buildCss(project, ["colors"]), /--color-indigo-950: #151044/);
  const documentation = exporters.buildDocumentation(project);
  for (const id of ["intro", "foundations", "tokens", "components", "patterns", "accessibility", "platforms"]) assert.match(documentation, new RegExp(`id="${id}"`));
  assert.match(documentation, /Sistema inicial validado/);
  assert.match(documentation, /Accordion/);
  assert.match(documentation, /Tooltip/);
  assert.ok(registry.catalogRegistry.length >= 29);
  assert.match(documentation, /\.palette span code\{font-size:12px\}/);
  assert.match(documentation, /class="doc-alert" role="status"><svg/);
  assert.match(documentation, /\.doc-alert\{display:grid;grid-template-columns:auto 1fr/);
  assert.match(documentation, /var\(--ds-success\) 65%,var\(--ds-text\)/);
  assert.doesNotMatch(documentation, /\.doc-alert\{[^}]*border-left/);
});

test("Figma MCP package preserves aliases, modes and an inspect-before-write plan", () => {
  const project = model.createInitialProject();
  const bundle = figmaMcp.buildFigmaMcpPackage(project, { targetFileUrl: "https://www.figma.com/design/example/Design-System", conflictPolicy: "review", dryRun: true });
  assert.equal(bundle.kind, "design-systems-lab/figma-mcp-package");
  assert.equal(bundle.validation.status, "ready-with-warnings");
  assert.equal(bundle.validation.errors.length, 0);
  assert.ok(bundle.manifest.collections.find((collection) => collection.key === "primitives-color"));
  const semantic = bundle.manifest.collections.find((collection) => collection.key === "semantic");
  const action = semantic.variables.find((variable) => variable.key === "semantic.action-primary");
  assert.ok(Object.values(action.valuesByMode).every((value) => value.kind === "alias"));
  const overlay = semantic.variables.find((variable) => variable.key === "semantic.surface-overlay");
  assert.ok(Object.values(overlay.valuesByMode).every((value) => value.kind === "literal"), "alpha colors must resolve to literals rather than broken aliases");
  assert.match(bundle.executionPlan, /primitives → layout\/typography → semantic → component/);
  assert.match(bundle.executionPlan, /use_figma/);
  assert.match(bundle.recommendedPrompt, /dry-run/);
  assert.match(bundle.compatibility.sources.figmaWrite, /developers\.figma\.com/);
});

test("Figma MCP package blocks incomplete projects and validates its target", () => {
  const blank = figmaMcp.buildFigmaMcpPackage(model.createBlankProject());
  assert.equal(blank.validation.status, "blocked");
  assert.ok(blank.validation.errors.some((error) => error.code === "PROJECT_NOT_READY"));
  const malformed = figmaMcp.buildFigmaMcpPackage(model.createInitialProject(), { targetFileUrl: "https://example.com/not-figma" });
  assert.ok(malformed.validation.errors.some((error) => error.code === "INVALID_FIGMA_URL"));
});

test("Figma MCP component-only exports resolve omitted semantic dependencies safely", () => {
  const bundle = figmaMcp.buildFigmaMcpPackage(model.createInitialProject(), { categories: ["components"], targetFileUrl: "https://www.figma.com/design/example/Design-System" });
  const components = bundle.manifest.collections.find((collection) => collection.key === "component");
  assert.ok(components.variables.length > 0);
  assert.ok(components.variables.flatMap((variable) => Object.values(variable.valuesByMode)).every((value) => value.kind !== "alias" || bundle.manifest.collections.some((collection) => collection.variables.some((variable) => variable.key === value.target))));
  assert.equal(bundle.validation.errors.some((error) => error.code === "BROKEN_ALIAS"), false);
});
