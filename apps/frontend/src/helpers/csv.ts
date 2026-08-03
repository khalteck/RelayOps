export interface CsvColumn<TRecord> {
  header: string;
  value: (record: TRecord) => string | number | boolean | null | undefined;
}

function safeCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const formulaSafe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}

export function createCsv<TRecord>(rows: TRecord[], columns: CsvColumn<TRecord>[]): string {
  return [
    columns.map((column) => safeCell(column.header)).join(","),
    ...rows.map((row) => columns.map((column) => safeCell(column.value(row))).join(","))
  ].join("\r\n");
}
