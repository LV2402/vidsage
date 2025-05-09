# VidSage

**VidSage** is a powerful web application that analyzes websites for SEO performance. With a simple URL submission, it crawls the target site, evaluates key SEO metrics, and provides detailed feedback including scores, issues, and actionable recommendations for improvement.

## 🌐 Overview

VidSage provides an intuitive interface for assessing SEO health and identifying technical and content-related improvements. It uses AI-powered analysis to deliver precise, categorized insights.

## 🚀 Key Features

- 🔗 URL submission for real-time SEO analysis
- 📊 SEO scoring across multiple categories:
  - Meta tags
  - Content quality
  - Performance
  - Mobile optimization
- 🚨 Detailed issue identification with severity ratings
- ✅ Actionable recommendations with impact assessments
- 🔍 Technical breakdown of website components

## 🏗 Architecture & Workflow

1. **User submits a URL** via the frontend form
2. **Website content is fetched** by the backend
3. **Content is sent to Google Gemini AI** for SEO analysis
4. **Results are displayed** in a user-friendly UI, showing scores and suggestions
5. **Error handling** provides feedback for failed or problematic analyses

## 🧰 Tech Stack

### Core Framework

- **Next.js 15.x** – React framework with server components and app router

### Frontend

- **React 19.x** – Component-based UI
- **Tailwind CSS** – Utility-first CSS styling
- **shadcn/ui** – UI components built on Radix primitives
- **Lucide React** – Icon library
- **Class Variance Authority** – Styling utility for managing variants

### Backend & API Integration

- **Google Gemini AI API** – Processes website content and performs SEO analysis
- **Axios** – HTTP client for API calls

### UI Component Libraries

- `@radix-ui/react` – UI primitives (e.g., `Progress`, `Tabs`)
- `@headlessui/react` – Accessible, unstyled components

### Styling Utilities

- `clsx` – Conditional class name utility
- `tailwind-merge` – Utility for merging Tailwind classes safely

### Development Tools

- **TypeScript** – Type safety and better developer experience
- **ESLint** – Linting and code quality enforcement
- **PostCSS** – CSS processing tool

## 📁 Project Structure

```
/
├── app/              # Next.js app router components and pages
│   ├── actions.ts    # Server actions for API operations
│   ├── components/   # Reusable UI components
│   └── results/      # Components related to results display
├── lib/              # Utility functions
├── public/           # Static assets
└── ...               # Config files for Next.js, Tailwind, ESLint, etc.
```

## 📌 Notes

- Built with a **modern, component-based architecture**
- Supports **server-side rendering (SSR)** for optimal performance and SEO
- Fully leverages **Next.js capabilities** for routing, performance, and developer ergonomics
