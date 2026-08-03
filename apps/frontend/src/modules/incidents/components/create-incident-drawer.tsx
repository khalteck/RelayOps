import { zodResolver } from "@hookform/resolvers/zod";
import {
  INCIDENT_PRIORITIES,
  INCIDENT_SEVERITIES,
  createIncidentInputSchema,
  type CreateIncidentInput,
  type WorkspaceMember
} from "@relayops/types";
import { App, Button, Drawer, Input, Select, Space } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useCreateIncident } from "../operations/incident.mutations";

export function CreateIncidentDrawer({
  workspaceId,
  open,
  members,
  canAssign,
  onClose,
  onCreated
}: {
  workspaceId: string;
  open: boolean;
  members: WorkspaceMember[];
  canAssign: boolean;
  onClose: () => void;
  onCreated: (incidentId: string) => void;
}) {
  const { message } = App.useApp();
  const createIncident = useCreateIncident(workspaceId);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateIncidentInput>({
    resolver: zodResolver(createIncidentInputSchema),
    defaultValues: {
      title: "",
      description: "",
      affectedService: "",
      priority: "P2",
      severity: "SEV2",
      assigneeId: null
    }
  });

  const submit = handleSubmit(async (input) => {
    const result = await createIncident.mutateAsync(input);
    reset();
    onCreated(result.data.id);
    void message.success("Incident reported");
  });

  return (
    <Drawer
      title="Report an incident"
      width={560}
      open={open}
      onClose={onClose}
      destroyOnHidden
      footer={
        <Space className="drawer-footer-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={createIncident.isPending} onClick={() => void submit()}>
            Report incident
          </Button>
        </Space>
      }
    >
      <form className="incident-form" onSubmit={(event) => void submit(event)} noValidate>
        <label>
          <span>Incident title</span>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} autoFocus status={errors.title ? "error" : ""} />
            )}
          />
          {errors.title ? <small className="field-error">{errors.title.message}</small> : null}
        </label>
        <label>
          <span>Affected service</span>
          <Controller
            name="affectedService"
            control={control}
            render={({ field }) => (
              <Input {...field} status={errors.affectedService ? "error" : ""} />
            )}
          />
          {errors.affectedService ? (
            <small className="field-error">{errors.affectedService.message}</small>
          ) : null}
        </label>
        <div className="incident-form__row">
          <label>
            <span>Priority</span>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select {...field} options={INCIDENT_PRIORITIES.map((value) => ({ value }))} />
              )}
            />
          </label>
          <label>
            <span>Severity</span>
            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <Select {...field} options={INCIDENT_SEVERITIES.map((value) => ({ value }))} />
              )}
            />
          </label>
        </div>
        {canAssign ? (
          <label>
            <span>Initial responder</span>
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="Leave unassigned"
                  value={field.value ?? undefined}
                  options={members
                    .filter((member) => member.role !== "viewer")
                    .map((member) => ({
                      value: member.id,
                      label: `${member.name} · ${member.role}`
                    }))}
                  onChange={(value) => field.onChange(value ?? null)}
                />
              )}
            />
          </label>
        ) : (
          <p className="form-hint">
            Responder-created incidents are automatically assigned to you.
          </p>
        )}
        <label>
          <span>What is happening?</span>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={8}
                showCount
                maxLength={10_000}
                status={errors.description ? "error" : ""}
              />
            )}
          />
          {errors.description ? (
            <small className="field-error">{errors.description.message}</small>
          ) : null}
        </label>
      </form>
    </Drawer>
  );
}
