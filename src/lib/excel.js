import * as XLSX from 'xlsx';

// ═══════════════════════════════════════════════════════════
//  TEMPLATE DOWNLOAD
// ═══════════════════════════════════════════════════════════
export function downloadTemplate() {
    const ws_data = [
        ['Name', 'TUPAD ID', 'Address', 'PESO Manager', 'Designation', 'Period', 'Work Days'],
        ['Juan D. Cruz',       'TUPAD-2026-03-0167-PAL-001', 'Brgy. San Jose, Sablayan',   'JESSICA B. GUPILAN', 'PESO Manager',    'April 24-30, 2026', '24-30'],
        ['Maria L. Santos',    'TUPAD-2026-03-MAM-002',      'Brgy. Poblacion, Sablayan',  'PEDRO M. CRUZ',      'Brgy. Captain'],
        ['Maria L. Santos',    'TUPAD-2026-03-MAM-002',      'Brgy. Poblacion, Sablayan',  'PEDRO M. CRUZ',      'Brgy. Captain'],
        ['Pedro R. Dela Cruz', 'TUPAD-2026-03-MAM-003',      'Brgy. Buenavista, Sablayan', 'ANA L. SANTOS',      'Designated Rep.'],
        ['Pedro R. Dela Cruz', 'TUPAD-2026-03-MAM-003',      'Brgy. Buenavista, Sablayan', 'ANA L. SANTOS',      'Designated Rep.'],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch:25 },{ wch:32 },{ wch:35 },{ wch:22 },{ wch:18 },{ wch:22 },{ wch:12 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Beneficiaries');
    XLSX.writeFile(wb, 'TUPAD_DTR_Beneficiaries_Template.xlsx');
}

// ═══════════════════════════════════════════════════════════
//  EXCEL UPLOAD — parse first sheet into DTR data
// ═══════════════════════════════════════════════════════════
export async function parseExcelFile(file, onProgress) {
    const buffer = await file.arrayBuffer();
    const data   = new Uint8Array(buffer);

    if (onProgress) onProgress(5);
    const wb     = XLSX.read(data, { type: 'array' });
    if (onProgress) onProgress(20);

    const sheet  = wb.Sheets[wb.SheetNames[0]];
    const arr2d  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    const rows   = [];
    if (arr2d.length) {
        const headers = (arr2d[0] || []).map(String);
        for (let i = 1; i < arr2d.length; i++) {
            const obj = {};
            const r = arr2d[i] || [];
            headers.forEach((h, j) => { if (h) obj[h] = r[j]; });
            rows.push(obj);
            if (onProgress) onProgress(20 + Math.round((i / arr2d.length) * 80));
        }
    }

    if (!rows.length) throw new Error('No data rows found in the file.');

    const keys    = Object.keys(rows[0]);
    const findKey = patterns => {
        for (const k of keys) {
            const low = k.toLowerCase().trim();
            for (const p of patterns) { if (low.includes(p)) return k; }
        }
        return null;
    };

    const nameKey    = findKey(['name', 'pangalan']);
    const tupadIdKey = findKey(['tupad id', 'tupad_id', 'tupadid', 'tupad-id']);
    const idKey      = tupadIdKey ? null : findKey(['id', 'suffix', 'no.', 'number']);
    const addrKey    = findKey(['address', 'tirahan']);
    const prefixKey  = tupadIdKey ? null : findKey(['prefix']);
    const pesoKey    = findKey(['peso manager', 'manager', 'supervisor', 'signatory']);
    const desigKey   = findKey(['designation', 'role', 'title']);
    const monthKey   = findKey(['month', 'period', 'buwan']);
    const daysKey    = findKey(['work day', 'workday', 'days']);

    if (!nameKey) throw new Error('Could not find a "Name" column.');

    const lines     = [];
    let firstPrefix = '';
    const periodSet = new Map();

    rows.forEach((r, i) => {
        const name = String(r[nameKey] || '') .trim();
        if (!name) return;

        let id = '';
        if (tupadIdKey) {
            id = String(r[tupadIdKey] || '').trim();
        } else {
            id = idKey ? String(r[idKey] || '').trim() : '';
            if (i === 0 && prefixKey) firstPrefix = String(r[prefixKey] || '').trim();
        }

        const addr  = addrKey  ? String(r[addrKey]  || '').trim() : '';
        const peso  = pesoKey  ? String(r[pesoKey]  || '').trim() : '';
        const desig = desigKey ? String(r[desigKey] || '').trim() : '';
        lines.push([name, id, addr, peso, desig].join(' | '));

        if (monthKey || daysKey) {
            const mv = monthKey ? String(r[monthKey] || '').trim() : '';
            const dv = daysKey  ? String(r[daysKey]  || '').trim() : '';
            if (mv || dv) {
                const k = mv + '|' + dv;
                if (!periodSet.has(k)) periodSet.set(k, { period: mv, days: dv });
            }
        }
    });

    return {
        lines,
        idPrefix: tupadIdKey ? '' : firstPrefix,
        pesoManager:     (pesoKey  && rows.length > 0) ? String(rows[0][pesoKey]  || '').trim() : '',
        pesoDesignation: (desigKey && rows.length > 0) ? String(rows[0][desigKey] || '').trim() : '',
        periods: Array.from(periodSet.values()).map(p => `${p.period} | ${p.days}`),
        count: lines.length,
    };
}