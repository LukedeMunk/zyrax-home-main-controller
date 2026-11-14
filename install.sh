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
INSTALL_MODE="update"

case "${1:-}" in
    "")
        ;;
    --fresh)
        INSTALL_MODE="fresh"
        ;;
    --help|-h)
        echo "Usage: sudo bash install.sh [--fresh]"
        echo "  --fresh  Archive existing app data and install with new keys"
        exit 0
        ;;
    *)
        echo "Unknown option: $1" >&2
        echo "Usage: sudo bash install.sh [--fresh]" >&2
        exit 64
        ;;
esac

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
    "$APPLICATION_SOURCE_PATH/services/nginx_configuration"
    "$APPLICATION_SOURCE_PATH/static/images/favicon.ico"
    "$APPLICATION_SOURCE_PATH/static/images/apple-touch-icon.png"
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

for dependency in nginx openssl; do
    if ! command -v "$dependency" >/dev/null 2>&1; then
        echo "$dependency is required. Run the installer with the full installation option." >&2
        exit 69
    fi
done

echo "Stopping ZyraX Home services"
systemctl stop "${SERVICES[@]}" 2>/dev/null || true

if [ "$INSTALL_MODE" = "fresh" ]; then
    BACKUP_ROOT="/var/backups/$APPLICATION_NAME"
    BACKUP_PATH="$BACKUP_ROOT/$(date +%Y%m%d-%H%M%S)"

    if [ -d "$DATA_PATH" ] || [ -f "$KEYRING_ENV_FILE" ]; then
        echo "Archiving existing application data to $BACKUP_PATH"
        install -d -o root -g root -m 700 "$BACKUP_ROOT" "$BACKUP_PATH"

        if [ -d "$DATA_PATH" ]; then
            mv "$DATA_PATH" "$BACKUP_PATH/data"
        fi

        if [ -f "$KEYRING_ENV_FILE" ]; then
            mv "$KEYRING_ENV_FILE" "$BACKUP_PATH/keyring.env"
        fi
    fi
fi

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

echo "Configuring Nginx and local TLS"
TLS_DIRECTORY="/etc/ssl/zyrax"
TLS_KEY="$TLS_DIRECTORY/zyrax.key"
TLS_CERT="$TLS_DIRECTORY/zyrax.crt"
install -d -o root -g root -m 755 "$TLS_DIRECTORY"

(
    umask 077
    tls_staging="$(mktemp -d "$TLS_DIRECTORY/.tls-XXXXXX")"
    trap 'rm -f "$tls_staging/zyrax.key" "$tls_staging/zyrax.crt"; rmdir "$tls_staging"' EXIT
    signing_key="$TLS_KEY"
    if [ ! -s "$TLS_KEY" ]; then
        signing_key="$tls_staging/zyrax.key"
        openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$signing_key"
    fi

    if [ "$signing_key" != "$TLS_KEY" ] || \
       ! openssl x509 -in "$TLS_CERT" -noout -checkend 2592000 >/dev/null 2>&1 || \
       ! openssl x509 -in "$TLS_CERT" -noout -ext subjectAltName 2>/dev/null |
           grep -Fq 'DNS:mastercontroller.home, DNS:mastercontroller.local, DNS:localhost'; then
        echo "Issuing a self-signed certificate for mastercontroller.home"
        openssl req -x509 -sha256 -days 365 -key "$signing_key" \
            -out "$tls_staging/zyrax.crt" -subj "/CN=mastercontroller.home" \
            -addext "subjectAltName=DNS:mastercontroller.home,DNS:mastercontroller.local,DNS:localhost" \
            -addext "basicConstraints=critical,CA:FALSE" \
            -addext "extendedKeyUsage=serverAuth"
        if [ "$signing_key" != "$TLS_KEY" ]; then
            mv -f "$signing_key" "$TLS_KEY"
        fi
        chmod 644 "$tls_staging/zyrax.crt"
        mv -f "$tls_staging/zyrax.crt" "$TLS_CERT"
    fi
)

chown root:root "$TLS_KEY" "$TLS_CERT"
chmod 600 "$TLS_KEY"
chmod 644 "$TLS_CERT"

install -o root -g root -m 644 "$INSTALL_PATH/services/nginx_configuration" \
    /etc/nginx/sites-available/zyrax
ln -sfn /etc/nginx/sites-available/zyrax /etc/nginx/sites-enabled/zyrax
rm -f /etc/nginx/sites-enabled/default
nginx -t

echo "Validating installed Python sources"
"$VENV_PATH/bin/python3" -m compileall -q "$INSTALL_PATH"

systemctl daemon-reload
systemctl enable "${SERVICES[@]}"
systemctl restart "${SERVICES[@]}"

systemctl enable nginx
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
else
    systemctl start nginx
fi

echo "Installation complete. Access the app at https://mastercontroller.home/"
