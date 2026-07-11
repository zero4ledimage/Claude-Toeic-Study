/**
 * 口說練習模組 — 輕量版(需求文件 3.4 節)
 *
 * Phase 1:用瀏覽器 Web Speech API 做語音轉文字,Claude 給基本的內容組織建議。
 * 已知限制(需求文件已載明):這個方案評不出發音準確度、語速/停頓等音訊層面的
 * 流利度,只能評內容組織,Phase 2 才會補上更完整的 AI 評語邏輯。
 *
 * Web Speech API 主要在 Chrome/Edge 支援(webkitSpeechRecognition),沒有支援
 * 的瀏覽器會顯示提示,但仍可以手動貼上逐字稿使用 AI 建議功能,兩者不綁死。
 */

const SPEAKING_PROMPTS = [
  "請用約1分鐘介紹你自己的工作內容。",
  "描述你最近一次出差或旅行的經驗。",
  "你認為遠距工作的優缺點是什麼?",
  "描述一個對你影響很大的同事或主管。",
  "你會如何向客戶說明一個延遲交付的狀況?"
];

const SpeakingModule = {
  mount(container) {
    this.container = container;
    this.recognition = null;
    this.isRecording = false;
    this.render();
  },

  render() {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.container.innerHTML = `
      <div class="card">
        <h2>口說練習(輕量版）</h2>
        <p class="muted">此功能使用 Claude Sonnet 5 給內容組織建議,會計入 AI 預算。目前無法評估發音與流利度,只評內容組織,詳見需求文件 3.4 節已知限制。</p>
        <label class="field-label">練習題目</label>
        <select id="sp-prompt-select">
          ${SPEAKING_PROMPTS.map((p) => `<option value="${p}">${p}</option>`).join("")}
          <option value="__custom__">自訂題目…</option>
        </select>
        <textarea id="sp-custom-prompt" rows="2" style="display:none;" placeholder="輸入你自己的練習題目"></textarea>

        ${SpeechRecognitionCtor
          ? `<div class="sp-record-controls">
              <button class="btn-primary" id="sp-record-btn">開始錄音</button>
              <span id="sp-record-status" class="muted"></span>
            </div>`
          : `<p class="muted">你的瀏覽器不支援語音辨識(建議用電腦版 Chrome),可以直接在下面手動貼上你說的內容逐字稿。</p>`}

        <label class="field-label">逐字稿(可編輯或手動貼上）</label>
        <textarea id="sp-transcript" rows="6" placeholder="錄音內容會出現在這裡,也可以手動輸入…"></textarea>
        <button class="btn-primary" id="sp-feedback-btn">取得 AI 內容建議</button>
        <div id="sp-status"></div>
      </div>
      <div id="sp-result"></div>
    `;

    const promptSelect = this.container.querySelector("#sp-prompt-select");
    const customPrompt = this.container.querySelector("#sp-custom-prompt");
    promptSelect.addEventListener("change", () => {
      customPrompt.style.display = promptSelect.value === "__custom__" ? "block" : "none";
    });

    if (SpeechRecognitionCtor) {
      this.setupRecognition(SpeechRecognitionCtor);
    }

    this.container.querySelector("#sp-feedback-btn").addEventListener("click", () => this.getFeedback());
  },

  setupRecognition(SpeechRecognitionCtor) {
    const recordBtn = this.container.querySelector("#sp-record-btn");
    const statusEl = this.container.querySelector("#sp-record-status");
    const transcriptEl = this.container.querySelector("#sp-transcript");

    this.recognition = new SpeechRecognitionCtor();
    this.recognition.lang = "en-US";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    let finalTranscript = transcriptEl.value || "";

    this.recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += chunk + " ";
        else interim += chunk;
      }
      transcriptEl.value = (finalTranscript + interim).trim();
    };
    this.recognition.onerror = (e) => {
      statusEl.textContent = `錄音發生錯誤:${e.error}`;
      this.isRecording = false;
      recordBtn.textContent = "開始錄音";
    };
    this.recognition.onend = () => {
      if (this.isRecording) {
        // 部分瀏覽器會在靜音一段時間後自動結束,這裡自動重啟以延續錄音
        this.recognition.start();
      }
    };

    recordBtn.addEventListener("click", () => {
      if (!this.isRecording) {
        finalTranscript = transcriptEl.value ? transcriptEl.value + " " : "";
        this.recognition.start();
        this.isRecording = true;
        recordBtn.textContent = "停止錄音";
        statusEl.textContent = "錄音中…";
      } else {
        this.isRecording = false;
        this.recognition.stop();
        recordBtn.textContent = "開始錄音";
        statusEl.textContent = "已停止。";
      }
    });
  },

  async getFeedback() {
    const promptSelect = this.container.querySelector("#sp-prompt-select");
    const customPrompt = this.container.querySelector("#sp-custom-prompt");
    const topic = promptSelect.value === "__custom__" ? customPrompt.value.trim() : promptSelect.value;
    const transcript = this.container.querySelector("#sp-transcript").value.trim();
    const statusEl = this.container.querySelector("#sp-status");
    const btn = this.container.querySelector("#sp-feedback-btn");

    if (!transcript) {
      statusEl.textContent = "請先錄音或貼上逐字稿。";
      return;
    }
    btn.disabled = true;
    statusEl.textContent = "分析中…";

    try {
      const resp = await ApiClient.callClaude({
        model: CONFIG.MODELS.SONNET,
        maxTokens: 800,
        system:
          "你是英語口說教練,協助多益/雅思考生。你只會看到語音轉文字的逐字稿,無法評估發音、語調、停頓等音訊層面的表現,請只針對「內容組織」給建議:回答是否切題、結構是否清楚(開頭/主體/結尾)、論點是否有具體例子支撐、有沒有明顯的內容缺漏。用繁體中文,條列2-4點具體建議。",
        messages: [
          {
            role: "user",
            content: `題目:${topic}\n\n我的回答逐字稿:\n${transcript}`
          }
        ]
      });
      const feedback = ApiClient.extractText(resp);
      this.container.querySelector("#sp-result").innerHTML = `
        <div class="card">
          <h3>內容組織建議</h3>
          <div class="ws-feedback">${escapeHtml(feedback).replace(/\n/g, "<br>")}</div>
        </div>
      `;
      statusEl.textContent = "";
    } catch (err) {
      statusEl.textContent = err.message || "分析失敗,請稍後再試。";
    } finally {
      btn.disabled = false;
    }
  }
};
