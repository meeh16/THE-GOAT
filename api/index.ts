/**
 * Custom API Entry Point (Vercel Serverless Function)
 * 
 * To run this application, a Gemini API Key is required.
 * 
 * How to get your Gemini API Key:
 * 1. Visit Google AI Studio at https://aistudio.google.com/
 * 2. Sign in with your Google Account.
 * 3. Click "Get API Key" in the sidebar/menu.
 * 4. Click "Create API Key", choose or create a project, and copy your key.
 * 5. Set it in your environment variables as `GEMINI_API_KEY` (e.g., in `.env.local`), 
 *    or enter it directly in the frontend "Custom API Key" settings modal.
 */
import app from "./app-server";

export default (req: any, res: any) => {
  app(req, res);
};

