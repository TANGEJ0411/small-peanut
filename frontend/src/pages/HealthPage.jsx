import { useState, useEffect, useCallback, useMemo } from 'react'
import RecordFormModal from '../components/RecordFormModal'
import TimeInput from '../components/TimeInput'
import { nowLocalString, formatTime } from '../utils/dateUtils'

const ROUTE_OPTIONS = [
  { value: 'ORAL', label: '口服' },
  { value: 'TOPICAL', label: '外用' },
  { value: 'INJECTION', label: '注射' },
  { value: 'EYE_EAR_DROPS', label: '滴劑' },
  { value: 'INHALER', label: '吸入' },
  { value: 'SUPPOSITORY', label: '栓劑' },
]

const MEAL_SLOT_OPTIONS = [
  { value: 'BEFORE_BREAKFAST', label: '早餐前' },
  { value: 'AFTER_BREAKFAST', label: '早餐後' },
  { value: 'BEFORE_LUNCH', label: '午餐前' },
  { value: 'AFTER_LUNCH', label: '午餐後' },
  { value: 'BEFORE_DINNER', label: '晚餐前' },
  { value: 'AFTER_DINNER', label: '晚餐後' },
  { value: 'BEFORE_SLEEP', label: '睡前' },
]

const TIMING_OPTIONS = [
  { value: 'MEAL_BASED', label: '餐次' },
  { value: 'DAILY_FREQUENCY', label: '每日N次' },
  { value: 'AS_NEEDED', label: '需要時' },
]

const ROUTE_LABELS = Object.fromEntries(ROUTE_OPTIONS.map(o => [o.value, o.label]))
const MEAL_SLOT_LABELS = Object.fromEntries(MEAL_SLOT_OPTIONS.map(o => [o.value, o.label]))

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

const EVENT_COLORS = {
  med: { dot: 'bg-blue-500', icon: '💊' },
  vaccine: { dot: 'bg-green-500', icon: '💉' },
  visit: { dot: 'bg-orange-500', icon: '🏥' },
}

const FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'med', label: '💊 用藥' },
  { value: 'vaccine', label: '💉 疫苗' },
  { value: 'visit', label: '🏥 就醫' },
]

function toLocalDateKey(isoStr) {
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildCalendarWeeks(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const weeks = []
  let week = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

function todayLocalDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayDefaultTime(year, month, day) {
  const d = new Date(year, month, day)
  if (d.toDateString() === new Date().toDateString()) return nowLocalString()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00`
}

const inputClass = 'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const selectClass = `${inputClass} cursor-pointer`

export default function HealthPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [filter, setFilter] = useState('all')
  const [medRecords, setMedRecords] = useState([])
  const [vaccineRecords, setVaccineRecords] = useState([])
  const [visitRecords, setVisitRecords] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [medForm, setMedForm] = useState(null)
  const [vaccineForm, setVaccineForm] = useState(null)
  const [visitForm, setVisitForm] = useState(null)
  const [scheduleForm, setScheduleForm] = useState(null)

  const fetchData = useCallback(async () => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999)
    const from = encodeURIComponent(firstDay.toISOString())
    const to = encodeURIComponent(lastDay.toISOString())
    try {
      const [medRes, vacRes, visitRes, schedRes] = await Promise.all([
        fetch(`/api/v1/medication-records?from=${from}&to=${to}`),
        fetch(`/api/v1/vaccines?from=${from}&to=${to}`),
        fetch(`/api/v1/medical-visits?from=${from}&to=${to}`),
        fetch('/api/v1/medication-schedules'),
      ])
      const [meds, vacs, visits, scheds] = await Promise.all([
        medRes.json(), vacRes.json(), visitRes.json(), schedRes.json(),
      ])
      setMedRecords(meds)
      setVaccineRecords(vacs)
      setVisitRecords(visits)
      setSchedules(scheds)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchData() }, [fetchData])

  const eventsByDate = useMemo(() => {
    const map = {}
    const add = (isoStr, type, data) => {
      const key = toLocalDateKey(isoStr)
      if (!map[key]) map[key] = []
      map[key].push({ type, data })
    }
    medRecords.forEach(r => add(r.administeredAt, 'med', r))
    vaccineRecords.forEach(r => add(r.administeredAt, 'vaccine', r))
    visitRecords.forEach(r => add(r.visitedAt, 'visit', r))
    return map
  }, [medRecords, vaccineRecords, visitRecords])

  const pad = n => String(n).padStart(2, '0')
  const selectedDateKey = selectedDay
    ? `${year}-${pad(month + 1)}-${pad(selectedDay)}` : null

  const selectedDayEvents = useMemo(() => {
    if (!selectedDateKey) return []
    const all = eventsByDate[selectedDateKey] || []
    return filter === 'all' ? all : all.filter(e => e.type === filter)
  }, [selectedDateKey, eventsByDate, filter])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  function openAddMenu() {
    if (!selectedDay) return
    setActiveModal('addMenu')
  }

  function openMedForm() {
    setMedForm({
      scheduleId: '', name: '', dosage: '', route: 'ORAL', mealSlot: '',
      administeredAt: dayDefaultTime(year, month, selectedDay), notes: ''
    })
    setActiveModal('medRecord')
  }

  function openVaccineForm() {
    setVaccineForm({
      name: '', clinicName: '', batchNumber: '',
      administeredAt: dayDefaultTime(year, month, selectedDay), notes: ''
    })
    setActiveModal('vaccine')
  }

  function openVisitForm() {
    setVisitForm({
      clinicName: '', doctor: '', reason: '', diagnosis: '',
      visitedAt: dayDefaultTime(year, month, selectedDay), notes: ''
    })
    setActiveModal('visit')
  }

  function openAddSchedule() {
    setScheduleForm({
      name: '', dosage: '', route: 'ORAL', timingType: 'MEAL_BASED',
      mealSlots: [], frequencyPerDay: 1,
      startDate: todayLocalDate(), endDate: '', notes: ''
    })
    setActiveModal('addSchedule')
  }

  function toggleMealSlot(slot) {
    setScheduleForm(f => {
      const slots = f.mealSlots.includes(slot)
        ? f.mealSlots.filter(s => s !== slot)
        : [...f.mealSlots, slot]
      return { ...f, mealSlots: slots }
    })
  }

  async function submitMedRecord() {
    setSubmitting(true)
    const body = {
      scheduleId: medForm.scheduleId ? Number(medForm.scheduleId) : null,
      name: medForm.name || null,
      dosage: medForm.dosage || null,
      route: medForm.route || null,
      mealSlot: medForm.mealSlot || null,
      administeredAt: new Date(medForm.administeredAt).toISOString(),
      notes: medForm.notes || null,
    }
    try {
      const res = await fetch('/api/v1/medication-records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { await fetchData(); setActiveModal(null) }
    } finally { setSubmitting(false) }
  }

  async function submitVaccine() {
    setSubmitting(true)
    const body = {
      name: vaccineForm.name,
      clinicName: vaccineForm.clinicName || null,
      batchNumber: vaccineForm.batchNumber || null,
      administeredAt: new Date(vaccineForm.administeredAt).toISOString(),
      notes: vaccineForm.notes || null,
    }
    try {
      const res = await fetch('/api/v1/vaccines', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { await fetchData(); setActiveModal(null) }
    } finally { setSubmitting(false) }
  }

  async function submitVisit() {
    setSubmitting(true)
    const body = {
      clinicName: visitForm.clinicName || null,
      doctor: visitForm.doctor || null,
      reason: visitForm.reason,
      diagnosis: visitForm.diagnosis || null,
      visitedAt: new Date(visitForm.visitedAt).toISOString(),
      notes: visitForm.notes || null,
    }
    try {
      const res = await fetch('/api/v1/medical-visits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { await fetchData(); setActiveModal(null) }
    } finally { setSubmitting(false) }
  }

  async function submitSchedule() {
    setSubmitting(true)
    const body = {
      name: scheduleForm.name,
      dosage: scheduleForm.dosage || null,
      route: scheduleForm.route,
      timingType: scheduleForm.timingType,
      mealSlots: scheduleForm.timingType === 'MEAL_BASED' ? scheduleForm.mealSlots : [],
      frequencyPerDay: scheduleForm.timingType === 'DAILY_FREQUENCY' ? Number(scheduleForm.frequencyPerDay) : null,
      startDate: scheduleForm.startDate,
      endDate: scheduleForm.endDate || null,
      notes: scheduleForm.notes || null,
    }
    try {
      const res = await fetch('/api/v1/medication-schedules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { await fetchData(); setActiveModal('schedules') }
    } finally { setSubmitting(false) }
  }

  async function toggleSchedule(id) {
    await fetch(`/api/v1/medication-schedules/${id}/toggle`, { method: 'PATCH' })
    await fetchData()
  }

  async function deleteSchedule(id) {
    await fetch(`/api/v1/medication-schedules/${id}`, { method: 'DELETE' })
    await fetchData()
  }

  async function deleteEvent(type, id) {
    const ep = { med: 'medication-records', vaccine: 'vaccines', visit: 'medical-visits' }
    await fetch(`/api/v1/${ep[type]}/${id}`, { method: 'DELETE' })
    await fetchData()
  }

  const weeks = buildCalendarWeeks(year, month)
  const todayKey = todayLocalDate()

  function scheduleTimingLabel(s) {
    if (s.timingType === 'MEAL_BASED') {
      return s.mealSlots.length > 0
        ? s.mealSlots.map(slot => MEAL_SLOT_LABELS[slot] || slot).join('、')
        : '餐次（未設定）'
    }
    if (s.timingType === 'DAILY_FREQUENCY') return `每日 ${s.frequencyPerDay} 次`
    return '需要時'
  }

  function selectedDayLabel() {
    if (!selectedDay) return null
    const d = new Date(year, month, selectedDay)
    return `${month + 1}月${selectedDay}日（${WEEK_DAYS[d.getDay()]}）`
  }

  const setMed = f => v => setMedForm(prev => ({ ...prev, [f]: v }))
  const setVac = f => v => setVaccineForm(prev => ({ ...prev, [f]: v }))
  const setVis = f => v => setVisitForm(prev => ({ ...prev, [f]: v }))
  const setSched = f => v => setScheduleForm(prev => ({ ...prev, [f]: v }))

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">健康管理</h2>
        <button
          onClick={() => setActiveModal('schedules')}
          className="text-sm text-blue-600 dark:text-blue-400 font-medium min-h-[44px] px-2 flex items-center"
        >
          管理用藥計畫
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === opt.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Calendar card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl">
            ‹
          </button>
          <span className="text-base font-semibold text-gray-900 dark:text-white">
            {year} 年 {month + 1} 月
          </span>
          <button onClick={nextMonth} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl">
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEK_DAYS.map(d => (
            <div key={d} className="text-center text-xs text-gray-400 dark:text-gray-500 py-1">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-y-1">
            {weeks.flat().map((d, i) => {
              if (!d) return <div key={`e-${i}`} />
              const key = `${year}-${pad(month + 1)}-${pad(d)}`
              const dayEvents = eventsByDate[key] || []
              const filtered = filter === 'all' ? dayEvents : dayEvents.filter(e => e.type === filter)
              const dots = filtered.slice(0, 3)
              const extra = filtered.length - 3
              const isToday = key === todayKey
              const isSelected = selectedDay === d

              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`flex flex-col items-center py-1 rounded-xl transition-colors ${
                    isSelected ? 'bg-blue-500' : 'active:bg-gray-100 dark:active:bg-gray-700'
                  }`}
                >
                  <span className={`text-sm leading-7 w-7 text-center rounded-full ${
                    isSelected ? 'text-white font-semibold'
                    : isToday ? 'text-blue-500 dark:text-blue-400 font-bold'
                    : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {d}
                  </span>
                  <div className="flex gap-0.5 h-2 items-center mt-0.5">
                    {dots.map((e, j) => (
                      <div key={j} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[e.type].dot} ${isSelected ? 'opacity-75' : ''}`} />
                    ))}
                    {extra > 0 && (
                      <span className={`text-[8px] leading-none font-medium ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>+{extra}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected day panel */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-20">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {selectedDay ? selectedDayLabel() : '請選擇日期'}
          </span>
          {selectedDay && (
            <button
              onClick={openAddMenu}
              className="min-h-[44px] px-3 text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1"
            >
              ＋ 新增
            </button>
          )}
        </div>

        {selectedDay && (
          selectedDayEvents.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">這天沒有事件</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {selectedDayEvents.map((e, i) => {
                const c = EVENT_COLORS[e.type]
                const title = e.type === 'med'
                  ? `${e.data.name}${e.data.dosage ? ` ${e.data.dosage}` : ''}`
                  : e.type === 'vaccine' ? e.data.name : e.data.reason
                const subtitle = e.type === 'med'
                  ? [ROUTE_LABELS[e.data.route], e.data.mealSlot ? MEAL_SLOT_LABELS[e.data.mealSlot] : null].filter(Boolean).join(' • ')
                  : e.type === 'vaccine' ? (e.data.clinicName || '') : [e.data.clinicName, e.data.doctor].filter(Boolean).join(' • ')
                const time = e.type === 'visit'
                  ? formatTime(e.data.visitedAt) : formatTime(e.data.administeredAt)
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl flex-shrink-0">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
                      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{time}</span>
                    <button
                      onClick={() => deleteEvent(e.type, e.data.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openAddMenu}
        disabled={!selectedDay}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors active:scale-95"
      >
        ＋
      </button>

      {/* Add menu sheet */}
      {activeModal === 'addMenu' && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setActiveModal(null)}>
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-2" />
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-5 mb-1 uppercase tracking-wider">
              {selectedDayLabel()} 新增
            </p>
            {[
              { icon: '💊', label: '用藥紀錄', action: openMedForm },
              { icon: '💉', label: '疫苗紀錄', action: openVaccineForm },
              { icon: '🏥', label: '就醫紀錄', action: openVisitForm },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-4 px-5 py-4 active:bg-gray-50 dark:active:bg-gray-700 text-left transition-colors min-h-[56px]"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-base text-gray-900 dark:text-white font-medium">{item.label}</span>
              </button>
            ))}
            <div className="pb-6" />
          </div>
        </div>
      )}

      {/* Medication record form */}
      {activeModal === 'medRecord' && medForm && (
        <RecordFormModal open title="新增用藥紀錄" onClose={() => setActiveModal(null)} onSubmit={submitMedRecord} submitting={submitting}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">關聯用藥計畫（選填）</label>
            <select
              value={medForm.scheduleId}
              onChange={e => {
                const s = schedules.find(s => s.id === Number(e.target.value))
                setMedForm(f => ({
                  ...f, scheduleId: e.target.value,
                  name: s ? s.name : '',
                  dosage: s ? (s.dosage || '') : '',
                  route: s ? s.route : 'ORAL',
                }))
              }}
              className={selectClass}
            >
              <option value="">不關聯計畫</option>
              {schedules.filter(s => s.active).map(s => (
                <option key={s.id} value={s.id}>{s.name}（{ROUTE_LABELS[s.route]}）</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                藥名 {!medForm.scheduleId && <span className="text-red-500">*</span>}
              </label>
              <input type="text" placeholder="例：益生菌" value={medForm.name} onChange={e => setMed('name')(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">劑量</label>
              <input type="text" placeholder="例：5ml" value={medForm.dosage} onChange={e => setMed('dosage')(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">用藥方式</label>
              <select value={medForm.route} onChange={e => setMed('route')(e.target.value)} className={selectClass}>
                {ROUTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">餐次（選填）</label>
              <select value={medForm.mealSlot} onChange={e => setMed('mealSlot')(e.target.value)} className={selectClass}>
                <option value="">不指定</option>
                {MEAL_SLOT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <TimeInput label="服藥時間" value={medForm.administeredAt} onChange={setMed('administeredAt')} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註（選填）</label>
            <textarea rows={2} placeholder="備註..." value={medForm.notes} onChange={e => setMed('notes')(e.target.value)} className={`${inputClass} resize-none`} />
          </div>
        </RecordFormModal>
      )}

      {/* Vaccine form */}
      {activeModal === 'vaccine' && vaccineForm && (
        <RecordFormModal open title="新增疫苗紀錄" onClose={() => setActiveModal(null)} onSubmit={submitVaccine} submitting={submitting}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">疫苗名稱 <span className="text-red-500">*</span></label>
            <input type="text" placeholder="例：BCG 卡介苗" value={vaccineForm.name} onChange={e => setVac('name')(e.target.value)} className={inputClass} />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">施打診所（選填）</label>
              <input type="text" placeholder="診所名稱" value={vaccineForm.clinicName} onChange={e => setVac('clinicName')(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">批號（選填）</label>
              <input type="text" placeholder="疫苗批號" value={vaccineForm.batchNumber} onChange={e => setVac('batchNumber')(e.target.value)} className={inputClass} />
            </div>
          </div>

          <TimeInput label="施打時間" value={vaccineForm.administeredAt} onChange={setVac('administeredAt')} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註（選填）</label>
            <textarea rows={2} placeholder="備註..." value={vaccineForm.notes} onChange={e => setVac('notes')(e.target.value)} className={`${inputClass} resize-none`} />
          </div>
        </RecordFormModal>
      )}

      {/* Medical visit form */}
      {activeModal === 'visit' && visitForm && (
        <RecordFormModal open title="新增就醫紀錄" onClose={() => setActiveModal(null)} onSubmit={submitVisit} submitting={submitting}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">就醫原因 <span className="text-red-500">*</span></label>
            <input type="text" placeholder="例：發燒、咳嗽" value={visitForm.reason} onChange={e => setVis('reason')(e.target.value)} className={inputClass} />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">診所/醫院</label>
              <input type="text" placeholder="診所名稱" value={visitForm.clinicName} onChange={e => setVis('clinicName')(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">醫師</label>
              <input type="text" placeholder="醫師姓名" value={visitForm.doctor} onChange={e => setVis('doctor')(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">診斷（選填）</label>
            <input type="text" placeholder="例：急性上呼吸道感染" value={visitForm.diagnosis} onChange={e => setVis('diagnosis')(e.target.value)} className={inputClass} />
          </div>

          <TimeInput label="就醫時間" value={visitForm.visitedAt} onChange={setVis('visitedAt')} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註（選填）</label>
            <textarea rows={2} placeholder="備註..." value={visitForm.notes} onChange={e => setVis('notes')(e.target.value)} className={`${inputClass} resize-none`} />
          </div>
        </RecordFormModal>
      )}

      {/* Medication schedules list */}
      {activeModal === 'schedules' && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setActiveModal(null)}>
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mt-3" />
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">用藥計畫</h3>
              <button onClick={openAddSchedule} className="text-sm text-blue-600 dark:text-blue-400 font-medium min-h-[44px] px-1">
                ＋ 新增計畫
              </button>
            </div>
            <div className="overflow-y-auto flex-1 pb-6">
              {schedules.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">尚無用藥計畫</p>
              ) : (
                schedules.map(s => (
                  <div key={s.id} className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 dark:border-gray-700 ${!s.active ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</p>
                        {s.dosage && <span className="text-xs text-gray-500 dark:text-gray-400">{s.dosage}</span>}
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{ROUTE_LABELS[s.route]}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{scheduleTimingLabel(s)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {s.startDate}{s.endDate ? ` ～ ${s.endDate}` : ' 起（長期）'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleSchedule(s.id)}
                        className={`min-h-[44px] px-2 text-xs font-medium transition-colors ${s.active ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'}`}
                      >
                        {s.active ? '啟用' : '停用'}
                      </button>
                      <button
                        onClick={() => deleteSchedule(s.id)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add schedule form */}
      {activeModal === 'addSchedule' && scheduleForm && (
        <RecordFormModal open title="新增用藥計畫" onClose={() => setActiveModal('schedules')} onSubmit={submitSchedule} submitting={submitting}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">藥名 <span className="text-red-500">*</span></label>
            <input type="text" placeholder="例：益生菌" value={scheduleForm.name} onChange={e => setSched('name')(e.target.value)} className={inputClass} />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">劑量</label>
              <input type="text" placeholder="例：5ml" value={scheduleForm.dosage} onChange={e => setSched('dosage')(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">用藥方式</label>
              <select value={scheduleForm.route} onChange={e => setSched('route')(e.target.value)} className={selectClass}>
                {ROUTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">提醒模式</label>
            <div className="flex gap-2">
              {TIMING_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSched('timingType')(o.value)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    scheduleForm.timingType === o.value
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {scheduleForm.timingType === 'MEAL_BASED' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">餐次（可複選）</label>
              <div className="grid grid-cols-3 gap-2">
                {MEAL_SLOT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleMealSlot(o.value)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      scheduleForm.mealSlots.includes(o.value)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scheduleForm.timingType === 'DAILY_FREQUENCY' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">每日次數</label>
              <input
                type="number" min={1} max={10}
                value={scheduleForm.frequencyPerDay}
                onChange={e => setSched('frequencyPerDay')(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">開始日期</label>
              <input type="date" value={scheduleForm.startDate} onChange={e => setSched('startDate')(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">結束日期（選填）</label>
              <input type="date" value={scheduleForm.endDate} onChange={e => setSched('endDate')(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">備註（選填）</label>
            <textarea rows={2} placeholder="備註..." value={scheduleForm.notes} onChange={e => setSched('notes')(e.target.value)} className={`${inputClass} resize-none`} />
          </div>
        </RecordFormModal>
      )}
    </>
  )
}
