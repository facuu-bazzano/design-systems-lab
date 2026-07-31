# Pasada general de refinamiento 01

Estado: propuesta para validación antes de implementar  
Rama objetivo: `experiment/impeccable`  
Alcance: correcciones de UX, fidelidad de previews y ampliación del modelo de tokens de componente.

## 1. Objetivo

Esta pasada reúne las observaciones realizadas después de validar los Escenarios interactivos. El propósito no es sumar parches aislados, sino resolver las causas sistémicas y separar claramente:

- defectos e inconsistencias actuales;
- mejoras de fidelidad visual;
- decisiones de interacción;
- nuevas capacidades que requieren ampliar el modelo serializable.

La implementación se considerará terminada únicamente si el comportamiento es coherente en claro/oscuro, desktop/mobile, teclado y lectores de pantalla, y si Catálogo, Escenarios, Salud, exportaciones y documentación consumen el mismo modelo sin valores inventados.

## 2. Diagnóstico verificado

### 2.1 Configuración del proyecto

El diálogo actual edita directamente el objeto principal del proyecto. Cada tecla o cambio de plataforma se propaga inmediatamente a Salud, Escenarios, exportación y persistencia local. No existe borrador, confirmación ni posibilidad de descartar una prueba.

Conclusión: la observación es correcta. El texto “Configuración del proyecto” sugiere una edición confirmable, pero el comportamiento actual es autoguardado inmediato y no lo comunica.

### 2.2 Escenarios por plataforma

Los frames ya son distintos estructuralmente, pero su navegación todavía parece una maqueta genérica:

- Mobile no tiene acción de menú en el header.
- La navegación inferior usa sólo texto, sin icono ni indicador de sección activa.
- Tablet usa números como sustituto de iconos.
- Desktop presenta dos navegaciones principales simultáneas y con jerarquía tipográfica excesiva.

Conclusión: los componentes y la grilla mejoraron, pero el chrome de producto no tiene la misma fidelidad.

### 2.3 Control “Mostrar grilla”

Es un estado binario de efecto inmediato y reversible sobre la vista. No representa selección múltiple ni aceptación de una opción dentro de un formulario.

Conclusión: corresponde un Switch, no un Checkbox.

### 2.4 Previews de layout duplicados

Actualmente existen dos visualizaciones dentro de Escalas y layout:

1. `LayoutPreview`: muestra frames y columnas por plataforma.
2. `FoundationPreview` con foco `layout`: intenta mostrar ritmo, composición y grilla aplicada.

No son técnicamente iguales, pero cumplen una promesa casi idéntica y por eso se perciben duplicadas. La primera, además, transforma los valores reales para acomodar la visualización:

- margen: se divide por dos y se limita a 28 px;
- gutter: se divide por cuatro y se limita entre 3 y 9 px;
- Mobile horizontal se excluye del preview.

La segunda usa variables resueltas, pero sus bloques no se posicionan mediante las columnas que dibuja el overlay. Por eso el contenido y la grilla no coinciden.

Conclusión: la duplicación es real a nivel de producto y ninguna de las dos vistas cumple sola el objetivo completo. Deben consolidarse.

### 2.5 Iconografía en botones

El chevron del botón dividido Exportar tiene una regla explícita de 18 px, mientras que el chevron de Proyecto hereda el tamaño intrínseco del SVG. No existe un contrato general para iconos contenidos en Button e IconButton.

Conclusión: no debe corregirse Proyecto y Exportar por separado. Hay que definir el contrato una sola vez en la biblioteca interna.

### 2.6 Variantes de componentes y sus tokens

El modelo actual contiene una lista plana de `ComponentToken` con un campo textual `component`. No existe una entidad de variante, estado o propiedad. El Catálogo conoce por código una lista fija de nombres de token y el botón “Agregar token” crea un grupo genérico “Nuevo componente”.

Esto impide representar correctamente casos como:

- Button / Primary;
- Button / Secondary;
- Button / Tertiary;
- Button / Destructive;
- variantes especiales del proyecto.

Conclusión: la observación es correcta. Permitir únicamente los tokens previstos por el Catálogo limita el sistema generado. No alcanza con agregar otro botón a la tabla; hay que ampliar el modelo.

## 3. Decisiones de producto

### 3.1 Edición transaccional del proyecto

El diálogo trabajará sobre una copia temporal del proyecto.

- Abrir Proyecto crea un borrador desde el último estado confirmado.
- Cambiar nombre, descripción o plataformas sólo modifica el borrador.
- “Aplicar cambios” reemplaza el estado principal en una única operación.
- Después de aplicar se muestra un mensaje persistente breve: “Cambios del proyecto aplicados”.
- Salud, Escenarios, selectores de plataforma, documentación y exportación reaccionan recién después de confirmar.
- “Cancelar” descarta el borrador y cierra.
- Cerrar con cambios pendientes solicita confirmar el descarte.
- Si no hubo cambios, el botón principal permanece deshabilitado.
- Mobile continúa siendo la plataforma base y no puede desactivarse.

El texto recomendado para la acción es “Aplicar cambios”; describe mejor el efecto que “Guardar”, dado que el proyecto ya se conserva localmente.

### 3.2 Navegación realista de los escenarios

Se definirá un único modelo de destinos y tres presentaciones responsivas. Los mismos destinos no deben repetirse como navegaciones competidoras.

#### Mobile

- Header compacto: marca, nombre truncado y botón hamburguesa.
- El botón abre un menú o drawer funcional dentro del frame.
- Navegación inferior: icono, label de 10–12 px e indicador activo.
- Destinos sugeridos: Inicio, Actividad y Perfil.
- Respeta safe area inferior y no tapa el contenido desplazable.

#### Tablet

- Rail lateral compacto con iconos, labels opcionales e indicador activo.
- Eliminar numeración `01`, `02`, `03`.
- El rail puede expandirse o mostrar tooltip cuando el espacio sea limitado.
- Header reservado para contexto, búsqueda o acciones, no para duplicar la navegación principal.

#### Desktop

- Sidebar como navegación primaria con iconos y label compacto.
- Header como barra de contexto y utilidades: búsqueda, notificaciones, ayuda o perfil.
- Eliminar el menú duplicado Inicio / Equipo / Ajustes del header, salvo que se redefina como utilidades reales.
- Inspector permanece como panel secundario, claramente separado de la navegación.
- Reducir tamaño y peso de labels de navegación sin alterar la tipografía configurada del contenido.

#### Contrato común

- Iconos desde la biblioteca compartida.
- Estados hover, focus, pressed y active visibles.
- `aria-current` para el destino activo.
- Navegación funcional con teclado.
- Colores, radios, spacing y selected state consumen tokens del proyecto.
- El chrome puede usar estructura propia por plataforma, pero no colores o escalas inventados.

### 3.3 Switch para overlay de grilla

- Sustituir Checkbox por el Switch interno canónico.
- Label: “Mostrar grilla”.
- Estado local a Escenarios; no crea ni modifica tokens.
- Activación inmediata, sin confirmación.
- Debe conservar foco visible y nombre accesible.

### 3.4 Preview único de layout y ritmo

Se elimina el preview inferior duplicado y se crea una sola sección: **Preview de layout y ritmo**.

La vista consolidada incluye:

- selector de plataforma entre las plataformas activas;
- Mobile horizontal cuando esté habilitado;
- frame proporcional a cada dispositivo;
- columnas, margen, gutter, ancho máximo y baseline reales;
- overlay activable de columnas y baseline;
- composición demostrativa alineada mediante la misma grilla CSS que dibuja el overlay;
- multiplicadores de tipografía, spacing y dimensiones aplicados a la muestra;
- resumen legible de los valores resueltos.

Proporciones de referencia para escalar el frame, no para crear tokens:

- Mobile: vertical, aproximadamente 390:844.
- Mobile horizontal: aproximadamente 844:390.
- Tablet: aproximadamente 1024:768.
- Desktop: aproximadamente 1440:900.

Reglas de fidelidad:

- No dividir ni limitar silenciosamente margen o gutter.
- Escalar el frame completo de forma uniforme si falta espacio.
- El contenido debe ocupar columnas explícitas: header `1/-1`, rail o sidebar un rango definido y cards spans verificables.
- La primera y última columna visual deben coincidir con los límites efectivos del contenido.
- El preview debe mostrar diferencias reales entre plataformas; si dos configuraciones son iguales, debe explicitar que una hereda de la otra.

### 3.5 Contrato global de iconos

Definir tamaños por componente interno, no por pantalla:

- Button `sm`: 16 px.
- Button `md`: 18 px.
- Button `lg`: 20 px.
- IconButton estándar: 18 px.
- Stroke recomendado: 2; permitir excepción documentada para marcas.

Aplicación:

- `Button > svg` e `IconButton > svg` reciben tamaño canónico.
- Los iconos se centran mediante un slot común.
- ProjectMenu, ExportMenu, Select, Combobox, disclosures y futuros botones consumen el mismo contrato.
- Storybook interno añade una matriz de botones con icono inicial, final, sólo icono y botón dividido.
- Una prueba evita tamaños SVG locales dentro de botones, salvo excepciones nominadas.

### 3.6 Variantes configurables de componentes

Este cambio requiere una nueva versión del modelo serializable. No debe implementarse como texto libre adicional porque perdería estructura en Salud, Catálogo, Figma y exportaciones.

#### Modelo propuesto

Agregar definiciones explícitas:

```ts
type ComponentVariant = {
  id: string;
  componentId: string;
  name: string;
  description: string;
  inheritsFrom?: string;
  visibleInCatalog: boolean;
};

type ComponentToken = {
  id: string;
  name: string;
  componentId: string;
  variantId: string;
  state: string;
  property: string;
  reference: string;
  platformRefs: Partial<Record<PlatformId, string>>;
  description: string;
};
```

El identificador exportado se deriva de una ruta estable, por ejemplo:

`button.primary.hover.background`

#### Editor

- Primer nivel: componente.
- Segundo nivel: variantes del componente.
- Tercer nivel: tokens de la variante.
- Acción contextual “Agregar variante” dentro del componente seleccionado.
- Plantillas iniciales para Button: Primary, Secondary, Tertiary, Destructive y Custom.
- Acciones: crear, duplicar, renombrar, heredar, eliminar y mostrar/ocultar en Catálogo.
- “Agregar token” debe crear el token dentro de la variante activa, no en “Nuevo componente”.
- Propiedad y estado se seleccionan mediante opciones controladas; el nombre técnico se previsualiza antes de crear.
- Evitar rutas duplicadas y referencias rotas.

#### Catálogo y Escenarios

- Catálogo incorpora selector de variante para el componente.
- Las variantes visibles reutilizan el renderer funcional existente; no crean una segunda biblioteca de componentes.
- El renderer recibe un mapa de tokens de la variante activa.
- Una variante personalizada puede verse en Catálogo apenas tenga las referencias mínimas resueltas.
- Escenarios elige una variante apropiada por caso y permite cambiarla cuando aporte valor a la evaluación.

#### Salud y exportación

- Salud informa variantes incompletas, referencias rotas, rutas duplicadas y tokens sin consumidor.
- Export JSON/CSS conserva la jerarquía componente / variante / estado / propiedad.
- El paquete Figma MCP genera colecciones y nombres equivalentes, sin aplanar la intención.
- La documentación HTML lista variantes, estados y tokens resueltos.

#### Migración

- Subir el esquema de proyecto de v4 a v5.
- Inferir componente, variante, estado y propiedad desde los nombres existentes.
- `button.primary.*` migra a Button / Primary.
- `button.destructive.*` migra a Button / Destructive.
- Los tokens no inferibles quedan en una variante “Legacy” editable; nunca se descartan.
- La migración debe ser idempotente y contar con fixture de proyecto v4.

## 4. Orden de implementación sin retrabajo

La iniciativa puede ejecutarse como una sola pasada, pero respetando este orden interno:

1. Añadir borrador transaccional al diálogo Proyecto.
2. Normalizar el contrato global de iconos y cambiar Mostrar grilla a Switch.
3. Consolidar el preview de layout y eliminar la vista redundante.
4. Refinar el chrome Mobile / Tablet / Desktop de Escenarios.
5. Introducir el esquema v5 de variantes y su migración.
6. Construir el editor jerárquico de variantes y tokens.
7. Conectar Catálogo, Escenarios, Salud, exportaciones, documentación y Figma MCP al nuevo modelo.
8. Ejecutar QA integral y auditorías antes de cerrar.

El orden evita diseñar Catálogo o Escenarios sobre una estructura de tokens que luego sería reemplazada.

## 5. Criterios de aceptación

### Proyecto

- Editar plataformas no modifica ningún consumidor antes de “Aplicar cambios”.
- Cancelar o cerrar permite descartar el borrador.
- Confirmar actualiza Escenarios, Salud y exportación en una sola operación.
- Se anuncia el resultado visualmente y mediante live region.

### Escenarios

- Mobile, Tablet y Desktop tienen chrome reconocible y no duplican navegación.
- Mobile muestra hamburger funcional y bottom navigation con iconos.
- Tablet usa rail con iconos e indicador activo.
- Desktop usa sidebar primaria y header de utilidades.
- Mostrar grilla es un Switch.

### Layout

- Existe un único preview de layout y ritmo.
- Mobile, landscape, Tablet y Desktop tienen proporciones distinguibles.
- Overlay y contenido comparten exactamente columnas, margen y gutter.
- No se alteran valores para acomodar la maqueta.

### Iconos

- Proyecto y Exportar muestran chevrons del mismo tamaño óptico.
- Todos los botones internos respetan el contrato común.
- No se agregan correcciones específicas por pantalla.

### Variantes

- Es posible crear Secondary y Tertiary dentro de Button.
- Cada variante puede crear y editar sus propios tokens.
- Las variantes resueltas aparecen en Catálogo usando el renderer funcional.
- Salud detecta faltantes por variante.
- JSON, CSS, documentación y Figma MCP conservan la jerarquía.
- Un proyecto v4 migra sin pérdida de datos.

## 6. QA obligatorio

- TypeScript, ESLint y pruebas de migración/exportación.
- Tests de transacción: aplicar, cancelar y descartar.
- Tests del modelo v4 → v5 y round-trip serializable.
- Auditoría visual claro/oscuro.
- Desktop y mobile reales del Laboratorio.
- Frames Mobile, Mobile horizontal, Tablet y Desktop.
- Teclado, foco, `aria-current`, diálogos y menús.
- Verificación geométrica de grilla: límites, spans, gutters y baseline.
- Storybook únicamente para los componentes internos modificados: Button, IconButton, ProjectMenu, ExportMenu y Switch.
- Impeccable y UI Skills como gate final, clasificando falsos positivos en vez de ignorarlos silenciosamente.
- No cerrar la tarea con solapamientos, overflow global, errores de consola o referencias sin resolver.

## 7. Fuera de alcance de esta pasada

- Sincronización directa y automática con Figma desde el navegador.
- Construcción arbitraria de componentes completamente nuevos sin renderer base.
- Reemplazo de la librería interna del Laboratorio.
- Cambios visuales no relacionados en Color, Tipografía o Salud.

## 8. Resultado esperado

La herramienta pasa de mostrar configuraciones aisladas a ofrecer un ciclo comprobable:

1. editar en borrador;
2. confirmar una decisión;
3. verla aplicada fielmente en layout y escenarios;
4. ampliar variantes de componentes sin quedar limitado por el preset;
5. validar salud y exportar la misma estructura sin pérdida de intención.
