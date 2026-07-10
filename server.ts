import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const DEBUG_LOG_FILE = "/tmp/vercel_debug.log";
function logDebug(msg: string) {
  try {
    fs.appendFileSync(DEBUG_LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`, "utf-8");
  } catch (e) {}
}

logDebug("Server module loaded. VERCEL=" + process.env.VERCEL + ", NODE_ENV=" + process.env.NODE_ENV);

process.on("uncaughtException", (err) => {
  logDebug(`Uncaught Exception: ${err?.message || err}\nStack: ${err?.stack}`);
});

process.on("unhandledRejection", (reason) => {
  logDebug(`Unhandled Rejection: ${reason}`);
});

const app = express();
const PORT = 3000;

let defaultAi: GoogleGenAI | null = null;

function getAiClient(customApiKey?: string) {
  const parsedApiKey = (customApiKey && customApiKey.trim() !== "" && customApiKey !== "null" && customApiKey !== "undefined") ? customApiKey.trim() : undefined;
  
  if (parsedApiKey) {
    return new GoogleGenAI({
      apiKey: parsedApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  if (!defaultAi) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("[Sahur AI] WARNING: GEMINI_API_KEY is not defined in the environment. Server is starting but AI requests will require a user-provided custom API key in the frontend.");
    }
    defaultAi = new GoogleGenAI({
      apiKey: key || "MISSING_GEMINI_API_KEY_FALLBACK",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return defaultAi;
}

// Helper function to call generateContent with automatic retry and model fallback
async function generateContentWithFallback(params: any, customApiKey?: string, retries = 2, delayMs = 1000) {
  let requestedModel = params.model || "gemini-3.5-flash";
  
  if (requestedModel === "gemini-2.5-flash" || requestedModel === "gemini-1.5-flash") {
    requestedModel = "gemini-3.5-flash";
  }

  const modelsToTry = [
    requestedModel,
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ];

  // Deduplicate models to try
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;

  const client = getAiClient(customApiKey);

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Sahur AI] Calling ${model} (Attempt ${attempt}/${retries}) ${customApiKey ? 'with custom API key' : 'with default API key'}...`);
        const response = await client.models.generateContent({
          ...params,
          model,
        });
        console.log(`[Sahur AI] Success with model: ${model}`);
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient = errMsg.includes("503") || 
                            errMsg.includes("UNAVAILABLE") || 
                            errMsg.includes("high demand") || 
                            errMsg.includes("429") || 
                            errMsg.includes("RESOURCE_EXHAUSTED");
        const isAuthError = errMsg.includes("API_KEY_INVALID") || 
                            errMsg.includes("API key not valid") || 
                            errMsg.includes("403") || 
                            errMsg.includes("Forbidden") ||
                            errMsg.includes("invalid key") ||
                            err?.status === 403 ||
                            err?.status === 401;

        console.warn(`[Sahur AI] Failed with model ${model} on attempt ${attempt}: ${errMsg}`);

        if (isAuthError) {
          console.error(`[Sahur AI] Authentication error detected, aborting immediately: ${errMsg}`);
          throw err;
        }

        if (isTransient && attempt < retries) {
          console.log(`[Sahur AI] Retrying in ${delayMs * attempt}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        } else {
          // Move to next model if we get a non-transient error or we exhausted retries
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content with any model");
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Paths
const DATA_DIR = process.env.VERCEL ? "/tmp/server_data" : path.join(process.cwd(), "server_data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const KB_FILE = path.join(process.cwd(), "server", "legal_kb.json");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default state of the database
const DEFAULT_DB = {
  vault: [] as any[],
  saved_analyses: [] as any[],
  chats: {} as Record<string, any[]>,
};

// Database persistence helper
function readDB() {
  logDebug("readDB() called");
  try {
    if (!fs.existsSync(DATA_DIR)) {
      logDebug("readDB() - DATA_DIR does not exist, creating: " + DATA_DIR);
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      logDebug("readDB() - DB_FILE exists, reading " + DB_FILE);
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    } else {
      logDebug("readDB() - DB_FILE does not exist");
    }
  } catch (error: any) {
    logDebug("readDB() Error: " + error.message + "\nStack: " + error.stack);
    console.error("Error reading database file, resetting to default:", error);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

function writeDB(data: typeof DEFAULT_DB) {
  logDebug("writeDB() called");
  try {
    if (!fs.existsSync(DATA_DIR)) {
      logDebug("writeDB() - DATA_DIR does not exist, creating: " + DATA_DIR);
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    logDebug("writeDB() - writing to " + DB_FILE);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error: any) {
    logDebug("writeDB() Error: " + error.message + "\nStack: " + error.stack);
    console.error("Error writing to database file:", error);
  }
}

// Load Curated Legal KB
function loadKB() {
  try {
    if (fs.existsSync(KB_FILE)) {
      const data = fs.readFileSync(KB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading legal KB:", error);
  }
  return [];
}

// RAG Search Helper (Keyword overlap matcher)
function retrieveLegalDocuments(query: string, domain?: string, limit = 3) {
  const kb = loadKB();
  const queryLower = query.toLowerCase();

  // Keyword tokenization
  const tokens = queryLower.match(/\b\w{3,}\b/g) || [];

  const scoredKb = kb.map((doc: any) => {
    let score = 0;

    // Direct domain match gets bonus
    if (domain && doc.domain.toLowerCase() === domain.toLowerCase()) {
      score += 5;
    }

    // Keyword hits
    tokens.forEach((token) => {
      const textMatch = (doc.text.toLowerCase().match(new RegExp(`\\b${token}\\b`, "g")) || []).length;
      const titleMatch = (doc.title.toLowerCase().match(new RegExp(`\\b${token}\\b`, "g")) || []).length;
      const statuteMatch = (doc.statute.toLowerCase().match(new RegExp(`\\b${token}\\b`, "g")) || []).length;

      score += textMatch * 1;
      score += titleMatch * 2;
      score += statuteMatch * 3;
    });

    return { ...doc, searchScore: score };
  });

  // Filter out zero-score items unless they match the domain directly
  const candidates = scoredKb.filter((doc) => doc.searchScore > 0 || (domain && doc.domain.toLowerCase() === domain.toLowerCase()));

  // Sort by score descending
  candidates.sort((a, b) => b.searchScore - a.searchScore);

  return candidates.slice(0, limit);
}

// --- API ROUTES ---

app.get("/api/debug-logs", (req, res) => {
  try {
    if (fs.existsSync(DEBUG_LOG_FILE)) {
      return res.type("text/plain").send(fs.readFileSync(DEBUG_LOG_FILE, "utf-8"));
    }
    return res.type("text/plain").send("No logs found at " + DEBUG_LOG_FILE);
  } catch (e: any) {
    return res.status(500).type("text/plain").send("Error reading logs: " + e.message);
  }
});

// 1. Legal Vault - Get Documents
app.get("/api/vault", (req, res) => {
  logDebug("GET /api/vault called");
  const db = readDB();
  res.json(db.vault);
});

// 2. Legal Vault - Upload & Analyze Clauses
app.post("/api/vault/upload", async (req, res) => {
  try {
    const { name, type, content, size } = req.body;
    const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;

    if (!name || !content) {
      return res.status(400).json({ error: "Missing required fields: name, content" });
    }

    // Determine domain from file name/type or guess
    const textSample = content.slice(0, 4000);

    const db = readDB();

    // Use Gemini to perform Clause Intelligence Extraction
    const systemPrompt = `You are a state-of-the-art legal clause extraction assistant specializing in Indian Civil, Constitutional, Tenancy, Consumer, and Labour Law.
Your goal is to parse the uploaded document and extract critical clauses (notice period, deposit, responsibilities, penalties, exit criteria, terms of termination) and check them against official Indian statutes.
You MUST output raw JSON matching the requested schema. No markdown wrappers. No chat filler.`;

    const extractionPrompt = `Please extract and analyze key clauses from this document:
File Name: ${name}
Document Type Guess: ${type || "Unspecified Agreement"}

Document Content:
"""
${textSample}
"""

Analyze these clauses and map them against relevant Indian law:
1. Identify 3-4 highly critical clauses (e.g. security deposits, exit notice periods, terminations, penalties, work obligations).
2. For each, determine if it is:
   - "lawful" (fully compliant with Indian laws/precedents)
   - "unlawful" (violates standard regulations, e.g. residential security deposits exceeding 2 months in Model Tenancy Act, zero notice retrenchments, maternity dismissal, etc.)
   - "suspicious" (unbalanced or potentially unfair under Section 2(47) of Consumer Protection Act or labor standards).
3. Provide a brief plain-language explanation of why and reference the specific statute where possible.
4. Set an overallVerdict: "good_to_go" (no illegal clauses), "review_needed" (unfair or suspicious clauses found), or "critical_issues" (unlawful clauses violating mandatory legal standards).`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: extractionPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["documentName", "documentType", "overallVerdict", "clauses"],
          properties: {
            documentName: { type: Type.STRING },
            documentType: { type: Type.STRING },
            overallVerdict: { type: Type.STRING },
            clauses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["topic", "text", "legalStanding", "explanation"],
                properties: {
                  topic: { type: Type.STRING, description: "Topic of the clause, e.g. Notice Period, Security Deposit, Overtime" },
                  text: { type: Type.STRING, description: "Specific snippet/summary of the clause in the text" },
                  legalStanding: { type: Type.STRING, description: "Must be 'lawful', 'unlawful', or 'suspicious'" },
                  explanation: { type: Type.STRING, description: "Plain-English explanation of why this standing applies, referencing statutory bounds" },
                },
              },
            },
          },
        },
      },
    }, customApiKey);

    const extractionResult = JSON.parse(response.text?.trim() || "{}");

    const newDoc = {
      id: "doc_" + Date.now(),
      name,
      type: extractionResult.documentType || type,
      size,
      uploadedAt: new Date().toISOString(),
      content,
      extractedData: extractionResult,
    };

    db.vault.push(newDoc);
    writeDB(db);

    res.json(newDoc);
  } catch (error: any) {
    console.error("Error uploading/extracting document:", error);
    res.status(500).json({ error: error.message || "Failed to analyze document" });
  }
});

// 3. Legal Vault - Delete Document
app.delete("/api/vault/:id", (req, res) => {
  const db = readDB();
  const index = db.vault.findIndex((d: any) => d.id === req.params.id);

  if (index !== -1) {
    db.vault.splice(index, 1);
    writeDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Document not found" });
});

// 4. Ingest and Analyze Scenario (Core RAG analysis pipeline)
app.post("/api/analyze", async (req, res) => {
  try {
    const { scenario, vaultDocIds = [], clarifyingAnswers = [], domain: selectedDomain } = req.body;
    const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;

    if (!scenario || scenario.trim().length < 5) {
      return res.status(400).json({ error: "Please provide a valid scenario description." });
    }

    // Determine domain first via a quick classification heuristic, or let Gemini classify
    let domainGuess = selectedDomain || "";
    if (!domainGuess) {
      const lower = scenario.toLowerCase();
      if (lower.includes("landlord") || lower.includes("tenant") || lower.includes("rent") || lower.includes("lease") || lower.includes("eviction") || lower.includes("security deposit")) {
        domainGuess = "tenancy";
      } else if (lower.includes("salary") || lower.includes("employer") || lower.includes("boss") || lower.includes("wages") || lower.includes("maternity") || lower.includes("termination") || lower.includes("job") || lower.includes("dismissal") || lower.includes("labor") || lower.includes("labour")) {
        domainGuess = "workplace";
      } else if (lower.includes("police") || lower.includes("arrest") || lower.includes("detain") || lower.includes("handcuff") || lower.includes("fir") || lower.includes("warrant") || lower.includes("jail")) {
        domainGuess = "policing";
      } else if (lower.includes("product") || lower.includes("refund") || lower.includes("defective") || lower.includes("warranty") || lower.includes("shop") || lower.includes("service") || lower.includes("online shopping") || lower.includes("fake")) {
        domainGuess = "consumer";
      }
    }

    // 1. RAG Step: Retrieve matched legal codes from local KB
    const retrievedDocs = retrieveLegalDocuments(scenario, domainGuess, 3);
    const groundingText = retrievedDocs
      .map((d) => `Statute/Authority: ${d.statute} (${d.section})\nTitle: ${d.title}\nLaw Text: ${d.text}`)
      .join("\n\n");

    // 2. Vault Document Context (If the user linked any documents from their vault)
    const db = readDB();
    const linkedVaultDocs = db.vault.filter((doc: any) => vaultDocIds.includes(doc.id));
    const vaultContext = linkedVaultDocs
      .map((doc: any) => {
        const clausesText = doc.extractedData?.clauses
          ?.map((c: any) => `- Topic: ${c.topic}\n  Text in document: ${c.text}\n  Standing: ${c.legalStanding}\n  Reasoning: ${c.explanation}`)
          .join("\n");
        return `Linked Vault Document: ${doc.name} (${doc.type})\nExtracted Key Clauses:\n${clausesText}\n\nFull Document Excerpt:\n${doc.content.slice(0, 3000)}`;
      })
      .join("\n\n");

    // Formulate system prompt
    const systemPrompt = `You are "Sahur AI", an AI-powered Constitutional Rights & Legal Compliance reasoning agent for India.
Your mission is to provide exceptionally clear, grounded, and explainable legal evaluations for everyday citizens.
You handle 4 major domains:
1. Tenancy: Rights regarding rental agreements, illegal evictions, rent control, and deposits.
2. Workplace: Rights regarding job protection, unpaid wages, illegal terminations, POSH, and maternity.
3. Policing: Constitutional safeguards (Articles 20, 21, 22), illegal detentions, guidelines on arrest, rights of women, and search rules.
4. Consumer Rights: Defective goods, refund obligations, deceptive services, and unfair commercial practices under CoPRA 2019.

Your core value is EXPLICIT GROUNDING. Avoid vague summaries or mock sections. Reference actual Indian laws, guidelines (e.g. D.K. Basu, Supreme Court rules), and articles of the Constitution of India.

CRITICAL INSTRUCTION FOR TONE AND ANTI-SLOP:
- STRICTLY ELIMINATE ALL CONVERSATIONAL FLUFF AND AI SLOP.
- Do NOT use introductory filler such as "Sure, I can help you with that", "Based on my analysis", "Here is your output", or similar conversational lead-ins in any string field.
- Do NOT use concluding summaries or conversational sign-offs in your outputs.
- Force a direct, statutory-grounded, citizen-actionable legal tone.
- Ensure retrieved codes are integrated with precise articles/sections of the Constitution of India and relevant statutory acts. Every legal assessment, explanation, or summary must begin immediately and directly with the statutory analysis.

Handling Low Information:
If the user scenario lacks sufficient detail to produce a highly confident verdict (e.g., they just say "landlord kicked me out" without mentioning written agreements, notices, or reasons), you must:
1. Set "confidence" below 60.
2. Formulate 2-3 specific, interactive "missing_info" follow-up questions to help them expand their facts.
3. Provide a preliminary evaluation, but explicitly note that further details are needed for a secure opinion.

Verdict definitions:
- "compliant": Stated circumstances fully align with statutory protections.
- "needs_review": Circumstances contain suspicious elements or unbalanced terms, but no outright illegal act is confirmed.
- "violation": Stated circumstances confirm a direct breach of Indian statutory or constitutional law (e.g., eviction without notice, illegal retrenchment, arbitrary arrest without Magistrate production, refusing a cash receipt).

Your output MUST be a strict, raw JSON payload with the exact schema requested. Do not include markdown formatting or extra text.`;

    // Formulate analysis prompt
    const analysisPrompt = `Analyze the following user situation and output an explainable compliance assessment.

User Scenario Stated:
"""
${scenario}
"""

${clarifyingAnswers.length > 0 ? `User's Clarifications to previous questions:\n${clarifyingAnswers.map((a: any) => `Q: ${a.question}\nA: ${a.answer}`).join("\n")}\n\n` : ""}

Retrieved Grounding Statutes/Precedents (RAG):
"""
${groundingText}
"""

Linked Personal Vault Documents Context:
"""
${vaultContext || "No document linked."}
"""

Evaluate this and respond in JSON with:
1. "domain": tenancy, workplace, policing, or consumer.
2. "confidence": value from 0 to 100.
3. "missing_info": array of strings (questions if details are insufficient, e.g. "Did you receive a written notice?", "Is the property residential or commercial?", "Has the police officer prepared an arrest memo?").
4. "verdict": "compliant" | "needs_review" | "violation".
5. "score": compliance safety rating from 0 to 100 (where 100 is fully safe/compliant, and 0 is severe unlawful violation).
6. "summary": Concise, clear, human-centered summary of the situation's legal standing.
7. "rights_heatmap": List of constitutional/fundamental rights impacted. Each must have:
   - "rightName": e.g., "Right to Personal Liberty", "Right to Quiet Enjoyment", "Right to Redressal"
   - "status": "secure" | "compromised" | "violated"
   - "description": Plain language statement of how this right is affected.
   - "constitutionalRef": The article or statutory reference (e.g., "Article 21", "CoPRA Section 2(9)")
8. "explainability_tree": A step-by-step audit trail or timeline demonstrating how the legal logic was computed. Each node should have:
   - "label": Clear title of the check (e.g., "Written Contract Verification", "Eviction Notice Period", "Statutory Security Limit")
   - "status": "pass" | "info" | "fail"
   - "description": What was evaluated and found
   - "legalBasis": The specific act or act section supporting this check
9. "applicable_laws": List of relevant statutory provisions. Each must have:
   - "statute": Name of Act
   - "section": Section or Article number
   - "text": Brief summary of what the provision says
   - "explanation": Why it is directly applicable to the user's specific scenario.
10. "evidence_checklist": Concrete list of evidence items/documents the user should gather (e.g. rent receipts, termination letter, bank statements, call recordings, emails).
11. "authority_recommendation": Escalation guide. Must have:
    - "name": The correct specific grievance body (e.g., "Rent Authority under Rent Control Court", "District Consumer Disputes Redressal Commission", "Maternity Benefit Inspector")
    - "description": Description of this authority
    - "stepByStepGrievance": Array of 3-4 specific sequential steps the citizen should take to submit a grievance.`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: analysisPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["domain", "confidence", "missing_info", "verdict", "score", "summary", "rights_heatmap", "explainability_tree", "applicable_laws", "evidence_checklist", "authority_recommendation"],
          properties: {
            domain: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            missing_info: { type: Type.ARRAY, items: { type: Type.STRING } },
            verdict: { type: Type.STRING },
            score: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            rights_heatmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["rightName", "status", "description", "constitutionalRef"],
                properties: {
                  rightName: { type: Type.STRING },
                  status: { type: Type.STRING },
                  description: { type: Type.STRING },
                  constitutionalRef: { type: Type.STRING },
                },
              },
            },
            explainability_tree: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["label", "status", "description", "legalBasis"],
                properties: {
                  label: { type: Type.STRING },
                  status: { type: Type.STRING },
                  description: { type: Type.STRING },
                  legalBasis: { type: Type.STRING },
                },
              },
            },
            applicable_laws: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["statute", "section", "text", "explanation"],
                properties: {
                  statute: { type: Type.STRING },
                  section: { type: Type.STRING },
                  text: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
              },
            },
            evidence_checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
            authority_recommendation: {
              type: Type.OBJECT,
              required: ["name", "description", "stepByStepGrievance"],
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                stepByStepGrievance: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
          },
        },
      },
    }, customApiKey);

    const analysisResult = JSON.parse(response.text?.trim() || "{}");

    // Save this analysis for the user's dashboard history
    const savedAnalysis = {
      id: "analysis_" + Date.now(),
      createdAt: new Date().toISOString(),
      scenario,
      vaultDocIds,
      clarifyingAnswers,
      result: analysisResult,
    };

    db.saved_analyses.push(savedAnalysis);
    writeDB(db);

    res.json(savedAnalysis);
  } catch (error: any) {
    console.error("Error evaluating legal scenario:", error);
    res.status(500).json({ error: error.message || "Failed to analyze scenario" });
  }
});

// 5. Saved Analyses History
app.get("/api/analyses", (req, res) => {
  const db = readDB();
  res.json(db.saved_analyses);
});

// Delete specific analysis from history
app.delete("/api/analyses/:id", (req, res) => {
  const db = readDB();
  const index = db.saved_analyses.findIndex((a: any) => a.id === req.params.id);

  if (index !== -1) {
    db.saved_analyses.splice(index, 1);
    writeDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Analysis not found" });
});

// 6. What If Legal Simulator
app.post("/api/simulate", async (req, res) => {
  try {
    const { scenario, alteredFacts, vaultDocIds = [] } = req.body;
    const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;

    if (!scenario || !alteredFacts) {
      return res.status(400).json({ error: "Missing required fields: scenario, alteredFacts" });
    }

    const systemPrompt = `You are a legal scenario simulation specialist.
Your task is to take an initial legal scenario, apply a set of altered facts (the "What If?" condition), and compare the legal outcomes.
You MUST output raw JSON comparing the two states. No markdown wrappers.`;

    const simulationPrompt = `Initial Scenario:
"""
${scenario}
"""

Altered Facts ("What If?" Condition):
"""
${alteredFacts}
"""

Perform a comparative analysis of how these altered facts shift the compliance standing in India:
1. What was the initial verdict and what is the new projected verdict? ("compliant", "needs_review", or "violation")
2. How does the safety score shift? (0 to 100)
3. Explain exactly why this shift happens. Which specific statutory boundary is now crossed or satisfied?
4. How do the applicable constitutional rights or laws shift? Provide a summary of the difference.`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: simulationPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["initialVerdict", "simulatedVerdict", "initialScore", "simulatedScore", "shiftExplanation", "rightsImpactDifference", "recommendationShift"],
          properties: {
            initialVerdict: { type: Type.STRING, description: "Projected verdict before alterations" },
            simulatedVerdict: { type: Type.STRING, description: "Projected verdict after alterations" },
            initialScore: { type: Type.INTEGER },
            simulatedScore: { type: Type.INTEGER },
            shiftExplanation: { type: Type.STRING, description: "Clear explanation of how the legal reasoning shifts with these altered parameters." },
            rightsImpactDifference: { type: Type.STRING, description: "How rights shift from violated/compromised to secure or vice-versa." },
            recommendationShift: { type: Type.STRING, description: "Does the user still need to approach the same authority? What is the new recommended action?" },
          },
        },
      },
    }, customApiKey);

    const simulationResult = JSON.parse(response.text?.trim() || "{}");
    res.json(simulationResult);
  } catch (error: any) {
    console.error("Error simulating what-if scenario:", error);
    res.status(500).json({ error: error.message || "Failed to simulate what-if scenario" });
  }
});

// 7. Interactive Legal Assistant Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], scenario, vaultDocIds = [] } = req.body;
    const customApiKey = req.headers["x-gemini-api-key"] as string | undefined;

    if (!message) {
      return res.status(400).json({ error: "Missing prompt message" });
    }

    // Load DB and retrieve context if scenario or vault documents exist
    const db = readDB();
    const linkedVaultDocs = db.vault.filter((doc: any) => vaultDocIds.includes(doc.id));
    const vaultContext = linkedVaultDocs
      .map((doc: any) => `Document: ${doc.name} (${doc.type}) - Clauses: ${JSON.stringify(doc.extractedData?.clauses || [])}`)
      .join("\n");

    const chatContext = `You are "Sahur AI Assistant", a friendly, knowledgeable legal companion for Indian citizens.
Your job is to clarify constitutional rights, statutory clauses, and suggest practical steps regarding:
- Tenancy disputes (evictions, agreements, deposit recovery)
- Workplace issues (dismissal, wages, POSH, maternity protections)
- Policing interactions (illegal detention, rights on arrest, FIR details, female arrest rules)
- Consumer issues (defective products, unfair trade, refund filing)

Strict Guidelines:
1. Always base answers on official Indian law (Constitution, CoPRA, Model Tenancy Act, BNS, labor codes).
2. Never make up legal sections or statutes. Ground your reasoning.
3. Be clear, empathetic, and speak in plain, accessible language. Avoid dense legalese.
4. If a scenario is linked, keep that context in mind.
5. Remind the user you provide legal educational guidance, not certified legal advocacy or official attorney representation.
6. ELIMINATE ALL CONVERSATIONAL FLUFF AND AI SLOP. Do NOT use introductory filler like "Certainly, I can help you with that", "Based on my analysis", or concluding chat-filler like "I hope this helps! Feel free to ask if you have more questions".
7. State statutory facts, protections, and citizen-actionable procedural steps directly. Start responding to the user's inquiry immediately with legal and constitutional facts. Ensure precise articles/sections of the Constitution of India and other Indian statutory acts are cited.

Linked Scenario: ${scenario || "None linked yet."}
Linked Vault Documents Summary: ${vaultContext || "None linked."}`;

    // Populate history
    // Since ai.chats maintains a conversational session, we can send messages one by one or reconstruct.
    // In @google/genai, ai.chats can be loaded with messages. To keep it simple, we can send the message
    // with a structured prompt containing the conversation history to simulate a continuous session,
    // which is extremely reliable.
    const promptWithHistory = `Here is the conversation history:
${history.map((h: any) => `${h.role === "user" ? "Citizen" : "Sahur AI"}: ${h.content}`).join("\n")}

Citizen's New Message: ${message}

Please provide a helpful, legal-grounded reply. Let's make it friendly and highly readable, using bullet points for instructions!`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: promptWithHistory,
      config: {
        systemInstruction: chatContext,
      },
    }, customApiKey);

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Error in legal chat assistant:", error);
    res.status(500).json({ error: error.message || "Failed to execute chat" });
  }
});

// Serve frontend assets
async function startServer() {
  // Vite integration in development mode
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
