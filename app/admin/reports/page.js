'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { getStatusStyle } from '@/lib/utils'

export default function ReportsPage() {
  const supabase = createClient()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [rounds, setRounds] = useState([])
  const [selectedRound, setSelectedRound] = useState(null)
  const [report, setReport] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [showNewRound, setShowNewRound] = useState(false)
  const [roundForm, setRoundForm] = useState({ name: '', deadline: '' })
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(null)

  const fetchGroups = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('groups')
      .select('id, name')
      .eq('admin_id', user.id)
      .order('name')
    setGroups(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  async function fetchRounds(groupId) {
    const { data } = await supabase
      .from('rounds')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
    setRounds(data || [])
    if (data?.length > 0) {
      setSelectedRound(data[0])
      fetchReport(groupId, data[0].id)
    } else {
      setSelectedRound(null)
      setReport([])
    }
  }

  async function fetchReport(groupId, roundId) {
    setReportLoading(true)
    const { data: members } = await supabase
      .from('members')
      .select('*, visits(servant_id, status, called_at, note, round_id, profiles(name))')
      .eq('group_id', groupId)
      .order('name')

    const membersWithRound = members?.map(m => ({
      ...m,
      visits: m.visits?.filter(v => v.round_id === roundId) || [],
    })) || []

    setReport(membersWithRound)
    setReportLoading(false)
  }

  async function handleSelectGroup(group) {
    setSelectedGroup(group)
    setSelectedRound(null)
    setReport([])
    setRounds([])
    await fetchRounds(group.id)
  }

  async function handleCreateRound() {
    if (!roundForm.name || !selectedGroup) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: newRound } = await supabase.from('rounds').insert({
      group_id: selectedGroup.id,
      name: roundForm.name,
      deadline: roundForm.deadline || null,
      created_by: user.id,
    }).select().single()

    setShowNewRound(false)
    setRoundForm({ name: '', deadline: '' })
    await fetchRounds(selectedGroup.id)
    setSaving(false)
  }

  async function handleExport(type) {
    if (!selectedGroup || !report.length) return
    setExporting(type)

    try {
      if (type === 'pdf') {
        const { exportToPDF } = await import('@/lib/export')
        await exportToPDF(selectedGroup.name, selectedRound?.name, report)
      } else {
        const { exportToExcel } = await import('@/lib/export')
        await exportToExcel(selectedGroup.name, selectedRound?.name, report)
      }
    } catch (err) {
      console.error('Export error:', err)
    }

    setExporting(null)
  }

  // Stats from report
  const reportStats = {
    total: report.length,
    visited: report.filter(m => m.visits?.[0]?.status === 'visited').length,
    noAnswer: report.filter(m => m.visits?.[0]?.status === 'no_answer').length,
    notVisited: report.filter(m => !m.visits?.[0]?.status || m.visits[0].status === 'not_visited').length,
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 space-y-4">

      <div>
        <h2 className="font-bold text-gray-900 dark:text-white text-lg">التقارير</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">اختار وزنة وجولة عشان تشوف التفاصيل</p>
      </div>

      {/* Group Tabs */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">الوزنة</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => handleSelectGroup(group)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedGroup?.id === group.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {!selectedGroup && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <span className="text-5xl">📈</span>
          <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium">اختار وزنة عشان تشوف التقرير</p>
        </div>
      )}

      {selectedGroup && (
        <>
          {/* Rounds */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">الجولات</p>
              <button
                onClick={() => setShowNewRound(!showNewRound)}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + جولة جديدة
              </button>
            </div>

            {showNewRound && (
              <div className="space-y-3 mb-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <input
                  placeholder="اسم الجولة (مثلاً: أسبوع 1 - يونيو)"
                  value={roundForm.name}
                  onChange={e => setRoundForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="datetime-local"
                  value={roundForm.deadline}
                  onChange={e => setRoundForm(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                  dir="ltr"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateRound}
                    disabled={saving || !roundForm.name}
                    className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-bold disabled:opacity-50 hover:bg-blue-700 transition-all"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button
                    onClick={() => setShowNewRound(false)}
                    className="px-4 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {rounds.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {rounds.map(round => (
                  <button
                    key={round.id}
                    onClick={() => { setSelectedRound(round); fetchReport(selectedGroup.id, round.id) }}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedRound?.id === round.id
                        ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {round.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
                مفيش جولات لسه — اضغط + جولة جديدة
              </p>
            )}
          </div>

          {/* Report Stats */}
          {selectedRound && !reportLoading && report.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'الكل', value: reportStats.total, color: 'text-gray-700 dark:text-gray-300' },
                { label: 'افتقد', value: reportStats.visited, color: 'text-green-600 dark:text-green-400' },
                { label: 'ما ردش', value: reportStats.noAnswer, color: 'text-amber-600 dark:text-amber-400' },
                { label: 'لم يُفتقد', value: reportStats.notVisited, color: 'text-gray-400 dark:text-gray-500' },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-2.5 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Export Buttons */}
          {selectedRound && !reportLoading && report.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting === 'pdf'}
                className="flex-1 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl py-3 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                {exporting === 'pdf' ? (
                  <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                ) : '📄'}
                {exporting === 'pdf' ? 'جاري التصدير...' : 'تصدير PDF'}
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting === 'excel'}
                className="flex-1 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl py-3 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
              >
                {exporting === 'excel' ? (
                  <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
                ) : '📊'}
                {exporting === 'excel' ? 'جاري التصدير...' : 'تصدير Excel'}
              </button>
            </div>
          )}

          {reportLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {/* Report List */}
          {selectedRound && !reportLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
              {report.map((member, index) => {
                const visit = member.visits?.[0]
                const status = visit?.status || 'not_visited'
                const style = getStatusStyle(status)
                const isLast = index === report.length - 1

                return (
                  <div
                    key={member.id}
                    className={`px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      !isLast ? 'border-b border-gray-50 dark:border-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${style.bg} ${style.text}`}>
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{member.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono" dir="ltr">{member.phone}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1.5 rounded-full border font-medium flex-shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                        {style.label}
                      </span>
                    </div>
                    {visit?.profiles?.name && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 mr-13 flex items-center gap-1">
                        <span className="mr-13">👤 افتقده: {visit.profiles.name}</span>
                      </p>
                    )}
                    {visit?.note && (
                      <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 mr-13">
                        📝 {visit.note}
                      </p>
                    )}
                  </div>
                )
              })}

              {report.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-4xl">📭</span>
                  <p className="text-gray-400 dark:text-gray-500 mt-3">مفيش بيانات للجولة دي</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
