# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概覽

育嬰紀錄 Web App，行動端優先。Spring Boot 3.4.5 (Java 21) 在專案根目錄，React 19 + Tailwind CSS 3 在 `frontend/` 子目錄。

**目前開發階段：Phase 1 MVP 已完成；Phase 2 資料分析圖表已完成。**  
Phase 3（JWT 安全、CSV/PDF 匯出、S3 照片儲存）已確認不做。

---

## 開發指令

### 日常開發（兩個終端）

```bash
# 終端 1 — 後端（port 8080）
./gradlew bootRun

# 終端 2 — 前端（port 5173，/api 自動 proxy 到 8080）
cd frontend && npm run dev
```

### 資料庫（Docker，須先啟動才能跑後端）

```bash
docker compose up -d    # 啟動 MySQL 8.0，port 3306，DB 名稱 small_peanut
docker compose down     # 停止
```

### 測試與 Lint

```bash
./gradlew test
./gradlew test --tests "com.smallpeanut.SmallPeanutApplicationTests"
cd frontend && npm run lint
```

### 生產打包

```bash
./gradlew build          # 自動執行 npmInstall → buildFrontend → copyFrontend → bootJar
java -jar build/libs/small-peanut-*.jar   # port 8080，同時提供 API + 前端靜態檔
```

---

## 後端架構

### 套件結構（`com.smallpeanut`）

```
config/       WebConfig — CORS（允許 localhost:5173）+ SPA fallback（非 /api 路徑回傳 index.html）
controller/   REST 控制器
dto/          Java record，作為 request/response 物件
model/        JPA entities（@Entity，@PrePersist 設定 createdAt）
repository/   Spring Data JPA 介面
service/      業務邏輯
```

### 已實作的 API 端點

| 路徑 | 方法 | 說明 |
|------|------|------|
| `/api/v1/health` | GET | 健康檢查 |
| `/api/v1/dashboard` | GET | 首頁摘要（最後餵食/換尿布、今日睡眠、active sleep） |
| `/api/v1/diapers` | GET / POST / DELETE `/{id}` | 換尿布紀錄 |
| `/api/v1/feeding` | GET / POST / DELETE `/{id}` | 餵食紀錄 |
| `/api/v1/feeding/{id}/end` | PATCH | 補填結束時間，後端自動計算時長 |
| `/api/v1/sleep` | GET / POST / DELETE `/{id}` | 睡眠紀錄 |
| `/api/v1/sleep/{id}/wake` | PATCH | 補填醒來時間，後端自動計算時長 |
| `/api/v1/pumping` | GET / POST / DELETE `/{id}` | 擠奶紀錄 |
| `/api/v1/milk-storage` | GET / POST / DELETE `/{id}` | 母乳庫存 |
| `/api/v1/growth` | GET / POST / DELETE `/{id}` | 成長指標 |
| `/api/v1/tags` | GET / POST / DELETE `/{id}` | 狀態標籤 |

**日期篩選：** 上述 GET 端點（milk-storage 除外）均支援 `?from=<ISO>&to=<ISO>` UTC 時間範圍查詢。前端傳入本地日期的 00:00:00.000～23:59:59.999 UTC 換算值。不帶參數時回傳全部資料。

### Active Session 模式

睡眠與餵食使用「開始即記錄、事後補結束」模式：
- POST 時 `wokeUpAt` / `endedAt` 可為 null
- PATCH `/{id}/wake` 或 `/{id}/end` 補填結束時間，後端計算 `durationMinutes`
- `durationMinutes` 由後端用 `ChronoUnit.MINUTES.between()` 計算，前端不做時長計算

### 時間處理

- 所有 `LocalDateTime` 欄位存 UTC
- DTO 使用 `Instant`（Jackson 序列化為 ISO-8601 字串，由 `spring.jackson.serialization.write-dates-as-timestamps=false` 保證）
- 轉換固定使用 `ZoneOffset.UTC`，不依賴系統時區
- `ddl-auto=update` — JPA 自動維護 schema

---

## 前端架構

### 路由與版面

`BrowserRouter` 在 `main.jsx`，路由定義在 `App.jsx`。版面由三層組成：
- `NavBar`（頂部）— 子頁面顯示返回箭頭 + 頁名；頂部右側為暗色模式切換按鈕
- `<main>`（捲動區，`pb-28` 避免被底欄遮蓋）
- `BottomTabBar`（`fixed bottom-0`）— 5 個 tab：首頁 / 紀錄 / 分析 / 健康 / 設定
- `FAB`（`fixed bottom-24 right-6`）— 各紀錄頁的新增按鈕，位置避開底欄

### 暗色模式

`DarkModeContext`（`context/DarkModeContext.jsx`）包裹整個 App。初始值從 `localStorage.darkMode` 讀取，fallback 為系統偏好。切換時寫回 localStorage 並在 `<html>` 加/移除 `dark` class。`tailwind.config.js` 已設定 `darkMode: 'class'`。

### 頁面共用模式

所有紀錄頁面遵循相同結構：
1. `selectedDate` state（`useState(() => new Date())`）
2. `fetchRecords(date)` 傳入日期，計算 `localDayRange(date)` 帶入 query params
3. `useEffect(() => { fetchRecords(selectedDate) }, [fetchRecords, selectedDate])`
4. 頁面頂部顯示 `<DateNavigator date={selectedDate} onChange={...} />`
5. 表單透過 `RecordFormModal`（底部 sheet）開啟；時間欄位預設 `nowLocalString()`

Sleep / Feeding 頁面額外有 active session banner（`records.find(r => r.endedAt == null)`），顯示在 DateNavigator 下方、清單上方。

### AnalysisPage 圖表架構

圖表頁使用 **Recharts**（`recharts` 已在 `frontend/package.json`），所有圖表資料目前為 mock data（`buildMockData()`）。

**Theme helpers**（接收 `dark: boolean`）：
- `rTick(dark)` / `rGrid(dark)` / `rTooltip(dark)` — 回傳 Recharts 元件的 dark-aware props

**共用 timeline primitives**（純 CSS，不使用 Recharts）：
- `TimeStrip` — 相對定位容器，背景軌道 + 6/12/18 小時格線，children 用 `absolute` 定位
- `TimeAxis` — 0/6/12/18/24 小時標籤列，與 TimeStrip 寬度對齊
- 使用此組合的圖表：`SleepGanttChart`（睡眠甘特）、`FeedingTimeline`（餵食時間軸）、`ActivityHeatmap`（作息熱力圖）

**ChartCard** — 統一卡片外框，接收 `title / note / children`。

**已實作的 8 個圖表**：

| 元件 | 類型 | 說明 |
|------|------|------|
| `SleepBarChart` | `BarChart` | 每日睡眠時數，近 7 天 |
| `SleepGanttChart` | CSS grid | 入睡時段分布，7×24h |
| `FeedingTimeline` | CSS grid | 餵食時間軸，7×24h，彩色圓點 |
| `FeedingMlChart` | `BarChart` stacked | 每日瓶餵總量，自訂 tooltip |
| `DiaperChart` | `LineChart` | 換尿布次數，三條線 |
| `GrowthChart` | `ComposedChart` | 成長曲線 + WHO P3/P50/P97 band（stacked Area），tab 切換體重/身高/頭圍 |
| `PumpingChart` | `BarChart` stacked | 擠奶量趨勢，近 14 天，左（rose）/右（purple） |
| `ActivityHeatmap` | CSS grid | 作息熱力圖，7×24h，藍格=睡眠，圓點=餵食 |
| `MilkBalanceChart` | `ComposedChart` | 母乳供需，Bar=擠奶（供），Line=瓶餵（需） |

**WHO 成長曲線技巧**：`ComposedChart` 中 `p3` Area（透明，stackId="who"）+ `band` Area（= p97-p3，半透明藍）堆疊出 P3–P97 帶狀範圍；tooltip 中 p97 = p3 + band 重新計算。

---

### 共用元件

| 元件 | 用途 |
|------|------|
| `RecordFormModal` | 底部 sheet，接收 `open/onClose/title/onSubmit/submitting/children` |
| `DateNavigator` | 日期前後切換，今天顯示「今天」，非今天顯示「回到今天」連結 |
| `SegmentedControl` | 多選一按鈕組（type、side 等欄位） |
| `TimeInput` | `datetime-local` 輸入，配合 `nowLocalString()` 預設現在時間 |
| `RecordList` / `RecordCard` | 通用清單/卡片（DiaperPage、BreastMilkPage 使用） |
| `EmptyState` | 無資料時的佔位提示 |
| `FAB` | 固定位置新增按鈕 |

### dateUtils.js 工具函式

| 函式 | 說明 |
|------|------|
| `nowLocalString()` | `datetime-local` input 格式的現在時間字串 |
| `localDayRange(date)` | 傳入 Date，回傳 `{ from, to }` UTC ISO（本地日 00:00～23:59:59.999） |
| `isSameLocalDay(a, b)` | 比較兩個 Date 是否同一本地日 |
| `formatTime(iso)` | HH:mm（zh-TW） |
| `formatDate(iso)` | 含星期的完整日期（zh-TW） |
| `formatShortDate(date)` | 月日+星期（zh-TW，用於 DateNavigator） |
| `timeAgo(iso)` | 剛剛 / X 分鐘前 / X 小時前 / X 天前 |
| `formatDuration(minutes)` | X 小時 Y 分 |
| `todayString()` | 含星期的今日完整日期 |

---

## 開發規範

### API

- 路由統一 `/api/v1/` 前綴
- 時間欄位統一存 UTC，前端顯示時才轉換本地時區
- 時長（durationMinutes）只由後端計算，前端只傳時間點

### 前端

- 互動元素最小點擊區域 44×44px（`min-w-[44px] min-h-[44px]`）
- `build.gradle` npm 指令依 OS 自動選擇（Windows：`cmd /c npm`，Unix：`npm`）；新增 Gradle npm task 需遵循此模式

### Phase 2 剩餘待開發功能

- 計時器（親餵/擠奶/睡眠計時，結束後自動帶入表單）
- 副食品紀錄
- 分析頁接入真實 API 資料（目前全為 mock data）
- PWA 支援（安裝至桌面、離線快取）
- 多人即時同步（SSE）
- 健康管理（用藥、疫苗、就醫）
- AI 週趨勢摘要
