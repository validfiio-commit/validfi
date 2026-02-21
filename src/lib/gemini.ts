import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const reportModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function repairJSON(text: string): any {
  let s = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(s); } catch {}
  s = s.replace(/,\s*"[^"]*$/, "").replace(/,\s*$/, "");
  let inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    if (esc) { esc = false; continue; }
    if (s[i] === "\\") { esc = true; continue; }
    if (s[i] === '"') inStr = !inStr;
  }
  if (inStr) {
    const li = s.lastIndexOf('"');
    const before = s.lastIndexOf('"', li - 1);
    const colon = s.lastIndexOf(":", li);
    if (colon > before) {
      const keyStart = s.lastIndexOf('"', colon - 1);
      const comma = s.lastIndexOf(",", keyStart);
      s = comma > 0 ? s.slice(0, comma) : s.slice(0, keyStart);
    } else { s += '"'; }
  }
  s = s.replace(/,\s*$/, "");
  let br = 0, bk = 0; inStr = false; esc = false;
  for (let i = 0; i < s.length; i++) {
    if (esc) { esc = false; continue; }
    if (s[i] === "\\") { esc = true; continue; }
    if (s[i] === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (s[i] === "{") br++; if (s[i] === "}") br--;
    if (s[i] === "[") bk++; if (s[i] === "]") bk--;
  }
  for (let i = 0; i < bk; i++) s += "]";
  for (let i = 0; i < br; i++) s += "}";
  return JSON.parse(s);
}

function validateAndFixScores(report: any): any {
  if (!report?.scores) return report;

  const s = report.scores;
  const dims = [s.market, s.tokenomics, s.tech, s.team_execution, s.timing].filter(v => typeof v === "number");

  if (dims.length > 0) {
    // Ensure overall_score is the actual average
    const avg = Math.round(dims.reduce((a: number, b: number) => a + b, 0) / dims.length);
    report.overall_score = avg;

    // Enforce verdict matches score
    if (avg >= 85) report.verdict = "BULLISH";
    else if (avg >= 65) report.verdict = "CAUTIOUS";
    else if (avg >= 40) report.verdict = "BEARISH";
    else report.verdict = "NGMI";
  }

  return report;
}

export async function generateReport(idea: any, walletData?: any): Promise<any> {
  // Calculate detail bonus — more detail = higher base score
  const detailFields = [idea.problem, idea.solution, idea.oneLiner, idea.competitors, idea.audience, idea.chain, idea.tokenModel];
  const filledFields = detailFields.filter(f => f && f.trim && f.trim().length > 0).length;
  const totalChars = detailFields.reduce((sum, f) => sum + (f?.length || 0), 0);
  const detailLevel = totalChars > 500 ? "very detailed" : totalChars > 200 ? "moderately detailed" : "brief";

  // Build wallet context for AI
  let walletContext = "";
  if (walletData) {
    walletContext = `

FOUNDER ON-CHAIN PROFILE (from real blockchain data):
- Portfolio Value: $${walletData.totalValueUsd || "0"}
- Active Chains: ${walletData.chains?.join(", ") || "None detected"}
- Transaction Count: ${walletData.txCount || 0}
- DeFi Positions: ${walletData.defiPositions || 0}
- Staked: $${walletData.totalStakedUsd || "0"}
- 30-Day P&L: $${walletData.pnl30d || "0"}
- Wallet Age: ${walletData.walletAge || "Unknown"}
- Risk Profile: ${walletData.riskScore || "Unknown"}

SCORING NOTE: Use this on-chain profile to inform the team_execution dimension.
  - Active DeFi user with positions + staking = credible builder (+5-10 to execution)
  - Multi-chain activity = strong Web3 understanding (+5 to tech)
  - High portfolio value + DeFi positions = skin in the game (+5 to execution)
  - New wallet with no activity = unproven (neutral, don't penalize heavily)`;
  }

  const systemPrompt = `You are an elite Web3/crypto analyst — think a16z crypto + Messari + Delphi Digital. You evaluate Web3 projects constructively and fairly. Your goal is to help founders understand where they stand and what to improve.

CRITICAL SCORING RULES — READ CAREFULLY:
- The overall_score is the WEIGHTED AVERAGE of the 5 dimension scores. Calculate it, don't just pick a number.
- This submission has ${filledFields}/7 fields filled and is ${detailLevel} (${totalChars} chars). Factor this into your evaluation.

SCORING RUBRIC (follow this precisely):
  85-100 = BULLISH — Exceptional. Clear problem, strong solution, good token design, real market, great timing. Reserved for well-thought-out ideas with clear competitive advantages.
  65-84 = CAUTIOUS — Promising with gaps. Solid core idea but needs work in 1-2 areas. Most decent ideas with good detail should land here.
  40-64 = BEARISH — Significant concerns. Vague problem, unclear solution, crowded market, or weak token model. Needs major rethinking.
  0-39 = NGMI — Fundamentally broken. No real problem, nonsensical solution, or pure buzzwords with no substance.

SCORING EACH DIMENSION:
  - market: How real and large is the problem? Is there proven demand? (50 = average market, 70+ = large/growing)
  - tokenomics: Does the token model make sense? Well-designed incentives? (50 if no token specified, 60+ if reasonable model described)
  - tech: Is the technical approach sound? Right chain choice? (55 = reasonable approach, 70+ = clearly strong architecture)
  - team_execution: Based on stage, detail, AND on-chain profile if available. Idea stage with good detail = 45-55. Testnet/mainnet = 60+. Active DeFi wallet = bonus.
  - timing: Is this the right time? Market cycle, regulatory, competitive window. (50 = neutral, 65+ = good timing)

KEY SCORING PRINCIPLES:
  - A well-explained idea in a real market should score 60-75 even at idea stage
  - Reward specificity: naming competitors, describing token mechanics, explaining tech = higher scores
  - Penalize vagueness: "revolutionize everything" with no detail = lower scores
  - An idea with genuine thought behind it should NEVER score below 30
  - Only score below 20 if the idea is truly nonsensical (e.g., "blockchain for breathing")
  - The AVERAGE idea with decent detail should score around 55-65

FOCUS ON WEB3 SPECIFICS:
- Token economics and incentive design
- On-chain vs off-chain architecture decisions
- Smart contract risks and audit considerations
- Network effects and liquidity bootstrapping
- Chain selection rationale
- Real DeFi/NFT/infra competitors (use actual protocol names)
- Community and governance model

Output ONLY valid JSON. No markdown. No backticks. Every string under 150 characters.

Schema:
{"overall_score":<0-100>,"verdict":"BULLISH|CAUTIOUS|BEARISH|NGMI","verdict_reasoning":"<1-2 sentences>","scores":{"market":<0-100>,"tokenomics":<0-100>,"tech":<0-100>,"team_execution":<0-100>,"timing":<0-100>},"summary":"<2-3 sentences>","market":{"tam":"$X","sam":"$X","som":"$X","growth":"X%","trends":["t1","t2","t3"]},"competitors":[{"name":"RealProtocol","threat":"high|medium|low","chain":"Ethereum|Solana|Multi","strengths":["s1","s2"],"weaknesses":["w1","w2"]}],"swot":{"s":["s1","s2","s3"],"w":["w1","w2","w3"],"o":["o1","o2","o3"],"t":["t1","t2","t3"]},"risks":[{"r":"risk","s":"critical|high|medium|low","m":"mitigation"}],"token_analysis":"<2 sentences on token model viability>","founder_onchain":"<1 sentence about founder wallet activity>","gtm":"<1-2 sentences>","steps":[{"p":1,"a":"action","t":"timeline","e":"High|Medium|Low"}]}

IMPORTANT: overall_score MUST equal the average of the 5 scores. Verdict must match: 85+ = BULLISH, 65-84 = CAUTIOUS, 40-64 = BEARISH, 0-39 = NGMI.
Include: 3-4 real Web3 competitors, 3 per SWOT, 3-4 risks, 5-6 steps, 3 trends.`;

  const userMsg = `PROJECT: ${idea.name}
ONE-LINER: ${idea.oneLiner || "N/A"}
CATEGORY: ${idea.category}
PROBLEM: ${idea.problem}
SOLUTION: ${idea.solution}
CHAIN: ${idea.chain || "N/A"}
TOKEN MODEL: ${idea.tokenModel || "N/A"}
STAGE: ${idea.stage}
COMPETITORS: ${idea.competitors || "N/A"}
TARGET AUDIENCE: ${idea.audience || "N/A"}${walletContext}`;

  try {
    const result = await reportModel.generateContent({
      contents: [{ role: "user", parts: [{ text: userMsg }] }],
      systemInstruction: { role: "system" as any, parts: [{ text: systemPrompt }] },
      generationConfig: { maxOutputTokens: 12000, temperature: 0.7 },
    });
    return validateAndFixScores(repairJSON(result.response.text()));
  } catch {
    const result2 = await reportModel.generateContent({
      contents: [{ role: "user", parts: [{ text: userMsg }] }],
      systemInstruction: { role: "system" as any, parts: [{ text: systemPrompt + "\n\nCOMPLETE THE FULL JSON. Strings under 80 chars." }] },
      generationConfig: { maxOutputTokens: 12000, temperature: 0.5 },
    });
    return validateAndFixScores(repairJSON(result2.response.text()));
  }
}

export async function chatWithAdvisor(
  idea: any, report: any,
  history: { role: string; content: string }[],
  userMessage: string,
  walletAddress: string,
  walletData?: any,
): Promise<string> {
  // Wallet context for credibility assessment
  let walletSection = `\nFOUNDER WALLET: ${walletAddress} (verified via MetaMask)`;
  if (walletData && walletData.totalValueUsd) {
    walletSection += `
  Portfolio: $${walletData.totalValueUsd} | Chains: ${walletData.activeChains || 0} | Txns: ${walletData.txCount || 0}
  DeFi: ${walletData.defiPositions || 0} positions | Staked: $${walletData.totalStakedUsd || "0"} | 30D P&L: $${walletData.pnl30d || "0"}
  Wallet Age: ${walletData.walletAge || "Unknown"} | Top Holdings: ${walletData.topTokens?.map((t: any) => `${t.symbol}($${t.balanceUsd})`).join(", ") || "N/A"}`;
  }

  const systemPrompt = `You are a top-tier Web3 strategy advisor on ValidFi.

YOUR ROLE: Strategy, analysis, and actionable advice. You focus on business logic, tokenomics design, GTM, competitive positioning, and execution planning.

IMPORTANT: If the user asks for live data (portfolio, token prices, yields, gas, wallet analysis), tell them to just ask directly — e.g. "Try asking 'show my portfolio' or 'price of ETH' — I'll pull live data from the blockchain via Elsa x402." You do NOT make up prices or portfolio data. You do NOT claim you can't access their wallet — the system already has it.

You DO have the founder's cached on-chain profile for credibility context (see below). Use it when discussing team/execution credibility.

STYLE:
- Sharp, consultative. Challenge assumptions.
- Reference report scores and risks with specific numbers.
- Go deep on one topic, end with a question.
- When relevant, suggest the user ask for live data: "Want me to pull the current price of [token]?" or "Ask 'show yields' to see what's available right now."

PROJECT: ${idea.name} | ${idea.category} | Chain: ${idea.chain || "N/A"} | Token: ${idea.tokenModel || "N/A"}
Problem: ${idea.problem || "N/A"}
Solution: ${idea.solution || "N/A"}

REPORT: Score ${report?.overall_score}/100 | Verdict: ${report?.verdict}
Market: ${report?.scores?.market} | Tokenomics: ${report?.scores?.tokenomics} | Tech: ${report?.scores?.tech} | Execution: ${report?.scores?.team_execution} | Timing: ${report?.scores?.timing}
Risks: ${report?.risks?.map((r: any) => r.r).join("; ") || "N/A"}${walletSection}

Use **bold** for emphasis. Be concise.`;

  const geminiHistory = history.map((m) => ({
    role: (m.role === "user" ? "user" : "model") as "user" | "model",
    parts: [{ text: m.content }],
  }));

  const chat = chatModel.startChat({
    history: geminiHistory,
    systemInstruction: { role: "system" as any, parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 1500, temperature: 0.8 },
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}
