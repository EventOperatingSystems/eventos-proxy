export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const target = (process.env.TARGET_URL || '').replace(/\/$/, '');
  if (!target) return new Response('TARGET_URL not set in Vercel environment variables', { status: 500 });

  const url = new URL(request.url);
  const targetUrl = `${target}${url.pathname}${url.search}`;
  const headers = new Headers(request.headers);
  headers.set('x-forwarded-host', url.hostname);

  const init: RequestInit & { duplex?: string } = { method: request.method, headers };
  if (!['GET', 'HEAD'].includes(request.method)) { init.body = request.body; init.duplex = 'half'; }

  const response = await fetch(targetUrl, init);
  return new Response(response.body, { status: response.status, headers: response.headers });
}
