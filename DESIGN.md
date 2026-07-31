---
name: Laboratorio de Sistemas de Diseno
description: Operational design-system laboratory for configuring, validating, and documenting tokens before Figma handoff.
colors:
  zinc-0: "#FAFAFA"
  zinc-1: "#FFFFFF"
  zinc-2: "#F4F4F5"
  zinc-3: "#E4E4E7"
  zinc-4: "#D4D4D8"
  zinc-5: "#A1A1AA"
  zinc-6: "#71717A"
  zinc-7: "#52525B"
  zinc-9: "#18181B"
  accent: "#4F46E5"
  success: "#047857"
  warning: "#B45309"
  danger: "#BE123C"
typography:
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontWeight: 700
    lineHeight: 1.3
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.zinc-1}"
    rounded: "{rounded.md}"
    height: "42px"
  card:
    backgroundColor: "{colors.zinc-1}"
    textColor: "{colors.zinc-9}"
    rounded: "{rounded.xl}"
---

# Design System: Laboratorio de Sistemas de Diseno

## Overview

The Lab is an operational product interface, not a marketing surface. The design should feel quiet, durable, and work-focused: enough hierarchy to scan quickly, enough restraint that the user's design-system previews remain the subject.

The incumbent visual system uses a Zinc-like neutral foundation, compact but readable typography, restrained borders, modest radius, and a single action accent. Light and dark modes are internal Lab themes only; they must not alter the user's project tokens, previews, or exports.

Key characteristics:

- Task-first navigation and controls.
- High legibility for forms, tables, inspectors, and long pages.
- Clear separation between Lab UI tokens and project/design-system tokens.
- Minimal decorative UI.
- Direct action labels and factual status indicators.

## Colors

The Lab uses a neutral Zinc-style shell with a purple/indigo action accent and separate success, warning, and destructive states.

### Primary

- **Action Indigo** (`#4F46E5`): primary commands, active navigation, focus-related accenting, and high-priority action states. Use sparingly; the accent should identify action, not decorate sections.

### Neutral

- **Zinc Canvas** (`#FAFAFA` / `#09090B` in dark): application background.
- **Zinc Panel** (`#FFFFFF` / `#18181B` in dark): cards, controls, menus, and stable surfaces.
- **Zinc Border** (`#E4E4E7` / `#3F3F46` in dark): dividers, control outlines, table boundaries, and section separation.
- **Zinc Text** (`#18181B` / `#FAFAFA` in dark): primary Lab text.
- **Zinc Muted** (`#71717A` / `#A1A1AA` in dark): secondary Lab descriptions and metadata.

### Feedback

- **Success Green**: factual positive status and valid readiness.
- **Warning Amber**: pending review, inherited proposals, incomplete coverage.
- **Danger Rose**: destructive actions and errors that require caution.

### Named Rules

**The Separation Rule.** Lab UI colors never define the user's system tokens. Project previews must resolve from the active project model.

**The No Decorative Badge Rule.** Do not add badges or tags unless they communicate a factual state that affects user action.

## Typography

**Display Font:** Inter/system sans stack.
**Body Font:** Inter/system sans stack.
**Label/Mono Font:** system mono only for token identifiers and resolved values.

The Lab typography should be utilitarian and readable. Avoid tiny metadata as primary information. Reserve small type for secondary hints, counts, and token codes only.

The typography configured by the user is a separate project foundation. A project may contain multiple named families, one explicit primary family, and a family assignment on every type style. Adding a family must never replace existing assignments; regenerating the modular scale preserves assignments by role. A family in use cannot be removed until its styles are reassigned. The product does not impose a hard family limit, but Health recommends reviewing projects above three families because visual voice and font-loading cost can become fragmented.

Project previews resolve typography through shared role variables (`--ds-font-caption`, `--ds-font-body`, `--ds-font-label`, `--ds-font-heading`, and `--ds-font-display`). Catalog, Health scenarios, static documentation, and export formats must consume the same assignments instead of inventing local font choices. Fonts used inside project previews are not part of the Lab's internal Inter identity.

### Hierarchy

- **Page title**: strong, compact, used once per main page.
- **Section heading**: consistent via `SectionHeading`; no redundant decorative subtitles above the actual title.
- **Body**: readable 15px default; forms and tables should not drop below practical scan size.
- **Label**: semibold, clear, and close to the related control.
- **Code/token text**: mono, secondary, never the primary label when a human-readable role exists.

## Layout

The app uses a sticky header, persistent left navigation on desktop, and a constrained main content area. Equivalent pages should use shared spacing rhythms rather than local one-off gaps.

Long operational pages should provide local navigation when useful, but the local navigation must remain reachable while scrolling. Tables and inspectors should avoid horizontal page overflow; if horizontal scrolling is unavoidable, confine it to the table container.

Mobile layouts should preserve task completion. Do not hide core actions or make navigation duplicate itself.

## Elevation & Depth

Depth is understated. The interface primarily uses background, border, and spacing to separate areas. Shadows are allowed for menus, popovers, and overlays where depth is functional.

### Shadow Vocabulary

- **Panel shadow**: subtle only, for menu/popover separation.
- **No decorative glow**: avoid glow effects and heavy dark-mode neon treatments.

## Shapes

The system uses modest rounded corners, generally 8-12px for Lab surfaces and controls. Icon/logo assets may use their own rounded silhouette.

Cards should not be nested inside cards unless the inner element is a genuine repeated item or framed control. Sections should not become floating decorative cards purely for composition.

## Components

### Buttons

- **Shape:** modest radius, stable height.
- **Primary:** high contrast action accent; hover must preserve text contrast in both Lab themes.
- **On-accent content:** text, icons, checkbox indicators, and split-button separators must resolve through the shared `--ui-on-accent` and `--ui-accent-separator` tokens. Do not assume white content is legible on every accent used by each Lab theme.
- **Secondary:** neutral surface with border; should not compete with primary export/project actions.
- **Ghost:** use for contextual actions embedded in stable chrome, including the project-name trigger. The resting state has no border; hover, pressed, and focus communicate interactivity without competing with Exportar.
- **Danger:** use neutral trigger for low-frequency destructive affordances, escalating to a filled destructive action only at confirmation.

### Cards / Containers

- **Background:** neutral Lab panel or project-resolved surface, depending on context.
- **Border:** used for structure and scanability.
- **Padding:** enough separation between headings, descriptions, and controls; cramped cards are defects.

### Inputs / Fields

- **Style:** shared internal Input/Textarea/Select/Combobox components.
- **Focus:** visible focus treatment, consistent across primitives.
- **Error / Disabled:** state must be visibly distinct and still readable.

### Navigation

Global navigation is: Color, Tipografia, Escalas y layout, Tokens semanticos, Tokens de componente, Catalogo, Escenarios, Salud del sistema. Project configuration opens from the project-name ghost action in the header and must not be duplicated in the sidebar. Exportar remains a header action, not a sidebar destination.

### Dialogs, Menus, and Overlays

- Project configuration and export configuration use the shared `Dialog` primitive. It owns focus trapping, initial focus, Escape, backdrop dismissal, background scroll lock, and focus restoration.
- The dialog header is stable while only the body scrolls. Nested Select, Combobox, Tooltip, and Menu portals render inside the active dialog so their content remains visible and interactive.
- Header dropdown menus are non-modal: opening them must not block page scrolling. A menu is not a dialog and must not inherit dialog scroll-lock behavior.
- Modal/drawer entry uses only opacity and transform with shared motion tokens. Never use `transition: all`; reduced-motion keeps immediate, visible state feedback.

### Figma Variable Scopes

- Primitive variables are implementation details: export them with `scopes: []`, mark them internal, and hide them from publishing/property pickers.
- Semantic variables expose only role-relevant scopes. Component variables expose only the concrete properties consumed by that component decision.
- Never use `ALL_SCOPES` as a convenience fallback.
- Supported color scopes are `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL`, `STROKE_COLOR`, and `EFFECT_COLOR`.
- Supported number scopes are `CORNER_RADIUS`, `WIDTH_HEIGHT`, `GAP`, `TEXT_CONTENT`, `STROKE_FLOAT`, `OPACITY`, `EFFECT_FLOAT`, `FONT_WEIGHT`, `FONT_SIZE`, `LINE_HEIGHT`, `LETTER_SPACING`, `PARAGRAPH_SPACING`, and `PARAGRAPH_INDENT`.
- Supported string scopes are `TEXT_CONTENT`, `FONT_FAMILY`, and `FONT_STYLE`.
- Primitive font-family variables are internal foundations with `scopes: []`. Role variables for exported type styles expose `FONT_FAMILY`, `FONT_SIZE`, `FONT_WEIGHT`, `LINE_HEIGHT`, and `LETTER_SPACING` only; they never opt into every supported property.

### Component Catalog

Catalog previews must use project-resolved variables. The catalog is both playground and documentation. Each component card should show state matrices and token inspection without hiding important token chains behind optional menus.

### Focused Foundation Previews

Color, Tipografia, and Escalas y layout each include a compact live preview beside their configuration work. These previews isolate the decision being edited while still resolving the real project mode and platform. They must consume the shared resolver for semantic color roles, named type roles, responsive scale multipliers, spacing, dimensions, columns, margins, gutters, maximum width, and baseline grid. They are diagnostic aids, not separate mock implementations.

### Scenario Suite

Escenarios is the system-level visual evidence workspace. It combines the real project foundations and tokens in three realistic flows whose registry covers every catalog component. Mobile, Tablet, and Desktop must use genuinely different information structures; resizing one generic mock is not an acceptable platform comparison. Mode comparison must render each project mode on the same selected platform.

Device previews are bounded frames, never long page screenshots. Their application chrome remains stable while the central content area scrolls independently. Mobile may present the three flows together; Tablet and Desktop use a selected flow because their frames need more room. Only platforms enabled by the project are shown. Every frame exposes its available color modes beside the platform label and may offer clearly identified local scale simulations; simulations never mutate or masquerade as exported project modes.

Catalog and Escenarios share one canonical component-preview renderer. Scenario modules may compose those primitives, but may not restyle or fork their semantic states. Missing required references remain an actionable pending state instead of receiving invented colors. Health links to the exact scenario evidence affected by a finding; it does not duplicate a miniature product mock.

### Experimental UI quality gate

Changes to the experimental interface are not complete when they merely compile. Before handoff, run the applicable Impeccable playbook and the smallest relevant UI Skill, then verify the real surface in light/dark, supported viewport widths, keyboard operation, internal scrolling, overflow, and Storybook. Record any check that could not be run instead of claiming it passed. A user-reported instance of a systemic component or spacing problem requires auditing every equivalent instance, not only the reported selector.

### Health View

Health is for system coherence and prioritization. Every finding must point to a real correction target or its exact visual evidence in Escenarios. Avoid dead-end "Corregir" actions and do not embed a competing scenario renderer inside Health.

## Do's and Don'ts

- **Do** preserve the existing navigation and internal component system unless the user explicitly approves a change.
- **Do** treat legibility, alignment, spacing, state clarity, and contrast as acceptance criteria.
- **Do** keep Storybook aligned with internal components when UI primitives change.
- **Don't** introduce broad redesigns, marketing hero sections, decorative badges, or visual flourishes that do not improve task completion.
- **Don't** replace Radix-backed controls with unstyled native controls or one-off local variants.
- **Don't** hardcode project preview colors for semantic states; missing tokens must remain actionable pending configuration.
