import type { SlaPolicy } from "./contracts.js";

export const DEFAULT_SLA_POLICY: SlaPolicy = {
  P1: { acknowledgeMinutes: 5, resolveMinutes: 60 },
  P2: { acknowledgeMinutes: 15, resolveMinutes: 240 },
  P3: { acknowledgeMinutes: 60, resolveMinutes: 1_440 },
  P4: { acknowledgeMinutes: 240, resolveMinutes: 4_320 }
};
