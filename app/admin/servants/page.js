'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

export default function ServantsPage() {
  const supabase = createClient()
  const [servants, setServants] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', groupId: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: servantsData } = await supabase
      .from('profiles')
      .select('*, servant_groups(group_id, groups(name))')
      .eq('role', 'servant')
      .order('name')

    const { data: groupsData } = await supabase
      .from('groups')
      .select('id, name')
      .eq('admin_id', user.id)
      .order('name')

    setServants(servantsData || [])
    setGroups(groupsData || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCreateServant() {
    if (!form.name || !form.email || !form.password) {
      setError('الاسم والإيميل والباسورد مطلوبين')
      return
    }
    if (form.password.length < 6) {
      setError('الباسورد لازم يكون 6 حروف على الأقل')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/create-servant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'حصل خطأ، جرب تاني')
      setSaving(false)
      return
    }

    setShowForm(false)
    setForm({ name: '', email: '', password: '', groupId: '' })
    fetchData()
    setSaving(false)
  }

  async function handleDelete(servantId) {
    if (!confirm('هتحذف الخادم ده وكل بياناته؟')) return
    setDeletingId(servantId)

    await fetch('/api/delete-servant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ servantId }),
    })

    setDeletingId(null)
    fetchData()
  }

  const avatarColors = [
    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  ]

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">الخدام</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">{servants.length} خادم مسجل</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-blue-900"
        >
          + إضافة خادم
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 transition-colors">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">خادم جديد</h3>
          <div className="space-y-3">
            <input
              placeholder="الاسم الكامل"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
            />
            <input
              placeholder="الإيميل"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
              dir="ltr"
            />
            <input
              placeholder="الباسورد (6 حروف على الأقل)"
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
            />
            <select
              value={form.groupId}
              onChange={e => setForm(p => ({ ...p, groupId: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="">اختار وزنة (اختياري)</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <p className="text-red-600 dark:text-red-400 text-sm">⚠️ {error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreateServant}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                onClick={() => { setShowForm(false); setError('') }}
                className="px-5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Servants List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        {servants.map((servant, index) => {
          const groupName = servant.servant_groups?.[0]?.groups?.name
          const colorClass = avatarColors[index % avatarColors.length]
          const isLast = index === servants.length - 1

          return (
            <div
              key={servant.id}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                !isLast ? 'border-b border-gray-50 dark:border-gray-700' : ''
              }`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorClass}`}>
                {servant.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{servant.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {groupName ? `📋 ${groupName}` : '⚠️ مش متعيّن لوزنة'}
                </p>
              </div>
              <button
                onClick={() => handleDelete(servant.id)}
                disabled={deletingId === servant.id}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                {deletingId === servant.id ? (
                  <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                ) : '🗑️'}
              </button>
            </div>
          )
        })}

        {servants.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl">👥</span>
            <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium">مفيش خدام مسجلين لسه</p>
          </div>
        )}
      </div>
    </div>
  )
}
