// File and data helpers
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

export const isImageFile = (filename) => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  const ext = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(ext);
};

export default {
  formatFileSize,
  getFileExtension,
  isImageFile,
};
