import { DownloadOutlined } from "@ant-design/icons";
import { App, Button, Input, InputNumber, Modal } from "antd";
import { useEffect, useState } from "react";
import { createCsv, type CsvColumn } from "@/helpers/csv";

export function CsvExportButton<TRecord>({
  columns,
  loadRows,
  total,
  filename,
  maxRows = 100,
  label = "Export CSV"
}: {
  columns: CsvColumn<TRecord>[];
  loadRows: (limit: number) => Promise<TRecord[]>;
  total: number;
  filename: string;
  maxRows?: number;
  label?: string;
}) {
  const { message } = App.useApp();
  const maximum = Math.max(1, Math.min(total || maxRows, maxRows));
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(Math.min(50, maximum));
  const [exportName, setExportName] = useState(filename);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLimit(Math.min(50, maximum));
    setExportName(filename);
  }, [filename, maximum]);

  const download = async () => {
    setExporting(true);
    try {
      const rows = await loadRows(limit);
      const blob = new Blob([createCsv(rows, columns)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${exportName.trim().replace(/\.csv$/i, "") || "export"}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setOpen(false);
      void message.success(`${rows.length} rows exported`);
    } catch (error) {
      void message.error(
        error instanceof Error ? error.message : "The export could not be created"
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button icon={<DownloadOutlined />} disabled={!total} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal
        title="Export table to CSV"
        open={open}
        okText="Export"
        confirmLoading={exporting}
        onOk={() => void download()}
        onCancel={() => setOpen(false)}
      >
        <div className="export-fields">
          <label>
            <span>File name</span>
            <Input value={exportName} onChange={(event) => setExportName(event.target.value)} />
          </label>
          <label>
            <span>Rows to export</span>
            <InputNumber
              min={1}
              max={maximum}
              value={limit}
              onChange={(value) => setLimit(value ?? 1)}
            />
            <small>
              Up to {maximum} of {total} matching rows can be exported at once.
            </small>
          </label>
        </div>
      </Modal>
    </>
  );
}
