"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Save } from "lucide-react";
import Navbar from "@/components/Navbar";
import UploadZone from "@/components/UploadZone";

import { useAuth } from "@clerk/nextjs";

export default function BrandSetupPage() {
    const router = useRouter();
    const { getToken } = useAuth();

    const [brandName, setBrandName] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogoUpload = (file: File) => {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleWatermarkUpload = (file: File) => {
        setWatermarkFile(file);
        setWatermarkPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!brandName.trim()) {
            setError("Brand name is required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const token = await getToken();
            // Store in localStorage for now (real app: upload to Vercel Blob + hit API)
            const brandData = {
                brandName: brandName.trim(),
                websiteUrl: websiteUrl.trim(),
                logoPreview,
                watermarkPreview,
            };
            localStorage.setItem("reelforge_brand", JSON.stringify(brandData));
            router.push("/script-picker");
        } catch (e) {
            setError("Failed to save. Please try again.");
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container">
            <Navbar currentStep={0} />
            <main className="max-w-2xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <p className="step-indicator mb-3">
                        <span>Step 1 of 5</span>
                        <span className="text-xs mx-1">·</span>
                        <span style={{ color: "#a78bfa" }}>Brand Setup</span>
                    </p>
                    <h1 className="section-title">Set up your brand</h1>
                    <p className="section-subtitle">
                        Your logo and watermark will appear in every reel you create.
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-8">
                    {/* Brand name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium" style={{ color: "#94a3b8" }}>
                            Brand Name <span style={{ color: "#7c3aed" }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder="e.g. WellCare, SkyHealth..."
                            className="input-field"
                            id="brand-name"
                        />
                    </div>

                    {/* Website URL */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium" style={{ color: "#94a3b8" }}>
                            Website URL <span className="text-xs" style={{ color: "#64748b" }}>(for QR code)</span>
                        </label>
                        <input
                            type="url"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="input-field"
                            id="website-url"
                        />
                    </div>

                    {/* Logo upload */}
                    <div className="glass-card rounded-2xl p-6">
                        <UploadZone
                            label="Brand Logo"
                            hint="PNG or SVG recommended · Will appear on final slide"
                            accept="image/*"
                            onUpload={handleLogoUpload}
                            preview={logoPreview}
                            onClear={() => { setLogoFile(null); setLogoPreview(null); }}
                        />
                    </div>

                    {/* Watermark upload */}
                    <div className="glass-card rounded-2xl p-6">
                        <UploadZone
                            label="Watermark Photo"
                            hint="JPG or PNG · Shows at 15-20% opacity behind the text slides"
                            accept="image/*"
                            onUpload={handleWatermarkUpload}
                            preview={watermarkPreview}
                            onClear={() => { setWatermarkFile(null); setWatermarkPreview(null); }}
                        />
                    </div>

                    {/* Tip */}
                    <div className="rounded-xl px-4 py-3 flex gap-3" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                        <span style={{ color: "#a78bfa" }}>💡</span>
                        <p className="text-sm" style={{ color: "#94a3b8" }}>
                            Use a close-up face photo for your watermark — it creates an emotional connection without distracting from the text.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSave}
                        disabled={saving || !brandName.trim()}
                        className="btn-primary w-full justify-center py-4 text-base"
                        style={{ opacity: saving || !brandName.trim() ? 0.6 : 1 }}
                    >
                        {saving ? "Saving..." : "Save & Continue"}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </main>
        </div>
    );
}
