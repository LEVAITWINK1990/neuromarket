export type MockProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  platform: string;
  category: string;
  image: string;
  createdAt: string;
  seller: string;
  inStock: boolean;
};

export const CATEGORIES = [
  "All",
  "AI Assistants",
  "Image Generation",
  "Video & Audio",
  "Code Tools",
  "API Credits",
  "Courses",
  "Bundles",
] as const;

export const PLATFORMS = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Midjourney",
  "Stability AI",
  "Runway",
  "Cursor",
  "Perplexity",
] as const;

export const mockProducts: MockProduct[] = [
  { id: "1", name: "ChatGPT Plus — 1 Month Subscription", price: 18.99, originalPrice: 20.0, platform: "OpenAI", category: "AI Assistants", image: "https://placehold.co/120x120/1a1a2e/00c853?text=GPT+", createdAt: "2026-06-01", seller: "AIKeys Official", inStock: true },
  { id: "2", name: "Claude Pro — Monthly Access Key", price: 17.49, originalPrice: 20.0, platform: "Anthropic", category: "AI Assistants", image: "https://placehold.co/120x120/1a1a2e/00c853?text=Claude", createdAt: "2026-06-02", seller: "NeuroStore", inStock: true },
  { id: "3", name: "Midjourney Standard Plan — 1 Month", price: 27.99, originalPrice: 30.0, platform: "Midjourney", category: "Image Generation", image: "https://placehold.co/120x120/1a1a2e/00c853?text=MJ", createdAt: "2026-06-03", seller: "DigiKeys Pro", inStock: true },
  { id: "4", name: "Google Gemini Advanced — Subscription", price: 16.99, originalPrice: 19.99, platform: "Google", category: "AI Assistants", image: "https://placehold.co/120x120/1a1a2e/00c853?text=Gemini", createdAt: "2026-06-01", seller: "AIKeys Official", inStock: true },
  { id: "5", name: "Cursor Pro IDE — Annual License", price: 89.99, originalPrice: 96.0, platform: "Cursor", category: "Code Tools", image: "https://placehold.co/120x120/1a1a2e/00c853?text=Cursor", createdAt: "2026-05-28", seller: "DevTools Hub", inStock: true },
  { id: "6", name: "OpenAI API Credits — $50 Pack", price: 42.99, originalPrice: 50.0, platform: "OpenAI", category: "API Credits", image: "https://placehold.co/120x120/1a1a2e/00c853?text=$50", createdAt: "2026-06-04", seller: "CreditVault", inStock: true },
  { id: "7", name: "Runway Gen-3 Alpha — Pro Plan", price: 34.99, platform: "Runway", category: "Video & Audio", image: "https://placehold.co/120x120/1a1a2e/00c853?text=Runway", createdAt: "2026-06-02", seller: "NeuroStore", inStock: true },
  { id: "8", name: "Stability AI Pro — Monthly Key", price: 18.99, originalPrice: 20.0, platform: "Stability AI", category: "Image Generation", image: "https://placehold.co/120x120/1a1a2e/00c853?text=SDXL", createdAt: "2026-05-30", seller: "DigiKeys Pro", inStock: true },
  { id: "9", name: "Perplexity Pro — Annual Subscription", price: 149.99, originalPrice: 200.0, platform: "Perplexity", category: "AI Assistants", image: "https://placehold.co/120x120/1a1a2e/00c853?text=Pplx", createdAt: "2026-06-05", seller: "AIKeys Official", inStock: true },
  { id: "10", name: "OpenAI API Credits — $100 Pack", price: 84.99, originalPrice: 100.0, platform: "OpenAI", category: "API Credits", image: "https://placehold.co/120x120/1a1a2e/00c853?text=$100", createdAt: "2026-06-03", seller: "CreditVault", inStock: true },
  { id: "11", name: "ChatGPT Team — Per Seat / Month", price: 22.99, originalPrice: 25.0, platform: "OpenAI", category: "AI Assistants", image: "https://placehold.co/120x120/1a1a2e/00c853?text=Team", createdAt: "2026-06-01", seller: "AIKeys Official", inStock: true },
  { id: "12", name: "Midjourney Basic Plan — 1 Month", price: 8.99, originalPrice: 10.0, platform: "Midjourney", category: "Image Generation", image: "https://placehold.co/120x120/1a1a2e/00c853?text=MJ+B", createdAt: "2026-06-04", seller: "DigiKeys Pro", inStock: true },
  { id: "13", name: "Anthropic API Credits — $25 Pack", price: 21.49, originalPrice: 25.0, platform: "Anthropic", category: "API Credits", image: "https://placehold.co/120x120/1a1a2e/00c853?text=$25", createdAt: "2026-06-02", seller: "CreditVault", inStock: true },
  { id: "14", name: "Cursor Business — Team License (5 seats)", price: 399.99, platform: "Cursor", category: "Code Tools", image: "https://placehold.co/120x120/1a1a2e/00c853?text=C+Biz", createdAt: "2026-05-25", seller: "DevTools Hub", inStock: true },
  { id: "15", name: "Suno AI Pro — Music Generation", price: 7.99, originalPrice: 10.0, platform: "Stability AI", category: "Video & Audio", image: "https://placehold.co/120x120/1a1a2e/00c853?text=Suno", createdAt: "2026-06-05", seller: "NeuroStore", inStock: true },
  { id: "16", name: "Google AI Studio — API Credits $50", price: 43.99, originalPrice: 50.0, platform: "Google", category: "API Credits", image: "https://placehold.co/120x120/1a1a2e/00c853?text=G$50", createdAt: "2026-06-03", seller: "CreditVault", inStock: true },
  { id: "17", name: "AI Masterclass Bundle — 10 Courses", price: 49.99, originalPrice: 120.0, platform: "OpenAI", category: "Courses", image: "https://placehold.co/120x120/1a1a2e/00c853?text=EDU", createdAt: "2026-05-20", seller: "AI Academy", inStock: true },
  { id: "18", name: "Prompt Engineering Course — Advanced", price: 24.99, originalPrice: 39.99, platform: "OpenAI", category: "Courses", image: "https://placehold.co/120x120/1a1a2e/00c853?text=PRMT", createdAt: "2026-05-22", seller: "AI Academy", inStock: true },
  { id: "19", name: "Ultimate AI Toolkit — GPT + Claude + MJ", price: 59.99, originalPrice: 70.0, platform: "OpenAI", category: "Bundles", image: "https://placehold.co/120x120/1a1a2e/00c853?text=BNDL", createdAt: "2026-06-06", seller: "DigiKeys Pro", inStock: true },
  { id: "20", name: "ChatGPT Plus — 3 Month Subscription", price: 52.99, originalPrice: 60.0, platform: "OpenAI", category: "AI Assistants", image: "https://placehold.co/120x120/1a1a2e/00c853?text=3Mo", createdAt: "2026-06-06", seller: "AIKeys Official", inStock: true },
  { id: "21", name: "Midjourney Pro Plan — 1 Month", price: 54.99, originalPrice: 60.0, platform: "Midjourney", category: "Image Generation", image: "https://placehold.co/120x120/1a1a2e/00c853?text=MJ+P", createdAt: "2026-06-04", seller: "DigiKeys Pro", inStock: true },
  { id: "22", name: "Perplexity Pro — Monthly Key", price: 17.99, originalPrice: 20.0, platform: "Perplexity", category: "AI Assistants", image: "https://placehold.co/120x120/1a1a2e/00c853?text=Pplx", createdAt: "2026-06-07", seller: "NeuroStore", inStock: true },
  { id: "23", name: "OpenAI API Credits — $200 Pack", price: 164.99, originalPrice: 200.0, platform: "OpenAI", category: "API Credits", image: "https://placehold.co/120x120/1a1a2e/00c853?text=$200", createdAt: "2026-06-07", seller: "CreditVault", inStock: true },
  { id: "24", name: "Runway Gen-3 — Standard Plan", price: 11.99, originalPrice: 15.0, platform: "Runway", category: "Video & Audio", image: "https://placehold.co/120x120/1a1a2e/00c853?text=RW+S", createdAt: "2026-06-01", seller: "NeuroStore", inStock: true },
  { id: "25", name: "Claude Pro — 3 Month Bundle", price: 49.99, originalPrice: 60.0, platform: "Anthropic", category: "AI Assistants", image: "https://placehold.co/120x120/1a1a2e/00c853?text=Cl+3", createdAt: "2026-06-05", seller: "NeuroStore", inStock: true },
  { id: "26", name: "DALL-E API Credits — 1000 Generations", price: 13.99, originalPrice: 15.0, platform: "OpenAI", category: "Image Generation", image: "https://placehold.co/120x120/1a1a2e/00c853?text=DE", createdAt: "2026-06-06", seller: "CreditVault", inStock: true },
  { id: "27", name: "GitHub Copilot — 1 Year License", price: 89.99, originalPrice: 100.0, platform: "Cursor", category: "Code Tools", image: "https://placehold.co/120x120/1a1a2e/00c853?text=GHC", createdAt: "2026-05-29", seller: "DevTools Hub", inStock: true },
  { id: "28", name: "ElevenLabs Pro — Voice AI Monthly", price: 19.99, originalPrice: 22.0, platform: "Stability AI", category: "Video & Audio", image: "https://placehold.co/120x120/1a1a2e/00c853?text=11L", createdAt: "2026-06-03", seller: "NeuroStore", inStock: true },
  { id: "29", name: "AI Developer Pro Bundle — Code + API", price: 129.99, originalPrice: 196.0, platform: "Cursor", category: "Bundles", image: "https://placehold.co/120x120/1a1a2e/00c853?text=DEV", createdAt: "2026-06-07", seller: "DevTools Hub", inStock: true },
  { id: "30", name: "LLM Fine-Tuning Course — Hands-On", price: 34.99, originalPrice: 59.99, platform: "OpenAI", category: "Courses", image: "https://placehold.co/120x120/1a1a2e/00c853?text=FT", createdAt: "2026-05-27", seller: "AI Academy", inStock: true },
  { id: "31", name: "Anthropic API Credits — $100 Pack", price: 84.99, originalPrice: 100.0, platform: "Anthropic", category: "API Credits", image: "https://placehold.co/120x120/1a1a2e/00c853?text=A100", createdAt: "2026-06-08", seller: "CreditVault", inStock: true },
  { id: "32", name: "Midjourney + DALL-E Bundle — 1 Month", price: 34.99, originalPrice: 45.0, platform: "Midjourney", category: "Bundles", image: "https://placehold.co/120x120/1a1a2e/00c853?text=IMG", createdAt: "2026-06-08", seller: "DigiKeys Pro", inStock: true },
  { id: "33", name: "ChatGPT Enterprise — Per Seat Key", price: 49.99, originalPrice: 60.0, platform: "OpenAI", category: "AI Assistants", image: "https://placehold.co/120x120/1a1a2e/00c853?text=ENT", createdAt: "2026-06-04", seller: "AIKeys Official", inStock: true },
  { id: "34", name: "Stable Diffusion API — 5000 Credits", price: 29.99, originalPrice: 35.0, platform: "Stability AI", category: "Image Generation", image: "https://placehold.co/120x120/1a1a2e/00c853?text=SD5K", createdAt: "2026-06-02", seller: "CreditVault", inStock: true },
  { id: "35", name: "Google Gemini API — $50 Credits", price: 42.99, originalPrice: 50.0, platform: "Google", category: "API Credits", image: "https://placehold.co/120x120/1a1a2e/00c853?text=G50", createdAt: "2026-06-07", seller: "CreditVault", inStock: true },
  { id: "36", name: "Windsurf Pro — AI Code Editor", price: 14.99, originalPrice: 15.0, platform: "Cursor", category: "Code Tools", image: "https://placehold.co/120x120/1a1a2e/00c853?text=WS", createdAt: "2026-06-06", seller: "DevTools Hub", inStock: true },
];
