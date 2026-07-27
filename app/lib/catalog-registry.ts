export type CatalogCategory = "actions" | "inputs" | "selection" | "navigation" | "feedback" | "surfaces";
export type CatalogEntry = {
  id: string;
  name: string;
  category: CatalogCategory;
  purpose: string;
  states: string[];
  componentTokens: string[];
  semanticTokens: string[];
  priority: "core" | "extended";
};

export const catalogCategories: { id: CatalogCategory; label: string; description: string }[] = [
  { id: "actions", label: "Acciones", description: "Inician tareas y expresan jerarquía." },
  { id: "inputs", label: "Inputs", description: "Capturan y validan información." },
  { id: "selection", label: "Selección", description: "Permiten elegir, activar o alternar opciones." },
  { id: "navigation", label: "Navegación", description: "Organiza recorridos y contenido relacionado." },
  { id: "feedback", label: "Feedback y estado", description: "Comunica resultados, alertas y metadatos." },
  { id: "surfaces", label: "Datos y superficies", description: "Agrupa información y facilita la comparación." },
];

export const catalogRegistry: CatalogEntry[] = [
  { id: "button", name: "Button", category: "actions", purpose: "Acción principal, secundaria o destructiva.", states: ["Default", "Hover", "Focus", "Active", "Disabled", "Destructive"], componentTokens: ["button.primary.background", "button.primary.hover", "button.primary.pressed", "button.destructive.background"], semanticTokens: ["action.primary", "action.hover", "action.pressed", "feedback.destructive"], priority: "core" },
  { id: "input", name: "Input", category: "inputs", purpose: "Entrada breve con ayuda y validación.", states: ["Default", "Hover", "Focus", "Disabled", "Error"], componentTokens: ["input.default.border", "input.focus.border", "input.error.border"], semanticTokens: ["border.subtle", "focus.ring", "feedback.destructive"], priority: "core" },
  { id: "textarea", name: "Textarea", category: "inputs", purpose: "Entrada de texto de varias líneas.", states: ["Default", "Focus", "Disabled", "Error"], componentTokens: ["input.default.border", "input.focus.border", "input.error.border"], semanticTokens: ["border.subtle", "focus.ring", "feedback.destructive"], priority: "core" },
  { id: "select", name: "Select", category: "inputs", purpose: "Elección entre opciones conocidas.", states: ["Default", "Hover", "Focus", "Open", "Disabled", "Error"], componentTokens: ["input.default.border", "input.focus.border", "input.error.border"], semanticTokens: ["surface.raised", "border.subtle", "focus.ring"], priority: "core" },
  { id: "checkbox", name: "Checkbox", category: "selection", purpose: "Selección múltiple independiente.", states: ["Default", "Hover", "Focus", "Selected", "Disabled", "Error"], componentTokens: ["control.selected.background", "control.radius"], semanticTokens: ["selected.surface", "selected.border", "focus.ring"], priority: "core" },
  { id: "radio", name: "Radio", category: "selection", purpose: "Selección única dentro de un conjunto.", states: ["Default", "Hover", "Focus", "Selected", "Disabled"], componentTokens: ["control.selected.background"], semanticTokens: ["selected.surface", "selected.border", "focus.ring"], priority: "core" },
  { id: "switch", name: "Switch", category: "selection", purpose: "Activa un cambio inmediato.", states: ["Default", "Hover", "Focus", "Selected", "Disabled"], componentTokens: ["control.selected.background"], semanticTokens: ["selected.surface", "selected.border", "focus.ring"], priority: "core" },
  { id: "tabs", name: "Tabs", category: "navigation", purpose: "Alterna vistas del mismo nivel.", states: ["Default", "Hover", "Focus", "Selected", "Disabled"], componentTokens: ["control.selected.background"], semanticTokens: ["selected.surface", "selected.border", "focus.ring"], priority: "core" },
  { id: "badge", name: "Badge", category: "feedback", purpose: "Estado o metadato breve.", states: ["Default", "Selected", "Success", "Warning", "Error"], componentTokens: [], semanticTokens: ["selected.surface", "feedback.success", "feedback.warning", "feedback.destructive"], priority: "core" },
  { id: "alert", name: "Alert", category: "feedback", purpose: "Feedback contextual con un próximo paso.", states: ["Info", "Success", "Warning", "Error"], componentTokens: [], semanticTokens: ["feedback.success", "feedback.warning", "feedback.destructive"], priority: "core" },
  { id: "card", name: "Card", category: "surfaces", purpose: "Agrupa contenido relacionado.", states: ["Default", "Hover", "Selected", "Disabled"], componentTokens: ["card.container.radius", "card.container.shadow"], semanticTokens: ["surface.raised", "border.subtle", "selected.border"], priority: "core" },
  { id: "table", name: "Table", category: "surfaces", purpose: "Presenta datos escaneables.", states: ["Default", "Hover", "Selected", "Empty"], componentTokens: [], semanticTokens: ["surface.raised", "border.subtle", "text.primary", "text.muted"], priority: "core" },
  { id: "link", name: "Link", category: "actions", purpose: "Navegación contextual dentro del contenido.", states: ["Default", "Hover", "Focus", "Visited", "Disabled"], componentTokens: [], semanticTokens: ["action.primary", "focus.ring"], priority: "extended" },
  { id: "divider", name: "Divider", category: "surfaces", purpose: "Separa grupos relacionados.", states: ["Default"], componentTokens: [], semanticTokens: ["border.subtle"], priority: "extended" },
];
