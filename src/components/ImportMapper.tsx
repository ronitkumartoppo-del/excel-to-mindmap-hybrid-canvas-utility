import { useMemo, useState } from 'react';
import { ColumnMapping, ColumnRole, SheetTable, autoMapHeaders } from '../utils/spreadsheet';

const ROLES: { value: ColumnRole; label: string }[] = [
  { value: 'label', label: 'Name' },
  { value: 'id', label: 'ID' },
  { value: 'parentId', label: 'Parent ID' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'notes', label: 'Notes' },
  { value: 'tags', label: 'Tags' },
  { value: 'progress', label: 'Progress' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'ignore', label: 'Ignore' },
];

interface ImportMapperProps {
  fileName: string;
  table: SheetTable;
  onCancel: () => void;
  onConfirm: (mapping: ColumnMapping) => void;
}

export default function ImportMapper({ fileName, table, onCancel, onConfirm }: ImportMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(() => autoMapHeaders(table.headers));
  const preview = useMemo(() => table.rows.slice(0, 5), [table.rows]);
  const hasName = Object.values(mapping).includes('label');

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="import-mapper-title">
      <div className="bg-white text-slate-900 w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl border-2 border-slate-800 shadow-2xl p-5">
        <h2 id="import-mapper-title" className="text-base font-extrabold">Map spreadsheet columns</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          File: <span className="font-semibold text-slate-700">{fileName}</span>. Tell the app which column is the node name and parent.
        </p>
        <div className="space-y-2 mb-4">
          {table.headers.map((header) => (
            <label key={header} className="flex items-center justify-between gap-3 text-sm border border-slate-200 rounded-lg px-3 py-2">
              <span className="font-semibold truncate">{header}</span>
              <select
                className="border-2 border-slate-300 rounded-lg text-xs font-bold px-2 py-1"
                value={mapping[header] || 'ignore'}
                onChange={(e) => setMapping((prev) => ({ ...prev, [header]: e.target.value as ColumnRole }))}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
          <table className="min-w-full text-[11px]">
            <thead className="bg-slate-50">
              <tr>
                {table.headers.map((h) => (
                  <th key={h} className="text-left px-2 py-1 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {row.map((cell, j) => (
                    <td key={j} className="px-2 py-1 truncate max-w-[160px]">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!hasName && <p className="text-xs text-rose-600 font-bold mb-3">Pick one column as Name.</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-bold border-2 border-slate-300 rounded-lg">Cancel</button>
          <button
            type="button"
            disabled={!hasName}
            onClick={() => onConfirm(mapping)}
            className="px-3 py-1.5 text-xs font-extrabold bg-blue-600 text-white rounded-lg disabled:opacity-40"
          >
            Import {table.rows.length} rows
          </button>
        </div>
      </div>
    </div>
  );
}
