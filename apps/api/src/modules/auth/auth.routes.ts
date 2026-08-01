import { Router, type Router as ExpressRouter } from "express";
import { loginInputSchema, registerInputSchema, updateProfileInputSchema } from "@relayops/types";
import { authenticate } from "../../middleware/authenticate.js";
import { requireCsrf } from "../../middleware/csrf.js";
import { authRateLimit } from "../../middleware/rate-limits.js";
import { validateBody } from "../../middleware/validate.js";
import {
  loginController,
  logoutController,
  refreshController,
  registerController,
  sessionController,
  updateProfileController
} from "./auth.controller.js";

export const authRouter: ExpressRouter = Router();

authRouter.post("/register", authRateLimit, validateBody(registerInputSchema), registerController);
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
authRouter.post("/logout", authenticate, requireCsrf, logoutController);
