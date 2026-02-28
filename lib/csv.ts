export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const headerLine = headers.map(escapeCsvValue).join(',');
  const body = rows
    .map((row) => headers.map((header) => escapeCsvValue(row[header])).join(','))
    .join('\n');
  return `${headerLine}\n${body}`;
}

