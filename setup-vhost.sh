#!/bin/bash

# Ensure script is run with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root using: sudo ./setup-vhost.sh"
  exit 1
fi

echo "1. Adding local domain entry mapping to /etc/hosts..."
if ! grep -q "carwashtest.local" /etc/hosts; then
  echo "127.0.0.1 carwashtest.local" >> /etc/hosts
  echo "Added '127.0.0.1 carwashtest.local' to /etc/hosts."
else
  echo "'carwashtest.local' entry already exists in /etc/hosts."
fi

echo "2. Copying virtual host configuration..."
cp /var/www/html/carwash/carwashtest.local.conf /etc/apache2/sites-available/carwashtest.local.conf
echo "Copied config to sites-available."

echo "3. Enabling Apache virtual host site..."
a2ensite carwashtest.local.conf

echo "4. Restarting Apache web server..."
systemctl restart apache2 || service apache2 restart

echo "🎉 Virtual Host carwashtest.local successfully configured and active!"
