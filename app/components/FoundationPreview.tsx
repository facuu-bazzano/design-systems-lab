"use client";

import { CSSProperties, ReactNode, useId, useMemo, useState } from "react";
import { DesignSystemProject, PlatformId, platformOrder, typographyLevelForRole } from "../lib/model";
import { resolveProjectTokens } from "../lib/token-resolver";
import { Alert, Card, SectionHeading, Select } from "./ui/LabUI";

type Focus = "color" | "typography" | "layout";

function TypographyRoleSample({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  const tooltipId = useId();
  return <div className={`type-role-sample ${className}`} tabIndex={0} aria-describedby={tooltipId}><span id={tooltipId} role="tooltip" className="type-role-tooltip">{label}</span>{children}</div>;
}

export function FoundationPreview({ project, focus }: { project: DesignSystemProject; focus: Focus }) {
  const platforms = platformOrder.filter((id) => project.platforms[id].enabled);
  const [theme, setTheme] = useState(project.themes[0]?.id || "light");
  const [platform, setPlatform] = useState<PlatformId>(platforms[0] || "mobile");
  const snapshot = useMemo(() => resolveProjectTokens(project, theme, platform), [project, theme, platform]);
  const typeLabel = (role: "caption" | "body" | "label" | "heading" | "display") => { const level = typographyLevelForRole(project.foundations.typography, role); return `${level.name} · ${level.size}px · peso ${level.weight} · interlineado ${level.lineHeight}`; };
  const title = focus === "color" ? "Preview de color" : focus === "typography" ? "Preview tipográfico" : "Preview de ritmo y layout";
  const description = focus === "color"
    ? "Comprobá superficies, acciones y feedback con los roles semánticos resueltos."
    : focus === "typography"
      ? "Compará jerarquía, lectura y densidad con familias y métricas reales."
      : "Observá cómo multiplicadores, espaciado, columnas y baseline afectan una interfaz real.";

  return <Card className="foundation-preview-card">
    <SectionHeading level={2} title={title} description={description} />
    <div className="foundation-preview-toolbar">
      <Select label="Modo" value={theme} onValueChange={setTheme} options={project.themes.map((item) => ({ value: item.id, label: item.name }))} />
      <Select label="Plataforma" value={platform} onValueChange={(value) => setPlatform(value as PlatformId)} options={platforms.map((id) => ({ value: id, label: project.platforms[id].name }))} />
    </div>
    {!snapshot.ready ? <Alert tone="warning" title="Configuración pendiente">La muestra conserva una estructura legible, pero señala las referencias que todavía deben asignarse.</Alert> : null}
    <div className={`foundation-live-preview focus-${focus}`} style={snapshot.cssVariables as CSSProperties}>
      {focus === "color" ? <>
        <header><span>Vista del proyecto</span><button type="button">Nueva revisión</button></header>
        <div className="foundation-color-grid"><section><small>Superficie elevada</small><h3>Decisiones visibles</h3><p>Texto principal y secundario conviven sobre los fondos activos.</p><a href="#foundation-color-preview">Ver detalle</a></section><aside><div className="foundation-status success"><b>Correcto</b><span>La asignación está completa.</span></div><div className="foundation-status warning"><b>Atención</b><span>Revisá la propuesta heredada.</span></div><div className="foundation-status destructive"><b>Error</b><span>Falta una referencia esencial.</span></div></aside></div>
      </> : null}
      {focus === "typography" ? <div className="foundation-type-sample"><div className="type-sample-main"><TypographyRoleSample label={typeLabel("caption")} className="type-sample-caption"><span className="sample-caption">Producto · Documentación</span></TypographyRoleSample><TypographyRoleSample label={typeLabel("display")} className="type-sample-display"><h2>Una jerarquía que se puede comprobar</h2></TypographyRoleSample><TypographyRoleSample label={typeLabel("body")} className="type-sample-body"><p>La vista usa las familias, tamaños, pesos, interlineados y tracking resueltos para esta plataforma. Este párrafo permite evaluar el ritmo de lectura, la longitud de línea y la convivencia entre varias frases.</p><p>Un segundo bloque hace visibles los saltos, la densidad vertical y la continuidad tipográfica que no aparecen en una muestra de una sola línea.</p></TypographyRoleSample><TypographyRoleSample label={typeLabel("label")} className="type-sample-label"><label>Nombre del sistema<input defaultValue={project.meta.name} /></label></TypographyRoleSample></div><TypographyRoleSample label={typeLabel("display")} className="type-sample-metric"><div><b>Dato destacado</b><strong>72%</strong><small>Cobertura tipográfica</small></div></TypographyRoleSample></div> : null}
      {focus === "layout" ? <div className="foundation-layout-sample"><div className="foundation-grid-overlay" aria-hidden="true">{Array.from({ length: Number(snapshot.cssVariables["--ds-columns" as keyof CSSProperties]) || 4 }).map((_, index) => <i key={index} />)}</div><header><b>Panel</b><span>{project.platforms[platform].name}</span></header><aside><span /><span /><span /></aside><section className="foundation-layout-content"><section><h3>Contenido principal</h3><p>El frame responde a márgenes, gutter, ancho máximo y escalas espaciales.</p></section><div className="foundation-layout-cards"><article /><article /><article /></div></section></div> : null}
    </div>
  </Card>;
}
