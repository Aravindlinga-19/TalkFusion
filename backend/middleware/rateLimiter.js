// In-memory / Sliding Window rate limiter middleware for stateless or single-node deployments
// Aligns with Distributed Rate Limiter service concepts

const memoryStore = new Map();

export const rateLimiter = (options = { windowMs: 60 * 1000, max: 100 }) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const key = `${ip}:${req.baseUrl}`;
    const now = Date.now();

    if (!memoryStore.has(key)) {
      memoryStore.set(key, []);
    }

    const timestamps = memoryStore.get(key);
    // Filter timestamps within sliding window
    const validTimestamps = timestamps.filter((time) => now - time < options.windowMs);

    if (validTimestamps.length >= options.max) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfterMs: options.windowMs - (now - validTimestamps[0]),
      });
    }

    validTimestamps.push(now);
    memoryStore.set(key, validTimestamps);
    next();
  };
};
