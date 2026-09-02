import React, { useEffect, useMemo, useState } from 'react';
import MenuBar        from './components/MenuBar';
import WeekendBar     from './components/WeekendBar';
import DetailsModal   from './components/DetailsModal';
import DTRCard        from './components/DTRCard';
import Toast          from './components/Toast';
import AccessModals   from './components/AccessModals';
import { parsePeriods, parseBeneficiaries, detectWeekendDays } from './lib/parse';
import { downloadTemplate, parseExcelFile } from './lib/excel';
import { saveAsPDF } from './lib/pdf';

export default function App() {
    // ── Data fields ─────────────────────────────────────────────
    const [idPrefix, setIdPrefix]           = useState('TUPAD-2026-03-0167-PAL-');
    const [periodsText, setPeriodsText]     = useState('April 24-30, 2026 | 24-30');
    const [beneficiariesText, setBeneficiariesText] = useState('');
    const [pesoManager, setPesoManager]     = useState('');
    const [pesoDesignation, setPesoDesignation] = useState('');
    const [verifier, setVerifier]           = useState(() => localStorage.getItem('tupad_verifier') || 'GENER L. FRANCISCO');
    const [verifierTitle, setVerifierTitle] = useState(() => localStorage.getItem('tupad_verifierTitle') || 'Provincial Office Head');
    const [office, setOffice]               = useState(() => localStorage.getItem('tupad_office') || 'Occidental Mindoro Provincial Office');

    // ── Weekend state ───────────────────────────────────────────
    const [globalSat, setGlobalSat]         = useState(true);
    const [globalSun, setGlobalSun]         = useState(true);
    const [periodOverrides, setPeriodOverrides] = useState({});

    // ── UI state ────────────────────────────────────────────────
    const [show4thCopy, setShow4thCopy]     = useState(true);
    const [uploadStatus, setUploadStatus]   = useState({ text: '', error: false, loading: false });
    const [modalOpen, setModalOpen]         = useState(false);
    const [locked, setLocked]               = useState(true);
    const [dismissedWelcome, setDismissedWelcome] = useState(() => localStorage.getItem('tupad_welcomed') === '1');
    const [drafts, setDrafts]               = useState({ periods: '', verifier: '', verifierTitle: '', office: '' });
    const [groupIndex, setGroupIndex]       = useState(0);

    // Auto-dismiss the upload toast after a few seconds
    useEffect(() => {
        if (!uploadStatus.text || uploadStatus.loading) return;
        const t = setTimeout(() => setUploadStatus(prev => ({ ...prev, text: '' })), 4000);
        return () => clearTimeout(t);
    }, [uploadStatus]);

    // ── Derived data ────────────────────────────────────────────
    const periods = useMemo(() => {
        const p = parsePeriods(periodsText);
        return p.length ? p : [{ period: '', workDays: new Set() }];
    }, [periodsText]);

    const beneficiaries = useMemo(() => parseBeneficiaries(beneficiariesText), [beneficiariesText]);

    const getWeekendSetting = React.useCallback(
        periodText => periodOverrides[periodText] || { showSat: globalSat, showSun: globalSun },
        [periodOverrides, globalSat, globalSun]
    );

    const pages = useMemo(() => {
        const out = [];
        let idx = 0;
        for (const b of beneficiaries) {
            for (const p of periods) {
                const tupadId = idPrefix ? idPrefix + b.idSuffix : b.idSuffix;
                const common = {
                    name:            b.name,
                    address:         b.address,
                    tupadId,
                    period:          p.period,
                    pesoManager:     b.pesoManager     || pesoManager,
                    pesoDesignation: b.pesoDesignation || pesoDesignation,
                    verifier, verifierTitle, office,
                    workDays: p.workDays,
                };
                const detected   = detectWeekendDays(p.period);
                const wkSetting  = getWeekendSetting(p.period);
                out.push({
                    key: `page-${idx++}`,
                    dtrData: common,
                    weekendInfo: {
                        saturdays: detected.saturdays,
                        sundays:   detected.sundays,
                        showSat:   wkSetting.showSat,
                        showSun:   wkSetting.showSun,
                    },
                });
            }
        }
        return out;
    }, [beneficiaries, periods, idPrefix, pesoManager, pesoDesignation,
        verifier, verifierTitle, office, getWeekendSetting]);

    const wbInfo = useMemo(() => {
        const detectedCount = periods.reduce((acc, p) => {
            const d = detectWeekendDays(p.period);
            return acc + d.saturdays.size + d.sundays.size;
        }, 0);
        return detectedCount > 0
            ? `Auto-detected ${detectedCount} weekend day${detectedCount > 1 ? 's' : ''} across ${periods.length} period${periods.length > 1 ? 's' : ''}`
            : 'No date range detected — toggle manually';
    }, [periods]);

    const pageCount = !beneficiaries.length ? '' :
        `${beneficiaries.length} beneficiar${beneficiaries.length === 1 ? 'y' : 'ies'} × ${periods.length} period${periods.length === 1 ? '' : 's'} — ${beneficiaries.length * periods.length} page(s) ready`;

    // Paginate the on-screen render so 1000s of DTR cards don't crash the DOM.
    const GROUP_SIZE = 8;
    const totalGroups = pages.length ? Math.ceil(pages.length / GROUP_SIZE) : 1;
    const safeGroup = Math.min(Math.max(groupIndex, 0), totalGroups - 1);
    const visiblePages = pages.slice(safeGroup * GROUP_SIZE, safeGroup * GROUP_SIZE + GROUP_SIZE);
    const groupLabel = pages.length > GROUP_SIZE
        ? `Showing pages ${safeGroup * GROUP_SIZE + 1}–${Math.min((safeGroup + 1) * GROUP_SIZE, pages.length)} of ${pages.length}`
        : '';

    // ── Handlers ────────────────────────────────────────────────
    function openModal() {
        setDrafts({ periods: periodsText, verifier, verifierTitle, office });
        setModalOpen(true);
    }
    function closeModal() { setModalOpen(false); }
    function onDraftChange(field, value) {
        setDrafts(prev => ({ ...prev, [field]: value }));
    }
    function saveDetails() {
        setPeriodsText(drafts.periods);
        setVerifier(drafts.verifier);
        setVerifierTitle(drafts.verifierTitle);
        setOffice(drafts.office);
        localStorage.setItem('tupad_verifier',      drafts.verifier);
        localStorage.setItem('tupad_verifierTitle', drafts.verifierTitle);
        localStorage.setItem('tupad_office',        drafts.office);
        setModalOpen(false);
        setPeriodOverrides({});
    }

    async function handleFileSelected(e) {
        const file = e.target.files && e.target.files[0];
        handleFileUpload(file);
        e.target.value = '';
    }

    async function handleFileUpload(file) {
        if (!file) return;
        setUploadStatus({ text: 'Reading file... 0%', error: false, loading: true });
        try {
            const result = await parseExcelFile(file, pct => {
                setUploadStatus({ text: `Reading file... ${pct}%`, error: false, loading: true });
            });
            setBeneficiariesText(result.lines.join('\n'));
            setIdPrefix(result.idPrefix);
            if (result.pesoManager)     setPesoManager(result.pesoManager);
            if (result.pesoDesignation) setPesoDesignation(result.pesoDesignation);
            if (result.periods.length)  setPeriodsText(result.periods.join('\n'));
            setPeriodOverrides({});
            setGroupIndex(0);
            setUploadStatus({
                text: `✓ Loaded ${result.count} beneficiar${result.count === 1 ? 'y' : 'ies'} from ${file.name}`,
                error: false, loading: false,
            });
        } catch (err) {
            console.error(err);
            setUploadStatus({ text: err.message, error: true, loading: false });
        }
    }

    function onDrop(e) {
        e.preventDefault();
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        handleFileUpload(file);
    }

    function toggle4thCopy() { setShow4thCopy(v => !v); }

    async function handleSavePDF() {
        if (!beneficiaries.length) {
            setUploadStatus({ text: 'No data to save — upload beneficiary data first', error: true });
            return;
        }
        setUploadStatus({ text: 'Generating PDF... 0%', error: false, loading: true });
        try {
            const n = await saveAsPDF(pages, show4thCopy, pct => {
                setUploadStatus({ text: `Generating PDF... ${pct}%`, error: false, loading: true });
            });
            setUploadStatus({ text: `✓ PDF saved — ${n} page${n === 1 ? '' : 's'}`, error: false, loading: false });
        } catch (err) {
            console.error(err);
            setUploadStatus({ text: 'PDF failed: ' + err.message, error: true, loading: false });
        }
    }

    function dismissToast() { setUploadStatus(prev => ({ ...prev, text: '' })); }

    function togglePeriodOverride(periodText, day) {
        setPeriodOverrides(prev => {
            const current = prev[periodText] || { showSat: globalSat, showSun: globalSun };
            const updated = { ...current };
            if (day === 'sat') updated.showSat = !updated.showSat;
            if (day === 'sun') updated.showSun = !updated.showSun;
            return { ...prev, [periodText]: updated };
        });
    }

    // ── Render ──────────────────────────────────────────────────
    // Password gate lives on its own page; the main app only mounts after unlock.
    if (locked) {
        return (
            <React.Fragment>
                <AccessModals
                    locked={locked}
                    onUnlock={() => setLocked(false)}
                    dismissedWelcome
                    onDismissWelcome={() => {}}
                />
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <MenuBar
                onDownloadTemplate={downloadTemplate}
                onOpenModal={openModal}
                onPrint={() => window.print()}
                onSavePDF={handleSavePDF}
                show4thCopy={show4thCopy}
                onToggle4thCopy={toggle4thCopy}
                onUploadClick={ref => ref && ref.click()}
                onFileSelected={handleFileSelected}
                loading={uploadStatus.loading}
                onDrop={onDrop}
            />
            <WeekendBar
                globalSat={globalSat}
                globalSun={globalSun}
                onToggleSat={() => setGlobalSat(v => !v)}
                onToggleSun={() => setGlobalSun(v => !v)}
                periods={periods}
                overrides={periodOverrides}
                onTogglePeriod={togglePeriodOverride}
                infoText={wbInfo}
                pageCount={pageCount}
                pager={beneficiaries.length ? (
                    <div className="pager">
                        <button className="pager-btn" onClick={() => setGroupIndex(i => Math.max(i - 1, 0))} disabled={safeGroup === 0}>‹ Prev</button>
                        <span className="pager-label">{groupLabel}</span>
                        <button className="pager-btn" onClick={() => setGroupIndex(i => Math.min(i + 1, totalGroups - 1))} disabled={safeGroup >= totalGroups - 1}>Next ›</button>
                    </div>
                ) : null}
            />
            <AccessModals
                locked={locked}
                onUnlock={() => setLocked(false)}
                dismissedWelcome={dismissedWelcome}
                onDismissWelcome={() => { setDismissedWelcome(true); localStorage.setItem('tupad_welcomed', '1'); }}
            />
            <DetailsModal
                open={modalOpen}
                drafts={drafts}
                onChange={onDraftChange}
                onSave={saveDetails}
                onClose={closeModal}
            />

            <Toast status={uploadStatus} onClose={dismissToast} />

            <div id="output" className={show4thCopy ? '' : 'hide-4th-copy'} onDragOver={e => e.preventDefault()} onDrop={onDrop}>
                {!beneficiaries.length ? (
                    <div className="empty-state">
                        <h2>Please upload beneficiary data to generate DTRs.</h2>
                        <p>Click <strong>Upload</strong> in the toolbar above, or drag &amp; drop a file here.</p>
                    </div>
                ) : (
                    <>
                        {visiblePages.map(p => (
                            <div className="page" key={p.key}>
                                <DTRCard data={p.dtrData} weekendInfo={p.weekendInfo} isSample={false} />
                                <DTRCard data={p.dtrData} weekendInfo={p.weekendInfo} isSample={false} />
                                <DTRCard data={p.dtrData} weekendInfo={p.weekendInfo} isSample={false} />
                                <DTRCard data={p.dtrData} weekendInfo={p.weekendInfo} isSample={true} />
                            </div>
                        ))}
                    </>
                )}
            </div>
        </React.Fragment>
    );
}