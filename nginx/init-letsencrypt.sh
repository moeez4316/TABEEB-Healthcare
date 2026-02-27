#!/bin/sh
set -e

compose_file="${1:-docker-compose.yml}"

if [ -z "$SITE_ADDRESS" ] && [ -f ./.env ]; then
  SITE_ADDRESS=$(grep -E '^SITE_ADDRESS=' ./.env | head -n1 | cut -d= -f2- | sed 's/^"//;s/"$//')
fi

if [ -z "$LETSENCRYPT_EMAIL" ] && [ -f ./.env ]; then
  LETSENCRYPT_EMAIL=$(grep -E '^LETSENCRYPT_EMAIL=' ./.env | head -n1 | cut -d= -f2- | sed 's/^"//;s/"$//')
fi

if [ -z "$SITE_ADDRESS" ]; then
  SITE_ADDRESS="localhost"
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required to create a temporary certificate."
  exit 1
fi

data_path="./nginx/certbot"
live_path="$data_path/conf/live/$SITE_ADDRESS"

if [ ! -f "$live_path/fullchain.pem" ]; then
  echo "Creating a temporary self-signed certificate for $SITE_ADDRESS..."
  mkdir -p "$live_path"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$live_path/privkey.pem" \
    -out "$live_path/fullchain.pem" \
    -subj "/CN=$SITE_ADDRESS"
fi

echo "Starting Nginx for ACME challenge..."
docker compose -f "$compose_file" up -d nginx

if [ "$SITE_ADDRESS" = "localhost" ] || [ -z "$LETSENCRYPT_EMAIL" ]; then
  echo "LETSENCRYPT_EMAIL not set or SITE_ADDRESS is localhost. Using a self-signed certificate."
  exit 0
fi

# Remove the temporary self-signed cert so Certbot can create a proper lineage.
if [ -f "$live_path/fullchain.pem" ] && [ ! -L "$live_path/fullchain.pem" ]; then
  echo "Removing temporary self-signed certificate..."
  rm -rf "$live_path"
fi

echo "Requesting Let's Encrypt certificate for $SITE_ADDRESS..."
docker compose -f "$compose_file" run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$SITE_ADDRESS" \
  --email "$LETSENCRYPT_EMAIL" \
  --agree-tos \
  --no-eff-email

echo "Reloading Nginx..."
docker compose -f "$compose_file" exec nginx nginx -s reload
