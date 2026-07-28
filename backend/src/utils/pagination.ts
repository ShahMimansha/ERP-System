export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

export interface PaginationResult<T> {
  status: string;
  results: number;
  data: {
    data: T[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
};

export type PaginatedResult<T> = PaginationResult<T>;

export const getPaginationParams = (query: PaginationQuery): PaginationParams => {
  const page = Math.max(parseInt(String(query.page || '1'), 10), 1);
  const limit = Math.min(Math.max(parseInt(String(query.limit || '10'), 10), 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  totalResults: number
): PaginationResult<T> => {
  const totalPages = Math.ceil(totalResults / limit);

  return {
    status: 'success',
    results: data.length,
    data: {
      data,
      page,
      limit,
      totalPages,
      totalResults,
    },
  };
};

export const formatPaginationResponse = createPaginatedResponse;
export const buildPaginationResult = createPaginatedResponse;

export const buildPaginatedResult = <T>(
  data: T[],
  totalResults: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  return createPaginatedResponse(data, page, limit, totalResults);
};
