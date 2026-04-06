// ======================
// GLOBAL STATE
// ======================
let currentLevel = 0;
let attempts = 0;

let gameState = {
    currentLevel: 0,
    completed: {},
    firstTry: {}
};

// ======================
// STORAGE
// ======================
const STORAGE_KEY = "sqlGameState";

// ======================
// SCHEMA
// ======================
const schema = {
    patients: {
        columns: ["patient_id", "first_name", "last_name", "age", "gender", "insurance_type"],
        description: "Patient demographic and insurance information."
    },
    providers: {
        columns: ["provider_id", "provider_name", "specialty"],
        description: "Provider names and specialties."
    },
    encounters: {
        columns: ["encounter_id", "patient_id", "provider_id", "department", "status"],
        description: "Clinical encounters tied to patients and providers."
    },
    appointments: {
        columns: ["appointment_id", "patient_id", "provider_id", "date"],
        description: "Scheduled patient appointments."
    },
    charges: {
        columns: ["charge_id", "patient_id", "encounter_id", "amount"],
        description: "Financial charges tied to patients and encounters."
    },
    claims: {
        columns: ["claim_id", "patient_id", "encounter_id", "payer", "claim_status", "billed_amount"],
        description: "Insurance claims and claim outcomes."
    }
};

const relationships = [
    "patients.patient_id = encounters.patient_id",
    "patients.patient_id = appointments.patient_id",
    "patients.patient_id = charges.patient_id",
    "patients.patient_id = claims.patient_id",
    "providers.provider_id = encounters.provider_id",
    "providers.provider_id = appointments.provider_id",
    "encounters.encounter_id = charges.encounter_id",
    "encounters.encounter_id = claims.encounter_id"
];

// ======================
// LEVELS
// ======================
const levels = [
    {
        title: "Level 1: Medicare Patients",
        description: "Return all Medicare patients.",
        solution: "select patient_id, first_name, last_name from patients where insurance_type = 'medicare'",
        hint: "Filter the patients table to Medicare."
    },
    {
        title: "Level 2: Encounters by Facility",
        description: "Return all encounters.",
        solution: "select * from encounters",
        hint: "Use the encounters table."
    },
    {
        title: "Level 3: Active Cardiology Encounters",
        description: "Find cardiology encounters.",
        solution: "select * from encounters where department = 'cardiology'",
        hint: "Filter encounters by department."
    },
    {
        title: "Level 4: Discharged Encounters",
        description: "Find discharged encounters.",
        solution: "select * from encounters where status = 'discharged'",
        hint: "Filter encounters by status."
    },
    {
        title: "Level 5: Sort Patients",
        description: "Sort patients by last name.",
        solution: "select * from patients order by last_name",
        hint: "Use ORDER BY last_name."
    },
    {
        title: "Level 6: Insurance Counts",
        description: "Count patients by insurance type.",
        solution: "select insurance_type, count(*) from patients group by insurance_type",
        hint: "Use GROUP BY insurance_type."
    },
    {
        title: "Level 7: Appointment Volume",
        description: "Return all appointments.",
        solution: "select * from appointments",
        hint: "Use the appointments table."
    },
    {
        title: "Level 8: Charge Totals",
        description: "Return all charges.",
        solution: "select * from charges",
        hint: "Use the charges table."
    },
    {
        title: "Level 9: Claim Review",
        description: "Return all claims.",
        solution: "select * from claims",
        hint: "Use the claims table."
    },
    {
        title: "Level 10: Intermediate Join Intro",
        description: "Join encounters to patients.",
        solution: "select e.encounter_id, p.first_name from encounters e join patients p on e.patient_id = p.patient_id",
        hint: "Join encounters to patients on patient_id."
    },
    {
        title: "Level 11: Provider Encounter Join",
        description: "Join encounters and providers.",
        solution: "select e.encounter_id, pr.provider_name from encounters e join providers pr on e.provider_id = pr.provider_id",
        hint: "Join encounters to providers on provider_id."
    },
    {
        title: "Level 12: Appointment Patients",
        description: "Join appointments to patients.",
        solution: "select a.appointment_id, p.first_name from appointments a join patients p on a.patient_id = p.patient_id",
        hint: "Join appointments to patients."
    },
    {
        title: "Level 13: Charges by Patient",
        description: "Join charges to patients.",
        solution: "select c.charge_id, p.first_name from charges c join patients p on c.patient_id = p.patient_id",
        hint: "Join charges to patients."
    },
    {
        title: "Level 14: Denied Claims by Payer",
        description: "Count denied claims and sum billed dollars by payer.",
        solution: "select payer, count(*) as denied_claims, sum(billed_amount) as denied_billed_amount from claims where claim_status = 'denied' group by payer",
        hint: "Filter claims to denied and group by payer."
    },
    {
        title: "Level 15: Charges by Encounter",
        description: "Join charges to encounters.",
        solution: "select c.charge_id, e.department from charges c join encounters e on c.encounter_id = e.encounter_id",
        hint: "Join charges to encounters on encounter_id."
    },
    {
        title: "Level 16: Advanced Patient Claims",
        description: "Join claims to patients.",
        solution: "select cl.claim_id, p.first_name from claims cl join patients p on cl.patient_id = p.patient_id",
        hint: "Join claims to patients."
    },
    {
        title: "Level 17: Advanced Claim Encounter",
        description: "Join claims to encounters.",
        solution: "select cl.claim_id, e.department from claims cl join encounters e on cl.encounter_id = e.encounter_id",
        hint: "Join claims to encounters."
    },
    {
        title: "Level 18: Advanced Provider Appointments",
        description: "Join appointments to providers.",
        solution: "select a.appointment_id, pr.provider_name from appointments a join providers pr on a.provider_id = pr.provider_id",
        hint: "Join appointments to providers."
    },
    {
        title: "Level 19: Advanced Ordered Claims",
        description: "Order claims by billed amount.",
        solution: "select * from claims order by billed_amount desc",
        hint: "Use ORDER BY billed_amount DESC."
    },
    {
        title: "Level 20: Advanced Claim Counts",
        description: "Count claims by status.",
        solution: "select claim_status, count(*) from claims group by claim_status",
        hint: "Group claims by claim_status."
    },
    {
        title: "Level 21: Advanced Patient Gender",
        description: "Return all male patients.",
        solution: "select * from patients where gender = 'male'",
        hint: "Filter patients by gender."
    },
    {
        title: "Level 22: Advanced Provider Specialty",
        description: "Return cardiology providers.",
        solution: "select * from providers where specialty = 'cardiology'",
        hint: "Filter providers by specialty."
    },
    {
        title: "Level 23: Advanced Charge Sort",
        description: "Order charges by amount descending.",
        solution: "select * from charges order by amount desc",
        hint: "Use ORDER BY amount DESC."
    },
    {
        title: "Level 24: Advanced Appointment Sort",
        description: "Order appointments by date.",
        solution: "select * from appointments order by date",
        hint: "Use ORDER BY date."
    },
    {
        title: "Level 25: Advanced Encounter Counts",
        description: "Count encounters by department.",
        solution: "select department, count(*) from encounters group by department",
        hint: "Group encounters by department."
    },
    {
        title: "Level 26: Advanced Multi Join",
        description: "Join patients, encounters, and providers.",
        solution: "select p.first_name, e.encounter_id, pr.provider_name from patients p join encounters e on p.patient_id = e.patient_id join providers pr on e.provider_id = pr.provider_id",
        hint: "Join patients to encounters, then encounters to providers."
    },
    {
        title: "Level 27: Advanced Charge Patient Encounter",
        description: "Join charges, patients, and encounters.",
        solution: "select c.charge_id, p.first_name, e.department from charges c join patients p on c.patient_id = p.patient_id join encounters e on c.encounter_id = e.encounter_id",
        hint: "Join charges to both patients and encounters."
    },
    {
        title: "Level 28: Advanced Claims Patient Encounter",
        description: "Join claims, patients, and encounters.",
        solution: "select cl.claim_id, p.first_name, e.department from claims cl join patients p on cl.patient_id = p.patient_id join encounters e on cl.encounter_id = e.encounter_id",
        hint: "Join claims to both patients and encounters."
    },
    {
        title: "Level 29: Advanced Status Filtering",
        description: "Find active encounters ordered by encounter_id.",
        solution: "select * from encounters where status = 'active' order by encounter_id",
        hint: "Filter active encounters and order them."
    },
    {
        title: "Level 30: Final Mastery Query",
        description: "Join patients and claims for denied claims.",
        solution: "select p.first_name, cl.payer, cl.billed_amount from patients p join claims cl on p.patient_id = cl.patient_id where cl.claim_status = 'denied'",
        hint: "Join patients to claims and filter denied claims."
    }
];

// ======================
// HELPERS
// ======================
function normalizeQuery(query) {
    return query
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/;$/, "");
}

function getDifficulty(index) {
    if (index < 5) return "Easy";
    if (index < 10) return "Intermediate";
    if (index < 15) return "Hard";
    return "Advanced";
}

function getCompletedCount() {
    return Object.keys(gameState.completed).length;
}

function getBadgesCount() {
    return Object.keys(gameState.firstTry).length;
}

// ======================
// STORAGE
// ======================
function saveGameState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            gameState = JSON.parse(saved);
        } catch (error) {
            console.error("Failed to parse saved game state:", error);
        }
    }
}

function resetAllProgress() {
    localStorage.removeItem(STORAGE_KEY);

    gameState = {
        currentLevel: 0,
        completed: {},
        firstTry: {}
    };

    currentLevel = 0;
    attempts = 0;

    const feedback = document.getElementById("feedback");
    const output = document.getElementById("output");
    const query = document.getElementById("query");

    if (feedback) feedback.innerHTML = "";
    if (output) output.innerHTML = "";
    if (query) query.value = "";

    renderAchievements();
    renderLevelsPanel();
    updateDashboard();
    loadLevel(0);
}

// ======================
// DASHBOARD
// ======================
function updateDashboard() {
    const progressEl = document.getElementById("progress");
    const currentLevelEl = document.getElementById("current-level");
    const badgesEl = document.getElementById("badges");
    const progressBarEl = document.getElementById("progress-bar");

    const completedCount = getCompletedCount();
    const badgesCount = getBadgesCount();
    const progressPercent = (completedCount / levels.length) * 100;

    if (progressEl) {
        progressEl.innerText = `${completedCount}/${levels.length} levels completed`;
    }

    if (currentLevelEl) {
        currentLevelEl.innerText = levels[currentLevel].title;
    }

    if (badgesEl) {
        badgesEl.innerText = `${badgesCount} earned`;
    }

    if (progressBarEl) {
        progressBarEl.style.width = `${progressPercent}%`;
    }

    gameState.currentLevel = currentLevel;
    saveGameState();
}

// ======================
// ACHIEVEMENTS
// ======================
function renderAchievements() {
    const container = document.getElementById("badges-container");
    if (!container) return;

    const completedCount = getCompletedCount();
    const firstTryCount = getBadgesCount();

    const achievementList = [
        {
            label: "First Query",
            earned: completedCount >= 1 || firstTryCount >= 1
        },
        {
            label: "First Win",
            earned: completedCount >= 1
        },
        {
            label: "3 Levels Cleared",
            earned: completedCount >= 3
        },
        {
            label: "5 Levels Cleared",
            earned: completedCount >= 5
        },
        {
            label: "10 Levels Cleared",
            earned: completedCount >= 10
        },
        {
            label: "15 Levels Cleared",
            earned: completedCount >= 15
        },
        {
            label: "20 Levels Cleared",
            earned: completedCount >= 20
        },
        {
            label: "30 Levels Cleared",
            earned: completedCount >= 30
        },
        {
            label: "3 First-Try Wins",
            earned: firstTryCount >= 3
        }
    ];

    container.innerHTML = "";

    achievementList.forEach((achievement) => {
        const badge = document.createElement("div");
        badge.className = achievement.earned ? "badge-chip" : "badge-chip locked";
        badge.innerText = achievement.earned ? `🏅 ${achievement.label}` : `🔒 ${achievement.label}`;
        container.appendChild(badge);
    });
}

// ======================
// LEVEL PANEL
// ======================
function renderLevelsPanel() {
    const container = document.getElementById("levels-container");
    if (!container) return;

    container.innerHTML = "";

    levels.forEach((level, index) => {
        const item = document.createElement("button");
        item.className = "level-item";
        if (index === currentLevel) {
            item.classList.add("current");
        }
        if (gameState.completed[index]) {
            item.classList.add("completed");
        }

        item.innerHTML = `
            <div class="level-item-head">
                <span class="level-item-title">${level.title}</span>
                <span class="difficulty-badge difficulty-${getDifficulty(index).toLowerCase()}">${getDifficulty(index)}</span>
            </div>
            <span class="level-status">${gameState.completed[index] ? "Completed" : "Available"}</span>
        `;

        item.addEventListener("click", function () {
            loadLevel(index);
        });

        container.appendChild(item);
    });
}

// ======================
// SCHEMA
// ======================
function renderSchema() {
    const container = document.getElementById("schema");
    const relationshipContainer = document.getElementById("schema-relationships");

    if (container) {
        container.innerHTML = "";

        Object.keys(schema).forEach((tableName) => {
            const card = document.createElement("details");
            card.className = "schema-card";

            const summary = document.createElement("summary");
            summary.innerText = tableName;

            const desc = document.createElement("p");
            desc.innerHTML = `<strong>Description:</strong> ${schema[tableName].description}`;

            const cols = document.createElement("p");
            cols.innerHTML = `<strong>Columns:</strong> ${schema[tableName].columns.join(", ")}`;

            card.appendChild(summary);
            card.appendChild(desc);
            card.appendChild(cols);
            container.appendChild(card);
        });
    }

    if (relationshipContainer) {
        relationshipContainer.innerHTML = "";

        relationships.forEach((relationship) => {
            const relCard = document.createElement("div");
            relCard.className = "relationship-item";
            relCard.style.padding = "12px 14px";
            relCard.style.marginBottom = "10px";
            relCard.innerText = relationship;
            relationshipContainer.appendChild(relCard);
        });
    }
}

// ======================
// LEVEL LOADING
// ======================
function loadLevel(index) {
    currentLevel = index;
    attempts = 0;

    const level = levels[index];

    const titleEl = document.getElementById("level-title");
    const descEl = document.getElementById("level-desc");
    const queryEl = document.getElementById("query");
    const feedbackEl = document.getElementById("feedback");
    const outputEl = document.getElementById("output");
    const hintEl = document.getElementById("level-hint");

    if (titleEl) titleEl.innerText = level.title;
    if (descEl) descEl.innerText = level.description;
    if (queryEl) queryEl.value = "";
    if (feedbackEl) feedbackEl.innerHTML = "";
    if (outputEl) outputEl.innerHTML = "";

    if (hintEl) {
        hintEl.innerText = "Run your query and check your answer. After two wrong tries, you'll get smart hints. After the third wrong try, the answer will be shown with an explanation.";
    }

    renderLevelsPanel();
    updateDashboard();
}
