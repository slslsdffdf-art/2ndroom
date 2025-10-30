export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  if (method === 'GET') {
    const raw = await env.KV_DEATHS.get('list');
    const last = await env.KV_LASTWORDS.get('last');
    let items = [];
    if (raw) {
      try { items = JSON.parse(raw); } catch (e) {}
    }
    let lastParsed = null;
    if (last) {
      try { lastParsed = JSON.parse(last); } catch (e) {}
    }
    if (lastParsed && items[0]) {
      items[0].will = lastParsed.text;
      if (!items[0].cause) items[0].cause = lastParsed.cause;
    }
    return new Response(JSON.stringify({ items }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  if (method === 'DELETE') {
    const cookie = request.headers.get('cookie') || '';
    const isAdmin = cookie.includes('admin=ok');
    if (!isAdmin) {
      return new Response('unauthorized', { status: 401 });
    }
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 1];
    const raw = await env.KV_DEATHS.get('list');
    if (!raw) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' }
      });
    }
    let items = JSON.parse(raw);
    items = items.filter(it => it.id !== id);
    await env.KV_DEATHS.put('list', JSON.stringify(items));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}
