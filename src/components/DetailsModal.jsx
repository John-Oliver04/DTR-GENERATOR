import React from 'react';
import Icon from './icons';

export default function DetailsModal({ open, drafts, onChange, onSave, onClose }) {
    if (!open) return null;

    return (
        <div
            className="modal-overlay show"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="modal">
                <div className="modal-header">
                    <span><Icon name="info" /> DTR Details</span>
                    <button className="close-modal" onClick={onClose}><Icon name="close" /></button>
                </div>
                <div className="modal-body">
                    <div className="form-row">
                        <label>Periods:</label>
                        <textarea
                            value={drafts.periods}
                            onChange={e => onChange('periods', e.target.value)}
                            placeholder={'One per line.\nWith work days:  April 24-30, 2026 | 24-30\nOpen (no days):  May 2026'}
                        />
                        <div className="hint">Work days after | are optional. Leave blank or omit | for an open DTR (all time entries blank).</div>
                    </div>
                    <div className="form-row">
                        <label>Verified By:</label>
                        <input
                            type="text"
                            value={drafts.verifier}
                            onChange={e => onChange('verifier', e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <label>Verifier Title:</label>
                        <input
                            type="text"
                            value={drafts.verifierTitle}
                            onChange={e => onChange('verifierTitle', e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <label>Office:</label>
                        <input
                            type="text"
                            value={drafts.office}
                            onChange={e => onChange('office', e.target.value)}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}><Icon name="cancel" /> Cancel</button>
                    <button className="btn-save" onClick={onSave}><Icon name="save" /> Save & Generate</button>
                </div>
                <div className="modal-dev">Developer: J_Virola</div>
            </div>
        </div>
    );
}