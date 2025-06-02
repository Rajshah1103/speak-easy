// app/api/mux/upload-status/route.ts
import { NextRequest } from "next/server";
import Mux from "@mux/mux-node";

const { Video } = new Mux(
  process.env.MUX_TOKEN_ID!,
  process.env.MUX_TOKEN_SECRET!
);

export async function GET(req: NextRequest) {
  const uploadId = req.nextUrl.searchParams.get('uploadId');

  if (!uploadId) {
    return new Response(
      JSON.stringify({ error: "uploadId parameter is required" }),
      { status: 400 }
    );
  }

  try {
    // 1. Get the upload status from Mux
    const upload = await Video.Uploads.get(uploadId);

    // 2. If upload has an asset_id, get the playback ID
    if (upload.asset_id) {
      const asset = await Video.Assets.get(upload.asset_id);
      
      if (asset.playback_ids?.length > 0) {
        return new Response(
          JSON.stringify({
            status: 'ready',
            playbackId: asset?.playback_ids[0].id
          }),
          { status: 200 }
        );
      }
    }

    // 3. Return current status if not ready
    return new Response(
      JSON.stringify({
        status: upload.status || 'processing',
        message: 'Upload is still being processed'
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Upload status check failed:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to check upload status" 
      }),
      { status: 500 }
    );
  }
}