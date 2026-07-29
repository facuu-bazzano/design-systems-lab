"use client";

import { CSSProperties, useId, useState } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Bell, Check, ChevronDown, CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";

export const projectStateClass = (state: string) => `state-${state.toLowerCase().replaceAll("/", "-").replaceAll(" ", "-")}`;

export function ProjectSelectPreview({ state, portalStyle }: { state: string; portalStyle?: CSSProperties }) {
  const [open, setOpen] = useState(false);
  if (state === "Open") return <div className="project-select-open-demo"><button type="button" className="project-select state-open" aria-haspopup="listbox" aria-expanded="true">Diseño <ChevronDown /></button><div className="project-select-popup project-select-popup-static" role="listbox" style={portalStyle}>{[["design", "Diseño"], ["product", "Producto"], ["engineering", "Ingeniería"]].map(([value, label]) => <div className="project-select-option" role="option" aria-selected={value === "design"} key={value}>{label}{value === "design" ? <Check /> : null}</div>)}</div></div>;
  return <SelectPrimitive.Root value="design" open={open} onOpenChange={setOpen} disabled={state === "Disabled"}>
    <SelectPrimitive.Trigger className={`project-select ${projectStateClass(state)}`} aria-label={`Select · ${state}`}>
      <SelectPrimitive.Value />
      <SelectPrimitive.Icon><ChevronDown /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className="project-select-popup" position="popper" sideOffset={6} style={portalStyle}>
        <SelectPrimitive.Viewport>
          {[["design", "Diseño"], ["product", "Producto"], ["engineering", "Ingeniería"]].map(([value, label]) => <SelectPrimitive.Item className="project-select-option" key={value} value={value}><SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator><Check /></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>)}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}

export function ProjectCheckboxPreview({ state }: { state: string }) {
  const selected = state === "Selected" || state === "Hover";
  const disabled = state === "Disabled";
  return <label className={`project-control ${disabled ? "state-disabled" : ""}`}>
    <CheckboxPrimitive.Root checked={selected} disabled={disabled} className={`project-checkbox ${projectStateClass(state)}`} aria-label={`Aceptar términos · ${state}`}>
      <CheckboxPrimitive.Indicator className="project-checkbox-indicator"><Check aria-hidden="true" /></CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
    <span>Aceptar términos</span>
  </label>;
}

export function ProjectIconButtonPreview({ state }: { state: string }) {
  return <button type="button" className={`project-icon-button ${projectStateClass(state)}`} aria-label={`Notificaciones · ${state}`} disabled={state === "Disabled"}><Bell aria-hidden="true" /></button>;
}

export function ProjectAccordionPreview({ state }: { state: string }) {
  const panelId = useId();
  const disabled = state === "Disabled";
  const [open, setOpen] = useState(state === "Open");
  const expanded = state === "Open" || open;
  return <div className={`project-accordion ${projectStateClass(state)}`}>
    <button type="button" aria-expanded={expanded} aria-controls={panelId} disabled={disabled} onClick={() => setOpen((current) => !current)}><ChevronDown aria-hidden="true" /><span>¿Qué incluye?</span></button>
    {expanded && !disabled ? <p id={panelId}>Contenido flexible conectado a tokens.</p> : null}
  </div>;
}

export function ProjectTooltipPreview({ state, portalStyle }: { state: string; portalStyle?: CSSProperties }) {
  const forcedOpen = state === "Open";
  return <div className="project-tooltip-stage">
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root open={forcedOpen ? true : undefined}>
        <TooltipPrimitive.Trigger asChild><button className="project-tooltip-demo" type="button">Ayuda</button></TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content className="project-tooltip-content" side="top" sideOffset={8} collisionPadding={12} style={portalStyle}>Información contextual<TooltipPrimitive.Arrow /></TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  </div>;
}

export function ProjectAlertPreview({ state, children }: { state: string; children?: string }) {
  const normalized = state.toLowerCase();
  const Icon = normalized === "success" ? CircleCheck : normalized === "warning" ? TriangleAlert : normalized === "error" ? CircleX : Info;
  const title = normalized === "success" ? "Éxito" : normalized === "warning" ? "Atención" : normalized === "error" ? "Error" : "Información";
  return <div className={`project-alert ${projectStateClass(state)}`} role={normalized === "error" ? "alert" : "status"}><Icon aria-hidden="true" /><div><b>{title}</b><span>{children || "El sistema comunica este estado con color, icono y texto."}</span></div></div>;
}
