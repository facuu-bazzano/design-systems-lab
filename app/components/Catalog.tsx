"use client";

import { CSSProperties, useMemo, useState } from "react";
import { allColorReferences, DesignSystemProject, PlatformId, platformOrder, requiredSemanticIds, resolveComponent, resolveSemantic, semanticById } from "../lib/model";

type Props = {
  project: DesignSystemProject;
  onCreateSemantic: (id: string, reference: string) => void;
};

const semanticNames: Record<string, string> = {
  "feedback-destructive": "Error / destructivo",
  "focus-ring": "Foco",
  "disabled-surface": "Superficie deshabilitada",
  "disabled-content": "Contenido deshabilitado",
  "selected-surface": "Seleccionado",
};

function previewVariables(project: DesignSystemProject, themeId: string, platform: PlatformId) {
  const semantic = (id: string) => resolveSemantic(project, id, themeId, platform) || "transparent";
  const component = (id: string, fallback: string) => resolveComponent(project, id, themeId, platform) || semantic(fallback);
  return {
    "--ds-surface": semantic("surface-default"),
    "--ds-raised": semantic("surface-raised"),
    "--ds-overlay": semantic("surface-overlay"),
    "--ds-text": semantic("text-primary"),
    "--ds-muted": semantic("text-muted"),
    "--ds-on-action": semantic("text-on-action"),
    "--ds-border": component("input-border", "border-subtle"),
    "--ds-border-strong": semantic("border-strong"),
    "--ds-action": component("button-primary-bg", "action-primary"),
    "--ds-action-hover": component("button-primary-hover", "action-hover"),
    "--ds-action-pressed": component("button-primary-pressed", "action-pressed"),
    "--ds-focus": component("input-focus-border", "focus-ring"),
    "--ds-destructive": component("button-destructive-bg", "feedback-destructive"),
    "--ds-input-error": component("input-error-border", "feedback-destructive"),
    "--ds-success": semantic("feedback-success"),
    "--ds-warning": semantic("feedback-warning"),
    "--ds-disabled-surface": semantic("disabled-surface"),
    "--ds-disabled-content": semantic("disabled-content"),
    "--ds-selected": component("control-selected-bg", "selected-surface"),
    "--ds-selected-border": semantic("selected-border"),
    "--ds-card-radius": resolveComponent(project, "card-radius", themeId, platform) || "10px",
    "--ds-font": `'${project.foundations.typography.family}', system-ui, sans-serif`,
  } as CSSProperties;
}

function StateLabel({ children }: { children: React.ReactNode }) {
  return <span className="state-label">{children}</span>;
}

function CatalogFrame({ project, themeId, platform }: { project: DesignSystemProject; themeId: string; platform: PlatformId }) {
  const theme = project.themes.find((item) => item.id === themeId);
  const destructiveReady = Boolean(semanticById(project, "feedback-destructive"));
  return (
    <article className={`catalog-frame catalog-${platform} ${destructiveReady ? "" : "missing-destructive"}`} style={previewVariables(project, themeId, platform)}>
      <header className="catalog-docs-head">
        <div className="catalog-brand"><span>{project.meta.brandMark || project.meta.name.slice(0, 1)}</span><div><strong>{project.meta.name}</strong><small>Component foundations</small></div></div>
        <div className="catalog-context"><span>{theme?.name}</span><span>{project.platforms[platform].name}</span></div>
      </header>
      <div className="catalog-docs-body">
        {platform === "desktop" || platform === "tablet" ? <aside className="catalog-docs-nav"><b>Overview</b><span>Foundations</span><span className="active">Components</span><span>Patterns</span><span>Accessibility</span></aside> : null}
        <main className="catalog-components">
          <div className="catalog-intro"><span className="catalog-eyebrow">Components / Overview</span><h2>Controles comunes</h2><p>Estados conectados a los tokens del proyecto. Esta vista documenta decisiones; no edita componentes de producto.</p></div>

          <section className="component-spec">
            <div className="spec-title"><div><span>01</span><h3>Buttons</h3></div><code>button.*</code></div>
            <div className="component-demo-grid buttons-demo">
              <div><StateLabel>Default</StateLabel><button className="ds-button primary">Continuar</button></div>
              <div><StateLabel>Hover</StateLabel><button className="ds-button primary hover">Continuar</button></div>
              <div><StateLabel>Focus</StateLabel><button className="ds-button primary focus">Continuar</button></div>
              <div><StateLabel>Pressed</StateLabel><button className="ds-button primary pressed">Continuar</button></div>
              <div><StateLabel>Secondary</StateLabel><button className="ds-button secondary">Volver</button></div>
              <div><StateLabel>Destructive</StateLabel><button className="ds-button destructive">Eliminar</button></div>
              <div><StateLabel>Disabled</StateLabel><button className="ds-button disabled" disabled>Continuar</button></div>
            </div>
          </section>

          <section className="component-spec">
            <div className="spec-title"><div><span>02</span><h3>Fields</h3></div><code>input.*</code></div>
            <div className="component-demo-grid fields-demo">
              <label className="ds-field"><StateLabel>Default</StateLabel><span>Nombre</span><input readOnly value="Ada Lovelace" /><small>Usá tu nombre completo.</small></label>
              <label className="ds-field focus"><StateLabel>Focus</StateLabel><span>Nombre</span><input readOnly value="Ada Lovelace" /><small>El foco usa focus.ring.</small></label>
              <label className="ds-field error"><StateLabel>Error</StateLabel><span>Email</span><input readOnly value="ada@" /><small>Ingresá un email válido.</small></label>
              <label className="ds-field disabled"><StateLabel>Disabled</StateLabel><span>Organización</span><input readOnly disabled value="Analytical Engine" /><small>No disponible en este plan.</small></label>
              <label className="ds-field"><StateLabel>Select</StateLabel><span>Equipo</span><select defaultValue="Producto"><option>Producto</option><option>Diseño</option></select><small>Seleccioná un equipo.</small></label>
            </div>
          </section>

          <section className="component-spec">
            <div className="spec-title"><div><span>03</span><h3>Selection controls</h3></div><code>control.selected.*</code></div>
            <div className="selection-demo">
              <div><StateLabel>Checkbox</StateLabel><span className="control-line"><i className="ds-checkbox selected">✓</i>Seleccionado</span><span className="control-line"><i className="ds-checkbox"></i>Default</span><span className="control-line disabled"><i className="ds-checkbox"></i>Disabled</span></div>
              <div><StateLabel>Radio</StateLabel><span className="control-line"><i className="ds-radio selected"></i>Seleccionado</span><span className="control-line"><i className="ds-radio"></i>Default</span></div>
              <div><StateLabel>Switch</StateLabel><span className="control-line"><i className="ds-switch selected"><b></b></i>Activo</span><span className="control-line"><i className="ds-switch"><b></b></i>Inactivo</span><span className="control-line disabled"><i className="ds-switch"><b></b></i>Disabled</span></div>
            </div>
          </section>

          <section className="component-spec">
            <div className="spec-title"><div><span>04</span><h3>Badges & feedback</h3></div><code>feedback.*</code></div>
            <div className="badge-row"><span className="ds-badge">Neutral</span><span className="ds-badge selected">Selected</span><span className="ds-badge success">Success</span><span className="ds-badge warning">Warning</span><span className="ds-badge destructive">Error</span></div>
            <div className="alert-stack"><div className="ds-alert info"><b>Información</b><span>El sistema fue actualizado con tus últimos cambios.</span></div><div className="ds-alert warning"><b>Revisión pendiente</b><span>Comprobá el contraste antes de exportar.</span></div><div className="ds-alert destructive"><b>No se pudo guardar</b><span>Revisá los campos marcados como error.</span></div></div>
          </section>

          <section className="token-map-panel">
            <div><span className="map-dot action"></span><code>action.primary</code><small>→ button.primary.background</small></div>
            <div><span className="map-dot focus"></span><code>focus.ring</code><small>→ input.focus.border</small></div>
            <div><span className="map-dot destructive"></span><code>feedback.destructive</code><small>→ input.error + button.destructive</small></div>
            <div><span className="map-dot selected"></span><code>selected.surface</code><small>→ control.selected.background</small></div>
          </section>
        </main>
      </div>
    </article>
  );
}

export function Catalog({ project, onCreateSemantic }: Props) {
  const enabledPlatforms = platformOrder.filter((id) => project.platforms[id].enabled);
  const [activeTheme, setActiveTheme] = useState(project.themes[0]?.id || "light");
  const [activePlatform, setActivePlatform] = useState<PlatformId>(enabledPlatforms[0] || "mobile");
  const [compareThemes, setCompareThemes] = useState(false);
  const [comparePlatforms, setComparePlatforms] = useState(false);
  const [missingRef, setMissingRef] = useState("");
  const missingRequired = useMemo(() => requiredSemanticIds.filter((id) => !semanticById(project, id)), [project]);
  const themeIds = compareThemes ? project.themes.map((theme) => theme.id) : [activeTheme];
  const platformIds = comparePlatforms ? enabledPlatforms : [activePlatform];
  const missingId = missingRequired[0];

  return (
    <div className="catalog-view">
      <header className="view-header">
        <div><span className="section-kicker">Documentación viva</span><h1>Catálogo de componentes</h1><p>Compará estados, modos y plataformas con los tokens reales del proyecto. El catálogo es una herramienta de evaluación previa a Figma.</p></div>
        <div className="catalog-legend"><span><i className="legend-semantic"></i>Semántico</span><span><i className="legend-component"></i>Componente</span></div>
      </header>

      {missingId ? <div className="mapping-alert">
        <div className="mapping-alert-icon">!</div><div><strong>Falta el token {semanticNames[missingId] || missingId}</strong><p>Los estados dependientes quedan neutrales y señalados. Elegí una foundation existente para crear el rol; el preview nunca agrega un rojo u otro valor por su cuenta.</p></div>
        <select aria-label="Foundation para token faltante" value={missingRef} onChange={(event) => setMissingRef(event.target.value)}><option value="">Elegir foundation…</option>{allColorReferences(project).map((reference) => <option key={reference}>{reference}</option>)}</select>
        <button className="primary-action" disabled={!missingRef} onClick={() => { onCreateSemantic(missingId, missingRef); setMissingRef(""); }}>Crear y asignar</button>
      </div> : null}

      <div className="catalog-controls">
        <div className="control-group"><span>Modo</span><div className="segmented-control">{project.themes.map((theme) => <button key={theme.id} className={activeTheme === theme.id ? "active" : ""} onClick={() => setActiveTheme(theme.id)}>{theme.name}</button>)}</div><label className="compare-toggle"><input type="checkbox" checked={compareThemes} onChange={(event) => setCompareThemes(event.target.checked)} /> Comparar</label></div>
        <div className="control-group"><span>Plataforma</span><div className="segmented-control">{enabledPlatforms.map((platform) => <button key={platform} className={activePlatform === platform ? "active" : ""} onClick={() => setActivePlatform(platform)}>{project.platforms[platform].name}</button>)}</div><label className="compare-toggle"><input type="checkbox" checked={comparePlatforms} onChange={(event) => setComparePlatforms(event.target.checked)} /> Comparar</label></div>
      </div>

      <div className={`catalog-frame-grid ${compareThemes || comparePlatforms ? "comparing" : ""}`}>{themeIds.flatMap((themeId) => platformIds.map((platform) => <CatalogFrame key={`${themeId}-${platform}`} project={project} themeId={themeId} platform={platform} />))}</div>
    </div>
  );
}

