export interface Idea {
  id: string;
  name: string;
  oneLiner?: string;
  category: string;
  problem: string;
  solution: string;
  chain?: string;
  tokenModel?: string;
  stage: string;
  competitors?: string;
  audience?: string;
  status: "DRAFT" | "ANALYZING" | "COMPLETED" | "FAILED";
  report?: Report;
  createdAt: string;
}

export interface Report {
  overall_score: number;
  verdict: "BULLISH" | "CAUTIOUS" | "BEARISH" | "NGMI";
  verdict_reasoning: string;
  scores: {
    market: number;
    tokenomics: number;
    tech: number;
    team_execution: number;
    timing: number;
  };
  summary: string;
  market: { tam: string; sam: string; som: string; growth: string; trends: string[] };
  competitors: { name: string; threat: string; chain?: string; strengths: string[]; weaknesses: string[] }[];
  swot: { s: string[]; w: string[]; o: string[]; t: string[] };
  risks: { r: string; s: string; m: string }[];
  token_analysis?: string;
  founder_onchain?: string;
  gtm: string;
  steps: { p: number; a: string; t: string; e: string }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
