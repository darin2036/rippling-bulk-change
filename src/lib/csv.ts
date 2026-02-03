export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];

  // Normalize line endings and strip a UTF-8 BOM if present.
  let s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);

  let cur = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = s[i + 1];
        if (next === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }

    if (ch === "\n") {
      row.push(cur);
      cur = "";
      if (row.length !== 1 || row[0].trim() !== "") rows.push(row);
      row = [];
      continue;
    }

    cur += ch;
  }

  if (inQuotes) {
    throw new Error("CSV parse error: unterminated quote");
  }

  row.push(cur);
  if (row.length !== 1 || row[0].trim() !== "") rows.push(row);

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map((h) => h.trim().replace(/^\uFEFF/, ""));
  const dataRows = rows.slice(1).filter((r) => r.some((v) => v.trim() !== ""));
  return { headers, rows: dataRows };
}

export function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escapeCell = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const headerLine = headers.map(escapeCell).join(",");
  const lines = rows.map((row) => row.map(escapeCell).join(","));
  return [headerLine, ...lines].join("\n");
}

// Backward-compatible helper for existing usage that expects object rows.
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const parsed = parseCSV(text);
  const headers = parsed.headers;
  const rows = parsed.rows.map((values) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      obj[h] = (values[idx] ?? "").trim();
    });
    return obj;
  });
  return { headers, rows };
}

export function downloadTextFile(filename: string, contents: string, mime = "text/plain") {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
