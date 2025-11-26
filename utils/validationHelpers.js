export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidURL = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

export default {
  isValidEmail,
  isValidURL,
  isEmpty,
};
