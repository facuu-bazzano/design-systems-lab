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
const figmaMcp = await loadTs("app/lib/figma-mcp.ts", { "./model": model, "./health": health, "./exporters": exporters });

test("validated starter resolves all essential variables in light and dark", () => {
  const project = model.createInitialProject();
  assert.equal(project.schemaVersion, 5);
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

test("v2 projects migrate to v5 without reinjecting explicitly removed decisions", () => {
  const upgraded = model.migrateProject({ schemaVersion: 2, id: "legacy", meta: { name: "Importado", description: "", brandMark: "I", updatedAt: "" }, foundations: { colors: [], typography: model.createInitialProject().foundations.typography, scales: model.createInitialProject().foundations.scales, layoutBase: model.createInitialProject().foundations.layoutBase, customFoundations: [] }, semanticTokens: [], componentTokens: [], themes: [] });
  assert.equal(upgraded.schemaVersion, 5);
  assert.equal(upgraded.semanticTokens.length, 0);
  assert.equal(upgraded.componentTokens.length, 0);
  assert.equal(resolver.resolveProjectTokens(upgraded, "light", "mobile").ready, false);
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

test("v3 single-family typography migrates to a reusable family library", () => {
  const current = model.createInitialProject();
  const legacy = structuredClone(current);
  legacy.schemaVersion = 3;
  legacy.foundations.typography = { family: "Inter", source: "google", availableWeights: [400, 700], styles: ["Normal"], base: current.foundations.typography.base, ratioName: current.foundations.typography.ratioName, ratio: current.foundations.typography.ratio, levels: current.foundations.typography.levels.map((level) => ({ id: level.id, name: level.name, size: level.size, weight: level.weight, lineHeight: level.lineHeight, tracking: level.tracking })) };
  const upgraded = model.migrateProject(legacy);
  assert.equal(upgraded.schemaVersion, 5);
  assert.equal(upgraded.foundations.typography.families.length, 1);
  assert.equal(upgraded.foundations.typography.families[0].family, "Inter");
  assert.ok(upgraded.foundations.typography.levels.every((level) => level.familyId === upgraded.foundations.typography.primaryFamilyId));
});

test("v5 migration is idempotent and preserves blank and custom projects", () => {
  const blank = model.createBlankProject();
  const blankRoundTrip = model.migrateProject(JSON.parse(JSON.stringify(blank)));
  assert.equal(blankRoundTrip.schemaVersion, 5);
  assert.equal(blankRoundTrip.projectState, "blank");
  assert.equal(blankRoundTrip.components.length, 0);
  const project = model.createInitialProject();
  project.components.push({ id: "component-client-widget", key: "client-widget", name: "Widget cliente", description: "Exportable", source: "custom" });
  project.componentVariants.push({ id: "variant-client-widget-default", key: "default", componentId: "component-client-widget", name: "Default", description: "Base", visibleInCatalog: false });
  const roundTrip = model.migrateProject(JSON.parse(JSON.stringify(project)));
  assert.deepEqual(roundTrip, model.migrateProject(JSON.parse(JSON.stringify(roundTrip))));
  assert.ok(roundTrip.components.some((component) => component.key === "client-widget" && !component.rendererKey));
});

test("variant inheritance resolves slots and rejects cycles", () => {
  const project = model.createInitialProject();
  const secondary = project.componentVariants.find((variant) => variant.id === "variant-button-secondary");
  assert.equal(secondary.inheritsFrom, "variant-button-primary");
  assert.ok(model.componentTokensForVariant(project, secondary.id).some((token) => token.property === "background"));
  assert.equal(model.variantInheritanceWouldCycle(project, "variant-button-primary", secondary.id), true);
});

test("component-only exports include required dependencies", () => {
  const subset = exporters.buildTokenSubset(model.createInitialProject(), ["components"]);
  assert.ok(subset.component);
  assert.ok(subset.semantic);
  assert.ok(subset.color);
  assert.ok(subset.scales);
});

test("multiple typography families resolve per role and remain serializable", () => {
  const project = model.createInitialProject();
  const display = model.makeTypographyFamily("Merriweather", "google", [400, 700], ["Normal", "Italic"]);
  project.foundations.typography.families.push(display);
  project.foundations.typography.levels.find((level) => level.name === "Heading").familyId = display.id;
  project.foundations.typography.levels.find((level) => level.name === "Display").familyId = display.id;
  const snapshot = resolver.resolveProjectTokens(project, "light", "mobile");
  assert.match(snapshot.cssVariables["--ds-font-body"], /Inter/);
  assert.match(snapshot.cssVariables["--ds-font-heading"], /Merriweather/);
  const subset = exporters.buildTokenSubset(project, ["typography"]);
  assert.equal(Object.keys(subset.typography.families).length, 2);
  assert.equal(subset.typography.levels.heading.$value.fontFamily, "Merriweather");
  assert.doesNotThrow(() => JSON.stringify(project));
});

test("Figma MCP package preserves aliases, modes and an inspect-before-write plan", () => {
  const project = model.createInitialProject();
  const bundle = figmaMcp.buildFigmaMcpPackage(project, { targetFileUrl: "https://www.figma.com/design/example/Design-System", conflictPolicy: "review", dryRun: true });
  assert.equal(bundle.kind, "design-systems-lab/figma-mcp-package");
  assert.equal(bundle.validation.status, "ready-with-warnings", JSON.stringify(bundle.validation));
  assert.equal(bundle.validation.errors.length, 0);
  assert.ok(bundle.manifest.collections.find((collection) => collection.key === "primitives-color"));
  const typographyPrimitives = bundle.manifest.collections.find((collection) => collection.key === "primitives-typography");
  assert.ok(typographyPrimitives.variables.every((variable) => variable.scopes.length === 0 && variable.hiddenFromPublishing));
  const typographyRoles = bundle.manifest.collections.find((collection) => collection.key === "typography");
  assert.deepEqual(typographyRoles.variables.find((variable) => variable.key === "typography.body.family").scopes, ["FONT_FAMILY"]);
  assert.deepEqual(typographyRoles.variables.find((variable) => variable.key === "typography.body.size").scopes, ["FONT_SIZE"]);
  const semantic = bundle.manifest.collections.find((collection) => collection.key === "semantic");
  const action = semantic.variables.find((variable) => variable.key === "semantic.action-primary");
  assert.ok(Object.values(action.valuesByMode).every((value) => value.kind === "alias"));
  assert.deepEqual(action.scopes, ["FRAME_FILL", "SHAPE_FILL"]);
  const text = semantic.variables.find((variable) => variable.key === "semantic.text-primary");
  assert.deepEqual(text.scopes, ["TEXT_FILL"]);
  const overlay = semantic.variables.find((variable) => variable.key === "semantic.surface-overlay");
  assert.ok(Object.values(overlay.valuesByMode).every((value) => value.kind === "literal"), "alpha colors must resolve to literals rather than broken aliases");
  const primitives = bundle.manifest.collections.filter((collection) => collection.key.startsWith("primitives-")).flatMap((collection) => collection.variables);
  assert.ok(primitives.length > 0);
  assert.ok(primitives.every((variable) => variable.scopes.length === 0 && variable.exposure === "internal" && variable.hiddenFromPublishing));
  const components = bundle.manifest.collections.find((collection) => collection.key === "component");
  assert.deepEqual(components.variables.find((variable) => variable.key === "component.button.primary.default.background").scopes, ["FRAME_FILL", "SHAPE_FILL"]);
  assert.deepEqual(components.variables.find((variable) => variable.key === "component.button.primary.default.foreground").scopes, ["TEXT_FILL"]);
  assert.deepEqual(components.variables.find((variable) => variable.key === "component.button.primary.default.radius").scopes, ["CORNER_RADIUS"]);
  assert.ok(bundle.manifest.collections.flatMap((collection) => collection.variables).every((variable) => !variable.scopes.includes("ALL_SCOPES")));
  assert.equal(bundle.manifest.scopePolicy.allScopesAllowed, false);
  assert.deepEqual(bundle.manifest.scopePolicy.supportedByType.STRING, ["TEXT_CONTENT", "FONT_FAMILY", "FONT_STYLE"]);
  assert.ok(bundle.manifest.scopePolicy.supportedByType.FLOAT.includes("FONT_SIZE"));
  assert.ok(bundle.manifest.scopePolicy.supportedByType.COLOR.includes("EFFECT_COLOR"));
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
