import { componentById, componentTokenPath, ComponentToken, contrastRatio, DesignSystemProject, LabSection, PlatformId, platformOrder, requiredSemanticIds, resolvePrimitiveColor, semanticById } from "./model";
import { resolveProjectTokens } from "./token-resolver";

export type FindingSeverity = "blocking" | "warning" | "recommendation";
export type HealthFinding = { id: string; severity: FindingSeverity; mode: string; platform: string; platformId?: PlatformId; area: string; cause: string; action: string; section: LabSection; target?: string };

const componentReferenceExists = (project: DesignSystemProject, token: ComponentToken) => {
  if (token.reference.startsWith("semantic:")) return Boolean(semanticById(project, token.reference.slice(9)));
  if (token.reference.startsWith("primitive:")) { const [group, name] = token.reference.slice(10).split("."); return Boolean(project.foundations.scales[group as keyof typeof project.foundations.scales]?.some((item) => item.name === name)); }
  return false;
};

export function analyzeProject(project: DesignSystemProject) {
  const rendererComponents = project.components.filter((component) => component.rendererKey);
  const customWithoutRenderer = project.components.filter((component) => !component.rendererKey);
  const visualVariants = project.componentVariants.filter((variant) => variant.visibleInCatalog && rendererComponents.some((component) => component.id === variant.componentId));
  const tokensWithoutVisual = project.componentTokens.filter((token) => customWithoutRenderer.some((component) => component.id === token.componentId));
  const metrics = { componentsWithPreview: rendererComponents.length, variantsEvaluated: visualVariants.length, customWithoutRenderer: customWithoutRenderer.length, tokensWithoutVisual: tokensWithoutVisual.length, inactivePlatforms: platformOrder.filter((id) => !project.platforms[id].enabled).length };
  if (project.projectState === "blank") return { status: "not-evaluated" as const, score: null, coverage: 0, findings: [] as HealthFinding[], counts: { blocking: 0, warning: 0, recommendation: 0 }, metrics, summary: "Configuración pendiente" };
  const findings: HealthFinding[] = [];
  const enabledPlatforms = platformOrder.filter((id) => project.platforms[id].enabled);
  const typography = project.foundations.typography;
  if (!typography.families.length) findings.push({ id: "typography-no-families", severity: "blocking", mode: "Todos", platform: "Todas", area: "Tipografía", cause: "No hay familias tipográficas disponibles.", action: "Agregar al menos una familia y asignarla a los estilos.", section: "typography" });
  for (const level of typography.levels) if (!typography.families.some((family) => family.id === level.familyId)) findings.push({ id: `typography-broken-${level.id}`, severity: "blocking", mode: "Todos", platform: "Todas", area: `Tipografía · ${level.name}`, cause: "El estilo referencia una familia que ya no existe.", action: "Asignar una familia disponible al estilo.", section: "typography", target: level.id });
  if (typography.families.length > 3) findings.push({ id: "typography-family-count", severity: "recommendation", mode: "Todos", platform: "Todas", area: "Tipografía", cause: `El proyecto usa ${typography.families.length} familias tipográficas.`, action: "Confirmar que cada familia cumple una función distinta para evitar fragmentar la voz visual y aumentar el costo de carga.", section: "typography" });
  for (const semanticId of requiredSemanticIds) if (!semanticById(project, semanticId)) findings.push({ id: `missing-${semanticId}`, severity: "blocking", mode: "Todos", platform: "Todas", area: "Tokens semánticos", cause: `Falta el rol ${semanticId}.`, action: "Asignar una foundation al rol requerido.", section: "semantics", target: semanticId });
  for (const token of project.semanticTokens) for (const [context, reference] of [["Base", token.defaultRef], ...Object.entries(token.themeRefs), ...Object.entries(token.platformRefs)]) if (reference && !resolvePrimitiveColor(project, reference)) findings.push({ id: `broken-${token.id}-${context}`, severity: "blocking", mode: context, platform: "Aplicable", area: token.name, cause: `La referencia ${reference} no existe.`, action: "Elegir una foundation disponible.", section: "semantics", target: token.id });
  for (const variant of project.componentVariants) {
    if (!componentById(project, variant.componentId)) findings.push({ id: `orphan-variant-component-${variant.id}`, severity: "blocking", mode: "Todos", platform: "Todas", area: variant.name, cause: "La variante conserva una referencia a un componente eliminado.", action: "Reasignar la variante a un componente compatible o eliminarla.", section: "semantics", target: variant.id });
    if (variant.inheritsFrom && !project.componentVariants.some((item) => item.id === variant.inheritsFrom)) findings.push({ id: `orphan-variant-parent-${variant.id}`, severity: "blocking", mode: "Todos", platform: "Todas", area: variant.name, cause: "La variante hereda de una variante que ya no existe.", action: "Elegir una variante padre compatible o materializar la herencia.", section: "semantics", target: variant.id });
  }
  for (const token of project.componentTokens) {
    const component = componentById(project, token.componentId);
    const variant = project.componentVariants.find((item) => item.id === token.variantId);
    if (!component || !variant) findings.push({ id: `orphan-component-token-${token.id}`, severity: "blocking", mode: "Todos", platform: "Todas", area: component?.name || "Token de componente", cause: `${token.key} conserva una referencia pendiente a ${!component ? "un componente" : "una variante"} eliminado.`, action: "Reasignar el token desde el editor jerárquico.", section: "semantics", target: token.key });
    else if (!componentReferenceExists(project, token)) findings.push({ id: `component-${token.id}`, severity: "blocking", mode: "Todos", platform: "Todas", area: component.name, cause: `${componentTokenPath(project, token)} no puede resolver ${token.reference}.`, action: "Conectar el token a un semántico o primitivo válido.", section: "semantics", target: token.key });
  }
  for (const theme of project.themes) for (const platform of enabledPlatforms) {
    const snapshot = resolveProjectTokens(project, theme.id, platform);
    if (!snapshot.ready) continue;
    const pairs = [
      ["Texto / superficie", snapshot.semantic["text-primary"], snapshot.semantic["surface-default"], "text-primary"],
      ["Botón primario", snapshot.semantic["text-on-action"], snapshot.component.buttonPrimary, "button.primary.background"],
      ["Acción destructiva", snapshot.semantic["text-on-action"], snapshot.component.buttonDestructive, "button.destructive.background"],
    ];
    for (const [area, foreground, background, target] of pairs) {
      const ratio = contrastRatio(foreground, background);
      if (ratio < 4.5) findings.push({ id: `contrast-${theme.id}-${platform}-${area}`, severity: ratio < 3 ? "blocking" : "warning", mode: theme.name, platform: project.platforms[platform].name, platformId: platform, area, cause: `Contraste ${ratio.toFixed(2)}:1; el objetivo es 4.5:1.`, action: "Ajustar el tono semántico de texto o superficie.", section: "semantics", target });
    }
  }
  for (const platform of enabledPlatforms) if (project.platforms[platform].proposalPending) findings.push({ id: `platform-${platform}`, severity: "warning", mode: "Todos", platform: project.platforms[platform].name, platformId: platform, area: "Layout", cause: "La propuesta heredada todavía no fue revisada.", action: `Revisar la grilla de ${project.platforms[platform].name} y confirmar explícitamente la validación.`, section: "scales" });
  if ((project.implementationProfile.ios || project.implementationProfile.android) && semanticById(project, "surface-overlay") && !semanticById(project, "surface-overlay")!.defaultRef.includes("@")) findings.push({ id: "native-overlay-alpha", severity: "recommendation", mode: "Todos", platform: "iOS / Android", area: "Composición", cause: "El overlay no incorpora alpha en el color semántico.", action: "Evaluar alpha incorporado para composición más predecible.", section: "semantics", target: "surface-overlay" });
  const counts = { blocking: findings.filter((item) => item.severity === "blocking").length, warning: findings.filter((item) => item.severity === "warning").length, recommendation: findings.filter((item) => item.severity === "recommendation").length };
  const score = Math.max(0, 100 - counts.blocking * 18 - counts.warning * 5 - counts.recommendation * 2);
  const coverage = Math.round(requiredSemanticIds.filter((id) => semanticById(project, id)).length / requiredSemanticIds.length * 100);
  return { status: counts.blocking ? "needs-attention" as const : "ready" as const, score, coverage, findings, counts, metrics, summary: counts.blocking ? "Requiere correcciones" : counts.warning ? "Base válida con revisiones" : "Sistema validado" };
}
