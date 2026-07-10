import { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../app-server";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ 
    status: "ok", 
    message: "successfully imported app-server.ts statically!",
    appExists: !!app
  });
}
