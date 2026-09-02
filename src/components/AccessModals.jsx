import React, { useState } from 'react';
import Icon from './icons';

export default function AccessModals({ locked, onUnlock, dismissedWelcome, onDismissWelcome }) {
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');
    const [unlocked, setUnlocked] = useState(false);

    function handleUnlock(e) {
        e.preventDefault();
        const pass = (import.meta.env.VITE_DTR_PASSWORD || '').trim();
        if (pw === pass) {
            setError('');
            setUnlocked(true);
            if (typeof onUnlock === 'function') onUnlock();
        } else {
            setError('Incorrect password.');
        }
    }

    // Password gate — rendered as its own full page while the app is locked
    if (locked && !unlocked) {
        return (
            <div className="pw-page">
                <div className="pw-card">
                    <div className="pw-icon"><Icon name="lock" /></div>
                    <h1 className="pw-title">Secured Access</h1>
                    <p className="pw-text">This application is password-protected. Enter the password to continue.</p>
                    <form className="pw-form" onSubmit={handleUnlock}>
                        <input
                            type="password"
                            className="pw-input"
                            placeholder="Enter password"
                            value={pw}
                            onChange={e => { setPw(e.target.value); setError(''); }}
                            autoFocus
                        />
                        {error && <p className="pw-error"><Icon name="alert" /> {error}</p>}
                        <button type="submit" className="btn-save pw-btn"><Icon name="unlock" /> Unlock</button>
                    </form>
                    <div className="modal-dev">Developer: J_Virola</div>
                </div>
            </div>
        );
    }

    // Welcome modal (shown after unlock, until dismissed)
    if (!dismissedWelcome && (locked ? unlocked : true)) {
        return (
            <div className="modal-overlay show">
                <div className="modal">
                    <div className="modal-header">
                        <span><Icon name="welcome" /> Welcome</span>
                    </div>
                    <div className="modal-body welcome-body">
                        <p><strong>Welcome to the DTR (Daily Time Record) Generator.</strong></p>
                        <p>Upload an Excel file of beneficiaries to generate their DTR sheets, which can be printed or saved as a PDF.</p>
                        <ul className="welcome-list">
                            <li><Icon name="upload" /> Upload beneficiary data (.xlsx / .csv)</li>
                            <li><Icon name="pdf" /> Export one combined PDF</li>
                            <li><Icon name="print" /> Print individual DTR pages</li>
                        </ul>
                    </div>
                    <div className="modal-footer">
                        <button className="btn-save" onClick={onDismissWelcome}><Icon name="check" /> Get Started</button>
                    </div>
                    <div className="modal-dev">Developer: J_Virola</div>
                </div>
            </div>
        );
    }

    return null;
}