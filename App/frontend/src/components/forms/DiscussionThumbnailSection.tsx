import { DiscussionFormApi } from "@/types/discussionForm";
import { Plus } from "lucide-react";
import type { DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { getFieldErrorMessage } from "./getFieldErrorMessage";

// Props for this component
type DiscussionThumbnailSectionProps = {
  form: DiscussionFormApi;
  // validation error from a file dropped onto the composer card
  dropError: string | null;
  onDropErrorChange: (error: string | null) => void;
};

// params for this thumbnail component to follow
type ThumbnailFieldApi = {
  name: string;
  state: {
    value: File | null;
    meta: {
      errors?: unknown[];
    };
  };
  handleChange: (value: File | null) => void;
};

type ThumbnailFieldProps = {
  field: ThumbnailFieldApi;
  dropError: string | null;
  onDropErrorChange: (error: string | null) => void;
};

// 5mb
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
// accepted file types
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// function to validate the file type before it's sent
export const validateThumbnailFile = (file: File) => {
  // check if file type matches
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only .jpeg, .png, or .webp images are allowed.";
  }

  // check if the file size bigger than the allowed limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
};

// lets the whole composer card act as a drop target for the cover image
export function useThumbnailDrop(form: DiscussionFormApi) {
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  // counts nested dragenter/dragleave pairs so hovering children doesn't flicker
  const dragDepth = useRef(0);

  const hasFiles = (event: DragEvent) =>
    Array.from(event.dataTransfer.types).includes("Files");

  const dropHandlers = {
    onDragEnter: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    },
    onDragOver: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
    },
    onDragLeave: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragging(false);
    },
    onDrop: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (!file) return;

      const validationError = validateThumbnailFile(file);
      setDropError(validationError);
      if (!validationError) form.setFieldValue("thumbnail", file);
    },
  };

  return { isDragging, dropError, setDropError, dropHandlers };
}

// format the bytes for the upload
const formatBytes = (bytes: number) =>
  `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

function ThumbnailField({
  field,
  dropError,
  onDropErrorChange,
}: ThumbnailFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      onDropErrorChange(null);
      field.handleChange(null);
      return;
    }

    const validationError = validateThumbnailFile(file);
    onDropErrorChange(validationError);
    // set the file if everything else passes
    if (!validationError) field.handleChange(file);
  };

  useEffect(() => {
    // reset the preview feature if no photo is selected
    if (!field.state.value) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(field.state.value);
    setPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [field.state.value]);

  const openFileDialog = () => fileInputRef.current?.click();
  const fieldError = getFieldErrorMessage(field.state.meta.errors?.[0]);
  const combinedError = dropError ?? fieldError;

  const actionClasses =
    "rounded-md px-2.5 py-1 font-geist text-xs/4 font-medium text-[#E4E8F0] transition-colors hover:bg-white/10";

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          handleFileSelection(file);
          event.target.value = "";
        }}
      />

      {previewUrl ? (
        // filled state: cover banner with change/remove on top
        <div className="relative h-40 overflow-hidden rounded-[10px] sm:h-50">
          <img
            src={previewUrl}
            alt={`Cover preview: ${field.state.value?.name ?? ""}`}
            title={`${field.state.value?.name} · ${formatBytes(field.state.value?.size ?? 0)}`}
            className="size-full object-cover"
          />
          <div className="absolute top-2.5 right-2.5 flex gap-1 rounded-lg bg-[#0C0E12]/80 p-0.75 backdrop-blur-sm">
            <button type="button" className={actionClasses} onClick={openFileDialog}>
              Change
            </button>
            <button
              type="button"
              className={actionClasses}
              onClick={() => handleFileSelection(null)}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        // empty state: quiet "add cover" line above the title
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <button
            type="button"
            onClick={openFileDialog}
            className="group -ml-1.5 flex items-center gap-1.5 rounded-md py-1 pr-2 pl-1.5 transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#4DA3F0]"
          >
            <Plus className="size-3.5 text-[#7E8899] group-hover:text-[#C3CBD8]" strokeWidth={2} />
            <span className="font-geist text-[13px]/4.5 font-medium text-[#97A3B8] group-hover:text-[#E4E8F0]">
              Add cover
            </span>
          </button>
          <span className="hidden font-geist text-[13px]/4.5 text-[#4A5262] sm:inline">
            or drop an image anywhere on this card
          </span>
        </div>
      )}

      {combinedError ? (
        <span className="block font-geist text-sm text-red-400">{combinedError}</span>
      ) : null}
    </div>
  );
}

export default function DiscussionThumbnailSection({
  form,
  dropError,
  onDropErrorChange,
}: DiscussionThumbnailSectionProps) {
  return (
    <form.Field name="thumbnail">
      {(field: ThumbnailFieldApi) => (
        <ThumbnailField
          field={field}
          dropError={dropError}
          onDropErrorChange={onDropErrorChange}
        />
      )}
    </form.Field>
  );
}
