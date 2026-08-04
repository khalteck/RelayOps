import type { AccountPreferences } from "@relayops/types";

export const defaultPreferences: AccountPreferences = {
  theme: "system",
  inApp: { incidentAssigned: true, incidentUpdated: true, incidentCommented: true }
};
