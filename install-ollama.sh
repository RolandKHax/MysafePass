#!/bin/bash
# Installation script for Ollama with LLM models

echo "🚀 MSP - Ollama Installation Script"
echo "===================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📍 Detected: Linux"
    echo ""
    echo "Installing Ollama..."
    curl https://ollama.ai/install.sh | sh
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📍 Detected: macOS"
    echo ""
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "📦 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    echo "Installing Ollama via Homebrew..."
    brew install ollama
    
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    echo "📍 Detected: Windows"
    echo ""
    echo "Download Ollama from: https://ollama.ai/download/windows"
    echo "Run the installer and follow the setup instructions."
    echo ""
    read -p "Press Enter once you've installed Ollama..."
    
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

echo ""
echo "✅ Ollama installation complete!"
echo ""
echo "📥 Downloading LLM models..."
echo ""

# Download models
echo "1️⃣  Downloading Mistral (recommended for MSP)..."
ollama pull mistral

echo ""
echo "2️⃣  Downloading Neural Chat (optional)..."
read -p "Do you want to download neural-chat? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ollama pull neural-chat
fi

echo ""
echo "3️⃣  Downloading Llama2 (optional)..."
read -p "Do you want to download llama2? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ollama pull llama2
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To use Ollama with MSP:"
echo "1. Start Ollama: ollama serve"
echo "2. Leave it running in the background"
echo "3. Start your MSP backend and frontend normally"
echo ""
echo "Available models:"
ollama list
