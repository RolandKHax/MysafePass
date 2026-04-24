#!/bin/bash
# Start script for MSP with Ollama support

echo "🚀 MSP - Startup Script"
echo "======================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "📛 Stopping services..."
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null
        echo "✅ Ollama stopped"
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    exit 0
}

trap cleanup EXIT INT TERM

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed."
    echo ""
    echo "To install Ollama, run:"
    echo "  bash install-ollama.sh"
    echo ""
    echo "Or visit: https://ollama.ai"
    exit 1
fi

echo "✅ Ollama detected"
echo ""

# Check if a model is available
MODELS=$(ollama list)
if [ -z "$MODELS" ] || [ "$MODELS" = "NAME" ]; then
    echo "⚠️  No models found. Downloading Mistral..."
    ollama pull mistral
fi

# Start Ollama
echo "🔄 Starting Ollama..."
ollama serve &
OLLAMA_PID=$!
sleep 2

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Failed to start Ollama"
    exit 1
fi

echo "✅ Ollama running (PID: $OLLAMA_PID)"
echo ""

# Start Backend
echo "🔄 Starting Backend..."
cd backend

# Check if Python environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate venv and install/run
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

pip install -q -r requirements.txt

python run.py &
BACKEND_PID=$!

cd ..

sleep 2

# Check if backend is running
if ! curl -s http://localhost:5000/api/version > /dev/null; then
    echo "⚠️  Backend may not be ready yet"
fi

echo "✅ Backend running (PID: $BACKEND_PID)"
echo ""

# Start Frontend
echo "🔄 Starting Frontend..."
if command -v pnpm &> /dev/null; then
    pnpm run dev &
elif command -v npm &> /dev/null; then
    npm run dev &
else
    echo "❌ Node.js package manager not found"
    exit 1
fi

FRONTEND_PID=$!
sleep 3

echo "✅ Frontend running (PID: $FRONTEND_PID)"
echo ""
echo "======================================"
echo "🎉 MSP is running!"
echo "======================================"
echo ""
echo "📱 Frontend:  http://localhost:5173"
echo "🔌 Backend:   http://localhost:5000"
echo "🤖 Ollama:    http://localhost:11434"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all processes
wait
