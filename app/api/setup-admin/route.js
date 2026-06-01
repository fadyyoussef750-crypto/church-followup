import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { email, password, name, churchName } = await request.json()

    if (!email || !password || !name) {
      return Response.json({ error: 'البيانات ناقصة' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // إنشاء اليوزر بدون إيميل تأكيد
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'admin', churchName },
    })

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return Response.json({ error: 'الإيميل ده مسجل قبل كده' }, { status: 400 })
      }
      return Response.json({ error: error.message }, { status: 400 })
    }

    // تحديث الـ profile
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ name, role: 'admin' })
        .eq('id', data.user.id)
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('Setup admin error:', err)
    return Response.json({ error: 'حصل خطأ في السيرفر' }, { status: 500 })
  }
}
