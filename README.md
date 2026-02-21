# ValidFi — AI-Powered Web3 Idea Validation

Connect wallet. Submit your project. Get an AI validation report. Share your score card.

**Stack:** Next.js 14 · PostgreSQL · Prisma · MetaMask Auth · Gemini API · Tailwind CSS

---

## Quick Start

```bash
npm install
cp .env.example .env   # fill in your values
npx prisma db push
npm run dev
```

### Environment Variables

| Variable | Source |
|---|---|
| `DATABASE_URL` | Free PostgreSQL from [neon.tech](https://neon.tech) |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_AI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (or Vercel URL) |

## Deploy to Vercel

```bash
git init && git add . && git commit -m "validfi v1"
# Push to GitHub, import in Vercel, add env vars, deploy
```

## How It Works

1. **Connect Wallet** — MetaMask signature auth (no passwords)
2. **Submit Idea** — 2-step form (project basics + Web3 details)
3. **AI Validation** — Gemini Pro analyzes tokenomics, competitors, risks
4. **Share Card** — Beautiful score card for social sharing

## Scoring (5 Dimensions)

- **Market** — TAM/SAM/SOM, trends, demand
- **Tokenomics** — Token model viability, incentive design
- **Tech** — Architecture, smart contract considerations
- **Execution** — Team, stage, GTM readiness
- **Timing** — Market cycle, competitive window

## Verdicts

- 🟢 **BULLISH** — Strong fundamentals, go build
- 🟡 **CAUTIOUS** — Promise but gaps to address
- 🔴 **BEARISH** — Significant concerns
- 💀 **NGMI** — Fundamental issues
