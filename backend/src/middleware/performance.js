import { performance } from "node:perf_hooks";

const slowRequestMs = Number(process.env.SLOW_REQUEST_MS || 1000);

export const responseTimeLogger = (req, res, next) => {
  const start = performance.now();

  res.on("finish", () => {
    const durationMs = Math.round(performance.now() - start);
    const logPayload = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`;

    if (durationMs >= slowRequestMs) {
      console.warn(`[slow-api] ${logPayload}`);
      return;
    }

    if (process.env.LOG_FAST_REQUESTS === "true") {
      console.log(`[api] ${logPayload}`);
    }
  });

  next();
};
