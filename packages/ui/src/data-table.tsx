import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Table, type TableProps } from "antd";
import type { KeyboardEvent } from "react";

export interface DataTableProps<TRecord extends object> {
  ariaLabel: string;
  columns: NonNullable<TableProps<TRecord>["columns"]>;
  data: TRecord[];
  rowKey: NonNullable<TableProps<TRecord>["rowKey"]>;
  loading?: boolean;
  error?: Error | null;
  total: number;
  page: number;
  pageSize: number;
  emptyTitle?: string;
  emptyDescription?: string;
  totalLabel?: string;
  onRetry?: () => void;
  onPageChange: (page: number, pageSize: number) => void;
  onChange?: TableProps<TRecord>["onChange"];
  onRowOpen?: (record: TRecord) => void;
  rowTestId?: (record: TRecord) => string;
}

export function DataTable<TRecord extends object>({
  ariaLabel,
  columns,
  data,
  rowKey,
  loading = false,
  error,
  total,
  page,
  pageSize,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  totalLabel = "items",
  onRetry,
  onPageChange,
  onChange,
  onRowOpen,
  rowTestId
}: DataTableProps<TRecord>) {
  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="This data could not be loaded"
        description={error.message}
        action={
          onRetry ? (
            <Button icon={<ReloadOutlined />} onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      />
    );
  }

  const activateRow = (record: TRecord, event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onRowOpen?.(record);
  };

  return (
    <div role="region" aria-label={ariaLabel} tabIndex={0} className="relay-table-region">
      <Table<TRecord>
        columns={columns}
        dataSource={data}
        rowKey={rowKey}
        loading={loading}
        tableLayout="fixed"
        scroll={{ x: 900 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={emptyDescription ?? emptyTitle}
            />
          )
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (count) => `${count} ${totalLabel}`,
          onChange: onPageChange
        }}
        {...(onChange ? { onChange } : {})}
        onRow={(record) => ({
          tabIndex: onRowOpen ? 0 : undefined,
          ...(rowTestId ? { "data-incident-row": rowTestId(record) } : {}),
          onClick: () => onRowOpen?.(record),
          onKeyDown: (event) => activateRow(record, event),
          className: onRowOpen ? "relay-table-row--interactive" : undefined
        })}
      />
    </div>
  );
}
