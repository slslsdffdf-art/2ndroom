export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await request.json();
  const item = {
    id: crypto.randomUUID(),
    room: body.room || '',
    death: body.death || '',
    cause: body.cause || '',
    time: new Date().toISOString()
  };

  const raw = await env.KV_DEATHS.get('list');
  let list = [];
  if (raw) {
    try { list = JSON.parse(raw); } catch (e) {}
  }
  list.unshift(item);
  list = list.slice(0, 100);
  await env.KV_DEATHS.put('list', JSON.stringify(list));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' }
  });
}
