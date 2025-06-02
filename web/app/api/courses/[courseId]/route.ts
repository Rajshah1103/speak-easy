import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import Mux from "@mux/mux-node";

import db from "@/db/drizzle";
import { courses } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

// Initialize Mux
const { Video } = new Mux(
  process.env.MUX_TOKEN_ID!,
  process.env.MUX_TOKEN_SECRET!
);

export const GET = async (
  req: NextRequest,
  { params }: { params: { courseId: number } }
) => {
  try {
    const isPlaybackRequest = new URL(req.url).searchParams.has('playback');
    
    const data = await db.query.courses.findFirst({
      where: eq(courses.id, params.courseId),
    });

    if (!data) {
      return new NextResponse("Course not found", { status: 404 });
    }

    if (isPlaybackRequest) {
      if (!data.muxPlaybackId) {
        return new NextResponse("No video available", { status: 404 });
      }

      try {
        // CORRECTED: Search assets by playback ID
        const assets = await Video.Assets.list({
          playback_ids: [data.muxPlaybackId]
        });

        if (assets.length === 0) {
          return new NextResponse("Video asset not found", { status: 404 });
        }

        const asset = assets[0];
        
        if (asset.status !== 'ready') {
          return new NextResponse("Video processing", { status: 425 });
        }

        return NextResponse.json({
          playbackId: data.muxPlaybackId,
          status: 'ready',
          assetId: asset.id
        });

      } catch (error) {
        console.error("Mux API error:", error);
        return new NextResponse("Mux service error", { status: 502 });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[COURSE_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}; 

export const PUT = async (
  req: NextRequest,
  { params }: { params: { courseId: number } }
) => {
  const isAdmin = getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  try {
    const body = await req.json();
    const data = await db
      .update(courses)
      .set({
        ...body,
      })
      .where(eq(courses.id, params.courseId))
      .returning();

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("[COURSE_ID_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: { courseId: number } }
) => {
  const isAdmin = getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  try {
    // First get the course to check for Mux asset
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, params.courseId),
    });

    if (course?.muxPlaybackId) {
      try {
        // Delete the Mux asset when deleting the course
        await Video.Assets.del(course.muxPlaybackId);
      } catch (error) {
        console.error("Failed to delete Mux asset:", error);
        // Continue with course deletion even if Mux deletion fails
      }
    }

    const data = await db
      .delete(courses)
      .where(eq(courses.id, params.courseId))
      .returning();

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("[COURSE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};

// New endpoint for playback-specific requests
export const POST = async (
  req: NextRequest,
  { params }: { params: { courseId: number } }
) => {
  try {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, params.courseId),
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    if (!course.muxPlaybackId) {
      return new NextResponse("No video available for this course", { status: 404 });
    }

    // Verify the Mux asset
    try {
      const asset = await Video.Assets.get(course.muxPlaybackId);
      if (asset.status !== 'ready') {
        return new NextResponse("Video is still processing", { status: 425 });
      }
    } catch (error) {
      return new NextResponse("Video asset not found", { status: 404 });
    }

    return NextResponse.json({
      playbackId: course.muxPlaybackId,
      status: 'ready'
    });
  } catch (error) {
    console.error("[COURSE_PLAYBACK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};