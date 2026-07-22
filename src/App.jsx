import { useState, useEffect, useCallback } from "react";
import {
  Home, BookOpen, Library, MessageCircle, User, ChevronRight, ChevronDown,
  CheckCircle2, Circle, Flame, Target, Copy, Search, Download, Send,
  Sparkles, Lock, X, Check
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
   Navy #0B1E3D · Electric Blue #2F6FED · Teal #14B8A6
   Off-white #F6F7FA · Success #16A34A · Ink #10182B
--------------------------------------------------------- */
const C = {
  navy: "#0B1E3D",
  navySoft: "#132A4D",
  blue: "#2F6FED",
  teal: "#14B8A6",
  bg: "#F6F7FA",
  card: "#FFFFFF",
  ink: "#10182B",
  sub: "#5B667A",
  line: "#E6E9F0",
  success: "#16A34A",
};

/* ---------------------------------------------------------
   AUTH CONFIG
   Paste your deployed Google Apps Script Web App URL below.
   See the accompanying google-apps-script.gs file for setup.
--------------------------------------------------------- */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzS6_E4yp5nFNqcpn_aExbERP5vgnpguVqWUaUJeAcfHoceAN83VtgFQdCKmKTA8wMJpA/exec";
const AUTH_SESSION_KEY = "auth-session";

async function hashPassword(password, email) {
  const enc = new TextEncoder().encode(password + "::" + email.toLowerCase().trim());
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function callBackend(action, payload) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.startsWith("PASTE_")) {
    return { success: false, message: "The app isn't connected to a backend yet. The course creator needs to add the Apps Script URL." };
  }
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight against Apps Script
      body: JSON.stringify({ action, ...payload }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, message: "Couldn't reach the server. Please check your connection and try again." };
  }
}

/* ---------------------------------------------------------
   COURSE DATA (from "AI Simplified – Zero to Hero")
--------------------------------------------------------- */
const MODULES = [
  {
    id: 0, code: "UNDERSTAND", title: "Welcome to the AI World",
    promise: "I understand AI.",
    goal: "Move from AI confusion to AI confidence, in plain language.",
    lessons: [
      "What is AI in simple language?",
      "Generative AI explained with real-life examples",
      "AI vs Search Engines — what's the difference?",
      "What AI can and cannot do",
      "Understanding AI hallucinations and wrong answers",
      "How to verify AI-generated information",
      "Your journey from AI beginner to AI-first professional",
    ],
  },
  {
    id: 1, code: "SELECT", title: "Choose the Right AI Tool",
    promise: "I can choose the right AI tools.",
    goal: "Build a personal AI toolkit instead of chasing every tool.",
    lessons: [
      "Understanding the AI tool ecosystem",
      "Understanding AI models — the 'brain' behind the app",
      "ChatGPT vs Claude vs Gemini",
      "Free AI vs Paid AI",
      "Build Your Personal AI Toolkit (activity)",
    ],
  },
  {
    id: 2, code: "MASTER PROMPTS", title: "Learn How to Talk to AI",
    promise: "I can communicate clearly with AI.",
    goal: "Turn weak requests into instructions AI can actually use.",
    lessons: [
      "Why most AI prompts fail",
      "The A.R.T. Prompt Framework (Act As · Request · Terms)",
      "Give AI a clear role",
      "Give AI enough context",
      "Define your task clearly",
      "Tell AI what the output should look like",
      "Use examples to improve AI output",
      "Tell AI what to avoid",
      "Ask AI to ask you questions first",
      "Improve a weak prompt step-by-step",
      "Create reusable Master Prompts",
      "Why you should always review AI output",
    ],
  },
  {
    id: 3, code: "APPLY", title: "Your Everyday Work Assistant",
    promise: "I can use AI to get real work done.",
    goal: "Use AI across research, writing, documents, and data.",
    lessons: [
      "Use AI for research", "Summarize long information",
      "Write professional emails", "Create reports and documents",
      "Brainstorm ideas", "Analyze information",
      "Work with PDFs and documents", "Use AI with spreadsheets and data",
      "Create presentations", "Create your first AI-powered workflow",
    ],
  },
  {
    id: 4, code: "REIMAGINE", title: "Create Professional Content",
    promise: "I can turn ideas into creative content.",
    goal: "Move from text prompts into images, video, voice and campaigns.",
    lessons: [
      "Creative idea generation", "Social media content", "Content calendars",
      "Scripts and stories", "Create AI images", "Professional image prompts",
      "Posters and ad creatives", "Presentations with AI", "Create AI videos",
      "Video prompts", "Camera, movement, lighting, sound prompts",
      "Character consistency in AI videos", "AI voice and music",
    ],
  },
  {
    id: 5, code: "TRANSFORM", title: "Build Digital Products",
    promise: "I can turn real problems into useful AI-assisted products.",
    goal: "Go from idea to a real, launched digital product.",
    lessons: [
      "Find problems worth solving", "Identify the right audience",
      "Research pain points with AI", "Validate your idea", "Find your MVP",
      "Create eBooks with AI", "Create online courses with AI",
      "Create templates and digital downloads",
      "Build simple websites and landing pages",
      "Introduction to AI-assisted coding",
      "Test and improve your product", "Launch your first AI-assisted product",
    ],
  },
  {
    id: 6, code: "EXECUTE AUTOMATICALLY", title: "AI Working Without You",
    promise: "I can turn repetitive work into AI-powered workflows.",
    goal: "Understand Trigger → Logic → Action and build a first automation.",
    lessons: [
      "What is AI automation?", "Automation vs AI automation",
      "Trigger → Logic → Action", "Connect apps together",
      "Move information automatically", "Use AI inside workflows",
      "Add human approval where needed", "Handle errors",
      "Test your automation", "Build your first automated AI workflow",
    ],
  },
  {
    id: 7, code: "RUN AI SYSTEMS", title: "Your Personal AI Operating System",
    promise: "I can build my own AI-powered way of working.",
    goal: "Connect tools, prompts, and workflows into one reusable system.",
    lessons: [
      "What is an AI system?", "AI assistants vs AI agents",
      "Give AI access to the right knowledge",
      "Build reusable AI instructions", "Connect AI with your tools",
      "Create specialized AI assistants", "Human-in-the-loop systems",
      "AI safety, privacy and responsible use",
      "Build your Personal AI Operating System",
      "Your 30-Day AI Implementation Plan",
    ],
  },
];

/* ---------------------------------------------------------
   LESSON CONTENT — a short teaching note + one activity per lesson
   Keyed "moduleId-lessonIndex"
--------------------------------------------------------- */
const LESSON_CONTENT = {
  "0-0": { explain: "AI is a computer program trained to spot patterns in huge amounts of information, so it can respond, write, and create like a very smart digital assistant. It isn't magic and it isn't human — it's prediction, done extremely well.", activity: "Open any AI tool and ask: \"What is AI, in one paragraph, for a 10-year-old?\" Notice how it explains itself." },
  "0-1": { explain: "Generative AI creates brand-new content — text, images, video, even code — instead of just finding existing information. It's like asking a talented assistant to write, draw, or plan something from scratch, based on your instructions.", activity: "Ask an AI tool to generate three taglines for your business or course, and compare them." },
  "0-2": { explain: "A search engine finds and lists existing web pages matching your keywords. AI reads your question and generates a direct, original answer built just for you — but it doesn't automatically check every fact like a search result trail does.", activity: "Ask the same question on a search engine and on an AI tool, and compare how the results feel different." },
  "0-3": { explain: "AI is excellent at drafting, summarizing, brainstorming, and spotting patterns — but it cannot guarantee 100% factual accuracy, doesn't automatically know real-time events, and has no real judgement of its own.", activity: "List 3 tasks you'd trust AI with, and 3 you wouldn't — and why." },
  "0-4": { explain: "Sometimes AI states something confidently that is completely wrong or made up — this is called a hallucination. It happens because AI predicts likely-sounding text, not verified fact.", activity: "Ask AI a specific factual question (a date or statistic) and verify the answer with another source." },
  "0-5": { explain: "Before trusting AI output, cross-check important facts with a second source, ask AI where the information came from, and apply your own judgement to anything that feels unusual.", activity: "Take one AI-generated fact from today and verify it independently." },
  "0-6": { explain: "This course moves you from simply asking AI random questions to building a structured, personal way of using AI in your work — one level at a time.", activity: "Write one sentence describing what \"using AI confidently\" would look like for you in 3 months." },

  "1-0": { explain: "AI tools fall into categories — research, writing, images, video, data, coding, automation. No single tool does everything well, so the first skill is knowing which tool fits which job.", activity: "List which tool categories you already use, and which you've never tried." },
  "1-1": { explain: "A model is the \"brain\" working behind an AI app. Different models are faster, deeper-thinking, or better with images — you don't need to memorize every one, just know what's good enough for your task.", activity: "Look up which model powers the AI tool you use most often." },
  "1-2": { explain: "ChatGPT, Claude, and Gemini each have their own strengths. Practical fit for the task at hand should guide your choice, not brand loyalty or habit.", activity: "Ask the same real question to two different AI assistants and compare the answers." },
  "1-3": { explain: "Free plans are often enough for simple, occasional tasks. Paid plans start making sense once AI becomes a core, daily part of your work.", activity: "Estimate how many hours a week a paid AI tool could save you, and decide if it's worth the cost." },
  "1-4": { explain: "Bring everything together by naming your go-to tool for each core need, so you stop re-deciding which tool to open every time.", activity: "Fill in your AI Toolkit: main assistant, research tool, image tool, video tool, automation tool." },

  "2-0": { explain: "Vague prompts give AI too little to work with. \"Write a Facebook ad\" leaves out audience, tone, and goal — so the result is generic.", activity: "Write down your weakest recent prompt and spot exactly what information was missing." },
  "2-1": { explain: "The A.R.T. framework: Act As (give AI a role), Request (say exactly what you want), Terms (set tone, format, and length). Together they turn a vague ask into a clear instruction.", activity: "Rewrite one prompt using all three A.R.T. parts." },
  "2-2": { explain: "Telling AI to \"act as a [role]\" — a marketer, a teacher, a lawyer — immediately shapes its expertise, vocabulary, and tone.", activity: "Try the same request with three different roles and compare the tone of each answer." },
  "2-3": { explain: "Background information — your audience, your goal, your situation — helps AI tailor the response instead of guessing at what you need.", activity: "Add two sentences of context to a prompt you'd normally leave bare." },
  "2-4": { explain: "Say exactly what output you want — a list, an email, a script, a table — not just a topic. A clear task beats a vague one every time.", activity: "Turn a topic-only prompt into a specific, task-based one." },
  "2-5": { explain: "Specify the format you want — bullet points, word count, headings, table — so you don't have to reformat the answer yourself afterward.", activity: "Ask for the same content in two different formats and compare how useful each is." },
  "2-6": { explain: "Showing AI one example of the style or structure you want dramatically improves how closely the output matches your expectations.", activity: "Paste one example into your next prompt and notice the difference in the result." },
  "2-7": { explain: "Telling AI what to avoid — jargon, long sentences, a certain tone — sharpens the output just as much as telling it what to include.", activity: "Add one \"avoid\" instruction to a prompt you write today." },
  "2-8": { explain: "For complex or unclear tasks, ask AI to question you before answering. This surfaces missing details early, before you get a wasted first draft.", activity: "Try adding \"Ask me 3 questions before you answer\" to a complex request." },
  "2-9": { explain: "Treat prompting as a conversation, not a one-shot lottery. Refine your instruction step-by-step instead of restarting from scratch when the first answer isn't right.", activity: "Take one so-so AI answer and improve it with a specific follow-up instruction." },
  "2-10": { explain: "Save your best-performing prompts as reusable templates with blanks to fill in next time, instead of rewriting them from memory.", activity: "Turn your favourite prompt from this level into a reusable template with [BRACKETS] for the changing parts." },
  "2-11": { explain: "AI can sound confident even when it's wrong. Reviewing output before you send, publish, or act on it is what keeps you in control.", activity: "Review your most recent AI-generated message for accuracy before actually using it." },

  "3-0": { explain: "Ask AI to gather, compare, and explain information quickly on a topic — then verify anything you plan to rely on.", activity: "Research one work topic using AI and note 3 key findings." },
  "3-1": { explain: "Paste long text and ask AI for a short summary tailored to your available time and role, instead of reading everything in full.", activity: "Summarize a long email or article you have into 3 bullet points." },
  "3-2": { explain: "Give AI the context and goal of your email; it can draft a polished version that you then edit into your own voice.", activity: "Draft one real email you need to send today, using AI for the first pass." },
  "3-3": { explain: "AI can structure a report outline and draft sections much faster than starting from a completely blank page.", activity: "Ask AI to outline a report or document you owe someone this week." },
  "3-4": { explain: "Use AI to generate a wide list of options quickly, then apply your own judgement to pick and refine the best ones.", activity: "Brainstorm 10 ideas for a real problem you're currently facing." },
  "3-5": { explain: "AI can spot patterns and summarize trends in data, feedback, or text you give it, saving you manual read-through time.", activity: "Paste a small dataset or list of feedback and ask AI what stands out." },
  "3-6": { explain: "Many AI tools can read an uploaded document and answer specific questions about its contents directly.", activity: "Upload one document to an AI tool and ask it three questions about the content." },
  "3-7": { explain: "AI can suggest spreadsheet formulas, help clean messy data, or explain what a spreadsheet is actually showing you.", activity: "Ask AI to explain or improve one spreadsheet formula you currently use." },
  "3-8": { explain: "Describe your topic and audience, and AI can draft a slide-by-slide outline for you to refine visually.", activity: "Ask AI to outline a 5-slide presentation on a topic you know well." },
  "3-9": { explain: "Chain small AI-assisted steps together — input, AI thinking, output, human review — into one repeatable workflow instead of one-off prompts.", activity: "Map one task you repeat often into a simple 4-step AI workflow." },

  "4-0": { explain: "AI is a fast brainstorming partner for headlines, campaign angles, and content ideas you wouldn't think of alone.", activity: "Generate 5 content ideas for your business or course this week." },
  "4-1": { explain: "Give AI your platform, audience, and tone, and it can draft ready-to-edit social captions in seconds.", activity: "Draft 3 social captions for one post you have coming up." },
  "4-2": { explain: "Ask AI to plan a week or month of content themes so you're never starting from a blank calendar.", activity: "Ask AI to draft a 1-week content calendar for your brand." },
  "4-3": { explain: "AI can draft short scripts or stories in a tone and length you specify, giving you a strong first draft to edit.", activity: "Write a 30-second script for a product or service you offer." },
  "4-4": { explain: "Describe the subject, style, and mood you want, and an AI image tool generates original visuals matching your brief.", activity: "Generate one image for a real post or product using an AI image tool." },
  "4-5": { explain: "Strong image prompts describe subject, style, lighting, and composition clearly — vague prompts give vague, generic images.", activity: "Rewrite a one-word image prompt into a full, descriptive prompt." },
  "4-6": { explain: "Combine image generation with your marketing message to produce a usable poster or ad creative end-to-end.", activity: "Design one poster concept for a real promotion using AI." },
  "4-7": { explain: "Use AI for both the slide outline and matching visuals to move from idea to a polished deck much faster.", activity: "Build a rough 3-slide deck using AI-generated content and visuals." },
  "4-8": { explain: "For AI video, describe what should happen, not just what should appear — action matters as much as appearance.", activity: "Try generating a short AI video clip from a simple, specific description." },
  "4-9": { explain: "A strong video prompt includes the subject, the action, the location, and the duration — leaving any of these vague weakens the result.", activity: "Write one detailed video prompt using all four elements." },
  "4-10": { explain: "Adding camera angle, movement, lighting mood, and sound makes AI video feel intentional and cinematic rather than random.", activity: "Add two of these details to your last video prompt and compare the result." },
  "4-11": { explain: "Describe a character's appearance precisely and reuse that exact description across scenes to keep them visually consistent.", activity: "Write a character description you could reuse across 3 different scenes." },
  "4-12": { explain: "AI can generate voiceovers and background music matched to the mood of your content, rounding out a full production.", activity: "Try generating a short voiceover line for one of your video ideas." },

  "5-0": { explain: "Good products start from a real, specific problem someone actively struggles with — not just an idea that sounds interesting.", activity: "List 3 problems you personally notice often in your work or community." },
  "5-1": { explain: "Get specific about who has this problem — their role, situation, and what they've already tried to fix it.", activity: "Describe your ideal customer in 2–3 sentences." },
  "5-2": { explain: "Ask AI to help analyze conversations, reviews, or messages for recurring frustrations you might otherwise miss.", activity: "Ask AI to find patterns in 5 pieces of customer or student feedback you have." },
  "5-3": { explain: "Test demand cheaply — a simple poll, a landing page, or direct conversations — before you build the full product.", activity: "Plan one small, low-cost way to test your idea this week." },
  "5-4": { explain: "Identify the smallest version of your product that still genuinely solves the core problem — nothing more.", activity: "Write down the smallest version of your product idea." },
  "5-5": { explain: "AI can help outline, draft, and edit an eBook chapter by chapter, keeping you moving instead of stuck on a blank page.", activity: "Draft an outline for a short eBook on a topic you know well." },
  "5-6": { explain: "Break your knowledge into modules and lessons, then use AI to help script and structure each one, just like this course.", activity: "Outline 3 module titles for a course you could teach." },
  "5-7": { explain: "Turn a piece of your work you already repeat into a reusable template others could use or buy.", activity: "Identify one template you already use that others might pay for." },
  "5-8": { explain: "AI can help draft the copy — and even the basic code — for a simple one-page website or landing page.", activity: "Draft a headline and one paragraph of copy for a landing page." },
  "5-9": { explain: "You can describe what you want in plain language and AI helps generate working code, even with limited technical background.", activity: "Ask AI to write one small, simple script or webpage snippet." },
  "5-10": { explain: "Share your first version with real users and use their feedback to improve it — feedback beats guessing every time.", activity: "Identify 2 people you could show your first version to this week." },
  "5-11": { explain: "Launching doesn't require perfection — a clear offer to a small, real audience is enough to start learning and earning.", activity: "Write one sentence announcing your product to your audience." },

  "6-0": { explain: "Automation lets AI-assisted steps run without you manually starting them each time — the work happens in the background.", activity: "Name one task you repeat every week that could run itself." },
  "6-1": { explain: "Regular automation follows fixed rules; AI automation adds judgement — deciding what to do based on the situation, not just a script.", activity: "Decide whether your repeated task needs simple rules or real AI judgement." },
  "6-2": { explain: "Every automation starts with something happening (Trigger), a decision about what to do (Logic), and a resulting step (Action).", activity: "Map your chosen task into Trigger, Logic, and Action." },
  "6-3": { explain: "Automation tools let information flow between apps automatically, without manual copy-pasting between tabs.", activity: "List two apps you'd want connected in your workflow." },
  "6-4": { explain: "Once apps are connected, data can move between them the moment something happens — no re-entry required.", activity: "Identify one piece of data you currently copy-paste by hand." },
  "6-5": { explain: "AI can analyze, draft, or decide at any step inside an automated workflow, not just inside a chat window.", activity: "Decide where AI thinking fits inside the workflow you mapped." },
  "6-6": { explain: "For anything sensitive or customer-facing, insert a manual approval step before the automated action actually happens.", activity: "Mark which step in your workflow needs a human check first." },
  "6-7": { explain: "Plan for what happens when a step fails, so the whole process doesn't break silently and leave you unaware.", activity: "Note one thing that could go wrong in your workflow, and what should happen instead." },
  "6-8": { explain: "Run your automation on a small, safe example before trusting it with real, live data or customers.", activity: "Plan a small test run for your automation idea." },
  "6-9": { explain: "Put Trigger, Logic, Action, and Human Review together into one real, working process you can actually rely on.", activity: "Write out the full Trigger → Logic → Action → Review flow for your chosen task." },

  "7-0": { explain: "A system connects your tools, prompts, and workflows together so they work as one reliable setup, not scattered pieces.", activity: "List every AI tool and prompt you currently use separately, unconnected." },
  "7-1": { explain: "An assistant responds when asked; an agent can take multi-step action toward a goal with less step-by-step supervision.", activity: "Decide which of your tasks need a simple assistant versus a more autonomous agent." },
  "7-2": { explain: "Feeding AI your own documents or context makes its answers specific to you, instead of generic and one-size-fits-all.", activity: "Identify one document you could feed into an AI tool for more relevant answers." },
  "7-3": { explain: "Save standing instructions — your tone, background, preferences — so you stop repeating yourself in every single prompt.", activity: "Write one standing instruction you'd reuse across most of your prompts." },
  "7-4": { explain: "Linking AI to your calendar, inbox, or CRM lets it work with your real, current information instead of guesses.", activity: "Name one tool you'd like AI connected to." },
  "7-5": { explain: "Build a focused assistant for one job — a coach, a writer, a researcher — rather than relying on one general-purpose chat for everything.", activity: "Describe one specialized assistant you'd like to build." },
  "7-6": { explain: "Keep a human checkpoint at key decisions so AI supports your judgement instead of quietly replacing it.", activity: "Decide where your own judgement absolutely must stay in the loop." },
  "7-7": { explain: "Be mindful of what data you share with AI tools, and stay transparent with clients or students about AI's role in your work.", activity: "Review one thing you should stop sharing with AI tools going forward." },
  "7-8": { explain: "Bring your goals, tools, assistants, workflows, and automations together into one connected personal system.", activity: "Sketch your own AI Operating System as a simple diagram or list." },
  "7-9": { explain: "Turn everything you've learned across all 8 levels into a dated, concrete plan for the next 30 days.", activity: "Write down your first 3 action items for this week." },
};

const RESOURCES = [
  // Level 0 — Understand
  { id: "r0a", module: 0, type: "Guide", title: "AI Beginner's Quick-Start Guide", desc: "A plain-language starting point: what AI is, what it isn't, and how to think about it before you touch any tool." },
  { id: "r0b", module: 0, type: "Cheat Sheet", title: "Generative AI Glossary", desc: "Simple one-line definitions for terms like prompt, model, hallucination, and token — no jargon." },
  { id: "r0c", module: 0, type: "Assessment", title: "AI Confidence Assessment", desc: "Rate your own confidence and track how it grows as you move through the levels." },
  { id: "r0d", module: 0, type: "Worksheet", title: "Personal AI Opportunity Map", desc: "Answer 5 questions about your work to spot where AI could save you the most time." },
  { id: "r0e", module: 0, type: "Checklist", title: "How to Verify AI Output Checklist", desc: "A quick pass/fail checklist to run before you trust or share anything AI gives you." },
  // Level 1 — Select
  { id: "r1a", module: 1, type: "Worksheet", title: "My AI Toolkit Builder", desc: "Fill in your main assistant, research tool, image tool, video tool, and automation tool." },
  { id: "r1b", module: 1, type: "Cheat Sheet", title: "ChatGPT vs Claude vs Gemini, at a Glance", desc: "A practical, no-hype comparison to help you pick the right assistant for the task in front of you." },
  { id: "r1c", module: 1, type: "Guide", title: "Free vs Paid AI: When to Upgrade", desc: "Simple signals that tell you when a free plan is enough and when paying actually pays off." },
  // Level 2 — Master Prompts
  { id: "r2a", module: 2, type: "Framework", title: "The A.R.T. Prompt Framework", desc: "Act As, Request, Terms — the 3-part structure behind every strong prompt in this course." },
  { id: "r2b", module: 2, type: "Prompt Pack", title: "5 Weak → Strong Prompt Rewrites", desc: "Real before/after examples showing exactly what turns a vague prompt into a useful one." },
  { id: "r2c", module: 2, type: "Checklist", title: "Prompt Review Checklist", desc: "6 quick checks — role, context, task, format, examples, constraints — before you hit send." },
  { id: "r2d", module: 2, type: "Template", title: "Master Prompt Builder", desc: "A fill-in-the-blanks template for turning any one-off prompt into a reusable master prompt." },
  // Level 3 — Apply
  { id: "r3a", module: 3, type: "Checklist", title: "AI Workflow Checklist (Input → Output → Review)", desc: "Keep every AI-assisted task honest with a simple 3-step review habit." },
  { id: "r3b", module: 3, type: "Template", title: "Email & Report Drafting Prompts", desc: "Ready-to-adapt prompts for professional emails, summaries, and reports." },
  { id: "r3c", module: 3, type: "Worksheet", title: "My First AI-Powered Workflow", desc: "Map one real task at work into an Input → AI Thinking → Output → Human Review flow." },
  // Level 4 — Reimagine
  { id: "r4a", module: 4, type: "Template", title: "AI Marketing Campaign Worksheet", desc: "Plan a full campaign: idea, headline, ad copy, poster, reel script, and CTA in one place." },
  { id: "r4b", module: 4, type: "Cheat Sheet", title: "Image Prompt vs Video Prompt", desc: "A side-by-side reference for what to describe when generating images versus video." },
  { id: "r4c", module: 4, type: "Prompt Pack", title: "Camera, Lighting & Sound Prompt Library", desc: "Ready phrases for camera movement, lighting mood, and sound to level up your video prompts." },
  // Level 5 — Transform
  { id: "r5a", module: 5, type: "Planner", title: "Idea → MVP Validation Planner", desc: "Take a raw idea through problem, audience, pain points, and a minimum viable version." },
  { id: "r5b", module: 5, type: "Checklist", title: "Digital Product Launch Checklist", desc: "The practical steps to check off before you launch an eBook, course, or template pack." },
  { id: "r5c", module: 5, type: "Guide", title: "Create an eBook with AI, Step by Step", desc: "A walkthrough for outlining, drafting, and polishing an eBook using AI as your co-writer." },
  // Level 6 — Execute Automatically
  { id: "r6a", module: 6, type: "Template", title: "Trigger → Logic → Action Blueprint", desc: "Sketch out any automation idea using the same 3-part structure taught in this level." },
  { id: "r6b", module: 6, type: "Checklist", title: "Automation Testing & Error Checklist", desc: "What to test, and where to add human approval, before an automation goes live." },
  { id: "r6c", module: 6, type: "Guide", title: "Your First Automated AI Workflow", desc: "A guided example — new lead to personalized follow-up — you can copy for your own work." },
  // Level 7 — Run AI Systems
  { id: "r7a", module: 7, type: "Planner", title: "30-Day AI Implementation Plan", desc: "Turn everything you've learned into a simple, dated action plan for the next month." },
  { id: "r7b", module: 7, type: "Worksheet", title: "Build Your Personal AI Operating System", desc: "The 12-part capstone worksheet: goals, tools, assistants, workflows, and human review points." },
  { id: "r7c", module: 7, type: "Guide", title: "AI Safety, Privacy & Responsible Use", desc: "Practical, non-technical guidance on using AI responsibly in your own work and business." },
];

const PROMPTS = [
  {
    id: "p1", title: "Turn a weak request into a strong prompt", category: "Productivity",
    use: "Use when your AI answers feel vague or generic.",
    body: "Act as a [ROLE]. Create [WHAT YOU NEED] for [TARGET AUDIENCE]. Use [TONE] and keep it in [FORMAT]. Focus on [MAIN GOAL] and avoid [WHAT TO AVOID].",
  },
  {
    id: "p2", title: "Facebook / Instagram ad in simple Hinglish", category: "Marketing",
    use: "Use when writing quick social ads for a course or product.",
    body: "Act as a digital marketing expert. Write a Facebook ad for [YOUR PRODUCT]. My target audience is [AUDIENCE]. Write the ad in simple Hinglish with a strong hook, problem, benefit and CTA.",
  },
  {
    id: "p3", title: "Summarize a long document", category: "Research",
    use: "Use for reports, articles or PDFs you don't have time to read fully.",
    body: "Summarize the following in [NUMBER] bullet points for a [AUDIENCE] who has 2 minutes. Keep the most important numbers and decisions. End with one recommended next action.",
  },
  {
    id: "p4", title: "Reel / short video script", category: "Content Creation",
    use: "Use for a 30-second promotional video script.",
    body: "Act as a video scriptwriter. Create a 30-second Instagram Reel script for [TOPIC/PRODUCT]. Audience: [AUDIENCE]. Start with a 3-second hook, keep the tone [TONE], and end with a clear call to action.",
  },
  {
    id: "p5", title: "Client / prospect follow-up email", category: "Sales",
    use: "Use after a meeting or call with a prospect.",
    body: "Act as a [YOUR ROLE]. Write a short, warm follow-up email to [PROSPECT NAME] after our meeting about [TOPIC]. Reference [KEY POINT DISCUSSED] and propose [NEXT STEP]. Keep it under 120 words.",
  },
  {
    id: "p6", title: "Turn feedback into an action plan", category: "Business",
    use: "Use to process customer or student feedback quickly.",
    body: "Here is customer feedback: [PASTE FEEDBACK]. Summarize the common problems, group them by theme, and suggest one practical solution for each. Flag anything urgent.",
  },
];

const CONFIDENCE_STATEMENTS = [
  "I understand what AI means.",
  "I understand Generative AI.",
  "I know how to write a basic prompt.",
  "I understand that AI can make mistakes.",
  "I know how AI can help in my work.",
  "I can choose the right AI tool for a task.",
];

const BADGES = [
  { module: 0, name: "AI Explorer" }, { module: 1, name: "AI Tool Scout" },
  { module: 2, name: "Prompt Master" }, { module: 3, name: "AI Productivity Pro" },
  { module: 4, name: "AI Creator" }, { module: 5, name: "AI Builder" },
  { module: 6, name: "Automation Architect" }, { module: 7, name: "AI Systems Master" },
];

/* ---------------------------------------------------------
   STORAGE HELPERS
--------------------------------------------------------- */
/* ---------------------------------------------------------
   LEVEL QUIZZES — 10 questions per level, auto-graded
--------------------------------------------------------- */
const QUIZZES = {
  0: [
    { q: "In simple terms, what is AI best compared to?", options: ["A very smart digital assistant", "A search engine only", "A calculator", "A television"], a: 0 },
    { q: "What is Generative AI mainly used for?", options: ["Creating new content like text, images or video", "Only storing files", "Only browsing the internet", "Only sending emails"], a: 0 },
    { q: "How is AI different from a search engine?", options: ["AI generates answers; a search engine mostly points you to existing pages", "They are exactly the same", "Search engines can create images", "AI cannot answer questions"], a: 0 },
    { q: "What is an 'AI hallucination'?", options: ["When AI confidently gives wrong or made-up information", "When AI shuts down", "When AI asks too many questions", "When AI runs slowly"], a: 0 },
    { q: "What is the best way to handle information from AI?", options: ["Verify important facts before relying on them", "Always trust it completely", "Never use AI for anything", "Only use AI for images"], a: 0 },
    { q: "Which of these is something AI currently CANNOT reliably do?", options: ["Guarantee 100% accurate facts every time", "Summarize text", "Draft an email", "Suggest ideas"], a: 0 },
    { q: "Why don't you need to be a programmer to use AI well?", options: ["Most everyday AI tools work through plain conversation", "AI tools require no internet", "AI has no settings", "Programming is required for every AI tool"], a: 0 },
    { q: "What mainly decides the quality of AI's response?", options: ["Which tool you choose and how clearly you explain the task", "The time of day", "The color of the app", "The length of the tool's name"], a: 0 },
    { q: "A student uses AI to write a report but the facts turn out wrong. What went wrong?", options: ["The output likely wasn't verified before use", "AI is completely useless", "The internet was down", "The student used too many words"], a: 0 },
    { q: "What is the overall goal of Level 0?", options: ["Move from AI confusion to AI confidence", "Learn to code from scratch", "Memorize every AI tool name", "Build a website"], a: 0 },
  ],
  1: [
    { q: "Why shouldn't you use just one AI tool for everything?", options: ["Different tools are better suited to different tasks", "Only one AI tool exists", "All AI tools are identical", "Using many tools is illegal"], a: 0 },
    { q: "What is an AI 'model' in simple terms?", options: ["The 'brain' working behind an AI application", "The screen you type into", "A type of computer mouse", "A downloadable app icon"], a: 0 },
    { q: "Should you memorize every AI model name that exists?", options: ["No — models change constantly, focus on what's good enough for your task", "Yes, memorize all of them", "Only memorize the newest one", "Model names never change"], a: 0 },
    { q: "When comparing ChatGPT, Claude, and Gemini, what should guide your choice?", options: ["Practical use cases for your specific task", "Whichever has the shortest name", "Random selection", "Only the price, ignoring the task"], a: 0 },
    { q: "When might a free AI tool be enough?", options: ["When your task is simple and doesn't need advanced features", "Never — always pay", "Only on weekends", "Free tools never work"], a: 0 },
    { q: "What is the first practical activity in Level 1?", options: ["Building your personal AI toolkit", "Writing a novel", "Coding an app", "Filing taxes"], a: 0 },
    { q: "Which category would an image-generation AI tool fall under?", options: ["Images and design", "Voice and audio", "Coding and product building", "Data and spreadsheets"], a: 0 },
    { q: "What question should guide picking an AI model?", options: ["'Which model is good enough for the work I need to do?'", "'Which model has the most followers?'", "'Which model is oldest?'", "'Which model has the loudest name?'"], a: 0 },
    { q: "A marketer needs help brainstorming captions. Which toolkit category fits best?", options: ["Writing and brainstorming", "Data and spreadsheets", "Video creation", "Coding and product building"], a: 0 },
    { q: "What is the outcome of completing Level 1?", options: ["A simple AI toolkit built around your actual needs", "A finished mobile app", "A university degree", "A finished automation system"], a: 0 },
  ],
  2: [
    { q: "What does the A.R.T. framework stand for?", options: ["Act As, Request, Terms", "Ask, Repeat, Try", "Analyze, Review, Test", "Act, Reply, Track"], a: 0 },
    { q: "In A.R.T., what does 'Act As' do?", options: ["Tells AI who or what role it should take on", "Deletes the previous prompt", "Ends the conversation", "Changes the app's language"], a: 0 },
    { q: "What does the 'Request' part of a prompt specify?", options: ["Exactly what you want AI to produce", "The AI model's name", "Your account password", "The time zone"], a: 0 },
    { q: "What do 'Terms' add to a prompt?", options: ["Conditions like tone, length, format, and style", "Nothing important", "Only the price", "The AI's internal code"], a: 0 },
    { q: "Why does the prompt 'Write a Facebook ad' usually give a weak result?", options: ["It gives AI very little context about audience, tone, or goal", "Facebook doesn't allow AI content", "It's too long", "AI cannot write ads at all"], a: 0 },
    { q: "Why is giving AI a clear role useful?", options: ["It shapes the expertise and tone of the response", "It slows AI down", "It's required by law", "It changes the AI's price"], a: 0 },
    { q: "What can you do if AI's first output isn't quite right?", options: ["Refine the prompt step-by-step and try again", "Give up on AI entirely", "Only use it for images afterward", "Restart your device"], a: 0 },
    { q: "What is a 'Master Prompt'?", options: ["A well-crafted, reusable prompt template you can use again and again", "A prompt only administrators can use", "A prompt that never needs editing", "A prompt written in another language"], a: 0 },
    { q: "Why should you always review AI's output?", options: ["AI can make mistakes, so human review catches errors", "Review is only needed for images", "AI output is always perfect", "It's optional and rarely useful"], a: 0 },
    { q: "Giving AI examples of desired output is useful because it:", options: ["Shows AI the style/format you want, improving accuracy", "Makes the response shorter automatically", "Is required before AI will respond", "Changes the AI model being used"], a: 0 },
  ],
  3: [
    { q: "What is the 'workflow mindset' taught in Level 3?", options: ["Input → AI Thinking → Output → Human Review", "Input → Delete → Restart", "Only using AI once per day", "Avoiding AI for repetitive tasks"], a: 0 },
    { q: "Why review AI output before acting on it?", options: ["To catch errors and confirm the result is actually useful", "Because AI output is always wrong", "Review is legally required everywhere", "It makes AI faster"], a: 0 },
    { q: "Which task is a good beginner use of AI in daily work?", options: ["Summarizing a long report", "Physically repairing hardware", "Manually retyping the same document", "Ignoring emails"], a: 0 },
    { q: "How can AI help with customer feedback, per the workflow example?", options: ["Summarize it, identify common problems, and suggest solutions", "Delete all the feedback automatically", "Only translate it", "Print it out"], a: 0 },
    { q: "What is emphasized as more powerful than using AI as 'just a chatbot'?", options: ["Using AI as part of a structured process", "Using AI only for entertainment", "Avoiding AI in professional work", "Using AI without any instructions"], a: 0 },
    { q: "Which of these is a practical Level 3 use case?", options: ["Writing a professional email with AI", "Manually calculating payroll by hand", "Disconnecting from the internet", "Ignoring spreadsheets"], a: 0 },
    { q: "What is the outcome of Level 3?", options: ["Using multiple AI tools to complete real professional work", "Becoming a certified programmer", "Building a mobile game", "Learning a new spoken language"], a: 0 },
    { q: "AI can help you work with which of these formats mentioned in Level 3?", options: ["PDFs and spreadsheets", "Only paper documents", "Only handwritten notes", "Only phone calls"], a: 0 },
    { q: "What comes after 'AI Thinking' in the workflow mindset?", options: ["Output, then Human Review", "Automatic deletion", "Nothing — the process ends", "Sending to a random contact"], a: 0 },
    { q: "Why is human review the final step in the workflow, not AI?", options: ["Humans confirm accuracy and make the final judgment call", "Humans are slower so they go last by default", "AI cannot finish a task without a human typing the last word", "It's simply a tradition with no real reason"], a: 0 },
  ],
  4: [
    { q: "What is the main difference between an image prompt and a video prompt?", options: ["An image prompt describes 'what should appear'; a video prompt describes 'what should happen'", "They are exactly the same", "Video prompts don't need any description", "Image prompts require code"], a: 0 },
    { q: "Which of these belongs in a strong video prompt?", options: ["Camera movement, lighting, and duration", "Only a single word", "Your email password", "Nothing — video needs no prompt"], a: 0 },
    { q: "What does 'character consistency' in AI video refer to?", options: ["Keeping a character looking the same across multiple scenes", "Changing the character every frame", "Using random characters each time", "Removing all characters"], a: 0 },
    { q: "What's included in the Level 4 module project?", options: ["A complete AI marketing campaign with copy, poster, and video concept", "A tax report", "A hardware repair guide", "A cooking recipe"], a: 0 },
    { q: "Which tool category would you use to create a content calendar?", options: ["Writing and brainstorming / planning tools", "Video editing hardware", "Physical printers", "Accounting software only"], a: 0 },
    { q: "What should a professional image prompt clearly describe?", options: ["The subject, style, and visual details you want", "Nothing specific — AI guesses everything", "Only the file size", "The AI company's name"], a: 0 },
    { q: "In a video prompt, 'emotion' and 'sound' help define what?", options: ["The mood and audio experience of the generated video", "The video's file format only", "The price of the tool", "The login credentials"], a: 0 },
    { q: "What does Level 4 turn your AI assistant into?", options: ["A personal creative studio", "A spreadsheet calculator", "A search engine only", "A physical printer"], a: 0 },
    { q: "Which is an example of a Level 4 skill?", options: ["Writing scripts and stories with AI", "Filing legal paperwork", "Repairing a laptop", "Setting up Wi-Fi routers"], a: 0 },
    { q: "A poster/ad creative task falls under which Level 4 focus?", options: ["Turning ideas into visual content", "Automating email replies", "Building a spreadsheet formula", "Writing legal contracts"], a: 0 },
  ],
  5: [
    { q: "What is the first step in turning an idea into a digital product?", options: ["Finding a problem worth solving", "Launching immediately", "Hiring a large team", "Buying advertising"], a: 0 },
    { q: "What does MVP stand for in this context?", options: ["Minimum Viable Product", "Most Valuable Person", "Maximum Viable Plan", "Main Video Project"], a: 0 },
    { q: "Why validate an idea before building it fully?", options: ["To confirm real demand before investing more time and effort", "Validation is not necessary", "It guarantees instant sales", "It replaces the need for a product"], a: 0 },
    { q: "Which of these is listed as a possible AI-assisted digital product?", options: ["An eBook created with AI", "A physical vehicle", "A bank loan", "A government ID"], a: 0 },
    { q: "What is a key benefit of using AI to research pain points?", options: ["It helps uncover what your audience actually struggles with", "It removes the need for any audience research", "It guarantees a viral product", "It replaces the product entirely"], a: 0 },
    { q: "What should happen after you launch a first AI-assisted product?", options: ["Test and improve it based on results", "Never touch it again", "Immediately build a second, unrelated product", "Delete all customer feedback"], a: 0 },
    { q: "Which of these is part of the Level 5 idea-to-product path?", options: ["Idea → Research → Plan → Creation → Product", "Idea → Ignore → Forget", "Product → Idea → Delete", "Research → Delay → Cancel"], a: 0 },
    { q: "Building simple websites and landing pages falls under which level?", options: ["Level 5 — Transform", "Level 2 — Master Prompts", "Level 0 — Understand", "Level 6 — Execute Automatically"], a: 0 },
    { q: "What does Level 5 teach about coding?", options: ["An introduction to AI-assisted coding", "Full computer science theory", "Only hardware assembly", "How to build a computer chip"], a: 0 },
    { q: "What is the outcome of Level 5?", options: ["Turning a real problem into a useful AI-assisted solution", "Passing a government exam", "Learning a musical instrument", "Memorizing programming syntax"], a: 0 },
  ],
  6: [
    { q: "What is the Simple Automation Framework taught in Level 6?", options: ["Trigger → Logic → Action", "Start → Stop → Repeat", "Idea → Product → Sale", "Input → Delete → Ignore"], a: 0 },
    { q: "In the framework, what is a 'Trigger'?", options: ["Something that happens which starts the process", "The final output", "A type of AI model", "A software bug"], a: 0 },
    { q: "What does 'Logic' decide in an automation?", options: ["What should happen based on the situation", "The color scheme of the app", "The company's name", "Nothing — logic is skipped"], a: 0 },
    { q: "What does 'Action' represent in the framework?", options: ["The system performing the next concrete step", "A meeting invitation only", "A software license", "A blank screen"], a: 0 },
    { q: "Why is 'human approval' sometimes added into a workflow?", options: ["To review important decisions before the automation continues", "Because automations never make mistakes", "It's required by every automation with no exceptions", "To slow the system down for no reason"], a: 0 },
    { q: "What should you do after building an automation?", options: ["Test it and handle possible errors", "Delete it immediately", "Never check it again", "Automatically distrust the results"], a: 0 },
    { q: "What is the goal of Level 6?", options: ["Turning repetitive manual work into automated workflows", "Learning to paint", "Filing paperwork by hand", "Avoiding all software tools"], a: 0 },
    { q: "In the 'New Lead' automation example, what happens after 'AI drafts personalized message'?", options: ["Human approval, then the message is sent", "The lead is deleted", "Nothing happens next", "The database is erased"], a: 0 },
    { q: "What is the difference between automation and AI automation?", options: ["AI automation adds intelligent decision-making inside the workflow", "There is no difference at all", "AI automation removes all human involvement by law", "Automation only works with paper forms"], a: 0 },
    { q: "Which best describes 'connecting apps together' in Level 6?", options: ["Letting information move automatically between tools", "Manually retyping data between every app", "Deleting unused apps", "Buying new hardware"], a: 0 },
  ],
  7: [
    { q: "What is the final goal of Level 7?", options: ["Build your Personal AI Operating System", "Learn a new spoken language", "Memorize every AI tool ever made", "Delete your AI toolkit"], a: 0 },
    { q: "What is the difference between an AI assistant and an AI agent?", options: ["An agent can take actions toward a goal, not just respond to prompts", "They are identical in every way", "An assistant can never answer questions", "An agent only works offline"], a: 0 },
    { q: "Why give AI access to the 'right knowledge'?", options: ["So its responses are grounded in accurate, relevant information", "So it stops working entirely", "It has no effect on output quality", "To make the AI slower"], a: 0 },
    { q: "What is a 'reusable AI instruction'?", options: ["A saved set of guidance you apply across multiple tasks", "A one-time instruction you can never reuse", "A password", "A hardware setting"], a: 0 },
    { q: "What does 'human-in-the-loop' mean in an AI system?", options: ["A human reviews or approves key steps in the process", "No human is ever involved", "The system runs only on holidays", "AI replaces all human judgment permanently"], a: 0 },
    { q: "Which topic is explicitly part of Level 7?", options: ["AI safety, privacy, and responsible use", "Cooking recipes", "Car maintenance", "Furniture assembly"], a: 0 },
    { q: "What does the '30-Day AI Implementation Plan' help with?", options: ["Turning what you've learned into a concrete action plan", "Deleting your AI toolkit after 30 days", "Ending the course early", "Switching to a different course"], a: 0 },
    { q: "What connects together to form a 'Personal AI Operating System'?", options: ["Goals, AI assistants, knowledge, tools, workflows, and automations", "Only one single chatbot app", "A single downloaded PDF", "Nothing — it's just a name"], a: 0 },
    { q: "By Level 7, what should a student be able to do?", options: ["Build their own AI-powered way of working", "Only ask AI simple one-off questions", "Avoid using AI for real tasks", "Rely solely on manual work"], a: 0 },
    { q: "What is emphasized alongside connecting AI tools in Level 7?", options: ["Responsible use and human oversight", "Removing all human oversight", "Ignoring privacy considerations", "Avoiding any review of AI output"], a: 0 },
  ],
};

const STORE_KEY = "learning-hub-state";
const DEFAULT_STATE = {
  name: "Learner",
  completedLessons: {},   // "moduleId-lessonIdx": true
  favorites: {},          // promptId: true
  confidenceHistory: [],  // [{date, score}]
  quizScores: {},         // moduleId: { score, total, date }
  goals: ["", "", ""],
  streak: 3,
};

async function loadState() {
  try {
    const res = await window.storage.get(STORE_KEY, false);
    if (res && res.value) return { ...DEFAULT_STATE, ...JSON.parse(res.value) };
  } catch (e) { /* no saved state yet */ }
  return DEFAULT_STATE;
}
async function saveState(state) {
  try { await window.storage.set(STORE_KEY, JSON.stringify(state), false); }
  catch (e) { console.error("save failed", e); }
}

/* ---------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------- */
function Progress({ pct, color = C.teal, h = 8 }) {
  return (
    <div style={{ background: C.line, borderRadius: 99, height: h, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 99, transition: "width .4s ease" }} />
    </div>
  );
}

function Pill({ children, tone = "blue" }) {
  const tones = {
    blue: { bg: "#EAF1FF", fg: C.blue },
    teal: { bg: "#E7F8F5", fg: "#0D8E7E" },
    navy: { bg: "#EDEFF5", fg: C.navy },
    success: { bg: "#EAF7EC", fg: C.success },
  };
  const t = tones[tone];
  return (
    <span style={{
      background: t.bg, color: t.fg, fontSize: 11, fontWeight: 700,
      padding: "3px 9px", borderRadius: 99, letterSpacing: 0.3, textTransform: "uppercase"
    }}>{children}</span>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 16,
      padding: 18, cursor: onClick ? "pointer" : "default", ...style
    }}>{children}</div>
  );
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */
export default function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [activeModule, setActiveModule] = useState(null);
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    loadState().then((s) => { setState(s); setLoaded(true); });
    window.storage.get(AUTH_SESSION_KEY, false)
      .then((res) => { if (res && res.value) setSession(JSON.parse(res.value)); })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const handleAuthenticated = useCallback((sess) => {
    setSession(sess);
    window.storage.set(AUTH_SESSION_KEY, JSON.stringify(sess), false).catch(() => {});
    update((prev) => ({ ...prev, name: sess.name || prev.name }));
  }, []);

  const handleLogout = useCallback(() => {
    setSession(null);
    window.storage.delete(AUTH_SESSION_KEY, false).catch(() => {});
  }, []);

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  }, []);

  const totalLessons = MODULES.reduce((n, m) => n + m.lessons.length, 0);
  const completedCount = Object.keys(state.completedLessons).filter((k) => state.completedLessons[k]).length;
  const overallPct = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

  const moduleProgress = (m) => {
    const done = m.lessons.filter((_, i) => state.completedLessons[`${m.id}-${i}`]).length;
    return { done, total: m.lessons.length, pct: Math.round((done / m.lessons.length) * 100) };
  };
  const moduleStatus = (m) => {
    const { done, total } = moduleProgress(m);
    if (done === 0) return "Not Started";
    if (done === total) return "Completed";
    return "In Progress";
  };
  const currentModule = MODULES.find((m) => moduleStatus(m) === "In Progress") ||
    MODULES.find((m) => moduleStatus(m) === "Not Started") || MODULES[0];

  const toggleLesson = (moduleId, idx) => {
    update((prev) => {
      const key = `${moduleId}-${idx}`;
      const next = { ...prev, completedLessons: { ...prev.completedLessons, [key]: !prev.completedLessons[key] } };
      return next;
    });
  };

  const toggleFavorite = (id) => {
    update((prev) => ({ ...prev, favorites: { ...prev.favorites, [id]: !prev.favorites[id] } }));
  };

  if (!loaded || !authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.sub, fontFamily: "Inter, sans-serif" }}>Loading your workspace…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; } h1,h2,h3,.display { font-family: 'Manrope', sans-serif; } button { font-family: inherit; }`}</style>
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.ink,
      fontFamily: "Inter, system-ui, sans-serif", paddingBottom: 84,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        h1,h2,h3,.display { font-family: 'Manrope', sans-serif; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
      `}</style>

      <TopBar name={state.name} streak={state.streak} />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
        {tab === "home" && (
          <HomeTab
            state={state} overallPct={overallPct} currentModule={currentModule}
            moduleProgress={moduleProgress} moduleStatus={moduleStatus}
            onOpenModule={(m) => { setActiveModule(m); setTab("learn"); }}
          />
        )}
        {tab === "learn" && (
          <LearnTab
            activeModule={activeModule} setActiveModule={setActiveModule}
            moduleProgress={moduleProgress} moduleStatus={moduleStatus}
            completedLessons={state.completedLessons} toggleLesson={toggleLesson}
            quizScores={state.quizScores}
            onSaveQuizScore={(moduleId, score, total) => update((prev) => ({
              ...prev, quizScores: { ...prev.quizScores, [moduleId]: { score, total, date: Date.now() } },
            }))}
          />
        )}
        {tab === "resources" && (
          <ResourcesTab
            confidenceHistory={state.confidenceHistory}
            onSubmitAssessment={(score) => update((prev) => ({
              ...prev, confidenceHistory: [...prev.confidenceHistory, { date: Date.now(), score }],
            }))}
            favorites={state.favorites} toggleFavorite={toggleFavorite}
          />
        )}
        {tab === "coach" && <CoachTab currentModule={currentModule} />}
        {tab === "profile" && (
          <ProfileTab
            state={state} update={update} overallPct={overallPct}
            completedCount={completedCount} totalLessons={totalLessons}
            moduleStatus={moduleStatus} session={session} onLogout={handleLogout}
          />
        )}
      </main>

      <BottomNav tab={tab} setTab={(t) => { setTab(t); if (t !== "learn") setActiveModule(null); }} />
    </div>
  );
}

/* ---------------------------------------------------------
   TOP BAR
--------------------------------------------------------- */
/* ---------------------------------------------------------
   AUTH SCREEN — register, verify OTP, log in
--------------------------------------------------------- */
function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // login | register | otp
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const reset = () => { setError(""); setInfo(""); };

  const submitRegister = async () => {
    reset();
    if (!name.trim() || !email.trim() || !password) return setError("Please fill in all fields.");
    if (password.length < 6) return setError("Password should be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const passwordHash = await hashPassword(password, email);
    const res = await callBackend("register", { name: name.trim(), email: email.trim(), passwordHash });
    setBusy(false);
    if (res.success) { setMode("otp"); setInfo(`We sent a 6-digit code to ${email.trim()}.`); }
    else setError(res.message || "Registration failed.");
  };

  const submitOtp = async () => {
    reset();
    if (otp.trim().length !== 6) return setError("Enter the 6-digit code from your email.");
    setBusy(true);
    const res = await callBackend("verifyOtp", { email: email.trim(), otp: otp.trim() });
    setBusy(false);
    if (res.success) onAuthenticated({ email: email.trim(), name: res.name || name.trim(), sessionToken: res.sessionToken });
    else setError(res.message || "Verification failed.");
  };

  const resendOtp = async () => {
    reset();
    setBusy(true);
    const res = await callBackend("resendOtp", { email: email.trim() });
    setBusy(false);
    if (res.success) setInfo("A new code has been sent.");
    else setError(res.message || "Couldn't resend the code.");
  };

  const submitLogin = async () => {
    reset();
    if (!email.trim() || !password) return setError("Please enter your email and password.");
    setBusy(true);
    const passwordHash = await hashPassword(password, email);
    const res = await callBackend("login", { email: email.trim(), passwordHash });
    setBusy(false);
    if (res.success) onAuthenticated({ email: email.trim(), name: res.name || "", sessionToken: res.sessionToken });
    else setError(res.message || "Login failed.");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 20px" }}>
      <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: C.blue, textTransform: "uppercase", fontWeight: 800 }}>AI Simplified Learning Hub</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 800, color: C.navy, marginTop: 6 }}>
            {mode === "login" && "Welcome back"}
            {mode === "register" && "Create your account"}
            {mode === "otp" && "Verify your email"}
          </div>
        </div>

        <Card>
          {mode === "register" && (
            <>
              <FieldLabel>Full name</FieldLabel>
              <TextInput value={name} onChange={setName} placeholder="Your name" />
              <FieldLabel>Email</FieldLabel>
              <TextInput value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
              <FieldLabel>Password</FieldLabel>
              <TextInput value={password} onChange={setPassword} placeholder="At least 6 characters" type="password" />
              <FieldLabel>Confirm password</FieldLabel>
              <TextInput value={confirm} onChange={setConfirm} placeholder="Re-enter password" type="password" last />
              {error && <ErrorText>{error}</ErrorText>}
              <AuthButton onClick={submitRegister} busy={busy}>Send verification code</AuthButton>
              <SwitchLine>
                Already have an account? <SwitchLink onClick={() => { setMode("login"); reset(); }}>Log in</SwitchLink>
              </SwitchLine>
            </>
          )}

          {mode === "login" && (
            <>
              <FieldLabel>Email</FieldLabel>
              <TextInput value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
              <FieldLabel>Password</FieldLabel>
              <TextInput value={password} onChange={setPassword} placeholder="Your password" type="password" last />
              {error && <ErrorText>{error}</ErrorText>}
              <AuthButton onClick={submitLogin} busy={busy}>Log in</AuthButton>
              <SwitchLine>
                New here? <SwitchLink onClick={() => { setMode("register"); reset(); }}>Create an account</SwitchLink>
              </SwitchLine>
            </>
          )}

          {mode === "otp" && (
            <>
              {info && <div style={{ fontSize: 13, color: C.sub, marginBottom: 14, lineHeight: 1.5 }}>{info}</div>}
              <FieldLabel>6-digit code</FieldLabel>
              <TextInput value={otp} onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))} placeholder="123456" last />
              {error && <ErrorText>{error}</ErrorText>}
              <AuthButton onClick={submitOtp} busy={busy}>Verify & continue</AuthButton>
              <SwitchLine>
                Didn't get a code? <SwitchLink onClick={resendOtp}>Resend</SwitchLink>
              </SwitchLine>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 12.5, fontWeight: 700, color: C.sub, marginBottom: 6, marginTop: 12 }}>{children}</div>;
}
function TextInput({ value, onChange, placeholder, type = "text", last }) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", padding: "11px 13px", borderRadius: 10, border: `1px solid ${C.line}`,
        fontSize: 14, marginBottom: last ? 4 : 0,
      }}
    />
  );
}
function ErrorText({ children }) {
  return <div style={{ fontSize: 12.5, color: "#DC2626", marginTop: 10, lineHeight: 1.4 }}>{children}</div>;
}
function AuthButton({ children, onClick, busy }) {
  return (
    <button onClick={onClick} disabled={busy} style={{
      width: "100%", marginTop: 16, background: busy ? C.line : C.navy, color: busy ? C.sub : "#fff",
      border: "none", borderRadius: 10, padding: "12px 16px", fontWeight: 700, fontSize: 14,
      cursor: busy ? "default" : "pointer",
    }}>{busy ? "Please wait…" : children}</button>
  );
}
function SwitchLine({ children }) {
  return <div style={{ textAlign: "center", fontSize: 12.5, color: C.sub, marginTop: 14 }}>{children}</div>;
}
function SwitchLink({ children, onClick }) {
  return <span onClick={onClick} style={{ color: C.blue, fontWeight: 700, cursor: "pointer" }}>{children}</span>;
}


function TopBar({ name, streak }) {
  return (
    <div style={{ background: C.navy, color: "#fff", padding: "18px 16px 26px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#8FA3C8", textTransform: "uppercase", fontWeight: 700 }}>
            AI Simplified Learning Hub
          </div>
          <div className="display" style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
            Welcome back, {name} 👋
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)",
          padding: "6px 10px", borderRadius: 99,
        }}>
          <Flame size={15} color="#FDBA74" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{streak}d</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   HOME / DASHBOARD
--------------------------------------------------------- */
function HomeTab({ state, overallPct, currentModule, moduleProgress, moduleStatus, onOpenModule }) {
  return (
    <div style={{ marginTop: -18, display: "flex", flexDirection: "column", gap: 18 }}>
      <Card style={{ boxShadow: "0 8px 24px rgba(11,30,61,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Course Progress
          </div>
          <div className="display" style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>{overallPct}%</div>
        </div>
        <div style={{ marginTop: 10 }}><Progress pct={overallPct} /></div>
        <div style={{ marginTop: 14, fontSize: 13, color: C.sub }}>Current level</div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Level {currentModule.id} — {currentModule.title}</div>
        <button
          onClick={() => onOpenModule(currentModule)}
          style={{
            marginTop: 12, width: "100%", background: C.blue, color: "#fff", border: "none",
            borderRadius: 12, padding: "12px 16px", fontWeight: 700, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
          }}>
          Continue Learning <ChevronRight size={16} />
        </button>
      </Card>

      <div>
        <SectionTitle>Your AI Mastery Ladder</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {MODULES.map((m) => {
            const { pct } = moduleProgress(m);
            const status = moduleStatus(m);
            return (
              <Card key={m.id} onClick={() => onOpenModule(m)} style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: status === "Completed" ? C.success : status === "In Progress" ? C.blue : C.line,
                    color: status === "Not Started" ? C.sub : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13,
                  }}>
                    {status === "Completed" ? <Check size={16} /> : m.id}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{m.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>{m.code} · {m.lessons.length} lessons</div>
                    <div style={{ marginTop: 6 }}><Progress pct={pct} h={5} color={status === "Completed" ? C.success : C.teal} /></div>
                  </div>
                  <ChevronRight size={18} color={C.sub} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div className="display" style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{children}</div>;
}

/* ---------------------------------------------------------
   LEARN TAB
--------------------------------------------------------- */
function LearnTab({ activeModule, setActiveModule, moduleProgress, moduleStatus, completedLessons, toggleLesson, quizScores, onSaveQuizScore }) {
  const [quizModule, setQuizModule] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);

  if (quizModule) {
    return (
      <QuizView
        module={quizModule}
        onExit={() => setQuizModule(null)}
        onFinish={(score, total) => onSaveQuizScore(quizModule.id, score, total)}
        priorScore={quizScores[quizModule.id]}
      />
    );
  }

  if (!activeModule) {
    return (
      <div>
        <SectionTitle>Learn</SectionTitle>
        <p style={{ color: C.sub, fontSize: 13, marginTop: 4, marginBottom: 14 }}>
          Eight levels. Zero to hero, one clear step at a time.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MODULES.map((m) => {
            const { pct, done, total } = moduleProgress(m);
            const qs = quizScores[m.id];
            return (
              <Card key={m.id} onClick={() => setActiveModule(m)}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <Pill tone="navy">Level {m.id} · {m.code}</Pill>
                    <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8 }}>{m.title}</div>
                    <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>{m.goal}</div>
                  </div>
                  {qs && <Pill tone={qs.score / qs.total >= 0.7 ? "success" : "blue"}>Quiz {qs.score}/{qs.total}</Pill>}
                </div>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}><Progress pct={pct} /></div>
                  <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{done}/{total}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const m = activeModule;
  const { pct, done, total } = moduleProgress(m);
  const qs = quizScores[m.id];
  return (
    <div>
      <button onClick={() => setActiveModule(null)} style={backBtnStyle}>← All levels</button>
      <Pill tone="navy">Level {m.id} · {m.code}</Pill>
      <h2 style={{ margin: "10px 0 4px", fontSize: 22, fontWeight: 800 }}>{m.title}</h2>
      <p style={{ color: C.teal, fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>"{m.promise}"</p>
      <p style={{ color: C.sub, fontSize: 14, margin: "0 0 16px" }}>{m.goal}</p>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          <span>Level progress</span><span>{done}/{total}</span>
        </div>
        <Progress pct={pct} />
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {m.lessons.map((l, i) => {
          const key = `${m.id}-${i}`;
          const done = !!completedLessons[key];
          const isOpen = expandedLesson === key;
          const content = LESSON_CONTENT[key];
          return (
            <Card key={key} style={{
              padding: 0, overflow: "hidden",
              borderColor: done ? "#CDEBE6" : C.line, background: done ? "#F5FBFA" : C.card,
            }}>
              <div
                onClick={() => setExpandedLesson(isOpen ? null : key)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, cursor: "pointer" }}
              >
                <span onClick={(e) => { e.stopPropagation(); toggleLesson(m.id, i); }} style={{ display: "flex", flexShrink: 0 }}>
                  {done ? <CheckCircle2 size={20} color={C.success} /> : <Circle size={20} color={C.line} />}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: done ? C.sub : C.ink, textDecoration: done ? "line-through" : "none" }}>
                  Lesson {m.id}.{i + 1}: {l}
                </span>
                <ChevronDown size={16} color={C.sub} style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
              </div>
              {isOpen && content && (
                <div style={{ padding: "0 14px 16px 46px" }}>
                  <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55, margin: "0 0 10px" }}>{content.explain}</p>
                  <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: 11 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.teal, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>
                      Try it now
                    </div>
                    <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{content.activity}</div>
                  </div>
                  {!done && (
                    <button onClick={() => toggleLesson(m.id, i)} style={{
                      marginTop: 10, background: C.navy, color: "#fff", border: "none", borderRadius: 8,
                      padding: "8px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                    }}><Check size={13} /> Mark lesson complete</button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card style={{ background: C.navy, border: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Level {m.id} Quiz</div>
            <div style={{ color: "#8FA3C8", fontSize: 12.5, marginTop: 2 }}>
              {qs ? `Best score: ${qs.score}/${qs.total}` : `${QUIZZES[m.id]?.length || 10} questions · auto-graded`}
            </div>
          </div>
          <button onClick={() => setQuizModule(m)} style={{
            background: C.teal, color: "#08201C", border: "none", borderRadius: 10,
            padding: "9px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer",
          }}>{qs ? "Retake" : "Start Quiz"}</button>
        </div>
      </Card>
    </div>
  );
}

function shuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuizView({ module: m, onExit, onFinish, priorScore }) {
  const questions = QUIZZES[m.id] || [];
  const [prepared] = useState(() => questions.map((q, qi) => {
    const opts = q.options.map((text, i) => ({ text, correct: i === q.a }));
    return { q: q.q, options: shuffle(opts, qi + m.id * 100 + 7) };
  }));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = prepared[idx];

  const choose = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (current.options[i].correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 < prepared.length) {
      setIdx(idx + 1); setSelected(null);
    } else {
      setDone(true);
      onFinish(score, prepared.length);
    }
  };

  if (done) {
    const pct = Math.round((score / prepared.length) * 100);
    const pass = pct >= 70;
    return (
      <div>
        <button onClick={onExit} style={backBtnStyle}>← Back to level</button>
        <Card style={{ textAlign: "center", padding: 26 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Quiz complete</div>
          <div className="display" style={{ fontSize: 36, fontWeight: 800, color: pass ? C.success : C.navy, marginTop: 6 }}>
            {score}/{prepared.length}
          </div>
          <div style={{ marginTop: 4 }}><Pill tone={pass ? "success" : "blue"}>{pct}% {pass ? "Passed" : "Keep practicing"}</Pill></div>
          <p style={{ color: C.sub, fontSize: 13.5, marginTop: 12 }}>
            {pass
              ? "Solid understanding of this level. Ready to move on."
              : "Review the lessons in this level and retake the quiz when ready."}
          </p>
          {priorScore && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 8 }}>Previous best: {priorScore.score}/{priorScore.total}</div>}
          <button onClick={onExit} style={{
            marginTop: 16, background: C.navy, color: "#fff", border: "none", borderRadius: 10,
            padding: "10px 18px", fontWeight: 700, fontSize: 13.5, cursor: "pointer",
          }}>Back to Level {m.id}</button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onExit} style={backBtnStyle}>← Exit quiz</button>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.sub, fontWeight: 700, marginBottom: 8 }}>
        <span>Level {m.id} Quiz</span><span>Question {idx + 1}/{prepared.length}</span>
      </div>
      <Progress pct={(idx / prepared.length) * 100} />

      <Card style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 14 }}>{current.q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {current.options.map((o, i) => {
            const isSelected = selected === i;
            const showCorrect = selected !== null && o.correct;
            const showWrong = isSelected && !o.correct;
            return (
              <button key={i} onClick={() => choose(i)} style={{
                textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: selected === null ? "pointer" : "default",
                fontSize: 14, fontWeight: 600,
                border: `1.5px solid ${showCorrect ? C.success : showWrong ? "#DC2626" : C.line}`,
                background: showCorrect ? "#EAF7EC" : showWrong ? "#FDECEC" : "#fff",
                color: C.ink,
              }}>{o.text}</button>
            );
          })}
        </div>
        {selected !== null && (
          <button onClick={next} style={{
            marginTop: 16, width: "100%", background: C.blue, color: "#fff", border: "none",
            borderRadius: 10, padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>{idx + 1 < prepared.length ? "Next Question" : "See Results"}</button>
        )}
      </Card>
    </div>
  );
}

const backBtnStyle = {
  background: "none", border: "none", color: C.blue, fontWeight: 700, fontSize: 13,
  padding: 0, marginBottom: 12, cursor: "pointer",
};

function filterChipStyle(active) {
  return {
    padding: "6px 12px", borderRadius: 99, border: "none", cursor: "pointer",
    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
    background: active ? C.blue : "#fff", color: active ? "#fff" : C.sub,
    boxShadow: active ? "none" : `inset 0 0 0 1px ${C.line}`,
  };
}

/* ---------------------------------------------------------
   RESOURCES TAB (library + assessment + prompt library)
--------------------------------------------------------- */
function ResourcesTab({ confidenceHistory, onSubmitAssessment, favorites, toggleFavorite }) {
  const [sub, setSub] = useState("library"); // library | assessment | prompts
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const filteredResources = RESOURCES.filter((r) =>
    r.title.toLowerCase().includes(query.toLowerCase()) &&
    (levelFilter === "all" || r.module === levelFilter)
  );
  const filteredPrompts = PROMPTS.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <SectionTitle>Resources</SectionTitle>
      <div style={{ display: "flex", gap: 6, marginTop: 10, marginBottom: 14 }}>
        {[["library", "Library"], ["assessment", "Confidence Check"], ["prompts", "Prompt Library"]].map(([k, label]) => (
          <button key={k} onClick={() => setSub(k)} style={{
            padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: 12.5, fontWeight: 700,
            background: sub === k ? C.navy : "#fff", color: sub === k ? "#fff" : C.sub,
            boxShadow: sub === k ? "none" : `inset 0 0 0 1px ${C.line}`,
          }}>{label}</button>
        ))}
      </div>

      {sub !== "assessment" && (
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={16} color={C.sub} style={{ position: "absolute", left: 12, top: 12 }} />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={sub === "prompts" ? "Search prompts…" : "Search your AI resources…"}
            style={{
              width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10,
              border: `1px solid ${C.line}`, fontSize: 14, background: "#fff",
            }}
          />
        </div>
      )}

      {sub === "library" && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
            <button onClick={() => setLevelFilter("all")} style={filterChipStyle(levelFilter === "all")}>All</button>
            {MODULES.map((m) => (
              <button key={m.id} onClick={() => setLevelFilter(m.id)} style={filterChipStyle(levelFilter === m.id)}>
                Lvl {m.id}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>{filteredResources.length} resource{filteredResources.length !== 1 ? "s" : ""}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredResources.map((r) => (
              <Card key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Pill tone="teal">{r.type}</Pill>
                    <Pill tone="navy">Level {r.module}</Pill>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginTop: 7 }}>{r.title}</div>
                  {r.desc && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3, lineHeight: 1.4 }}>{r.desc}</div>}
                </div>
                <Download size={18} color={C.blue} style={{ marginTop: 2, flexShrink: 0 }} />
              </Card>
            ))}
          </div>
        </>
      )}

      {sub === "prompts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredPrompts.map((p) => (
            <PromptCard key={p.id} p={p} fav={!!favorites[p.id]} onFav={() => toggleFavorite(p.id)} />
          ))}
        </div>
      )}

      {sub === "assessment" && (
        <AssessmentCard history={confidenceHistory} onSubmit={onSubmitAssessment} />
      )}
    </div>
  );
}

function PromptCard({ p, fav, onFav }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(p.body).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Pill tone="blue">{p.category}</Pill>
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>{p.title}</div>
        </div>
        <button onClick={onFav} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: fav ? "#F59E0B" : C.line }}>★</button>
      </div>
      <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>{p.use}</div>
      <div style={{
        marginTop: 10, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10,
        padding: 10, fontSize: 12.5, fontFamily: "monospace", lineHeight: 1.5, color: C.ink,
      }}>{p.body}</div>
      <button onClick={copy} style={{
        marginTop: 10, background: copied ? C.success : C.navy, color: "#fff", border: "none",
        borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy prompt</>}
      </button>
    </Card>
  );
}

function AssessmentCard({ history, onSubmit }) {
  const [answers, setAnswers] = useState(Array(CONFIDENCE_STATEMENTS.length).fill(0));
  const [result, setResult] = useState(null);
  const last = history[history.length - 1];
  const prev = history[history.length - 2];

  const submit = () => {
    if (answers.some((a) => a === 0)) return;
    const score = answers.reduce((a, b) => a + b, 0);
    onSubmit(score);
    setResult(score);
  };

  const max = CONFIDENCE_STATEMENTS.length * 5;
  const finalScore = result ?? last?.score;

  if (finalScore) {
    const interp = finalScore / max < 0.4
      ? "You're just getting started — that's exactly where this course begins."
      : finalScore / max < 0.7
      ? "Great start! You already understand some AI basics. Your confidence will keep growing."
      : "Strong foundation. You're ready to move fast through the practical levels.";
    return (
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Your AI Confidence Score</div>
        <div className="display" style={{ fontSize: 34, fontWeight: 800, color: C.navy, marginTop: 4 }}>{finalScore} / {max}</div>
        <p style={{ fontSize: 13.5, color: C.sub, marginTop: 6 }}>{interp}</p>
        {prev && (
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: C.success }}>
            Improvement since your first check: +{finalScore - prev.score}
          </div>
        )}
        <button onClick={() => setResult(null)} style={{
          marginTop: 14, background: "none", border: `1px solid ${C.line}`, borderRadius: 10,
          padding: "9px 14px", fontSize: 13, fontWeight: 700, color: C.navy, cursor: "pointer",
        }}>Retake assessment</button>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>AI Confidence Check</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>Rate each statement from 1 (not at all) to 5 (very confident).</div>
      {CONFIDENCE_STATEMENTS.map((s, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>{s}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => {
                const next = [...answers]; next[i] = n; setAnswers(next);
              }} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
                border: `1px solid ${answers[i] === n ? C.blue : C.line}`,
                background: answers[i] === n ? C.blue : "#fff",
                color: answers[i] === n ? "#fff" : C.sub,
              }}>{n}</button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={submit} disabled={answers.some((a) => a === 0)} style={{
        width: "100%", background: answers.some((a) => a === 0) ? C.line : C.blue,
        color: answers.some((a) => a === 0) ? C.sub : "#fff", border: "none", borderRadius: 12,
        padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer",
      }}>See My Score</button>
    </Card>
  );
}

/* ---------------------------------------------------------
   AI COACH TAB — real model call
--------------------------------------------------------- */
const COACH_SYSTEM = `You are the "AI Simplified Coach" — a friendly, encouraging educational assistant embedded in a course called "AI Simplified – Zero to Hero" (levels 0-7: Understand, Select, Master Prompts, Apply, Reimagine, Transform, Execute Automatically, Run AI Systems).
Your job is to help the student understand lessons, improve their prompts using the A.R.T. framework (Act As, Request, Terms), find the right AI tool, and apply AI to their own work.
Rules: keep language simple, roughly Class 10 reading level. Be warm and encouraging, never condescending. Keep answers short and practical — a few sentences or a short list, not an essay. You are a study companion, not a replacement for the actual course lessons; when useful, point the student back to the relevant level (e.g. "This is covered in Level 2 — Master Prompts").`;

function CoachTab({ currentModule }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: `Hi! 👋 I'm your AI Simplified Coach.\n\nI can help you understand lessons, improve a prompt, find the right AI tool, or apply AI to your work. You're currently on Level ${currentModule.id} — ${currentModule.title}.\n\nWhat would you like help with today?` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const quickActions = ["Explain a concept", "Improve my prompt", "Find an AI tool", "Quiz me on this level"];

  const send = async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || busy) return;
    const newMessages = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setInput("");
    setBusy(true);
    try {
      // Calls our own /api/coach serverless function, which holds the
      // Anthropic API key securely on the server — never in the browser.
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: COACH_SYSTEM,
          messages: newMessages.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await response.json();
      const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") || "Sorry, I couldn't generate a reply just now.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "I had trouble reaching the AI just now — please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 190px)" }}>
      <SectionTitle>AI Coach</SectionTitle>
      <div style={{ flex: 1, overflowY: "auto", marginTop: 12, display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", padding: "10px 13px", borderRadius: 14, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap",
              background: m.role === "user" ? C.blue : "#fff",
              color: m.role === "user" ? "#fff" : C.ink,
              border: m.role === "user" ? "none" : `1px solid ${C.line}`,
              borderBottomRightRadius: m.role === "user" ? 4 : 14,
              borderBottomLeftRadius: m.role === "user" ? 14 : 4,
            }}>
              {m.role === "assistant" && <Sparkles size={13} color={C.teal} style={{ marginBottom: 4 }} />}
              <div>{m.text}</div>
            </div>
          </div>
        ))}
        {busy && <div style={{ fontSize: 12.5, color: C.sub, paddingLeft: 4 }}>Coach is thinking…</div>}
      </div>

      {messages.length < 2 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {quickActions.map((q) => (
            <button key={q} onClick={() => send(q)} style={{
              fontSize: 12, fontWeight: 700, padding: "7px 11px", borderRadius: 99,
              border: `1px solid ${C.line}`, background: "#fff", color: C.navy, cursor: "pointer",
            }}>{q}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Ask your AI coach…"
          style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 14 }}
        />
        <button onClick={() => send()} disabled={busy} style={{
          background: C.navy, color: "#fff", border: "none", borderRadius: 12, width: 44,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}><Send size={16} /></button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   PROFILE TAB
--------------------------------------------------------- */
function ProfileTab({ state, update, overallPct, completedCount, totalLessons, moduleStatus, session, onLogout }) {
  const [goals, setGoals] = useState(state.goals);
  const earnedBadges = BADGES.filter((b) => moduleStatus(MODULES[b.module]) === "Completed");
  const quizEntries = MODULES.filter((m) => state.quizScores[m.id]);
  const avgQuizPct = quizEntries.length
    ? Math.round(quizEntries.reduce((s, m) => s + (state.quizScores[m.id].score / state.quizScores[m.id].total), 0) / quizEntries.length * 100)
    : null;

  const saveGoals = () => update((prev) => ({ ...prev, goals }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", background: C.navy, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, flexShrink: 0,
        }}>{state.name.charAt(0)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{state.name}</div>
          {session?.email && <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>{session.email}</div>}
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{completedCount}/{totalLessons} lessons complete · {overallPct}% overall</div>
        </div>
        {onLogout && (
          <button onClick={onLogout} style={{
            fontSize: 12, fontWeight: 700, color: C.sub, background: "none",
            border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", flexShrink: 0,
          }}>Log out</button>
        )}
      </Card>

      <div>
        <SectionTitle>Quiz Results</SectionTitle>
        <Card style={{ marginTop: 10 }}>
          {quizEntries.length === 0 ? (
            <div style={{ fontSize: 13, color: C.sub }}>No quizzes taken yet — start one from any level in Learn.</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Average across {quizEntries.length} level{quizEntries.length > 1 ? "s" : ""}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: avgQuizPct >= 70 ? C.success : C.navy }}>{avgQuizPct}%</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {quizEntries.map((m) => {
                  const qs = state.quizScores[m.id];
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                      <span style={{ color: C.ink, fontWeight: 600 }}>Level {m.id} — {m.code}</span>
                      <span style={{ color: qs.score / qs.total >= 0.7 ? C.success : C.sub, fontWeight: 700 }}>{qs.score}/{qs.total}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      <div>
        <SectionTitle>Badges</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          {BADGES.map((b) => {
            const earned = earnedBadges.some((e) => e.module === b.module);
            return (
              <Card key={b.module} style={{ textAlign: "center", padding: 12, opacity: earned ? 1 : 0.5 }}>
                {earned ? <Sparkles size={18} color={C.teal} /> : <Lock size={18} color={C.sub} />}
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{b.name}</div>
                <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2 }}>Level {b.module}</div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <SectionTitle>My AI Goals</SectionTitle>
        <Card style={{ marginTop: 10 }}>
          {goals.map((g, i) => (
            <input
              key={i} value={g}
              onChange={(e) => { const next = [...goals]; next[i] = e.target.value; setGoals(next); }}
              onBlur={saveGoals}
              placeholder={`Goal ${i + 1} — e.g. "Save 5 hours a week using AI"`}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`,
                fontSize: 13.5, marginBottom: i < goals.length - 1 ? 8 : 0,
              }}
            />
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   BOTTOM NAV
--------------------------------------------------------- */
function BottomNav({ tab, setTab }) {
  const items = [
    ["home", "Home", Home], ["learn", "Learn", BookOpen],
    ["resources", "Resources", Library], ["coach", "AI Coach", MessageCircle],
    ["profile", "Profile", User],
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff",
      borderTop: `1px solid ${C.line}`, display: "flex", padding: "8px 4px calc(8px + env(safe-area-inset-bottom))",
      maxWidth: 720, margin: "0 auto",
    }}>
      {items.map(([key, label, Icon]) => (
        <button key={key} onClick={() => setTab(key)} style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0",
          color: tab === key ? C.blue : C.sub,
        }}>
          <Icon size={20} strokeWidth={tab === key ? 2.4 : 2} />
          <span style={{ fontSize: 10.5, fontWeight: tab === key ? 700 : 500 }}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
