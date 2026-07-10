import { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../app-server";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    app(req, res);
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "failed to execute app-server statically inside handler",
      error: error?.message || String(error),
      stack: error?.stack
    });
  }
}
