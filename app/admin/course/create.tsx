import { Create, SimpleForm, TextInput, required, BooleanInput, useNotify } from "react-admin";
import { FileInput, FileField } from 'react-admin';
import { useState } from "react";

export const CourseCreate = () => {
  const notify = useNotify();
  const [isUploading, setIsUploading] = useState(false);

  const transformData = async (data: any) => {
    setIsUploading(true);
    
    try {
      // Handle video upload if present
      if (data.videoFile) {
        const file = data.videoFile.rawFile;
        
        // 1. Get upload URL from API
        const formData = new FormData();
        formData.append("videoUrl", file);
  
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
  
        if (!res.ok) {
          const error = await res.text();
          throw new Error(error || "Failed to get upload URL");
        }
  
        const { uploadUrl, uploadId } = await res.json();
        
        if (!uploadUrl || !uploadId) {
          throw new Error("Invalid response from upload API");
        }
  
        // 2. Upload directly to Mux
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { 
            'Content-Type': file.type,
            'Content-Length': file.size.toString() 
          },
        });
  
        if (!uploadRes.ok) {
          throw new Error(`Upload failed with status ${uploadRes.status}`);
        }
  
        // 3. Poll for asset creation (since we don't get futurePlaybackId)
        const playbackId = await pollForPlaybackId(uploadId);
        data.muxPlaybackId = playbackId;
      }
  
      // Transform data to match your schema
      const transformedData = {
        title: data.title,
        imageSrc: data.imageSrc,
        isQuiz: data.isQuiz !== undefined ? data.isQuiz : true,
        ...(data.muxPlaybackId && { muxPlaybackId: data.muxPlaybackId })
      };
  
      return transformedData;
  
    } catch (error) {
      console.error('Upload transformation error:', error);
      notify(typeof error === 'string' ? error : (error as Error).message, { 
        type: 'error',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Helper function to poll for asset creation
  const pollForPlaybackId = async (uploadId: string): Promise<string> => {
    const MAX_ATTEMPTS = 30; // 30 attempts (30 seconds total)
    const DELAY = 1000; // 1 second between attempts
    
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(`/api/mux/upload-status?uploadId=${uploadId}`);
        const data = await res.json();
        
        if (data.playbackId) {
          return data.playbackId;
        }
        
        if (data.error) {
          throw new Error(data.error);
        }
      } catch (error) {
        console.warn(`Attempt ${attempt + 1} failed:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, DELAY));
    }
    
    throw new Error("Timed out waiting for video processing");
  };
  return (
    <Create transform={transformData}>
      <SimpleForm>
        <TextInput 
          source="title" 
          validate={[required()]} 
          fullWidth 
        />
        <TextInput 
          source="imageSrc" 
          validate={[required()]} 
          fullWidth 
        />
        <BooleanInput 
          source="isQuiz" 
          label="Is this a quiz course?" 
          defaultValue={true} 
        />
        
        <FileInput 
          source="videoFile" 
          label="Course Video (optional)"
          accept="video/*"
          disabled={isUploading}
        >
          <FileField source="src" title="title" />
        </FileInput>
      </SimpleForm>
    </Create>
  );
};