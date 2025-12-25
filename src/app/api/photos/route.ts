import { NextResponse } from "next/server";
import { dbSimple } from "@/lib/db-simple";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterPeople = searchParams.get("people");
  
  // Parse filter people if provided
  const peopleFilter = filterPeople ? filterPeople.split(",") : undefined;
  
  const photos = await dbSimple.getPhotos(peopleFilter);
  
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
      people,
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

    if (!people || !Array.isArray(people) || people.length === 0) {
      return NextResponse.json(
        {
          error: "At least one person must be tagged in the photo.",
        },
        { status: 400 },
      );
    }

    console.log("[POST /api/photos] Creating photo with data:", {
      imageUrl: imageUrl?.substring(0, 50) + "...",
      title,
      location,
      takenAt,
      uploaderName,
      peopleCount: people?.length,
    });

    const photo = await dbSimple.createPhoto({  // ← Added 'await' here!
      imageUrl,
      title,
      caption: caption ?? "",
      location,
      takenAt,
      uploaderName,
      people,
    });

    console.log("[POST /api/photos] Photo created successfully:", photo.id);
    return NextResponse.json(photo, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/photos] Create photo error:", error);
    
    // Extract error information safely
    const errorObj = error as { message?: string; code?: string; meta?: unknown; stack?: string };
    console.error("[POST /api/photos] Error details:", {
      message: errorObj?.message,
      code: errorObj?.code,
      meta: errorObj?.meta,
      stack: errorObj?.stack,
    });
    
    // Return more detailed error information
    const errorMessage = errorObj?.message || "Failed to create photo";
    const errorCode = errorObj?.code || "UNKNOWN_ERROR";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === "development" ? errorObj?.meta : undefined,
      },
      { status: 500 },
    );
  }
}