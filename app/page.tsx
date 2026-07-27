"use client";

import { ChangeEvent, CSSProperties, useEffect, useMemo, useRef, useState } from "react";

type Target = "web" | "mobile" | "both";
type Section = "project" | "colors" | "typography" | "scales" | "themes" | "export";
type ScaleGroupKey = "spacing" | "dimensions" | "radii" | "borders" | "shadows" | "opacity" | "layout";
type ScaleToken = { id: string; name: string; value: string };
type ColorPalette = { id: string; name: string; role: string; base: string; scale: Record<string, string> };
type TypeStyle = { id: string; name: string; family: string; size: string; weight: string; lineHeight: string };
type SemanticToken = { id: string; name: string; category: string; defaultRef: string };
type Theme = { id: string; name: string; values: Record<string, string> };

type DesignSystemProject = {
  schemaVersion: 1;
  id: string;
  meta: { name: string; description: string; target: Target; cover: string; updatedAt: string };
  foundations: {
    colors: ColorPalette[];
    typography: TypeStyle[];
    spacing: ScaleToken[];
    dimensions: ScaleToken[];
    radii: ScaleToken[];
    borders: ScaleToken[];
    shadows: ScaleToken[];
    opacity: ScaleToken[];
    layout: ScaleToken[];
    customGroups: { id: string; name: string; tokens: ScaleToken[] }[];
  };
  semanticTokens: SemanticToken[];
  themes: Theme[];
};

const uid = () => Math.random().toString(36).slice(2, 9);
const STORAGE_KEY = "design-system-lab-project-v1";
const scaleSteps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];

function mixHex(hex: string, toward: "white" | "black", ratio: number) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return hex;
  const target = toward === "white" ? 255 : 0;
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16));
  return `#${channels.map((channel) => Math.round(channel + (target - channel) * ratio).toString(16).padStart(2, "0")).join("")}`;
}

function makeScale(base: string) {
  return {
    "50": mixHex(base, "white", .9), "100": mixHex(base, "white", .78),
    "200": mixHex(base, "white", .6), "300": mixHex(base, "white", .4),
    "400": mixHex(base, "white", .2), "500": base,
    "600": mixHex(base, "black", .14), "700": mixHex(base, "black", .28),
    "800": mixHex(base, "black", .42), "900": mixHex(base, "black", .58),
  };
}

function palette(name: string, role: string, base: string): ColorPalette {
  return { id: uid(), name, role, base, scale: makeScale(base) };
}

const tokens = (values: [string, string][]): ScaleToken[] =>
  values.map(([name, value]) => ({ id: uid(), name, value }));

const initialProject: DesignSystemProject = {
  schemaVersion: 1,
  id: "ds-nova",
  meta: {
    name: "Nova Design System",
    description: "Una base clara, expresiva y accesible para productos digitales.",
    target: "both",
    cover: "",
    updatedAt: new Date().toISOString(),
  },
  foundations: {
    colors: [palette("Indigo", "Primaria", "#5B5CE2"), palette("Amber", "Acento", "#F5A524"), palette("Slate", "Neutra", "#64748B")],
    typography: [
      { id: uid(), name: "Display", family: "Inter", size: "48px", weight: "650", lineHeight: "1.08" },
      { id: uid(), name: "Heading", family: "Inter", size: "28px", weight: "650", lineHeight: "1.2" },
      { id: uid(), name: "Body", family: "Inter", size: "16px", weight: "400", lineHeight: "1.55" },
      { id: uid(), name: "Label", family: "Inter", size: "13px", weight: "600", lineHeight: "1.3" },
    ],
    spacing: tokens([["2xs", "4px"], ["xs", "8px"], ["sm", "12px"], ["md", "16px"], ["lg", "24px"], ["xl", "32px"], ["2xl", "48px"], ["3xl", "64px"]]),
    dimensions: tokens([["control-sm", "32px"], ["control-md", "40px"], ["control-lg", "48px"]]),
    radii: tokens([["sm", "6px"], ["md", "10px"], ["lg", "16px"], ["pill", "999px"]]),
    borders: tokens([["subtle", "1px solid #E7E7EC"], ["strong", "1px solid #C9CAD3"]]),
    shadows: tokens([["sm", "0 1px 3px rgba(25,25,35,.08)"], ["md", "0 8px 24px rgba(25,25,35,.12)"], ["lg", "0 20px 50px rgba(25,25,35,.18)"]]),
    opacity: tokens([["disabled", "0.42"], ["muted", "0.68"], ["solid", "1"]]),
    layout: tokens([["content", "1200px"], ["sidebar", "280px"], ["gutter", "24px"]]),
    customGroups: [],
  },
  semanticTokens: [
    { id: "surface", name: "surface.default", category: "Superficie", defaultRef: "Slate.50" },
    { id: "surface-raised", name: "surface.raised", category: "Superficie", defaultRef: "#FFFFFF" },
    { id: "text", name: "text.primary", category: "Texto", defaultRef: "Slate.900" },
    { id: "text-muted", name: "text.muted", category: "Texto", defaultRef: "Slate.600" },
    { id: "action", name: "action.primary", category: "Acción", defaultRef: "Indigo.500" },
    { id: "action-text", name: "action.on-primary", category: "Acción", defaultRef: "#FFFFFF" },
    { id: "border", name: "border.subtle", category: "Borde", defaultRef: "Slate.200" },
    { id: "accent", name: "accent.default", category: "Acento", defaultRef: "Amber.500" },
  ],
  themes: [
    { id: "light", name: "Claro", values: {} },
    { id: "dark", name: "Oscuro", values: { surface: "Slate.900", "surface-raised": "Slate.800", text: "Slate.50", "text-muted": "Slate.300", action: "Indigo.400", border: "Slate.700" } },
  ],
};

const navItems: { id: Section; label: string; hint: string }[] = [
  { id: "project", label: "Proyecto", hint: "01" },
  { id: "colors", label: "Color", hint: "02" },
  { id: "typography", label: "Tipografía", hint: "03" },
  { id: "scales", label: "Escalas & layout", hint: "04" },
  { id: "themes", label: "Temas & semántica", hint: "05" },
  { id: "export", label: "Exportar", hint: "06" },
];

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
  return [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16));
}

function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const channels = rgb.map((value) => {
      const normalized = value / 255;
      return normalized <= .03928 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
    });
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  };
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + .05) / (low + .05);
}

function resolveColor(project: DesignSystemProject, ref: string) {
  if (ref.startsWith("#")) return ref;
  const [paletteName, step] = ref.split(".");
  return project.foundations.colors.find((item) => item.name === paletteName)?.scale[step] || "#777777";
}

function downloadFile(filename: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Field({ label, value, onChange, multiline = false, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /> : <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <header className="section-header">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action}
    </header>
  );
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warning" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export default function Home() {
  const [project, setProject] = useState<DesignSystemProject>(initialProject);
  const [section, setSection] = useState<Section>("project");
  const [activeThemeId, setActiveThemeId] = useState("light");
  const [device, setDevice] = useState<"web" | "mobile">("web");
  const [selectedScale, setSelectedScale] = useState<ScaleGroupKey>("spacing");
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let savedProject: DesignSystemProject | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) savedProject = JSON.parse(saved);
    } catch { /* keep sample project */ }
    queueMicrotask(() => {
      if (savedProject) setProject(savedProject);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, meta: { ...project.meta, updatedAt: new Date().toISOString() } }));
  }, [project, hydrated]);

  const updateProject = (recipe: (current: DesignSystemProject) => DesignSystemProject) => setProject((current) => recipe(current));
  const activeTheme = project.themes.find((theme) => theme.id === activeThemeId) || project.themes[0];
  const semantic = useMemo(() => Object.fromEntries(project.semanticTokens.map((token) => [token.id, resolveColor(project, activeTheme?.values[token.id] || token.defaultRef)])), [project, activeTheme]);
  const contrast = contrastRatio(semantic.text, semantic.surface);
  const actionContrast = contrastRatio(semantic["action-text"], semantic.action);
  const duplicateNames = project.foundations.colors.some((item, index, all) => all.findIndex((match) => match.name.toLowerCase() === item.name.toLowerCase()) !== index);
  const issueCount = (contrast < 4.5 ? 1 : 0) + (actionContrast < 4.5 ? 1 : 0) + (duplicateNames ? 1 : 0);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  };

  const importProject = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.schemaVersion !== 1 || !parsed.meta || !parsed.foundations || !parsed.themes) throw new Error("invalid");
        setProject(parsed);
        setActiveThemeId(parsed.themes[0]?.id || "light");
        flash("Proyecto importado correctamente");
      } catch { flash("El archivo no es un proyecto compatible"); }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const exportProject = () => downloadFile(`${project.meta.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "proyecto"}.dslab.json`, JSON.stringify(project, null, 2));

  const renderProject = () => (
    <>
      <SectionHeader eyebrow="Proyecto" title="Definí el punto de partida" description="La identidad y el alcance viajan con cada exportación del laboratorio." />
      <div className="project-grid">
        <div className="panel form-panel">
          <div className="panel-title"><h2>Información general</h2><Pill>Guardado local</Pill></div>
          <Field label="Nombre del proyecto" value={project.meta.name} onChange={(value) => updateProject((p) => ({ ...p, meta: { ...p.meta, name: value } }))} />
          <Field label="Descripción" multiline value={project.meta.description} onChange={(value) => updateProject((p) => ({ ...p, meta: { ...p.meta, description: value } }))} />
          <div className="field"><span>Objetivo</span><div className="segmented wide">{(["web", "mobile", "both"] as Target[]).map((target) => <button key={target} className={project.meta.target === target ? "active" : ""} onClick={() => updateProject((p) => ({ ...p, meta: { ...p.meta, target } }))}>{target === "both" ? "Ambos" : target === "web" ? "Web" : "Mobile"}</button>)}</div></div>
          <label className="cover-upload">
            <input type="file" accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0]; if (!file) return;
              const reader = new FileReader(); reader.onload = () => updateProject((p) => ({ ...p, meta: { ...p.meta, cover: String(reader.result) } })); reader.readAsDataURL(file);
            }} />
            <span className="upload-icon">＋</span><strong>{project.meta.cover ? "Cambiar portada" : "Agregar portada"}</strong><small>PNG o JPG · se guarda dentro del proyecto</small>
          </label>
        </div>
        <div className="project-cover" style={project.meta.cover ? { backgroundImage: `linear-gradient(135deg, rgba(31,25,64,.12), rgba(31,25,64,.58)), url(${project.meta.cover})` } : undefined}>
          <div className="cover-mark"><span></span><span></span><span></span></div>
          <div><Pill>{project.meta.target === "both" ? "Web + Mobile" : project.meta.target}</Pill><h2>{project.meta.name || "Proyecto sin nombre"}</h2><p>{project.meta.description || "Escribí una descripción para darle dirección al sistema."}</p></div>
        </div>
      </div>
      <div className="insight-row">
        <div><span className="metric">{project.foundations.colors.length}</span><p>Paletas activas</p></div>
        <div><span className="metric">{project.semanticTokens.length}</span><p>Tokens semánticos</p></div>
        <div><span className="metric">{project.themes.length}</span><p>Modos configurados</p></div>
        <div><span className="metric">{issueCount}</span><p>Alertas abiertas</p></div>
      </div>
    </>
  );

  const renderColors = () => (
    <>
      <SectionHeader eyebrow="Foundations / Color" title="Construí paletas con intención" description="Cada color base genera una escala editable. Usá roles para ordenar sin limitar tu sistema." action={<button className="primary-button" onClick={() => updateProject((p) => ({ ...p, foundations: { ...p.foundations, colors: [...p.foundations.colors, palette(`Paleta ${p.foundations.colors.length + 1}`, "Personalizada", "#7C3AED")] } }))}>＋ Nueva paleta</button>} />
      <div className="stack">
        {project.foundations.colors.map((item) => (
          <article className="panel palette-card" key={item.id}>
            <div className="palette-head">
              <div className="color-well" style={{ background: item.base }}><input aria-label={`Color base de ${item.name}`} type="color" value={item.base} onChange={(event) => updateProject((p) => ({ ...p, foundations: { ...p.foundations, colors: p.foundations.colors.map((candidate) => candidate.id === item.id ? { ...candidate, base: event.target.value.toUpperCase(), scale: makeScale(event.target.value.toUpperCase()) } : candidate) } }))} /></div>
              <div className="palette-fields"><input className="inline-title" value={item.name} onChange={(event) => updateProject((p) => ({ ...p, foundations: { ...p.foundations, colors: p.foundations.colors.map((candidate) => candidate.id === item.id ? { ...candidate, name: event.target.value } : candidate) } }))} /><input className="inline-role" value={item.role} onChange={(event) => updateProject((p) => ({ ...p, foundations: { ...p.foundations, colors: p.foundations.colors.map((candidate) => candidate.id === item.id ? { ...candidate, role: event.target.value } : candidate) } }))} /></div>
              <code>{item.base}</code>
              <button className="icon-button danger" aria-label={`Eliminar ${item.name}`} onClick={() => updateProject((p) => ({ ...p, foundations: { ...p.foundations, colors: p.foundations.colors.filter((candidate) => candidate.id !== item.id) } }))}>×</button>
            </div>
            <div className="swatch-scale">{scaleSteps.map((step) => <label key={step} className="swatch" style={{ background: item.scale[step], color: Number(step) > 500 ? "#fff" : "#202027" }}><span>{step}</span><input value={item.scale[step]} onChange={(event) => updateProject((p) => ({ ...p, foundations: { ...p.foundations, colors: p.foundations.colors.map((candidate) => candidate.id === item.id ? { ...candidate, scale: { ...candidate.scale, [step]: event.target.value } } : candidate) } }))} /></label>)}</div>
          </article>
        ))}
      </div>
    </>
  );

  const renderTypography = () => (
    <>
      <SectionHeader eyebrow="Foundations / Tipografía" title="Dale voz a la interfaz" description="Definí estilos reutilizables. El preview refleja cada cambio en el momento." action={<button className="primary-button" onClick={() => updateProject((p) => ({ ...p, foundations: { ...p.foundations, typography: [...p.foundations.typography, { id: uid(), name: "Nuevo estilo", family: "Inter", size: "16px", weight: "400", lineHeight: "1.5" }] } }))}>＋ Nuevo estilo</button>} />
      <div className="panel type-table">
        <div className="type-row type-header"><span>Estilo</span><span>Familia</span><span>Tamaño</span><span>Peso</span><span>Interlínea</span><span></span></div>
        {project.foundations.typography.map((style) => (
          <div className="type-row" key={style.id}>
            {(["name", "family", "size", "weight", "lineHeight"] as const).map((key) => <input key={key} value={style[key]} onChange={(event) => updateProject((p) => ({ ...p, foundations: { ...p.foundations, typography: p.foundations.typography.map((candidate) => candidate.id === style.id ? { ...candidate, [key]: event.target.value } : candidate) } }))} />)}
            <button className="icon-button danger" onClick={() => updateProject((p) => ({ ...p, foundations: { ...p.foundations, typography: p.foundations.typography.filter((candidate) => candidate.id !== style.id) } }))}>×</button>
            <div className="type-sample" style={{ fontFamily: style.family, fontSize: style.size, fontWeight: style.weight, lineHeight: style.lineHeight }}>Diseñar es hacer visible una intención.</div>
          </div>
        ))}
      </div>
    </>
  );

  const scaleLabels: Record<ScaleGroupKey, string> = { spacing: "Espaciado", dimensions: "Dimensiones", radii: "Radios", borders: "Bordes", shadows: "Sombras", opacity: "Opacidad", layout: "Layout" };
  const renderScales = () => {
    const group = project.foundations[selectedScale];
    return <>
      <SectionHeader eyebrow="Foundations / Escalas" title="Alineá el ritmo del sistema" description="Las escalas sostienen la consistencia entre componentes, plataformas y densidades." />
      <div className="scale-layout">
        <div className="scale-tabs">{(Object.keys(scaleLabels) as ScaleGroupKey[]).map((key) => <button className={selectedScale === key ? "active" : ""} key={key} onClick={() => setSelectedScale(key)}><span>{scaleLabels[key]}</span><small>{project.foundations[key].length}</small></button>)}</div>
        <div className="panel token-editor">
          <div className="panel-title"><div><span className="eyebrow">Grupo activo</span><h2>{scaleLabels[selectedScale]}</h2></div><button className="secondary-button" onClick={() => updateProject((p) => ({ ...p, foundations: { ...p.foundations, [selectedScale]: [...p.foundations[selectedScale], { id: uid(), name: `token-${p.foundations[selectedScale].length + 1}`, value: "16px" }] } }))}>＋ Token</button></div>
          <div className="token-list">
            {group.map((token) => <div className="token-line" key={token.id}><input value={token.name} onChange={(event) => updateProject((p) => ({ ...p, foundations: { ...p.foundations, [selectedScale]: p.foundations[selectedScale].map((candidate) => candidate.id === token.id ? { ...candidate, name: event.target.value } : candidate) } }))} /><input className="value-input" value={token.value} onChange={(event) => updateProject((p) => ({ ...p, foundations: { ...p.foundations, [selectedScale]: p.foundations[selectedScale].map((candidate) => candidate.id === token.id ? { ...candidate, value: event.target.value } : candidate) } }))} /><div className={`token-visual token-${selectedScale}`} style={{ "--token-value": token.value } as CSSProperties}></div><button className="icon-button danger" onClick={() => updateProject((p) => ({ ...p, foundations: { ...p.foundations, [selectedScale]: p.foundations[selectedScale].filter((candidate) => candidate.id !== token.id) } }))}>×</button></div>)}
          </div>
        </div>
      </div>
      <div className="panel custom-groups">
        <div className="panel-title"><div><h2>Grupos libres</h2><p>Sumá foundations propios para necesidades específicas.</p></div><button className="secondary-button" onClick={() => updateProject((p) => ({ ...p, foundations: { ...p.foundations, customGroups: [...p.foundations.customGroups, { id: uid(), name: "Nuevo grupo", tokens: [] }] } }))}>＋ Crear grupo</button></div>
        {project.foundations.customGroups.length === 0 ? <div className="empty-state">Todavía no hay grupos personalizados.</div> : <div className="custom-grid">{project.foundations.customGroups.map((group) => <div className="custom-card" key={group.id}><input className="inline-title" value={group.name} onChange={(event) => updateProject((p) => ({ ...p, foundations: { ...p.foundations, customGroups: p.foundations.customGroups.map((candidate) => candidate.id === group.id ? { ...candidate, name: event.target.value } : candidate) } }))} /><span>{group.tokens.length} tokens</span><button className="text-button" onClick={() => updateProject((p) => ({ ...p, foundations: { ...p.foundations, customGroups: p.foundations.customGroups.map((candidate) => candidate.id === group.id ? { ...candidate, tokens: [...candidate.tokens, { id: uid(), name: `token-${candidate.tokens.length + 1}`, value: "value" }] } : candidate) } }))}>Agregar token</button></div>)}</div>}
      </div>
    </>;
  };

  const colorRefs = ["#FFFFFF", "#000000", ...project.foundations.colors.flatMap((item) => scaleSteps.map((step) => `${item.name}.${step}`))];
  const renderThemes = () => (
    <>
      <SectionHeader eyebrow="Tokens semánticos" title="Separá intención de valor" description="Los temas reasignan referencias sin duplicar foundations. Así cada modo conserva el mismo lenguaje." action={<button className="primary-button" onClick={() => { const id = uid(); updateProject((p) => ({ ...p, themes: [...p.themes, { id, name: `Modo ${p.themes.length + 1}`, values: {} }] })); setActiveThemeId(id); }}>＋ Nuevo modo</button>} />
      <div className="theme-bar"><span>Modo editado</span><div className="segmented">{project.themes.map((theme) => <button key={theme.id} className={activeThemeId === theme.id ? "active" : ""} onClick={() => setActiveThemeId(theme.id)}>{theme.name}</button>)}</div>{activeTheme && <input aria-label="Nombre del modo" value={activeTheme.name} onChange={(event) => updateProject((p) => ({ ...p, themes: p.themes.map((theme) => theme.id === activeTheme.id ? { ...theme, name: event.target.value } : theme) }))} />}</div>
      <div className="panel semantic-table">
        <div className="semantic-row semantic-header"><span>Token</span><span>Categoría</span><span>Referencia</span><span>Valor resuelto</span></div>
        {project.semanticTokens.map((token) => {
          const ref = activeTheme?.values[token.id] || token.defaultRef;
          const color = resolveColor(project, ref);
          return <div className="semantic-row" key={token.id}><div><code>{token.name}</code></div><span>{token.category}</span><select value={ref} onChange={(event) => updateProject((p) => ({ ...p, themes: p.themes.map((theme) => theme.id === activeTheme.id ? { ...theme, values: { ...theme.values, [token.id]: event.target.value } } : theme) }))}>{colorRefs.map((option) => <option key={option}>{option}</option>)}</select><div className="resolved"><span style={{ background: color }}></span><code>{color}</code></div></div>;
        })}
      </div>
      <div className="validation-grid">
        <div className={`validation-card ${contrast >= 4.5 ? "pass" : "fail"}`}><div><span className="validation-dot"></span><strong>Texto / superficie</strong></div><b>{contrast.toFixed(2)}:1</b><p>{contrast >= 4.5 ? "Cumple WCAG AA para texto normal" : "Requiere al menos 4.5:1"}</p></div>
        <div className={`validation-card ${actionContrast >= 4.5 ? "pass" : "fail"}`}><div><span className="validation-dot"></span><strong>Acción primaria</strong></div><b>{actionContrast.toFixed(2)}:1</b><p>{actionContrast >= 4.5 ? "Contraste suficiente" : "Revisá action.on-primary"}</p></div>
        <div className={`validation-card ${!duplicateNames ? "pass" : "fail"}`}><div><span className="validation-dot"></span><strong>Nombres únicos</strong></div><b>{duplicateNames ? "Alerta" : "Listo"}</b><p>{duplicateNames ? "Hay paletas con el mismo nombre" : "Las referencias son consistentes"}</p></div>
      </div>
    </>
  );

  const toTokenExport = () => ({
    $schema: "https://design-tokens.github.io/community-group/format/",
    color: Object.fromEntries(project.foundations.colors.map((item) => [item.name.toLowerCase(), Object.fromEntries(scaleSteps.map((step) => [step, { $value: item.scale[step], $type: "color" }]))])),
    semantic: Object.fromEntries(project.semanticTokens.map((token) => [token.name.replace(".", "-"), { $value: resolveColor(project, activeTheme.values[token.id] || token.defaultRef), $type: "color", $description: `${activeTheme.name}: ${activeTheme.values[token.id] || token.defaultRef}` }])),
  });
  const toCss = () => `:root {\n${project.semanticTokens.map((token) => `  --${token.name.replaceAll(".", "-")}: ${resolveColor(project, project.themes[0].values[token.id] || token.defaultRef)};`).join("\n")}\n}\n\n${project.themes.slice(1).map((theme) => `[data-theme="${theme.name.toLowerCase()}"] {\n${project.semanticTokens.map((token) => `  --${token.name.replaceAll(".", "-")}: ${resolveColor(project, theme.values[token.id] || token.defaultRef)};`).join("\n")}\n}`).join("\n\n")}`;

  const renderExport = () => (
    <>
      <SectionHeader eyebrow="Salida" title="Llevate un blueprint, no una jaula" description="Exportá el proyecto completo para retomarlo, o una base limpia para continuar el trabajo manual en Figma y código." />
      <div className="export-grid">
        <article className="export-card featured"><div className="export-symbol">DS</div><div><Pill tone="good">Recomendado</Pill><h2>Proyecto del laboratorio</h2><p>Incluye configuración, foundations, temas y referencias. Importalo más adelante para seguir exactamente donde quedaste.</p><ul><li>Modelo completo y versionado</li><li>Compatible con importar proyecto</li><li>Portada incluida</li></ul></div><button className="primary-button" onClick={exportProject}>Descargar .dslab.json <span>↓</span></button></article>
        <article className="export-card"><div className="export-symbol figma">F</div><div><h2>Tokens para Figma</h2><p>JSON estructurado según el formato del Design Tokens Community Group. Ideal como base para plugins de tokens.</p><ul><li>Paletas y escalas</li><li>Semánticos del modo activo</li><li>Referencias documentadas</li></ul></div><button className="secondary-button" onClick={() => downloadFile(`${project.meta.name}-tokens.json`, JSON.stringify(toTokenExport(), null, 2))}>Exportar tokens <span>↓</span></button></article>
        <article className="export-card"><div className="export-symbol css">{`{ }`}</div><div><h2>Variables CSS</h2><p>Variables semánticas listas para prototipos web, con selectores separados por tema.</p><ul><li>Custom properties</li><li>Todos los modos</li><li>Valores resueltos</li></ul></div><button className="secondary-button" onClick={() => downloadFile(`${project.meta.name}-tokens.css`, toCss(), "text/css")}>Descargar CSS <span>↓</span></button></article>
      </div>
      <div className="handoff-note"><div className="note-mark">i</div><div><strong>Un punto de partida flexible</strong><p>La exportación no crea componentes ni pantallas. Tu criterio define qué foundations pasan a Figma, cómo se convierten en estilos y qué se descarta.</p></div></div>
    </>
  );

  const renderSection = () => ({ project: renderProject, colors: renderColors, typography: renderTypography, scales: renderScales, themes: renderThemes, export: renderExport }[section]());

  const previewStyle = {
    "--preview-surface": semantic.surface, "--preview-raised": semantic["surface-raised"], "--preview-text": semantic.text,
    "--preview-muted": semantic["text-muted"], "--preview-action": semantic.action, "--preview-action-text": semantic["action-text"],
    "--preview-border": semantic.border, "--preview-accent": semantic.accent,
  } as CSSProperties;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setSection("project")}><span className="brand-mark"><i></i><i></i><i></i></span><span>Design System <b>Lab</b></span></button>
        <div className="top-project"><span className="status-dot"></span><div><strong>{project.meta.name || "Sin nombre"}</strong><small>Guardado automáticamente</small></div></div>
        <div className="top-actions"><button className="quiet-button" onClick={() => importRef.current?.click()}>Importar</button><button className="quiet-button" onClick={exportProject}>Guardar proyecto</button><button className="primary-button" onClick={() => setSection("export")}>Exportar <span>↗</span></button><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importProject} /></div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="side-label">Configurar</div>
          <nav>{navItems.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><span>{item.hint}</span>{item.label}{item.id === "themes" && issueCount > 0 && <b>{issueCount}</b>}</button>)}</nav>
          <div className="progress-card"><div><span>Blueprint</span><b>{issueCount === 0 ? "Listo" : "En progreso"}</b></div><div className="progress-track"><span style={{ width: issueCount === 0 ? "100%" : "72%" }}></span></div><small>{issueCount === 0 ? "Sin alertas activas" : `${issueCount} ${issueCount === 1 ? "alerta pendiente" : "alertas pendientes"}`}</small></div>
        </aside>
        <main className="editor"><div className="editor-inner">{renderSection()}</div></main>
        <aside className="preview-pane" style={previewStyle}>
          <div className="preview-toolbar"><div><span className="eyebrow">Preview en vivo</span><strong>{activeTheme?.name}</strong></div><div className="segmented tiny"><button className={device === "web" ? "active" : ""} onClick={() => setDevice("web")}>▱</button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}>▯</button></div></div>
          <div className="preview-stage">
            <div className={`device device-${device}`}>
              {device === "web" ? <div className="browser-bar"><i></i><i></i><i></i><span>nova.app</span></div> : <div className="phone-bar"><span>9:41</span><i></i></div>}
              <div className="preview-ui">
                <div className="preview-nav"><div className="preview-logo">N</div>{device === "web" && <div className="preview-links"><span>Inicio</span><span>Proyectos</span><span>Equipo</span></div>}<div className="avatar">FB</div></div>
                <div className="preview-content">
                  <span className="preview-kicker">ESPACIO DE TRABAJO</span><h3>Diseñá con<br/><em>claridad.</em></h3><p>Un sistema compartido para crear experiencias coherentes y memorables.</p>
                  <div className="preview-buttons"><button>Crear proyecto</button><button>Explorar</button></div>
                  <div className="preview-card"><div className="card-top"><span className="mini-icon">✦</span><div><strong>Kit de producto</strong><small>Actualizado hoy</small></div><span className="more">•••</span></div><div className="mini-chart"><i></i><i></i><i></i><i></i><i></i><i></i></div><div className="card-foot"><span><b>24</b> componentes</span><span className="preview-badge">En curso</span></div></div>
                </div>
                {device === "mobile" && <div className="mobile-dock"><span>●<small>Inicio</small></span><span>□<small>Proyectos</small></span><span>◇<small>Equipo</small></span></div>}
              </div>
            </div>
          </div>
          <div className="preview-footer"><div><span>Contraste</span><Pill tone={contrast >= 4.5 ? "good" : "warning"}>{contrast.toFixed(2)}:1</Pill></div><div><span>Viewport</span><code>{device === "web" ? "1440 × 900" : "390 × 844"}</code></div></div>
        </aside>
      </div>
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}
