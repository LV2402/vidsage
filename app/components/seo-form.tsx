'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SeoForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    let formattedUrl = url.trim();
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
      router.push(`/results?url=${encodeURIComponent(formattedUrl)}`);
    } catch {
      setError("Please enter a valid URL");
    }
  };

  return (
    <div className="neo-card -rotate-1 bg-white">
      <div className="space-y-4">
        <label htmlFor="url" className="block text-xl font-bold">
          Website URL
        </label>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
            className="neo-input flex-1 text-lg"
            aria-label="Enter website URL"
          />
          <button 
            type="submit"
            className="neo-button bg-[#FF5757] text-lg uppercase"
          >
            Analyze SEO
          </button>
        </form>
        {error && (
          <p className="text-[#FF5757] font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
