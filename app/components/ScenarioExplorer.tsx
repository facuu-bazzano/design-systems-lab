"use client";

import { CSSProperties, useId, useMemo, useState } from "react";
import { catalogRegistry, CatalogEntry } from "../lib/catalog-registry";
import { DesignSystemProject, PlatformId } from "../lib/model";
import { ScenarioDefinition, scenarioCoverage, scenarioRegistry } from "../lib/scenario-registry";
import { resolveProjectTokens } from "../lib/token-resolver";
import { ProjectComponentPreview } from "./Catalog";
import { Alert, Badge, Card, Checkbox, SectionHeading, Select, Toggle } from "./ui/LabUI";

type ExplorerView = "explore" | "platforms" | "modes";
type ScaleSimulation = "configured" | "compact" | "comfortable" | "zoom";

const comparisonPlatforms: PlatformId[] = ["mobile", "mobile-landscape", "tablet", "desktop"];
const scaleSimulations: { value: ScaleSimulation; label: string; typography: number; spacing: number; dimensions: number }[] = [
  { value: "configured", label: "Configurada", typography: 1, spacing: 1, dimensions: 1 },
  { value: "compact", label: "Compacta", typography: .94, spacing: .82, dimensions: .92 },
  { value: "comfortable", label: "Respirable", typography: 1.06, spacing: 1.2, dimensions: 1.08 },
  { value: "zoom", label: "Zoom 125%", typography: 1.25, spacing: 1.25, dimensions: 1.15 },
];
const usefulState: Record<string, string> = {
  checkbox: "Selected", radio: "Selected", switch: "Selected", tabs: "Selected", alert: "Warning", badge: "Success",
  progress: "Complete", accordion: "Open", dropdown: "Default", pagination: "Selected", card: "Hover", list: "Selected", toast: "Success",
};

const scenarioSections: Record<ScenarioDefinition["id"], { title: string; description: string; componentIds: string[] }[]> = {
  configuration: [
    { title: "Datos principales", description: "Información, selección y agenda.", componentIds: ["input", "textarea", "select", "calendar"] },
    { title: "Preferencias", description: "Opciones y asistencia contextual.", componentIds: ["checkbox", "radio", "switch", "tooltip"] },
    { title: "Respuesta y acciones", description: "Estados, llamadas a la acción y confirmación.", componentIds: ["alert", "badge", "button", "link", "icon", "modal"] },
  ],
  dashboard: [
    { title: "Navegación de datos", description: "Cambios de vista y recorrido del conjunto.", componentIds: ["tabs", "dropdown", "pagination"] },
    { title: "Resumen operativo", description: "Indicadores y contenido estructurado.", componentIds: ["card", "progress", "table", "list", "avatar"] },
    { title: "Estados del sistema", description: "Carga, espera y confirmación.", componentIds: ["loading", "skeleton", "toast"] },
  ],
  content: [
    { title: "Orientación", description: "Jerarquía y exploración progresiva.", componentIds: ["breadcrumbs", "accordion"] },
    { title: "Contenido visual", description: "Medios y secuencias destacadas.", componentIds: ["image", "carousel"] },
    { title: "Estructura", description: "Separación explícita entre bloques.", componentIds: ["divider"] },
  ],
};

function multiplyLength(value: unknown, factor: number) {
  if (typeof value !== "string") return value;
  const match = value.match(/^(-?[\d.]+)px$/);
  return match ? `${Math.round(Number(match[1]) * factor * 100) / 100}px` : value;
}

function applyScaleSimulation(style: CSSProperties, simulation: ScaleSimulation) {
  const preset = scaleSimulations.find((item) => item.value === simulation) || scaleSimulations[0];
  if (simulation === "configured") return style;
  const adjusted = { ...style } as Record<string, string | number | undefined>;
  Object.entries(adjusted).forEach(([name, value]) => {
    if (name.startsWith("--ds-type-") && name.endsWith("-size")) adjusted[name] = multiplyLength(value, preset.typography) as string;
    else if (name.startsWith("--ds-space-") || name === "--ds-gutter" || name === "--ds-margin") adjusted[name] = multiplyLength(value, preset.spacing) as string;
    else if (name.startsWith("--ds-dimensions-")) adjusted[name] = multiplyLength(value, preset.dimensions) as string;
  });
  return adjusted as CSSProperties;
}

function ScenarioModule({ entry, style }: { entry: CatalogEntry; style: CSSProperties }) {
  const state = usefulState[entry.id] || entry.states[0];
  return <article className={`scenario-module scenario-module-${entry.id}`}><span>{entry.name}</span><ProjectComponentPreview entry={entry} state={state} portalStyle={style} /></article>;
}

function ScenarioFlow({ scenario, entries, style }: { scenario: ScenarioDefinition; entries: CatalogEntry[]; style: CSSProperties }) {
  return <div className={`scenario-flow scenario-flow-${scenario.id}`}>
    {scenarioSections[scenario.id].map((section) => {
      const sectionEntries = section.componentIds.map((id) => entries.find((entry) => entry.id === id)).filter(Boolean) as CatalogEntry[];
      if (!sectionEntries.length) return null;
      return <section className="scenario-flow-section" key={section.title}>
        <header><h4>{section.title}</h4><p>{section.description}</p></header>
        <div className="scenario-module-grid">{sectionEntries.map((entry) => <ScenarioModule key={entry.id} entry={entry} style={style} />)}</div>
      </section>;
    })}
  </div>;
}

function ScenarioCanvas({ project, scenarioId, initialTheme, platform, showGrid, lockTheme = false }: { project: DesignSystemProject; scenarioId: ScenarioDefinition["id"]; initialTheme: string; platform: PlatformId; showGrid: boolean; lockTheme?: boolean }) {
  const [activeTheme, setActiveTheme] = useState(initialTheme);
  const [scaleSimulation, setScaleSimulation] = useState<ScaleSimulation>("configured");
  const contentId = `scenario-content-${useId().replaceAll(":", "")}`;
  const scenario = scenarioRegistry.find((item) => item.id === scenarioId) || scenarioRegistry[0];
  const snapshot = resolveProjectTokens(project, activeTheme, platform);
  const entries = scenario.componentIds.map((id) => catalogRegistry.find((entry) => entry.id === id)).filter(Boolean) as CatalogEntry[];
  const style = applyScaleSimulation(snapshot.cssVariables as CSSProperties, scaleSimulation);
  const platformName = project.platforms[platform]?.name || platform;
  const themeName = project.themes.find((item) => item.id === activeTheme)?.name || activeTheme;
  const columns = String((snapshot.cssVariables as Record<string, string | number>)["--ds-columns"] || "—");
  const typeMultiplier = String((snapshot.cssVariables as Record<string, string | number>)["--ds-typography-multiplier"] || 1);
  const spacingMultiplier = String((snapshot.cssVariables as Record<string, string | number>)["--ds-spacing-multiplier"] || 1);

  return <article className={`scenario-comparison-card platform-${platform}`}>
    <header className="scenario-comparison-label">
      <div><b>{platformName}</b><span>{scenario.name}</span></div>
      <Badge tone={snapshot.ready ? "success" : "warning"}>{snapshot.ready ? "Resuelto" : "Pendiente"}</Badge>
    </header>
    <div className="scenario-frame-controls">
      <div className="scenario-theme-control">
        <span>Color</span>
        <div role="group" aria-label={`Modo de color para ${platformName}`}>
          {project.themes.map((item) => <Toggle key={item.id} pressed={item.id === activeTheme} onPressedChange={() => setActiveTheme(item.id)} disabled={lockTheme}>{item.name}</Toggle>)}
        </div>
      </div>
      <Select label="Simular escala" value={scaleSimulation} onValueChange={(value) => setScaleSimulation(value as ScaleSimulation)} options={scaleSimulations.map((item) => ({ value: item.value, label: item.label }))} />
      <p>Vista local: no modifica ni exporta tokens.</p>
    </div>
    <div className="scenario-device-stage">
      <div className={`scenario-product-shell ${showGrid ? "show-grid" : ""}`} style={style}>
        <div className="scenario-grid-lines" aria-hidden="true">{Array.from({ length: Number(columns) || 4 }).map((_, index) => <i key={index} />)}</div>
        <header className="scenario-product-header"><div><span>{project.meta.brandMark}</span><b>{project.meta.name}</b></div><nav aria-label="Navegación del escenario"><a href={`#${contentId}`}>Inicio</a><a href={`#${contentId}`}>Equipo</a><a href={`#${contentId}`}>Ajustes</a></nav></header>
        <aside className="scenario-product-sidebar" aria-label="Navegación secundaria"><b>{scenario.name}</b><a href={`#${contentId}`}><span aria-hidden="true">01</span>Resumen</a><a href={`#${contentId}`}><span aria-hidden="true">02</span>Actividad</a><a href={`#${contentId}`}><span aria-hidden="true">03</span>Biblioteca</a></aside>
        <section id={contentId} className="scenario-product-main" aria-label={`Contenido de ${scenario.name}`}>
          <div className="scenario-product-title"><div><small>Escenario vivo</small><h3>{scenario.name}</h3><p>{scenario.description}</p></div></div>
          <ScenarioFlow scenario={scenario} entries={entries} style={style} />
        </section>
        <aside className="scenario-product-inspector"><b>Inspector</b><span>{entries.length} componentes</span><span>{snapshot.missing.length ? `${snapshot.missing.length} referencias pendientes` : "Tokens resueltos"}</span><dl><div><dt>Modo</dt><dd>{themeName}</dd></div><div><dt>Tipografía</dt><dd>{typeMultiplier}×</dd></div><div><dt>Espaciado</dt><dd>{spacingMultiplier}×</dd></div><div><dt>Grilla</dt><dd>{columns} columnas</dd></div></dl></aside>
        <nav className="scenario-product-bottom" aria-label="Navegación mobile"><a href={`#${contentId}`}>Inicio</a><a href={`#${contentId}`}>Actividad</a><a href={`#${contentId}`}>Perfil</a></nav>
        {!snapshot.ready ? <div className="scenario-configuration-pending">Configuración pendiente: no se inventan valores para {snapshot.missing.length} referencias.</div> : null}
      </div>
    </div>
  </article>;
}

export function ScenarioExplorer({ project, initialComponent }: { project: DesignSystemProject; initialComponent?: string }) {
  const initialScenario = scenarioRegistry.find((item) => initialComponent && item.componentIds.includes(initialComponent)) || scenarioRegistry[0];
  const enabledPlatforms = useMemo(() => {
    const enabled = comparisonPlatforms.filter((id) => project.platforms[id]?.enabled);
    return enabled.length ? enabled : ["mobile" as PlatformId];
  }, [project.platforms]);
  const [view, setView] = useState<ExplorerView>("explore");
  const [scenarioId, setScenarioId] = useState<string>(initialComponent ? initialScenario.id : "all");
  const [platform, setPlatform] = useState<PlatformId>(enabledPlatforms[0]);
  const [showGrid, setShowGrid] = useState(false);
  const activePlatform = enabledPlatforms.includes(platform) ? platform : enabledPlatforms[0];
  const mobileCanShowAll = view === "explore" && activePlatform === "mobile";
  const mobileSuite = mobileCanShowAll && scenarioId === "all";
  const effectiveScenarioId = scenarioId === "all" && !mobileCanShowAll ? initialScenario.id : scenarioId;
  const selectedScenario = scenarioRegistry.find((item) => item.id === effectiveScenarioId) || initialScenario;
  const defaultTheme = project.themes[0]?.id || "light";
  const comparisons = useMemo(() => {
    if (mobileSuite) return scenarioRegistry.map((scenario) => ({ key: `mobile-${scenario.id}`, scenarioId: scenario.id, theme: defaultTheme, platform: "mobile" as PlatformId, lockTheme: false }));
    if (view === "platforms") return enabledPlatforms.map((id) => ({ key: `${id}-${selectedScenario.id}`, scenarioId: selectedScenario.id, theme: defaultTheme, platform: id, lockTheme: false }));
    if (view === "modes") return project.themes.map((item) => ({ key: `${activePlatform}-${item.id}-${selectedScenario.id}`, scenarioId: selectedScenario.id, theme: item.id, platform: activePlatform, lockTheme: true }));
    return [{ key: `${activePlatform}-${selectedScenario.id}`, scenarioId: selectedScenario.id, theme: defaultTheme, platform: activePlatform, lockTheme: false }];
  }, [activePlatform, defaultTheme, enabledPlatforms, mobileSuite, project.themes, selectedScenario, view]);
  const scenarioOptions = mobileCanShowAll
    ? [{ value: "all", label: "Los tres escenarios" }, ...scenarioRegistry.map((item) => ({ value: item.id, label: item.name }))]
    : scenarioRegistry.map((item) => ({ value: item.id, label: item.name }));

  return <div className="scenario-explorer-v4">
    <SectionHeading title="Escenarios" description="Probá el sistema en marcos acotados, con navegación fija, contenido desplazable y estructuras propias de cada plataforma activa." />
    {initialComponent ? <Alert tone="info" title="Evidencia vinculada">Abrimos el escenario que contiene {catalogRegistry.find((entry) => entry.id === initialComponent)?.name || initialComponent}.</Alert> : null}
    <Card className="scenario-toolbar">
      <Select label="Vista" value={view} onValueChange={(value) => setView(value as ExplorerView)} options={[{ value: "explore", label: "Explorar" }, { value: "platforms", label: "Comparar plataformas" }, { value: "modes", label: "Comparar modos" }]} />
      {view !== "platforms" ? <Select label="Plataforma" value={activePlatform} onValueChange={(value) => setPlatform(value as PlatformId)} options={enabledPlatforms.map((id) => ({ value: id, label: project.platforms[id].name }))} /> : null}
      <Select label="Escenario" value={mobileCanShowAll ? scenarioId : effectiveScenarioId} onValueChange={setScenarioId} options={scenarioOptions} />
      <Checkbox checked={showGrid} onCheckedChange={setShowGrid} label="Mostrar grilla" />
    </Card>
    <div className="scenario-context-row">
      <div><b>Cobertura completa</b><span>{scenarioCoverage.length}/{catalogRegistry.length} componentes en {scenarioRegistry.length} escenarios</span></div>
      <div><b>Plataformas activas</b><span>{enabledPlatforms.map((id) => project.platforms[id].name).join(" · ")}</span></div>
      <div><b>Composición actual</b><span>{mobileSuite ? "Tres flujos mobile" : `${comparisons.length} ${comparisons.length === 1 ? "marco" : "marcos"}`}</span></div>
    </div>
    {view === "platforms" && enabledPlatforms.length < 2 ? <Alert tone="info" title="Solo hay una plataforma activa">Activá Tablet o Desktop desde Proyecto para compararlas. Escenarios no muestra plataformas que el proyecto no contempla.</Alert> : null}
    {view === "modes" && project.themes.length < 2 ? <Alert tone="info" title="Solo hay un modo configurado">Agregá otro modo de color para habilitar una comparación real.</Alert> : null}
    {scenarioCoverage.length !== catalogRegistry.length ? <Alert tone="warning" title="Cobertura incompleta">La suite todavía no representa todo el registro del Catálogo.</Alert> : null}
    <div className={`scenario-comparisons view-${view} ${mobileSuite ? "mobile-suite" : ""}`}>{comparisons.map((item) => <ScenarioCanvas key={item.key} project={project} scenarioId={item.scenarioId} initialTheme={item.theme} platform={item.platform} showGrid={showGrid} lockTheme={item.lockTheme} />)}</div>
  </div>;
}
