import fs from "node:fs";
import path from "node:path";
import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getBinding } from "#/lib/cf-env";

export interface R2ObjectBody {
  body: BodyInit | null;
  httpEtag?: string;
  writeHttpMetadata(headers: Headers): void;
}

export interface R2BucketBinding {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: BodyInit | ArrayBuffer | Buffer | Blob | File,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

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

function getR2ApiConfig() {
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

function getS3Client(config: NonNullable<ReturnType<typeof getR2ApiConfig>>) {
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

export function resolvePublicUrl(filename: string) {
  const r2Config = getR2ApiConfig();
  if (r2Config?.publicUrl) {
    return `${r2Config.publicUrl}/${filename}`;
  }

  const storage = getR2Binding();
  if (storage || r2Config) {
    return `/api/media/${filename}`;
  }

  return `/uploads/${filename}`;
}

export async function putObject(input: PutStorageObjectInput) {
  const storage = getR2Binding();
  if (storage) {
    await storage.put(input.filename, input.body, {
      httpMetadata: {
        contentType: input.contentType,
      },
    });

    return { url: resolvePublicUrl(input.filename), filename: input.filename };
  }

  const r2Config = getR2ApiConfig();
  if (r2Config) {
    const s3 = getS3Client(r2Config);
    await s3.send(
      new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: input.filename,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    return { url: resolvePublicUrl(input.filename), filename: input.filename };
  }

  const uploadDir = getLocalUploadDir();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  fs.writeFileSync(path.join(uploadDir, input.filename), input.body);
  return { url: resolvePublicUrl(input.filename), filename: input.filename };
}

export async function getObject(filename: string): Promise<StoredObject | null> {
  const storage = getR2Binding();
  if (storage) {
    const object = await storage.get(filename);
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

  const r2Config = getR2ApiConfig();
  if (r2Config) {
    const s3 = getS3Client(r2Config);
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: r2Config.bucketName,
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
  const storage = getR2Binding();
  if (storage) {
    await storage.delete(filename);
    return;
  }

  const r2Config = getR2ApiConfig();
  if (r2Config) {
    const s3 = getS3Client(r2Config);
    await s3.send(
      new DeleteObjectCommand({
        Bucket: r2Config.bucketName,
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
