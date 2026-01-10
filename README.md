# 短網址專案實作

請自行實作一個專案，是可以建立[短網址](https://en.wikipedia.org/wiki/URL_shortening)的服務

![demo](demo.gif)

## 需求

### 必要需求

- [x] 專案需要使用 [Git](https://git-scm.com/) 管理專案，並公開至 [GitHub](https://github.com/)
- [x] Git commit 訊息需符合 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/v1.0.0/)，並使用英文撰寫
- [x] 專案須包含 [`README.md`](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-on-github/about-readmes)，其中描述專案的安裝、建置、使用，包含的功能與操作方式
- [x] 前端使用 [React.js](https://zh-hant.reactjs.org/) 16 以上實作整個頁面與元件
- [x] 後端使用 [Node.js](https://nodejs.org/en/) 14 以上
- [x] 使用者可以填入一段網址，會產生一段短網址
- [x] 使用者可以瀏覽短網址，服務會將短網址重新導向到原始網址

### 專案需符合以下==至少兩項==需求

- [x] 使用 [TypeScript](https://www.typescriptlang.org/) 4.3 以上實作
- [x] 後端使用任一套 [ORM](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping) 搭配任一套 [RDBMS](https://en.wikipedia.org/wiki/Relational_database)
- [x] 整個 React App 使用 [Functional Component](https://reactjs.org/docs/components-and-props.html#function-and-class-components)
- [x] 使用套件檢查程式碼風格 (例如：[JavaScript Standard](https://standardjs.com/)、[ESLint](https://eslint.org/))
- [ ] 專案需要能被公開瀏覽使用 (例如使用 [Heroku](https://www.heroku.com/))
- [x] [單元測試](https://en.wikipedia.org/wiki/Unit_testing)
- [ ] [E2E 測試](https://www.browserstack.com/guide/end-to-end-testing)
- [ ] 開發時全程使用 [TDD](https://en.wikipedia.org/wiki/Test-driven_development)
- [ ] 整合 [CI/CD](https://en.wikipedia.org/wiki/CI/CD) 流程

### 需挑選以下==至少兩項==功能實作

- [x] 需要驗證網址有效
- [x] 使用者可以使用密碼註冊、登入、登出
- [x] 使用者可以新增、建立、更新、刪除多個短網址
- [x] 短網址重新導向的過程使用快取 (可暫時避免向資料庫查詢)
- [x] 使用者可以知道短網址瀏覽次數
- [x] 服務會避免短網址重複重導向到相同網址
- [ ] 從短網址拿到原始網址的 [Open Graph Metadata](https://ogp.me/) （標題、描述、圖片）
- [ ] 使用者可以自訂 [Open Graph Metadata](https://ogp.me/)（標題、描述、圖片）

### 其他

- [ ] 歡迎實作您覺得喜歡的功能，可以讓專案更有創意！

## 系統設計與分析

上述為功能性需求，我額外多增加一些非功能性需求：

- 高可用（不會隨意有 downtime）
- 低延遲（建立短網址與導向要快）

這些後續會再進一步討論

### 計算流量與資料量

- 假設建立短網址 QPS 為 `100`，服務運行 `5` 年，約會產生 `100 * 60 * 60 * 24 * 365 * 5 ≈ 15B` 個短網址
- 每個短網址抓 `500 Bytes`，約會產生 `15B * 500 ≈ 7.5TB` 的資料量

### 核心業務邏輯

短網址系統的運作原理是透過短的 key 去對應到原始網址，例如：`example.com/{key} -> test.com/abc123`，因此，我們可以假設 key 用 `base62` 編碼（`[A-Za-z0-9]`）約長度為 `6` 碼就可以涵蓋約 `15B` 的短網址數量（`62 ** 6 ≈ 56B`）

最簡單的方式是隨機選擇一個長度為 `6` 的 `base62` 編碼字串，或是對原始網址進行 hash，然後取前 `6` 碼，最後在寫進 DB 前去做唯一性的檢查，缺點就是每次在寫入前都要去問一次 DB，如果我能確保在在產生 key 時就全域唯一，就可以避免這個問題。

因為 `UUID` / `Snowflake` 這類產生全域唯一 ID 的演算法因產生字串長度過長所以不考慮，我最後選擇在 [Redis](https://redis.io/) 中建立一個全域 `counter`，每次產生 key 時都會先從 `Redis` 中取得 `count`，然後用 [INC](https://redis.io/commands/incr) 命令將 `count` +1，再把 `count` 編碼成 base62，這樣就可以確保 key 全域唯一，並且無需在寫入 DB 前再進行唯一性檢查。

最後，也將 key 與原始網址的對應關係寫入 Redis，這樣下次跳轉時也不用在問一次 DB。

### Data Modeling 與 ERD

需求中已提到需用 RDBMS，我這邊選用 [PostgreSQL](https://www.postgresql.org/)，並可以簡單辨識出有兩個主要 Entity：

- `User`
- `Link`

一個 `User` 可以有多個 `Link`，一個 `Link` 只能屬於一或零個 `User`，因此可以用 [One-to-Many](<https://en.wikipedia.org/wiki/One-to-many_(data_model)>) 來建立關聯，ERD 如下：

```mermaid
erDiagram
    User ||--o{ Link : "has many"
    User {
        int id PK
        string email UK
        string password
        string created_at
        string updated_at
    }
    Link {
        int id PK
        string original_url
        string shorten_key
        string created_at
        string updated_at
        int user_id FK
    }
```

### API 設計

- Create Link `POST /links`
- List Links `GET /links`
- Redirect `GET /links/:shortenKey`
- Login `POST /login`
- Register `POST /register`

## 起步

### 環境需求

- [Node.js](https://nodejs.org/en/) v16+
- [PNPM](https://pnpm.io/zh-TW/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 本地啟動

```sh
# 啟動 PostgreSQL、Redis
docker-compose up -d

# 安裝依賴
pnpm install

# 複製環境變數與遷移資料庫
cp server/.env.example server/.env
pnpm server:migrate

# 啟動 server 於 http://127.0.0.1:8080
pnpm server:dev

# 啟動 web 於 http://127.0.0.1:3000
pnpm web:dev
```
