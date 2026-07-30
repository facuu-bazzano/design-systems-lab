import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const ui = readFileSync(new URL("../app/components/ui/LabUI.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../app/components/Catalog.tsx", import.meta.url), "utf8");
const health = readFileSync(new URL("../app/components/HealthView.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("exportación usa un diálogo modal con nombre, Escape y restauración de foco", () => {
  assert.match(page, /<dialog ref=\{dialogRef\}/);
  assert.match(page, /aria-labelledby="export-title"/);
  assert.match(page, /aria-describedby="export-description"/);
  assert.match(page, /dialog\.showModal\(\)/);
  assert.match(page, /document\.body\.style\.overflow = "hidden"/);
  assert.match(page, /onCancel=\{\(event\) => \{ event\.preventDefault\(\); onClose\(\); \}\}/);
  assert.match(page, /returnFocusRef\.current\?\.focus\(\)/);
});

test("importación anuncia éxito y conserva errores con recuperación", () => {
  assert.match(page, /role="status" aria-live="polite"/);
  assert.match(page, /role="alert" aria-live="assertive"/);
  assert.match(page, /Elegir otro archivo/);
  assert.match(page, /Verificá que sea un archivo de proyecto/);
});

test("navegación SPA expone sección actual, skip link y foco solicitado", () => {
  assert.match(page, /href="#lab-main">Saltar al contenido/);
  assert.match(page, /aria-current=\{section === item\.id \? "page" : undefined\}/);
  assert.match(page, /navigationRequestedRef\.current/);
  assert.match(page, /heading\.focus\(\{ preventScroll: true \}\)/);
  assert.match(page, /document\.title =/);
});

test("Salud conserva un único main y etiqueta escenarios", () => {
  assert.doesNotMatch(health, /<main[> ]/);
  assert.match(health, /<article className=\{`health-scenario/);
  assert.match(health, /aria-labelledby=\{titleId\}/);
  assert.match(health, /className="scenario-body"/);
});

test("combobox tipográfico implementa listbox y teclado APG", () => {
  assert.match(ui, /role="combobox"/);
  assert.match(ui, /role="listbox"/);
  assert.match(ui, /role="option"/);
  assert.match(ui, /aria-activedescendant/);
  for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape"]) assert.match(ui, new RegExp(`event\\.key === "${key}"`));
});

test("campos del Lab y Catálogo asocian ayuda y error", () => {
  assert.match(ui, /aria-describedby=\{describedBy\}/);
  assert.match(ui, /aria-invalid=\{error \? true/);
  assert.match(catalog, /"aria-describedby": descriptionId/);
  assert.match(catalog, /<small id=\{descriptionId\}/);
});

test("campos editables móviles usan 16px sin alterar toda la tipografía", () => {
  assert.match(css, /@media\(max-width:800px\)\{\.ui-field input,[^}]+font-size:16px/);
  assert.doesNotMatch(css, /@media\(max-width:800px\)\{body[^}]+font-size:16px/);
});

test("métricas cero son datos estáticos y las positivas son navegables", () => {
  assert.match(health, /if \(!count\) return <div className="health-stat"/);
  assert.match(health, /if \(!value\) return <span className="metric-zero"/);
  assert.match(health, /return <button className=\{`metric-link/);
  assert.match(health, /Sin hallazgos/);
});
