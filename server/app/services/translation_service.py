import json
import hashlib
import logging
import re
from deep_translator import GoogleTranslator
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Skip translating these JSON keys (IDs, technical fields, color codes)
_SKIP_KEYS = {'id', 'student_id', 'parent_id', 'teacher_id', 'color', 'status', 'type', 'code'}

# Skip translating values that match these patterns (hex colors, letter grades A/B+/C-)
_SKIP_VALUE_PATTERNS = [
    re.compile(r'^#[0-9A-Fa-f]{3,8}$'),
    re.compile(r'^[A-D][+-]?$'),
]

class TranslationService:
    @staticmethod
    def _normalize_lang(lang: str) -> str:
        return {'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', 'hi': 'hi', 'vi': 'vi', 'en': 'en'}.get(lang, lang)

    @staticmethod
    def translate_to_english(text: str, source_lang: str) -> str:
        if not text or not text.strip() or source_lang == "en":
            return text
        try:
            logger.info(f"Translating to English (from {source_lang}): {text[:50]}...")
            result = GoogleTranslator(source='auto', target='en').translate(text)
            logger.info(f"Translation result (English): {result[:50]}...")
            return result or text
        except Exception as e:
            logger.error(f"Error translating to English: {e}")
            return text

    @staticmethod
    def translate_from_english(text: str, target_lang: str) -> str:
        if not text or not text.strip() or target_lang == "en":
            return text
        try:
            lang_code = TranslationService._normalize_lang(target_lang)
            logger.info(f"Translating from English to {target_lang}: {text[:50]}...")
            result = GoogleTranslator(source='en', target=lang_code).translate(text)
            logger.info(f"Translation result ({target_lang}): {result[:50]}...")
            return result or text
        except Exception as e:
            logger.error(f"Error translating from English to {target_lang}: {e}")
            return text

    @staticmethod
    def _should_skip_value(value: str) -> bool:
        for pattern in _SKIP_VALUE_PATTERNS:
            if pattern.match(value.strip()):
                return True
        return False

    @staticmethod
    def _translate_recursive(data, lang_code: str):
        if isinstance(data, dict):
            return {
                k: data[k] if k in _SKIP_KEYS
                else TranslationService._translate_recursive(data[k], lang_code)
                for k in data
            }
        elif isinstance(data, list):
            return [TranslationService._translate_recursive(item, lang_code) for item in data]
        elif isinstance(data, str):
            if not data.strip() or TranslationService._should_skip_value(data):
                return data
            try:
                return GoogleTranslator(source='en', target=lang_code).translate(data) or data
            except Exception as e:
                logger.warning(f"Skipping string translation for '{data[:30]}': {e}")
                return data
        return data

    @staticmethod
    def _compute_hash(data) -> str:
        raw = json.dumps(data, sort_keys=True, ensure_ascii=False)
        return hashlib.md5(raw.encode("utf-8")).hexdigest()

    @staticmethod
    def translate_json(data: dict | list, target_lang: str, db: Session = None) -> dict | list:
        if target_lang == "en":
            return data

        payload_hash = TranslationService._compute_hash(data)

        # --- Cache lookup ---
        if db is not None:
            from app.models.translation_cache import TranslationCache
            cached = (
                db.query(TranslationCache)
                .filter(TranslationCache.payload_hash == payload_hash, TranslationCache.language == target_lang)
                .first()
            )
            if cached:
                logger.info(f"✅ Cache HIT for {target_lang} (hash={payload_hash[:12]}...). Returning instantly.")
                return json.loads(cached.translated_payload)
            else:
                logger.info(f"❌ Cache MISS for {target_lang} (hash={payload_hash[:12]}...). Translating with GoogleTranslator...")

        lang_code = TranslationService._normalize_lang(target_lang)
        try:
            logger.info(f"Translating JSON payload to {target_lang}...")
            translated = TranslationService._translate_recursive(data, lang_code)

            # --- Save to cache ---
            if db is not None:
                from app.models.translation_cache import TranslationCache
                cache_entry = TranslationCache(
                    payload_hash=payload_hash,
                    language=target_lang,
                    translated_payload=json.dumps(translated, ensure_ascii=False),
                )
                db.add(cache_entry)
                db.commit()
                logger.info(f"💾 Saved translation to cache (hash={payload_hash[:12]}...).")

            return translated
        except Exception as e:
            logger.error(f"Error translating JSON: {e}")
            return data
