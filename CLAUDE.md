# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概覽

育嬰紀錄 Web App，行動端優先。Spring Boot 3.4.5 (Java 21) 在專案根目錄，React 19 + Tailwind CSS 3 在 `frontend/` 子目錄。

**目前開發階段：Phase 1 MVP（尚未開始實作）**  
Phase 3（JWT 安全、CSV/PDF 匯出、S3 照片儲存）已確認本階段不做。

目前已實作：`/api/v1/health` 健康檢查端點、NavBar、HomePage（呼叫 health API 顯示連線狀態）。

---

## 功能範圍

### Phase 1 — 核心 CRUD（待開發）

- 餵食紀錄（親餵母乳含左右側、瓶餵母乳量 ml、配方奶量 ml、用餐時長：開始餵食後可於下次進頁面補填結束時間自動計算時長）
- 母乳紀錄（擠奶含左右側時長與擠出量 ml、母乳庫存含冷藏／冷凍與儲存日期與到期提醒）
- 睡眠紀錄（入睡/醒來時間，後端自動計算時長）
- 換尿布紀錄（乾淨/尿尿/便便，顏色、質地）
- 成長指標（身高、體重、頭圍）
- 快捷狀態標籤（開心、哭鬧、發燒、長牙、猛長期）
- Today Dashboard：首頁顯示最後一次餵奶/換尿布時間、今日總睡眠、預計下次餵奶
- 暗色模式（夜間操作必要，Phase 1 同步實作）

### Phase 2 — 分析與體驗（待開發）

- 計時器：親餵/擠奶/睡眠計時，結束後自動帶入紀錄表單
- 副食品紀錄（內容、份量）
- 作息甘特圖（24 小時分佈）
- WHO 成長百分位曲線
- PWA 支援（安裝至桌面、離線快取）
- 多人即時同步（SSE，供夫妻/長輩共用）
- 健康管理（用藥紀錄、疫苗清單、就醫日誌）
- AI 週趨勢摘要

---

## 開發指令

### 日常開發（兩個終端）

```bash
# 終端 1 — 後端（port 8080）
./gradlew bootRun

# 終端 2 — 前端（port 5173，/api 自動 proxy 到 8080）
cd frontend && npm run dev
```

### 測試

```bash
# 全部測試
./gradlew test

# 單一測試類（目前只有 SmallPeanutApplicationTests）
./gradlew test --tests "com.smallpeanut.SmallPeanutApplicationTests"

# 前端 lint（ESLint v10 flat config）
cd frontend && npm run lint
```

### 生產打包

```bash
# 打包成單一 JAR（自動執行 npm build 並複製到 static）
./gradlew build

# 啟動（port 8080 同時提供 API + 前端靜態檔）
java -jar build/libs/small-peanut-*.jar
```

### 資料庫（Docker）

```bash
docker compose up -d    # 啟動 MySQL 8.0，port 3306，DB 名稱 small_peanut
docker compose down     # 停止
```

---

## 架構說明

### 前後端整合方式

Gradle 的 `bootJar` task 會依序執行：`npmInstall` → `buildFrontend` → `copyFrontend`（複製 `frontend/dist` 到 `classpath:/static/`），打包成單一可執行 JAR。開發時兩者分開運行，`vite.config.js` 設定 proxy 將 `/api` 請求轉發至 `:8080`。

`build.gradle` 的 npm 指令依作業系統自動選擇（Windows：`cmd /c npm`，Unix：`npm`），新增 Gradle npm task 時需遵循此模式。

### Spring Boot 層次

目前存在的套件（`com.smallpeanut`）：

```
com.smallpeanut
├── config/      WebConfig（CORS + SPA fallback）
└── controller/  HealthController（/api/v1/health）
```

Phase 1 實作時將依需求新增以下套件：

```
├── dto/         record 型別，作為 request/response 物件
├── model/       JPA entities（@Entity）
├── repository/  Spring Data JPA 介面
└── service/     業務邏輯層
```

`WebConfig` 做兩件事：
1. CORS — 開發期間允許 `http://localhost:5173`
2. SPA fallback — 非 API、非靜態資源的路徑一律回傳 `index.html`，讓 React Router 接管

### 前端層次

```
frontend/src
├── components/  可重用 UI 元件（現有：NavBar.jsx）
├── pages/       對應路由的頁面元件（現有：HomePage.jsx）
└── utils/       日期工具、資料彙總等純函式（尚未建立）
```

路由定義在 `App.jsx`，`BrowserRouter` 在 `main.jsx` 包裹整個 App。

### 資料庫

MySQL 8.0（docker-compose 容器），DB 名稱 `small_peanut`，連線設定在 `application.properties`，透過環境變數 `DB_USERNAME` / `DB_PASSWORD` 覆寫預設值（預設 `root`/`password`）。`ddl-auto=update` — JPA 自動維護 schema，不需手動建表。

---

## 開發規範

### API

- 路由統一使用 `/api/v1/` 前綴
- 回應欄位精簡，避免冗餘（使用者單手操作，減少等待感）
- 時間欄位統一存 UTC，前端顯示時才轉換本地時區

### 前端

- 互動元素最小點擊區域 44×44px（單手操作情境）
- 表單時間預設「現在時間」，使用者只需確認
- 時長計算（睡眠、餵奶）在 backend 完成，前端只傳入/出時間點
- 暗色模式使用 Tailwind `dark:` class，根據系統偏好或手動切換；啟用前需在 `tailwind.config.js` 加入 `darkMode: 'class'`（目前尚未設定）
- 計時器結束時直接帶入紀錄表單（時間自動填好），不要求使用者重新輸入
