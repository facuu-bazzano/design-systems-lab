# Laboratorio de Sistemas de Diseño

Prueba de concepto pública para explorar, configurar, previsualizar, documentar y exportar la base de un sistema de diseño antes de llevarla manualmente a Figma.

## Qué incluye

- Proyecto configurable con portada y objetivo web, mobile o ambos.
- Paletas con escalas, tipografía, espaciado, dimensiones, radios, bordes, sombras, opacidad, layout y grupos libres.
- Temas y tokens semánticos referenciados a foundations.
- Preview inmediato web/mobile y validaciones iniciales de contraste y consistencia.
- Persistencia local, exportación/importación del proyecto, tokens JSON y variables CSS.

## Desarrollo

Requiere Node.js 22.13 o superior.

```bash
npm install
npm run dev
```

Validación:

```bash
npm run build
npm test
```

El proyecto usa vinext y genera una salida ESM compatible con Cloudflare Workers. No requiere cuentas, backend ni variables de entorno.
