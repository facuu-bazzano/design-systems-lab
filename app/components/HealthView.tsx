"use client";

import { CSSProperties, useMemo } from "react";
import { analyzeProject, HealthFinding } from "../lib/health";
import { catalogRegistry } from "../lib/catalog-registry";
import { DesignSystemProject, PlatformId, platformOrder } from "../lib/model";
import { resolveProjectTokens } from "../lib/token-resolver";
import { Alert, Badge, Button, Card, SectionHeading, Table } from "./ui/LabUI";

type Props = { project: DesignSystemProject; onOpenTokens: (token: string) => void; onOpenCatalog: (component?: string) => void; onOpenScenarios: (component?: string) => void; onOpenFinding: (finding: HealthFinding) => void };

function HealthStat({ count, label, onOpen }: { count: number; label: string; onOpen: () => void }) {
  if (!count) return <div className="health-stat" aria-label={`${label}: sin hallazgos`}><b>Sin hallazgos</b><span>{label}</span></div>;
  return <button className="health-stat" onClick={onOpen} aria-label={`${count} ${label.toLowerCase()}. Abrir hallazgos`}><b>{count}</b><span>{label}</span></button>;
}

function MetricValue({ value, label, className = "", onOpen }: { value: number; label: string; className?: string; onOpen: () => void }) {
  if (!value) return <span className="metric-zero" aria-label={`${label}: sin hallazgos`}>Sin hallazgos</span>;
  return <button className={`metric-link ${className}`} onClick={onOpen} aria-label={`${value} ${label}. Abrir elementos afectados`}>{value}</button>;
}

export function HealthView({ project, onOpenTokens, onOpenCatalog, onOpenScenarios, onOpenFinding }: Props) {
  const health = analyzeProject(project);
  const enabledPlatforms = platformOrder.filter((id) => project.platforms[id].enabled);
  const coverage = useMemo(() => project.themes.flatMap((mode) => enabledPlatforms.map((platform) => {
    const snapshot = resolveProjectTokens(project, mode.id, platform);
    const missingComponents = catalogRegistry.filter((entry) => entry.componentTokens.some((name) => !project.componentTokens.some((token) => token.name === name)));
    const errors = snapshot.ready ? 0 : Math.max(1, snapshot.missing.length);
    const warnings = project.platforms[platform].proposalPending ? 1 : missingComponents.length;
    const covered = catalogRegistry.length - missingComponents.length;
    return { mode, platform, snapshot, total: catalogRegistry.length, errors, warnings, uncovered: missingComponents.length, covered, missingComponents };
  })), [project, enabledPlatforms]);
  const findingFor = (platform: PlatformId, severity?: HealthFinding["severity"]) => health.findings.find((finding) => finding.platformId === platform && (!severity || finding.severity === severity)) || health.findings.find((finding) => !severity || finding.severity === severity);
  const inspectCoverage = (platform: PlatformId, errors: number, warnings: number) => {
    const finding = errors ? findingFor(platform, "blocking") : warnings ? findingFor(platform, "warning") : undefined;
    if (finding) onOpenFinding(finding); else onOpenCatalog();
  };

  if (health.status === "not-evaluated") return <div className="health-v4"><SectionHeading title="Salud del sistema" description="La evaluación empieza cuando existe una base mínima. Un proyecto en blanco no está fallando: todavía está pendiente de configuración." /><Alert tone="info" title="Sin evaluar" action={<Button onClick={() => onOpenTokens("surface.default")}>Configurar primeros tokens</Button>}>Creá una paleta, asigná roles semánticos esenciales y conectá decisiones de componente para iniciar la cobertura.</Alert><Card><SectionHeading level={2} title="Ruta recomendada" description="1. Foundations de color y tipografía · 2. Tokens semánticos · 3. Catálogo · 4. Salud global" /></Card></div>;

  return <div className="health-v4">
    <SectionHeading title="Salud del sistema" description="Vista consolidada para priorizar coherencia global por modo, plataforma y componente. Las métricas llevan al punto exacto de inspección." />
    <section className="health-summary-v4"><Card className="health-score-v4"><div className="score-ring" style={{ "--score": `${(health.score || 0) * 3.6}deg` } as CSSProperties}><span>{health.score}</span></div><div><Badge tone={health.counts.blocking ? "danger" : "success"}>{health.counts.blocking ? "Requiere atención" : "Listo para explorar"}</Badge><h2>{health.summary}</h2><p>El resultado se explica con los hallazgos y la cobertura visibles debajo.</p></div></Card><Card><SectionHeading level={2} title="Hallazgos activos" /><div className="health-stat-row"><HealthStat count={health.counts.blocking} label="Errores" onOpen={() => { const finding = health.findings.find((item) => item.severity === "blocking"); if (finding) onOpenFinding(finding); }} /><HealthStat count={health.counts.warning} label="Advertencias" onOpen={() => { const finding = health.findings.find((item) => item.severity === "warning"); if (finding) onOpenFinding(finding); }} /><HealthStat count={health.counts.recommendation} label="Recomendaciones" onOpen={() => { const finding = health.findings.find((item) => item.severity === "recommendation"); if (finding) onOpenFinding(finding); }} /></div></Card></section>
    <Card><SectionHeading level={2} title="Cobertura por modo y plataforma" description={`${catalogRegistry.length} componentes del registro se evalúan en cada combinación activa.`} /><Table><thead><tr><th>Modo</th><th>Plataforma</th><th>Evaluados</th><th>Con error</th><th>Con advertencia</th><th>Sin cobertura</th><th>Acción</th></tr></thead><tbody>{coverage.map((row) => <tr key={`${row.mode.id}-${row.platform}`}><td>{row.mode.name}</td><td>{project.platforms[row.platform].name}</td><td><b>{row.total}</b></td><td><MetricValue value={row.errors} className="error" label={`errores en ${row.mode.name}, ${project.platforms[row.platform].name}`} onOpen={() => inspectCoverage(row.platform, row.errors, 0)} /></td><td><MetricValue value={row.warnings} className="warning" label={`advertencias en ${row.mode.name}, ${project.platforms[row.platform].name}`} onOpen={() => inspectCoverage(row.platform, 0, row.warnings)} /></td><td><MetricValue value={row.uncovered} label={`componentes sin cobertura en ${row.mode.name}, ${project.platforms[row.platform].name}`} onOpen={() => onOpenScenarios(row.missingComponents[0]?.id)} /></td><td>{row.errors || row.warnings || row.uncovered ? <Button size="sm" variant="quiet" onClick={() => inspectCoverage(row.platform, row.errors, row.warnings)}>Inspeccionar</Button> : <span className="metric-zero">Sin hallazgos</span>}</td></tr>)}</tbody></Table></Card>
    <Card><SectionHeading level={2} title="Hallazgos priorizados" description="Cada hallazgo incluye contexto, causa y acción correctiva." />{health.findings.length ? <div className="health-findings-v4">{health.findings.map((finding) => <article key={finding.id}><Badge tone={finding.severity === "blocking" ? "danger" : finding.severity === "warning" ? "warning" : "info"}>{finding.severity === "blocking" ? "Error" : finding.severity === "warning" ? "Advertencia" : "Recomendación"}</Badge><div><small>{finding.mode} · {finding.platform} · {finding.area}</small><h3>{finding.cause}</h3><p>{finding.action}</p></div><Button size="sm" onClick={() => onOpenFinding(finding)}>Corregir</Button></article>)}</div> : <Alert tone="success" title="Sin bloqueantes">El sistema inicial resuelve los roles, referencias y contrastes esenciales.</Alert>}</Card>
    <Card className="health-evidence-card"><SectionHeading level={2} title="Evidencia visual" description="Los escenarios integrados viven en una herramienta independiente para comparar modos y plataformas sin mezclar diagnóstico con exploración." action={<Button onClick={() => onOpenScenarios()}>Abrir escenarios</Button>} /><p>La suite representa {catalogRegistry.length} componentes y conserva los vínculos con Catálogo para inspección puntual.</p></Card>
  </div>;
}
