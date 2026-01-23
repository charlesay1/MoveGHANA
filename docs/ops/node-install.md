# Node.js (User-space) Installation

## Preferred: nvm
```bash
export NVM_DIR="$HOME/.nvm"
mkdir -p "$NVM_DIR"
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"

nvm install --lts
nvm use --lts
node -v
npm -v
```

## Fallback: Node binary tarball (no sudo)
```bash
mkdir -p "$HOME/.local/node"
cd "$HOME/.local/node"
# Example for Linux x64; adjust version as needed
curl -fsSL https://nodejs.org/dist/v20.15.1/node-v20.15.1-linux-x64.tar.xz | tar -xJ --strip-components=1
export PATH="$HOME/.local/node/bin:$PATH"
node -v
npm -v
```

## Notes
- This environment currently cannot resolve external hosts (DNS issue). The nvm install attempt failed due to `raw.githubusercontent.com` not resolving.
- Once DNS is restored, rerun the preferred nvm steps above.
