@echo off
REM Start script for MSP with Ollama support - Windows version

echo.
echo ========================================
echo 🚀 MSP - Startup Script (Windows)
echo ========================================
echo.

REM Check if Ollama is installed
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Ollama is not installed.
    echo.
    echo Download Ollama from: https://ollama.ai/download/windows
    echo.
    pause
    exit /b 1
)

echo ✅ Ollama detected
echo.

REM Check if a model is available
for /f "tokens=*" %%i in ('ollama list 2^>nul') do (
    set "MODELS=%%i"
    goto :models_checked
)
:models_checked

if "%MODELS%"=="" (
    echo ⚠️  No models found. Downloading Mistral...
    call ollama pull mistral
)

echo.
echo ☕ Note: Ollama typically starts automatically on Windows
echo ✅ Ollama support enabled (running on localhost:11434)
echo.

REM Start Backend
echo 🔄 Starting Backend...
cd backend

if not exist venv (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

pip install -q -r requirements.txt

start "MSP Backend" python run.py

cd ..

timeout /t 2 /nobreak

echo ✅ Backend starting (http://localhost:5000)
echo.

REM Start Frontend
echo 🔄 Starting Frontend...

if exist node_modules (
    echo ✅ Dependencies already installed
) else (
    echo 📦 Installing dependencies...
    call npm install || call pnpm install
)

start "MSP Frontend" cmd /k npm run dev

echo.
echo ====================================
echo 🎉 MSP is starting!
echo ====================================
echo.
echo 📱 Frontend:  http://localhost:5173
echo 🔌 Backend:   http://localhost:5000
echo 🤖 Ollama:    http://localhost:11434
echo.
echo Both windows should open or run in background...
echo.
pause
