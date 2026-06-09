@echo off
REM MEGATAMA Website Setup Script for Windows
REM This script sets up the development environment

echo.
echo 🚀 MEGATAMA Website Setup
echo ================================
echo.

REM Check Node.js installation
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i

echo ✓ Node.js %NODE_VERSION% detected
echo ✓ NPM %NPM_VERSION% detected

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo ✓ Dependencies installed successfully

REM Create necessary directories
echo.
echo 📁 Creating directories...
if not exist "src\assets\images" mkdir src\assets\images
if not exist "src\assets\videos" mkdir src\assets\videos
echo ✓ Directories created

echo.
echo ================================
echo ✓ Setup completed successfully!
echo.
echo 📝 Next steps:
echo   1. Run 'npm run dev' to start development server
echo   2. Open http://localhost:3000 in your browser
echo   3. Edit files in src/ and index.html
echo   4. Run 'npm run build' for production
echo.
echo 📚 Documentation: See README.md
echo ================================
echo.

pause
