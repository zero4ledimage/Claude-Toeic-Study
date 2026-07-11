/**
 * 共用工具函式
 */

// 把任意字串轉成可安全放進 HTML 內文的文字,防止 XSS。
// 凡是要用樣板字串插進 innerHTML 的「非開發者控制內容」(使用者輸入、AI 回傳、
// 字典資料等)都必須先過這個函式。
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
