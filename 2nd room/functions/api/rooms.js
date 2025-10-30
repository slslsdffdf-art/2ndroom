// functions/api/rooms.js
export async function onRequest(context) {
  const { request, env } = context;
  const fromKV = await env.KV_ROOMS.get('rooms.json');
  if (fromKV) {
    return new Response(fromKV, { headers: { 'content-type': 'application/json' } });
  }
  const res = await fetch(`https://${request.headers.get('host')}/data/rooms.json`);
  return res;
}
