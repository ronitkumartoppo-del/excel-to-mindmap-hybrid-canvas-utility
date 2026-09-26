import * as XLSX from 'xlsx';
import { MindMapNode, Priority } from '../types';
import { isDescendant } from './layout';
export type ColumnRole = 'id' | 'parentId' | 'label' | 'status' | 'priority' | 'notes' | 'tags' | 'progress' | 'dueDate' | 'ignore';
export interface SheetTable { headers: string[]; rows: string[][]; }
export interface ColumnMapping { [header: string]: ColumnRole; }
const ROLE_ALIASES: Record<ColumnRole, string[]> = {
  id: ['id', 'node id', 'nodeid', 'key', '#'],
  parentId: ['parent id', 'parentid', 'parent', 'parent key', 'pid'],
  label: ['label', 'name', 'title', 'task', 'topic', 'node'],
  status: ['status', 'state', 'workflow'],
  priority: ['priority', 'prio'],
  notes: ['notes', 'note', 'description', 'desc', 'details'],
  tags: ['tags', 'tag', 'labels'],
  progress: ['progress', '%', 'percent'],
  dueDate: ['due', 'due date', 'duedate', 'deadline'],
  ignore: [],
};
export function guessRole(header: string): ColumnRole {
  const h = header.trim().toLowerCase();
  for (const [role, aliases] of Object.entries(ROLE_ALIASES) as [ColumnRole, string[]][]) {
    if (role === 'ignore') continue;
    if (aliases.includes(h)) return role;
  }
  return 'ignore';
}
export function autoMapHeaders(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<ColumnRole>();
  headers.forEach((header, index) => {
    let role = guessRole(header);
    if (role !== 'ignore' && used.has(role)) role = 'ignore';
    if (role === 'ignore' && index === 0 && !used.has('label')) role = 'label';
    if (role !== 'ignore') used.add(role);
    mapping[header] = role;
  });
  if (!Object.values(mapping).includes('label') && headers.length > 0) mapping[headers[0]] = 'label';
  return mapping;
}
function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false; }
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur); return out;
}
export function parseCsvText(text: string): SheetTable {
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) throw new Error('The spreadsheet is empty.');
  const headers = splitCsvLine(lines[0]).map((h) => h.trim() || 'Column');
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    while (cells.length < headers.length) cells.push('');
    return cells.slice(0, headers.length);
  });
  return { headers, rows };
}
export async function parseSpreadsheetFile(file: File): Promise<SheetTable> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) return parseCsvText(await file.text());
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('The workbook has no sheets.');
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, { header: 1, raw: false, defval: '' });
    if (!matrix.length) throw new Error('The spreadsheet is empty.');
    const headers = (matrix[0] || []).map((h, i) => String(h ?? '').trim() || `Column ${i + 1}`);
    const rows = matrix.slice(1).map((row) => {
      const cells = (row || []).map((c) => String(c ?? ''));
      while (cells.length < headers.length) cells.push('');
      return cells.slice(0, headers.length);
    }).filter((row) => row.some((c) => c.trim().length > 0));
    return { headers, rows };
  }
  throw new Error('Unsupported format. Use CSV, XLSX, or a JSON backup.');
}
function normalizePriority(value: string): Priority {
  const v = value.trim().toLowerCase();
  if (v === 'high' || v === 'h') return 'High';
  if (v === 'low' || v === 'l') return 'Low';
  return 'Medium';
}
function nextNumericId(existing: Set<string>): string {
  let max = 0;
  existing.forEach((id) => { const n = parseInt(id, 10); if (!Number.isNaN(n)) max = Math.max(max, n); });
  let candidate = String(max + 1);
  while (existing.has(candidate)) { max += 1; candidate = String(max + 1); }
  existing.add(candidate);
  return candidate;
}
export function tableToNodes(table: SheetTable, mapping: ColumnMapping): MindMapNode[] {
  const colIndex: Partial<Record<ColumnRole, number>> = {};
  table.headers.forEach((header, i) => {
    const role = mapping[header];
    if (role && role !== 'ignore' && colIndex[role] === undefined) colIndex[role] = i;
  });
  if (colIndex.label === undefined) throw new Error('Choose which column is the node name.');
  const raw = table.rows.map((row) => {
    const label = String(row[colIndex.label!] ?? '').trim();
    if (!label) return null;
    const requestedId = colIndex.id !== undefined ? String(row[colIndex.id] ?? '').trim() : '';
    const parentRaw = colIndex.parentId !== undefined ? String(row[colIndex.parentId] ?? '').trim() : '';
    return {
      requestedId, parentRaw, label,
      status: colIndex.status !== undefined ? String(row[colIndex.status] ?? '').trim() : 'Todo',
      priority: colIndex.priority !== undefined ? normalizePriority(String(row[colIndex.priority] ?? '')) : 'Medium' as Priority,
      notes: colIndex.notes !== undefined ? String(row[colIndex.notes] ?? '').trim() : '',
      tags: colIndex.tags !== undefined ? String(row[colIndex.tags] ?? '').split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : [],
      progress: colIndex.progress !== undefined ? Math.max(0, Math.min(100, Number(String(row[colIndex.progress] ?? '').replace('%', '')) || 0)) : undefined,
      dueDate: colIndex.dueDate !== undefined ? String(row[colIndex.dueDate] ?? '').trim() || undefined : undefined,
    };
  }).filter((row): row is NonNullable<typeof row> => row !== null);
  if (raw.length === 0) throw new Error('No named rows were found to import.');
  const idByRequested = new Map<string, string>();
  const assigned = new Set<string>();
  const nodes: MindMapNode[] = raw.map((row) => {
    let id: string;
    if (row.requestedId && !assigned.has(row.requestedId)) id = row.requestedId;
    else id = nextNumericId(assigned);
    assigned.add(id);
    if (row.requestedId && !idByRequested.has(row.requestedId)) idByRequested.set(row.requestedId, id);
    return { id, label: row.label, parentId: null, priority: row.priority, status: row.status || 'Todo', notes: row.notes, tags: row.tags, progress: row.progress, dueDate: row.dueDate };
  });
  raw.forEach((row, index) => {
    if (!row.parentRaw) return;
    const parentId = idByRequested.get(row.parentRaw);
    if (!parentId) return;
    const child = nodes[index];
    if (parentId === child.id) return;
    if (isDescendant(child.id, parentId, nodes.map((n, i) => i === index ? { ...n, parentId } : n))) return;
    child.parentId = parentId;
  });
  nodes.filter((n) => n.parentId && !nodes.some((p) => p.id === n.parentId)).forEach((n) => { n.parentId = null; });
  return nodes;
}
export function nodesToSheetRows(nodes: MindMapNode[]): { headers: string[]; rows: string[][] } {
  const headers = ['ID', 'Parent ID', 'Name', 'Status', 'Priority', 'Notes', 'Tags', 'Progress', 'Due Date'];
  const rows = nodes.map((n) => [n.id, n.parentId || '', n.label || '', n.status || '', n.priority || '', n.notes || '', (n.tags || []).join(', '), n.progress !== undefined ? String(n.progress) : '', n.dueDate || '']);
  return { headers, rows };
}
export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const body = [headers, ...rows].map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(filename, blob);
}
export function downloadXlsx(filename: string, headers: string[], rows: string[][]): void {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'MindMap');
  XLSX.writeFile(workbook, filename);
}
function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
