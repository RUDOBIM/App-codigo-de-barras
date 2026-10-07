@echo off
setlocal
echo ==============================================
echo   TIENDATEK GS1 - BUILD WINDOWS
echo ==============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta instalado.
  echo Para una compilacion sin instalar nada en esta PC,
  echo usa GitHub Actions siguiendo GUIA_GITHUB_RELEASE.md
  pause
  exit /b 1
)
node -v
npm -v
echo.
echo Instalando dependencias...
call npm install --legacy-peer-deps --no-audit --no-fund
if errorlevel 1 goto :error
echo.
echo Compilando...
call npm run build
if errorlevel 1 goto :error
echo.
echo Generando EXE...
call npx electron-builder --win --x64
if errorlevel 1 goto :error
echo.
echo ==============================================
echo BUILD COMPLETADO
echo Revisa la carpeta release\
echo ==============================================
pause
exit /b 0
:error
echo.
echo ==============================================
echo ERROR DURANTE LA COMPILACION
echo ==============================================
pause
exit /b 1
