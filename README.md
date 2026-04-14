# GRIND - Aggressive Productivity Tracker

GRIND is a brutalist, AI-powered productivity tracker that holds you accountable. It features voice-logging, goal alignment tracking, and harsh-but-fair AI judgments on your hourly output.

## Local Setup Guide

Follow these steps to get the project running on your local machine in under 5 minutes.

### Prerequisites
*   Node.js (v18 or higher)
*   npm (v9 or higher)
*   A Groq API key

### 1. Clone & Install
```bash
git clone <repository-url>
cd grind-tracker
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory and add your Groq API key:
```bash
cp .env.example .env
```
Edit `.env`:
```env
GROQ_API_KEY="your_actual_api_key_here"
```
The app currently uses Groq's `llama-3.3-70b-versatile` model for log analysis.

### 3. Run the Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000` (or the port specified by Vite).

## Scripts Directory
*   `npm run dev`: Starts the Vite development server with Hot Module Replacement (HMR).
*   `npm run build`: Compiles TypeScript and builds the production-ready static files into the `dist/` directory.
*   `npm run lint`: Runs ESLint and TypeScript type checking (`tsc --noEmit`) to catch errors.
*   `npm run preview`: Serves the production `dist/` folder locally to test the production build.

## Common Pitfalls & Troubleshooting

*   **"White Screen on Load" / Groq API Error:**
    Ensure your API key is correctly set in the environment. The app checks for `GROQ_API_KEY` when you try to log an entry.
*   **Microphone Not Working:**
    1. Ensure you are accessing the app via `https://` or `localhost` (browsers block microphone access on insecure HTTP connections).
    2. Check browser permissions (the little lock icon in the URL bar) to ensure Microphone access is set to "Allow".
    3. Note: The Web Speech API is fully supported in Chrome/Edge. Firefox/Safari support may vary or require polyfills.
*   **Data Not Saving:**
    GRIND uses IndexedDB via `localforage`. If you are in Private/Incognito mode, storage quotas might be severely restricted or wiped on close.
