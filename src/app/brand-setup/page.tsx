"use client";
import { useState, useEffect } from "react";
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

    // New Feature States
    const [watermarkOpacity, setWatermarkOpacity] = useState(18);
    const [logoPosition, setLogoPosition] = useState("bottom_center");
    const [logoSize, setLogoSize] = useState(120);
    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
    const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
    const [qrCodeText, setQrCodeText] = useState("");

    // Load saved brand data
    useEffect(() => {
        const saved = localStorage.getItem("reelforge_brand");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.brandName) setBrandName(parsed.brandName);
                if (parsed.websiteUrl) setWebsiteUrl(parsed.websiteUrl);
                if (parsed.logoPreview) setLogoPreview(parsed.logoPreview);
                if (parsed.watermarkPreview) setWatermarkPreview(parsed.watermarkPreview);
                if (parsed.watermarkOpacity !== undefined) setWatermarkOpacity(parsed.watermarkOpacity);
                if (parsed.logoPosition) setLogoPosition(parsed.logoPosition);
                if (parsed.logoSize !== undefined) setLogoSize(parsed.logoSize);
                if (parsed.qrCodePreview) setQrCodePreview(parsed.qrCodePreview);
                if (parsed.qrCodeText) setQrCodeText(parsed.qrCodeText);
            } catch (e) { }
        }
    }, []);

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

    const handleQrCodeUpload = (file: File) => {
        setQrCodeFile(file);
        setQrCodePreview(URL.createObjectURL(file));
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
            let finalLogoUrl = logoPreview;
            let finalWatermarkUrl = watermarkPreview;
            let finalQrCodeUrl = qrCodePreview;

            // Helper to upload a file to our Vercel Blob route
            const uploadFile = async (file: File) => {
                const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                    method: 'POST',
                    body: file,
                });
                if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
                const data = await res.json();
                return data.url;
            };

            // Only upload if it's a fresh file (prevents re-uploading if they just tweaked a setting)
            if (logoFile) finalLogoUrl = await uploadFile(logoFile);
            if (watermarkFile) finalWatermarkUrl = await uploadFile(watermarkFile);
            if (qrCodeFile) finalQrCodeUrl = await uploadFile(qrCodeFile);

            const brandData = {
                brandName: brandName.trim(),
                websiteUrl: websiteUrl.trim(),
                logoPreview: finalLogoUrl,
                watermarkPreview: finalWatermarkUrl,
                watermarkOpacity,
                logoPosition,
                logoSize,
                qrCodePreview: finalQrCodeUrl,
                qrCodeText: qrCodeText.trim(),
            };
            localStorage.setItem("reelforge_brand", JSON.stringify(brandData));
            // Clear prior session data so the new brand always gets a fresh script
            localStorage.removeItem("reelforge_script");
            localStorage.removeItem("reelforge_theme");
            localStorage.removeItem("reelforge_audio");
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
                    <div className="glass-card rounded-2xl p-6 space-y-4">
                        <UploadZone
                            label="Brand Logo"
                            hint="PNG or SVG recommended · Will appear on final slide"
                            accept="image/*"
                            onUpload={handleLogoUpload}
                            preview={logoPreview}
                            onClear={() => { setLogoFile(null); setLogoPreview(null); }}
                        />
                        {/* Logo Position */}
                        <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium" style={{ color: "#a78bfa" }}>
                                    Logo Position on Final Slide
                                </label>
                                <select
                                    value={logoPosition}
                                    onChange={(e) => setLogoPosition(e.target.value)}
                                    className="input-field w-full cursor-pointer"
                                >
                                    <option value="top_left">Top Left</option>
                                    <option value="top_right">Top Right</option>
                                    <option value="center">Center</option>
                                    <option value="bottom_left">Bottom Left</option>
                                    <option value="bottom_right">Bottom Right</option>
                                    <option value="bottom_center">Bottom Center</option>
                                </select>
                            </div>

                            {/* Logo Size */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span style={{ color: "#a78bfa" }}>Logo Size</span>
                                    <span style={{ color: "#94a3b8" }}>{logoSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="60"
                                    max="240"
                                    step="10"
                                    value={logoSize}
                                    onChange={(e) => setLogoSize(Number(e.target.value))}
                                    className="w-full accent-brand-purple"
                                    style={{ accentColor: "#7c3aed" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Watermark upload */}
                    <div className="glass-card rounded-2xl p-6 space-y-4">
                        <UploadZone
                            label="Watermark Photo"
                            hint="JPG or PNG · Shows in background behind text slides"
                            accept="image/*"
                            onUpload={handleWatermarkUpload}
                            preview={watermarkPreview}
                            onClear={() => { setWatermarkFile(null); setWatermarkPreview(null); }}
                        />
                        {/* Watermark Opacity Slider */}
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span style={{ color: "#a78bfa" }}>Watermark Opacity</span>
                                <span style={{ color: "#94a3b8" }}>{watermarkOpacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={watermarkOpacity}
                                onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                                className="w-full accent-brand-purple"
                                style={{ accentColor: "#7c3aed" }}
                            />
                            {/* Live CSS Preview */}
                            {watermarkPreview && (
                                <div className="mt-4 flex gap-4 items-center">
                                    <div
                                        className="rounded-lg overflow-hidden relative shadow-lg"
                                        style={{ width: "90px", height: "160px", backgroundColor: "#1a1a2e" }}
                                    >
                                        <img
                                            src={watermarkPreview}
                                            alt="Opacity Preview"
                                            className="absolute inset-0 w-full h-full object-cover"
                                            style={{ opacity: watermarkOpacity / 100 }}
                                        />
                                    </div>
                                    <div className="text-sm" style={{ color: "#64748b" }}>
                                        Previewing opacity over a dark theme base.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* QR Code Upload (Optional) */}
                    <div className="glass-card rounded-2xl p-6 space-y-4">
                        <UploadZone
                            label="Custom QR Code (Optional)"
                            hint="Upload an existing QR image or we will auto-generate one from your website URL"
                            accept="image/*"
                            onUpload={handleQrCodeUpload}
                            preview={qrCodePreview}
                            onClear={() => { setQrCodeFile(null); setQrCodePreview(null); }}
                        />
                        <div className="space-y-2 pt-2">
                            <label className="block text-sm font-medium" style={{ color: "#a78bfa" }}>
                                Text under QR Code (Optional)
                            </label>
                            <input
                                type="text"
                                value={qrCodeText}
                                onChange={(e) => setQrCodeText(e.target.value)}
                                placeholder="e.g. Scan to learn more"
                                className="input-field"
                            />
                        </div>
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
