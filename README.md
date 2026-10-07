# Tiendatek GS1 — Windows Portable

Generador de códigos EAN-13 / GTIN-13 basado en React + Vite + Electron.

## Distribución recomendada

El proyecto incluye GitHub Actions para compilar automáticamente en
`windows-latest` y publicar:

- EXE Portable
- EXE Installer

Ver `GUIA_GITHUB_RELEASE.md`.

## Compilación local

En Windows:

```bat
BUILD_WINDOWS.bat
```

## Importante

El programa calcula y valida el dígito verificador del GTIN-13, pero no
inventa un prefijo GS1 empresarial. La asignación comercial debe corresponder
a la asignación de GS1 aplicable a la empresa.
