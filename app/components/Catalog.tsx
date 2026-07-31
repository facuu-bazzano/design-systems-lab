"use client";

import { CSSProperties, useId, useMemo, useState } from "react";
import * as RadioPrimitive from "@radix-ui/react-radio-group";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ChevronLeft, ChevronRight, CircleUserRound, LoaderCircle, MoreHorizontal, Search } from "lucide-react";
import { catalogCategories, catalogRegistry, CatalogEntry } from "../lib/catalog-registry";
import { DesignSystemProject, PlatformId, platformOrder, resolveComponent, resolveSemantic, semanticById } from "../lib/model";
import { resolveProjectTokens } from "../lib/token-resolver";
import { ProjectAccordionPreview, ProjectAlertPreview, ProjectCheckboxPreview, ProjectIconButtonPreview, ProjectSelectPreview, ProjectTooltipPreview } from "./ProjectPreviews";
import { Alert, Button, Card, SectionHeading, Select } from "./ui/LabUI";

type Props = { project: DesignSystemProject; onOpenTokens: (token: string) => void };
const stateClass = (state: string) => `state-${state.toLowerCase().replaceAll("/", "-").replaceAll(" ", "-")}`;

function ProjectButton({ state }: { state: string }) {
  const destructive = state === "Destructive";
  return <button type="button" className={`project-button ${destructive ? "destructive" : ""} ${stateClass(state)}`} disabled={state === "Disabled"}>{destructive ? "Eliminar" : "Continuar"}</button>;
}

function ProjectField({ multiline = false, state }: { multiline?: boolean; state: string }) {
  const controlId = `catalog-field-${useId()}`;
  const descriptionId = `${controlId}-description`;
  const common = { id: controlId, className: `project-field ${stateClass(state)}`, disabled: state === "Disabled", "aria-invalid": state === "Error" || undefined, "aria-describedby": descriptionId, defaultValue: state === "Error" ? "equipo@" : multiline ? "Notas para el equipo de diseño." : "Ada Lovelace" };
  return <label className="project-field-wrap" htmlFor={controlId}><span>{multiline ? "Descripción" : "Correo de contacto"}</span>{multiline ? <textarea {...common} /> : <input {...common} />}<small id={descriptionId} className={state === "Error" ? "error-copy" : ""}>{state === "Error" ? "Ingresá un valor válido." : "Texto de ayuda visible y legible."}</small></label>;
}

function ProjectSelection({ kind, state }: { kind: "checkbox" | "radio" | "switch"; state: string }) {
  const selected = state === "Selected";
  const disabled = state === "Disabled";
  if (kind === "checkbox") return <ProjectCheckboxPreview state={state} />;
  if (kind === "radio") return <RadioPrimitive.Root defaultValue={selected ? "pro" : "basic"} disabled={disabled} className="project-radio-group"><label className={`project-control ${disabled ? "state-disabled" : ""}`}><RadioPrimitive.Item value="basic" disabled={disabled} className={`project-radio ${stateClass(state)}`}><RadioPrimitive.Indicator /></RadioPrimitive.Item><span>Plan básico</span></label><label className={`project-control ${disabled ? "state-disabled" : ""}`}><RadioPrimitive.Item value="pro" disabled={disabled} className="project-radio"><RadioPrimitive.Indicator /></RadioPrimitive.Item><span>Plan profesional</span></label></RadioPrimitive.Root>;
  return <label className="project-control"><SwitchPrimitive.Root defaultChecked={selected} disabled={disabled} className={`project-switch ${stateClass(state)}`}><SwitchPrimitive.Thumb /></SwitchPrimitive.Root><span>Notificaciones</span></label>;
}

function ProjectTabs({ state }: { state: string }) {
  const disabled = state === "Disabled";
  return <TabsPrimitive.Root defaultValue={state === "Selected" ? "tokens" : "overview"} className="project-tabs"><TabsPrimitive.List><TabsPrimitive.Trigger value="overview" disabled={disabled}>Resumen</TabsPrimitive.Trigger><TabsPrimitive.Trigger value="tokens" disabled={disabled}>Tokens</TabsPrimitive.Trigger><TabsPrimitive.Trigger value="usage" disabled={disabled}>Uso</TabsPrimitive.Trigger></TabsPrimitive.List><TabsPrimitive.Content value="overview">Resumen del componente.</TabsPrimitive.Content><TabsPrimitive.Content value="tokens">Tokens consumidos.</TabsPrimitive.Content><TabsPrimitive.Content value="usage">Guía de uso.</TabsPrimitive.Content></TabsPrimitive.Root>;
}

function ProjectFeedback({ entry, state, portalStyle }: { entry: CatalogEntry; state: string; portalStyle?: CSSProperties }) {
  if (entry.id === "badge") return <span className={`project-badge ${stateClass(state)}`}>{state === "Error" ? "Error" : state === "Success" ? "Éxito" : state === "Warning" ? "Advertencia" : state}</span>;
  if (entry.id === "progress") return <div className={`project-progress ${stateClass(state)}`}><span style={{ width: state === "Complete" ? "100%" : "64%" }} /></div>;
  if (entry.id === "loading") return <LoaderCircle className="project-spinner" aria-label="Cargando" />;
  if (entry.id === "skeleton") return <div className="project-skeleton"><i /><i /><i /></div>;
  if (entry.id === "tooltip") return <ProjectTooltipPreview state={state} portalStyle={portalStyle} />;
  return <ProjectAlertPreview state={state} />;
}

function ProjectSurface({ entry, state }: { entry: CatalogEntry; state: string }) {
  const disabled = state === "Disabled";
  if (entry.id === "card") return <button type="button" className={`project-card ${stateClass(state)}`} disabled={state === "Disabled"}><b>Cobertura de foundations</b><p>Los roles esenciales están conectados.</p><strong>100%</strong></button>;
  if (entry.id === "table") return <table className={`project-table ${stateClass(state)}`}><thead><tr><th>Token</th><th>Estado</th></tr></thead><tbody><tr><td>surface.default</td><td>Asignado</td></tr><tr><td>focus.ring</td><td>Asignado</td></tr></tbody></table>;
  if (entry.id === "avatar") return <div className="project-avatar"><CircleUserRound /><span>AL</span></div>;
  if (entry.id === "divider") return <hr className="project-divider" />;
  if (entry.id === "list") return <div className={`project-list ${stateClass(state)}`}><button disabled={disabled}>Paleta primaria <ChevronRight /></button><button disabled={disabled}>Tipografía <ChevronRight /></button></div>;
  if (entry.id === "image") return <div className="project-image">16:9</div>;
  if (entry.id === "carousel") return <div className={`project-carousel ${stateClass(state)}`}><button aria-label="Anterior" disabled={disabled}><ChevronLeft /></button><div>01</div><div>02</div><button aria-label="Siguiente" disabled={disabled}><ChevronRight /></button></div>;
  return <button type="button" className="project-modal-demo">Abrir modal</button>;
}

function ExtendedPreview({ entry, state }: { entry: CatalogEntry; state: string }) {
  const disabled = state === "Disabled";
  if (entry.id === "accordion") return <ProjectAccordionPreview state={state} />;
  if (entry.id === "breadcrumbs") return <nav className={`project-breadcrumbs ${stateClass(state)}`}>{disabled ? <span aria-disabled="true">Sistema</span> : <a href="#catalog-navigation">Sistema</a>}<ChevronRight />{disabled ? <span aria-disabled="true">Componentes</span> : <a href="#catalog-navigation">Componentes</a>}<ChevronRight /><span>Actual</span></nav>;
  if (entry.id === "dropdown") return <button type="button" className={`project-select ${stateClass(state)}`} disabled={disabled}>Acciones <MoreHorizontal /></button>;
  if (entry.id === "pagination") return <div className={`project-pagination ${stateClass(state)}`}><button aria-label="Anterior" disabled={disabled}><ChevronLeft /></button><button className="selected" disabled={disabled}>1</button><button disabled={disabled}>2</button><button disabled={disabled}>3</button><button aria-label="Siguiente" disabled={disabled}><ChevronRight /></button></div>;
  if (entry.id === "calendar") return <div className={`project-calendar ${stateClass(state)}`}><header><button aria-label="Mes anterior" disabled={disabled}><ChevronLeft /></button><b>Julio</b><button aria-label="Mes siguiente" disabled={disabled}><ChevronRight /></button></header><div>{[21,22,23,24,25,26,27].map((day) => <button className={day === 24 ? "selected" : ""} disabled={disabled} key={day}>{day}</button>)}</div></div>;
  if (entry.id === "icon") return <ProjectIconButtonPreview state={state} />;
  return <button type="button" className={`project-button ${stateClass(state)}`} disabled={disabled}>{entry.name}</button>;
}

export function ProjectComponentPreview({ entry, state, portalStyle }: { entry: CatalogEntry; state: string; portalStyle?: CSSProperties }) {
  if (entry.id === "button") return <ProjectButton state={state} />;
  if (entry.id === "link") return state === "Disabled" ? <span className={`project-link ${stateClass(state)}`} aria-disabled="true">Ver detalle</span> : <a href="#catalog-navigation" className={`project-link ${stateClass(state)}`}>Ver detalle</a>;
  if (entry.id === "input" || entry.id === "textarea") return <ProjectField multiline={entry.id === "textarea"} state={state} />;
  if (entry.id === "select") return <ProjectSelectPreview state={state} portalStyle={portalStyle} />;
  if (["checkbox", "radio", "switch"].includes(entry.id)) return <ProjectSelection kind={entry.id as "checkbox" | "radio" | "switch"} state={state} />;
  if (entry.id === "tabs") return <ProjectTabs state={state} />;
  if (entry.category === "feedback") return <ProjectFeedback entry={entry} state={state} portalStyle={portalStyle} />;
  if (entry.category === "surfaces") return <ProjectSurface entry={entry} state={state} />;
  return <ExtendedPreview entry={entry} state={state} />;
}

function TokenInspector({ entry, project, theme, platform, onOpenTokens }: { entry: CatalogEntry; project: DesignSystemProject; theme: string; platform: PlatformId; onOpenTokens: Props["onOpenTokens"] }) {
  const componentRows = entry.componentTokens.map((name) => {
    const token = project.componentTokens.find((item) => item.name === name);
    const semanticId = token?.reference.startsWith("semantic:") ? token.reference.slice(9) : "";
    const semantic = semanticId ? semanticById(project, semanticId) : undefined;
    const foundation = semantic?.platformRefs[platform] || semantic?.themeRefs[theme] || semantic?.defaultRef || token?.reference.replace("primitive:", "") || "";
    return { key: `component-${name}`, component: name, semantic: semantic?.name || semanticId, foundation, resolved: token ? resolveComponent(project, token.id, theme, platform) : "", target: name };
  });
  const coveredSemantics = new Set(componentRows.map((row) => row.semantic).filter(Boolean));
  const semanticRows = entry.semanticTokens.filter((name) => !coveredSemantics.has(name)).map((name) => { const semantic = semanticById(project, name); const foundation = semantic?.platformRefs[platform] || semantic?.themeRefs[theme] || semantic?.defaultRef || ""; return { key: `semantic-${name}`, component: "—", semantic: semantic?.name || name, foundation, resolved: semantic ? resolveSemantic(project, semantic.id, theme, platform) : "", target: name }; });
  const rows = [...componentRows, ...semanticRows];
  return <div className="catalog-inspector"><div className="catalog-inspector-title"><div><b>Tokens utilizados</b><span>{rows.length} referencias en esta ficha</span></div><span>Componente → Semántico → Foundation → Valor</span></div><div className="catalog-token-rows">{rows.map((row) => {
    const isDirectFoundation = Boolean(row.component && !row.semantic && row.foundation);
    const isSharedSemantic = Boolean(!row.component && row.semantic);
    return <div className={!row.resolved ? "pending" : ""} key={row.key}><code>{row.component || (isSharedSemantic ? "Rol compartido" : "—")}</code><ChevronRight /><code>{row.semantic || (isDirectFoundation ? "Referencia directa" : "Configuración pendiente")}</code><ChevronRight /><code>{row.foundation || "Configuración pendiente"}</code><span className="token-resolved"><i style={{ background: row.resolved || "transparent" }} /><code>{row.resolved || "Pendiente"}</code></span><Button size="sm" variant="quiet" onClick={() => onOpenTokens(row.target)}>Editar</Button></div>;
  })}</div></div>;
}

function ComponentSpec({ entry, project, theme, platform, portalStyle, onOpenTokens }: { entry: CatalogEntry; project: DesignSystemProject; theme: string; platform: PlatformId; portalStyle?: CSSProperties; onOpenTokens: Props["onOpenTokens"] }) {
  return <Card className="catalog-spec"><div className="catalog-spec-head"><div><h3>{entry.name}</h3><p>{entry.purpose}</p></div></div><div className="catalog-state-matrix">{entry.states.map((state) => <div className={`catalog-state ${state === "Open" ? "has-open-overlay" : ""}`} key={state}><span>{state}</span><div><ProjectComponentPreview entry={entry} state={state} portalStyle={portalStyle} /></div></div>)}</div><TokenInspector entry={entry} project={project} theme={theme} platform={platform} onOpenTokens={onOpenTokens} /></Card>;
}

export function Catalog({ project, onOpenTokens }: Props) {
  const enabledPlatforms = platformOrder.filter((id) => project.platforms[id].enabled);
  const [theme, setTheme] = useState(project.themes[0]?.id || "light");
  const [platform, setPlatform] = useState<PlatformId>(enabledPlatforms[0] || "mobile");
  const [query, setQuery] = useState("");
  const snapshot = useMemo(() => resolveProjectTokens(project, theme, platform), [project, theme, platform]);
  const entries = catalogRegistry.filter((item) => `${item.name} ${item.purpose} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="catalog-v4"><SectionHeading title="Catálogo" description={`${catalogRegistry.length} componentes para inspeccionar estados, interacción y cadenas de tokens antes de llevar decisiones a Figma.`} /><Card className="catalog-toolbar-v4"><div><label className="catalog-search"><span>Buscar componente</span><div><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. modal, input, feedback…" /></div></label><Select label="Modo" value={theme} onValueChange={setTheme} options={project.themes.map((item) => ({ value: item.id, label: item.name }))} /><Select label="Plataforma" value={platform} onValueChange={(value) => setPlatform(value as PlatformId)} options={enabledPlatforms.map((id) => ({ value: id, label: project.platforms[id].name }))} /></div></Card>{!snapshot.ready ? <Alert tone="warning" title="Configuración pendiente" action={<Button size="sm" onClick={() => onOpenTokens(snapshot.missing[0]?.replace(/^\w+:/, "") || "surface.default")}>Asignar tokens</Button>}>Las fichas permanecen legibles, pero no simulan roles faltantes. Completá las referencias para evaluar el aspecto real.</Alert> : null}<div className="catalog-layout-v4"><nav className="catalog-side-nav" aria-label="Categorías del catálogo"><b>Categorías</b>{catalogCategories.map((category) => <a href={`#catalog-${category.id}`} key={category.id}>{category.label}<span>{entries.filter((entry) => entry.category === category.id).length}</span></a>)}</nav><div className={`catalog-project-surface catalog-platform-${platform}`} style={snapshot.cssVariables as CSSProperties}>{catalogCategories.map((category) => { const categoryEntries = entries.filter((entry) => entry.category === category.id); if (!categoryEntries.length) return null; return <section key={category.id} id={`catalog-${category.id}`} className="catalog-category"><SectionHeading level={2} title={category.label} description={category.description} />{categoryEntries.map((entry) => <ComponentSpec key={entry.id} entry={entry} project={project} theme={theme} platform={platform} portalStyle={snapshot.cssVariables as CSSProperties} onOpenTokens={onOpenTokens} />)}</section>; })}</div></div></div>;
}
