# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This file tells Claude how to work with you on this project. It is automatically read at the start of every conversation.

---

## Who I Am

I am a non-technical builder. I do not write code and I am not expected to understand it. My goal is to build and grow a golf club retailer and fitting directory website.

---

## How Claude Should Communicate With Me

- **Always explain what you are doing and why**, in plain English, before and after doing it. Pretend you are explaining to someone who has never coded before.
- **Never assume I know technical terms.** If you use one (e.g. "component", "route", "query", "deploy"), briefly explain it in parentheses the first time.
- **Be encouraging and reassuring.** Building software is confusing for beginners. Help me feel confident, not overwhelmed.
- **Give me context.** When you make a change to a file, tell me: what file it is, what it does, and why the change matters for the project.
- **Offer tips and shortcuts.** If there is a faster or easier way I can do something (in the browser, on my Mac, in the tools we are using), tell me.
- **Flag decisions clearly.** If I need to make a choice (e.g. between two approaches), present the options simply — no jargon — and give me a clear recommendation.
- **Tell me when something is risky.** If an action could break something or is hard to undo, warn me before doing it.
- **Keep responses focused.** Don't overwhelm me with too much at once. Do one thing at a time and confirm it worked before moving on.

---

## Project Overview

**What this project is:** A directory website listing golf club fitting shops and retailers across the United States. Golfers use it to find local shops that offer club fitting, custom fitting, and equipment retail.

**The website:** Built with Next.js (a tool for building websites) and Supabase (a database where all the shop data is stored). It was deployed on Vercel (a service that hosts the website on the internet).

**The data:** A CSV file called `golf_directory_MASTER.csv` contains all the shop listings. Python scripts were used to enrich that data (add extra details like hours, services, ratings) by scraping the web. All data lives in a Supabase database.

**The stack (tools being used):**
- **Next.js** — builds the website pages
- **Supabase** — the database (stores all shop info)
- **Vercel** — hosts the live website on the internet
- **Tailwind CSS** — styles/designs the pages
- **TypeScript** — the coding language used for the website
- **Python** — used for data scripts (enriching and uploading shop data)

---

## Project File Structure (What Lives Where)

```
BTG Clubfitting directory/
├── CLAUDE.md                        ← This file. Read by Claude every session.
│
├── web/                             ← The actual website code
│   ├── app/                         ← Each folder here = a page on the website
│   │   ├── page.tsx                 ← The homepage
│   │   ├── shops/                   ← The /shops listing page
│   │   │   └── [slug]/page.tsx      ← Individual shop profile pages
│   │   ├── states/                  ← Browse shops by state
│   │   │   └── [state]/page.tsx     ← Shops in a specific state
│   │   ├── sitemap.ts               ← Helps Google find all the pages
│   │   └── robots.ts                ← Tells Google what to index
│   │
│   ├── components/                  ← Reusable building blocks (like Lego pieces)
│   │   ├── layout/                  ← Navbar and Footer
│   │   ├── shops/                   ← ShopCard and FilterBar
│   │   ├── shop-profile/            ← ShopHours and ShopServices
│   │   ├── shop-map/                ← Google Maps embed
│   │   └── ui/                      ← Small UI pieces (Badge, StarRating)
│   │
│   ├── lib/                         ← Helper code and database queries
│   │   ├── supabase/queries/shops.ts ← All database lookups (get shops, filter, etc.)
│   │   ├── constants.ts             ← Shared values used across the site
│   │   └── utils.ts                 ← Small helper functions
│   │
│   ├── types/shop.ts                ← Defines what a "shop" object looks like in code
│   └── supabase/001_schema.sql      ← The database table structure
│
├── golf_directory_MASTER.csv        ← Master list of all shops (raw data)
├── enrich_golf_directory.py         ← Script that adds details to shop data
├── migrate_to_supabase.py           ← Script that uploads data to the database
└── recrawl_failed.py                ← Script to retry shops that failed enrichment
```

> **Tip:** When you want to change how the website looks or works, the files you care about most are inside `web/app/` (pages) and `web/components/` (building blocks).

---

## Current Status

- The website was built and deployed to Vercel
- Data pipeline (Python scripts) was created to enrich shop listings
- 1,049 static pages were generated at last build
- The git history shows files were deleted from the working directory — this may need to be restored

**First thing to check at the start of a new session:** Run `git status` to see if files need to be restored.

---

## Goals & Priorities

1. Get the website live and working correctly on Vercel
2. Make sure shop listings are accurate and well-presented
3. Improve SEO (Search Engine Optimisation — how Google finds and ranks the site)
4. Add new features as the directory grows (e.g. reviews, search filters, premium listings)
5. Eventually monetise — e.g. featured listings, affiliate links, lead gen for fitting shops

---

## Tools & Accounts (For My Reference)

- **Vercel** — hosts the website (vercel.com)
- **Supabase** — the database (supabase.com)
- **GitHub** — stores the code history (this repo)
- **Google Search Console** — tracks how Google sees the site

---

## Beginner Tips (Things Claude Will Remind Me Of)

- **"Deploy"** means pushing the website live so real visitors can see changes.
- **"Build"** means compiling the code into a version the internet can serve.
- **"Component"** is a reusable piece of a webpage (like a card, a button, or a header).
- **"Route"** is a URL path (e.g. `/shops` is a route).
- **"Query"** is a request to the database to get specific data.
- **"Schema"** is the structure/blueprint of the database (what columns each table has).
- If something breaks, the first step is almost always: check what changed last.
- Git is like a save history for code. It lets us undo mistakes.

---

## What Claude Should Do at the Start of Every Session

1. Check `git status` to understand the current state of the project files.
2. Briefly remind me of what the project is and where things stand.
3. Ask me what I want to work on today.

---

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## Frontend Design Skill

> Use this when building web components, pages, UI layouts, or styling/beautifying any part of the website. The goal is production-grade, distinctive design — not generic "AI slop."

### Design Thinking (Do This Before Writing Any Code)

Before touching code, commit to a **bold aesthetic direction**:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick a clear direction and own it — e.g. brutally minimal, luxury/refined, dark/moody, editorial/magazine, retro-futuristic, playful/whimsical, etc. The final result should feel singular and cohesive.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this unforgettable? What's the one thing a visitor will remember?

**Critical**: Choose a direction and execute it with conviction. Bold maximalism and refined minimalism both work — what matters is intentionality, not intensity.

---

### Aesthetics Guidelines

#### Typography
- Fonts carry the design's voice. Skip Arial, Inter, Roboto, system stacks — default fonts signal default thinking.
- Display type should be expressive. Body text should be legible and refined. Pair them like actors in a scene.
- Work the full typographic range: size, weight, case, letter-spacing, line-height.

#### Colour & Theme
- Commit to a clear position: bold and saturated, moody and restrained, or high-contrast minimal.
- Lead with a dominant colour, punctuate with sharp accents.
- Avoid timid, non-committal palettes. Use CSS variables for consistency.

#### Motion & Animation
- Use CSS animations for load sequences and hover states that surprise.
- One well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.
- Use scroll-triggered effects and hover states thoughtfully.

#### Spatial Composition
- Unexpected layouts. Asymmetry. Overlap and z-depth. Diagonal flow.
- Grid-breaking elements. Dramatic scale jumps. Full-bleed moments.
- Generous negative space OR controlled density — not both at once.

#### Backgrounds & Visual Details
- Create atmosphere and depth — don't default to flat solid colours.
- Consider: gradient meshes, noise/grain overlays, geometric patterns, glassmorphism, dramatic shadows and glows, decorative borders, clip-path shapes, print textures (halftone, duotone).

---

### What to Avoid

- Overused fonts: Inter, Roboto, Arial, Space Grotesk, system stacks
- Clichéd colour schemes: purple gradients on white backgrounds
- Predictable layouts and cookie-cutter component patterns
- Designs that could belong to any project — lack context-specific character

---

### What to Do Instead

- Distinctive fonts. Bold, committed palettes. Layouts that surprise. Bespoke details.
- Every choice rooted in the specific context of this golf directory.
- Match complexity to vision: maximalist designs need elaborate code; minimalist designs need restraint and precision.
- Excellence comes from executing the chosen vision well — not from following a template.
