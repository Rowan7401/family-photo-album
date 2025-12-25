import { NextResponse } from "next/server";

// Simple route to check if environment variables are set (without exposing values)
export async function GET() {
  const envCheck = {
    DATABASE_URL: {
      set: !!process.env.DATABASE_URL,
      format: process.env.DATABASE_URL?.startsWith("file:") ? "correct" : "incorrect (should start with 'file:')",
    },
    CLOUDINARY_CLOUD_NAME: {
      set: !!process.env.CLOUDINARY_CLOUD_NAME,
      length: process.env.CLOUDINARY_CLOUD_NAME?.length || 0,
    },
    CLOUDINARY_API_KEY: {
      set: !!process.env.CLOUDINARY_API_KEY,
      length: process.env.CLOUDINARY_API_KEY?.length || 0,
    },
    CLOUDINARY_API_SECRET: {
      set: !!process.env.CLOUDINARY_API_SECRET,
      length: process.env.CLOUDINARY_API_SECRET?.length || 0,
    },
    CLOUDINARY_UPLOAD_PRESET: {
      set: !!process.env.CLOUDINARY_UPLOAD_PRESET,
      optional: true,
    },
  };

  return NextResponse.json({
    message: "Environment variable check (values are hidden for security)",
    env: envCheck,
    allSet: Object.values(envCheck).every((v) => v.set || v.optional),
  });
}

