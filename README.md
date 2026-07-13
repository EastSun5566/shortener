# 短網址服務

> 一個簡單的短網址服務，支援註冊登入、建立短網址、重新導向、點擊次數統計

![demo](demo.gif)

目前部署方式以 **Docker / Docker Compose** 為主

## 功能

- 建立短網址
- 短網址重新導向
- 使用者註冊、登入、登出
- 查看自己的短網址列表
- 點擊次數統計
- Redis 快取加速轉址
- 避免重複網址重複建立

## 快速開始（Docker，推薦）

Docker Compose 會自動讀取專案根目錄的 `.env`。

```bash
cp .env.example .env
docker compose up --build
```

啟動後可使用：

- Web UI: <http://localhost:3001>
- API: <http://localhost:8080>
- Health Check: <http://localhost:8080/health>

## 自架部署

正式環境預設會 pull 公開的 multi-platform image：

```bash
docker pull ghcr.io/eastsun5566/url-shortener-service:latest
```

可用的 release tag 包含完整版本（例如 `1.0.0`）、minor 版本（例如 `1.0`）與 `latest`。

### 1. 建立環境變數檔

```bash
cp .env.example .env
```

至少要修改這幾個值：

```env
DB_PASSWORD=change-this
JWT_SECRET=replace-with-a-secret-that-is-at-least-32-characters
CORS_ORIGINS=https://your-domain.com
SERVER_PORT=8080
```

如果你想用別的檔名，例如 `.env.production`，請明確帶上 `--env-file`。

### 2. 啟動正式環境

```bash
docker compose -f docker-compose.prod.yml up -d
```

正式環境只會啟動 `server`、`db`、`cache`，其中 `server` 會同時提供 API、短網址轉址與前端靜態檔案。

### 3. 驗證服務

- 首頁：<http://localhost:8080>
- 健康檢查：<http://localhost:8080/health>

正式環境常用指令：

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f server
docker compose -f docker-compose.prod.yml down
```

### 4. 更新版本

```bash
git pull
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### 5. 備份資料庫

```bash
docker compose exec db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup.sql
```

如果你要綁自己的網域，建議在 `:8080` 前面加一層 Caddy 或 Nginx。

### 直接執行 image

Image 需要外部 PostgreSQL 與 Redis。已有可連線的服務時，可以直接執行：

```bash
docker run --rm \
  --network your-docker-network \
  --publish 8080:8080 \
  --env DATABASE_URL=postgresql://user:password@postgres:5432/url_shortener \
  --env REDIS_URL=redis://redis:6379 \
  --env JWT_SECRET=replace-with-a-secret-that-is-at-least-32-characters \
  ghcr.io/eastsun5566/url-shortener-service:latest
```

若要使用本機 build 搭配 production Compose：

```bash
docker build --tag shortener:local .
SHORTENER_IMAGE=shortener:local docker compose -f docker-compose.prod.yml up -d
```

## 本地開發（不跑 server / web container）

環境需求：

- Node.js 24+
- pnpm 10.34.5
- Docker Desktop

步驟：

```bash
docker compose up db cache -d
pnpm install
cp server/.env.example server/.env
pnpm server:dev
pnpm web:dev
```

注意：

- Docker Compose 用的是專案根目錄 `.env`
- 單獨啟動 server 用的是 `server/.env`

## 測試與建置

```bash
pnpm check
pnpm test:e2e
```
