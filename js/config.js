/**
 * 非機密設定值。這些都不是密鑰,公開在前端程式碼裡是安全的:
 *  - GOOGLE_CLIENT_ID:OAuth Client ID 本來就設計成可公開(瀏覽器端 OAuth 流程必要資訊)
 *  - WORKER_URL:你的 Cloudflare Worker 網址,Worker 本身用 Google 帳號驗證做存取控管(見 worker/src/index.js)
 *
 * ⚠️ 唯一真正的機密(Anthropic API Key)不會出現在這裡或任何前端檔案,
 *    它只存在 Cloudflare Worker 的加密環境變數裡(見 docs/DEPLOYMENT.md Part 1)。
 *
 * 部署前請把下面兩個值換成你自己的:
 *  - WORKER_URL:完成 docs/DEPLOYMENT.md Part 1 後,把 Worker 網址貼在這裡
 *  - GOOGLE_CLIENT_ID:完成 docs/DEPLOYMENT.md Part 2 後,把 OAuth Client ID 貼在這裡
 */
const CONFIG = {
  WORKER_URL: "https://REPLACE_WITH_YOUR_WORKER_URL.workers.dev",
  GOOGLE_CLIENT_ID: "REPLACE_WITH_YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com",
  // drive.file:只能存取本工具自己建立的檔案(較安全)
  // openid email:讓取得的 access token 帶有帳號 email,Worker 才能驗證呼叫者身分(見 worker/src/index.js)
  DRIVE_SCOPE: "openid email https://www.googleapis.com/auth/drive.file",
  DRIVE_FOLDER_NAME: "TOEIC-IELTS-Study-Data",

  MODELS: {
    SONNET: "claude-sonnet-5",
    HAIKU: "claude-haiku-4-5-20251001"
  },

  EXAM_DATES: {
    TOEIC: "2026-12-01",
    IELTS_ESTIMATED: "2027-09-15"
  },
  TARGET_SCORES: {
    TOEIC: 750,
    IELTS: 7.5
  },
  BASELINE_SCORES: {
    TOEIC_READING_LISTENING: 550,
    TOEIC_SPEAKING_WRITING_EQUIV: 400
  }
};
