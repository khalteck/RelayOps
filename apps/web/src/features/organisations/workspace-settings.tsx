import { zodResolver } from "@hookform/resolvers/zod";
import {
  INCIDENT_PRIORITIES,
  slaPolicySchema,
  tenantNameInputSchema,
  type OrganisationSummary,
  type SlaPolicy,
  type WorkspaceSummary
} from "@relayops/types";
import { App, Button, Card, Divider, Input, InputNumber, Modal, Space } from "antd";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateWorkspace, useUpdateOrganisation, useUpdateWorkspace } from "./organisations.api";

const workspaceFormSchema = z.object({
  name: tenantNameInputSchema.shape.name,
  slaPolicy: slaPolicySchema
});
type WorkspaceForm = z.infer<typeof workspaceFormSchema>;

export function WorkspaceSettings({
  organisation,
  workspace
}: {
  organisation: OrganisationSummary;
  workspace: WorkspaceSummary;
}) {
  const { message } = App.useApp();
  const updateWorkspace = useUpdateWorkspace();
  const updateOrganisation = useUpdateOrganisation();
  const createWorkspace = useCreateWorkspace();
  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [organisationName, setOrganisationName] = useState(organisation.name);
  const canManage = organisation.permissions.includes("workspace:update");
  const canUpdateOrganisation = organisation.permissions.includes("organisation:update");
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<WorkspaceForm>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: { name: workspace.name, slaPolicy: workspace.slaPolicy }
  });

  useEffect(() => {
    reset({ name: workspace.name, slaPolicy: workspace.slaPolicy });
    setOrganisationName(organisation.name);
  }, [organisation.name, reset, workspace]);

  const saveWorkspace = handleSubmit(async (values) => {
    if (values.name !== workspace.name) {
      await updateWorkspace.mutateAsync({ workspaceId: workspace.id, name: values.name });
    }
    await updateWorkspace.mutateAsync({
      workspaceId: workspace.id,
      slaPolicy: values.slaPolicy as SlaPolicy
    });
    reset(values);
    void message.success("Workspace settings saved");
  });

  if (!canManage) {
    return (
      <Card title="Workspace settings" className="settings-card">
        <p className="settings-card__description">
          Your role has read-only access to this workspace configuration.
        </p>
        <dl className="settings-summary">
          <div>
            <dt>Organisation</dt>
            <dd>{organisation.name}</dd>
          </div>
          <div>
            <dt>Workspace</dt>
            <dd>{workspace.name}</dd>
          </div>
          <div>
            <dt>P1 acknowledgement</dt>
            <dd>{workspace.slaPolicy.P1.acknowledgeMinutes} minutes</dd>
          </div>
          <div>
            <dt>P1 resolution</dt>
            <dd>{workspace.slaPolicy.P1.resolveMinutes} minutes</dd>
          </div>
        </dl>
      </Card>
    );
  }

  return (
    <>
      <div className="settings-section-actions">
        <Button type="primary" onClick={() => setNewWorkspaceOpen(true)}>
          New workspace
        </Button>
      </div>
      {canUpdateOrganisation ? (
        <Card className="settings-card" title="Organisation">
          <p className="settings-card__description">
            Display names can change; stable slugs keep links valid.
          </p>
          <Space.Compact className="settings-inline">
            <Input
              aria-label="Organisation name"
              value={organisationName}
              onChange={(event) => setOrganisationName(event.target.value)}
            />
            <Button
              loading={updateOrganisation.isPending}
              disabled={
                organisationName.trim().length < 2 || organisationName === organisation.name
              }
              onClick={async () => {
                await updateOrganisation.mutateAsync({
                  organisationId: organisation.id,
                  name: organisationName
                });
                void message.success("Organisation updated");
              }}
            >
              Update
            </Button>
          </Space.Compact>
        </Card>
      ) : null}
      <Card className="settings-card" title="Workspace and SLA">
        <form onSubmit={(event) => void saveWorkspace(event)} noValidate>
          <label className="settings-field">
            <span>Workspace name</span>
            <Controller
              control={control}
              name="name"
              render={({ field }) => <Input {...field} status={errors.name ? "error" : ""} />}
            />
          </label>
          <Divider />
          <div className="sla-grid">
            <div className="sla-grid__header">
              <strong>Priority</strong>
              <strong>Acknowledge</strong>
              <strong>Resolve</strong>
            </div>
            {INCIDENT_PRIORITIES.map((priority) => (
              <div className="sla-grid__row" key={priority}>
                <span className={`priority-badge priority-badge--${priority.toLowerCase()}`}>
                  {priority}
                </span>
                <Controller
                  control={control}
                  name={`slaPolicy.${priority}.acknowledgeMinutes`}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      addonAfter="min"
                      aria-label={`${priority} acknowledgement minutes`}
                      onChange={(value) => field.onChange(value ?? 1)}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`slaPolicy.${priority}.resolveMinutes`}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      addonAfter="min"
                      aria-label={`${priority} resolution minutes`}
                      onChange={(value) => field.onChange(value ?? 1)}
                    />
                  )}
                />
              </div>
            ))}
          </div>
          <div className="settings-actions">
            <Button
              htmlType="submit"
              type="primary"
              disabled={!isDirty}
              loading={updateWorkspace.isPending}
            >
              Save settings
            </Button>
          </div>
        </form>
      </Card>
      <Modal
        title="Create workspace"
        open={newWorkspaceOpen}
        okText="Create"
        confirmLoading={createWorkspace.isPending}
        okButtonProps={{ disabled: newWorkspaceName.trim().length < 2 }}
        onOk={async () => {
          await createWorkspace.mutateAsync({
            organisationId: organisation.id,
            name: newWorkspaceName
          });
          setNewWorkspaceOpen(false);
          setNewWorkspaceName("");
          void message.success("Workspace created");
        }}
        onCancel={() => setNewWorkspaceOpen(false)}
      >
        <label className="modal-field">
          <span>Workspace name</span>
          <Input
            autoFocus
            value={newWorkspaceName}
            onChange={(event) => setNewWorkspaceName(event.target.value)}
          />
        </label>
      </Modal>
    </>
  );
}
