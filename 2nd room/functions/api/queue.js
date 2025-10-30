export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const cookieHeader = request.headers.get('cookie') || '';

  // access check
  const hasAccess = cookieHeader.includes('sr_access=ok');
  if (!hasAccess) {
    return new Response(JSON.stringify({ ok: false, reason: 'no-access' }), {
      headers: { 'content-type': 'application/json' },
      status: 403
    });
  }

  let sessionId = cookieHeader.match(/sr_session=([a-zA-Z0-9_-]+)/)?.[1];
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  const active = await env.KV_QUEUE.get('active');
  const now = Date.now();

  if (method === 'POST') {
    if (active && active !== sessionId) {
      const counter = await env.KV_QUEUE.get('counter');
      const next = counter ? parseInt(counter, 10) + 1 : 1;
      await env.KV_QUEUE.put('counter', String(next));
      await env.KV_QUEUE.put(`queue:${sessionId}`, JSON.stringify({ pos: next, ts: now }), { expirationTtl: 600 });
      return new Response(JSON.stringify({ ok: true, queued: true, position: next }), {
        headers: {
          'content-type': 'application/json',
          'set-cookie': `sr_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`
        }
      });
    }
    await env.KV_QUEUE.put('active', sessionId, { expirationTtl: 120 });
    return new Response(JSON.stringify({ ok: true, allowed: true }), {
      headers: {
        'content-type': 'application/json',
        'set-cookie': `sr_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`
      }
    });
  }

  if (method === 'GET') {
    if (active === sessionId) {
      return new Response(JSON.stringify({ allowed: true }), {
        headers: {
          'content-type': 'application/json',
          'set-cookie': `sr_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`
        }
      });
    }
    const q = await env.KV_QUEUE.get(`queue:${sessionId}`);
    if (!q) {
      return new Response(JSON.stringify({ allowed: false, position: null, eta: null }), {
        headers: {
          'content-type': 'application/json',
          'set-cookie': `sr_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`
        }
      });
    }
    const parsed = JSON.parse(q);
    const eta = parsed.pos * 15;
    return new Response(JSON.stringify({ allowed: false, position: parsed.pos, eta: eta + 's' }), {
      headers: {
        'content-type': 'application/json',
        'set-cookie': `sr_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`
      }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}
