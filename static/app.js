// ======================
// GLOBAL STATE
// ======================
let currentLevel = 0;

const levels = [
  {
    title: "Level 1: Medicare Patients",
    description: "Return all Medicare patients.",
    starterQuery: "SELECT * FROM patients WHERE insurance_type = 'Medicare';"
  },
  {
    title: "Level 2: Encounters by Facility",
    description: "Count encounters by facility.",
    starterQuery: ""
  },
  {
    title: "Level 3: Active Cardiology Encounters",
    description: "Find all active encounters in Cardiology.",
    starterQuery: ""
  },
  {
    title: "Level 4: Discharged Encounters",
    description: "Find discharged encounters.",
    starterQuery: ""
  },
  {
    title: "Level 5: Sort Patients",
    description: "Sort patients by last name.",
    starterQuery: ""
  }
];

// ======================
// INIT
// ======================
window.onload = function () {
  loadProgress();
  renderLevel();
  renderLevelsPanel();
  updateDashboard();
};

// ======================
// LEVEL RENDER
// ======================
function renderLevel() {
  const level = levels[currentLevel];

  document.getElementById("level-title").innerText = level.title;
  document.getElementById("level-desc").innerText = level.description;
  document.getElementById("query").value = level.starterQuery || "";
}

// ======================
// RUN QUERY (SAFE)
// ======================
function runQuery() {
  const output = document.getElementById("output");
  if (!output) return;

  output.innerHTML = "Query executed (simulation).";
}

// ======================
// CHECK ANSWER
// ======================
function checkAnswer() {
  markLevelComplete(currentLevel);
  alert("Correct! Level completed.");
}

// ======================
// NAVIGATION
// ======================
function nextLevel() {
  if (currentLevel < levels.length - 1) {
    currentLevel++;
    saveProgress();
    renderLevel();
    renderLevelsPanel();
    updateDashboard();
  }
}

function prevLevel() {
  if (currentLevel > 0) {
    currentLevel--;
    renderLevel();
    renderLevelsPanel();
    updateDashboard();
  }
}

// ======================
// PROGRESS
// ======================
function saveProgress() {
  localStorage.setItem("sqlGameProgress", JSON.stringify({
    currentLevel,
    completed: completedLevels
  }));
}

function loadProgress() {
  const saved = localStorage.getItem("sqlGameProgress");
  if (saved) {
    const data = JSON.parse(saved);
    currentLevel = data.currentLevel || 0;
    completedLevels = data.completed || [];
  }
}

let completedLevels = [];

function markLevelComplete(level) {
  if (!completedLevels.includes(level)) {
    completedLevels.push(level);
    saveProgress();
  }
}

// ======================
// DASHBOARD
// ======================
function updateDashboard() {
  const progress = document.getElementById("progress-text");
  const current = document.getElementById("current-level");
  const badges = document.getElementById("badges");

  if (progress) progress.innerText = `${completedLevels.length}/${levels.length} levels completed`;
  if (current) current.innerText = levels[currentLevel].title;
  if (badges) badges.innerText = completedLevels.length;
}

// ======================
// LEVEL PANEL
// ======================
function renderLevelsPanel() {
  const panel = document.getElementById("levels-panel");
  if (!panel) return;

  panel.innerHTML = "";

  levels.forEach((lvl, i) => {
    const div = document.createElement("div");
    div.className = "level-item";
    div.innerText = lvl.title;

    if (i === currentLevel) div.classList.add("active");
    if (completedLevels.includes(i)) div.classList.add("completed");

    div.onclick = () => {
      currentLevel = i;
      renderLevel();
      renderLevelsPanel();
      updateDashboard();
    };

    panel.appendChild(div);
  });
}

// ======================
// RESET
// ======================
function resetAllProgress() {
  localStorage.removeItem("sqlGameProgress");
  currentLevel = 0;
  completedLevels = [];
  renderLevel();
  renderLevelsPanel();
  updateDashboard();
}

// ======================
// FIX BUTTONS (CRITICAL)
// ======================
window.runQuery = runQuery;
window.checkAnswer = checkAnswer;
window.nextLevel = nextLevel;
window.prevLevel = prevLevel;
window.resetAllProgress = resetAllProgress;
