import React from 'react';
import Icon from './icons';

export default function MenuBar({
    onDownloadTemplate,
    onOpenModal,
    onPrint,
    onSavePDF,
    show4thCopy,
    onToggle4thCopy,
    onUploadClick,
    onFileSelected,
    onDrop,
    loading,
}) {
    const fileRef = React.useRef(null);

    return (
        <div className="menu-bar no-print">
            <input
                ref={fileRef}
                type="file"
                id="fileInput"
                accept=".xlsx,.xls,.csv"
                onChange={e => onFileSelected(e)}
            />
            <button className="btn-template" onClick={onDownloadTemplate}>
                <Icon name="template" />
                 Template</button>
            <button className="btn-details" onClick={onOpenModal}><Icon name="details" /> Show Details</button>
            <button className="btn-print" onClick={onPrint}><Icon name="print" /> Print</button>
            <button className="btn-pdf" onClick={onSavePDF} title="Download all DTRs as a PDF file"><Icon name="pdf" /> Save PDF</button>
            <button
                className={'btn-toggle4' + (show4thCopy ? '' : ' hidden-mode')}
                onClick={onToggle4thCopy}
            >
                <Icon name="eye" /> {show4thCopy ? 'Hide 4th Copy' : 'Show 4th Copy'}
            </button>
            <span className="spacer"></span>
            <button
                className="btn-upload"
                title="Click to browse, or drag & drop an Excel file here"
                onClick={() => {
                    if (typeof onUploadClick === 'function') onUploadClick(fileRef.current);
                    else if (fileRef.current) fileRef.current.click();
                }}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof onDrop === 'function') onDrop(e);
                }}
            >
                {loading ? <><Icon name="upload" /> Reading...</> : <><Icon name="upload" /> Upload Excel</>}
            </button>
        </div>
    );
}