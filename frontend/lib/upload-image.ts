import { getAccessToken } from "@auth0/nextjs-auth0";
import { ApiError } from "./api-client";

const SESSION_EXPIRED = "SESSION_EXPIRED";

function resolveApiUrl(path: string): string {
  const apiPath = path.startsWith("/api")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;
  if (typeof window !== "undefined") {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (base) {
      return `${base}${apiPath}`;
    }
  }
  return apiPath;
}

async function getBearerToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token || typeof token !== "string") {
    throw new Error(SESSION_EXPIRED);
  }
  return token;
}

async function errorMessageFromResponse(res: Response): Promise<string> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    return text || res.statusText;
  }
  if (typeof data === "object" && data !== null && "message" in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m)) return m.map(String).join(", ");
    if (typeof m === "string") return m;
  }
  return res.statusText;
}

export type UploadFolder = "avatars" | "products" | "categories" | "trainings";

/** Subir archivo desde input type="file" → URL en Cloudinary. */
export async function uploadImageFile(
  file: File,
  folder: UploadFolder,
): Promise<string> {
  const token = await getBearerToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const uploadUrl = resolveApiUrl("/upload/image");
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    credentials: uploadUrl.startsWith("http") ? "omit" : "same-origin",
  });

  if (!res.ok) {
    const msg = await errorMessageFromResponse(res);
    throw new ApiError(res.status, msg);
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) {
    throw new ApiError(res.status, "Respuesta inválida del servidor");
  }
  return data.url;
}

/** Subir data URL (FileReader) → URL en Cloudinary. */
export async function uploadBase64Image(
  base64: string,
  folder: UploadFolder,
): Promise<string> {
  const token = await getBearerToken();
  const uploadUrl = resolveApiUrl("/upload/base64");
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ base64, folder }),
    credentials: uploadUrl.startsWith("http") ? "omit" : "same-origin",
  });

  if (!res.ok) {
    const msg = await errorMessageFromResponse(res);
    throw new ApiError(res.status, msg);
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) {
    throw new ApiError(res.status, "Respuesta inválida del servidor");
  }
  return data.url;
}
