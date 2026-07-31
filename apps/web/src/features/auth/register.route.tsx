import { zodResolver } from "@hookform/resolvers/zod";
import { registerInputSchema, type RegisterInput } from "@relayops/types";
import { Alert, Button, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./auth-layout";
import { useRegister } from "./auth.api";

const fields: Array<{
  name: keyof RegisterInput;
  label: string;
  autoComplete: string;
  type?: "password" | "email";
}> = [
  { name: "name", label: "Your name", autoComplete: "name" },
  { name: "email", label: "Work email", autoComplete: "email", type: "email" },
  { name: "password", label: "Password", autoComplete: "new-password", type: "password" },
  { name: "organisationName", label: "Organisation", autoComplete: "organization" },
  { name: "workspaceName", label: "First workspace", autoComplete: "off" }
];

export function Component() {
  const navigate = useNavigate();
  const register = useRegister();
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      organisationName: "",
      workspaceName: ""
    }
  });

  const submit = handleSubmit(async (values) => {
    await register.mutateAsync(values);
    await navigate("/");
  });

  return (
    <AuthLayout>
      <div className="auth-card__heading">
        <span>Start responding</span>
        <h2>Create your operations hub</h2>
        <p>Your first organisation and workspace are created with you as owner.</p>
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
          Create workspace
        </Button>
      </form>
      <p className="auth-card__footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
