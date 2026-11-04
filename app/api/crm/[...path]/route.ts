// /api/crm/* -> ${CRM_API_BASE_URL}/api/*
// Same-origin proxy to the Bay53 CRM API (lib/bay53crm/api). The upstream sends no CORS headers, so the browser cannot call it directly.
// Forwards method, query, body, Authorization and cookies (refresh token); passes Set-Cookie back without its Domain.

const UPSTREAM = process.env.CRM_API_BASE_URL || "https://baycrmapi.bay53.in";

const FORWARD_REQUEST_HEADERS = ["authorization", "content-type", "cookie", "accept"];
const FORWARD_RESPONSE_HEADERS = ["content-type", "content-disposition"];

async function proxy(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path.some((segment) => !segment || segment === "." || segment === "..")) {
    return new Response("Bad path", { status: 400 });
  }

  const target = new URL(`/api/${path.map(encodeURIComponent).join("/")}`, UPSTREAM);
  target.search = new URL(req.url).search;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie.replace(/;\s*domain=[^;]*/i, ""));
  }

  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
}

export { proxy as GET, proxy as POST };
