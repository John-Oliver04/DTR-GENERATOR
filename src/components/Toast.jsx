import React from 'react';
import Icon from './icons';

export default function Toast({ status, onClose }) {
    if (!status || !status.text) return null;

    return (
        <div className={'toast' + (status.error ? ' error' : '')} role="status">
            <span className="toast-msg">{status.text}</span>
            <button className="toast-close" onClick={onClose} aria-label="Dismiss"><Icon name="close" /></button>
        </div>
    );
}