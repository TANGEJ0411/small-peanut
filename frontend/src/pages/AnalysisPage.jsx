import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useDarkMode } from '../context/DarkModeContext'

// ── Constants ─────────────────────────────────────────────────────────────────

const FEEDING_META = {
  BREASTFEED:         { label: '親餵',     color: '#6366f1' },
  BOTTLE_BREAST_MILK: { label: '瓶餵母乳', color: '#14b8a6' },
  FORMULA:            { label: '配方奶',   color: '#f97316' },
}

const GROWTH_METRICS = [
  { key: 'weight', label: '體重', unit: 'kg',  field: 'weightKg' },
  { key: 'height', label: '身高', unit: 'cm',  field: 'heightCm' },
  { key: 'head',   label: '頭圍', unit: 'cm',  field: 'headCircumferenceCm' },
]

// ── Data helpers ──────────────────────────────────────────────────────────────

function buildDayArray(n) {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (n - 1 - i))
    return d
  })
}

function dayLabel(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function onLocalDay(isoStr, date) {
  const d = new Date(isoStr)
  return d.getFullYear() === date.getFullYear() &&
         d.getMonth()    === date.getMonth()    &&
         d.getDate()     === date.getDate()
}

function toLocalDecimalHour(isoStr) {
  const d = new Date(isoStr)
  return d.getHours() + d.getMinutes() / 60
}

function buildRange(daysBack) {
  const end = new Date(); end.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setDate(start.getDate() - (daysBack - 1))
  start.setHours(0, 0, 0, 0)
  return { from: start.toISOString(), to: end.toISOString() }
}

function buildChartData({ sleep, feeding, diapers, pumping, growth, solidFood }) {
  const days7  = buildDayArray(7)
  const days14 = buildDayArray(14)

  // ── Sleep ──────────────────────────────────────────────────────────────────
  const sleepData = days7.map(day => {
    const recs = sleep.filter(r => onLocalDay(r.fellAsleepAt, day))
    const mins = recs.reduce((s, r) => s + (r.durationMinutes ?? 0), 0)
    return { day: dayLabel(day), hours: +(mins / 60).toFixed(1) }
  })

  const sleepGanttData = days7.map(day => ({
    day: dayLabel(day),
    sessions: sleep
      .filter(r => onLocalDay(r.fellAsleepAt, day))
      .map(r => {
        const startH = toLocalDecimalHour(r.fellAsleepAt)
        const durH = r.durationMinutes != null
          ? r.durationMinutes / 60
          : Math.min((Date.now() - new Date(r.fellAsleepAt)) / 3600000, 24 - startH)
        return { s: startH, d: +durH.toFixed(2) }
      }),
  }))

  // ── Feeding ────────────────────────────────────────────────────────────────
  const feedingData = days7.map(day => ({
    day: dayLabel(day),
    events: feeding
      .filter(r => onLocalDay(r.startedAt, day))
      .map(r => ({ h: toLocalDecimalHour(r.startedAt), t: r.feedingType })),
  }))

  const feedingMlData = days7.map(day => {
    const recs = feeding.filter(r => onLocalDay(r.startedAt, day))
    return {
      day: dayLabel(day),
      bottle:  recs.filter(r => r.feedingType === 'BOTTLE_BREAST_MILK').reduce((s, r) => s + (r.amountMl ?? 0), 0),
      formula: recs.filter(r => r.feedingType === 'FORMULA').reduce((s, r) => s + (r.amountMl ?? 0), 0),
    }
  })

  // ── Diaper ─────────────────────────────────────────────────────────────────
  const diaperData = days7.map(day => {
    const recs = diapers.filter(r => onLocalDay(r.recordedAt, day))
    return {
      day: dayLabel(day),
      urine: recs.filter(r => r.type === 'URINE').length,
      stool: recs.filter(r => r.type === 'STOOL').length,
      clean: recs.filter(r => r.type === 'CLEAN').length,
    }
  })

  // ── Pumping ────────────────────────────────────────────────────────────────
  const pumpingData = days14.map(day => {
    const recs = pumping.filter(r => onLocalDay(r.pumpedAt, day))
    return {
      day: dayLabel(day),
      left:  recs.reduce((s, r) => s + (r.leftAmount  ?? 0), 0),
      right: recs.reduce((s, r) => s + (r.rightAmount ?? 0), 0),
    }
  })

  // ── Milk balance ───────────────────────────────────────────────────────────
  const milkBalanceData = days7.map(day => ({
    day: dayLabel(day),
    supply: pumping
      .filter(r => onLocalDay(r.pumpedAt, day))
      .reduce((s, r) => s + (r.leftAmount ?? 0) + (r.rightAmount ?? 0), 0),
    demand: feeding
      .filter(r => onLocalDay(r.startedAt, day))
      .filter(r => r.feedingType === 'BOTTLE_BREAST_MILK' || r.feedingType === 'FORMULA')
      .reduce((s, r) => s + (r.amountMl ?? 0), 0),
  }))

  // ── Growth ─────────────────────────────────────────────────────────────────
  const sortedGrowth = [...growth].reverse() // oldest first
  function growthSeries(field) {
    return sortedGrowth
      .filter(r => r[field] != null)
      .map(r => ({ date: dayLabel(new Date(r.recordedAt)), value: r[field] }))
  }
  const growthData = {
    weight: growthSeries('weightKg'),
    height: growthSeries('heightCm'),
    head:   growthSeries('headCircumferenceCm'),
  }

  // ── Solid food vs milk ────────────────────────────────────────────────────
  const solidFoodMilkData = days14.map(day => {
    const sfRecs = solidFood.filter(r => onLocalDay(r.recordedAt, day))
    const fRecs  = feeding.filter(r => onLocalDay(r.startedAt, day))
    return {
      day: dayLabel(day),
      milkMl: fRecs
        .filter(r => r.feedingType === 'BOTTLE_BREAST_MILK' || r.feedingType === 'FORMULA')
        .reduce((s, r) => s + (r.amountMl ?? 0), 0),
      solidG: sfRecs.reduce((s, r) => s + (r.amountG ?? 0), 0),
    }
  })

  return { sleepData, sleepGanttData, feedingData, feedingMlData, diaperData, pumpingData, milkBalanceData, growthData, solidFoodMilkData }
}

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

function SleepBarChart({ data, dark }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
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

function SleepGanttChart({ data }) {
  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {data.map(({ day, sessions }) => (
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

function FeedingTimeline({ data }) {
  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {data.map(({ day, events }) => (
          <div key={day} className="flex items-center gap-2">
            <span className="w-9 shrink-0 text-[10px] text-gray-400 dark:text-gray-500 text-right leading-none">
              {day}
            </span>
            <TimeStrip height="h-6">
              {events.map((e, i) => {
                const meta = FEEDING_META[e.t]
                if (!meta) return null
                return (
                  <div
                    key={i}
                    title={`${meta.label}・${fmtHour(e.h)}`}
                    style={{ left: `${(e.h / 24) * 100}%`, background: meta.color }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full shadow-sm"
                  />
                )
              })}
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

function FeedingMlChart({ data, dark }) {
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
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <CartesianGrid {...rGrid(dark)} />
        <XAxis dataKey="day" tick={rTick(dark)} />
        <YAxis tick={rTick(dark)} unit=" ml" />
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

function DiaperChart({ data, dark }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <CartesianGrid {...rGrid(dark)} />
        <XAxis dataKey="day" tick={rTick(dark)} />
        <YAxis tick={rTick(dark)} domain={[0, 'auto']} allowDecimals={false} />
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

// ── 5. Growth curve ───────────────────────────────────────────────────────────

function GrowthChart({ data, dark }) {
  const [metric, setMetric] = useState('weight')
  const series = data[metric]
  const m = GROWTH_METRICS.find(x => x.key === metric)

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {GROWTH_METRICS.map(x => (
          <button
            key={x.key}
            type="button"
            onClick={() => setMetric(x.key)}
            className={`min-h-[36px] px-3 rounded-lg text-xs font-medium border transition-colors ${
              metric === x.key
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
            }`}
          >
            {x.label}（{x.unit}）
          </button>
        ))}
      </div>

      {series.length === 0 ? (
        <p className="text-sm text-center text-gray-400 dark:text-gray-500 py-12">尚無成長紀錄</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid {...rGrid(dark)} />
            <XAxis dataKey="date" tick={rTick(dark)} />
            <YAxis tick={rTick(dark)} domain={['auto', 'auto']} />
            <Tooltip
              {...rTooltip(dark)}
              formatter={v => [`${v} ${m.unit}`, m.label]}
            />
            <Line
              type="monotone" dataKey="value"
              stroke="#2563eb" strokeWidth={2.5}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ── 6. Pumping 14-day trend ───────────────────────────────────────────────────

function PumpingChart({ data, dark }) {
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
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
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

// ── 7. Activity heatmap ───────────────────────────────────────────────────────

function ActivityHeatmap({ ganttData, timelineData }) {
  const rows = ganttData.map(({ day, sessions }, idx) => {
    const feedings = timelineData[idx]?.events ?? []
    return {
      day,
      cells: Array.from({ length: 24 }, (_, h) => {
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
                const meta = hasFeed ? FEEDING_META[feedEvents[0].t] : null
                return (
                  <div
                    key={h}
                    title={`${String(h).padStart(2, '0')}:00${sleeping ? ' 睡眠' : ''}${hasFeed ? ' 餵食' : ''}`}
                    className={`flex-1 h-5 rounded-sm flex items-center justify-center ${
                      sleeping
                        ? 'bg-blue-200 dark:bg-blue-900/70'
                        : 'bg-gray-100 dark:bg-gray-700/30'
                    }`}
                  >
                    {hasFeed && meta && (
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
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

function MilkBalanceChart({ data, dark }) {
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
        {(supply > 0 || demand > 0) && (
          <p style={{
            color: diff >= 0 ? '#10b981' : '#ef4444',
            borderTop: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
            paddingTop: 4, marginTop: 4,
          }}>
            {diff >= 0 ? `盈餘 +${diff}` : `不足 ${diff}`} ml
          </p>
        )}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={210}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
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

// ── 9. Solid food vs milk comparison ────────────────────────────────────────

function SolidFoodMilkChart({ data, dark }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const milk  = payload.find(p => p.dataKey === 'milkMl')?.value ?? 0
    const solid = payload.find(p => p.dataKey === 'solidG')?.value ?? 0
    return (
      <div style={{
        background: dark ? '#1f2937' : '#fff',
        border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}>
        <p style={{ color: dark ? '#f9fafb' : '#111827', fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#3b82f6', margin: '2px 0' }}>喝奶：{milk} ml</p>
        <p style={{ color: '#84cc16', margin: '2px 0' }}>副食品：{solid} g</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={210}>
      <ComposedChart data={data} margin={{ top: 4, right: 40, bottom: 0, left: -8 }}>
        <CartesianGrid {...rGrid(dark)} />
        <XAxis dataKey="day" tick={rTick(dark)} interval={1} />
        <YAxis yAxisId="milk"  tick={rTick(dark)} unit=" ml" domain={[0, 'auto']} />
        <YAxis yAxisId="solid" orientation="right" tick={rTick(dark)} unit=" g" domain={[0, 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconSize={8}
          formatter={name => (
            <span style={{ fontSize: 11, color: dark ? '#9ca3af' : '#6b7280' }}>
              {name === 'milkMl' ? '喝奶（ml）' : '副食品（g）'}
            </span>
          )}
        />
        <Bar
          yAxisId="milk" dataKey="milkMl"
          fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32}
          name="milkMl"
        />
        <Line
          yAxisId="solid" dataKey="solidG" type="monotone"
          stroke="#84cc16" strokeWidth={2.5}
          dot={{ r: 4, fill: '#84cc16', strokeWidth: 0 }} activeDot={{ r: 6 }}
          name="solidG"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { dark } = useDarkMode()
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const r7  = buildRange(7)
        const r14 = buildRange(14)
        const q7  = `from=${encodeURIComponent(r7.from)}&to=${encodeURIComponent(r7.to)}`
        const q14 = `from=${encodeURIComponent(r14.from)}&to=${encodeURIComponent(r14.to)}`
        const [sleep, feeding, diapers, pumping, growth, solidFood] = await Promise.all([
          fetch(`/api/v1/sleep?${q7}`).then(r => r.json()),
          fetch(`/api/v1/feeding?${q14}`).then(r => r.json()),
          fetch(`/api/v1/diapers?${q7}`).then(r => r.json()),
          fetch(`/api/v1/pumping?${q14}`).then(r => r.json()),
          fetch('/api/v1/growth').then(r => r.json()),
          fetch(`/api/v1/solid-food?${q14}`).then(r => r.json()),
        ])
        setChartData(buildChartData({ sleep, feeding, diapers, pumping, growth, solidFood }))
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !chartData) {
    return (
      <div className="flex flex-col items-center py-32 gap-3">
        <p className="text-gray-500 dark:text-gray-400">載入資料失敗</p>
        <button
          onClick={() => { setError(false); setLoading(true) }}
          className="text-sm text-blue-500 underline"
        >
          重試
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">資料分析</h1>

      <ChartCard title="😴 每日睡眠時數" note="近 7 天・小時">
        <SleepBarChart data={chartData.sleepData} dark={dark} />
      </ChartCard>

      <ChartCard title="😴 入睡時段分布" note="近 7 天・24 小時">
        <SleepGanttChart data={chartData.sleepGanttData} />
      </ChartCard>

      <ChartCard title="🥛 餵食時間軸" note="近 7 天・24 小時">
        <FeedingTimeline data={chartData.feedingData} />
      </ChartCard>

      <ChartCard title="🍼 每日瓶餵總量" note="近 7 天・ml">
        <FeedingMlChart data={chartData.feedingMlData} dark={dark} />
      </ChartCard>

      <ChartCard title="👶 換尿布次數" note="近 7 天・次">
        <DiaperChart data={chartData.diaperData} dark={dark} />
      </ChartCard>

      <ChartCard title="📏 成長曲線" note="歷史紀錄">
        <GrowthChart data={chartData.growthData} dark={dark} />
      </ChartCard>

      <ChartCard title="🍼 擠奶量趨勢" note="近 14 天・ml">
        <PumpingChart data={chartData.pumpingData} dark={dark} />
      </ChartCard>

      <ChartCard title="🗓️ 作息熱力圖" note="近 7 天・睡眠 & 餵食">
        <ActivityHeatmap
          ganttData={chartData.sleepGanttData}
          timelineData={chartData.feedingData}
        />
      </ChartCard>

      <ChartCard title="🥛 母乳供需" note="近 7 天・ml">
        <MilkBalanceChart data={chartData.milkBalanceData} dark={dark} />
      </ChartCard>

      <ChartCard title="🥣 副食品 vs 奶量" note="近 14 天・柱=喝奶 線=副食品">
        <SolidFoodMilkChart data={chartData.solidFoodMilkData} dark={dark} />
      </ChartCard>
    </div>
  )
}
