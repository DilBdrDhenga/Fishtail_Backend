// Async utilities
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const retryOperation = async (
  operation,
  maxRetries = 3,
  delayMs = 1000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await delay(delayMs * attempt);
    }
  }
};

// Environment helpers
export const isProduction = () => process.env.NODE_ENV === "production";
export const isDevelopment = () => process.env.NODE_ENV === "development";
export const isTest = () => process.env.NODE_ENV === "test";

// Export all helpers as default object for convenience
export default {
  // Async
  delay,
  retryOperation,

  // Environment
  isProduction,
  isDevelopment,
  isTest,
};
