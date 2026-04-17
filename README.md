# 短網址服務

一個簡單的短網址服務，支援註冊登入、建立短網址、重新導向、點擊次數統計，以及 Docker 自架。

![demo](demo.gif)

目前部署方式以 **Docker / Docker Compose** 為主，不再維護 Render 設定。

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
docker compose -f docker-compose.prod.yml up -d --build
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
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. 備份資料庫

```bash
docker compose exec db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup.sql
```

如果你要綁自己的網域，建議在 `:8080` 前面加一層 Caddy 或 Nginx。

## 本地開發（不跑 server / web container）

環境需求：

- Node.js 22+
- pnpm 9+
- Docker Desktop

步驟：

```bash
docker compose up db cache -d
pnpm install
cp server/.env.example server/.env
pnpm server:migrate
pnpm server:dev
pnpm web:dev
```

注意：

- Docker Compose 用的是專案根目錄 `.env`
- 單獨啟動 server 用的是 `server/.env`

## 測試與建置

```bash
pnpm test
pnpm build
pnpm test:e2e
```
