#!/bin/bash
################################################################################
#
# File:     install.sh
# Version:  0.0.2
# Author:   Luke de Munk
# Brief:    Installer for ZyraX Home main controller and microservices
#           Uses a Python virtual environment for dependencies.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
MAIN_FILE="application/main.py"
MAIN_SERVICE_FILE="application/services/zyrax_home.service"
REQUIREMENTS_FILE="application/requirements.txt"

APPLICATION_NAME="ZyraX_Home"
VENV_PATH="/etc/$APPLICATION_NAME/venv"
INSTALL_PATH="/etc/$APPLICATION_NAME/application"
RUNTIME_PATH="/var/lib/$APPLICATION_NAME"
DATA_PATH="$RUNTIME_PATH/data"

echo "ZyraX Home main controller installer initializing"

# Check required files
if [ ! -f "$MAIN_FILE" ]; then
    echo "Missing main application source file"
    exit 71
fi
if [ ! -f "$MAIN_SERVICE_FILE" ]; then
    echo "Missing main service file"
    exit 71
fi
if [ ! -f "$REQUIREMENTS_FILE" ]; then
    echo "Missing requirements file"
    exit 71
fi

echo "Overwrite data? (Y or N) (default: Y):"
read -r full_install
full_install=${full_install:-Y}

if [ "$full_install" = "Y" ] || [ "$full_install" = "y" ]; then
    echo "Installing application as new installation..."

    # Update system and install Nginx & venv tools
    sudo apt update
    sudo apt install -y nginx python3-venv python3-pip
    sudo rm /etc/nginx/sites-enabled/default

    # Create production folder
    sudo mkdir -p "$INSTALL_PATH"
    sudo mkdir -p "$DATA_PATH"
    sudo mkdir -p "$DATA_PATH/.zyrax_temp"

    # Set data directory owner to ZyraXHome
    sudo chown -R ZyraXHome:ZyraXHome $RUNTIME_PATH

    # Set permissions for data directory
    sudo chmod -R 700 $DATA_PATH

    # Copy application files
    sudo cp -R application/* "$INSTALL_PATH/"

    # Create virtual environment
    sudo python3 -m venv "$VENV_PATH"
    sudo chown -R $USER:$USER "$VENV_PATH"

    # Install dependencies inside venv using absolute paths
    "$VENV_PATH/bin/python3" -m pip install --upgrade pip
    "$VENV_PATH/bin/pip3" install -r "$INSTALL_PATH/requirements.txt"
    "$VENV_PATH/bin/pip3" install rpi-lgpio keyrings.cryptfile

    # Generate self-signed SSL keys
    sudo mkdir -p /etc/ssl/zyrax
    sudo openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout /etc/ssl/zyrax/zyrax.key \
        -out /etc/ssl/zyrax/zyrax.crt \
        -subj "/C=NL/ST=State/L=City/O=ZyraX Home/OU=IT/CN=localhost"
    sudo chown root:root /etc/ssl/zyrax/*
    sudo chmod 600 /etc/ssl/zyrax/zyrax.key
    sudo chmod 644 /etc/ssl/zyrax/zyrax.crt

    # Install systemd service files
    sudo cp "$INSTALL_PATH/services/zyrax_home.service" /etc/systemd/system/
    sudo cp "$INSTALL_PATH/services/zyrax_home_telegram.service" /etc/systemd/system/
    sudo cp "$INSTALL_PATH/services/zyrax_home_weather.service" /etc/systemd/system/

    # Enable and start services
    sudo systemctl daemon-reload
    sudo systemctl enable zyrax_home.service
    sudo systemctl enable zyrax_home_telegram.service
    sudo systemctl enable zyrax_home_weather.service
    sudo systemctl enable nginx

    sudo systemctl start zyrax_home.service
    sudo systemctl start zyrax_home_telegram.service
    sudo systemctl start zyrax_home_weather.service
    sudo systemctl start nginx

    # Setup Nginx server block
    NGINX_CONFIGURATION="/etc/nginx/sites-available/zyrax"
    sudo bash -c "cat > $NGINX_CONFIGURATION" <<EOL
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /etc/ssl/zyrax/zyrax.crt;
    ssl_certificate_key /etc/ssl/zyrax/zyrax.key;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name localhost;
    return 301 https://\$host\$request_uri;
}
EOL

    # Put server in available sites and check Nginx configuration
    sudo ln -sf /etc/nginx/sites-available/zyrax /etc/nginx/sites-enabled/zyrax
    sudo nginx -t
    sudo systemctl restart nginx

    echo "Installation complete. Access the app at https://mastercontroller.local/"

else
    echo "Only updating application files (database and venv remain intact)..."
    #Add service updates
    sudo rsync -av --exclude="data/" application/ "$INSTALL_PATH/"
fi