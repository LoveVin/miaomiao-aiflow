#!/bin/sh
# 修复 Next.js Turbopack 生产产物中 serverExternalPackages 的哈希别名 symlink。
#
# 背景：Turbopack 会把 prisma / pg 等服务端外部依赖编译为 `prisma-<hash>`、
# `pg-<hash>` 引用，并在产物 node_modules 内生成指向构建期 pnpm store 的
# 相对 symlink（见 vercel/next.js#87737）。镜像内 .next-production 被平移到
# /app 后目录层级与构建期不同，相对链接失效，运行时表现为
# `Cannot find module 'prisma-<hash>/config'`，接口统一 500。
#
# 处理：把哈希别名 symlink 统一重定向到运行时真实依赖目录 /app/node_modules。
set -eu

app_dir="${1:-/app}"
nm_dir="$app_dir/.next-production/node_modules"

[ -d "$nm_dir" ] || exit 0

cd "$nm_dir"
find . -type l | while read -r link; do
    target=$(readlink "$link")
    pkg=$(printf '%s' "$target" | sed \
        -e 's|.*/node_modules/\(@[^/][^/]*/[^/][^/]*\)$|\1|' \
        -e 's|.*/node_modules/\([^/@][^/]*\)$|\1|')
    if [ -n "$pkg" ] && [ -e "$app_dir/node_modules/$pkg" ]; then
        ln -sfn "$app_dir/node_modules/$pkg" "$link"
        echo "fixed $link -> $app_dir/node_modules/$pkg"
    fi
done
