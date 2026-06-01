'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = ['الترحيب', 'بيانات الكنيسة', 'أكونت أبونا', 'تم!']

export default function SetupPage() {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    churchName: '',
    priestName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleFinish() {
    if (!form.priestName.trim()) {
      setError('من فضلك ادخل اسم أبونا')
      return
    }
    if (!form.email.trim()) {
      setError('من فضلك ادخل الإيميل')
      return
    }
    if (!form.email.includes('@')) {
      setError('الإيميل غير صحيح')
      return
    }
    if (form.password.length < 6) {
      setError('الباسورد لازم يكون 6 حروف على الأقل')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('الباسورد مش متطابق')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          name: form.priestName.trim(),
          churchName: form.churchName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error?.includes('already registered') || data.error?.includes('already been registered')) {
          setError('الإيميل ده مسجل قبل كده، جرب إيميل تاني')
        } else {
          setError('حصل خطأ: ' + (data.error || 'جرب تاني'))
        }
        setLoading(false)
        return
      }

      setStep(3)
    } catch (err) {
      setError('حصل خطأ غير متوقع، جرب تاني')
    }

    setLoading(false)
  }

  function handleLogin() {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">

        {step < 3 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < 2 && (
                  <div className={`w-10 h-1 rounded-full transition-all ${
                    i < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">

          {step === 0 && (
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200 dark:shadow-blue-900">
                <span className="text-5xl">⛪</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                أهلاً بكم!
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-2">
                نظام متابعة افتقاد الخدمة الكنسية
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs leading-relaxed mb-8">
                هنساعدك تسجّل كنيستك وتبدأ تستخدم النظام في أقل من دقيقتين
              </p>
              <button
                onClick={() => setStep(1)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 text-base font-bold transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-blue-900"
              >
                ابدأ التسجيل ←
              </button>
              <button
                onClick={handleLogin}
                className="w-full mt-3 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 py-2 transition-colors"
              >
                عندي أكونت بالفعل — دخول
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="p-8">
              <div className="text-center mb-6">
                <span className="text-4xl">🏛️</span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-3">بيانات الكنيسة</h2>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">ادخل اسم الكنيسة (اختياري)</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم الكنيسة</label>
                  <input
                    placeholder="مثلاً: كنيسة مارجرجس بالمنطقة"
                    value={form.churchName}
                    onChange={e => updateForm('churchName', e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
                    onKeyDown={e => e.key === 'Enter' && setStep(2)}
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">ممكن تسيبه فاضي لو مش عايز</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(0)}
                    className="px-5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors py-3"
                  >
                    ← رجوع
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
                  >
                    التالي ←
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-8">
              <div className="text-center mb-6">
                <span className="text-4xl">👨‍💼</span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-3">أكونت أبونا</h2>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">البيانات دي هيستخدمها أبونا عشان يدخل على النظام</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم أبونا <span className="text-red-500">*</span></label>
                  <input
                    placeholder="مثلاً: أبونا بولس"
                    value={form.priestName}
                    onChange={e => updateForm('priestName', e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الإيميل <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    placeholder="priest@church.com"
                    value={form.email}
                    onChange={e => updateForm('email', e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الباسورد <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    placeholder="6 حروف على الأقل"
                    value={form.password}
                    onChange={e => updateForm('password', e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">تأكيد الباسورد <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    placeholder="أعد كتابة الباسورد"
                    value={form.confirmPassword}
                    onChange={e => updateForm('confirmPassword', e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white transition-all"
                    onKeyDown={e => e.key === 'Enter' && handleFinish()}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                    <p className="text-red-600 dark:text-red-400 text-sm text-center">⚠️ {error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setStep(1); setError('') }}
                    className="px-5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors py-3"
                  >
                    ← رجوع
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-blue-900"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        جاري الإنشاء...
                      </span>
                    ) : 'إنشاء الأكونت ✓'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">تم التسجيل بنجاح!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                أهلاً، <span className="font-semibold text-gray-700 dark:text-gray-300">{form.priestName}</span>
              </p>
              {form.churchName && (
                <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">{form.churchName}</p>
              )}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-6 text-right">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">بيانات الدخول بتاعتك:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-mono" dir="ltr">{form.email}</span>
                    <span className="text-xs text-blue-500 dark:text-blue-400">الإيميل</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-mono">{'•'.repeat(form.password.length)}</span>
                    <span className="text-xs text-blue-500 dark:text-blue-400">الباسورد</span>
                  </div>
                </div>
                <p className="text-xs text-blue-400 dark:text-blue-500 mt-3">⚠️ احتفظ بالبيانات دي في مكان آمن</p>
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 text-base font-bold transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-blue-900"
              >
                ادخل على النظام ←
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          نظام الافتقاد الكنسي — جميع البيانات محمية ومشفّرة
        </p>
      </div>
    </div>
  )
}
