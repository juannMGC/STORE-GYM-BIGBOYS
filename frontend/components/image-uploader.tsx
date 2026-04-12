"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { ApiError } from "@/lib/api-client";
import { uploadImageFile, type UploadFolder } from "@/lib/upload-image";

export interface ImageUploaderProps {
  folder: UploadFolder;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onError?: (msg: string) => void;
  size?: "sm" | "md" | "lg";
  shape?: "square" | "circle";
  placeholder?: string;
}

export function ImageUploader({
  folder,
  currentUrl,
  onUpload,
  onError,
  size = "md",
  shape = "square",
  placeholder = "Subir imagen",
}: ImageUploaderProps) {
  const reactId = useId();
  const inputId = `img-upload-${folder}-${reactId.replace(/:/g, "")}`;
  const objectUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    setPreview(currentUrl ?? null);
  }, [currentUrl]);

  const sizeMap = {
    sm: { width: 64, height: 64 },
    md: { width: 120, height: 120 },
    lg: { width: 200, height: 200 },
  };
  const { width, height } = sizeMap[size];

  const revokeBlob = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError?.("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.("La imagen debe pesar menos de 5MB");
      return;
    }

    revokeBlob();
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    setPreview(localUrl);

    try {
      setLoading(true);
      const cloudUrl = await uploadImageFile(file, folder);
      revokeBlob();
      setPreview(cloudUrl);
      onUpload(cloudUrl);
    } catch (err) {
      revokeBlob();
      setPreview(currentUrl ?? null);
      const msg =
        err instanceof ApiError
          ? err.message
          : "Error al subir la imagen. Intentá de nuevo.";
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "inline-block" }}>
      <label
        htmlFor={inputId}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: shape === "circle" ? "50%" : "4px",
          border: "2px dashed",
          borderColor:
            hover && !loading
              ? "#f7e047"
              : preview
                ? "#2a2a2a"
                : "#d91920",
          overflow: "hidden",
          cursor: loading ? "wait" : "pointer",
          position: "relative",
          background: "#1a1a1a",
          transition: "border-color 0.2s",
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              inset: 0,
            }}
            onError={() => setPreview(null)}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              preview && (hover || loading) ? "rgba(0,0,0,0.55)" : preview
                ? "rgba(0,0,0,0.35)"
                : "transparent",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: preview ? (hover || loading ? 1 : 0) : 1,
            transition: "opacity 0.2s",
            pointerEvents: "none",
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  border: "2px solid #f7e047",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "bbg-spin 0.8s linear infinite",
                }}
              />
              <span
                style={{
                  color: "#f7e047",
                  fontSize: "11px",
                  marginTop: "8px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "1px",
                }}
              >
                SUBIENDO...
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: "24px" }}>{preview ? "✏️" : "📷"}</span>
              <span
                style={{
                  color: "#e4e4e7",
                  fontSize: "11px",
                  marginTop: "6px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "1px",
                  textAlign: "center",
                  padding: "0 8px",
                }}
              >
                {preview ? "CAMBIAR" : placeholder.toUpperCase()}
              </span>
            </>
          )}
        </div>
      </label>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => void handleChange(e)}
        disabled={loading}
      />

      <style>{`
        @keyframes bbg-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
