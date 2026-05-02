export function applyContentTemplate({ template, defaultContent, resetContent, showToast }) {
  if (!template) return;
  resetContent({ ...defaultContent, ...(template.content || {}) });
  showToast?.(`Template: ${template.name}`);
}

export function initializeFrameTemplate({ frameId, defaultContent, setContent, getFrameTemplate }) {
  if (!frameId) return;
  const template = getFrameTemplate(frameId, defaultContent);
  setContent(template);
}
