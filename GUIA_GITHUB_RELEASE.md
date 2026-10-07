# TIENDATEK GS1 — GENERACIÓN AUTOMÁTICA DEL EXE

## Objetivo

Este proyecto está preparado para que GitHub compile la aplicación en un
servidor Windows real y publique automáticamente:

- `Tiendatek-GS1-1.0.0-Portable.exe`
- `Tiendatek-GS1-1.0.0-x64-Setup.exe`

El usuario final NO necesita Node.js, npm, Python, Vite ni Electron.

## La opción más práctica

1. Crear un repositorio en GitHub.
2. Subir TODOS los archivos de este ZIP al repositorio.
3. En GitHub, abrir `Actions`.
4. El workflow **Tiendatek GS1 - Windows** quedará disponible.
5. Para una prueba, seleccionar `Run workflow`.
6. Al terminar, descargar el artifact `Tiendatek-GS1-Windows`.

## Para crear una Release descargable

Crear y subir un tag, por ejemplo:

```text
v1.0.0
```

GitHub ejecutará el workflow y publicará automáticamente los dos EXE en
la sección **Releases** del repositorio.

## Actualizar a una nueva versión

Cambiar `version` en `package.json`, por ejemplo:

```json
"version": "1.0.1"
```

Después crear:

```text
v1.0.1
```

GitHub volverá a compilar y publicará los nuevos EXE.

## Qué debe descargar un usuario final

- `Portable.exe` → no requiere instalación.
- `Setup.exe` → instalación tradicional con accesos directos.

Para máxima simplicidad recomiendo distribuir el **Portable.exe**.

## Nota sobre el conflicto esbuild/Vite

El proyecto ya usa:

```text
esbuild ^0.28.2
Vite ^8.3.0
Node 22
```

y el workflow instala con:

```text
npm install --legacy-peer-deps
```

para evitar que un peer dependency antiguo bloquee la compilación.

## Requisito

La publicación automática requiere que el proyecto esté alojado en GitHub.
El workflow usa `GITHUB_TOKEN`, por lo que no es necesario crear un token
personal para publicar la Release.
