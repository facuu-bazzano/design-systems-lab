export type CatalogCategory = "actions" | "inputs" | "selection" | "navigation" | "feedback" | "surfaces";
export type CatalogEntry = { id: string; name: string; category: CatalogCategory; purpose: string; states: string[]; componentTokens: string[]; semanticTokens: string[]; priority: "core" | "extended" };

export const catalogCategories: { id: CatalogCategory; label: string; description: string }[] = [
  { id: "actions", label: "Acciones", description: "Inician tareas y expresan jerarquía." },
  { id: "inputs", label: "Inputs", description: "Capturan y validan información." },
  { id: "selection", label: "Selección", description: "Permiten elegir, activar o alternar opciones." },
  { id: "navigation", label: "Navegación", description: "Organiza recorridos y contenido relacionado." },
  { id: "feedback", label: "Feedback y estado", description: "Comunica resultados, progreso y alertas." },
  { id: "surfaces", label: "Datos y superficies", description: "Agrupa, representa y compara información." },
];

const coreStates = ["Default", "Hover", "Focus", "Disabled"];
const entry = (id: string, name: string, category: CatalogCategory, purpose: string, states = coreStates, componentTokens: string[] = [], semanticTokens = ["surface.raised", "text.primary", "border.subtle", "focus.ring"], priority: "core" | "extended" = "extended"): CatalogEntry => ({ id, name, category, purpose, states, componentTokens, semanticTokens, priority });

// Taxonomía basada en Design System Checklist, ampliada con Table porque es esencial
// para inspeccionar tokens de datos en este laboratorio.
export const catalogRegistry: CatalogEntry[] = [
  entry("button", "Button", "actions", "Acción principal, secundaria o destructiva.", ["Default", "Hover", "Focus", "Active", "Disabled", "Destructive"], ["button.primary.background", "button.primary.foreground", "button.primary.hover", "button.primary.pressed", "button.primary.radius", "button.destructive.background"], ["action.primary", "text.on-action", "action.hover", "action.pressed", "focus.ring", "disabled.surface", "disabled.content", "feedback.destructive"], "core"),
  entry("link", "Link", "actions", "Navegación contextual dentro del contenido.", ["Default", "Hover", "Focus", "Visited", "Disabled"], ["link.default.foreground", "link.focus.ring"], ["action.primary", "focus.ring", "disabled.content"], "core"),
  entry("icon", "Icon", "actions", "Representación visual accesible para acciones y conceptos.", ["Default", "Hover", "Focus", "Disabled"]),

  entry("input", "Text field", "inputs", "Entrada breve con etiqueta, ayuda y validación.", ["Default", "Hover", "Focus", "Disabled", "Error"], ["input.default.background", "input.default.foreground", "input.default.border", "input.focus.border", "input.focus.ring", "input.disabled.background", "input.disabled.foreground", "input.error.border", "input.error.foreground"], ["surface.raised", "text.primary", "border.subtle", "focus.ring", "disabled.surface", "disabled.content", "feedback.destructive"], "core"),
  entry("textarea", "Text area", "inputs", "Entrada de texto de varias líneas.", ["Default", "Hover", "Focus", "Disabled", "Error"], ["textarea.default.background", "textarea.default.border", "textarea.focus.border", "textarea.error.border"], ["surface.raised", "text.primary", "border.subtle", "focus.ring", "feedback.destructive"], "core"),
  entry("select", "Select", "inputs", "Elección entre opciones conocidas.", ["Default", "Hover", "Focus", "Open", "Disabled", "Error"], ["select.default.background", "select.default.border", "select.focus.border", "select.menu.background", "select.error.border"], ["surface.raised", "border.subtle", "focus.ring", "feedback.destructive"], "core"),
  entry("calendar", "Calendar", "inputs", "Selección de fecha o rango con navegación de mes."),

  entry("checkbox", "Checkbox", "selection", "Selección múltiple independiente.", ["Default", "Hover", "Focus", "Selected", "Disabled", "Error"], ["checkbox.default.border", "checkbox.selected.background", "checkbox.selected.foreground", "checkbox.focus.ring", "checkbox.error.border", "checkbox.radius"], ["border.strong", "selected.surface", "text.primary", "focus.ring", "feedback.destructive"], "core"),
  entry("radio", "Input radio", "selection", "Selección única dentro de un conjunto.", ["Default", "Hover", "Focus", "Selected", "Disabled", "Error"], ["radio.default.border", "radio.selected.background", "radio.focus.ring", "radio.error.border"], ["border.strong", "selected.border", "focus.ring", "feedback.destructive"], "core"),
  entry("switch", "Switch", "selection", "Activa un cambio inmediato.", ["Default", "Hover", "Focus", "Selected", "Disabled"], ["switch.track.background", "switch.track.selected", "switch.thumb.background", "switch.focus.ring"], ["disabled.surface", "selected.border", "surface.raised", "focus.ring"], "core"),

  entry("accordion", "Accordion", "navigation", "Expande y contrae regiones relacionadas.", ["Default", "Hover", "Focus", "Open", "Disabled"]),
  entry("breadcrumbs", "Breadcrumbs", "navigation", "Ubica a la persona dentro de una jerarquía."),
  entry("dropdown", "Dropdown", "navigation", "Despliega acciones u opciones contextuales.", ["Default", "Hover", "Focus", "Open", "Disabled"]),
  entry("pagination", "Pagination", "navigation", "Navega conjuntos de resultados paginados.", ["Default", "Hover", "Focus", "Selected", "Disabled"]),
  entry("tabs", "Tabs", "navigation", "Alterna vistas del mismo nivel.", ["Default", "Hover", "Focus", "Selected", "Disabled"], ["tabs.item.foreground", "tabs.item.selected", "tabs.item.indicator", "tabs.focus.ring"], ["text.muted", "text.primary", "selected.border", "focus.ring"], "core"),

  entry("alert", "Alert", "feedback", "Mensaje prominente con contexto y próximo paso.", ["Info", "Success", "Warning", "Error"], ["alert.info.border", "alert.success.foreground", "alert.success.background", "alert.warning.foreground", "alert.warning.background", "alert.error.foreground", "alert.error.background"], ["focus.ring", "feedback.success", "feedback.warning", "feedback.destructive"], "core"),
  entry("badge", "Badge", "feedback", "Estado o metadato breve.", ["Neutral", "Selected", "Success", "Warning", "Error"], ["badge.neutral.background", "badge.selected.background", "badge.success.foreground", "badge.success.background", "badge.warning.foreground", "badge.warning.background", "badge.error.foreground", "badge.error.background", "badge.radius"], ["surface.raised", "selected.surface", "feedback.success", "feedback.warning", "feedback.destructive"], "core"),
  entry("loading", "Loading indicator", "feedback", "Indica una espera sin alterar el layout.", ["Default", "Reduced motion"]),
  entry("progress", "Progress bar", "feedback", "Comunica avance de una tarea.", ["Default", "Complete", "Error"]),
  entry("skeleton", "Skeleton", "feedback", "Reserva estructura mientras carga el contenido.", ["Default", "Reduced motion"]),
  entry("toast", "Toast", "feedback", "Notificación temporal por encima del contenido.", ["Info", "Success", "Warning", "Error"]),
  entry("tooltip", "Tooltip", "feedback", "Información contextual en hover o foco.", ["Default", "Open"]),

  entry("avatar", "Avatar", "surfaces", "Representa una persona u organización.", ["Image", "Fallback", "Group"]),
  entry("card", "Card", "surfaces", "Agrupa contenido relacionado.", ["Default", "Hover", "Selected", "Disabled"], ["card.container.background", "card.container.border", "card.container.radius", "card.container.shadow", "card.selected.border"], ["surface.raised", "border.subtle", "selected.border"], "core"),
  entry("carousel", "Carousel", "surfaces", "Navega un conjunto horizontal de contenido."),
  entry("divider", "Divider", "surfaces", "Separa grupos relacionados.", ["Default"], ["divider.default.border"], ["border.subtle"]),
  entry("image", "Image", "surfaces", "Contenido visual con proporción y alternativa accesible.", ["Default", "Fallback"]),
  entry("list", "List", "surfaces", "Organiza elementos repetibles y sus acciones.", ["Default", "Hover", "Selected", "Disabled"]),
  entry("modal", "Modal", "surfaces", "Concentra una tarea encima del contexto actual.", ["Default", "Open"]),
  entry("table", "Table", "surfaces", "Presenta datos escaneables y comparables.", ["Default", "Hover", "Selected", "Empty"], ["table.header.background", "table.row.background", "table.row.hover", "table.row.selected", "table.divider.border"], ["surface.raised", "surface.default", "selected.surface", "border.subtle"], "core"),
];
