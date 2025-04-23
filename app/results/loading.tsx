import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#FFDE59] flex items-center justify-center">
      <div className="neo-card bg-white text-center p-12 -rotate-1 space-y-6 max-w-2xl w-full">
        <Loader2 className="h-16 w-16 animate-spin mx-auto text-[#FF5757]" />
        <p className="text-2xl font-bold">Analyzing website SEO...</p>
        <p className="text-lg font-medium max-w-md mx-auto">
          We're crawling the website, analyzing its content, and generating
          recommendations. This may take a moment.
        </p>
      </div>
    </div>
  );
}
