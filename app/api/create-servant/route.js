import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { name, email, password, groupId } = await request.json()

    if (!name || !email || !password) {
      return Response.json({ error: 'البيانات ناقصة' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // إنشاء اليوزر
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'servant' },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return Response.json({ error: 'الإيميل ده مسجل قبل كده' }, { status: 400 })
      }
      return Response.json({ error: error.message }, { status: 400 })
    }

    // ربط بالوزنة لو في وزنة
    if (groupId && data.user) {
      await supabase.from('servant_groups').insert({
        servant_id: data.user.id,
        group_id: groupId,
      })
    }

    return Response.json({ success: true, userId: data.user.id })
  } catch (err) {
    console.error('Create servant error:', err)
    return Response.json({ error: 'حصل خطأ في السيرفر' }, { status: 500 })
  }
}
