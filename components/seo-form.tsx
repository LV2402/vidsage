"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SeoForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAnalyze = () => {
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
      new URL(formattedUrl); // Validate URL
      router.push(`/results?url=${encodeURIComponent(formattedUrl)}`);
    } catch (err) {
      setError("Please enter a valid URL");
    }
  };

  return (
    <div className="neo-card -rotate-1 bg-white">
      <div className="space-y-4">
        <label htmlFor="url" className="block text-xl font-bold">
          Website URL
        </label>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            id="url"
            type="text"
            placeholder="example.com"
            className="neo-input flex-1 text-lg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            className="neo-button bg-[#FF5757] text-lg uppercase"
          >
            Analyze SEO
          </button>
        </div>
        {error && <p className="text-[#FF5757] font-bold">{error}</p>}
      </div>
    </div>
  );
}
