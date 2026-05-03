import { useRef } from 'react';
import { useDialogFocus } from '../utils/focusTrap';

export default function ConfirmDialog({ open, title, message, details = [], confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, allowSkip = false, skipLabel = "Don't ask again this session", skipChecked = false, onSkipChange, onConfirm, onCancel }) {
  const confirmBtnRef = useRef(null);
  const dialogRef = useRef(null);
  useDialogFocus({ isOpen: open, containerRef: dialogRef, initialFocusRef: confirmBtnRef });

  if (!open) return null;

  return (
    <div className="modal-overlay open" role="presentation" onClick={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc" onKeyDown={(e)=>{if(e.key==='Escape')onCancel?.();}}>
        <div className="modal-header">
          <span id="confirm-title" className="modal-title">{title}</span>
        </div>
        <div id="confirm-desc" style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div>{message}</div>
          {details.length > 0 && <ul style={{ marginTop: 8, paddingLeft: 18 }}>{details.map((line, idx) => <li key={`${line}-${idx}`}>{line}</li>)}</ul>}
        </div>
        {allowSkip && <label style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 12 }}><input type="checkbox" checked={skipChecked} onChange={(e)=>onSkipChange?.(e.target.checked)} />{skipLabel}</label>}
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>{cancelLabel}</button>
          <button ref={confirmBtnRef} className={`btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
