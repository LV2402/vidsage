import { analyzeSeo } from "@/app/actions";
import { ExternalLink, XCircle } from "lucide-react";
import Link from "next/link";
import { TabsContainer } from "./seo-tabs";

interface SeoResult {
  issues: Array<{
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
  }>;
  metaTagsScore: number;
  contentScore: number;
  performanceScore: number;
  mobileScore: number;
  overallScore?: number;
  metaTagsDetails: Array<{
    tag: string;
    status: string;
  }>;
  contentDetails: Array<{
    section: string;
    status: string;
  }>;
  technicalDetails: Array<{
    aspect: string;
    status: string;
  }>;
}

interface ScoreCardProps {
  title: string;
  score: number;
  rotation: string;
}

interface SeoResultsProps {
  url: string;
}

export async function SeoResults({ url }: SeoResultsProps) {
  const rawResults = await analyzeSeo(url);
  
  // Validate and normalize scores
  const normalizeScore = (score: string | number | null | undefined): number => {
    const num = Number(score);
    return !isNaN(num) ? Math.min(Math.max(Math.round(num), 0), 100) : 0;
  };

  const results: SeoResult = {
    ...rawResults,
    metaTagsScore: normalizeScore(rawResults.metaTagsScore),
    contentScore: normalizeScore(rawResults.contentScore),
    performanceScore: normalizeScore(rawResults.performanceScore),
    mobileScore: normalizeScore(rawResults.mobileScore),
    issues: (rawResults.issues || []).map((issue) => ({
      ...issue,
      title: issue.title || "Unknown Issue",
      description: issue.description || "No description provided",
      severity: (issue.severity && ["high", "medium", "low"].includes(issue.severity.toLowerCase()))
        ? (issue.severity.toLowerCase() as "high" | "medium" | "low")
        : "low",
    })),
    recommendations: (rawResults.recommendations || []).map((rec) => ({
      ...rec,
      title: rec.title || "Unknown Recommendation",
      description: rec.description || "No description provided",
      impact: (rec.impact && ["high", "medium", "low"].includes(rec.impact.toLowerCase()))
        ? (rec.impact.toLowerCase() as "high" | "medium" | "low")
        : "low",
    })),
    metaTagsDetails: (rawResults.metaTagsDetails || []).map(detail => ({
      tag: detail.name || "Unknown Tag",
      status: detail.status || "bad"
    })),
    contentDetails: (rawResults.contentDetails || []).map(detail => ({
      section: detail.name || "Unknown Section",
      status: detail.status || "bad"
    })),
    technicalDetails: (rawResults.technicalDetails || []).map(detail => ({
      aspect: detail.name || "Unknown Aspect",
      status: detail.status || "bad"
    }))
  };

  // Special case for access errors and other critical issues
  if (
    results.issues.length > 0 &&
    (results.issues[0].title === "Access Forbidden" ||
      results.issues[0].title === "Analysis Error")
  ) {
    return (
      <div className="neo-card bg-white text-center p-8 rotate-1">
        <div className="flex justify-center mb-6">
          <XCircle className="h-16 w-16 text-[#FF5757]" />
        </div>
        <p className="text-2xl font-bold mb-4">{results.issues[0].title}</p>
        <p className="text-lg mb-6">{results.issues[0].description}</p>
        <Link href="/">
          <button className="neo-button bg-[#FF5757] text-white">
            Try Another URL
          </button>
        </Link>
      </div>
    );
  }

  // Calculate overall score
  const overallScore =
    results.overallScore ||
    Math.round(
      (results.metaTagsScore +
        results.contentScore +
        results.performanceScore +
        results.mobileScore) / 4
    );

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-[#00C853]";
    if (score >= 60) return "text-[#FFB300]";
    return "text-[#FF5757]";
  };

  const getScoreBg = (score: number): string => {
    if (score >= 80) return "bg-[#00C853]";
    if (score >= 60) return "bg-[#FFB300]";
    return "bg-[#FF5757]";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return "EXCELLENT";
    if (score >= 70) return "GOOD";
    if (score >= 60) return "AVERAGE";
    if (score >= 40) return "NEEDS WORK";
    return "POOR";
  };

  return (
    <div className="space-y-8">
      <div className="neo-card bg-white rotate-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{new URL(url).hostname}</h2>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-bold hover:underline"
            >
              {url} <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-4xl font-black">
              <span className={getScoreColor(overallScore)}>
                {overallScore}
              </span>
              <span className="text-2xl">/100</span>
            </div>
            <div className={`neo-badge ${getScoreBg(overallScore)} text-white`}>
              {getScoreLabel(overallScore)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard
          title="Meta Tags"
          score={results.metaTagsScore}
          rotation="-rotate-1"
        />
        <ScoreCard
          title="Content"
          score={results.contentScore}
          rotation="rotate-1"
        />
        <ScoreCard
          title="Performance"
          score={results.performanceScore}
          rotation="-rotate-1"
        />
        <ScoreCard
          title="Mobile"
          score={results.mobileScore}
          rotation="rotate-1"
        />
      </div>

      {/* Add SEO summary before tabs */}
      <div className="neo-card bg-white -rotate-1 p-6">
        <h3 className="text-2xl font-bold mb-4">SEO Summary</h3>
        <p className="font-medium text-lg mb-4">
          {overallScore >= 80
            ? "This website demonstrates strong SEO practices with well-structured content and metadata. Minor improvements could still enhance its performance."
            : overallScore >= 60
            ? "This website has a solid SEO foundation but requires attention to several key areas to improve search engine visibility and ranking potential."
            : "This website needs significant SEO improvements across multiple areas to enhance its search engine visibility and ranking potential."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold text-lg mb-2">Strengths</h4>
            <ul className="list-disc pl-5 space-y-1">
              {results.metaTagsScore >= 70 && (
                <li>Solid meta tag implementation</li>
              )}
              {results.contentScore >= 70 && <li>Quality content structure</li>}
              {results.performanceScore >= 70 && (
                <li>Good performance indicators</li>
              )}
              {results.mobileScore >= 70 && <li>Mobile-friendly design</li>}
              {results.issues.length === 0 && (
                <li>No critical issues detected</li>
              )}
              {results.metaTagsScore < 70 &&
                results.contentScore < 70 &&
                results.performanceScore < 70 &&
                results.mobileScore < 70 && (
                  <li>Website has potential for significant improvement</li>
                )}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-2">Priority Actions</h4>
            <ul className="list-disc pl-5 space-y-1">
              {results.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index}>{rec.title}</li>
              ))}
              {results.recommendations.length === 0 && (
                <li>Maintain current SEO practices</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <TabsContainer
        results={{
          ...results,
          metaTagsDetails: results.metaTagsDetails.map((detail) => ({
            name: detail.tag,
            value: "N/A", // Provide a default value or map appropriately
            status: (["good", "warning", "bad"] as const).includes(detail.status as "good" | "warning" | "bad")
              ? (detail.status as "good" | "warning" | "bad")
              : "bad"
          })),
          contentDetails: results.contentDetails.map((detail) => ({
            name: detail.section,
            value: "N/A", // Provide a default value
            status: detail.status === "good" ? "good" : "bad"
          })),
          technicalDetails: results.technicalDetails.map((detail) => ({
            name: detail.aspect,
            value: "N/A", // Provide a default value
            status: (["good", "warning", "bad"] as const).includes(detail.status as "good" | "warning" | "bad")
              ? (detail.status as "good" | "warning" | "bad")
              : "bad"
          }))
        }}
      />
    </div>
  );
}

function ScoreCard({ title, score, rotation }: ScoreCardProps) {
  const getBg = (score: number): string => {
    if (score >= 80) return "bg-[#00C853]";
    if (score >= 60) return "bg-[#FFB300]";
    return "bg-[#FF5757]";
  };

  const getLabel = (score: number): string => {
    if (score >= 80) return "GOOD";
    if (score >= 60) return "FAIR";
    return "POOR";
  };

  return (
    <div className={`neo-card ${rotation}`}>
      <div className="text-center">
        <p className="text-xl font-bold uppercase mb-2">{title}</p>
        <div className="flex justify-center items-center">
          <p className="text-4xl font-black mb-2">{score}</p>
          <span className="text-sm font-bold ml-1">{getLabel(score)}</span>
        </div>
        <div className={`w-full h-4 neo-border ${getBg(score)}`}></div>
      </div>
    </div>
  );
}
