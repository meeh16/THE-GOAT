import { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const LOG_FILE = "/tmp/vercel_debug.log";
  try {
    if (fs.existsSync(LOG_FILE)) {
      const logs = fs.readFileSync(LOG_FILE, "utf-8");
      return res.status(200).send(logs);
    }
    return res.status(200).send("No log file found at " + LOG_FILE);
  } catch (error: any) {
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
