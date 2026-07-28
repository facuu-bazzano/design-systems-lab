"use client";

import { ComponentPropsWithoutRef, ReactNode, useMemo, useState } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import * as RadioPrimitive from "@radix-ui/react-radio-group";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { ActivityIcon, CheckIcon, ChevronDownIcon, ExportIcon, FolderIcon, InfoIcon, SearchIcon } from "./Icons";

type ButtonProps = ComponentPropsWithoutRef<"button"> & { variant?: "primary" | "secondary" | "quiet" | "danger"; size?: "sm" | "md" | "lg" };
export function Button({ variant = "secondary", size = "md", className = "", ...props }: ButtonProps) {
  return <button className={`ui-button ui-button-${variant} ui-button-${size} ${className}`} {...props} />;
}
export function IconButton({ label, children, className = "", ...props }: ComponentPropsWithoutRef<"button"> & { label: string }) {
  return <button className={`ui-icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

type FieldProps = ComponentPropsWithoutRef<"input"> & { label?: string; help?: string; error?: string; suffix?: string };
export function Input({ label, help, error, suffix, className = "", ...props }: FieldProps) {
  return <label className={`ui-field ${error ? "is-error" : ""}`}><span className="ui-field-label">{label}</span><span className="ui-input-shell"><input className={className} aria-invalid={Boolean(error)} {...props} />{suffix ? <span className="ui-input-suffix">{suffix}</span> : null}</span>{error || help ? <small>{error || help}</small> : null}</label>;
}
export function Textarea({ label, help, error, className = "", ...props }: ComponentPropsWithoutRef<"textarea"> & { label?: string; help?: string; error?: string }) {
  return <label className={`ui-field ${error ? "is-error" : ""}`}><span className="ui-field-label">{label}</span><textarea className={className} aria-invalid={Boolean(error)} {...props} />{error || help ? <small>{error || help}</small> : null}</label>;
}

export type SelectOption = { value: string; label: string; meta?: string };
export function Select({ label, value, onValueChange, options, disabled, placeholder = "Seleccionar" }: { label?: string; value?: string; onValueChange: (value: string) => void; options: SelectOption[]; disabled?: boolean; placeholder?: string }) {
  return <label className="ui-field"><span className="ui-field-label">{label}</span><SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}><SelectPrimitive.Trigger className="ui-select-trigger"><SelectPrimitive.Value placeholder={placeholder} /><SelectPrimitive.Icon><ChevronDownIcon /></SelectPrimitive.Icon></SelectPrimitive.Trigger><SelectPrimitive.Portal><SelectPrimitive.Content className="ui-select-content" position="popper" sideOffset={6}><SelectPrimitive.Viewport>{options.map((option) => <SelectPrimitive.Item key={option.value} value={option.value} className="ui-select-item"><span><SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>{option.meta ? <small>{option.meta}</small> : null}</span><SelectPrimitive.ItemIndicator><CheckIcon /></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>)}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal></SelectPrimitive.Root></label>;
}

export function Combobox({ label, value, onValueChange, options, placeholder = "Buscar o seleccionar", renderOption }: { label?: string; value: string; onValueChange: (value: string) => void; options: SelectOption[]; placeholder?: string; renderOption?: (option: SelectOption) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => options.filter((option) => `${option.label} ${option.meta || ""}`.toLowerCase().includes(query.toLowerCase())), [options, query]);
  const current = options.find((option) => option.value === value);
  return <label className="ui-field"><span className="ui-field-label">{label}</span><Popover.Root open={open} onOpenChange={setOpen}><Popover.Trigger className="ui-combobox-trigger" aria-label={label}>{current?.label || value || placeholder}<ChevronDownIcon /></Popover.Trigger><Popover.Portal><Popover.Content className="ui-combobox-content" sideOffset={6} align="start"><div className="ui-combobox-search"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} autoFocus /></div><div className="ui-combobox-list">{filtered.map((option) => <button type="button" key={option.value} className={option.value === value ? "selected" : ""} onClick={() => { onValueChange(option.value); setOpen(false); setQuery(""); }}>{renderOption ? renderOption(option) : <span><b>{option.label}</b>{option.meta ? <small>{option.meta}</small> : null}</span>}{option.value === value ? <CheckIcon /> : null}</button>)}{!filtered.length ? <p>Sin coincidencias. Podés ingresar una familia personalizada.</p> : null}</div></Popover.Content></Popover.Portal></Popover.Root></label>;
}

export function Checkbox({ checked, onCheckedChange, label, disabled }: { checked: boolean; onCheckedChange: (checked: boolean) => void; label: ReactNode; disabled?: boolean }) {
  return <label className={`ui-control-line ${disabled ? "is-disabled" : ""}`}><CheckboxPrimitive.Root className="ui-checkbox" checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} disabled={disabled}><CheckboxPrimitive.Indicator><CheckIcon /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root><span>{label}</span></label>;
}
export function RadioGroup({ value, onValueChange, options, disabled }: { value: string; onValueChange: (value: string) => void; options: SelectOption[]; disabled?: boolean }) {
  return <RadioPrimitive.Root className="ui-radio-group" value={value} onValueChange={onValueChange} disabled={disabled}>{options.map((option) => <label key={option.value} className="ui-control-line"><RadioPrimitive.Item className="ui-radio" value={option.value}><RadioPrimitive.Indicator /></RadioPrimitive.Item><span>{option.label}{option.meta ? <small>{option.meta}</small> : null}</span></label>)}</RadioPrimitive.Root>;
}
export function Switch({ checked, onCheckedChange, label, ariaLabel, disabled }: { checked: boolean; onCheckedChange: (checked: boolean) => void; label?: ReactNode; ariaLabel?: string; disabled?: boolean }) {
  return <label className={`ui-control-line ${!label ? "is-switch-only" : ""} ${disabled ? "is-disabled" : ""}`}><SwitchPrimitive.Root aria-label={ariaLabel || (typeof label === "string" ? label : undefined)} className="ui-switch" checked={checked} onCheckedChange={onCheckedChange} disabled={disabled}><SwitchPrimitive.Thumb /></SwitchPrimitive.Root>{label ? <span>{label}</span> : null}</label>;
}
export function Toggle({ pressed, onPressedChange, children }: { pressed: boolean; onPressedChange: (pressed: boolean) => void; children: ReactNode }) {
  return <Button variant={pressed ? "primary" : "secondary"} aria-pressed={pressed} onClick={() => onPressedChange(!pressed)}>{children}</Button>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`ui-card ${className}`}>{children}</section>; }
export function Table({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className="ui-table-wrap"><table className={`ui-table ${className}`}>{children}</table></div>; }
export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "info" | "success" | "warning" | "danger"; children: ReactNode }) { return <span className={`ui-badge ui-badge-${tone}`}>{children}</span>; }
export function Alert({ tone = "info", title, children, action }: { tone?: "info" | "success" | "warning" | "danger"; title: string; children: ReactNode; action?: ReactNode }) { const Icon = tone === "success" ? CircleCheck : tone === "warning" ? TriangleAlert : tone === "danger" ? CircleX : InfoIcon; return <div className={`ui-alert ui-alert-${tone}`}><Icon /><div><b>{title}</b><p>{children}</p>{action}</div></div>; }
export function SectionHeading({ title, description, action, level = 1 }: { title: string; description?: string; action?: ReactNode; level?: 1 | 2 }) {
  const Title = level === 1 ? "h1" : "h2";
  return <header className={`ui-section-heading level-${level}`}><div><Title>{title}</Title>{description ? <p>{description}</p> : null}</div>{action}</header>;
}
export function HelpTooltip({ label, children }: { label: string; children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={250}><TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild><IconButton label={label}><InfoIcon /></IconButton></TooltipPrimitive.Trigger><TooltipPrimitive.Portal><TooltipPrimitive.Content className="ui-tooltip" sideOffset={7}>{children}<TooltipPrimitive.Arrow className="ui-tooltip-arrow" /></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root></TooltipPrimitive.Provider>;
}

export function DropdownMenu({ trigger, items, label }: { trigger: ReactNode; label: string; items: { label: string; icon?: ReactNode; onSelect: () => void; disabled?: boolean }[] }) {
  return <DropdownPrimitive.Root><DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger><DropdownPrimitive.Portal><DropdownPrimitive.Content className="ui-menu-content" sideOffset={7} align="start" aria-label={label}>{items.map((item) => <DropdownPrimitive.Item key={item.label} className="ui-menu-item" onSelect={item.onSelect} disabled={item.disabled}>{item.icon}<span>{item.label}</span></DropdownPrimitive.Item>)}</DropdownPrimitive.Content></DropdownPrimitive.Portal></DropdownPrimitive.Root>;
}
export function Tabs({ value, onValueChange, tabs, ariaLabel }: { value: string; onValueChange: (value: string) => void; tabs: { value: string; label: string; content?: ReactNode }[]; ariaLabel: string }) {
  return <TabsPrimitive.Root className="ui-tabs" value={value} onValueChange={onValueChange}><TabsPrimitive.List aria-label={ariaLabel}>{tabs.map((tab) => <TabsPrimitive.Trigger key={tab.value} value={tab.value}>{tab.label}</TabsPrimitive.Trigger>)}</TabsPrimitive.List>{tabs.map((tab) => tab.content ? <TabsPrimitive.Content key={tab.value} value={tab.value}>{tab.content}</TabsPrimitive.Content> : null)}</TabsPrimitive.Root>;
}

export function HealthIndicator({ score, status, summary, onClick }: { score: number | null; status: "ready" | "attention" | "pending"; summary: string; onClick: () => void }) {
  const label = status === "pending" ? "Sin evaluar" : `${score}%`;
  return <TooltipPrimitive.Provider delayDuration={250}><TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild><button className={`ui-health ui-health-${status}`} onClick={onClick} aria-label={`Salud del sistema: ${summary}`}><ActivityIcon /><span>{label}</span></button></TooltipPrimitive.Trigger><TooltipPrimitive.Portal><TooltipPrimitive.Content className="ui-tooltip" sideOffset={7}><b>{summary}</b><span>{status === "pending" ? "Completá la base para iniciar la evaluación." : "Abrir cobertura, hallazgos y escenarios."}</span><TooltipPrimitive.Arrow className="ui-tooltip-arrow" /></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root></TooltipPrimitive.Provider>;
}

export function ProjectMenu({ onImport, onDownload, onDuplicate }: { onImport: () => void; onDownload: () => void; onDuplicate: () => void }) {
  return <DropdownMenu label="Menú del proyecto" trigger={<Button variant="secondary"><FolderIcon /> Proyecto <ChevronDownIcon /></Button>} items={[{ label: "Importar proyecto", onSelect: onImport }, { label: "Descargar proyecto", onSelect: onDownload }, { label: "Duplicar proyecto", onSelect: onDuplicate }]} />;
}
export function ExportMenu({ onConfigure, onQuickExport }: { onConfigure: () => void; onQuickExport: () => void }) {
  return <div className="ui-split-button"><Button variant="primary" onClick={onConfigure}><ExportIcon /> Exportar</Button><DropdownMenu label="Accesos de exportación" trigger={<IconButton label="Más opciones de exportación"><ChevronDownIcon /></IconButton>} items={[{ label: "Configurar exportación", onSelect: onConfigure }, { label: "Exportar última selección", onSelect: onQuickExport }]} /></div>;
}

export function LabHeader({ projectName, health, themeAction, projectMenu, exportMenu }: { projectName: string; health: ReactNode; themeAction: ReactNode; projectMenu: ReactNode; exportMenu: ReactNode }) {
  return <header className="ui-header"><div className="ui-project-name"><span>{projectName}</span>{health}</div><div className="ui-header-actions">{projectMenu}{exportMenu}<span className="ui-header-divider" />{themeAction}</div></header>;
}
