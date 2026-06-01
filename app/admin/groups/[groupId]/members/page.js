'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function MembersPage() {
  const { groupId } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    const { data: groupData } = await supabase
      .from('groups')
      .select('id, name')
      .eq('id', groupId)
      .single()

    const { data: membersData } = await supabase
      .from('members')
      .select('*')
      .eq('group_id', groupId)
      .order('name')

    setGroup(groupData)
    setMembers(membersData || [])
    setLoading(false)
  }, [supabase, groupId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    if (!form.name || !form.phone) {
      setError('الاسم والتليفون مطلوبين')
      return
    }
    setSaving(true)
    setError('')

    if (editingMember) {
      await supabase
        .from('members')
        .update({ name: form.name, phone: form.phone })
        .eq('id', editingMember.id)
    } else {
      await supabase
        .from('members')
        .insert({ name: form.name, phone: form.phone, group_id: groupId })
    }

    setShowForm(false)
    setEditingMember(null)
    setForm({ name: '', phone: '' })
    fetchData()
    setSaving(false)
  }

  async function handleDelete(memberId) {
    if (!confirm('هتحذف المخدوم ده؟')) return
    setDeletingId(memberId)
    await supabase.from('members').delete().eq('id', memberId)
    setDeletingId(null)
    fetchData()
  }

  function handleEdit(member) {
    setEditingMember(member)
    setForm({ name: member.name, phone: member.phone })
    setShowForm(true)
    setError('')
  }

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          →
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 dark:text-white">{group?.name}</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">{members.length} مخدوم</p>
        </div>
        <button
          onClick={() => { setEditingMember(null); setForm({ name: '', phone: '' }); setShowForm(!showForm); setError('') }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          + إضافة
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 transition-colors">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">
            {editingMember ? 'تعديل بيانات المخدوم' : 'مخدوم جديد'}
          </h3>
          <div className="space-y-3">
            <input
              placeholder="الاسم الكامل"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
            />
            <input
              placeholder="رقم التليفون (مثلاً: 01012345678)"
              type="tel"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
              dir="ltr"
            />
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <p className="text-red-600 dark:text-red-400 text-sm">⚠️ {error}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
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

      {/* Search */}
      {members.length > 5 && (
        <div className="relative">
          <input
            placeholder="🔍 ابحث باسم أو رقم تليفون..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white transition-all"
          />
        </div>
      )}

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        {filteredMembers.map((member, index) => (
          <div
            key={member.id}
            className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
              index !== filteredMembers.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
              {member.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{member.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono" dir="ltr">{member.phone}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleEdit(member)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(member.id)}
                disabled={deletingId === member.id}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                {deletingId === member.id ? (
                  <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                ) : '🗑️'}
              </button>
            </div>
          </div>
        ))}

        {filteredMembers.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl">{searchQuery ? '🔍' : '👤'}</span>
            <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium">
              {searchQuery ? 'مفيش نتايج' : 'مفيش مخدومين في الوزنة دي لسه'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
