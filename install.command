#!/bin/bash
set -e

# OAKAS Installer
# Double-click this file to install OAKAS

clear

BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}🌳 OAKAS Installer${RESET}"
echo -e "${DIM}Stay rooted in your trade. We'll branch into everything else.${RESET}"
echo ""
echo "This will install OAKAS on your Mac. It may ask for your password."
echo ""
read -p "Press Enter to continue (or Ctrl+C to cancel)..."
echo ""

OAKAS_DIR="$HOME/.oakas"
mkdir -p "$OAKAS_DIR"

# Step 1: Install Ollama
echo -e "${CYAN}[1/4]${RESET} Checking Ollama..."
if command -v ollama &>/dev/null; then
  echo "  ✓ Ollama already installed"
else
  echo "  ↓ Installing Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
  echo "  ✓ Ollama installed"
fi

# Step 2: Install Node.js
echo -e "${CYAN}[2/4]${RESET} Checking Node.js..."
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VER" -ge 18 ]; then
    echo "  ✓ Node.js $(node -v) already installed"
  else
    echo "  ↓ Installing Node.js..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install 22
    echo "  ✓ Node.js 22 installed"
  fi
else
  echo "  ↓ Installing Node.js..."
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
ollama pull nemotron-mini
echo "  ✓ Model ready"

# Generate default config
cat > "$OAKAS_DIR/config.yaml" << 'EOF'
model: ollama/nemotron-mini
channels:
  whatsapp:
    enabled: true
workspace: ~/.oakas/workspace
EOF

mkdir -p "$OAKAS_DIR/workspace"

echo ""
echo -e "${GREEN}${BOLD}✓ OAKAS installed successfully!${RESET}"
echo ""
echo "Next steps:"
echo "  1. Run: openclaw gateway start"
echo "  2. Scan the WhatsApp QR code with your phone"
echo "  3. Start texting your AI assistant!"
echo ""
echo -e "${DIM}Installed to: $OAKAS_DIR${RESET}"
echo ""
read -p "Press Enter to close..."
