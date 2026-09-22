#!/bin/bash
set -e

echo "Building frontend..."
npm run build

echo "Copying dist to 192.168.6.5..."
rsync -avz -e "ssh -o StrictHostKeyChecking=no -o BatchMode=yes" dist/ fix_admin@192.168.6.5:/home/fix_admin/erp-frontend/dist/

echo "Updating docker container..."
ssh -o StrictHostKeyChecking=no -o BatchMode=yes fix_admin@192.168.6.5 "docker cp /home/fix_admin/erp-frontend/dist/. erp-frontend:/usr/share/nginx/html/ && docker restart erp-frontend"

echo "Deployment to 192.168.6.5 completed successfully!"
