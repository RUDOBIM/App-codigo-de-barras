@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ========================================================
echo   Tiendatek GS1 - Windows Portable Build
 echo ========================================================

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta instalado.
  echo Requiere Node.js 20.19 o superior.
  echo Descarga: https://nodejs.org/
  pause
  exit /b 1
)

for /f "tokens=1" %%v in ('node -p "process.versions.node"') do set NODEVER=%%v
echo Node.js: %NODEVER%

if exist node_modules (
  echo node_modules existente detectado.
) else (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo npm install fallo. Reintentando con --legacy-peer-deps...
    call npm install --legacy-peer-deps
    if errorlevel 1 goto :error
  )
)

echo.
echo Limpiando compilacion anterior...
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release

echo.
echo Compilando React/Vite...
call npm run build
if errorlevel 1 goto :error

echo.
echo Generando EXE portable Windows x64...
call npx electron-builder --win portable --x64
if errorlevel 1 goto :error

echo.
echo ========================================================
echo   COMPILACION TERMINADA CORRECTAMENTE
echo ========================================================
dir /b release\*.exe

echo.
echo El ejecutable esta en: %CD%\release\
pause
exit /b 0

:error
echo.
echo ========================================================
echo   ERROR DURANTE LA COMPILACION
 echo ========================================================
echo Revisa el mensaje anterior.
pause
exit /b 1
