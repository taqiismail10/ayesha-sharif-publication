import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { privateNoStoreHeaders } from "@/lib/http-cache";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized." },
      { status: 401, headers: privateNoStoreHeaders }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const type = String(formData.get("type") || "cover");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: "No file uploaded." },
      { status: 400, headers: privateNoStoreHeaders }
    );
  }

  const isPdf = file.type === "application/pdf";
  const imageExt = imageTypes.get(file.type);
  const isSample = type === "sample";
  const valid = imageExt || (isSample && isPdf);
  if (!valid) {
    return NextResponse.json(
      { ok: false, message: "Only JPG, PNG, WebP, and sample PDF files are allowed." },
      { status: 400, headers: privateNoStoreHeaders }
    );
  }

  const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { ok: false, message: "File is too large." },
      { status: 400, headers: privateNoStoreHeaders }
    );
  }

  const ext = imageExt || "pdf";
  const fileName = `${type}-${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "books");
  await mkdir(uploadDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), bytes);

  return NextResponse.json(
    {
      ok: true,
      url: `/uploads/books/${fileName}`
    },
    { headers: privateNoStoreHeaders }
  );
}
