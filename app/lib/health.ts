import { ComponentToken, contrastRatio, DesignSystemProject, LabSection, platformOrder, requiredSemanticIds, resolvePrimitiveColor, semanticById } from "./model";
import { resolveProjectTokens } from "./token-resolver";

export type FindingSeverity = "blocking" | "warning" | "recommendation";
export type HealthFinding = { id: string; severity: FindingSeverity; mode: string; platform: string; area: string; cause: string; action: string; section: LabSection };

const componentReferenceExists = (project: DesignSystemProject, token: ComponentToken) => {
  if (token.reference.startsWith("semantic:")) return Boolean(semanticById(project, token.reference.slice(9)));
  if (token.reference.startsWith("primitive:")) { const [group, name] = token.reference.slice(10).split("."); return Boolean(project.foundations.scales[group as keyof typeof project.foundations.scales]?.some((item) => item.name === name)); }
  return false;
};

export function analyzeProject(project: DesignSystemProject) {
  if (project.projectState === "blank") return { status: "not-evaluated" as const, score: null, coverage: 0, findings: [] as HealthFinding[], counts: { blocking: 0, warning: 0, recommendation: 0 }, summary: "Configuración pendiente" };
  const findings: HealthFinding[] = [];
  const enabledPlatforms = platformOrder.filter((id) => project.platforms[id].enabled);
  for (const semanticId of requiredSemanticIds) if (!semanticById(project, semanticId)) findings.push({ id: `missing-${semanticId}`, severity: "blocking", mode: "Todos", platform: "Todas", area: "Tokens semánticos", cause: `Falta el rol ${semanticId}.`, action: "Asignar una foundation al rol requerido.", section: "semantics" });
  for (const token of project.semanticTokens) for (const [context, reference] of [["Base", token.defaultRef], ...Object.entries(token.themeRefs), ...Object.entries(token.platformRefs)]) if (reference && !resolvePrimitiveColor(project, reference)) findings.push({ id: `broken-${token.id}-${context}`, severity: "blocking", mode: context, platform: "Aplicable", area: token.name, cause: `La referencia ${reference} no existe.`, action: "Elegir una foundation disponible.", section: "semantics" });
  for (const token of project.componentTokens) if (!componentReferenceExists(project, token)) findings.push({ id: `component-${token.id}`, severity: "blocking", mode: "Todos", platform: "Todas", area: token.component, cause: `${token.name} no puede resolver ${token.reference}.`, action: "Conectar el token a un semántico o primitivo válido.", section: "semantics" });
  for (const theme of project.themes) for (const platform of enabledPlatforms) {
    const snapshot = resolveProjectTokens(project, theme.id, platform);
    if (!snapshot.ready) continue;
    const pairs = [
      ["Texto / superficie", snapshot.semantic["text-primary"], snapshot.semantic["surface-default"]],
      ["Botón primario", snapshot.semantic["text-on-action"], snapshot.component.buttonPrimary],
      ["Acción destructiva", snapshot.semantic["text-on-action"], snapshot.component.buttonDestructive],
    ];
    for (const [area, foreground, background] of pairs) {
      const ratio = contrastRatio(foreground, background);
      if (ratio < 4.5) findings.push({ id: `contrast-${theme.id}-${platform}-${area}`, severity: ratio < 3 ? "blocking" : "warning", mode: theme.name, platform: project.platforms[platform].name, area, cause: `Contraste ${ratio.toFixed(2)}:1; el objetivo es 4.5:1.`, action: "Ajustar el tono semántico de texto o superficie.", section: "semantics" });
    }
  }
  for (const platform of enabledPlatforms) if (project.platforms[platform].proposalPending) findings.push({ id: `platform-${platform}`, severity: "warning", mode: "Todos", platform: project.platforms[platform].name, area: "Layout", cause: "La propuesta heredada todavía no fue revisada.", action: "Revisar grilla y marcar la plataforma como validada.", section: "scales" });
  if ((project.implementationProfile.ios || project.implementationProfile.android) && semanticById(project, "surface-overlay") && !semanticById(project, "surface-overlay")!.defaultRef.includes("@")) findings.push({ id: "native-overlay-alpha", severity: "recommendation", mode: "Todos", platform: "iOS / Android", area: "Composición", cause: "El overlay no incorpora alpha en el color semántico.", action: "Evaluar alpha incorporado para composición más predecible.", section: "semantics" });
  const counts = { blocking: findings.filter((item) => item.severity === "blocking").length, warning: findings.filter((item) => item.severity === "warning").length, recommendation: findings.filter((item) => item.severity === "recommendation").length };
  const score = Math.max(0, 100 - counts.blocking * 18 - counts.warning * 5 - counts.recommendation * 2);
  const coverage = Math.round(requiredSemanticIds.filter((id) => semanticById(project, id)).length / requiredSemanticIds.length * 100);
  return { status: counts.blocking ? "needs-attention" as const : "ready" as const, score, coverage, findings, counts, summary: counts.blocking ? "Requiere correcciones" : counts.warning ? "Base válida con revisiones" : "Sistema validado" };
}
