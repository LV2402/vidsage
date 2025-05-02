"use server";

import { redirect } from "next/navigation";
import axios from "axios";

export async function submitUrl(
  data: Record<string, unknown>,
  formData: FormData
) {
  const url = formData.get("url") as string;

  if (!url) {
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

      let analysisResult: {
        metaTagsScore: number;
        contentScore: number;
        performanceScore: number;
        mobileScore: number;
        issues: { title: string; description: string; severity: string }[];
        recommendations: {
          title: string;
          description: string;
          impact: string;
        }[];
        metaTagsDetails: { name: string; value: string; status: string }[];
        contentDetails: { name: string; value: string; status: string }[];
        technicalDetails: { name: string; value: string; status: string }[];
        overallScore?: number;
        url?: string;
      } = {
        metaTagsScore: 0,
        contentScore: 0,
        performanceScore: 0,
        mobileScore: 0,
        issues: [],
        recommendations: [],
        metaTagsDetails: [],
        contentDetails: [],
        technicalDetails: [],
      };

      const rawText =
        geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let jsonStr = "";
        try {
          const jsonMatch = rawText.match(
            /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
          );
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          } else {
            const rawJsonMatch = rawText.match(/(\{[\s\S]*\})/);
            if (rawJsonMatch) {
              jsonStr = rawJsonMatch[1];
            } else {
              jsonStr = rawText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
            }
          }

          analysisResult = JSON.parse(jsonStr);

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
                analysisResult[field] = 60;
              } else {
                analysisResult[field] = [];
              }
            }

            if (
              field.endsWith("Score") &&
              typeof analysisResult[field] === "string"
            ) {
              analysisResult[field] = parseInt(analysisResult[field], 10) || 60;
            }

            if (field.endsWith("Score")) {
              analysisResult[field] = Math.max(
                0,
                Math.min(100, analysisResult[field])
              );
            }
          }

          const validateArray = (
            arr: unknown[],
            template: Record<string, unknown>
          ) => {
            if (!Array.isArray(arr)) return [];
            return arr.filter((item) => {
              return (
                typeof item === "object" &&
                Object.keys(template).every(
                  (key) => key in (item as Record<string, unknown>)
                )
              );
            });
          };

          analysisResult.issues = validateArray(analysisResult.issues, {
            title: "",
            description: "",
            severity: "",
          });
          analysisResult.recommendations = validateArray(
            analysisResult.recommendations,
            {
              title: "",
              description: "",
              impact: "",
            }
          );
          analysisResult.metaTagsDetails = validateArray(
            analysisResult.metaTagsDetails,
            {
              name: "",
              value: "",
              status: "",
            }
          );
          analysisResult.contentDetails = validateArray(
            analysisResult.contentDetails,
            {
              name: "",
              value: "",
              status: "",
            }
          );
          analysisResult.technicalDetails = validateArray(
            analysisResult.technicalDetails,
            {
              name: "",
              value: "",
              status: "",
            }
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
    return {
      metaTagsScore: 0,
      contentScore: 0,
      performanceScore: 0,
      mobileScore: 0,
      issues: [
        {
          title: "Analysis Error",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
          severity: "high",
        },
      ],
      recommendations: [],
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
