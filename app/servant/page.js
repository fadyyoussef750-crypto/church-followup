'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { isDeadlinePassed, formatDeadline, getStatusStyle } from '@/lib/utils'
import { useNotifications } from '@/lib/useNotifications'

export default function ServantPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState(null)
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [visits, setVisits] = useState({})
  const [loading, setLoading] = useState(true)
  const [groupLoading, setGroupLoading] = useState(false)
  const [popup, setPopup] = useState(null)
  const [popupNote, setPopupNote] = useState('')
  const [savingId, setSavingId] = useState(null)

  useNotifications(profile?.id)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(profileData)

    const { data: sgData } = await supabase
      .from('servant_groups')
      .select('group_id, groups(*)')
      .eq('servant_id', user.id)

    const userGroups = sgData?.map(sg => sg.groups).filter(Boolean) || []
    setGroups(userGroups)

    if (userGroups.length > 0) {
      await loadGroupData(userGroups[0], user.id)
      setSelectedGroup(userGroups[0])
    }

    setLoading(false)
  }, [supabase])

  async function loadGroupData(group, servantId) {
    setGroupLoading(true)
    const id = servantId || profile?.id
    if (!id) return

    const { data: membersData } = await supabase
      .from('members')
      .select('*')
      .eq('group_id', group.id)
      .order('name')
    setMembers(membersData || [])

    const { data: visitsData } = await supabase
      .from('visits')
      .select('*')
      .eq('servant_id', id)
      .in('member_id', membersData?.map(m => m.id) || [])

    const visitsMap = {}
    visitsData?.forEach(v => { visitsMap[v.member_id] = v })
    setVisits(visitsMap)
    setGroupLoading(false)
  }

  async function handleSelectGroup(group) {
    setSelectedGroup(group)
    await loadGroupData(group)
  }

  useEffect(() => { fetchData() }, [fetchData])

  function handleCall(member) {
    if (isDeadlinePassed(selectedGroup?.deadline)) return
    window.location.href = `tel:${member.phone}`
    setTimeout(() => {
      setPopup({ memberId: member.id, memberName: member.name })
    }, 2000)
  }

  async function handlePopupAnswer(answered) {
    if (!popup || !profile) return
    setSavingId(popup.memberId)
    const status = answered ? 'visited' : 'no_answer'

    await supabase.from('visits').upsert(
      {
        servant_id: profile.id,
        member_id: popup.memberId,
        status,
        note: popupNote || null,
        called_at: new Date().toISOString(),
      },
      { onConflict: 'servant_id,member_id' }
    )

    setVisits(prev => ({
      ...prev,
      [popup.memberId]: {
        status,
        note: popupNote,
        called_at: new Date().toISOString(),
      },
    }))

    setPopup(null)
    setPopupNote('')
    setSavingId(null)
  }

  const stats = {
    total: members.length,
    visited: Object.values(visits).filter(v => v.status === 'visited').length,
    noAnswer: Object.values(visits).filter(v => v.status === 'no_answer').length,
  }
  const percentage = stats.total ? Math.round((stats.visited / stats.total) * 100) : 0
  const deadlinePassed = isDeadlinePassed(selectedGroup?.deadline)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⏳</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">لسه مش متعيّن لك وزنة</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">كلّم أبونا عشان يعيّنلك وزنتك</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">

      {/* Tabs لو في أكتر من وزنة */}
      {groups.length > 1 && (
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
      )}

      {/* كارد معلومات الوزنة */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{selectedGroup?.name}</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">أهلاً، {profile?.name} 👋</p>
          </div>
          <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{percentage}%</p>
            <p className="text-xs text-blue-500 dark:text-blue-400">{stats.visited}/{stats.total}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mb-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Deadline */}
        {selectedGroup?.deadline && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 ${
            deadlinePassed
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}>
            <span>{deadlinePassed ? '🔒' : '⏰'}</span>
            <span className="font-medium">
              {deadlinePassed ? 'انتهى وقت الافتقاد' : `الديدلاين: ${formatDeadline(selectedGroup.deadline)}`}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'الكل', value: stats.total, color: 'text-gray-700 dark:text-gray-300', bg: 'bg-white dark:bg-gray-800' },
          { label: 'افتقد', value: stats.visited, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'ما ردش', value: stats.noAnswer, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center transition-colors`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        {groupLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          members.map((member, index) => {
            const visit = visits[member.id]
            const status = visit?.status || 'not_visited'
            const style = getStatusStyle(status)
            const isLast = index === members.length - 1

            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  !isLast ? 'border-b border-gray-50 dark:border-gray-700' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${style.bg} ${style.text}`}>
                  {member.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{member.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5" dir="ltr">{member.phone}</p>
                  {visit?.note && (
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 truncate">📝 {visit.note}</p>
                  )}
                </div>

                {/* Status or Call Button */}
                {status !== 'not_visited' ? (
                  <span className={`text-xs px-3 py-1.5 rounded-full border font-medium flex-shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                    {style.label}
                  </span>
                ) : (
                  <button
                    onClick={() => handleCall(member)}
                    disabled={deadlinePassed || savingId === member.id}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                      deadlinePassed
                        ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50'
                        : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 active:scale-90 shadow-sm'
                    }`}
                  >
                    <span className="text-xl">{deadlinePassed ? '🔒' : '📞'}</span>
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Popup */}
      {popup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">📞</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{popup.memberName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">رد عليك؟</p>
            </div>

            <textarea
              placeholder="ملاحظة (اختياري) — مثلاً: مريض، سافر..."
              value={popupNote}
              onChange={e => setPopupNote(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white resize-none mb-4 transition-all"
              rows={2}
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => handlePopupAnswer(true)}
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-2xl py-3.5 text-sm font-bold transition-all active:scale-95 shadow-lg shadow-green-200 dark:shadow-green-900"
              >
                ✅ رد عليّ
              </button>
              <button
                onClick={() => handlePopupAnswer(false)}
                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl py-3.5 text-sm font-bold transition-all active:scale-95 shadow-lg shadow-red-200 dark:shadow-red-900"
              >
                ❌ ما ردش
              </button>
            </div>

            <button
              onClick={() => { setPopup(null); setPopupNote('') }}
              className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 py-2 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
