// import {
//   Edit,
//   NumberInput,
//   SimpleForm,
//   TextInput,
//   required,
// } from "react-admin";

// export const CourseEdit = () => {
//   return (
//     <Edit>
//       <SimpleForm>
//         <NumberInput source="id" validate={[required()]} label="Id" />
//         <TextInput source="title" validate={[required()]} label="Title" />
//         <TextInput source="imageSrc" validate={[required()]} label="Image" />
//       </SimpleForm>
//     </Edit>
//   );
// };


import {
  Edit,
  NumberInput,
  SimpleForm,
  TextInput,
  required,
} from "react-admin";
import { useState } from "react";

export const CourseEdit = () => {
  const [video, setVideo] = useState<File | null>(null);

  const handleVideoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("videoUrl", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data.playbackId;
  };

  const handleSubmit = async (values: any) => {
    if (video) {
      const playbackId = await handleVideoUpload(video);
      values.muxPlaybackId = playbackId;
    }
    return values;
  };

  return (
    <Edit>
      <SimpleForm onSubmit={handleSubmit}>
        <NumberInput source="id" validate={[required()]} label="Id" />
        <TextInput source="title" validate={[required()]} label="Title" />
        <TextInput source="imageSrc" validate={[required()]} label="Image" />
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setVideo(file);
            }
          }}
        />
      </SimpleForm>
    </Edit>
  );
};

