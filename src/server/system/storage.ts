import fs from "node:fs";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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

interface R2ApiConfig {
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
  bucketName: string;
  publicUrl?: string;
}

function getR2Binding() {
  return getBinding<R2BucketBinding>("STORAGE");
}

function getR2ApiConfig(): R2ApiConfig | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accessKeyId || !secretAccessKey || !accountId || !bucketName) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    accountId,
    bucketName,
    publicUrl,
  };
}

export function resolveStorageMode(options?: {
  hasBinding?: boolean;
  hasRemoteApiConfig?: boolean;
}) {
  const hasBinding = options?.hasBinding ?? Boolean(getR2Binding());
  if (hasBinding) {
    return "binding" as const;
  }

  const hasRemoteApiConfig =
    options?.hasRemoteApiConfig ?? Boolean(getR2ApiConfig());
  if (hasRemoteApiConfig) {
    return "remote-api" as const;
  }

  return "local" as const;
}

function getS3Client(config: R2ApiConfig) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
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

  if (mode !== "local" && publicUrl) {
    return `${publicUrl.replace(/\/+$/, "")}/${filename}`;
  }

  if (mode === "local") {
    return `/uploads/${filename}`;
  }

  return `/api/media/${filename}`;
}

export async function putObject(input: PutStorageObjectInput): Promise<StoredMediaResult> {
  const binding = getR2Binding();
  const apiConfig = getR2ApiConfig();
  const storageMode = resolveStorageMode({
    hasBinding: Boolean(binding),
    hasRemoteApiConfig: Boolean(apiConfig),
  });

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
        publicUrl: apiConfig?.publicUrl,
      }),
    };
  }

  if (storageMode === "remote-api" && apiConfig) {
    const s3 = getS3Client(apiConfig);
    await s3.send(
      new PutObjectCommand({
        Bucket: apiConfig.bucketName,
        Key: input.filename,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    return {
      storageMode,
      filename: input.filename,
      publicUrl: getMediaPublicUrl(input.filename, {
        mode: storageMode,
        publicUrl: apiConfig.publicUrl,
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
  const apiConfig = getR2ApiConfig();
  const storageMode = resolveStorageMode({
    hasBinding: Boolean(binding),
    hasRemoteApiConfig: Boolean(apiConfig),
  });

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

  if (storageMode === "remote-api" && apiConfig) {
    const s3 = getS3Client(apiConfig);
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: apiConfig.bucketName,
        Key: filename,
      }),
    );

    if (!response.Body) {
      return null;
    }

    return {
      body: response.Body as BodyInit,
      contentType: response.ContentType || undefined,
      etag: response.ETag || undefined,
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
  const apiConfig = getR2ApiConfig();
  const storageMode = resolveStorageMode({
    hasBinding: Boolean(binding),
    hasRemoteApiConfig: Boolean(apiConfig),
  });

  if (storageMode === "binding" && binding) {
    await binding.delete(filename);
    return;
  }

  if (storageMode === "remote-api" && apiConfig) {
    const s3 = getS3Client(apiConfig);
    await s3.send(
      new DeleteObjectCommand({
        Bucket: apiConfig.bucketName,
        Key: filename,
      }),
    );
    return;
  }

  const filePath = path.join(getLocalUploadDir(), filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
