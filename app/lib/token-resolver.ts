import type { CSSProperties } from "react";
import { DesignSystemProject, PlatformId, primaryTypographyFamily, requiredSemanticIds, resolveComponent, resolveSemantic, typographyFamilyForLevel, typographyLevelForRole } from "./model";

export type ResolvedProjectTokens = {
  ready: boolean;
  status: "ready" | "pending";
  themeId: string;
  platform: PlatformId;
  missing: string[];
  semantic: Record<string, string>;
  component: Record<string, string>;
  cssVariables: CSSProperties;
};

const componentMap = {
  buttonPrimary: "button-primary-bg",
  buttonHover: "button-primary-hover",
  buttonPressed: "button-primary-pressed",
  buttonDestructive: "button-destructive-bg",
  inputBorder: "input-border",
  inputFocus: "input-focus-border",
  inputError: "input-error-border",
  selectedBackground: "control-selected-bg",
  cardRadius: "card-radius",
  controlRadius: "control-radius",
  cardShadow: "card-shadow",
} as const;

export function resolveProjectTokens(project: DesignSystemProject, themeId: string, platform: PlatformId): ResolvedProjectTokens {
  const semantic = Object.fromEntries(requiredSemanticIds.map((id) => [id, resolveSemantic(project, id, themeId, platform)]));
  const component = Object.fromEntries(Object.entries(componentMap).map(([key, id]) => [key, resolveComponent(project, id, themeId, platform)]));
  const missing = [
    ...requiredSemanticIds.filter((id) => !semantic[id]).map((id) => `semantic:${id}`),
    ...Object.entries(componentMap).filter(([key]) => !component[key]).map(([, id]) => `component:${id}`),
  ];
  const typography = project.foundations.typography;
  const primaryFamily = primaryTypographyFamily(typography)?.family || "system-ui";
  const roleFamily = (role: "caption" | "body" | "label" | "heading" | "display") => {
    const level = typographyLevelForRole(typography, role);
    return level ? typographyFamilyForLevel(typography, level)?.family || primaryFamily : primaryFamily;
  };
  const familyStack = (family: string) => `'${family.replaceAll("'", "\\'")}', system-ui, sans-serif`;
  const cssVariables = {
    "--ds-surface": semantic["surface-default"],
    "--ds-surface-raised": semantic["surface-raised"],
    "--ds-overlay": semantic["surface-overlay"],
    "--ds-text": semantic["text-primary"],
    "--ds-text-muted": semantic["text-muted"],
    "--ds-on-action": semantic["text-on-action"],
    "--ds-border": semantic["border-subtle"],
    "--ds-border-strong": semantic["border-strong"],
    "--ds-action": component.buttonPrimary,
    "--ds-action-hover": component.buttonHover,
    "--ds-action-pressed": component.buttonPressed,
    "--ds-focus": semantic["focus-ring"],
    "--ds-success": semantic["feedback-success"],
    "--ds-warning": semantic["feedback-warning"],
    "--ds-destructive": component.buttonDestructive,
    "--ds-disabled-surface": semantic["disabled-surface"],
    "--ds-disabled-content": semantic["disabled-content"],
    "--ds-selected-surface": component.selectedBackground,
    "--ds-selected-border": semantic["selected-border"],
    "--ds-input-border": component.inputBorder,
    "--ds-input-focus": component.inputFocus,
    "--ds-input-error": component.inputError,
    "--ds-card-radius": component.cardRadius,
    "--ds-control-radius": component.controlRadius,
    "--ds-card-shadow": component.cardShadow,
    "--ds-font": familyStack(primaryFamily),
    "--ds-font-caption": familyStack(roleFamily("caption")),
    "--ds-font-body": familyStack(roleFamily("body")),
    "--ds-font-label": familyStack(roleFamily("label")),
    "--ds-font-heading": familyStack(roleFamily("heading")),
    "--ds-font-display": familyStack(roleFamily("display")),
  } as CSSProperties;
  return { ready: missing.length === 0 && project.projectState !== "blank", status: missing.length === 0 && project.projectState !== "blank" ? "ready" : "pending", themeId, platform, missing, semantic, component, cssVariables };
}

export function resolvedTokenCss(snapshot: ResolvedProjectTokens) {
  return Object.entries(snapshot.cssVariables).filter(([, value]) => value).map(([name, value]) => `${name}:${value}`).join(";");
}
