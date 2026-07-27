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
const resolver = await loadTs("app/lib/token-resolver.ts", { "./model": model, react: {} });
const health = await loadTs("app/lib/health.ts", { "./model": model, "./token-resolver": resolver });
const exporters = await loadTs("app/lib/exporters.ts", { "./model": model, "./token-resolver": resolver, "./health": health });

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
  const subset = exporters.buildTokenSubset(project, ["colors", "semantics"]);
  assert.ok(Object.keys(subset.color).length > 0);
  assert.ok(Object.keys(subset.semantic).length > 0);
  assert.equal("typography" in subset, false);
  const css = exporters.buildCss(project, ["semantics", "components", "themes"]);
  assert.match(css, /--ds-surface:/);
  assert.match(css, /data-theme="oscuro"/);
  const documentation = exporters.buildDocumentation(project);
  for (const id of ["intro", "foundations", "tokens", "components", "patterns", "accessibility", "platforms"]) assert.match(documentation, new RegExp(`id="${id}"`));
  assert.match(documentation, /Sistema inicial validado/);
  assert.match(documentation, /\.palette span code\{font-size:12px\}/);
});
