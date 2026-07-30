# UI Skills Root — implementación y auditoría final

Rama: `experiment/impeccable`

Fecha: 2026-07-30

## Instalación mínima

- Fuente: [`ibelick/ui-skills`](https://github.com/ibelick/ui-skills).
- Commit de origen revisado: `3ebd1725ca6835f281188141e21b6874a21f7b32`.
- Versión del paquete: `0.2.4`.
- Router instalado: `ui-skills-root`, metadata `1.0.0`.
- Comando de instalación local: `pnpm dlx skills add ibelick/ui-skills --skill ui-skills-root --agent codex --yes --copy`.
- Ubicación: `.agents/skills/ui-skills-root/SKILL.md`.
- Lock: `skills-lock.json`, sin referencias a las siete skills `better-*` retiradas.

No se instaló el catálogo de 185 skills ni ninguna skill adicional. El router seleccionó la categoría `accessibility` y se cargó únicamente la guía `fixing-accessibility` mediante:

```text
pnpm dlx ui-skills categories
pnpm dlx ui-skills list --category accessibility
pnpm dlx ui-skills get fixing-accessibility
```

## Resultado de la pasada

La guía se aplicó con cambios mínimos sobre componentes compartidos y sin rediseñar identidad, navegación ni layout:

1. Exportación usa un diálogo modal nativo canónico con foco contenido, Escape y restauración.
2. Importación diferencia anuncios de éxito y errores persistentes recuperables.
3. Navegación SPA expone la sección actual, skip link, título y foco posterior a interacción.
4. Salud conserva un único landmark `main` y etiqueta escenarios como artículos.
5. El selector tipográfico implementa combobox/listbox buscable con teclado APG.
6. Input/Textarea y sus previews conectan errores y ayudas por ID.
7. Los controles editables usan 16 px en viewport táctil para evitar autozoom iOS.
8. Las métricas de Salud solo navegan cuando existen elementos afectados.

## Verificación

- TypeScript: aprobado con `tsc --noEmit`.
- ESLint del producto (`app`, `tests`, `scripts`): aprobado sin errores ni warnings.
- Pruebas: 27/27 aprobadas; ocho regresiones específicas nuevas en `tests/accessibility-regressions.test.mjs`.
- Next Pages: compilación y exportación estática aprobadas.
- Storybook 10.5.4: build aprobado; solo avisos no bloqueantes de tamaño de chunks/plugin timing.
- Servidor local: HTTP 200 en `http://localhost:3011/` durante la comprobación.
- Temas/viewport: la estructura y CSS se verificaron para claro/oscuro y breakpoint móvil; esta sesión no expuso un navegador controlable, por lo que no se adjuntan capturas ni se afirma una prueba visual automatizada que no ocurrió.

Reproducción visual local:

```text
pnpm dev -- --port 3011
pnpm storybook
```

Recorrido recomendado: sistema validado → Exportar (Tab, Shift+Tab, Escape y foco restaurado) → Proyecto/Importar con JSON válido e inválido → Tipografía con flechas/Enter/Escape → Salud 100/100 y con plataforma pendiente → Catálogo Input/Textarea → alternar tema y repetir a 390 × 844.

## Auditoría residual

La revisión final de `fixing-accessibility` no encontró residuos de los ocho hallazgos dentro de la evidencia automatizable. Impeccable `detect app` informó tres warnings, todos ya descartados explícitamente por alcance:

| Regla | Ubicación | Clasificación final |
|---|---|---|
| `side-tab` | `app/globals.css`, chevron CSS de `.color-library-group > summary:before` | **No aplicar**: es un chevron funcional, no una franja decorativa. |
| `overused-font` | `app/lib/exporters.ts`, `font-family: Inter` | **No aplicar**: stack intencional de la documentación HTML, decisión preservada. |
| `design-system-font` | `app/page.tsx`, carga dinámica de Google Fonts del proyecto | **Falso positivo**: la tipografía del sistema del cliente está deliberadamente separada del tema interno del Lab. |

Los advisories de colores, radios y tamaños literales corresponden al detector comparando la implementación extensa con una paleta documental compacta; no se corrigieron ni se reabrieron porque la tarea prohibía recomendaciones adicionales y cambios fuera de alcance.

No se ejecutó deploy ni se modificaron GitHub Pages o workflows de producción.
