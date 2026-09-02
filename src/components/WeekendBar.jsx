import React from 'react';
import Icon from './icons';

export default function WeekendBar({
    globalSat,
    globalSun,
    onToggleSat,
    onToggleSun,
    periods,
    overrides,
    onTogglePeriod,
    infoText,
    pageCount,
    pager,
}) {
    return (
        <div className="weekend-bar no-print">
            <span className="wb-label"><Icon name="calendar" /> WEEKEND IN DTR:</span>

            <div className="wb-group">
                <label className="wb-toggle-wrap" title="Show Saturday rows">
                    <input type="checkbox" checked={globalSat} onChange={onToggleSat} />
                    <span>Saturday</span>
                </label>
                <label className="wb-toggle-wrap" title="Show Sunday rows">
                    <input type="checkbox" checked={globalSun} onChange={onToggleSun} />
                    <span>Sunday</span>
                </label>
            </div>

            <span className="wb-label" style={{ color: '#a8e0c0' }}>OVERRIDE PER PERIOD:</span>

            <div className="wb-period-list">
                {periods.map(p => {
                    const ov = overrides[p.period] || { showSat: globalSat, showSun: globalSun };
                    return (
                        <div className="wb-period-pill" key={p.period}>
                            <span className="pill-name">{p.period}</span>
                            <button
                                className={'pill-btn' + (ov.showSat ? ' on-sat' : '')}
                                onClick={() => onTogglePeriod(p.period, 'sat')}
                                title="Toggle Saturday for this period"
                            >SAT</button>
                            <button
                                className={'pill-btn' + (ov.showSun ? ' on-sun' : '')}
                                onClick={() => onTogglePeriod(p.period, 'sun')}
                                title="Toggle Sunday for this period"
                            >SUN</button>
                        </div>
                    );
                })}
            </div>

            <span className="wb-info">{infoText}</span>
            {pageCount && <span className="wb-page-badge">{pageCount}</span>}
            {pager && <div className="wb-pager">{pager}</div>}
        </div>
    );
}