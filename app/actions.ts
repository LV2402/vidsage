"use server";

import { redirect } from "next/navigation";

export async function submitUrl(data: any, formData: FormData) {
  const url = formData.get("url") as string;

  if (!url) {
    return { error: "Please enter a URL" };
  }

  let formattedUrl = url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    formattedUrl = `https://${url}`;
  }

  try {
    // Validate URL
    new URL(formattedUrl);

    console.log(formattedUrl);
    // Redirect to results page
    redirect(`/results?url=${encodeURIComponent(formattedUrl)}`);
  } catch (err) {
    console.log(err);
    return { error: "Please enter a valid URL" };
  }
}

export async function analyzeSeo(url: string) {
  try {
    // Fetch the website content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SEO-Inspector-Bot/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();

    // Extract basic SEO elements
    const title = extractTag(html, "title");
    const metaDescription = extractMetaTag(html, "description");
    const h1Tags = extractAllTags(html, "h1");
    const h2Tags = extractAllTags(html, "h2");
    const imgTags = extractAllImgTags(html);

    // Prepare data for AI analysis
    const seoData = {
      url,
      title,
      metaDescription,
      h1Count: h1Tags.length,
      h1Tags: h1Tags.slice(0, 5), // Limit to first 5 for brevity
      h2Count: h2Tags.length,
      h2Tags: h2Tags.slice(0, 5), // Limit to first 5 for brevity
      imgCount: imgTags.length,
      imagesWithoutAlt: imgTags.filter((img) => !img.alt).length,
      wordCount: countWords(stripHtml(html)),
      hasCanonical: html.includes('rel="canonical"'),
      hasSitemap: html.toLowerCase().includes("sitemap"),
      hasRobotsTxt: html.toLowerCase().includes("robots.txt"),
      hasSchema:
        html.includes("application/ld+json") || html.includes("itemtype="),
      hasFavicon:
        html.includes('rel="icon"') || html.includes('rel="shortcut icon"'),
      hasViewport: html.includes('name="viewport"'),
      hasHttps: url.startsWith("https://"),
    };

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an SEO expert assistant. Analyze the website data and provide SEO recommendations.",
            },
            {
              role: "user",
              content: `
              Analyze this website's SEO data and provide a assessment with scores, issues, and recommendations:
              ${JSON.stringify(seoData, null, 2)}
              
              Return only a JSON object with the following structure:
              {
                "metaTagsScore": number (0-100),
                "contentScore": number (0-100),
                "performanceScore": number (0-100),
                "mobileScore": number (0-100),
                "issues": [
                  {
                    "title": string,
                    "description": string,
                    "severity": "high" | "medium" | "low"
                  }
                ],
                "recommendations": [
                  {
                    "title": string,
                    "description": string,
                    "impact": "high" | "medium" | "low"
                  }
                ],
                "metaTagsDetails": [
                  {
                    "name": string,
                    "value": string,
                    "status": "good" | "warning" | "bad"
                  }
                ],
                "contentDetails": [
                  {
                    "name": string,
                    "value": string,
                    "status": "good" | "warning" | "bad"
                  }
                ],
                "technicalDetails": [
                  {
                    "name": string,
                    "value": string,
                    "status": "good" | "warning" | "bad"
                  }
                ]
              }
              
              Provide detailed, actionable recommendations. Be specific about what needs to be improved and how.
            `,
            },
          ],
          max_tokens: 2000,
        }),
      }
    );

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    let content = openaiData.choices[0].message.content.trim();

    // Remove potential Markdown code block
    if (content.startsWith("```json")) {
      content = content.slice(7, -3).trim(); // Remove ```json and ```
    }
    console.log(content);
    const analysisResult = JSON.parse(content);

    return analysisResult;
  } catch (error) {
    console.error("Error analyzing SEO:", error);

    // Return a fallback response with error information
    return {
      metaTagsScore: 0,
      contentScore: 0,
      performanceScore: 0,
      mobileScore: 0,
      issues: [
        {
          title: "Error analyzing website",
          description: `We encountered an error while analyzing this website: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          severity: "high",
        },
      ],
      recommendations: [
        {
          title: "Check website accessibility",
          description:
            "Make sure the website is publicly accessible and not blocking our crawler.",
          impact: "high",
        },
      ],
      metaTagsDetails: [],
      contentDetails: [],
      technicalDetails: [],
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
