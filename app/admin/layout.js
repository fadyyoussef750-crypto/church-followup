'use client'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useDarkMode } from '@/lib/useDarkMode'

const navItems = [
  { href: '/admin', label: 'الرئيسية', icon: '📊' },
  { href: '/admin/servants', label: 'الخدام', icon: '👥' },
  { href: '/admin/groups', label: 'الوزنات', icon: '📋' },
  { href: '/admin/reports', label: 'التقارير', icon: '📈' },
]

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
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
          <h1 className="text-base font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            خروج
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-10 transition-colors">
        <div className="max-w-lg mx-auto grid grid-cols-4">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <div className="absolute bottom-0 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
