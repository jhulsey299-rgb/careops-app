const STORAGE_KEY = "careops_matched_rebuild_v1";

let currentLevel = 0;
let attempts = 0;
let lastRunQuery = "";

let gameState = {
    currentLevel: 0,
    completedLevels: [],
    firstTryLevels: []
};

const schema = {
    tables: [
        {
            name: "patients",
            description: "Patient demographic and insurance information.",
            keyColumns: ["patient_id"],
            notableColumns: ["patient_id", "first_name", "last_name", "age", "gender", "insurance_type", "risk_score", "city"],
            sampleRows: [
                [1, "Alice", "Smith", 53, "Female", "Medicare", 72, "Myrtle Beach"],
                [2, "James", "Johnson", 67, "Male", "Commercial", 55, "Georgetown"],
                [3, "Olivia", "Brown", 44, "Female", "Medicaid", 61, "Pawleys Island"],
                [4, "Daniel", "Miller", 71, "Male", "Medicare", 81, "Conway"],
                [5, "Sophia", "Wilson", 38, "Female", "Commercial", 42, "Murrells Inlet"]
            ]
        },
        {
            name: "providers",
            description: "Provider names, specialties, and facility assignments.",
            keyColumns: ["provider_id"],
            notableColumns: ["provider_id", "provider_name", "specialty", "facility"],
            sampleRows: [
                [101, "Dr. Adams", "Cardiology", "Waccamaw"],
                [102, "Dr. Brooks", "Family Medicine", "Georgetown"],
                [103, "Dr. Carter", "Neurology", "Waccamaw"],
                [104, "Dr. Diaz", "Emergency Medicine", "Georgetown"],
                [105, "Dr. Evans", "Orthopedics", "Waccamaw"]
            ]
        },
        {
            name: "encounters",
            description: "Patient encounters tied to providers and departments.",
            keyColumns: ["encounter_id"],
            notableColumns: ["encounter_id", "patient_id", "provider_id", "facility", "department", "status", "encounter_type"],
            sampleRows: [
                [1001, 1, 101, "Waccamaw", "Cardiology", "Active", "Inpatient"],
                [1002, 2, 104, "Georgetown", "ER", "Discharged", "Emergency"],
                [1003, 3, 102, "Georgetown", "Family Medicine", "Active", "Outpatient"],
                [1004, 4, 103, "Waccamaw", "Neurology", "Discharged", "Inpatient"],
                [1005, 5, 105, "Waccamaw", "Orthopedics", "Active", "Observation"]
            ]
        },
        {
            name: "appointments",
            description: "Scheduled appointments tied to patients and providers.",
            keyColumns: ["appointment_id"],
            notableColumns: ["appointment_id", "patient_id", "provider_id", "facility", "department", "status", "date"],
            sampleRows: [
                [2001, 1, 101, "Waccamaw", "Cardiology", "Completed", "2026-04-01"],
                [2002, 2, 102, "Georgetown", "Family Medicine", "No Show", "2026-04-02"],
                [2003, 3, 103, "Waccamaw", "Neurology", "Scheduled", "2026-04-03"],
                [2004, 4, 104, "Georgetown", "ER Follow-Up", "Completed", "2026-04-04"],
                [2005, 5, 105, "Waccamaw", "Orthopedics", "Completed", "2026-04-05"]
            ]
        },
        {
            name: "charges",
            description: "Financial charges tied to patients and encounters.",
            keyColumns: ["charge_id"],
            notableColumns: ["charge_id", "patient_id", "encounter_id", "amount", "payer", "charge_type"],
            sampleRows: [
                [3001, 1, 1001, 2500, "Medicare", "Facility"],
                [3002, 2, 1002, 1400, "Commercial", "Professional"],
                [3003, 3, 1003, 300, "Medicaid", "Professional"],
                [3004, 4, 1004, 4100, "Medicare", "Facility"],
                [3005, 5, 1005, 1800, "Commercial", "Observation"]
            ]
        },
        {
            name: "claims",
            description: "Claims tied to patients and encounters.",
            keyColumns: ["claim_id"],
            notableColumns: ["claim_id", "patient_id", "encounter_id", "payer", "claim_status", "billed_amount"],
            sampleRows: [
                [4001, 1, 1001, "Medicare", "Denied", 2500],
                [4002, 2, 1002, "Commercial", "Paid", 1400],
                [4003, 3, 1003, "Medicaid", "Pending", 300],
                [4004, 4, 1004, "Medicare", "Denied", 4100],
                [4005, 5, 1005, "Commercial", "Paid", 1800]
            ]
        }
    ],
    relationships: [
        "patients.patient_id = encounters.patient_id",
        "patients.patient_id = appointments.patient_id",
        "patients.patient_id = charges.patient_id",
        "patients.patient_id = claims.patient_id",
        "providers.provider_id = encounters.provider_id",
        "providers.provider_id = appointments.provider_id",
        "encounters.encounter_id = charges.encounter_id",
        "encounters.encounter_id = claims.encounter_id"
    ]
};

const levels = [
    {
        title: "Level 1: Medicare Patients",
        description: "Return all Medicare patients.",
        goal: "Return patient_id, first_name, and last_name.",
        starterQuery: "SELECT patient_id, first_name, last_name FROM patients WHERE insurance_type = 'Medicare';",
        solutionQuery: "SELECT patient_id, first_name, last_name FROM patients WHERE insurance_type = 'Medicare';",
        hint: "Use the patients table and filter insurance_type to Medicare.",
        relevantTables: ["patients"],
        joinHint: "No join needed.",
        difficulty: "Easy"
    },
    {
        title: "Level 2: Encounters by Facility",
        description: "Count encounters by facility.",
        goal: "Return facility and encounter_count.",
        starterQuery: "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",
        solutionQuery: "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",
        hint: "Use COUNT(*) and GROUP BY facility.",
        relevantTables: ["encounters"],
        joinHint: "No join needed.",
        difficulty: "Easy"
    },
    {
        title: "Level 3: Active Cardiology Encounters",
        description: "Find all active encounters in Cardiology.",
        goal: "Return encounter_id, patient_id, and status.",
        starterQuery: "SELECT encounter_id, patient_id, status FROM encounters WHERE department = 'Cardiology' AND status = 'Active';",
        solutionQuery: "SELECT encounter_id, patient_id, status FROM encounters WHERE department = 'Cardiology' AND status = 'Active';",
        hint: "Filter encounters by department and status.",
        relevantTables: ["encounters"],
        joinHint: "No join needed.",
        difficulty: "Easy"
    },
    {
        title: "Level 4: Discharged Encounters",
        description: "Find discharged encounters.",
        goal: "Return encounter_id, facility, and department.",
        starterQuery: "SELECT encounter_id, facility, department FROM encounters WHERE status = 'Discharged';",
        solutionQuery: "SELECT encounter_id, facility, department FROM encounters WHERE status = 'Discharged';",
        hint: "Filter encounters where status is Discharged.",
        relevantTables: ["encounters"],
        joinHint: "No join needed.",
        difficulty: "Easy"
    },
    {
        title: "Level 5: Sort Patients",
        description: "Sort patients by last name.",
        goal: "Return all patient rows ordered by last_name.",
        starterQuery: "SELECT * FROM patients ORDER BY last_name;",
        solutionQuery: "SELECT * FROM patients ORDER BY last_name;",
        hint: "Use ORDER BY last_name.",
        relevantTables: ["patients"],
        joinHint: "No join needed.",
        difficulty: "Easy"
    },
    {
        title: "Level 6: Insurance Counts",
        description: "Count patients by insurance type.",
        goal: "Return insurance_type and patient_count.",
        starterQuery: "SELECT insurance_type, COUNT(*) AS patient_count FROM patients GROUP BY insurance_type;",
        solutionQuery: "SELECT insurance_type, COUNT(*) AS patient_count FROM patients GROUP BY insurance_type;",
        hint: "Group patients by insurance_type.",
        relevantTables: ["patients"],
        joinHint: "No join needed.",
        difficulty: "Intermediate"
    },
    {
        title: "Level 7: Appointments by Status",
        description: "Count appointments by status.",
        goal: "Return status and appointment_count.",
        starterQuery: "SELECT status, COUNT(*) AS appointment_count FROM appointments GROUP BY status;",
        solutionQuery: "SELECT status, COUNT(*) AS appointment_count FROM appointments GROUP BY status;",
        hint: "Use COUNT(*) and GROUP BY status.",
        relevantTables: ["appointments"],
        joinHint: "No join needed.",
        difficulty: "Intermediate"
    },
    {
        title: "Level 8: Charges by Payer",
        description: "Sum charges by payer.",
        goal: "Return payer and total_amount.",
        starterQuery: "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer;",
        solutionQuery: "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer;",
        hint: "Use SUM(amount) and GROUP BY payer.",
        relevantTables: ["charges"],
        joinHint: "No join needed.",
        difficulty: "Intermediate"
    },
    {
        title: "Level 9: Claims by Status",
        description: "Count claims by status.",
        goal: "Return claim_status and claim_count.",
        starterQuery: "SELECT claim_status, COUNT(*) AS claim_count FROM claims GROUP BY claim_status;",
        solutionQuery: "SELECT claim_status, COUNT(*) AS claim_count FROM claims GROUP BY claim_status;",
        hint: "Group claims by claim_status.",
        relevantTables: ["claims"],
        joinHint: "No join needed.",
        difficulty: "Intermediate"
    },
    {
        title: "Level 10: Patient Cities",
        description: "List patients ordered by city then last name.",
        goal: "Return first_name, last_name, and city ordered by city, last_name.",
        starterQuery: "SELECT first_name, last_name, city FROM patients ORDER BY city, last_name;",
        solutionQuery: "SELECT first_name, last_name, city FROM patients ORDER BY city, last_name;",
        hint: "Use ORDER BY city, last_name.",
        relevantTables: ["patients"],
        joinHint: "No join needed.",
        difficulty: "Intermediate"
    },
    {
        title: "Level 11: Encounters with Patient Names",
        description: "Join encounters to patients.",
        goal: "Return encounter_id, first_name, and last_name.",
        starterQuery: "SELECT e.encounter_id, p.first_name, p.last_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
        solutionQuery: "SELECT e.encounter_id, p.first_name, p.last_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
        hint: "Join encounters to patients using patient_id.",
        relevantTables: ["encounters", "patients"],
        joinHint: "encounters.patient_id = patients.patient_id",
        difficulty: "Hard"
    },
    {
        title: "Level 12: Encounters with Providers",
        description: "Join encounters to providers.",
        goal: "Return encounter_id, provider_name, and specialty.",
        starterQuery: "SELECT e.encounter_id, pr.provider_name, pr.specialty FROM encounters e JOIN providers pr ON e.provider_id = pr.provider_id;",
        solutionQuery: "SELECT e.encounter_id, pr.provider_name, pr.specialty FROM encounters e JOIN providers pr ON e.provider_id = pr.provider_id;",
        hint: "Join encounters to providers using provider_id.",
        relevantTables: ["encounters", "providers"],
        joinHint: "encounters.provider_id = providers.provider_id",
        difficulty: "Hard"
    },
    {
        title: "Level 13: Appointments with Patients",
        description: "Join appointments to patients.",
        goal: "Return appointment_id, first_name, and status.",
        starterQuery: "SELECT a.appointment_id, p.first_name, a.status FROM appointments a JOIN patients p ON a.patient_id = p.patient_id;",
        solutionQuery: "SELECT a.appointment_id, p.first_name, a.status FROM appointments a JOIN patients p ON a.patient_id = p.patient_id;",
        hint: "Join appointments to patients using patient_id.",
        relevantTables: ["appointments", "patients"],
        joinHint: "appointments.patient_id = patients.patient_id",
        difficulty: "Hard"
    },
    {
        title: "Level 14: Denied Claims by Payer",
        description: "Count denied claims and sum billed dollars by payer.",
        goal: "Return payer, denied_claims, and denied_billed_amount.",
        starterQuery: "SELECT payer, COUNT(*) AS denied_claims, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
        solutionQuery: "SELECT payer, COUNT(*) AS denied_claims, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
        hint: "Filter claims to Denied, then group by payer.",
        relevantTables: ["claims"],
        joinHint: "No join needed.",
        difficulty: "Hard"
    },
    {
        title: "Level 15: Charges with Patient Names",
        description: "Join charges to patients.",
        goal: "Return charge_id, first_name, and amount.",
        starterQuery: "SELECT c.charge_id, p.first_name, c.amount FROM charges c JOIN patients p ON c.patient_id = p.patient_id;",
        solutionQuery: "SELECT c.charge_id, p.first_name, c.amount FROM charges c JOIN patients p ON c.patient_id = p.patient_id;",
        hint: "Join charges to patients using patient_id.",
        relevantTables: ["charges", "patients"],
        joinHint: "charges.patient_id = patients.patient_id",
        difficulty: "Hard"
    },
    {
        title: "Level 16: Claims with Encounter Departments",
        description: "Join claims to encounters.",
        goal: "Return claim_id, department, and billed_amount.",
        starterQuery: "SELECT c.claim_id, e.department, c.billed_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id;",
        solutionQuery: "SELECT c.claim_id, e.department, c.billed_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id;",
        hint: "Join claims to encounters using encounter_id.",
        relevantTables: ["claims", "encounters"],
        joinHint: "claims.encounter_id = encounters.encounter_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 17: Charges by Department",
        description: "Sum charges by encounter department.",
        goal: "Return department and total_amount.",
        starterQuery: "SELECT e.department, SUM(c.amount) AS total_amount FROM charges c JOIN encounters e ON c.encounter_id = e.encounter_id GROUP BY e.department;",
        solutionQuery: "SELECT e.department, SUM(c.amount) AS total_amount FROM charges c JOIN encounters e ON c.encounter_id = e.encounter_id GROUP BY e.department;",
        hint: "Join charges to encounters, then group by department.",
        relevantTables: ["charges", "encounters"],
        joinHint: "charges.encounter_id = encounters.encounter_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 18: Appointments with Providers",
        description: "Join appointments to providers.",
        goal: "Return appointment_id, provider_name, and appointment status.",
        starterQuery: "SELECT a.appointment_id, pr.provider_name, a.status FROM appointments a JOIN providers pr ON a.provider_id = pr.provider_id;",
        solutionQuery: "SELECT a.appointment_id, pr.provider_name, a.status FROM appointments a JOIN providers pr ON a.provider_id = pr.provider_id;",
        hint: "Join appointments to providers using provider_id.",
        relevantTables: ["appointments", "providers"],
        joinHint: "appointments.provider_id = providers.provider_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 19: Medicare Claims",
        description: "Join claims to patients and return only Medicare patients.",
        goal: "Return claim_id, first_name, and payer for Medicare patients.",
        starterQuery: "SELECT c.claim_id, p.first_name, c.payer FROM claims c JOIN patients p ON c.patient_id = p.patient_id WHERE p.insurance_type = 'Medicare';",
        solutionQuery: "SELECT c.claim_id, p.first_name, c.payer FROM claims c JOIN patients p ON c.patient_id = p.patient_id WHERE p.insurance_type = 'Medicare';",
        hint: "Join claims to patients, then filter patients to Medicare.",
        relevantTables: ["claims", "patients"],
        joinHint: "claims.patient_id = patients.patient_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 20: Active Encounters with Providers",
        description: "Join encounters to providers and filter active encounters.",
        goal: "Return encounter_id, provider_name, and status for active encounters.",
        starterQuery: "SELECT e.encounter_id, pr.provider_name, e.status FROM encounters e JOIN providers pr ON e.provider_id = pr.provider_id WHERE e.status = 'Active';",
        solutionQuery: "SELECT e.encounter_id, pr.provider_name, e.status FROM encounters e JOIN providers pr ON e.provider_id = pr.provider_id WHERE e.status = 'Active';",
        hint: "Join encounters to providers, then filter status to Active.",
        relevantTables: ["encounters", "providers"],
        joinHint: "encounters.provider_id = providers.provider_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 21: Family Medicine Appointments",
        description: "Find appointments for Family Medicine providers.",
        goal: "Return appointment_id, provider_name, and specialty for Family Medicine providers.",
        starterQuery: "SELECT a.appointment_id, pr.provider_name, pr.specialty FROM appointments a JOIN providers pr ON a.provider_id = pr.provider_id WHERE pr.specialty = 'Family Medicine';",
        solutionQuery: "SELECT a.appointment_id, pr.provider_name, pr.specialty FROM appointments a JOIN providers pr ON a.provider_id = pr.provider_id WHERE pr.specialty = 'Family Medicine';",
        hint: "Join appointments to providers, then filter specialty.",
        relevantTables: ["appointments", "providers"],
        joinHint: "appointments.provider_id = providers.provider_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 22: Patient Charge Totals",
        description: "Sum total charges by patient.",
        goal: "Return first_name, last_name, and total_amount.",
        starterQuery: "SELECT p.first_name, p.last_name, SUM(c.amount) AS total_amount FROM patients p JOIN charges c ON p.patient_id = c.patient_id GROUP BY p.first_name, p.last_name;",
        solutionQuery: "SELECT p.first_name, p.last_name, SUM(c.amount) AS total_amount FROM patients p JOIN charges c ON p.patient_id = c.patient_id GROUP BY p.first_name, p.last_name;",
        hint: "Join patients to charges, then group by patient name.",
        relevantTables: ["patients", "charges"],
        joinHint: "patients.patient_id = charges.patient_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 23: Claim Totals by Insurance Type",
        description: "Join claims to patients and summarize billed amounts by insurance type.",
        goal: "Return insurance_type and total_billed_amount.",
        starterQuery: "SELECT p.insurance_type, SUM(c.billed_amount) AS total_billed_amount FROM claims c JOIN patients p ON c.patient_id = p.patient_id GROUP BY p.insurance_type;",
        solutionQuery: "SELECT p.insurance_type, SUM(c.billed_amount) AS total_billed_amount FROM claims c JOIN patients p ON c.patient_id = p.patient_id GROUP BY p.insurance_type;",
        hint: "Join claims to patients, then group by insurance_type.",
        relevantTables: ["claims", "patients"],
        joinHint: "claims.patient_id = patients.patient_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 24: Encounter Counts by Provider",
        description: "Count encounters by provider.",
        goal: "Return provider_name and encounter_count.",
        starterQuery: "SELECT pr.provider_name, COUNT(*) AS encounter_count FROM encounters e JOIN providers pr ON e.provider_id = pr.provider_id GROUP BY pr.provider_name;",
        solutionQuery: "SELECT pr.provider_name, COUNT(*) AS encounter_count FROM encounters e JOIN providers pr ON e.provider_id = pr.provider_id GROUP BY pr.provider_name;",
        hint: "Join encounters to providers, then group by provider_name.",
        relevantTables: ["encounters", "providers"],
        joinHint: "encounters.provider_id = providers.provider_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 25: Completed Appointments by Facility",
        description: "Count completed appointments by facility.",
        goal: "Return facility and completed_appointment_count.",
        starterQuery: "SELECT facility, COUNT(*) AS completed_appointment_count FROM appointments WHERE status = 'Completed' GROUP BY facility;",
        solutionQuery: "SELECT facility, COUNT(*) AS completed_appointment_count FROM appointments WHERE status = 'Completed' GROUP BY facility;",
        hint: "Filter appointments to Completed, then group by facility.",
        relevantTables: ["appointments"],
        joinHint: "No join needed.",
        difficulty: "Advanced"
    },
    {
        title: "Level 26: Denied Claims with Patient Names",
        description: "Return denied claims and patient names.",
        goal: "Return claim_id, first_name, last_name, and billed_amount for denied claims.",
        starterQuery: "SELECT c.claim_id, p.first_name, p.last_name, c.billed_amount FROM claims c JOIN patients p ON c.patient_id = p.patient_id WHERE c.claim_status = 'Denied';",
        solutionQuery: "SELECT c.claim_id, p.first_name, p.last_name, c.billed_amount FROM claims c JOIN patients p ON c.patient_id = p.patient_id WHERE c.claim_status = 'Denied';",
        hint: "Join claims to patients, then filter denied claims.",
        relevantTables: ["claims", "patients"],
        joinHint: "claims.patient_id = patients.patient_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 27: Waccamaw Encounter Departments",
        description: "Return Waccamaw encounter departments and patients.",
        goal: "Return encounter_id, department, and first_name for Waccamaw encounters.",
        starterQuery: "SELECT e.encounter_id, e.department, p.first_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id WHERE e.facility = 'Waccamaw';",
        solutionQuery: "SELECT e.encounter_id, e.department, p.first_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id WHERE e.facility = 'Waccamaw';",
        hint: "Join encounters to patients, then filter facility to Waccamaw.",
        relevantTables: ["encounters", "patients"],
        joinHint: "encounters.patient_id = patients.patient_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 28: Commercial Charge Totals",
        description: "Sum charges for Commercial payers.",
        goal: "Return payer and total_amount for Commercial charges.",
        starterQuery: "SELECT payer, SUM(amount) AS total_amount FROM charges WHERE payer = 'Commercial' GROUP BY payer;",
        solutionQuery: "SELECT payer, SUM(amount) AS total_amount FROM charges WHERE payer = 'Commercial' GROUP BY payer;",
        hint: "Filter charges to Commercial, then sum amount.",
        relevantTables: ["charges"],
        joinHint: "No join needed.",
        difficulty: "Advanced"
    },
    {
        title: "Level 29: Neurology Providers with Encounters",
        description: "Return Neurology providers and their encounters.",
        goal: "Return encounter_id, provider_name, and specialty for Neurology providers.",
        starterQuery: "SELECT e.encounter_id, pr.provider_name, pr.specialty FROM encounters e JOIN providers pr ON e.provider_id = pr.provider_id WHERE pr.specialty = 'Neurology';",
        solutionQuery: "SELECT e.encounter_id, pr.provider_name, pr.specialty FROM encounters e JOIN providers pr ON e.provider_id = pr.provider_id WHERE pr.specialty = 'Neurology';",
        hint: "Join encounters to providers, then filter specialty to Neurology.",
        relevantTables: ["encounters", "providers"],
        joinHint: "encounters.provider_id = providers.provider_id",
        difficulty: "Advanced"
    },
    {
        title: "Level 30: Final Mastery Query",
        description: "Join patients and claims for denied Medicare claims.",
        goal: "Return first_name, last_name, payer, and billed_amount for denied Medicare claims.",
        starterQuery: "SELECT p.first_name, p.last_name, c.payer, c.billed_amount FROM patients p JOIN claims c ON p.patient_id = c.patient_id WHERE p.insurance_type = 'Medicare' AND c.claim_status = 'Denied';",
        solutionQuery: "SELECT p.first_name, p.last_name, c.payer, c.billed_amount FROM patients p JOIN claims c ON p.patient_id = c.patient_id WHERE p.insurance_type = 'Medicare' AND c.claim_status = 'Denied';",
        hint: "Join patients to claims, then filter Medicare and Denied.",
        relevantTables: ["patients", "claims"],
        joinHint: "patients.patient_id = claims.patient_id",
        difficulty: "Advanced"
    }
];

function normalizeSql(sql) {
    return sql
        .trim()
        .replace(/;$/, "")
        .replace(/\s+/g, " ")
        .toLowerCase();
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        gameState.currentLevel = typeof parsed.currentLevel === "number" ? parsed.currentLevel : 0;
        gameState.completedLevels = Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [];
        gameState.firstTryLevels = Array.isArray(parsed.firstTryLevels) ? parsed.firstTryLevels : [];
    } catch (error) {
        console.error("Failed to load progress", error);
    }
}

function getCompletedCount() {
    return gameState.completedLevels.length;
}

function getBadgeCount() {
    return getAchievements().filter(a => a.earned).length;
}

function isCompleted(levelIndex) {
    return gameState.completedLevels.includes(levelIndex);
}

function isFirstTry(levelIndex) {
    return gameState.firstTryLevels.includes(levelIndex);
}

function markCompleted(levelIndex) {
    if (!isCompleted(levelIndex)) {
        gameState.completedLevels.push(levelIndex);
    }
}

function markFirstTry(levelIndex) {
    if (!isFirstTry(levelIndex)) {
        gameState.firstTryLevels.push(levelIndex);
    }
}

function getAchievements() {
    const completed = getCompletedCount();
    const firstTry = gameState.firstTryLevels.length;

    return [
        { label: "First Query", earned: completed >= 1 || firstTry >= 1 },
        { label: "First Win", earned: completed >= 1 },
        { label: "3 Levels Cleared", earned: completed >= 3 },
        { label: "5 Levels Cleared", earned: completed >= 5 },
        { label: "10 Levels Cleared", earned: completed >= 10 },
        { label: "15 Levels Cleared", earned: completed >= 15 },
        { label: "20 Levels Cleared", earned: completed >= 20 },
        { label: "30 Levels Cleared", earned: completed >= 30 },
        { label: "3 First-Try Wins", earned: firstTry >= 3 }
    ];
}

function updateDashboard() {
    const completedCount = getCompletedCount();
    const progressText = document.getElementById("progress-text");
    const progressBar = document.getElementById("progress-bar");
    const currentLevelDisplay = document.getElementById("current-level-display");
    const badgeCount = document.getElementById("badge-count");

    if (progressText) {
        progressText.innerText = `${completedCount} / ${levels.length} levels completed`;
    }

    if (progressBar) {
        progressBar.style.width = `${(completedCount / levels.length) * 100}%`;
    }

    if (currentLevelDisplay) {
        currentLevelDisplay.innerText = levels[currentLevel].title;
    }

    if (badgeCount) {
        badgeCount.innerText = `${getBadgeCount()} earned`;
    }
}

function renderAchievements() {
    const container = document.getElementById("badges-container");
    if (!container) return;

    container.innerHTML = "";
    getAchievements().forEach((achievement) => {
        const chip = document.createElement("div");
        chip.className = achievement.earned ? "badge-chip" : "badge-chip locked";
        chip.innerText = `${achievement.earned ? "🏅" : "🔒"} ${achievement.label}`;
        container.appendChild(chip);
    });
}

function difficultyClass(difficulty) {
    return `difficulty-${difficulty.toLowerCase()}`;
}

function renderLevelsPanel() {
    const panel = document.getElementById("levels-panel");
    if (!panel) return;

    panel.innerHTML = "";

    levels.forEach((level, index) => {
        const item = document.createElement("button");
        item.className = "level-item";

        if (index === currentLevel) item.classList.add("current");
        if (isCompleted(index)) item.classList.add("completed");

        item.innerHTML = `
            <div class="level-item-head">
                <span class="level-item-title">${level.title}</span>
                <span class="difficulty-badge ${difficultyClass(level.difficulty)}">${level.difficulty}</span>
            </div>
            <span class="level-status">${isCompleted(index) ? "Completed" : "Available"}</span>
        `;

        item.addEventListener("click", function () {
            loadLevel(index);
        });

        panel.appendChild(item);
    });
}

function buildPreviewTable(columns, rows) {
    let html = "<table class='preview-table'><tr>";
    columns.forEach((column) => {
        html += `<th>${column}</th>`;
    });
    html += "</tr>";

    rows.forEach((row) => {
        html += "<tr>";
        row.forEach((cell) => {
            html += `<td>${cell}</td>`;
        });
        html += "</tr>";
    });

    html += "</table>";
    return html;
}

function renderSchemaTables() {
    const container = document.getElementById("schema-tables");
    if (!container) return;

    container.innerHTML = "";

    schema.tables.forEach((table) => {
        const details = document.createElement("details");
        details.className = "schema-card";
        details.id = `schema-${table.name}`;

        details.innerHTML = `
            <summary>${table.name}</summary>
            <p><strong>Description:</strong> ${table.description}</p>
            <p><strong>Keys:</strong> ${table.keyColumns.join(", ")}</p>
            <p><strong>Columns:</strong> ${table.notableColumns.join(", ")}</p>
            <div class="schema-table-actions">
                <button class="schema-table-view-btn" onclick="openTableModal('${table.name}')">Open Table Viewer</button>
            </div>
            ${buildPreviewTable(table.notableColumns, table.sampleRows)}
        `;

        container.appendChild(details);
    });
}

function renderRelationships() {
    const container = document.getElementById("schema-relationships");
    if (!container) return;

    container.innerHTML = "";
    schema.relationships.forEach((relationship) => {
        const item = document.createElement("div");
        item.className = "relationship-item";
        item.innerText = relationship;
        container.appendChild(item);
    });
}

function renderSchema() {
    renderSchemaTables();
    renderRelationships();
}

function getTableByName(name) {
    return schema.tables.find((table) => table.name === name);
}

function relatedRelationships(tableName) {
    return schema.relationships.filter((relationship) => relationship.includes(`${tableName}.`));
}

function openTableModal(tableName) {
    const table = getTableByName(tableName);
    if (!table) return;

    document.getElementById("table-modal-title").innerText = table.name;
    document.getElementById("table-modal-description").innerText = table.description;
    document.getElementById("table-modal-keys").innerText = table.keyColumns.join(", ");
    document.getElementById("table-modal-columns").innerText = table.notableColumns.join(", ");

    const relationshipWrap = document.getElementById("table-modal-relationships");
    relationshipWrap.innerHTML = "";
    relatedRelationships(table.name).forEach((relationship) => {
        const chip = document.createElement("div");
        chip.className = "modal-relationship-chip";
        chip.innerText = relationship;
        relationshipWrap.appendChild(chip);
    });

    document.getElementById("table-modal-preview-content").innerHTML =
        buildPreviewTable(table.notableColumns, table.sampleRows);

    document.getElementById("table-modal-overlay").classList.remove("hidden");
}

function closeTableModal(event) {
    if (event && event.target && event.target.id !== "table-modal-overlay") return;
    document.getElementById("table-modal-overlay").classList.add("hidden");
}

function updateMissionBox() {
    const level = levels[currentLevel];

    document.getElementById("level-title").innerText = level.title;
    document.getElementById("level-desc").innerText = level.description;
    document.getElementById("level-goal").innerHTML = `<strong>Goal:</strong> ${level.goal}`;
    document.getElementById("level-tables").innerHTML = `<strong>Relevant Tables:</strong> ${level.relevantTables.join(", ")}`;
    document.getElementById("level-join-hint").innerHTML = `<strong>Join Hint:</strong> ${level.joinHint}`;

    const difficultyBadge = document.getElementById("current-difficulty-badge");
    difficultyBadge.className = `difficulty-badge ${difficultyClass(level.difficulty)}`;
    difficultyBadge.innerText = level.difficulty;
}

function highlightRelevantSchema() {
    document.querySelectorAll(".schema-card").forEach((card) => {
        card.open = false;
    });

    levels[currentLevel].relevantTables.forEach((tableName) => {
        const card = document.getElementById(`schema-${tableName}`);
        if (card) card.open = true;
    });
}

function loadLevel(index) {
    currentLevel = index;
    gameState.currentLevel = index;
    attempts = 0;
    lastRunQuery = "";

    updateMissionBox();
    highlightRelevantSchema();
    renderLevelsPanel();
    updateDashboard();

    document.getElementById("query").value = levels[currentLevel].starterQuery;
    document.getElementById("feedback").innerHTML = "";
    document.getElementById("output").innerHTML = "";
    document.getElementById("level-hint").innerText =
        "Run your query and check your answer. After two wrong tries, you'll get a targeted hint. After the third wrong try, the answer will be shown.";

    saveProgress();
}

function resetQuery() {
    document.getElementById("query").value = levels[currentLevel].starterQuery;
    document.getElementById("feedback").innerHTML = "";
    document.getElementById("output").innerHTML = "";
}

function runQuery() {
    const query = document.getElementById("query").value.trim();
    lastRunQuery = query;

    const output = document.getElementById("output");
    if (!query) {
        output.innerHTML = "<p>Please enter a SQL query first.</p>";
        return;
    }

    output.innerHTML = `
        <p><strong>Query executed (simulation).</strong></p>
        <p><code>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></p>
    `;
}

function checkAnswer() {
    const query = document.getElementById("query").value.trim();
    const feedback = document.getElementById("feedback");
    const hint = document.getElementById("level-hint");
    const solution = levels[currentLevel].solutionQuery;

    if (!query) {
        feedback.innerHTML = "<p style='color:#dc2626; font-weight:700;'>Please enter a query first.</p>";
        return;
    }

    attempts += 1;

    const userSql = normalizeSql(query);
    const solutionSql = normalizeSql(solution);

    if (userSql === solutionSql) {
        feedback.innerHTML = "<p style='color:#16a34a; font-weight:700;'>✅ Correct!</p>";

        markCompleted(currentLevel);
        if (attempts === 1) {
            markFirstTry(currentLevel);
        }

        renderAchievements();
        renderLevelsPanel();
        updateDashboard();
        saveProgress();
        return;
    }

    feedback.innerHTML = "<p style='color:#dc2626; font-weight:700;'>❌ Not quite.</p>";

    if (attempts === 2) {
        hint.innerText = `Hint: ${levels[currentLevel].hint}`;
    } else if (attempts >= 3) {
        hint.innerText = `Answer: ${levels[currentLevel].solutionQuery}`;
    }
}

function nextLevel() {
    if (currentLevel < levels.length - 1) {
        loadLevel(currentLevel + 1);
    }
}

function prevLevel() {
    if (currentLevel > 0) {
        loadLevel(currentLevel - 1);
    }
}

function resetAllProgress() {
    localStorage.removeItem(STORAGE_KEY);
    gameState = {
        currentLevel: 0,
        completedLevels: [],
        firstTryLevels: []
    };
    currentLevel = 0;
    attempts = 0;
    lastRunQuery = "";

    renderAchievements();
    renderLevelsPanel();
    updateDashboard();
    loadLevel(0);
}

window.onload = function () {
    loadProgress();
    currentLevel = gameState.currentLevel || 0;
    renderSchema();
    renderAchievements();
    renderLevelsPanel();
    updateDashboard();
    loadLevel(currentLevel);
};

window.runQuery = runQuery;
window.checkAnswer = checkAnswer;
window.resetQuery = resetQuery;
window.nextLevel = nextLevel;
window.prevLevel = prevLevel;
window.resetAllProgress = resetAllProgress;
window.openTableModal = openTableModal;
window.closeTableModal = closeTableModal;
