"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GalleryCard } from "@/components/gallery-card";

export default function GalleryGroupManager({ group }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleGalleries, setVisibleGalleries] = useState(group.galleries);

  function handleEditToggle() {
    if (isSubmitting) {
      return;
    }

    setErrorMessage("");
    setSelectedGallery(null);
    setIsEditing((current) => !current);
  }

  function handleDeleteIntent(gallery) {
    if (isSubmitting) {
      return;
    }

    setErrorMessage("");
    setSelectedGallery(gallery);
  }

  function closeDialog() {
    if (isSubmitting) {
      return;
    }

    setSelectedGallery(null);
  }

  async function confirmDelete() {
    if (!selectedGallery || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/galleries/${selectedGallery.slug}/delete`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Unable to move this set to trash.");
      }

      const remainingCount = visibleGalleries.length - 1;

      setVisibleGalleries((current) =>
        current.filter((gallery) => gallery.slug !== selectedGallery.slug),
      );
      setSelectedGallery(null);

      if (remainingCount <= 0) {
        router.push("/");
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const pending = isSubmitting;

  return (
    <>
      <div className="gallery-manager-toolbar">
        <p className="gallery-manager-note">
          {isEditing
            ? "Editing mode is on. Deleting a set moves its folder to macOS Trash."
            : "Use Edit mode when you want to remove a set from this library."}
        </p>
        <button
          className={`toolbar-button${isEditing ? " toolbar-button-active" : ""}`}
          disabled={pending}
          onClick={handleEditToggle}
          type="button"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {errorMessage ? (
        <p className="gallery-manager-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <section className="gallery-grid" aria-label={`${group.title} galleries`}>
        {visibleGalleries.map((gallery) => (
          <GalleryCard
            gallery={gallery}
            interactive={!isEditing}
            key={gallery.slug}
            overlayAction={
              isEditing ? (
                <button
                  aria-label={`Move ${gallery.title} to macOS Trash`}
                  className="danger-chip"
                  disabled={pending}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleDeleteIntent(gallery);
                  }}
                  type="button"
                >
                  Delete
                </button>
              ) : null
            }
          />
        ))}
      </section>

      {selectedGallery ? (
        <div
          aria-modal="true"
          className="dialog-backdrop"
          role="dialog"
        >
          <div className="dialog-panel">
            <p className="eyebrow">Move To macOS Trash</p>
            <h2>{selectedGallery.title}</h2>
            <p className="dialog-description">
              This set will disappear from the web library and its source folder
              will be moved to macOS Trash.
            </p>
            <div className="dialog-actions">
              <button
                className="secondary-button"
                disabled={pending}
                onClick={closeDialog}
                type="button"
              >
                Cancel
              </button>
              <button
                className="danger-button"
                disabled={pending}
                onClick={confirmDelete}
                type="button"
              >
                {isSubmitting ? "Moving..." : "Move to macOS Trash"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
