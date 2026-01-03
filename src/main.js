// main.js - loads sections.json and section files dynamically
import DataService from "./data/DataService.js";
import Router from "./core/router/Router.js";
import { initI18n, t, getLang, setLang } from "./core/i18n/i18n.js";
const COURSE_TITLE = "Grammaire progressive du Français"; // change here to update title

// ===== VERSION =====
const APP_VERSION = "1.0.007"; // <-- меняй здесь номер версии
// ====================

initI18n();
setupLangSelector();
applyStaticUiTranslations();

async function loadJSON(url) {
  // Kept for backward compatibility with existing code.
  // Fetch + caching now lives in DataService.
  return DataService.loadJSON(url);
}


function setupLangSelector() {
  const sel = document.getElementById("langSelector");
  if (!sel) return;

  // Set current language in the selector
  sel.value = getLang();

  sel.addEventListener("change", () => {
    const next = sel.value;
    setLang(next);
    // Simplest & safest: reload so all UI strings re-render with the new language.
    window.location.reload();
  });
}

function applyStaticUiTranslations() {
  // Header subtitle
  const subtitle = document.getElementById("subtitleText");
  if (subtitle) subtitle.textContent = t("Subtitle");

  // Language selector label (visually hidden) + aria-label
  const langLabel = document.getElementById("langLabel");
  if (langLabel) langLabel.textContent = t("Language");
  const langSel = document.getElementById("langSelector");
  if (langSel) langSel.setAttribute("aria-label", t("Language"));

  // Section selector label + placeholder option
  const sectionLabel = document.getElementById("sectionLabel");
  if (sectionLabel) sectionLabel.textContent = t("SelectSection");
  const placeholder = document.getElementById("sectionPlaceholder");
  if (placeholder) placeholder.textContent = t("SelectSectionPlaceholder");

  // Footer brand
  const footer = document.getElementById("footerBrand");
  if (footer) footer.textContent = t("FooterBrand");

  // Main buttons
  const checkAllBtn = document.getElementById("checkBtn");
  if (checkAllBtn) checkAllBtn.textContent = t("CheckAll");
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) resetBtn.textContent = t("Reset");
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.textContent = t("BackToSections");
}


function setCourseTitle(title) {
  const el = document.getElementById("courseTitle");
  if (el) el.textContent = title || COURSE_TITLE;
}

function renderSectionCard(s) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-4";
  const card = document.createElement("div");
  card.className = "card section-card";
  card.tabIndex = 0;
  card.role = "button";
  card.innerHTML = `
    <div class="card-body">
      <h5 class="card-title">${s.title}</h5>
      <p class="card-text">${t("OpenSectionDesc")}</p>
      <button class="btn btn-sm btn-outline-primary select-btn" data-file="${s.file}" data-id="${s.id}">${t("Open")}</button>
    </div>
  `;
  col.appendChild(card);
  return col;
}

/**
 * Создает DOM-элемент для одного вопроса
 * @param {Object} q - Объект вопроса { id, text, hint, answer, answer_b64 }
 * @returns {HTMLElement} - Секция с вопросом и элементами управления
 */
function createQuestionElement(q) {
  // Создаем основную секцию для вопроса
  const section = document.createElement("section");
  section.className = "mb-4 position-relative";
  section.setAttribute("data-id", q.id);

  // === ШАПКА ВОПРОСА ===
  // Создаем header с номером вопроса и кнопкой подсказки
  const header = document.createElement("div");
  header.className = "d-flex justify-content-between align-items-center";

  // Заголовок с номером вопроса
  const h2 = document.createElement("h2");
  h2.textContent = t("QuestionTitle", { id: q.id });

  // Кнопка для показа подсказки
  const hintBtn = document.createElement("button");
  hintBtn.className = "btn btn-sm btn-outline-info";
  hintBtn.type = "button";
  hintBtn.innerHTML = `<i class="bi bi-info-circle"></i> ${t("Hint")}`;

  // Добавляем элементы в шапку
  header.append(h2, hintBtn);

  // === ТЕКСТ ВОПРОСА === //
  const label = document.createElement("label");
  label.htmlFor = `q_${q.id}`;
  label.className = "form-label mt-2";
  label.textContent = q.text;

  // === ПОЛЕ ВВОДА С БЕЙДЖЕМ ===
  // Wrapper для позиционирования бейджа относительно input
  const inputWrapper = document.createElement("div");
  inputWrapper.className = "position-relative d-flex align-items-center";
  inputWrapper.style.maxWidth = "400px"; // Increased width

  // Поле ввода ответа
  const input = document.createElement("input");
  input.type = "text";
  input.id = `q_${q.id}`;
  input.className = "form-control";
  input.style.paddingRight = "60px"; // More padding for longer badges
  input.style.width = "100%";

  // Бейдж для отображения результата (галочка/крестик)
  const badge = document.createElement("span");
  badge.id = `badge_${q.id}`;
  badge.className = "badge position-absolute answer-badge";
  badge.style.fontSize = "1rem";
  badge.style.display = "none"; // Скрыт по умолчанию
  badge.style.right = "10px"; // Explicit positioning
  badge.style.whiteSpace = "nowrap"; // Prevent badge text wrapping

  // Добавляем input и badge в wrapper
  inputWrapper.appendChild(input);

  // === БЛОК ПОДСКАЗКИ ===
  const hintBox = document.createElement("div");
  hintBox.className = "alert alert-info mt-2";
  hintBox.style.display = "none"; // Скрыт по умолчанию
  hintBox.textContent = q.hint;

  // === КНОПКА ПРОВЕРКИ ===
  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.className = "btn btn-sm btn-primary mt-2";
  checkBtn.textContent = t("Check");

  inputWrapper.appendChild(checkBtn);
  inputWrapper.appendChild(badge);

  // === ТЕКСТ РЕЗУЛЬТАТА ===
  // Элемент для отображения "Правильно!" или "Неправильно!"
  const resultText = document.createElement("p");
  resultText.className = "result-text mt-2";
  resultText.role = "status";
  resultText.setAttribute("aria-live", "polite"); // Для screen readers
  resultText.style.fontWeight = "bold";

  inputWrapper.appendChild(resultText);

  hintBtn.addEventListener("click", () => {
    hintBox.style.display = hintBox.style.display === "none" ? "block" : "none";
  });

  // === ОБРАБОТЧИК: Проверка ответа ===
  checkBtn.addEventListener("click", () => {
    const userInput = input.value;
    // Получаем правильный ответ (либо из answer, либо декодируем из answer_b64)
    const expected = q.answer || decodeBase64(q.answer_b64 || "");
    // Проверяем ответ с нормализацией
    const result = checkAnswer(expected, userInput);

    if (result) {
      // === ПРАВИЛЬНЫЙ ОТВЕТ ===
      // Добавляем зеленую обводку к input
      input.classList.add("is-valid");
      input.classList.remove("is-invalid");
    } else {
      // === НЕПРАВИЛЬНЫЙ ОТВЕТ ===
      // Добавляем красную обводку к input
      input.classList.add("is-invalid");
      input.classList.remove("is-valid");
    }

    updateProgress();
    updateCorrectCountFromInputs();
  });

  // Собираем все элементы в секцию
  section.append(header, label, inputWrapper, hintBox);
  return section;
}

function decodeBase64(s) {
  try {
    return atob(s);
  } catch {
    return "";
  }
}

function showQuiz(data, opts = {}) {
  const onBack = opts && typeof opts.onBack === "function" ? opts.onBack : null;
  document.getElementById("landing").classList.add("hidden");
  document.getElementById("quizArea").classList.remove("hidden");
  document.getElementById("sectionTitle").textContent = data.title || "";
  const container = document.getElementById("questionsContainer");
  container.innerHTML = "";
  data.questions.forEach((q) =>
    container.appendChild(createQuestionElement(q))
  );
  updateProgress();
  updateCorrectCount(0, data.questions.length);

  document.getElementById("checkBtn").textContent = t("Check");
  document.getElementById("checkBtn").onclick = () => {
    const r = checkAnswers(data);
    displayResult(r);
    updateCorrectCount(r.correct, r.total);
  };
  document.getElementById("backBtn").textContent = t("Back");

  document.getElementById("resetBtn").onclick = () => {
    document.querySelectorAll("#questionsContainer input").forEach((i) => {
      i.value = "";
      i.classList.remove("is-valid", "is-invalid");
    });
    document.getElementById("result").innerHTML = "";
    updateProgress();
    updateCorrectCount(0, data.questions.length);
  };
  document.getElementById("backBtn").onclick = () => {
    if (onBack) {
      onBack();
      return;
    }
    document.getElementById("quizArea").classList.add("hidden");
    document.getElementById("landing").classList.remove("hidden");
    document.getElementById("result").innerHTML = "";
  };
}

function checkAnswers(data) {
  let correct = 0;
  const feedback = [];

  data.questions.forEach((q) => {
    const input = document.getElementById(`q_${q.id}`);
    const badge = document.getElementById(`badge_${q.id}`);
    const user = (input?.value || "").trim();
    const expected = q.answer || decodeBase64(q.answer_b64 || "");
    const ok = user === expected;

    console.log(ok);

    if (ok) {
      input.classList.add("is-valid");
      input.classList.remove("is-invalid");

      badge.textContent = "✔";
      badge.className = "badge bg-success position-absolute answer-badge";
      badge.style.display = "inline-block";
    } else {
      input.classList.add("is-invalid");
      input.classList.remove("is-valid");

      badge.textContent = "✘";
      badge.className = "badge bg-danger position-absolute answer-badge";
      badge.style.display = "inline-block";
    }

    feedback.push({ id: q.id, ok, user, expected });
    if (ok) correct++;
  });

  return { correct, total: data.questions.length, feedback };
}

// показываем результат
function displayResult({ correct, total, feedback }) {
  const result = document.getElementById("result");
  result.innerHTML = `<p>${t("Correct")}: ${correct} / ${total}</p>`;

  const list = document.createElement("ul");
  list.className = "list-group";

  feedback.forEach((f) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    const status = f.ok ? `✓ ${t("Correct")}` : `✗ ${t("Wrong")}`;
    li.textContent = `#${f.id}: ${status} ("${f.user}", ${t("Expected")}: "${f.expected}")`;
    list.append(li);
  });

  result.append(list);
}

// обновление прогресса заполненности
function updateProgress() {
  const inputs = Array.from(
    document.querySelectorAll("#questionsContainer input")
  );
  const filled = inputs.filter((i) => i.value.trim() !== "").length;
  const total = inputs.length;
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);

  const progressText = document.getElementById("progressText");
  if (progressText) progressText.textContent = t("ProgressDoneOfTotal", { filled, total });

  const bar = document.getElementById("progressBar");
  if (bar) {
    bar.style.width = pct + "%";
    bar.textContent = pct + "%";
    bar.setAttribute("aria-valuenow", String(pct));
  }
}

function updateCorrectCountFromInputs() {
  const inputs = Array.from(
    document.querySelectorAll("#questionsContainer input")
  );
  const correctCount = inputs.filter((i) =>
    i.classList.contains("is-valid")
  ).length;
  const total = inputs.length;

  updateCorrectCount(correctCount, total);
}

// новый счётчик правильных ответов (визуальный)
function updateCorrectCount(correct, total) {
  const el = document.getElementById("correctAnswersInfo");
  if (el) {
    el.textContent = t("CorrectOfTotal", { correct, total });
  }
}
/**
 * Проверка ответа (строгое сравнение).
 * @param {string} expected
 * @param {string} actual
 * @param {Object} [options]
 * @param {boolean} [options.allowNormalization=false]
 * @returns {boolean}
 */
export function checkAnswer(
  expected,
  actual,
  options = { allowNormalization: true }
) {
  const removeDiacritics = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  if (options.allowNormalization) {
    const normalizedExpected = removeDiacritics(expected.trim().toLowerCase());
    const normalizedActual = removeDiacritics(actual.trim().toLowerCase());
    return normalizedExpected === normalizedActual;
  }

  return expected === actual;
}

// INIT
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const sectionsData = await DataService.getSectionsList();
    setCourseTitle(sectionsData.courseTitle || COURSE_TITLE);
    const sel = document.getElementById("sectionSelector");
    const grid = document.getElementById("sectionsGrid");

    const sectionsById = new Map(
      (sectionsData.sections || []).map((s) => [s.id, s])
    );

    sectionsData.sections.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.title;
      sel.appendChild(opt);
      grid.appendChild(renderSectionCard(s));
    });

    const renderLanding = () => {
      document.getElementById("quizArea").classList.add("hidden");
      document.getElementById("landing").classList.remove("hidden");
      document.getElementById("result").innerHTML = "";
      // keep selector in sync with the current route
      if (sel) sel.value = "";
    };

    const renderSection = async (sectionId) => {
      const s = sectionsById.get(sectionId);
      if (!s) {
        router.replace("/");
        return;
      }
      if (sel) sel.value = s.id;
      const data = await DataService.getSectionFile(s.file);
      showQuiz(data, { onBack: () => router.navigate("/") });
    };

    const router = new Router({
      defaultPath: "/",
      routes: [
        { pattern: /^\/$/, handler: renderLanding },
        { pattern: /^\/section\/([^\/]+)$/, handler: renderSection },
      ],
    });
    router.start();

    sel.addEventListener("change", (e) => {
      const id = e.target.value;
      if (!id) router.navigate("/");
      else router.navigate(`/section/${id}`);
    });

    // delegate open buttons in section cards
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".select-btn");
      if (btn) {
        const id = btn.getAttribute("data-id");
        if (id) router.navigate(`/section/${id}`);
      }
    });

// ===== VERSION IN FOOTER =====
    document.getElementById("appVersion").textContent = "v" + APP_VERSION;
    // =============================
  } catch (err) {
    console.error(err);
    alert(t("LoadSectionsError", { message: err.message }));
  }
});