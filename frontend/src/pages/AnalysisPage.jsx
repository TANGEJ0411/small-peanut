import { useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useDarkMode } from '../context/DarkModeContext'

// ── Mock data ─────────────────────────────────────────────────────────────────

const FEEDING_META = {
  BREASTFEED:         { label: '親餵',     color: '#6366f1' },
  BOTTLE_BREAST_MILK: { label: '瓶餵母乳', color: '#14b8a6' },
  FORMULA:            { label: '配方奶',   color: '#f97316' },
}

// WHO growth reference (simplified, male 0–12 weeks)
const WHO_REF = {
  weight: [
    { p3:2.5, p50:3.3, p97:4.2 },
    { p3:2.7, p50:3.5, p97:4.5 },
    { p3:3.1, p50:4.2, p97:5.3 },
    { p3:3.5, p50:4.8, p97:6.0 },
    { p3:3.9, p50:5.3, p97:6.6 },
    { p3:4.2, p50:5.7, p97:7.1 },
    { p3:4.5, p50:6.0, p97:7.5 },
  ],
  height: [
    { p3:46.3, p50:49.9, p97:53.4 },
    { p3:49.0, p50:52.7, p97:56.4 },
    { p3:51.5, p50:55.5, p97:59.5 },
    { p3:53.5, p50:57.6, p97:61.7 },
    { p3:55.0, p50:59.4, p97:63.7 },
    { p3:56.5, p50:60.9, p97:65.3 },
    { p3:57.8, p50:62.2, p97:66.6 },
  ],
  head: [
    { p3:31.7, p50:34.5, p97:37.2 },
    { p3:33.5, p50:36.5, p97:39.3 },
    { p3:35.0, p50:38.0, p97:40.9 },
    { p3:36.3, p50:39.3, p97:42.2 },
    { p3:37.4, p50:40.5, p97:43.4 },
    { p3:38.2, p50:41.4, p97:44.5 },
    { p3:39.0, p50:42.1, p97:45.1 },
  ],
}

const WHO_WEEKS = ['出生', '2週', '4週', '6週', '8週', '10週', '12週']

function buildGrowthDataset(whoRef, actualValues) {
  return WHO_WEEKS.map((week, i) => ({
    week,
    p3:     whoRef[i].p3,
    band:   +(whoRef[i].p97 - whoRef[i].p3).toFixed(2),
    p50:    whoRef[i].p50,
    actual: actualValues[i],
  }))
}

function buildMockData() {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  // Sleep totals bar chart
  const sleepData = days.map((day, i) => ({
    day,
    hours: [13.7, 12.7, 14.8, 13.5, 12.5, 15.0, 14.0][i],
  }))

  // Sleep sessions gantt — s: start hour (0–24), d: duration hours
  const rawSessions = [
    [{ s:0.0,d:5.5 },{ s:9.0,d:1.5 },{ s:13.0,d:1.5 },{ s:17.0,d:1.0 },{ s:21.5,d:2.5 }],
    [{ s:0.0,d:4.0 },{ s:8.5,d:2.0 },{ s:13.0,d:1.5 },{ s:17.0,d:1.0 },{ s:22.0,d:2.0 }],
    [{ s:0.0,d:6.0 },{ s:9.0,d:1.5 },{ s:13.5,d:2.0 },{ s:17.5,d:1.0 },{ s:22.0,d:2.0 }],
    [{ s:0.0,d:5.0 },{ s:8.0,d:1.5 },{ s:12.0,d:1.5 },{ s:16.0,d:0.5 },{ s:21.0,d:3.0 }],
    [{ s:0.0,d:4.5 },{ s:8.5,d:1.5 },{ s:12.5,d:2.0 },{ s:16.5,d:1.0 },{ s:21.5,d:2.5 }],
    [{ s:0.0,d:6.0 },{ s:9.5,d:1.5 },{ s:13.0,d:1.5 },{ s:17.0,d:1.0 },{ s:22.0,d:2.0 }],
    [{ s:0.0,d:5.5 },{ s:9.0,d:1.5 },{ s:12.5,d:1.5 },{ s:17.0,d:1.0 },{ s:21.5,d:2.5 }],
  ]
  const sleepGanttData = days.map((day, i) => ({ day, sessions: rawSessions[i] }))

  // Feeding timeline — h: decimal hour (0–24), t: feeding type
  const rawFeedings = [
    [{ h:1.5,t:'BREASTFEED' },{ h:4.0,t:'BREASTFEED' },{ h:7.0,t:'BOTTLE_BREAST_MILK' },{ h:10.0,t:'BREASTFEED' },{ h:13.0,t:'BREASTFEED' },{ h:16.5,t:'FORMULA' },{ h:19.5,t:'BREASTFEED' },{ h:22.5,t:'BREASTFEED' }],
    [{ h:2.0,t:'BREASTFEED' },{ h:4.5,t:'BREASTFEED' },{ h:7.5,t:'BREASTFEED' },{ h:10.5,t:'FORMULA' },{ h:13.5,t:'BREASTFEED' },{ h:17.0,t:'BOTTLE_BREAST_MILK' },{ h:20.0,t:'BREASTFEED' },{ h:23.0,t:'BREASTFEED' }],
    [{ h:1.0,t:'BREASTFEED' },{ h:3.5,t:'BREASTFEED' },{ h:6.5,t:'BOTTLE_BREAST_MILK' },{ h:9.5,t:'BREASTFEED' },{ h:12.5,t:'BREASTFEED' },{ h:15.5,t:'FORMULA' },{ h:18.5,t:'BREASTFEED' },{ h:21.5,t:'BREASTFEED' }],
    [{ h:2.5,t:'BREASTFEED' },{ h:5.0,t:'BREASTFEED' },{ h:8.0,t:'BREASTFEED' },{ h:11.0,t:'BOTTLE_BREAST_MILK' },{ h:14.0,t:'BREASTFEED' },{ h:17.5,t:'BREASTFEED' },{ h:20.5,t:'FORMULA' },{ h:23.5,t:'BREASTFEED' }],
    [{ h:1.5,t:'BREASTFEED' },{ h:4.0,t:'BREASTFEED' },{ h:7.0,t:'BREASTFEED' },{ h:10.0,t:'FORMULA' },{ h:13.0,t:'BREASTFEED' },{ h:16.0,t:'BOTTLE_BREAST_MILK' },{ h:19.0,t:'BREASTFEED' },{ h:22.0,t:'BREASTFEED' }],
    [{ h:2.0,t:'BREASTFEED' },{ h:4.5,t:'BREASTFEED' },{ h:7.5,t:'BOTTLE_BREAST_MILK' },{ h:10.5,t:'BREASTFEED' },{ h:14.0,t:'BREASTFEED' },{ h:17.0,t:'FORMULA' },{ h:20.0,t:'BREASTFEED' },{ h:23.0,t:'BREASTFEED' }],
    [{ h:1.5,t:'BREASTFEED' },{ h:3.5,t:'BREASTFEED' },{ h:6.5,t:'BREASTFEED' },{ h:9.5,t:'FORMULA' },{ h:12.0,t:'BOTTLE_BREAST_MILK' },{ h:15.0,t:'BREASTFEED' },{ h:18.0,t:'BREASTFEED' },{ h:21.5,t:'BREASTFEED' }],
  ]
  const feedingData = days.map((day, i) => ({ day, events: rawFeedings[i] }))

  // Feeding daily ml — bottle breast milk + formula
  const feedingMlData = days.map((day, i) => ({
    day,
    bottle:  [130, 110, 150, 120, 100, 140, 130][i],
    formula: [90,   80,  95,  85,  90,  80, 100][i],
  }))

  const diaperData = days.map((day, i) => ({
    day,
    urine: [7, 6, 8, 5, 7, 6, 8][i],
    stool: [2, 1, 3, 2, 1, 2, 3][i],
    clean: [1, 0, 1, 0, 1, 0, 1][i],
  }))

  // Growth curve with WHO reference bands
  const growthData = {
    weight: buildGrowthDataset(WHO_REF.weight, [3.4, 3.2, 4.1, 5.0, 5.5, 5.8, 6.2]),
    height: buildGrowthDataset(WHO_REF.height, [50.2, 52.0, 54.8, 57.0, 59.0, 60.5, 62.0]),
    head:   buildGrowthDataset(WHO_REF.head,   [34.8, 36.2, 37.5, 39.0, 40.2, 41.0, 42.0]),
  }

  // Pumping 14-day trend
  const pumpingDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (13 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
  const pumpingData = pumpingDays.map((day, i) => ({
    day,
    left:  [65, 70, 72, 68, 75, 80, 78, 82, 85, 79, 83, 88, 85, 90][i],
    right: [60, 65, 68, 63, 70, 72, 70, 75, 78, 72, 77, 80, 78, 84][i],
  }))

  // Milk balance: daily pumped vs bottle-fed consumed
  const milkBalanceData = days.map((day, i) => ({
    day,
    supply: [380, 420, 410, 390, 445, 460, 435][i],
    demand: [370, 395, 440, 360, 410, 450, 430][i],
  }))

  return { sleepData, sleepGanttData, feedingData, feedingMlData, diaperData, growthData, pumpingData, milkBalanceData }
}

const MOCK = buildMockData()

// ── Recharts theme helpers ────────────────────────────────────────────────────

const rTick = dark => ({ fill: dark ? '#9ca3af' : '#6b7280', fontSize: 11 })
const rGrid = dark => ({ stroke: dark ? '#374151' : '#e5e7eb', strokeDasharray: '3 3' })
const rTooltip = dark => ({
  contentStyle: {
    background: dark ? '#1f2937' : '#fff',
    border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: dark ? '#f9fafb' : '#111827', fontWeight: 600 },
  itemStyle:  { color: dark ? '#d1d5db' : '#374151' },
})

// ── Shared timeline primitives ────────────────────────────────────────────────

function TimeStrip({ height = 'h-7', children }) {
  return (
    <div className={`flex-1 relative ${height} overflow-hidden`}>
      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700/50 rounded" />
      {[6, 12, 18].map(h => (
        <div
          key={h}
          className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"
          style={{ left: `${(h / 24) * 100}%` }}
        />
      ))}
      {children}
    </div>
  )
}

function TimeAxis() {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="w-9 shrink-0" />
      <div className="flex-1 relative h-4">
        {[0, 6, 12, 18, 24].map(h => (
          <span
            key={h}
            style={{ left: `${(h / 24) * 100}%` }}
            className={`absolute text-[10px] text-gray-400 dark:text-gray-500 leading-none select-none ${
              h === 0  ? '' :
              h === 24 ? '-translate-x-full' :
                         '-translate-x-1/2'
            }`}
          >
            {h}
          </span>
        ))}
      </div>
    </div>
  )
}

function fmtHour(h) {
  const hh = String(Math.floor(h % 24)).padStart(2, '0')
  const mm = String(Math.round((h % 1) * 60)).padStart(2, '0')
  return `${hh}:${mm}`
}

// ── ChartCard wrapper ─────────────────────────────────────────────────────────

function ChartCard({ title, note, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</p>
        {note && <p className="text-xs text-gray-400 dark:text-gray-500">{note}</p>}
      </div>
      {children}
    </div>
  )
}

// ── 1a. Sleep total bar chart ─────────────────────────────────────────────────

function SleepBarChart({ dark }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={MOCK.sleepData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <CartesianGrid {...rGrid(dark)} />
        <XAxis dataKey="day" tick={rTick(dark)} />
        <YAxis
          tick={rTick(dark)}
          domain={[0, 18]}
          ticks={[0, 6, 12, 18]}
          tickFormatter={v => `${v}h`}
        />
        <Tooltip {...rTooltip(dark)} formatter={v => [`${v} 小時`, '睡眠']} />
        <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── 1b. Sleep Gantt chart ─────────────────────────────────────────────────────

function SleepGanttChart() {
  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {MOCK.sleepGanttData.map(({ day, sessions }) => (
          <div key={day} className="flex items-center gap-2">
            <span className="w-9 shrink-0 text-[10px] text-gray-400 dark:text-gray-500 text-right leading-none">
              {day}
            </span>
            <TimeStrip height="h-7">
              {sessions.map((s, i) => {
                const left  = (s.s / 24) * 100
                const width = (Math.min(s.d, 24 - s.s) / 24) * 100
                return (
                  <div
                    key={i}
                    title={`${fmtHour(s.s)} – ${fmtHour(s.s + s.d)}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    className="absolute top-1 bottom-1 bg-blue-400 dark:bg-blue-500 rounded-sm opacity-85"
                  />
                )
              })}
            </TimeStrip>
          </div>
        ))}
      </div>
      <TimeAxis />
    </div>
  )
}

// ── 2. Feeding timeline ───────────────────────────────────────────────────────

function FeedingTimeline() {
  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {MOCK.feedingData.map(({ day, events }) => (
          <div key={day} className="flex items-center gap-2">
            <span className="w-9 shrink-0 text-[10px] text-gray-400 dark:text-gray-500 text-right leading-none">
              {day}
            </span>
            <TimeStrip height="h-6">
              {events.map((e, i) => (
                <div
                  key={i}
                  title={`${FEEDING_META[e.t].label}・${fmtHour(e.h)}`}
                  style={{ left: `${(e.h / 24) * 100}%`, background: FEEDING_META[e.t].color }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full shadow-sm"
                />
              ))}
            </TimeStrip>
          </div>
        ))}
      </div>
      <TimeAxis />
      <div className="flex gap-4 mt-3 flex-wrap">
        {Object.entries(FEEDING_META).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 3. Feeding daily ml stacked bar chart ────────────────────────────────────

function FeedingMlChart({ dark }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0)
    return (
      <div style={{
        background: dark ? '#1f2937' : '#fff',
        border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}>
        <p style={{ color: dark ? '#f9fafb' : '#111827', fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.fill, margin: '2px 0' }}>
            {p.dataKey === 'bottle' ? '瓶餵母乳' : '配方奶'}：{p.value} ml
          </p>
        ))}
        <p style={{ color: dark ? '#d1d5db' : '#374151', marginTop: 4, borderTop: `1px solid ${dark ? '#374151' : '#e5e7eb'}`, paddingTop: 4 }}>
          合計：{total} ml
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={MOCK.feedingMlData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <CartesianGrid {...rGrid(dark)} />
        <XAxis dataKey="day" tick={rTick(dark)} />
        <YAxis tick={rTick(dark)} tickFormatter={v => `${v}`} unit=" ml" />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconSize={8}
          formatter={name => (
            <span style={{ fontSize: 11, color: dark ? '#9ca3af' : '#6b7280' }}>
              {name === 'bottle' ? '瓶餵母乳' : '配方奶'}
            </span>
          )}
        />
        <Bar dataKey="bottle"  stackId="ml" fill="#14b8a6" radius={[0, 0, 0, 0]} maxBarSize={40} />
        <Bar dataKey="formula" stackId="ml" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── 4. Diaper line chart ──────────────────────────────────────────────────────

const DIAPER_LABELS = { urine: '尿尿', stool: '便便', clean: '乾淨' }

function DiaperChart({ dark }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={MOCK.diaperData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <CartesianGrid {...rGrid(dark)} />
        <XAxis dataKey="day" tick={rTick(dark)} />
        <YAxis tick={rTick(dark)} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
        <Tooltip
          {...rTooltip(dark)}
          formatter={(v, name) => [v, DIAPER_LABELS[name] ?? name]}
        />
        <Legend
          iconSize={8}
          formatter={name => (
            <span style={{ fontSize: 11, color: dark ? '#9ca3af' : '#6b7280' }}>
              {DIAPER_LABELS[name] ?? name}
            </span>
          )}
        />
        <Line type="monotone" dataKey="urine" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="stool" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="clean" stroke="#9ca3af" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── 5. Growth curve with WHO percentile bands ─────────────────────────────────

const GROWTH_METRICS = [
  { key: 'weight', label: '體重', unit: 'kg' },
  { key: 'height', label: '身高', unit: 'cm' },
  { key: 'head',   label: '頭圍', unit: 'cm' },
]

function GrowthChart({ dark }) {
  const [metric, setMetric] = useState('weight')
  const data = MOCK.growthData[metric]
  const { unit } = GROWTH_METRICS.find(m => m.key === metric)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const p3Val     = payload.find(p => p.dataKey === 'p3')?.value
    const bandVal   = payload.find(p => p.dataKey === 'band')?.value
    const p50Val    = payload.find(p => p.dataKey === 'p50')?.value
    const actualVal = payload.find(p => p.dataKey === 'actual')?.value
    const p97Val    = p3Val != null && bandVal != null ? +(p3Val + bandVal).toFixed(1) : null

    return (
      <div style={{
        background: dark ? '#1f2937' : '#fff',
        border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}>
        <p style={{ color: dark ? '#f9fafb' : '#111827', fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {actualVal != null && (
          <p style={{ color: '#2563eb', margin: '2px 0' }}>實測：{actualVal} {unit}</p>
        )}
        {p50Val != null && (
          <p style={{ color: dark ? '#93c5fd' : '#60a5fa', margin: '2px 0' }}>P50：{p50Val} {unit}</p>
        )}
        {p3Val != null && p97Val != null && (
          <p style={{
            color: dark ? '#9ca3af' : '#6b7280',
            borderTop: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
            paddingTop: 4, marginTop: 4,
          }}>
            P3–P97：{p3Val}–{p97Val} {unit}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {GROWTH_METRICS.map(m => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={`min-h-[36px] px-3 rounded-lg text-xs font-medium border transition-colors ${
              metric === m.key
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
            }`}
          >
            {m.label}（{m.unit}）
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
          <CartesianGrid {...rGrid(dark)} />
          <XAxis dataKey="week" tick={rTick(dark)} />
          <YAxis tick={rTick(dark)} domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          {/* WHO band: transparent base lifts the colored band up to P3–P97 range */}
          <Area
            type="monotone" dataKey="p3" stackId="who"
            fill="transparent" stroke="none"
            legendType="none" isAnimationActive={false}
          />
          <Area
            type="monotone" dataKey="band" stackId="who"
            fill="#3b82f6" fillOpacity={0.12} stroke="none"
            name="WHO P3–P97" legendType="square" isAnimationActive={false}
          />
          <Line
            type="monotone" dataKey="p50"
            stroke={dark ? '#93c5fd' : '#60a5fa'} strokeDasharray="4 3" strokeWidth={1.5}
            dot={false} name="P50 中位數"
          />
          <Line
            type="monotone" dataKey="actual"
            stroke="#2563eb" strokeWidth={2.5}
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6 }}
            name="實測" connectNulls
          />
          <Legend
            iconSize={8}
            formatter={name => (
              <span style={{ fontSize: 11, color: dark ? '#9ca3af' : '#6b7280' }}>{name}</span>
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── 6. Pumping 14-day trend ───────────────────────────────────────────────────

function PumpingChart({ dark }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const left  = payload.find(p => p.dataKey === 'left')?.value ?? 0
    const right = payload.find(p => p.dataKey === 'right')?.value ?? 0
    return (
      <div style={{
        background: dark ? '#1f2937' : '#fff',
        border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}>
        <p style={{ color: dark ? '#f9fafb' : '#111827', fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#f472b6', margin: '2px 0' }}>左：{left} ml</p>
        <p style={{ color: '#c084fc', margin: '2px 0' }}>右：{right} ml</p>
        <p style={{
          color: dark ? '#d1d5db' : '#374151',
          borderTop: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
          paddingTop: 4, marginTop: 4,
        }}>
          合計：{left + right} ml
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={MOCK.pumpingData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <CartesianGrid {...rGrid(dark)} />
        <XAxis dataKey="day" tick={rTick(dark)} interval={1} />
        <YAxis tick={rTick(dark)} unit=" ml" />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconSize={8}
          formatter={name => (
            <span style={{ fontSize: 11, color: dark ? '#9ca3af' : '#6b7280' }}>
              {name === 'left' ? '左側' : '右側'}
            </span>
          )}
        />
        <Bar dataKey="left"  stackId="pump" fill="#f472b6" radius={[0, 0, 0, 0]} maxBarSize={32} name="left" />
        <Bar dataKey="right" stackId="pump" fill="#c084fc" radius={[4, 4, 0, 0]} maxBarSize={32} name="right" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── 7. Activity heatmap (sleep + feeding) ────────────────────────────────────

function ActivityHeatmap() {
  const rows = MOCK.sleepGanttData.map(({ day, sessions }, dayIdx) => {
    const feedings = MOCK.feedingData[dayIdx].events
    return {
      day,
      cells: Array.from({ length: 24 }, (_, h) => {
        // session overlaps with the hour interval [h, h+1)
        const sleeping = sessions.some(s => h + 1 > s.s && h < s.s + Math.min(s.d, 24 - s.s))
        const feedEvents = feedings.filter(e => Math.floor(e.h) === h)
        return { h, sleeping, feedEvents }
      }),
    }
  })

  return (
    <div>
      <div className="flex flex-col gap-1">
        {rows.map(({ day, cells }) => (
          <div key={day} className="flex items-center gap-1.5">
            <span className="w-9 shrink-0 text-[10px] text-gray-400 dark:text-gray-500 text-right leading-none">
              {day}
            </span>
            <div className="flex-1 flex gap-px">
              {cells.map(({ h, sleeping, feedEvents }) => {
                const hasFeed = feedEvents.length > 0
                const feedColor = hasFeed ? FEEDING_META[feedEvents[0].t].color : null
                return (
                  <div
                    key={h}
                    title={`${String(h).padStart(2,'0')}:00${sleeping ? ' 睡眠' : ''}${hasFeed ? ' 餵食' : ''}`}
                    className={`flex-1 h-5 rounded-sm flex items-center justify-center ${
                      sleeping
                        ? 'bg-blue-200 dark:bg-blue-900/70'
                        : 'bg-gray-100 dark:bg-gray-700/30'
                    }`}
                  >
                    {hasFeed && (
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: feedColor }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <TimeAxis />
      <div className="flex gap-4 mt-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-blue-200 dark:bg-blue-900/70 shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400">睡眠</span>
        </div>
        {Object.entries(FEEDING_META).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 8. Milk supply vs demand ──────────────────────────────────────────────────

function MilkBalanceChart({ dark }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const supply = payload.find(p => p.dataKey === 'supply')?.value ?? 0
    const demand = payload.find(p => p.dataKey === 'demand')?.value ?? 0
    const diff = supply - demand
    return (
      <div style={{
        background: dark ? '#1f2937' : '#fff',
        border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}>
        <p style={{ color: dark ? '#f9fafb' : '#111827', fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#14b8a6', margin: '2px 0' }}>擠奶：{supply} ml</p>
        <p style={{ color: '#f97316', margin: '2px 0' }}>瓶餵：{demand} ml</p>
        <p style={{
          color: diff >= 0 ? '#10b981' : '#ef4444',
          borderTop: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
          paddingTop: 4, marginTop: 4,
        }}>
          {diff >= 0 ? `盈餘 +${diff}` : `不足 ${diff}`} ml
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={210}>
      <ComposedChart data={MOCK.milkBalanceData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <CartesianGrid {...rGrid(dark)} />
        <XAxis dataKey="day" tick={rTick(dark)} />
        <YAxis tick={rTick(dark)} unit=" ml" domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconSize={8}
          formatter={name => (
            <span style={{ fontSize: 11, color: dark ? '#9ca3af' : '#6b7280' }}>
              {name === 'supply' ? '擠奶（供）' : '瓶餵（需）'}
            </span>
          )}
        />
        <Bar dataKey="supply" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} name="supply" />
        <Line
          type="monotone" dataKey="demand"
          stroke="#f97316" strokeWidth={2.5}
          dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 6 }}
          name="demand"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { dark } = useDarkMode()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500">示範資料</p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">資料分析</h1>
      </div>

      <ChartCard title="😴 每日睡眠時數" note="近 7 天・小時">
        <SleepBarChart dark={dark} />
      </ChartCard>

      <ChartCard title="😴 入睡時段分布" note="近 7 天・24 小時">
        <SleepGanttChart />
      </ChartCard>

      <ChartCard title="🥛 餵食時間軸" note="近 7 天・24 小時">
        <FeedingTimeline />
      </ChartCard>

      <ChartCard title="🍼 每日瓶餵總量" note="近 7 天・ml">
        <FeedingMlChart dark={dark} />
      </ChartCard>

      <ChartCard title="👶 換尿布次數" note="近 7 天・次">
        <DiaperChart dark={dark} />
      </ChartCard>

      <ChartCard title="📏 成長曲線" note="WHO 百分位參考">
        <GrowthChart dark={dark} />
      </ChartCard>

      <ChartCard title="🍼 擠奶量趨勢" note="近 14 天・ml">
        <PumpingChart dark={dark} />
      </ChartCard>

      <ChartCard title="🗓️ 作息熱力圖" note="近 7 天・睡眠 & 餵食">
        <ActivityHeatmap />
      </ChartCard>

      <ChartCard title="🥛 母乳供需" note="近 7 天・ml">
        <MilkBalanceChart dark={dark} />
      </ChartCard>
    </div>
  )
}
