#!/bin/bash
# ==============================================================================
# Shopify Lite Deployment Diagnostic & Verification Script
# Run this on your EC2 instance: bash check-status.sh
# ==============================================================================

# Formatting Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}          SHOPIFY LITE DEPLOYMENT CHECKER            ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo "Running diagnostics..."
echo ""

errors=0

# Helper function to print results
print_result() {
    local status=$1
    local message=$2
    if [ "$status" -eq 0 ]; then
        echo -e "[ ${GREEN}OK${NC} ] $message"
    else
        echo -e "[ ${RED}FAIL${NC} ] $message"
        errors=$((errors + 1))
    fi
}

# 1. Check System User (run diagnostic check)
echo -e "${YELLOW}--- 1. System Services ---${NC}"

# Check Nginx Service
systemctl is-active --quiet nginx
print_result $? "Nginx service is running"

# Check Nginx config syntax
nginx -t >/dev/null 2>&1
print_result $? "Nginx configuration syntax is valid"

# Check Nginx listening on port 80
netstat -tuln | grep -q ":80 " || ss -tuln | grep -q ":80 "
print_result $? "Port 80 (HTTP) is listening"

# 2. Check PM2 Node application
echo -e ""
echo -e "${YELLOW}--- 2. Backend Application (PM2) ---${NC}"

# Check if PM2 is running the backend app
sudo -u ubuntu pm2 status | grep -q "shopify-lite-backend"
print_result $? "PM2 process 'shopify-lite-backend' is registered"

# Check if the process is 'online'
pm2_status=$(sudo -u ubuntu pm2 status | grep "shopify-lite-backend" | awk '{print $18}')
# Fallback in case table layout differs slightly
if [ -z "$pm2_status" ]; then
    pm2_status=$(sudo -u ubuntu pm2 desc shopify-lite-backend | grep "status" | awk '{print $4}')
fi

if [[ "$pm2_status" == *"online"* ]]; then
    print_result 0 "PM2 process status is 'online'"
else
    print_result 1 "PM2 process status is '$pm2_status' (should be 'online')"
fi

# Check if Backend is responding on port 5000
backend_health=$(curl -s http://127.0.0.1:5000/api/health)
if [[ "$backend_health" == *"Shopify Lite API is running"* ]]; then
    print_result 0 "Backend API is responding on port 5000"
else
    print_result 1 "Backend API not responding on port 5000 (Health Check Response: '$backend_health')"
fi

# 3. Check Files and Folders
echo -e ""
echo -e "${YELLOW}--- 3. Filesystem and Assets ---${NC}"

# Check Frontend distribution folder exists
if [ -d "/var/www/ShopifyLite/frontend/dist" ] && [ -f "/var/www/ShopifyLite/frontend/dist/index.html" ]; then
    print_result 0 "Frontend compiled assets exist in /var/www/ShopifyLite/frontend/dist"
else
    print_result 1 "Frontend compiled assets (/var/www/ShopifyLite/frontend/dist/index.html) are missing"
fi

# Check Nginx access to Frontend assets
sudo -u www-data test -r "/var/www/ShopifyLite/frontend/dist/index.html"
print_result $? "Nginx user (www-data) has read permissions for frontend assets"

# Check uploads folder exists
if [ -d "/var/www/ShopifyLite/backend/uploads" ]; then
    print_result 0 "Backend uploads folder exists"
else
    print_result 1 "Backend uploads folder is missing (multer product uploads will fail)"
fi

# 4. Check Database Connection
echo -e ""
echo -e "${YELLOW}--- 4. Database Connection (RDS) ---${NC}"

# Read DATABASE_URL from .env file
if [ -f "/var/www/ShopifyLite/backend/.env" ]; then
    DATABASE_URL=$(grep "DATABASE_URL=" /var/www/ShopifyLite/backend/.env | cut -d'"' -f2 | cut -d"'" -f2)
    
    if [ -n "$DATABASE_URL" ]; then
        # Parse Host
        DB_HOST=$(echo "$DATABASE_URL" | sed -e 's/.*@//' -e 's/:.*//')
        
        # Test port connectivity
        nc -z -w3 "$DB_HOST" 5432 >/dev/null 2>&1
        print_result $? "EC2 instance can connect to RDS host ($DB_HOST) on port 5432"
        
        # Test Prisma connection client
        cd /var/www/ShopifyLite/backend
        sudo -u ubuntu npx prisma migrate status >/dev/null 2>&1
        print_result $? "Prisma client successfully authenticated and queried RDS database"
    else
        print_result 1 "DATABASE_URL is empty in backend/.env"
    fi
else
    print_result 1 "Backend env configuration file (/var/www/ShopifyLite/backend/.env) is missing"
fi

# Summary
echo -e ""
echo -e "${BLUE}====================================================${NC}"
if [ "$errors" -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: All checks passed! Everything is running correctly.${NC}"
else
    echo -e "${RED}WARNING: $errors diagnostic check(s) failed. Please check the logs above.${NC}"
fi
echo -e "${BLUE}====================================================${NC}"
