"use client";

import { useEffect, useRef, useState } from "react";
import { AVATAR_SWATCHES } from "@/lib/constants";
import type { AvatarTone } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePresence } from "@/lib/use-presence";

interface AvatarUploadFieldProps {
  name: string;
  initialTone: AvatarTone;
  initialAvatarUrl?: string | null;
  fileInputName: string;
  removeInputName?: string;
  toneInputName?: string;
  allowToneFallback?: boolean;
}

export function AvatarUploadField({
  name,
  initialTone,
  initialAvatarUrl = null,
  fileInputName,
  removeInputName,
  toneInputName,
  allowToneFallback = false,
}: AvatarUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedTone, setSelectedTone] = useState<AvatarTone>(initialTone);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [showToneFallback, setShowToneFallback] = useState(false);
  const showToneFallbackPanel = usePresence(showToneFallback, 220);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function optimizeImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      return file;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const maxSide = 512;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;

      if (!context) {
        bitmap.close();
        return file;
      }

      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.82);
      });

      if (!blob || blob.size >= file.size) {
        return file;
      }

      const baseName = file.name.replace(/\.[^.]+$/, "");
      return new File([blob], `${baseName || "avatar"}.jpg`, {
        type: "image/jpeg",
      });
    } catch {
      return file;
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const optimizedFile = await optimizeImageFile(file);

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(optimizedFile);
      fileInputRef.current.files = dataTransfer.files;
    }

    const nextObjectUrl = URL.createObjectURL(optimizedFile);
    setObjectUrl(nextObjectUrl);
    setPreviewUrl(nextObjectUrl);
    setRemoveAvatar(false);
    setShowToneFallback(false);
  }

  function handleRemove() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setPreviewUrl(null);
    setRemoveAvatar(true);
    setShowToneFallback(allowToneFallback);
  }

  function handleResetToDefault() {
    handleRemove();
    if (!allowToneFallback) {
      return;
    }
    setShowToneFallback(false);
    setSelectedTone(initialTone);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-line-solid bg-fill-alternative px-4 py-5 sm:px-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex justify-center sm:block">
            <div className="relative">
              <Avatar
                avatarUrl={previewUrl}
                name={name}
                size="xl"
                tone={selectedTone}
              />
              <button
                className="absolute -right-1 -bottom-1 inline-flex h-8 items-center justify-center rounded-full border border-line-solid bg-bg-elevated px-3 type-caption text-label-strong shadow-xs"
                onClick={openFilePicker}
                type="button"
              >
                변경
              </button>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <p className="type-body text-label-alternative">
              2MB 이하 이미지만 올릴 수 있습니다.
            </p>

            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {previewUrl ? (
                <>
                  <Button onClick={openFilePicker} size="md" type="button" variant="secondary">
                    사진 바꾸기
                  </Button>
                  <Button onClick={handleResetToDefault} size="md" type="button" variant="ghost">
                    기본 프로필 사진으로 변경
                  </Button>
                </>
              ) : allowToneFallback ? (
                <Button
                  onClick={() => setShowToneFallback(true)}
                  size="md"
                  type="button"
                  variant="ghost"
                >
                  기본 아바타로 시작
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        name={fileInputName}
        onChange={handleFileChange}
        type="file"
      />
      {removeInputName ? (
        <input name={removeInputName} type="hidden" value={removeAvatar ? "true" : "false"} />
      ) : null}
      {toneInputName ? (
        <input name={toneInputName} type="hidden" value={selectedTone} />
      ) : null}

      {allowToneFallback && !previewUrl && showToneFallbackPanel ? (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            showToneFallback ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div
              className={cn(
                "space-y-3 rounded-[20px] border border-line-solid bg-bg-elevated px-4 py-4 transition-[transform,opacity] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                showToneFallback ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
              )}
            >
              <div className="space-y-1 text-center sm:text-left">
                <p className="type-label text-label-strong">기본 아바타</p>
                <p className="type-caption text-label-assistive">
                  사진 없이 시작할 때만 적용됩니다.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                {AVATAR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.value}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full border transition-[border-color,transform,box-shadow] duration-200",
                      selectedTone === swatch.value
                        ? "border-label-strong bg-bg-normal shadow-xs"
                        : "border-line-solid bg-bg-normal",
                    )}
                    onClick={() => setSelectedTone(swatch.value)}
                    type="button"
                  >
                    <Avatar name={name} size="sm" tone={swatch.value} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
