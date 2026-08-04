import { randomInt, randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import type {
  RegisterStartInput,
  RegistrationChallengeDto,
  VerifyRegistrationInput
} from "@relayops/types";
import { AppError } from "../../core/errors.js";
import { PendingSignupModel } from "../../models/pending-signup.model.js";
import { UserModel } from "../../models/user.model.js";
import { queueEmail } from "../email/email.service.js";

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 2)}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

async function createCode(): Promise<{ code: string; codeHash: string }> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  return { code, codeHash: await hash(code, 10) };
}

export async function startRegistration(
  input: RegisterStartInput,
  ipAddress?: string
): Promise<RegistrationChallengeDto> {
  const now = new Date();
  const recentSends = await PendingSignupModel.countDocuments({
    email: input.email,
    createdAt: { $gte: new Date(now.getTime() - 3_600_000) }
  });
  if (recentSends >= 5)
    throw new AppError(429, "RATE_LIMITED", "Please wait before requesting another code");
  const challengeId = randomUUID();
  const { code, codeHash } = await createCode();
  const existing = await UserModel.exists({ email: input.email });
  if (!existing) {
    await PendingSignupModel.create({
      challengeId,
      name: input.name,
      email: input.email,
      passwordHash: await hash(input.password, 12),
      codeHash,
      codeExpiresAt: new Date(now.getTime() + 600_000),
      resendAvailableAt: new Date(now.getTime() + 60_000),
      purgeAt: new Date(now.getTime() + 86_400_000),
      ipAddress
    });
    const delivery = await queueEmail({
      kind: "verification",
      to: input.email,
      payload: {
        recipientName: input.name,
        title: "Verify your RelayOps email",
        intro:
          "Use this code to verify your email and continue setting up your operations workspace. It expires in 10 minutes.",
        code,
        detail: "If you did not start this signup, you can safely ignore this message."
      }
    });
    if (delivery?.status === "failed")
      throw new AppError(
        500,
        "INTERNAL_ERROR",
        "We couldn’t send the verification email. Please try again"
      );
  }
  return {
    challengeId,
    maskedEmail: maskEmail(input.email),
    expiresAt: new Date(now.getTime() + 600_000).toISOString(),
    resendAvailableAt: new Date(now.getTime() + 60_000).toISOString()
  };
}

export async function resendRegistration(challengeId: string): Promise<RegistrationChallengeDto> {
  const signup = await PendingSignupModel.findOne({
    challengeId,
    consumedAt: { $exists: false }
  }).select("+codeHash");
  const now = new Date();
  if (!signup || signup.purgeAt <= now)
    throw new AppError(400, "VALIDATION_ERROR", "This verification request is invalid or expired");
  if (signup.resendAvailableAt > now)
    throw new AppError(429, "RATE_LIMITED", "Please wait before requesting another code");
  if (signup.sendCount >= 5)
    throw new AppError(429, "RATE_LIMITED", "Please wait before requesting another code");
  const next = await createCode();
  signup.codeHash = next.codeHash;
  signup.invalidAttempts = 0;
  signup.sendCount += 1;
  signup.codeExpiresAt = new Date(now.getTime() + 600_000);
  signup.resendAvailableAt = new Date(now.getTime() + 60_000);
  await signup.save();
  const delivery = await queueEmail({
    kind: "verification",
    to: signup.email,
    payload: {
      recipientName: signup.name,
      title: "Your new RelayOps verification code",
      intro: "Use this new code to continue signup. Your previous code no longer works.",
      code: next.code,
      detail: "This code expires in 10 minutes."
    }
  });
  if (delivery?.status === "failed")
    throw new AppError(
      500,
      "INTERNAL_ERROR",
      "We couldn’t send the verification email. Please try again"
    );
  return {
    challengeId,
    maskedEmail: maskEmail(signup.email),
    expiresAt: signup.codeExpiresAt.toISOString(),
    resendAvailableAt: signup.resendAvailableAt.toISOString()
  };
}

export async function verifyRegistration(input: VerifyRegistrationInput) {
  const signup = await PendingSignupModel.findOne({
    challengeId: input.challengeId,
    consumedAt: { $exists: false }
  }).select("+codeHash +passwordHash");
  if (!signup || signup.codeExpiresAt <= new Date() || signup.invalidAttempts >= 5)
    throw new AppError(400, "VALIDATION_ERROR", "The code is invalid or expired");
  if (!(await compare(input.code, signup.codeHash))) {
    signup.invalidAttempts += 1;
    await signup.save();
    throw new AppError(400, "VALIDATION_ERROR", "The code is invalid or expired");
  }
  if (await UserModel.exists({ email: signup.email }))
    throw new AppError(400, "VALIDATION_ERROR", "The code is invalid or expired");
  const user = await UserModel.create({
    name: signup.name,
    email: signup.email,
    passwordHash: signup.passwordHash,
    emailVerifiedAt: new Date()
  });
  signup.consumedAt = new Date();
  await signup.save();
  return user;
}
