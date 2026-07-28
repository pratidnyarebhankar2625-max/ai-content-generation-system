import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// By default, try to use Google Generative AI (Gemini) if the key is present.
// Fallback to OpenAI if that key is present.

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { prompt, template, context } = await req.json();

    // Determine which provider to use based on env variables
    const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    // Combine prompt and context into a single prompt for the model
    let systemPrompt = `You are a helpful AI assistant. You are acting as a generator for the template: ${template}.
CRITICAL INSTRUCTION: You MUST format your entire response using ONLY valid HTML tags (like <h1>, <h2>, <p>, <strong>, <em>, <ul>, <ol>, <li>). Do NOT use Markdown format (such as ** or #). Return pure HTML without wrapping it in markdown code blocks.`;
    let userPrompt = `Here is the user's input:\n${prompt}\n\n`;

    if (context && Object.keys(context).length > 0) {
      userPrompt += `Additional Context provided by the user:\n`;
      for (const [key, value] of Object.entries(context)) {
        userPrompt += `- ${key}: ${value}\n`;
      }
    }

    let model;

    if (googleKey) {
      const google = createGoogleGenerativeAI({ apiKey: googleKey });
      model = google("gemini-1.5-pro-latest");
    } else if (openaiKey) {
      const openai = createOpenAI({ apiKey: openaiKey });
      model = openai("gpt-4-turbo");
    } else if (openRouterKey && openRouterKey.startsWith("sk-or")) {
      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openRouterKey,
      });
      // Free model provided by OpenRouter
      model = openrouter("openrouter/free");
    } else {
      // Fallback to Wikipedia API for real information without an API key
      try {
        // 1. Search Wikipedia for the prompt
        const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(prompt)}&utf8=&format=json`);
        const searchData = await searchRes.json();

        let wikiText = "";
        if (searchData?.query?.search?.length > 0) {
          // 2. Get the extract for the top result
          const title = searchData.query.search[0].title;
          const extractRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(title)}&format=json`);
          const extractData = await extractRes.json();
          const pages = extractData?.query?.pages;
          if (pages) {
            wikiText = (Object.values(pages)[0] as any)?.extract || "";
          }
        }

        if (!wikiText) {
          wikiText = `Unfortunately, we couldn't find specific information on "${prompt}". However, understanding the core concepts is crucial for success in this area.`;
        }

        // 3. Format the response based on the template
        let mockText = "";
        const t = template.toLowerCase();

        // Split wiki text into paragraphs to make it look like a generated article
        const wikiParagraphs = wikiText.split(". ").filter(p => p.length > 10).map(p => p + ".");
        const paragraph1 = wikiParagraphs.slice(0, 2).join(" ");
        const paragraph2 = wikiParagraphs.slice(2, 4).join(" ");
        const paragraph3 = wikiParagraphs.slice(4).join(" ");

        if (t.includes("blog") || t.includes("article") || t.includes("essay")) {
          mockText = `<h1>The Complete Guide to ${prompt}</h1><p>Welcome to this comprehensive overview! In today's fast-paced world, understanding the nuances of ${prompt} has never been more important. Let's dive into the details.</p><h2>Introduction</h2><p>${paragraph1}</p><h2>Deep Dive into the Facts</h2><p>${paragraph2}</p><h3>Key Takeaways</h3><ul><li><strong>Core Definition</strong>: ${wikiParagraphs[0] || "This topic is multifaceted and requires deep understanding."}</li><li><strong>Important Context</strong>: ${wikiParagraphs[1] || "Contextualizing this information helps apply it to real-world scenarios."}</li><li><strong>Practical Strategy</strong>: Always refer to verified sources when researching this topic.</li></ul><h2>Conclusion</h2><p>${paragraph3 || "To summarize, this is a topic that continues to evolve. Stay curious and keep learning!"}</p><p><em>Note: To unlock real AI generation for FREE, go to openrouter.ai, get an API key, and add OPENROUTER_API_KEY=your_key to your .env.local file!</em></p>`;
        } else if (t.includes("email")) {
          mockText = `<p><strong>Subject: Important Information Regarding ${prompt.substring(0, 40)}</strong></p><p>Dear [Name],</p><p>I hope this email finds you well.</p><p>I am reaching out to share some comprehensive details and context regarding ${prompt}. As we discussed, having the right information is crucial for our next steps.</p><p>Here is the core overview:</p><blockquote><p><em>${paragraph1}</em></p></blockquote><p>Additionally, here are a few key points we must consider:</p><ul><li>${wikiParagraphs[0] || "This is a priority topic."}</li><li>${wikiParagraphs[1] || "We need to align on the strategy."}</li></ul><p>Please review this information and let me know if you need any further clarification on this subject before our next sync.</p><p>Best regards,</p><p>[Your Name]<br>[Your Title]</p><p><em>Note: To unlock real AI generation for FREE, go to openrouter.ai, get an API key, and add OPENROUTER_API_KEY=your_key to your .env.local file!</em></p>`;
        } else if (t.includes("social") || t.includes("tweet") || t.includes("linkedin")) {
          mockText = `<p>🌟 Did you know this about ${prompt}?</p><p>${paragraph1.substring(0, 250)}...</p><p>I found this absolutely fascinating! In our industry, staying ahead of these concepts is what sets us apart.</p><p>What are your thoughts on this? Have you had any experience dealing with it? Let me know below! 👇</p><p>#Trending #Insights #${prompt.replace(/ /g, "").substring(0, 15)} #ThoughtLeadership</p><p><em>Note: To unlock real AI generation for FREE, add OPENROUTER_API_KEY to your .env.local file!</em></p>`;
        } else {
          mockText = `<h2>Generated Output: ${template}</h2><p><strong>Topic:</strong> ${prompt}</p><h3>Comprehensive Analysis:</h3><p>${wikiText}</p><p><em>Note: To unlock real AI generation for FREE, go to openrouter.ai, get an API key, and add OPENROUTER_API_KEY=your_key to your .env.local file!</em></p>`;
        }

        return new Response(JSON.stringify({ text: mockText }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ text: "<p>Error connecting to the free Wikipedia fallback. Please provide an API key for reliable generation.</p>" }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }


    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return Response.json({ text: result.text });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate content" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
