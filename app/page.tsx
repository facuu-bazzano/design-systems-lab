"use client";

import { ChangeEvent, CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Component, HeartPulse, Layers3, MonitorCog, PaintBucket, Trash2, Type, X } from "lucide-react";
import { Catalog } from "./components/Catalog";
import { BrandMark } from "./components/BrandMark";
import { FoundationPreview } from "./components/FoundationPreview";
import { HealthView } from "./components/HealthView";
import { ScenarioExplorer } from "./components/ScenarioExplorer";
import { Alert, Badge, Button, Card, Checkbox, Combobox, Dialog, ExportMenu, HealthIndicator, IconButton, Input, LabHeader, ProjectMenu, RadioGroup, SectionHeading, Select, Switch, Table, Tabs, Textarea } from "./components/ui/LabUI";
import { ArrowRightIcon, ChevronDownIcon, GridIcon, MoonIcon, SunIcon } from "./components/ui/Icons";
import { analyzeProject, HealthFinding } from "./lib/health";
import { buildCss, buildDocumentation, buildTokenSubset, downloadText, ExportCategory, projectFilename } from "./lib/exporters";
import { buildFigmaMcpPackage, FigmaConflictPolicy } from "./lib/figma-mcp";
import { colorLibraries, colorPresets, paletteFromPreset } from "./lib/color-presets";
import { allColorReferences, createBlankProject, createInitialProject, DesignSystemProject, fontOptions, generateColorScale, generateTypeLevels, makeManualPalette, makePalette, makeTypographyFamily, migrateProject, PlatformId, platformOrder, primaryTypographyFamily, ratioOptions, relativeLuminance, resolveComponent, resolveLayout, resolveResponsiveScale, resolveSemantic, ScaleGroupKey, scaleLabels, typographyFamilyForLevel, uid } from "./lib/model";

type MainSection = "colors" | "typography" | "scales" | "semantics" | "components" | "catalog" | "scenarios" | "health";
type Notice = { message: string; tone: "success" | "error" };
const STORAGE_KEY = "design-system-lab-project-v1";
const THEME_KEY = "design-system-lab-ui-theme";
const exportOptions: { value: ExportCategory; label: string }[] = [
  { value: "colors", label: "Color" }, { value: "typography", label: "Tipografía" }, { value: "scales", label: "Escalas y layout" }, { value: "semantics", label: "Tokens semánticos" }, { value: "components", label: "Tokens de componente" }, { value: "themes", label: "Modos" }, { value: "platforms", label: "Plataformas" },
];
const semanticRoles: Record<string, string> = {
  "surface-default": "Superficie principal", "surface-raised": "Superficie elevada", "surface-overlay": "Superficie superpuesta", "text-primary": "Texto principal", "text-muted": "Texto secundario", "text-on-action": "Texto sobre acción", "border-subtle": "Borde sutil", "border-strong": "Borde enfático", "action-primary": "Acción principal", "action-hover": "Acción en hover", "action-pressed": "Acción presionada", "focus-ring": "Anillo de foco", "feedback-success": "Feedback de éxito", "feedback-warning": "Feedback de advertencia", "feedback-destructive": "Error o destructivo", "disabled-surface": "Superficie deshabilitada", "disabled-content": "Contenido deshabilitado", "selected-surface": "Superficie seleccionada", "selected-border": "Borde seleccionado",
};
const scalePresetOptions = [
  { value: "conservative", label: "Conservador", meta: "Tipografía 1× · Espaciado 1× · Dimensiones 1×" },
  { value: "balanced", label: "Equilibrado", meta: "Tipografía 1,05× · Espaciado 1,1× · Dimensiones 1×" },
  { value: "spacious", label: "Amplio", meta: "Tipografía 1,125× · Espaciado 1,2× · Dimensiones 1,05×" },
  { value: "manual", label: "Manual", meta: "Editar multiplicadores individualmente" },
];

function Starter({ onChoose }: { onChoose: (kind: "validated" | "blank") => void }) {
  return <main className="starter-v4"><section><BrandMark className="starter-mark" size={76} /><h1>Elegí una base para empezar</h1><p>Después vas a definir el nombre y las plataformas del proyecto antes de entrar al laboratorio.</p><div className="starter-options"><Card><Badge tone="success">Recomendado</Badge><h2>Sistema inicial validado</h2><p>Una base completa, contrastada y editable para explorar decisiones reales desde el primer momento.</p><ul><li>Catálogo funcional desde el inicio</li><li>Contrastes y estados esenciales resueltos</li><li>Mobile como base editable</li></ul><Button variant="primary" size="lg" onClick={() => onChoose("validated")}>Continuar con esta base <ArrowRightIcon /></Button></Card><Card><h2>Proyecto en blanco</h2><p>La estructura del laboratorio sin decisiones visuales preasignadas, con una ruta progresiva de configuración.</p><ul><li>Foundations sin asignaciones</li><li>Tokens pendientes, nunca simulados</li><li>Salud sin evaluar hasta tener una base</li></ul><Button size="lg" onClick={() => onChoose("blank")}>Empezar desde cero <ArrowRightIcon /></Button></Card></div></section></main>;
}

function ProjectView({ project, update, embedded = false }: { project: DesignSystemProject; update: (recipe: (current: DesignSystemProject) => DesignSystemProject) => void; embedded?: boolean }) {
  const setPlatform = (id: PlatformId, enabled: boolean) => update((current) => ({ ...current, platforms: { ...current.platforms, [id]: { ...current.platforms[id], enabled, proposalPending: enabled && id !== "mobile" } } }));
  return <div className={embedded ? "project-settings-v4" : "view-stack"}>{embedded ? null : <SectionHeading title="Proyecto" description="Identidad y plataformas que determinan el alcance del sistema." />}<Card><SectionHeading level={2} title="Identidad" description="Estos datos acompañan el archivo editable, la documentación y el thumbnail." /><div className="form-grid project-identity-grid"><Input label="Nombre del proyecto" value={project.meta.name} onChange={(event) => update((current) => ({ ...current, meta: { ...current.meta, name: event.target.value } }))} /><Input label="Iniciales de marca" value={project.meta.brandMark} maxLength={3} help="Hasta tres caracteres." onChange={(event) => update((current) => ({ ...current, meta: { ...current.meta, brandMark: event.target.value } }))} /><Textarea label="Descripción" value={project.meta.description} onChange={(event) => update((current) => ({ ...current, meta: { ...current.meta, description: event.target.value } }))} /></div></Card><Card><SectionHeading level={2} title="Plataformas" description="Mobile es la base. Activá únicamente las variantes que necesite este proyecto." /><div className="platform-cards">{platformOrder.map((id) => <div key={id}><div><b>{project.platforms[id].name}</b><span>{id === "mobile" ? "Base mobile-first" : "Hereda de Mobile hasta crear overrides"}</span></div><Switch checked={project.platforms[id].enabled} disabled={id === "mobile"} onCheckedChange={(checked) => setPlatform(id, checked)} ariaLabel={`${project.platforms[id].enabled ? "Desactivar" : "Activar"} ${project.platforms[id].name}`} /></div>)}</div></Card></div>;
}

function paletteDependencies(project: DesignSystemProject, paletteName: string) {
  const prefix = `${paletteName}.`;
  const semantic = project.semanticTokens.flatMap((token) => {
    const references = [
      { scope: "Valor base", reference: token.defaultRef },
      ...Object.entries(token.themeRefs).map(([themeId, reference]) => ({ scope: `Modo ${project.themes.find((theme) => theme.id === themeId)?.name || themeId}`, reference })),
      ...Object.entries(token.platformRefs).map(([platformId, reference]) => ({ scope: `Plataforma ${project.platforms[platformId as PlatformId]?.name || platformId}`, reference })),
    ];
    return references.filter(({ reference }) => reference?.split("@")[0].startsWith(prefix)).map(({ scope, reference }) => ({ id: token.id, label: semanticRoles[token.id] || token.name, scope, reference }));
  });
  const semanticIds = new Set(semantic.map((item) => item.id));
  const components = project.componentTokens.filter((token) => [token.reference, ...Object.values(token.platformRefs)].some((reference) => reference?.startsWith("semantic:") && semanticIds.has(reference.slice(9))));
  return { semantic, components };
}

function ColorView({ project, update }: { project: DesignSystemProject; update: (recipe: (current: DesignSystemProject) => DesignSystemProject) => void }) {
  const [name, setName] = useState("Nueva paleta");
  const [base, setBase] = useState("#6D28D9");
  const [createMode, setCreateMode] = useState<"generator" | "presets" | "manual">("generator");
  const [manualName, setManualName] = useState("Paleta manual");
  const [manualTones, setManualTones] = useState([{ id: uid(), step: "100", color: "#F4F4F5" }, { id: uid(), step: "500", color: "#71717A" }, { id: uid(), step: "900", color: "#18181B" }]);
  const [deleteTarget, setDeleteTarget] = useState<string>();
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryFilter, setLibraryFilter] = useState("all");
  const uniqueName = (current: DesignSystemProject, requested: string) => { const clean = requested.trim() || "Paleta"; let candidate = clean; let suffix = 2; while (current.foundations.colors.some((palette) => palette.name.toLowerCase() === candidate.toLowerCase())) candidate = `${clean} ${suffix++}`; return candidate; };
  const add = () => update((current) => { const palette = makePalette(uniqueName(current, name), base); return { ...current, foundations: { ...current.foundations, colors: [...current.foundations.colors, palette] } }; });
  const addPreset = (presetId: string) => update((current) => { const preset = colorPresets.find((item) => item.id === presetId); if (!preset) return current; const palette = paletteFromPreset(preset); palette.name = uniqueName(current, palette.name); return { ...current, foundations: { ...current.foundations, colors: [...current.foundations.colors, palette] } }; });
  const addLibrary = (libraryId: string) => update((current) => {
    const library = colorLibraries.find((item) => item.id === libraryId);
    if (!library) return current;
    const usedNames = new Set(current.foundations.colors.map((palette) => palette.name.toLowerCase()));
    const additions = library.presets.map((preset) => {
      const next = paletteFromPreset(preset);
      const baseName = next.name;
      let candidate = baseName;
      let suffix = 2;
      while (usedNames.has(candidate.toLowerCase())) candidate = `${baseName} ${suffix++}`;
      next.name = candidate;
      usedNames.add(candidate.toLowerCase());
      return next;
    });
    return { ...current, foundations: { ...current.foundations, colors: [...current.foundations.colors, ...additions] } };
  });
  const addManual = () => update((current) => { const scale = Object.fromEntries(manualTones.filter((tone) => tone.step.trim() && /^#[0-9a-f]{6}$/i.test(tone.color)).map((tone) => [tone.step.trim(), tone.color])); if (!Object.keys(scale).length) return current; const palette = makeManualPalette(uniqueName(current, manualName), scale); return { ...current, foundations: { ...current.foundations, colors: [...current.foundations.colors, palette] } }; });
  const removePalette = (paletteId: string) => { update((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.filter((palette) => palette.id !== paletteId) } })); setDeleteTarget(undefined); };
  const addTone = (paletteId: string) => update((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((palette) => { if (palette.id !== paletteId) return palette; const keys = Object.keys(palette.scale).map(Number).filter(Number.isFinite); let step = Math.max(...keys, 0) + 100; while (palette.scale[String(step)]) step += 50; return { ...palette, scale: { ...palette.scale, [String(step)]: palette.base }, manualSteps: [...palette.manualSteps, String(step)] }; }) } }));
  const visibleLibraries = useMemo(() => { const query = libraryQuery.trim().toLowerCase(); return colorLibraries.map((library) => ({ ...library, presets: library.presets.filter((preset) => !query || `${library.name} ${preset.name} ${preset.description}`.toLowerCase().includes(query)) })).filter((library) => (libraryFilter === "all" || library.id === libraryFilter) && library.presets.length); }, [libraryFilter, libraryQuery]);
  return <div className="view-stack">
    <SectionHeading title="Color" description="Paletas primitivas sin intención de uso. Creá escalas generadas, importá referencias conocidas o definí tonos manualmente." />
    <Card className="color-create-card"><SectionHeading level={2} title="Agregar paleta" description="Elegí el método que mejor se adapte al punto de partida. Todo lo agregado queda editable como foundation del proyecto." /><Tabs value={createMode} onValueChange={(value) => setCreateMode(value as typeof createMode)} ariaLabel="Método para crear paleta" tabs={[{ value: "generator", label: "Generador" }, { value: "presets", label: "Librerías" }, { value: "manual", label: "Manual" }]} />
      {createMode === "generator" ? <div className="palette-create"><Input label="Nombre de la paleta" value={name} onChange={(event) => setName(event.target.value)} /><label className="color-field"><span>Color base</span><span><input aria-label="Color base" type="color" value={base} onChange={(event) => setBase(event.target.value)} /><code>{base.toUpperCase()}</code></span></label><div><span>Luminosidad perceptual</span><b>{Math.round(relativeLuminance(base) * 100)}%</b></div><Button variant="primary" onClick={add}>Generar escala</Button></div> : null}
      {createMode === "presets" ? <div className="color-library-browser"><div className="color-library-toolbar"><Input label="Buscar paleta" placeholder="Ej. azul, neutral, success…" value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} /><Select label="Biblioteca" value={libraryFilter} onValueChange={setLibraryFilter} options={[{ value: "all", label: `Todas · ${colorPresets.length} paletas` }, ...colorLibraries.map((library) => ({ value: library.id, label: `${library.name} · ${library.presets.length}` }))]} /></div><p className="color-library-note">Las colecciones externas se importan como foundations editables. La intención semántica se asigna después, dentro de Sistema.</p><div className="color-library-list">{visibleLibraries.map((library, index) => <details key={library.id} className="color-library-group" open={Boolean(libraryQuery) || libraryFilter !== "all" || index === 0}><summary><span><b>{library.name}</b><small>{library.description}</small></span><strong>{library.presets.length} {library.presets.length === 1 ? "paleta" : "paletas"}</strong></summary><div className="color-library-group-actions"><a href={library.sourceUrl} target="_blank" rel="noreferrer">Consultar fuente oficial</a><Button size="sm" onClick={() => addLibrary(library.id)}>Agregar colección</Button></div><div className="palette-preset-grid">{library.presets.map((preset) => <article key={preset.id}><div className="palette-preset-swatches">{Object.values(preset.scale).slice(0, 9).map((color, swatchIndex) => <i key={`${color}-${swatchIndex}`} style={{ background: color }} />)}</div><div className="palette-preset-copy"><h3>{preset.name}</h3><p>{Object.keys(preset.scale).length} tonos · {preset.description}</p></div><div className="palette-preset-actions"><span>{preset.base}</span><Button onClick={() => addPreset(preset.id)}>Agregar</Button></div></article>)}</div></details>)}{!visibleLibraries.length ? <Alert tone="info" title="Sin coincidencias">Probá otro nombre de color o elegí todas las bibliotecas.</Alert> : null}</div></div> : null}
      {createMode === "manual" ? <div className="manual-palette-builder"><div className="manual-palette-head"><Input label="Nombre de la paleta" value={manualName} onChange={(event) => setManualName(event.target.value)} /><Button onClick={() => setManualTones((tones) => [...tones, { id: uid(), step: String((Math.max(...tones.map((tone) => Number(tone.step) || 0), 0) || 0) + 100), color: "#71717A" }])}>Agregar tono</Button></div><div className="manual-tone-list">{manualTones.map((tone) => <div key={tone.id} className="manual-tone-row"><Input label="Nivel" value={tone.step} onChange={(event) => setManualTones((tones) => tones.map((item) => item.id === tone.id ? { ...item, step: event.target.value } : item))} /><label className="color-field"><span>Color</span><span><input aria-label={`Color del nivel ${tone.step}`} type="color" value={tone.color} onChange={(event) => setManualTones((tones) => tones.map((item) => item.id === tone.id ? { ...item, color: event.target.value.toUpperCase() } : item))} /><code>{tone.color}</code></span></label><IconButton label={`Eliminar nivel ${tone.step}`} disabled={manualTones.length === 1} onClick={() => setManualTones((tones) => tones.filter((item) => item.id !== tone.id))}><X /></IconButton></div>)}</div><Button variant="primary" onClick={addManual}>Crear paleta manual</Button></div> : null}
    </Card>
    {project.foundations.colors.map((palette) => {
      const steps = Object.keys(palette.scale).sort((a, b) => Number(a) - Number(b));
      const dependencies = paletteDependencies(project, palette.name);
      const usage = dependencies.semantic.length;
      const regenerate = (anchor: number, range: number) => update((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((item) => item.id === palette.id ? { ...item, anchorStep: anchor, range, scale: { ...item.scale, ...generateColorScale(item.base, anchor, range, Object.fromEntries(item.manualSteps.map((step) => [step, item.scale[step]]))) } } : item) } }));
      return <Card key={palette.id} className="palette-card-v4"><div className="palette-title"><div><h2>{palette.name}</h2><p>{steps.length} tonos · base {palette.base} · ancla {palette.anchorStep}{palette.origin ? ` · ${palette.origin}` : ""} · {usage ? `${usage} referencias activas` : "sin referencias"}</p></div><div className="palette-actions"><label><span>Contraste {Math.round(palette.range * 100)}%</span><input type="range" min="35" max="95" value={Math.round(palette.range * 100)} onChange={(event) => regenerate(palette.anchorStep, Number(event.target.value) / 100)} /></label><Select label="Mover ancla" value={String(palette.anchorStep)} onValueChange={(value) => regenerate(Number(value), palette.range)} options={steps.map((step) => ({ value: step, label: step }))} /><Button onClick={() => addTone(palette.id)}>Agregar tono</Button><IconButton className="palette-delete-trigger" label={`Eliminar paleta ${palette.name}`} onClick={() => setDeleteTarget(palette.id)}><Trash2 /></IconButton></div></div>
        {deleteTarget === palette.id ? <Alert tone={usage ? "warning" : "danger"} title={`Eliminar paleta “${palette.name}”`} action={<div className="palette-delete-panel">{usage ? <div className="palette-delete-impact"><details open><summary>{dependencies.semantic.length} asignaciones semánticas quedarían sin foundation</summary><ul>{dependencies.semantic.map((item, index) => <li key={`${item.id}-${item.scope}-${index}`}><b>{item.label}</b><span>{item.scope} · {item.reference}</span></li>)}</ul></details>{dependencies.components.length ? <details><summary>{dependencies.components.length} tokens de componente perderían su valor resuelto</summary><ul>{dependencies.components.map((token) => <li key={token.id}><b>{token.name}</b><span>{token.component} · {token.reference}</span></li>)}</ul></details> : null}</div> : null}<div className="palette-delete-actions"><Button onClick={() => setDeleteTarget(undefined)}>Cancelar</Button><Button variant="danger" onClick={() => removePalette(palette.id)}>Eliminar</Button></div></div>}>{usage ? "La paleta está en uso. Revisá el impacto antes de confirmar; Salud mostrará las referencias pendientes hasta que sean reasignadas." : "Esta paleta no tiene referencias activas y puede eliminarse sin romper asignaciones."}</Alert> : null}
        <div className="palette-scale-v4">{steps.map((step) => <label key={step}><span style={{ background: palette.scale[step] }}><input aria-label={`Color ${palette.name} ${step}`} type="color" value={palette.scale[step].slice(0, 7)} onChange={(event) => update((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((item) => item.id === palette.id ? { ...item, scale: { ...item.scale, [step]: event.target.value.toUpperCase() }, manualSteps: [...new Set([...item.manualSteps, step])] } : item) } }))} /></span><div><b>{step}</b><IconButton label={`Eliminar tono ${step}`} disabled={steps.length <= 2} onClick={() => update((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((item) => { if (item.id !== palette.id) return item; const scale = { ...item.scale }; delete scale[step]; return { ...item, scale, manualSteps: item.manualSteps.filter((manual) => manual !== step) }; }) } }))}><X /></IconButton></div><input value={palette.scale[step]} onChange={(event) => update((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((item) => item.id === palette.id ? { ...item, scale: { ...item.scale, [step]: event.target.value }, manualSteps: [...new Set([...item.manualSteps, step])] } : item) } }))} /></label>)}</div>
      </Card>;
    })}
    <FoundationPreview project={project} focus="color" />
  </div>;
}

function TypographyView({ project, update }: { project: DesignSystemProject; update: (recipe: (current: DesignSystemProject) => DesignSystemProject) => void }) {
  const [custom, setCustom] = useState("");
  const primaryFamily = primaryTypographyFamily(project.foundations.typography);
  const [candidate, setCandidate] = useState(primaryFamily?.family || "Inter");
  const options = fontOptions.map((font) => ({ value: font.family, label: font.family, meta: font.source === "google" ? "Google Fonts" : "Común" }));
  const addFamily = (family: string, forceCustom = false) => {
    const clean = family.trim();
    if (!clean) return;
    const known = fontOptions.find((font) => font.family === clean);
    update((current) => {
      const typography = current.foundations.typography;
      if (typography.families.some((item) => item.family.toLowerCase() === clean.toLowerCase())) return current;
      const nextFamily = makeTypographyFamily(clean, forceCustom ? "custom" : known?.source || "custom", known?.weights || [400], known?.styles || ["Normal"]);
      return { ...current, foundations: { ...current.foundations, typography: { ...typography, families: [...typography.families, nextFamily] } } };
    });
    setCustom("");
  };
  const setPrimary = (familyId: string) => update((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, primaryFamilyId: familyId } } }));
  const removeFamily = (familyId: string) => update((current) => {
    const typography = current.foundations.typography;
    const inUse = typography.levels.some((level) => level.familyId === familyId);
    if (inUse || typography.families.length === 1) return current;
    const families = typography.families.filter((family) => family.id !== familyId);
    return { ...current, foundations: { ...current.foundations, typography: { ...typography, families, primaryFamilyId: typography.primaryFamilyId === familyId ? families[0].id : typography.primaryFamilyId } } };
  });
  const editLevel = (id: string, patch: Partial<(typeof project.foundations.typography.levels)[number]>) => update((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, levels: current.foundations.typography.levels.map((level) => level.id === id ? { ...level, ...patch } : level) } } }));
  const addLevel = () => update((current) => { const last = current.foundations.typography.levels.at(-1); const next = { id: uid(), name: `Estilo ${current.foundations.typography.levels.length + 1}`, familyId: last?.familyId || current.foundations.typography.primaryFamilyId, size: Math.round(((last?.size || 16) * current.foundations.typography.ratio) * 10) / 10, weight: last?.weight || 600, lineHeight: last?.lineHeight || 1.2, tracking: last?.tracking || 0 }; return { ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, levels: [...current.foundations.typography.levels, next] } } }; });
  const regenerate = (ratio: number) => update((current) => {
    const typography = current.foundations.typography;
    const generated = generateTypeLevels(typography.base.size, ratio, typography.primaryFamilyId).map((level) => {
      const previous = typography.levels.find((item) => item.name.toLowerCase() === level.name.toLowerCase());
      return previous ? { ...level, id: previous.id, familyId: previous.familyId } : level;
    });
    const known = ratioOptions.find((item) => item.value === ratio);
    return { ...current, foundations: { ...current.foundations, typography: { ...typography, ratio, ratioName: known?.name || "Personalizada", levels: generated } } };
  });
  return <div className="view-stack">
    <SectionHeading title="Tipografía" description="Combiná familias por función, definí una base y construí estilos reutilizables sin perder el vínculo con sus foundations." />
    <Card><SectionHeading level={2} title="Familias del proyecto" description="Agregá las familias que el sistema necesita y elegí cuál funciona como punto de partida. Cada estilo puede asignar una familia distinta." /><div className="font-add-row"><Combobox label="Buscar familia" value={candidate} onValueChange={setCandidate} options={options} renderOption={(option) => <span className="font-option"><span><b>{option.label}</b><small>{option.meta}</small></span><em style={{ fontFamily: `'${option.label}', sans-serif` }}>El veloz murciélago hindú</em></span>} /><Button onClick={() => addFamily(candidate)}>Agregar familia</Button></div><div className="custom-font-row"><Input label="Familia personalizada" value={custom} placeholder="Ej. Marca Sans" onChange={(event) => setCustom(event.target.value)} help="Se conserva aunque no figure en la lista." /><div className="custom-font-action"><span aria-hidden="true">Acción</span><Button onClick={() => addFamily(custom, true)}>Agregar personalizada</Button></div></div><div className="font-family-library">{project.foundations.typography.families.map((family) => { const usage = project.foundations.typography.levels.filter((level) => level.familyId === family.id).length; const isPrimary = family.id === project.foundations.typography.primaryFamilyId; return <article key={family.id} className="font-family-card"><div><span className="font-family-meta">{family.source === "google" ? "Google Fonts" : family.source === "system" ? "Común" : "Personalizada"}</span><h3 style={{ fontFamily: `'${family.family}', sans-serif` }}>{family.family}</h3><p style={{ fontFamily: `'${family.family}', sans-serif` }}>Diseñar con una voz tipográfica coherente.</p><small>{usage ? `${usage} ${usage === 1 ? "estilo asignado" : "estilos asignados"}` : "Sin estilos asignados"}</small></div><div className="font-family-actions">{isPrimary ? <span className="font-primary-label">Familia principal</span> : <Button variant="quiet" onClick={() => setPrimary(family.id)}>Usar como principal</Button>}<IconButton label={`Eliminar ${family.family}`} disabled={usage > 0 || project.foundations.typography.families.length === 1} onClick={() => removeFamily(family.id)}><Trash2 /></IconButton></div></article>; })}</div></Card>
    <Card><SectionHeading level={2} title="Estilo base y escala modular" description="Partí de un cuerpo legible y ajustá la proporción según el carácter del producto. Regenerar conserva las familias ya asignadas por rol." /><div className="type-controls"><Input label="Tamaño base" type="number" value={project.foundations.typography.base.size} suffix="px" onChange={(event) => update((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, base: { ...current.foundations.typography.base, size: Number(event.target.value) } } } }))} /><Select label="Proporción" value={String(project.foundations.typography.ratio)} onValueChange={(value) => regenerate(Number(value))} options={ratioOptions.map((item) => ({ value: String(item.value), label: item.name, meta: `${item.value}×` }))} /><Button variant="primary" onClick={() => regenerate(project.foundations.typography.ratio)}>Regenerar escala</Button></div></Card>
    <Card><SectionHeading level={2} title="Estilos tipográficos" description={`${project.foundations.typography.levels.length} estilos editables. La familia se asigna por estilo y se exporta como rol semántico.`} action={<Button onClick={addLevel}>Agregar estilo</Button>} /><div className="type-level-editor">{project.foundations.typography.levels.map((level) => { const family = typographyFamilyForLevel(project.foundations.typography, level); return <article key={level.id}><div className="type-level-fields"><Input label="Nombre" value={level.name} onChange={(event) => editLevel(level.id, { name: event.target.value })} /><Select label="Familia" value={level.familyId} onValueChange={(value) => editLevel(level.id, { familyId: value })} options={project.foundations.typography.families.map((item) => ({ value: item.id, label: item.family, meta: item.source === "google" ? "Google Fonts" : item.source === "system" ? "Común" : "Personalizada" }))} /><Input label="Tamaño" type="number" value={level.size} suffix="px" onChange={(event) => editLevel(level.id, { size: Number(event.target.value) })} /><Input label="Peso" type="number" value={level.weight} onChange={(event) => editLevel(level.id, { weight: Number(event.target.value) })} /><Input label="Interlineado" type="number" step=".05" value={level.lineHeight} onChange={(event) => editLevel(level.id, { lineHeight: Number(event.target.value) })} /><IconButton label={`Eliminar ${level.name}`} disabled={project.foundations.typography.levels.length === 1} onClick={() => update((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, levels: current.foundations.typography.levels.filter((item) => item.id !== level.id) } } }))}><X /></IconButton></div><p style={{ fontFamily: `'${family?.family || "system-ui"}', sans-serif`, fontSize: Math.min(level.size, 54), fontWeight: level.weight, lineHeight: level.lineHeight }}>Diseñar con una base coherente.</p></article>; })}</div></Card>
    <FoundationPreview project={project} focus="typography" />
  </div>;
}

function LayoutPreview({ project, platform }: { project: DesignSystemProject; platform: PlatformId }) {
  const layout = resolveLayout(project, platform);
  return <div className={`layout-frame-v4 frame-${platform}`}><div className="layout-frame-label"><b>{project.platforms[platform].name}</b><span>{layout.columns} columnas · margen {layout.margin}px · gutter {layout.gutter}px</span></div><div className="layout-device-v4" style={{ "--cols": layout.columns, "--margin": `${Math.min(layout.margin / 2, 28)}px`, "--gutter": `${Math.max(3, Math.min(layout.gutter / 4, 9))}px` } as CSSProperties}><div className="layout-columns-v4">{Array.from({ length: layout.columns }).map((_, index) => <i key={index} />)}</div><div className="layout-content-v4"><span /><span /><span /></div></div></div>;
}

function ScalesView({ project, update, initialPlatform }: { project: DesignSystemProject; update: (recipe: (current: DesignSystemProject) => DesignSystemProject) => void; initialPlatform?: PlatformId }) {
  const enabled = platformOrder.filter((id) => project.platforms[id].enabled);
  const [platform, setPlatform] = useState<PlatformId>(initialPlatform && enabled.includes(initialPlatform) ? initialPlatform : enabled[0] || "mobile");
  const [group, setGroup] = useState<ScaleGroupKey>("spacing");
  const layout = resolveLayout(project, platform);
  const scale = resolveResponsiveScale(project, platform);
  const setLayout = (key: keyof typeof layout, value: number | boolean) => update((current) => platform === "mobile"
    ? { ...current, foundations: { ...current.foundations, layoutBase: { ...current.foundations.layoutBase, [key]: value } } }
    : { ...current, platforms: { ...current.platforms, [platform]: { ...current.platforms[platform], overrides: { ...current.platforms[platform].overrides, [key]: value } } } });
  const applyPreset = (value: string) => { if (value === "manual") return; const preset = value === "conservative" ? { typography: 1, spacing: 1, dimensions: 1 } : value === "balanced" ? { typography: 1.05, spacing: 1.1, dimensions: 1 } : { typography: 1.125, spacing: 1.2, dimensions: 1.05 }; update((current) => ({ ...current, platforms: { ...current.platforms, [platform]: { ...current.platforms[platform], scaleOverrides: preset } } })); };
  const updateScale = (key: "typography" | "spacing" | "dimensions", value: number) => update((current) => ({ ...current, platforms: { ...current.platforms, [platform]: { ...current.platforms[platform], scaleOverrides: { ...current.platforms[platform].scaleOverrides, [key]: value } } } }));
  const setReviewState = (proposalPending: boolean) => update((current) => ({ ...current, platforms: { ...current.platforms, [platform]: { ...current.platforms[platform], proposalPending } } }));
  return <div className="view-stack">
    <SectionHeading title="Escalas, layout y grilla" description="Primero decidí herencia y multiplicadores; después ajustá la grilla y los tokens espaciales." />
    <Card><SectionHeading level={2} title="Herencia responsiva" description="Cada plataforma parte de Mobile y guarda solo los overrides necesarios." /><div className="layout-decision-grid"><Select label="Plataforma" value={platform} onValueChange={(value) => setPlatform(value as PlatformId)} options={enabled.map((id) => ({ value: id, label: project.platforms[id].name, meta: id === "mobile" ? "Base" : "Hereda de Mobile" }))} /><Select label="Preset contextual" value="manual" onValueChange={applyPreset} options={scalePresetOptions} /><Input label="Tipografía" type="number" step=".025" value={scale.typography} suffix="×" onChange={(event) => updateScale("typography", Number(event.target.value))} /><Input label="Espaciado" type="number" step=".05" value={scale.spacing} suffix="×" onChange={(event) => updateScale("spacing", Number(event.target.value))} /><Input label="Dimensiones" type="number" step=".05" value={scale.dimensions} suffix="×" onChange={(event) => updateScale("dimensions", Number(event.target.value))} /></div>{platform !== "mobile" ? <div className={`platform-review-v4 ${project.platforms[platform].proposalPending ? "is-pending" : "is-valid"}`}><div><Badge tone={project.platforms[platform].proposalPending ? "warning" : "success"}>{project.platforms[platform].proposalPending ? "Revisión pendiente" : "Layout validado"}</Badge><strong>{project.platforms[platform].name}</strong><p>{project.platforms[platform].proposalPending ? "Revisá los multiplicadores, la grilla y el frame. Los cambios se guardan, pero la advertencia solo se resuelve al confirmar esta revisión." : "La propuesta fue revisada. Podés reabrirla si necesitás volver a evaluar sus overrides."}</p></div><Button variant={project.platforms[platform].proposalPending ? "primary" : "quiet"} onClick={() => setReviewState(!project.platforms[platform].proposalPending)}>{project.platforms[platform].proposalPending ? `Marcar ${project.platforms[platform].name} como validada` : "Reabrir revisión"}</Button></div> : null}</Card>
    <Card><SectionHeading level={2} title="Configuración de layout" description="Columnas, márgenes y gutters definen la estructura. El ancho máximo evita que pantallas amplias escalen sin control." /><div className="layout-inputs-v4"><Input label="Columnas" type="number" value={layout.columns} onChange={(event) => setLayout("columns", Number(event.target.value))} /><Input label="Margen" type="number" value={layout.margin} suffix="px" onChange={(event) => setLayout("margin", Number(event.target.value))} /><Input label="Separación entre columnas" type="number" value={layout.gutter} suffix="px" onChange={(event) => setLayout("gutter", Number(event.target.value))} /><Input label="Ancho máximo de contenido" type="number" value={layout.maxWidth} suffix="px" onChange={(event) => setLayout("maxWidth", Number(event.target.value))} /><Input label="Punto de quiebre" type="number" value={layout.breakpoint} suffix="px" onChange={(event) => setLayout("breakpoint", Number(event.target.value))} /><div className="baseline-field"><span className="ui-field-label">Grilla de línea base</span><Switch checked={layout.baselineEnabled} onCheckedChange={(checked) => setLayout("baselineEnabled", checked)} ariaLabel="Grilla de línea base" /><small>Alinea el ritmo vertical del contenido en múltiplos regulares.</small></div></div></Card>
    <Card><SectionHeading level={2} title="Preview de layout" description="Frames proporcionales con columnas superpuestas. Mobile se representa como teléfono vertical." /><div className="layout-previews-v4">{enabled.filter((id) => id !== "mobile-landscape").map((id) => <LayoutPreview key={id} project={project} platform={id} />)}</div></Card>
    <Card className="primitive-scales-card"><SectionHeading level={2} title="Escalas primitivas" description="Valores reutilizables para espaciado, dimensiones, radios, bordes, sombras y opacidad." /><Tabs value={group} onValueChange={(value) => setGroup(value as ScaleGroupKey)} ariaLabel="Grupos de escala" tabs={(Object.keys(scaleLabels) as ScaleGroupKey[]).map((id) => ({ value: id, label: scaleLabels[id] }))} /><div className="scale-list-v4">{project.foundations.scales[group].map((token) => <div key={token.id}><Input label="Nombre" value={token.name} onChange={(event) => update((current) => ({ ...current, foundations: { ...current.foundations, scales: { ...current.foundations.scales, [group]: current.foundations.scales[group].map((item) => item.id === token.id ? { ...item, name: event.target.value } : item) } } }))} /><Input label="Valor" value={token.value.replace("px", "")} suffix={token.value.includes("px") ? "px" : undefined} onChange={(event) => update((current) => ({ ...current, foundations: { ...current.foundations, scales: { ...current.foundations.scales, [group]: current.foundations.scales[group].map((item) => item.id === token.id ? { ...item, value: `${event.target.value}${token.value.includes("px") ? "px" : ""}` } : item) } } }))} /></div>)}</div></Card>
    <FoundationPreview project={project} focus="layout" />
    <Card><SectionHeading level={2} title="Foundations personalizados" description="Sección avanzada y opcional para capas, iconos, motion u otras reglas del cliente no cubiertas por las categorías principales." /><Button onClick={() => update((current) => ({ ...current, foundations: { ...current.foundations, customFoundations: [...current.foundations.customFoundations, { id: uid(), name: "Nueva foundation", description: "Necesidad específica del cliente", tokens: [] }] } }))}>Agregar foundation personalizada</Button></Card>
  </div>;
}

function TokensView({ project, update, selected, layer }: { project: DesignSystemProject; update: (recipe: (current: DesignSystemProject) => DesignSystemProject) => void; selected: string; layer: "semantic" | "component" }) {
  const [query, setQuery] = useState(selected);
  const [theme, setTheme] = useState(project.themes[0]?.id || "light");
  const [platform, setPlatform] = useState<PlatformId>(platformOrder.find((id) => project.platforms[id].enabled) || "mobile");
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(() => new Set());
  const refs = allColorReferences(project);
  const enabled = platformOrder.filter((id) => project.platforms[id].enabled);
  const semanticRows = project.semanticTokens.filter((token) => `${semanticRoles[token.id] || token.description} ${token.name} ${token.category}`.toLowerCase().includes(query.toLowerCase()));
  const componentRows = project.componentTokens.filter((token) => `${token.name} ${token.component} ${token.description}`.toLowerCase().includes(query.toLowerCase()));
  const semanticOptions = project.semanticTokens.map((token) => ({ value: `semantic:${token.id}`, label: token.name, meta: token.category }));
  const primitiveOptions = (Object.keys(project.foundations.scales) as ScaleGroupKey[]).flatMap((group) => project.foundations.scales[group].map((token) => ({ value: `primitive:${group}.${token.name}`, label: `${group}.${token.name}`, meta: "Foundation" })));
  const componentGroups = Array.from(componentRows.reduce((groups, token) => {
    const key = token.component.trim().toLocaleLowerCase();
    const current = groups.get(key) || { label: token.component.charAt(0).toUpperCase() + token.component.slice(1), tokens: [] as typeof componentRows };
    current.tokens.push(token);
    groups.set(key, current);
    return groups;
  }, new Map<string, { label: string; tokens: typeof componentRows }>()));
  const toggleComponent = (component: string) => setExpandedComponents((current) => {
    const next = new Set(current);
    if (next.has(component)) next.delete(component); else next.add(component);
    return next;
  });
  const addComponentToken = () => {
    setQuery("");
    setExpandedComponents((current) => new Set([...current, "nuevo componente"]));
    update((current) => ({ ...current, componentTokens: [...current.componentTokens, { id: uid(), name: "component.new.token", component: "Nuevo componente", reference: semanticOptions[0]?.value || primitiveOptions[0]?.value || "", platformRefs: {}, description: "Nueva decisión de componente" }] }));
  };
  const componentTable = (tokens: typeof componentRows) => <Table className="component-token-table"><thead><tr><th>Rol</th><th>Identificador técnico</th><th>Foundation o referencia</th><th>Valor resuelto</th><th>Modo</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{tokens.map((token) => { const resolved = resolveComponent(project, token.id, theme, platform); return <tr key={token.id} className={query && token.name.includes(query) ? "selected-row" : ""}><td><b>{token.description}</b><small>{token.component}</small></td><td><Input value={token.name} aria-label="Identificador técnico" onChange={(event) => update((current) => ({ ...current, componentTokens: current.componentTokens.map((item) => item.id === token.id ? { ...item, name: event.target.value } : item) }))} /></td><td><Select value={token.reference} onValueChange={(value) => update((current) => ({ ...current, componentTokens: current.componentTokens.map((item) => item.id === token.id ? { ...item, reference: value } : item) }))} options={[...semanticOptions, ...primitiveOptions]} /></td><td><span className="resolved-value"><i style={{ background: resolved }} /><code>{resolved || "Pendiente"}</code></span></td><td>{project.themes.find((item) => item.id === theme)?.name}</td><td><Badge tone={resolved ? "success" : "warning"}>{resolved ? "Conectado" : "Pendiente"}</Badge></td><td><IconButton label={`Eliminar ${token.name}`} onClick={() => update((current) => ({ ...current, componentTokens: current.componentTokens.filter((item) => item.id !== token.id) }))}><X /></IconButton></td></tr>; })}</tbody></Table>;
  return <div className="view-stack">
    <SectionHeading title={layer === "semantic" ? "Tokens semánticos" : "Tokens de componente"} description={layer === "semantic" ? "Roles transversales conectados a foundations nombradas." : "Decisiones estables por componente, editables y conectadas a semántica por defecto."} action={layer === "component" ? <Button onClick={addComponentToken}>Agregar token</Button> : undefined} />
    <Card className="token-toolbar-v4"><Input label="Buscar por rol, identificador, categoría o consumidor" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. error, input, surface…" /><Select label="Modo" value={theme} onValueChange={setTheme} options={project.themes.map((item) => ({ value: item.id, label: item.name }))} /><Select label="Plataforma" value={platform} onValueChange={(value) => setPlatform(value as PlatformId)} options={enabled.map((id) => ({ value: id, label: project.platforms[id].name }))} /></Card>
    {!refs.length && layer === "semantic" ? <Alert tone="warning" title="Primero creá una foundation de color">Los roles semánticos no aceptan valores hexadecimales inline.</Alert> : null}
    {layer === "semantic" ? <Table><thead><tr><th>Rol</th><th>Identificador técnico</th><th>Foundation o referencia</th><th>Valor resuelto</th><th>Modo</th><th>Estado</th></tr></thead><tbody>{semanticRows.map((token) => { const reference = token.platformRefs[platform] || token.themeRefs[theme] || token.defaultRef; const resolved = resolveSemantic(project, token.id, theme, platform); return <tr key={token.id} className={query && (token.name.includes(query) || token.id.includes(query)) ? "selected-row" : ""}><td><b>{semanticRoles[token.id] || token.description}</b><small>{token.category}</small></td><td><code>{token.name}</code></td><td><Select value={reference} onValueChange={(value) => update((current) => ({ ...current, semanticTokens: current.semanticTokens.map((item) => item.id === token.id ? { ...item, defaultRef: value } : item) }))} options={refs.map((ref) => ({ value: ref, label: ref }))} /></td><td><span className="resolved-value"><i style={{ background: resolved }} /><code>{resolved || "Pendiente"}</code></span></td><td>{project.themes.find((item) => item.id === theme)?.name}</td><td><Badge tone={resolved ? "success" : "warning"}>{resolved ? "Asignado" : "Pendiente"}</Badge></td></tr>; })}</tbody></Table> : <div className="component-token-groups"><div className="component-token-actions"><span>{componentGroups.length} componentes · {componentRows.length} tokens</span><div><Button size="sm" variant="quiet" onClick={() => setExpandedComponents(new Set(componentGroups.map(([key]) => key)))}>Desplegar todos</Button><Button size="sm" variant="quiet" onClick={() => setExpandedComponents(new Set())}>Contraer todos</Button></div></div>{componentGroups.map(([key, group]) => { const isExpanded = Boolean(query.trim()) || expandedComponents.has(key); return <section className={`component-token-group ${isExpanded ? "is-open" : ""}`} key={key}><button type="button" className="component-token-group-trigger" aria-expanded={isExpanded} onClick={() => toggleComponent(key)}><span><b>{group.label}</b><small>{group.tokens.length} {group.tokens.length === 1 ? "token" : "tokens"}</small></span><ChevronDownIcon aria-hidden="true" /></button>{isExpanded ? componentTable(group.tokens) : null}</section>; })}{!componentGroups.length ? <Alert tone="info" title="Sin resultados">No hay tokens de componente que coincidan con la búsqueda.</Alert> : null}</div>}
  </div>;
}

function ExportPanel({ project, open, onClose, notice }: { project: DesignSystemProject; open: boolean; onClose: () => void; notice: (message: string) => void }) {
  const [categories, setCategories] = useState<ExportCategory[]>(exportOptions.map((item) => item.value));
  const [format, setFormat] = useState("json");
  const [theme, setTheme] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [figmaTarget, setFigmaTarget] = useState("");
  const [figmaConflictPolicy, setFigmaConflictPolicy] = useState<FigmaConflictPolicy>("review");
  const [figmaDryRun, setFigmaDryRun] = useState(true);
  const snapshot = () => { const clone = structuredClone(project); if (theme !== "all") clone.themes = clone.themes.filter((item) => item.id === theme); if (platform !== "all") platformOrder.forEach((id) => { clone.platforms[id].enabled = id === platform; }); return clone; };
  const exportTokens = () => {
    const scoped = snapshot();
    if (format === "figma-mcp") {
      const bundle = buildFigmaMcpPackage(scoped, { categories, targetFileUrl: figmaTarget, conflictPolicy: figmaConflictPolicy, dryRun: figmaDryRun });
      downloadText(projectFilename(project, "-figma-mcp-package.json"), JSON.stringify(bundle, null, 2));
      notice(bundle.validation.status === "blocked" ? "Paquete MCP generado con bloqueantes para revisar" : "Paquete para GPT + Figma MCP generado");
      return;
    }
    downloadText(projectFilename(project, format === "json" ? "-tokens.json" : "-tokens.css"), format === "json" ? JSON.stringify(buildTokenSubset(scoped, categories), null, 2) : buildCss(scoped, categories), format === "json" ? "application/json" : "text/css");
    notice("Exportación generada");
  };
  return <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} title="Configurar exportación" description="Elegí contenido, destino y alcance. Podés cerrar y volver para crear exportaciones secuenciales." variant="drawer" className="export-panel-v4"><Card><SectionHeading level={2} title="Contenido" /><div className="export-checks">{exportOptions.map((option) => <Checkbox key={option.value} checked={categories.includes(option.value)} onCheckedChange={(checked) => setCategories((current) => checked ? [...current, option.value] : current.filter((item) => item !== option.value))} label={option.label} />)}</div></Card><Card><SectionHeading level={2} title="Destino y alcance" /><RadioGroup value={format} onValueChange={setFormat} options={[{ value: "json", label: "JSON para Figma y desarrollo" }, { value: "css", label: "Variables CSS" }, { value: "figma-mcp", label: "Paquete para GPT + Figma MCP", meta: "Manifiesto, validación y plan de ejecución en un archivo" }]} /><div className="export-format-stack">{format === "figma-mcp" ? <div className="figma-mcp-config"><Alert tone="info" title="Ejecución asistida, no automática">El paquete obliga al agente a inspeccionar el archivo, mostrar un dry-run y confirmar conflictos antes de escribir. La capacidad de escritura depende del cliente MCP y de tus permisos en Figma.</Alert><Input label="Archivo Figma Design (opcional)" value={figmaTarget} onChange={(event) => setFigmaTarget(event.target.value)} placeholder="https://www.figma.com/design/…" help="Podés dejarlo vacío y confirmarlo en el chat antes de ejecutar." /><Select label="Si una variable ya existe" value={figmaConflictPolicy} onValueChange={(value) => setFigmaConflictPolicy(value as FigmaConflictPolicy)} options={[{ value: "review", label: "Revisar antes de cambiar", meta: "Recomendado" }, { value: "update-by-name", label: "Actualizar por nombre" }, { value: "skip-existing", label: "Omitir existentes" }]} /><Checkbox checked={figmaDryRun} onCheckedChange={setFigmaDryRun} label="Solicitar simulación y resumen antes de escribir" /></div> : <div className="form-grid"><Select label="Modo" value={theme} onValueChange={setTheme} options={[{ value: "all", label: "Todos los modos" }, ...project.themes.map((item) => ({ value: item.id, label: item.name }))]} /><Select label="Plataforma" value={platform} onValueChange={setPlatform} options={[{ value: "all", label: "Todas las plataformas" }, ...platformOrder.filter((id) => project.platforms[id].enabled).map((id) => ({ value: id, label: project.platforms[id].name }))]} /></div>}<Button variant="primary" size="lg" disabled={!categories.length} onClick={exportTokens}>{format === "figma-mcp" ? "Descargar paquete MCP" : "Exportar selección"}</Button></div></Card><Card><SectionHeading level={2} title="Otras salidas" description="El archivo editable y el sitio de documentación son salidas separadas." /><div className="export-actions-v4"><Button onClick={() => downloadText(projectFilename(project, ".dslab.json"), JSON.stringify(project, null, 2))}>Descargar proyecto editable</Button><Button onClick={() => downloadText(projectFilename(project, "-docs.html"), buildDocumentation(project), "text/html")}>Descargar documentación HTML</Button></div></Card></Dialog>;
}

export default function Home() {
  const [project, setProject] = useState<DesignSystemProject>(() => createInitialProject());
  const [active, setActive] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [section, setSection] = useState<MainSection>("colors");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<Notice>();
  const [exportOpen, setExportOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState("");
  const [scenarioTarget, setScenarioTarget] = useState("");
  const [scaleTarget, setScaleTarget] = useState<PlatformId>();
  const importRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const navigationRequestedRef = useRef(false);
  const noticeTimerRef = useRef<number | undefined>(undefined);
  const projectTypography = project.foundations.typography;
  useEffect(() => { queueMicrotask(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setProject(migrateProject(JSON.parse(raw))); setTheme(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"); } catch { /* defaults */ } setHydrated(true); }); }, []);
  useEffect(() => { if (!hydrated || !active) return; const timer = window.setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, meta: { ...project.meta, updatedAt: new Date().toISOString() } })), 400); return () => window.clearTimeout(timer); }, [project, hydrated, active]);
  useEffect(() => { if (hydrated) localStorage.setItem(THEME_KEY, theme); document.documentElement.dataset.labTheme = theme; }, [theme, hydrated]);
  useEffect(() => {
    if (!active) return;
    window.scrollTo({ top: 0, behavior: "auto" });
    const sectionLabel: Record<MainSection, string> = { colors: "Color", typography: "Tipografía", scales: "Escalas y layout", semantics: "Tokens semánticos", components: "Tokens de componente", catalog: "Catálogo", scenarios: "Escenarios", health: "Salud del sistema" };
    document.title = `${sectionLabel[section]} · ${project.meta.name} · Laboratorio de Sistemas de Diseño`;
    if (!navigationRequestedRef.current) return;
    navigationRequestedRef.current = false;
    queueMicrotask(() => {
      const heading = mainRef.current?.querySelector("h1");
      if (heading instanceof HTMLElement) {
        heading.tabIndex = -1;
        heading.dataset.programmaticFocus = "true";
        const release = () => { delete heading.dataset.programmaticFocus; heading.removeAttribute("tabindex"); };
        heading.addEventListener("blur", release, { once: true });
        heading.focus({ preventScroll: true });
      }
    });
  }, [section, active, project.meta.name]);
  useEffect(() => {
    if (!active || typeof window === "undefined" || window.innerWidth > 800) return;
    const current = navigationRef.current?.querySelector<HTMLElement>("[aria-current='page']");
    current?.scrollIntoView({ block: "nearest", inline: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [active, section]);
  useEffect(() => {
    const id = "font-family-catalog";
    document.getElementById(id)?.remove();
    if (!active || section !== "typography") return;
    const families = fontOptions.filter((font) => font.source === "google").map((font) => `family=${encodeURIComponent(font.family).replaceAll("%20", "+")}:wght@${font.weights.join(";")}`).join("&");
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
    return () => link.remove();
  }, [active, section]);
  useEffect(() => { const id = "project-google-font"; document.getElementById(id)?.remove(); const googleFamilies = projectTypography.families.filter((family) => family.source === "google"); if (!googleFamilies.length) return; const link = document.createElement("link"); link.id = id; link.rel = "stylesheet"; link.href = `https://fonts.googleapis.com/css2?${googleFamilies.map((family) => `family=${encodeURIComponent(family.family).replaceAll("%20", "+")}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400`).join("&")}&display=swap`; document.head.appendChild(link); return () => link.remove(); }, [projectTypography.families]);
  const health = useMemo(() => analyzeProject(project), [project]);
  const flash = (message: string) => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    setNotice({ message, tone: "success" });
    noticeTimerRef.current = window.setTimeout(() => setNotice(undefined), 2400);
  };
  const showImportError = (message: string) => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    setNotice({ message, tone: "error" });
  };
  const update = (recipe: (current: DesignSystemProject) => DesignSystemProject) => setProject((current) => recipe(current));
  const choose = (kind: "validated" | "blank") => { setProject(kind === "validated" ? createInitialProject() : createBlankProject()); setSetupOpen(true); };
  const navigateTo = (nextSection: MainSection) => { navigationRequestedRef.current = true; setSection(nextSection); };
  const importProject = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { setProject(migrateProject(JSON.parse(String(reader.result)))); setActive(true); flash(`Proyecto “${file.name}” importado correctamente`); } catch { showImportError(`No pudimos leer “${file.name}”. Verificá que sea un archivo de proyecto .json o .dslab.json válido y volvé a elegirlo.`); } }; reader.onerror = () => showImportError(`No pudimos leer “${file.name}”. Comprobá que el archivo esté disponible y volvé a intentarlo.`); reader.readAsText(file); event.target.value = ""; };
  const openTokens = (token: string) => { setSelectedToken(token); navigateTo(project.componentTokens.some((item) => item.name === token || item.id === token) ? "components" : "semantics"); };
  const openFinding = (finding: HealthFinding) => {
    if (finding.section === "scales") { setScaleTarget(finding.platformId); navigateTo("scales"); return; }
    if (finding.section === "catalog") { navigateTo("catalog"); return; }
    if (finding.section === "colors") { navigateTo("colors"); return; }
    openTokens(finding.target || finding.area);
  };
  if (!active && !setupOpen) return <div className={`lab-v4 theme-${theme}`} data-lab-theme={theme}><Starter onChoose={choose} /></div>;
  if (!active && setupOpen) return <div className={`lab-v4 theme-${theme}`} data-lab-theme={theme}><main className="setup-v4"><header><div className="setup-header-start"><BrandMark size={38} /><button type="button" onClick={() => setSetupOpen(false)}>Volver</button></div><span>Paso 2 de 2</span></header><ProjectView project={project} update={update} /><div className="setup-actions"><Button size="lg" onClick={() => setSetupOpen(false)}>Cambiar punto de partida</Button><Button variant="primary" size="lg" onClick={() => { navigationRequestedRef.current = true; setActive(true); setSetupOpen(false); setSection("colors"); }}>Entrar al laboratorio <ArrowRightIcon /></Button></div></main></div>;
  const healthStatus = health.status === "not-evaluated" ? "pending" : health.counts.blocking || health.counts.warning ? "attention" : "ready";
  const renderMain = () => {
    if (section === "colors") return <ColorView project={project} update={update} />;
    if (section === "typography") return <TypographyView project={project} update={update} />;
    if (section === "scales") return <ScalesView key={`scales-${scaleTarget || "default"}`} project={project} update={update} initialPlatform={scaleTarget} />;
    if (section === "semantics") return <TokensView key={`semantic-${selectedToken}`} project={project} update={update} selected={selectedToken} layer="semantic" />;
    if (section === "components") return <TokensView key={`component-${selectedToken}`} project={project} update={update} selected={selectedToken} layer="component" />;
    if (section === "catalog") return <Catalog project={project} onOpenTokens={openTokens} />;
    if (section === "scenarios") return <ScenarioExplorer key={`scenario-${scenarioTarget || "all"}`} project={project} initialComponent={scenarioTarget} />;
    return <HealthView project={project} onOpenTokens={openTokens} onOpenCatalog={() => navigateTo("catalog")} onOpenScenarios={(component) => { setScenarioTarget(component || ""); navigateTo("scenarios"); }} onOpenFinding={openFinding} />;
  };
  const navigation: { id: MainSection; label: string; icon: React.ReactNode; group?: string }[] = [
    { id: "colors", label: "Color", icon: <PaintBucket />, group: "Foundations" },
    { id: "typography", label: "Tipografía", icon: <Type /> },
    { id: "scales", label: "Escalas y layout", icon: <GridIcon /> },
    { id: "semantics", label: "Tokens semánticos", icon: <Layers3 />, group: "Sistema" },
    { id: "components", label: "Tokens de componente", icon: <Component /> },
    { id: "catalog", label: "Catálogo", icon: <BookOpen />, group: "Evaluar" },
    { id: "scenarios", label: "Escenarios", icon: <MonitorCog /> },
    { id: "health", label: "Salud del sistema", icon: <HeartPulse /> },
  ];
  return <div className={`lab-v4 theme-${theme}`} data-lab-theme={theme}>
    <a className="skip-link-v4" href="#lab-main">Saltar al contenido</a>
    <LabHeader
      projectName={project.meta.name}
      onOpenProject={() => setProjectOpen(true)}
      health={<HealthIndicator score={health.score} status={healthStatus} summary={health.summary} onClick={() => navigateTo("health")} />}
      projectMenu={<ProjectMenu onImport={() => importRef.current?.click()} onDownload={() => downloadText(projectFilename(project, ".dslab.json"), JSON.stringify(project, null, 2))} onDuplicate={() => { setProject((current) => ({ ...structuredClone(current), id: uid(), meta: { ...current.meta, name: `${current.meta.name} copia` } })); flash("Proyecto duplicado"); }} />}
      themeAction={<IconButton label={theme === "light" ? "Usar tema oscuro del Laboratorio" : "Usar tema claro del Laboratorio"} onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}>{theme === "light" ? <MoonIcon /> : <SunIcon />}</IconButton>}
      exportMenu={<ExportMenu onConfigure={() => setExportOpen(true)} onQuickExport={() => { downloadText(projectFilename(project, "-tokens.json"), JSON.stringify(buildTokenSubset(project, exportOptions.map((item) => item.value)), null, 2)); flash("Exportación rápida generada"); }} />}
    />
    <input ref={importRef} hidden type="file" accept=".json,.dslab.json" onChange={importProject} />
    <div className="workspace-v4"><aside ref={navigationRef} className="sidebar-v4"><nav aria-label="Navegación principal">{navigation.map((item) => <div key={item.id}>{item.group ? <span className="sidebar-group">{item.group}</span> : null}<button className={section === item.id ? "active" : ""} aria-current={section === item.id ? "page" : undefined} onClick={() => { if (item.id === "scales") setScaleTarget(undefined); navigateTo(item.id); }}>{item.icon}<span>{item.label}</span></button></div>)}</nav></aside><main ref={mainRef} id="lab-main" className="main-v4">{renderMain()}</main></div>
    <Dialog open={projectOpen} onOpenChange={setProjectOpen} title="Configuración del proyecto" description="Editá la identidad y el alcance de plataformas sin salir de tu tarea actual."><ProjectView project={project} update={update} embedded /></Dialog>
    <ExportPanel project={project} open={exportOpen} onClose={() => setExportOpen(false)} notice={flash} />
    {notice?.tone === "success" ? <div className="toast-v4" role="status" aria-live="polite">{notice.message}</div> : null}
    {notice?.tone === "error" ? <div className="import-error-v4" role="alert" aria-live="assertive"><div><b>No se pudo importar el proyecto</b><p>{notice.message}</p></div><Button onClick={() => importRef.current?.click()}>Elegir otro archivo</Button><IconButton label="Cerrar mensaje" onClick={() => setNotice(undefined)}><X /></IconButton></div> : null}
  </div>;
}
