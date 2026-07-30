# Auditoría de motion

Estado: hallazgos y lineamientos; sin implementación.

## Personalidad

El Laboratorio es una herramienta profesional de configuración. Su movimiento debe sentirse preciso, breve y causal: revelar jerarquía, mostrar de dónde aparece un elemento y confirmar una acción. No debe competir con los previews del sistema del usuario.

## Hallazgos

| Prioridad | Superficie | Evidencia | Recomendación |
| --- | --- | --- | --- |
| Alta | Drawer de exportación | `.export-panel-v4` se monta desde el borde derecho sin transición. El backdrop también aparece de forma inmediata. | Entrada con `translateX` + opacity, easing de drawer y 220–320 ms. Salida algo más breve. Foco disponible desde el primer frame útil. |
| Alta | Menús, Select y Combobox | `.ui-menu-content`, `.ui-select-content` y `.ui-combobox-content` no tienen transición de entrada/salida. | Usar transform-origin provisto por Radix, desplazamiento de 4–6 px y opacity durante 150–220 ms. No animar listas largas internamente. |
| Media | Tokens de motion | Las transiciones de 150/160 ms están repetidas en botones, switch, accordions y librerías, sin nombres compartidos. | Añadir primitives internas para duración y easing; documentarlas en Storybook y usarlas en la biblioteca. |
| Media | Movimiento reducido | `@media(prefers-reduced-motion:reduce)` elimina todas las transiciones y animaciones globalmente. | Desactivar desplazamientos y loops no esenciales, pero preservar feedback instantáneo o transiciones de color/opacity muy breves. Mantener el spinner solo cuando comunica progreso real, con alternativa textual. |

## Tokens propuestos

```css
--motion-duration-instant: 100ms;
--motion-duration-control: 150ms;
--motion-duration-popover: 200ms;
--motion-duration-drawer: 280ms;
--motion-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--motion-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--motion-ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

Los valores son un punto de partida para prueba, no una decisión cerrada. Deben validarse en Storybook y en el flujo real.

## Matriz de comportamiento

- Button/IconButton: color/borde 100–150 ms; pressed con `translateY(1px)` o scale cercano a `.97`, nunca `scale(0)`.
- Tooltip: 125–180 ms; anclado al trigger.
- Menu/Select/Combobox: 150–220 ms; opacity + pequeño desplazamiento.
- Dialog/Drawer: 220–320 ms; continuidad con su origen y restauración de foco.
- Accordion: 180–240 ms solo si el cambio de altura no produce saltos; el chevron acompaña el estado.
- Toast: entrada breve y tiempo suficiente para leer; los errores persistentes no dependen del toast.

## QA obligatorio

- Claro/oscuro y desktop/mobile.
- Teclado, Escape, focus trap y restauración del foco.
- Click repetido y cambios de estado rápidos sin animaciones acumuladas.
- `prefers-reduced-motion: reduce` con feedback todavía comprensible.
- Sin `transition: all`, sin animar layout costoso y sin loops decorativos.
