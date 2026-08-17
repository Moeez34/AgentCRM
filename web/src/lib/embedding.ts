/**
 * Local AI utility functions for the web project.
 * Duplicates the logic from worker/src/ai.ts to avoid cross-package imports
 * that break Next.js Turbopack compilation (worker uses Node.js-only modules).
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(endpoint: string, body: any): Promise<any> {
  if (!OPENAI_KEY) throw new Error('OpenAI key missing');
  
  const response = await fetch(`https://api.openai.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
  }

  return response.json();
}

/**
 * Generates text embeddings (1536 dims) for RAG vector search.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_KEY) {
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 1536 }, (_, i) => {
      const x = Math.sin(hash + i) * 10000;
      return x - Math.floor(x);
    });
  }

  try {
    const data = await callOpenAI('/embeddings', {
      model: 'text-embedding-3-small',
      input: text,
    });
    return data.data[0].embedding;
  } catch (error: any) {
    console.error('[AI Embedding Error] Fallback to mock vector:', error.message);
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }
}

/**
 * Researches a website (Scrapes/Mocks and summarizes company info)
 */
export async function researchCompany(website: string, companyName: string): Promise<{
  summary: string;
  technologies: string;
  employeeCount: number;
  rawScrapedData: any;
}> {
  console.log(`[AI] Researching website: ${website} (${companyName})`);

  if (!OPENAI_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const techs = ['React', 'Next.js', 'PostgreSQL', 'AWS', 'TypeScript', 'Node.js'];
    const mockTech = techs.sort(() => 0.5 - Math.random()).slice(0, 3).join(', ');
    const mockEmployees = Math.floor(Math.random() * 200) + 15;
    return {
      summary: `${companyName} is an emerging platform offering technology services, focusing on modern scaling architectures, cloud deployment, and automated systems integration.`,
      technologies: mockTech,
      employeeCount: mockEmployees,
      rawScrapedData: {
        metaTitle: `${companyName} | Enterprise Scaling & Solutions`,
        metaDescription: `Discover how ${companyName} is revolutionizing infrastructure automation.`,
        scrapedLinks: [`https://${website}/about`, `https://${website}/pricing`],
        scrapedAt: new Date().toISOString(),
      },
    };
  }

  try {
    const res = await callOpenAI('/chat/completions', {
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an elite sales researcher. Return a JSON object with keys: "summary" (one paragraph summarizing what the company does based on name/website), "technologies" (comma separated list of probable web technologies they use), and "employeeCount" (a realistic estimated integer of company employees, e.g. 50).'
        },
        {
          role: 'user',
          content: `Research company name: ${companyName}, website: ${website}`
        }
      ]
    });

    const parsed = JSON.parse(res.choices[0].message.content);
    return {
      summary: parsed.summary,
      technologies: parsed.technologies,
      employeeCount: Number(parsed.employeeCount) || 10,
      rawScrapedData: {
        scrapedAt: new Date().toISOString(),
        llmInferred: true,
      }
    };
  } catch (error: any) {
    console.error('[AI Research Error] Fallback to mock:', error.message);
    return {
      summary: `Failed to fetch live info for ${companyName}. The website is offline or requires authentication.`,
      technologies: 'React, Node.js',
      employeeCount: 25,
      rawScrapedData: { error: error.message },
    };
  }
}

/**
 * Scores a lead (0-100) based on company research and target fit
 */
export async function scoreLead(
  companyInfo: string,
  technologies: string,
  employeeCount: number
): Promise<{ score: number; reasoning: string }> {
  console.log('[AI] Scoring lead based on research...');

  if (!OPENAI_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const baseScore = Math.min(95, Math.max(10, Math.floor(employeeCount / 2) + 30));
    return {
      score: baseScore,
      reasoning: `Lead scored ${baseScore}/100. Strong fit based on employee headcount (${employeeCount} employees) and usage of core stack technologies: ${technologies}. Ready for targeted outbound sequence.`,
    };
  }

  try {
    const res = await callOpenAI('/chat/completions', {
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an automated lead scoring agent. Evaluate the lead fit on a scale of 0 to 100, where 100 is a perfect enterprise customer (uses cloud infrastructure, has > 10 employees, scalable tech stack). Return a JSON object with: "score" (number) and "reasoning" (string explaining the score).'
        },
        {
          role: 'user',
          content: `Evaluate Company profile:\nSummary: ${companyInfo}\nTech: ${technologies}\nEmployees: ${employeeCount}`
        }
      ]
    });

    const parsed = JSON.parse(res.choices[0].message.content);
    return {
      score: Number(parsed.score) || 50,
      reasoning: parsed.reasoning || 'Default scoring reasoning.',
    };
  } catch (error: any) {
    console.error('[AI Scoring Error] Fallback to mock:', error.message);
    return {
      score: 55,
      reasoning: 'Fallback score assigned due to API timeout.',
    };
  }
}

/**
 * Generates customized outbound outreach email text
 */
export async function generateOutreach(
  leadName: string,
  companyName: string,
  researchSummary: string
): Promise<{ subject: string; body: string }> {
  console.log(`[AI] Generating outreach for ${leadName} (${companyName})...`);

  if (!OPENAI_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      subject: `Accelerating growth at ${companyName}`,
      body: `Hi ${leadName},\n\nI was reviewing ${companyName}'s current setup, especially your focus on scaling architectures. I notice you guys are moving fast in that space.\n\nWe build tools that automate CRM states, pipeline execution, and custom outreach templates. Given your focus, I think this could streamline your team's workflow.\n\nWould you have 10 minutes next Tuesday for a quick introductory chat?\n\nBest regards,\nAgentCRM Team`,
    };
  }

  try {
    const res = await callOpenAI('/chat/completions', {
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales representative. Generate a highly personalized cold outreach email. It should feel conversational, professional, and NOT robotic. Return a JSON object with keys: "subject" and "body" (keep the body under 150 words and use double newlines for line breaks).'
        },
        {
          role: 'user',
          content: `Write to: ${leadName}\nCompany: ${companyName}\nResearch Summary: ${researchSummary}`
        }
      ]
    });

    const parsed = JSON.parse(res.choices[0].message.content);
    return {
      subject: parsed.subject || 'Quick question',
      body: parsed.body || 'Hi,\n\nHope you are well.',
    };
  } catch (error: any) {
    console.error('[AI Outreach Error] Fallback to mock:', error.message);
    return {
      subject: `Intro: Collaboration with ${companyName}`,
      body: `Hi ${leadName},\n\nReaching out because I saw your work at ${companyName}. I'd love to connect and share some insights about our automation tools.\n\nBest,\nSales Team`,
    };
  }
}

/**
 * Analyzes an inbound customer email reply
 */
export async function analyzeInboundReply(
  subject: string,
  body: string
): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; actionItems: string; updateCrmStatus: string }> {
  console.log('[AI] Analyzing inbound email reply...');

  if (!OPENAI_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const lowerBody = body.toLowerCase();
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let updateCrmStatus = 'REPLIED';
    let actionItems = 'Reply received, waiting for manual follow up.';

    if (lowerBody.includes('yes') || lowerBody.includes('interested') || lowerBody.includes('calendar') || lowerBody.includes('time') || lowerBody.includes('call')) {
      sentiment = 'positive';
      updateCrmStatus = 'REPLIED';
      actionItems = 'Schedule meeting request. Action: Send calendar link.';
    } else if (lowerBody.includes('no') || lowerBody.includes('stop') || lowerBody.includes('remove') || lowerBody.includes('unsubscribe')) {
      sentiment = 'negative';
      updateCrmStatus = 'ARCHIVED';
      actionItems = 'Do not contact. Action: Mark as unsubscribed.';
    }

    return {
      sentiment,
      actionItems,
      updateCrmStatus,
    };
  }

  try {
    const res = await callOpenAI('/chat/completions', {
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an email analysis agent. Classify the reply. Return a JSON object with: "sentiment" (one of: "positive", "negative", "neutral"), "actionItems" (string explaining what to do next), and "updateCrmStatus" (either "REPLIED" or "ARCHIVED" if unsubscribed).'
        },
        {
          role: 'user',
          content: `Inbound Email:\nSubject: ${subject}\nBody: ${body}`
        }
      ]
    });

    const parsed = JSON.parse(res.choices[0].message.content);
    return {
      sentiment: parsed.sentiment || 'neutral',
      actionItems: parsed.actionItems || 'Review email manually.',
      updateCrmStatus: parsed.updateCrmStatus || 'REPLIED',
    };
  } catch (error: any) {
    console.error('[AI Inbound Analysis Error] Fallback to mock:', error.message);
    return {
      sentiment: 'neutral',
      actionItems: 'Manual review required due to processing failure.',
      updateCrmStatus: 'REPLIED',
    };
  }
}
