import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";

const { Video } = new Mux(
  process.env.MUX_TOKEN_ID!,
  process.env.MUX_TOKEN_SECRET!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("videoUrl") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    } // <-- Missing closing brace was here

    // Create direct upload
    const upload = await Video.Uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
      },
      cors_origin: "*",
    });

    if (!upload || !upload.url) {
      throw new Error("Failed to create Mux upload URL");
    }

    // Return both upload URL and the FUTURE playback ID
    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
      futurePlaybackId: upload.asset_id // This will become the playback ID
    });

  } catch (error: any) {
    console.error("Mux upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}