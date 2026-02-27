/**
 * scan.js — Hebr AI calligraphy scanner page logic
 * Handles: language toggle, drag-and-drop upload, image preview, API call, result display
 */

// ---------------------------------------------------------------------------
// Translation data (EN + AR) for the scan page
// ---------------------------------------------------------------------------
const scanTranslations = {
    en: {
        nav_vision: "Vision",
        nav_features: "What We Do",
        nav_unique: "Why Qalam",
        nav_team: "Team",
        nav_scan: "Try Hebr AI",
        scan_hero_sub: "Hebr AI",
        scan_hero_title: "Arabic Calligraphy Scanner",
        scan_hero_desc: "Upload any calligraphy image and let our AI identify the style, type, and its cultural heritage.",
        scan_upload_title: "Drop your image here",
        scan_upload_sub: "or click to browse",
        scan_clear: "✕ Remove",
        scan_analyze_btn: "Analyze Image",
        scan_result_idle: "Your analysis result will appear here",
        scan_result_loading: "Analyzing your calligraphy…",
        scan_result_type_label: "Script Type",
        scan_confidence: "Confidence",
        scan_about_title: "About this Script",
        scan_retry: "Try Again",
        scan_error_no_file: "Please upload an image first.",
        scan_error_generic: "Something went wrong. Please try again.",
        scan_error_server: "Server error. Make sure the backend is running.",
        footer_tagline: "Where artistry, technology, and community come together to keep the pen alive.",
        footer_quick_links: "Quick Links",
        footer_link_vision: "Vision",
        footer_link_features: "Features",
        footer_link_team: "Team",
        footer_copyright: "© 2025 Qalam. All rights reserved.",
    },
    ar: {
        nav_vision: "الرؤية",
        nav_features: "ما نقدمه",
        nav_unique: "لماذا قلم",
        nav_team: "الفريق",
        nav_scan: "حِبر AI",
        scan_hero_sub: "حِبر AI",
        scan_hero_title: "محلل الخط العربي",
        scan_hero_desc: "ارفع أي صورة خط عربي ودع الذكاء الاصطناعي يحدد النوع والأسلوب وتراثه الثقافي.",
        scan_upload_title: "أفلت صورتك هنا",
        scan_upload_sub: "أو انقر للتصفح",
        scan_clear: "✕ إزالة",
        scan_analyze_btn: "تحليل الصورة",
        scan_result_idle: "ستظهر نتيجة التحليل هنا",
        scan_result_loading: "جارٍ تحليل الخط…",
        scan_result_type_label: "نوع الخط",
        scan_confidence: "الدقة",
        scan_about_title: "عن هذا الخط",
        scan_retry: "أعد المحاولة",
        scan_error_no_file: "يرجى رفع صورة أولاً.",
        scan_error_generic: "حدث خطأ. يرجى المحاولة مجدداً.",
        scan_error_server: "خطأ في الخادم. تأكد من تشغيل الباك-إند.",
        footer_tagline: "حيث يجتمع الخط والتكنولوجيا.",
        footer_quick_links: "روابط سريعة",
        footer_link_vision: "الرؤية",
        footer_link_features: "الميزات",
        footer_link_team: "الفريق",
        footer_copyright: "© 2025 قلم. جميع الحقوق محفوظة.",
    }
};

// ---------------------------------------------------------------------------
// Calligraphy descriptions — keyed by EXACT Roboflow class name (lowercase)
// ---------------------------------------------------------------------------
const calligraphyInfo = {
    "diwani": {
        displayName: "Diwani",
        arabicName: "ديواني",
        en: "A highly ornate and flowing script developed in the Ottoman Empire's royal court (Diwan). Its intricate curves and overlapping letters make it a hallmark of luxury documents and royal decrees.",
        ar: "خط الديواني: خط زخرفي متدفق طُوِّر في ديوان الإمبراطورية العثمانية. تجعله حلقاته المعقدة وأحرفه المتشابكة طابعاً مميزاً للوثائق الملكية والمراسيم الرسمية.",
        tags: ["Ottoman", "Royal Court", "Ornate"]
    },
    "farsi": {
        displayName: "Farsi (Nastaliq)",
        arabicName: "فارسي",
        en: "A flowing Perso-Arabic script with a distinctive diagonal baseline and delicate curves. It is the primary calligraphic style for Persian, Urdu, and Pashto literature and poetry.",
        ar: "الخط الفارسي (النستعليق): خط فارسي-عربي متدفق بخط أساسي قُطري مميز ومنحنيات رقيقة. يُعدّ النمط الخطي الرئيسي للأدب الفارسي والأوردي والشعر الكلاسيكي.",
        tags: ["Persian", "Diagonal", "Literary"]
    },
    "naskh": {
        displayName: "Naskh",
        arabicName: "نسخ",
        en: "A clear, rounded script evolved during the 10th century. It is the most widely used style for Quranic printing, books, and modern Arabic typography due to its exceptional legibility.",
        ar: "خط النسخ: خط واضح ومستدير تطوَّر في القرن العاشر الميلادي. يُستخدم على نطاق واسع في طباعة القرآن الكريم والكتب لسهولة قراءته ووضوحه الاستثنائي.",
        tags: ["Quranic", "Classical", "10th Century"]
    },
    "ruqaa": {
        displayName: "Ruq'ah",
        arabicName: "رقعة",
        en: "A simple, compact, and fast everyday handwriting script that originated in the Ottoman calligraphy tradition. It is the most common style used in daily Arabic handwriting.",
        ar: "خط الرقعة: خط يومي بسيط ومضغوط وسريع الكتابة، نشأ في الخط العثماني، وهو الأكثر استخداماً في الكتابة اليدوية اليومية.",
        tags: ["Everyday", "Ottoman", "Compact"]
    },
    "thuluth": {
        displayName: "Thuluth",
        arabicName: "ثلث",
        en: "A monumental and elegant script known for its wide curves and elaborate letterforms. Used in mosque inscriptions, titles, and decorative art since the 9th century — considered the king of Arabic scripts.",
        ar: "خط الثلث: خط فخم وأنيق يُعرف بحلقاته الواسعة وأشكاله المزخرفة. استُخدم في كتابات المساجد والعناوين منذ القرن التاسع، ويُعدّ ملك الخطوط العربية.",
        tags: ["Monuments", "Decorative", "9th Century"]
    },
    "default": {
        displayName: "Unknown",
        arabicName: "غير محدد",
        en: "A beautiful style of Arabic calligraphy with a rich tradition spanning centuries of Islamic art and culture.",
        ar: "أسلوب جميل من أساليب الخط العربي بتراث غني يمتد عبر قرون من الفن والثقافة الإسلامية.",
        tags: ["Arabic", "Calligraphy", "Islamic Art"]
    }
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const BACKEND_URL = "http://localhost:8000/classify";
let currentLang = localStorage.getItem("qalamLang") || "en";
let selectedFile = null;

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const uploadZone = document.getElementById("upload-zone");
const fileInput = document.getElementById("file-input");
const previewContainer = document.getElementById("preview-container");
const previewImg = document.getElementById("preview-img");
const clearBtn = document.getElementById("clear-btn");
const analyzeBtn = document.getElementById("analyze-btn");
const resultSection = document.getElementById("result-section");
const resultIdle = document.getElementById("result-idle");
const resultLoading = document.getElementById("result-loading");
const resultError = document.getElementById("result-error");
const resultSuccess = document.getElementById("result-success");
const errorMessage = document.getElementById("error-message");
const retryBtn = document.getElementById("retry-btn");
const resultTypeName = document.getElementById("result-type-name");
const resultTypeAr = document.getElementById("result-type-ar");
const confidencePct = document.getElementById("confidence-pct");
const confidenceFill = document.getElementById("confidence-fill");
const resultDesc = document.getElementById("result-description");
const resultTags = document.getElementById("result-tags");
const langToggle = document.getElementById("language-toggle");
const langText = document.getElementById("lang-text");
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------
function t(key) {
    return scanTranslations[currentLang]?.[key] ?? scanTranslations.en[key] ?? key;
}

function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = t(key);
    });
    langText.textContent = currentLang === "en" ? "عربي" : "English";
    document.documentElement.setAttribute("lang", currentLang);
    document.documentElement.setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
}

function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("qalamLang", lang);
    applyTranslations();
}

langToggle.addEventListener("click", () => {
    switchLanguage(currentLang === "en" ? "ar" : "en");
});

// ---------------------------------------------------------------------------
// Hamburger
// ---------------------------------------------------------------------------
if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        hamburger.classList.toggle("active");
    });
}

// ---------------------------------------------------------------------------
// Upload zone — click
// ---------------------------------------------------------------------------
uploadZone.addEventListener("click", () => fileInput.click());
uploadZone.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") fileInput.click(); });

fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) loadFile(fileInput.files[0]);
});

// ---------------------------------------------------------------------------
// Drag & drop
// ---------------------------------------------------------------------------
uploadZone.addEventListener("dragover", e => {
    e.preventDefault();
    uploadZone.classList.add("drag-over");
});
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
uploadZone.addEventListener("drop", e => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith("image/")) loadFile(file);
});

// ---------------------------------------------------------------------------
// Load file into preview
// ---------------------------------------------------------------------------
function loadFile(file) {
    selectedFile = file;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewContainer.classList.remove("hidden");
    uploadZone.classList.add("hidden");
    analyzeBtn.disabled = false;
    showResultState("idle");
}

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------
clearBtn.addEventListener("click", () => {
    selectedFile = null;
    fileInput.value = "";
    previewImg.src = "";
    previewContainer.classList.add("hidden");
    uploadZone.classList.remove("hidden");
    analyzeBtn.disabled = true;
    showResultState("idle");
});

retryBtn.addEventListener("click", () => showResultState("idle"));

// ---------------------------------------------------------------------------
// Show result states
// ---------------------------------------------------------------------------
function showResultState(state) {
    resultSection.classList.remove("hidden");
    [resultIdle, resultLoading, resultError, resultSuccess].forEach(el => el.classList.add("hidden"));
    if (state === "idle") resultIdle.classList.remove("hidden");
    if (state === "loading") resultLoading.classList.remove("hidden");
    if (state === "error") resultError.classList.remove("hidden");
    if (state === "success") resultSuccess.classList.remove("hidden");
}

// ---------------------------------------------------------------------------
// Analyze
// ---------------------------------------------------------------------------
analyzeBtn.addEventListener("click", async () => {
    if (!selectedFile) {
        showError(t("scan_error_no_file"));
        return;
    }

    showResultState("loading");
    analyzeBtn.disabled = true;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
        const res = await fetch(BACKEND_URL, { method: "POST", body: formData });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: t("scan_error_generic") }));
            throw new Error(err.detail || t("scan_error_generic"));
        }

        const data = await res.json();
        showSuccess(data.type, data.confidence);

    } catch (err) {
        showError(err.message || t("scan_error_server"));
    } finally {
        analyzeBtn.disabled = false;
    }
});

function showError(msg) {
    errorMessage.textContent = msg;
    showResultState("error");
}

function showSuccess(typeName, confidence) {
    // Lookup by lowercase class name from Roboflow
    const key = typeName?.trim().toLowerCase() ?? "";
    const info = calligraphyInfo[key] ?? calligraphyInfo["default"];

    // Display name: Arabic-only in AR mode, English + Arabic subtitle in EN mode
    resultTypeName.dataset.key = key;   // store for language-switch refresh
    if (currentLang === "ar") {
        resultTypeName.textContent = info.arabicName;
        resultTypeAr.classList.add("hidden");
    } else {
        resultTypeName.textContent = info.displayName;
        resultTypeAr.textContent = info.arabicName;
        resultTypeAr.classList.remove("hidden");
    }

    // Confidence bar (animate after small delay)
    const pct = Math.round((confidence || 0) * 100);
    confidencePct.textContent = `${pct}%`;
    confidenceFill.style.width = "0%";
    confidenceFill.style.backgroundColor = pct >= 85 ? "#4caf50" : pct >= 60 ? "#ff9800" : "#f44336";
    requestAnimationFrame(() => {
        setTimeout(() => { confidenceFill.style.width = `${pct}%`; }, 100);
    });

    // Description (language-aware)
    resultDesc.textContent = info[currentLang] ?? info.en;

    // Tags
    resultTags.innerHTML = "";
    (info.tags || []).forEach(tag => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = tag;
        resultTags.appendChild(span);
    });

    showResultState("success");
}

// ---------------------------------------------------------------------------
// Update description language when language switches mid-result
// ---------------------------------------------------------------------------
function refreshResultLang() {
    applyTranslations();
    // If a result is visible, refresh names + description for the new language
    if (!resultSuccess.classList.contains("hidden")) {
        // Re-find info by the stored key (data attribute on the element)
        const key = resultTypeName.dataset.key ?? "";
        const info = calligraphyInfo[key] ?? calligraphyInfo["default"];
        if (currentLang === "ar") {
            resultTypeName.textContent = info.arabicName;
            resultTypeAr.classList.add("hidden");
        } else {
            resultTypeName.textContent = info.displayName;
            resultTypeAr.textContent = info.arabicName;
            resultTypeAr.classList.remove("hidden");
        }
        resultDesc.textContent = info[currentLang] ?? info.en;
    }
}

langToggle.removeEventListener("click", () => { }); // clear old listener
langToggle.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "ar" : "en";
    localStorage.setItem("qalamLang", currentLang);
    refreshResultLang();
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
    showResultState("idle");
});
