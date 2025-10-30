export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'POST') {
    const body = await request.json();
    const entry = {
      text: body.text || '비명조차 지르지 못한 채 즉사.',
      cause: body.cause || '',
      room: body.room || '',
      death: body.death || '',
      time: new Date().toISOString()
    };
    await env.KV_LASTWORDS.put('last', JSON.stringify(entry));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  if (request.method === 'GET') {
    const last = await env.KV_LASTWORDS.get('last');
    if (!last) {
      return new Response(JSON.stringify({ text: null }), {
        headers: { 'content-type': 'application/json' }
      });
    }
    return new Response(last, {
      headers: { 'content-type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}
