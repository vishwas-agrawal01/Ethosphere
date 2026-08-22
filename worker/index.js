// Ethosphere Worker — serves the static site as-is, and adds one API
// route (/api/subscribe) that proxies newsletter signups to Brevo so the
// Brevo API key never reaches the browser.
//
// Required Cloudflare secrets/vars (set via the dashboard or
// `wrangler secret put`, never committed to the repo):
//   BREVO_API_KEY  — Brevo transactional/contacts API key (secret)
//   BREVO_LIST_ID  — numeric Brevo contact list id to add subscribers to
//                    (optional; omit to create contacts with no list)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/subscribe') {
      if (request.method !== 'POST') {
        return json({ ok: false, error: 'Method not allowed.' }, 405);
      }
      return handleSubscribe(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleSubscribe(request, env) {
  let email = '';
  try {
    const body = await request.json();
    email = String(body.email || '').trim();
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, 400);
  }

  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  }

  if (!env.BREVO_API_KEY) {
    return json({ ok: false, error: 'Subscription service is not configured yet.' }, 500);
  }

  const brevoHeaders = {
    'api-key': env.BREVO_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    // Create (or update) the contact first. Deliberately not passing listIds
    // here — see the dedicated list-add call below.
    const createRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: brevoHeaders,
      body: JSON.stringify({ email, updateEnabled: true }),
    });

    const createErr = createRes.ok || createRes.status === 204
      ? null
      : await createRes.json().catch(() => ({}));

    if (createErr && createErr.code !== 'duplicate_parameter') {
      return json({ ok: false, error: "We couldn't complete that subscription — please try again." }, 502);
    }

    // Explicitly add to the list via Brevo's dedicated list-membership
    // endpoint. Passing listIds directly on contact creation does NOT
    // reliably fire Brevo's "Contact added to list" automation trigger —
    // this endpoint is the one that does.
    if (env.BREVO_LIST_ID) {
      const listRes = await fetch(`https://api.brevo.com/v3/contacts/lists/${env.BREVO_LIST_ID}/contacts/add`, {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify({ emails: [email] }),
      });

      if (!listRes.ok) {
        return json({ ok: false, error: "We couldn't complete that subscription — please try again." }, 502);
      }
    }

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: 'Network error reaching the subscription service.' }, 502);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
