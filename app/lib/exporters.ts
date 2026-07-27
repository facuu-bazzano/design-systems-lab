import { analyzeProject } from "./health";
import { colorSteps, DesignSystemProject, platformOrder, resolveComponent, resolveLayout, resolveResponsiveScale, resolveSemantic } from "./model";

export type ExportCategory = "colors" | "typography" | "scales" | "semantics" | "components" | "themes" | "platforms";

const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "design-system";
const safe = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);

export function downloadText(filename: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function projectFilename(project: DesignSystemProject, suffix: string) {
  return `${slugify(project.meta.name)}${suffix}`;
}

export function buildTokenSubset(project: DesignSystemProject, categories: ExportCategory[]) {
  const selected = new Set(categories);
  return {
    $schema: "https://design-tokens.github.io/community-group/format/",
    project: { name: project.meta.name, schemaVersion: project.schemaVersion, generatedAt: new Date().toISOString() },
    ...(selected.has("colors") ? { color: Object.fromEntries(project.foundations.colors.map((palette) => [palette.name.toLowerCase(), Object.fromEntries(colorSteps.map((step) => [step, { $type: "color", $value: palette.scale[step] }]))])) } : {}),
    ...(selected.has("typography") ? { typography: { family: { $type: "fontFamily", $value: project.foundations.typography.family }, levels: Object.fromEntries(project.foundations.typography.levels.map((level) => [level.name.toLowerCase(), { $type: "typography", $value: { fontFamily: project.foundations.typography.family, fontSize: `${level.size}px`, fontWeight: level.weight, lineHeight: level.lineHeight, letterSpacing: `${level.tracking}em` } }])) } } : {}),
    ...(selected.has("scales") ? { scales: project.foundations.scales, layout: project.foundations.layoutBase } : {}),
    ...(selected.has("semantics") ? { semantic: Object.fromEntries(project.semanticTokens.map((token) => [token.name, { $type: "color", $value: token.defaultRef, $extensions: { modes: token.themeRefs, platforms: token.platformRefs }, $description: token.description }])) } : {}),
    ...(selected.has("components") ? { component: Object.fromEntries(project.componentTokens.map((token) => [token.name, { $value: token.reference, $extensions: { platforms: token.platformRefs }, $description: token.description }])) } : {}),
    ...(selected.has("themes") ? { modes: project.themes } : {}),
    ...(selected.has("platforms") ? { platforms: Object.fromEntries(platformOrder.filter((id) => project.platforms[id].enabled).map((id) => [id, { ...project.platforms[id], resolvedLayout: resolveLayout(project, id), resolvedScales: resolveResponsiveScale(project, id) }])) } : {}),
  };
}

export function buildCss(project: DesignSystemProject, categories: ExportCategory[]) {
  const selected = new Set(categories);
  const foundationLines = selected.has("colors") ? project.foundations.colors.flatMap((palette) => colorSteps.map((step) => `  --color-${slugify(palette.name)}-${step}: ${palette.scale[step]};`)) : [];
  const scaleLines = selected.has("scales") ? Object.entries(project.foundations.scales).flatMap(([group, tokens]) => tokens.map((token) => `  --${group}-${slugify(token.name)}: ${token.value};`)) : [];
  const semanticLines = selected.has("semantics") ? project.semanticTokens.map((token) => `  --${token.name.replaceAll(".", "-")}: ${resolveSemantic(project, token.id, project.themes[0]?.id || "light", "mobile") || "/* referencia sin resolver */"};`) : [];
  const componentLines = selected.has("components") ? project.componentTokens.map((token) => `  --${token.name.replaceAll(".", "-")}: ${token.reference.startsWith("semantic:") ? `var(--${token.reference.slice(9).replaceAll(".", "-")})` : token.reference};`) : [];
  const modeBlocks = selected.has("themes") ? project.themes.slice(1).map((theme) => `[data-theme="${slugify(theme.name)}"] {\n${project.semanticTokens.map((token) => `  --${token.name.replaceAll(".", "-")}: ${resolveSemantic(project, token.id, theme.id, "mobile") || "/* referencia sin resolver */"};`).join("\n")}\n}`).join("\n\n") : "";
  return `:root {\n${[...foundationLines, ...scaleLines, ...semanticLines, ...componentLines].join("\n")}\n}\n\n${modeBlocks}\n`;
}

function documentationCatalog(project: DesignSystemProject, themeId: string) {
  const vars = {
    surface: resolveSemantic(project, "surface-default", themeId, "mobile") || "transparent",
    raised: resolveSemantic(project, "surface-raised", themeId, "mobile") || "transparent",
    text: resolveSemantic(project, "text-primary", themeId, "mobile") || "currentColor",
    muted: resolveSemantic(project, "text-muted", themeId, "mobile") || "currentColor",
    action: resolveComponent(project, "button-primary-bg", themeId, "mobile") || "transparent",
    onAction: resolveSemantic(project, "text-on-action", themeId, "mobile") || "currentColor",
    border: resolveSemantic(project, "border-subtle", themeId, "mobile") || "currentColor",
    destructive: resolveSemantic(project, "feedback-destructive", themeId, "mobile") || "transparent",
    warning: resolveSemantic(project, "feedback-warning", themeId, "mobile") || "transparent",
  };
  const style = Object.entries(vars).map(([key, value]) => `--${key}:${value}`).join(";");
  return `<section class="catalog" style="${style}"><h2>Catálogo de componentes · ${safe(project.themes.find((theme) => theme.id === themeId)?.name)}</h2><div class="catalog-grid"><article><h3>Botones</h3><div class="row"><button class="primary">Primario</button><button>Secundario</button><button class="danger">Destructivo</button><button disabled>Disabled</button></div></article><article><h3>Campos</h3><label>Nombre<input value="Ada Lovelace" readonly></label><label class="error">Email<input value="ada@" readonly><small>Revisá el formato.</small></label><label>Equipo<select><option>Producto</option></select></label></article><article><h3>Selección</h3><div class="row"><span class="check on">✓</span><span class="check"></span><span class="radio on"></span><span class="radio"></span><span class="switch on"></span><span class="switch"></span></div></article><article><h3>Feedback</h3><div class="alert">Información del sistema</div><div class="alert warning">Advertencia para revisar</div><div class="alert danger">Error o acción destructiva</div></article></div></section>`;
}

export function buildDocumentation(project: DesignSystemProject) {
  const health = analyzeProject(project);
  const palettes = project.foundations.colors.map((palette) => `<article class="palette"><h3>${safe(palette.name)}</h3><div class="swatches">${colorSteps.map((step) => `<div style="background:${palette.scale[step]}"><b>${step}</b><code>${palette.scale[step]}</code></div>`).join("")}</div></article>`).join("");
  const semanticRows = project.semanticTokens.map((token) => `<tr><td><code>${safe(token.name)}</code></td><td>${safe(token.category)}</td><td>${safe(token.defaultRef)}</td><td>${safe(token.description)}</td></tr>`).join("");
  const componentRows = project.componentTokens.map((token) => `<tr><td><code>${safe(token.name)}</code></td><td>${safe(token.component)}</td><td><code>${safe(token.reference)}</code></td><td>${safe(token.description)}</td></tr>`).join("");
  const layouts = platformOrder.filter((id) => project.platforms[id].enabled).map((id) => { const layout = resolveLayout(project, id); const scales = resolveResponsiveScale(project, id); return `<article class="metric"><strong>${safe(project.platforms[id].name)}</strong><span>${layout.columns} columnas · margen ${layout.margin}px · gutter ${layout.gutter}px · max ${layout.maxWidth}px</span><span>Tipo ${scales.typography}× · espacio ${scales.spacing}× · dimensiones ${scales.dimensions}×</span></article>`; }).join("");
  const scaleCards = Object.entries(project.foundations.scales).map(([group, tokens]) => `<article class="metric"><strong>${safe(group)}</strong><span>${tokens.map((token) => `${safe(token.name)}: ${safe(token.value)}`).join(" · ")}</span></article>`).join("");
  const typeRows = project.foundations.typography.levels.map((level) => `<tr><td>${safe(level.name)}</td><td>${level.size}px</td><td>${level.weight}</td><td>${level.lineHeight}</td><td>${level.tracking}em</td></tr>`).join("");
  const findings = health.findings.length ? health.findings.map((finding) => `<li class="${finding.severity}"><b>${safe(finding.area)}</b><span>${safe(finding.mode)} · ${safe(finding.explanation)}</span></li>`).join("") : `<li class="ok"><b>Sin hallazgos activos</b><span>La instantánea cumple las verificaciones iniciales.</span></li>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(project.meta.name)} · Documentación</title><style>
  :root{font-family:Inter,system-ui,sans-serif;color:#18181b;background:#fafafa}*{box-sizing:border-box}body{margin:0}header{padding:64px max(24px,8vw);background:#18181b;color:#fff}header span{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#a1a1aa}header h1{font-size:clamp(36px,6vw,72px);letter-spacing:-.05em;margin:12px 0}header p{max-width:680px;color:#d4d4d8;line-height:1.6}main{max-width:1200px;margin:auto;padding:48px 24px 100px}section{margin:0 0 56px}h2{font-size:28px;letter-spacing:-.03em}.palette{border:1px solid #e4e4e7;background:white;border-radius:16px;padding:18px;margin:12px 0}.palette h3{margin:0 0 12px}.swatches{display:grid;grid-template-columns:repeat(10,1fr);overflow:hidden;border-radius:10px}.swatches div{height:88px;padding:8px;display:flex;flex-direction:column;justify-content:flex-end}.swatches b,.swatches code{font-size:10px;mix-blend-mode:difference;color:#fff}.swatches code{font-size:8px}table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e4e4e7}th,td{text-align:left;padding:12px;border-bottom:1px solid #e4e4e7;font-size:13px}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.metric{display:grid;gap:8px;padding:16px;border:1px solid #e4e4e7;background:#fff;border-radius:12px}.metric span{font-size:12px;color:#71717a}.score{font-size:64px;font-weight:750}.findings{list-style:none;padding:0}.findings li{display:grid;gap:4px;padding:14px;border-left:4px solid #a1a1aa;background:#fff;margin:8px 0}.findings .critical{border-color:#be123c}.findings .warning{border-color:#d97706}.findings span{font-size:12px;color:#71717a}.catalog{padding:24px;border-radius:18px;background:var(--surface);color:var(--text);border:1px solid var(--border)}.catalog-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.catalog article{padding:18px;background:var(--raised);border:1px solid var(--border);border-radius:12px}.catalog h3{font-size:13px}.row{display:flex;gap:8px;flex-wrap:wrap}.catalog button,.catalog input,.catalog select{border:1px solid var(--border);border-radius:8px;padding:9px 12px;background:var(--raised);color:var(--text)}.catalog button.primary{background:var(--action);color:var(--onAction);border-color:var(--action)}.catalog button.danger{background:var(--destructive);color:var(--onAction);border-color:var(--destructive)}.catalog button:disabled{opacity:.45}.catalog label{display:grid;gap:5px;margin:8px 0;font-size:11px}.catalog small{color:var(--destructive)}.catalog .error input{border-color:var(--destructive)}.check,.radio{width:22px;height:22px;border:1px solid var(--border);display:grid;place-items:center}.radio{border-radius:50%}.check.on,.radio.on,.switch.on{background:var(--action);color:var(--onAction)}.switch{width:38px;height:22px;border-radius:12px;background:var(--border)}.alert{padding:10px;border:1px solid var(--action);margin:7px 0;border-radius:8px}.alert.warning{border-color:var(--warning)}.alert.danger{border-color:var(--destructive)}@media(max-width:700px){.swatches{grid-template-columns:repeat(5,1fr)}.catalog-grid{grid-template-columns:1fr}}
  </style></head><body><header><span>Design system blueprint</span><h1>${safe(project.meta.name)}</h1><p>${safe(project.meta.description)}</p></header><main><section><h2>Salud del sistema</h2><div class="score">${health.score}/100</div><p>Cobertura semántica ${health.coverage}% · ${health.counts.critical} críticos · ${health.counts.warning} advertencias</p><ul class="findings">${findings}</ul></section><section><h2>Foundations de color</h2>${palettes}</section><section><h2>Tipografía</h2><div class="metric"><strong style="font-family:${safe(project.foundations.typography.family)}">${safe(project.foundations.typography.family)}</strong><span>Base ${project.foundations.typography.base.size}px · ratio ${project.foundations.typography.ratio}</span></div><table><thead><tr><th>Nivel</th><th>Tamaño</th><th>Peso</th><th>Interlínea</th><th>Tracking</th></tr></thead><tbody>${typeRows}</tbody></table></section><section><h2>Escalas primitivas</h2><div class="metrics">${scaleCards}</div></section><section><h2>Modos, plataformas y grillas</h2><div class="metrics">${layouts}</div></section><section><h2>Tokens semánticos</h2><table><thead><tr><th>Token</th><th>Categoría</th><th>Foundation</th><th>Uso</th></tr></thead><tbody>${semanticRows}</tbody></table></section><section><h2>Tokens de componente</h2><table><thead><tr><th>Token</th><th>Componente</th><th>Referencia</th><th>Uso</th></tr></thead><tbody>${componentRows}</tbody></table></section>${project.themes.map((theme) => documentationCatalog(project, theme.id)).join("")}</main></body></html>`;
}

