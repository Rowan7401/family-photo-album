"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Photo = {
  id: number;
  imageUrl: string;
  title: string;
  caption: string;
  location: string;
  takenAt: string;
  uploaderName: string;
  createdAt: string;
};

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [flipBack, setFlipBack] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple form state for creating a new photo
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [uploaderName, setUploaderName] = useState("");

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch("/api/photos");
        if (!res.ok) {
          throw new Error("Failed to load photos");
        }
        const data = (await res.json()) as Photo[];
        setPhotos(data);
      } catch (e) {
        console.error(e);
        setError("Could not load photos yet.");
      }
    };

    fetchPhotos();
  }, []);

  const handleCardClick = (photo: Photo) => {
    if (selectedPhoto && selectedPhoto.id === photo.id) {
      // Within the modal: tap/click toggles flip
      setFlipBack((prev) => !prev);
    } else {
      // Opening a new photo resets flip state
      setSelectedPhoto(photo);
      setFlipBack(false);
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Please choose a photo file to upload.");
      return;
    }

    if (!title || !location || !takenAt || !uploaderName) {
      setError("Please fill in title, location, date, and your name.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1) Upload the image to Cloudinary via our API route
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(
          data?.error ||
            "Image upload failed. Check your Cloudinary configuration.",
        );
      }

      const uploadData = (await uploadRes.json()) as {
        imageUrl: string;
      };

      // 2) Save the photo metadata + image URL to our database
      const createRes = await fetch("/api/photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: uploadData.imageUrl,
          title,
          caption,
          location,
          takenAt,
          uploaderName,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(
          data?.error || "Failed to save photo metadata to the database.",
        );
      }

      const newPhoto = (await createRes.json()) as Photo;
      setPhotos((prev) => [newPhoto, ...prev]);

      // Clear form
      setFile(null);
      setTitle("");
      setCaption("");
      setLocation("");
      setTakenAt("");
      setUploaderName("");
      (event.target as HTMLFormElement).reset();
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong while uploading the photo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/60 text-zinc-900">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-amber-900 sm:text-4xl">
              Dillon Family Album
            </h1>
            <p className="mt-1 text-sm text-amber-900/70 sm:text-base">
              A cozy place for our favorite moments. Tap a photo to see its
              story.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowUpload(true);
              setError(null);
            }}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-amber-700 px-4 py-2 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-amber-800 sm:mt-0"
          >
            Upload a photo
          </button>
        </header>

        <section className="flex-1 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-amber-100 sm:p-6">
          <h2 className="text-base font-medium text-amber-900 sm:text-lg">
            Family photos
          </h2>
          <p className="mt-1 text-xs text-amber-900/70 sm:text-sm">
            Newest moments appear first. Tap any photo to flip it over and see
            where and when it was taken.
          </p>

          {photos.length === 0 ? (
            <p className="mt-6 text-xs text-amber-900/70 sm:text-sm">
              No photos yet. Add your first memory above!
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => handleCardClick(photo)}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-amber-100 shadow-sm ring-1 ring-amber-100 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Image
                    src={photo.imageUrl}
                    alt={photo.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-70" />
                  <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5 text-left">
                    <p className="line-clamp-1 text-xs font-medium text-amber-50">
                      {photo.title}
                    </p>
                    <p className="line-clamp-1 text-[10px] text-amber-100/90">
                      {new Date(photo.takenAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Upload form modal */}
      {showUpload && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm"
          onClick={() => setShowUpload(false)}
        >
          <div
            className="max-h-full w-full max-w-xl rounded-3xl bg-white/95 p-5 shadow-xl ring-1 ring-amber-200 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-medium text-amber-900 sm:text-lg">
                  Add a new memory
                </h2>
                <p className="mt-1 text-xs text-amber-900/70 sm:text-sm">
                  Choose a photo from your phone or laptop, then fill in the
                  details below. The actual upload goes to Cloudinary using the
                  environment variables you&apos;ll configure.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="text-xs font-medium text-amber-900/70 hover:text-amber-900 sm:text-sm"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleUpload}
              className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6"
            >
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-amber-900 sm:text-sm">
                  Photo file
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] ?? null)
                  }
                  className="mt-1 block w-full cursor-pointer rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-amber-900 sm:text-sm">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:text-sm"
                  placeholder="Grandma's 80th Birthday"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-amber-900 sm:text-sm">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:text-sm"
                  placeholder="Nana&apos;s backyard"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-amber-900 sm:text-sm">
                  Date of photo
                </label>
                <input
                  type="date"
                  value={takenAt}
                  onChange={(event) => setTakenAt(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-amber-900 sm:text-sm">
                  Your name
                </label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(event) => setUploaderName(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:text-sm"
                  placeholder="Uncle Rowan"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-amber-900 sm:text-sm">
                  Caption (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:text-sm"
                  placeholder="What made this moment special?"
                />
              </div>

              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <p className="text-[10px] text-amber-900/70 sm:text-xs">
                  Uploads are stored in your Cloudinary account using the API
                  keys you&apos;ll add to <code>.env</code>.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-amber-700 px-4 py-2 text-xs font-medium text-amber-50 shadow-sm transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-400 sm:text-sm"
                >
                  {isSubmitting ? "Saving..." : "Save memory"}
                </button>
              </div>
            </form>

            {error && (
              <p className="mt-3 text-xs font-medium text-red-600 sm:text-sm">
                {error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Focus modal with flip animation */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-full w-full max-w-md cursor-pointer rounded-3xl bg-transparent"
            onClick={(event) => {
              event.stopPropagation();
              setFlipBack((prev) => !prev);
            }}
          >
            <div className="relative h-[420px] w-full preserve-3d transition-transform duration-500 [transform-style:preserve-3d]">
              <div
                className={`absolute inset-0 rounded-3xl bg-black/5 shadow-xl ring-1 ring-black/10 backface-hidden [backface-visibility:hidden] ${
                  flipBack ? "rotate-y-180" : ""
                }`}
              >
                <Image
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.title}
                  fill
                  className="rounded-3xl object-cover"
                />
              </div>

              <div
                className={`absolute inset-0 flex flex-col justify-between rounded-3xl bg-amber-50/95 p-5 text-amber-950 shadow-xl ring-1 ring-amber-200 backface-hidden [backface-visibility:hidden] rotate-y-180 ${
                  flipBack ? "rotate-y-360" : ""
                }`}
              >
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-amber-700/80">
                    {new Date(
                      selectedPhoto.takenAt,
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <h3 className="text-xl font-semibold leading-snug">
                    {selectedPhoto.title}
                  </h3>
                  <p className="text-sm text-amber-900/80">
                    {selectedPhoto.caption || "No caption added yet."}
                  </p>
                </div>

                <div className="flex flex-col gap-1 text-sm text-amber-900/80">
                  <p>
                    <span className="font-medium">Location:</span>{" "}
                    {selectedPhoto.location}
                  </p>
                  <p>
                    <span className="font-medium">Uploaded by:</span>{" "}
                    {selectedPhoto.uploaderName}
                  </p>
                  <p className="text-[11px] text-amber-900/60">
                    Tap anywhere on the card to flip it. Tap outside to close.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
