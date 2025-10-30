// functions/api/items.js
export async function onRequest(context) {
  const { request, env } = context;
  const cookie = request.headers.get('cookie') || '';
  const sessionId = cookie.match(/sr_session=([a-zA-Z0-9_-]+)/)?.[1];
  if (!sessionId) {
    return new Response('no session', { status: 401 });
  }

  if (request.method === 'GET') {
    const raw = await env.KV_SESSIONS.get(`items:${sessionId}`);
    return new Response(JSON.stringify({ items: raw ? JSON.parse(raw) : [] }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const raw = await env.KV_SESSIONS.get(`items:${sessionId}`);
    let arr = [];
    if (raw) {
      try { arr = JSON.parse(raw); } catch (e) {}
    }
    arr.push({ name: body.name, ts: Date.now() });
    await env.KV_SESSIONS.put(`items:${sessionId}`, JSON.stringify(arr), { expirationTtl: 86400 });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}
