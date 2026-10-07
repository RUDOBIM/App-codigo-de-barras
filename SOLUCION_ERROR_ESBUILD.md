# Solución del error `Conflicting peer dependency: esbuild@0.28.2`

## Causa

El proyecto tenía:

```json
"vite": "^8.3.0",
"esbuild": "^0.25.0"
```

Vite 8 requiere una versión compatible de esbuild de la rama `0.27.x` o `0.28.x`. Por eso npm detectaba un conflicto entre el `esbuild` declarado en el proyecto y el que Vite necesita.

## Corrección aplicada

Ahora el proyecto utiliza:

```json
"vite": "^8.3.0",
"esbuild": "^0.28.2"
```

También se añadió:

```json
"engines": {
  "node": ">=20.19.0",
  "npm": ">=10.0.0"
}
```

## Si Windows conserva la instalación anterior

Desde CMD, dentro de la carpeta del proyecto:

```bat
rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm cache verify
npm install
npm run build
npx electron-builder --win portable --x64
```

Si npm todavía informa un conflicto de peer dependencies:

```bat
npm install --legacy-peer-deps
npm run build
npx electron-builder --win portable --x64
```

## Resultado

El ejecutable queda en:

```text
release\Tiendatek-GS1-1.0.0-Portable.exe
```
