#!/usr/bin/env bash

# 阿里云服务器部署脚本（由 GitHub Actions CD 通过 SSH 调用，也可手动执行）
# 流程：NVM 加载、git 拉取、构建、docker compose 启动、重启容器、健康检查。

# 开启严格模式：任何命令失败立即退出；未定义变量报错；管道中任意一段失败整体失败。
set -Eeuo pipefail

# 健康检查地址。应用监听 3005 端口，登录页返回 200 即视为服务可用。
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3005/login}"

# 生产环境变量文件。只放在服务器上（仓库根目录，.gitignore 已忽略），不提交到 GitHub。
# scripts/load-env.cjs 会从仓库根目录定位该文件，因此默认名为 .env。
ENV_FILE="${ENV_FILE:-.env}"

# Docker Compose 项目名，用于隔离同一台机器上的不同 Compose 项目。
COMPOSE_PROJECT="${COMPOSE_PROJECT:-miaomiao-aiflow}"

# Node.js 版本，与 docker/docker-compose.deploy.yml 中 node:22-alpine 保持一致。
NODE_VERSION="${NODE_VERSION:-22}"

# 部署使用的 Docker Compose 文件。
COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.deploy.yml}"

# 首次部署时用于克隆仓库（例如 git@github.com:user/miaomiao-aiflow2.git）。
SERVER_GIT_REPO="${SERVER_GIT_REPO:-}"

# NVM 安装目录。CI/CD 通过 SSH 执行脚本时不一定会加载 .bashrc，因此必须显式加载。
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
    nvm install "$NODE_VERSION" >/dev/null
    nvm use "$NODE_VERSION"
else
    echo "==> 警告：未找到 $NVM_DIR/nvm.sh，将直接使用 PATH 中的 node/pnpm" >&2
fi

if ! command -v node >/dev/null 2>&1; then
    echo "==> 错误：找不到 node。请安装 Node.js $NODE_VERSION（推荐通过 NVM）。" >&2
    exit 1
fi

# 优先用 corepack pnpm（自动读取 package.json 的 packageManager 字段），否则用系统 pnpm。
if command -v corepack >/dev/null 2>&1; then
    PNPM=(corepack pnpm)
elif command -v pnpm >/dev/null 2>&1; then
    PNPM=(pnpm)
else
    echo "==> 错误：找不到 pnpm。请安装 corepack 或 pnpm。" >&2
    exit 1
fi

# ---------- 1. 首次部署克隆 ----------
if [ ! -d .git ]; then
    if [ -z "$SERVER_GIT_REPO" ]; then
        echo "==> 错误：$PWD 不是 Git 仓库且未提供 SERVER_GIT_REPO。首次部署需要在 GitHub Secret 中配置 SERVER_GIT_REPO。" >&2
        exit 1
    fi
    echo "==> Clone repository"
    git clone "$SERVER_GIT_REPO" .
fi

# 回到 Git 仓库根目录，避免因执行目录不同导致路径错误。
PROJECT_DIR="$(git rev-parse --show-toplevel)"
cd "$PROJECT_DIR"

echo "==> Pull latest main"
git fetch origin main
git reset --hard origin/main

# ---------- 2. 环境变量 ----------
# 生产环境变量文件必须提前放在服务器上（或由运维手动放置）。
# 包含数据库密码、JWT_SECRET 等敏感信息，不能提交到 Git。
if [ ! -f "$ENV_FILE" ]; then
    echo "==> 缺少环境变量文件: $ENV_FILE" >&2
    echo "    请在 $PROJECT_DIR 放置生产 .env（可参考 .env.example，DATABASE_URL 使用服务名 miaomiao-aiflow-postgresql:5432）。" >&2
    exit 1
fi

# set -a：读取到的变量自动 export 给子进程；source 后关闭。
# 主要用于当前 shell 与后续构建命令；Docker Compose 通过 --env-file 单独读取该文件。
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# pnpm 安装必须使用 devDependencies。
# 如果 .env 里配置了 NODE_ENV=production，pnpm 会跳过 devDependencies，导致构建失败。
# Docker 运行时的 NODE_ENV 由 compose 单独控制。
unset NODE_ENV

echo "==> Install dependencies"
# Corepack 读取 package.json 的 packageManager 字段，只对当前命令生效。
# CI=true 让 pnpm 使用非交互模式。
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=true "${PNPM[@]}" install --frozen-lockfile

echo "==> Generate Prisma clients"
"${PNPM[@]}" --dir apps/workflow exec prisma generate --config prisma7.config.ts
"${PNPM[@]}" --dir apps/api-server exec prisma generate --config prisma7.config.ts

echo "==> Build workspace"
"${PNPM[@]}" build

echo "==> Start Docker services"
# 后台启动部署环境中的所有服务（Postgres / Qdrant / Workflow）。
# -p：指定 Compose 项目名；--env-file：让 Compose 能替换 ${...} 变量。
docker compose -p "$COMPOSE_PROJECT" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

# ---------- 3. 数据库迁移 ----------
# 生产 .env 的 DATABASE_URL 使用 compose 网络内的服务名（miaomiao-aiflow-postgresql:5432），
# 只能在容器内解析，因此在应用容器内执行迁移（只应用未执行的迁移，幂等）。
if [ "${NO_MIGRATE:-0}" != "1" ]; then
    echo "==> Run database migrations"
    docker compose -p "$COMPOSE_PROJECT" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
        exec -T miaomiao-aiflow-workflow \
        node_modules/.bin/prisma migrate deploy --config prisma7.config.ts
else
    echo "==> Skip migrations (NO_MIGRATE=1)"
fi

echo "==> Restart workflow container"
# 应用代码通过 volume 挂载进容器，构建生成新的 .next-production 后，
# 必须重启容器让 next start 加载新产物；up -d 不会主动重启未变更配置的容器。
docker compose -p "$COMPOSE_PROJECT" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
    restart miaomiao-aiflow-workflow

echo "==> Wait for health check"
for i in $(seq 1 10); do
    if curl -fsS --max-time 10 "$HEALTH_URL" >/dev/null; then
        echo "==> Deploy success"
        exit 0
    fi
    sleep 3
done

echo "==> Health check failed: $HEALTH_URL" >&2
docker compose -p "$COMPOSE_PROJECT" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
    logs --tail=100 >&2
exit 1
