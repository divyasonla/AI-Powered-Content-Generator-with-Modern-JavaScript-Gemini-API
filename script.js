
const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const API_KEY = "AIzaSyAzoPBASSk1UFkMMj7MW0DGNvEggwUr-ow"; 

// DOM helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const resultsEl = $("#results-content");
const loadingEl = $("#loading");

const showLoading = () => loadingEl.classList.remove("hidden");
const hideLoading = () => loadingEl.classList.add("hidden");
const setResult = (text, isError = false) => {
  resultsEl.innerHTML = `<p>${escapeHtml(text)}</p>`;
  resultsEl.classList.toggle("error", isError);
};

const escapeHtml = (str ) =>
  String(str).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[s]));

// API call
async function callApi(prompt) {
  if (!API_KEY) throw new Error('Missing API key');
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const res = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'API Error');
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Feature functions
async function handleAsk() {
  const prompt = $(`#input-ask-text`).value.trim();
  if (!prompt) return setResult('⚠️ Please enter a question', true);
  showLoading();
  try {
    const text = await callApi(`Answer concisely:\n\n${prompt}`);
    setResult(text);
  } catch (e) {
    setResult(e.message, true);
  } finally {
    hideLoading();
  }
}

async function handleSummarize() {
  const text = $(`#input-summarize-text`).value.trim();
  if (!text) return setResult('⚠️ Please paste text to summarize', true);
  showLoading();
  try {
    const res = await callApi(`Summarize in 10-15 sentences:\n\n${text}`);
    setResult(res);
  } catch (e) {
    setResult(e.message, true);
  } finally {
    hideLoading();
  }
}

async function handleIdeas() {
  const what = $(`#input-ideas-text`).value.trim();
  if (!what) return setResult('⚠️ Please tell what kind of ideas you want', true);
  showLoading();
  try {
    const res = await callApi(`Generate 5 creative ${what}, numbered.`);
    setResult(res);
  } catch (e) {
    setResult(e.message, true);
  } finally {
    hideLoading();
  }
}

async function handleDefine() {
  const term = $(`#input-define-text`).value.trim();
  if (!term) return setResult('⚠️ Please enter a term to define', true);
  showLoading();
  try {
    const res = await callApi(`Define and explain: ${term}`);
    setResult(res);
  } catch (e) {
    setResult(e.message, true);
  } finally {
    hideLoading();
  }
}

// Wiring
function switchTab(feature) {
  $$('.tab-button').forEach((b) => b.classList.toggle('active', b.dataset.feature === feature));
  $$('.input-group').forEach((g) => g.classList.toggle('hidden', g.id !== `input-${feature}`));
  $$('.feature-description').forEach((d) => d.classList.toggle('hidden', d.id !== `description-${feature}`));
  setResult('');
}

function setup() {
  // tabs
  $$('.tab-button').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.feature)));

  // submit buttons
  $$('.submit-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      const f = btn.dataset.feature;
      if (f === 'ask') return handleAsk();
      if (f === 'summarize') return handleSummarize();
      if (f === 'ideas') return handleIdeas();
      if (f === 'define') return handleDefine();
    })
  );

  // clear
  const clearBtn = $('#clear-btn');
  if (clearBtn) clearBtn.addEventListener('click', () => setResult(''));

  // keyboard: Ctrl/Cmd+Enter to submit
  $$('.input-textarea').forEach((ta) =>
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const active = $$('.tab-button').find((b) => b.classList.contains('active'))?.dataset.feature || 'ask';
        document.querySelector(`[data-feature="${active}"]`).click();
      }
    })
  );

  // default tab
  switchTab('ask');
}

// init
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', setup) : setup();
