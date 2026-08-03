import { zodResolver } from "@hookform/resolvers/zod";
import { loginInputSchema, type LoginInput } from "@relayops/types";
import { Alert, Button, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/auth-layout";
import { useLogin } from "../operations/auth.queries";

export function Component() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const login = useLogin();
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: params.get("email") ?? "", password: "" }
  });

  const submit = handleSubmit(async (values) => {
    await login.mutateAsync(values);
    await navigate("/");
  });

  return (
    <AuthLayout>
      <div className="auth-card__heading">
        <span>Welcome back</span>
        <h2>Sign in to RelayOps</h2>
        <p>Return to your team’s operational workspace.</p>
      </div>
      {params.get("invited") === "1" ? (
        <Alert
          type="success"
          showIcon
          message="Invitation accepted"
          description="Sign in to open your new workspace."
        />
      ) : null}
      {login.error ? <Alert type="error" showIcon message={login.error.message} /> : null}
      <form className="form-stack" onSubmit={(event) => void submit(event)} noValidate>
        <label>
          <span>Email address</span>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                {...field}
                size="large"
                type="email"
                autoComplete="email"
                status={errors.email ? "error" : ""}
              />
            )}
          />
          {errors.email ? <small className="field-error">{errors.email.message}</small> : null}
        </label>
        <label>
          <span>Password</span>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input.Password
                {...field}
                size="large"
                autoComplete="current-password"
                status={errors.password ? "error" : ""}
              />
            )}
          />
          {errors.password ? (
            <small className="field-error">{errors.password.message}</small>
          ) : null}
        </label>
        <Button htmlType="submit" type="primary" size="large" block loading={login.isPending}>
          Sign in
        </Button>
      </form>
      <p className="auth-card__footer">
        New to RelayOps? <Link to="/register">Create your workspace</Link>
      </p>
    </AuthLayout>
  );
}
