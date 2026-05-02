import { useEffect, useState, useRef } from 'react';

// L7: Dismiss button, L8: Type announcement for screen readers
export default function Toast({ toast }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (toast) {
      setVisible(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 3500);
    } else {
      setVisible(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast?.id]);

  if (!toast) return null;

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const typeLabels = { success: 'Success', error: 'Error', info: 'Info', warning: 'Warning' };
  const type = toast.type || 'success';

  return (
    <div className="toast-wrap" role="status" aria-live="polite" aria-atomic="true">
      <div className={`toast ${type} ${visible ? 'show' : ''}`}>
        <span className="toast-icon" aria-hidden="true">{icons[type]}</span>
        {/* L8: Announce type to screen readers */}
        <span className="sr-only">{typeLabels[type]}:</span>
        <span className="toast-msg">{toast.msg}</span>
        {/* L7: Manual dismiss */}
        <button className="toast-dismiss" onClick={() => setVisible(false)} aria-label="Dismiss notification"
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 4px', fontSize: 14, opacity: 0.6, marginLeft: 8 }}>✕</button>
      </div>
    </div>
  );
}
