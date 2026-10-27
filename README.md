# 喵喵 AI Flow

基于 pnpm workspace 的 AI 工作流工程，包含 workflow 前端、NestJS API 服务和共享 AI 引擎。前端以可视化画布编排 AI 工作流，AI 引擎基于 LangChain / LangGraph 接入 Ollama 本地模型，并配合 Qdrant 向量检索实现知识库问答。

## 技术栈

- pnpm workspace + Turbo：单仓多包管理，统一安装、构建与类型检查
- apps/workflow：Next.js 16 + React 19 前端（流程编排画布、知识库管理），服务端使用 Prisma 7 + PostgreSQL
- apps/api-server：NestJS 12 API 服务
- packages/ai-engine：共享 AI 引擎（LangChain / LangGraph / Ollama / Qdrant）
- PostgreSQL 18 + Qdrant：由 Docker Compose 提供

## 目录结构

```text
miaomiao-aiflow/
├── apps/
│   ├── workflow/        # Next.js 前端与服务端（业务 API、Prisma）
│   ├── api-server/      # NestJS API 服务
│   └── webapp/          # 预留的空包
├── packages/
│   └── ai-engine/       # 共享 AI 引擎
├── docker/              # Docker Compose：PostgreSQL、Qdrant
├── scripts/             # 环境加载等脚本
└── .github/workflows/   # GitHub Actions CI/CD
```

## 环境要求

- Node.js ≥ 22.21
- pnpm 9.12.3（`corepack enable` 后使用）
- Docker + Docker Compose v2（启动 PostgreSQL 与 Qdrant）
- Ollama（AI 引擎调用本地模型，地址由 `OLLAMA_BASE_URL` 配置）

## 环境配置

所有子工程统一读取仓库根目录的 `.env`：

```bash
cp .env.example .env
pnpm install
```

在启动前填写以下配置：

| 变量                | 用途                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`      | PostgreSQL 连接串，格式为 `postgresql://USER:PASSWORD@localhost:5435/DATABASE` |
| `POSTGRES_USER`     | Docker PostgreSQL 用户名，与连接串一致                                         |
| `POSTGRES_PASSWORD` | Docker PostgreSQL 密码，与连接串一致，使用独立的随机密码                       |
| `POSTGRES_DB`       | Docker PostgreSQL 数据库名，与连接串一致                                       |
| `JWT_SECRET`        | 登录签名密钥，使用至少 32 字节的随机值                                         |
| `OLLAMA_BASE_URL`   | Ollama 服务地址，默认 `http://localhost:11434`                                 |
| `PORT`              | API 服务端口，默认 `3005`                                                      |

数据库用户名或密码中的特殊字符需要进行 URL 编码。可以使用以下命令生成随机密码或签名密钥，每个变量应单独生成：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### 环境变量加载机制

不要在子工程中新建 `.env*`。`scripts/load-env.cjs` 根据自身路径定位根目录 `.env`，不依赖启动目录；部署平台直接注入的环境变量优先于文件中的值，也可以完全通过平台注入变量而不提供 `.env`。

Next.js 配置和两个 Prisma 配置会加载同一文件；Nest 启动命令和 AI 引擎示例通过 `scripts/with-env.cjs` 加载。数据库密码、连接串和 `JWT_SECRET` 只供服务端使用，不要放进 Next.js 的 `env` 配置或以 `NEXT_PUBLIC_` 命名。

## 启动

```bash
pnpm docker:start
pnpm --filter @miaomiao-aiflow/worflow dev
pnpm --filter @miaomiao-aiflow/api-server start:dev
```

Prisma 命令需显式指定现有配置文件，例如：

```bash
pnpm --dir apps/workflow exec prisma generate --config prisma7.config.ts
pnpm --dir apps/api-server exec prisma generate --config prisma7.config.ts
```

从其他目录直接使用 Docker Compose 时，也必须显式指定根目录环境文件：

```bash
docker compose --env-file /path/to/repository/.env -f /path/to/repository/docker/docker-compose.yml up -d
```

验证环境加载逻辑：

```bash
pnpm test:env
```

## 常用脚本

| 命令                           | 说明                                     |
| ------------------------------ | ---------------------------------------- |
| `pnpm dev` / `pnpm build`      | 通过 Turbo 并行执行所有子工程的开发/构建 |
| `pnpm docker:start`            | 启动 PostgreSQL 与 Qdrant                |
| `pnpm docker:stop`             | 停止并移除上述容器                       |
| `pnpm test:env`                | 校验根目录 `.env` 的加载逻辑             |
| `pnpm typecheck` / `pnpm lint` | 类型检查 / ESLint 检查                   |
| `pnpm spellcheck`              | cspell 拼写检查                          |
| `pnpm commit`                  | 使用 commitizen 生成规范提交信息         |
| `pnpm clean:all`               | 清理构建产物、缓存与依赖                 |
