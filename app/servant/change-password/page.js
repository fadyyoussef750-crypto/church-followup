'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ChangePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ newPass: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    if (form.newPass !== form.confirm) {
      setError('الباسورد الجديد مش متطابق')
      return
    }
    if (form.newPass.length < 6) {
      setError('الباسورد لازم يكون 6 حروف على الأقل')
      return
    }
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({
      password: form.newPass,
    })

    if (updateError) {
      setError('حصل خطأ، جرب تاني')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.back(), 2000)
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          →
        </button>
        <h2 className="font-bold text-gray-900 dark:text-white text-lg">تغيير الباسورد</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-green-600 dark:text-green-400 font-bold text-lg">تم تغيير الباسورد بنجاح</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">هيتم تحويلك تلقائياً...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                الباسورد الجديد
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.newPass}
                onChange={e => setForm(p => ({ ...p, newPass: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                تأكيد الباسورد الجديد
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <p className="text-red-600 dark:text-red-400 text-sm">⚠️ {error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !form.newPass || !form.confirm}
              className="w-full bg-blue-600 text-white rounded-xl py-3.5 text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900"
            >
              {loading ? 'جاري الحفظ...' : 'تغيير الباسورد'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
