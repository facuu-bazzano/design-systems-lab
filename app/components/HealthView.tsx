"use client";

import { CSSProperties } from "react";
import { analyzeProject } from "../lib/health";
import { DesignSystemProject, LabSection, resolveSemantic } from "../lib/model";

export function HealthView({ project, onNavigate }: { project: DesignSystemProject; onNavigate: (section: LabSection) => void }) {
  const health = analyzeProject(project);
  const theme = project.themes[0]?.id || "light";
  const vars = {
    "--mini-surface": resolveSemantic(project, "surface-default", theme, "mobile") || "transparent",
    "--mini-raised": resolveSemantic(project, "surface-raised", theme, "mobile") || "transparent",
    "--mini-text": resolveSemantic(project, "text-primary", theme, "mobile") || "currentColor",
    "--mini-muted": resolveSemantic(project, "text-muted", theme, "mobile") || "currentColor",
    "--mini-action": resolveSemantic(project, "action-primary", theme, "mobile") || "transparent",
    "--mini-on-action": resolveSemantic(project, "text-on-action", theme, "mobile") || "currentColor",
    "--mini-border": resolveSemantic(project, "border-subtle", theme, "mobile") || "currentColor",
    "--mini-selected": resolveSemantic(project, "selected-surface", theme, "mobile") || "transparent",
    "--mini-radius": project.foundations.scales.radii.find((token) => token.name === "md")?.value || "0",
    "--project-font": `'${project.foundations.typography.family}', system-ui, sans-serif`,
  } as CSSProperties;

  return (
    <div className="health-view">
      <header className="view-header"><div><span className="section-kicker">Auditoría global</span><h1>Salud del sistema</h1><p>Hallazgos consolidados para todos los modos, plataformas y capas de tokens. Cada indicador explica qué afecta el nivel de preparación.</p></div></header>
      <div className="health-overview">
        <article className="score-card"><div className="score-ring" style={{ "--score": `${health.score * 3.6}deg` } as CSSProperties}><span>{health.score}</span></div><div><span className="score-label">Preparación general</span><h2>{health.score >= 90 ? "Listo para documentar" : health.score >= 70 ? "Base sólida, con revisiones" : "Requiere atención"}</h2><p>Parte de 100 y descuenta 14 por crítico, 6 por advertencia y 2 por recomendación. Los factores aparecen a la derecha.</p></div></article>
        <div className="health-metrics"><article><span>Cobertura semántica</span><b>{health.coverage}%</b><small>{project.semanticTokens.length} roles definidos</small></article><article><span>Críticos</span><b>{health.counts.critical}</b><small>Bloquean estados confiables</small></article><article><span>Advertencias</span><b>{health.counts.warning}</b><small>Requieren revisión</small></article><article><span>Plataformas</span><b>{Object.values(project.platforms).filter((platform) => platform.enabled).length}</b><small>activas en el proyecto</small></article></div>
      </div>

      <div className="health-content-grid">
        <section className="findings-panel">
          <div className="panel-heading"><div><span className="section-kicker">Hallazgos</span><h2>Qué necesita atención</h2></div><span className="count-badge">{health.findings.length}</span></div>
          {health.findings.length ? <div className="finding-list">{health.findings.map((finding) => <button key={finding.id} className={`finding-item ${finding.severity}`} onClick={() => onNavigate(finding.section)}><span className="finding-icon">{finding.severity === "critical" ? "!" : finding.severity === "warning" ? "△" : "i"}</span><div><div><strong>{finding.area}</strong><span>{finding.mode}</span></div><p>{finding.explanation}</p></div><b>Corregir →</b></button>)}</div> : <div className="health-empty"><span>✓</span><strong>Sin hallazgos activos</strong><p>La configuración actual pasa las verificaciones iniciales.</p></div>}
        </section>

        <aside className="health-live-panel">
          <div className="panel-heading"><div><span className="section-kicker">Interfaz viva</span><h2>Lectura rápida</h2></div><span className="live-dot">Live</span></div>
          <div className="health-mini-ui" style={vars}>
            <div className="mini-ui-head"><span>{project.meta.brandMark}</span><i></i><i></i><b></b></div>
            <div className="mini-ui-copy"><small>PRÓXIMO HITO</small><h3>Prepará el handoff</h3><p>Revisá la cobertura antes de documentar el sistema.</p></div>
            <div className="mini-ui-card"><div><span className="mini-ui-avatar">DS</span><p><strong>Foundations</strong><small>{project.foundations.colors.length} paletas · {project.foundations.typography.levels.length} estilos</small></p><b>{health.coverage}%</b></div><div className="mini-progress"><span style={{ width: `${health.coverage}%` }}></span></div><button>Ver catálogo</button></div>
          </div>
          <div className="health-explanation"><h3>Factores visibles</h3><ul><li><span className="dot critical"></span>Referencias rotas y contrastes críticos</li><li><span className="dot warning"></span>Modos o plataformas sin revisar</li><li><span className="dot info"></span>Recomendaciones de composición</li></ul></div>
        </aside>
      </div>
    </div>
  );
}

