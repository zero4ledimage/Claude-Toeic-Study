# 部署與帳號設定手冊

這份文件是給**你(使用者)**照著做的操作手冊,不是給 Claude Code 看的開發文件(開發規格在 `requirements.md`)。裡面每一步都是需要你在瀏覽器裡手動點擊完成的,Claude Code 沒辦法代勞這部分(沒有你的帳號登入權限)。

文件分成三大部分,**請照順序做**,因為後面的步驟會需要前面步驟產生的資訊(例如 Worker 網址):

1. [Part 1:Cloudflare Worker 部署](#part-1cloudflare-worker-部署)
2. [Part 2:Google Cloud Console 設定](#part-2google-cloud-console-設定)(尚未撰寫,待 Google Drive 串接功能開發完成後補上)
3. [Part 3:GitHub Pages 啟用](#part-3github-pages-啟用)(尚未撰寫,待前端主體開發完成後補上)

---

## Part 1:Cloudflare Worker 部署

這一步的目的:讓你的 Anthropic API 金鑰只存在 Cloudflare 的伺服器端,不會出現在任何你發布到 GitHub Pages 的網頁程式碼裡。全程用瀏覽器操作 Cloudflare 網站介面,不需要安裝任何軟體。

### 步驟 1:註冊 Cloudflare 帳號

1. 前往 https://dash.cloudflare.com/sign-up
2. 用你的 Email 註冊一個免費帳號(不需要信用卡)
3. 登入後會進到 Cloudflare Dashboard(儀表板)

### 步驟 2:建立 KV 儲存空間(用來記錄每日/每月 API 花費)

1. 左側選單找到 **Workers & Pages** → 再找子選單 **KV**(如果找不到,直接在網址列輸入 `https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces`)
2. 點 **Create a namespace**(建立命名空間)
3. Namespace name(命名空間名稱)填:`USAGE_KV`
4. 建立後,**把出現的 Namespace ID 複製下來**,等一下設定 Worker 時會用到

### 步驟 3:建立 Worker 並貼上程式碼

1. 左側選單 **Workers & Pages**,點 **Create application** → 選 **Create Worker**
2. Worker 名稱建議填:`toeic-ielts-study-worker`
3. 建立後會進到一個線上程式碼編輯器(**Edit code** / Quick Edit)
4. 把這個 repo 裡 `worker/src/index.js` 檔案的**全部內容**複製,貼到編輯器裡,取代原本的範例程式碼
5. 點右上角 **Deploy** / **Save and deploy**

### 步驟 4:把 KV 命名空間綁定到這個 Worker

1. 進到剛剛建立的 Worker 的管理頁面(不是程式碼編輯器,是 Worker 的 Settings 頁)
2. 找到 **Settings** → **Variables and Secrets**(或較舊版介面是 **Settings** → **Variables** → **KV Namespace Bindings**)
3. 新增一個綁定:
   - Variable name(變數名稱):**必須完全是** `USAGE_KV`(程式碼裡就是用這個名字讀寫)
   - KV namespace:選你步驟2建立的 `USAGE_KV`
4. 儲存

### 步驟 5:設定環境變數與金鑰

同樣在 **Settings** → **Variables and Secrets** 頁面,新增以下三個變數:

| 變數名稱 | 類型 | 值 |
|---|---|---|
| `ALLOWED_ORIGIN` | 一般文字(Text) | 你的 GitHub Pages 網址,例如 `https://zero4ledimage.github.io`(等 Part 3 啟用 GitHub Pages 後確認實際網址,現在可以先填這個猜測值,之後再回來改) |
| `ALLOWED_EMAIL` | 一般文字(Text) | `REPLACE_WITH_YOUR_LOGIN_EMAIL`(限定只有用這個 Google 帳號登入本工具的請求才能呼叫 AI,防止 Worker 網址外流後被別人盜用你的預算) |
| `ANTHROPIC_API_KEY` | **⚠️ 一定要選「Encrypt」(加密/Secret)類型** | 你的 Anthropic API 金鑰,從 https://console.anthropic.com/settings/keys 取得(如果還沒有帳號,先去 https://console.anthropic.com 註冊並加值) |

**⚠️ 重要**:`ANTHROPIC_API_KEY` 這一個一定要選加密類型(Cloudflare 介面上通常標示為 "Encrypt" 或有一個鎖頭圖示可切換),存好之後 Cloudflare 自己都不會再顯示明碼給你看。如果不小心選成一般文字類型,等於金鑰還是變相公開在你的 Cloudflare 帳號設定畫面上,雖然不會外流到前端,但仍建議務必用加密類型。

設定完後點 **Deploy** 讓變更生效。

### 步驟 6:記下你的 Worker 網址

Worker 首頁會顯示一個網址,格式類似:

```
https://toeic-ielts-study-worker.你的cloudflare帳號子網域.workers.dev
```

**把這個網址記下來**,之後開發前端 `js/config.js` 時會需要填入這個網址。之後我(Claude Code)會在程式碼裡留一個清楚的欄位讓你貼上。

### 步驟 7(可選,之後測試用):Anthropic Console 設定帳單保險上限

依需求文件 3.9 節的建議,除了 Worker 裡的 USD 30 硬上限,再加一層保險:

1. 前往 https://console.anthropic.com/settings/billing
2. 設定 **Usage limit**(消費上限)為 **USD 35**(比 Worker 的 30 略高一點,當作萬一 Worker 端估算邏輯算錯時的最後防線)

---

### 這部分完成後的檢查清單

- [ ] Cloudflare 帳號已註冊
- [ ] `USAGE_KV` 命名空間已建立
- [ ] Worker 已建立,程式碼已貼上並部署
- [ ] `USAGE_KV` 已綁定到 Worker(變數名稱完全是 `USAGE_KV`)
- [ ] `ALLOWED_ORIGIN`、`ALLOWED_EMAIL`、`ANTHROPIC_API_KEY` 三個變數都已設定(金鑰為加密類型)
- [ ] 已記下 Worker 網址
- [ ] (可選)Anthropic Console 帳單上限已設 USD 35

全部打勾後,回來跟 Claude Code 說一聲,或直接告訴我 Worker 網址,我會繼續開發需要用到這個網址的前端功能。

---

## Part 2:Google Cloud Console 設定

這一步的目的:讓網頁能用你的 Google 帳號登入,並把學習資料(單字、錯題、進度)存到你自己 Google Drive 裡的一個資料夾。全程瀏覽器操作。

### 步驟 1:建立 Google Cloud 專案

1. 前往 https://console.cloud.google.com/
2. 用你平常的 Google 帳號登入(建議用 `REPLACE_WITH_YOUR_LOGIN_EMAIL`,跟後面 Worker 設定的 `ALLOWED_EMAIL` 要一致)
3. 上方選單點專案下拉選單 → **新增專案**
4. 專案名稱建議填:`toeic-ielts-study-tool`,建立

### 步驟 2:啟用 Google Drive API

1. 左側選單(或搜尋列搜尋)找到 **API 和服務** → **程式庫**
2. 搜尋 `Google Drive API`,點進去,點 **啟用**

### 步驟 3:設定 OAuth 同意畫面

1. **API 和服務** → **OAuth 同意畫面**
2. User Type 選 **External**(外部)
3. 填寫應用程式名稱(例如「多益雅思學習工具」)、你的 Email(使用者支援 Email 與開發人員聯絡資訊都填你自己的 Email)
4. **範圍(Scopes)**這一步先跳過或不用特別新增,實際授權範圍會在程式碼裡直接指定 `drive.file`
5. **測試使用者(Test users)**這一步:點新增使用者,加入 `REPLACE_WITH_YOUR_LOGIN_EMAIL`(你自己的帳號)
   - 這一步很重要:因為這個 OAuth 應用停留在「測試中」狀態(個人工具不需要走 Google 正式審核),只有列在測試使用者名單裡的帳號才能登入成功
6. 儲存並繼續,完成設定

### 步驟 4:建立 OAuth 2.0 用戶端 ID

1. **API 和服務** → **憑證(Credentials)**
2. 點 **建立憑證** → **OAuth 用戶端 ID**
3. 應用程式類型選 **網頁應用程式(Web application)**
4. 名稱隨意,例如 `toeic-ielts-study-web`
5. **已授權的 JavaScript 來源**:加入你的 GitHub Pages 網址,例如 `https://zero4ledimage.github.io`
   - 注意:這裡**不要**加路徑,只要網域本身(不是 `https://zero4ledimage.github.io/Claude-Toeic-Study/` 這種帶路徑的)
   - 如果你還沒做 Part 3(還不知道確切的 GitHub Pages 網址),可以先跳過這步驟或填一個暫定值,之後回來這個頁面編輯即可,不需要重新建立
6. **已授權的重新導向 URI**:token client 模式不需要設定這個,留空即可
7. 建立後,畫面會顯示 **用戶端 ID**(Client ID),格式類似 `123456789-abc...apps.googleusercontent.com`

**把這個 Client ID 記下來或直接貼給我**,我會填進 `js/config.js` 的 `GOOGLE_CLIENT_ID`。這不是密鑰,可以放心公開貼給我或寫在前端程式碼裡。

### 這部分完成後的檢查清單

- [ ] Google Cloud 專案已建立
- [ ] Google Drive API 已啟用
- [ ] OAuth 同意畫面已設定為 External,測試使用者已加入你自己的 Email
- [ ] OAuth 用戶端 ID(網頁應用程式類型)已建立,JavaScript 來源已填入 GitHub Pages 網址
- [ ] 已記下 Client ID

---

## Part 3:GitHub Pages 啟用

這一步讓你的網站有一個公開網址可以用手機/電腦瀏覽器打開。

### 步驟 1:確認 repo 設定

這個 repo(`zero4ledimage/Claude-Toeic-Study`)已經是 public,符合 GitHub Pages 免費方案的要求,這步不用你額外做什麼。

### 步驟 2:啟用 GitHub Pages

1. 到 repo 頁面 → **Settings** → 左側選單 **Pages**
2. **Source** 選 **Deploy from a branch**
3. Branch 選這個開發用的分支(目前是 `claude/toeic-750-study-plan-8cd12x`,如果之後合併到 `main`,改選 `main`),資料夾選 `/ (root)`
4. 儲存後,GitHub 會給你一個網址,格式是:
   ```
   https://zero4ledimage.github.io/Claude-Toeic-Study/
   ```
5. 第一次啟用大約要等 1-2 分鐘才會生效

### 步驟 3:回頭校正前面兩步的網址設定

拿到實際網址後,回去確認/修改這兩個地方(**注意結尾有沒有斜線與路徑,三個地方要對得起來**):

- Cloudflare Worker 的 `ALLOWED_ORIGIN` 環境變數:填**不含路徑**的來源,例如 `https://zero4ledimage.github.io`(瀏覽器 CORS 的 Origin 判斷只看網域,不看路徑)
- Google Cloud OAuth 用戶端的「已授權的 JavaScript 來源」:同樣填 `https://zero4ledimage.github.io`(不含路徑)
- `js/config.js` 裡不需要填網址本身,但你打開網站測試時要用完整網址 `https://zero4ledimage.github.io/Claude-Toeic-Study/`

### 這部分完成後的檢查清單

- [ ] GitHub Pages 已啟用,拿到公開網址
- [ ] Cloudflare Worker 的 `ALLOWED_ORIGIN` 已用實際網址校正
- [ ] Google OAuth 用戶端的 JavaScript 來源已用實際網址校正
- [ ] 用手機或電腦瀏覽器打開網址,確認網站有出現(不用登入成功,先確認畫面有跑出來)

---

## 三部分都完成後

回來跟我說一聲,或者直接把 **Worker 網址** 和 **Google OAuth Client ID** 貼給我,我會把這兩個值填進 `js/config.js`,整個工具就能真正串接運作、開始存資料到你的 Google Drive 了。
