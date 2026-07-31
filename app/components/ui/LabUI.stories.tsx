import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { Alert, Badge, Button, ButtonIcon, Card, Checkbox, Combobox, Dialog, ExportMenu, HealthIndicator, HelpTooltip, IconButton, Input, LabHeader, ProjectMenu, RadioGroup, SectionHeading, Select, Switch, Table, Tabs, Textarea, Toggle } from "./LabUI";
import { ChevronDownIcon, MoonIcon } from "./Icons";

const meta = { title: "Laboratorio/Biblioteca interna", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function StateMatrix({ children }: { children: ReactNode }) {
  return <div className="story-state-matrix">{children}</div>;
}

function StateCell({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return <div className={`story-state-cell ${className}`}><small>{label}</small>{children}</div>;
}

function ControlContract() {
  const [checked, setChecked] = useState(true);
  const [switched, setSwitched] = useState(true);
  const [radio, setRadio] = useState("a");
  const [selected, setSelected] = useState("mobile");
  const [font, setFont] = useState("inter");
  const [pressed, setPressed] = useState(true);
  const options = [{ value: "mobile", label: "Mobile" }, { value: "desktop", label: "Desktop" }];
  const fonts = [{ value: "inter", label: "Inter", meta: "Google Fonts" }, { value: "arial", label: "Arial", meta: "Común" }];
  return <div className="story-contract">
    <section className="story-contract-section"><h2>Button e IconButton</h2><StateMatrix>
      <StateCell label="Default"><Button>Continuar</Button></StateCell>
      <StateCell label="Hover"><Button className="is-hover">Continuar</Button></StateCell>
      <StateCell label="Focus"><Button className="is-focus">Continuar</Button></StateCell>
      <StateCell label="Active"><Button className="is-active">Continuar</Button></StateCell>
      <StateCell label="Disabled"><Button disabled>Continuar</Button></StateCell>
      <StateCell label="Destructive"><Button variant="danger">Eliminar</Button></StateCell>
      <StateCell label="Icon"><IconButton label="Cambiar tema"><MoonIcon /></IconButton></StateCell>
      <StateCell label="Icon disabled"><IconButton label="Cambiar tema" disabled><MoonIcon /></IconButton></StateCell>
    </StateMatrix></section>
    <section className="story-contract-section"><h2>Input y Textarea</h2><StateMatrix>
      <StateCell label="Default"><Input label="Nombre" defaultValue="Sistema Atlas" /></StateCell>
      <StateCell label="Focus" className="is-focus"><Input label="Nombre" defaultValue="Sistema Atlas" /></StateCell>
      <StateCell label="Disabled"><Input label="Nombre" defaultValue="Sistema Atlas" disabled /></StateCell>
      <StateCell label="Error"><Input label="Nombre" defaultValue="" error="Ingresá un nombre." /></StateCell>
      <StateCell label="Textarea"><Textarea label="Descripción" defaultValue="Una descripción que conserva ritmo y legibilidad." /></StateCell>
      <StateCell label="Textarea error"><Textarea label="Descripción" defaultValue="" error="Completá la descripción." /></StateCell>
    </StateMatrix></section>
    <section className="story-contract-section"><h2>Select y Combobox</h2><StateMatrix>
      <StateCell label="Default"><Select label="Plataforma" value={selected} onValueChange={setSelected} options={options} /></StateCell>
      <StateCell label="Hover"><Select label="Plataforma" value={selected} onValueChange={setSelected} options={options} className="is-hover" /></StateCell>
      <StateCell label="Focus"><Select label="Plataforma" value={selected} onValueChange={setSelected} options={options} className="is-focus" /></StateCell>
      <StateCell label="Disabled"><Select label="Plataforma" value={selected} onValueChange={setSelected} options={options} disabled /></StateCell>
      <StateCell label="Error"><Select label="Plataforma" value={selected} onValueChange={setSelected} options={options} invalid /></StateCell>
      <StateCell label="Combobox"><Combobox label="Familia" value={font} onValueChange={setFont} options={fonts} /></StateCell>
      <StateCell label="Combobox focus"><Combobox label="Familia" value={font} onValueChange={setFont} options={fonts} className="is-focus" /></StateCell>
      <StateCell label="Combobox error"><Combobox label="Familia" value={font} onValueChange={setFont} options={fonts} invalid /></StateCell>
    </StateMatrix></section>
    <section className="story-contract-section"><h2>Checkbox</h2><StateMatrix>
      <StateCell label="Unchecked"><Checkbox checked={false} onCheckedChange={setChecked} label="Incluir color" /></StateCell>
      <StateCell label="Checked"><Checkbox checked={checked} onCheckedChange={setChecked} label="Incluir color" /></StateCell>
      <StateCell label="Indeterminate"><Checkbox checked="indeterminate" onCheckedChange={setChecked} label="Selección parcial" /></StateCell>
      <StateCell label="Focus"><Checkbox className="is-focus" checked onCheckedChange={setChecked} label="Incluir color" /></StateCell>
      <StateCell label="Disabled off"><Checkbox checked={false} onCheckedChange={setChecked} label="No disponible" disabled /></StateCell>
      <StateCell label="Disabled on"><Checkbox checked onCheckedChange={setChecked} label="Incluido por sistema" disabled /></StateCell>
      <StateCell label="Error"><Checkbox checked={false} onCheckedChange={setChecked} label="Aceptación requerida" invalid /></StateCell>
    </StateMatrix></section>
    <section className="story-contract-section"><h2>Radio</h2><StateMatrix>
      <StateCell label="Unchecked"><RadioGroup value="" onValueChange={setRadio} options={[{ value: "a", label: "Opción" }]} /></StateCell>
      <StateCell label="Checked"><RadioGroup value={radio} onValueChange={setRadio} options={[{ value: "a", label: "Opción" }]} /></StateCell>
      <StateCell label="Focus" className="is-focus"><RadioGroup value="a" onValueChange={setRadio} options={[{ value: "a", label: "Opción" }]} /></StateCell>
      <StateCell label="Disabled off"><RadioGroup value="" onValueChange={setRadio} options={[{ value: "a", label: "No disponible" }]} disabled /></StateCell>
      <StateCell label="Disabled on"><RadioGroup value="a" onValueChange={setRadio} options={[{ value: "a", label: "Heredada" }]} disabled /></StateCell>
      <StateCell label="Error"><RadioGroup value="" onValueChange={setRadio} options={[{ value: "a", label: "Elegí una opción" }]} invalid /></StateCell>
    </StateMatrix></section>
    <section className="story-contract-section"><h2>Switch</h2><StateMatrix>
      <StateCell label="Off"><Switch checked={false} onCheckedChange={setSwitched} label="Desktop" /></StateCell>
      <StateCell label="On"><Switch checked={switched} onCheckedChange={setSwitched} label="Desktop" /></StateCell>
      <StateCell label="Hover"><Switch className="is-hover" checked={false} onCheckedChange={setSwitched} label="Desktop" /></StateCell>
      <StateCell label="Focus"><Switch className="is-focus" checked onCheckedChange={setSwitched} label="Desktop" /></StateCell>
      <StateCell label="Disabled off"><Switch checked={false} onCheckedChange={setSwitched} label="No disponible" disabled /></StateCell>
      <StateCell label="Disabled on"><Switch checked onCheckedChange={setSwitched} label="Mobile · base" disabled /></StateCell>
      <StateCell label="Error"><Switch checked={false} onCheckedChange={setSwitched} label="Revisión requerida" invalid /></StateCell>
    </StateMatrix></section>
    <section className="story-contract-section"><h2>Toggle, Tabs y disclosures</h2><StateMatrix>
      <StateCell label="Toggle off"><Toggle pressed={false} onPressedChange={setPressed}>Vista simple</Toggle></StateCell>
      <StateCell label="Toggle on"><Toggle pressed={pressed} onPressedChange={setPressed}>Vista completa</Toggle></StateCell>
      <StateCell label="Toggle disabled"><Toggle pressed disabled onPressedChange={setPressed}>Vista fijada</Toggle></StateCell>
      <StateCell label="Tabs"><Tabs value="one" onValueChange={() => {}} ariaLabel="Vista" tabs={[{ value: "one", label: "Resumen" }, { value: "two", label: "Tokens" }]} /></StateCell>
      <StateCell label="Tab disabled"><Tabs value="one" onValueChange={() => {}} ariaLabel="Vista" tabs={[{ value: "one", label: "Resumen" }, { value: "two", label: "Tokens", disabled: true }]} /></StateCell>
      <StateCell label="Disclosure"><button type="button" className="component-token-group-trigger" aria-expanded="false"><span><b>Button</b><small>9 tokens</small></span><ChevronDownIcon /></button></StateCell>
      <StateCell label="Disclosure open"><button type="button" className="component-token-group-trigger" aria-expanded="true"><span><b>Button</b><small>9 tokens</small></span><ChevronDownIcon style={{ transform: "rotate(180deg)" }} /></button></StateCell>
      <StateCell label="Tooltip"><HelpTooltip label="Más información">Explicación contextual del control.</HelpTooltip></StateCell>
    </StateMatrix></section>
    <section className="story-contract-section"><h2>Menus y acciones del header</h2><StateMatrix>
      <StateCell label="ProjectMenu"><ProjectMenu onImport={() => {}} onDownload={() => {}} onDuplicate={() => {}} /></StateCell>
      <StateCell label="ExportMenu"><ExportMenu onConfigure={() => {}} onQuickExport={() => {}} /></StateCell>
      <StateCell label="HealthIndicator"><HealthIndicator score={95} status="attention" summary="Una revisión pendiente" onClick={() => {}} /></StateCell>
    </StateMatrix></section>
  </div>;
}

export const ContratoVisualDeControles: Story = { render: () => <div className="story-theme-pair"><div className="storybook-frame theme-light" data-lab-theme="light"><SectionHeading title="Controles · Claro" description="Matriz visible de estados del sistema interno del Laboratorio." /><ControlContract /></div><div className="storybook-frame theme-dark" data-lab-theme="dark"><SectionHeading title="Controles · Oscuro" description="El mismo contrato conserva posición, contraste, foco y jerarquía." /><ControlContract /></div></div> };

export const AccionesYEstados: Story = { render: () => <div className="story-grid"><Button variant="primary">Primario</Button><Button variant="secondary">Secundario</Button><Button variant="danger">Destructivo</Button><Button disabled>Deshabilitado</Button><Button className="is-hover">Hover</Button><Button className="is-focus">Focus</Button><Button className="is-active">Active</Button></div> };
export const Campos: Story = { render: () => <div className="story-stack"><Input label="Nombre del proyecto" defaultValue="Atlas Design System" help="Se usa en documentación y exportaciones." /><Input label="Email" defaultValue="equipo@" error="Ingresá un email válido." /><Input label="Ancho máximo" defaultValue="1280" suffix="px" /><Textarea label="Descripción" defaultValue="Contenido largo para validar que el campo conserve ritmo, altura y legibilidad incluso en documentación extensa." /></div> };
export const SelectYCombobox: Story = { render: () => { const Demo = () => { const [select, setSelect] = useState("mobile"); const [font, setFont] = useState("inter"); return <div className="story-stack"><Select label="Plataforma" value={select} onValueChange={setSelect} options={[{ value: "mobile", label: "Mobile" }, { value: "tablet", label: "Tablet" }, { value: "desktop", label: "Desktop" }]} /><Combobox label="Familia tipográfica" value={font} onValueChange={setFont} options={[{ value: "inter", label: "Inter", meta: "Google Fonts" }, { value: "arial", label: "Arial", meta: "Común" }, { value: "custom", label: "Marca Sans", meta: "Personalizada" }]} /></div>; }; return <Demo />; } };
export const Seleccion: Story = { render: () => { const Demo = () => { const [check, setCheck] = useState(true); const [sw, setSw] = useState(false); const [radio, setRadio] = useState("a"); return <div className="story-stack"><Checkbox checked={check} onCheckedChange={setCheck} label="Exportar foundations" /><Checkbox checked={false} onCheckedChange={() => {}} label="Opción deshabilitada" disabled /><Switch checked={sw} onCheckedChange={setSw} label="Activar tablet" /><RadioGroup value={radio} onValueChange={setRadio} options={[{ value: "a", label: "Escala suave" }, { value: "b", label: "Cuarta perfecta" }]} /></div>; }; return <Demo />; } };
export const Menus: Story = { render: () => <div className="story-grid"><ProjectMenu onImport={() => {}} onDownload={() => {}} onDuplicate={() => {}} /><ExportMenu onConfigure={() => {}} onQuickExport={() => {}} /></div> };
export const EncabezadosYSalud: Story = { render: () => <div className="story-stack"><SectionHeading title="Foundations" description="Decisiones primitivas sin intención de uso." /><SectionHeading level={2} title="Tipografía" description="Familia, estilo base y escala modular con contenido deliberadamente largo para probar saltos de línea." /><div className="story-grid"><HealthIndicator score={100} status="ready" summary="Sistema listo" onClick={() => {}} /><HealthIndicator score={72} status="attention" summary="Requiere atención" onClick={() => {}} /><HealthIndicator score={null} status="pending" summary="Sin evaluar" onClick={() => {}} /></div></div> };
export const SuperficiesYFeedback: Story = { render: () => <div className="story-stack"><div className="story-grid"><Badge>Neutral</Badge><Badge tone="success">Validado</Badge><Badge tone="warning">Pendiente</Badge><Badge tone="danger">Error</Badge></div><Alert tone="warning" title="Revisión requerida">La grilla de tablet todavía hereda los valores móviles.</Alert><Card><SectionHeading level={2} title="Card de ejemplo" description="Superficie interna reutilizable." /></Card><Table><thead><tr><th>Rol</th><th>Foundation</th><th>Estado</th></tr></thead><tbody><tr><td>Texto principal</td><td>Slate.900</td><td><Badge tone="success">Asignado</Badge></td></tr></tbody></Table></div> };
export const TabsInteractivos: Story = { render: () => { const Demo = () => { const [value, setValue] = useState("uno"); return <Tabs value={value} onValueChange={setValue} ariaLabel="Secciones" tabs={[{ value: "uno", label: "Resumen", content: <p>Contenido del resumen.</p> }, { value: "dos", label: "Tokens", content: <p>Contenido de tokens.</p> }]} />; }; return <Demo />; } };
export const ClaroOscuroYContenidoLargo: Story = { render: () => <div className="story-stack" style={{ maxWidth: 980 }}><div className="storybook-frame theme-light" data-lab-theme="light"><SectionHeading title="Tema claro" description="Ejemplo extenso para comprobar saltos de línea, jerarquía estable y controles que no colapsan cuando las etiquetas ocupan más espacio del habitual." /><div className="story-grid"><ProjectMenu onImport={() => {}} onDownload={() => {}} onDuplicate={() => {}} /><ExportMenu onConfigure={() => {}} onQuickExport={() => {}} /><HealthIndicator score={88} status="attention" summary="Dos decisiones requieren revisión" onClick={() => {}} /></div></div><div className="storybook-frame theme-dark" data-lab-theme="dark"><SectionHeading title="Tema oscuro" description="La misma composición conserva contraste, espaciado y estados sin modificar los tokens del proyecto que se esté evaluando." /><div className="story-grid"><Button variant="primary">Acción con una etiqueta deliberadamente larga</Button><Checkbox checked onCheckedChange={() => {}} label="Incluir todos los modos y plataformas activos en esta exportación" /><Switch checked onCheckedChange={() => {}} label="Activar propuesta heredada" /></div></div></div> };
export const MotionYContinuidad: Story = { render: () => { const Demo = () => { const [platform, setPlatform] = useState("mobile"); const [font, setFont] = useState("inter"); return <div className="story-stack"><SectionHeading title="Motion funcional" description="Menús y popovers comparten duraciones y easing. El movimiento explica origen y jerarquía sin alterar los tokens del proyecto." /><div className="story-grid"><ProjectMenu onImport={() => {}} onDownload={() => {}} onDuplicate={() => {}} /><ExportMenu onConfigure={() => {}} onQuickExport={() => {}} /></div><div className="form-grid"><Select label="Plataforma" value={platform} onValueChange={setPlatform} options={[{ value: "mobile", label: "Mobile" }, { value: "tablet", label: "Tablet" }, { value: "desktop", label: "Desktop" }]} /><Combobox label="Familia tipográfica" value={font} onValueChange={setFont} options={[{ value: "inter", label: "Inter", meta: "Google Fonts" }, { value: "arial", label: "Arial", meta: "Común" }, { value: "custom", label: "Marca Sans", meta: "Personalizada" }]} /></div><Card><SectionHeading level={2} title="Primitives" description="Control 150 ms · Popover 200 ms · Drawer 280 ms · movimiento reducido conserva feedback tonal." /></Card></div>; }; return <Demo />; } };
export const DialogoConSelect: Story = { render: () => { const Demo = () => { const [open, setOpen] = useState(true); const [platform, setPlatform] = useState("mobile"); return <div className="story-stack"><Button onClick={() => setOpen(true)}>Abrir diálogo</Button><Dialog open={open} onOpenChange={setOpen} title="Configuración de prueba" description="El encabezado permanece visible y el Select despliega dentro del top layer."><Card><SectionHeading level={2} title="Destino" description="Contenido suficientemente largo para validar foco, portales y desplazamiento." /><Select label="Plataforma" value={platform} onValueChange={setPlatform} options={[{ value: "mobile", label: "Mobile" }, { value: "tablet", label: "Tablet" }, { value: "desktop", label: "Desktop" }]} /></Card><Card><SectionHeading level={2} title="Más contenido" description="Escape cierra y devuelve el foco al disparador." /></Card></Dialog></div>; }; return <Demo />; } };
export const HeaderConProyectoGhost: Story = { render: () => <div className="storybook-frame theme-dark" data-lab-theme="dark"><LabHeader projectName="Atlas Design System" onOpenProject={() => {}} health={<HealthIndicator score={95} status="attention" summary="Una revisión pendiente" onClick={() => {}} />} projectMenu={<ProjectMenu onImport={() => {}} onDownload={() => {}} onDuplicate={() => {}} />} exportMenu={<ExportMenu onConfigure={() => {}} onQuickExport={() => {}} />} themeAction={<IconButton label="Cambiar tema"><MoonIcon /></IconButton>} /></div> };

export const ContratoDeIconosEnBotones: Story = { render: () => <div className="story-stack"><SectionHeading title="Slots de icono" description="El tamaño depende del control; marcas, avatares e ilustraciones permanecen fuera de este contrato." /><div className="story-grid"><Button size="sm"><ButtonIcon><MoonIcon /></ButtonIcon>Inicial</Button><Button>Final<ButtonIcon position="end"><ChevronDownIcon /></ButtonIcon></Button><IconButton label="Solo icono"><MoonIcon /></IconButton><ExportMenu onConfigure={() => {}} onQuickExport={() => {}} /></div></div> };
export const FamiliasTipograficasMultiples: Story = { render: () => { const Demo = () => { const [font, setFont] = useState("inter"); const [role, setRole] = useState("inter"); return <div className="story-stack" style={{ maxWidth: 900 }}><SectionHeading title="Familias del proyecto" description="La biblioteca tipográfica permite combinar voces por función sin reemplazar silenciosamente todo el sistema." /><div className="font-add-row"><Combobox label="Buscar familia" value={font} onValueChange={setFont} options={[{ value: "inter", label: "Inter", meta: "Google Fonts" }, { value: "merriweather", label: "Merriweather", meta: "Google Fonts" }, { value: "arial", label: "Arial", meta: "Común" }]} /><Button>Agregar familia</Button></div><div className="font-family-library"><article className="font-family-card"><div><span className="font-family-meta">Google Fonts</span><h3 style={{ fontFamily: "Inter, sans-serif" }}>Inter</h3><p style={{ fontFamily: "Inter, sans-serif" }}>Diseñar con una voz tipográfica coherente.</p><small>3 estilos asignados</small></div><span className="font-primary-label">Familia principal</span></article><article className="font-family-card"><div><span className="font-family-meta">Google Fonts</span><h3 style={{ fontFamily: "Merriweather, serif" }}>Merriweather</h3><p style={{ fontFamily: "Merriweather, serif" }}>Jerarquía editorial para títulos y contenido destacado.</p><small>2 estilos asignados</small></div><Button variant="quiet">Usar como principal</Button></article></div><Select label="Familia del estilo Heading" value={role} onValueChange={setRole} options={[{ value: "inter", label: "Inter", meta: "Principal" }, { value: "merriweather", label: "Merriweather", meta: "Editorial" }]} /></div>; }; return <Demo />; } };
