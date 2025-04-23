import { Suspense } from "react";
import { SeoResults } from "@/components/seo-results";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: { url?: string };
}) {
  const url = (await searchParams).url || "";

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#FFDE59]">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="neo-button bg-white text-black">
              <ArrowLeft className="h-6 w-6" />
            </button>
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">
            SEO Results
          </h1>
        </div>

        {url ? (
          <Suspense fallback={<LoadingResults />}>
            <SeoResults url={url} />
          </Suspense>
        ) : (
          <div className="neo-card bg-white text-center p-8 rotate-1">
            <p className="text-xl font-bold mb-4">
              No URL provided. Please go back and enter a URL to analyze.
            </p>
            <Link href="/">
              <button className="neo-button bg-[#FF5757]">Go Back</button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingResults() {
  return (
    <div className="neo-card bg-white text-center p-12 -rotate-1 space-y-6">
      <Loader2 className="h-16 w-16 animate-spin mx-auto text-[#FF5757]" />
      <p className="text-2xl font-bold">Analyzing website SEO...</p>
      <p className="text-lg font-medium max-w-md mx-auto">
        We're crawling the website, analyzing its content, and generating
        recommendations. This may take a moment.
      </p>
    </div>
  );
}
