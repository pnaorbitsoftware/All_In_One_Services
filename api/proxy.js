const BACKEND_ORIGIN = "https://all-in-one-services-eegn.onrender.com";

const ignoredRequestHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "origin",
  "referer",
  "transfer-encoding",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-proto",
]);

const ignoredResponseHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "transfer-encoding",
]);

module.exports = async function proxyServiceHubApi(req, res) {
  try {
    const path = String(req.query.path || "").replace(/^\/+/, "");
    const target = new URL(`/api/${path}`, BACKEND_ORIGIN);

    for (const [key, value] of Object.entries(req.query || {})) {
      if (key === "path") continue;
      const values = Array.isArray(value) ? value : [value];
      values.forEach((entry) => target.searchParams.append(key, String(entry)));
    }

    const headers = {};
    for (const [key, value] of Object.entries(req.headers || {})) {
      if (ignoredRequestHeaders.has(key.toLowerCase()) || value == null) continue;
      headers[key] = Array.isArray(value) ? value.join(", ") : value;
    }

    const method = String(req.method || "GET").toUpperCase();
    let body;
    if (!['GET', 'HEAD'].includes(method) && req.body != null) {
      body = Buffer.isBuffer(req.body)
        ? req.body
        : typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body);
    }

    const response = await fetch(target, { method, headers, body, redirect: "manual" });

    response.headers.forEach((value, key) => {
      if (!ignoredResponseHeaders.has(key.toLowerCase())) res.setHeader(key, value);
    });
    res.setHeader("Cache-Control", "no-store");
    res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("ServiceHub API proxy failed:", error);
    res.status(502).json({ message: "Backend is temporarily unavailable. Please try again." });
  }
};
