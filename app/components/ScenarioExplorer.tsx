"use client";

import { CSSProperties, useMemo, useState } from "react";
import { catalogRegistry, CatalogEntry } from "../lib/catalog-registry";
import { DesignSystemProject, PlatformId } from "../lib/model";
import { scenarioCoverage, scenarioRegistry } from "../lib/scenario-registry";
import { resolveProjectTokens } from "../lib/token-resolver";
import { ProjectComponentPreview } from "./Catalog";
import { Alert, Badge, Card, Checkbox, SectionHeading, Select } from "./ui/LabUI";

type Axis = "platforms" | "modes";
const comparisonPlatforms: PlatformId[] = ["mobile", "tablet", "desktop"];
const usefulState: Record<string, string> = {
  checkbox: "Selected", radio: "Selected", switch: "Selected", tabs: "Selected", alert: "Warning", badge: "Success",
  progress: "Complete", accordion: "Open", dropdown: "Default", pagination: "Selected", card: "Hover", list: "Selected", toast: "Success",
};

function ScenarioModule({ entry, style }: { entry: CatalogEntry; style: CSSProperties }) {
  const state = usefulState[entry.id] || entry.states[0];
  return <article className={`scenario-module scenario-module-${entry.id}`}><span>{entry.name}</span><ProjectComponentPreview entry={entry} state={state} portalStyle={style} /></article>;
}

function ScenarioCanvas({ project, scenarioId, theme, platform, showGrid }: { project: DesignSystemProject; scenarioId: string; theme: string; platform: PlatformId; showGrid: boolean }) {
  const scenario = scenarioRegistry.find((item) => item.id === scenarioId) || scenarioRegistry[0];
  const snapshot = resolveProjectTokens(project, theme, platform);
  const entries = scenario.componentIds.map((id) => catalogRegistry.find((entry) => entry.id === id)).filter(Boolean) as CatalogEntry[];
  const style = snapshot.cssVariables as CSSProperties;
  return <div className={`scenario-comparison-card platform-${platform}`}>
    <div className="scenario-comparison-label"><div><b>{project.platforms[platform].name}</b><span>{project.themes.find((item) => item.id === theme)?.name}</span></div><Badge tone={snapshot.ready ? "success" : "warning"}>{snapshot.ready ? "Resuelto" : "Pendiente"}</Badge></div>
    <div className={`scenario-product-shell ${showGrid ? "show-grid" : ""}`} style={style}>
      <div className="scenario-grid-lines" aria-hidden="true">{Array.from({ length: Number(style["--ds-columns" as keyof CSSProperties]) || 4 }).map((_, index) => <i key={index} />)}</div>
      <header className="scenario-product-header"><div><span>{project.meta.brandMark}</span><b>{project.meta.name}</b></div><nav aria-label="Navegación del escenario"><a href="#scenario-content">Inicio</a><a href="#scenario-content">Equipo</a><a href="#scenario-content">Ajustes</a></nav></header>
      <aside className="scenario-product-sidebar" aria-label="Navegación secundaria"><b>{scenario.name}</b><a href="#scenario-content">Resumen</a><a href="#scenario-content">Actividad</a><a href="#scenario-content">Biblioteca</a></aside>
      <section id="scenario-content" className="scenario-product-main" aria-label={`Contenido de ${scenario.name}`}><div className="scenario-product-title"><div><small>Escenario vivo</small><h3>{scenario.name}</h3><p>{scenario.description}</p></div></div><div className="scenario-module-grid">{entries.map((entry) => <ScenarioModule key={entry.id} entry={entry} style={style} />)}</div></section>
      <aside className="scenario-product-inspector"><b>Inspector</b><span>{entries.length} componentes</span><span>{snapshot.missing.length ? `${snapshot.missing.length} referencias pendientes` : "Tokens resueltos"}</span></aside>
      <nav className="scenario-product-bottom" aria-label="Navegación mobile"><a href="#scenario-content">Inicio</a><a href="#scenario-content">Actividad</a><a href="#scenario-content">Perfil</a></nav>
      {!snapshot.ready ? <div className="scenario-configuration-pending">Configuración pendiente: no se inventan valores para {snapshot.missing.length} referencias.</div> : null}
    </div>
  </div>;
}

export function ScenarioExplorer({ project, initialComponent }: { project: DesignSystemProject; initialComponent?: string }) {
  const initialScenario = scenarioRegistry.find((item) => initialComponent && item.componentIds.includes(initialComponent)) || scenarioRegistry[0];
  const [axis, setAxis] = useState<Axis>("platforms");
  const [scenarioId, setScenarioId] = useState(initialScenario.id);
  const [theme, setTheme] = useState(project.themes[0]?.id || "light");
  const [platform, setPlatform] = useState<PlatformId>("mobile");
  const [showGrid, setShowGrid] = useState(false);
  const comparisons = useMemo(() => axis === "platforms"
    ? comparisonPlatforms.map((item) => ({ key: `${theme}-${item}`, theme, platform: item }))
    : project.themes.map((item) => ({ key: `${item.id}-${platform}`, theme: item.id, platform })), [axis, theme, platform, project.themes]);
  const scenario = scenarioRegistry.find((item) => item.id === scenarioId) || scenarioRegistry[0];

  return <div className="scenario-explorer-v4">
    <SectionHeading title="Escenarios" description="Comparación integrada de modos, plataformas, tipografía, color, espaciado y layout con estructuras de producto diferenciadas." />
    {initialComponent ? <Alert tone="info" title="Evidencia vinculada">Abrimos el escenario que contiene {catalogRegistry.find((entry) => entry.id === initialComponent)?.name || initialComponent}.</Alert> : null}
    <Card className="scenario-toolbar"><Select label="Comparar" value={axis} onValueChange={(value) => setAxis(value as Axis)} options={[{ value: "platforms", label: "Plataformas" }, { value: "modes", label: "Modos" }]} /><Select label="Escenario" value={scenarioId} onValueChange={(value) => setScenarioId(value as typeof scenarioId)} options={scenarioRegistry.map((item) => ({ value: item.id, label: item.name }))} />{axis === "platforms" ? <Select label="Modo" value={theme} onValueChange={setTheme} options={project.themes.map((item) => ({ value: item.id, label: item.name }))} /> : <Select label="Plataforma" value={platform} onValueChange={(value) => setPlatform(value as PlatformId)} options={comparisonPlatforms.map((id) => ({ value: id, label: project.platforms[id].name }))} />}<Checkbox checked={showGrid} onCheckedChange={setShowGrid} label="Mostrar grilla" /></Card>
    <Card className="scenario-coverage"><div><b>Cobertura de la suite</b><span>{scenarioCoverage.length}/{catalogRegistry.length} componentes distribuidos en {scenarioRegistry.length} escenarios</span></div><div><b>Esta vista</b><span>{scenario.componentIds.length} componentes · {scenario.description}</span></div></Card>
    {scenarioCoverage.length !== catalogRegistry.length ? <Alert tone="warning" title="Cobertura incompleta">La suite todavía no representa todo el registro del Catálogo.</Alert> : null}
    <div className={`scenario-comparisons compare-${axis}`}>{comparisons.map((item) => <ScenarioCanvas key={item.key} project={project} scenarioId={scenarioId} theme={item.theme} platform={item.platform} showGrid={showGrid} />)}</div>
  </div>;
}
