// functions/api/story.js
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const roomId = url.searchParams.get('room');
  if (!roomId) {
    return new Response(JSON.stringify({ error: 'room required' }), {
      headers: { 'content-type': 'application/json' },
      status: 400
    });
  }

  const fromKV = await env.KV_ROOMS.get(`story:${roomId}`);
  if (fromKV) {
    return new Response(fromKV, { headers: { 'content-type': 'application/json' } });
  }

  const res = await fetch(`https://${request.headers.get('host')}/data/stories/${roomId}.json`);
  return res;
}
