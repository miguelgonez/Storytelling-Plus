<div align="center">  
  <h1>Paper Comicizer</h1>
  <p><strong>Turn dense academic PDFs into kid-friendly educational comics powered by Gemini 3 Pro.</strong></p>
  <p>    
    <img alt="React" src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white">
    <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white">
  </p>
  <p>
    <a href="./README.md">English</a> |
    <a href="./README.zh.md">中文</a> |
    <a href="./README.ja.md">日本語</a>
  </p>
</div>

## Table of contents
- [Overview](#overview)
- [Demo](#demo)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment variables](#environment-variables)
  - [Run locally](#run-locally)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Available scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Star history](#star-history)

## Overview
**Paper Comicizer** ingests any academic PDF, asks Gemini 3 Pro to summarize the core ideas, plans an educational lesson, and renders every page of the lesson as a comic strip. The UI focuses on clarity: upload a file, monitor three workflow stages (analyze → plan → generate), and browse the generated comic with thumbnails and page navigation.

## Screenshot
<img width="897" height="472" alt="chrome_2025-11-28_14-20-29" src="https://github.com/user-attachments/assets/94c72fff-ba18-43b1-8d5a-cf83eec20acd" />


## Features
- 📄 **PDF ingestion** – drag-and-drop upload converts any PDF to base64 before sending it to Gemini.
- 🤖 **Multi-step reasoning** – Gemini analyzes the paper, plans the narrative, and renders each panel.
- 🎨 **Live comic rendering** – each generated page appears immediately in the Comic Viewer with full-size previews and thumbnails.
- 🔐 **AI Studio key management** – prompts the user to pick an API key and gracefully handles expired sessions.
- ⚙️ **Service layer** – `services/geminiService.ts` centralizes prompt templates, error handling, and typed responses.
- 🧠 **Typed workflow state** – `AppStatus`, `ProcessingState`, and `ComicPage` keep the UI predictable and resilient.

## Tech stack
| Layer | Details |
| --- | --- |
| Front-end | React 19 + TypeScript, Vite 6 |
| Styling | Utility classes (Tailwind-style) with playful fonts and gradients |
| AI | `@google/genai` SDK calling Gemini 3 Pro (text + image) |
| Build | Vite dev server, static export-ready |

## Getting started

### Prerequisites
- **Node.js 18.18+** (Vite 6 requires modern Node runtimes)
- npm 9+ (comes with recent Node releases)
- A **Gemini API key** with billing enabled (https://ai.google.dev/gemini-api/docs/api-key), **Currently free for gemini3 and nano banana 2**

### Installation
```bash
# clone your fork, then:
cd Paper-Comicizer
npm install
```

### Environment variables
Create a `.env.local` file in the project root with your Gemini API key:
```bash
GEMINI_API_KEY="your-key-here"
```
AI Studio automatically injects the key if you launch the hosted experience, but local development requires this file.

### Run locally
```bash
npm run dev
```
Open the printed localhost URL. Upload a PDF and watch the progress indicator walk through the three stages.

To create an optimized production build:
```bash
npm run build
npm run preview      # optional: serve the dist folder locally
```

## Project structure
```
.
├── App.tsx                 # App workflow coordinator (upload → progress → viewer)
├── components/
│   ├── FileUpload.tsx      # Drag-and-drop area + API key CTA
│   ├── ProgressBar.tsx     # Stage-aware progress + errors
│   └── ComicViewer.tsx     # Thumbnail navigator & page viewer
├── services/
│   └── geminiService.ts    # Analyze, plan, and render helpers for Gemini 3 Pro
├── constants.ts            # Prompt strings and shared model configuration
├── types.ts                # Strong typing for app status and comic pages
├── metadata.json           # AI Studio metadata for deployment
└── vite.config.ts          # Vite + React plugin setup
```

## How it works
1. **Authenticate** – The app checks whether AI Studio already has a selected key. If not, it prompts you to choose one.
2. **Analyze** – `analyzePaper` sends the PDF (base64) to Gemini 3 Pro for summarization.
3. **Plan** – `planStory` requests a JSON plan that breaks the topic into kid-friendly scenes.
4. **Generate** – For each plan step, `generateComicPage` calls the image endpoint and streams progress back to the UI.
5. **Review** – `ComicViewer` displays full-resolution images with captions so you can retell the paper to younger audiences.

## Available scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite in development mode with HMR |
| `npm run build` | Bundle the app for production |
| `npm run preview` | Preview the production build locally |

## Troubleshooting
- **"Authentication Required"** – Click *Connect API Key* to re-authorize with AI Studio.
- **Stuck on analysis** – Ensure the PDF is under Gemini’s payload limit and your API key has sufficient quota.
- **Blank images** – Regenerate; Gemini occasionally produces empty frames if the prompt budget is exceeded.

## Star history
[![Star History Chart](https://api.star-history.com/svg?repos=redreamality/Paper-Comicizer&type=Date)](https://star-history.com/#redreamality/Paper-Comicizer&Date)

Happy comicizing! 🎨📚
