"use client";

import { CSSProperties, useMemo, useState } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Radio from "@radix-ui/react-radio-group";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { catalogCategories, catalogRegistry, CatalogEntry } from "../lib/catalog-registry";
import { DesignSystemProject, PlatformId, platformOrder, resolveComponent, semanticById } from "../lib/model";
import { resolveProjectTokens } from "../lib/token-resolver";
import { Alert, Badge, Button, Card, SectionHeading, Select, Tabs } from "./ui/LabUI";
import { CheckIcon, ChevronDownIcon } from "./ui/Icons";

type Props = { project: DesignSystemProject; onOpenTokens: (token: string) => void };
const stateClass = (state: string) => `state-${state.toLowerCase().replaceAll("/", "-").replaceAll(" ", "-")}`;

function ProjectButton({ state }: { state: string }) {
  const destructive = state === "Destructive";
  return <button className={`project-button ${destructive ? "destructive" : ""} ${stateClass(state)}`} disabled={state === "Disabled"}>{destructive ? "Eliminar" : "Continuar"}</button>;
}
function ProjectField({ multiline = false, state }: { multiline?: boolean; state: string }) {
  const props = { className: `project-field ${stateClass(state)}`, disabled: state === "Disabled", "aria-invalid": state === "Error" || undefined, defaultValue: multiline ? "Notas para el equipo de diseño." : state === "Error" ? "equipo@" : "Ada Lovelace" };
  return <label className="project-field-wrap"><span>{multiline ? "Descripción" : "Nombre"}</span>{multiline ? <textarea {...props} /> : <input {...props} />}<small>{state === "Error" ? "Revisá el valor ingresado." : "Texto de ayuda visible y legible."}</small></label>;
}
function ProjectSelect({ state }: { state: string }) {
  const control = <SelectPrimitive.Root defaultValue="design" disabled={state === "Disabled"}><SelectPrimitive.Trigger className={`project-select ${stateClass(state)}`}><SelectPrimitive.Value /><SelectPrimitive.Icon><ChevronDownIcon /></SelectPrimitive.Icon></SelectPrimitive.Trigger><SelectPrimitive.Content className="project-select-popup" position="popper" sideOffset={5}><SelectPrimitive.Viewport>{[["design", "Diseño"], ["product", "Producto"], ["engineering", "Ingeniería"]].map(([value, label]) => <SelectPrimitive.Item key={value} value={value}><SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText></SelectPrimitive.Item>)}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Root>;
  return <div className="project-select-demo">{control}{state === "Open" ? <div className="project-select-open"><b>Diseño</b><span>Producto</span><span>Ingeniería</span></div> : null}</div>;
}
function ProjectSelection({ kind, state }: { kind: "checkbox" | "radio" | "switch"; state: string }) {
  const selected = state === "Selected";
  const disabled = state === "Disabled";
  if (kind === "checkbox") return <label className="project-control"><Checkbox.Root defaultChecked={selected} disabled={disabled} className={`project-checkbox ${stateClass(state)}`}><Checkbox.Indicator><CheckIcon /></Checkbox.Indicator></Checkbox.Root><span>Recibir novedades</span></label>;
  if (kind === "radio") return <Radio.Root defaultValue={selected ? "pro" : "basic"} className="project-radio-group"><label className="project-control"><Radio.Item value="basic" disabled={disabled} className={`project-radio ${stateClass(state)}`}><Radio.Indicator /></Radio.Item><span>Plan básico</span></label><label className="project-control"><Radio.Item value="pro" disabled={disabled} className="project-radio"><Radio.Indicator /></Radio.Item><span>Plan profesional</span></label></Radio.Root>;
  return <label className="project-control"><Switch.Root defaultChecked={selected} disabled={disabled} className={`project-switch ${stateClass(state)}`}><Switch.Thumb /></Switch.Root><span>Notificaciones</span></label>;
}
function ProjectTabs({ state }: { state: string }) {
  return <TabsPrimitive.Root defaultValue={state === "Selected" ? "tokens" : "overview"} className="project-tabs"><TabsPrimitive.List><TabsPrimitive.Trigger value="overview" disabled={state === "Disabled"}>Resumen</TabsPrimitive.Trigger><TabsPrimitive.Trigger value="tokens">Tokens</TabsPrimitive.Trigger><TabsPrimitive.Trigger value="usage">Uso</TabsPrimitive.Trigger></TabsPrimitive.List><TabsPrimitive.Content value="overview">Resumen del componente.</TabsPrimitive.Content><TabsPrimitive.Content value="tokens">Tokens consumidos.</TabsPrimitive.Content><TabsPrimitive.Content value="usage">Guía de uso.</TabsPrimitive.Content></TabsPrimitive.Root>;
}
function ProjectFeedback({ entry, state }: { entry: CatalogEntry; state: string }) {
  if (entry.id === "badge") return <span className={`project-badge ${stateClass(state)}`}>{state}</span>;
  return <div className={`project-alert ${stateClass(state)}`}><b>{state}</b><span>El cambio se aplicó al sistema.</span></div>;
}
function ProjectSurface({ entry, state }: { entry: CatalogEntry; state: string }) {
  if (entry.id === "card") return <div className={`project-card ${stateClass(state)}`}><b>Cobertura de foundations</b><p>Los roles esenciales están conectados.</p><strong>100%</strong></div>;
  return <table className={`project-table ${stateClass(state)}`}><thead><tr><th>Token</th><th>Estado</th></tr></thead><tbody><tr><td>surface.default</td><td>Asignado</td></tr><tr><td>focus.ring</td><td>Asignado</td></tr></tbody></table>;
}
function PreviewFor({ entry, state }: { entry: CatalogEntry; state: string }) {
  if (entry.id === "button" || entry.id === "link") return entry.id === "link" ? <a href="#catalog-navigation" className={`project-link ${stateClass(state)}`}>Ver detalle</a> : <ProjectButton state={state} />;
  if (entry.id === "input" || entry.id === "textarea") return <ProjectField multiline={entry.id === "textarea"} state={state} />;
  if (entry.id === "select") return <ProjectSelect state={state} />;
  if (entry.id === "checkbox" || entry.id === "radio" || entry.id === "switch") return <ProjectSelection kind={entry.id as "checkbox" | "radio" | "switch"} state={state} />;
  if (entry.id === "tabs") return <ProjectTabs state={state} />;
  if (entry.category === "feedback") return <ProjectFeedback entry={entry} state={state} />;
  if (entry.category === "surfaces") return entry.id === "divider" ? <hr className="project-divider" /> : <ProjectSurface entry={entry} state={state} />;
  return null;
}

function TokenInspector({ entry, project, theme, platform, onOpenTokens }: { entry: CatalogEntry; project: DesignSystemProject; theme: string; platform: PlatformId; onOpenTokens: Props["onOpenTokens"] }) {
  const componentName = entry.componentTokens[0];
  const component = project.componentTokens.find((token) => token.name === componentName);
  const semanticName = component?.reference.startsWith("semantic:") ? component.reference.slice(9) : entry.semanticTokens[0];
  const semantic = semanticById(project, semanticName || "");
  const primitive = semantic?.platformRefs[platform] || semantic?.themeRefs[theme] || semantic?.defaultRef || (component?.reference.startsWith("primitive:") ? component.reference.replace("primitive:", "") : "");
  const resolved = component ? resolveComponent(project, component.id, theme, platform) : "";
  const pending = (!componentName && !semanticName) || (componentName && !component) || (semanticName && !semantic) || !primitive;
  return <div className={`catalog-inspector ${pending ? "pending" : ""}`}><div><span>Token de componente</span><code>{componentName || "No aplica"}</code></div><i>→</i><div><span>Semántico</span><code>{semantic?.name || semanticName || "No aplica"}</code></div><i>→</i><div><span>Foundation</span><code>{primitive || "Configuración pendiente"}</code></div><div className="inspector-resolved"><span>Valor resuelto</span><code>{resolved || (primitive ? "Disponible en semántica" : "Pendiente")}</code></div><Button size="sm" variant={pending ? "primary" : "quiet"} onClick={() => onOpenTokens(componentName || semanticName || entry.id)}>{pending ? "Configurar token" : "Editar en Tokens"}</Button></div>;
}

function ComponentSpec({ entry, project, theme, platform, onOpenTokens }: { entry: CatalogEntry; project: DesignSystemProject; theme: string; platform: PlatformId; onOpenTokens: Props["onOpenTokens"] }) {
  return <Card className="catalog-spec" ><div className="catalog-spec-head"><div><h3>{entry.name}</h3><p>{entry.purpose}</p></div><Badge tone={entry.priority === "core" ? "info" : "neutral"}>{entry.priority === "core" ? "Prioritario" : "Ampliable"}</Badge></div><div className="catalog-state-matrix">{entry.states.map((state) => <div className="catalog-state" key={state}><span>{state}</span><div><PreviewFor entry={entry} state={state} /></div></div>)}</div><TokenInspector entry={entry} project={project} theme={theme} platform={platform} onOpenTokens={onOpenTokens} /></Card>;
}

export function Catalog({ project, onOpenTokens }: Props) {
  const enabledPlatforms = platformOrder.filter((id) => project.platforms[id].enabled);
  const [theme, setTheme] = useState(project.themes[0]?.id || "light");
  const [platform, setPlatform] = useState<PlatformId>(enabledPlatforms[0] || "mobile");
  const [priority, setPriority] = useState("core");
  const snapshot = useMemo(() => resolveProjectTokens(project, theme, platform), [project, theme, platform]);
  const entries = priority === "all" ? catalogRegistry : catalogRegistry.filter((item) => item.priority === "core");
  return <div className="catalog-v4">
    <SectionHeading title="Catálogo" description="Playground y documentación viva para inspeccionar componentes, estados y cadenas de tokens antes de llevar decisiones a Figma." />
    <Card className="catalog-toolbar-v4"><div><Select label="Modo" value={theme} onValueChange={setTheme} options={project.themes.map((item) => ({ value: item.id, label: item.name }))} /><Select label="Plataforma" value={platform} onValueChange={(value) => setPlatform(value as PlatformId)} options={enabledPlatforms.map((id) => ({ value: id, label: project.platforms[id].name }))} /></div><Tabs value={priority} onValueChange={setPriority} ariaLabel="Alcance del catálogo" tabs={[{ value: "core", label: "Prioritarios" }, { value: "all", label: `Registro completo · ${catalogRegistry.length}` }]} /><Badge tone={snapshot.ready ? "success" : "warning"}>{snapshot.ready ? "Tokens resueltos" : `${snapshot.missing.length} pendientes`}</Badge></Card>
    {!snapshot.ready ? <Alert tone="warning" title="Configuración pendiente" action={<Button size="sm" onClick={() => onOpenTokens(snapshot.missing[0] || "surface.default")}>Asignar tokens</Button>}>Las muestras siguen siendo legibles para explicar la arquitectura, pero no simulan roles faltantes. Completá las referencias para evaluar el aspecto real.</Alert> : null}
    <nav className="catalog-local-nav" aria-label="Índice del catálogo">{catalogCategories.map((category) => <a href={`#catalog-${category.id}`} key={category.id}>{category.label}</a>)}</nav>
    <div className={`catalog-project-surface catalog-platform-${platform}`} style={snapshot.cssVariables as CSSProperties}>{catalogCategories.map((category) => {
      const categoryEntries = entries.filter((entry) => entry.category === category.id);
      if (!categoryEntries.length) return null;
      return <section key={category.id} id={`catalog-${category.id}`} className="catalog-category"><SectionHeading level={2} title={category.label} description={category.description} />{categoryEntries.map((entry) => <ComponentSpec key={entry.id} entry={entry} project={project} theme={theme} platform={platform} onOpenTokens={onOpenTokens} />)}</section>;
    })}</div>
  </div>;
}
