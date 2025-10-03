#!/bin/bash#!/bin/bash
################################################################################
#
# File:     uninstall.sh
# Version:  0.0.2
# Author:   Luke de Munk
# Brief:    Uninstaller for ZyraX Home main controller and microservices
#           Deletes the application and data.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
set -e

echo "Uninstalling ZyraX Home"

APPLICATION_NAME="ZyraX_Home"
VENV_PATH="/etc/$APPLICATION_NAME/venv"
INSTALL_PATH="/etc/$APPLICATION_NAME/application"
RUNTIME_PATH="/var/lib/$APPLICATION_NAME"
DATA_PATH="$RUNTIME_PATH/data"
NGINX_CONFIGURATION="/etc/nginx/sites-available/zyrax"

# Uninstall services
echo "Stopping services..."
sudo systemctl stop zyrax_home.service 2>/dev/null || true
sudo systemctl stop zyrax_home_telegram.service 2>/dev/null || true
sudo systemctl stop zyrax_home_weather.service 2>/dev/null || true

echo "Disabling services..."
sudo systemctl disable zyrax_home.service 2>/dev/null || true
sudo systemctl disable zyrax_home_telegram.service 2>/dev/null || true
sudo systemctl disable zyrax_home_weather.service 2>/dev/null || true

echo "Removing systemd service files..."
sudo rm -f /etc/systemd/system/zyrax_home.service
sudo rm -f /etc/systemd/system/zyrax_home_telegram.service
sudo rm -f /etc/systemd/system/zyrax_home_weather.service
sudo systemctl daemon-reload

# Delete Nginx configuration
echo "Removing Nginx configuration..."
sudo rm -f "$NGINX_CONFIGURATION"
sudo rm -f /etc/nginx/sites-enabled/zyrax
sudo systemctl reload nginx || true

# Delete files and directories
echo "Removing SSL certificates..."
sudo rm -rf /etc/ssl/zyrax

echo "Removing application files..."
sudo rm -rf "$INSTALL_PATH"

echo "Removing data directories..."
sudo rm -rf "$DATA_PATH"

echo "Removing virtual environment..."
sudo rm -rf "$VENV_PATH"

# Delete packages
echo "Removing system packages..."
sudo apt remove --purge -y nginx python3-venv python3-pip
sudo apt autoremove -y
sudo apt clean

echo "Clean uninstallation complete."