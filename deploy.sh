#!/usr/bin/env bash
set -euo pipefail

# 包装装载优化软件 — 部署到阿里云轻量服务器
# 用法: bash deploy.sh
#
# 前置条件：
#   - SSH 别名 `aliyun` 已配置（指向 root@106.14.200.249:2222，含 ProxyCommand）
#   - 本地已安装 pnpm

cd "$(dirname "$0")"

echo "==> 1. 构建项目"
pnpm build

echo "==> 2. 上传 dist/ 到 Nginx root (/var/www/packing-optimizer/)"
ssh aliyun "rm -rf /var/www/packing-optimizer/assets/* /var/www/packing-optimizer/index.html /var/www/packing-optimizer/logo.png"
scp -r dist/* aliyun:/var/www/packing-optimizer/

echo "==> 3. 重载 Nginx"
ssh aliyun "systemctl reload nginx"

echo "==> 部署完成！访问 https://k3-aitable.xyz/ （备用 http://106.14.200.249:8080/）"
