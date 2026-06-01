import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { servantId } = await request.json()

    if (!servantId) {
      return Response.json({ error: 'الـ ID مطلوب' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error } = await supabase.auth.admin.deleteUser(servantId)

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('Delete servant error:', err)
    return Response.json({ error: 'حصل خطأ في السيرفر' }, { status: 500 })
  }
}
