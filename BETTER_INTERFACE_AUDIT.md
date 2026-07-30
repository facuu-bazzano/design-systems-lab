# Auditoría `better-interface` — flujo principal

Rama: `experiment/impeccable`

Base revisada: `36718dc` (`Refine semantic alert treatments`)

Fecha: 2026-07-29

## Herramienta y alcance

- Colección: [`jakubkrehel/skills`](https://github.com/jakubkrehel/skills), commit de origen `a67333399dabbc71d7778962cb9c4fb9b86a00d0`.
- Instalador: `skills` CLI `1.5.20` mediante el equivalente local `pnpm dlx skills add jakubkrehel/skills --skill '*' --agent codex --yes --copy`.
- Modo invocado: `$better-interface full`.
- Flujo revisado: sistema inicial validado → configuración de proyecto → foundations → tokens → Catálogo → Salud → importación/exportación.
- Restricción: revisión de solo lectura. No se modificaron componentes, navegación, estilos, workflows ni GitHub Pages.
- Deduplificación: se excluyeron los hallazgos `side-tab`, `overused-font`, CSS muerto y el lenguaje visual de alertas ya cubiertos por `IMPECCABLE_AUDIT.md` y el commit `36718dc`.

## Cobertura por disciplina

| Disciplina | Evidencia revisada | Resultado único |
|---|---|---|
| Accesibilidad | Teclado, landmarks, modal, formularios, feedback, navegación SPA y controles compuestos | 6 hallazgos |
| Layout | Reflujo de navegación, estructura de escenarios y panel de exportación | 1 hallazgo compartido con accesibilidad |
| Escritura | Importación fallida y acciones sin resultado en Salud | 2 hallazgos compartidos |
| Tipografía | Tamaño efectivo de campos en viewport móvil | 1 hallazgo |
| Color | Temas claro/oscuro y semántica de estados | Sin hallazgos nuevos; alertas ya deduplicadas |
| UI | Estados interactivos, affordances y consistencia del flujo | 2 hallazgos compartidos |

## Hallazgos priorizados

No se confirmaron hallazgos **críticos**.

| Severidad | Ubicación | Implementación observada | Acción recomendada | Impacto |
|---|---|---|---|---|
| **ALTA** | `app/page.tsx:193`; `app/components/ui/LabUI.tsx:62-64` | `ExportPanel` usa `<aside role="dialog" aria-modal="true" aria-labelledby="export-title">`, pero `SectionHeading` no genera ningún `id="export-title"`. Al abrirlo, el snapshot mantuvo el foco en el botón `Exportar` detrás del overlay. No hay foco inicial, trampa de foco, cierre con Escape ni restauración al disparador. | Sustituir el overlay manual por Radix Dialog o `<dialog>.showModal()`, conectar el título real, mover el foco al abrir, contener Tab/Shift+Tab, cerrar con Escape y devolver el foco al botón `Exportar`. | El principal flujo de salida pierde contexto y puede dejar a una persona que navega con teclado operando contenido oculto detrás del modal. |
| **ALTA** | `app/page.tsx:203`, `app/page.tsx:226`, `app/page.tsx:229`, `app/page.tsx:271` | El único feedback de importación es un `<div class="toast-v4">` insertado durante 2,4 s, sin `role`, `aria-live` ni acción de cierre. El error dice solo “El archivo no es compatible”. | Mantener una región viva estable; anunciar éxitos de forma `polite` y el fallo como error persistente o descartable. Reemplazar el texto por una recuperación concreta, por ejemplo: “No se pudo importar. Usá un archivo `.dslab.json` descargado desde el Laboratorio.” | El fallo de importación puede no anunciarse y desaparece antes de poder entender cómo corregirlo; es la única vía de recuperación disponible. |
| **MEDIA** | `app/page.tsx:269`; `app/page.tsx:212`; `app/layout.tsx:6-8` | La navegación principal cambia vistas con botones que solo reciben la clase `active`; no expone `aria-current`/estado seleccionado. El cambio solo hace `scrollTo`, mantiene un título de documento fijo y no mueve foco ni anuncia el nuevo `<h1>`. Tampoco existe un enlace para saltar el header/sidebar repetidos. | Exponer el destino actual (`aria-current="page"` o patrón equivalente), actualizar `document.title`, enfocar el `<h1>`/`main` tras cambiar de vista y agregar un skip link hacia un `main` identificable. | Quien navega con lector de pantalla o teclado no recibe confirmación fiable de la vista activa y debe atravesar el chrome repetido. |
| **MEDIA** | `app/components/HealthView.tsx:16`; `app/page.tsx:269` | Cada uno de los tres escenarios de Salud renderiza un `<main>` dentro del `<main>` principal. El snapshot expuso cuatro landmarks `main`, tres de ellos anidados, y landmarks `navigation` repetidos sin nombre. | Convertir el cuerpo de cada escenario en `<div>`/`<section>` y etiquetar cualquier navegación simulada como contenido de preview, no como landmark global. Mantener un solo `main` de aplicación. | La lista de landmarks deja de representar la estructura real y dificulta saltar al contenido principal o distinguir el preview de la herramienta. |
| **MEDIA** | `app/components/ui/LabUI.tsx:37-42` | El selector de familia se presenta visualmente como combobox, pero el trigger es un botón que abre un `dialog` con un textbox y una lista de botones. No expone `role="combobox"`, `aria-controls`, `listbox`/`option` ni navegación por flechas/`aria-activedescendant`. El snapshot confirmó exactamente esa estructura. | Implementar el patrón APG de combobox con búsqueda, preferentemente con un primitivo accesible; ArrowUp/Down recorre opciones, Enter confirma y Escape cierra y restaura foco. | La selección sigue siendo posible con Tab, pero no se comporta ni se anuncia como el control que la interfaz promete, haciendo mucho más lenta la configuración tipográfica. |
| **MEDIA** | `app/components/ui/LabUI.tsx:24-29`; `app/components/Catalog.tsx:22-24` | `Input`, `Textarea` y los campos de ejemplo marcan `aria-invalid`, pero la ayuda/error visible no tiene `id` ni queda conectada mediante `aria-describedby`. | Generar identificadores estables para ayuda/error, conectar el campo con `aria-describedby` y conservar el mensaje inline; aplicar el mismo componente/patrón al Catálogo. | El laboratorio muestra el error visualmente, pero un lector de pantalla no recibe la explicación al enfocar el campo, y el Catálogo termina documentando un patrón incompleto. |
| **MEDIA** | `app/globals.css:35-36`; `app/globals.css:64` | Los campos reales usan `15px`, la búsqueda del combobox `14px` y la búsqueda de Catálogo `15px`; no hay override móvil a `16px`. | Aplicar `font-size:16px` a inputs/textarea/búsquedas en el breakpoint móvil, manteniendo la densidad actual desde tablet/escritorio. | En iOS Safari, enfocar estos campos puede ampliar automáticamente toda la página y desplazar el contexto en casi todas las áreas de configuración. |
| **MEDIA** | `app/components/HealthView.tsx:41-42` | Salud renderiza siempre como botones los contadores `0`. Los tres botones de “Hallazgos activos” no hacen nada cuando no existe un hallazgo; los `0` de la tabla son varios botones con nombre accesible idéntico y pueden enviar al Catálogo aunque no haya elementos afectados. El snapshot confirmó esos controles activos en un sistema 100/100. | Renderizar cero como valor estático; habilitar navegación solo con resultados positivos; dar a cada métrica accionable un nombre contextual (“Inspeccionar 2 advertencias de Desktop oscuro”) y mantener una única acción `Inspeccionar` para la fila sin incidencias. | La pantalla promete una acción exacta pero entrega un no-op o una vista sin coincidencias, debilitando la confianza en Salud como guía de corrección. |

## Falsos positivos y decisiones de no aplicar

| Clasificación | Candidato | Decisión |
|---|---|---|
| **FALSO POSITIVO / ya cubierto** | `Inter, system-ui, sans-serif` en la documentación | Se conserva: es una elección sobria y funcional para una herramienta operativa; ya fue resuelto como “no aplicar” por Impeccable. |
| **FALSO POSITIVO / ya cubierto** | Franjas laterales de alertas y `.doc-alert` | No se repite. El commit `36718dc` ya sustituyó el patrón por borde perimetral, fondo tonal e icono semántico compartido. |
| **FALSO POSITIVO** | Botones “Crear revisión” y “Guardar cambios” dentro de escenarios comparativos | No se propone convertir Salud en editor de producto. Son contenido ilustrativo del preview. Sí corresponde evitar roles/landmarks globales falsos, cubierto en el hallazgo de estructura. |
| **FALSO POSITIVO** | Muchas rampas de color intensas en Bibliotecas | Son datos del sistema de diseño importable, no jerarquía cromática de acciones del Laboratorio. No aplica la regla “una acción coloreada por vista”. |
| **FALSO POSITIVO / prioridad insuficiente** | Metadatos técnicos de 11 px en inspectores | Existen valores esenciales a 11 px, pero la auditoría no los eleva a MEDIA sin una comprobación adicional de zoom y lectura con contenido largo; queda como candidato de QA, no como hallazgo de esta ronda. |

## Verificación realizada

- Revisión estática completa de `app/page.tsx`, `app/components/ui/LabUI.tsx`, `app/components/Catalog.tsx`, `app/components/HealthView.tsx`, `app/globals.css`, `app/layout.tsx` y exportadores.
- Ejecución local en `http://localhost:3010/` con el sistema inicial validado.
- Snapshot accesible de Salud: confirmó cuatro landmarks `main`, tres escenarios, métricas cero como botones y múltiples controles de preview.
- Apertura del panel “Configurar exportación”: confirmó diálogo sin nombre accesible y foco conservado en `Exportar` detrás del overlay.
- Apertura de “Buscar familia”: confirmó trigger botón + diálogo + textbox + botones, sin semántica de combobox/listbox.
- Revisión del flujo principal en estado 100/100 para distinguir fallos del Laboratorio de estados pendientes del proyecto.
- Contraste claro/oscuro de alertas no se reabre: quedó verificado en la auditoría anterior y se excluye por deduplicación.
- Lint del producto, excluyendo skills de terceros y artefactos generados: aprobado.
- Pruebas automatizadas: 19/19 aprobadas.
- No se ejecutó VoiceOver/NVDA ni Safari iOS real; los hallazgos de foco, landmarks y tamaño móvil se basan en DOM accesible y CSS efectivo y deben formar parte del QA de una eventual corrección.

## Veredicto

**Necesita cambios.** Hay dos problemas de severidad alta en exportación e importación y seis problemas medios verificables. Ninguno requiere rediseñar el producto: se concentran en semántica, foco, feedback y honestidad de los affordances existentes.

## Cómo invocar las skills en Codex

Desde esta rama/worktree, Codex descubre las skills copiadas en `.agents/skills`. Ejemplos:

- `$better-interface full revisá el flujo principal del Laboratorio`
- `$better-accessibility revisá el panel Configurar exportación`
- `$better-writing revisá los mensajes de importación y recuperación`

La instalación es local al proyecto. No se copiaron archivos al directorio global de skills de Codex.
