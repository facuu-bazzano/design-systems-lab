import type { Meta, StoryObj } from "@storybook/react-vite";
import { createInitialProject } from "../lib/model";
import { FoundationPreview } from "./FoundationPreview";
import { ScenarioExplorer } from "./ScenarioExplorer";

const project = createInitialProject();
project.platforms.tablet.enabled = true;
project.platforms.desktop.enabled = true;
project.platforms.tablet.proposalPending = false;
project.platforms.desktop.proposalPending = false;

const meta = { title: "Laboratorio/Evidencia del sistema", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const SuiteDeEscenarios: Story = { render: () => <div style={{ padding: 28 }}><ScenarioExplorer project={project} /></div> };
export const PreviewDeColor: Story = { render: () => <div style={{ padding: 28 }}><FoundationPreview project={project} focus="color" /></div> };
export const PreviewTipografico: Story = { render: () => <div style={{ padding: 28 }}><FoundationPreview project={project} focus="typography" /></div> };
export const PreviewDeLayout: Story = { render: () => <div style={{ padding: 28 }}><FoundationPreview project={project} focus="layout" /></div> };
