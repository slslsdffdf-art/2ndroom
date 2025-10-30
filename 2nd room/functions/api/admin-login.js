export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const body = await request.json();
  if (body.password === env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'content-type': 'application/json',
        'set-cookie': 'admin=ok; Path=/; HttpOnly; SameSite=Lax'
      }
    });
  }
  return new Response(JSON.stringify({ ok: false }), {
    headers: { 'content-type': 'application/json' },
    status: 401
  });
}
