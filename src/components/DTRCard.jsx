import React from 'react';

// One DTR card (quarter of a page). isSample toggles sample copy (filled times + signature).
export default function DTRCard({ data, isSample, weekendInfo }) {
    const { name, tupadId, address, period, pesoManager, pesoDesignation,
            verifier, verifierTitle, office, workDays } = data;
    const { saturdays, sundays, showSat, showSun } = weekendInfo;

    const rows = [];
    for (let d = 1; d <= 31; d++) {
        const isSat = saturdays.has(d);
        const isSun = sundays.has(d);

        if (isSat && !showSat) {
            rows.push(
                <tr className="weekend-row saturday-row" key={d}>
                    <td>{d}</td>
                    <td colSpan={4} style={{ fontSize: '7pt', fontWeight: 'bold', color: '#000000', letterSpacing: '1px' }}>SATURDAY</td>
                </tr>
            );
            continue;
        }
        if (isSun && !showSun) {
            rows.push(
                <tr className="weekend-row sunday-row" key={d}>
                    <td>{d}</td>
                    <td colSpan={4} style={{ fontSize: '7pt', fontWeight: 'bold', color: '#000000', letterSpacing: '1px' }}>SUNDAY</td>
                </tr>
            );
            continue;
        }

        const filled = isSample && workDays.has(d);
        const rowCls = isSat ? 'saturday-row' : (isSun ? 'sunday-row' : '');
        rows.push(
            <tr className={rowCls} key={d}>
                <td>{d}</td>
                <td className="time-cell">{filled ? '8:00' : ''}</td>
                <td className="time-cell">{filled ? '12:00' : ''}</td>
                <td className="time-cell">{filled ? '1:00' : ''}</td>
                <td className="time-cell">{filled ? '5:00' : ''}</td>
            </tr>
        );
    }

    return (
        <div className={'dtr' + (isSample ? ' sample' : '')}>
            <div className="dtr-top">
                <div className="annex">ANNEX J-1</div>
                <div className="title">DAILY TIME RECORD</div>
                <div className="field"><span className="label">Name:</span><span className="value bold-field">{name}</span></div>
                <div className="field"><span className="label">Address:</span><span className="value bold-field">{address}</span></div>
                <div className="field"><span className="label">TUPAD ID No.:</span><span className="value bold-field">{tupadId}</span></div>
                <div className="field"><span className="label">Month:</span><span className="value bold-field">{period}</span></div>
                <table className="dtr-table">
                    <thead>
                        <tr>
                            <th className="date-col" rowSpan={2}>Date</th>
                            <th className="time-col" colSpan={2}>A.M.</th>
                            <th className="time-col" colSpan={2}>P.M.</th>
                        </tr>
                        <tr>
                            <th>Time In</th><th>Time Out</th><th>Time In</th><th>Time Out</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
            </div>
            <div className="cert">I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from work.</div>
            <div className="sig-block">
                <div className="sig-line"></div>
                <div className="sig-role">TUPAD Beneficiary</div>
            </div>
            <div className="verified">Verified by:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2pt', marginTop: '20pt' }}>
                <div className="verifier" style={{ flex: 1 }}>
                    <div className="verifier-name">{pesoManager}</div>
                    <div className="sig-role"><u>{pesoDesignation || 'PESO Manager'}</u> , LGU/Brgy Official<br />or Designated Rep.,(if Direct Admin)NGO/PO<br />Officers or Designated Rep. if thru Co-partner</div>
                </div>
                <div className="verifier" style={{ flex: 1 }}>
                    <div className="verifier-name">{verifier}</div>
                    <div className="sig-role">{verifierTitle}<br />{office}</div>
                </div>
            </div>
        </div>
    );
}