#!/bin/bash
################################################################################
#
# File:     install.sh
# Version:  0.0.3
# Author:   Luke de Munk
# Brief:    Installer and updater for the ZyraX Home main controller and
#           microservices.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
set -Eeuo pipefail

APPLICATION_NAME="ZyraX_Home"
SERVICE_USER="zyraxhome"

SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPLICATION_SOURCE_PATH="$SOURCE_ROOT/application"
MAIN_FILE="$APPLICATION_SOURCE_PATH/main.py"
MAIN_SERVICE_FILE="$APPLICATION_SOURCE_PATH/services/zyrax_home.service"
REQUIREMENTS_FILE="$APPLICATION_SOURCE_PATH/requirements.txt"

SYSTEM_PATH="/etc/$APPLICATION_NAME"
VENV_PATH="$SYSTEM_PATH/venv"
INSTALL_PATH="$SYSTEM_PATH/application"
RUNTIME_PATH="/var/lib/$APPLICATION_NAME"
DATA_PATH="$RUNTIME_PATH/data"
KEYRING_ENV_FILE="$SYSTEM_PATH/keyring.env"
KEYRING_FILE="$DATA_PATH/cryptfile_pass.cfg"

SERVICES=(
    "zyrax_home.service"
    "zyrax_home_telegram.service"
    "zyrax_home_weather.service"
)

if [ "${EUID}" -ne 0 ]; then
    exec sudo /bin/bash "$0" "$@"
fi

echo "ZyraX Home main controller installer initializing"

required_files=(
    "$MAIN_FILE"
    "$MAIN_SERVICE_FILE"
    "$REQUIREMENTS_FILE"
    "$APPLICATION_SOURCE_PATH/ConfigurationManager.py"
    #"$APPLICATION_SOURCE_PATH/populate_db.py"
    "$APPLICATION_SOURCE_PATH/database_utility/__init__.py"
    "$APPLICATION_SOURCE_PATH/services/zyrax_home_telegram.service"
    "$APPLICATION_SOURCE_PATH/services/zyrax_home_weather.service"
)

for required_file in "${required_files[@]}"; do
    if [ ! -f "$required_file" ]; then
        echo "Missing required source file: $required_file" >&2
        exit 71
    fi
done

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
    echo "Creating service user '$SERVICE_USER'"
    useradd --system --home-dir "$RUNTIME_PATH" --create-home \
        --shell /usr/sbin/nologin "$SERVICE_USER"
fi

default_full_install="N"
if [ ! -x "$VENV_PATH/bin/python3" ]; then
    default_full_install="Y"
fi

echo "Perform a full system dependency installation? (Y or N) (default: $default_full_install):"
read -r full_install
full_install=${full_install:-$default_full_install}

if [[ "$full_install" =~ ^[Yy]$ ]]; then
    echo "Installing operating-system dependencies"
    apt-get update
    apt-get install -y \
        build-essential \
        liblgpio-dev \
        nginx \
        openssl \
        python3-dev \
        python3-pip \
        python3-venv \
        rsync \
        swig

    if systemctl list-unit-files apache2.service >/dev/null 2>&1; then
        systemctl disable --now apache2.service || true
    fi
elif ! command -v rsync >/dev/null 2>&1; then
    echo "rsync is required for a safe application update" >&2
    echo "Run the installer again and select the full installation option." >&2
    exit 69
fi

echo "Stopping ZyraX Home services"
systemctl stop "${SERVICES[@]}" 2>/dev/null || true

echo "Creating installation and runtime directories"
install -d -m 755 "$SYSTEM_PATH" "$INSTALL_PATH"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 750 \
    "$RUNTIME_PATH" \
    "$DATA_PATH" \
    "$DATA_PATH/.zyrax_temp" \
    "$DATA_PATH/ota" \
    "$DATA_PATH/profile_pictures"

echo "Synchronizing application files"
rsync -a --delete --exclude='/data/' \
    "$APPLICATION_SOURCE_PATH/" \
    "$INSTALL_PATH/"

chown -R root:root "$INSTALL_PATH"
find "$INSTALL_PATH" -type d -exec chmod 755 {} +
find "$INSTALL_PATH" -type f -exec chmod 644 {} +
find "$INSTALL_PATH/services" -type f -name '*.sh' -exec chmod 755 {} +

DEFAULT_PROFILE_PICTURE="$APPLICATION_SOURCE_PATH/data/profile_pictures/default_profile_picture.png"
if [ -f "$DEFAULT_PROFILE_PICTURE" ] && \
   [ ! -f "$DATA_PATH/profile_pictures/default_profile_picture.png" ]; then
    install -o "$SERVICE_USER" -g "$SERVICE_USER" -m 640 \
        "$DEFAULT_PROFILE_PICTURE" \
        "$DATA_PATH/profile_pictures/default_profile_picture.png"
fi

echo "Creating or updating the Python environment"
if [ ! -x "$VENV_PATH/bin/python3" ]; then
    python3 -m venv "$VENV_PATH"
fi

"$VENV_PATH/bin/python3" -m pip install --upgrade pip
"$VENV_PATH/bin/python3" -m pip install -r "$INSTALL_PATH/requirements.txt"
"$VENV_PATH/bin/python3" -m pip install keyrings.cryptfile

if [[ "$full_install" =~ ^[Yy]$ ]]; then
    "$VENV_PATH/bin/python3" -m pip install --no-binary=:all: lgpio
    "$VENV_PATH/bin/python3" -m pip install rpi-lgpio
fi

echo "Configuring non-interactive encrypted keyring storage"
if [ ! -f "$KEYRING_ENV_FILE" ]; then
    umask 077
    printf 'KEYRING_CRYPTFILE_PASSWORD=%s\n' "$(openssl rand -hex 32)" \
        > "$KEYRING_ENV_FILE"
fi

if ! grep -q '^KEYRING_CRYPTFILE_PASSWORD=.' "$KEYRING_ENV_FILE"; then
    echo "Missing KEYRING_CRYPTFILE_PASSWORD in $KEYRING_ENV_FILE" >&2
    exit 78
fi

if grep -q '^KEYRING_CRYPTFILE_PATH=' "$KEYRING_ENV_FILE"; then
    sed -i "s|^KEYRING_CRYPTFILE_PATH=.*|KEYRING_CRYPTFILE_PATH=$KEYRING_FILE|" \
        "$KEYRING_ENV_FILE"
else
    printf 'KEYRING_CRYPTFILE_PATH=%s\n' "$KEYRING_FILE" \
        >> "$KEYRING_ENV_FILE"
fi

chown root:root "$KEYRING_ENV_FILE"
chmod 600 "$KEYRING_ENV_FILE"

echo "Installing systemd service definitions"
for service in "${SERVICES[@]}"; do
    install -o root -g root -m 644 \
        "$INSTALL_PATH/services/$service" \
        "/etc/systemd/system/$service"
done

if [[ "$full_install" =~ ^[Yy]$ ]]; then
    echo "Creating a self-signed TLS certificate"
    install -d -o root -g root -m 755 /etc/ssl/zyrax

    if [ ! -f /etc/ssl/zyrax/zyrax.key ] || \
       [ ! -f /etc/ssl/zyrax/zyrax.crt ]; then
        openssl req -x509 -nodes -days 365 \
            -newkey rsa:2048 \
            -keyout /etc/ssl/zyrax/zyrax.key \
            -out /etc/ssl/zyrax/zyrax.crt \
            -subj "/C=NL/ST=State/L=City/O=ZyraX Home/OU=IT/CN=localhost"
    fi

    chown root:root /etc/ssl/zyrax/zyrax.key /etc/ssl/zyrax/zyrax.crt
    chmod 600 /etc/ssl/zyrax/zyrax.key
    chmod 644 /etc/ssl/zyrax/zyrax.crt

    rm -f /etc/nginx/sites-enabled/default

    cat > /etc/nginx/sites-available/zyrax <<'EOF'
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /etc/ssl/zyrax/zyrax.crt;
    ssl_certificate_key /etc/ssl/zyrax/zyrax.key;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 50M;
}

server {
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}
EOF

    ln -sf /etc/nginx/sites-available/zyrax /etc/nginx/sites-enabled/zyrax
    nginx -t
fi

echo "Validating installed Python sources"
"$VENV_PATH/bin/python3" -m compileall -q "$INSTALL_PATH"

systemctl daemon-reload
systemctl enable "${SERVICES[@]}"
systemctl restart "${SERVICES[@]}"

if command -v nginx >/dev/null 2>&1; then
    systemctl enable nginx
    systemctl restart nginx
fi

echo "Installation complete. Access the app at https://mastercontroller.local/"
