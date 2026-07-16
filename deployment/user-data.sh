#!/bin/bash
# ==============================================================================
# AWS EC2 User Data Script for Shopify Lite Deployment
# Target OS: Ubuntu 22.04 LTS or 24.04 LTS
# Runs as root during the initial boot of the EC2 instance.
# Logs are written to /var/log/user-data.log
# ==============================================================================

# Direct logs to /var/log/user-data.log
exec > >(tee -i /var/log/user-data.log) 2>&1
echo "=== Starting deployment script at $(date) ==="

# ------------------------------------------------------------------------------
# 1. CONFIGURATION PARAMETERS (Update these or inject via Parameter Store / Env)
# ------------------------------------------------------------------------------
REPO_URL="https://github.com/sukirthgaur/ShopifyLite.git" # Replace with your repo HTTPS URL
APP_DIR="/var/www/ShopifyLite"
SYSTEM_USER="ubuntu" # Default user for AWS Ubuntu AMIs

# Production Environment Variables - REPLACE THESE WITH ACTUAL VALUES IN LAUNCH TEMPLATE
DATABASE_URL="postgresql://db_user:db_password@your-rds-endpoint.amazonaws.com:5432/your_db_name"
JWT_SECRET="generate-a-secure-random-32-character-key-here"
JWT_EXPIRES_IN="7d"
PORT=5000
FRONTEND_URL="*" # Set to your actual domain name/IP for CORS security

# ------------------------------------------------------------------------------
# 2. INSTALL SYSTEM DEPENDENCIES & NODE.JS
# ------------------------------------------------------------------------------
echo "Updating package list and upgrading system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

echo "Installing curl, git, nginx, build essentials, and database utilities..."
apt-get install -y curl git nginx build-essential netcat-openbsd postgresql-client

echo "Installing Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installations
node -v
npm -v
nginx -v

# Install PM2 globally to manage node processes
npm install -g pm2

# ------------------------------------------------------------------------------
# 3. PREPARE DIRECTORIES AND CLONE REPOSITORY
# ------------------------------------------------------------------------------
echo "Preparing directories..."
mkdir -p "$APP_DIR"
chown -R $SYSTEM_USER:$SYSTEM_USER "$APP_DIR"

echo "Cloning repository..."
# Run git commands as the ubuntu user to avoid permission conflicts later
sudo -u $SYSTEM_USER git clone "$REPO_URL" "$APP_DIR"

# ------------------------------------------------------------------------------
# 4. CONFIGURING & BUILDING BACKEND
# ------------------------------------------------------------------------------
echo "Configuring Backend..."
BACKEND_DIR="$APP_DIR/backend"

# Create backend .env file
sudo -u $SYSTEM_USER tee "$BACKEND_DIR/.env" > /dev/null <<EOF
DATABASE_URL="$DATABASE_URL"
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="$JWT_EXPIRES_IN"
PORT=$PORT
FRONTEND_URL="$FRONTEND_URL"
EOF

# Create uploads directory (needed by Multer for product images)
echo "Creating uploads directory..."
sudo -u $SYSTEM_USER mkdir -p "$BACKEND_DIR/uploads"

# Install dependencies and build backend
echo "Installing backend dependencies..."
cd "$BACKEND_DIR"
sudo -u $SYSTEM_USER npm install

echo "Generating Prisma Client..."
sudo -u $SYSTEM_USER npx prisma generate

# Wait for database port to be open to prevent boot-time connection races
echo "Waiting for database connectivity on port 5432..."
DB_HOST=$(echo "$DATABASE_URL" | sed -e 's/.*@//' -e 's/:.*//')
for i in {1..30}; do
  if nc -z -w3 "$DB_HOST" 5432; then
    echo "Database is reachable!"
    break
  fi
  echo "Database not reachable yet. Retrying in 5 seconds... ($i/30)"
  sleep 5
done

echo "Running Database Migrations on RDS..."
# Uses Prisma deploy migrate which does not prompt for dev confirmations
sudo -u $SYSTEM_USER npx prisma migrate deploy

echo "Seeding database (optional - uncomment if seeding is required)..."
# sudo -u $SYSTEM_USER npm run db:seed

echo "Building TypeScript backend..."
sudo -u $SYSTEM_USER npm run build

# ------------------------------------------------------------------------------
# 5. CONFIGURING & BUILDING FRONTEND
# ------------------------------------------------------------------------------
echo "Configuring Frontend..."
FRONTEND_DIR="$APP_DIR/frontend"

# Ensure frontend .env.production exists (already included in git, but creating just in case)
sudo -u $SYSTEM_USER tee "$FRONTEND_DIR/.env.production" > /dev/null <<EOF
VITE_API_URL=/api
EOF

echo "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
sudo -u $SYSTEM_USER npm install

echo "Building frontend static assets..."
sudo -u $SYSTEM_USER npm run build

# Ensure correct permissions for www-data to access built frontend files
chown -R $SYSTEM_USER:www-data "$FRONTEND_DIR/dist"
chmod -R 755 "$FRONTEND_DIR/dist"

# ------------------------------------------------------------------------------
# 6. PM2 PROCESS CONFIGURATION
# ------------------------------------------------------------------------------
echo "Setting up PM2 process manager..."
cd "$BACKEND_DIR"

# Start the application as the system user
sudo -u $SYSTEM_USER pm2 start dist/src/server.js --name "shopify-lite-backend" --update-env

# Ensure PM2 restarts on system boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u $SYSTEM_USER --hp /home/$SYSTEM_USER
sudo -u $SYSTEM_USER pm2 save

# ------------------------------------------------------------------------------
# 7. NGINX REVERSE PROXY CONFIGURATION
# ------------------------------------------------------------------------------
echo "Configuring Nginx..."

# Write custom nginx configuration
cat > /etc/nginx/sites-available/shopify-lite <<EOF
server {
    listen 80;
    server_name _;

    root $FRONTEND_DIR/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    client_max_body_size 10M;
}
EOF

# Enable the new configuration
ln -sf /etc/nginx/sites-available/shopify-lite /etc/nginx/sites-enabled/

# Disable default nginx configuration
rm -f /etc/nginx/sites-enabled/default

# Test Nginx and restart service
nginx -t && systemctl restart nginx

echo "=== Deployment script completed at $(date) ==="
