export async function POST(request) {
  try {
    const { tokens, title, body } = await request.json()

    if (!tokens || tokens.length === 0) {
      return Response.json({ success: true, message: 'No tokens provided' })
    }

    if (!process.env.FIREBASE_SERVER_KEY) {
      console.warn('FIREBASE_SERVER_KEY not set, skipping notification')
      return Response.json({ success: true, message: 'Firebase not configured' })
    }

    const results = await Promise.allSettled(
      tokens.map(token =>
        fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title,
              body,
              icon: '/icon-192x192.png',
              click_action: '/',
            },
            data: { title, body },
          }),
        })
      )
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return Response.json({ success: true, succeeded, failed })
  } catch (err) {
    console.error('Send notification error:', err)
    return Response.json({ error: 'حصل خطأ في السيرفر' }, { status: 500 })
  }
}
