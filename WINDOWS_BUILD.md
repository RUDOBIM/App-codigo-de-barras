# Compilación Windows

## Opción A — PC Windows
1. Instalar Node.js LTS.
2. Abrir esta carpeta.
3. Ejecutar `build-windows.bat`.
4. El EXE aparecerá en `release/`.

## Opción B — GitHub Actions (no requiere Windows local)
1. Subir este proyecto a un repositorio GitHub.
2. Abrir Actions.
3. Ejecutar `Build Windows Portable EXE` con `Run workflow`.
4. Descargar el artifact `Tiendatek-GS1-Windows-Portable`.

El workflow utiliza `windows-latest` para construir el binario Windows de forma nativa.
