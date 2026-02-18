import { getStoredToken } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
const WORKER_URL = import.meta.env.VITE_THUMBNAIL_WORKER_URL;

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = getStoredToken();

  // Decide base URL
  const baseUrl =
    path === "/thumbnail/generate" ? WORKER_URL : BACKEND_URL;

  const url = `${baseUrl}${path}`;
  console.log("🌐 Full URL:", url);

  // Use a plain object instead of HeadersInit for safe typing
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("🔑 Token included");
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log("📡 Response status:", response.status);

    const data = await response.json().catch(() => null);
    console.log("📦 Response data:", data);

    if (!response.ok) {
      throw new Error(
        data?.message || `Request failed with status ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error("❌ API Fetch Error:", error);
    throw error;
  }
};
