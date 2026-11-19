import { utils, writeFile } from 'xlsx';

export type Sheet = { name: string; rows: Record<string, unknown>[] };

// Excel workbook downloaded by the browser, one sheet per table; column widths follow the content
export const downloadWorkbook = (fileName: string, sheets: Sheet[]) => {
  const workbook = utils.book_new();
  sheets.forEach((sheet) => {
    const worksheet = utils.json_to_sheet(sheet.rows);
    const headers = Object.keys(sheet.rows[0] || {});
    worksheet['!cols'] = headers.map((header) => ({
      wch: Math.min(60, Math.max(header.length, ...sheet.rows.map((row) => `${row[header] ?? ''}`.length)) + 2),
    }));
    utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  });
  const stamp = new Date().toISOString().slice(0, 10);
  writeFile(workbook, `${fileName}-${stamp}.xlsx`);
};
