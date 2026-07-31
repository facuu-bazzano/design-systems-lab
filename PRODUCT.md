# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are product designers, design system designers, UI designers, and frontend/design-system collaborators who need to explore the base of a design system before producing components and screens manually in Figma.

Secondary users may include developers reviewing token structure, contrast, export formats, and implementation-readiness before a handoff.

## Product Purpose

Laboratorio de Sistemas de Diseno is a public proof-of-concept web application for configuring, validating, previewing, documenting, importing, and exporting the foundations of a design system before manual Figma work.

It is not a replacement for Figma, not a product screen editor, and not a collaborative approval system. Its output is a flexible blueprint: the designer decides what to keep, adjust, export, or discard before moving into Figma.

Success means a user can establish a coherent token base, inspect component behavior, understand system health, and export usable project/tokens/documentation artifacts without account setup or backend dependency.

## Positioning

The product separates three layers that are often mixed too early: primitive foundations, semantic tokens, and component tokens. It lets designers evaluate those decisions through live previews and catalog/system-health views before committing labor in Figma.

Its useful mechanism is not visual page editing; it is controlled design-system decision-making with immediate feedback.

## Operating Context

The app runs publicly from GitHub Pages at `https://facuu-bazzano.github.io/design-systems-lab/`.

Project data persists locally in the browser and can be exported/imported as an editable project file. The app also exports selectable token subsets and static HTML documentation.

The intended workflow is:

1. Choose either a validated starter system or a blank project.
2. Define project identity and active platforms.
3. Configure foundations, semantics, and component tokens.
4. Evaluate individual behavior in the component catalog, combined behavior across modes and platforms in Escenarios, and prioritization in system health.
5. Export project files, token artifacts, or documentation for further manual work.

## Capabilities and Constraints

- Keep the central data model serializable.
- Preserve import/export compatibility.
- Preserve GitHub Pages compatibility under `/design-systems-lab/`.
- Keep the app usable without accounts, collaboration, approval history, backend services, or direct Figma synchronization.
- Keep the internal lab theme separate from the user's design-system tokens and previews.
- Use the existing internal component library and Radix primitives selectively; do not replace the UI with a third-party visual framework without explicit approval.
- Do not make large navigation changes, redesigns, or component substitutions without explicit user approval.
- Treat published Storybook as QA/documentation for the internal component library, not as the product itself.
- Keep focused foundation previews, Catalog, Escenarios, and Health on the same token-resolution path; they are different levels of inspection, not independent mock implementations.

Open decision: Impeccable findings should be reviewed by the user before any design changes are implemented.

## Brand Commitments

The product name is `Laboratorio de Sistemas de Diseno`.

Current brand asset: PNG laboratory mark variants under `public/brand/`:

- `logo-for-light-mode.png`: dark logo/background for the Lab's light mode.
- `logo-for-dark-mode.png`: light logo/background for the Lab's dark mode.

The visual identity should remain restrained, operational, and tool-focused. Avoid decorative marketing UI, invented claims, or expressive redesigns that compete with the user's design-system previews.

## Evidence on Hand

- Existing application source in `app/`.
- Internal UI component library in `app/components/ui/LabUI.tsx`.
- Component catalog in `app/components/Catalog.tsx`.
- Health view in `app/components/HealthView.tsx`.
- Central model and token resolution in `app/lib/model.ts` and `app/lib/token-resolver.ts`.
- Export logic in `app/lib/exporters.ts`.
- Storybook stories in `app/components/ui/LabUI.stories.tsx`.
- Public deployment already active on GitHub Pages.

No customer testimonials, usage metrics, paid plans, external integrations, or Figma-sync claims are available. Future work must not fabricate them.

## Product Principles

- Preserve operational clarity over visual novelty.
- Keep foundations, semantic roles, and component decisions explicit and traceable.
- Prefer reusable internal components over local one-off CSS fixes.
- Show pending configuration states clearly instead of masking missing tokens with invented fallback colors.
- Validate changes before publishing, especially visual changes across light/dark and desktop/mobile.

## Accessibility & Inclusion

The interface must remain legible without zoom, keyboard-accessible where controls are interactive, and contrast-aware in both the Lab UI and project previews. Accessibility issues reported by health checks or visual QA should be treated as product-quality issues, not cosmetic polish.
