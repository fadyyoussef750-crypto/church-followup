'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isDeadlinePassed } from '@/lib/utils'

export default function GroupsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [groups, setGroups] = useState([])
  const [servants, setServants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [form, setForm] = useState({ name: '', deadline: '', servantIds: [] })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: groupsData } = await supabase
      .from('groups')
      .select('*, servant_groups(servant_id, profiles(id, name)), members(id)')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false })

    const { data: servantsData } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'servant')
      .order('name')

    setGroups(groupsData || [])
    setServants(servantsData || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleServant(servantId) {
    setForm(prev => ({
      ...prev,
      servantIds: prev.servantIds.includes(servantId)
        ? prev.servantIds.filter(id => id !== servantId)
        : [...prev.servantIds, servantId],
    }))
  }

  async function handleSaveGroup() {
    if (!form.name) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    let groupId = editingGroup?.id

    if (editingGroup) {
      await supabase.from('groups').update({
        name: form.name,
        deadline: form.deadline || null,
      }).eq('id', editingGroup.id)
    } else {
      const { data: newGroup } = await supabase.from('groups').insert({
        name: form.name,
        admin_id: user.id,
        deadline: form.deadline || null,
      }).select().single()
      groupId = newGroup?.id
    }

    if (groupId) {
      await supabase.from('servant_groups').delete().eq('group_id', groupId)
      if (form.servantIds.length > 0) {
        await supabase.from('servant_groups').insert(
          form.servantIds.map(sid => ({ group_id: groupId, servant_id: sid }))
        )
      }

      // إرسال إشعار للخدام لو في ديدلاين
      if (form.deadline && form.servantIds.length > 0) {
        const { data: servantProfiles } = await supabase
          .from('profiles')
          .select('fcm_token, name')
          .in('id', form.servantIds)
          .not('fcm_token', 'is', null)

        const tokens = servantProfiles?.map(s => s.fcm_token).filter(Boolean) || []
        if (tokens.length > 0) {
          await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokens,
              title: 'موعد افتقاد جديد ⏰',
              body: `أبونا حدد ديدلاين للوزنة: ${form.name}`,
            }),
          })
        }
      }
    }

    setShowForm(false)
    setEditingGroup(null)
    setForm({ name: '', deadline: '', servantIds: [] })
    fetchData()
    setSaving(false)
  }

  function handleEdit(group) {
    setEditingGroup(group)
    setForm({
      name: group.name,
      deadline: group.deadline ? new Date(group.deadline).toISOString().slice(0, 16) : '',
      servantIds: group.servant_groups?.map(sg => sg.servant_id) || [],
    })
    setShowForm(true)
  }

  async function handleDelete(groupId) {
    if (!confirm('هتحذف الوزنة دي وكل بياناتها؟')) return
    await supabase.from('groups').delete().eq('id', groupId)
    fetchData()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">الوزنات</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">{groups.length} وزنة</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingGroup(null); setForm({ name: '', deadline: '', servantIds: [] }) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-blue-900"
        >
          + وزنة جديدة
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 transition-colors">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">
            {editingGroup ? 'تعديل الوزنة' : 'وزنة جديدة'}
          </h3>
          <div className="space-y-4">
            <input
              placeholder="اسم الوزنة"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
            />

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                ⏰ الديدلاين (اختياري)
              </label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                👥 الخدام المسؤولين
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {servants.map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={form.servantIds.includes(s.id)}
                      onChange={() => toggleServant(s.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{s.name}</span>
                  </label>
                ))}
                {servants.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 px-2">مفيش خدام مسجلين لسه</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveGroup}
                disabled={saving || !form.name}
                className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-3">
        {groups.map(group => {
          const servants_list = group.servant_groups?.map(sg => sg.profiles).filter(Boolean) || []
          const membersCount = group.members?.length || 0
          const deadlinePassed = isDeadlinePassed(group.deadline)

          return (
            <div key={group.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">{group.name}</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">👤 {membersCount} مخدوم</p>
                  {group.deadline && (
                    <p className={`text-xs mt-1 font-medium ${deadlinePassed ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {deadlinePassed ? '🔒 انتهى الوقت' : `⏰ ${new Date(group.deadline).toLocaleString('ar-EG', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true,
                      })}`}
                    </p>
                  )}
                  {servants_list.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {servants_list.map(s => (
                        <span key={s.id} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-lg">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 mr-2">
                  <button
                    onClick={() => handleEdit(group)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <button
                onClick={() => router.push(`/admin/groups/${group.id}/members`)}
                className="w-full mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl py-2.5 transition-colors font-medium"
              >
                إدارة المخدومين ({membersCount}) ←
              </button>
            </div>
          )
        })}

        {groups.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <span className="text-5xl">📋</span>
            <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium">مفيش وزنات لسه</p>
          </div>
        )}
      </div>
    </div>
  )
}
