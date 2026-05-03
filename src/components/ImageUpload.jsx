import { useRef, useState } from 'react';
import { computeDecodeSafeDimensions, validateImageFileBeforeDecode } from '../utils/imagePayloadGuards';
import { createManagedObjectURL, revokeManagedObjectURL } from '../utils/objectUrlManager';

// A1-A14: Complete image upload with position, resize, opacity, rotation, fit controls
export default function ImageUpload({ label, value, onChange, maxSize = 2, showToast }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const fileValidation = validateImageFileBeforeDecode(file);
    if (!fileValidation.valid) {
      showToast?.(fileValidation.reason, 'error');
      return;
    }
    createImageBitmap(file).then((bitmap) => {
      const MAX = 1200;
      const decodeSafe = computeDecodeSafeDimensions({ width: bitmap.width, height: bitmap.height });
      const resizeScale = Math.min(1, MAX / Math.max(decodeSafe.width, decodeSafe.height));
      const w = Math.max(1, Math.round(decodeSafe.width * resizeScale));
      const h = Math.max(1, Math.round(decodeSafe.height * resizeScale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      const exportFormat = 'image/webp';
      canvas.toBlob((blob) => {
        if (!blob) {
          showToast?.('Failed to process image.', 'error');
          return;
        }
        if (blob.size > 8 * 1024 * 1024) {
          showToast?.('Processed image still exceeds memory cap (8MB).', 'error');
          return;
        }
        if (value?.objectUrl) revokeManagedObjectURL(value.objectUrl);
        const objectUrl = createManagedObjectURL(blob);
        const kb = Math.round(blob.size / 1024);
        if (decodeSafe.scaled || kb > 400) showToast?.(`Image optimized to ~${kb}KB`, 'info');
        onChange({ objectUrl, name: file.name, x: 50, y: 50, width: 100, opacity: 1, rotation: 0, fit: 'contain', zIndex: 10, visible: true });
      }, exportFormat, 0.85);
    }).catch(() => showToast?.('Image decode failed.', 'error'));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const update = (key, val) => {
    if (value) onChange({ ...value, [key]: val });
  };


  const handleRovingKeyDown = (event, values, activeValue, onSelect, dataAttr) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(activeValue);
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = values.indexOf(activeValue);
    const offset = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
    const nextIndex = (currentIndex + offset + values.length) % values.length;
    const next = values[nextIndex];
    onSelect(next);
    requestAnimationFrame(() => {
      document.querySelector(`[${dataAttr}="${next}"]`)?.focus();
    });
  };

  return (
    <div className="image-upload-wrap">
      <div
        className="image-upload-label"
        onClick={() => (value?.objectUrl || value?.dataUrl) && setExpanded(e => !e)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (value?.objectUrl || value?.dataUrl) && setExpanded(v => !v)}
        role={(value?.objectUrl || value?.dataUrl) ? 'button' : undefined}
        tabIndex={(value?.objectUrl || value?.dataUrl) ? 0 : undefined}
        style={{ cursor: (value?.objectUrl || value?.dataUrl) ? 'pointer' : 'default' }}
      >
        {label}
        {(value?.objectUrl || value?.dataUrl) && <span style={{ marginLeft: 'auto', fontSize: 8, color: 'var(--dim)' }}>{expanded ? '▼' : '▶'} controls</span>}
      </div>
      {(value?.objectUrl || value?.dataUrl) ? (
        <>
          <div className="image-upload-preview">
            <img src={value.objectUrl || value.dataUrl} alt={value.name || 'Uploaded'} />
            <div className="image-upload-overlay">
              <span className="image-upload-name">{value.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(e => !e)} style={{ color: '#fff', fontSize: 10 }}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { if (value?.objectUrl) revokeManagedObjectURL(value.objectUrl); onChange(null); }} aria-label="Remove image">Remove</button>
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
                <div className="ww-grid" style={{ flex: 1 }} role="radiogroup" aria-label="Image fit mode">
                  {['contain', 'cover', 'fill'].map(f => (
                    <button key={f} data-fit-option={f} className={`ww-btn ${(value.fit || 'contain') === f ? 'on' : ''}`} onClick={() => update('fit', f)} onKeyDown={(event) => handleRovingKeyDown(event, ['contain', 'cover', 'fill'], value.fit || 'contain', (next) => update('fit', next), 'data-fit-option')} role="radio" aria-checked={(value.fit || 'contain') === f} tabIndex={(value.fit || 'contain') === f ? 0 : -1} style={{ fontSize: 9, padding: '3px 6px' }}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="img-ctrl-row">
                <span className="prop-label-text" style={{ width: 60 }}>Z-Index</span>
                <div className="ww-grid" style={{ flex: 1 }} role="radiogroup" aria-label="Image layer depth">
                  {[{ l: 'Back', v: 2 }, { l: 'Mid', v: 5 }, { l: 'Front', v: 15 }].map(z => (
                    <button key={z.v} data-z-option={z.v} className={`ww-btn ${(value.zIndex || 10) === z.v ? 'on' : ''}`} onClick={() => update('zIndex', z.v)} onKeyDown={(event) => handleRovingKeyDown(event, [2, 5, 15], value.zIndex || 10, (next) => update('zIndex', next), 'data-z-option')} role="radio" aria-checked={(value.zIndex || 10) === z.v} tabIndex={(value.zIndex || 10) === z.v ? 0 : -1} style={{ fontSize: 9, padding: '3px 6px' }}>{z.l}</button>
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
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
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
