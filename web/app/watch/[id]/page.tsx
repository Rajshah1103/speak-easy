"use client";

import { useParams } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { useEffect, useState } from "react";

const WatchPage = () => {
  const params = useParams();
  const id = params?.id;
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No course ID provided");
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${id}?playback=true`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch course: ${res.status}`);
        }

        const data = await res.json();
        
        if (!data?.playbackId) {
          throw new Error("No video available for this course");
        }

        console.log('playback id', data.playbackId);
        setPlaybackId(data.playbackId);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-lg">Loading video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <button
          onClick={() => window.location.href = '/courses'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start h-screen pt-10 bg-black">
      <div className="w-full max-w-4xl aspect-video">
        {playbackId && (
          <MuxPlayer
            playbackId={playbackId}
            streamType="on-demand"
            autoPlay
            muted={true}
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
};

export default WatchPage;