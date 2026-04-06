// ======================
// GLOBAL STATE
// ======================
let currentLevel = 0;
let attempts = 0;
let gameState = {
    currentLevel: 0,
    completed: {},
    firstTry: {},
};

// ======================
// SCHEMA
// ======================
const schema = {
    patients: {
        columns: ["patient_id", "first_name", "last_name", "age", "gender", "insurance_type"]
    },
    providers: {
        columns: ["provider_id", "provider_name", "specialty"]
    },
    encounters: {
        columns: ["encounter_id", "patient_id", "provider_id", "department", "status"]
    },
    appointments: {
        columns: ["appointment_id", "patient_id", "provider_id", "date"]
    },
    charges: {
        columns: ["charge_id", "patient_id", "encounter_id", "amount"]
    },
    claims: {
        columns: ["claim_id", "patient_id", "encounter_id", "payer", "claim_status", "billed_amount"]
    }
};

// ======================
// LEVELS (1–30 SAFE)
// ======================
const levels = [
    {
        title: "Level 1: Medicare Patients",
        description: "Return all Medicare patients",
        solution: "select patient_id, first_name, last_name from patients where insurance_type = 'medicare'"
    },
    {
        title: "Level 2: Encounters by Facility",
        description: "Return all encounters",
        solution: "select * from encounters"
    },
    {
        title: "Level 3: Active Cardiology Encounters",
        description: "Cardiology active encounters",
        solution: "select * from encounters where department = 'cardiology'"
    },
    {
        title: "Level 4: Discharged Encounters",
        description: "Find discharged encounters",
        solution: "select * from encounters where status = 'discharged'"
    },
    {
        title: "Level 5: Sort Patients",
        description: "Sort patients by last name",
        solution: "select * from patients order by last_name"
    },
    // -------- placeholder remaining levels safely --------
];

for (let i = levels.length; i < 30; i++) {
    levels.push({
        title: `Level ${i + 1}`,
        description: "Advanced SQL challenge",
        solution: "select * from patients"
    });
}

// ======================
// DIFFICULTY
// ======================
function getDifficulty(index) {
    if (index < 5) return "Easy";
    if (index < 10) return "Intermediate";
    if (index < 15) return "Hard";
    return "Advanced";
}

// ======================
// LOCAL STORAGE
// ======================
function saveGameState() {
    localStorage.setItem("sqlGameState", JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem("sqlGameState");
    if (saved) {
        gameState = JSON.parse(saved);
    }
}

// ======================
// LOAD LEVEL
// ======================
function loadLevel(index) {
    currentLevel = index;
    attempts = 0;

    const level = levels[index];

    document.getElementById("level-title").innerText = level.title;
    document.getElementById("level-desc").innerText = level.description;
    document.getElementById("query").value = "";

    updateDashboard();
    highlightSchema();
}

// ======================
// RUN QUERY (mock)
// ======================
function runQuery() {
    document.getElementById("output").innerText = "Query executed.";
}

// ======================
// CHECK ANSWER
// ======================
function checkAnswer() {
    const userQuery = document.getElementById("query").value.toLowerCase();
    const correct = levels[currentLevel].solution;

    attempts++;

    if (userQuery.includes(correct)) {
        document.getElementById("feedback").innerText = "✅ Correct!";
        gameState.completed[currentLevel] = true;

        if (attempts === 1) {
            gameState.firstTry[currentLevel] = true;
        }

        saveGameState();
        updateDashboard();
    } else {
        if (attempts === 2) {
            document.getElementById("feedback").innerText = "Hint: Check your WHERE or JOIN.";
        } else if (attempts >= 3) {
            document.getElementById("feedback").innerText =
                "Answer: " + correct;
        } else {
            document.getElementById("feedback").innerText = "❌ Try again.";
        }
    }
}

// ======================
// DASHBOARD
// ======================
function updateDashboard() {
    const completedCount = Object.keys(gameState.completed).length;

    document.getElementById("progress").innerText =
        `${completedCount}/30 levels completed`;

    document.getElementById("current-level").innerText =
        levels[currentLevel].title;

    document.getElementById("badges").innerText =
        Object.keys(gameState.firstTry).length + " earned";

    renderLevelsPanel();
}

// ======================
// LEVEL NAV PANEL
// ======================
function renderLevelsPanel() {
    const container = document.getElementById("levels-container");
    container.innerHTML = "";

    levels.forEach((lvl, i) => {
        const div = document.createElement("div");

        div.className = "level-item";
        div.innerHTML = `
            <strong>${lvl.title}</strong>
            <span class="difficulty">${getDifficulty(i)}</span>
        `;

        div.onclick = () => loadLevel(i);

        container.appendChild(div);
    });
}

// ======================
// SCHEMA RENDER
// ======================
function renderSchema() {
    const container = document.getElementById("schema");
    container.innerHTML = "";

    Object.keys(schema).forEach(table => {
        const div = document.createElement("div");
        div.className = "schema-table";
        div.innerHTML = `<strong>${table}</strong>`;
        div.onclick = () => toggleTable(div, table);
        container.appendChild(div);
    });
}

function toggleTable(div, table) {
    if (div.classList.contains("open")) {
        div.classList.remove("open");
        div.innerHTML = `<strong>${table}</strong>`;
    } else {
        div.classList.add("open");

        const cols = schema[table].columns.join(", ");

        div.innerHTML = `
            <strong>${table}</strong>
            <div>${cols}</div>
        `;
    }
}

function highlightSchema() {
    // placeholder for future logic
}

// ======================
// NAVIGATION
// ======================
function nextLevel() {
    if (currentLevel < 29) {
        loadLevel(currentLevel + 1);
    }
}

function prevLevel() {
    if (currentLevel > 0) {
        loadLevel(currentLevel - 1);
    }
}

// ======================
// INIT
// ======================
window.onload = function () {
    loadGameState();
    renderSchema();
    loadLevel(gameState.currentLevel || 0);
};
