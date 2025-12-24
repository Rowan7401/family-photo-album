import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const photos = await prisma.photo.findMany({
    orderBy: [
      { takenAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(photos);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      imageUrl,
      title,
      caption,
      location,
      takenAt,
      uploaderName,
    } = body ?? {};

    if (!imageUrl || !title || !location || !takenAt || !uploaderName) {
      return NextResponse.json(
        {
          error:
            "Missing required fields. Expected imageUrl, title, location, takenAt, uploaderName.",
        },
        { status: 400 },
      );
    }

    const photo = await prisma.photo.create({
      data: {
        imageUrl,
        title,
        caption: caption ?? "",
        location,
        takenAt: new Date(takenAt),
        uploaderName,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Create photo error", error);
    return NextResponse.json(
      { error: "Failed to create photo" },
      { status: 500 },
    );
  }
}


