import { useRef, useState } from 'react';

// A1-A14: Complete image upload with position, resize, opacity, rotation, fit controls
export default function ImageUpload({ label, value, onChange, maxSize = 2, showToast }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    // Check raw file size (before compression)
    if (file.size > 20 * 1024 * 1024) { // 20MB hard limit before compression
      showToast?.('File too large. Max 20MB.', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast?.('Only image files are supported.', 'error');
      return;
    }
    // H-09: Compress to max 1200px using canvas before storing as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        // Use WebP if supported, fall back to JPEG
        const webpTest = canvas.toDataURL('image/webp');
        const format = webpTest.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(format, 0.85);
        const kb = Math.round(dataUrl.length * 0.75 / 1024);
        if (kb > 400) {
          showToast?.(`Image compressed to ~${kb}KB`, 'info');
        }
        onChange({
          dataUrl,
          name: file.name,
          x: 50, y: 50,
          width: 100,
          opacity: 1,
          rotation: 0,
          fit: 'contain',
          zIndex: 10,
          visible: true,
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const update = (key, val) => {
    if (value) onChange({ ...value, [key]: val });
  };

  return (
    <div className="image-upload-wrap">
      <div className="image-upload-label" onClick={() => value?.dataUrl && setExpanded(e => !e)} style={{ cursor: value?.dataUrl ? 'pointer' : 'default' }}>
        {label}
        {value?.dataUrl && <span style={{ marginLeft: 'auto', fontSize: 8, color: 'var(--dim)' }}>{expanded ? '▼' : '▶'} controls</span>}
      </div>
      {value?.dataUrl ? (
        <>
          <div className="image-upload-preview">
            <img src={value.dataUrl} alt={value.name || 'Uploaded'} />
            <div className="image-upload-overlay">
              <span className="image-upload-name">{value.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(e => !e)} style={{ color: '#fff', fontSize: 10 }}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => onChange(null)} aria-label="Remove image">Remove</button>
            </div>
          </div>
          {expanded && (
            <div className="img-controls" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px', background: 'var(--bg-3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
              <div className="img-ctrl-row">
                <span className="prop-label-text" style={{ width: 60 }}>X Position</span>
                <input type="range" min={0} max={100} value={value.x ?? 50} onChange={e => update('x', +e.target.value)} />
                <span className="size-val" style={{ width: 28 }}>{value.x ?? 50}%</span>
              </div>
              <div className="img-ctrl-row">
                <span className="prop-label-text" style={{ width: 60 }}>Y Position</span>
                <input type="range" min={0} max={100} value={value.y ?? 50} onChange={e => update('y', +e.target.value)} />
                <span className="size-val" style={{ width: 28 }}>{value.y ?? 50}%</span>
              </div>
              <div className="img-ctrl-row">
                <span className="prop-label-text" style={{ width: 60 }}>Size</span>
                <input type="range" min={10} max={200} value={value.width ?? 100} onChange={e => update('width', +e.target.value)} />
                <span className="size-val" style={{ width: 28 }}>{value.width ?? 100}%</span>
              </div>
              <div className="img-ctrl-row">
                <span className="prop-label-text" style={{ width: 60 }}>Opacity</span>
                <input type="range" min={0} max={100} value={Math.round((value.opacity ?? 1) * 100)} onChange={e => update('opacity', +e.target.value / 100)} />
                <span className="size-val" style={{ width: 28 }}>{Math.round((value.opacity ?? 1) * 100)}%</span>
              </div>
              <div className="img-ctrl-row">
                <span className="prop-label-text" style={{ width: 60 }}>Rotation</span>
                <input type="range" min={-180} max={180} value={value.rotation ?? 0} onChange={e => update('rotation', +e.target.value)} />
                <span className="size-val" style={{ width: 28 }}>{value.rotation ?? 0}°</span>
              </div>
              <div className="img-ctrl-row">
                <span className="prop-label-text" style={{ width: 60 }}>Fit</span>
                <div className="ww-grid" style={{ flex: 1 }}>
                  {['contain', 'cover', 'fill'].map(f => (
                    <button key={f} className={`ww-btn ${(value.fit || 'contain') === f ? 'on' : ''}`} onClick={() => update('fit', f)} style={{ fontSize: 9, padding: '3px 6px' }}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="img-ctrl-row">
                <span className="prop-label-text" style={{ width: 60 }}>Z-Index</span>
                <div className="ww-grid" style={{ flex: 1 }}>
                  {[{ l: 'Back', v: 2 }, { l: 'Mid', v: 5 }, { l: 'Front', v: 15 }].map(z => (
                    <button key={z.v} className={`ww-btn ${(value.zIndex || 10) === z.v ? 'on' : ''}`} onClick={() => update('zIndex', z.v)} style={{ fontSize: 9, padding: '3px 6px' }}>{z.l}</button>
                  ))}
                </div>
              </div>
              <div className="img-ctrl-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={value.visible !== false} onChange={e => update('visible', e.target.checked)} />
                  Visible on frame
                </label>
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          className={`image-upload-drop ${dragging ? 'dragging' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label={`Upload ${label}`}
          onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
        >
          <div className="image-upload-icon">↑</div>
          <div className="image-upload-text">Drop image here or click to browse</div>
          <div className="image-upload-hint">PNG, JPG, SVG — max {maxSize}MB</div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}
