# 喵喵 AI Flow

基于 pnpm workspace 的 AI 工作流工程，包含 workflow 前端、Nest API 服务和共享 AI 引擎。

## 环境配置

使用 Node.js 22.21 或更高版本，以及 pnpm 9.12.3。所有子工程统一读取仓库根目录的 `.env`：

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
| `PORT`              | Nest API 服务端口，默认 `3005`                                                 |

数据库用户名或密码中的特殊字符需要进行 URL 编码。可以使用以下命令生成随机密码或签名密钥，每个变量应单独生成：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

不要在子工程中新建 `.env*`。`scripts/load-env.cjs` 根据自身路径定位根目录 `.env`，不依赖启动目录；部署平台直接注入的环境变量优先于文件中的值。部署时也可以完全通过平台注入变量，不提供 `.env`。

Next.js 配置和两个 Prisma 配置会加载同一文件；Nest 启动命令和 AI 引擎示例通过 `scripts/with-env.cjs` 加载。`apps/webapp` 当前是空包，新增运行命令时也应使用该入口。数据库密码、连接串和 `JWT_SECRET` 只供服务端使用，不要放进 Next.js 的 `env` 配置或以 `NEXT_PUBLIC_` 命名。

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

## 提交到 GitHub 前

真实 `.env*`、私钥、数据库目录和生成代码均已加入 `.gitignore`；只提交无真实凭据的根目录 `.env.example`。不要强制添加被忽略的文件，也不要将数据库备份、日志或本地用户数据提交到仓库。

提交前应同时检查当前文件与 Git 历史。修改当前文件和添加 `.gitignore` 不会删除历史中的凭据；如果凭据曾被提交，需要清理相应历史，并建议轮换这些凭据。已有 PostgreSQL 数据卷的密码需要在数据库中同步修改，仅修改 `.env` 不会更新已有用户密码。

## CI/CD 与阿里云部署

仓库使用 GitHub Actions 实现 CI/CD，分为两个 workflow：

- `.github/workflows/ci.yml`：push 到 `main` 或提交 PR（也可手动触发）时执行 CI：安装依赖 → 验证环境加载 → 生成 Prisma Client → 构建。CI 使用占位环境变量，不接触真实凭据。
- `.github/workflows/deploy.yml`：**手动触发**（GitHub 仓库 Actions 页面点击 "Deploy Production" 的 Run workflow）。通过 SSH 登录服务器执行 `scripts/deploy.sh`。

所有私密信息（数据库密码、连接串、`JWT_SECRET`、服务器私钥）只存在于 GitHub Secrets 和服务器上的 `.env`，不会进入仓库。

### 服务器前置条件（一次性）

在阿里云服务器上安装：

- Node.js ≥ 22（推荐通过 NVM 安装，部署脚本会显式加载 `~/.nvm/nvm.sh`）
- pnpm 9.12.3（`corepack enable` 后 `corepack prepare pnpm@9.12.3 --activate`；脚本优先使用 `corepack pnpm`，自动读取 `package.json` 的 `packageManager` 字段）
- git
- Docker + Docker Compose v2（Postgres、Qdrant 与应用容器都通过 `docker/docker-compose.deploy.yml` 运行；数据库也可改用云数据库，连接串写在服务器 `.env` 即可）
- Ollama（`OLLAMA_BASE_URL` 指向的地址，本地或远程均可）

首次部署前，先在服务器上准备好代码目录与生产环境变量文件（`SERVER_GIT_REPO` Secret 配置后也可由部署脚本自动克隆）：

```bash
mkdir -p /opt/miaomiao-aiflow2
cd /opt/miaomiao-aiflow2
git clone git@github.com:USER/miaomiao-aiflow2.git .   # 或由部署脚本自动克隆
cp .env.example .env                                    # 填写真实值，见下方"生产 .env 取值"
pnpm install
```

服务器克隆仓库需要 SSH key 能访问该 GitHub 仓库（或使用带权限的 HTTPS token），建议为部署单独创建只读权限的 SSH key。

### 需要配置的 GitHub Secrets

在仓库 Settings → Secrets and variables → Actions 中配置：

| Secret                   | 说明                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `SERVER_HOST`            | 服务器公网 IP 或域名                                                                              |
| `SERVER_USER`            | SSH 登录用户（如 `root`）                                                                         |
| `DEPLOY_SSH_PRIVATE_KEY` | SSH 私钥（PEM 格式，对应服务器上已授权的公钥）                                                    |
| `SSH_KNOWN_HOSTS`        | 服务器指纹，生成：`ssh-keyscan -H 服务器IP` 的输出，用于 StrictHostKeyChecking=yes 校验           |
| `SERVER_PORT`            | 可选，SSH 端口，默认 22                                                                           |
| `SERVER_PROJECT_DIR`     | 服务器上代码目录（如 `/opt/miaomiao-aiflow2`）                                                    |
| `SERVER_GIT_REPO`        | 可选，仓库地址（如 `git@github.com:USER/miaomiao-aiflow2.git`）。首次部署且目录为空时用于自动克隆 |

### 生产 .env 取值

服务器上的 `.env` 与本地取值略有不同：

- `DATABASE_URL` 的主机名使用 compose 网络内的服务名：`postgresql://USER:PASSWORD@miaomiao-aiflow-postgresql:5432/DATABASE`
- `OLLAMA_BASE_URL` 使用 `http://host.docker.internal:11434`（容器通过 `extra_hosts` 访问宿主机 Ollama）

### 部署流程说明

`scripts/deploy.sh` 在服务器上依次执行：首次部署克隆仓库 → 拉取 `main` 最新代码（`git reset --hard origin/main`）→ 检查并加载 `.env` → `pnpm install --frozen-lockfile` → 生成 Prisma Client → `pnpm build` → `docker compose up -d` 启动 Postgres/Qdrant/应用 → 在应用容器内执行 `prisma migrate deploy`（幂等；设 `NO_MIGRATE=1` 可跳过）→ 重启应用容器 → 健康检查 `http://127.0.0.1:3005/login`（失败时输出容器日志并退出）。

应用以 production 模式运行（容器内 `next start`，端口 3005），日志查看：

```bash
docker compose -p miaomiao-aiflow -f docker/docker-compose.deploy.yml logs -f miaomiao-aiflow-workflow
```

如需修改部署目录或服务端口，编辑 `.github/workflows/deploy.yml` 中的 `SERVER_PROJECT_DIR` 和 `docker/docker-compose.deploy.yml`。手动部署只需在服务器上直接运行 `bash scripts/deploy.sh`。
