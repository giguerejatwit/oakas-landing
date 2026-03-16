#!/bin/bash
set -e

# OAKAS Installer
# curl -fsSL https://oakas.ai/install.sh | bash

BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}🌳 OAKAS Installer${RESET}"
echo -e "${DIM}Stay rooted in your trade. We'll branch into everything else.${RESET}"
echo ""

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

if [ "$OS" != "Darwin" ] && [ "$OS" != "Linux" ]; then
  echo "❌ Unsupported OS: $OS (Mac and Linux only for now)"
  exit 1
fi

OAKAS_DIR="$HOME/.oakas"
mkdir -p "$OAKAS_DIR"

# Step 1: Install Ollama (if not installed)
echo -e "${CYAN}[1/4]${RESET} Checking Ollama..."
if command -v ollama &>/dev/null; then
  echo "  ✓ Ollama already installed"
else
  echo "  ↓ Installing Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
  echo "  ✓ Ollama installed"
fi

# Step 2: Install Node.js (if not installed)
echo -e "${CYAN}[2/4]${RESET} Checking Node.js..."
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VER" -ge 18 ]; then
    echo "  ✓ Node.js $(node -v) already installed"
  else
    echo "  ↓ Node.js too old, installing v22..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install 22
    echo "  ✓ Node.js 22 installed"
  fi
else
  echo "  ↓ Installing Node.js via nvm..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 22
  echo "  ✓ Node.js 22 installed"
fi

# Step 3: Install OpenClaw
echo -e "${CYAN}[3/4]${RESET} Installing OpenClaw..."
if command -v openclaw &>/dev/null; then
  echo "  ✓ OpenClaw already installed"
else
  npm install -g openclaw
  echo "  ✓ OpenClaw installed"
fi

# Step 4: Pull local model
echo -e "${CYAN}[4/4]${RESET} Pulling AI model (this may take a few minutes)..."
ollama pull llama3.1:8b
echo "  ✓ Model ready"

# Generate default config
cat > "$OAKAS_DIR/config.yaml" << 'EOF'
model: ollama/llama3.1:8b
channels:
  whatsapp:
    enabled: true
workspace: ~/.oakas/workspace
EOF

mkdir -p "$OAKAS_DIR/workspace"

echo ""
echo -e "${GREEN}${BOLD}✓ OAKAS installed successfully!${RESET}"
echo ""
echo -e "Next steps:"
echo -e "  1. Run: ${BOLD}openclaw gateway start${RESET}"
echo -e "  2. Scan the WhatsApp QR code with your phone"
echo -e "  3. Start texting your AI assistant!"
echo ""
echo -e "${DIM}Installed to: $OAKAS_DIR${RESET}"
echo ""
