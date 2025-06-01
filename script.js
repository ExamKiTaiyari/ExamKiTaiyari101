let timer;
let focusMinutes = 25;
let seconds = 0;
let isRunning = false;
let pomodoroCount = 0;
let totalStudySeconds = 0;

const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const focusOverlay = document.getElementById("focusOverlay");
const customBreakOverlay = document.getElementById("customBreakOverlay");

const focusTimeButtons = document.querySelectorAll('[data-time]');
const breakTimeButtons = document.querySelectorAll('#customBreakOverlay [data-time]');

const customFocusBtn = document.getElementById("customFocusBtn");
const customBreakBtn = document.getElementById("customBreakBtn");

const customFocusSlider = document.getElementById("customFocusSlider");
const customBreakSlider = document.getElementById("customBreakSlider");

const focusTimeSlider = document.getElementById("focusTimeSlider");
const breakTimeSlider = document.getElementById("breakTimeSlider");

const focusSliderValue = document.getElementById("focusSliderValue");
const breakSliderValue = document.getElementById("breakSliderValue");

const pomodoroCounter = document.getElementById("pomodoroCount");
const studyHoursCounter = document.getElementById("studyHours");
const startBreakBtn = document.getElementById("startBreakBtn");

const modeIndicator = document.getElementById("modeIndicator");

// Load saved data
window.addEventListener("load", () => {
  const savedPomodoros = localStorage.getItem("pomodoroCount");
  const savedTotalTime = localStorage.getItem("totalStudySeconds");

  if (savedPomodoros !== null) pomodoroCount = parseInt(savedPomodoros);
  if (savedTotalTime !== null) totalStudySeconds = parseInt(savedTotalTime);

  pomodoroCounter.textContent = pomodoroCount;
  studyHoursCounter.textContent = (totalStudySeconds / 3600).toFixed(1);
  updateDisplay();
});

function updateDisplay() {
  const min = String(focusMinutes).padStart(2, '0');
  const sec = String(seconds).padStart(2, '0');
  timerDisplay.innerText = `${min}:${sec}`;
}

function playSound(type = 'end') {
  const sounds = {
    start: 'assets/start-sound.mp3',
    end: 'assets/end-sound.mp3',
    'break-start': 'assets/break-start.mp3',
    'break-end': 'assets/break-end.mp3'
  };
  const audio = new Audio(sounds[type]);
  audio.play().catch(() => console.log(`Sound blocked: ${type}`));
}

function applyFocus() {
  const selected = document.querySelector('.time-btn.selected');
  let time = parseInt(focusTimeSlider.value);

  if (!selected && customFocusSlider.style.display !== 'none') {
    time = parseInt(focusTimeSlider.value);
  } else if (selected) {
    time = parseInt(selected.dataset.time);
  }

  if (!isNaN(time) && time > 0) {
    focusMinutes = time;
    seconds = 0;
    updateDisplay();
    focusOverlay.style.display = "none";
    playSound('start');
    startTimer();
    setMode('focus');
  }
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;

  timer = setInterval(() => {
    if (seconds === 0) {
      if (focusMinutes === 0) {
        clearInterval(timer);
        isRunning = false;
        playSound('end');

        // Update stats
        pomodoroCount++;
        totalStudySeconds += parseInt(focusTimeSlider.value) * 60;
        pomodoroCounter.textContent = pomodoroCount;
        studyHoursCounter.textContent = (totalStudySeconds / 3600).toFixed(1);

        // Trigger animation
        pomodoroCounter.classList.add('coin-pop');
        studyHoursCounter.classList.add('coin-pop');
        setTimeout(() => {
          pomodoroCounter.classList.remove('coin-pop');
          studyHoursCounter.classList.remove('coin-pop');
        }, 300);

        // Show break overlay
        customBreakOverlay.style.display = "flex";
        drawProgressRing(0);
        setMode('break');
        return;
      }
      focusMinutes--;
      seconds = 59;
    } else {
      seconds--;
    }
    updateDisplay();
  }, 1000);
}

function startBreakTimer() {
  const selected = document.querySelector('#customBreakOverlay .time-btn.selected');
  let time = parseInt(breakTimeSlider.value);

  if (!selected && customBreakSlider.style.display !== 'none') {
    time = parseInt(breakTimeSlider.value);
  } else if (selected) {
    time = parseInt(selected.dataset.time);
  }

  if (!isNaN(time) && time > 0) {
    focusMinutes = time;
    seconds = 0;
    updateDisplay();
    customBreakOverlay.style.display = "none";
    playSound('break-start');

    isRunning = true;
    timer = setInterval(() => {
      if (seconds === 0) {
        if (focusMinutes === 0) {
          clearInterval(timer);
          isRunning = false;
          playSound('break-end');
          focusOverlay.style.display = "flex";
          setMode('focus');
          return;
        }
        focusMinutes--;
        seconds = 59;
      } else {
        seconds--;
      }
      updateDisplay();
    }, 1000);
  }
}

function setMode(mode) {
  if (mode === 'focus') {
    modeIndicator.className = 'mode-indicator focus-mode';
    modeIndicator.textContent = 'Focus Mode';
    timerDisplay.classList.remove('break-timer');
    timerDisplay.classList.add('focus-timer');
  } else if (mode === 'break') {
    modeIndicator.className = 'mode-indicator break-mode';
    modeIndicator.textContent = 'Break Mode';
    timerDisplay.classList.remove('focus-timer');
    timerDisplay.classList.add('break-timer');
  }
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
}

function resetTimer() {
  pauseTimer();
  focusMinutes = 25;
  seconds = 0;
  pomodoroCount = 0;
  totalStudySeconds = 0;
  pomodoroCounter.textContent = pomodoroCount;
  studyHoursCounter.textContent = "0";
  localStorage.removeItem("pomodoroCount");
  localStorage.removeItem("totalStudySeconds");
  updateDisplay();
  focusOverlay.style.display = "flex";
  setMode('focus');
}

// Event Listeners
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
startBreakBtn.addEventListener("click", () => {
  playSound('break-start');
  startBreakTimer();
});

// Slider Updates
focusTimeSlider.addEventListener("input", () => {
  focusSliderValue.textContent = `${focusTimeSlider.value} min`;
});

breakTimeSlider.addEventListener("input", () => {
  breakSliderValue.textContent = `${breakTimeSlider.value} min`;
});

// Preset Buttons
focusTimeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    focusTimeButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    focusTimeSlider.value = btn.dataset.time;
    focusSliderValue.textContent = `${btn.dataset.time} min`;
    customFocusSlider.style.display = "none";
  });
});

customFocusBtn.addEventListener("click", () => {
  focusTimeButtons.forEach(b => b.classList.remove("selected"));
  customFocusSlider.style.display = "block";
});

breakTimeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    breakTimeButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    breakTimeSlider.value = btn.dataset.time;
    breakSliderValue.textContent = `${btn.dataset.time} min`;
    customBreakSlider.style.display = "none";
  });
});

customBreakBtn.addEventListener("click", () => {
  breakTimeButtons.forEach(b => b.classList.remove("selected"));
  customBreakSlider.style.display = "block";
});