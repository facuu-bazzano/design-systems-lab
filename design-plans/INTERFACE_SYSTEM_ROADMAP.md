# Secuencia de mejora del Laboratorio

Estado: propuesta auditada, sin cambios de producto aplicados.

Rama de trabajo: `experiment/impeccable`.

## Norte del producto

El Laboratorio es una herramienta operativa para configurar, validar y documentar un sistema de diseño antes de llevar decisiones a Figma. La interfaz interna debe seguir siendo sobria, legible y basada en Zinc; el proyecto del usuario, sus tokens y sus previews permanecen separados del tema interno del Laboratorio.

La mejora no busca un rediseño masivo. Debe corregir causas compartidas en la biblioteca interna, demostrar cada cambio en Storybook y reutilizarlo en todas las pantallas.

## Lenguaje actual observado

- Tipografía Inter con jerarquía clara y densidad de herramienta profesional.
- Superficies Zinc, un acento violeta y estados semánticos discretos.
- Header fijo, navegación persistente y contenido organizado en cards.
- Controles propios y Radix para comportamiento complejo.
- Dos temas internos coherentes y separados de los tokens del proyecto.

## Hallazgos confirmados para la próxima implementación

| Prioridad | Hallazgo | Contrato | Evidencia de ejecución | Corrección propuesta |
| --- | --- | --- | --- | --- |
| Alta | El foco programático usa el outline nativo del navegador sobre títulos y el panel de exportación. | El foco debe ser accesible y, a la vez, usar el lenguaje visual interno sin convertir contenido no interactivo en un control aparente. | Después de navegar, el `h1[tabindex="-1"]` recibe `outline: rgb(229, 151, 0) auto 1px`. Al abrir Exportar, `.export-panel-v4` recibe el mismo outline. La gestión proviene de `app/page.tsx:240` y del foco inicial del diálogo en `app/page.tsx:209`. | Mantener el traslado de foco y los anuncios accesibles. Definir un tratamiento canónico para destinos programáticos no interactivos y un foco inicial explícito en el control de cierre/título del diálogo. No suprimir `:focus-visible` de controles interactivos. |
| Alta | La orientación móvil depende de dos carriles horizontales sin señal de continuidad. | En mobile debe preservarse orientación, jerarquía y acceso claro a todas las secciones y categorías. | A 390 px, `.sidebar-v4` mide 375 px y contiene 756 px; `.catalog-side-nav` mide 341 px y contiene 840 px. Ambos ocultan scrollbar (`app/globals.css:70`) y los elementos siguientes quedan cortados sin indicador de que hay más contenido. | Conservar la navegación compacta, pero añadir una señal de overflow/continuidad, estado activo visible y desplazamiento automático del elemento seleccionado. Revisar que nombre/salud y acciones del header mantengan una jerarquía comprensible. |
| Media-alta | Overlays y popovers aparecen sin transición compartida; el sistema no tiene primitives de motion. | Motion debe orientar, reforzar causalidad y mantener una personalidad sobria. | `.ui-menu-content`, `.ui-select-content`, `.ui-combobox-content` (`app/globals.css:36`) y `.export-panel-v4` (`app/globals.css:52,194`) no definen entrada/salida. Las duraciones existentes están dispersas entre `.15s` y `.16s`. | Crear tokens internos de duración/easing y aplicar solo transform/opacity: popover anclado al trigger, menú/select breve y drawer de exportación con continuidad lateral. Preservar interacción inmediata y evitar movimiento ornamental. |

## Secuencia aprobada

### 1. Sistema interno

- Definir contrato de foco programático y motion tokens internos.
- Incorporar estados y ejemplos en Storybook antes de cambiar pantallas.
- Añadir pruebas visuales/interactivas para claro, oscuro, desktop y mobile.

### 2. Estética y continuidad

- Corregir el outline ajeno al sistema sin perder accesibilidad.
- Afinar continuidad y jerarquía del shell mobile sin cambiar la arquitectura global.
- Auditar los componentes compartidos; evitar correcciones CSS locales.

### 3. Interacción

- Hacer que el origen y el destino de menús, popovers y paneles sean evidentes.
- Mantener feedback de hover, pressed, focus, loading, success y error consistente.
- Verificar teclado, foco, Escape y restauración de foco en cada primitive.

### 4. Motion

- Introducir un vocabulario pequeño de movimiento funcional.
- Usar duraciones breves: 100–160 ms para microinteracciones, 150–250 ms para popovers y 220–320 ms para el panel lateral.
- Animar `transform` y `opacity`; no usar `transition: all`.
- Respetar `prefers-reduced-motion` con versiones reducidas, no eliminando todo feedback visual.

### 5. Verificación

- Storybook, pruebas de interacción y accesibilidad.
- Auditoría visual real en pantallas largas y estados con datos.
- Build de aplicación y Storybook sin publicar desde la rama experimental.

## Próxima gran iniciativa: paquete de ejecución para Figma mediante GPT + MCP

Esta fase comienza después de cerrar la secuencia anterior. No consiste en prometer que un prompt informal reconstruirá el sistema: el Laboratorio debe exportar contexto estructurado, determinista y verificable.

### Salida propuesta

1. `figma-manifest.json`: esquema versionado con collections, modos, variables primitivas, aliases semánticos, tokens de componente, scopes y valores por plataforma.
2. `figma-execution-plan.md`: instrucciones para que ChatGPT use el MCP de Figma en orden seguro, incluyendo archivo objetivo y decisiones que requieren confirmación.
3. `figma-validation.json`: checksums, referencias rotas, colisiones de nombres, cobertura y resultado esperado para validar la ejecución.

### Reglas de seguridad y calidad

- Operación idempotente: ejecutar dos veces no debe duplicar variables.
- Política explícita ante conflictos: conservar, actualizar, renombrar o cancelar.
- Vista previa de cambios antes de escribir en Figma.
- Creación por capas: primitives, modos, semánticos y componentes.
- Confirmación del archivo objetivo antes de cualquier escritura.
- Informe final de creados, actualizados, omitidos y errores.

### Resultado esperado

El usuario descarga el paquete, lo adjunta a una conversación con acceso al MCP de Figma y solicita aplicar el plan en un archivo confirmado. GPT actúa como ejecutor asistido; el manifiesto del Laboratorio sigue siendo la fuente de verdad.

## No hacer durante esta secuencia

- No rediseñar navegación, modelo de tokens ni catálogo completo.
- No añadir animaciones decorativas o continuas.
- No mezclar el tema interno con los tokens del proyecto.
- No implementar todavía el exportador MCP ni escribir directamente en Figma.
