import * as React from "react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { Upload, X, Image, Loader2, CheckCircle2 } from "lucide-react";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onClear?: () => void;
  label?: string;
  hint?: string;
  className?: string;
  folder?: string; // Cloudinary folder to upload into
  aspectRatio?: "square" | "video" | "wide" | "free";
}

const CLOUD_NAME = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'dxwhpacz7';
const UPLOAD_PRESET = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export function ImageUpload({
  value,
  onChange,
  onClear,
  label = "Upload Image",
  hint,
  className,
  folder = "ambassadors_assembly",
  aspectRatio = "free",
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const aspectStyles: Record<string, string> = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[3/1]",
    free: "min-h-[160px]",
  };

  const uploadToCloudinary = async (file: File) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error("Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (jpg, png, gif, webp).");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", folder);

      // Use XHR for progress tracking
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log("Cloudinary Upload Success:", response);
            resolve(response);
          } else {
            const error = JSON.parse(xhr.responseText);
            console.error("Cloudinary Upload Error:", error);
            reject(new Error(`Upload failed: ${error.error?.message || xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.send(formData);
      });

      onChange(result.secure_url);
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToCloudinary(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadToCloudinary(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    onClear?.();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden group",
          aspectStyles[aspectRatio],
          dragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
          uploading && "cursor-not-allowed opacity-80",
          value && "border-transparent"
        )}
      >

        {/* Existing image preview */}
        {value && !uploading && (
          <>
            <img
              src={value}
              alt="Uploaded image"
              className="w-full h-full object-cover rounded-2xl"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 rounded-2xl">
              <div className="flex items-center gap-2 text-white text-sm font-semibold">
                <Upload className="w-4 h-4" />
                Replace Image
              </div>
            </div>
            {/* Clear button */}
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-colors duration-200 z-10"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-sm font-semibold text-foreground">Uploading... {progress}%</div>
            <div className="w-36 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Empty state / drop zone */}
        {!value && !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
              dragging ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              {dragging ? <CheckCircle2 className="w-7 h-7" /> : <Image className="w-7 h-7" />}
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">
                {dragging ? "Drop to upload" : "Drag & drop or click to upload"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                JPG, PNG, GIF, WebP &bull; Max 10MB
              </div>
            </div>
          </div>
        )}
      </div>

      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}

export default ImageUpload;
