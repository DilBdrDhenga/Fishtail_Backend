export const formatSuccessResponse = (
  data = null,
  message = "",
  pagination = null
) => {
  const response = { success: true };
  if (data !== null) response.data = data;
  if (message) response.message = message;
  if (pagination) response.pagination = pagination;
  return response;
};

export const formatErrorResponse = (message, code = null, details = null) => {
  const response = {
    success: false,
    message,
  };
  if (code) response.code = code;
  if (details) response.details = details;
  return response;
};

export default {
  formatSuccessResponse,
  formatErrorResponse,
};
