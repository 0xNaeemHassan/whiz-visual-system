import { FOOTER_FIELD_ORDER, resolveFooterData } from '../../domain/frameSchema';

export function FrameFooter({ content, ov, accentColor, resolvedContent, ec, sel }) {
  const footerData = resolveFooterData(content);
  const issuePath = `WHIZ.DEFI/${resolvedContent.issueNum}`;

  return (
    <div className={`wf-footer wf-footer-shell ${ec('footer')}`}
      style={{
        width: '100%', height: '72px', flexShrink: 0,
        background: ov.footerBg || 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center',
        padding: '0 26px', gap: '16px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
        borderTop: `1px solid ${accentColor}08`, marginTop: 'auto',
      }}
      onClick={(e) => sel('footer', e)}>
      <div className="wf-footer-brand">
        <div className="wf-footer-avatar" style={{
          width: '28px', height: '28px', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '12px', color: '#090D10',
          background: `linear-gradient(135deg, ${ov.avatarColor || accentColor}, ${ov.avatarColor || accentColor}CC)`,
          boxShadow: `0 2px 8px ${accentColor}40`,
        }}>W</div>
        <div>
          <div className="wf-footer-handle" style={{ color: ov.handleColor || '#F4F5F7' }}>{footerData.source}</div>
          <div className="wf-footer-issue-path">{issuePath}</div>
        </div>
      </div>
      <div className="wf-footer-field-strip">
        {FOOTER_FIELD_ORDER.map((key) => `${key.toUpperCase()}: ${footerData[key]}`).join(' ▸ ')} ▸ VERIFIED ✓
      </div>
      <div className="wf-footer-social">
        {content.socialX || '@X'}<br />{content.socialSub || '@SUBSTACK'}
      </div>
    </div>
  );
}
