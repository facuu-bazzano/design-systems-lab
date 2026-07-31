"use client";

import { ComponentPropsWithoutRef, createContext, KeyboardEvent, ReactNode, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import * as RadioPrimitive from "@radix-ui/react-radio-group";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { CircleCheck, CircleX, TriangleAlert, X } from "lucide-react";
import { BrandMark } from "../BrandMark";
import { ActivityIcon, CheckIcon, ChevronDownIcon, ExportIcon, FolderIcon, InfoIcon, MinusIcon, SearchIcon } from "./Icons";

const OverlayPortalContext = createContext<HTMLElement | null>(null);
const useOverlayPortal = () => useContext(OverlayPortalContext);

type ButtonProps = ComponentPropsWithoutRef<"button"> & { variant?: "primary" | "secondary" | "quiet" | "danger"; size?: "sm" | "md" | "lg" };
export function Button({ variant = "secondary", size = "md", className = "", ...props }: ButtonProps) {
  return <button className={`ui-button ui-button-${variant} ui-button-${size} ${className}`} {...props} />;
}
export function ButtonIcon({ children, position = "start" }: { children: ReactNode; position?: "start" | "end" }) {
  return <span className={`ui-button-icon ui-button-icon-${position}`} aria-hidden="true">{children}</span>;
}
export function IconButton({ label, children, className = "", ...props }: ComponentPropsWithoutRef<"button"> & { label: string }) {
  return <button className={`ui-icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

type FieldProps = ComponentPropsWithoutRef<"input"> & { label?: string; help?: string; error?: string; suffix?: string };
export function Input({ label, help, error, suffix, className = "", ...props }: FieldProps) {
  const generatedId = useId();
  const controlId = props.id || `field-${generatedId}`;
  const descriptionId = `${controlId}-description`;
  const describedBy = [props["aria-describedby"], error || help ? descriptionId : undefined].filter(Boolean).join(" ") || undefined;
  return <label className={`ui-field ${error ? "is-error" : ""}`} htmlFor={controlId}><span className="ui-field-label">{label}</span><span className="ui-input-shell"><input {...props} id={controlId} className={className} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy} />{suffix ? <span className="ui-input-suffix">{suffix}</span> : null}</span>{error || help ? <small id={descriptionId}>{error || help}</small> : null}</label>;
}
export function Textarea({ label, help, error, className = "", ...props }: ComponentPropsWithoutRef<"textarea"> & { label?: string; help?: string; error?: string }) {
  const generatedId = useId();
  const controlId = props.id || `field-${generatedId}`;
  const descriptionId = `${controlId}-description`;
  const describedBy = [props["aria-describedby"], error || help ? descriptionId : undefined].filter(Boolean).join(" ") || undefined;
  return <label className={`ui-field ${error ? "is-error" : ""}`} htmlFor={controlId}><span className="ui-field-label">{label}</span><textarea {...props} id={controlId} className={className} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={describedBy} />{error || help ? <small id={descriptionId}>{error || help}</small> : null}</label>;
}

export type SelectOption = { value: string; label: string; meta?: string };
export function Select({ label, value, onValueChange, options, disabled, invalid, className = "", placeholder = "Seleccionar" }: { label?: string; value?: string; onValueChange: (value: string) => void; options: SelectOption[]; disabled?: boolean; invalid?: boolean; className?: string; placeholder?: string }) {
  const portal = useOverlayPortal();
  return <label className={`ui-field ${invalid ? "is-error" : ""}`}><span className="ui-field-label">{label}</span><SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}><SelectPrimitive.Trigger className={`ui-select-trigger ${className}`} aria-invalid={invalid || undefined}><SelectPrimitive.Value placeholder={placeholder} /><SelectPrimitive.Icon><ChevronDownIcon /></SelectPrimitive.Icon></SelectPrimitive.Trigger><SelectPrimitive.Portal container={portal || undefined}><SelectPrimitive.Content className="ui-select-content" position="popper" sideOffset={6}><SelectPrimitive.Viewport>{options.map((option) => <SelectPrimitive.Item key={option.value} value={option.value} className="ui-select-item"><span><SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>{option.meta ? <small>{option.meta}</small> : null}</span><SelectPrimitive.ItemIndicator><CheckIcon /></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>)}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal></SelectPrimitive.Root></label>;
}

export function Combobox({ label, value, onValueChange, options, invalid, className = "", placeholder = "Buscar o seleccionar", renderOption }: { label?: string; value: string; onValueChange: (value: string) => void; options: SelectOption[]; invalid?: boolean; className?: string; placeholder?: string; renderOption?: (option: SelectOption) => ReactNode }) {
  const portal = useOverlayPortal();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressFocusOpenRef = useRef(false);
  const listboxId = `combobox-${useId()}`;
  const filtered = useMemo(() => options.filter((option) => `${option.label} ${option.meta || ""}`.toLowerCase().includes(query.toLowerCase())), [options, query]);
  const normalizedActiveIndex = filtered.length ? Math.min(activeIndex, filtered.length - 1) : 0;
  const current = options.find((option) => option.value === value);
  const chooseOption = (option?: SelectOption) => {
    if (!option) return;
    onValueChange(option.value);
    setOpen(false);
    setQuery("");
    suppressFocusOpenRef.current = true;
    inputRef.current?.focus();
    queueMicrotask(() => { suppressFocusOpenRef.current = false; });
  };
  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((currentIndex) => filtered.length ? (currentIndex + direction + filtered.length) % filtered.length : 0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      chooseOption(filtered[normalizedActiveIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      suppressFocusOpenRef.current = true;
      inputRef.current?.focus();
      queueMicrotask(() => { suppressFocusOpenRef.current = false; });
    }
  };
  return <div className={`ui-field ${invalid ? "is-error" : ""}`}><span className="ui-field-label">{label}</span><Popover.Root open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (nextOpen) { const selectedIndex = filtered.findIndex((option) => option.value === value); setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0); } else setQuery(""); }}><Popover.Anchor asChild><div className={`ui-combobox-trigger ${className}`}><SearchIcon /><input ref={inputRef} role="combobox" aria-label={label} aria-autocomplete="list" aria-expanded={open} aria-haspopup="listbox" aria-controls={listboxId} aria-activedescendant={open && filtered[normalizedActiveIndex] ? `${listboxId}-option-${normalizedActiveIndex}` : undefined} aria-invalid={invalid || undefined} value={open ? query : current?.label || value} placeholder={placeholder} onFocus={() => { if (suppressFocusOpenRef.current) return; setOpen(true); }} onClick={() => setOpen(true)} onChange={(event) => { if (!open) setOpen(true); setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={handleSearchKeyDown} /><Popover.Trigger asChild><button type="button" aria-label={open ? "Cerrar opciones" : "Abrir opciones"} tabIndex={-1}><ChevronDownIcon /></button></Popover.Trigger></div></Popover.Anchor><Popover.Portal container={portal || undefined}><Popover.Content role="presentation" className="ui-combobox-content" sideOffset={6} align="start" onOpenAutoFocus={(event) => event.preventDefault()}><div className="ui-combobox-list" id={listboxId} role="listbox" aria-label={label}>{filtered.map((option, index) => <button type="button" role="option" id={`${listboxId}-option-${index}`} aria-selected={option.value === value} key={option.value} className={`${option.value === value ? "selected" : ""} ${index === normalizedActiveIndex ? "active" : ""}`} tabIndex={-1} onMouseMove={() => setActiveIndex(index)} onClick={() => chooseOption(option)}>{renderOption ? renderOption(option) : <span><b>{option.label}</b>{option.meta ? <small>{option.meta}</small> : null}</span>}{option.value === value ? <CheckIcon /> : null}</button>)}{!filtered.length ? <p>Sin coincidencias. Podés ingresar una familia personalizada.</p> : null}</div></Popover.Content></Popover.Portal></Popover.Root></div>;
}

export function Checkbox({ checked, onCheckedChange, label, disabled, invalid, className = "" }: { checked: boolean | "indeterminate"; onCheckedChange: (checked: boolean) => void; label: ReactNode; disabled?: boolean; invalid?: boolean; className?: string }) {
  return <label className={`ui-control-line ${disabled ? "is-disabled" : ""}`}><CheckboxPrimitive.Root className={`ui-checkbox ${invalid ? "is-error" : ""} ${className}`} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} disabled={disabled} aria-invalid={invalid || undefined}><CheckboxPrimitive.Indicator><CheckIcon className="ui-checkbox-check" /><MinusIcon className="ui-checkbox-minus" /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root><span>{label}</span></label>;
}
export function RadioGroup({ value, onValueChange, options, disabled, invalid, className = "" }: { value: string; onValueChange: (value: string) => void; options: (SelectOption & { disabled?: boolean })[]; disabled?: boolean; invalid?: boolean; className?: string }) {
  return <RadioPrimitive.Root className={`ui-radio-group ${className}`} value={value} onValueChange={onValueChange} disabled={disabled} aria-invalid={invalid || undefined}>{options.map((option) => <label key={option.value} className={`ui-control-line ${disabled || option.disabled ? "is-disabled" : ""}`}><RadioPrimitive.Item className={`ui-radio ${invalid ? "is-error" : ""}`} value={option.value} disabled={option.disabled}><RadioPrimitive.Indicator /></RadioPrimitive.Item><span>{option.label}{option.meta ? <small>{option.meta}</small> : null}</span></label>)}</RadioPrimitive.Root>;
}
export function Switch({ checked, onCheckedChange, label, ariaLabel, disabled, invalid, className = "" }: { checked: boolean; onCheckedChange: (checked: boolean) => void; label?: ReactNode; ariaLabel?: string; disabled?: boolean; invalid?: boolean; className?: string }) {
  return <label className={`ui-control-line ${!label ? "is-switch-only" : ""} ${disabled ? "is-disabled" : ""}`}><SwitchPrimitive.Root aria-label={ariaLabel || (typeof label === "string" ? label : undefined)} aria-invalid={invalid || undefined} className={`ui-switch ${invalid ? "is-error" : ""} ${className}`} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled}><SwitchPrimitive.Thumb /></SwitchPrimitive.Root>{label ? <span>{label}</span> : null}</label>;
}
export function Toggle({ pressed, onPressedChange, children, disabled, className = "" }: { pressed: boolean; onPressedChange: (pressed: boolean) => void; children: ReactNode; disabled?: boolean; className?: string }) {
  return <Button className={`ui-toggle ${className}`} variant={pressed ? "primary" : "secondary"} aria-pressed={pressed} disabled={disabled} onClick={() => onPressedChange(!pressed)}>{children}</Button>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`ui-card ${className}`}>{children}</section>; }
export function Table({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className="ui-table-wrap"><table className={`ui-table ${className}`}>{children}</table></div>; }
export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "info" | "success" | "warning" | "danger"; children: ReactNode }) { return <span className={`ui-badge ui-badge-${tone}`}>{children}</span>; }
export function Alert({ tone = "info", title, children, action }: { tone?: "info" | "success" | "warning" | "danger"; title: string; children: ReactNode; action?: ReactNode }) { const Icon = tone === "success" ? CircleCheck : tone === "warning" ? TriangleAlert : tone === "danger" ? CircleX : InfoIcon; return <div className={`ui-alert ui-alert-${tone}`}><Icon /><div><b>{title}</b><p>{children}</p>{action}</div></div>; }
export function SectionHeading({ title, description, action, level = 1 }: { title: string; description?: string; action?: ReactNode; level?: 1 | 2 }) {
  const Title = level === 1 ? "h1" : "h2";
  return <header className={`ui-section-heading level-${level}`}><div><Title>{title}</Title>{description ? <p>{description}</p> : null}</div>{action}</header>;
}

export function Dialog({ open, onOpenChange, title, description, variant = "modal", children, className = "" }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; variant?: "modal" | "drawer"; children: ReactNode; className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const titleId = `dialog-title-${useId()}`;
  const descriptionId = `dialog-description-${useId()}`;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    queueMicrotask(() => dialog.querySelector<HTMLElement>("[data-dialog-close]")?.focus());
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [open]);
  if (!open) return null;
  const close = () => onOpenChange(false);
  return <dialog ref={dialogRef} className={`ui-dialog-overlay ui-dialog-${variant}`} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={(event) => { event.preventDefault(); close(); }} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); close(); } }} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><OverlayPortalContext.Provider value={portal}><div className={`ui-dialog-panel ${className}`}><header className="ui-dialog-header"><div><h1 id={titleId}>{title}</h1>{description ? <p id={descriptionId}>{description}</p> : null}</div><IconButton label="Cerrar" data-dialog-close onClick={close}><X /></IconButton></header><div className="ui-dialog-body">{children}</div><div ref={setPortal} className="ui-dialog-portal-host" /></div></OverlayPortalContext.Provider></dialog>;
}

export function HelpTooltip({ label, children }: { label: string; children: ReactNode }) {
  const portal = useOverlayPortal();
  return <TooltipPrimitive.Provider delayDuration={250}><TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild><IconButton label={label}><InfoIcon /></IconButton></TooltipPrimitive.Trigger><TooltipPrimitive.Portal container={portal || undefined}><TooltipPrimitive.Content className="ui-tooltip" sideOffset={7}>{children}<TooltipPrimitive.Arrow className="ui-tooltip-arrow" /></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root></TooltipPrimitive.Provider>;
}

export function DropdownMenu({ trigger, items, label, modal = false }: { trigger: ReactNode; label: string; modal?: boolean; items: { label: string; icon?: ReactNode; onSelect: () => void; disabled?: boolean }[] }) {
  const portal = useOverlayPortal();
  return <DropdownPrimitive.Root modal={modal}><DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger><DropdownPrimitive.Portal container={portal || undefined}><DropdownPrimitive.Content className="ui-menu-content" sideOffset={7} align="start" aria-label={label}>{items.map((item) => <DropdownPrimitive.Item key={item.label} className="ui-menu-item" onSelect={item.onSelect} disabled={item.disabled}>{item.icon}<span>{item.label}</span></DropdownPrimitive.Item>)}</DropdownPrimitive.Content></DropdownPrimitive.Portal></DropdownPrimitive.Root>;
}
export function Tabs({ value, onValueChange, tabs, ariaLabel }: { value: string; onValueChange: (value: string) => void; tabs: { value: string; label: string; content?: ReactNode; disabled?: boolean }[]; ariaLabel: string }) {
  return <TabsPrimitive.Root className="ui-tabs" value={value} onValueChange={onValueChange}><TabsPrimitive.List aria-label={ariaLabel}>{tabs.map((tab) => <TabsPrimitive.Trigger key={tab.value} value={tab.value} disabled={tab.disabled}>{tab.label}</TabsPrimitive.Trigger>)}</TabsPrimitive.List>{tabs.map((tab) => tab.content ? <TabsPrimitive.Content key={tab.value} value={tab.value}>{tab.content}</TabsPrimitive.Content> : null)}</TabsPrimitive.Root>;
}

export function HealthIndicator({ score, status, summary, onClick }: { score: number | null; status: "ready" | "attention" | "pending"; summary: string; onClick: () => void }) {
  const label = status === "pending" ? "Sin evaluar" : `${score}%`;
  const portal = useOverlayPortal();
  return <TooltipPrimitive.Provider delayDuration={250}><TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild><button className={`ui-health ui-health-${status}`} onClick={onClick} aria-label={`Salud del sistema: ${summary}`}><ActivityIcon /><span>{label}</span></button></TooltipPrimitive.Trigger><TooltipPrimitive.Portal container={portal || undefined}><TooltipPrimitive.Content className="ui-tooltip" sideOffset={7}><b>{summary}</b><span>{status === "pending" ? "Completá la base para iniciar la evaluación." : "Abrir cobertura, hallazgos y escenarios."}</span><TooltipPrimitive.Arrow className="ui-tooltip-arrow" /></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root></TooltipPrimitive.Provider>;
}

export function ProjectMenu({ onImport, onDownload, onDuplicate }: { onImport: () => void; onDownload: () => void; onDuplicate: () => void }) {
  return <DropdownMenu label="Menú del proyecto" trigger={<Button variant="secondary"><ButtonIcon><FolderIcon /></ButtonIcon> Proyecto <ButtonIcon position="end"><ChevronDownIcon /></ButtonIcon></Button>} items={[{ label: "Importar proyecto", onSelect: onImport }, { label: "Descargar proyecto", onSelect: onDownload }, { label: "Duplicar proyecto", onSelect: onDuplicate }]} />;
}
export function ExportMenu({ onConfigure, onQuickExport }: { onConfigure: () => void; onQuickExport: () => void }) {
  return <div className="ui-split-button"><Button variant="primary" onClick={onConfigure}><ButtonIcon><ExportIcon /></ButtonIcon> Exportar</Button><DropdownMenu label="Accesos de exportación" trigger={<IconButton label="Más opciones de exportación"><span className="ui-icon-button-slot" aria-hidden="true"><ChevronDownIcon /></span></IconButton>} items={[{ label: "Configurar exportación", onSelect: onConfigure }, { label: "Exportar última selección", onSelect: onQuickExport }]} /></div>;
}

export function LabHeader({ projectName, onOpenProject, health, themeAction, projectMenu, exportMenu }: { projectName: string; onOpenProject: () => void; health: ReactNode; themeAction: ReactNode; projectMenu: ReactNode; exportMenu: ReactNode }) {
  return <header className="ui-header"><div className="ui-project-context"><button type="button" className="ui-project-trigger" aria-haspopup="dialog" onClick={onOpenProject}><BrandMark className="ui-brand-mark" size={36} /><span>{projectName}</span></button>{health}</div><div className="ui-header-actions">{projectMenu}{exportMenu}<span className="ui-header-divider" />{themeAction}</div></header>;
}
