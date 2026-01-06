import i18next from "../config/i18n.js";

export class TranslationService {
  /**
   * Dịch một key với optional parameters
   * @param {string} key - Khóa dịch (vd: 'common.save')
   * @param {object} options - Các tùy chọn dịch
   * @returns {string} - Chuỗi đã dịch
   */
  static translate(key, options = {}) {
    return i18next.t(key, options);
  }

  /**
   * Dịch một key với ngôn ngữ cụ thể
   * @param {string} language - Mã ngôn ngữ (vi, en)
   * @param {string} key - Khóa dịch
   * @param {object} options - Các tùy chọn dịch
   * @returns {string} - Chuỗi đã dịch
   */
  static translateWithLanguage(language, key, options = {}) {
    return i18next.t(key, { ...options, lng: language });
  }

  /**
   * Thay đổi ngôn ngữ hiện tại
   * @param {string} language - Mã ngôn ngữ (vi, en)
   */
  static setLanguage(language) {
    i18next.changeLanguage(language);
  }

  /**
   * Lấy ngôn ngữ hiện tại
   * @returns {string} - Mã ngôn ngữ hiện tại
   */
  static getCurrentLanguage() {
    return i18next.language;
  }

  /**
   * Dịch một object với tất cả các giá trị chuỗi
   * @param {object} obj - Object cần dịch
   * @param {string} namespace - Namespace để dịch
   * @returns {object} - Object sau khi dịch
   */
  static translateObject(obj, namespace = "") {
    const translated = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const translationKey = namespace ? `${namespace}.${key}` : key;
        translated[key] = i18next.t(translationKey);
      }
    }
    return translated;
  }

  /**
   * Lấy tất cả các bản dịch cho một namespace
   * @param {string} namespace - Namespace
   * @returns {object} - Object chứa tất cả các bản dịch
   */
  static getNamespaceTranslations(namespace) {
    return (
      i18next.getResourceBundle(i18next.language, "translation")[namespace] ||
      {}
    );
  }
}

export default TranslationService;
