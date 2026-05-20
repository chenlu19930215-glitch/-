#!/bin/bash
# 部署到阿里云轻量服务器
# 使用前修改以下变量：
SERVER_IP="YOUR_SERVER_IP"
SERVER_USER="root"
DEPLOY_PATH="/var/www/packaging-optimizer"
SSH_KEY="~/.ssh/your_key"

echo "🔨 开始构建..."
pnpm build

echo "📦 上传到服务器..."
rsync -avz --delete \
  -e "ssh -i $SSH_KEY" \
  ./dist/ \
  $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/dist/

echo "🔄 重载 Nginx..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "nginx -s reload"

echo "✅ 部署完成！"
echo "访问地址：http://$SERVER_IP"
