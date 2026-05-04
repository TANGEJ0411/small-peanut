# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概覽

育嬰紀錄 Web App，行動端優先。Spring Boot 3.4.5 (Java 21) 在專案根目錄，React 19 + Tailwind CSS 3 在 `frontend/` 子目錄。

**目前開發階段：Phase 1 MVP 已完成；Phase 2 資料分析圖表（含真實 API 接入）已完成；健康管理（用藥/疫苗/就醫）已完成。**  
Phase 3（JWT 安全、CSV/PDF 匯出、S3 照片儲存）已確認不做。

---

## 開發指令

```bash
# 資料庫（Docker，須先啟動才能跑後端）
docker compose up -d          # MySQL 8.0，port 3306，DB 名稱 small_peanut

# 後端（port 8080）
./gradlew bootRun

# 前端（port 5173，/api 自動 proxy 到 8080）
cd frontend && npm run dev

# 測試與 Lint
./gradlew test
./gradlew test --tests "com.smallpeanut.SmallPeanutApplicationTests"
cd frontend && npm run lint

# 生產打包（npmInstall → buildFrontend → copyFrontend → bootJar 自動串接）
./gradlew build
java -jar build/libs/small-peanut-*.jar
```

---

## 後端：新增紀錄功能的完整步驟

新增一種紀錄類型（例如：副食品紀錄）需依序建立以下 6 個檔案：

### 1. Model（Entity）

```java
// model/XxxRecord.java
@Data @Entity @Table(name = "xxx_records")
public class XxxRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 時間欄位用 LocalDateTime，存 UTC
    @Column(nullable = false)
    private LocalDateTime recordedAt;

    // Enum 欄位用 @Enumerated(EnumType.STRING)
    @Enumerated(EnumType.STRING)
    private XxxType type;

    private String notes;  // 可為 null 的欄位不加 @Column(nullable = false)

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(ZoneOffset.UTC); }
}
```

**規則：**
- 一定要有 `createdAt` + `@PrePersist`
- 所有時間欄位存 UTC `LocalDateTime`，不存帶時區的型別
- Enum 欄位一律 `@Enumerated(EnumType.STRING)`，Enum 定義放在 `model/` 下獨立檔案
- `@ElementCollection` 用於一對多值集合（如 `MedicationSchedule.mealSlots`），需加 `fetch = FetchType.EAGER`

### 2. DTOs（Java records）

```java
// dto/XxxRequest.java
public record XxxRequest(
    @NotNull Instant recordedAt,   // 時間用 Instant
    XxxType type,
    String notes
) {}

// dto/XxxResponse.java
public record XxxResponse(
    Long id,
    String type,        // Enum 轉成 String 回傳（用 .name()）
    Instant recordedAt,
    String notes,
    Instant createdAt
) {}
```

**規則：**
- Request 的時間欄位用 `Instant`（Jackson 自動處理 ISO-8601）
- Response 的 Enum 欄位用 `String`（前端不依賴 Java enum）
- 必填欄位加 `@NotNull` 或 `@NotBlank`

### 3. Repository

```java
// repository/XxxRecordRepository.java
public interface XxxRecordRepository extends JpaRepository<XxxRecord, Long> {
    List<XxxRecord> findAllByOrderByRecordedAtDesc();
    List<XxxRecord> findAllByRecordedAtBetweenOrderByRecordedAtDesc(LocalDateTime from, LocalDateTime to);
}
```

### 4. Service

```java
// service/XxxRecordService.java
@Service @RequiredArgsConstructor
public class XxxRecordService {
    private final XxxRecordRepository repository;

    public List<XxxResponse> findAll() {
        return repository.findAllByOrderByRecordedAtDesc().stream().map(this::toResponse).toList();
    }

    public List<XxxResponse> findByDateRange(Instant from, Instant to) {
        return repository.findAllByRecordedAtBetweenOrderByRecordedAtDesc(
            LocalDateTime.ofInstant(from, ZoneOffset.UTC),
            LocalDateTime.ofInstant(to, ZoneOffset.UTC))
            .stream().map(this::toResponse).toList();
    }

    public XxxResponse create(XxxRequest request) {
        XxxRecord record = new XxxRecord();
        record.setRecordedAt(LocalDateTime.ofInstant(request.recordedAt(), ZoneOffset.UTC));
        record.setType(request.type());
        record.setNotes(request.notes());
        return toResponse(repository.save(record));
    }

    public void delete(Long id) { repository.deleteById(id); }

    private XxxResponse toResponse(XxxRecord r) {
        return new XxxResponse(
            r.getId(),
            r.getType() != null ? r.getType().name() : null,
            r.getRecordedAt().toInstant(ZoneOffset.UTC),
            r.getNotes(),
            r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
```

**規則：**
- `LocalDateTime ↔ Instant` 轉換固定用 `ZoneOffset.UTC`
- `toResponse()` 是 private helper，每個 service 都有
- 時長（durationMinutes）只由後端計算，永遠不讓前端傳入算好的值

### 5. Controller

```java
// controller/XxxRecordController.java
@RestController @RequestMapping("/api/v1/xxx") @RequiredArgsConstructor
public class XxxRecordController {
    private final XxxRecordService service;

    @GetMapping
    public List<XxxResponse> getAll(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        if (from != null && to != null)
            return service.findByDateRange(Instant.parse(from), Instant.parse(to));
        return service.findAll();
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public XxxResponse create(@Valid @RequestBody XxxRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
```

**規則：**
- `from`/`to` 接受 URL-encoded UTC ISO 字串（前端用 `encodeURIComponent(date.toISOString())`）
- PATCH 用於部分更新（如補填結束時間），語意上不同於 PUT

### 6. 不需要手動建表

`spring.jpa.hibernate.ddl-auto=update`，重啟後端後 JPA 自動 CREATE/ALTER。

---

## 後端：已有的共用模式

### 時間轉換（固定模式，禁止自創）

```java
// Instant → LocalDateTime（存入 DB）
LocalDateTime.ofInstant(request.someAt(), ZoneOffset.UTC)

// LocalDateTime → Instant（回傳給前端）
record.getSomeAt().toInstant(ZoneOffset.UTC)

// 取得今天 UTC 日期
LocalDate.now(ZoneOffset.UTC)

// 取得今天 UTC 時間範圍
LocalDate today = LocalDate.now(ZoneOffset.UTC);
LocalDateTime startOfDay = today.atStartOfDay();
LocalDateTime endOfDay = today.atTime(23, 59, 59, 999_000_000);
```

### Dashboard 整合

`DashboardResponse` 是 nested records 結構。新增首頁卡片需：
1. 在 `DashboardResponse.java` 加新的 nested record
2. 在 `DashboardService.java` 的 `getSummary()` 加對應的 `build...()` 方法
3. 注入需要的 repository（`@RequiredArgsConstructor` 自動注入）

### build.gradle npm task 模式

新增需要 npm 的 Gradle task 必須用此模式（Windows/Unix 相容）：

```groovy
def npmCmd = System.getProperty('os.name').toLowerCase().contains('windows')
        ? ['cmd', '/c', 'npm'] : ['npm']

tasks.register('myTask', Exec) {
    commandLine(*npmCmd, 'run', 'something')
}
```

---

## 前端：新增紀錄頁面的完整步驟

### 完整頁面模板（日期篩選型）

```jsx
import { useState, useEffect, useCallback } from 'react'
import RecordFormModal from '../components/RecordFormModal'
import DateNavigator from '../components/DateNavigator'
import TimeInput from '../components/TimeInput'
import SegmentedControl from '../components/SegmentedControl'
import EmptyState from '../components/EmptyState'
import FAB from '../components/FAB'
import { nowLocalString, localDayRange, formatTime } from '../utils/dateUtils'

const TYPE_OPTIONS = [
  { value: 'A', label: '類型A' },
  { value: 'B', label: '類型B' },
]

function makeDefaultForm() {
  return { type: 'A', notes: '', recordedAt: nowLocalString() }
}

const inputClass = 'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export default function XxxPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(makeDefaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const fetchRecords = useCallback(async (date) => {
    const { from, to } = localDayRange(date)
    try {
      const res = await fetch(`/api/v1/xxx?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      if (res.ok) setRecords(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords(selectedDate) }, [fetchRecords, selectedDate])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/xxx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recordedAt: new Date(form.recordedAt).toISOString() }),
      })
      if (res.ok) { await fetchRecords(selectedDate); setModalOpen(false) }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    await fetch(`/api/v1/xxx/${id}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const set = field => value => setForm(f => ({ ...f, [field]: value }))

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">XXX 紀錄</h2>
      <DateNavigator date={selectedDate} onChange={d => { setLoading(true); setSelectedDate(d) }} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState message="這天沒有紀錄" />
      ) : (
        <div className="flex flex-col gap-2">
          {records.map(r => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              {/* 卡片內容 */}
            </div>
          ))}
        </div>
      )}

      <FAB onClick={() => { setForm(makeDefaultForm()); setModalOpen(true) }} />

      <RecordFormModal open={modalOpen} onClose={() => setModalOpen(false)}
          title="新增紀錄" onSubmit={handleSubmit} submitting={submitting}>
        <SegmentedControl options={TYPE_OPTIONS} value={form.type} onChange={set('type')} />
        <TimeInput label="時間" value={form.recordedAt} onChange={set('recordedAt')} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註（選填）</label>
          <textarea rows={2} value={form.notes} onChange={e => set('notes')(e.target.value)}
              className={`${inputClass} resize-none`} />
        </div>
      </RecordFormModal>
    </>
  )
}
```

### 加入路由

在 `App.jsx` 的 `<Routes>` 加一行：
```jsx
<Route path="/records/xxx" element={<XxxPage />} />
```

如果是頂層 tab（如健康頁），在 `BottomTabBar` 也要更新 tab 設定。

---

## 前端：共用工具完整參考

### dateUtils.js 所有函式

| 函式 | 回傳 | 用途 |
|------|------|------|
| `nowLocalString()` | `"2026-05-04T14:30"` | `<input type="datetime-local">` 的預設值 |
| `localDayRange(date)` | `{ from: ISO, to: ISO }` | 日期頁面 fetch API 的 query params |
| `formatTime(isoStr)` | `"14:30"` | 卡片/清單顯示時間 |
| `formatDate(isoStr)` | `"2026年5月4日（週一）"` | 完整日期顯示 |
| `formatShortDate(date)` | `"5月4日（週一）"` | DateNavigator 顯示 |
| `timeAgo(isoStr)` | `"3 小時前"` | 首頁摘要卡片 |
| `formatDuration(minutes)` | `"1 小時 30 分"` | 睡眠時長顯示 |
| `isSameLocalDay(a, b)` | `boolean` | DateNavigator 判斷是否今天 |
| `todayString()` | `"2026年5月4日（週一）"` | 首頁標題日期 |

### 共用元件的 props 簽名

```jsx
// 底部彈出表單（body scroll lock 已內建）
<RecordFormModal open={bool} onClose={fn} title="標題" onSubmit={fn} submitting={bool}>
  {/* form fields */}
</RecordFormModal>

// 單選按鈕組（2-4 個選項適用；超過 4 個改用 <select>）
<SegmentedControl options={[{ value, label }]} value={str} onChange={fn} />

// 日期時間輸入（datetime-local，預設 nowLocalString()）
<TimeInput label="時間" value={form.recordedAt} onChange={set('recordedAt')} />

// 日期前後切換（自動處理「今天」/「回到今天」）
<DateNavigator date={date} onChange={setDate} />

// 無資料佔位
<EmptyState message="這天沒有紀錄" />

// 固定位置 + 按鈕
<FAB onClick={fn} />
```

### 標準 input CSS class

```js
// 通用輸入框（text、number、textarea）
const inputClass = 'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

// select 加 cursor-pointer
const selectClass = `${inputClass} cursor-pointer`

// label 標準樣式
className="text-sm font-medium text-gray-700 dark:text-gray-300"
```

### 月份資料 fetch 模式（HealthPage 等非日期篩選頁）

```js
const fetchData = useCallback(async () => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999)
  const from = encodeURIComponent(firstDay.toISOString())
  const to = encodeURIComponent(lastDay.toISOString())
  try {
    const [res1, res2] = await Promise.all([
      fetch(`/api/v1/xxx?from=${from}&to=${to}`),
      fetch(`/api/v1/yyy?from=${from}&to=${to}`),
    ])
    const [data1, data2] = await Promise.all([res1.json(), res2.json()])
    setData1(data1); setData2(data2)
  } finally {
    setLoading(false)
  }
}, [year, month])

useEffect(() => { fetchData() }, [fetchData])
```

**注意**：不要在 async fetchData 最開頭呼叫 `setLoading(true)`（會觸發 react-hooks/rules 的 setState-in-effect lint error）。loading 的 true 狀態靠 `useState(true)` 初始值，或在 useEffect 內分開 setState。

### UTC → 本地日期 key（月曆用）

```js
function toLocalDateKey(isoStr) {
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
// 結果：'2026-05-04'（local time，非 UTC）
```

---

## 開發規範與陷阱

### 必須遵守

- **互動元素最小點擊區域**：`min-w-[44px] min-h-[44px]`（按鈕、delete icon 等）
- **時間存 UTC**：前端 `new Date(localString).toISOString()` 再傳給後端；顯示時 `new Date(isoStr)` 自動轉本地
- **時長不由前端計算**：`durationMinutes` 由後端計算，前端只傳起訖時間點
- **路由前綴**：API 統一 `/api/v1/`
- **暗色模式**：每個元素都要有 `dark:` 對應樣式

### 常見陷阱

- **SegmentedControl 超過 4 個選項**會很擠，改用 `<select>` + `selectClass`
- **form 的 set helper** 應定義為 `const set = field => value => setForm(f => ({...f, [field]: value}))`，在 JSX 中用 `onChange={set('field')}`；注意這個模式會觸發部分版本 lint 誤報，若遇到改用 inline `onChange={e => setForm(f => ({...f, field: e.target.value}))}`
- **刪除後更新清單**：DELETE 成功後直接 `setRecords(prev => prev.filter(r => r.id !== id))`，不需重新 fetch
- **RecordFormModal 的 open prop**：原始設計是「永遠 mount、用 open 控制顯示」（DiaperPage 模式），或「條件 render（HealthPage 模式）」兩種都可以，但同一頁面只用一種
- **Gradle npm 指令**：一定要用 `*npmCmd` spread，不能直接寫 `'npm'`（Windows 會壞）
- **@ElementCollection** 需要 `fetch = FetchType.EAGER`，否則 lazy loading 在 service 層外會拋 LazyInitializationException

### Lint 已知 pre-existing 錯誤（不需修）

- `AnalysisPage.jsx`：3 個 `Cannot create components during render`（CustomTooltip 定義在 function 內）
- `SleepPage.jsx`：`'tick' is assigned a value but never used`
- `HomePage.jsx`：`Cannot call impure function during render`（`Date.now()` 在 highlight prop）

---

## 後端架構

### 套件結構（`com.smallpeanut`）

```
config/       WebConfig — CORS（允許 localhost:5173）+ SPA fallback（非 /api 路徑回傳 index.html）
controller/   REST 控制器
dto/          Java record，作為 request/response 物件
model/        JPA entities + Enum 定義
repository/   Spring Data JPA 介面
service/      業務邏輯，包含 toResponse() 轉換
```

### 已實作的 API 端點

| 路徑 | 方法 | 說明 |
|------|------|------|
| `/api/v1/health` | GET | 健康檢查 |
| `/api/v1/dashboard` | GET | 首頁摘要（最後餵食/換尿布、今日睡眠、active sleep、待服藥提醒） |
| `/api/v1/diapers` | GET / POST / DELETE `/{id}` | 換尿布紀錄 |
| `/api/v1/feeding` | GET / POST / DELETE `/{id}` | 餵食紀錄 |
| `/api/v1/feeding/{id}/end` | PATCH | 補填結束時間，後端自動計算時長 |
| `/api/v1/sleep` | GET / POST / DELETE `/{id}` | 睡眠紀錄 |
| `/api/v1/sleep/{id}/wake` | PATCH | 補填醒來時間，後端自動計算時長 |
| `/api/v1/pumping` | GET / POST / DELETE `/{id}` | 擠奶紀錄 |
| `/api/v1/pumping/storage` | GET | 有設定儲存方式的擠奶紀錄 |
| `/api/v1/pumping/{id}/remaining` | PATCH | 更新剩餘存量 |
| `/api/v1/milk-storage` | GET / POST / DELETE `/{id}` | 舊母乳庫存（已棄用） |
| `/api/v1/growth` | GET / POST / DELETE `/{id}` | 成長指標 |
| `/api/v1/tags` | GET / POST / DELETE `/{id}` | 狀態標籤 |
| `/api/v1/medication-schedules` | GET / POST / DELETE `/{id}` | 用藥計畫 |
| `/api/v1/medication-schedules/{id}/toggle` | PATCH | 切換計畫啟用/停用 |
| `/api/v1/medication-records` | GET / POST / DELETE `/{id}` | 實際用藥紀錄 |
| `/api/v1/vaccines` | GET / POST / DELETE `/{id}` | 疫苗紀錄 |
| `/api/v1/medical-visits` | GET / POST / DELETE `/{id}` | 就醫紀錄 |

**日期篩選：** GET 端點（`/pumping/storage`、`/growth`、`/dashboard`、`/medication-schedules` 除外）均支援 `?from=<ISO>&to=<ISO>` UTC 時間範圍查詢。不帶參數時回傳全部資料。

### 特殊模式

**母乳庫存**：整合在 `PumpingRecord` 內，三個可 null 欄位（`storageType`、`expiresAt`、`remainingAmount`）。建立時若有 `storageType`，後端自動算 `expiresAt`（常溫 +3h、冷藏 +3d、冷凍 +3mo）並設 `remainingAmount`。

**Active Session**（睡眠/餵食）：POST 時結束時間可 null，PATCH `/{id}/wake` 或 `/{id}/end` 補填，後端用 `ChronoUnit.MINUTES.between()` 計算 `durationMinutes`。

**健康管理（用藥）**：`MedicationSchedule`（計畫）與 `MedicationRecord`（服藥 log）分離。計畫的 `mealSlots` 用 `@ElementCollection(fetch=EAGER)`。建立紀錄時若提供 `scheduleId`，service 自動從計畫複製 name/dosage/route，確保計畫刪除後紀錄仍完整。`DashboardService.buildUpcomingMedications()` 比對今日計畫與紀錄，產生待服藥清單。

---

## 前端架構

### 路由（App.jsx）

```
/                   → HomePage（首頁，dashboard + 用藥提醒 banner）
/records            → RecordsPage（紀錄選單）
/records/feeding    → FeedingPage
/records/breast-milk → BreastMilkPage
/records/sleep      → SleepPage
/records/diapers    → DiaperPage
/records/growth     → GrowthPage
/records/tags       → StatusTagPage
/analysis           → AnalysisPage（Recharts 圖表）
/health             → HealthPage（月曆）
/settings           → SettingsPage
```

### 版面結構

```
<NavBar />                    頂部，子頁面顯示返回 + 頁名，右側暗色模式切換
<main px-4 pt-4 pb-28>        捲動區（pb-28 避免被底欄遮蓋）
  <Routes />
</main>
<BottomTabBar fixed bottom-0> 首頁/紀錄/分析/健康/設定
FAB fixed bottom-24 right-6   各紀錄頁的新增按鈕
```

### 暗色模式

`DarkModeContext`（`context/DarkModeContext.jsx`）包裹整個 App。切換時寫 `localStorage.darkMode` 並操作 `<html>` 的 `dark` class。`tailwind.config.js` 設定 `darkMode: 'class'`。

### HealthPage 月曆架構

`activeModal` string state 控制所有彈窗（`null / 'addMenu' / 'medRecord' / 'vaccine' / 'visit' / 'schedules' / 'addSchedule'`）。月份切換一次 fetch 整月三類資料 + 全部計畫。`eventsByDate` 用 `useMemo` 依本地日期 key 分組三類紀錄（💊藍 / 💉綠 / 🏥橘）。

### AnalysisPage 圖表架構

並行 fetch 5 支 API → `buildChartData()` 統一轉換 → `chartData` state。9 個圖表分 Recharts（BarChart/LineChart/ComposedChart）和純 CSS timeline 兩種。`rTick/rGrid/rTooltip(dark)` 提供 dark-aware props。

### Phase 2 剩餘待開發功能

- 計時器（親餵/擠奶/睡眠計時，結束後自動帶入表單）
- 副食品紀錄
- PWA 支援（安裝至桌面、離線快取）
- 多人即時同步（SSE）
- AI 週趨勢摘要

---

## 後端架構補充說明

### 母乳庫存模式

母乳庫存功能整合在擠奶紀錄內（不是獨立 entity）：
- `PumpingRecord` 有三個可為 null 的欄位：`storageType`（`ROOM_TEMP / FRIDGE / FREEZER`）、`expiresAt`（建立時自動計算）、`remainingAmount`
- 建立擠奶紀錄時若傳入 `storageType`，後端自動計算 `expiresAt`（常溫 +3h、冷藏 +3d、冷凍 +3mo）並將 `remainingAmount` 設為總量
- 庫存頁顯示所有有 `storageType` 的擠奶紀錄；`remainingAmount = 0` 視為用完
- 前端不使用 `/api/v1/milk-storage`（舊的獨立 entity，已棄用但後端仍保留）

### Active Session 模式

睡眠與餵食使用「開始即記錄、事後補結束」模式：
- POST 時 `wokeUpAt` / `endedAt` 可為 null
- PATCH `/{id}/wake` 或 `/{id}/end` 補填結束時間，後端計算 `durationMinutes`
- `durationMinutes` 由後端用 `ChronoUnit.MINUTES.between()` 計算，前端不做時長計算
- 前端用 `records.find(r => r.endedAt == null)` 偵測進行中的 session，顯示 active banner

### 時間處理

- 所有 `LocalDateTime` 欄位存 UTC
- DTO 使用 `Instant`（Jackson 序列化為 ISO-8601 字串，由 `spring.jackson.serialization.write-dates-as-timestamps=false` 保證）
- 轉換固定使用 `ZoneOffset.UTC`，不依賴系統時區
- `ddl-auto=update` — JPA 自動維護 schema，新 entity 或新欄位重啟即生效，不需手動 migration

### 健康管理模式（用藥計畫 vs 用藥紀錄）

健康管理分兩個概念層：

**用藥計畫（`MedicationSchedule`）**：排程設定，驅動首頁提醒
- `timingType`：`MEAL_BASED`（餐次）/ `DAILY_FREQUENCY`（每日N次）/ `AS_NEEDED`（需要時）
- MEAL_BASED 有 `mealSlots`（`@ElementCollection(fetch=EAGER)` join table，enum：`BEFORE_BREAKFAST`、`AFTER_BREAKFAST`、`BEFORE_LUNCH`、`AFTER_LUNCH`、`BEFORE_DINNER`、`AFTER_DINNER`、`BEFORE_SLEEP`）
- DAILY_FREQUENCY 有 `frequencyPerDay`
- `startDate`/`endDate`（`LocalDate`）控制有效期，`endDate` 可為 null（長期）
- `active` flag 可暫停計畫，切換用 `PATCH /{id}/toggle`

**用藥紀錄（`MedicationRecord`）**：實際服藥 log
- `scheduleId`（nullable）—— 提供時 service 自動從計畫複製 name/dosage/route
- `mealSlot` nullable（DAILY_FREQUENCY / AS_NEEDED 不指定餐次）
- 計畫刪除後紀錄仍完整（name/dosage/route 建立時冗餘複製）

**Dashboard 提醒邏輯**（`DashboardService.buildUpcomingMedications()`）：
- 查今日活躍計畫（`findAllActiveForDate(today)`），對照今日已建立的 `MedicationRecord`
- MEAL_BASED：每個尚未記錄的 mealSlot 各產生一筆待辦
- DAILY_FREQUENCY：今日紀錄數 < frequencyPerDay 時顯示進度（doneToday/totalToday）
- AS_NEEDED：不出現在首頁提醒

---

## 前端架構補充說明

### 頁面共用模式（所有紀錄頁面）

所有紀錄頁面遵循相同結構：
1. `selectedDate` state（`useState(() => new Date())`）
2. `fetchRecords(date)` 傳入日期，計算 `localDayRange(date)` 帶入 query params
3. `useEffect(() => { fetchRecords(selectedDate) }, [fetchRecords, selectedDate])`
4. 頁面頂部顯示 `<DateNavigator date={selectedDate} onChange={...} />`
5. 表單透過 `RecordFormModal`（底部 sheet）開啟；時間欄位預設 `nowLocalString()`

Sleep / Feeding 頁面額外有 active session banner（`records.find(r => r.endedAt == null)`），顯示在 DateNavigator 下方、清單上方。

### HealthPage 月曆架構

與其他紀錄頁面結構不同，HealthPage 採月曆模式：
- 以 `year`/`month` state 控制檢視月份，`selectedDay`（數字）控制選中日
- 月份切換時一次 fetch 整月的三類資料（medication-records、vaccines、medical-visits）+ 全部 medication-schedules
- `eventsByDate`（`useMemo`）將三類紀錄依本地日期 key（`YYYY-MM-DD`）分組；local date 轉換用 `new Date(isoStr)` 取 getFullYear/getMonth/getDate（不用 UTC date）
- 月曆格子顯示最多 3 個彩色圓點（💊藍/💉綠/🏥橘），超過顯示 `+n`
- `activeModal` 用單一 string state 控制所有彈窗（`null / 'addMenu' / 'medRecord' / 'vaccine' / 'visit' / 'schedules' / 'addSchedule'`），不拆成多個 boolean
- 「管理用藥計畫」入口在頁面右上角，開啟底部 sheet 列出所有計畫（含啟用/停用切換、刪除）

### AnalysisPage 圖表架構

圖表頁使用 **Recharts**（`recharts` 已在 `frontend/package.json`），資料由真實 API 取得。

**資料流**：`useEffect` 並行 fetch 5 支 API（sleep 7d、feeding 7d、diapers 7d、pumping 14d、growth 全量），統一傳入 `buildChartData()` 轉換成各圖表需要的格式，結果放入 `chartData` state。有 loading spinner 和 error/retry 狀態。

**模組層級 data helpers**：
- `buildDayArray(n)` — 回傳從 n 天前到今天的 Date 陣列
- `onLocalDay(isoStr, date)` — 判斷 ISO 字串是否在指定本地日
- `toLocalDecimalHour(isoStr)` — 轉成小時小數（用於 timeline 定位）
- `buildRange(daysBack)` — 回傳 `{ from, to }` ISO 字串（本地午夜到 23:59:59.999）

**API response 欄位名稱**（`buildChartData` 依賴這些欄位名，不能改）：
- sleep: `fellAsleepAt`、`durationMinutes`（進行中為 null）
- feeding: `startedAt`、`feedingType`、`amountMl`
- diapers: `recordedAt`、`type`（URINE / STOOL / CLEAN）
- pumping: `pumpedAt`、`leftAmount`、`rightAmount`
- growth: `recordedAt`、`weightKg`、`heightCm`、`headCircumferenceCm`

**Theme helpers**（接收 `dark: boolean`）：
- `rTick(dark)` / `rGrid(dark)` / `rTooltip(dark)` — 回傳 Recharts 元件的 dark-aware props

**共用 timeline primitives**（純 CSS，不使用 Recharts）：
- `TimeStrip` — 相對定位容器，背景軌道 + 6/12/18 小時格線，children 用 `absolute` 定位
- `TimeAxis` — 0/6/12/18/24 小時標籤列，與 TimeStrip 寬度對齊
- 使用此組合的圖表：`SleepGanttChart`（睡眠甘特）、`FeedingTimeline`（餵食時間軸）、`ActivityHeatmap`（作息熱力圖）

**ChartCard** — 統一卡片外框，接收 `title / note / children`。

**已實作的 9 個圖表**：

| 元件 | 類型 | 說明 |
|------|------|------|
| `SleepBarChart` | `BarChart` | 每日睡眠時數，近 7 天 |
| `SleepGanttChart` | CSS grid | 入睡時段分布，7×24h |
| `FeedingTimeline` | CSS grid | 餵食時間軸，7×24h，彩色圓點 |
| `FeedingMlChart` | `BarChart` stacked | 每日瓶餵總量，自訂 tooltip |
| `DiaperChart` | `LineChart` | 換尿布次數，三條線 |
| `GrowthChart` | `LineChart` | 成長曲線（無 WHO 參考值，因無出生日期），tab 切換體重/身高/頭圍 |
| `PumpingChart` | `BarChart` stacked | 擠奶量趨勢，近 14 天，左（rose）/右（purple） |
| `ActivityHeatmap` | CSS grid | 作息熱力圖，7×24h，藍格=睡眠，圓點=餵食 |
| `MilkBalanceChart` | `ComposedChart` | 母乳供需，Bar=擠奶（供），Line=瓶餵（需） |

**進行中睡眠**：`durationMinutes` 為 null 時，duration 以 `(Date.now() - fellAsleepAt) / 3600000` 計算，並 cap 在 `24 - startH` 避免超出當日。

### 共用元件

| 元件 | 用途 |
|------|------|
| `RecordFormModal` | 底部 sheet，接收 `open/onClose/title/onSubmit/submitting/children`；body scroll lock 已內建 |
| `DateNavigator` | 日期前後切換，今天顯示「今天」，非今天顯示「回到今天」連結 |
| `SegmentedControl` | 多選一按鈕組（2–4 個選項）；超過 4 個選項改用 `<select>` |
| `TimeInput` | `datetime-local` 輸入，配合 `nowLocalString()` 預設現在時間 |
| `RecordList` / `RecordCard` | 通用清單/卡片（DiaperPage、BreastMilkPage 使用） |
| `EmptyState` | 無資料時的佔位提示 |
| `FAB` | 固定位置新增按鈕（`fixed bottom-24 right-6`） |

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
