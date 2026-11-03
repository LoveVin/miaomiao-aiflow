# syntax=docker/dockerfile:1

# 喵喵 AIFlow Workflow 应用生产镜像
# 构建：docker build -t <registry>/<namespace>/miaomiao-aiflow-workflow:<tag> .
# 只构建并部署 apps/workflow（Next.js 应用），Postgres / Qdrant 由服务器 compose 提供。

FROM node:22-alpine AS base
# 镜像源可配置：默认 npmjs（GitHub Actions 直连即可）；
# 国内本地构建可传 --build-arg NPM_REGISTRY=https://registry.npmmirror.com
ARG NPM_REGISTRY=https://registry.npmjs.org
ENV COREPACK_NPM_REGISTRY=${NPM_REGISTRY} \
    npm_config_registry=${NPM_REGISTRY}
# corepack 按 package.json 的 packageManager 字段激活对应 pnpm 版本
RUN corepack enable
WORKDIR /app
# @miaomiao 包来自私有 registry；这里保留 scoped registry 配置，
# 避免构建期把内部包误发到公共 npm registry 导致 404。
COPY .npmrc .npmrc

# ---------- deps：安装全部依赖（构建需要 devDependencies）----------
FROM base AS deps
# 预拷贝所有 workspace 清单 + lockfile，利用 Docker 层缓存：
# 代码变更不重建依赖层，lockfile 变更才重建。
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/workflow/package.json apps/workflow/
COPY apps/api-server/package.json apps/api-server/
COPY apps/webapp/package.json apps/webapp/
COPY packages/ai-engine/package.json packages/ai-engine/
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN pnpm install --frozen-lockfile

# ---------- build：Prisma generate + 构建 workflow 应用 ----------
FROM deps AS build
# .dockerignore 已排除 node_modules / 产物 / .env，这里拷贝完整源码
COPY . .
# NEXT_PUBLIC_* 变量在构建期内联进浏览器 bundle，运行时 env_file 注入无效，
# 必须由 CD 流水线以 build-arg 传入（deploy.yml 从 GitHub Secrets 注入）。
ARG NEXT_PUBLIC_MONITOR_DSN
# 构建期占位环境变量（与 CI 一致，不连接真实数据库；真实凭据只在运行时注入）
ENV DATABASE_URL=postgresql://ci:ci@localhost:5432/ci \
    JWT_SECRET=ci-only-placeholder-secret \
    OLLAMA_BASE_URL=http://localhost:11434 \
    NODE_ENV=production \
    NEXT_PUBLIC_MONITOR_DSN=${NEXT_PUBLIC_MONITOR_DSN}
RUN pnpm --dir apps/workflow exec prisma generate --config prisma7.config.ts \
    && pnpm exec turbo build --filter=@miaomiao-aiflow/worflow...

# ---------- prod-deps：裁剪出生产依赖，并在镜像内生成 Prisma Client ----------
FROM base AS prod-deps
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    DATABASE_URL=postgresql://ci:ci@localhost:5432/ci \
    JWT_SECRET=ci-only-placeholder-secret \
    OLLAMA_BASE_URL=http://localhost:11434
# prisma CLI 已移入 workflow 的 dependencies（运行时迁移需要），--prod 会带上
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/workflow/package.json apps/workflow/
COPY packages/ai-engine/package.json packages/ai-engine/
# pnpm deploy 会执行根 package.json 的 prepare(husky)，生产依赖中没有 husky，
# 用空垫片跳过（husky 仅开发环境有意义）。
RUN printf '#!/bin/sh\nexit 0\n' > /usr/local/bin/husky && chmod +x /usr/local/bin/husky
RUN pnpm --filter @miaomiao-aiflow/worflow deploy --prod /out
# 迁移与 generate 需要 schema / migrations / 配置；load-env.cjs 被配置文件
# 以 ../../scripts/load-env.cjs 相对引用，镜像内落到 /scripts 保持路径成立。
COPY scripts/load-env.cjs /scripts/load-env.cjs
COPY apps/workflow/prisma7.config.ts /tmp/prisma7.config.ts
COPY apps/workflow/prisma /tmp/prisma
RUN cp /tmp/prisma7.config.ts /out/prisma7.config.ts \
    && cp -r /tmp/prisma /out/prisma \
    && cd /out \
    && node_modules/.bin/prisma generate --config prisma7.config.ts

# ---------- runtime：最终运行镜像 ----------
FROM node:22-alpine AS runtime
# openssl 为 Prisma schema engine（migrate deploy）所需；curl 供容器内调试
RUN apk add --no-cache openssl curl
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3005 \
    HOSTNAME=0.0.0.0
COPY --from=prod-deps /out/node_modules ./node_modules
COPY --from=prod-deps /out/package.json ./package.json
COPY --from=prod-deps /out/prisma7.config.ts ./prisma7.config.ts
COPY --from=prod-deps /out/prisma ./prisma
COPY --from=build /app/apps/workflow/.next-production ./.next-production
COPY --from=build /app/apps/workflow/public ./public
# Turbopack 产物内的哈希 external symlink 指向构建期 pnpm store 的相对路径，
# 平移到 /app 后层级变化导致链接失效（vercel/next.js#87737），统一重定向到
# 运行时 node_modules，否则接口全部 500。
COPY scripts/fix-turbopack-external-links.sh /usr/local/bin/fix-turbopack-external-links
RUN fix-turbopack-external-links /app
# next start 会加载 next.config.ts，其 import '../../scripts/load-env.cjs' 指向 /scripts
COPY --from=build /app/apps/workflow/next.config.ts ./next.config.ts
COPY --from=prod-deps /scripts/load-env.cjs /scripts/load-env.cjs
EXPOSE 3005
CMD ["node_modules/.bin/next", "start"]
