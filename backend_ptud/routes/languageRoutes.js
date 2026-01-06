import express from "express";
import TranslationService from "../services/translationService.js";

const router = express.Router();

/**
 * GET /api/language/current
 * Lấy ngôn ngữ hiện tại
 */
router.get("/current", (req, res) => {
  try {
    const currentLanguage = TranslationService.getCurrentLanguage();
    res.json({
      success: true,
      language: currentLanguage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: TranslationService.translate("common.error"),
      error: error.message,
    });
  }
});

/**
 * POST /api/language/set
 * Chuyển đổi ngôn ngữ
 * Body: { language: 'vi' | 'en' }
 */
router.post("/set", (req, res) => {
  try {
    const { language } = req.body;

    if (!["vi", "en"].includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Invalid language. Supported languages: vi, en",
      });
    }

    TranslationService.setLanguage(language);
    res.json({
      success: true,
      message: TranslationService.translate("common.success"),
      language: language,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: TranslationService.translate("common.error"),
      error: error.message,
    });
  }
});

/**
 * GET /api/language/translations/:namespace
 * Lấy tất cả các bản dịch cho một namespace
 * Query: ?lang=vi|en
 */
router.get("/translations/:namespace", (req, res) => {
  try {
    const { namespace } = req.params;
    const { lang } = req.query;

    if (lang && ["vi", "en"].includes(lang)) {
      TranslationService.setLanguage(lang);
    }

    const translations = TranslationService.getNamespaceTranslations(namespace);

    res.json({
      success: true,
      namespace: namespace,
      language: TranslationService.getCurrentLanguage(),
      translations: translations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: TranslationService.translate("common.error"),
      error: error.message,
    });
  }
});

/**
 * GET /api/language/all
 * Lấy tất cả các bản dịch
 * Query: ?lang=vi|en
 */
router.get("/all", (req, res) => {
  try {
    const { lang } = req.query;

    if (lang && ["vi", "en"].includes(lang)) {
      TranslationService.setLanguage(lang);
    }

    const translations = {
      auth: TranslationService.getNamespaceTranslations("auth"),
      student: TranslationService.getNamespaceTranslations("student"),
      building: TranslationService.getNamespaceTranslations("building"),
      room: TranslationService.getNamespaceTranslations("room"),
      invoice: TranslationService.getNamespaceTranslations("invoice"),
      semester: TranslationService.getNamespaceTranslations("semester"),
      notification: TranslationService.getNamespaceTranslations("notification"),
      supportRequest:
        TranslationService.getNamespaceTranslations("supportRequest"),
      manager: TranslationService.getNamespaceTranslations("manager"),
      monthlyUsage: TranslationService.getNamespaceTranslations("monthlyUsage"),
      common: TranslationService.getNamespaceTranslations("common"),
    };

    res.json({
      success: true,
      language: TranslationService.getCurrentLanguage(),
      translations: translations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: TranslationService.translate("common.error"),
      error: error.message,
    });
  }
});

export default router;
