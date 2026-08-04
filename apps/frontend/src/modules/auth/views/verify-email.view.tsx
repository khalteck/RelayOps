import type { RegistrationChallengeDto } from "@relayops/types";
import { Alert, Button, Input } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth-layout";
import { useResendRegistration, useVerifyRegistration } from "../operations/auth.queries";

function storedChallenge(): RegistrationChallengeDto | null {
  try {
    return JSON.parse(
      sessionStorage.getItem("relayops-registration") ?? "null"
    ) as RegistrationChallengeDto | null;
  } catch {
    return null;
  }
}

export function Component() {
  const navigate = useNavigate();
  const verify = useVerifyRegistration();
  const resend = useResendRegistration();
  const [challenge, setChallenge] = useState(storedChallenge);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);
  const wait = useMemo(
    () =>
      challenge
        ? Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - now) / 1_000))
        : 0,
    [challenge, now]
  );
  if (!challenge) return <Navigate to="/register" replace />;
  const submit = async () => {
    await verify.mutateAsync({ challengeId: challenge.challengeId, code });
    sessionStorage.removeItem("relayops-registration");
    await navigate("/onboarding/owner", { replace: true });
  };
  const resendCode = async () => {
    const result = await resend.mutateAsync(challenge.challengeId);
    setChallenge(result.data);
    sessionStorage.setItem("relayops-registration", JSON.stringify(result.data));
    setCode("");
  };
  return (
    <AuthLayout>
      <div className="auth-card__heading">
        <span>Email verification</span>
        <h2>Check your inbox</h2>
        <p>Enter the six-digit code sent to {challenge.maskedEmail}.</p>
      </div>
      {verify.error || resend.error ? (
        <Alert type="error" showIcon message={(verify.error ?? resend.error)?.message} />
      ) : null}
      <div className="form-stack">
        <label>
          <span>Verification code</span>
          <Input.OTP length={6} value={code} onChange={setCode} size="large" autoFocus />
        </label>
        <Button
          type="primary"
          size="large"
          disabled={code.length !== 6}
          loading={verify.isPending}
          onClick={() => void submit()}
        >
          Verify email
        </Button>
        <Button
          type="link"
          disabled={wait > 0}
          loading={resend.isPending}
          onClick={() => void resendCode()}
        >
          {wait ? `Resend in ${wait}s` : "Send a new code"}
        </Button>
      </div>
      <p className="auth-card__footer">
        <Link to="/register">Use a different email</Link>
      </p>
    </AuthLayout>
  );
}
