import pino from "pino";
import { getEnv } from "../config/env.js";

export const logger = pino({
  level: getEnv().LOG_LEVEL,
  base: { service: "relayops-backend" },
  redact: {
    paths: ["req.headers.cookie", "password", "*.password", "token", "*.token"],
    censor: "[REDACTED]"
  }
});
