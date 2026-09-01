/**
 * LinguaBridge — Frontend Application
 * Handles translation UI, API calls, caching, history, and text-to-speech.
 */

const API_BASE = "";
const CACHE_KEY = "linguabridge_cache";
const HISTORY_KEY = "linguabridge_history";

// ===== DOM Elements =====
const inputText = document.getElementById("input-text");
const outputText = document.getElementById("output-text");
const translateBtn = document.getElementById("translate-btn");
const swapBtn = document.getElementById("swap-langs");
const clearBtn = document.getElementById("clear-btn");
const pasteBtn = document.getElementById("paste-btn");
const copyBtn = document.getElementById("copy-btn");
const speakBtn = document.getElementById("speak-btn");
const charCount = document.getElementById("char-count");
const statusText = document.getElementById("status-text");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");

const sourceLangSelect = document.getElementById("source-lang-select");
const targetLangSelect = document.getElementById("target-lang-select");
const sourceInput = sourceLangSelect.querySelector(".select-search-input");
const targetInput = targetLangSelect.querySelector(".select-search-input");
const sourceOptions = sourceLangSelect.querySelector(".select-options");
const targetOptions = targetLangSelect.querySelector(".select-options");

let isTranslating = false;
let lastTranslatedText = "";
let allLanguages = [];
let highlightedSourceIndex = -1;
let highlightedTargetIndex = -1;
let cambSupportedLanguages = new Set();

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", () => {
    loadLanguages();
    loadTTSInfo();
    renderHistory();
    setupEventListeners();
    setupSearchableSelect(sourceLangSelect, "source");
    setupSearchableSelect(targetLangSelect, "target");
});

// ===== Searchable Select =====
function setupSearchableSelect(container, type) {
    const input = container.querySelector(".select-search-input");
    const optionsContainer = container.querySelector(".select-options");

    container._savedDisplay = "";

    input.addEventListener("focus", () => {
        container.classList.add("open");
        input.value = "";
        filterOptions("", optionsContainer, type);
    });

    input.addEventListener("input", () => {
        filterOptions(input.value, optionsContainer, type);
    });

    document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) {
            container.classList.remove("open");
            input.value = "";
            input.placeholder = container._savedDisplay || input.placeholder;
        }
    });

    input.addEventListener("keydown", (e) => {
        const opts = optionsContainer.querySelectorAll(".select-option");
        const visibleOpts = Array.from(opts).filter(o => o.style.display !== "none");
        let highlightKey = type === "source" ? "highlightedSourceIndex" : "highlightedTargetIndex";

        if (e.key === "ArrowDown") {
            e.preventDefault();
            window[highlightKey] = Math.min(window[highlightKey] + 1, visibleOpts.length - 1);
            updateHighlight(visibleOpts, window[highlightKey]);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            window[highlightKey] = Math.max(window[highlightKey] - 1, 0);
            updateHighlight(visibleOpts, window[highlightKey]);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (window[highlightKey] >= 0 && visibleOpts[window[highlightKey]]) {
                visibleOpts[window[highlightKey]].click();
            }
        } else if (e.key === "Escape") {
            container.classList.remove("open");
            input.blur();
        }
    });
}

function updateHighlight(opts, index) {
    opts.forEach((o, i) => o.classList.toggle("highlighted", i === index));
}

function filterOptions(query, container, type) {
    const q = query.toLowerCase().trim();
    const opts = container.querySelectorAll(".select-option");
    let highlightKey = type === "source" ? "highlightedSourceIndex" : "highlightedTargetIndex";
    window[highlightKey] = -1;

    opts.forEach((opt) => {
        const text = opt.textContent.toLowerCase();
        const match = text.includes(q);
        opt.style.display = match ? "" : "none";
    });
}

function setSelectValue(type, value) {
    const container = type === "source" ? sourceLangSelect : targetLangSelect;
    const input = container.querySelector(".select-search-input");
    const options = container.querySelectorAll(".select-option");

    options.forEach((opt) => {
        const isSelected = opt.dataset.value === value;
        opt.classList.toggle("selected", isSelected);
        if (isSelected) {
            input.value = "";
            input.placeholder = opt.textContent;
            container._savedDisplay = opt.textContent;
        }
    });
}

function getSelectValue(type) {
    const container = type === "source" ? sourceLangSelect : targetLangSelect;
    const selected = container.querySelector(".select-option.selected");
    return selected ? selected.dataset.value : "";
}

// ===== Event Listeners =====
function setupEventListeners() {
    translateBtn.addEventListener("click", handleTranslate);
    swapBtn.addEventListener("click", handleSwap);
    clearBtn.addEventListener("click", handleClear);
    pasteBtn.addEventListener("click", handlePaste);
    copyBtn.addEventListener("click", handleCopy);
    speakBtn.addEventListener("click", handleSpeak);
    clearHistoryBtn.addEventListener("click", handleClearHistory);

    inputText.addEventListener("input", () => {
        charCount.textContent = `${inputText.value.length} / 5000`;
    });

    inputText.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "Enter") {
            handleTranslate();
        }
    });
}

// ===== Language Loading =====
async function loadLanguages() {
    try {
        const res = await fetch(`${API_BASE}/api/languages`);
        const data = await res.json();
        allLanguages = data.languages;

        sourceOptions.innerHTML = '<div class="select-option selected" data-value="auto">Auto Detect</div>';
        targetOptions.innerHTML = "";

        allLanguages.forEach((lang) => {
            const srcOpt = document.createElement("div");
            srcOpt.className = "select-option";
            srcOpt.dataset.value = lang.code;
            srcOpt.textContent = lang.name;
            srcOpt.addEventListener("click", () => {
                setSelectValue("source", lang.code);
                sourceLangSelect.classList.remove("open");
                sourceInput.value = "";
            });
            sourceOptions.appendChild(srcOpt);

            const tgtOpt = document.createElement("div");
            tgtOpt.className = "select-option";
            tgtOpt.dataset.value = lang.code;
            tgtOpt.textContent = lang.name;
            tgtOpt.addEventListener("click", () => {
                setSelectValue("target", lang.code);
                targetLangSelect.classList.remove("open");
                targetInput.value = "";
            });
            targetOptions.appendChild(tgtOpt);
        });

        sourceOptions.querySelector('[data-value="auto"]').addEventListener("click", () => {
            setSelectValue("source", "auto");
            sourceLangSelect.classList.remove("open");
            sourceInput.value = "";
        });

        sourceInput.placeholder = "Auto Detect";
        sourceInput.value = "";
        setSelectValue("target", "es");
    } catch (err) {
        console.error("Failed to load languages:", err);
        statusText.textContent = "Failed to load languages from server.";
        statusText.style.color = "var(--danger)";
    }
}

// ===== Translation =====
async function handleTranslate() {
    const text = inputText.value.trim();
    if (!text) {
        statusText.textContent = "Please enter text to translate.";
        statusText.style.color = "var(--warning)";
        return;
    }

    if (isTranslating) return;

    const src = getSelectValue("source") || "auto";
    const tgt = getSelectValue("target") || "en";

    if (src !== "auto" && src === tgt) {
        statusText.textContent = "Source and target languages must be different.";
        statusText.style.color = "var(--warning)";
        return;
    }

    const cacheKey = `${text}|${src}|${tgt}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
        displayResult(cached);
        statusText.textContent = "Loaded from cache";
        statusText.style.color = "var(--success)";
        return;
    }

    setTranslating(true);
    statusText.textContent = "Translating...";
    statusText.style.color = "var(--text-muted)";

    try {
        const res = await fetch(`${API_BASE}/api/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: text,
                source_language: src,
                target_language: tgt,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Translation failed");
        }

        const data = await res.json();
        displayResult(data.translated_text);
        setToCache(cacheKey, data.translated_text);

        saveToHistory({
            original: text,
            translated: data.translated_text,
            sourceLang: src,
            targetLang: tgt,
            timestamp: Date.now(),
        });

        statusText.textContent = "Translation complete";
        statusText.style.color = "var(--success)";
    } catch (err) {
        statusText.textContent = err.message;
        statusText.style.color = "var(--danger)";
        console.error("Translation error:", err);
    } finally {
        setTranslating(false);
    }
}

function displayResult(text) {
    lastTranslatedText = text;
    outputText.textContent = text;
    outputText.classList.remove("placeholder-text");
    copyBtn.disabled = false;
    speakBtn.disabled = false;
}

function setTranslating(loading) {
    isTranslating = loading;
    translateBtn.disabled = loading;
    translateBtn.classList.toggle("loading", loading);
}

// ===== Swap Languages =====
function handleSwap() {
    const src = getSelectValue("source");
    if (src === "auto") return;

    const tgt = getSelectValue("target");
    setSelectValue("source", tgt);
    setSelectValue("target", src);

    if (lastTranslatedText && outputText.textContent !== "Translation will appear here...") {
        const currentOutput = outputText.textContent;
        inputText.value = currentOutput;
        charCount.textContent = `${inputText.value.length} / 5000`;
        outputText.textContent = "Translation will appear here...";
        outputText.classList.add("placeholder-text");
        lastTranslatedText = "";
        copyBtn.disabled = true;
        speakBtn.disabled = true;
    }
}

// ===== Clear Input =====
function handleClear() {
    inputText.value = "";
    charCount.textContent = "0 / 5000";
    inputText.focus();
}

// ===== Paste =====
async function handlePaste() {
    try {
        const text = await navigator.clipboard.readText();
        inputText.value = text;
        charCount.textContent = `${inputText.value.length} / 5000`;
    } catch {
        statusText.textContent = "Unable to paste from clipboard.";
        statusText.style.color = "var(--warning)";
    }
}

// ===== Copy Translation =====
async function handleCopy() {
    if (!lastTranslatedText) return;
    try {
        await navigator.clipboard.writeText(lastTranslatedText);
        statusText.textContent = "Copied to clipboard!";
        statusText.style.color = "var(--success)";
    } catch {
        statusText.textContent = "Failed to copy.";
        statusText.style.color = "var(--danger)";
    }
}

// ===== Text-to-Speech =====
// Primary: CAMB.AI API (34 languages with mars-81 model). 
// Fallback: Web Speech API / Edge TTS (all 106 languages mapped, browser-dependent).

const WEB_SPEECH_LANG_MAP = {
    "af": "af-ZA", "sq": "sq-AL", "am": "am-ET", "ar": "ar-SA",
    "hy": "hy-AM", "az": "az-AZ", "eu": "eu-ES", "be": "be-BY",
    "bn": "bn-BD", "bs": "bs-BA", "bg": "bg-BG", "my": "my-MM",
    "ca": "ca-ES", "ceb": "ceb-PH", "zh": "zh-CN", "zh-TW": "zh-TW",
    "hr": "hr-HR", "cs": "cs-CZ", "da": "da-DK",
    "nl": "nl-NL", "en": "en-US",
    "fi": "fi-FI", "fr": "fr-FR", "gl": "gl-ES", "ka": "ka-GE",
    "de": "de-DE", "el": "el-GR", "gu": "gu-IN",
    "ha": "ha-NG", "he": "he-IL", "hi": "hi-IN", "hu": "hu-HU",
    "is": "is-IS", "id": "id-ID", "ga": "ga-IE", "it": "it-IT",
    "ja": "ja-JP", "jv": "jv-ID", "kn": "kn-IN", "kk": "kk-KZ",
    "km": "km-KH", "rw": "rw-RW", "ko": "ko-KR",
    "ky": "ky-KG", "lo": "lo-LA", "lv": "lv-LV",
    "lt": "lt-LT", "mk": "mk-MK",
    "ms": "ms-MY", "ml": "ml-IN", "mt": "mt-MT", "mi": "mi-NZ",
    "mr": "mr-IN", "mn": "mn-MN", "no": "no-NO",
    "or": "or-IN", "ps": "ps-AF", "fa": "fa-IR",
    "pl": "pl-PL", "pt": "pt-BR", "pa": "pa-IN", "ro": "ro-RO",
    "ru": "ru-RU", "si": "si-LK",
    "sk": "sk-SK", "sl": "sl-SI", "so": "so-SO", "es": "es-ES",
    "sw": "sw-KE", "sv": "sv-SE", "tl": "tl-PH",
    "ta": "ta-IN", "tt": "tt-RU", "te": "te-IN",
    "th": "th-TH", "tr": "tr-TR", "uk": "uk-UA",
    "ur": "ur-PK", "ug": "ug-CN", "uz": "uz-UZ", "vi": "vi-VN",
    "cy": "cy-GB", "xh": "xh-ZA",
    "yo": "yo-NG", "zu": "zu-ZA",
};

let currentAudio = null;

async function handleSpeak() {
    if (!lastTranslatedText) return;

    const langCode = getSelectValue("target") || "en";

    // If already playing, stop
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        speakBtn.innerHTML = "\uD83D\uDD0A Listen";
        statusText.textContent = "";
        return;
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speakBtn.innerHTML = "\uD83D\uDD0A Listen";
        statusText.textContent = "";
        return;
    }

    speakBtn.innerHTML = "\uD83D\uDD0A Loading...";
    speakBtn.disabled = true;

    // Check if CAMB.AI supports this language
    const hasCambSupport = cambSupportedLanguages.has(langCode);

    if (hasCambSupport) {
        // Try CAMB.AI first for supported languages
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let cambSuccess = false;
        try {
            const res = await fetch(`${API_BASE}/api/tts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: lastTranslatedText,
                    language: langCode,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const audioBlob = await res.blob();
                if (audioBlob.size > 50) {
                    const headerBytes = await audioBlob.slice(0, 4).arrayBuffer();
                    const headerStr = new TextDecoder().decode(headerBytes);
                    const isAudio = headerStr === "RIFF" || headerStr === "fLaC" || headerStr === "OggS" || headerBytes[0] === 0xff;

                    if (isAudio) {
                        const audioUrl = URL.createObjectURL(audioBlob);
                        currentAudio = new Audio(audioUrl);
                        currentAudio.onplay = () => {
                            speakBtn.innerHTML = "\u23F8 Speaking...";
                            speakBtn.disabled = false;
                            statusText.textContent = "Playing via CAMB.AI (high quality)";
                            statusText.style.color = "var(--success)";
                        };
                        currentAudio.onended = () => {
                            speakBtn.innerHTML = "\uD83D\uDD0A Listen";
                            speakBtn.disabled = false;
                            currentAudio = null;
                            URL.revokeObjectURL(audioUrl);
                            statusText.textContent = "";
                        };
                        currentAudio.onerror = () => {
                            currentAudio = null;
                            URL.revokeObjectURL(audioUrl);
                            statusText.textContent = "CAMB.AI audio failed, trying browser TTS...";
                            statusText.style.color = "var(--warning)";
                            fallbackToWebSpeech(lastTranslatedText, langCode);
                        };
                        await currentAudio.play();
                        cambSuccess = true;
                        return;
                    } else {
                        console.warn("CAMB.AI returned non-audio data for", langCode);
                    }
                }
            } else {
                const errBody = await res.json().catch(() => ({}));
                console.warn("CAMB.AI TTS failed for", langCode, ":", errBody.detail || res.statusText);
            }
        } catch (e) {
            clearTimeout(timeoutId);
            console.warn("CAMB.AI TTS error for", langCode, ":", e.message);
        }

        // CAMB.AI failed, fall through to browser TTS
        if (!cambSuccess) {
            statusText.textContent = "CAMB.AI unavailable, using browser TTS...";
            statusText.style.color = "var(--warning)";
        }
    }

    // Browser Web Speech API (covers all languages, quality varies)
    if (!hasCambSupport) {
        statusText.textContent = `Browser TTS for ${getLangName(langCode)}...`;
        statusText.style.color = "var(--warning)";
    }
    fallbackToWebSpeech(lastTranslatedText, langCode);
}

function fallbackToWebSpeech(text, langCode) {
    if (!window.speechSynthesis) {
        speakBtn.innerHTML = "\uD83D\uDD0A Listen";
        speakBtn.disabled = false;
        statusText.textContent = "TTS not supported by your browser.";
        statusText.style.color = "var(--danger)";
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const speechLang = WEB_SPEECH_LANG_MAP[langCode] || langCode;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 1;
    utterance.pitch = 1;

    // Check if the browser has a voice for this language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode));
    if (matchingVoice) {
        utterance.voice = matchingVoice;
        console.log(`Using browser voice: ${matchingVoice.name} (${matchingVoice.lang}) for ${langCode}`);
    } else {
        console.warn(`No browser voice found for ${langCode}, using default`);
    }

    utterance.onstart = () => {
        speakBtn.innerHTML = "\u23F8 Speaking...";
        speakBtn.disabled = false;
        statusText.textContent = `Playing via browser TTS (${speechLang})`;
        statusText.style.color = "var(--success)";
    };

    utterance.onend = () => {
        speakBtn.innerHTML = "\uD83D\uDD0A Listen";
        speakBtn.disabled = false;
        currentAudio = null;
        statusText.textContent = "";
    };

    utterance.onerror = (e) => {
        speakBtn.innerHTML = "\uD83D\uDD0A Listen";
        speakBtn.disabled = false;
        currentAudio = null;
        if (e.error === "not-allowed") {
            statusText.textContent = "TTS blocked by browser. Click the page first, then try again.";
            statusText.style.color = "var(--danger)";
        } else if (e.error === "canceled") {
            statusText.textContent = "";
        } else {
            statusText.textContent = `TTS not available for ${getLangName(langCode)}.`;
            statusText.style.color = "var(--danger)";
        }
    };

    window.speechSynthesis.speak(utterance);
}

// ===== Caching =====
function getFromCache(key) {
    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
        return cache[key] || null;
    } catch { return null; }
}

function setToCache(key, value) {
    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
        cache[key] = value;
        const keys = Object.keys(cache);
        if (keys.length > 100) delete cache[keys[0]];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
        console.error("Cache write error:", err);
    }
}

// ===== Translation History =====
function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch { return []; }
}

function saveToHistory(entry) {
    const history = getHistory();
    history.unshift(entry);
    if (history.length > 50) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = getHistory();

    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-history">No translations yet.</p>';
        return;
    }

    historyList.innerHTML = history
        .map((item, index) => {
            const srcName = getLangName(item.sourceLang);
            const tgtName = getLangName(item.targetLang);
            const time = formatTime(item.timestamp);

            return `
            <div class="history-item" data-index="${index}">
                <div class="history-item-header">
                    <span class="history-lang-pair">${srcName} \u2192 ${tgtName}</span>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="history-time">${time}</span>
                        <button class="history-delete" data-index="${index}" title="Delete">\u2715</button>
                    </div>
                </div>
                <div class="history-text-preview">${escapeHtml(item.original)}</div>
            </div>
        `;
        })
        .join("");

    historyList.querySelectorAll(".history-item").forEach((el) => {
        el.addEventListener("click", (e) => {
            if (e.target.classList.contains("history-delete")) return;
            const idx = parseInt(el.dataset.index);
            loadHistoryItem(idx);
        });
    });

    historyList.querySelectorAll(".history-delete").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index);
            deleteHistoryItem(idx);
        });
    });
}

function loadHistoryItem(index) {
    const history = getHistory();
    const item = history[index];
    if (!item) return;

    inputText.value = item.original;
    charCount.textContent = `${item.original.length} / 5000`;

    if (item.sourceLang !== "auto") setSelectValue("source", item.sourceLang);
    setSelectValue("target", item.targetLang);

    displayResult(item.translated);
    statusText.textContent = "Loaded from history";
    statusText.style.color = "var(--success)";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteHistoryItem(index) {
    const history = getHistory();
    history.splice(index, 1);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function handleClearHistory() {
    if (getHistory().length === 0) return;
    if (confirm("Clear all translation history?")) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
    }
}

// ===== Helpers =====
function getLangName(code) {
    if (code === "auto") return "Auto";
    const lang = allLanguages.find((l) => l.code === code);
    return lang ? lang.name : code.toUpperCase();
}

async function loadTTSInfo() {
    try {
        const res = await fetch(`${API_BASE}/api/tts/info`);
        const data = await res.json();
        cambSupportedLanguages = new Set(data.camb_supported || []);
        console.log(`TTS: CAMB.AI supports ${cambSupportedLanguages.size} languages, browser TTS covers the rest`);
    } catch (err) {
        console.warn("Failed to load TTS info:", err);
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
