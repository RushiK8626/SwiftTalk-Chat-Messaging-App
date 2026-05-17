#!/bin/bash
echo "Starting SwitfTalk deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ "$USER" != "ubuntu" ]; then
    echo -e "${YELLOW}Warning: This script is designed to run as ubuntu user${NC}"
fi

mkdir -p logs

echo -e "${GREEN}Installing dependencies...${NC}"
npm install --production

echo -e "${GREEN}Generating Prisma Client...${NC}"
npx prisma generate

echo -e "${GREEN}Running database migrations...${NC}"
npx prisma db push

echo -e "${GREEN}Stopping existing server...${NC}"
pm2 stop switftalk-server 2>/dev/null || true
pm2 delete switftalk-server 2>/dev/null || true

echo -e "${GREEN}Starting server with PM2...${NC}"
pm2 start ecosystem.config.js --env production

pm2 save

sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${YELLOW}Check server status: pm2 status${NC}"
echo -e "${YELLOW}View logs: pm2 logs switftalk-server${NC}"
echo -e "${YELLOW}Restart server: pm2 restart switftalk-server${NC}"
echo -e "${YELLOW}Stop server: pm2 stop switftalk-server${NC}"
