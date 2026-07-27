import { ComponentToken, contrastRatio, DesignSystemProject, LabSection, platformOrder, requiredSemanticIds, resolveComponent, resolvePrimitiveColor, resolveSemantic, semanticById } from "./model";

export type FindingSeverity = "critical" | "warning" | "info";
export type HealthFinding = {
  id: string;
  severity: FindingSeverity;
  mode: string;
  area: string;
  explanation: string;
  section: LabSection;
};

const componentReferenceExists = (project: DesignSystemProject, token: ComponentToken) => {
  if (token.reference.startsWith("semantic:")) return Boolean(semanticById(project, token.reference.slice(9)));
  if (token.reference.startsWith("primitive:")) {
    const [group, name] = token.reference.slice(10).split(".");
    return Boolean(project.foundations.scales[group as keyof typeof project.foundations.scales]?.some((item) => item.name === name));
  }
  return false;
};

export function analyzeProject(project: DesignSystemProject) {
  const findings: HealthFinding[] = [];
  const enabledPlatforms = platformOrder.filter((id) => project.platforms[id].enabled);

  for (const semanticId of requiredSemanticIds) {
    if (!semanticById(project, semanticId)) {
      findings.push({ id: `missing-${semanticId}`, severity: semanticId === "feedback-destructive" ? "critical" : "warning", mode: "Todos", area: "Semántica", explanation: `Falta el rol ${semanticId}. Los componentes que lo consumen no pueden representar ese estado sin inventar un valor.`, section: "semantics" });
    }
  }

  for (const token of project.semanticTokens) {
    const refs = [["base", token.defaultRef], ...Object.entries(token.themeRefs), ...Object.entries(token.platformRefs)];
    for (const [context, reference] of refs) {
      if (!resolvePrimitiveColor(project, reference)) {
        findings.push({ id: `broken-${token.id}-${context}`, severity: "critical", mode: context, area: token.name, explanation: `La referencia ${reference} no existe en foundations.`, section: "semantics" });
      }
    }
  }

  for (const token of project.componentTokens) {
    if (!componentReferenceExists(project, token)) {
      findings.push({ id: `component-${token.id}`, severity: "critical", mode: "Todos", area: token.component, explanation: `${token.name} apunta a ${token.reference}, que no puede resolverse.`, section: "semantics" });
    }
  }

  for (const theme of project.themes) {
    for (const platform of enabledPlatforms) {
      const surface = resolveSemantic(project, "surface-default", theme.id, platform);
      const text = resolveSemantic(project, "text-primary", theme.id, platform);
      const action = resolveComponent(project, "button-primary-bg", theme.id, platform) || resolveSemantic(project, "action-primary", theme.id, platform);
      const onAction = resolveSemantic(project, "text-on-action", theme.id, platform);
      const destructive = resolveSemantic(project, "feedback-destructive", theme.id, platform);
      const pairs = [
        { id: "body", label: "Texto / superficie", foreground: text, background: surface, minimum: 4.5 },
        { id: "action", label: "Botón primario", foreground: onAction, background: action, minimum: 4.5 },
        { id: "destructive", label: "Acción destructiva", foreground: onAction, background: destructive, minimum: 4.5 },
      ];
      for (const pair of pairs) {
        if (!pair.foreground || !pair.background) continue;
        const ratio = contrastRatio(pair.foreground.slice(0, 7), pair.background.slice(0, 7));
        if (ratio < pair.minimum) findings.push({ id: `contrast-${theme.id}-${platform}-${pair.id}`, severity: ratio < 3 ? "critical" : "warning", mode: `${theme.name} · ${project.platforms[platform].name}`, area: pair.label, explanation: `${ratio.toFixed(2)}:1; se esperan al menos ${pair.minimum}:1 para texto normal.`, section: "semantics" });
      }
    }
  }

  for (const platform of enabledPlatforms) {
    const config = project.platforms[platform];
    if (config.proposalPending) findings.push({ id: `platform-${platform}`, severity: "warning", mode: config.name, area: "Plataformas", explanation: "La propuesta heredada de Mobile todavía no fue revisada.", section: "scales" });
  }

  if (project.implementationProfile.ios || project.implementationProfile.android) {
    const overlay = semanticById(project, "surface-overlay");
    if (overlay && !overlay.defaultRef.includes("@")) findings.push({ id: "native-overlay-alpha", severity: "warning", mode: "iOS / Android", area: "Composición", explanation: "El overlay no incorpora alpha en el color semántico; revisá el resultado al componer capas nativas.", section: "semantics" });
  }

  const opacityRisks = project.foundations.scales.opacity.filter((token) => Number(token.value) < 1 && !/(interaction|temporary|transient|disabled)/i.test(token.name));
  if (opacityRisks.length) findings.push({ id: "container-opacity", severity: "info", mode: "Multiplataforma", area: "Opacidad", explanation: "Hay opacidades sin intención temporal explícita. En superficies estables suele ser más predecible incorporar alpha al color semántico; native también puede usar opacidad cuando corresponda.", section: "scales" });

  const penalty = findings.reduce((total, finding) => total + (finding.severity === "critical" ? 14 : finding.severity === "warning" ? 6 : 2), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const coverage = Math.round(((requiredSemanticIds.length - findings.filter((finding) => finding.id.startsWith("missing-")).length) / requiredSemanticIds.length) * 100);
  return {
    findings,
    score,
    coverage,
    counts: {
      critical: findings.filter((finding) => finding.severity === "critical").length,
      warning: findings.filter((finding) => finding.severity === "warning").length,
      info: findings.filter((finding) => finding.severity === "info").length,
    },
  };
}

