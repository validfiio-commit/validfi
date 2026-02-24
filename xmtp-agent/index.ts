import { Agent, isText } from "@xmtp/agent-sdk";

// Load env
try { process.loadEnvFile?.(".env"); } catch {}

const agent = await Agent.createFromEnv();

// Track conversations per wallet for context
const sessionContext = new Map<string, { projectName?: string; history: string[] }>();

agent.on("text", async (ctx) => {
  const senderAddress = ctx.message.senderAddress || "unknown";
  const text = ctx.message.content as string;

  // Get or create session
  if (!sessionContext.has(senderAddress)) {
    sessionContext.set(senderAddress, { history: [] });
  }
  const session = sessionContext.get(senderAddress)!;
  session.history.push(`User: ${text}`);

  // Keep last 10 exchanges
  if (session.history.length > 20) session.history = session.history.slice(-20);

  try {
    // Call ValidFi advisor API
    const response = await fetch(`${process.env.VALIDFI_APP_URL || "http://localhost:3000"}/api/xmtp/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-xmtp-secret": process.env.XMTP_API_SECRET || "validfi-xmtp-secret",
      },
      body: JSON.stringify({
        walletAddress: senderAddress,
        message: text,
        history: session.history.slice(0, -1),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      await ctx.conversation.sendText(`⚠️ Error: ${err}`);
      return;
    }

    const data = await response.json();
    session.history.push(`Assistant: ${data.response}`);

    // Send response — use markdown for formatted responses
    if (data.response.includes("**") || data.response.includes("- ")) {
      await ctx.conversation.sendMarkdown(data.response);
    } else {
      await ctx.conversation.sendText(data.response);
    }

    // Add source attribution
    if (data.source === "elsa") {
      await ctx.conversation.sendText("⚡ Live on-chain data powered by Elsa x402");
    }
  } catch (err: any) {
    console.error("Error processing message:", err.message);
    await ctx.conversation.sendText(
      "Hey! I'm the ValidFi AI advisor. I'm having trouble connecting to the ValidFi backend right now. Please try again in a moment or use the web app at validfi.io"
    );
  }
});

agent.on("start", () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚡ ValidFi AI Advisor — XMTP Agent Active");
  console.log(`📬 Address: ${agent.address}`);
  console.log(`🌐 Network: ${process.env.XMTP_ENV || "dev"}`);
  console.log(`🔗 Chat: https://xmtp.chat/dm/${agent.address}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});

agent.on("error", (err) => {
  console.error("XMTP Agent error:", err);
});

await agent.start();
