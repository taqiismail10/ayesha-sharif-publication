import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PDF_MAX_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_FILE_BYTES = PDF_MAX_BYTES;

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Uint8Array;
};

const FILE_TYPES = {
  "image/jpeg": { extensions: ["jpg", "jpeg"], extension: "jpg", folder: "images", maxBytes: IMAGE_MAX_BYTES },
  "image/png": { extensions: ["png"], extension: "png", folder: "images", maxBytes: IMAGE_MAX_BYTES },
  "image/webp": { extensions: ["webp"], extension: "webp", folder: "images", maxBytes: IMAGE_MAX_BYTES },
  "application/pdf": { extensions: ["pdf"], extension: "pdf", folder: "samples", maxBytes: PDF_MAX_BYTES },
} as const;

type FileMime = keyof typeof FILE_TYPES;

export const uploadLimits = { imageBytes: IMAGE_MAX_BYTES, pdfBytes: PDF_MAX_BYTES, multipartBytes: MAX_MULTIPART_FILE_BYTES } as const;

export function isManagedUploadKey(key: string): boolean {
  return /^books\/(images|samples)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|pdf)$/i.test(key);
}

function fileExtension(fileName: string): string {
  const extension = fileName.trim().toLowerCase().split(".").pop() ?? "";
  return /^[a-z0-9]{1,8}$/.test(extension) ? extension : "";
}

function hasExpectedSignature(mime: FileMime, bytes: Uint8Array): boolean {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (mime === "image/webp") return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

@Injectable()
export class UploadsService {
  private storage: R2Bucket | null = null;

  bind(storage: R2Bucket): void {
    if (!this.storage) this.storage = storage;
  }

  async upload(type: unknown, file: UploadedFile | undefined) {
    if (!file || !file.size) throw new BadRequestException("No file uploaded.");
    if (type !== "cover" && type !== "gallery" && type !== "sample") {
      throw new BadRequestException("Invalid upload type.");
    }

    const mime = file.mimetype as FileMime;
    const specification = FILE_TYPES[mime];
    if (!specification || (mime === "application/pdf" && type !== "sample")) {
      throw new BadRequestException("Only JPG, PNG, WebP, and sample PDF files are allowed.");
    }

    if (!specification.extensions.includes(fileExtension(file.originalname) as never)) {
      throw new BadRequestException("The file extension does not match the permitted file type.");
    }
    if (file.size > specification.maxBytes) throw new BadRequestException("File is too large.");
    if (!hasExpectedSignature(mime, file.buffer)) {
      throw new BadRequestException("The uploaded file does not match its declared type.");
    }

    const key = `books/${specification.folder}/${crypto.randomUUID()}.${specification.extension}`;
    const storage = this.requireStorage();
    await storage.put(key, file.buffer, {
      httpMetadata: {
        contentType: mime,
        contentDisposition: "inline",
      },
    });

    return { key, contentType: mime, size: file.size };
  }

  async get(key: string) {
    if (!isManagedUploadKey(key)) throw new NotFoundException("Upload not found.");
    return this.requireStorage().get(key);
  }

  private requireStorage(): R2Bucket {
    if (!this.storage) throw new ServiceUnavailableException("Upload storage is not configured.");
    return this.storage;
  }
}
