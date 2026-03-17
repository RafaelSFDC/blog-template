import fs from "node:fs";
import path from "node:path";
import { slugify } from "#/schemas/system";
import { getBinding } from "#/server/system/cf-env";
import type { R2BucketBinding, StorageMode, StoredMediaResult } from "#/types/system";

interface StoredObject {
  body: BodyInit;
  contentType?: string;
  etag?: string;
}

interface PutStorageObjectInput {
  filename: string;
  body: Buffer;
  contentType?: string;
}

function getR2Binding() {
  return getBinding<R2BucketBinding>("STORAGE");
}

export function resolveStorageMode(options?: {
  hasBinding?: boolean;
}) {
  const hasBinding = options?.hasBinding ?? Boolean(getR2Binding());
  if (hasBinding) {
    return "binding" as const;
  }

  return "local" as const;
}

function getStoragePublicUrl() {
  const configured = process.env.R2_PUBLIC_URL?.trim();
  return configured && configured.length > 0 ? configured : undefined;
}

function getLocalUploadDir() {
  return path.resolve(process.cwd(), "public", "uploads");
}

function getFileExtension(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  return extension || "";
}

export function sanitizeMediaFilename(filename: string) {
  const extension = getFileExtension(filename);
  const nameWithoutExtension = extension
    ? filename.slice(0, -extension.length)
    : filename;
  const sanitizedBase = slugify(nameWithoutExtension) || "asset";
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return `${sanitizedBase}-${suffix}${extension}`;
}

export function getMediaPublicUrl(
  filename: string,
  options?: {
    mode?: StorageMode;
    publicUrl?: string;
  },
) {
  const mode = options?.mode ?? resolveStorageMode();
  const publicUrl = options?.publicUrl;

  if (mode === "binding" && publicUrl) {
    return `${publicUrl.replace(/\/+$/, "")}/${filename}`;
  }

  if (mode === "local") {
    return `/uploads/${filename}`;
  }

  return `/api/media/${filename}`;
}

export async function putObject(input: PutStorageObjectInput): Promise<StoredMediaResult> {
  const binding = getR2Binding();
  const publicUrl = getStoragePublicUrl();
  const storageMode = resolveStorageMode({ hasBinding: Boolean(binding) });

  if (storageMode === "binding" && binding) {
    await binding.put(input.filename, input.body, {
      httpMetadata: {
        contentType: input.contentType,
      },
    });

    return {
      storageMode,
      filename: input.filename,
      publicUrl: getMediaPublicUrl(input.filename, {
        mode: storageMode,
        publicUrl,
      }),
    };
  }

  const uploadDir = getLocalUploadDir();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  fs.writeFileSync(path.join(uploadDir, input.filename), input.body);
  return {
    storageMode: "local",
    filename: input.filename,
    publicUrl: getMediaPublicUrl(input.filename, { mode: "local" }),
  };
}

export async function getObject(filename: string): Promise<StoredObject | null> {
  const binding = getR2Binding();
  const storageMode = resolveStorageMode({ hasBinding: Boolean(binding) });

  if (storageMode === "binding" && binding) {
    const object = await binding.get(filename);
    if (!object?.body) {
      return null;
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);

    return {
      body: object.body,
      contentType: headers.get("content-type") || undefined,
      etag: object.httpEtag,
    };
  }

  const filePath = path.join(getLocalUploadDir(), filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return {
    body: fs.readFileSync(filePath),
  };
}

export async function deleteObject(filename: string) {
  const binding = getR2Binding();
  const storageMode = resolveStorageMode({ hasBinding: Boolean(binding) });

  if (storageMode === "binding" && binding) {
    await binding.delete(filename);
    return;
  }

  const filePath = path.join(getLocalUploadDir(), filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
