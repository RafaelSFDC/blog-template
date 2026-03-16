export interface MenuItemView {
  id: number;
  label: string;
  href: string;
  kind: "internal" | "external";
  sortOrder: number;
}

export interface GlobalSiteData {
  blogName: string;
  accentColor: string;
  fontFamily: string;
  gaMeasurementId: string;
  plausibleDomain: string;
  blogLogo: string;
  twitterProfile: string;
  githubProfile: string;
  linkedinProfile: string;
  themeVariant: string;
  blogDescription: string;
  siteUrl: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  twitterHandle: string;
  robotsIndexingEnabled: boolean;
  socialLinks: Array<{ platform: string; url: string }>;
  primaryMenu: MenuItemView[];
  footerMenu: MenuItemView[];
}

export type RedirectFormValues = {
  id?: number;
  sourcePath: string;
  destinationPath: string;
  statusCode: 301 | 302;
};

export type StorageMode = "binding" | "remote-api" | "local";

export interface StoredMediaResult {
  storageMode: StorageMode;
  filename: string;
  publicUrl: string;
}

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
