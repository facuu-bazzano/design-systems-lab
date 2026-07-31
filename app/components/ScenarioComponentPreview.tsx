"use client";

import { CSSProperties, KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioPrimitive from "@radix-ui/react-radio-group";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Bell, Check, ChevronDown, ChevronLeft, ChevronRight, CircleUserRound, LoaderCircle, MoreHorizontal } from "lucide-react";
import { CatalogEntry, PreviewStateDescriptor } from "../lib/catalog-registry";
import { ProjectAlertPreview } from "./ProjectPreviews";

function ScenarioActionButton() {
  const [runs, setRuns] = useState(0);
  return <div className="scenario-interactive-stack"><button type="button" className="project-button" onClick={() => setRuns((value) => value + 1)}>Continuar</button><small role="status">{runs ? `Acción ejecutada · ${runs}` : "Lista para ejecutar"}</small></div>;
}

function ScenarioLink() {
  const [visited, setVisited] = useState(false);
  return <div className="scenario-interactive-stack"><a href="#scenario-link-result" className={`project-link ${visited ? "state-visited" : ""}`} onClick={(event) => { event.preventDefault(); setVisited(true); }}>Ver detalle</a><small id="scenario-link-result">{visited ? "Detalle visitado" : "Destino disponible"}</small></div>;
}

function ScenarioIconButton() {
  const [enabled, setEnabled] = useState(false);
  return <button type="button" className={`project-icon-button ${enabled ? "state-selected" : ""}`} aria-label={enabled ? "Desactivar notificaciones" : "Activar notificaciones"} aria-pressed={enabled} onClick={() => setEnabled((value) => !value)}><Bell aria-hidden="true" /></button>;
}

function ScenarioField({ multiline = false }: { multiline?: boolean }) {
  const id = useId();
  const [value, setValue] = useState(multiline ? "Notas para el equipo de diseño." : "Ada Lovelace");
  return <label className="project-field-wrap" htmlFor={id}><span>{multiline ? "Descripción" : "Nombre completo"}</span>{multiline ? <textarea id={id} className="project-field" value={value} onChange={(event) => setValue(event.target.value)} /> : <input id={id} className="project-field" value={value} onChange={(event) => setValue(event.target.value)} />}<small>{value.length} caracteres</small></label>;
}

function ScenarioSelect({ portalStyle }: { portalStyle?: CSSProperties }) {
  const [value, setValue] = useState("design");
  return <SelectPrimitive.Root value={value} onValueChange={setValue}>
    <SelectPrimitive.Trigger className="project-select" aria-label="Área del equipo"><SelectPrimitive.Value /><SelectPrimitive.Icon><ChevronDown /></SelectPrimitive.Icon></SelectPrimitive.Trigger>
    <SelectPrimitive.Portal><SelectPrimitive.Content className="project-select-popup" position="popper" sideOffset={6} style={portalStyle}><SelectPrimitive.Viewport>{[["design", "Diseño"], ["product", "Producto"], ["engineering", "Ingeniería"]].map(([option, label]) => <SelectPrimitive.Item className="project-select-option" key={option} value={option}><SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator><Check /></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>)}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}

function ScenarioCalendar() {
  const months = ["Junio", "Julio", "Agosto"];
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(24);
  return <div className="project-calendar"><header><button type="button" aria-label="Mes anterior" disabled={month === 0} onClick={() => setMonth((value) => Math.max(0, value - 1))}><ChevronLeft /></button><b>{months[month]}</b><button type="button" aria-label="Mes siguiente" disabled={month === months.length - 1} onClick={() => setMonth((value) => Math.min(months.length - 1, value + 1))}><ChevronRight /></button></header><div>{[21, 22, 23, 24, 25, 26, 27].map((item) => <button type="button" className={day === item ? "selected" : ""} aria-pressed={day === item} onClick={() => setDay(item)} key={item}>{item}</button>)}</div></div>;
}

function ScenarioCheckbox() {
  const [checked, setChecked] = useState(false);
  return <label className="project-control"><CheckboxPrimitive.Root checked={checked} onCheckedChange={(value) => setChecked(value === true)} className="project-checkbox" aria-label="Aceptar términos"><CheckboxPrimitive.Indicator className="project-checkbox-indicator"><Check aria-hidden="true" /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root><span>Aceptar términos</span></label>;
}

function ScenarioRadio() {
  const [value, setValue] = useState("basic");
  return <RadioPrimitive.Root value={value} onValueChange={setValue} className="project-radio-group" aria-label="Plan"><label className="project-control"><RadioPrimitive.Item value="basic" className="project-radio"><RadioPrimitive.Indicator /></RadioPrimitive.Item><span>Plan básico</span></label><label className="project-control"><RadioPrimitive.Item value="pro" className="project-radio"><RadioPrimitive.Indicator /></RadioPrimitive.Item><span>Plan profesional</span></label></RadioPrimitive.Root>;
}

function ScenarioSwitch() {
  const [checked, setChecked] = useState(false);
  return <label className="project-control"><SwitchPrimitive.Root checked={checked} onCheckedChange={setChecked} className="project-switch"><SwitchPrimitive.Thumb /></SwitchPrimitive.Root><span>Notificaciones</span></label>;
}

function ScenarioTooltip({ portalStyle }: { portalStyle?: CSSProperties }) {
  return <TooltipPrimitive.Provider delayDuration={180}><TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild><button className="project-tooltip-demo" type="button">Ayuda</button></TooltipPrimitive.Trigger><TooltipPrimitive.Portal><TooltipPrimitive.Content className="project-tooltip-content" side="top" sideOffset={8} collisionPadding={12} style={portalStyle}>Información contextual<TooltipPrimitive.Arrow /></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root></TooltipPrimitive.Provider>;
}

function ScenarioModal({ portalStyle }: { portalStyle?: CSSProperties }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const restoreFocus = () => requestAnimationFrame(() => triggerRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        restoreFocus();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])") || [])];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
  const showModal = () => { setHost(anchorRef.current?.closest(".scenario-product-shell") || null); setOpen(true); };
  const closeModal = () => { setOpen(false); requestAnimationFrame(() => triggerRef.current?.focus()); };
  return <div ref={anchorRef}><button ref={triggerRef} type="button" className="project-modal-demo" onClick={showModal}>Abrir modal</button>{open && host ? createPortal(<div className="scenario-modal-backdrop" style={portalStyle}><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="scenario-modal-panel"><h4 id={titleId}>Confirmar cambios</h4><p>Esta superficie usa los tokens resueltos del proyecto.</p><div><button type="button" className="project-button" onClick={closeModal}>Confirmar</button><button ref={closeRef} type="button" className="project-modal-demo" onClick={closeModal}>Cerrar</button></div></section></div>, host) : null}</div>;
}

function ScenarioAccordion() {
  const id = useId();
  const [open, setOpen] = useState(false);
  return <div className="project-accordion"><button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}><ChevronDown aria-hidden="true" /><span>¿Qué incluye?</span></button>{open ? <p id={id}>Contenido flexible conectado a tokens.</p> : null}</div>;
}

function ScenarioDropdown() {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState("Sin acción elegida");
  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus();
    const onPointerDown = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); return; }
    if (!open || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const items = [...(rootRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") || [])];
    const current = Math.max(0, items.indexOf(document.activeElement as HTMLElement));
    items[(current + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  };
  return <div ref={rootRef} className="scenario-dropdown" onKeyDown={onKeyDown}><button ref={triggerRef} type="button" className="project-select" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); } }}>Acciones <MoreHorizontal /></button>{open ? <div role="menu">{["Editar", "Duplicar", "Archivar"].map((item) => <button type="button" role="menuitem" key={item} onClick={() => { setSelection(item); setOpen(false); triggerRef.current?.focus(); }}>{item}</button>)}</div> : null}<small role="status">{selection}</small></div>;
}

function ScenarioPagination() {
  const [page, setPage] = useState(1);
  return <div className="project-pagination"><button type="button" aria-label="Anterior" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft /></button>{[1, 2, 3].map((item) => <button type="button" className={page === item ? "selected" : ""} aria-current={page === item ? "page" : undefined} onClick={() => setPage(item)} key={item}>{item}</button>)}<button type="button" aria-label="Siguiente" disabled={page === 3} onClick={() => setPage((value) => Math.min(3, value + 1))}><ChevronRight /></button></div>;
}

function ScenarioTabs() {
  const [value, setValue] = useState("overview");
  return <TabsPrimitive.Root value={value} onValueChange={setValue} className="project-tabs"><TabsPrimitive.List><TabsPrimitive.Trigger value="overview">Resumen</TabsPrimitive.Trigger><TabsPrimitive.Trigger value="tokens">Tokens</TabsPrimitive.Trigger><TabsPrimitive.Trigger value="usage">Uso</TabsPrimitive.Trigger></TabsPrimitive.List><TabsPrimitive.Content value="overview">Resumen del componente.</TabsPrimitive.Content><TabsPrimitive.Content value="tokens">Tokens consumidos.</TabsPrimitive.Content><TabsPrimitive.Content value="usage">Guía de uso.</TabsPrimitive.Content></TabsPrimitive.Root>;
}

function ScenarioCard() {
  const [selected, setSelected] = useState(false);
  return <button type="button" className={`project-card ${selected ? "state-selected" : ""}`} aria-pressed={selected} onClick={() => setSelected((value) => !value)}><b>Cobertura de foundations</b><p>Los roles esenciales están conectados.</p><strong>{selected ? "Seleccionada" : "100%"}</strong></button>;
}

function ScenarioTable() {
  const [selected, setSelected] = useState("surface.default");
  return <table className="project-table"><thead><tr><th>Token</th><th>Estado</th></tr></thead><tbody>{["surface.default", "focus.ring"].map((token) => <tr className={selected === token ? "selected" : ""} key={token}><td><button type="button" aria-pressed={selected === token} onClick={() => setSelected(token)}>{token}</button></td><td>{selected === token ? "Seleccionado" : "Asignado"}</td></tr>)}</tbody></table>;
}

function ScenarioList() {
  const [selected, setSelected] = useState("Paleta primaria");
  return <div className="project-list">{["Paleta primaria", "Tipografía"].map((item) => <button type="button" className={selected === item ? "selected" : ""} aria-pressed={selected === item} onClick={() => setSelected(item)} key={item}>{item}<ChevronRight /></button>)}</div>;
}

function ScenarioCarousel() {
  const slides = ["01", "02", "03"];
  const [index, setIndex] = useState(0);
  return <div className="scenario-carousel-live"><button type="button" aria-label="Anterior" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}><ChevronLeft /></button><div className="scenario-carousel-viewport" aria-live="polite"><span key={slides[index]}>{slides[index]}</span></div><button type="button" aria-label="Siguiente" disabled={index === slides.length - 1} onClick={() => setIndex((value) => Math.min(slides.length - 1, value + 1))}><ChevronRight /></button></div>;
}

function ScenarioToast({ portalStyle }: { portalStyle?: CSSProperties }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [host, setHost] = useState<Element | null>(null);
  const showToast = () => { setHost(anchorRef.current?.closest(".scenario-product-shell") || null); setVisible(true); };
  return <div ref={anchorRef}><button type="button" className="project-modal-demo" onClick={showToast}>Mostrar notificación</button>{visible && host ? createPortal(<div className="scenario-toast-live" role="status" style={portalStyle}><ProjectAlertPreview state="Success">Cambios guardados.</ProjectAlertPreview><button type="button" aria-label="Cerrar notificación" onClick={() => setVisible(false)}>×</button></div>, host) : null}</div>;
}

function ScenarioPresentational({ entry }: { entry: CatalogEntry }) {
  if (entry.id === "alert") return <ProjectAlertPreview state="Warning" />;
  if (entry.id === "badge") return <span className="project-badge state-success">Éxito</span>;
  if (entry.id === "progress") return <div className="project-progress"><span style={{ width: "64%" }} /></div>;
  if (entry.id === "loading") return <LoaderCircle className="project-spinner" aria-label="Cargando" />;
  if (entry.id === "skeleton") return <div className="project-skeleton"><i /><i /><i /></div>;
  if (entry.id === "avatar") return <div className="project-avatar"><CircleUserRound /><span>AL</span></div>;
  if (entry.id === "image") return <div className="project-image">16:9</div>;
  if (entry.id === "divider") return <hr className="project-divider" />;
  if (entry.id === "breadcrumbs") return <nav className="project-breadcrumbs" aria-label="Migas de pan"><a href="#scenario-content">Sistema</a><ChevronRight /><a href="#scenario-content">Componentes</a><ChevronRight /><span>Actual</span></nav>;
  return null;
}

function InteractiveProjectComponent({ entry, portalStyle }: { entry: CatalogEntry; portalStyle?: CSSProperties }) {
  if (entry.id === "button") return <ScenarioActionButton />;
  if (entry.id === "link") return <ScenarioLink />;
  if (entry.id === "icon") return <ScenarioIconButton />;
  if (entry.id === "input" || entry.id === "textarea") return <ScenarioField multiline={entry.id === "textarea"} />;
  if (entry.id === "select") return <ScenarioSelect portalStyle={portalStyle} />;
  if (entry.id === "calendar") return <ScenarioCalendar />;
  if (entry.id === "checkbox") return <ScenarioCheckbox />;
  if (entry.id === "radio") return <ScenarioRadio />;
  if (entry.id === "switch") return <ScenarioSwitch />;
  if (entry.id === "tooltip") return <ScenarioTooltip portalStyle={portalStyle} />;
  if (entry.id === "modal") return <ScenarioModal portalStyle={portalStyle} />;
  if (entry.id === "accordion") return <ScenarioAccordion />;
  if (entry.id === "dropdown") return <ScenarioDropdown />;
  if (entry.id === "pagination") return <ScenarioPagination />;
  if (entry.id === "tabs") return <ScenarioTabs />;
  if (entry.id === "card") return <ScenarioCard />;
  if (entry.id === "table") return <ScenarioTable />;
  if (entry.id === "list") return <ScenarioList />;
  if (entry.id === "carousel") return <ScenarioCarousel />;
  if (entry.id === "toast") return <ScenarioToast portalStyle={portalStyle} />;
  return <ScenarioPresentational entry={entry} />;
}

function SnapshotProjectComponent({ entry, state }: { entry: CatalogEntry; state: PreviewStateDescriptor }) {
  const disabled = state.availability === "disabled";
  const readonly = state.availability === "readonly";
  const checked = state.selection === "checked" || state.selection === "selected";
  const invalid = state.validation === "error";
  const open = state.visibility === "open";
  const className = `project-snapshot state-${state.id}`;
  const status = invalid ? <small className="project-state-message" role="status">Error: revisá esta selección.</small> : null;
  if (entry.id === "button") return <button type="button" className={`project-button ${className}`} disabled={disabled}>{state.variant === "destructive" ? "Eliminar" : "Continuar"}</button>;
  if (entry.id === "link") return disabled ? <span className={`project-link ${className}`} aria-disabled="true">Ver detalle</span> : <a className={`project-link ${className}`} href="#catalog-evidence">Ver detalle</a>;
  if (entry.id === "icon") return <button type="button" className={`project-icon-button ${className}`} disabled={disabled} aria-label="Notificaciones"><Bell /></button>;
  if (entry.id === "input" || entry.id === "textarea") return <label className={`project-field-wrap ${className}`}><span>{entry.id === "textarea" ? "Descripción" : "Correo"}</span>{entry.id === "textarea" ? <textarea className="project-field" readOnly={readonly} disabled={disabled} aria-invalid={invalid || undefined} defaultValue={state.variant === "filled" ? "Notas del proyecto" : ""} /> : <input className="project-field" readOnly={readonly} disabled={disabled} aria-invalid={invalid || undefined} defaultValue={invalid ? "equipo@" : state.variant === "filled" ? "equipo@ejemplo.com" : ""} />}{invalid ? <small className="project-state-message">Error: ingresá un valor válido.</small> : <small>Ayuda contextual</small>}</label>;
  if (entry.id === "select") return <div className={`${className} snapshot-select`}><button type="button" className="project-select" disabled={disabled} aria-expanded={open}>{state.variant === "filled" ? "Diseño" : "Seleccionar"} <ChevronDown /></button>{open ? <div className="snapshot-popup"><span>Diseño</span><span>Producto</span></div> : null}{status}</div>;
  if (entry.id === "calendar") return <div className={`project-calendar ${className}`}><header><button type="button" disabled={disabled}><ChevronLeft /></button><b>Julio</b><button type="button" disabled={disabled}><ChevronRight /></button></header><div>{[21,22,23,24,25,26,27].map((day) => <button type="button" key={day} className={day === 24 ? "selected" : ""} disabled={disabled}>{day}</button>)}</div></div>;
  if (entry.id === "checkbox") return <div className={`${className} snapshot-control`}><span role="checkbox" aria-checked={state.selection === "indeterminate" ? "mixed" : checked} aria-disabled={disabled || undefined} className="project-checkbox">{state.selection === "indeterminate" ? <i /> : checked ? <Check /> : null}</span><span>Aceptar términos</span>{status}</div>;
  if (entry.id === "radio") return <div className={`${className} snapshot-control`}><span role="radio" aria-checked={checked} aria-disabled={disabled || undefined} className="project-radio">{checked ? <i /> : null}</span><span>Plan básico</span>{status}</div>;
  if (entry.id === "switch") return <div className={`${className} snapshot-control`}><span role="switch" aria-checked={checked} aria-disabled={disabled || undefined} className="project-switch"><i /></span><span>Notificaciones</span></div>;
  if (entry.id === "accordion") return <div className={`project-accordion ${className}`}><button type="button" aria-expanded={open} disabled={disabled}><ChevronDown /><span>¿Qué incluye?</span></button>{open ? <p>Contenido conectado a tokens.</p> : null}</div>;
  if (entry.id === "breadcrumbs") return <nav className={`project-breadcrumbs ${className}`} aria-label="Migas">{disabled ? <span aria-disabled="true">Sistema</span> : <a href="#catalog-evidence">Sistema</a>}<ChevronRight />{disabled ? <span aria-disabled="true">Componentes</span> : <a href="#catalog-evidence">Componentes</a>}<ChevronRight /><span>Actual</span></nav>;
  if (entry.id === "dropdown") return <div className={`${className} snapshot-select`}><button type="button" className="project-select" aria-expanded={open} disabled={disabled}>Acciones <MoreHorizontal /></button>{open ? <div className="snapshot-popup"><span>Editar</span><span>Duplicar</span></div> : null}</div>;
  if (entry.id === "pagination") return <div className={`project-pagination ${className}`}><button type="button" disabled><ChevronLeft /></button>{[1,2,3].map((page) => <button type="button" key={page} className={(state.selection === "selected" ? page === 2 : page === 1) ? "selected" : ""} disabled={disabled}>{page}</button>)}<button type="button" disabled={disabled}><ChevronRight /></button></div>;
  if (entry.id === "tabs") return <div className={`project-tabs ${className}`}><div role="tablist">{["Resumen", "Tokens", "Uso"].map((label, index) => <button type="button" role="tab" aria-selected={(state.selection === "selected" ? index === 1 : index === 0)} disabled={disabled} key={label}>{label}</button>)}</div><p>Contenido de la pestaña.</p></div>;
  if (entry.id === "alert") return <ProjectAlertPreview state={state.variant === "info" ? "Info" : state.validation === "success" ? "Success" : state.validation === "error" ? "Error" : "Warning"} />;
  if (entry.id === "badge") return <span className={`project-badge ${className}`}>{state.label}</span>;
  if (entry.id === "loading") return <LoaderCircle className={`project-spinner ${className}`} aria-label="Cargando" />;
  if (entry.id === "progress") return <div className={`project-progress ${className}`}><span style={{ width: state.validation === "success" ? "100%" : "64%" }} /></div>;
  if (entry.id === "skeleton") return <div className={`project-skeleton ${className} ${state.motion === "reduced" ? "reduce-motion" : ""}`}><i /><i /><i /></div>;
  if (entry.id === "tooltip") return <div className={`${className} snapshot-tooltip`}><button type="button">Ayuda</button>{open ? <span role="tooltip">Información contextual</span> : null}</div>;
  if (entry.id === "avatar") return state.content === "group" ? <div className={`project-avatar-group ${className}`}><span>AL</span><span>MG</span><span>+2</span></div> : <div className={`project-avatar ${className}`}>{state.content === "image" ? <CircleUserRound /> : <span>AL</span>}</div>;
  if (entry.id === "card") return <article className={`project-card ${className}`}><b>Cobertura</b><p>Roles esenciales conectados.</p><strong>100%</strong></article>;
  if (entry.id === "carousel") return <div className={`project-carousel ${className}`}><button type="button" disabled={disabled}><ChevronLeft /></button><div>01</div><div>02</div><button type="button" disabled={disabled}><ChevronRight /></button></div>;
  if (entry.id === "divider") return <hr className={`project-divider ${className}`} />;
  if (entry.id === "image") return <div className={`project-image ${className}`}>{state.content === "fallback" ? "Imagen no disponible" : "16:9"}</div>;
  if (entry.id === "list") return <div className={`project-list ${className}`}>{state.content === "empty" ? <p>Sin elementos</p> : <><button type="button" disabled={disabled}>Paleta primaria <ChevronRight /></button><button type="button" disabled={disabled}>Tipografía <ChevronRight /></button></>}</div>;
  if (entry.id === "modal") return <div className={`${className} snapshot-modal`}><button type="button">Abrir modal</button>{open ? <section role="dialog" aria-label="Confirmar cambios"><b>Confirmar cambios</b><p>Revisá la configuración.</p></section> : null}</div>;
  if (entry.id === "table") return <table className={`project-table ${className}`}><thead><tr><th>Token</th><th>Estado</th></tr></thead><tbody>{state.content === "empty" ? <tr><td colSpan={2}>Sin resultados</td></tr> : <><tr className={state.selection === "selected" ? "selected" : ""}><td>surface.default</td><td>Asignado</td></tr><tr><td>focus.ring</td><td>Asignado</td></tr></>}</tbody></table>;
  if (entry.id === "toast") return <ProjectAlertPreview state={state.validation === "error" ? "Error" : state.validation === "warning" ? "Warning" : state.validation === "success" ? "Success" : "Info"} />;
  return <ScenarioPresentational entry={entry} />;
}

export function ProjectComponentRenderer({ entry, mode = "playground", state, portalStyle, variantStyle }: { entry: CatalogEntry; mode?: "playground" | "snapshot"; state?: PreviewStateDescriptor; portalStyle?: CSSProperties; variantStyle?: CSSProperties }) {
  if (mode === "snapshot" && state) return <div className="project-renderer-snapshot" style={variantStyle} inert aria-label={`${entry.name}: ${state.label}`}><SnapshotProjectComponent entry={entry} state={state} /></div>;
  return <div className="project-renderer-playground" style={variantStyle}><InteractiveProjectComponent entry={entry} portalStyle={{ ...portalStyle, ...variantStyle }} /></div>;
}

export function ScenarioComponentPreview({ entry, portalStyle, variantStyle }: { entry: CatalogEntry; portalStyle?: CSSProperties; variantStyle?: CSSProperties }) {
  return <ProjectComponentRenderer entry={entry} mode="playground" portalStyle={portalStyle} variantStyle={variantStyle} />;
}
