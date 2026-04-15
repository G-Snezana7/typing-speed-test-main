

const btnRestart = document.getElementById('restart-js');
const btnLabel = btnRestart.querySelector('span');
const textField = document.getElementById('words-wrapper');
const inputField = document.getElementById('hidden-input');
const timer = document.getElementById('start-timer-js');

const difficultyElements = document.querySelectorAll('[data-setting="difficulty"]');
const fragment = document.createDocumentFragment();
const modalAccuracyEl = document.getElementById('accuracy-js');
const modalResalt = document.getElementById('results-js');
const record = document.getElementById('record-js');
const modalBaseline = document.getElementById('baseline-js');
const modalNewBestResult = document.getElementById('new-result-js');
const modalCompeted = document.getElementById('completed-js');
const finalWpm = document.getElementById('final-wpm');
const finalCorrect = document.getElementById('correctChars-js');
const finalError = document.getElementById('errorChars-js');
const modalArray = document.querySelectorAll('.modal__header');


const wpmDisplay = document.querySelectorAll('.stats-bar__value')[0];
const accuracyDisplay = document.querySelectorAll('.stats-bar__value')[1];


let currentWpm = 0;
let correctChars = 0;
let personalBest;
let errorCount = 0;
let timeLeft = 60; // Время теста
let timerId = null;
let timerStarted = false;
let globalAccuracy = 100; 
let stopwatch = false;
let seconds = 0;

let currentDifficulty = 'easy'; // По умолчанию
let currentText = ""; 
let chars = currentText.split("");


// 1. Слушаем клики по всему документу (делегирование)
document.addEventListener('click', (event) => {
  // Ищем ближайший элемент с data-setting (будь то кнопка или инпут)
  const target = event.target.closest('[data-setting]');
  
  // Если кликнули мимо наших настроек — ничего не делаем
  if (!target) return;

  // Извлекаем данные из атрибутов
  const settingName = target.dataset.setting; // "difficulty" или "mode"
  const selectedValue = target.dataset.value; // "easy", "hard", "timed", "passage"
  const selectedText = target.textContent.trim();

  // 2. СИНХРОНИЗАЦИЯ: Находим ВСЕ элементы этой группы (и в мобилке, и в десктопе)
  const groupElements = document.querySelectorAll(`[data-setting="${settingName}"]`);

  groupElements.forEach(el => {
    // Для кнопок (десктоп): переключаем активный класс
    if (el.tagName === 'BUTTON') {
      el.classList.toggle('controls-bar__btn--active', el.dataset.value === selectedValue);
    }
    
    // Для радио-кнопок (мобилка): ставим галочку
    if (el.tagName === 'INPUT') {
      el.checked = (el.dataset.value === selectedValue);
    }
  });

  // 3. МОБИЛЬНОЕ МЕНЮ: Обновляем текст в summary и закрываем список
  const parentDetails = target.closest('.controls__details');
  if (parentDetails) {
    const statusSpan = parentDetails.querySelector('.controls__select-text');
    if (statusSpan) {
      statusSpan.textContent = selectedText;
    }
    parentDetails.removeAttribute('open'); // Закрываем выпадашку
  }

  // 4. ЛОГИКА ИГРЫ: Реагируем на изменения
  if (settingName === 'difficulty') {
    currentDifficulty = selectedValue;
    loadNewPassage(currentDifficulty); // Твоя функция загрузки текста
  } 
  
  if (settingName === 'mode') {
    currentMode = selectedValue;
  
    stopwatch = (selectedValue === 'passage');
  
  }
});


async function loadNewPassage(difficulty = 'easy') {
  try {
    const response = await fetch('./data.json');
    const data = await response.json();
    
    // Берем массив фраз нужной сложности
    const passages = data[difficulty]; 
    // Выбираем случайную
    const randomPassage = passages[Math.floor(Math.random() * passages.length)];
    
    currentText = randomPassage.text;
    
    // Сбрасываем состояние теста
    resetTest(); 
    
    // Рисуем буквы (используем твою функцию)
    creatSpanChar(currentText.split(""));
    textField.appendChild(fragment);
  } catch (error) {
    console.error("Ошибка загрузки:", error);
    // Запасной вариант, если файл не подгрузился
    currentText = "The sun rose over the quiet town.";
    creatSpanChar(currentText.split(""));
    textField.appendChild(fragment);
  }
}
 function updateInterface(setting, value) {
  // 1. Находим ВООБЩЕ ВСЕ элементы этой настройки (и кнопки, и лейблы)
  const elements = document.querySelectorAll(`[data-setting="${setting}"]`);

  elements.forEach(el => {
    // Если это кнопка (десктоп) — переключаем активный класс
    if (el.tagName === 'BUTTON') {
      el.classList.toggle('controls-bar__btn--active', el.dataset.value === value);
    }
    
    // Если это лейбл (мобилка) — управляем инпутом внутри него
    if (el.tagName === 'LABEL') {
      const input = el.querySelector('input');
      const isSelected = el.dataset.value === value;

      if (input) input.checked = isSelected;

      // Если этот лейбл выбран — обновляем текст в заголовке <summary>
      if (isSelected) {
        const details = el.closest('.controls__details');
        const statusSpan = details?.querySelector('.controls__select-text');
        if (statusSpan) {
          statusSpan.textContent = el.textContent.trim();
        }
      }
    }
  });
}

// Вспомогательная функция для сброса
function resetTest() {
  inputField.value = "";
  timeLeft = 60;
  timer.textContent = "0:00";
  errorCount = 0;
  correctChars = 0;
  timerStarted = false;
  stop(timerId);
  wpmDisplay.textContent = 0;
  accuracyDisplay.textContent = 0;
}
function  updateTimer(timeToggle){
    const minutes = Math.floor(timeToggle / 60);
    const seconds = timeToggle % 60;
    // Формат М:СС (1:00, 0:59, 0:58...)
    timer.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
  timerId = setInterval(() => {
    if (stopwatch) {
      seconds++;
      updateTimer(seconds);
    } else {
      // РЕЖИМ ТАЙМЕРА (обратный отсчет)
      if (timeLeft > 0) {
        timeLeft--;
        updateTimer(timeLeft);
      } 
      
      // ДОБАВЛЯЕМ ЗДЕСЬ: Проверка завершения времени
      if (timeLeft <= 0) {
        stop(); // Останавливаем интервал и сбрасываем флаги
        handleTestEnd(); // Показываем модалку с результатами
      }
    }
  }, 1000);
}


function stop() {
  clearInterval(timerId); // Останавливаем выполнение
  timerId = null; 
  seconds = 0;
 stopwatch = false;
 timerStarted = false;
}

function creatSpanChar(arr) {
   textField.innerHTML = ''; 
  arr.forEach((item, index) => {
    const char = document.createElement("span");
    char.classList.add('char');
    if (index === 0) char.classList.add('char--current');
    char.textContent = item;
    fragment.appendChild(char);
 

  });
}
function setButtonState(state) {
  // 1. Меняем состояние для CSS (красим кнопку/svg)
  btnRestart.dataset.state = state;

 
  // Если state = 'finished', мы ищем 'textFinished' в dataset
  const attrName = 'text' + state.charAt(0).toUpperCase() + state.slice(1);
  const newText = btnRestart.dataset[attrName];

  if (newText) {
    btnLabel.textContent = newText;
  }
}
function openModal(modal){
   const displayRecord = localStorage.getItem('bestSpeed') || currentWpm;
    record.textContent = `${displayRecord} wpm`; 

 modalResalt.style.display = 'block';
modalArray.forEach(el => {
  if( el.style.display === 'flex'){
     el.style.display = 'none';
  }
 
});
    modal.style.display = 'flex';
      modalAccuracyEl.textContent = `${globalAccuracy}%`; 
    finalWpm.textContent = currentWpm;
    finalCorrect.textContent = correctChars;
    finalError.textContent = errorCount;
    
    
}

function handleTestEnd() {
    // 1. Пробуем достать старый рекорд
    // localStorage.clear();
    const savedRecord = localStorage.getItem('bestSpeed');
    
    // Сначала записываем текущий результат в переменную рекорда
    personalBest = currentWpm; 

    if (!savedRecord) {
        openModal(modalBaseline);
        setButtonState("baseline");
        localStorage.setItem('bestSpeed', currentWpm);
        record.textContent = `${currentWpm} wpm`; // Теперь здесь точно будет число
    } 
    else if (parseFloat(currentWpm) > parseFloat(savedRecord)) {
      console.log(`"2:" ${currentWpm}`);
     openModal(modalNewBestResult)
        setButtonState("complete");
        localStorage.setItem('bestSpeed', currentWpm);
         record.textContent = `${currentWpm} wpm`;
        
    } 
    else {
           console.log(`"3:" ${currentWpm}`);
      openModal(modalCompeted)
         setButtonState("complete");
    }
}

btnRestart.addEventListener('click', function () {
  inputField.focus();
  modalResalt.style.display = 'none';
  resetTest();
  setButtonState("test");

  // 1. Сбрасываем сложность на Easy (обновит кнопки, инпуты и текст в мобилке)
  updateInterface('difficulty', 'easy');
  currentDifficulty = 'easy';

  // 2. Сбрасываем режим на Timed (60s)
  updateInterface('mode', 'timed');
  currentMode = 'timed';
  stopwatch = false; // Выключаем секундомер, так как выбрали таймер

  // 3. Загружаем текст для дефолтной сложности
  loadNewPassage(currentDifficulty);
});



   // 2. Чтобы при клике на текст фокус возвращался в поле ввода
textField.addEventListener('click', () => inputField.focus());
// 1. Слушаем ввод в скрытом поле
inputField.addEventListener('input', (event) => {
  if (!timerStarted) {
  timerStarted = true;
  startTimer();
}
  const userText = inputField.value; // Что ввёл пользователь
  const userChars = userText.split(""); // Разбиваем ввод на буквы
  
  // Получаем все наши span-буквы, которые мы создали раньше
  const spanChars = textField.querySelectorAll('.char');

  spanChars.forEach((charSpan, index) => {
    const userChar = userChars[index];

    // Сбрасываем классы перед проверкой
    charSpan.classList.remove('char--correct', 'char--error', 'char--current');

    if (userChar == null) {
      // Если пользователь еще не дошел до этой буквы
      if (index === userChars.length) charSpan.classList.add('char--current');
    } else if (userChar === charSpan.textContent) {
      // Буква совпала
      charSpan.classList.add('char--correct');
    } else if (userChar != null && userChar !== charSpan.textContent) {
    // 1. Красим в красный
    charSpan.classList.add('char--error');
    
    // 2. Проверяем, была ли уже здесь ошибка раньше
    if (!charSpan.dataset.wasWrong) {
        charSpan.dataset.wasWrong = 'true'; // Ставим метку
        errorCount++; // Увеличиваем общий счетчик
        
    }
}

  });


correctChars = textField.querySelectorAll('.char--correct').length;
const totalTyped = userText.length;

// 1. Считаем Accuracy (Точность)
if (totalTyped > 0) {
  // totalAttempted — это общее количество нажатий (длина ввода + все сделанные ошибки)
// Но проще считать так:
const currentAccuracyScore  = Math.round(((totalTyped - errorCount) / totalTyped) * 100);
// Если получилось меньше 0 (много ошибок на одну букву), лучше ограничить:
 globalAccuracy = Math.max(0, currentAccuracyScore); 
    
    // 2. Выводим на экран (здесь добавляем %)
    accuracyDisplay.textContent = `${globalAccuracy}%`;
}

// 2. Считаем WPM (Слова в минуту)
const timePassed = stopwatch ? seconds : (60 - timeLeft); 
if (timePassed > 5) { // Начинаем считать через 5 секунд, чтобы цифры не прыгали
    // Стандарт: 1 слово = 5 символов
    const wpm = Math.round((correctChars / 5) / (timePassed / 60));
    wpmDisplay.textContent = wpm;
    personalBest = wpm;
    currentWpm = wpm; 
}
 if(spanChars.length === userChars.length){
  clearInterval(timerId);
   handleTestEnd()
stop();
}
});

loadNewPassage(currentDifficulty);






