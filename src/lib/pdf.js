import { jsPDF } from 'jspdf';

// ═══════════════════════════════════════════════════════════
//  VECTOR PDF EXPORT — draws the DTR layout directly with
//  jsPDF. Crisp, scalable to hundreds/thousands of pages
//  (no rasterization, so memory stays flat).
// ═══════════════════════════════════════════════════════════

const PAGE_W = 1008;                       // 14in × 72
const PAGE_H = 612;                        // 8.5in × 72
const PAD   = 15.76;                         // page margin/space around the cards (pt) — original 5.76 + 10pt
const GAP   = 23.04;                         // grid gap between cards (pt) — matches CSS 0.32in for cutting
const CARD_W = (PAGE_W - 2 * PAD - 3 * GAP) / 4;  // computed so 4 cards + gaps fit the page width

const CERT_TEXT =
    'I certify on my honor that the above is a true and correct report of the ' +
    'hours of work performed, record of which was made daily at the time of ' +
    'arrival and departure from work.';

function wrap(pdf, text, maxW, fontSize) {
    pdf.setFontSize(fontSize);
    return pdf.splitTextToSize(text, maxW);
}

export async function saveAsPDF(pages, show4thCopy = true, onProgress) {
    if (!pages || !pages.length) return 0;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [PAGE_W, PAGE_H], compress: true });
    doc.setProperties({ title: 'TUPAD Daily Time Records', subject: `${pages.length} DTR sheets` });

    for (let i = 0; i < pages.length; i++) {
        if (i > 0) doc.addPage([PAGE_W, PAGE_H], 'landscape');
        drawSheet(doc, pages[i], show4thCopy);
        if (onProgress) {
            onProgress(Math.round(((i + 1) / pages.length) * 100));
            if (i % 5 === 4 || i === pages.length - 1) await new Promise(r => setTimeout(r, 0));
        }
    }

    doc.save(`TUPAD_DTR_${pages.length}page${pages.length === 1 ? '' : 's'}.pdf`);
    return pages.length;
}

function drawSheet(doc, p, show4thCopy) {
    const copies = show4thCopy ? 4 : 3;
    for (let i = 0; i < copies; i++) {
        const x = PAD + i * (CARD_W + GAP);
        drawCard(doc, x, PAD, CARD_W, PAGE_H - PAD * 2, p.dtrData, p.weekendInfo, i === 3);
    }
}

function drawCard(pdf, cx, cy, w, h, data, weekendInfo, isSample) {
    const { name, tupadId, address, period, pesoManager, pesoDesignation,
            verifier, verifierTitle, office, workDays } = data;
    const { saturdays, sundays, showSat, showSun } = weekendInfo;

    const left  = cx + 2;
    const right = cx + w - 2;
    const mid   = cx + w / 2;
    const innerW = right - left;

    let cur = cy + 4;

    // ── Header ──────────────────────────────────────────────
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('ANNEX J-1', mid, cur, { align: 'center' });
    cur += 11;
    pdf.text('DAILY TIME RECORD', mid, cur, { align: 'center' });
    cur += 14;

    // ── Identity fields ─────────────────────────────────────
    const drawField = (label, value) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        const lw = pdf.getTextWidth(label + ' ');
        const avail = innerW - lw - 2;
        let fs = 9;
        while (fs > 5.5 && pdf.getTextWidth(value) > avail) { fs -= 0.5; pdf.setFontSize(fs); }
        pdf.setFontSize(fs);
        pdf.text(label, left, cur);
        const vx = left + lw;
        pdf.text(value, vx, cur);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(vx, cur + 1, right, cur + 1);
        cur += 14;
    };
    drawField('Name:', name);
    cur -= 2;
    drawField('Address:', address);
    cur -= 2;
    drawField('TUPAD ID No.:', tupadId);
    cur -= 2;
    drawField('Month:', period);

    // Table starts right after the Month underline (no blank gap row).
    const tableTop = cur - 14 + 3;

    // ── Bottom block (cert + signature + verifiers) ─────────
    const certLines = wrap(pdf, CERT_TEXT, innerW, 6.5);
    const certH = certLines.length * 7.2;

    const colW = innerW / 2;
    const roleText = `${pesoDesignation || 'PESO Manager'} , LGU/Brgy Official ` +
        'or Designated Rep.,(if Direct Admin)NGO/PO Officers or Designated Rep. if thru Co-partner';
    const roleLines = wrap(pdf, roleText, colW - 4, 6.3);
    const tLines = wrap(pdf, verifierTitle || '', colW - 4, 6.3);
    const oLines = office ? [office] : [];  // single line, no wrap

    const nameStart = 28;
    const subStart = nameStart + 5.5;

    // spacing matched to the on-screen DTR (see HTML measurements)
    const certBottomGap = 20;   // gap below cert text before the signature line (.sig-block margin-top 20)
    const sigLineBlock  = 4.5;  // gap between the sig line and "TUPAD Beneficiary" label (HTML ~1pt, +3 per request)
    const sigRoleBlock  = 6;    // height of "TUPAD Beneficiary" below the line
    const verifiedBlock = 8;    // height of "Verified by:" + small gap

    // Table keeps a FIXED height (independent of footer), so the 33-row table never
    // shrinks when the footer block is pushed further down. The footer just flows
    // below the table bottom.
    const rowH = 12;
    const tableH = rowH * 33;
    const tableBottom = tableTop + tableH;

    // ── Table ───────────────────────────────────────────────
    // Date | A.M. | P.M. sections are equal width (innerW/3 each); each A.M./P.M.
    // splits into two Time In/Out columns of equal width so all 4 time cols match.
    const dateW = innerW / 5;
    const timeW = (innerW - dateW) / 4;
    const bx = [left, left + dateW];
    for (let c = 1; c <= 4; c++) bx.push(bx[c] + timeW);

    // header row 1 (three separate cells: Date | A.M. | P.M.)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('Date', (bx[0] + bx[1]) / 2, tableTop + rowH * 0.5 + 8 * 0.34, { align: 'center' });
    pdf.text('A.M.', (bx[1] + bx[3]) / 2, tableTop + rowH * 0.5 + 8 * 0.34, { align: 'center' });
    pdf.text('P.M.', (bx[3] + bx[5]) / 2, tableTop + rowH * 0.5 + 8 * 0.34, { align: 'center' });
    // header row 2 (Time In / Time Out under A.M. and P.M.)
    pdf.setFontSize(7);
    pdf.text('Time In',  (bx[1] + bx[2]) / 2, tableTop + rowH * 1.5 + 7 * 0.34, { align: 'center' });
    pdf.text('Time Out', (bx[2] + bx[3]) / 2, tableTop + rowH * 1.5 + 7 * 0.34, { align: 'center' });
    pdf.text('Time In',  (bx[3] + bx[4]) / 2, tableTop + rowH * 1.5 + 7 * 0.34, { align: 'center' });
    pdf.text('Time Out', (bx[4] + bx[5]) / 2, tableTop + rowH * 1.5 + 7 * 0.34, { align: 'center' });

    // body rows: 1..31
    const times = ['8:00', '12:00', '1:00', '5:00'];
    for (let d = 1; d <= 31; d++) {
        const r = d + 1;
        const rowMid = tableTop + rowH * (r + 0.5);
        const textY  = rowMid + 9 * 0.34;   // baseline offset so glyph centers in cell
        const isSat = saturdays.has(d);
        const isSun = sundays.has(d);

        if (isSat && !showSat) {
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(7);
            pdf.text(String(d), (bx[0] + bx[1]) / 2, rowMid + 7 * 0.34, { align: 'center' });
            pdf.text('SATURDAY', (bx[1] + bx[5]) / 2, rowMid + 7 * 0.34, { align: 'center' });
            continue;
        }
        if (isSun && !showSun) {
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(7);
            pdf.text(String(d), (bx[0] + bx[1]) / 2, rowMid + 7 * 0.34, { align: 'center' });
            pdf.text('SUNDAY', (bx[1] + bx[5]) / 2, rowMid + 7 * 0.34, { align: 'center' });
            continue;
        }

        const filled = isSample && workDays.has(d);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(String(d), (bx[0] + bx[1]) / 2, textY, { align: 'center' });
        pdf.setFont('helvetica', 'bold');
        for (let c = 0; c < 4; c++) {
            if (filled) pdf.text(times[c], (bx[c + 1] + bx[c + 2]) / 2, textY, { align: 'center' });
        }
    }

    // grid
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(left, tableTop, innerW, tableBottom - tableTop);
    for (let i = 0; i <= 33; i++) {
        const yy = tableTop + rowH * i;
        pdf.line(left, yy, right, yy);
    }
    // Header has three separate cells (Date | A.M. | P.M.) in row 1 and
    // Time In/Out separated in row 2. The Date/A.M. and A.M./P.M. boundaries
    // (bx[1], bx[3]) run the full table height; the Time In|Out dividers (bx[2], bx[4])
    // run from below row 1 (so A.M./P.M. stay merged) through the body.
    for (const c of [1, 3]) pdf.line(bx[c], tableTop, bx[c], tableBottom);
    for (const c of [2, 4]) pdf.line(bx[c], tableTop + rowH, bx[c], tableBottom);

    // ── Certification text ──────────────────────────────────
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text(certLines, left, tableBottom + 7, { lineHeightFactor: 1.15 });
    const certBottom = tableBottom + 7 + certH;

    // ── Signature block ─────────────────────────────────────
    const sigLineW = innerW * 0.65;         // width 65% (matches .sig-line)
    const lineY = certBottom + certBottomGap;
    pdf.setLineWidth(0.5);
    pdf.line(left + 3, lineY, left + 3 + sigLineW, lineY);
    if (isSample) {
        pdf.setFont('helvetica', 'bolditalic');
        pdf.setFontSize(9);
        pdf.text('Permahan', left + 3, lineY - 2);
        pdf.setFont('helvetica', 'normal');
    }
    pdf.setFontSize(6);
    pdf.text('TUPAD Beneficiary', left + 3, lineY + 2 + sigLineBlock);
    let by = lineY + sigLineBlock + sigRoleBlock;

    // ── Verified by (sits just below the TUPAD Beneficiary line) ──────────────
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('Verified by:', left, by + 5);
    by += verifiedBlock;

    // verifier columns
    const cxL = left + colW / 2;
    const cxR = left + colW * 1.5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text(pesoManager || '', cxL, by + nameStart, { align: 'center' });
    pdf.text(verifier || '', cxR, by + nameStart, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.3);
    pdf.text(roleLines, cxL, by + subStart, { align: 'center', lineHeightFactor: 1.15 });
    // Right column: title at 6.3, office at a reduced 5.3 (no wrap)
    pdf.text(tLines, cxR, by + subStart, { align: 'center', lineHeightFactor: 1.15 });
    pdf.setFontSize(5.3);
    pdf.text(oLines, cxR, by + subStart + tLines.length * 6.3 * 1.15, { align: 'center', lineHeightFactor: 1.15 });
}