"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "reelforge_token";
const USER_KEY = "reelforge_user";

export interface AuthUser { id: string; email: string; display_name?: string | null; }

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}

export function setAuth(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function authHeaders(): Record<string, string> {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Redirect to /login if not signed in. Returns false until the check passes. */
export function useRequireAuth(): boolean {
    const router = useRouter();
    const [ok, setOk] = useState(false);
    useEffect(() => {
        if (!getToken()) router.replace("/login");
        else setOk(true);
    }, [router]);
    return ok;
}
