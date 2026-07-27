"use client";

import { ChangeEvent, CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Catalog } from "./components/Catalog";
import { HealthView } from "./components/HealthView";
import { analyzeProject } from "./lib/health";
import { buildCss, buildDocumentation, buildTokenSubset, downloadText, ExportCategory, projectFilename } from "./lib/exporters";
import {
  allColorReferences, colorSteps, createInitialProject, DesignSystemProject, fontOptions, generateColorScale, generateTypeLevels,
  LabSection, makePalette, migrateProject, PlatformId, platformOrder, ratioOptions, relativeLuminance, requiredSemanticIds,
  resolveLayout, resolveResponsiveScale, resolveSemantic, scaleLabels, ScaleGroupKey, semanticById, uid,
} from "./lib/model";

const STORAGE_KEY = "design-system-lab-project-v1";
const LAB_THEME_KEY = "design-system-lab-ui-theme";
type SaveStatus = "saving" | "saved" | "unsaved";

const navItems: { id: LabSection; label: string; group: string; icon: string }[] = [
  { id: "project", label: "Proyecto", group: "Configurar", icon: "P" },
  { id: "colors", label: "Color", group: "Foundations", icon: "C" },
  { id: "typography", label: "Tipografía", group: "Foundations", icon: "T" },
  { id: "scales", label: "Escalas & grilla", group: "Foundations", icon: "S" },
  { id: "semantics", label: "Tokens", group: "Sistema", icon: "↔" },
  { id: "catalog", label: "Catálogo", group: "Evaluar", icon: "▦" },
  { id: "health", label: "Salud del sistema", group: "Evaluar", icon: "◎" },
  { id: "export", label: "Exportar", group: "Handoff", icon: "↗" },
];

const semanticLabels: Record<string, { name: string; category: string; description: string }> = {
  "surface-default": { name: "surface.default", category: "Superficie", description: "Lienzo principal" },
  "surface-raised": { name: "surface.raised", category: "Superficie", description: "Contenedores elevados" },
  "surface-overlay": { name: "surface.overlay", category: "Superficie", description: "Overlays con alpha incorporado" },
  "text-primary": { name: "text.primary", category: "Texto", description: "Texto de mayor jerarquía" },
  "text-muted": { name: "text.muted", category: "Texto", description: "Texto secundario" },
  "text-on-action": { name: "text.on-action", category: "Texto", description: "Contenido sobre acciones" },
  "border-subtle": { name: "border.subtle", category: "Borde", description: "Separación suave" },
  "border-strong": { name: "border.strong", category: "Borde", description: "Separación enfática" },
  "action-primary": { name: "action.primary", category: "Acción", description: "Acción principal" },
  "action-hover": { name: "action.hover", category: "Acción", description: "Estado hover" },
  "action-pressed": { name: "action.pressed", category: "Acción", description: "Estado presionado" },
  "focus-ring": { name: "focus.ring", category: "Foco", description: "Indicador de foco" },
  "feedback-success": { name: "feedback.success", category: "Feedback", description: "Confirmación positiva" },
  "feedback-warning": { name: "feedback.warning", category: "Feedback", description: "Advertencia" },
  "feedback-destructive": { name: "feedback.destructive", category: "Feedback", description: "Error o acción destructiva" },
  "disabled-surface": { name: "disabled.surface", category: "Estado", description: "Superficie deshabilitada" },
  "disabled-content": { name: "disabled.content", category: "Estado", description: "Contenido deshabilitado" },
  "selected-surface": { name: "selected.surface", category: "Estado", description: "Control seleccionado" },
  "selected-border": { name: "selected.border", category: "Estado", description: "Borde seleccionado" },
};

function SectionHeader({ kicker, title, description, action }: { kicker: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="view-header"><div><span className="section-kicker">{kicker}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

function TextField({ label, value, onChange, multiline = false, help }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; help?: string }) {
  return <label className="lab-field"><span>{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}{help ? <small>{help}</small> : null}</label>;
}

function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return <label className={`lab-toggle ${disabled ? "disabled" : ""}`}><button type="button" role="switch" aria-checked={checked} disabled={disabled} className={checked ? "on" : ""} onClick={() => onChange(!checked)}><i></i></button><span>{label}</span></label>;
}

function downloadProject(project: DesignSystemProject) {
  downloadText(projectFilename(project, ".dslab.json"), JSON.stringify(project, null, 2));
}

export default function Home() {
  const [project, setProject] = useState<DesignSystemProject>(() => createInitialProject());
  const [section, setSection] = useState<LabSection>("project");
  const [labTheme, setLabTheme] = useState<"light" | "dark">("light");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedScale, setSelectedScale] = useState<ScaleGroupKey>("spacing");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>("mobile");
  const [tokenLayer, setTokenLayer] = useState<"semantic" | "component">("semantic");
  const [tokenTheme, setTokenTheme] = useState("light");
  const [tokenPlatform, setTokenPlatform] = useState<PlatformId>("mobile");
  const [newPaletteOpen, setNewPaletteOpen] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState("Nueva paleta");
  const [newPaletteBase, setNewPaletteBase] = useState("#7C3AED");
  const [newPaletteAnchor, setNewPaletteAnchor] = useState(500);
  const [newPaletteRange, setNewPaletteRange] = useState(.78);
  const [fontSearch, setFontSearch] = useState("Inter");
  const [repairRef, setRepairRef] = useState("");
  const [exportCategories, setExportCategories] = useState<ExportCategory[]>(["colors", "typography", "scales", "semantics", "components", "themes", "platforms"]);
  const [exportFormat, setExportFormat] = useState<"json" | "css">("json");
  const [exportTheme, setExportTheme] = useState("all");
  const [exportPlatform, setExportPlatform] = useState("all");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let saved: DesignSystemProject | null = null;
    let theme: "light" | "dark" = "light";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = migrateProject(JSON.parse(raw));
      theme = localStorage.getItem(LAB_THEME_KEY) === "dark" ? "dark" : "light";
    } catch { /* use defaults */ }
    queueMicrotask(() => {
      if (saved) setProject(saved);
      setLabTheme(theme);
      setFontSearch(saved?.foundations.typography.family || "Inter");
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const statusTimer = window.setTimeout(() => setSaveStatus("saving"), 0);
    const persistTimer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, meta: { ...project.meta, updatedAt: new Date().toISOString() } }));
      setSaveStatus("saved");
    }, 450);
    return () => {
      window.clearTimeout(statusTimer);
      window.clearTimeout(persistTimer);
    };
  }, [project, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LAB_THEME_KEY, labTheme);
  }, [labTheme, hydrated]);

  useEffect(() => {
    const { family, source } = project.foundations.typography;
    const id = "project-font-preview";
    document.getElementById(id)?.remove();
    if (source !== "google") return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replaceAll("%20", "+")}:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`;
    document.head.appendChild(link);
    return () => link.remove();
  }, [project.foundations.typography]);

  const health = useMemo(() => analyzeProject(project), [project]);
  const colorReferences = useMemo(() => allColorReferences(project), [project]);
  const missingSemantics = requiredSemanticIds.filter((id) => !semanticById(project, id));
  const updateProject = (recipe: (current: DesignSystemProject) => DesignSystemProject) => {
    setSaveStatus("unsaved");
    setProject((current) => recipe(current));
  };
  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };

  const importProject = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = migrateProject(JSON.parse(String(reader.result)));
        setProject(imported);
        setFontSearch(imported.foundations.typography.family);
        flash(imported.schemaVersion === 2 ? "Proyecto importado" : "Proyecto importado y actualizado");
      } catch { flash("El archivo no es un proyecto compatible"); }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const createSemantic = (id: string, reference: string) => {
    const metadata = semanticLabels[id] || { name: id.replaceAll("-", "."), category: "Personalizado", description: "Rol agregado desde el laboratorio" };
    updateProject((current) => ({ ...current, semanticTokens: [...current.semanticTokens, { id, ...metadata, defaultRef: reference, themeRefs: {}, platformRefs: {} }] }));
    flash(`${metadata.name} creado y asignado`);
  };

  const setPlatformEnabled = (platform: PlatformId, enabled: boolean) => {
    if (platform === "mobile") return;
    updateProject((current) => ({ ...current, platforms: { ...current.platforms, [platform]: { ...current.platforms[platform], enabled, proposalPending: enabled } } }));
    if (enabled) setSelectedPlatform(platform);
  };

  const updateLayout = (platform: PlatformId, key: keyof ReturnType<typeof resolveLayout>, value: number | boolean) => {
    updateProject((current) => platform === "mobile"
      ? { ...current, foundations: { ...current.foundations, layoutBase: { ...current.foundations.layoutBase, [key]: value } } }
      : { ...current, platforms: { ...current.platforms, [platform]: { ...current.platforms[platform], overrides: { ...current.platforms[platform].overrides, [key]: value }, proposalPending: false } } });
  };

  const updateResponsiveScale = (platform: PlatformId, key: keyof ReturnType<typeof resolveResponsiveScale>, value: number) => {
    updateProject((current) => ({ ...current, platforms: { ...current.platforms, [platform]: { ...current.platforms[platform], scaleOverrides: { ...current.platforms[platform].scaleOverrides, [key]: value }, proposalPending: false } } }));
  };

  const applyFont = (family: string) => {
    const known = fontOptions.find((font) => font.family.toLowerCase() === family.trim().toLowerCase());
    const resolvedFamily = known?.family || family.trim() || "Inter";
    updateProject((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, family: resolvedFamily, source: known?.source || "custom", availableWeights: known?.weights || [400], styles: known?.styles || ["Normal"] } } }));
    setFontSearch(resolvedFamily);
  };

  const downloadThumbnail = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600; canvas.height = 900;
    const context = canvas.getContext("2d");
    if (!context) return;
    const first = project.foundations.colors[0]?.scale[600] || "#3F3F46";
    const second = project.foundations.colors[1]?.scale[400] || "#71717A";
    const gradient = context.createLinearGradient(0, 0, 1600, 900); gradient.addColorStop(0, first); gradient.addColorStop(1, second);
    context.fillStyle = gradient; context.fillRect(0, 0, 1600, 900);
    context.fillStyle = "rgba(255,255,255,.12)"; context.beginPath(); context.arc(1350, 130, 390, 0, Math.PI * 2); context.fill();
    context.fillStyle = "rgba(255,255,255,.18)"; context.fillRect(96, 98, 90, 90);
    context.fillStyle = "#FFFFFF"; context.font = `700 46px '${project.foundations.typography.family}', Arial`; context.fillText(project.meta.brandMark || project.meta.name.slice(0, 1), 123, 160);
    context.font = `700 94px '${project.foundations.typography.family}', Arial`; context.fillText(project.meta.name, 96, 470);
    context.font = `400 32px '${project.foundations.typography.family}', Arial`; context.globalAlpha = .78; context.fillText("Design system blueprint", 100, 530); context.globalAlpha = 1;
    let x = 100; platformOrder.filter((id) => project.platforms[id].enabled).forEach((id) => { const label = project.platforms[id].name; context.font = "600 24px Arial"; const width = context.measureText(label).width + 44; context.fillStyle = "rgba(255,255,255,.16)"; context.fillRect(x, 670, width, 54); context.fillStyle = "#FFFFFF"; context.fillText(label, x + 22, 706); x += width + 14; });
    canvas.toBlob((blob) => { if (!blob) return; const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = projectFilename(project, "-figma-thumbnail.png"); anchor.click(); URL.revokeObjectURL(url); }, "image/png");
  };

  const scopedProject = () => {
    const clone = structuredClone(project);
    if (exportTheme !== "all") clone.themes = clone.themes.filter((theme) => theme.id === exportTheme);
    if (exportPlatform !== "all") platformOrder.forEach((id) => { clone.platforms[id].enabled = id === exportPlatform; });
    return clone;
  };

  const exportSelection = () => {
    const snapshot = scopedProject();
    if (exportFormat === "json") downloadText(projectFilename(project, "-tokens.json"), JSON.stringify(buildTokenSubset(snapshot, exportCategories), null, 2));
    else downloadText(projectFilename(project, "-tokens.css"), buildCss(snapshot, exportCategories), "text/css");
    flash("Exportación generada; podés crear otra con un alcance distinto");
  };

  const renderProject = () => {
    const enabled = platformOrder.filter((id) => project.platforms[id].enabled);
    const thumbColors = project.foundations.colors.slice(0, 2).map((palette) => palette.scale[600] || palette.base);
    return <>
      <SectionHeader kicker="Configuración" title="Proyecto y alcance" description="Mobile es la base. Las demás plataformas heredan propuestas revisables sin duplicar todo el sistema." />
      <div className="two-column-layout">
        <section className="zinc-card form-stack"><div className="card-heading"><div><h2>Identidad</h2><p>Datos que acompañan al blueprint y su documentación.</p></div><span className="status-chip">v2</span></div><TextField label="Nombre" value={project.meta.name} onChange={(value) => updateProject((current) => ({ ...current, meta: { ...current.meta, name: value } }))} /><TextField label="Descripción" multiline value={project.meta.description} onChange={(value) => updateProject((current) => ({ ...current, meta: { ...current.meta, description: value } }))} /><TextField label="Marca corta" value={project.meta.brandMark} onChange={(value) => updateProject((current) => ({ ...current, meta: { ...current.meta, brandMark: value.slice(0, 3) } }))} help="Hasta tres caracteres para thumbnail y previews." /></section>
        <section className="zinc-card"><div className="card-heading"><div><h2>Plataformas responsivas</h2><p>Activá solo las que necesita el proyecto.</p></div><span className="status-chip mobile-first">Mobile first</span></div><div className="platform-list">{platformOrder.map((id) => <div key={id} className="platform-row"><div><strong>{project.platforms[id].name}</strong><small>{id === "mobile" ? "Base del sistema" : `Hereda de ${project.platforms[id].inheritFrom === "mobile" ? "Mobile" : project.platforms[id].inheritFrom}`}</small></div><Toggle label="" checked={project.platforms[id].enabled} disabled={id === "mobile"} onChange={(checked) => setPlatformEnabled(id, checked)} /></div>)}</div></section>
      </div>
      <div className="two-column-layout project-secondary">
        <section className="zinc-card"><div className="card-heading"><div><h2>Perfil de implementación</h2><p>Activa recomendaciones de composición y rendimiento.</p></div></div><div className="profile-options">{(["web", "ios", "android"] as const).map((profile) => <Toggle key={profile} label={profile === "ios" ? "iOS" : profile === "android" ? "Android" : "Web"} checked={project.implementationProfile[profile]} onChange={(checked) => updateProject((current) => ({ ...current, implementationProfile: { ...current.implementationProfile, [profile]: checked } }))} />)}</div><div className="info-note"><span>i</span><p>Para superficies, bordes y overlays conviene priorizar colores semánticos con alpha incorporado. La opacidad de contenedor sigue siendo válida en native para interacciones y efectos temporales.</p></div></section>
        <section className="zinc-card thumbnail-card"><div className="card-heading"><div><span className="section-kicker">Salida independiente</span><h2>Thumbnail para Figma</h2><p>Usa nombre, marca, colores, tipografía y plataformas; no forma parte de los tokens.</p></div></div><div className="figma-thumbnail" style={{ "--thumb-a": thumbColors[0] || "#52525B", "--thumb-b": thumbColors[1] || "#71717A", fontFamily: `'${project.foundations.typography.family}', sans-serif` } as CSSProperties}><span className="thumb-mark">{project.meta.brandMark}</span><div><small>DESIGN SYSTEM BLUEPRINT</small><h3>{project.meta.name}</h3><p>{enabled.map((id) => project.platforms[id].name).join(" · ")}</p></div></div><button className="secondary-action full" onClick={downloadThumbnail}>Descargar PNG horizontal</button></section>
      </div>
    </>;
  };

  const renderColors = () => <>
    <SectionHeader kicker="Foundations / Primitivos" title="Color sin intención" description="Elegí un color base, anclalo según su luminosidad perceptual y generá tintas y tonos. La intención se asigna después, en Semánticos." action={<button className="primary-action" onClick={() => { setNewPaletteAnchor(Math.round(Number(relativeLuminance(newPaletteBase) > .48 ? 400 : 500))); setNewPaletteOpen(true); }}>＋ Nueva paleta</button>} />
    {newPaletteOpen ? <section className="zinc-card palette-builder"><div className="card-heading"><div><span className="section-kicker">Generador</span><h2>Crear foundation de color</h2></div><button className="icon-action" onClick={() => setNewPaletteOpen(false)}>×</button></div><div className="palette-builder-grid"><TextField label="Nombre" value={newPaletteName} onChange={setNewPaletteName} /><label className="lab-field"><span>Color base</span><div className="color-picker-field"><input type="color" value={newPaletteBase} onChange={(event) => { setNewPaletteBase(event.target.value.toUpperCase()); setNewPaletteAnchor(relativeLuminance(event.target.value) > .72 ? 300 : relativeLuminance(event.target.value) > .48 ? 400 : relativeLuminance(event.target.value) > .22 ? 500 : 600); }} /><code>{newPaletteBase}</code></div><small>Luminancia perceptual: {relativeLuminance(newPaletteBase).toFixed(3)}</small></label><label className="lab-field"><span>Ancla de escala</span><select value={newPaletteAnchor} onChange={(event) => setNewPaletteAnchor(Number(event.target.value))}>{colorSteps.map((step) => <option key={step} value={step}>{step}</option>)}</select><small>El color elegido se conserva exactamente en este nivel.</small></label><label className="lab-field"><span>Rango / contraste · {Math.round(newPaletteRange * 100)}%</span><input type="range" min="0.45" max="1" step="0.01" value={newPaletteRange} onChange={(event) => setNewPaletteRange(Number(event.target.value))} /></label></div><div className="generated-scale">{colorSteps.map((step) => <span key={step} style={{ background: generateColorScale(newPaletteBase, newPaletteAnchor, newPaletteRange)[step] }}><b>{step}</b></span>)}</div><div className="builder-actions"><button className="quiet-action" onClick={() => setNewPaletteOpen(false)}>Cancelar</button><button className="primary-action" onClick={() => { const created = makePalette(newPaletteName || "Paleta", newPaletteBase); created.anchorStep = newPaletteAnchor; created.range = newPaletteRange; created.scale = generateColorScale(newPaletteBase, newPaletteAnchor, newPaletteRange); updateProject((current) => ({ ...current, foundations: { ...current.foundations, colors: [...current.foundations.colors, created] } })); setNewPaletteOpen(false); }}>Crear paleta</button></div></section> : null}
    <div className="palette-stack">{project.foundations.colors.map((palette) => <article className="zinc-card palette-editor" key={palette.id}><div className="palette-editor-head"><div className="palette-identity"><input type="color" value={palette.base} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((item) => item.id === palette.id ? { ...item, base: event.target.value.toUpperCase(), scale: generateColorScale(event.target.value, item.anchorStep, item.range, Object.fromEntries(item.manualSteps.map((step) => [step, item.scale[step]]))) } : item) } }))} /><div><input className="editable-title" value={palette.name} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((item) => item.id === palette.id ? { ...item, name: event.target.value } : item) } }))} /><small>Base {palette.base} · L {relativeLuminance(palette.base).toFixed(3)}</small></div></div><div className="palette-controls"><label>Ancla<select value={palette.anchorStep} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((item) => item.id === palette.id ? { ...item, anchorStep: Number(event.target.value), scale: generateColorScale(item.base, Number(event.target.value), item.range, Object.fromEntries(item.manualSteps.map((step) => [step, item.scale[step]]))) } : item) } }))}>{colorSteps.map((step) => <option key={step}>{step}</option>)}</select></label><label>Rango {Math.round(palette.range * 100)}%<input type="range" min="0.45" max="1" step=".01" value={palette.range} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((item) => item.id === palette.id ? { ...item, range: Number(event.target.value), scale: generateColorScale(item.base, item.anchorStep, Number(event.target.value), Object.fromEntries(item.manualSteps.map((step) => [step, item.scale[step]]))) } : item) } }))} /></label><button className="icon-action danger" onClick={() => updateProject((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.filter((item) => item.id !== palette.id) } }))}>×</button></div></div><div className="editable-swatches">{colorSteps.map((step) => <label key={step} style={{ background: palette.scale[step] }} className={palette.manualSteps.includes(step) ? "manual" : ""}><span>{step}{Number(step) === palette.anchorStep ? <b>Anchor</b> : null}</span><input value={palette.scale[step]} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((item) => item.id === palette.id ? { ...item, scale: { ...item.scale, [step]: event.target.value.toUpperCase() }, manualSteps: [...new Set([...item.manualSteps, step])] } : item) } }))} /></label>)}</div>{palette.manualSteps.length ? <button className="text-action" onClick={() => updateProject((current) => ({ ...current, foundations: { ...current.foundations, colors: current.foundations.colors.map((item) => item.id === palette.id ? { ...item, manualSteps: [], scale: generateColorScale(item.base, item.anchorStep, item.range) } : item) } }))}>Restablecer {palette.manualSteps.length} ajustes manuales</button> : null}</article>)}</div>
  </>;

  const renderTypography = () => {
    const typography = project.foundations.typography;
    const warnings = typography.levels.flatMap((level) => [level.size < 12 ? `${level.name}: tamaño menor a 12px.` : "", level.name === "Body" && level.lineHeight < 1.4 ? "Body: interlineado bajo para lectura sostenida." : "", Math.abs(level.tracking) > .08 ? `${level.name}: tracking extremo.` : ""]).filter(Boolean);
    return <>
      <SectionHeader kicker="Foundations / Primitivos" title="Tipografía y escala modular" description="Elegí una fuente, configurá el estilo base y generá una propuesta. Cada nivel sigue siendo editable antes de llegar a semánticos o componentes." />
      <div className="typography-layout"><section className="zinc-card typography-config"><div className="card-heading"><div><h2>Familia</h2><p>Fuentes comunes, Google Fonts o una familia personalizada.</p></div><span className="status-chip">{typography.source === "google" ? "Google Fonts" : typography.source === "system" ? "Sistema" : "Personalizada"}</span></div><label className="lab-field"><span>Buscar o escribir familia</span><input list="font-options" value={fontSearch} onChange={(event) => setFontSearch(event.target.value)} onBlur={() => applyFont(fontSearch)} onKeyDown={(event) => { if (event.key === "Enter") applyFont(fontSearch); }} /><datalist id="font-options">{fontOptions.map((font) => <option key={font.family} value={font.family} />)}</datalist><small>Si no aparece en la lista, se conserva como tipografía personalizada.</small></label><div className="font-meta"><div><span>Pesos disponibles</span><p>{typography.availableWeights.map((weight) => <b key={weight}>{weight}</b>)}</p></div><div><span>Estilos</span><p>{typography.styles.map((style) => <b key={style}>{style}</b>)}</p></div></div><div className="font-specimen" style={{ fontFamily: `'${typography.family}', sans-serif` }}><span>{typography.family}</span><strong>Aa</strong><p>Diseñar es hacer visible una intención.</p><small>0123456789 · ÁÉÍÓÚ · abcdefghijklmnopqrstuvwxyz</small></div></section><section className="zinc-card type-base-card"><div className="card-heading"><div><h2>Estilo base</h2><p>Punto de partida de la escala.</p></div></div><div className="compact-fields"><label className="lab-field"><span>Tamaño</span><input type="number" min="10" max="30" value={typography.base.size} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, base: { ...current.foundations.typography.base, size: Number(event.target.value) } } } }))} /></label><label className="lab-field"><span>Peso</span><select value={typography.base.weight} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, base: { ...current.foundations.typography.base, weight: Number(event.target.value) } } } }))}>{typography.availableWeights.map((weight) => <option key={weight}>{weight}</option>)}</select></label><label className="lab-field"><span>Interlínea</span><input type="number" min="1" max="2" step=".05" value={typography.base.lineHeight} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, base: { ...current.foundations.typography.base, lineHeight: Number(event.target.value) } } } }))} /></label><label className="lab-field"><span>Tracking em</span><input type="number" min="-.1" max=".2" step=".01" value={typography.base.tracking} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, base: { ...current.foundations.typography.base, tracking: Number(event.target.value) } } } }))} /></label></div><label className="lab-field"><span>Proporción</span><select value={typography.ratio} onChange={(event) => { const selected = ratioOptions.find((ratio) => ratio.value === Number(event.target.value)); updateProject((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, ratio: Number(event.target.value), ratioName: selected?.name || "Personalizada" } } })); }}>{ratioOptions.map((ratio) => <option key={ratio.name} value={ratio.value}>{ratio.name} · {ratio.value}</option>)}</select></label><button className="primary-action full" onClick={() => updateProject((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, levels: generateTypeLevels(current.foundations.typography.base.size, current.foundations.typography.ratio) } } }))}>Generar escala modular</button></section></div>
      <section className="zinc-card type-levels"><div className="card-heading"><div><h2>Niveles editables</h2><p>La propuesta no bloquea ajustes por estilo.</p></div>{warnings.length ? <span className="status-chip warning">{warnings.length} alertas</span> : <span className="status-chip success">Legible</span>}</div><div className="type-level-table"><div className="type-level-row header"><span>Nivel</span><span>Muestra</span><span>px</span><span>Peso</span><span>Interlínea</span><span>Tracking</span></div>{typography.levels.map((level) => <div className="type-level-row" key={level.id}><input value={level.name} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, levels: current.foundations.typography.levels.map((item) => item.id === level.id ? { ...item, name: event.target.value } : item) } } }))} /><strong style={{ fontFamily: `'${typography.family}', sans-serif`, fontSize: `${Math.min(level.size, 38)}px`, fontWeight: level.weight, lineHeight: level.lineHeight, letterSpacing: `${level.tracking}em` }}>Sistema</strong>{(["size", "weight", "lineHeight", "tracking"] as const).map((key) => <input key={key} type="number" step={key === "tracking" ? ".01" : key === "lineHeight" ? ".05" : "1"} value={level[key]} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, typography: { ...current.foundations.typography, levels: current.foundations.typography.levels.map((item) => item.id === level.id ? { ...item, [key]: Number(event.target.value) } : item) } } }))} />)}</div>)}</div>{warnings.length ? <div className="warning-list">{warnings.map((warning) => <span key={warning}>△ {warning}</span>)}</div> : null}</section>
    </>;
  };

  const renderScales = () => {
    const layout = resolveLayout(project, selectedPlatform);
    const responsiveScale = resolveResponsiveScale(project, selectedPlatform);
    const platform = project.platforms[selectedPlatform];
    return <>
      <SectionHeader kicker="Foundations / Primitivos" title="Escalas, layout y grilla" description="Configurá ritmo y estructura espacial. Las plataformas amplias combinan escalas heredadas con límites de ancho, no un crecimiento sin control." />
      <div className="scale-nav">{(Object.keys(scaleLabels) as ScaleGroupKey[]).map((key) => <button key={key} className={selectedScale === key ? "active" : ""} onClick={() => setSelectedScale(key)}>{scaleLabels[key]} <span>{project.foundations.scales[key].length}</span></button>)}</div>
      <section className="zinc-card scale-editor"><div className="card-heading"><div><h2>{scaleLabels[selectedScale]}</h2><p>Valores primitivos sin intención de uso.</p></div><button className="secondary-action" onClick={() => updateProject((current) => ({ ...current, foundations: { ...current.foundations, scales: { ...current.foundations.scales, [selectedScale]: [...current.foundations.scales[selectedScale], { id: uid(), name: `token-${current.foundations.scales[selectedScale].length + 1}`, value: selectedScale === "opacity" ? ".5" : "16px" }] } } }))}>＋ Token</button></div><div className="scale-token-list">{project.foundations.scales[selectedScale].map((token) => <div className="scale-token-row" key={token.id}><input value={token.name} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, scales: { ...current.foundations.scales, [selectedScale]: current.foundations.scales[selectedScale].map((item) => item.id === token.id ? { ...item, name: event.target.value } : item) } } }))} /><input value={token.value} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, scales: { ...current.foundations.scales, [selectedScale]: current.foundations.scales[selectedScale].map((item) => item.id === token.id ? { ...item, value: event.target.value } : item) } } }))} /><div className={`scale-token-visual ${selectedScale}`} style={{ "--value": token.value } as CSSProperties}></div><button className="icon-action danger" onClick={() => updateProject((current) => ({ ...current, foundations: { ...current.foundations, scales: { ...current.foundations.scales, [selectedScale]: current.foundations.scales[selectedScale].filter((item) => item.id !== token.id) } } }))}>×</button></div>)}</div>{selectedScale === "opacity" ? <div className="info-note"><span>i</span><p>La opacidad no está prohibida en iOS o Android. Usala para interacciones y efectos temporales; para superficies estables suele ser más portable incorporar alpha al color semántico.</p></div> : null}</section>
      <div className="layout-section"><div className="layout-editor-column"><div className="platform-tabs">{platformOrder.filter((id) => project.platforms[id].enabled).map((id) => <button key={id} className={selectedPlatform === id ? "active" : ""} onClick={() => setSelectedPlatform(id)}>{project.platforms[id].name}{project.platforms[id].proposalPending ? <i></i> : null}</button>)}</div><section className="zinc-card layout-fields"><div className="card-heading"><div><h2>Layout · {platform.name}</h2><p>{platform.inheritFrom ? "Hereda Mobile y conserva solo overrides." : "Configuración espacial base."}</p></div>{platform.proposalPending ? <button className="secondary-action" onClick={() => updateProject((current) => ({ ...current, platforms: { ...current.platforms, [selectedPlatform]: { ...current.platforms[selectedPlatform], proposalPending: false } } }))}>Marcar revisada</button> : null}</div><div className="layout-input-grid">{(["columns", "margin", "gutter", "maxWidth", "breakpoint", "baseline"] as const).map((key) => <label className="lab-field" key={key}><span>{key === "maxWidth" ? "Ancho máximo" : key === "breakpoint" ? "Breakpoint" : key === "baseline" ? "Baseline" : key === "columns" ? "Columnas" : key === "margin" ? "Márgenes" : "Gutter"}</span><input type="number" min="0" value={layout[key]} onChange={(event) => updateLayout(selectedPlatform, key, Number(event.target.value))} />{platform.inheritFrom && platform.overrides[key] === undefined ? <small>Heredado</small> : <small>{key === "columns" ? "" : "px"}</small>}</label>)}</div><Toggle label="Baseline grid" checked={layout.baselineEnabled} onChange={(checked) => updateLayout(selectedPlatform, "baselineEnabled", checked)} /><div className="responsive-scale-fields"><span>Escalas heredadas</span>{(["typography", "spacing", "dimensions"] as const).map((key) => <label key={key}><span>{key === "typography" ? "Tipografía" : key === "spacing" ? "Espaciado" : "Dimensiones"}</span><input type="number" min="0.75" max="1.5" step=".025" value={responsiveScale[key]} onChange={(event) => updateResponsiveScale(selectedPlatform, key, Number(event.target.value))} /><small>× base</small></label>)}</div>{selectedPlatform === "desktop" ? <p className="bounded-scale-note">Los límites de ancho contienen el crecimiento: dimensiones quedan en 1× por defecto.</p> : null}</section></div><div className="grid-preview-shell"><div className={`grid-device grid-${selectedPlatform}`}><div className="grid-device-top"><span>{platform.name}</span><code>{layout.maxWidth}px max</code></div><div className="grid-canvas" style={{ "--columns": layout.columns, "--margin": `${Math.min(layout.margin, 60)}px`, "--gutter": `${Math.max(4, Math.min(layout.gutter, 32))}px`, "--baseline": `${layout.baseline}px` } as CSSProperties}><div className="grid-columns">{Array.from({ length: layout.columns }, (_, index) => <i key={index}></i>)}</div><div className="grid-content"><span></span><span></span><span></span></div></div></div><p>La superposición muestra columnas, gutters, márgenes y baseline en tiempo real, como referencia previa a configurar grids en Figma.</p></div></div>
      <details className="zinc-card custom-foundations"><summary><div><span className="section-kicker">Avanzado · opcional</span><h2>Foundations personalizados</h2><p>Para capas, iconos, motion u otras reglas del cliente no cubiertas por las categorías principales.</p></div><span>＋</span></summary><div className="custom-foundations-body"><button className="secondary-action" onClick={() => updateProject((current) => ({ ...current, foundations: { ...current.foundations, customFoundations: [...current.foundations.customFoundations, { id: uid(), name: "Nuevo foundation", description: "Necesidad específica del cliente", tokens: [] }] } }))}>＋ Añadir foundation</button>{project.foundations.customFoundations.map((group) => <article key={group.id}><input className="editable-title" value={group.name} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, customFoundations: current.foundations.customFoundations.map((item) => item.id === group.id ? { ...item, name: event.target.value } : item) } }))} /><input value={group.description} onChange={(event) => updateProject((current) => ({ ...current, foundations: { ...current.foundations, customFoundations: current.foundations.customFoundations.map((item) => item.id === group.id ? { ...item, description: event.target.value } : item) } }))} /><button className="text-action" onClick={() => updateProject((current) => ({ ...current, foundations: { ...current.foundations, customFoundations: current.foundations.customFoundations.map((item) => item.id === group.id ? { ...item, tokens: [...item.tokens, { id: uid(), name: `token-${item.tokens.length + 1}`, value: "value" }] } : item) } }))}>＋ Token</button></article>)}</div></details>
    </>;
  };

  const renderTokens = () => <>
    <SectionHeader kicker="Arquitectura de tokens" title="Intención y aplicación" description="Los semánticos conectan foundations con roles transversales. Los tokens de componente documentan decisiones específicas y estables." action={<div className="layer-switch"><button className={tokenLayer === "semantic" ? "active" : ""} onClick={() => setTokenLayer("semantic")}>Semánticos</button><button className={tokenLayer === "component" ? "active" : ""} onClick={() => setTokenLayer("component")}>Componente</button></div>} />
    <div className="token-context-bar"><label>Modo<select value={tokenTheme} onChange={(event) => setTokenTheme(event.target.value)}>{project.themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label><label>Plataforma<select value={tokenPlatform} onChange={(event) => setTokenPlatform(event.target.value as PlatformId)}>{platformOrder.filter((id) => project.platforms[id].enabled).map((id) => <option key={id} value={id}>{project.platforms[id].name}</option>)}</select></label><div><span className="layer-dot primitive"></span>Foundation <b>→</b><span className="layer-dot semantic"></span>Semántico <b>→</b><span className="layer-dot component"></span>Componente</div></div>
    {missingSemantics.length ? <section className="missing-token-panel"><div><strong>{missingSemantics.length} roles requeridos sin asignar</strong><p>Seleccioná una foundation y creá el primer rol. Ningún estado recibe un color inventado.</p></div><select value={repairRef} onChange={(event) => setRepairRef(event.target.value)}><option value="">Elegir foundation…</option>{colorReferences.map((reference) => <option key={reference}>{reference}</option>)}</select><button className="primary-action" disabled={!repairRef} onClick={() => { createSemantic(missingSemantics[0], repairRef); setRepairRef(""); }}>Crear {semanticLabels[missingSemantics[0]]?.name || missingSemantics[0]}</button></section> : null}
    {tokenLayer === "semantic" ? <section className="zinc-card token-table"><div className="token-table-row header"><span>Rol</span><span>Foundation base</span><span>Modo: {project.themes.find((theme) => theme.id === tokenTheme)?.name}</span><span>Plataforma</span><span>Resuelto</span></div>{project.semanticTokens.map((token) => { const value = resolveSemantic(project, token.id, tokenTheme, tokenPlatform); return <div className="token-table-row" key={token.id}><div><code>{token.name}</code><small>{token.category} · {token.description}</small></div><select value={token.defaultRef} onChange={(event) => updateProject((current) => ({ ...current, semanticTokens: current.semanticTokens.map((item) => item.id === token.id ? { ...item, defaultRef: event.target.value } : item) }))}>{colorReferences.map((reference) => <option key={reference}>{reference}</option>)}</select><select value={token.themeRefs[tokenTheme] || ""} onChange={(event) => updateProject((current) => ({ ...current, semanticTokens: current.semanticTokens.map((item) => item.id === token.id ? { ...item, themeRefs: { ...item.themeRefs, [tokenTheme]: event.target.value } } : item) }))}><option value="">Heredar base</option>{colorReferences.map((reference) => <option key={reference}>{reference}</option>)}</select><select value={token.platformRefs[tokenPlatform] || ""} onChange={(event) => updateProject((current) => ({ ...current, semanticTokens: current.semanticTokens.map((item) => item.id === token.id ? { ...item, platformRefs: { ...item.platformRefs, [tokenPlatform]: event.target.value } } : item) }))}><option value="">Heredar modo</option>{colorReferences.map((reference) => <option key={reference}>{reference}</option>)}</select><div className="resolved-token"><i style={{ background: value || "transparent" }}></i><code>{value || "Sin resolver"}</code></div></div>; })}<button className="text-action token-add" onClick={() => createSemantic(`custom-${uid()}`, colorReferences[0])}>＋ Rol personalizado</button></section> : <section className="zinc-card token-table component-token-table"><div className="token-table-row header"><span>Token de componente</span><span>Componente</span><span>Referencia</span><span>Plataforma</span><span>Tipo</span></div>{project.componentTokens.map((token) => { const refs = [...project.semanticTokens.map((semantic) => `semantic:${semantic.id}`), ...Object.entries(project.foundations.scales).flatMap(([group, items]) => items.map((item) => `primitive:${group}.${item.name}`))]; return <div className="token-table-row" key={token.id}><div><code>{token.name}</code><small>{token.description}</small></div><span>{token.component}</span><select value={token.reference} onChange={(event) => updateProject((current) => ({ ...current, componentTokens: current.componentTokens.map((item) => item.id === token.id ? { ...item, reference: event.target.value } : item) }))}>{refs.map((reference) => <option key={reference}>{reference}</option>)}</select><select value={token.platformRefs[tokenPlatform] || ""} onChange={(event) => updateProject((current) => ({ ...current, componentTokens: current.componentTokens.map((item) => item.id === token.id ? { ...item, platformRefs: { ...item.platformRefs, [tokenPlatform]: event.target.value } } : item) }))}><option value="">Heredar referencia</option>{refs.map((reference) => <option key={reference}>{reference}</option>)}</select><span className={`reference-kind ${token.reference.startsWith("semantic:") ? "semantic" : "primitive"}`}>{token.reference.startsWith("semantic:") ? "Semántico" : "Primitivo estable"}</span></div>; })}<button className="text-action token-add" onClick={() => updateProject((current) => ({ ...current, componentTokens: [...current.componentTokens, { id: uid(), name: "component.custom.property", component: "Custom", reference: `semantic:${current.semanticTokens[0]?.id || ""}`, platformRefs: {}, description: "Decisión específica del componente" }] }))}>＋ Token de componente</button></section>}
    <section className="zinc-card compatibility-panel"><div className="card-heading"><div><h2>Compatibilidad de implementación</h2><p>Lectura para {Object.entries(project.implementationProfile).filter(([, enabled]) => enabled).map(([key]) => key === "ios" ? "iOS" : key === "android" ? "Android" : "Web").join(", ")}.</p></div></div><div className="compatibility-grid"><article><span>Superficies y bordes</span><strong>Alpha semántico primero</strong><p>Reduce diferencias al componer sobre fondos distintos.</p></article><article><span>Estados temporales</span><strong>Opacidad permitida</strong><p>Útil para pressed, disabled transitorio y animación, también en native.</p></article><article><span>Rendimiento</span><strong>Revisar overlays apilados</strong><p>Varias transparencias pueden cambiar contraste y coste de composición.</p></article></div></section>
  </>;

  const renderExport = () => {
    const categories: { id: ExportCategory; label: string }[] = [{ id: "colors", label: "Color" }, { id: "typography", label: "Tipografía" }, { id: "scales", label: "Escalas / layout" }, { id: "semantics", label: "Semántica" }, { id: "components", label: "Componentes" }, { id: "themes", label: "Modos" }, { id: "platforms", label: "Plataformas" }];
    return <>
      <SectionHeader kicker="Handoff" title="Exportar y documentar" description="Tres salidas separadas: proyecto editable, tokens seleccionables y documentación HTML compartible. Cada descarga conserva tu selección para exportaciones secuenciales." />
      <div className="export-layout"><section className="zinc-card project-export-card"><div className="export-icon">DS</div><span className="status-chip success">Editable</span><h2>Archivo del proyecto</h2><p>Guarda el documento completo del Laboratorio para importarlo y retomar el trabajo. Incluye todas las capas, modos y plataformas.</p><div className="local-warning"><b>Guardado local</b><span>Puede perderse si borrás los datos del navegador. Descargá este archivo como respaldo.</span></div><button className="primary-action full" onClick={() => downloadProject(project)}>Descargar .dslab.json</button></section><section className="zinc-card selective-export"><div className="card-heading"><div><span className="section-kicker">Figma & desarrollo</span><h2>Exportación seleccionable</h2><p>Elegí contenido, destino y alcance.</p></div></div><div className="export-step"><span>1 · Contenido</span><div className="category-checks">{categories.map((category) => <label key={category.id}><input type="checkbox" checked={exportCategories.includes(category.id)} onChange={(event) => setExportCategories((current) => event.target.checked ? [...current, category.id] : current.filter((item) => item !== category.id))} />{category.label}</label>)}</div></div><div className="export-step"><span>2 · Destino</span><div className="segmented-control"><button className={exportFormat === "json" ? "active" : ""} onClick={() => setExportFormat("json")}>Tokens JSON</button><button className={exportFormat === "css" ? "active" : ""} onClick={() => setExportFormat("css")}>Variables CSS</button></div></div><div className="export-step"><span>3 · Alcance</span><div className="export-scope"><label>Modo<select value={exportTheme} onChange={(event) => setExportTheme(event.target.value)}><option value="all">Todos</option>{project.themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label><label>Plataforma<select value={exportPlatform} onChange={(event) => setExportPlatform(event.target.value)}><option value="all">Todas</option>{platformOrder.filter((id) => project.platforms[id].enabled).map((id) => <option key={id} value={id}>{project.platforms[id].name}</option>)}</select></label></div></div><button className="primary-action full" disabled={!exportCategories.length} onClick={exportSelection}>Generar {exportFormat === "json" ? "tokens" : "CSS"}</button></section></div>
      <section className="zinc-card docs-export-card"><div><span className="docs-icon">〈/〉</span><div><span className="section-kicker">Instantánea estática</span><h2>Sitio de documentación HTML</h2><p>Incluye foundations, semánticos, componentes, modos, grillas, métricas de accesibilidad y catálogo visual. Se descarga como un archivo autónomo para compartir.</p></div></div><button className="secondary-action" onClick={() => downloadText(projectFilename(project, "-documentation.html"), buildDocumentation(project), "text/html")}>Descargar documentación HTML</button></section>
    </>;
  };

  const renderSection = () => {
    if (section === "project") return renderProject();
    if (section === "colors") return renderColors();
    if (section === "typography") return renderTypography();
    if (section === "scales") return renderScales();
    if (section === "semantics") return renderTokens();
    if (section === "catalog") return <Catalog project={project} onCreateSemantic={createSemantic} />;
    if (section === "health") return <HealthView project={project} onNavigate={setSection} />;
    return renderExport();
  };

  const groupedNav = navItems.reduce<Record<string, typeof navItems>>((groups, item) => ({ ...groups, [item.group]: [...(groups[item.group] || []), item] }), {});
  return <div className={`lab-shell lab-${labTheme}`}>
    <header className="lab-header">
      <button className="lab-brand" onClick={() => setSection("project")}><span className="lab-brand-mark"><i></i><i></i><i></i></span><span>Design System <b>Lab</b></span></button>
      <div className="header-project"><strong>{project.meta.name || "Proyecto sin nombre"}</strong><span className={`save-state ${saveStatus}`}><i></i>{saveStatus === "saving" ? "Guardando…" : saveStatus === "saved" ? "Guardado localmente" : "Cambios sin guardar"}</span></div>
      <div className="header-actions">
        <button className="theme-button" aria-label={`Usar modo ${labTheme === "light" ? "oscuro" : "claro"} del Laboratorio`} onClick={() => setLabTheme((theme) => theme === "light" ? "dark" : "light")}>{labTheme === "light" ? "◐" : "☼"}</button>
        <details className="project-menu"><summary>Proyecto <span>⌄</span></summary><div><button onClick={() => importRef.current?.click()}>Importar archivo</button><button onClick={() => downloadProject(project)}>Descargar proyecto</button><button onClick={() => updateProject((current) => ({ ...structuredClone(current), id: uid(), meta: { ...current.meta, name: `${current.meta.name} · copia` } }))}>Duplicar proyecto</button><p>El guardado local puede perderse al borrar los datos del navegador.</p></div></details>
        <div className="split-export"><button onClick={() => setSection("export")}>Exportar</button><details><summary aria-label="Accesos rápidos de exportación">⌄</summary><div><button onClick={() => downloadProject(project)}>Proyecto editable</button><button onClick={() => downloadText(projectFilename(project, "-documentation.html"), buildDocumentation(project), "text/html")}>Documentación HTML</button><button onClick={() => { setSection("export"); flash("Revisá contenido, destino y alcance"); }}>Configurar exportación</button></div></details></div>
        <input hidden ref={importRef} type="file" accept="application/json,.json" onChange={importProject} />
      </div>
    </header>
    <div className="lab-workspace">
      <aside className="lab-sidebar"><nav>{Object.entries(groupedNav).map(([group, items]) => <div className="nav-group" key={group}><span>{group}</span>{items.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><i>{item.icon}</i>{item.label}{item.id === "health" && health.findings.length ? <b>{health.findings.length}</b> : null}</button>)}</div>)}</nav><div className="readiness-card"><div><span>Preparación</span><b>{health.score}%</b></div><div className="readiness-track"><i style={{ width: `${health.score}%` }}></i></div><p>{health.counts.critical ? `${health.counts.critical} críticos por resolver` : health.counts.warning ? `${health.counts.warning} revisiones pendientes` : "Sin bloqueos detectados"}</p><button onClick={() => setSection("health")}>Ver explicación</button></div></aside>
      <main className="lab-main"><div className="lab-main-inner">{renderSection()}</div></main>
    </div>
    {notice ? <div className="lab-toast">{notice}</div> : null}
  </div>;
}

