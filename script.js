let timer;
let focusMinutes = 25;
let seconds = 0;
let isRunning = false;
let pomodoroCount = 0;
let totalStudySeconds = 0;

// Gamification variables
let currentStreak = 0;
let longestStreak = 0;
let userLevel = 1;
let experience = 0;
let dailyGoal = 4; // Default 4 pomodoros per day
let achievements = [];
let coins = 0;

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

// Navigation functions
function showHome() {
  document.getElementById('homeSection').style.display = 'block';
  document.getElementById('pomodoroSection').style.display = 'none';
  document.getElementById('gamesSection').style.display = 'none';

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelector('.nav-link[onclick="showHome()"]').classList.add('active');
}

function showPomodoro() {
  document.getElementById('homeSection').style.display = 'none';
  document.getElementById('pomodoroSection').style.display = 'flex';
  document.getElementById('gamesSection').style.display = 'none';

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelector('.nav-link[onclick="showPomodoro()"]').classList.add('active');

  // Initialize pomodoro if needed
  if (!pomodoroCounter) {
    initializePomodoro();
  }
}

function showGamesSection() {
  document.getElementById('homeSection').style.display = 'none';
  document.getElementById('pomodoroSection').style.display = 'none';
  document.getElementById('gamesSection').style.display = 'flex';

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelector('.nav-link[onclick="showGamesSection()"]').classList.add('active');
}

function initializePomodoro() {
  const savedPomodoros = localStorage.getItem("pomodoroCount");
  const savedTotalTime = localStorage.getItem("totalStudySeconds");

  if (savedPomodoros !== null) pomodoroCount = parseInt(savedPomodoros);
  if (savedTotalTime !== null) totalStudySeconds = parseInt(savedTotalTime);

  // Load gamification data
  loadGamificationData();

  if (pomodoroCounter) pomodoroCounter.textContent = pomodoroCount;
  if (studyHoursCounter) studyHoursCounter.textContent = (totalStudySeconds / 3600).toFixed(1);
  updateDisplay();
  updateGamificationDisplay();
  setMode('focus');

  // Hide overlays on load
  if (focusOverlay) focusOverlay.style.display = "none";
  if (customBreakOverlay) customBreakOverlay.style.display = "none";
}

// Load saved data
window.addEventListener("load", () => {
  // Show home page by default
  showHome();
});

let originalFocusTime = 25; // Track the original focus time

function updateDisplay() {
  const min = String(focusMinutes).padStart(2, '0');
  const sec = String(seconds).padStart(2, '0');
  timerDisplay.innerText = `${min}:${sec}`;
}

function getCompletedFocusTime() {
  return originalFocusTime;
}

const sounds = {
    start: 'assets/start-sound.MP3',
    end: 'assets/end-sound.MP3',
    'break-start': 'assets/break-start.MP3',
    'break-end': 'assets/break-end.MP3'
  };
function playSound(type = 'end') {

  const audio = new Audio(sounds[type]);
  audio.play().catch((error) => {
    console.log(`Sound playback failed for ${type}:`, error.message);
  });
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
    originalFocusTime = time; // Store the original focus time
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

        // Update stats - use the actual focus time that was completed
        const completedFocusTime = getCompletedFocusTime();
        pomodoroCount++;
        totalStudySeconds += completedFocusTime * 60;

        // Gamification rewards
        const rewards = calculateRewards(completedFocusTime);
        experience += rewards.exp;
        coins += rewards.coins;
        updateStreak();
        checkAchievements();
        checkLevelUp();

        // Save to localStorage
        localStorage.setItem("pomodoroCount", pomodoroCount);
        localStorage.setItem("totalStudySeconds", totalStudySeconds);
        saveGamificationData();

        pomodoroCounter.textContent = pomodoroCount;
        studyHoursCounter.textContent = (totalStudySeconds / 3600).toFixed(1);
        updateGamificationDisplay();

        // Show rewards popup
        showRewardsPopup(rewards);

        // Trigger animation
        pomodoroCounter.classList.add('coin-pop');
        studyHoursCounter.classList.add('coin-pop');
        setTimeout(() => {
          pomodoroCounter.classList.remove('coin-pop');
          studyHoursCounter.classList.remove('coin-pop');
        }, 300);

        // Add celebration confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Set mode to break - games option will be shown after rewards popup
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

          // Reset to default focus time for next session
          focusMinutes = 25;
          seconds = 0;
          updateDisplay();

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
  originalFocusTime = 25;
  seconds = 0;
  pomodoroCount = 0;
  totalStudySeconds = 0;
  pomodoroCounter.textContent = pomodoroCount;
  studyHoursCounter.textContent = "0.0";
  localStorage.removeItem("pomodoroCount");
  localStorage.removeItem("totalStudySeconds");
  updateDisplay();
  setMode('focus');
}

// Event Listeners
startBtn.addEventListener("click", () => {
  if (!isRunning) {
    focusOverlay.style.display = "flex";
  } else {
    startTimer();
  }
});
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

// Gamification Functions
function loadGamificationData() {
  currentStreak = parseInt(localStorage.getItem("currentStreak")) || 0;
  longestStreak = parseInt(localStorage.getItem("longestStreak")) || 0;
  userLevel = parseInt(localStorage.getItem("userLevel")) || 1;
  experience = parseInt(localStorage.getItem("experience")) || 0;
  coins = parseInt(localStorage.getItem("coins")) || 0;
  achievements = JSON.parse(localStorage.getItem("achievements")) || [];
  dailyGoal = parseInt(localStorage.getItem("dailyGoal")) || 4;
}

function saveGamificationData() {
  localStorage.setItem("currentStreak", currentStreak);
  localStorage.setItem("longestStreak", longestStreak);
  localStorage.setItem("userLevel", userLevel);
  localStorage.setItem("experience", experience);
  localStorage.setItem("coins", coins);
  localStorage.setItem("achievements", JSON.stringify(achievements));
  localStorage.setItem("dailyGoal", dailyGoal);
}

function calculateRewards(focusTime) {
  const baseExp = focusTime; // 1 XP per minute focused
  const baseCoins = Math.floor(focusTime / 5); // 1 coin per 5 minutes

  // Bonus for longer sessions
  let bonusMultiplier = 1;
  if (focusTime >= 50) bonusMultiplier = 2;
  else if (focusTime >= 30) bonusMultiplier = 1.5;

  return {
    exp: Math.floor(baseExp * bonusMultiplier),
    coins: Math.floor(baseCoins * bonusMultiplier)
  };
}

function updateStreak() {
  const today = new Date().toDateString();
  const lastStudyDate = localStorage.getItem("lastStudyDate");

  if (lastStudyDate === today) {
    // Already studied today, maintain streak
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastStudyDate === yesterday.toDateString()) {
    currentStreak++;
  } else if (lastStudyDate !== today) {
    currentStreak = 1; // Reset streak if gap > 1 day
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  localStorage.setItem("lastStudyDate", today);
}

function checkLevelUp() {
  const requiredExp = userLevel * 100; // 100 XP per level
  if (experience >= requiredExp) {
    userLevel++;
    experience -= requiredExp;
    showLevelUpAnimation();
  }
}

function checkAchievements() {
  const newAchievements = [];

  // First pomodoro
  if (pomodoroCount === 1 && !achievements.includes("first_pomodoro")) {
    newAchievements.push({
      id: "first_pomodoro",
      title: "Getting Started!",
      description: "Complete your first pomodoro session",
      icon: "🎯"
    });
  }

  // Streak achievements
  if (currentStreak === 3 && !achievements.includes("streak_3")) {
    newAchievements.push({
      id: "streak_3",
      title: "On Fire!",
      description: "Study for 3 days in a row",
      icon: "🔥"
    });
  }

  if (currentStreak === 7 && !achievements.includes("streak_7")) {
    newAchievements.push({
      id: "streak_7",
      title: "Week Warrior",
      description: "Study for 7 days in a row",
      icon: "⚡"
    });
  }

  // Study time achievements
  const hoursStudied = totalStudySeconds / 3600;
  if (hoursStudied >= 10 && !achievements.includes("hours_10")) {
    newAchievements.push({
      id: "hours_10",
      title: "Study Dedication",
      description: "Study for 10 total hours",
      icon: "📚"
    });
  }

  if (hoursStudied >= 50 && !achievements.includes("hours_50")) {
    newAchievements.push({
      id: "hours_50",
      title: "Study Master",
      description: "Study for 50 total hours",
      icon: "👑"
    });
  }

  // Level achievements
  if (userLevel === 5 && !achievements.includes("level_5")) {
    newAchievements.push({
      id: "level_5",
      title: "Rising Star",
      description: "Reach level 5",
      icon: "⭐"
    });
  }

  // Add new achievements
  newAchievements.forEach(achievement => {
    achievements.push(achievement.id);
    showAchievementPopup(achievement);
  });
}

function updateGamificationDisplay() {
  // Update level and XP
  const levelElement = document.getElementById("userLevel");
  const xpElement = document.getElementById("experience");
  const coinsElement = document.getElementById("coins");
  const streakElement = document.getElementById("currentStreak");

  if (levelElement) levelElement.textContent = userLevel;
  if (xpElement) {
    const requiredExp = userLevel * 100;
    xpElement.textContent = `${experience}/${requiredExp}`;

    // Update XP bar
    const xpBar = document.getElementById("xpBar");
    if (xpBar) {
      const percentage = (experience / requiredExp) * 100;
      xpBar.style.width = `${percentage}%`;
    }
  }
  if (coinsElement) coinsElement.textContent = coins;
  if (streakElement) streakElement.textContent = currentStreak;
}

function showRewardsPopup(rewards) {
  const popup = document.createElement('div');
  popup.className = 'rewards-popup';
  popup.innerHTML = `
    <div class="rewards-content">
      <h3>🎉 Session Complete!</h3>
      <div class="rewards-list">
        <div class="reward-item">
          <span class="reward-icon">⚡</span>
          <span>+${rewards.exp} XP</span>
        </div>
        <div class="reward-item">
          <span class="reward-icon">🪙</span>
          <span>+${rewards.coins} Coins</span>
        </div>
      </div>
      <button onclick="closeRewardsAndShowGames(this)" class="close-popup">Continue</button>
    </div>
  `;

  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add('show'), 100);
}

function closeRewardsAndShowGames(button) {
  button.parentElement.parentElement.remove();
  // Small delay to ensure rewards popup is removed before showing games
  setTimeout(() => {
    showGamesOption();
  }, 200);
}

function showAchievementPopup(achievement) {
  const popup = document.createElement('div');
  popup.className = 'rewards-popup show';
  popup.innerHTML = `
    <div class="rewards-content">
      <h3>${achievement.message}</h3>
      <div class="rewards-list">
        <span>+${achievement.coins} Coins</span>
      </div>
      <button onclick="closeRewardsAndShowGames(this)" class="close-popup">Continue</button>
    </div>
  `;
  
  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add('show'), 100);
}

function closeRewardsAndShowGames(button) {
  button.parentElement.parentElement.remove();
  // Small delay to ensure rewards popup is removed before showing games
  setTimeout(() => {
    showGamesOption();
  }, 200);
}

function showLevelUpAnimation() {
  const popup = document.createElement('div');
  popup.className = 'levelup-popup';
  popup.innerHTML = `
    <div class="levelup-content">
      <div class="levelup-icon">🆙</div>
      <h3>Level Up!</h3>
      <h4>Level ${userLevel}</h4>
      <p>You're getting stronger!</p>
      <button onclick="this.parentElement.parentElement.remove()" class="close-popup">Continue</button>
    </div>
  `;

  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add('show'), 100);

  // Special level up confetti
  confetti({
    particleCount: 200,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FFA500', '#FF6347']
  });
}

// Games functionality
function showGamesOption() {
  const popup = document.createElement('div');
  popup.className = 'games-option-popup';
  popup.innerHTML = `
    <div class="games-option-content">
      <h3>🎉 Focus Session Complete!</h3>
      <p>Great job! How long would you like your break to be?</p>
      
      <div class="break-time-selector">
        <div class="time-options">
          <button class="time-btn" data-break-time="5" onclick="selectBreakTime(5, this)">5 min</button>
          <button class="time-btn" data-break-time="10" onclick="selectBreakTime(10, this)">10 min</button>
          <button class="time-btn" data-break-time="15" onclick="selectBreakTime(15, this)">15 min</button>
          <button class="time-btn" data-break-time="20" onclick="selectBreakTime(20, this)">20 min</button>
        </div>
      </div>
      
      <div class="option-buttons" style="margin-top: 1.5rem;">
        <button onclick="startSelectedBreak('regular'); this.parentElement.parentElement.parentElement.remove()" class="option-btn break-btn" id="regularBreakBtn" disabled>
          <span class="option-icon">☕</span>
          Regular Break
        </button>
        <button onclick="startSelectedBreak('games'); this.parentElement.parentElement.parentElement.remove()" class="option-btn games-btn" id="gamesBreakBtn" disabled>
          <span class="option-icon">🎮</span>
          Break with Games
        </button>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="skip-btn">Skip Break</button>
    </div>
  `;

  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add('show'), 100);
}

let selectedBreakTime = 0;

function selectBreakTime(minutes, element) {
  selectedBreakTime = minutes;
  
  // Remove selected class from all buttons
  document.querySelectorAll('.games-option-popup .time-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Add selected class to clicked button
  element.classList.add('selected');
  
  // Enable the break option buttons
  document.getElementById('regularBreakBtn').disabled = false;
  document.getElementById('gamesBreakBtn').disabled = false;
}

function startSelectedBreak(type) {
  if (selectedBreakTime === 0) return;
  
  focusMinutes = selectedBreakTime;
  seconds = 0;
  updateDisplay();
  setMode('break');
  
  if (type === 'games') {
    // Show games during break
    showGamesForBreak();
  } else {
    // Regular break - just start timer
    playSound('break-start');
    startBreakCountdown();
  }
}

function showGamesForBreak() {
  // Show games popup for break period
  const gamesPopup = document.createElement('div');
  gamesPopup.className = 'games-popup show';
  gamesPopup.innerHTML = `
    <div class="games-content">
      <h3>🎮 Break Time Games</h3>
      <p>Your ${selectedBreakTime} minute break is starting. Choose a game to play!</p>
      <div class="break-timer-display">
        <span id="breakTimerDisplay">${selectedBreakTime}:00</span>
      </div>
      <div class="game-list">
        <button onclick="startGameDuringBreak('snake')" class="game-btn">🐍 Snake</button>
        <button onclick="startGameDuringBreak('memory')" class="game-btn">🧠 Memory</button>
        <button onclick="startGameDuringBreak('typing')" class="game-btn">⌨️ Typing</button>
        <button onclick="startGameDuringBreak('puzzle')" class="game-btn">🧩 Puzzle</button>
      </div>
      <button onclick="startRegularBreakFromGames(); this.parentElement.parentElement.remove()" class="close-popup">Just Take a Regular Break</button>
    </div>
  `;

  document.body.appendChild(gamesPopup);
  
  // Start break countdown
  playSound('break-start');
  startBreakCountdown();
  updateBreakTimerDisplay();
}

function startGameDuringBreak(gameType) {
  // Don't remove the games popup immediately - let startGame handle the display
  const popup = document.querySelector('.games-popup');
  
  // Start the selected game
  startGame(gameType);
  
  // Remove the games popup after game starts
  if (popup) popup.remove();
  
  // Add break timer overlay to game canvas
  addBreakTimerToGame();
}

function startRegularBreakFromGames() {
  // Just continue with regular break countdown
}

let breakTimer;

function startBreakCountdown() {
  if (breakTimer) clearInterval(breakTimer);
  
  isRunning = true;
  breakTimer = setInterval(() => {
    if (seconds === 0) {
      if (focusMinutes === 0) {
        clearInterval(breakTimer);
        isRunning = false;
        playSound('break-end');
        
        // Close any open games
        if (gameRunning) {
          closeGame();
        }
        
        // Remove any break timer displays
        const breakDisplay = document.getElementById('breakTimerDisplay');
        if (breakDisplay) {
          const popup = breakDisplay.closest('.games-popup');
          if (popup) popup.remove();
        }
        
        // Reset to default focus time for next session
        focusMinutes = 25;
        seconds = 0;
        updateDisplay();
        
        // Show focus overlay for next session
        focusOverlay.style.display = "flex";
        setMode('focus');
        
        // Show break complete notification
        showBreakCompleteNotification();
        return;
      }
      focusMinutes--;
      seconds = 59;
    } else {
      seconds--;
    }
    updateDisplay();
    updateBreakTimerDisplay();
  }, 1000);
}

function updateBreakTimerDisplay() {
  const breakDisplay = document.getElementById('breakTimerDisplay');
  if (breakDisplay) {
    const min = String(focusMinutes).padStart(2, '0');
    const sec = String(seconds).padStart(2, '0');
    breakDisplay.textContent = `${min}:${sec}`;
  }
  
  // Also update game break timer if it exists
  const gameBreakTimer = document.getElementById('gameBreakTimer');
  if (gameBreakTimer) {
    const min = String(focusMinutes).padStart(2, '0');
    const sec = String(seconds).padStart(2, '0');
    gameBreakTimer.textContent = `Break: ${min}:${sec}`;
  }
}

function addBreakTimerToGame() {
  const gameContainer = document.getElementById('gameCanvasContainer');
  if (!gameContainer) return;
  
  // Check if break timer already exists
  let breakTimer = document.getElementById('gameBreakTimer');
  if (!breakTimer) {
    breakTimer = document.createElement('div');
    breakTimer.id = 'gameBreakTimer';
    breakTimer.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      z-index: 10;
    `;
    gameContainer.appendChild(breakTimer);
  }
  
  updateBreakTimerDisplay();
}

function showBreakCompleteNotification() {
  const notification = document.createElement('div');
  notification.className = 'achievement-popup show';
  notification.innerHTML = `
    <div class="achievement-content">
      <div class="achievement-icon">☕</div>
      <h3>Break Complete!</h3>
      <h4>Ready for another focus session?</h4>
      <p>Your break time is over. Time to get back to studying!</p>
      <button onclick="this.parentElement.parentElement.remove()" class="close-popup">Start Next Session</button>
    </div>
  `;

  document.body.appendChild(notification);
}

function startBreak() {
  customBreakOverlay.style.display = "flex";
  setMode('break');
}

// Game variables
let currentGame = null;
let gameCanvas = null;
let gameCtx = null;
let gameScore = 0;
let gameRunning = false;

function startGame(gameType) {
  // Close any existing game first
  if (gameRunning) {
    closeGame();
  }
  
  // Create game canvas container if it doesn't exist
  let container = document.getElementById('gameCanvasContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gameCanvasContainer';
    container.className = 'game-canvas-container';
    container.innerHTML = `
      <div class="game-header">
        <h3 id="currentGameTitle">Game</h3>
        <div class="game-controls">
          <span id="gameScore">Score: 0</span>
          <button onclick="closeGame()" class="close-game-btn">×</button>
        </div>
      </div>
      <canvas id="gameCanvas" width="400" height="400"></canvas>
      <div id="gameInstructions" class="game-instructions">Game instructions</div>
    `;
    document.body.appendChild(container);
  }
  
  currentGame = gameType;
  gameScore = 0;
  gameRunning = true;

  const title = document.getElementById('currentGameTitle');
  const score = document.getElementById('gameScore');
  const instructions = document.getElementById('gameInstructions');

  // Make sure container is visible
  container.style.display = 'block';
  container.style.zIndex = '2001'; // Above other popups
  
  gameCanvas = document.getElementById('gameCanvas');
  if (!gameCanvas) {
    console.error('Game canvas not found!');
    return;
  }
  
  gameCtx = gameCanvas.getContext('2d');
  if (!gameCtx) {
    console.error('Could not get canvas context!');
    return;
  }

  score.textContent = `Score: ${gameScore}`;

  switch(gameType) {
    case 'snake':
      title.textContent = 'Snake Game';
      instructions.textContent = 'Use arrow keys to move the snake';
      initSnakeGame();
      break;
    case 'memory':
      title.textContent = 'Memory Match';
      instructions.textContent = 'Click cards to find matching pairs';
      initMemoryGame();
      break;
    case 'typing':
      title.textContent = 'Typing Speed Test';
      instructions.textContent = 'Type the words as fast as you can';
      initTypingGame();
      break;
    case 'puzzle':
      title.textContent = 'Number Puzzle';
      instructions.textContent = 'Arrange numbers in order';
      initPuzzleGame();
      break;
  }
}

function closeGame() {
  gameRunning = false;
  currentGame = null;
  
  const container = document.getElementById('gameCanvasContainer');
  if (container) {
    container.style.display = 'none';
    
    // Remove break timer if it exists
    const gameBreakTimer = document.getElementById('gameBreakTimer');
    if (gameBreakTimer) {
      gameBreakTimer.remove();
    }
  }
  
  // Clean up all event listeners
  document.removeEventListener('keydown', gameKeyHandler);
  document.removeEventListener('keydown', typingKeyHandler);
  
  if (gameCanvas) {
    // Clone and replace canvas to remove all event listeners
    const newCanvas = gameCanvas.cloneNode(true);
    gameCanvas.parentNode.replaceChild(newCanvas, gameCanvas);
    gameCanvas = newCanvas;
    gameCtx = gameCanvas.getContext('2d');
  }
}

function updateGameScore(points) {
  gameScore += points;
  document.getElementById('gameScore').textContent = `Score: ${gameScore}`;
}

// Snake Game
let snake = [];
let food = {};
let direction = 'right';
let gameSpeed = 150;

function initSnakeGame() {
  snake = [{x: 200, y: 200}];
  food = {x: 300, y: 300};
  direction = 'right';
  gameRunning = true;

  document.addEventListener('keydown', gameKeyHandler);
  drawSnakeGame();
  snakeGameLoop();
}

function gameKeyHandler(e) {
  if (currentGame === 'snake') {
    switch(e.key) {
      case 'ArrowUp': if (direction !== 'down') direction = 'up'; break;
      case 'ArrowDown': if (direction !== 'up') direction = 'down'; break;
      case 'ArrowLeft': if (direction !== 'right') direction = 'left'; break;
      case 'ArrowRight': if (direction !== 'left') direction = 'right'; break;
    }
  }
}

function snakeGameLoop() {
  if (!gameRunning) return;

  const head = {...snake[0]};

  switch(direction) {
    case 'up': head.y -= 20; break;
    case 'down': head.y += 20; break;
    case 'left': head.x -= 20; break;
    case 'right': head.x += 20; break;
  }

  // Check wall collision
  if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400) {
    gameOver();
    return;
  }

  // Check self collision
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Check food collision
  if (head.x === food.x && head.y === food.y) {
    updateGameScore(10);
    generateFood();
    // Don't remove tail when food is eaten
  } else {
    snake.pop();
  }

  drawSnakeGame();
  setTimeout(snakeGameLoop, gameSpeed);
}

function generateFood() {
  food = {
    x: Math.floor(Math.random() * 20) * 20,
    y: Math.floor(Math.random() * 20) * 20
  };
}

function drawSnakeGame() {
  gameCtx.clearRect(0, 0, 400, 400);

  // Draw snake
  gameCtx.fillStyle = '#e53e3e';
  snake.forEach(segment => {
    gameCtx.fillRect(segment.x, segment.y, 18, 18);
  });

  // Draw food
  gameCtx.fillStyle = '#38a169';
  gameCtx.fillRect(food.x, food.y, 18, 18);
}

// Memory Game
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;

function initMemoryGame() {
  const symbols = ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝', '🍒', '🥭'];
  memoryCards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  flippedCards = [];
  matchedPairs = 0;
  gameRunning = true;

  drawMemoryGame();
  gameCanvas.addEventListener('click', memoryCardClick);
}

function memoryCardClick(e) {
  if (!gameRunning || flippedCards.length >= 2) return;

  const rect = gameCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / 100);
  const y = Math.floor((e.clientY - rect.top) / 100);
  const index = y * 4 + x;

  if (flippedCards.includes(index) || index >= 16) return;

  flippedCards.push(index);
  drawMemoryGame();

  if (flippedCards.length === 2) {
    setTimeout(checkMemoryMatch, 1000);
  }
}

function checkMemoryMatch() {
  const [first, second] = flippedCards;

  if (memoryCards[first] === memoryCards[second]) {
    matchedPairs++;
    updateGameScore(20);

    if (matchedPairs === 8) {
      setTimeout(() => gameOver('You Win!'), 500);
      return;
    }
  }

  flippedCards = [];
  drawMemoryGame();
}

function drawMemoryGame() {
  gameCtx.clearRect(0, 0, 400, 400);

  for (let i = 0; i < 16; i++) {
    const x = (i % 4) * 100;
    const y = Math.floor(i / 4) * 100;

    // Draw card background
    gameCtx.fillStyle = '#e2e8f0';
    gameCtx.fillRect(x + 5, y + 5, 90, 90);

    // Check if this card should be visible
    const cardValue = memoryCards[i];
    const matchedIndices = [];
    
    // Find all matched cards
    for (let j = 0; j < matchedPairs; j++) {
      const symbol = ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝', '🍒', '🥭'][j];
      for (let k = 0; k < 16; k++) {
        if (memoryCards[k] === symbol) {
          matchedIndices.push(k);
        }
      }
    }
    
    if (flippedCards.includes(i) || matchedIndices.includes(i)) {
      gameCtx.fillStyle = '#fff';
      gameCtx.fillRect(x + 5, y + 5, 90, 90);
      gameCtx.font = '40px Arial';
      gameCtx.textAlign = 'center';
      gameCtx.fillStyle = '#000';
      gameCtx.fillText(memoryCards[i], x + 50, y + 60);
    }
  }
}

// Typing Game
let typingWords = ['javascript', 'python', 'coding', 'programming', 'computer', 'keyboard', 'mouse', 'screen'];
let currentWord = '';
let typedText = '';
let wordsCompleted = 0;

function initTypingGame() {
  currentWord = typingWords[Math.floor(Math.random() * typingWords.length)];
  typedText = '';
  wordsCompleted = 0;
  gameRunning = true;

  drawTypingGame();
  document.addEventListener('keydown', typingKeyHandler);
}

function typingKeyHandler(e) {
  if (currentGame !== 'typing' || !gameRunning) return;

  if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
    typedText += e.key.toLowerCase();
    drawTypingGame();

    if (typedText === currentWord) {
      wordsCompleted++;
      updateGameScore(currentWord.length * 5);
      currentWord = typingWords[Math.floor(Math.random() * typingWords.length)];
      typedText = '';
      drawTypingGame();
    }
  } else if (e.key === 'Backspace') {
    typedText = typedText.slice(0, -1);
    drawTypingGame();
  }
}

function drawTypingGame() {
  gameCtx.clearRect(0, 0, 400, 400);

  gameCtx.font = '24px Arial';
  gameCtx.textAlign = 'center';
  gameCtx.fillStyle = '#2d3748';
  gameCtx.fillText(`Words: ${wordsCompleted}`, 200, 50);

  gameCtx.font = '32px Arial';
  gameCtx.fillStyle = '#4a5568';
  gameCtx.fillText(currentWord, 200, 150);

  gameCtx.fillStyle = '#e53e3e';
  gameCtx.fillText(typedText, 200, 250);

  // Draw cursor
  const textWidth = gameCtx.measureText(typedText).width;
  gameCtx.fillRect(200 + textWidth/2 + 2, 225, 2, 30);
}

// Number Puzzle Game
let puzzleGrid = [];
let emptyPos = {x: 3, y: 3};

function initPuzzleGame() {
  puzzleGrid = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 0]
  ];

  // Shuffle the puzzle
  for (let i = 0; i < 100; i++) {
    const moves = [
      {x: 0, y: -1}, {x: 0, y: 1},
      {x: -1, y: 0}, {x: 1, y: 0}
    ];
    const move = moves[Math.floor(Math.random() * moves.length)];
    const newX = emptyPos.x + move.x;
    const newY = emptyPos.y + move.y;

    if (newX >= 0 && newX < 4 && newY >= 0 && newY < 4) {
      puzzleGrid[emptyPos.y][emptyPos.x] = puzzleGrid[newY][newX];
      puzzleGrid[newY][newX] = 0;
      emptyPos = {x: newX, y: newY};
    }
  }

  gameRunning = true;
  drawPuzzleGame();
  gameCanvas.addEventListener('click', puzzleClick);
}

function puzzleClick(e) {
  if (!gameRunning) return;

  const rect = gameCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / 100);
  const y = Math.floor((e.clientY - rect.top) / 100);

  // Check if clicked tile is adjacent to empty space
  const dx = Math.abs(x - emptyPos.x);
  const dy = Math.abs(y - emptyPos.y);

  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
    puzzleGrid[emptyPos.y][emptyPos.x] = puzzleGrid[y][x];
    puzzleGrid[y][x] = 0;
    emptyPos = {x, y};

    updateGameScore(1);
    drawPuzzleGame();

    if (checkPuzzleSolved()) {
      gameOver('Puzzle Solved!');
    }
  }
}

function checkPuzzleSolved() {
  const target = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 0]
  ];

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (puzzleGrid[y][x] !== target[y][x]) {
        return false;
      }
    }
  }
  return true;
}

function drawPuzzleGame() {
  gameCtx.clearRect(0, 0, 400, 400);

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const num = puzzleGrid[y][x];

      if (num !== 0) {
        gameCtx.fillStyle = '#e2e8f0';
        gameCtx.fillRect(x * 100 + 5, y * 100 + 5, 90, 90);

        gameCtx.font = '32px Arial';
        gameCtx.textAlign = 'center';
        gameCtx.fillStyle = '#2d3748';
        gameCtx.fillText(num, x * 100 + 50, y * 100 + 60);
            }
    }
  }
}

function gameOver(message = 'Game Over') {
  gameRunning = false;

  gameCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  gameCtx.fillRect(0, 0, 400, 400);

  gameCtx.font = '32px Arial';
  gameCtx.textAlign = 'center';
  gameCtx.fillStyle = '#fff';
  gameCtx.fillText(message, 200, 180);
  gameCtx.fillText(`Final Score: ${gameScore}`, 200, 220);

  // Award bonus coins for playing games
  coins += Math.floor(gameScore / 10);
  saveGamificationData();
  updateGamificationDisplay();

  document.removeEventListener('keydown', gameKeyHandler);
  document.removeEventListener('keydown', typingKeyHandler);
  if (gameCanvas) {
    gameCanvas.removeEventListener('click', memoryCardClick);
    gameCanvas.removeEventListener('click', puzzleClick);
  }
}

function showGames() {
  const popup = document.createElement('div');
  popup.className = 'games-popup';
  popup.innerHTML = `
    <div class="games-content">
      <h3>🎮 Select a Game</h3>
      <div class="game-list">
        <button onclick="startGame('snake'); this.parentElement.parentElement.parentElement.remove()" class="game-btn">Snake</button>
        <button onclick="startGame('memory'); this.parentElement.parentElement.parentElement.remove()" class="game-btn">Memory</button>
        <button onclick="startGame('typing'); this.parentElement.parentElement.parentElement.remove()" class="game-btn">Typing</button>
        <button onclick="startGame('puzzle'); this.parentElement.parentElement.parentElement.remove()" class="game-btn">Puzzle</button>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="close-popup">Close</button>
    </div>
  `;

  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add('show'), 100);
}
