const CONFIG = {
  API_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  DEFAULT_TEMPERATURE: 0.7,
  RESULT_DELAY: 300
};

const TAB_BUTTONS = document.querySelectorAll(".tab-button");
const INPUT_GROUPS = document.querySelectorAll(".input-group");
const FEATURE_DESCRIPTIONS = document.querySelectorAll(".feature-description");
const SUBMIT_BUTTONS = document.querySelectorAll(".submit-btn");

const CLEAR_BTN = document.getElementById("clear-btn");
const RESULTS_CONTENT = document.getElementById("results-content");
const LOADING_DIV = document.getElementById("loading");
const API_KEY_INPUT = document.getElementById("api-key-input");
const INPUT_TEXTAREA = document.getElementById("input-text");

const appState = {
  currentFeature: "ask",
  apiKey: localStorage.getItem("gemini_api_key") || "",
  isLoading: false
};
if (appState.apiKey) API_KEY_INPUT.value = appState.apiKey;

const prepareBody = (text) => ({
  contents: [{ parts: [{ text }] }],
  generationConfig: { temperature: CONFIG.DEFAULT_TEMPERATURE, maxOutputTokens: 2048 }
});

const apiService = {
  async generateContent(prompt) {
    if (!appState.apiKey) throw new Error("🔑 Please enter your Gemini API key!");
    if (!prompt.trim()) throw new Error("⚠️ Please enter a prompt.");

    const res = await fetch(`${CONFIG.API_ENDPOINT}?key=${appState.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prepareBody(prompt))
    });

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Invalid API response.");
    return text;
  }
};

const promptFactory = {
  askQuestion: (q) => `Answer clearly:\n\n${q}`,
  summarize: (t) => `Summarize the following text:\n\n${t}`,
  generateIdeas: (r) => `Generate 5 creative ${r}.`,
  define: (t) => `Explain the term: "${t}"`
};

const uiController = {
  switchTab(feature) {
    appState.currentFeature = feature;

    TAB_BUTTONS.forEach((b) => b.classList.toggle("active", b.dataset.feature === feature));
    INPUT_GROUPS.forEach((g) => g.classList.toggle("active", g.id === `input-${feature}`));
    INPUT_GROUPS.forEach((g) => g.classList.toggle("hidden", g.id !== `input-${feature}`));
    FEATURE_DESCRIPTIONS.forEach((d) => d.classList.toggle("hidden", d.id !== `description-${feature}`));

    this.clearResults();
    INPUT_TEXTAREA.focus();
  },

  showLoading() {
    appState.isLoading = true;
    LOADING_DIV.classList.remove("hidden");
    SUBMIT_BUTTONS.forEach((b) => (b.disabled = true));
  },

  hideLoading() {
    appState.isLoading = false;
    LOADING_DIV.classList.add("hidden");
    SUBMIT_BUTTONS.forEach((b) => (b.disabled = false));
  },

  displayResults(result, isError = false) {
    setTimeout(() => {
      RESULTS_CONTENT.innerHTML = `<p>${escapeHtml(result)}</p>`;
      RESULTS_CONTENT.classList.toggle("success", !isError);
      RESULTS_CONTENT.classList.toggle("error", isError);
    }, CONFIG.RESULT_DELAY);
  },

  clearResults() {
    RESULTS_CONTENT.innerHTML = `<p class="placeholder">Your AI-generated content will appear here...</p>`;
    RESULTS_CONTENT.classList.remove("success", "error");

    const textarea = document.getElementById(`input-${appState.currentFeature}-text`);
    if (textarea) textarea.value = "";
  },

  saveApiKey(key) {
    appState.apiKey = key;
    localStorage.setItem("gemini_api_key", key);
  }
};

const featureHandlers = {
  ask: async (input) => executeFeature(promptFactory.askQuestion(input)),
  summarize: async (input) => executeFeature(promptFactory.summarize(input)),
  ideas: async (input) => executeFeature(promptFactory.generateIdeas(input)),
  define: async (input) => executeFeature(promptFactory.define(input))
};

const executeFeature = async (prompt) => {
  try {
    uiController.showLoading();
    const result = await apiService.generateContent(prompt);
    uiController.hideLoading();
    uiController.displayResults(result);
  } catch (err) {
    uiController.hideLoading();
    uiController.displayResults(err.message, true);
    console.error("Error:", err);
  }
};

const escapeHtml = (t) =>
  t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

const initializeEventListeners = () => {
  TAB_BUTTONS.forEach((btn) =>
    btn.addEventListener("click", () => uiController.switchTab(btn.dataset.feature))
  );

  SUBMIT_BUTTONS.forEach((btn) =>
    btn.addEventListener("click", async () => {
      const textarea = document.getElementById(`input-${btn.dataset.feature}-text`);
      const input = textarea.value.trim();
      if (!input) return uiController.displayResults("⚠️ Please enter some content!", true);
      await featureHandlers[btn.dataset.feature](input);
    })
  );

  CLEAR_BTN.addEventListener("click", () => uiController.clearResults());
  API_KEY_INPUT.addEventListener("change", (e) => uiController.saveApiKey(e.target.value));

  document.querySelectorAll(".input-textarea").forEach((area) =>
    area.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        document.querySelector(`[data-feature="${appState.currentFeature}"].submit-btn`)?.click();
      }
    })
  );
};

const initializeApp = () => {
  initializeEventListeners();
  uiController.switchTab("ask");
  console.log("App Ready!");
};

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", initializeApp)
  : initializeApp();
