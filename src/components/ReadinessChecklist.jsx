import React from 'react';

function statusBadge({ passed, blocking }) {
  if (passed) return { label: 'Pass', bg: 'rgba(39,174,96,0.15)', border: 'rgba(39,174,96,0.45)', color: '#8EF0B0' };
  if (blocking) return { label: 'Fail · Blocking', bg: 'rgba(235,87,87,0.14)', border: 'rgba(235,87,87,0.45)', color: '#FFB3B3' };
  return { label: 'Fail · Warning', bg: 'rgba(229,178,58,0.13)', border: 'rgba(229,178,58,0.45)', color: '#F9DB8F' };
}

export default function ReadinessChecklist({ groups, onJumpToFix }) {
  const total = groups.reduce((sum, group) => sum + group.checks.length, 0);
  const failed = groups.flatMap((group) => group.checks).filter((check) => !check.passed).length;
  const blocking = groups.flatMap((group) => group.checks).filter((check) => !check.passed && check.blocking).length;

  return (
    <div className="editor-section">
      <div className="editor-section-title">Readiness Checklist</div>
      <div style={{ fontSize: 11, color: blocking ? '#FFB3B3' : 'var(--dim)', marginBottom: 10 }}>
        {failed === 0 ? `Ready to publish (${total}/${total} checks passed).` : `${total - failed}/${total} checks passed · ${blocking} blocking`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {groups.map((group) => (
          <div key={group.id} style={{ border: '1px solid var(--glass-border)', borderRadius: 8, padding: 8 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{group.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {group.checks.map((check) => {
                const badge = statusBadge(check);
                return (
                  <div key={check.id} style={{ border: `1px solid ${badge.border}`, background: badge.bg, borderRadius: 6, padding: '6px 8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <div style={{ fontSize: 11 }}>{check.label}</div>
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-m)', color: badge.color }}>{badge.label}</span>
                    </div>
                    {!check.passed && (
                      <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <div style={{ fontSize: 10, opacity: 0.85 }}>{check.details}</div>
                        {check.action && <button className="btn btn-ghost btn-sm" onClick={() => onJumpToFix(check.action)}>{check.actionLabel || 'Fix'}</button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
