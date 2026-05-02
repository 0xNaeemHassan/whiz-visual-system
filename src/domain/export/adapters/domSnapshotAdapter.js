export async function renderDomSnapshotToCanvas(element, { width, height, backgroundColor }) {
  const h2c = (await import('html2canvas')).default;
  const clone = element.cloneNode(true);
  clone.style.cssText = `position:absolute;left:-9999px;top:0;transform:none;width:${width}px;height:${height}px`;
  document.body.appendChild(clone);
  try {
    return await h2c(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      width,
      height,
      backgroundColor,
      logging: false,
    });
  } finally {
    if (document.body.contains(clone)) document.body.removeChild(clone);
  }
}
