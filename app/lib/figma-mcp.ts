import { analyzeProject } from "./health";
import { DesignSystemProject, PlatformId, platformOrder, resolveComponent, resolveLayout, resolveResponsiveScale, resolveScaleToken, resolveSemantic } from "./model";

export type FigmaMcpCategory = "colors" | "typography" | "scales" | "semantics" | "components" | "themes" | "platforms";
export type FigmaConflictPolicy = "review" | "update-by-name" | "skip-existing";
export type FigmaMcpExportOptions = {
  categories: FigmaMcpCategory[];
  targetFileUrl?: string;
  conflictPolicy: FigmaConflictPolicy;
  dryRun: boolean;
};

type FigmaVariableType = "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
type ManifestValue = { kind: "literal"; value: string | number | boolean; source?: string; unit?: string } | { kind: "alias"; target: string; source: string } | { kind: "missing"; source: string };
type ManifestMode = { key: string; name: string; themeId?: string; platformId?: PlatformId };
type VariableExposure = "internal" | "contextual";
type ManifestVariable = { key: string; name: string; type: FigmaVariableType; description: string; scopes: string[]; exposure: VariableExposure; hiddenFromPublishing: boolean; valuesByMode: Record<string, ManifestValue> };
type ManifestCollection = { key: string; name: string; strategy: "variables" | "reference"; modes: ManifestMode[]; variables: ManifestVariable[] };

const officialSources = {
  figmaWrite: "https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/",
  figmaTools: "https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/",
  figmaSkills: "https://developers.figma.com/docs/figma-mcp-server/create-skills/",
  chatgptMcp: "https://help.openai.com/en/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta",
};

const slug = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "token";
const pathName = (value: string) => value.split(/[./]/).filter(Boolean).map((part) => part.trim()).join("/");
const enabledPlatforms = (project: DesignSystemProject) => platformOrder.filter((id) => project.platforms[id].enabled);
const selected = (options: FigmaMcpExportOptions, category: FigmaMcpCategory) => options.categories.includes(category);
const uniqueScopes = (...groups: string[][]) => [...new Set(groups.flat())];

const semanticScopes = (id: string, category: string) => {
  if (category === "Texto" || id === "disabled-content") return ["TEXT_FILL"];
  if (category === "Borde" || id === "selected-border") return ["STROKE_COLOR"];
  if (category === "Foco") return ["STROKE_COLOR", "EFFECT_COLOR"];
  if (category === "Feedback") return ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
  return ["FRAME_FILL", "SHAPE_FILL"];
};

const primitiveNumberScopes = (reference: string) => {
  if (reference.startsWith("primitive:radii.")) return ["CORNER_RADIUS"];
  if (reference.startsWith("primitive:spacing.")) return ["GAP"];
  if (reference.startsWith("primitive:dimensions.")) return ["WIDTH_HEIGHT"];
  if (reference.startsWith("primitive:borders.")) return ["STROKE_FLOAT"];
  if (reference.startsWith("primitive:opacity.")) return ["OPACITY"];
  return [];
};

const componentColorScopes = (name: string, semanticId?: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("foreground") || normalized.startsWith("link.") || normalized === "tabs.item.selected" || normalized === "tabs.item.foreground") return ["TEXT_FILL"];
  if (normalized.includes("focus") || normalized.includes("ring")) return ["STROKE_COLOR", "EFFECT_COLOR"];
  if (normalized.includes("border") || normalized.includes("divider")) return ["STROKE_COLOR"];
  if (normalized.includes("background") || normalized.includes("hover") || normalized.includes("pressed") || normalized.includes("indicator") || normalized.includes("track") || normalized.includes("thumb")) return ["FRAME_FILL", "SHAPE_FILL"];
  return semanticId ? semanticScopes(semanticId, "") : [];
};

function parsePrimitiveValue(value: string): { type: FigmaVariableType; value: string | number; unit?: string } {
  const trimmed = value.trim();
  const numeric = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*(px|rem|em|%)?$/i);
  if (numeric) return { type: "FLOAT", value: Number(numeric[1]), unit: numeric[2]?.toLowerCase() };
  return { type: "STRING", value: trimmed };
}

function modeMatrix(project: DesignSystemProject): ManifestMode[] {
  const themes = project.themes.length ? project.themes : [{ id: "light", name: "Claro" }];
  return themes.flatMap((theme) => enabledPlatforms(project).map((platformId) => ({ key: `${slug(theme.id)}--${platformId}`, name: `${theme.name} · ${project.platforms[platformId].name}`, themeId: theme.id, platformId })));
}

function primitiveCollections(project: DesignSystemProject, options: FigmaMcpExportOptions) {
  const collections: ManifestCollection[] = [];
  const primitiveIndex = new Map<string, string>();
  if (selected(options, "colors")) {
    const variables = project.foundations.colors.flatMap((palette) => Object.keys(palette.scale).sort((a, b) => Number(a) - Number(b)).map((step) => {
      const reference = `${palette.name}.${step}`;
      const key = `primitive.color.${slug(palette.name)}.${slug(step)}`;
      primitiveIndex.set(reference, key);
      return { key, name: `Color/${pathName(palette.name)}/${step}`, type: "COLOR" as const, description: `${palette.name} · tono ${step}`, scopes: [], exposure: "internal" as const, hiddenFromPublishing: true, valuesByMode: { base: { kind: "literal" as const, value: palette.scale[step], source: reference } } };
    }));
    collections.push({ key: "primitives-color", name: "Primitives · Color", strategy: "variables", modes: [{ key: "base", name: "Base" }], variables });
  }
  if (selected(options, "scales")) {
    const variables = Object.entries(project.foundations.scales).flatMap(([group, tokens]) => tokens.map((token) => {
      const reference = `primitive:${group}.${token.name}`;
      const key = `primitive.${group}.${slug(token.name)}`;
      const parsed = parsePrimitiveValue(token.value);
      primitiveIndex.set(reference, key);
      return { key, name: `${pathName(group)}/${pathName(token.name)}`, type: parsed.type, description: `Foundation ${group}`, scopes: [], exposure: "internal" as const, hiddenFromPublishing: true, valuesByMode: { base: { kind: "literal" as const, value: parsed.value, source: reference, unit: parsed.unit } } };
    }));
    collections.push({ key: "primitives-scales", name: "Primitives · Escalas", strategy: "variables", modes: [{ key: "base", name: "Base" }], variables });
  }
  return { collections, primitiveIndex };
}

function semanticCollection(project: DesignSystemProject, options: FigmaMcpExportOptions, primitiveIndex: Map<string, string>): ManifestCollection | undefined {
  if (!selected(options, "semantics")) return;
  const modes = modeMatrix(project);
  const variables = project.semanticTokens.map((token) => ({
    key: `semantic.${token.id}`,
    name: `Semantic/${pathName(token.name)}`,
    type: "COLOR" as const,
    description: token.description,
    scopes: semanticScopes(token.id, token.category),
    exposure: "contextual" as const,
    hiddenFromPublishing: false,
    valuesByMode: Object.fromEntries(modes.map((mode) => {
      const reference = token.platformRefs[mode.platformId!] || token.themeRefs[mode.themeId!] || token.defaultRef;
      const primitiveKey = !reference.includes("@") ? primitiveIndex.get(reference) : undefined;
      const resolved = resolveSemantic(project, token.id, mode.themeId!, mode.platformId!);
      return [mode.key, primitiveKey ? { kind: "alias", target: primitiveKey, source: reference } : resolved ? { kind: "literal", value: resolved, source: reference } : { kind: "missing", source: reference }];
    })) as Record<string, ManifestValue>,
  }));
  return { key: "semantic", name: "Semantic", strategy: "variables", modes, variables };
}

function componentCollection(project: DesignSystemProject, options: FigmaMcpExportOptions, primitiveIndex: Map<string, string>): ManifestCollection | undefined {
  if (!selected(options, "components")) return;
  const modes = modeMatrix(project);
  const variables = project.componentTokens.map((token) => {
    const defaultReference = token.reference;
    const primitive = defaultReference.startsWith("primitive:") ? parsePrimitiveValue(resolveScaleToken(project, defaultReference)) : undefined;
    const type: FigmaVariableType = defaultReference.startsWith("semantic:") ? "COLOR" : primitive?.type || "STRING";
    const references = [defaultReference, ...Object.values(token.platformRefs)];
    const scopes = type === "COLOR"
      ? uniqueScopes(...references.map((reference) => componentColorScopes(token.name, reference.startsWith("semantic:") ? reference.slice(9) : undefined)))
      : type === "FLOAT" ? uniqueScopes(...references.map(primitiveNumberScopes)) : [];
    return {
      key: `component.${token.id}`,
      name: `Component/${pathName(token.component)}/${pathName(token.name)}`,
      type,
      description: token.description,
      scopes,
      exposure: "contextual" as const,
      hiddenFromPublishing: false,
      valuesByMode: Object.fromEntries(modes.map((mode) => {
        const reference = token.platformRefs[mode.platformId!] || token.reference;
        const semanticId = reference.startsWith("semantic:") ? reference.slice(9) : undefined;
        const semanticTarget = selected(options, "semantics") && semanticId && project.semanticTokens.some((item) => item.id === semanticId) ? `semantic.${semanticId}` : undefined;
        const primitiveTarget = reference.startsWith("primitive:") ? primitiveIndex.get(reference) : undefined;
        const resolved = resolveComponent(project, token.id, mode.themeId!, mode.platformId!);
        const target = semanticTarget || primitiveTarget;
        if (target) return [mode.key, { kind: "alias", target, source: reference }];
        if (!resolved) return [mode.key, { kind: "missing", source: reference }];
        const parsed = parsePrimitiveValue(resolved);
        return [mode.key, { kind: "literal", value: parsed.value, source: reference, unit: parsed.unit }];
      })) as Record<string, ManifestValue>,
    };
  });
  return { key: "component", name: "Component", strategy: "variables", modes, variables };
}

function layoutCollection(project: DesignSystemProject, options: FigmaMcpExportOptions): ManifestCollection | undefined {
  if (!selected(options, "platforms") && !selected(options, "scales")) return;
  const modes: ManifestMode[] = enabledPlatforms(project).map((platformId) => ({ key: platformId, name: project.platforms[platformId].name, platformId }));
  const fields = ["columns", "margin", "gutter", "maxWidth", "breakpoint", "baseline"] as const;
  const variables: ManifestVariable[] = fields.map((field) => ({ key: `layout.${field}`, name: `Layout/${field}`, type: "FLOAT", description: `Layout resuelto · ${field}`, scopes: field === "margin" || field === "gutter" || field === "baseline" ? ["GAP"] : field === "maxWidth" || field === "breakpoint" ? ["WIDTH_HEIGHT"] : [], exposure: "contextual", hiddenFromPublishing: false, valuesByMode: Object.fromEntries(modes.map((mode) => [mode.key, { kind: "literal", value: resolveLayout(project, mode.platformId!)[field], source: `layout.${mode.platformId}.${field}`, unit: field === "columns" ? undefined : "px" }])) }));
  variables.push({ key: "layout.baseline-enabled", name: "Layout/baselineEnabled", type: "BOOLEAN", description: "Activa la grilla de línea base", scopes: [], exposure: "contextual", hiddenFromPublishing: false, valuesByMode: Object.fromEntries(modes.map((mode) => [mode.key, { kind: "literal", value: resolveLayout(project, mode.platformId!).baselineEnabled, source: `layout.${mode.platformId}.baselineEnabled` }])) });
  for (const field of ["typography", "spacing", "dimensions"] as const) variables.push({ key: `responsive.${field}`, name: `Responsive/${field}`, type: "FLOAT", description: `Multiplicador responsivo · ${field}`, scopes: [], exposure: "contextual", hiddenFromPublishing: false, valuesByMode: Object.fromEntries(modes.map((mode) => [mode.key, { kind: "literal", value: resolveResponsiveScale(project, mode.platformId!)[field], source: `responsive.${mode.platformId}.${field}` }])) });
  return { key: "layout-responsive", name: "Layout · Responsive", strategy: "variables", modes, variables };
}

function typographyResources(project: DesignSystemProject, options: FigmaMcpExportOptions) {
  if (!selected(options, "typography")) return [];
  const typography = project.foundations.typography;
  return typography.levels.map((level) => ({ key: `typography.${slug(level.name)}`, name: `Typography/${pathName(level.name)}`, family: typography.family, source: typography.source, size: level.size, weight: level.weight, lineHeight: level.lineHeight, tracking: level.tracking, strategy: "text-style" as const }));
}

function buildManifest(project: DesignSystemProject, options: FigmaMcpExportOptions) {
  const { collections, primitiveIndex } = primitiveCollections(project, options);
  const semantic = semanticCollection(project, options, primitiveIndex);
  const components = componentCollection(project, options, primitiveIndex);
  const layout = layoutCollection(project, options);
  if (semantic) collections.push(semantic);
  if (components) collections.push(components);
  if (layout) collections.push(layout);
  return {
    schemaVersion: "1.1",
    source: { product: "Laboratorio de Sistemas de Diseño", projectId: project.id, projectName: project.meta.name, projectSchemaVersion: project.schemaVersion, projectUpdatedAt: project.meta.updatedAt },
    target: { fileUrl: options.targetFileUrl?.trim() || null, conflictPolicy: options.conflictPolicy, dryRun: options.dryRun },
    scopePolicy: {
      default: "contextual-only",
      primitives: "internal-hidden-from-supported-property-pickers",
      semantics: "role-based",
      components: "usage-based",
      allScopesAllowed: false,
      supportedByType: {
        COLOR: ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR", "EFFECT_COLOR"],
        FLOAT: ["CORNER_RADIUS", "WIDTH_HEIGHT", "GAP", "TEXT_CONTENT", "STROKE_FLOAT", "OPACITY", "EFFECT_FLOAT", "FONT_WEIGHT", "FONT_SIZE", "LINE_HEIGHT", "LETTER_SPACING", "PARAGRAPH_SPACING", "PARAGRAPH_INDENT"],
        STRING: ["TEXT_CONTENT", "FONT_FAMILY", "FONT_STYLE"],
        BOOLEAN: [],
      },
    },
    collections,
    resources: { typography: typographyResources(project, options), customFoundations: project.foundations.customFoundations },
  };
}

function validateManifest(project: DesignSystemProject, manifest: ReturnType<typeof buildManifest>) {
  const errors: { code: string; message: string; target?: string }[] = [];
  const warnings: { code: string; message: string; target?: string }[] = [];
  if (project.projectState === "blank") errors.push({ code: "PROJECT_NOT_READY", message: "El proyecto en blanco debe completar su base antes de crear variables en Figma." });
  if (!manifest.target.fileUrl) warnings.push({ code: "TARGET_REQUIRED_AT_RUNTIME", message: "El archivo objetivo debe confirmarse en el chat antes de ejecutar acciones de escritura." });
  if (manifest.target.fileUrl && !/^https:\/\/(www\.)?figma\.com\/(design|file)\//i.test(manifest.target.fileUrl)) errors.push({ code: "INVALID_FIGMA_URL", message: "La URL objetivo no parece corresponder a un archivo Figma Design." });
  const keys = new Set(manifest.collections.flatMap((collection) => collection.variables.map((variable) => variable.key)));
  const visitedKeys = new Set<string>();
  for (const collection of manifest.collections) for (const variable of collection.variables) {
    if (visitedKeys.has(variable.key)) errors.push({ code: "DUPLICATE_KEY", message: `La clave ${variable.key} está duplicada.`, target: variable.key });
    visitedKeys.add(variable.key);
    if (variable.scopes.includes("ALL_SCOPES")) errors.push({ code: "UNSCOPED_EXPOSURE", message: `${variable.key} aparece en todas las propiedades; debe declarar una intención concreta.`, target: variable.key });
    if (variable.key.startsWith("primitive.") && (variable.scopes.length || !variable.hiddenFromPublishing || variable.exposure !== "internal")) errors.push({ code: "PRIMITIVE_SCOPE_LEAK", message: `${variable.key} es primitiva y no debe aparecer en selectores de propiedades.`, target: variable.key });
    for (const value of Object.values(variable.valuesByMode)) {
      if (value.kind === "missing") errors.push({ code: "BROKEN_REFERENCE", message: `No se pudo resolver ${value.source}.`, target: variable.key });
      if (value.kind === "alias" && !keys.has(value.target)) errors.push({ code: "BROKEN_ALIAS", message: `El alias ${variable.key} apunta a ${value.target}, que no forma parte del paquete.`, target: variable.key });
    }
  }
  for (const platformId of enabledPlatforms(project)) if (project.platforms[platformId].proposalPending) warnings.push({ code: "PLATFORM_REVIEW_PENDING", message: `${project.platforms[platformId].name} todavía usa una propuesta heredada sin validar.`, target: platformId });
  if (manifest.collections.some((collection) => collection.variables.some((variable) => variable.type === "STRING"))) warnings.push({ code: "STRING_REVIEW", message: "Sombras y valores compuestos se entregan como especificaciones de texto y requieren revisión al convertirlos en estilos nativos." });
  if (project.foundations.customFoundations.length) warnings.push({ code: "CUSTOM_FOUNDATIONS", message: "Las foundations personalizadas viajan como contexto; el agente debe decidir su representación nativa antes de escribir." });
  const variableCount = manifest.collections.reduce((total, collection) => total + collection.variables.length, 0);
  return { status: errors.length ? "blocked" as const : warnings.length ? "ready-with-warnings" as const : "ready" as const, errors, warnings, counts: { collections: manifest.collections.length, variables: variableCount, typographyStyles: manifest.resources.typography.length, modes: manifest.collections.reduce((total, collection) => total + collection.modes.length, 0) } };
}

function buildExecutionPlan(project: DesignSystemProject, options: FigmaMcpExportOptions, validation: ReturnType<typeof validateManifest>) {
  const target = options.targetFileUrl?.trim() || "Solicitar y confirmar la URL del archivo Figma Design antes de escribir";
  return `# Ejecutar ${project.meta.name} en Figma con MCP

## Objetivo
Crear o actualizar variables y estilos nativos desde el manifiesto del Laboratorio. El manifiesto es la fuente de verdad; no inventes valores ni sustituyas referencias faltantes.

## Archivo objetivo
${target}

## Procedimiento obligatorio
1. Confirma el archivo objetivo y los permisos de edición. Si el cliente no expone acciones de escritura o \`use_figma\`, detente y explica la limitación.
2. Carga las skills oficiales \`figma-use\` y \`figma-generate-library\` antes de escribir. Inspecciona collections, variables y estilos existentes.
3. Presenta un dry-run con creados, actualizados, omitidos, conflictos y referencias rotas. Política de conflictos: \`${options.conflictPolicy}\`. Dry-run solicitado: \`${options.dryRun}\`.
4. Aplica en este orden: primitives → layout/typography → semantic → component. Conserva aliases cuando el manifiesto use \`kind: alias\`. Crea las primitivas con \`hiddenFromPublishing: true\` y sin scopes; aplica a semánticas y componentes exclusivamente los scopes declarados.
5. No dupliques por nombre o clave estable. Para cada conflicto, respeta la política y pide confirmación si la decisión no es reversible.
6. Valida todos los modos, aliases, scopes y valores resueltos. Nunca reemplaces scopes concretos por \`ALL_SCOPES\`. Informa creados, actualizados, omitidos y errores.

## Estado previo
- Salud del Laboratorio: ${analyzeProject(project).score ?? "sin evaluar"}
- Validación del paquete: ${validation.status}
- Errores: ${validation.errors.length}
- Advertencias: ${validation.warnings.length}

## Límites
- Este paquete no ejecuta acciones por sí mismo.
- La escritura depende del cliente MCP, el tipo de asiento y los permisos del archivo.
- No publiques bibliotecas ni elimines variables sin aprobación explícita.

## Referencias oficiales
- Figma write to canvas: ${officialSources.figmaWrite}
- Herramientas Figma MCP: ${officialSources.figmaTools}
- Skills para Figma MCP: ${officialSources.figmaSkills}
- Apps MCP y acciones de escritura en ChatGPT: ${officialSources.chatgptMcp}
`;
}

export function buildFigmaMcpPackage(project: DesignSystemProject, partial: Partial<FigmaMcpExportOptions> = {}) {
  const options: FigmaMcpExportOptions = { categories: ["colors", "typography", "scales", "semantics", "components", "themes", "platforms"], conflictPolicy: "review", dryRun: true, ...partial };
  const manifest = buildManifest(project, options);
  const validation = validateManifest(project, manifest);
  const executionPlan = buildExecutionPlan(project, options, validation);
  return {
    kind: "design-systems-lab/figma-mcp-package",
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    project: { id: project.id, name: project.meta.name, description: project.meta.description },
    compatibility: { requiredCapability: "Figma MCP write action (use_figma or equivalent)", safeFallback: "Read the manifest and stop before writing", sources: officialSources },
    manifest,
    validation,
    executionPlan,
    recommendedPrompt: `Usá el paquete adjunto para aplicar “${project.meta.name}” al archivo Figma confirmado. Primero inspeccioná el archivo y presentá el dry-run. No escribas hasta que el objetivo, los conflictos y las referencias rotas estén claros. Después aplicá primitives, semánticos y tokens de componente en ese orden y devolvé un informe verificable.`,
  };
}

export function buildFigmaMcpArtifacts(project: DesignSystemProject, options: Partial<FigmaMcpExportOptions> = {}) {
  const bundle = buildFigmaMcpPackage(project, options);
  return {
    bundle,
    manifest: JSON.stringify(bundle.manifest, null, 2),
    validation: JSON.stringify(bundle.validation, null, 2),
    executionPlan: bundle.executionPlan,
  };
}
