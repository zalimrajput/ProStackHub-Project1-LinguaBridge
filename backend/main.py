import os
import io
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
try:
    from camb.client import AsyncCambAI
except ImportError:
    AsyncCambAI = None

load_dotenv()

app = FastAPI(title="LinguaBridge API", version="1.0.0")

# Allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not set. Set it in backend/.env")
else:
    genai.configure(api_key=GEMINI_API_KEY)


class TranslationRequest(BaseModel):
    text: str
    source_language: str = "auto"
    target_language: str = "en"


class TTSRequest(BaseModel):
    text: str
    language: str = "en"


class TranslationResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str


@app.get("/")
def root():
    frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    return FileResponse(frontend_path)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "api_configured": bool(GEMINI_API_KEY)}


@app.post("/api/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """Translate text using the Gemini API."""
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key not configured. Please set GEMINI_API_KEY in .env"
        )

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Build the translation prompt
    lang_instruction = ""
    if request.source_language.lower() == "auto":
        lang_instruction = f"Translate the following text into {request.target_language}."
    else:
        lang_instruction = (
            f"Translate the following text from {request.source_language} "
            f"into {request.target_language}."
        )

    prompt = (
        f"{lang_instruction}\n\n"
        f"IMPORTANT: Preserve the original formatting including paragraph breaks, "
        f"line breaks, punctuation, numbered lists, bullet points, and general text structure. "
        f"Provide ONLY the translated text without any explanations or notes.\n\n"
        f"Text to translate:\n{request.text}"
    )

    try:
        model = genai.GenerativeModel("gemini-3.6-flash")
        response = model.generate_content(prompt)
        translated_text = response.text.strip()

        return TranslationResponse(
            translated_text=translated_text,
            source_language=request.source_language,
            target_language=request.target_language,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )


@app.get("/api/languages")
def get_supported_languages():
    """Return a list of 100+ supported languages."""
    languages = [
        {"code": "af", "name": "Afrikaans"},
        {"code": "sq", "name": "Albanian"},
        {"code": "am", "name": "Amharic"},
        {"code": "ar", "name": "Arabic"},
        {"code": "hy", "name": "Armenian"},
        {"code": "az", "name": "Azerbaijani"},
        {"code": "eu", "name": "Basque"},
        {"code": "be", "name": "Belarusian"},
        {"code": "bn", "name": "Bengali"},
        {"code": "bs", "name": "Bosnian"},
        {"code": "bg", "name": "Bulgarian"},
        {"code": "my", "name": "Burmese"},
        {"code": "ca", "name": "Catalan"},
        {"code": "ceb", "name": "Cebuano"},
        {"code": "zh", "name": "Chinese"},
        {"code": "hr", "name": "Croatian"},
        {"code": "cs", "name": "Czech"},
        {"code": "da", "name": "Danish"},
        {"code": "nl", "name": "Dutch"},
        {"code": "en", "name": "English"},
        {"code": "fi", "name": "Finnish"},
        {"code": "fr", "name": "French"},
        {"code": "gl", "name": "Galician"},
        {"code": "ka", "name": "Georgian"},
        {"code": "de", "name": "German"},
        {"code": "el", "name": "Greek"},
        {"code": "gu", "name": "Gujarati"},
        {"code": "ha", "name": "Hausa"},
        {"code": "he", "name": "Hebrew"},
        {"code": "hi", "name": "Hindi"},
        {"code": "hu", "name": "Hungarian"},
        {"code": "is", "name": "Icelandic"},
        {"code": "id", "name": "Indonesian"},
        {"code": "ga", "name": "Irish"},
        {"code": "it", "name": "Italian"},
        {"code": "ja", "name": "Japanese"},
        {"code": "jv", "name": "Javanese"},
        {"code": "kn", "name": "Kannada"},
        {"code": "kk", "name": "Kazakh"},
        {"code": "km", "name": "Khmer"},
        {"code": "rw", "name": "Kinyarwanda"},
        {"code": "ko", "name": "Korean"},
        {"code": "ky", "name": "Kyrgyz"},
        {"code": "lo", "name": "Lao"},
        {"code": "lv", "name": "Latvian"},
        {"code": "lt", "name": "Lithuanian"},
        {"code": "mk", "name": "Macedonian"},
        {"code": "ms", "name": "Malay"},
        {"code": "ml", "name": "Malayalam"},
        {"code": "mt", "name": "Maltese"},
        {"code": "mi", "name": "Maori"},
        {"code": "mr", "name": "Marathi"},
        {"code": "mn", "name": "Mongolian"},
        {"code": "no", "name": "Norwegian"},
        {"code": "or", "name": "Odia (Oriya)"},
        {"code": "ps", "name": "Pashto"},
        {"code": "fa", "name": "Persian (Farsi)"},
        {"code": "pl", "name": "Polish"},
        {"code": "pt", "name": "Portuguese"},
        {"code": "pa", "name": "Punjabi"},
        {"code": "ro", "name": "Romanian"},
        {"code": "ru", "name": "Russian"},
        {"code": "si", "name": "Sinhala"},
        {"code": "sk", "name": "Slovak"},
        {"code": "sl", "name": "Slovenian"},
        {"code": "so", "name": "Somali"},
        {"code": "es", "name": "Spanish"},
        {"code": "sw", "name": "Swahili"},
        {"code": "sv", "name": "Swedish"},
        {"code": "tl", "name": "Tagalog (Filipino)"},
        {"code": "ta", "name": "Tamil"},
        {"code": "tt", "name": "Tatar"},
        {"code": "te", "name": "Telugu"},
        {"code": "th", "name": "Thai"},
        {"code": "tr", "name": "Turkish"},
        {"code": "uk", "name": "Ukrainian"},
        {"code": "ur", "name": "Urdu"},
        {"code": "ug", "name": "Uyghur"},
        {"code": "uz", "name": "Uzbek"},
        {"code": "vi", "name": "Vietnamese"},
        {"code": "cy", "name": "Welsh"},
        {"code": "yo", "name": "Yoruba"},
        {"code": "zu", "name": "Zulu"},
    ]
    return {"languages": languages}


# ===== Text-to-Speech =====
CAMB_API_KEY = os.getenv("CAMB_API_KEY", "")
camb_client = AsyncCambAI(api_key=CAMB_API_KEY) if CAMB_API_KEY and AsyncCambAI else None

# Languages that CAMB.AI actually supports (verified from API voice listing)
# These have dedicated voice IDs — all others must use browser Web Speech API
CAMB_SUPPORTED_LANGUAGES = {
    "am", "ar", "bg", "cs", "da", "de", "el", "en", "es",
    "fi", "fr", "hi", "hu", "id", "it", "ja", "kk", "ko",
    "mr", "nl", "no", "pl", "pt", "ro", "ru", "sk", "sv",
    "tl", "tr", "uk", "ur", "zh",
}

# Map our language codes to CAMB.AI BCP-47 locales (only for supported languages)
TTS_LANG_MAP = {
    "am": "am-et", "ar": "ar-sa", "bg": "bg-bg",
    "cs": "cs-cz", "da": "da-dk", "de": "de-de",
    "el": "el-gr", "en": "en-us", "es": "es-es",
    "fi": "fi-fi", "fr": "fr-fr", "hi": "hi-in",
    "hu": "hu-hu", "id": "id-id", "it": "it-it",
    "ja": "ja-jp", "kk": "kk-kz", "ko": "ko-kr",
    "mr": "mr-in", "nl": "nl-nl", "no": "no-no",
    "pl": "pl-pl", "pt": "pt-br", "ro": "ro-ro",
    "ru": "ru-ru", "sk": "sk-sk", "sv": "sv-se",
    "tl": "tl-ph", "tr": "tr-tr", "uk": "uk-ua",
    "ur": "ur-pk", "zh": "zh-cn",
}


# Best voice per language (verified from CAMB.AI API)
TTS_VOICE_MAP = {
    "am": 187415,  # Abeba
    "ar": 173867,  # Saeed Emirati Arabic
    "bg": 170458,  # Mila Dobrev
    "cs": 170475,  # Lukas Novak
    "da": 170477,  # Mikkel Nielsen
    "de": 170512,  # Lennart Kurz
    "el": 170608,  # Eleni Karagiannis
    "en": 147319,  # Silas Blackwood
    "es": 165323,  # Valeria Martinez
    "fi": 170781,  # Aapo Korhonen
    "fr": 165308,  # Chloé Tremblay
    "hi": 170926,  # Arjun Kapoor
    "hu": 170941,  # Mate Kovacs
    "id": 165288,  # Ayu Lestari
    "it": 171014,  # Daniele Costa
    "ja": 165284,  # Hiroshi Tanaka
    "kk": 191117,  # Nursultan Bekov
    "ko": 165331,  # Park Min-sook
    "mr": 165320,  # Neha Kulkarni
    "nl": 165313,  # Sanne de Jong
    "no": 171058,  # Ingrid Hansen
    "pl": 171066,  # Magda Wisniewski
    "pt": 171078,  # Joao Lima
    "ro": 171090,  # Andrei Popescu
    "ru": 165322,  # Anya Sokolova
    "sk": 171102,  # Martin Kovac
    "sv": 171103,  # Emma Andersson
    "tr": 165317,  # Mehmet Demir
    "uk": 171110,  # Anastasiia Shevchenko
    "ur": 170447,  # Rami Qureshi
    "zh": 171147,  # Yan Yang
}


@app.get("/api/tts/info")
def tts_info():
    """Return which languages have CAMB.AI support vs browser-only."""
    return {
        "camb_supported": sorted(CAMB_SUPPORTED_LANGUAGES),
        "total_languages": 83,
    }


@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech using CAMB.AI (only for supported languages)."""
    if not CAMB_API_KEY or not camb_client:
        raise HTTPException(
            status_code=500,
            detail="CAMB_API key not configured. Please set CAMB_API_KEY in .env"
        )

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    lang = request.language.lower()

    # Check if CAMB.AI supports this language
    if lang not in CAMB_SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=500,
            detail=f"CAMB.AI does not support language '{request.language}'. Use browser TTS instead."
        )

    lang_code = TTS_LANG_MAP.get(lang, f"{lang}-us")
    voice_id = TTS_VOICE_MAP.get(lang, 147320)

    try:
        stream = camb_client.text_to_speech.tts(
            text=request.text,
            language=lang_code,
            voice_id=voice_id,
            speech_model="mars-81",
        )

        # Collect the stream into bytes
        audio_bytes = b""
        async for chunk in stream:
            if isinstance(chunk, bytes):
                audio_bytes += chunk
            elif isinstance(chunk, str):
                import json
                try:
                    err_data = json.loads(chunk)
                    if "error" in err_data or "message" in err_data:
                        error_msg = err_data.get("message") or err_data.get("error", "Unknown CAMB.AI error")
                        print(f"TTS API error for {request.language}: {error_msg}")
                        raise HTTPException(status_code=500, detail=f"CAMB.AI error: {error_msg}")
                except (json.JSONDecodeError, TypeError):
                    pass
                audio_bytes += chunk.encode("utf-8")

        if len(audio_bytes) < 100:
            print(f"TTS returned empty response ({len(audio_bytes)} bytes) for lang={request.language}")
            raise HTTPException(
                status_code=500,
                detail=f"CAMB.AI returned empty audio for '{request.language}'."
            )

        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=speech.wav"}
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"TTS exception for lang={request.language}, voice={voice_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"TTS failed: {str(e)}"
        )


@app.get("/api/tts/voices")
async def list_tts_voices():
    """List available TTS voices."""
    if not CAMB_API_KEY or not camb_client:
        raise HTTPException(
            status_code=500,
            detail="CAMB_API key not configured"
        )
    try:
        voices = camb_client.voice_cloning.list_voices()
        return {"voices": voices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve frontend static files (CSS, JS)
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/css", StaticFiles(directory=os.path.join(frontend_dir, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(frontend_dir, "js")), name="js")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
