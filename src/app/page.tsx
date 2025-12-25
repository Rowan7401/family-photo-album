"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Import Irish-inspired fonts from Google Fonts
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Merriweather:wght@400;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

const FAMILY_NAMES = ["Shea", "Rowan", "Keelin", "Kathy", "Gavin"] as const;

type Photo = {
  id: number;
  imageUrl: string;
  title: string;
  caption: string;
  location: string;
  takenAt: string;
  uploaderName: string;
  people: string;
  createdAt: string;
};

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [flipBack, setFlipBack] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedFilters.length > 0) {
          params.append("people", selectedFilters.join(","));
        }
        const url = params.toString() ? `/api/photos?${params}` : "/api/photos";
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load photos");
        const data = await res.json();
        setPhotos(data);
      } catch (e) {
        console.error(e);
        setError("Could not load photos yet.");
      }
    };

    fetchPhotos();
  }, [selectedFilters]);

  const handleCardClick = (photo: Photo) => {
    if (selectedPhoto?.id === photo.id) {
      setFlipBack((prev) => !prev);
    } else {
      setSelectedPhoto(photo);
      setFlipBack(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setCaption("");
    setLocation("");
    setTakenAt("");
    setUploaderName("");
    setSelectedPeople([]);
    setError(null);
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!file || !title || !location || !takenAt || !uploaderName) {
      setError("Please fill in all required fields.");
      return;
    }

    if (selectedPeople.length === 0) {
      setError("Please tag at least one family member.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data?.error || "Image upload failed.");
      }

      const { imageUrl } = await uploadRes.json();

      // Save to database
      const createRes = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          title,
          caption,
          location,
          takenAt,
          uploaderName,
          people: selectedPeople,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data?.error || "Failed to save photo.");
      }

      const newPhoto = await createRes.json();
      setPhotos((prev) => [newPhoto, ...prev]);
      resetForm();
      setShowUpload(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPhotoRotation = (id: number) => {
    const rotations = [-2, -1.5, 1, 1.5, 2, -1, 0.5, -0.5];
    return rotations[id % rotations.length];
  };

  const parsePeople = (peopleJson: string) => {
    try {
      const people = JSON.parse(peopleJson);
      return Array.isArray(people) ? people.join(", ") : "Unknown";
    } catch {
      return "Unknown";
    }
  };

  const handleDownload = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Group photos by year and sort chronologically
  const photosByYear = photos.reduce((acc, photo) => {
    const year = new Date(photo.takenAt).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(photo);
    return acc;
  }, {} as Record<number, Photo[]>);

  // Sort years descending (newest first) and photos within each year chronologically
  const sortedYears = Object.keys(photosByYear)
    .map(Number)
    .sort((a, b) => b - a);

  sortedYears.forEach(year => {
    photosByYear[year].sort((a, b) => 
      new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
    );
  });

  return (
    <div className="min-h-screen bg-[#e8e2d5] text-slate-800">
      <main className="min-h-screen w-full px-4 py-8 sm:px-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-emerald-900 sm:text-5xl md:text-6xl" style={{ fontFamily: "'Cinzel', serif" }}>
              Dillon Family Album
            </h1>
            <p className="mt-2 text-base text-teal-700/90 sm:text-lg" style={{ fontFamily: "'Merriweather', serif" }}>
              A cozy scrapbook of our favorite moments. Tap a photo to see its story.
            </p>
          </div>
          <button
            onClick={() => {
              setShowUpload(true);
              resetForm();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-800 hover:shadow-xl"
          >
            + Add Photo
          </button>
        </header>

        {/* Filter bar */}
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
          <span className="text-sm font-semibold text-emerald-900">Filter by:</span>
          {FAMILY_NAMES.map((name) => (
            <label
              key={name}
              className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-teal-300 bg-white px-4 py-1.5 text-sm font-medium text-teal-900 transition hover:border-teal-400 hover:bg-teal-50"
            >
              <input
                type="checkbox"
                checked={selectedFilters.includes(name)}
                onChange={(e) => {
                  setSelectedFilters((prev) =>
                    e.target.checked ? [...prev, name] : prev.filter((n) => n !== name)
                  );
                }}
                className="h-4 w-4 cursor-pointer rounded border-teal-400 text-teal-600 focus:ring-teal-500"
              />
              <span>{name}</span>
            </label>
          ))}
          {selectedFilters.length > 0 && (
            <button
              onClick={() => setSelectedFilters([])}
              className="rounded-full border-2 border-teal-300 bg-white px-4 py-1.5 text-sm font-medium text-teal-900 transition hover:border-teal-400 hover:bg-teal-50"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-white/50 p-8">
            <p className="text-center text-lg text-teal-700/80">
              No photos yet. Add your first memory above! 📸
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedYears.map((year) => (
              <div key={year}>
                {/* Year Header */}
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="text-3xl font-bold text-slate-600" style={{ fontFamily: "'Cinzel', serif" }}>
                    {year}
                  </h2>
                  <div className="flex-1 border-t-2 border-slate-300" />
                </div>

                {/* Photos for this year */}
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {photosByYear[year].map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => handleCardClick(photo)}
                      className="group relative cursor-pointer rounded-sm bg-white p-3 shadow-md transition hover:shadow-xl"
                      style={{ transform: `rotate(${getPhotoRotation(photo.id)}deg)` }}
                    >
                      {/* Tape */}
                      <div className="absolute -top-2 left-4 h-6 w-12 rotate-[-8deg] bg-gradient-to-b from-yellow-100/60 to-yellow-200/40 opacity-70" />
                      <div className="absolute -top-2 right-4 h-6 w-12 rotate-[8deg] bg-gradient-to-b from-yellow-100/60 to-yellow-200/40 opacity-70" />
                      
                      <div className="relative aspect-square overflow-hidden bg-slate-100">
                        <Image
                          src={photo.imageUrl}
                          alt={photo.title}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-110"
                        />
                      </div>
                      
                      <div className="mt-2 text-center">
                        <p className="line-clamp-1 text-xs font-semibold text-slate-800">
                          {photo.title}
                        </p>
                        <p className="mt-1 text-sm text-teal-700">
                          {new Date(photo.takenAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          onClick={() => setShowUpload(false)}
        >
          <div
            className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-2 ring-teal-300 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-emerald-900 sm:text-3xl" style={{ fontFamily: "'Cinzel', serif" }}>
                  Add a New Memory
                </h2>
                <p className="mt-2 text-sm text-teal-700 sm:text-base" style={{ fontFamily: "'Merriweather', serif" }}>
                  Choose a photo and fill in the details below.
                </p>
              </div>
              <button
                onClick={() => setShowUpload(false)}
                className="rounded-full p-2 text-teal-700 transition hover:bg-teal-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-emerald-900">Photo file</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full cursor-pointer rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm text-teal-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-900">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm text-teal-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                  placeholder="Summer at the Lake"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-900">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm text-teal-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                  placeholder="Portland, OR"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-900">Date of photo</label>
                <input
                  type="date"
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm text-teal-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-900">Your name</label>
                <select
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm text-teal-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                  required
                >
                  <option value="">Select your name...</option>
                  {FAMILY_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-emerald-900">
                  Who is in this photo? <span className="text-teal-700">(Select 1-5)</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FAMILY_NAMES.map((name) => (
                    <label
                      key={name}
                      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-sm transition hover:bg-teal-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPeople.includes(name)}
                        onChange={(e) => {
                          if (e.target.checked && selectedPeople.length < 5) {
                            setSelectedPeople((prev) => [...prev, name]);
                          } else if (!e.target.checked) {
                            setSelectedPeople((prev) => prev.filter((n) => n !== name));
                          }
                        }}
                        disabled={!selectedPeople.includes(name) && selectedPeople.length >= 5}
                        className="h-3 w-3 cursor-pointer rounded border-teal-300 text-teal-700 focus:ring-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="text-teal-900">{name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-emerald-900">Caption (optional)</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm text-teal-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                  placeholder="What made this moment special?"
                />
              </div>

              <div className="flex items-center justify-end gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {isSubmitting ? "Saving..." : "Save memory"}
                </button>
              </div>
            </form>

            {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
          </div>
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          onClick={() => {
            setSelectedPhoto(null);
            setIsFullscreen(false);
          }}
        >
          {/* Action buttons */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(selectedPhoto.imageUrl, selectedPhoto.title);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-emerald-700 shadow-lg transition hover:bg-white hover:text-emerald-800"
              title="Download photo"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-emerald-700 shadow-lg transition hover:bg-white hover:text-emerald-800"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
                setIsFullscreen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-emerald-700 shadow-lg transition hover:bg-white hover:text-emerald-800"
              title="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div
            className={`relative ${isFullscreen ? 'h-full w-full' : 'max-h-full w-full max-w-lg'} cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isFullscreen) {
                setFlipBack((prev) => !prev);
              }
            }}
          >
            {isFullscreen ? (
              // Fullscreen view - just the image
              <div className="relative h-full w-full bg-black">
                <Image
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.title}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              // Normal card flip view
              <div className="relative h-[500px] w-full transition-transform duration-700 [transform-style:preserve-3d]">
                {/* Front: Photo */}
                <div
                  className="absolute inset-0 rounded-sm bg-white p-4 shadow-2xl [backface-visibility:hidden]"
                  style={{ transform: flipBack ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  <div className="absolute -top-2 left-8 h-8 w-16 rotate-[-5deg] bg-gradient-to-b from-yellow-100/60 to-yellow-200/40 opacity-70" />
                  <div className="absolute -top-2 right-8 h-8 w-16 rotate-[5deg] bg-gradient-to-b from-yellow-100/60 to-yellow-200/40 opacity-70" />
                  <div className="relative h-full w-full overflow-hidden bg-slate-100">
                    <Image src={selectedPhoto.imageUrl} alt={selectedPhoto.title} fill className="object-contain" />
                  </div>
                </div>

                {/* Back: Details */}
                <div
                  className="absolute inset-0 flex flex-col justify-between rounded-lg bg-white p-8 shadow-2xl [backface-visibility:hidden]"
                  style={{ transform: flipBack ? "rotateY(360deg)" : "rotateY(180deg)" }}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-teal-600">
                        {new Date(selectedPhoto.takenAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <h3 className="mt-2 text-3xl font-bold leading-tight text-emerald-900" style={{ fontFamily: "'Cinzel', serif" }}>
                        {selectedPhoto.title}
                      </h3>
                    </div>
                    
                    {selectedPhoto.caption && (
                      <div className="rounded-lg bg-teal-50/50 p-4">
                        <p className="text-base leading-relaxed text-teal-900">
                          {selectedPhoto.caption}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 border-t border-teal-200 pt-4">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-teal-700">📍 Location:</span>
                        <span className="text-teal-900">{selectedPhoto.location}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-teal-700">👤 Uploaded by:</span>
                        <span className="text-teal-900">{selectedPhoto.uploaderName}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-teal-700">👨‍👩‍👧‍👦 People:</span>
                        <span className="text-teal-900">{parsePeople(selectedPhoto.people)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-xs text-teal-600">
                    Tap to flip • Tap outside to close
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}