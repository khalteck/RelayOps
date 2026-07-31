import { compare, hash } from "bcryptjs";
import mongoose from "mongoose";
import type { LoginInput, RegisterInput, SessionUser } from "@relayops/types";
import { DEFAULT_SLA_POLICY } from "@relayops/types";
import { AppError } from "../../core/errors.js";
import { uniqueSlug } from "../../core/slug.js";
import { MembershipModel } from "../../models/membership.model.js";
import { OrganisationModel } from "../../models/organisation.model.js";
import { RefreshSessionModel } from "../../models/refresh-session.model.js";
import { UserModel } from "../../models/user.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "./auth.tokens.js";

interface RequestFingerprint {
  userAgent?: string;
  ipAddress?: string;
}

interface AuthResult {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

function toSessionUser(user: { _id: unknown; name: string; email: string }): SessionUser {
  return { id: String(user._id), name: user.name, email: user.email };
}

async function issueSession(
  user: { _id: unknown; name: string; email: string },
  fingerprint: RequestFingerprint
): Promise<AuthResult> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await RefreshSessionModel.create({
    userId: user._id,
    tokenHash: "pending",
    expiresAt,
    ...fingerprint
  });
  const refreshToken = await signRefreshToken({
    userId: String(user._id),
    sessionId: String(session._id)
  });
  session.tokenHash = hashToken(refreshToken);
  await session.save();

  return {
    user: toSessionUser(user),
    accessToken: await signAccessToken(String(user._id)),
    refreshToken
  };
}

export async function register(
  input: RegisterInput,
  fingerprint: RequestFingerprint
): Promise<AuthResult> {
  if (await UserModel.exists({ email: input.email })) {
    throw new AppError(409, "CONFLICT", "An account with this email already exists");
  }

  const mongoSession = await mongoose.startSession();
  let createdUser: { _id: unknown; name: string; email: string } | undefined;

  try {
    await mongoSession.withTransaction(async () => {
      const [user] = await UserModel.create(
        [{ name: input.name, email: input.email, passwordHash: await hash(input.password, 12) }],
        { session: mongoSession }
      );
      if (!user) throw new Error("User creation failed");
      const [organisation] = await OrganisationModel.create(
        [{ name: input.organisationName, slug: uniqueSlug(input.organisationName) }],
        { session: mongoSession }
      );
      if (!organisation) throw new Error("Organisation creation failed");
      const [workspace] = await WorkspaceModel.create(
        [
          {
            organisationId: organisation._id,
            name: input.workspaceName,
            slug: uniqueSlug(input.workspaceName),
            slaPolicy: DEFAULT_SLA_POLICY
          }
        ],
        { session: mongoSession }
      );
      if (!workspace) throw new Error("Workspace creation failed");
      await MembershipModel.create(
        [
          {
            userId: user._id,
            organisationId: organisation._id,
            role: "owner",
            workspaceIds: [workspace._id]
          }
        ],
        { session: mongoSession }
      );
      createdUser = user;
    });
  } finally {
    await mongoSession.endSession();
  }

  if (!createdUser) throw new AppError(500, "INTERNAL_ERROR", "Account creation failed");
  return issueSession(createdUser, fingerprint);
}

export async function login(
  input: LoginInput,
  fingerprint: RequestFingerprint
): Promise<AuthResult> {
  const user = await UserModel.findOne({ email: input.email }).select("+passwordHash");
  if (!user || !(await compare(input.password, user.passwordHash))) {
    throw new AppError(401, "UNAUTHENTICATED", "Email or password is incorrect");
  }
  return issueSession(user, fingerprint);
}

export async function rotateRefreshToken(token: string): Promise<AuthResult> {
  let claims: Awaited<ReturnType<typeof verifyRefreshToken>>;
  try {
    claims = await verifyRefreshToken(token);
  } catch {
    throw new AppError(401, "UNAUTHENTICATED", "Refresh session is invalid");
  }

  const session = await RefreshSessionModel.findById(claims.sessionId).select("+tokenHash");
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AppError(401, "UNAUTHENTICATED", "Refresh session has expired");
  }
  if (session.tokenHash !== hashToken(token)) {
    session.revokedAt = new Date();
    await session.save();
    throw new AppError(401, "UNAUTHENTICATED", "Refresh token reuse was detected");
  }

  const user = await UserModel.findById(claims.userId);
  if (!user) throw new AppError(401, "UNAUTHENTICATED", "Account no longer exists");

  const refreshToken = await signRefreshToken({
    userId: String(user._id),
    sessionId: String(session._id)
  });
  session.tokenHash = hashToken(refreshToken);
  await session.save();

  return {
    user: toSessionUser(user),
    accessToken: await signAccessToken(String(user._id)),
    refreshToken
  };
}

export async function revokeRefreshToken(token?: string): Promise<void> {
  if (!token) return;
  try {
    const claims = await verifyRefreshToken(token);
    await RefreshSessionModel.findByIdAndUpdate(claims.sessionId, { revokedAt: new Date() });
  } catch {
    // Logout remains idempotent even when the browser holds an invalid token.
  }
}
