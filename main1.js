// --- 1. ДОМ ЭЛЕМЕНТЫ ---
const modalNotStarted = document.getElementById('not-started-js')
const btnRestart = document.getElementById("restart-js");
const btnLabel = document.getElementById("toolbar__btn-text");
const textField = document.getElementById("words-wrapper");
const inputField = document.getElementById("hidden-input");
const timerDisplay = document.getElementById("start-timer-js");
const modalResalt = document.getElementById("results-js");
const modalAccuracyEl = document.getElementById("accuracy-js");
const recordDisplay = document.getElementById("record-js");
const finalWpm = document.getElementById("final-wpm");
const finalCorrect = document.getElementById("correctChars-js");
const finalError = document.getElementById("errorChars-js");
const modalArray = document.querySelectorAll(".modal__header");
const confettiImg = document.querySelector(".modal__confetti");
const blockStats = document.getElementById("stats-js");
const test = document.getElementById("test-js");

// Статистика в верхнем баре (WPM и Accuracy)
const statsValues = document.querySelectorAll(".stats-bar__value");
const wpmUI = statsValues[0];
const accuracyUI = statsValues[1];

// --- 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ (STATE) ---
let currentWpm = 0;
let correctChars = 0;
let errorCount = 0;
let globalAccuracy = 100;
let timeLeft = 60;
let seconds = 0;
let timerId = null;
let timerStarted = false;
let stopwatch = false; // true для режима Passage
let currentDifficulty = "easy";
let currentMode = "timed";
let currentText = "";
const fragment = document.createDocumentFragment();

function startTest() {
  // 1. Скрываем стартовую модалку
  modalNotStarted.style.display = "none";
    document.querySelector('.test__display').classList.add('test__display--active');
  // 2. Показываем тулбар с кнопкой рестарт
  const toolbar = document.querySelector('.toolbar');
  if (toolbar) {
    toolbar.classList.add('toolbar--visible');
  }
  
  // 3. Убираем блюр у текста (если используешь этот метод)
  const display = document.querySelector('.test__display');
  display.classList.remove('test__display--blurred');
  
  // 4. Фокусируемся на вводе
  inputField.focus();
}


// Слушаем клик по кнопке в модалке
modalNotStarted.querySelector('.modal-not-started__btn').addEventListener('click', startTest);

// Слушаем клик по тексту в модалке (согласно твоему HTML)
modalNotStarted.querySelector('.modal-not-started__text').addEventListener('click', startTest);


// --- 3. УНИВЕРСАЛЬНЫЙ ИНТЕРФЕЙС (Синхронизация) ---

function updateInterface(setting, value) {
  const elements = document.querySelectorAll(`[data-setting="${setting}"]`);
  elements.forEach((el) => {
    // Кнопки десктопа
    if (el.tagName === "BUTTON") {
      el.classList.toggle(
        "controls-bar__btn--active",
        el.dataset.value === value,
      );
    }
    // Лейблы мобилки
    if (el.tagName === "LABEL") {
      const input = el.querySelector("input");
      const isSelected = el.dataset.value === value;
      if (input) input.checked = isSelected;
      if (isSelected) {
        const statusSpan = el
          .closest(".controls__details")
          ?.querySelector(".controls__select-text");
        if (statusSpan) statusSpan.textContent = el.textContent.trim();
      }
    }
  });
}

// --- 4. ЛОГИКА ТАЙМЕРА ---

function updateTimerUI(time) {
  const mins = Math.floor(time / 60);
  const secs = time % 60;
  timerDisplay.textContent = `${mins}:${String(secs).padStart(2, "0")}`;
}

function startTimer() {
  if (timerId) return;
  timerId = setInterval(() => {
    if (stopwatch) {
      seconds++;
      updateTimerUI(seconds);
    } else {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerUI(timeLeft);
      }
      if (timeLeft <= 0) {
        finishTest();
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
  timerStarted = false;
}

// --- 5. ЛОГИКА ТЕКСТА И ПРОВЕРКИ ---

async function loadNewPassage(difficulty = "easy") {
  try {
    const response = await fetch("./data.json");
    const data = await response.json();
    const passages = data[difficulty];
    currentText = passages[Math.floor(Math.random() * passages.length)].text;
  } catch (e) {
    currentText = "The sun rose over the quiet town.";
  } finally {
    resetTest();
    renderText(currentText);
  }
}

function renderText(text) {
  textField.innerHTML = "";
  const localFragment = document.createDocumentFragment();
  text.split("").forEach((char, i) => {
    const span = document.createElement("span");
    span.className = "char";
    if (i === 0) span.classList.add("char--current");
    span.textContent = char;
    localFragment.appendChild(span);
  });
  textField.appendChild(localFragment);
}

function refreshVisuals(userChars) {
  const spans = textField.querySelectorAll(".char");
  spans.forEach((span, i) => {
    const uChar = userChars[i];
    span.classList.remove("char--correct", "char--error", "char--current");

    if (uChar == null) {
      if (i === userChars.length) span.classList.add("char--current");
    } else if (uChar === span.textContent) {
      span.classList.add("char--correct");
    } else {
      span.classList.add("char--error");
      if (!span.dataset.wasWrong) {
        span.dataset.wasWrong = "true";
        errorCount++;
      }
    }
  });
  correctChars = textField.querySelectorAll(".char--correct").length;
}

// --- 6. СТАТИСТИКА И ФИНИШ ---

function calculateStats(inputLength) {
  if (inputLength > 0) {
    const score = Math.round(((inputLength - errorCount) / inputLength) * 100);
    globalAccuracy = Math.max(0, score);
  } else {
    globalAccuracy = 100;
  }

  const timePassed = stopwatch ? seconds : 60 - timeLeft;
  if (timePassed > 1) {
    currentWpm = Math.round(correctChars / 5 / (timePassed / 60));
  }
}

function updateStatsUI() {
  wpmUI.textContent = currentWpm;
  accuracyUI.textContent = `${globalAccuracy}%`;
}

function finishTest() {
  stopTimer();
   document.querySelector('.test__display').classList.remove('test__display--active');
  handleResults();
}


//модалки 
// Вспомогательная функция для переключения экранов
function toggleGameScreens(showResults) {
  
  if (showResults) {
    // Прячем игровое поле
    blockStats.style.display = "none";
    test.style.display = "none";
  } else {
    
    blockStats.style.display = "grid"; 
    test.style.display = "block";
  }
}




function handleResults() {
    toggleGameScreens(true);
  const savedRecord = localStorage.getItem("bestSpeed") || 0;
  const isFirstTime = !localStorage.getItem("bestSpeed");

  const isNewRecord = currentWpm > parseInt(savedRecord);
  confettiImg.classList.add("modal__confetti--hidden");

  // Показываем нужную модалку
  if (isFirstTime) {
    openModal(document.getElementById("baseline-js"));
    setButtonState("baseline");
  } else if (isNewRecord) {
    openModal(document.getElementById("new-result-js"));
    setButtonState("complete");
    confettiImg.classList.remove("modal__confetti--hidden");
  } else {
    openModal(document.getElementById("completed-js"));
    setButtonState("complete");
  }

  // Сохраняем рекорд, если он побит
  if (isNewRecord) {
    localStorage.setItem("bestSpeed", currentWpm);
  }

  // Обновляем число рекорда в UI
  recordDisplay.textContent = `${localStorage.getItem("bestSpeed") || currentWpm} wpm`;
}

function openModal(modalContent) {
  modalResalt.style.display = "block";
  modalArray.forEach((el) => (el.style.display = "none"));
  modalContent.style.display = "flex";

  modalAccuracyEl.textContent = `${globalAccuracy}%`;
  finalWpm.textContent = currentWpm;
  finalCorrect.textContent = correctChars;
  finalError.textContent = errorCount;
}

// --- 7. СБРОС И СОСТОЯНИЕ КНОПКИ ---

function resetTest() {
  inputField.value = "";
  timeLeft = 60;
  seconds = 0;
  errorCount = 0;
  currentWpm = 0;
  globalAccuracy = 100;
  stopTimer();
  updateStatsUI();
  updateTimerUI(stopwatch ? 0 : 60);
}

function setButtonState(state) {
  btnRestart.dataset.state = state;
   const isDesktop = window.innerWidth >= 768; 
    const attrName = "text" + state.charAt(0).toUpperCase() + state.slice(1);
   const desktopAttrName = attrName + "Desktop";
 
    const newText = (isDesktop && btnRestart.dataset[desktopAttrName]) 
                  ? btnRestart.dataset[desktopAttrName] 
                  : btnRestart.dataset[attrName];

  if (newText) btnLabel.textContent = newText;
}

// --- 8. ОБРАБОТЧИКИ СОБЫТИЙ ---

// Клик по настройкам (делегирование)
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-setting]");
  if (!target) return;

  const { setting, value } = target.dataset;
  updateInterface(setting, value);

  if (setting === "difficulty") {
    currentDifficulty = value;
    loadNewPassage(value);
  }
  if (setting === "mode") {
    stopwatch = value === "passage";
    resetTest();
  }

  target.closest("details")?.removeAttribute("open");
});

// Ввод текста
inputField.addEventListener("input", () => {
  if (!timerStarted && inputField.value.length > 0) {
    timerStarted = true;
    startTimer();
  }

  const userChars = inputField.value.split("");
  refreshVisuals(userChars);
  calculateStats(inputField.value.length);
  updateStatsUI();

  if (userChars.length === currentText.length) {
    finishTest();
  }
});

// Кнопка рестарт
btnRestart.addEventListener("click", () => {
   toggleGameScreens(false);
  modalResalt.style.display = "none";
  setButtonState("test");
  updateInterface("difficulty", "easy");
  updateInterface("mode", "timed");
  currentDifficulty = "easy";
  stopwatch = false;
  loadNewPassage("easy");
  inputField.focus();
});

textField.addEventListener("click", () => inputField.focus());

// Инициализация рекорда при загрузке
recordDisplay.textContent = `${localStorage.getItem("bestSpeed") || 0} wpm`;
loadNewPassage(currentDifficulty);
