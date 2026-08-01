import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileInputSchema,
  type SessionUser,
  type UpdateProfileInput
} from "@relayops/types";
import { App, Button, Card, Input } from "antd";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useUpdateProfile } from "../auth/auth.api";

export function ProfileSettings({ user }: { user: SessionUser }) {
  const { message } = App.useApp();
  const updateProfile = useUpdateProfile();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileInputSchema),
    defaultValues: { name: user.name }
  });

  useEffect(() => reset({ name: user.name }), [reset, user.name]);
  const submit = handleSubmit(async (values) => {
    await updateProfile.mutateAsync(values);
    reset(values);
    void message.success("Profile updated");
  });

  return (
    <Card title="Profile settings" className="settings-card">
      <p className="settings-card__description">
        Keep the identity shown to responders and in incident activity accurate.
      </p>
      <form className="settings-form" onSubmit={(event) => void submit(event)} noValidate>
        <label className="settings-field">
          <span>Display name</span>
          <Controller
            control={control}
            name="name"
            render={({ field }) => <Input {...field} status={errors.name ? "error" : ""} />}
          />
          {errors.name ? <small className="field-error">{errors.name.message}</small> : null}
        </label>
        <label className="settings-field">
          <span>Email address</span>
          <Input value={user.email} disabled />
          <small className="settings-hint">
            Email changes are deferred from the current scope.
          </small>
        </label>
        <Button
          type="primary"
          htmlType="submit"
          loading={updateProfile.isPending}
          disabled={!isDirty}
        >
          Save profile
        </Button>
      </form>
    </Card>
  );
}
