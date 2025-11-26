export const calculatePagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / pageSize);

  return {
    current: currentPage,
    pages: totalPages,
    total,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
  };
};

export default {
  calculatePagination,
};
