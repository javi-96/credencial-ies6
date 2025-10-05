# Credencial Estudiantil (PWA)
App web instalable (PWA) sin backend que muestra una credencial digital con estado **Activo/Inactivo**.

## Características
- Registro por Legajo + DNI + Nombre + Apellido.
- Búsqueda local de Carrera/Año desde `assets/students.json`.
- Muestra estado **ACTIVO/INACTIVO** (sin QR, sin verificación externa).
- PWA: funciona offline, se puede instalar en Android/iOS.
- Exportación a PDF usando `Imprimir` del navegador.

## Cómo usar
1. Subí esta carpeta a **GitHub Pages** (o a cualquier hosting estático).
2. Editá `assets/students.json` con el padrón real.
3. Abrí la URL en el celular y elegí **Agregar a la pantalla de inicio**.
4. Para generar PDF: botón "Descargar PDF" → Seleccioná "Guardar como PDF".

## Estructura
- `index.html` — UI principal
- `styles.css` — estilos
- `app.js` — lógica (registro, lookup, render de credencial)
- `manifest.json` — PWA manifest
- `sw.js` — Service Worker (offline)
- `assets/students.json` — padrón de ejemplo
- `img/icon-192.png`, `img/icon-512.png` — íconos app

## Nota institucional
- La institución controla el **estado** en el padrón (archivo JSON o futuro backend).
- Esta app **no** requiere verificación del comercio; sólo muestra Activo/Inactivo.


## Esquema del padrón (`assets/students.json`)
Lista de objetos JSON con los campos exactos:
```json
[
  {
    "legajo": "2025-0001",
    "dni": "40111222",
    "nombre": "Ana",
    "apellido": "Paredes",
    "carrera": "Profesorado en Informática",
    "anio": 3,
    "estado": "ACTIVO"
  }
]
```
- `estado`: usar exactamente `ACTIVO` o `INACTIVO`.
- Podés agregar más campos si querés (p. ej. `foto_url`), la app ignorará los no usados.

## Personalización rápida
- **Nombre de institución**: editar `CONFIG.institucion` en `app.js`.
- **Colores**: cambiar variables CSS en `styles.css` (`--brand`, `--primary`, etc.).
- **Logo**: reemplazar `img/logo.png` por tu logo (ideal 512×512 PNG).

