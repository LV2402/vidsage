import { SeoForm } from "@/components/seo-form";

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#ffe26d]">
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center space-y-2 mt-24 mb-12">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase">
            LogsPector
          </h1>
          <p className="text-xl font-bold">
            Check your website's SEO performance
          </p>
        </div>

        <SeoForm />
      </div>
    </main>
  );
}
