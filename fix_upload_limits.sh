#!/bin/bash
echo "Fixing Nginx client_max_body_size..."
sed -i '/server_name carwash.local;/a\    client_max_body_size 64M;' /etc/nginx/sites-enabled/carwash.local

echo "Fixing PHP upload limits..."
sed -i 's/^upload_max_filesize = 2M/upload_max_filesize = 64M/' /etc/php/8.3/fpm/php.ini
sed -i 's/^post_max_size = 8M/post_max_size = 64M/' /etc/php/8.3/fpm/php.ini

echo "Restarting services..."
nginx -t && systemctl reload nginx
systemctl restart php8.3-fpm

echo "Done! Limits increased to 64MB."
