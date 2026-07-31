import { catalogRegistry } from "./catalog-registry";

export type ScenarioDefinition = {
  id: "configuration" | "dashboard" | "content";
  name: string;
  description: string;
  componentIds: string[];
};

export const scenarioRegistry: ScenarioDefinition[] = [
  {
    id: "configuration",
    name: "Configuración y formularios",
    description: "Alta, preferencias, validación y acciones de una tarea operativa.",
    componentIds: ["button", "link", "icon", "input", "textarea", "select", "calendar", "checkbox", "radio", "switch", "alert", "badge", "tooltip", "modal"],
  },
  {
    id: "dashboard",
    name: "Dashboard y datos",
    description: "Navegación, indicadores, carga y exploración de información estructurada.",
    componentIds: ["tabs", "dropdown", "pagination", "card", "table", "list", "avatar", "progress", "loading", "skeleton", "toast"],
  },
  {
    id: "content",
    name: "Contenido y navegación",
    description: "Recorridos jerárquicos, contenido visual y exploración progresiva.",
    componentIds: ["accordion", "breadcrumbs", "carousel", "divider", "image"],
  },
];

export const scenarioCoverage = [...new Set(scenarioRegistry.flatMap((scenario) => scenario.componentIds))];
export const missingScenarioCoverage = catalogRegistry.map((entry) => entry.id).filter((id) => !scenarioCoverage.includes(id));
