"use client";
import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface UploadZoneProps {
    label: string;
    hint?: string;
    accept?: string;
    onUpload: (file: File) => void;
    preview?: string | null;
    onClear?: () => void;
}

export default function UploadZone({
    label,
    hint,
    accept = "image/*",
    onUpload,
    preview,
    onClear,
}: UploadZoneProps) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onUpload(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: "#94a3b8" }}>{label}</label>
            {preview ? (
                <div className="relative rounded-xl overflow-hidden" style={{ height: 160, background: "#1a1a2e", border: "1px solid rgba(45,45,74,0.6)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt={label} className="w-full h-full object-cover" />
                    <button
                        onClick={onClear}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{ background: "rgba(15,15,26,0.9)", border: "1px solid rgba(45,45,74,0.8)" }}
                    >
                        <X className="w-3.5 h-3.5 text-red-400" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className="w-full flex flex-col items-center justify-center gap-3 rounded-xl transition-all duration-200 cursor-pointer"
                    style={{
                        height: 160,
                        background: dragging ? "rgba(124,58,237,0.1)" : "rgba(26,26,46,0.4)",
                        border: `2px dashed ${dragging ? "rgba(124,58,237,0.6)" : "rgba(45,45,74,0.8)"}`,
                    }}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                        <Upload className="w-5 h-5" style={{ color: "#a78bfa" }} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium" style={{ color: "#a78bfa" }}>Click to upload</p>
                        {hint && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{hint}</p>}
                    </div>
                </button>
            )}
            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
        </div>
    );
}
