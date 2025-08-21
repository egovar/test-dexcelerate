import { GetScannerResultParams, ScannerApiResponse } from "@/types/scanner";

const API_BASE_URL = "https://api-rs.dexcelerate.com";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        response.statusText,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors, CORS issues, etc.
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function getScannerResults(
  params: GetScannerResultParams,
): Promise<ScannerApiResponse> {
  // Build query string from params
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v.toString()));
      } else {
        searchParams.set(key, value.toString());
      }
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/scanner${queryString ? `?${queryString}` : ""}`;

  return apiRequest<ScannerApiResponse>(endpoint);
}
