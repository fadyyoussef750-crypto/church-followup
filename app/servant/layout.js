'use client'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useDarkMode } from '@/lib/useDarkMode'

export default function ServantLayout({ children }) {
  const router = useRouter()
  const supabase = createClient()
  const { isDark, toggle } = useDarkMode()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xl">⛪</span>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">نظام الافتقاد</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => router.push('/servant/change-password')}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
            title="تغيير الباسورد"
          >
            ⚙️
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            خروج
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-8">{children}</main>
    </div>
  )
}
