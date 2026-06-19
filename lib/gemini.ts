import { GoogleGenerativeAI } from "@google/generative-ai";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// Validate Gemini configuration
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  Gemini API key is not configured. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ── Resume Analysis ──────────────────────────────────────────────────────────

export async function analyzeResume(resumeText: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `You are an expert ATS resume analyzer. Analyze the provided resume and return a JSON object with:
- atsScore (0-100): ATS compatibility score
- skills: array of detected skills
- missingSkills: array of commonly expected skills not found
- strengths: array of resume strengths
- improvements: array of specific improvement suggestions
- summary: brief overall assessment
Return ONLY valid JSON.

Resume:
${resumeText}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  return JSON.parse(result.response.text());
}

// ── Job Match Score ──────────────────────────────────────────────────────────

export async function calculateJobMatch(
  candidateSkills: string[],
  jobRequirements: string,
  candidateExperience: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `You are a talent matching AI. Calculate match scores and return JSON with:
- overallScore (0-100): overall compatibility
- skillMatch (0-100): skills alignment score
- experienceMatch (0-100): experience alignment
- matchedSkills: array of matched skills
- missingSkills: array of required skills the candidate lacks
- recommendation: brief recommendation string
Return ONLY valid JSON.

Candidate Skills: ${candidateSkills.join(", ")}
Experience: ${candidateExperience}
Job Requirements: ${jobRequirements}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  return JSON.parse(result.response.text());
}

// ── Skill Gap Analysis ───────────────────────────────────────────────────────

export async function analyzeSkillGap(
  candidateSkills: string[],
  targetRole: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `You are a career development AI. Analyze skill gaps and return JSON with:
- missingSkills: array of {skill, priority: "high"|"medium"|"low", reason}
- suggestedCourses: array of {title, platform, url, duration}
- estimatedTimeToReady: string (e.g., "3-6 months")
- careerPath: array of milestone strings
Return ONLY valid JSON.

Current Skills: ${candidateSkills.join(", ")}
Target Role: ${targetRole}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  return JSON.parse(result.response.text());
}

// ── Career Chatbot ───────────────────────────────────────────────────────────

export async function careerChatCompletion(
  messages: { role: "user" | "assistant"; content: string }[]
) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `You are SkillBridge Career Advisor — an expert AI career coach. You help job seekers with:
- Resume writing and optimization
- Interview preparation and mock interviews
- Career path planning
- Salary negotiation advice
- Job search strategies
- Professional development
Be concise, practical, and encouraging. Use bullet points for clarity.`,
  });
  
  // Format messages for Gemini (map 'assistant' to 'model')
  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));
  
  const lastMessage = messages[messages.length - 1]?.content || "";

  const chat = model.startChat({
    history: history,
  });

  const result = await chat.sendMessage(lastMessage);
  return result.response.text();
}

// ── Job Description Generator ─────────────────────────────────────────────────

export async function generateJobDescription(jobInfo: {
  title: string;
  company: string;
  skills: string[];
  level: string;
  type: string;
  location: string;
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `You are an expert HR writer. Generate a professional job description and return JSON with:
- description: engaging job overview (2-3 paragraphs)
- responsibilities: array of 6-8 key responsibilities
- requirements: array of 5-7 requirements
- benefits: array of 4-6 benefits
Return ONLY valid JSON.

Create a job description for:
Title: ${jobInfo.title}
Company: ${jobInfo.company}
Required Skills: ${jobInfo.skills.join(", ")}
Level: ${jobInfo.level}
Type: ${jobInfo.type}
Location: ${jobInfo.location}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  return JSON.parse(result.response.text());
}
