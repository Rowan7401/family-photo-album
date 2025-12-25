  import { NextResponse } from "next/server";
  import { v2 as cloudinary } from "cloudinary";

  // Cloudinary is configured from environment variables.
  // Set these in your .env file:
  // - CLOUDINARY_CLOUD_NAME
  // - CLOUDINARY_API_KEY
  // - CLOUDINARY_API_SECRET
  // - (optional) CLOUDINARY_UPLOAD_PRESET

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  export const runtime = "nodejs";

  export async function POST(request: Request) {
    try {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 },
        );
      }

      // Validate Cloudinary credentials
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

      // If using unsigned upload preset, we only need cloud_name
      // Otherwise, we need all credentials for signed uploads
      if (!cloudName) {
        return NextResponse.json(
          {
            error:
              "CLOUDINARY_CLOUD_NAME is required. Please add it to your .env file.",
          },
          { status: 500 },
        );
      }

      if (!uploadPreset && (!apiKey || !apiSecret)) {
        console.error("[upload] Missing Cloudinary credentials for signed upload:", {
          hasCloudName: !!cloudName,
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          hasUploadPreset: !!uploadPreset,
        });
        return NextResponse.json(
          {
            error:
              "Either set CLOUDINARY_UPLOAD_PRESET (for unsigned uploads) OR set both CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET (for signed uploads).",
          },
          { status: 500 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadOptions: {
        folder: string;
        upload_preset?: string;
      } = {
        folder: "family-photo-album",
      };

      // If using unsigned upload preset, include it (this bypasses signature requirements)
      if (uploadPreset) {
        uploadOptions.upload_preset = uploadPreset;
        console.log("[upload] Using unsigned upload preset:", uploadPreset);
      } else {
        console.log("[upload] Using signed upload (requires valid API_SECRET)");
      }

      const result = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            uploadOptions,
            (error, uploadResult) => {
              if (error || !uploadResult) {
                return reject(error || new Error("Upload failed"));
              }

              resolve({
                secure_url: uploadResult.secure_url,
                public_id: uploadResult.public_id,
              });
            },
          )
          .end(buffer);
      });

      return NextResponse.json({
        imageUrl: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error: any) {
      console.error("Cloudinary upload error", error);
      
      // Provide more helpful error messages
      if (error?.http_code === 401) {
        return NextResponse.json(
          {
            error:
              "Cloudinary authentication failed. Please check your CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your .env file. Make sure they match your Cloudinary dashboard.",
          },
          { status: 401 },
        );
      }
      
      if (error?.http_code === 400) {
        return NextResponse.json(
          {
            error:
              error.message || "Cloudinary upload failed. Check your upload preset or folder settings.",
          },
          { status: 400 },
        );
      }
      
      return NextResponse.json(
        {
          error: error?.message || "Failed to upload image. Check server logs for details.",
        },
        { status: 500 },
      );
    }
  }


