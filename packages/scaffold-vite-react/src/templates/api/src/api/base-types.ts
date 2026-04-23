export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ApiError {
  code: number;
  message: string;
}
