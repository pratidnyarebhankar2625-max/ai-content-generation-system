import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// By default, try to use Google Generative AI (Gemini) if the key is present.
// Fallback to OpenAI if that key is present.


export async function POST(req: Request) {
  try {
    const { prompt, template, context, messages, isContinue } = await req.json();

    // Determine which provider to use based on env variables
    const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    // Combine prompt and context into a single prompt for the model
    let systemPrompt = `You are an expert AI writing assistant. Your task is to generate premium, highly professional content based on the user's prompt and the selected template: ${template}.
CRITICAL INSTRUCTIONS:
1. UNDERSTAND INTENT & BE COMPLETE: Produce complete, professional content. NEVER stop in the middle of a sentence or paragraph. NEVER leave headings without content. NEVER output placeholders unless explicitly requested. NEVER summarize unless requested.
2. CONTINUOUS GENERATION: Do NOT intentionally shorten the response. Continue naturally until the requested content is completely finished.
3. LENGTH REQUIREMENTS:
- Blog: Minimum 1200+ words. Include Title, Meta Description, Introduction, Multiple detailed sections, Conclusion, CTA.
- Email: Complete email including Subject, Greeting, Body, Closing, Signature.
- Script: Based on requested duration (e.g., 10 minute script = 1500-1800 words). Include Opening Hook, Scene descriptions, Dialogue, Narration, Transitions, Ending.
- Product Description: Product title, Description, Benefits, Features, CTA.
- Social Media: Tailored to the platform (Instagram, LinkedIn, Twitter/X, Facebook) following best practices.
- Article: 1500-3000 words.
- Report: As detailed as necessary.
4. FORMATTING: ALWAYS use clean Markdown. Use Headings, Subheadings, Bullet lists, Numbered lists, and Tables when appropriate. Code blocks only when requested. Separate sections with proper spacing. NEVER return one giant paragraph.`;

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
      // Free model provided by OpenRouter (specified to avoid routing to content safety models)
      model = openrouter("google/gemma-4-26b-a4b-it:free");
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
          mockText = `# The Complete Guide to ${prompt}\n\nWelcome to this comprehensive overview! In today's fast-paced world, understanding the nuances of ${prompt} has never been more important. Let's dive into the details.\n\n## Introduction\n\n${paragraph1}\n\n## Deep Dive into the Facts\n\n${paragraph2}\n\n### Key Takeaways\n\n* **Core Definition**: ${wikiParagraphs[0] || "This topic is multifaceted and requires deep understanding."}\n* **Important Context**: ${wikiParagraphs[1] || "Contextualizing this information helps apply it to real-world scenarios."}\n* **Practical Strategy**: Always refer to verified sources when researching this topic.\n\n## Conclusion\n\n${paragraph3 || "To summarize, this is a topic that continues to evolve. Stay curious and keep learning!"}\n\n_Note: To unlock real AI generation for FREE, go to openrouter.ai, get an API key, and add OPENROUTER_API_KEY=your_key to your .env.local file!_`;
        } else if (t.includes("email")) {
          mockText = `**Subject: Important Information Regarding ${prompt.substring(0, 40)}**\n\nDear [Name],\n\nI hope this email finds you well.\n\nI am reaching out to share some comprehensive details and context regarding ${prompt}. As we discussed, having the right information is crucial for our next steps.\n\nHere is the core overview:\n\n> *${paragraph1}*\n\nAdditionally, here are a few key points we must consider:\n\n* ${wikiParagraphs[0] || "This is a priority topic."}\n* ${wikiParagraphs[1] || "We need to align on the strategy."}\n\nPlease review this information and let me know if you need any further clarification on this subject before our next sync.\n\nBest regards,\n\n[Your Name]\n[Your Title]\n\n_Note: To unlock real AI generation for FREE, go to openrouter.ai, get an API key, and add OPENROUTER_API_KEY=your_key to your .env.local file!_`;
        } else if (t.includes("social") || t.includes("tweet") || t.includes("linkedin")) {
          mockText = `🌟 Did you know this about ${prompt}?\n\n${paragraph1.substring(0, 250)}...\n\nI found this absolutely fascinating! In our industry, staying ahead of these concepts is what sets us apart.\n\nWhat are your thoughts on this? Have you had any experience dealing with it? Let me know below! 👇\n\n#Trending #Insights #${prompt.replace(/ /g, "").substring(0, 15)} #ThoughtLeadership\n\n_Note: To unlock real AI generation for FREE, add OPENROUTER_API_KEY to your .env.local file!_`;
        } else {
          mockText = `## Generated Output: ${template}\n\n**Topic:** ${prompt}\n\n### Comprehensive Analysis:\n\n${wikiText}\n\n_Note: To unlock real AI generation for FREE, go to openrouter.ai, get an API key, and add OPENROUTER_API_KEY=your_key to your .env.local file!_`;
        }

        return new Response(JSON.stringify({ text: mockText, isTruncated: false }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ text: "Error connecting to the free Wikipedia fallback. Please provide an API key for reliable generation." }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }


    // Retrieve messages from the request or build from prompt
    let coreMessages: any[] = [];
    
    if (messages && messages.length > 0) {
      coreMessages = messages;
      // We know this is a continuation if there are previous messages, so instruct it to continue.
      systemPrompt += `\n\nThe user wants you to CONTINUE generating from where you left off. DO NOT repeat what you have already written. Start EXACTLY where the previous response ended seamlessly.`;
    } else {
      coreMessages = [{ role: "user", content: userPrompt }];
    }

    const result = await generateText({
      model,
      system: systemPrompt,
      messages: coreMessages,
      // @ts-ignore
      maxTokens: 6000,
      // @ts-ignore
      temperature: 0.7,
      // @ts-ignore
      topP: 0.95,
      // @ts-ignore
      frequencyPenalty: 0,
      // @ts-ignore
      presencePenalty: 0,
    });

    let finalResponse = result.text;
    const isTruncated = result.finishReason === 'length';

    if (isTruncated) {
      finalResponse += "\n\n[Response truncated — click Continue to generate the remaining content.]";
    }

    return Response.json({ text: finalResponse, isTruncated });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate content" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
