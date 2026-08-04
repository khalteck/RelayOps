import { zodResolver } from "@hookform/resolvers/zod";
import { registerStartInputSchema, type RegisterStartInput } from "@relayops/types";
import { Alert, Button, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth-layout";
import { useStartRegistration } from "../operations/auth.queries";

const fields: Array<{
  name: keyof RegisterStartInput;
  label: string;
  autoComplete: string;
  type?: "password" | "email";
}> = [
  { name: "name", label: "Your name", autoComplete: "name" },
  { name: "email", label: "Work email", autoComplete: "email", type: "email" },
  { name: "password", label: "Password", autoComplete: "new-password", type: "password" }
];

export function Component() {
  const navigate = useNavigate();
  const register = useStartRegistration();
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterStartInput>({
    resolver: zodResolver(registerStartInputSchema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  });

  const submit = handleSubmit(async (values) => {
    const result = await register.mutateAsync(values);
    sessionStorage.setItem("relayops-registration", JSON.stringify(result.data));
    await navigate("/verify-email");
  });

  return (
    <AuthLayout>
      <div className="auth-card__heading">
        <span>Start responding</span>
        <h2>Create your operations hub</h2>
        <p>Verify your work email first, then shape your organisation and workspace.</p>
      </div>
      {register.error ? <Alert type="error" showIcon message={register.error.message} /> : null}
      <form
        className="form-stack form-stack--compact"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        {fields.map((item) => (
          <label key={item.name}>
            <span>{item.label}</span>
            <Controller
              control={control}
              name={item.name}
              render={({ field }) =>
                item.type === "password" ? (
                  <Input.Password {...field} size="large" autoComplete={item.autoComplete} />
                ) : (
                  <Input
                    {...field}
                    size="large"
                    type={item.type ?? "text"}
                    autoComplete={item.autoComplete}
                  />
                )
              }
            />
            {errors[item.name] ? (
              <small className="field-error">{errors[item.name]?.message}</small>
            ) : null}
          </label>
        ))}
        <Button htmlType="submit" type="primary" size="large" block loading={register.isPending}>
          Continue with email
        </Button>
      </form>
      <p className="auth-card__footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
