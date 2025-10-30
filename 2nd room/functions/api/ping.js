// functions/api/ping.js
export async function onRequest() {
  return new Response(JSON.stringify({ ok: true, time: new Date().toISOString() }), {
    headers: { 'content-type': 'application/json' }
  });
}
