import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (error) {
      return Response.json({ hasAdmin: false })
    }

    return Response.json({ hasAdmin: data && data.length > 0 })
  } catch {
    return Response.json({ hasAdmin: false })
  }
}
