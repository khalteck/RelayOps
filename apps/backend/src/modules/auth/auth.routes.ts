import { Router, type Router as ExpressRouter } from "express";
import {
  accountPreferencesSchema,
  invitedOnboardingInputSchema,
  loginInputSchema,
  ownerOnboardingInputSchema,
  registerInputSchema,
  registerStartInputSchema,
  resendRegistrationInputSchema,
  updateProfileInputSchema,
  verifyRegistrationInputSchema
} from "@relayops/types";
import { authenticate } from "../../middleware/authenticate.js";
import { requireCsrf } from "../../middleware/csrf.js";
import { authRateLimit } from "../../middleware/rate-limits.js";
import { validateBody } from "../../middleware/validate.js";
import { getEnv } from "../../config/env.js";
import {
  loginController,
  invitedOnboardingController,
  logoutController,
  ownerOnboardingController,
  resendRegistrationController,
  refreshController,
  registerController,
  sessionController,
  startRegistrationController,
  updatePreferencesController,
  updateProfileController,
  verifyRegistrationController
} from "./auth.controller.js";

export const authRouter: ExpressRouter = Router();

if (getEnv().NODE_ENV === "test") {
  authRouter.post(
    "/register",
    authRateLimit,
    validateBody(registerInputSchema),
    registerController
  );
}
authRouter.post(
  "/register/start",
  authRateLimit,
  validateBody(registerStartInputSchema),
  startRegistrationController
);
authRouter.post(
  "/register/verify",
  authRateLimit,
  validateBody(verifyRegistrationInputSchema),
  verifyRegistrationController
);
authRouter.post(
  "/register/resend",
  authRateLimit,
  validateBody(resendRegistrationInputSchema),
  resendRegistrationController
);
authRouter.post("/login", authRateLimit, validateBody(loginInputSchema), loginController);
authRouter.post("/refresh", authRateLimit, requireCsrf, refreshController);
authRouter.get("/session", authenticate, sessionController);
authRouter.patch(
  "/profile",
  authenticate,
  requireCsrf,
  validateBody(updateProfileInputSchema),
  updateProfileController
);
authRouter.patch(
  "/preferences",
  authenticate,
  requireCsrf,
  validateBody(accountPreferencesSchema),
  updatePreferencesController
);
authRouter.post(
  "/onboarding/owner",
  authenticate,
  requireCsrf,
  validateBody(ownerOnboardingInputSchema),
  ownerOnboardingController
);
authRouter.post(
  "/onboarding/members/:membershipId/complete",
  authenticate,
  requireCsrf,
  validateBody(invitedOnboardingInputSchema),
  invitedOnboardingController
);
authRouter.post("/logout", authenticate, requireCsrf, logoutController);
