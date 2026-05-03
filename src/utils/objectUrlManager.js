const activeObjectUrls = new Set();

export const createManagedObjectURL = (blob) => {
  const url = URL.createObjectURL(blob);
  activeObjectUrls.add(url);
  return url;
};

export const revokeManagedObjectURL = (url) => {
  if (!url) return;
  URL.revokeObjectURL(url);
  activeObjectUrls.delete(url);
};

export const revokeAllManagedObjectURLs = () => {
  activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  activeObjectUrls.clear();
};

export const withManagedDownload = (blob, filename) => {
  const url = createManagedObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  revokeManagedObjectURL(url);
};
