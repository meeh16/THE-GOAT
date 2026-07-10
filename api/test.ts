import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const appModule = await import("../server.ts");
    res.status(200).json({ 
      status: "ok", 
      message: "successfully imported server.ts dynamically!",
      appExists: !!appModule.default
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "failed to import server.ts dynamically",
      error: error?.message || String(error),
      stack: error?.stack
    });
  }
}
