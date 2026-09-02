# LinguaBridge — AI Language Translation Tool

An AI-powered language translation web application supporting **83 languages** with dual-engine text-to-speech, translation history, and caching.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Deployment on Railway](#deployment-on-railway)
- [Setup & Installation](#setup--installation)
- [API Keys](#api-keys)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Supported Languages](#supported-languages)
- [Text-to-Speech (TTS)](#text-to-speech-tts)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)

---

## Features

| Feature | Description |
|---|---|
| **83 Languages** | Translate between 83 languages with searchable dropdowns |
| **Auto-Detect** | Automatically detect source language |
| **AI Translation** | Powered by Google Gemini 3.6 Flash API |
| **Dual-Engine TTS** | CAMB.AI (32 languages) + Browser Web Speech API (52 languages) |
| **Formatting Preservation** | Preserves line breaks, punctuation, lists, and structure |
| **Translation Caching** | Identical translations load instantly from localStorage |
| **Translation History** | Browse, reuse, and delete past translations |
| **Copy to Clipboard** | One-click copy of translated text |
| **Searchable Dropdowns** | Type to filter languages in dropdown menus |
| **Responsive Design** | Works on desktop, tablet, and mobile |
| **Dark Theme** | Modern dark UI with gradient accents |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Backend** | Python 3.11+ | Server-side logic |

| **API Framework** | FastAPI | REST API endpoints |
| **Translation AI** | Google Gemini 3.6 Flash | AI-powered translation |
| **TTS Engine 1** | CAMB.AI (mars-81 model) | High-quality AI voices (32 languages) |
| **TTS Engine 2** | Web Speech API | Browser built-in TTS (52 languages) |
| **Frontend** | HTML5, CSS3, JavaScript | User interface |
| **Styling** | Custom CSS (Dark Theme) | UI design |
| **Font** | Google Fonts (Inter) | Typography |
| **Storage** | Browser localStorage | Caching + History |
| **Environment** | python-dotenv | API key management |

---

## Project Structure

```
LinguaBridge/
├── backend/
│   ├── main.py              # FastAPI server with all API endpoints
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # API keys (GEMINI_API_KEY, CAMB_API_KEY)
│   └── voices.json          # TTS voice configuration
├── frontend/
│   ├── index.html           # Main HTML page
│   ├── css/
│   │   └── style.css        # All styles (dark theme, responsive)
│   └── js/
│       └── app.js           # Frontend logic (translation, TTS, history, caching)
├── railway.json             # Railway deployment config
├── venv/                    # Python virtual environment
└── README.md                # This file
```

---

## Deployment on Railway

This project can also be deployed on Railway.
### How to Deploy on Railway

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Create a new project**
   - Click **New Project** → **Deploy from GitHub repo**
   - Select your GitHub repository `zalimrajput/ProStackHub-Project1-LinguaBridge`
   - Railway will auto-detect the `railway.json` configuration

3. **Configure Environment Variables**
   In Railway's dashboard, go to the **Variables** tab and add:

   | Key | Value |
   |---|---|
   | `GEMINI_API_KEY` | Your Google Gemini API key |
   | `CAMB_API_KEY` | Your CAMB.AI API key |

4. **Deploy**
   - Railway will automatically build and deploy
   - Once deployed, go to **Settings** → **Networking** → **Generate Domain** to get your public URL
   - Your app will be live at `https://your-app-name.up.railway.app`

### Railway Configuration (railway.json)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "cd backend && python main.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Setup & Installation

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- A web browser (Chrome, Edge, Firefox)
- Google Gemini API key
- CAMB.AI API key

### Step 1: Clone / Navigate to Project

```bash
cd LinguaBridge
```

### Step 2: Create Virtual Environment

```bash
python -m venv venv
```

### Step 3: Activate Virtual Environment

```bash
# Windows
./venv/Scripts/activate

# macOS/Linux
source venv/bin/activate
```

### Step 4: Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### Step 5: Configure API Keys

Create/edit `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
CAMB_API_KEY=your_camb_api_key_here
```

### Step 6: Start the Server

```bash
cd backend
python main.py
```

### Step 7: Open in Browser

Navigate to: **http://localhost:8000**

---

## API Keys

### Google Gemini API Key

- **Required for**: Translation
- **Get it from**: https://aistudio.google.com/app/apikey
- **Free tier**: Yes (generous limits)
- **Env variable**: `GEMINI_API_KEY`

### CAMB.AI API Key

- **Required for**: Text-to-Speech (TTS)
- **Get it from**: https://camb.ai
- **Free tier**: Available
- **Env variable**: `CAMB_API_KEY`

---

## Running the Application

### Start Command

```bash
cd backend
python main.py
```

The server starts at `http://localhost:8000` with hot-reload enabled.

### Verify Server

```bash
# Health check
curl http://localhost:8000/api/health

# Expected response:
# {"status":"healthy","api_configured":true}
```

### Stop Server

Press `Ctrl+C` in the terminal, or:

```bash
# Windows
taskkill /F /IM python.exe

# macOS/Linux
pkill -f "python main.py"
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the frontend HTML page |
| `GET` | `/api/health` | Health check (returns API status) |
| `GET` | `/api/languages` | Returns list of 83 supported languages |
| `POST` | `/api/translate` | Translates text using Gemini AI |
| `POST` | `/api/tts` | Converts text to speech using CAMB.AI |
| `GET` | `/api/tts/info` | Returns which languages have CAMB.AI support |
| `GET` | `/api/tts/voices` | Lists available TTS voices |

### Translate Request

```json
POST /api/translate
{
  "text": "Hello, how are you?",
  "source_language": "auto",
  "target_language": "es"
}
```

**Response:**
```json
{
  "translated_text": "Hola, ¿cómo estás?",
  "source_language": "auto",
  "target_language": "es"
}
```

### TTS Request

```json
POST /api/tts
{
  "text": "Hello world",
  "language": "en"
}
```

**Response:** Audio stream (WAV format)

### TTS Info Request

```json
GET /api/tts/info
```

**Response:**
```json
{
  "camb_supported": ["am", "ar", "bg", "cs", "da", "de", "el", "en", "es", "fi", "fr", "hi", "hu", "id", "it", "ja", "kk", "ko", "mr", "nl", "no", "pl", "pt", "ro", "ru", "sk", "sv", "tl", "tr", "uk", "ur", "zh"],
  "total_languages": 83
}
```

---

## Supported Languages

### 83 Languages with Full Translation Support

All languages below work with **translation**. TTS support varies by engine (see below).

| Code | Language | Code | Language | Code | Language |
|---|---|---|---|---|---|
| af | Afrikaans | sq | Albanian | am | Amharic |
| ar | Arabic | hy | Armenian | az | Azerbaijani |
| eu | Basque | be | Belarusian | bn | Bengali |
| bs | Bosnian | bg | Bulgarian | my | Burmese |
| ca | Catalan | ceb | Cebuano | zh | Chinese |
| hr | Croatian | cs | Czech | da | Danish |
| nl | Dutch | en | English | fi | Finnish |
| fr | French | gl | Galician | ka | Georgian |
| de | German | el | Greek | gu | Gujarati |
| ha | Hausa | he | Hebrew | hi | Hindi |
| hu | Hungarian | is | Icelandic | id | Indonesian |
| ga | Irish | it | Italian | ja | Japanese |
| jv | Javanese | kn | Kannada | kk | Kazakh |
| km | Khmer | rw | Kinyarwanda | ko | Korean |
| ky | Kyrgyz | lo | Lao | lv | Latvian |
| lt | Lithuanian | mk | Macedonian | ms | Malay |
| ml | Malayalam | mt | Maltese | mi | Maori |
| mr | Marathi | mn | Mongolian | no | Norwegian |
| or | Odia | ps | Pashto | fa | Persian |
| pl | Polish | pt | Portuguese | pa | Punjabi |
| ro | Romanian | ru | Russian | si | Sinhala |
| sk | Slovak | sl | Slovenian | so | Somali |
| es | Spanish | sw | Swahili | sv | Swedish |
| tl | Tagalog | ta | Tamil | tt | Tatar |
| te | Telugu | th | Thai | tr | Turkish |
| uk | Ukrainian | ur | Urdu | ug | Uyghur |
| uz | Uzbek | vi | Vietnamese | cy | Welsh |
| xh | Xhosa | yo | Yoruba | zu | Zulu |

---

## Text-to-Speech (TTS)

LinguaBridge uses **two TTS engines** to cover all 83 languages:

1. **CAMB.AI** — High-quality AI voices for 32 languages (primary engine)
2. **Browser Web Speech API** — Built-in browser TTS for the remaining 52 languages (fallback)

### How TTS Works

1. User clicks the **Listen** button
2. Frontend checks if the target language is supported by CAMB.AI
3. If yes → sends request to CAMB.AI API (high quality AI voice)
4. If no → uses browser's Web Speech API directly
5. If CAMB.AI fails → falls back to browser Web Speech API
6. If browser doesn't have the voice → shows error message

### CAMB.AI Supported Languages (32 languages)

These languages have **dedicated AI voices** via CAMB.AI mars-81 model:

| Code | Language | Code | Language |
|---|---|---|---|
| am | Amharic | ar | Arabic |
| bg | Bulgarian | cs | Czech |
| da | Danish | de | German |
| el | Greek | en | English |
| es | Spanish | fi | Finnish |
| fr | French | hi | Hindi |
| hu | Hungarian | id | Indonesian |
| it | Italian | ja | Japanese |
| kk | Kazakh | ko | Korean |
| mr | Marathi | nl | Dutch |
| no | Norwegian | pl | Polish |
| pt | Portuguese | ro | Romanian |
| ru | Russian | sk | Slovak |
| sv | Swedish | tl | Tagalog |
| tr | Turkish | uk | Ukrainian |
| ur | Urdu | zh | Chinese |

### Browser Web Speech API Languages (52 languages)

These languages use your **browser's built-in TTS**. Quality depends on your OS and installed voice packs. If the voice is not installed, the app shows an error message.

| Code | Language | Code | Language |
|---|---|---|---|
| af | Afrikaans | sq | Albanian |
| hy | Armenian | az | Azerbaijani |
| eu | Basque | be | Belarusian |
| bn | Bengali | bs | Bosnian |
| my | Burmese | ca | Catalan |
| ceb | Cebuano | hr | Croatian |
| gl | Galician | ka | Georgian |
| gu | Gujarati | ha | Hausa |
| he | Hebrew | is | Icelandic |
| ga | Irish | jv | Javanese |
| kn | Kannada | km | Khmer |
| rw | Kinyarwanda | ky | Kyrgyz |
| lo | Lao | lv | Latvian |
| lt | Lithuanian | mk | Macedonian |
| ms | Malay | ml | Malayalam |
| mt | Maltese | mi | Maori |
| mn | Mongolian | or | Odia |
| ps | Pashto | fa | Persian |
| pa | Punjabi | si | Sinhala |
| sl | Slovenian | so | Somali |
| sw | Swahili | ta | Tamil |
| tt | Tatar | te | Telugu |
| th | Thai | ug | Uyghur |
| uz | Uzbek | vi | Vietnamese |
| cy | Welsh | xh | Xhosa |
| yo | Yoruba | zu | Zulu |

### Voice Mapping (CAMB.AI)

Each CAMB.AI language uses the highest-quality voice available:

| Language | Voice Name | Voice ID |
|---|---|---|
| English | Silas Blackwood | 147319 |
| Spanish | Valeria Martinez | 165323 |
| French | Chloé Tremblay | 165308 |
| German | Lennart Kurz | 170512 |
| Hindi | Arjun Kapoor | 170926 |
| Japanese | Hiroshi Tanaka | 165284 |
| Korean | Park Min-sook | 165331 |
| Chinese | Yan Yang | 171147 |
| Arabic | Saeed Emirati Arabic | 173867 |
| Urdu | Rami Qureshi | 170447 |

### Example Language Combinations

| Source | Target | Source TTS | Target TTS |
|---|---|---|---|
| Arabic | Punjabi | CAMB.AI ✅ | Browser ⚠️ |
| Punjabi | English | Browser ⚠️ | CAMB.AI ✅ |
| English | French | CAMB.AI ✅ | CAMB.AI ✅ |
| Bengali | Hindi | Browser ⚠️ | CAMB.AI ✅ |
| Thai | Japanese | Browser ⚠️ | CAMB.AI ✅ |
| Spanish | English | CAMB.AI ✅ | CAMB.AI ✅ |
| Albanian | Russian | Browser ⚠️ | CAMB.AI ✅ |
| Zulu | German | Browser ⚠️ | CAMB.AI ✅ |

> ⚠️ Browser TTS quality depends on your OS and installed voice packs.

---

## Architecture

### Backend (FastAPI)

```
┌─────────────────────────────────────────┐
│              FastAPI Server              │
│                 :8000                    │
├─────────────────────────────────────────┤
│  /api/translate  →  Google Gemini AI    │
│  /api/tts        →  CAMB.AI API         │
│  /api/tts/info   →  TTS Language Info   │
│  /api/languages  →  Language List       │
│  /api/health     →  Health Check        │
│  /               →  Frontend Files      │
│  /css, /js       →  Static Files        │
└─────────────────────────────────────────┘
```

### Frontend (HTML/CSS/JS)

```
┌─────────────────────────────────────────┐
│              Browser                    │
├─────────────────────────────────────────┤
│  index.html    →  Page Structure        │
│  style.css     →  Dark Theme UI         │
│  app.js        →  App Logic             │
│    ├── Searchable Language Dropdowns    │
│    ├── Translation API Calls            │
│    ├── TTS (CAMB.AI → Browser fallback) │
│    ├── localStorage Cache               │
│    └── Translation History              │
└─────────────────────────────────────────┘
```

### Data Flow

```
Translation:
  User Input → Frontend → FastAPI → Gemini AI → Translated Text → Frontend → User

TTS (CAMB.AI supported languages):
  Listen Click → Frontend → FastAPI → CAMB.AI → Audio WAV → Browser → Speaker

TTS (Browser-only languages):
  Listen Click → Frontend → Web Speech API → Browser → Speaker
```

---

## How It Works

### Translation Flow

1. User types text in the input panel
2. User selects source language (or "Auto Detect") and target language
3. User clicks **Translate** (or presses Ctrl+Enter)
4. Frontend checks localStorage cache first
5. If not cached, sends POST request to `/api/translate`
6. Backend sends text to Google Gemini 3.6 Flash with formatting instructions
7. Gemini returns translated text preserving formatting
8. Result displayed in output panel
9. Saved to cache and translation history

### TTS Flow

1. User clicks **Listen** button after translation
2. Frontend loads TTS info via `/api/tts/info`
3. If language is in CAMB.AI list → sends request to `/api/tts`
4. Backend maps language code to CAMB.AI BCP-47 locale and voice ID
5. CAMB.AI generates audio stream using mars-81 model
6. Audio returned as WAV and played in browser
7. If CAMB.AI fails → falls back to browser Web Speech API
8. If language is NOT in CAMB.AI list → goes directly to browser Web Speech API
9. If browser doesn't have the voice → shows error message

### Caching

- Cache key: `{text}|{source_lang}|{target_lang}`
- Stored in `localStorage` under key `linguabridge_cache`
- Max 100 cached entries (oldest removed first)
- Instant loading for repeated translations

### History

- Stored in `localStorage` under key `linguabridge_history`
- Max 50 entries (newest first)
- Click any history item to reload it
- Individual delete or clear all

---

## UI Components

### Header
- App name with gradient text
- Tagline "AI-Powered Language Translation"

### Language Bar
- **Source Language**: Searchable dropdown with "Auto Detect" option
- **Swap Button**: Swaps source/target languages and text
- **Target Language**: Searchable dropdown (defaults to Spanish)

### Input Panel
- Textarea with 5000 character limit
- Character counter
- Clear button
- Paste from clipboard button

### Output Panel
- Translation display area
- Copy to clipboard button
- Listen (TTS) button
- Status messages (success/error/engine info)

### Translate Button
- Gradient purple button with loading spinner

### Translation History
- List of past translations
- Click to reload any entry
- Individual delete buttons
- Clear all button

---

## Troubleshooting

### Server won't start

```bash
# Kill existing processes on port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /F /PID <process_id>

# macOS/Linux:
lsof -ti:8000 | xargs kill -9
```

### "GEMINI_API_KEY not set" error

Ensure `backend/.env` contains:
```
GEMINI_API_KEY=your_key_here
```

### "CAMB_API key not configured" error

Ensure `backend/.env` contains:
```
CAMB_API_KEY=your_key_here
```

### Translation fails

1. Check API key is valid
2. Check internet connection
3. Check server logs in terminal

### TTS not working

1. Check which TTS engine your language uses (see [TTS section](#text-to-speech-tts))
2. If CAMB.AI: verify `CAMB_API_KEY` is set in `.env`
3. If Browser TTS: your browser may not have the voice pack installed
4. Check browser console for errors
5. Web Speech API requires user interaction (click) to play audio

### "TTS not available for [language]" message

This means:
- The language is not supported by CAMB.AI
- Your browser doesn't have the voice pack for that language
- **Solution**: Install additional Windows voice packs in Settings → Time & Language → Speech

### Languages not showing

1. Restart the server: `python main.py`
2. Hard refresh browser: `Ctrl+Shift+R`
3. Check `/api/languages` endpoint returns data

---

## Development

### Backend Dependencies

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
google-generativeai==0.8.4
python-dotenv==1.0.1
pydantic==2.10.4
httpx==0.28.1
camb-sdk>=1.5.0
```

### Key Files

| File | Purpose |
|---|---|
| `backend/main.py` | All API endpoints, TTS config, language list |
| `frontend/js/app.js` | All frontend logic, TTS, caching, history |
| `frontend/css/style.css` | Dark theme, responsive design |
| `frontend/index.html` | Page structure |

---

## License

LinguaBridge © 2026 — Powered by Google Gemini AI & CAMB.AI

---

## Credits

- **Google Gemini** — AI translation engine
- **CAMB.AI** — Text-to-speech engine (mars-81 model)
- **FastAPI** — Python web framework
- **Inter Font** — Google Fonts typography
