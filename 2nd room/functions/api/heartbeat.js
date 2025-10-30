export async function onRequest(context) {
  const { request, env } = context;
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionId = cookieHeader.match(/sr_session=([a-zA-Z0-9_-]+)/)?.[1];
  if (!sessionId) {
    return new Response(JSON.stringify({ ok: false, reason: 'no-session' }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  const ttlSec = parseInt(env.QUEUE_TTL || '30', 10);
  const now = Date.now();
  const rawActive = await env.KV_QUEUE.get('active', { type: 'text' });

  let activeSession = null;
  let activeTs = 0;

  if (!rawActive) {
    activeSession = null;
  } else if (rawActive.startsWith('{')) {
    const parsed = JSON.parse(rawActive);
    activeSession = parsed.session;
    activeTs = parsed.ts;
  } else {
    activeSession = rawActive;
    activeTs = now;
  }

  if (!activeSession || activeSession === sessionId) {
    await env.KV_QUEUE.put('active', JSON.stringify({ session: sessionId, ts: now }), {
      expirationTtl: ttlSec
    });
    return new Response(JSON.stringify({ ok: true, owner: true }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  if (now - activeTs > ttlSec * 1000) {
    await env.KV_QUEUE.put('active', JSON.stringify({ session: sessionId, ts: now }), {
      expirationTtl: ttlSec
    });
    return new Response(JSON.stringify({ ok: true, owner: true, takeover: true }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true, owner: false }), {
    headers: { 'content-type': 'application/json' }
  });
}
