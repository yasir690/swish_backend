import ratelimit from "express-rate-limit";

const limiter = ratelimit({
  max: 6,
  windowMs: 10000,
});

export default limiter;
