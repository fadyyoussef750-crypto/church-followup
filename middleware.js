import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  // صفحة setup: متشيكش عليها ومتعملش redirect
  if (path === '/setup') {
    return supabaseResponse
  }

  // تحقق لو في أدمين موجود — لو لأ روح setup
  if (path === '/' || path === '/login') {
    try {
      const { data: adminCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)

      if (!adminCheck || adminCheck.length === 0) {
        return NextResponse.redirect(new URL('/setup', request.url))
      }
    } catch {
      // لو حصل error، خلّيه يكمل عادي
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // لو مش logged in وبيحاول يدخل أي صفحة غير login أو setup
  if (!user && path !== '/login' && path !== '/setup') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // لو logged in وبيحاول يدخل login تاني
  if (user && path === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const redirect = profile?.role === 'admin' ? '/admin' : '/servant'
    return NextResponse.redirect(new URL(redirect, request.url))
  }

  // لو خادم بيحاول يدخل صفحة أدمين
  if (user && path.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/servant', request.url))
    }
  }

  // لو أدمين بيحاول يدخل صفحة خادم
  if (user && path.startsWith('/servant')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-|firebase-messaging-sw.js|.*\\.png$).*)',
  ],
}
