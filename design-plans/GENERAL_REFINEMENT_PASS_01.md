# Pasada general de refinamiento 01

Estado: **especificación validada para implementar**
Rama objetivo: `experiment/impeccable`  
Alcance: correcciones de UX, fidelidad de previews, contrato funcional del Catálogo y ampliación del modelo de tokens de componente.
Decisiones de producto abiertas: **ninguna**.

## 1. Objetivo

Esta pasada reúne las observaciones realizadas después de validar los Escenarios interactivos. No debe ejecutarse como una colección de parches aislados: su objetivo es corregir las causas sistémicas y entregar un ciclo comprobable entre configuración, evaluación, salud y exportación.

La implementación se considerará terminada únicamente si:

- el comportamiento es coherente en claro y oscuro;
- funciona en desktop y mobile reales del Laboratorio;
- los frames Mobile, Mobile horizontal, Tablet y Desktop son fieles a sus datos;
- teclado, foco y lectores de pantalla pueden operar las interacciones;
- Catálogo, Escenarios, Salud, documentación HTML y exportaciones consumen el mismo modelo sin valores inventados;
- Impeccable y UI Skills se ejecutan como gate final sobre todo el alcance afectado;
- existe evidencia visual real de la implementación terminada.

## 2. Fronteras de arquitectura

### 2.1 Biblioteca interna del Laboratorio

Incluye Button, IconButton, Switch, menús, campos, diálogos y demás controles usados para construir la interfaz de la herramienta.

- Es la única biblioteca documentada en Storybook.
- Usa el tema Zinc interno del Laboratorio.
- No contiene componentes ni variantes creados por el usuario.

### 2.2 Sistema de diseño creado por el usuario

Incluye foundations, tokens, componentes, variantes, modos y plataformas destinados a Figma y a las exportaciones.

- Vive en el modelo serializable del proyecto.
- Se presenta en Catálogo, Escenarios, Salud y documentación HTML exportada.
- No genera stories ni se incorpora al Storybook interno.

### 2.3 Renderer de evaluación del proyecto

Es infraestructura del Laboratorio para representar el sistema creado por el usuario.

- Catálogo y Escenarios deben consumir el mismo renderer canónico.
- El renderer aplica exclusivamente tokens resueltos del proyecto.
- No usa el tema Zinc para representar el sistema del usuario.
- No es una biblioteca entregable ni se documenta en Storybook.
- Admite modo `playground` interactivo y modo `snapshot` con estado forzado.

## 3. Diagnóstico verificado

### 3.1 Configuración del proyecto

El diálogo actual edita directamente el proyecto confirmado. Cada tecla o cambio de plataforma se propaga inmediatamente a Salud, Escenarios, exportaciones y persistencia local. No existe borrador, confirmación ni descarte.

### 3.2 Plataformas inactivas

El modelo conserva overrides aunque una plataforma se desactive, pero las salidas actuales no ofrecen un contrato explícito para exportarla voluntariamente. El estado inactivo tampoco distingue entre configuración heredada y configuración propia conservada.

### 3.3 Chrome y navegación de Escenarios

Los frames ya tienen estructuras diferenciadas, pero su navegación todavía utiliza elementos genéricos o duplicados. Agregar destinos ficticios para completar visualmente una barra produciría controles muertos y aumentaría artificialmente el alcance de los ejemplos.

### 3.4 Control “Mostrar grilla”

Es un estado binario de efecto inmediato sobre la vista. Corresponde un Switch, no un Checkbox.

### 3.5 Previews de layout y ritmo duplicados

Actualmente existen:

1. `LayoutPreview`, que muestra frames y columnas por plataforma;
2. `FoundationPreview` con foco `layout`, que intenta mostrar composición y ritmo.

No son técnicamente iguales, pero prometen casi lo mismo. Además:

- `LayoutPreview` divide el margen por dos y limita el resultado a 28 px;
- divide el gutter por cuatro y lo limita entre 3 y 9 px;
- excluye Mobile horizontal;
- `FoundationPreview` dibuja una grilla, pero sus bloques no se posicionan mediante esas columnas.

Ninguno representa fielmente por sí solo la configuración real.

### 3.6 Iconografía en botones

Exportar fuerza su chevron a 18 px y Proyecto hereda el tamaño intrínseco del SVG. No existe un contrato común de slots de icono. Una regla global como `Button > svg` también sería incorrecta porque podría redimensionar marcas, avatares o ilustraciones.

### 3.7 Variantes y tokens de componente

El modelo v4 contiene una lista plana de `ComponentToken` con un campo textual `component`. No existen entidades de componente, variante, estado, propiedad o tipo de valor. “Agregar token” crea un grupo genérico “Nuevo componente”.

Esto limita variantes como Primary, Secondary, Tertiary, Destructive y cualquier componente propio del cliente.

### 3.8 Catálogo y estados

La revisión de código y navegador confirmó que el Catálogo mezcla componentes funcionales con representaciones incompletas:

- Checkbox considera `Hover` como `Selected` y muestra ambos iguales.
- Text field, Text area y Select no aplican una diferencia forzada para Hover.
- Calendar reutiliza la misma representación para Default, Hover y Focus.
- Accordion es interactivo, pero sus snapshots Default, Hover y Focus no se diferencian.
- Pagination aplica el nombre de estado al contenedor y no al botón correspondiente.
- Tabs no recibe el estado solicitado y vuelve a activar su primera pestaña.
- Skeleton no tiene animación y Reduced motion se ve igual.
- Avatar reutiliza la misma composición para Image, Fallback y Group.
- Modal en Catálogo es un botón sin acción; Escenarios mantiene otra implementación funcional.
- Table, List, Carousel y Breadcrumbs reciben estados que varios elementos internos no consumen.

La causa raíz es una lista genérica de strings que mezcla interacción, selección, validación, contenido, visibilidad, variantes y preferencias del entorno.

## 4. Modelo serializable v5

### 4.1 Identidad estable

El nombre visible no puede ser la identidad exportada. Cada entidad debe separar:

- `id`: identificador interno inmutable;
- `key`: identificador técnico estable y exportable;
- `name`: etiqueta visible editable.

Renombrar “Botón primario” no cambia automáticamente `button.primary`. Modificar una `key` requiere una acción explícita y un aviso de dependencias.

### 4.2 Definiciones propuestas

```ts
type TokenValueType =
  | "color"
  | "dimension"
  | "number"
  | "fontFamily"
  | "fontWeight"
  | "shadow"
  | "opacity"
  | "duration"
  | "easing"
  | "string"
  | "boolean";

type ProjectComponentDefinition = {
  id: string;
  key: string;
  name: string;
  description: string;
  source: "catalog" | "custom";
  rendererKey?: string;
};

type ComponentVariant = {
  id: string;
  key: string;
  componentId: string;
  name: string;
  description: string;
  inheritsFrom?: string;
  visibleInCatalog: boolean;
};

type ComponentToken = {
  id: string;
  key: string;
  name: string;
  componentId: string;
  variantId: string;
  state: string;
  property: string;
  valueType: TokenValueType;
  reference: string;
  platformRefs: Partial<Record<PlatformId, string>>;
  description: string;
};
```

Una ruta exportada se deriva de las keys estables:

`button.primary.hover.background`

### 4.3 Referencias y tipos

- Los tokens de componente referencian tokens semánticos o foundations compatibles.
- No almacenan hexadecimales ni valores visuales inline.
- El editor filtra referencias por `valueType`.
- Estado y propiedad ofrecen valores sugeridos, pero admiten keys personalizadas sanitizadas.
- Un componente nuevo crea automáticamente una variante `Default`.
- Ningún token puede existir sin componente y variante.

### 4.4 Herencia

- Una variante puede heredar de una única variante del mismo componente.
- No se permiten ciclos.
- El hijo hereda los slots del padre y sobrescribe por estado, propiedad y plataforma.
- Los valores heredados se muestran como tales; no se duplican silenciosamente.
- Eliminar una variante padre exige desasociar, reemplazar o materializar su herencia.

### 4.5 Contrato de estados para evaluación

El Catálogo no utilizará strings planos como definición completa. Cada muestra declara dimensiones explícitas:

```ts
type PreviewStateDescriptor = {
  id: string;
  label: string;
  variant?: string;
  interaction?: "default" | "hover" | "focus" | "pressed";
  selection?: "unchecked" | "checked" | "indeterminate" | "selected";
  validation?: "none" | "error" | "warning" | "success";
  availability?: "enabled" | "disabled" | "readonly";
  visibility?: "closed" | "open";
  content?: "default" | "empty" | "loading" | "image" | "fallback" | "group";
  motion?: "default" | "reduced";
  applicability?: {
    platforms?: PlatformId[];
    implementations?: Array<"web" | "ios" | "android">;
    capabilities?: Array<"pointer" | "touch" | "keyboard">;
  };
};
```

No toda combinación debe mostrarse. Cada componente mantiene una matriz curada de casos significativos.

## 5. Decisiones de producto

### 5.1 Edición transaccional de Proyecto

El diálogo abierto desde el header trabaja sobre un borrador.

- Incluye nombre, iniciales, descripción y plataformas.
- Foundations y editores fuera de este diálogo continúan actualizándose en vivo.
- “Aplicar cambios” reemplaza el proyecto confirmado en una operación, actualiza `updatedAt`, persiste localmente y recalcula consumidores.
- Salud, Escenarios y exportaciones cambian recién después de aplicar.
- “Cancelar” descarta el borrador.
- Escape, backdrop y cerrar con cambios pendientes solicitan confirmar el descarte.
- Sin cambios, “Aplicar cambios” permanece deshabilitado.
- El footer con Cancelar y Aplicar permanece visible aunque el contenido tenga scroll.
- En onboarding no se agrega otro botón: “Entrar al laboratorio” confirma la configuración inicial.
- Mobile continúa siendo la base y no puede desactivarse.

Después de aplicar:

- éxito: mensaje `role=status` durante aproximadamente cuatro segundos;
- error: mensaje persistente `role=alert` con recuperación y cierre manual.

### 5.2 Plataformas inactivas y exportación

Desactivar una plataforma:

- no elimina overrides, referencias ni escalas;
- la retira de Escenarios y del cálculo general de Salud;
- la excluye de exportaciones por defecto;
- permite restaurar exactamente su configuración al reactivarla.

En el selector de alcance de exportación:

- plataformas activas: grupo principal, seleccionadas por defecto;
- plataformas inactivas: grupo separado, sin seleccionar;
- etiqueta factual: “Desactivada en Proyecto · conserva configuración”;
- indicar “Con overrides” o “Hereda de Mobile”.

Si se incluye voluntariamente una plataforma inactiva:

- ejecutar un preflight específico;
- mostrar problemas de esa plataforma sin alterar la Salud general;
- marcarla como inactiva incluida voluntariamente en el manifiesto;
- aplicar el mismo alcance a JSON, CSS, documentación HTML y Figma MCP.

El archivo editable conserva siempre todas las plataformas.

### 5.3 Navegación realista de Escenarios

No se crean destinos ficticios para llenar el chrome.

- Cada escenario declara secciones reales de su contenido.
- Mobile usa hasta tres secciones reales como navegación inferior.
- Elegir un destino desplaza o cambia al contenido correspondiente.
- El indicador activo también responde al scroll manual del frame.
- El hamburger aparece únicamente si existen destinos reales adicionales.
- Si no hay destinos adicionales, no se muestra.
- Un drawer puede demostrarse en el escenario que evalúa navegación, usando destinos reales.
- Tablet presenta los mismos destinos mediante rail.
- Desktop presenta los mismos destinos mediante sidebar.
- El header se reserva para contexto y utilidades reales; no duplica navegación.
- Toda affordance interactiva produce un resultado observable.
- El estado de navegación pertenece al preview y no modifica el proyecto.

Los iconos provienen del set compartido, pero color, tamaño, radios, spacing y estados consumen tokens del proyecto.

### 5.4 Overlays de evaluación

En Escenarios:

- “Mostrar grilla” utiliza el Switch interno.
- Es una preferencia local de la sesión, desactivada inicialmente.
- Afecta todos los frames visibles.
- No se persiste ni exporta.

### 5.5 Preview único de layout y ritmo

Se eliminan las dos vistas actuales y se crea una única sección: **Preview de layout y ritmo** junto a la configuración de la plataforma seleccionada.

Incluye:

- selector entre plataformas activas;
- Mobile horizontal cuando esté habilitado;
- frame proporcional al dispositivo;
- columnas, margen, gutter y ancho máximo reales;
- composición alineada mediante la misma grilla CSS que dibuja el overlay;
- multiplicadores reales de tipografía, spacing y dimensiones;
- resumen de valores resueltos;
- switches independientes “Mostrar columnas” y “Mostrar ritmo vertical”.

Proporciones de referencia, únicamente para escalar el frame:

- Mobile: 390:844;
- Mobile horizontal: 844:390;
- Tablet: 1024:768;
- Desktop: 1440:900.

Reglas:

- las columnas son verticales en todas las orientaciones;
- no dividir ni limitar margen o gutter;
- escalar uniformemente el frame completo cuando falte espacio;
- cada bloque comienza y termina en líneas reales de la grilla;
- `maxWidth` se aplica y centra dentro del viewport simulado;
- configuraciones heredadas iguales se explicitan, no se fuerzan diferencias ficticias.

### 5.6 Ritmo vertical avanzado

La actual “Grilla de línea base” se renombra para no confundirla con la baseline tipográfica de una fuente.

Configuración avanzada:

- Switch: “Incluir ritmo vertical”.
- Campo: “Unidad de ritmo”, expresada en px.
- No altera ni redondea tipografías, dimensiones o spacing.
- Cuando está activa, Salud verifica alineación de line-height, alturas y espacios.
- Cuando está inactiva, la tipografía continúa funcionando normalmente y no se exige esa regla.

Preview:

- Switch local: “Mostrar ritmo vertical”.
- Solo muestra u oculta la guía.
- Está disponible cuando el ritmo vertical forma parte de la configuración.

El esquema v5 migra `baseline` a `verticalRhythmUnit` y `baselineEnabled` a `verticalRhythmEnabled`.

### 5.7 Contrato global de iconos internos

Usar slots explícitos, no selectores descendientes genéricos:

- Button `sm`: 16 px;
- Button `md`: 18 px;
- Button `lg`: 20 px;
- IconButton estándar: 18 px;
- stroke recomendado: 2;
- marcas, avatares e ilustraciones quedan excluidos.

ProjectMenu, ExportMenu, Select, Combobox, disclosures y futuros botones consumen el contrato. Storybook interno añade matrices de icono inicial, final, solo icono y botón dividido. Una prueba impide overrides locales no documentados.

### 5.8 Editor jerárquico de componentes

Jerarquía:

1. componente;
2. variante;
3. tokens de la variante.

Acciones:

- “Agregar componente” crea un componente personalizado fuera del inventario inicial.
- “Agregar variante” actúa dentro del componente seleccionado.
- “Agregar token” actúa dentro de la variante seleccionada.
- crear, duplicar, renombrar, heredar y eliminar;
- previsualizar la ruta técnica antes de crear;
- filtrar referencias compatibles por tipo.

Plantillas iniciales para Button: Primary, Secondary, Tertiary, Destructive y Custom. El mismo mecanismo funciona para todos los componentes.

### 5.9 Eliminación y reemplazo de dependencias

Eliminar componente, variante o token abre un diálogo contextual que:

- lista dependencias por componente, variante, token y plataforma;
- ofrece un selector de reemplazo compatible;
- previsualiza las reasignaciones;
- ejecuta “Reemplazar y eliminar” de forma atómica;
- cancela toda la operación si alguna referencia no puede reasignarse.

Acción secundaria explícitamente destructiva: “Eliminar y dejar referencias pendientes”. Salud informa después esas referencias.

Sin dependencias, se utiliza una confirmación simple.

### 5.10 Catálogo: playground y matriz documental

Cada ficha contiene dos áreas.

#### Playground funcional

- Una instancia accesible y libre del componente.
- Usa el renderer canónico compartido con Escenarios.
- Permite interacción real: marcar, escribir, abrir, navegar, seleccionar, cambiar página o cerrar.
- Consume la variante y tokens activos.
- No tiene controles con apariencia interactiva sin resultado observable.

#### Matriz de estados

- Snapshots deterministas con combinaciones relevantes.
- Usa el mismo renderer en modo `snapshot`.
- No agrega controles duplicados al orden de tabulación.
- Cada celda ofrece una descripción accesible del caso representado.
- Hover forzado coincide con el hover real.
- Focus forzado coincide con `focus-visible`.
- Si dos casos son iguales sin una razón documentada, la ficha falla QA.
- Si un caso no corresponde al componente o plataforma, no se finge.

Casos mínimos:

- Checkbox, Radio y Switch: selección, hover, focus, disabled, indeterminate cuando corresponda y error con texto/icono; no depender solo del color.
- Input, Textarea y Select: default, hover, focus, filled, error, disabled y readonly cuando aplique.
- Accordion, Dropdown, Pagination, Tabs, Calendar y Carousel: comportamiento real y estado aplicado al elemento interno correcto.
- Link y Breadcrumbs: interacción aplicada al enlace específico.
- Skeleton: animación real y alternativa para reduced motion.
- Avatar: Image, Fallback y Group como casos diferentes.
- Modal: diálogo real con foco inicial, Escape, backdrop y restauración.
- List y Table: estados por elemento o fila, además de empty/loading cuando aplique.

Aplicabilidad:

- Hover se muestra únicamente cuando el destino/capacidad admite puntero.
- Visited se limita a web.
- Focus se mantiene donde teclado o tecnología de asistencia lo requiera.
- Reduced motion depende de la preferencia del entorno.
- No inferir aplicabilidad únicamente por el ancho del viewport; considerar `implementationProfile` y capacidades de entrada.

### 5.11 Variantes en Catálogo y Escenarios

- Toda variante de un componente con renderer puede usar ese renderer, no solo Button.
- El selector de variante actualiza playground, snapshots y Escenarios.
- El renderer aplica únicamente slots que conoce.
- Tokens adicionales siguen siendo válidos y exportables, pero se etiquetan “Sin representación en este preview”.
- Un componente personalizado sin `rendererKey` no inventa un preview y no aparece como ficha funcional.
- Puede mapearse a un renderer futuro sin cambiar ids, keys ni tokens.

### 5.12 Salud del sistema

Salud distingue:

- problema estructural real;
- variante renderizable incompleta;
- estado esperado sin implementación;
- estados aplicables visualmente indistinguibles;
- interacción sin resultado observable;
- componente personalizado sin renderer;
- token exportable sin consumidor visual;
- plataforma inactiva.

Solo los problemas aplicables afectan el puntaje.

Métricas informativas:

- componentes con preview;
- variantes evaluadas visualmente;
- componentes personalizados sin renderer;
- tokens sin representación visual;
- estados no aplicables por plataforma.

Cada métrica navega al editor o evidencia correspondiente.

### 5.13 Exportaciones

- JSON y CSS conservan componente, variante, estado, propiedad y tipo.
- Figma MCP conserva aliases, modos, plataformas y jerarquía.
- La documentación HTML exportada lista variantes y tokens, sin generar Storybook.
- Exportaciones parciales incluyen automáticamente dependencias requeridas o bloquean con explicación concreta.
- No se generan aliases rotos.
- Componentes personalizados sin renderer se exportan normalmente.

## 6. Migración v4 → v5

- Ejecutar en memoria; nunca sobrescribir el archivo importado original.
- Ser idempotente y soportar round-trip serializable.
- Componentes conocidos se asocian a su definición de catálogo.
- Cada nombre de componente desconocido crea su propio componente personalizado.
- Tokens inferibles se separan en variante, estado y propiedad.
- Tokens no inferibles permanecen en una variante `Legacy` del componente original, no en un grupo global.
- Proyecto en blanco permanece en blanco.
- No reintroducir presets o tokens que el usuario haya eliminado.
- `button.primary.*` migra a Button / Primary.
- `button.destructive.*` migra a Button / Destructive.
- Preservar plataformas inactivas y sus overrides.
- Migrar baseline a las nuevas propiedades de ritmo vertical.
- Mantener fixture v4 validado, fixture v4 en blanco y fixture con componentes desconocidos.

## 7. Orden interno de implementación

La iniciativa se ejecuta como una sola pasada, respetando este orden para evitar retrabajo:

1. Crear fixtures y pruebas de regresión del estado actual.
2. Introducir esquema v5, migración, ids/keys estables y resolvedor tipado.
3. Implementar borrador transaccional de Proyecto y alcance de plataformas inactivas.
4. Normalizar slots de iconos y cambiar Mostrar grilla a Switch.
5. Consolidar layout/ritmo y migrar la configuración avanzada.
6. Crear el renderer canónico con modos playground y snapshot.
7. Sustituir el registro genérico por descriptores de estado por componente.
8. Reconstruir Catálogo sobre playground + matriz.
9. Refinar chrome y navegación de Escenarios usando el renderer canónico.
10. Construir editor jerárquico, herencia y eliminación con reemplazo.
11. Conectar Salud, exportaciones, documentación HTML y Figma MCP.
12. Ejecutar QA integral, Impeccable y UI Skills; corregir hallazgos y repetir el gate.

## 8. Criterios de aceptación

### Proyecto y plataformas

- Editar el diálogo no altera consumidores antes de Aplicar.
- Cancelar y descartar restauran el estado confirmado.
- El footer de acciones siempre permanece accesible.
- Desactivar y reactivar una plataforma conserva sus datos.
- Una plataforma inactiva puede exportarse voluntariamente y nunca viene marcada por defecto.

### Escenarios

- No existen destinos decorativos.
- Todos los destinos llevan a contenido real.
- Hamburger aparece solo cuando existen destinos adicionales reales.
- Mobile, Tablet y Desktop presentan la misma arquitectura mediante chrome apropiado.
- Ningún control visible carece de resultado observable.

### Layout y ritmo

- Existe un único preview.
- Mobile, landscape, Tablet y Desktop tienen proporciones distinguibles.
- Overlay y contenido comparten exactamente columnas, margen y gutter.
- No se alteran valores para acomodar la maqueta.
- El ritmo vertical nunca modifica valores automáticamente.

### Iconos

- Proyecto y Exportar usan el mismo slot de chevron.
- Todos los consumidores internos respetan el contrato.
- Marcas e ilustraciones no son redimensionadas por reglas de Button.

### Componentes y variantes

- Se pueden crear componentes fuera del catálogo inicial.
- Se pueden crear variantes y tokens tipados.
- Herencia no permite ciclos.
- Renombrar una etiqueta no cambia la key exportada.
- Eliminar con reemplazo actualiza dependencias atómicamente.
- Componentes sin renderer se persisten y exportan sin penalización de Salud.

### Catálogo

- Cada componente tiene playground funcional.
- Cada snapshot representa un caso distinto y aplicable.
- Checkbox Hover no equivale a Selected.
- Error no depende solamente del color.
- Skeleton anima y respeta reduced motion.
- Modal, Select, Accordion, Calendar, Pagination, Tabs y Carousel funcionan realmente.
- Catálogo y Escenarios no mantienen implementaciones divergentes.

### Salud y exportación

- Salud explica cobertura visual y exclusiones informativas.
- Solo problemas aplicables afectan el puntaje.
- JSON, CSS, documentación HTML y Figma MCP preservan la misma jerarquía.
- Exportaciones parciales no producen referencias rotas.
- Un proyecto v4 migra sin pérdida ni reinyección de defaults.

## 9. Gate de calidad obligatorio

### Verificación técnica

- TypeScript y ESLint.
- Pruebas de migración y round-trip.
- Pruebas de transacción, descarte y persistencia.
- Pruebas de herencia, ciclos, eliminación y reemplazo.
- Pruebas de exportación parcial y dependencias.
- Build Next/Pages y build de Storybook interno.

### Matriz de proyectos

- Sistema inicial validado.
- Proyecto en blanco.
- Proyecto migrado v4.
- Proyecto con componente personalizado sin renderer.
- Proyecto con variantes heredadas.
- Plataforma desactivada y reactivada.

### Matriz visual y de interacción

- Laboratorio claro y oscuro.
- Desktop y mobile reales del Laboratorio.
- Mobile, Mobile horizontal, Tablet y Desktop en previews.
- Todos los modos del proyecto.
- Clic, teclado, foco, Escape, scroll y restauración de foco.
- Contraste de focus y controles esenciales >= 3:1.
- Error comunicado mediante texto/icono además de color.
- Sin overflow global, solapamientos ni scroll atrapado.

### Auditoría sistémica

- Inventariar todos los consumidores de cada componente interno modificado; no validar solo los ejemplos reportados.
- Verificar todos los componentes y casos declarados del Catálogo.
- Comparar estados forzados con interacción real.
- Comprobar que cada affordance produzca un cambio observable.
- Ejecutar Impeccable y UI Skills después de implementar.
- Corregir hallazgos aplicables y repetir ambas auditorías.
- Documentar falsos positivos con evidencia.
- Si no existe navegador controlable, la tarea queda pendiente de revisión visual y no puede declararse terminada.

Storybook se utiliza únicamente para componentes internos del Laboratorio modificados en esta pasada. No se crean stories para componentes, variantes ni tokens del proyecto del usuario.

## 10. Fuera de alcance

- Sincronización directa y automática con Figma desde el navegador.
- Generación automática de un renderer para componentes personalizados arbitrarios.
- Documentación del sistema generado dentro de Storybook.
- Construcción de nuevas pantallas ficticias para completar la navegación de Escenarios.
- Cambios visuales no relacionados en otras áreas, salvo los necesarios para mantener el contrato compartido.

## 11. Resultado esperado

El Laboratorio ofrece un ciclo coherente:

1. editar decisiones de proyecto en borrador y confirmarlas;
2. configurar foundations, componentes y variantes sin quedar limitado por el preset;
3. ver datos reales aplicados en layout, Catálogo y Escenarios;
4. comprobar interacción, estados, accesibilidad y cobertura;
5. conservar configuraciones inactivas sin perderlas;
6. resolver dependencias antes de eliminar;
7. exportar la misma estructura a JSON, CSS, documentación HTML y Figma MCP;
8. cerrar la tarea únicamente después de un gate de calidad reproducible.
