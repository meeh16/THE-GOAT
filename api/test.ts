import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Dynamically import the wrapper which statically imports app-server
    const appModule = await import("./app-server-wrapper");
    res.status(200).json({ 
      status: "ok", 
      message: "successfully imported app-server-wrapper dynamically!",
      appExists: !!appModule.default
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "failed to import app-server-wrapper dynamically",
      error: error?.message || String(error),
      stack: error?.stack
    });
  }
}
