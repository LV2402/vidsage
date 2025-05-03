"use server";

import { redirect } from "next/navigation";
import axios from "axios";

export async function submitUrl(
  data: Record<string, unknown>,
  formData: FormData
) {
  const url = formData.get("url");

  if (!url || typeof url !== "string") {
    return { error: "Please enter a URL" };
  }

  let formattedUrl = url.trim();

  // More robust URL validation and formatting
  if (!formattedUrl.match(/^https?:\/\//i)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  try {
    // Validate URL
    const urlObj = new URL(formattedUrl);

    // Ensure we have a valid hostname
    if (!urlObj.hostname) {
      return { error: "Please enter a valid URL with a hostname" };
    }

    console.log(`Processing URL: ${formattedUrl}`);
    // Redirect to results page
    redirect(`/results?url=${encodeURIComponent(formattedUrl)}`);
  } catch (error) {
    console.error("URL validation error:", error);
    return { error: "Please enter a valid URL" };
  }
}

interface AnalysisResult {
  metaTagsScore: number;
  contentScore: number;
  performanceScore: number;
  mobileScore: number;
  issues: {
    title: string;
    description: string;
    severity: string; // Changed from literal type to allow any string value
  }[];
  recommendations: {
    title: string;
    description: string;
    impact: string; // Changed from literal type to allow any string value
  }[];
  metaTagsDetails: {
    name: string;
    value: string;
    status: string; // Changed from literal type to allow any string value
  }[];
  contentDetails: {
    name: string;
    value: string;
    status: string; // Changed from literal type to allow any string value
  }[];
  technicalDetails: {
    name: string;
    value: string;
    status: string; // Changed from literal type to allow any string value
  }[];
  overallScore?: number;
  url?: string;
}

// Removed unused interface GeminiResponseContent


export async function analyzeSeo(url: string) {
  console.log(`Starting SEO analysis for: ${url}`);
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not available");
      throw new Error("API key not available");
    }

    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL format: ${url}`);
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VidsageBot/1.0)",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.error(`403 Forbidden: Access to ${url} is blocked.`);
        return {
          metaTagsScore: 0,
          contentScore: 0,
          performanceScore: 0,
          mobileScore: 0,
          issues: [
            {
              title: "Access Forbidden",
              description: `Access to the website (${url}) is blocked. Please check if the website has restrictions or try another URL.`,
              severity: "high",
            },
          ],
          recommendations: [],
          metaTagsDetails: [],
          contentDetails: [],
          technicalDetails: [],
        };
      }
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Retrieved ${html.length} bytes of HTML`);

    const text = stripHtml(html);
    console.log(`Extracted ${text.length} characters of text`);

    const prompt = `
You are an expert SEO consultant with years of experience optimizing websites for search engines. Analyze the following website content thoroughly for SEO best practices, providing specific and actionable insights.

RESPONSE FORMAT: You must return a valid JSON object with these exact properties:
- metaTagsScore (number between 0-100, be precise based on quality and presence of important meta tags)
- contentScore (number between 0-100, evaluate content depth, relevance, and keyword usage)
- performanceScore (number between 0-100, estimate based on content structure and best practices)
- mobileScore (number between 0-100, estimate based on content structure and best practices)
- issues (array of objects with structured issues):
  - Each object must have: {title: string, description: string, severity: "high"|"medium"|"low"}
  - Titles should be concise problem statements
  - Descriptions must provide specific details about the problem and its SEO impact
  - Severity should accurately reflect the impact on search rankings
- recommendations (array of objects with actionable advice):
  - Each object must have: {title: string, description: string, impact: "high"|"medium"|"low"}
  - Titles should be concise action items
  - Descriptions must include specific implementation steps 
  - Impact should reflect potential ranking improvement
- metaTagsDetails (array of objects analyzing meta tags):
  - Each object must have: {name: string, value: string, status: "good"|"warning"|"bad"}
  - Include title, description, canonical, robots, viewport, og tags, etc.
- contentDetails (array of objects analyzing content):
  - Each object must have: {name: string, value: string, status: "good"|"warning"|"bad"}
  - Include headings structure, content length, keyword density, etc.
- technicalDetails (array of objects analyzing technical aspects):
  - Each object must have: {name: string, value: string, status: "good"|"warning"|"bad"}
  - Include URL structure, image optimization, internal linking, etc.

Website content:
${text.slice(0, 12000)}
    `.trim();

    try {
      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            topP: 0.8,
            topK: 40,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Gemini API response status:", geminiResponse.status);

      const rawText =
        geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      interface ParsedResponse extends Partial<AnalysisResult> {
        [key: string]: unknown;
      }

      let analysisResult: AnalysisResult = {
        metaTagsScore: 60,
        contentScore: 60,
        performanceScore: 60,
        mobileScore: 60,
        issues: [],
        recommendations: [],
        metaTagsDetails: [],
        contentDetails: [],
        technicalDetails: [],
        overallScore: 0,
        url,
      };

      if (rawText) {
        try {
          const jsonStr = extractJsonFromText(rawText);
          const parsedResult = JSON.parse(jsonStr) as ParsedResponse;

          // Type-safe assignment of scores
          if (typeof parsedResult.metaTagsScore === "number")
            analysisResult.metaTagsScore = parsedResult.metaTagsScore;
          if (typeof parsedResult.contentScore === "number")
            analysisResult.contentScore = parsedResult.contentScore;
          if (typeof parsedResult.performanceScore === "number")
            analysisResult.performanceScore = parsedResult.performanceScore;
          if (typeof parsedResult.mobileScore === "number")
            analysisResult.mobileScore = parsedResult.mobileScore;

          // Safely assign arrays
          if (Array.isArray(parsedResult.issues))
            analysisResult.issues = parsedResult.issues;
          if (Array.isArray(parsedResult.recommendations))
            analysisResult.recommendations = parsedResult.recommendations;
          if (Array.isArray(parsedResult.metaTagsDetails))
            analysisResult.metaTagsDetails = parsedResult.metaTagsDetails;
          if (Array.isArray(parsedResult.contentDetails))
            analysisResult.contentDetails = parsedResult.contentDetails;
          if (Array.isArray(parsedResult.technicalDetails))
            analysisResult.technicalDetails = parsedResult.technicalDetails;

          const requiredFields = [
            "metaTagsScore",
            "contentScore",
            "performanceScore",
            "mobileScore",
            "issues",
            "recommendations",
            "metaTagsDetails",
            "contentDetails",
            "technicalDetails",
          ];

          for (const field of requiredFields) {
            if (!(field in analysisResult)) {
              if (field.endsWith("Score")) {
                // Safe type assertion using type intersection
                (analysisResult as AnalysisResult & Record<string, number>)[field] = 60;
              } else {
                // Safe type assertion for array fields
                (analysisResult as AnalysisResult & Record<string, unknown[]>)[field] = [];
              }
            }

            if (field.endsWith("Score")) {
              const scoreField = field as keyof Pick<
                AnalysisResult,
                "metaTagsScore" | "contentScore" | "performanceScore" | "mobileScore"
              >;
              
              // Handle string scores by parsing them
              const currentValue = ((analysisResult as unknown) as Record<string, unknown>)[scoreField];
              const numericScore = typeof currentValue === "string" 
                ? parseInt(currentValue, 10) || 60 
                : (typeof currentValue === "number" ? currentValue : 60);

              // Safely assign the normalized score
              (analysisResult as AnalysisResult)[scoreField] = Math.max(
                0,
                Math.min(100, numericScore)
              );
            }
          }

          interface ValidatedItem {
            [key: string]: string;
          }

          interface Issue extends ValidatedItem {
            title: string;
            description: string;
            severity: string; // Changed from literal type to allow any string value
          }

          interface Issue {
            title: string;
            description: string;
            severity: string; // Changed from literal type to allow any string value
          }

          interface Recommendation extends ValidatedItem {
            title: string;
            description: string;
            impact: string; // Changed from literal type to allow any string value
          }

          interface Detail {
            name: string;
            value: string;
            status: string; // Changed from literal type to allow any string value
            [key: string]: string; // Added index signature to satisfy ValidatedItem constraint
          }

          // Generic validator with better type checking for literal string values
          const validateArray = <T extends ValidatedItem>(
            arr: unknown[],
            template: Record<keyof T, string>
          ): T[] => {
            if (!Array.isArray(arr)) return [];
            return arr.filter((item): item is T => {
              return (
                typeof item === "object" &&
                item !== null &&
                Object.keys(template).every(
                  (key) =>
                    key in item &&
                    typeof (item as Record<string, unknown>)[key] === "string"
                )
              );
            });
          };

          // Update validation for specific types
          const validateIssues = (arr: unknown[]): Issue[] =>
            validateArray<Issue>(arr, {
              title: "",
              description: "",
              severity: "",
            });

          const validateRecommendations = (arr: unknown[]): Recommendation[] =>
            validateArray<Recommendation>(arr, {
              title: "",
              description: "",
              impact: "",
            });

          const validateDetails = (arr: unknown[]): Detail[] =>
            validateArray<Detail>(arr, { name: "", value: "", status: "" });

          // Update the validations
          analysisResult.issues = validateIssues(analysisResult.issues);
          analysisResult.recommendations = validateRecommendations(
            analysisResult.recommendations
          );
          analysisResult.metaTagsDetails = validateDetails(
            analysisResult.metaTagsDetails
          );
          analysisResult.contentDetails = validateDetails(
            analysisResult.contentDetails
          );
          analysisResult.technicalDetails = validateDetails(
            analysisResult.technicalDetails
          );

          analysisResult.url = url;
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
          analysisResult = {
            metaTagsScore: 60,
            contentScore: 60,
            performanceScore: 60,
            mobileScore: 60,
            issues: [
              {
                title: "Analysis Format Error",
                description:
                  "We couldn't generate a complete analysis format. The results shown are partial and may not reflect the full SEO status of your website.",
                severity: "medium",
              },
            ],
            recommendations: [
              {
                title: "Try a Focused Analysis",
                description:
                  "For better results, try analyzing specific aspects of your website separately, such as meta tags or content structure.",
                impact: "medium",
              },
            ],
            metaTagsDetails: [],
            contentDetails: [],
            technicalDetails: [],
            url: url,
          };
        }
      } else {
        throw new Error("No text content in Gemini response");
      }

      const scores = [
        analysisResult.metaTagsScore || 0,
        analysisResult.contentScore || 0,
        analysisResult.performanceScore || 0,
        analysisResult.mobileScore || 0,
      ];
      analysisResult.overallScore = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );

      return analysisResult;
    } catch (apiError) {
      console.error(
        "Gemini API error:",
        (apiError as { response?: { status?: number; data?: unknown } })
          .response?.status,
        (apiError as { response?: { data?: unknown } }).response?.data ||
          (apiError as Error).message
      );
      throw new Error(
        `Gemini API error: ${
          (apiError as { response?: { status?: number } }).response?.status ||
          "Unknown"
        } - ` +
          `${
            (
              apiError as {
                response?: { data?: { error?: { message?: string } } };
              }
            ).response?.data?.error?.message || (apiError as Error).message
          }`
      );
    }
  } catch (error) {
    console.error("Error analyzing SEO:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      metaTagsScore: 0,
      contentScore: 0,
      performanceScore: 0,
      mobileScore: 0,
      issues: [
        {
          title: "Analysis Error",
          description: errorMessage,
          severity: "high",
        },
      ],
      recommendations: [],
      metaTagsDetails: [],
      contentDetails: [],
      technicalDetails: [],
      overallScore: 0,
      url,
    };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonFromText(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  } else {
    const rawJsonMatch = text.match(/(\{[\s\S]*\})/);
    if (rawJsonMatch) {
      return rawJsonMatch[1];
    } else {
      return text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }
  }
}
