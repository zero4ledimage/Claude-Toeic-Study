/**
 * Google Drive 同步層(需求文件 4.2 節)
 *
 * 採用 Google Identity Services 的 token client 模式(而非傳統 offline refresh token):
 * 每次開啟網站做一次輕量 Google 登入即可取得約 1 小時效期的存取權杖,完全前端運作、
 * 不需要後端保存 refresh token,避開「External + 測試中」狀態 OAuth 應用 refresh token
 * 7 天過期的限制。
 *
 * 授權範圍使用 drive.file(較安全):只能存取「這個工具自己建立的檔案」,看不到使用者
 * Google Drive 裡其他既有的檔案。
 */

const DRIVE_FILES = {
  vocabItems: "vocab_items.json",
  errorLog: "error_log.json",
  progressRecords: "progress_records.json",
  studySessions: "study_sessions.json",
  apiUsageDailyCache: "api_usage_daily_cache.json",
  chunkItems: "chunk_items.json",
  generatedItems: "generated_items.json",
  sourceTexts: "source_texts.json"
};

let gisLoadedPromise = null;
function loadGisScript() {
  if (gisLoadedPromise) return gisLoadedPromise;
  gisLoadedPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("無法載入 Google Identity Services"));
    document.head.appendChild(script);
  });
  return gisLoadedPromise;
}

const driveListeners = {};
function driveOn(event, fn) {
  (driveListeners[event] = driveListeners[event] || []).push(fn);
}
function driveEmit(event, payload) {
  (driveListeners[event] || []).forEach((fn) => fn(payload));
}

const DriveSync = {
  on: driveOn,
  tokenClient: null,
  accessToken: null,
  signedIn: false,
  folderId: null,
  fileIdCache: {},
  _pushTimers: {},

  async init() {
    await loadGisScript();
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      scope: CONFIG.DRIVE_SCOPE,
      callback: () => {} // 由 signIn() 動態覆寫,實際流程走 Promise
    });

    // 監聽本地資料異動,debounce 後推回 Drive
    DataStore.on("data:dirty", ({ collection }) => {
      if (!this.signedIn) return;
      clearTimeout(this._pushTimers[collection]);
      this._pushTimers[collection] = setTimeout(() => {
        this.pushCollection(collection).catch((e) => console.error("Drive push failed", collection, e));
      }, 3000);
    });
  },

  signIn() {
    return new Promise((resolve, reject) => {
      this.tokenClient.callback = async (resp) => {
        if (resp.error) {
          reject(resp);
          return;
        }
        this.accessToken = resp.access_token;
        this.signedIn = true;
        driveEmit("signed-in", null);
        try {
          await this.pullAll();
        } catch (e) {
          console.error("Initial Drive pull failed", e);
        }
        resolve(resp);
      };
      this.tokenClient.requestAccessToken({ prompt: "" });
    });
  },

  signOut() {
    if (this.accessToken && window.google) {
      google.accounts.oauth2.revoke(this.accessToken, () => {});
    }
    this.accessToken = null;
    this.signedIn = false;
    driveEmit("signed-out", null);
  },

  async _authFetch(url, options = {}) {
    const doFetch = () =>
      fetch(url, {
        ...options,
        headers: { ...(options.headers || {}), Authorization: `Bearer ${this.accessToken}` }
      });
    let resp = await doFetch();
    if (resp.status === 401) {
      // token 過期,靜默重新取得(使用者已授權過,通常不會跳出視窗)
      await new Promise((resolve, reject) => {
        this.tokenClient.callback = (r) => {
          if (r.error) { reject(r); return; }
          this.accessToken = r.access_token;
          resolve();
        };
        this.tokenClient.requestAccessToken({ prompt: "" });
      });
      resp = await doFetch();
    }
    return resp;
  },

  async _ensureFolder() {
    if (this.folderId) return this.folderId;
    const q = encodeURIComponent(
      `name='${CONFIG.DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    const searchResp = await this._authFetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name)`
    );
    const searchData = await searchResp.json();
    if (searchData.files && searchData.files.length > 0) {
      this.folderId = searchData.files[0].id;
      return this.folderId;
    }
    const createResp = await this._authFetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: CONFIG.DRIVE_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" })
    });
    const created = await createResp.json();
    this.folderId = created.id;
    return this.folderId;
  },

  async _findFileId(filename) {
    if (this.fileIdCache[filename]) return this.fileIdCache[filename];
    const folderId = await this._ensureFolder();
    const q = encodeURIComponent(`name='${filename}' and '${folderId}' in parents and trashed=false`);
    const resp = await this._authFetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name,modifiedTime)`
    );
    const data = await resp.json();
    if (data.files && data.files.length > 0) {
      this.fileIdCache[filename] = data.files[0].id;
      return data.files[0].id;
    }
    return null;
  },

  async readJson(filename) {
    const fileId = await this._findFileId(filename);
    if (!fileId) return null;
    const resp = await this._authFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
    if (!resp.ok) return null;
    try {
      return await resp.json();
    } catch (e) {
      return null;
    }
  },

  async writeJson(filename, data) {
    const existingId = await this._findFileId(filename);
    const body = JSON.stringify(data);
    if (existingId) {
      await this._authFetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body
      });
      return existingId;
    }
    const folderId = await this._ensureFolder();
    const metadata = { name: filename, parents: [folderId] };
    const boundary = "toeic_ielts_boundary_" + Date.now();
    const multipartBody =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
    const resp = await this._authFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body: multipartBody
    });
    const created = await resp.json();
    this.fileIdCache[filename] = created.id;
    return created.id;
  },

  // ---------- 與 DataStore 對接 ----------
  async pullAll() {
    for (const [col, filename] of Object.entries(DRIVE_FILES)) {
      const remote = await this.readJson(filename);
      if (!remote) continue; // Drive 上還沒有這份檔案(第一次使用),保留本地資料,稍後 push 建立
      const localUpdatedAt = DataStore.getUpdatedAt(col);
      if (!localUpdatedAt || new Date(remote.updatedAt) > new Date(localUpdatedAt)) {
        DataStore._replaceCollection(col, remote.items, remote.updatedAt);
      }
    }
  },

  async pushCollection(col) {
    const filename = DRIVE_FILES[col];
    if (!filename) return;
    const snapshot = DataStore._snapshotForSync(col);
    await this.writeJson(filename, snapshot);
  },

  async pushAll() {
    for (const col of Object.keys(DRIVE_FILES)) {
      await this.pushCollection(col);
    }
  }
};
