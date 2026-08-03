import type { SessionUser } from "@relayops/types";

declare global {
  namespace Express {
    interface Request {
      id: string;
      auth?: SessionUser;
    }
  }
}

export {};
