import { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ 
    status: "ok", 
    message: "successfully imported @google/genai!",
    GoogleGenAIExists: !!GoogleGenAI,
    TypeExists: !!Type
  });
}
