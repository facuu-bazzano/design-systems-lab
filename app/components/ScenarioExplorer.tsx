"use client";

import { CSSProperties, useEffect, useId, useMemo, useRef, useState } from "react";
import { Activity, Home, Library } from "lucide-react";
import { catalogRegistry, CatalogEntry } from "../lib/catalog-registry";
import { DesignSystemProject, PlatformId, visibleRendererVariants } from "../lib/model";
import { ScenarioDefinition, scenarioCoverage, scenarioRegistry } from "../lib/scenario-registry";
import { resolveProjectTokens, resolveVariantCssVariables } from "../lib/token-resolver";
import { ScenarioComponentPreview } from "./ScenarioComponentPreview";
import { Alert, Badge, Card, SectionHeading, Select, Switch, Toggle } from "./ui/LabUI";

type ExplorerView = "explore" | "platforms" | "modes";

const comparisonPlatforms: PlatformId[] = ["mobile", "mobile-landscape", "tablet", "desktop"];
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

function ScenarioModule({ entry, style, project, theme, platform }: { entry: CatalogEntry; style: CSSProperties; project: DesignSystemProject; theme: string; platform: PlatformId }) {
  const definition = project.components.find((component) => component.rendererKey === entry.id);
  const variants = definition ? visibleRendererVariants(project, definition) : [];
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || "");
  const activeVariantId = variants.some((variant) => variant.id === selectedVariantId) ? selectedVariantId : variants[0]?.id || "";
  const variantStyle = activeVariantId ? resolveVariantCssVariables(project, activeVariantId, theme, platform) as CSSProperties : undefined;
  return <article className={`scenario-module scenario-module-${entry.id}`}>
    <header className="scenario-module-header"><span>{entry.name}</span>{variants.length > 1 ? <Select label="Variante" className="scenario-variant-select" value={activeVariantId} onValueChange={setSelectedVariantId} options={variants.map((variant) => ({ value: variant.id, label: variant.name }))} /> : null}</header>
    <ScenarioComponentPreview entry={entry} portalStyle={style} variantStyle={variantStyle} />
  </article>;
}

function ScenarioFlow({ scenario, entries, style, contentId, project, theme, platform }: { scenario: ScenarioDefinition; entries: CatalogEntry[]; style: CSSProperties; contentId: string; project: DesignSystemProject; theme: string; platform: PlatformId }) {
  return <div className={`scenario-flow scenario-flow-${scenario.id}`}>
    {scenarioSections[scenario.id].map((section) => {
      const sectionEntries = section.componentIds.map((id) => entries.find((entry) => entry.id === id)).filter(Boolean) as CatalogEntry[];
      if (!sectionEntries.length) return null;
      const index = scenarioSections[scenario.id].indexOf(section);
      return <section className="scenario-flow-section" id={`${contentId}-section-${index}`} data-scenario-section={index} key={section.title}>
        <header><h4>{section.title}</h4><p>{section.description}</p></header>
        <div className="scenario-module-grid">{sectionEntries.map((entry) => <ScenarioModule key={entry.id} entry={entry} style={style} project={project} theme={theme} platform={platform} />)}</div>
      </section>;
    })}
  </div>;
}

function ScenarioCanvas({ project, scenarioId, initialTheme, platform, showGrid, lockTheme = false }: { project: DesignSystemProject; scenarioId: ScenarioDefinition["id"]; initialTheme: string; platform: PlatformId; showGrid: boolean; lockTheme?: boolean }) {
  const [activeTheme, setActiveTheme] = useState(initialTheme);
  const [activeSection, setActiveSection] = useState(0);
  const scrollRef = useRef<HTMLElement>(null);
  const contentId = `scenario-content-${useId().replaceAll(":", "")}`;
  const scenario = scenarioRegistry.find((item) => item.id === scenarioId) || scenarioRegistry[0];
  const snapshot = resolveProjectTokens(project, activeTheme, platform);
  const entries = scenario.componentIds.map((id) => catalogRegistry.find((entry) => entry.id === id)).filter(Boolean) as CatalogEntry[];
  const columnsNumber = Number((snapshot.cssVariables as Record<string, string | number>)["--ds-columns"]) || 4;
  const moduleSpan = platform === "mobile" ? columnsNumber : Math.max(1, Math.ceil(columnsNumber / 2));
  const style = { ...snapshot.cssVariables, "--scenario-module-span": String(moduleSpan) } as CSSProperties;
  const platformName = project.platforms[platform]?.name || platform;
  const themeName = project.themes.find((item) => item.id === activeTheme)?.name || activeTheme;
  const columns = String(columnsNumber);
  const typeMultiplier = String((snapshot.cssVariables as Record<string, string | number>)["--ds-typography-multiplier"] || 1);
  const spacingMultiplier = String((snapshot.cssVariables as Record<string, string | number>)["--ds-spacing-multiplier"] || 1);
  const dimensionsMultiplier = String((snapshot.cssVariables as Record<string, string | number>)["--ds-dimensions-multiplier"] || 1);
  const sections = scenarioSections[scenario.id];
  const sectionIcons = [Home, Activity, Library];
  const navigateSection = (index: number) => {
    document.getElementById(`${contentId}-section-${index}`)?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setActiveSection(index);
  };
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const updateActive = () => {
      const candidates = [...root.querySelectorAll<HTMLElement>("[data-scenario-section]")];
      if (!candidates.length) return;
      const rootTop = root.getBoundingClientRect().top;
      const current = candidates.reduce((best, item) => Math.abs(item.getBoundingClientRect().top - rootTop - 24) < Math.abs(best.getBoundingClientRect().top - rootTop - 24) ? item : best);
      setActiveSection(Number(current.dataset.scenarioSection || 0));
    };
    root.addEventListener("scroll", updateActive, { passive: true });
    return () => root.removeEventListener("scroll", updateActive);
  }, [contentId]);

  return <article className={`scenario-comparison-card platform-${platform}`}>
    <header className="scenario-comparison-label">
      <div className="scenario-comparison-title"><div><b>{platformName}</b><span>{scenario.name}</span></div><Badge tone={snapshot.ready ? "success" : "warning"}>{snapshot.ready ? "Resuelto" : "Pendiente"}</Badge></div>
      <div className="scenario-foundations-applied">
        {lockTheme || project.themes.length < 2
          ? <div className="scenario-active-mode"><span>Modo</span><b>{themeName}</b></div>
          : <div className="scenario-theme-control"><span>Modo</span><div role="group" aria-label={`Modo de color para ${platformName}`}>{project.themes.map((item) => <Toggle key={item.id} pressed={item.id === activeTheme} onPressedChange={() => setActiveTheme(item.id)}>{item.name}</Toggle>)}</div></div>}
        <dl aria-label={`Foundations aplicados en ${platformName}`}>
          <div><dt>Tipografía</dt><dd>{typeMultiplier}×</dd></div>
          <div><dt>Espaciado</dt><dd>{spacingMultiplier}×</dd></div>
          <div><dt>Dimensiones</dt><dd>{dimensionsMultiplier}×</dd></div>
          <div><dt>Grilla</dt><dd>{columns} col.</dd></div>
        </dl>
      </div>
    </header>
    <div className="scenario-device-stage">
      <div className={`scenario-product-shell ${showGrid ? "show-grid" : ""}`} style={style}>
        <header className="scenario-product-header"><div><span>{project.meta.brandMark}</span><b>{project.meta.name}</b></div><span className="scenario-header-context">{scenario.name}</span></header>
        <aside className="scenario-product-sidebar" aria-label={`Secciones de ${scenario.name}`}><b>{scenario.name}</b>{sections.map((section, index) => { const Icon = sectionIcons[index] || Library; return <button type="button" className={activeSection === index ? "is-active" : ""} aria-current={activeSection === index ? "page" : undefined} onClick={() => navigateSection(index)} key={section.title}><Icon aria-hidden="true" /><span>{section.title}</span></button>; })}</aside>
        <section ref={scrollRef} id={contentId} className="scenario-product-main" aria-label={`Contenido de ${scenario.name}`}>
          <div className="scenario-product-content">
            <div className="scenario-grid-lines" aria-hidden="true">{Array.from({ length: columnsNumber }).map((_, index) => <i key={index} />)}</div>
            <div className="scenario-product-title"><div><small>Escenario vivo</small><h3>{scenario.name}</h3><p>{scenario.description}</p></div></div>
            <ScenarioFlow scenario={scenario} entries={entries} style={style} contentId={contentId} project={project} theme={activeTheme} platform={platform} />
          </div>
        </section>
        <aside className="scenario-product-inspector"><b>Inspector</b><span>{entries.length} componentes</span><span>{snapshot.missing.length ? `${snapshot.missing.length} referencias pendientes` : "Tokens resueltos"}</span><dl><div><dt>Modo</dt><dd>{themeName}</dd></div><div><dt>Tipografía</dt><dd>{typeMultiplier}×</dd></div><div><dt>Espaciado</dt><dd>{spacingMultiplier}×</dd></div><div><dt>Grilla</dt><dd>{columns} columnas</dd></div></dl></aside>
        <nav className="scenario-product-bottom" aria-label={`Secciones de ${scenario.name}`}>{sections.slice(0, 3).map((section, index) => { const Icon = sectionIcons[index] || Library; return <button type="button" className={activeSection === index ? "is-active" : ""} aria-current={activeSection === index ? "page" : undefined} onClick={() => navigateSection(index)} key={section.title}><Icon aria-hidden="true" /><span>{section.title}</span></button>; })}</nav>
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
    <SectionHeading title="Escenarios" description="Comprobá cómo conviven los foundations y tokens reales del proyecto en marcos acotados, con navegación fija, contenido desplazable y estructuras propias de cada plataforma activa." />
    {initialComponent ? <Alert tone="info" title="Evidencia vinculada">Abrimos el escenario que contiene {catalogRegistry.find((entry) => entry.id === initialComponent)?.name || initialComponent}.</Alert> : null}
    <Card className="scenario-toolbar">
      <Select label="Vista" value={view} onValueChange={(value) => setView(value as ExplorerView)} options={[{ value: "explore", label: "Explorar" }, { value: "platforms", label: "Comparar plataformas" }, { value: "modes", label: "Comparar modos" }]} />
      {view !== "platforms" ? <Select label="Plataforma" value={activePlatform} onValueChange={(value) => setPlatform(value as PlatformId)} options={enabledPlatforms.map((id) => ({ value: id, label: project.platforms[id].name }))} /> : null}
      <Select label="Escenario" value={mobileCanShowAll ? scenarioId : effectiveScenarioId} onValueChange={setScenarioId} options={scenarioOptions} />
      <Switch checked={showGrid} onCheckedChange={setShowGrid} label="Mostrar grilla" ariaLabel="Mostrar grilla en todos los escenarios visibles" />
    </Card>
    <div className="scenario-context-row">
      <div><b>Cobertura completa</b><span>{scenarioCoverage.length}/{catalogRegistry.length} componentes en {scenarioRegistry.length} escenarios</span></div>
      <div><b>Plataformas activas</b><span>{enabledPlatforms.map((id) => project.platforms[id].name).join(" · ")}</span></div>
      <div><b>Fuente de la vista</b><span>Foundations y tokens resueltos · Sin simulaciones locales</span></div>
    </div>
    {view === "platforms" && enabledPlatforms.length < 2 ? <Alert tone="info" title="Solo hay una plataforma activa">Activá Tablet o Desktop desde Proyecto para compararlas. Escenarios no muestra plataformas que el proyecto no contempla.</Alert> : null}
    {view === "modes" && project.themes.length < 2 ? <Alert tone="info" title="Solo hay un modo configurado">Agregá otro modo de color para habilitar una comparación real.</Alert> : null}
    {scenarioCoverage.length !== catalogRegistry.length ? <Alert tone="warning" title="Cobertura incompleta">La suite todavía no representa todo el registro del Catálogo.</Alert> : null}
    <div className={`scenario-comparisons view-${view} ${mobileSuite ? "mobile-suite" : ""}`}>{comparisons.map((item) => <ScenarioCanvas key={item.key} project={project} scenarioId={item.scenarioId} initialTheme={item.theme} platform={item.platform} showGrid={showGrid} lockTheme={item.lockTheme} />)}</div>
  </div>;
}
