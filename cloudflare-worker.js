/**
 * Cloudflare Worker — Claude API Proxy
 *
 * SETUP (takes ~5 minutes, free):
 * 1. Go to https://workers.cloudflare.com and sign up (free)
 * 2. Create a new Worker — paste this entire file
 * 3. Go to Settings → Variables → add a Secret:
 *      Name:  ANTHROPIC_API_KEY
 *      Value: your Anthropic API key (from console.anthropic.com)
 * 4. Deploy — you'll get a URL like https://your-worker.workers.dev
 * 5. In your Trading Dashboard → ⚙ Settings → paste that URL
 *
 * That's it. The worker proxies your requests to the Claude API securely.
 * Your API key never touches the browser.
 */

export default {
  async fetch(request, env) {

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY secret not configured in Worker settings.' } }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    try {
      const body = await request.json();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: { message: err.message } }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
  },
};
