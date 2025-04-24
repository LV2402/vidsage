"use server";

import { redirect } from "next/navigation";
import axios from "axios";

export async function submitUrl(data: any, formData: FormData) {
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
  } catch (err) {
    console.error("URL validation error:", err);
    return { error: "Please enter a valid URL" };
  }
}

export async function analyzeSeo(url: string) {
  console.log(`Starting SEO analysis for: ${url}`);
  try {
    // Use environment variable instead of hardcoded key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not available");
      throw new Error("API key not available");
    }
    
    // Validate URL before proceeding
    try {
      new URL(url);
    } catch (err) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    
    // Fetch the website content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VidsageBot/1.0)",
      },
      // Add timeout to avoid hanging requests
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.error(
          `403 Forbidden: Access to ${url} is blocked. Check if the website has restrictions.`
        );
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

    // Extract meaningful text from the HTML
    const html = await response.text();
    console.log(`Retrieved ${html.length} bytes of HTML`);
    
    const text = stripHtml(html);
    console.log(`Extracted ${text.length} characters of text`);

    // Prepare prompt for Gemini
    const prompt = `
You are an SEO expert. Analyze the following website content for SEO best practices, meta tags, content quality, performance, and mobile-friendliness.

RESPONSE FORMAT: You must return ONLY a valid JSON object with no comments, explanations or markdown formatting - just pure JSON data with these exact properties:
- metaTagsScore (number between 0-100)
- contentScore (number between 0-100)
- performanceScore (number between 0-100)
- mobileScore (number between 0-100)
- issues (array of objects with title, description, and severity properties, where severity is "high", "medium", or "low")
- recommendations (array of objects with title, description, and impact properties, where impact is "high", "medium", or "low")
- metaTagsDetails (array of objects with name, value, and status properties, where status is "good", "warning", or "bad")
- contentDetails (array of objects with name, value, and status properties)
- technicalDetails (array of objects with name, value, and status properties)

Website content:
${text.slice(0, 10000)}
    `.trim();

    // Use axios for more reliable API calling
    try {
      // Updated Gemini API endpoint and structure
      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            topP: 0.8,
            topK: 40
            // Removed invalid responseFormat parameter
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log("Gemini API response status:", geminiResponse.status);
      
      // Parse Gemini response
      let analysisResult: any = {};
      try {
        // Extract text from the response based on Gemini API structure
        const rawText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          // Extract JSON from the response text
          let jsonStr = "";
          try {
            // Try to find a JSON object in the response using regex
            const jsonMatch = rawText.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
              jsonStr = jsonMatch[0];
            } else {
              // If no regex match, try to clean the text
              jsonStr = rawText
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            }
            
            // Parse the JSON string
            analysisResult = JSON.parse(jsonStr);
            
            // Ensure all required fields exist
            const requiredFields = ['metaTagsScore', 'contentScore', 'performanceScore', 'mobileScore', 
                                   'issues', 'recommendations', 'metaTagsDetails', 'contentDetails', 'technicalDetails'];
            for (const field of requiredFields) {
              if (!(field in analysisResult)) {
                if (field.endsWith('Score')) {
                  analysisResult[field] = 0;
                } else {
                  analysisResult[field] = [];
                }
              }
            }
          } catch (jsonError) {
            console.error("JSON parsing error:", jsonError);
            // Fallback to simple object with error info
            analysisResult = {
              metaTagsScore: 60,
              contentScore: 60,
              performanceScore: 60,
              mobileScore: 60,
              issues: [
                {
                  title: "Response Format Error",
                  description: "The AI couldn't generate a proper analysis format. Try again or check the URL.",
                  severity: "medium",
                }
              ],
              recommendations: [
                {
                  title: "Try Again",
                  description: "Sometimes the AI might need another attempt to analyze the website correctly.",
                  impact: "medium",
                }
              ],
              metaTagsDetails: [],
              contentDetails: [],
              technicalDetails: [],
            };
          }
        } else {
          throw new Error("No text content in Gemini response");
        }
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", e);
        analysisResult = {
          metaTagsScore: 0,
          contentScore: 0,
          performanceScore: 0,
          mobileScore: 0,
          issues: [
            {
              title: "Gemini API Error",
              description: "Could not parse Gemini API response.",
              severity: "high",
            },
          ],
          recommendations: [],
          metaTagsDetails: [],
          contentDetails: [],
          technicalDetails: [],
        };
      }

      return analysisResult;
    } catch (apiError: any) {
      console.error("Gemini API error:", apiError.response?.status, apiError.response?.data || apiError.message);
      throw new Error(`Gemini API error: ${apiError.response?.status || "Unknown"} - ${apiError.response?.data?.error?.message || apiError.message}`);
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
          description: error instanceof Error ? error.message : "Unknown error occurred",
          severity: "high"
        }
      ],
      recommendations: [],
      overallScore: 0,
      url
    };
  }
}

// Helper functions to extract data from HTML
function extractTag(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : "";
}

function extractMetaTag(html: string, name: string): string {
  const regex = new RegExp(
    `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["'][^>]*>`,
    "i"
  );
  const match = html.match(regex);
  return match ? (match[1] || match[2] || "").trim() : "";
}

function extractAllTags(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, "gi");
  const matches = html.matchAll(regex);
  const results: string[] = [];

  for (const match of matches) {
    if (match[1]) {
      results.push(match[1].trim());
    }
  }

  return results;
}

function extractAllImgTags(html: string): { src: string; alt: string }[] {
  const regex =
    /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>|<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi;
  const matches = html.matchAll(regex);
  const results: { src: string; alt: string }[] = [];

  for (const match of matches) {
    if (match[1]) {
      results.push({
        src: match[1],
        alt: match[2] || "",
      });
    } else if (match[4]) {
      results.push({
        src: match[4],
        alt: match[3] || "",
      });
    }
  }

  return results;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
