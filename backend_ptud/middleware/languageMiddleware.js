import i18next from "../config/i18n.js";

export const languageMiddleware = (req, res, next) => {
  // Lấy ngôn ngữ từ query parameter, header hoặc sử dụng mặc định
  const language = req.query.lang || req.headers["accept-language"] || "vi";

  // Đặt ngôn ngữ hiện tại cho request
  i18next.changeLanguage(language);

  // Thêm hàm i18n vào res.locals để sử dụng trong response
  res.locals.t = i18next.t.bind(i18next);
  res.locals.currentLanguage = language;

  next();
};

export const getLanguage = (req) => {
  return req.query.lang || req.headers["accept-language"] || "vi";
};

export const setLanguage = (language) => {
  i18next.changeLanguage(language);
};
