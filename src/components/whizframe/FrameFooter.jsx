import { FOOTER_FIELD_ORDER, resolveFooterData } from '../../domain/frameSchema';

export function FrameFooter({ content, ov, accentColor, resolvedContent, ec, sel }) {
  const footerData = resolveFooterData(content);
  const issuePath = `WHIZ.DEFI/${resolvedContent.issueNum}`;

  return (
    <div className={`wf-footer ${ec('footer')}`}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '12px', color: '#090D10',
          background: `linear-gradient(135deg, ${ov.avatarColor || accentColor}, ${ov.avatarColor || accentColor}CC)`,
          boxShadow: `0 2px 8px ${accentColor}40`,
        }}>W</div>
        <div>
          <div style={{ color: ov.handleColor || '#F4F5F7', fontSize: '10px', fontWeight: 600 }}>{footerData.source}</div>
          <div style={{ color: '#4A5568', fontSize: '10px', marginTop: '1px' }}>{issuePath}</div>
        </div>
      </div>
      <div style={{ flex: 1, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.07em', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {FOOTER_FIELD_ORDER.map((key) => `${key.toUpperCase()}: ${footerData[key]}`).join(' ▸ ')} ▸ VERIFIED ✓
      </div>
      <div style={{ color: '#4A5568', textAlign: 'right', fontSize: '8.5px', lineHeight: 1.6 }}>
        {content.socialX || '@X'}<br />{content.socialSub || '@SUBSTACK'}
      </div>
    </div>
  );
}
