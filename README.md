# Laboratorio de Sistemas de DiseÃ±o

Prueba de concepto pÃºblica para explorar, configurar, previsualizar, documentar y exportar la base de un sistema de diseÃ±o antes de llevarla manualmente a Figma.

Sitio pÃºblico: [facuu-bazzano.github.io/design-systems-lab](https://facuu-bazzano.github.io/design-systems-lab/)

## QuÃ© incluye

- Proyecto configurable con portada y objetivo web, mobile o ambos.
- Paletas con escalas, tipografÃ­a, espaciado, dimensiones, radios, bordes, sombras, opacidad, layout y grupos libres.
- Temas y tokens semÃ¡nticos referenciados a foundations.
- Preview inmediato web/mobile y validaciones iniciales de contraste y consistencia.
- Persistencia local, exportaciÃ³n/importaciÃ³n del proyecto, tokens JSON y variables CSS.

## Desarrollo

Requiere Node.js 22.13 o superior.

```bash
npm install
npm run dev
```

ValidaciÃ³n:

```bash
npm run build
npm test
```

El proyecto usa vinext y genera una salida ESM compatible con Cloudflare Workers. No requiere cuentas, backend ni variables de entorno.

La rama `main` tambiÃ©n genera una exportaciÃ³n estÃ¡tica con la ruta base `/design-systems-lab` y la publica automÃ¡ticamente mediante GitHub Pages.
