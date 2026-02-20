import { put } from "@vercel/blob";

export async function uploadToBlob(file: File, folder: string): Promise<string> {
    const filename = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const blob = await put(filename, file, { access: "public" });
    return blob.url;
}
