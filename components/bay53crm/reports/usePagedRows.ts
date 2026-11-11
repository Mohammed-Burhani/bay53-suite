"use client";

import { useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 50;

/** One page of a long report, plus the props for TablePagination. Goes back to page 1 whenever the rows change. */
export function usePagedRows<T>(rows: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [seenRows, setSeenRows] = useState(rows);
  if (seenRows !== rows) {
    setSeenRows(rows);
    setPage(1);
  }

  const paged = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

  return {
    paged,
    pagination: {
      totalItems: rows.length,
      pageSize,
      currentPage: page,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    },
  };
}
