// ═══════════════════════════════════════════════════════════
//  PARSE HELPERS
// ═══════════════════════════════════════════════════════════

export function parseWorkDays(str) {
    const days = new Set();
    if (!str) return days;
    for (const part of str.split(',')) {
        const p = part.trim();
        if (p.includes('-')) {
            const [a, b] = p.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(a) && !isNaN(b)) for (let i = a; i <= b; i++) days.add(i);
        } else {
            const n = parseInt(p, 10);
            if (!isNaN(n)) days.add(n);
        }
    }
    return days;
}

export function parsePeriods(text) {
    return text.split('\n').map(l => l.trim()).filter(Boolean).map(t => {
        const pi       = t.indexOf('|');
        const period   = (pi >= 0 ? t.slice(0, pi) : t).trim();
        const daysText = (pi >= 0 ? t.slice(pi + 1) : '').trim();
        return period ? { period, workDays: parseWorkDays(daysText) } : null;
    }).filter(Boolean);
}

export function parseBeneficiaries(str) {
    return str.split('\n').map(l => l.trim()).filter(Boolean).map(t => {
        if (t.includes('|')) {
            const parts = t.split('|').map(s => s.trim());
            return { name: parts[0]||'', idSuffix: parts[1]||'', address: parts[2]||'', pesoManager: parts[3]||'', pesoDesignation: parts[4]||'' };
        }
        const parts = t.split(',').map(s => s.trim());
        return { name: parts[0]||'', idSuffix: parts[1]||'', address: parts.slice(2).join(', '), pesoManager: '', pesoDesignation: '' };
    }).filter(b => b.name);
}

// ═══════════════════════════════════════════════════════════
//  WEEKEND DATE DETECTION
//  Given a period string like "April 24-30, 2026" or "May 1-15, 2026"
//  returns a Set of day-numbers (1-31) that are Sat (6) or Sun (0)
// ═══════════════════════════════════════════════════════════
export function detectWeekendDays(periodText) {
    const result = { saturdays: new Set(), sundays: new Set() };
    if (!periodText) return result;

    const MONTHS = {
        january:1,february:2,march:3,april:4,may:5,june:6,
        july:7,august:8,september:9,october:10,november:11,december:12
    };

    const text = periodText.trim().toLowerCase();

    // Match "april 24-30, 2026" or "may 1-31 2026"
    const rangeMatch = text.match(/([a-z]+)\s+(\d{1,2})[–\-](\d{1,2})[,\s]+(\d{4})/);
    if (rangeMatch) {
        const mon   = MONTHS[rangeMatch[1]];
        const start = parseInt(rangeMatch[2], 10);
        const end   = parseInt(rangeMatch[3], 10);
        const year  = parseInt(rangeMatch[4], 10);
        if (mon && !isNaN(start) && !isNaN(end) && !isNaN(year)) {
            for (let d = start; d <= end; d++) {
                const date = new Date(year, mon - 1, d);
                const dow  = date.getDay(); // 0=Sun, 6=Sat
                if (dow === 6) result.saturdays.add(d);
                if (dow === 0) result.sundays.add(d);
            }
            return result;
        }
    }

    // Match "april 2026" — full month
    const fullMatch = text.match(/([a-z]+)\s+(\d{4})/);
    if (fullMatch) {
        const mon  = MONTHS[fullMatch[1]];
        const year = parseInt(fullMatch[2], 10);
        if (mon && !isNaN(year)) {
            const daysInMonth = new Date(year, mon, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(year, mon - 1, d);
                const dow  = date.getDay();
                if (dow === 6) result.saturdays.add(d);
                if (dow === 0) result.sundays.add(d);
            }
            return result;
        }
    }

    return result; // could not detect — empty sets
}