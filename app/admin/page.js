'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDeadline, isDeadlinePassed } from '@/lib/utils'
import dynamic from 'next/dynamic'

const VisitChart = dynamic(() => import('@/components/VisitChart'), { ssr: false })

export default function AdminDashboard() {
  const supabase = createClient()
  const [groups, setGroups] = useState([])
  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
    setAdminName(profile?.name || '')

    const { data: groupsData } = await supabase
      .from('groups')
      .select(`
        *,
        servant_groups(servant_id, profiles(id, name)),
        members(id, visits(servant_id, status))
      `)
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false })

    setGroups(groupsData || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  function getGroupStats(group) {
    const totalMembers = group.members?.length || 0
    const allVisits = group.members?.flatMap(m => m.visits) || []
    const visited = allVisits.filter(v => v.status === 'visited').length
    const noAnswer = allVisits.filter(v => v.status === 'no_answer').length
    const notVisited = totalMembers - visited - noAnswer
    const percentage = totalMembers ? Math.round((visited / totalMembers) * 100) : 0
    return { totalMembers, visited, noAnswer, notVisited, percentage }
  }

  const totalStats = groups.reduce((acc, g) => {
    const s = getGroupStats(g)
    return {
      members: acc.members + s.totalMembers,
      visited: acc.visited + s.visited,
      noAnswer: acc.noAnswer + s.noAnswer,
    }
  }, { members: 0, visited: 0, noAnswer: 0 })

  const chartData = groups.map(group => {
    const stats = getGroupStats(group)
    const name = group.name.length > 8 ? group.name.slice(0, 8) + '...' : group.name
    return {
      name,
      'افتقد': stats.visited,
      'ما ردش': stats.noAnswer,
      'لم يُفتقد': stats.notVisited,
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">

      {/* Welcome */}
      <div className="bg-gradient-to-l from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
        <p className="text-blue-100 text-sm">أهلاً،</p>
        <h2 className="font-bold text-xl mt-0.5">{adminName} 👋</h2>
        <p className="text-blue-100 text-sm mt-1">
          {new Date().toLocaleDateString('ar-EG', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Total Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'إجمالي المخدومين', value: totalStats.members, color: 'text-gray-800 dark:text-white', bg: 'bg-white dark:bg-gray-800' },
          { label: 'افتقد', value: totalStats.visited, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'ما ردش', value: totalStats.noAnswer, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center transition-colors`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {groups.length > 0 && <VisitChart data={chartData} />}

      {/* Groups */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">الوزنات</h3>
        <div className="space-y-3">
          {groups.map(group => {
            const stats = getGroupStats(group)
            const deadlinePassed = isDeadlinePassed(group.deadline)
            const servants = group.servant_groups?.map(sg => sg.profiles).filter(Boolean) || []

            return (
              <div key={group.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{group.name}</h4>
                    {group.deadline && (
                      <p className={`text-xs mt-0.5 font-medium ${deadlinePassed ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {deadlinePassed ? '🔒 انتهى الوقت' : `⏰ ${formatDeadline(group.deadline)}`}
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <span className={`text-2xl font-bold ${stats.percentage >= 80 ? 'text-green-600 dark:text-green-400' : stats.percentage >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                      {stats.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      stats.percentage >= 80 ? 'bg-green-500' : stats.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>

                <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>✅ {stats.visited} افتقد</span>
                  <span>📵 {stats.noAnswer} ما ردش</span>
                  <span>⬜ {stats.notVisited} لم يُفتقد</span>
                </div>

                {servants.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50 dark:border-gray-700">
                    {servants.map(s => (
                      <span key={s.id} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-lg font-medium">
                        👤 {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {groups.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <span className="text-5xl">📋</span>
              <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium">مفيش وزنات لسه</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">روح تبويب الوزنات وضيف وزنة جديدة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
