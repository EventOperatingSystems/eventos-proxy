export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const targets = [process.env.TARGET_URL_PROD, process.env.TARGET_URL_DEV].filter(Boolean) as string[];
  if (!targets.length) return new Response('No proxy targets configured', { status: 500 });

  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.set('x-forwarded-host', url.hostname);

  for (let i = 0; i < targets.length; i++) {
    const targetUrl = targets[i].replace(/\/$/, '') + url.pathname + url.search;
    const init: RequestInit & { duplex?: string } = { method: request.method, headers };
    if (!['GET', 'HEAD'].includes(request.method)) { init.body = request.body; init.duplex = 'half'; }
    try {
      const res = await fetch(targetUrl, init);
      if (res.status !== 404 || i === targets.length - 1) {
        return new Response(res.body, { status: res.status, headers: res.headers });
      }
    } catch {
      if (i === targets.length - 1) return new Response('Proxy error', { status: 502 });
    }
  }
  return new Response('Not found', { status: 404 });
}
