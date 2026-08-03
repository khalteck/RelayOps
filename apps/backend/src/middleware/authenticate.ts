import type { NextFunction, Request, Response } from "express";
import { AppError } from "../core/errors.js";
import { UserModel } from "../models/user.model.js";
import { ACCESS_COOKIE } from "../modules/auth/auth.cookies.js";
import { verifyAccessToken } from "../modules/auth/auth.tokens.js";

export async function authenticate(request: Request, _response: Response, next: NextFunction) {
  const token = request.cookies[ACCESS_COOKIE] as string | undefined;
  if (!token) throw new AppError(401, "UNAUTHENTICATED", "Authentication is required");

  try {
    const userId = await verifyAccessToken(token);
    const user = await UserModel.findById(userId).lean();
    if (!user) throw new Error("User not found");
    request.auth = { id: String(user._id), name: user.name, email: user.email };
    next();
  } catch {
    throw new AppError(401, "UNAUTHENTICATED", "Session has expired");
  }
}
