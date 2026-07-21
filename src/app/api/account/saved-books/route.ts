import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { hasUsableDatabaseUrl } from "@/lib/env";
import { privateNoStoreHeaders } from "@/lib/http-cache";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function databaseUnavailable() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Saved books need PostgreSQL. You can still browse the catalogue as a guest.",
    },
    { status: 503, headers: privateNoStoreHeaders },
  );
}

function loginRequired() {
  return NextResponse.json(
    { ok: false, message: "Sign in to save books." },
    { status: 401, headers: privateNoStoreHeaders },
  );
}

export async function GET() {
  if (!hasUsableDatabaseUrl()) return databaseUnavailable();

  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json(
      { ok: true, authenticated: false, savedBookIds: [] },
      { headers: privateNoStoreHeaders },
    );
  }

  const savedBookIds = await prisma.savedBook.findMany({
    where: { customerId: customer.id },
    select: { bookId: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    {
      ok: true,
      authenticated: true,
      savedBookIds: savedBookIds.map((row) => row.bookId),
    },
    { headers: privateNoStoreHeaders },
  );
}

export async function POST(request: Request) {
  if (!hasUsableDatabaseUrl()) return databaseUnavailable();

  const customer = await getCurrentCustomer();
  if (!customer) return loginRequired();

  const body = await request.json().catch(() => null);
  const bookId = typeof body?.bookId === "string" ? body.bookId.trim() : "";
  if (!bookId) {
    return NextResponse.json(
      { ok: false, message: "Choose a valid book." },
      { status: 400, headers: privateNoStoreHeaders },
    );
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true },
  });
  if (!book) {
    return NextResponse.json(
      { ok: false, message: "This book could not be found." },
      { status: 404, headers: privateNoStoreHeaders },
    );
  }

  await prisma.savedBook.upsert({
    where: {
      customerId_bookId: {
        customerId: customer.id,
        bookId,
      },
    },
    update: {},
    create: {
      customerId: customer.id,
      bookId,
    },
  });

  return NextResponse.json(
    { ok: true, saved: true, bookId },
    { headers: privateNoStoreHeaders },
  );
}

export async function DELETE(request: Request) {
  if (!hasUsableDatabaseUrl()) return databaseUnavailable();

  const customer = await getCurrentCustomer();
  if (!customer) return loginRequired();

  const body = await request.json().catch(() => null);
  const bookId = typeof body?.bookId === "string" ? body.bookId.trim() : "";
  if (!bookId) {
    return NextResponse.json(
      { ok: false, message: "Choose a valid book." },
      { status: 400, headers: privateNoStoreHeaders },
    );
  }

  await prisma.savedBook.deleteMany({
    where: {
      customerId: customer.id,
      bookId,
    },
  });

  return NextResponse.json(
    { ok: true, saved: false, bookId },
    { headers: privateNoStoreHeaders },
  );
}
