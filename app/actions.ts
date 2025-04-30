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
          // Extract JSON from the response using more robust methods
          let jsonStr = "";
          try {
            // First try to find a JSON object between code blocks
            const jsonMatch = rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch) {
              jsonStr = jsonMatch[1];
            } else {
              // Try to find a raw JSON object
              const rawJsonMatch = rawText.match(/(\{[\s\S]*\})/);
              if (rawJsonMatch) {
                jsonStr = rawJsonMatch[1];
              } else {
                // If no JSON found, clean the text and try again
                jsonStr = rawText
                  .replace(/```json/g, '')
                  .replace(/```/g, '')
                  .trim();
              }
            }
            
            // Parse the JSON string
            analysisResult = JSON.parse(jsonStr);
            
            // Validate and enhance response data
            // Ensure all required fields exist with the correct types
            const requiredFields = [
              'metaTagsScore', 'contentScore', 'performanceScore', 'mobileScore', 
              'issues', 'recommendations', 'metaTagsDetails', 'contentDetails', 'technicalDetails'
            ];
            
            // Type checking and fixing
            for (const field of requiredFields) {
              if (!(field in analysisResult)) {
                if (field.endsWith('Score')) {
                  analysisResult[field] = 60; // Default to medium score instead of 0
                } else {
                  analysisResult[field] = [];
                }
              }
              
              // Ensure scores are numbers between 0-100
              if (field.endsWith('Score') && typeof analysisResult[field] === 'string') {
                analysisResult[field] = parseInt(analysisResult[field], 10) || 60;
              }
              
              // Cap scores between 0-100
              if (field.endsWith('Score')) {
                analysisResult[field] = Math.max(0, Math.min(100, analysisResult[field]));
              }
            }
            
            // Ensure arrays have the correct structure
            const validateArray = (arr: any[], template: any) => {
              if (!Array.isArray(arr)) return [];
              return arr.filter(item => {
                return typeof item === 'object' && 
                       Object.keys(template).every(key => key in item);
              });
            };
            
            analysisResult.issues = validateArray(analysisResult.issues, 
              { title: '', description: '', severity: '' });
            analysisResult.recommendations = validateArray(analysisResult.recommendations, 
              { title: '', description: '', impact: '' });
            analysisResult.metaTagsDetails = validateArray(analysisResult.metaTagsDetails, 
              { name: '', value: '', status: '' });
            analysisResult.contentDetails = validateArray(analysisResult.contentDetails, 
              { name: '', value: '', status: '' });
            analysisResult.technicalDetails = validateArray(analysisResult.technicalDetails, 
              { name: '', value: '', status: '' });
              
            // Add URL to the result
            analysisResult.url = url;
          } catch (jsonError) {
            console.error("JSON parsing error:", jsonError);
            // Fallback to comprehensive object with error info
            analysisResult = {
              metaTagsScore: 60,
              contentScore: 60,
              performanceScore: 60,
              mobileScore: 60,
              issues: [
                {
                  title: "Analysis Format Error",
                  description: "We couldn't generate a complete analysis format. The results shown are partial and may not reflect the full SEO status of your website.",
                  severity: "medium",
                }
              ],
              recommendations: [
                {
                  title: "Try a Focused Analysis",
                  description: "For better results, try analyzing specific aspects of your website separately, such as meta tags or content structure.",
                  impact: "medium",
                },
                {
                  title: "Manual SEO Audit",
                  description: "Consider performing a manual SEO audit using tools like Google Search Console, PageSpeed Insights, or SEMrush for more detailed results.",
                  impact: "high",
                }
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
      } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", e);
        analysisResult = {
          metaTagsScore: 50,
          contentScore: 50,
          performanceScore: 50,
          mobileScore: 50,
          issues: [
            {
              title: "Analysis Error",
              description: "We encountered an error while analyzing your website. This could be due to complex website structure or API limitations.",
              severity: "high",
            },
          ],
          recommendations: [
            {
              title: "Try Again Later",
              description: "Our AI analysis system may be experiencing high demand. Please try again in a few minutes.",
              impact: "medium",
            },
            {
              title: "Use Alternative SEO Tools",
              description: "Consider using specialized SEO tools like Ahrefs, Moz, or Google PageSpeed Insights for more reliable analysis.",
              impact: "high",
            }
          ],
          metaTagsDetails: [],
          contentDetails: [],
          technicalDetails: [],
          url: url,
        };
      }

      // Calculate and add overall score
      const scores = [
        analysisResult.metaTagsScore || 0, 
        analysisResult.contentScore || 0, 
        analysisResult.performanceScore || 0, 
        analysisResult.mobileScore || 0
      ];
      analysisResult.overallScore = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );

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
