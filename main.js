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
let charSpans = [];
let globalAccuracy = 0;
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
  modalNotStarted.style.display = "none";
    document.querySelector('.test__display').classList.add('test__display--active');
  const toolbar = document.querySelector('.toolbar');
  if (toolbar) {
    toolbar.classList.add('toolbar--visible');
  }
  

  const display = document.querySelector('.test__display');
  display.classList.remove('test__display--blurred');
  inputField.disabled = false; 
  inputField.focus();
}

modalNotStarted.querySelector('.modal-not-started__btn').addEventListener('click', startTest);

modalNotStarted.addEventListener('click', startTest);

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
      
      if (timeLeft === 0) {
        stopTimer();
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
    inputField.disabled = false; 
    renderText(currentText);
  }
}

function renderText(text) {
    textField.innerHTML = "";
    charSpans = [];
    const localFragment = document.createDocumentFragment();
    text.split("").forEach((char, i) => {
        const span = document.createElement("span");
        span.className = "char";
        if (i === 0) span.classList.add("char--current");
        span.textContent = char;
        localFragment.appendChild(span);
        charSpans.push(span); 
    });
    textField.appendChild(localFragment);
}

function updateCharStatus(index, userChar, isBackspace) {
  const span = charSpans[index];
  if (!span) return;

  if (isBackspace) {
    if (span.classList.contains("char--correct")) {
      correctChars--;
    }
    span.classList.remove("char--correct", "char--error", "char--current");
    span.classList.add("char--current");
  } else {
    span.classList.remove("char--current");
    if (userChar === span.textContent) {
      span.classList.add("char--correct");
      correctChars++; 
    } else {
      span.classList.add("char--error");
      if (!span.dataset.wasWrong) {
        span.dataset.wasWrong = "true";
        errorCount++;
      }
    }
    if (charSpans[index + 1]) charSpans[index + 1].classList.add("char--current");
  }
}

function calculateStats(inputLength) {
    const timePassed = stopwatch ? seconds : 60 - timeLeft;

    if (inputLength > 0) {
        const score = Math.round(((inputLength - errorCount) / inputLength) * 100);
        globalAccuracy = Math.max(0, score);
    } else {
        globalAccuracy = 0;
    }

    if (timePassed > 0) {
        currentWpm = Math.round((correctChars / 5) / (timePassed / 60));
    } else {
        currentWpm = 0;
    }
}

function updateStatsUI() {
  wpmUI.textContent = currentWpm;
  accuracyUI.textContent = `${globalAccuracy}%`;
}



function finishTest() {
  stopTimer();

  const typedLength = inputField.value.trim().length;


  if (timeLeft === 0 && typedLength < 2) {
    modalResalt.style.display = "none";
    btnRestart.click();
    return;
  }

  document.querySelector('.test__display').classList.remove('test__display--active');
  handleResults();
}


function toggleGameScreens(showResults) {
  
  if (showResults) {
    blockStats.style.display = "none";
    test.style.display = "none";
  } else {
    
    blockStats.style.display = "grid"; 
    test.style.display = "block";
  }
}


function handleResults() {
    const savedRecord = parseInt(localStorage.getItem("bestSpeed") || 0);
    const isFirstTime = !localStorage.getItem("bestSpeed");
    const isNewRecord = currentWpm > savedRecord;

    toggleGameScreens(true);
    confettiImg.classList.add("modal__confetti--hidden");

    // Находим элемент с текстом сообщения
    const modalMessage = document.querySelector("#completed-js .modal__message");

    if (isFirstTime) {
        openModal(document.getElementById("baseline-js"));
        setButtonState("baseline");
    } else if (isNewRecord) {
        openModal(document.getElementById("new-result-js"));
        setButtonState("complete");
        confettiImg.classList.remove("modal__confetti--hidden");
    } else {
        // ОБЫЧНОЕ ЗАВЕРШЕНИЕ
        openModal(document.getElementById("completed-js"));
        setButtonState("complete");

        // ПРОВЕРКА НА НУЛЕВОЙ РЕЗУЛЬТАТ
        if (currentWpm === 0) {
            modalMessage.textContent = "It looks like you didn't get any correct characters. Check your keyboard layout and try again!";
        } else {
            // Возвращаем стандартную фразу из ТЗ, если результат есть
            modalMessage.textContent = "Solid run. Keep pushing to beat your high score.";
        }
    }

    // Сохранение рекорда (только если WPM > 0)
    if (currentWpm > 0 && currentWpm > savedRecord) {
        localStorage.setItem("bestSpeed", currentWpm);
        if (recordDisplay) {
            recordDisplay.textContent = `${currentWpm} wpm`;
        }
    }
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


function resetTest() {
    stopTimer(); 
    lastInputLength = 0;
    correctChars = 0;
    errorCount = 0;
    currentWpm = 0;
    globalAccuracy = 0;
    timerStarted = false;
    timeLeft = 60;
    seconds = 0;
    
        inputField.disabled = true; 
    inputField.value = "";
    
    updateTimerUI(stopwatch ? 0 : 60);
    updateStatsUI();
    
    charSpans.forEach(span => {
        delete span.dataset.wasWrong;
    });
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
    renderText(currentText)
      inputField.disabled = false; 
   
  }

  target.closest("details")?.removeAttribute("open");
});

inputField.addEventListener("input", () => {

  if (inputField.value === " ") {
    inputField.value = "";
    return;
  }
    if (!timerStarted && inputField.value.length > 0) {
        startTimer(); 
    }

    const currentValue = inputField.value;
    const currentLength = currentValue.length;

    if (!currentText) return;

    if (currentLength > lastInputLength) {
        const index = currentLength - 1;
        const char = currentValue[index];
        updateCharStatus(index, char, false);
    } else if (currentLength < lastInputLength) {
        const index = currentLength;
        updateCharStatus(index, null, true);
    }

    lastInputLength = currentLength;
    calculateStats(currentLength);
    updateStatsUI();

   
    if (currentLength === currentText.length && currentText.length > 0) {
        finishTest();
    }
});

btnRestart.addEventListener("click", async () => { 
    resetTest(); 
    toggleGameScreens(false);
    modalResalt.style.display = "none";
    setButtonState("test");

    currentDifficulty = "easy";
    stopwatch = false;
    updateInterface("difficulty", "easy");
    updateInterface("mode", "timed");
    await loadNewPassage(currentDifficulty); 
    inputField.focus(); 
});

textField.addEventListener("click", () => inputField.focus());

recordDisplay.textContent = `${localStorage.getItem("bestSpeed") || 0} wpm`;
loadNewPassage(currentDifficulty);
