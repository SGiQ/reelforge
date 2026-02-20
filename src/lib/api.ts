const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(
    path: string,
    options: RequestInit & { token?: string } = {}
): Promise<T> {
    const { token, ...rest } = options;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
    if (!res.ok) {
        const error = await res.text();
        throw new Error(`API error ${res.status}: ${error}`);
    }
    return res.json() as Promise<T>;
}

export interface Brand {
    id: string;
    name: string;
    logo_url: string | null;
    watermark_url: string | null;
    clerk_user_id: string;
    created_at: string;
}

export interface Script {
    id: string;
    title: string;
    slides: string[];
    is_default: boolean;
}

export interface RenderJob {
    id: string;
    brand_id: string;
    script_id: string;
    theme: string;
    status: "pending" | "processing" | "done" | "failed";
    output_url: string | null;
    created_at: string;
    completed_at: string | null;
}

// Brands
export const createBrand = (data: Partial<Brand>, token: string) =>
    apiFetch<Brand>("/brands", { method: "POST", body: JSON.stringify(data), token });

export const getBrand = (token: string) =>
    apiFetch<Brand>("/brands/me", { token });

export const updateBrand = (data: Partial<Brand>, token: string) =>
    apiFetch<Brand>("/brands/me", { method: "PATCH", body: JSON.stringify(data), token });

// Scripts
export const getDefaultScripts = () =>
    apiFetch<Script[]>("/scripts/defaults");

// Render
export const createRenderJob = (
    data: { brand_id: string; script_id: string; theme: string },
    token: string
) => apiFetch<RenderJob>("/render/create", { method: "POST", body: JSON.stringify(data), token });

export const getRenderJob = (jobId: string, token: string) =>
    apiFetch<RenderJob>(`/render/${jobId}/status`, { token });

// Health
export const healthCheck = () =>
    apiFetch<{ status: string }>("/health");
