// Marketroom live runs on snehalpatel.dev/marketroom.
// The page sends a prompt; this function asks Claude and returns the text (or parsed JSON).
// Off until these are set in Cloudflare Pages > Settings > Environment variables (production):
//   ANTHROPIC_API_KEY   secret, never in this repo
//   MARKETROOM_CODE     tester access code shared with testers
// Optional:
//   MR_MODEL            default "claude-opus-5-5"   (casting, rounds, reports)
//   MR_QUICK_MODEL      default "claude-haiku-5-5"  (scoring, interviews, case reading)
//   MR_DAILY_CAP        default 400 Claude calls a day, enforced only if a KV namespace is bound as MR_KV

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
const MAX_PROMPT_CHARS = 120000;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  if (!env.ANTHROPIC_API_KEY || !env.MARKETROOM_CODE) return reply({ error: "Live runs aren't switched on for this site yet." }, 503);

  let body;
  try { body = await request.json(); } catch { return reply({ error: 'Bad request' }, 400); }
  if (typeof body.code !== 'string' || body.code !== env.MARKETROOM_CODE) return reply({ error: "That tester code wasn't accepted." }, 401);

  // Daily cap (only when a KV namespace is bound as MR_KV)
  if (env.MR_KV) {
    const key = 'calls:' + new Date().toISOString().slice(0, 10);
    const used = parseInt((await env.MR_KV.get(key)) || '0', 10);
    const cap = parseInt(env.MR_DAILY_CAP || '400', 10);
    if (used >= cap) return reply({ error: "Today's tester allowance is used up. Try again tomorrow." }, 429);
    context.waitUntil(env.MR_KV.put(key, String(used + 1), { expirationTtl: 172800 }));
  }

  const model = body.tier === 'quick' ? (env.MR_QUICK_MODEL || 'claude-haiku-5-5') : (env.MR_MODEL || 'claude-opus-5-5');
  let messages;
  if (body.mode === 'json') {
    if (typeof body.prompt !== 'string' || !body.prompt) return reply({ error: 'Missing prompt' }, 400);
    messages = [{ role: 'user', content: body.prompt }];
  } else {
    if (!Array.isArray(body.messages) || !body.messages.length) return reply({ error: 'Missing messages' }, 400);
    messages = body.messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-14)
      .map(m => ({ role: m.role, content: m.content }));
    if (!messages.length || messages[0].role !== 'user') return reply({ error: 'Bad messages' }, 400);
  }
  if (JSON.stringify(messages).length > MAX_PROMPT_CHARS) return reply({ error: 'The brief is too long. Shorten it.' }, 413);

  const payload = {
    model,
    max_tokens: 16000,
    messages,
    ...(body.mode === 'json' ? { system: 'Reply with only valid JSON, no prose and no code fences.' } : {}),
    ...(model.startsWith('claude-opus-5') || model.startsWith('claude-sonnet-5-5') || model.startsWith('claude-fable') ? { fallbacks: 'default' } : {}),
  };
  const headers = {
    'x-api-key': env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };
  if (payload.fallbacks) headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';

  let res, data;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(payload) });
    data = await res.json();
  } catch {
    return reply({ error: "Couldn't reach Claude. Try again." }, 502);
  }
  if (!res.ok) {
    const status = res.status === 429 ? 429 : res.status >= 500 ? 502 : 400;
    return reply({ error: status === 429 ? 'Claude is busy. Wait a minute and try again.' : 'Claude returned an error. Try again.' }, status);
  }
  if (data.stop_reason === 'refusal') return reply({ error: 'Claude declined this brief. Rephrase it and try again.' }, 422);

  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  if (body.mode !== 'json') return reply({ text });

  const parsed = parseJSON(text);
  if (parsed === undefined) return reply({ error: "Claude's answer wasn't in the expected shape. Try again." }, 422);
  return reply({ json: parsed });
}

function parseJSON(t) {
  const s = String(t || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(s); } catch {}
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch {} }
  return undefined;
}
