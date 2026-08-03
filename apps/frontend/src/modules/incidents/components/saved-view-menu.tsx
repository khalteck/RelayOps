import { DeleteOutlined, LinkOutlined, SaveOutlined } from "@ant-design/icons";
import type { IncidentFilters, SavedViewDto } from "@relayops/types";
import { App, Button, Dropdown, Input, Modal, Select, Space, Tooltip } from "antd";
import { useState } from "react";
import { useDeleteSavedView, useSaveView } from "../operations/saved-views.queries";

export function SavedViewMenu({
  workspaceId,
  views,
  activeViewId,
  filters,
  visibleColumns,
  onApply
}: {
  workspaceId: string;
  views: SavedViewDto[];
  activeViewId: string | null;
  filters: IncidentFilters;
  visibleColumns: string[];
  onApply: (view: SavedViewDto | null) => void;
}) {
  const { message } = App.useApp();
  const saveView = useSaveView(workspaceId);
  const deleteView = useDeleteSavedView(workspaceId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const save = async () => {
    await saveView.mutateAsync({
      name,
      filters,
      visibleColumns
    });
    setOpen(false);
    setName("");
    void message.success("View saved privately");
  };

  const remove = async () => {
    if (!activeViewId) return;
    await deleteView.mutateAsync(activeViewId);
    onApply(null);
    void message.success("Saved view removed");
  };

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href);
    void message.success("Filtered URL copied");
  };

  return (
    <>
      <Space.Compact>
        <Select
          aria-label="Saved view"
          placeholder="Saved views"
          allowClear
          value={activeViewId ?? undefined}
          className="saved-view-select"
          loading={!views.length && saveView.isPending}
          options={views.map((view) => ({ value: view.id, label: view.name }))}
          onClear={() => onApply(null)}
          onChange={(id) => onApply(views.find((view) => view.id === id) ?? null)}
        />
        <Tooltip title="Save current filters">
          <Button
            icon={<SaveOutlined />}
            aria-label="Save current filters"
            onClick={() => setOpen(true)}
          />
        </Tooltip>
        <Dropdown
          menu={{
            items: [
              {
                key: "share",
                icon: <LinkOutlined />,
                label: "Copy filtered URL",
                onClick: () => void share()
              },
              {
                key: "delete",
                danger: true,
                disabled: !activeViewId,
                icon: <DeleteOutlined />,
                label: "Delete selected view",
                onClick: () => void remove()
              }
            ]
          }}
        >
          <Button aria-label="Saved view actions">•••</Button>
        </Dropdown>
      </Space.Compact>
      <Modal
        title="Save this view"
        open={open}
        okText="Save view"
        confirmLoading={saveView.isPending}
        okButtonProps={{ disabled: name.trim().length < 2 }}
        onOk={() => void save()}
        onCancel={() => setOpen(false)}
      >
        <label className="modal-field">
          <span>View name</span>
          <Input
            autoFocus
            value={name}
            maxLength={80}
            placeholder="e.g. Open P1 incidents"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      </Modal>
    </>
  );
}
