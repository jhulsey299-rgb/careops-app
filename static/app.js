// ======================
// CAREOPS SQL ANALYST
// TRACK 1 FULL BUILD
// PART 1 OF 4
// STATE, SCHEMA, MOCK DATA, AND CURRICULUM FOUNDATION
// ======================

// ======================
// STORAGE KEY
// ======================
const STORAGE_KEY = "careops_curriculum_track1_full_v1";

// ======================
// APPLICATION STATE
// ======================
let appState = {
    currentTrackId: "track_sql_foundations_hospital",
    currentCategoryId: null,
    currentLessonId: null,
    completedLessonIds: [],
    firstTryLessonIds: [],
    schemaPanelWidth: 320,
    lessonStats: {}
};

// SQL Engine Globals (initialized in later parts)
let SQL = null;
let sqlDb = null;
let sqlEngineReady = false;

// ======================
// LESSON RUNTIME STATE
// ======================
let attempts = 0;
let lastRunQuery = "";

// ======================
// SCHEMA DEFINITION
// ======================
const schema = {
    tables: [
        {
            name: "patients",
            description: "Patient demographic, insurance, and risk information.",
            keyColumns: ["patient_id"],
            notableColumns: [
                "patient_id",
                "first_name",
                "last_name",
                "age",
                "gender",
                "insurance_type",
                "risk_score",
                "city"
            ],
            sampleRows: []
        },
        {
            name: "providers",
            description: "Provider names, specialties, and facility assignments.",
            keyColumns: ["provider_id"],
            notableColumns: [
                "provider_id",
                "provider_name",
                "specialty",
                "facility"
            ],
            sampleRows: []
        },
        {
            name: "departments",
            description: "Hospital and clinic departments by facility and service line.",
            keyColumns: ["department_id"],
            notableColumns: [
                "department_id",
                "department_name",
                "facility",
                "service_line"
            ],
            sampleRows: []
        },
        {
            name: "encounters",
            description: "Patient encounters tied to providers and departments.",
            keyColumns: ["encounter_id"],
            notableColumns: [
                "encounter_id",
                "patient_id",
                "provider_id",
                "department_id",
                "facility",
                "department",
                "status",
                "encounter_type",
                "length_of_stay",
                "admit_date",
                "discharge_date"
            ],
            sampleRows: []
        },
        {
            name: "appointments",
            description: "Scheduled appointments tied to patients and providers.",
            keyColumns: ["appointment_id"],
            notableColumns: [
                "appointment_id",
                "patient_id",
                "provider_id",
                "department_id",
                "facility",
                "department",
                "status",
                "date"
            ],
            sampleRows: []
        },
        {
            name: "charges",
            description: "Financial charges tied to patients and encounters.",
            keyColumns: ["charge_id"],
            notableColumns: [
                "charge_id",
                "patient_id",
                "encounter_id",
                "amount",
                "payer",
                "charge_type"
            ],
            sampleRows: []
        },
        {
            name: "claims",
            description: "Claims tied to patients and encounters.",
            keyColumns: ["claim_id"],
            notableColumns: [
                "claim_id",
                "patient_id",
                "encounter_id",
                "payer",
                "claim_status",
                "billed_amount"
            ],
            sampleRows: []
        },
        {
            name: "discharges",
            description: "Discharge workflow details including delays and disposition.",
            keyColumns: ["discharge_id"],
            notableColumns: [
                "discharge_id",
                "encounter_id",
                "patient_id",
                "facility",
                "department",
                "discharge_disposition",
                "discharge_order_minutes",
                "departure_minutes",
                "delayed_for_transport"
            ],
            sampleRows: []
        },
        {
            name: "readmissions",
            description: "Thirty-day readmission tracking.",
            keyColumns: ["readmission_id"],
            notableColumns: [
                "readmission_id",
                "index_encounter_id",
                "readmit_encounter_id",
                "patient_id",
                "facility",
                "readmit_within_30_days",
                "days_to_readmit"
            ],
            sampleRows: []
        },
        {
            name: "observations",
            description: "Observation stays and conversion details.",
            keyColumns: ["observation_id"],
            notableColumns: [
                "observation_id",
                "encounter_id",
                "patient_id",
                "facility",
                "department",
                "obs_hours",
                "converted_to_inpatient",
                "code_44_flag"
            ],
            sampleRows: []
        }
    ],
    relationships: [
        "patients.patient_id = encounters.patient_id",
        "patients.patient_id = appointments.patient_id",
        "patients.patient_id = charges.patient_id",
        "patients.patient_id = claims.patient_id",
        "providers.provider_id = encounters.provider_id",
        "providers.provider_id = appointments.provider_id",
        "departments.department_id = encounters.department_id",
        "departments.department_id = appointments.department_id",
        "encounters.encounter_id = charges.encounter_id",
        "encounters.encounter_id = claims.encounter_id",
        "encounters.encounter_id = discharges.encounter_id",
        "encounters.encounter_id = observations.encounter_id",
        "encounters.encounter_id = readmissions.index_encounter_id",
        "encounters.encounter_id = readmissions.readmit_encounter_id"
    ]
};

// ======================
// MOCK DATA GENERATION
// ======================
function generateMockCell(tableName, columnName, rowNum) {
    const facilities = ["Waccamaw", "Georgetown"];
    const departments = [
        "Cardiology", "ER", "Family Medicine", "Neurology",
        "Orthopedics", "Oncology", "Pediatrics", "ICU",
        "Med Surg", "Observation"
    ];
    const firstNames = [
        "Alice", "James", "Olivia", "Daniel", "Sophia",
        "Liam", "Emma", "Noah", "Ava", "Mason"
    ];
    const lastNames = [
        "Smith", "Johnson", "Brown", "Miller", "Wilson",
        "Taylor", "Anderson", "Thomas", "Jackson", "White"
    ];
    const insurance = ["Medicare", "Commercial", "Medicaid", "Self Pay"];
    const payers = ["Medicare", "Commercial", "Medicaid", "BCBS", "Aetna"];
    const claimStatuses = ["Denied", "Paid", "Pending"];
    const encounterTypes = ["Inpatient", "Emergency", "Outpatient", "Observation"];

    switch (columnName) {
        case "patient_id": return rowNum;
        case "provider_id": return 100 + rowNum;
        case "department_id": return 500 + rowNum;
        case "encounter_id": return 1000 + rowNum;
        case "appointment_id": return 2000 + rowNum;
        case "charge_id": return 3000 + rowNum;
        case "claim_id": return 4000 + rowNum;
        case "discharge_id": return 5000 + rowNum;
        case "readmission_id": return 6000 + rowNum;
        case "observation_id": return 7000 + rowNum;
        case "first_name": return firstNames[rowNum % firstNames.length];
        case "last_name": return lastNames[rowNum % lastNames.length];
        case "facility": return facilities[rowNum % facilities.length];
        case "department":
        case "department_name":
            return departments[rowNum % departments.length];
        case "insurance_type": return insurance[rowNum % insurance.length];
        case "payer": return payers[rowNum % payers.length];
        case "claim_status": return claimStatuses[rowNum % claimStatuses.length];
        case "encounter_type": return encounterTypes[rowNum % encounterTypes.length];
        case "age": return 18 + (rowNum % 70);
        case "risk_score": return 30 + (rowNum % 60);
        case "length_of_stay": return Number((0.5 + (rowNum % 7)).toFixed(1));
        case "amount":
        case "billed_amount":
            return 250 + rowNum * 175;
        case "delayed_for_transport": return rowNum % 4 === 0 ? 1 : 0;
        case "readmit_within_30_days": return rowNum % 5 === 0 ? 0 : 1;
        case "converted_to_inpatient": return rowNum % 3 === 0 ? 1 : 0;
        case "code_44_flag": return rowNum % 6 === 0 ? 1 : 0;
        default:
            if (columnName.includes("date")) {
                const day = String((rowNum % 28) + 1).padStart(2, "0");
                return `2026-04-${day}`;
            }
            return `${tableName}_${columnName}_${rowNum}`;
    }
}

function buildSampleRows(table, rowCount = 80) {
    const rows = [];
    for (let i = 1; i <= rowCount; i++) {
        rows.push(
            table.notableColumns.map(col =>
                generateMockCell(table.name, col, i)
            )
        );
    }
    return rows;
}

schema.tables.forEach(table => {
    table.sampleRows = buildSampleRows(table);
});

// ======================
// LESSON BUILDER FUNCTIONS
// ======================
function conceptLesson(
    id,
    title,
    objective,
    sql_focus,
    relevantTables,
    joinHint,
    summary,
    bullets,
    hospitalExample,
    executiveTakeaway = null
) {
    return {
        id,
        type: "concept",
        title,
        objective,
        sql_focus,
        relevantTables,
        joinHint,
        content: { summary, bullets, hospitalExample },
        executiveTakeaway
    };
}

function challengeLesson(
    id,
    title,
    objective,
    sql_focus,
    relevantTables,
    joinHint,
    starterQuery,
    solutionQuery,
    hint,
    executiveTakeaway = null
) {
    return {
        id,
        type: "challenge",
        title,
        objective,
        sql_focus,
        relevantTables,
        joinHint,
        starterQuery,
        solutionQuery,
        hint,
        executiveTakeaway
    };
}

function scenarioLesson(
    id,
    title,
    objective,
    relevantTables,
    joinHint,
    summary,
    prompt,
    expectedAnswer,
    executiveTakeaway = null
) {
    return {
        id,
        type: "scenario",
        title,
        objective,
        sql_focus: [],
        relevantTables,
        joinHint,
        content: { summary, prompt, expectedAnswer },
        executiveTakeaway
    };
}

// ======================
// INITIAL CURRICULUM (FIRST CATEGORY)
// Remaining categories will be added in Parts 2–4
// ======================
const curriculum = [
    {
        id: "track_sql_foundations_hospital",
        title: "SQL Foundations for Hospital Data",
        description:
            "Learn SQL through real hospital analytics scenarios focused on operations, finance, access, throughput, and executive reporting.",
        order: 1,
        categories: [
            {
                id: "getting_started",
                title: "Getting Started",
                order: 1,
                lessons: [
                    conceptLesson(
                        "gs_01",
                        "What Hospital Data Looks Like",
                        "Understand the core hospital tables and how analysts think about them.",
                        [],
                        ["patients", "encounters", "claims", "charges"],
                        "No join needed.",
                        "Hospital analytics usually starts with patients, encounters, finance, and workflow tables.",
                        [
                            "Patients describe who the person is",
                            "Encounters describe what happened clinically",
                            "Claims and charges represent the financial side",
                            "Operational tables explain why metrics move"
                        ],
                        "A denial or readmission rate always originates from a defined data model."
                    ),
                    challengeLesson(
                        "gs_02",
                        "View Patients",
                        "Return all rows and columns from patients.",
                        ["SELECT"],
                        ["patients"],
                        "No join needed.",
                        "SELECT * FROM patients;",
                        "SELECT * FROM patients;",
                        "Use SELECT * FROM patients;"
                    ),
                    challengeLesson(
                        "gs_03",
                        "View Encounters",
                        "Return all rows and columns from encounters.",
                        ["SELECT"],
                        ["encounters"],
                        "No join needed.",
                        "SELECT * FROM encounters;",
                        "SELECT * FROM encounters;",
                        "Use SELECT * FROM encounters;"
                    ),
                    challengeLesson(
                        "gs_04",
                        "View Claims",
                        "Return all rows and columns from claims.",
                        ["SELECT"],
                        ["claims"],
                        "No join needed.",
                        "SELECT * FROM claims;",
                        "SELECT * FROM claims;",
                        "Use SELECT * FROM claims;"
                    ),
                    scenarioLesson(
                        "gs_05",
                        "Choose the Right Table",
                        "Identify the correct table for a denial question.",
                        ["claims", "patients"],
                        "Think about where denial status lives.",
                        "Picking the correct source table is the first analyst skill.",
                        "Where should you start if leadership asks for denied claims by payer?",
                        "claims"
                    )
                ]
            }
        ]
    }
];

// ======================
// HELPER FUNCTIONS
// ======================
function getTrack() {
    return curriculum.find(t => t.id === appState.currentTrackId);
}

function getAllCategories() {
    return getTrack().categories || [];
}

function getAllLessons() {
    return getAllCategories().flatMap(category =>
        category.lessons.map(lesson => ({
            categoryId: category.id,
            categoryTitle: category.title,
            lesson
        }))
    );
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        appState = { ...appState, ...parsed };
    } catch (error) {
        console.warn("Failed to load progress:", error);
    }
}

// ======================
// INITIALIZATION
// ======================

// ======================
// PART 2 OF 4
// SQL ENGINE, RESULT HELPERS, GRADING ENGINE
// ======================

// ======================
// SQLITE ENGINE HELPERS
// ======================
function inferSqliteType(columnName) {
    const col = String(columnName || "").toLowerCase();

    if (
        col.endsWith("_id") ||
        col === "age" ||
        col === "risk_score" ||
        col === "amount" ||
        col === "billed_amount" ||
        col === "discharge_order_minutes" ||
        col === "departure_minutes" ||
        col === "days_to_readmit" ||
        col === "obs_hours" ||
        col === "delayed_for_transport" ||
        col === "readmit_within_30_days" ||
        col === "converted_to_inpatient" ||
        col === "code_44_flag"
    ) {
        return "INTEGER";
    }

    if (col === "length_of_stay") {
        return "REAL";
    }

    return "TEXT";
}

function escapeSqlString(value) {
    return String(value).replace(/'/g, "''");
}

async function initializeSqlEngine() {
    if (sqlEngineReady && sqlDb) return;

    if (typeof window.initSqlJs !== "function") {
        throw new Error("sql.js library was not found on the page.");
    }

    SQL = await window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    sqlDb = new SQL.Database();

    schema.tables.forEach(table => {
        const columnDefs = table.notableColumns.map(columnName => {
            const type = inferSqliteType(columnName);
            return `${columnName} ${type}`;
        });

        const createSql = `CREATE TABLE ${table.name} (${columnDefs.join(", ")});`;
        sqlDb.run(createSql);

        table.sampleRows.forEach(row => {
            const valuesSql = row.map(cell => {
                if (cell === null || cell === undefined) return "NULL";
                if (typeof cell === "number") return String(cell);
                return `'${escapeSqlString(cell)}'`;
            });

            const insertSql = `
                INSERT INTO ${table.name} (${table.notableColumns.join(", ")})
                VALUES (${valuesSql.join(", ")});
            `;
            sqlDb.run(insertSql);
        });
    });

    sqlEngineReady = true;
}

function executeSqlAgainstDb(sql) {
    if (!sqlDb) {
        throw new Error("SQL engine is not initialized.");
    }

    const cleanedSql = String(sql || "").trim();
    if (!cleanedSql) {
        return { columns: [], rows: [] };
    }

    const results = sqlDb.exec(cleanedSql);

    if (!results || results.length === 0) {
        return { columns: [], rows: [] };
    }

    const first = results[0];
    return {
        columns: first.columns || [],
        rows: first.values || []
    };
}

// ======================
// RESULT DISPLAY HELPERS
// ======================
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildResultTable(columns, rows) {
    let html = "<div class='query-results-table-wrap'><table class='preview-table'><thead><tr>";

    columns.forEach(column => {
        html += `<th>${escapeHtml(column)}</th>`;
    });

    html += "</tr></thead><tbody>";

    rows.forEach(row => {
        html += "<tr>";
        row.forEach(cell => {
            html += `<td>${cell === null ? "NULL" : escapeHtml(cell)}</td>`;
        });
        html += "</tr>";
    });

    html += "</tbody></table></div>";
    return html;
}

function buildPreviewTable(columns, rows) {
    let html = "<table class='preview-table'><tr>";

    columns.forEach(column => {
        html += `<th>${escapeHtml(column)}</th>`;
    });

    html += "</tr>";

    rows.forEach(row => {
        html += "<tr>";
        row.forEach(cell => {
            html += `<td>${cell === null ? "NULL" : escapeHtml(cell)}</td>`;
        });
        html += "</tr>";
    });

    html += "</table>";
    return html;
}

// ======================
// SQL NORMALIZATION + COMPARISON
// ======================
function normalizeSql(sql) {
    return String(sql || "")
        .trim()
        .replace(/;$/, "")
        .replace(/\s+/g, " ")
        .toLowerCase();
}

function canonicalizeValue(value) {
    if (value === null || value === undefined) return "null";
    if (typeof value === "number") return Number(value).toString();
    return String(value).trim().toLowerCase();
}

function canonicalizeRows(rows) {
    return rows
        .map(row => row.map(canonicalizeValue))
        .map(row => JSON.stringify(row))
        .sort();
}

function areRowSetsEqual(rowsA, rowsB) {
    if (rowsA.length !== rowsB.length) return false;

    const a = canonicalizeRows(rowsA);
    const b = canonicalizeRows(rowsB);

    for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return false;
    }

    return true;
}

function normalizedColumnName(name) {
    return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
}

function areColumnsEquivalent(userColumns, solutionColumns) {
    if (userColumns.length !== solutionColumns.length) return false;

    const userNormalized = userColumns.map(normalizedColumnName).sort();
    const solutionNormalized = solutionColumns.map(normalizedColumnName).sort();

    for (let i = 0; i < userNormalized.length; i += 1) {
        if (userNormalized[i] !== solutionNormalized[i]) return false;
    }

    return true;
}

function computeRowMatchPercent(userRows, solutionRows) {
    if (!solutionRows.length && !userRows.length) return 100;
    if (!solutionRows.length) return 0;

    const userSet = canonicalizeRows(userRows);
    const solutionSet = canonicalizeRows(solutionRows);

    let matches = 0;
    const used = new Set();

    solutionSet.forEach(solutionRow => {
        for (let i = 0; i < userSet.length; i += 1) {
            if (used.has(i)) continue;
            if (userSet[i] === solutionRow) {
                used.add(i);
                matches += 1;
                break;
            }
        }
    });

    return Math.round((matches / solutionSet.length) * 100);
}

// ======================
// TABLE DETECTION + SQL STRUCTURE
// ======================
function detectTablesFromSql(sql) {
    if (!sql) return [];

    const lowered = String(sql).toLowerCase();
    const found = [];

    schema.tables.forEach(table => {
        const tableName = table.name.toLowerCase();
        const patterns = [
            new RegExp(`\\bfrom\\s+${tableName}\\b`, "i"),
            new RegExp(`\\bjoin\\s+${tableName}\\b`, "i"),
            new RegExp(`\\bupdate\\s+${tableName}\\b`, "i"),
            new RegExp(`\\binto\\s+${tableName}\\b`, "i"),
            new RegExp(`\\bdelete\\s+from\\s+${tableName}\\b`, "i")
        ];

        if (patterns.some(pattern => pattern.test(lowered))) {
            found.push(table.name);
        }
    });

    return [...new Set(found)];
}

function analyzeSqlStructure(sql) {
    const normalized = normalizeSql(sql);

    return {
        sql: normalized,
        hasSelect: /\bselect\b/.test(normalized),
        hasFrom: /\bfrom\b/.test(normalized),
        hasWhere: /\bwhere\b/.test(normalized),
        hasOrderBy: /\border by\b/.test(normalized),
        hasGroupBy: /\bgroup by\b/.test(normalized),
        hasHaving: /\bhaving\b/.test(normalized),
        hasJoin: /\bjoin\b/.test(normalized),
        hasLeftJoin: /\bleft join\b/.test(normalized),
        hasCase: /\bcase\b/.test(normalized),
        hasAvg: /\bavg\s*\(/.test(normalized),
        hasSum: /\bsum\s*\(/.test(normalized),
        hasCount: /\bcount\s*\(/.test(normalized),
        hasRound: /\bround\s*\(/.test(normalized),
        hasCoalesce: /\bcoalesce\s*\(/.test(normalized),
        hasUpper: /\bupper\s*\(/.test(normalized),
        hasLower: /\blower\s*\(/.test(normalized),
        hasTrim: /\btrim\s*\(/.test(normalized),
        tables: detectTablesFromSql(normalized)
    };
}

// ======================
// GRADING + SCORING
// ======================
function scoreToTier(score) {
    if (score >= 95) return "Perfect";
    if (score >= 80) return "Pass";
    if (score >= 60) return "Almost There";
    return "Needs Work";
}

function tierRank(tier) {
    const map = {
        "Not Started": 0,
        "Needs Work": 1,
        "Almost There": 2,
        "Pass": 3,
        "Perfect": 4
    };
    return map[tier] || 0;
}

function formatPercent(value) {
    return `${Number(value || 0).toFixed(0)}%`;
}

function gradeStructure(userQuery, solutionQuery) {
    const user = analyzeSqlStructure(userQuery);
    const solution = analyzeSqlStructure(solutionQuery);

    const checks = [
        { key: "hasSelect", label: "SELECT" },
        { key: "hasFrom", label: "FROM" },
        { key: "hasWhere", label: "WHERE" },
        { key: "hasOrderBy", label: "ORDER BY" },
        { key: "hasGroupBy", label: "GROUP BY" },
        { key: "hasHaving", label: "HAVING" },
        { key: "hasJoin", label: "JOIN" },
        { key: "hasLeftJoin", label: "LEFT JOIN" },
        { key: "hasCase", label: "CASE" },
        { key: "hasAvg", label: "AVG" },
        { key: "hasSum", label: "SUM" },
        { key: "hasCount", label: "COUNT" },
        { key: "hasRound", label: "ROUND" },
        { key: "hasCoalesce", label: "COALESCE" },
        { key: "hasUpper", label: "UPPER" },
        { key: "hasLower", label: "LOWER" },
        { key: "hasTrim", label: "TRIM" }
    ];

    const relevantChecks = checks.filter(check => solution[check.key] === true);

    if (!relevantChecks.length) {
        return {
            score: 100,
            matched: [],
            missed: []
        };
    }

    const matched = [];
    const missed = [];

    relevantChecks.forEach(check => {
        if (user[check.key]) {
            matched.push(check.label);
        } else {
            missed.push(check.label);
        }
    });

    return {
        score: Math.round((matched.length / relevantChecks.length) * 100),
        matched,
        missed
    };
}

function gradeTableUsage(userQuery, solutionQuery) {
    const userTables = analyzeSqlStructure(userQuery).tables.slice().sort();
    const solutionTables = analyzeSqlStructure(solutionQuery).tables.slice().sort();

    if (!solutionTables.length) {
        return {
            score: 100,
            matched: [],
            missed: [],
            unexpected: []
        };
    }

    const matched = solutionTables.filter(table => userTables.includes(table));
    const missed = solutionTables.filter(table => !userTables.includes(table));
    const unexpected = userTables.filter(table => !solutionTables.includes(table));

    const score = Math.max(
        0,
        Math.round((matched.length / solutionTables.length) * 100) - (unexpected.length * 15)
    );

    return {
        score: Math.max(0, Math.min(100, score)),
        matched,
        missed,
        unexpected
    };
}

function buildGradeResult(userQuery, solutionQuery, userResult, solutionResult) {
    const structure = gradeStructure(userQuery, solutionQuery);
    const tables = gradeTableUsage(userQuery, solutionQuery);

    const columnsMatch = areColumnsEquivalent(userResult.columns, solutionResult.columns);
    const rowsMatch = areRowSetsEqual(userResult.rows, solutionResult.rows);

    const columnScore = columnsMatch ? 100 : 0;
    const rowScore = computeRowMatchPercent(userResult.rows, solutionResult.rows);

    const weightedScore = Math.round(
        (structure.score * 0.20) +
        (tables.score * 0.20) +
        (columnScore * 0.25) +
        (rowScore * 0.35)
    );

    const exactSqlMatch = normalizeSql(userQuery) === normalizeSql(solutionQuery);
    const equivalentOutput = columnsMatch && rowsMatch;
    const tier = exactSqlMatch ? "Perfect" : scoreToTier(weightedScore);

    return {
        score: exactSqlMatch ? 100 : weightedScore,
        tier,
        passed: equivalentOutput || weightedScore >= 80,
        exactSqlMatch,
        equivalentOutput,
        structure,
        tables,
        columnScore,
        rowScore,
        columnsMatch,
        rowsMatch
    };
}

function buildGradeFeedback(gradeResult, lesson) {
    const parts = [];

    parts.push(`<p><strong>Tier:</strong> ${escapeHtml(gradeResult.tier)} (${formatPercent(gradeResult.score)})</p>`);
    parts.push(
        `<p><strong>Breakdown:</strong> Structure ${formatPercent(gradeResult.structure.score)} | Tables ${formatPercent(gradeResult.tables.score)} | Columns ${formatPercent(gradeResult.columnScore)} | Rows ${formatPercent(gradeResult.rowScore)}</p>`
    );

    if (gradeResult.exactSqlMatch) {
        parts.push("<p>You matched the exact lesson solution.</p>");
        return parts.join("");
    }

    if (gradeResult.equivalentOutput) {
        parts.push("<p>Your SQL is different from the lesson answer, but the output is equivalent and accepted.</p>");
        return parts.join("");
    }

    if (gradeResult.structure.missed.length) {
        parts.push(`<p><strong>Missing SQL pieces:</strong> ${escapeHtml(gradeResult.structure.missed.join(", "))}</p>`);
    }

    if (gradeResult.tables.missed.length) {
        parts.push(`<p><strong>Missing expected tables:</strong> ${escapeHtml(gradeResult.tables.missed.join(", "))}</p>`);
    }

    if (gradeResult.tables.unexpected.length) {
        parts.push(`<p><strong>Unexpected tables used:</strong> ${escapeHtml(gradeResult.tables.unexpected.join(", "))}</p>`);
    }

    if (!gradeResult.columnsMatch) {
        parts.push("<p>Your selected output columns do not match the expected result.</p>");
    }

    if (!gradeResult.rowsMatch) {
        parts.push("<p>Your result rows do not match the expected result. Recheck filters, joins, grouping, or calculations.</p>");
    }

    if (lesson && lesson.hint) {
        parts.push(`<p><strong>Hint:</strong> ${escapeHtml(lesson.hint)}</p>`);
    }

    return parts.join("");
}

// ======================
// LESSON STATS + ACHIEVEMENTS
// ======================
function getLessonStats(lessonId) {
    if (!appState.lessonStats || typeof appState.lessonStats !== "object") {
        appState.lessonStats = {};
    }

    if (!appState.lessonStats[lessonId]) {
        appState.lessonStats[lessonId] = {
            attempts: 0,
            passes: 0,
            bestScore: 0,
            bestTier: "Not Started",
            mastered: false,
            lastScore: 0,
            lastTier: "Not Started"
        };
    }

    return appState.lessonStats[lessonId];
}

function updateLessonStatsOnGrade(lessonId, gradeResult, passed) {
    const stats = getLessonStats(lessonId);

    stats.attempts += 1;
    stats.lastScore = gradeResult.score;
    stats.lastTier = gradeResult.tier;

    if (passed) {
        stats.passes += 1;
    }

    if (gradeResult.score > stats.bestScore) {
        stats.bestScore = gradeResult.score;
    }

    if (tierRank(gradeResult.tier) > tierRank(stats.bestTier)) {
        stats.bestTier = gradeResult.tier;
    }

    if (gradeResult.tier === "Perfect" || gradeResult.score >= 90) {
        stats.mastered = true;
    }
}

function masteryCount() {
    const stats = appState.lessonStats || {};
    return Object.values(stats).filter(stat => stat && stat.mastered).length;
}

function achievements() {
    const completed = completedLessonCount();
    const firstTry = appState.firstTryLessonIds.length;
    const mastered = masteryCount();

    return [
        { label: "First Lesson", earned: completed >= 1, emoji: "🎯" },
        { label: "3 Lessons Completed", earned: completed >= 3, emoji: "📘" },
        { label: "5 Lessons Completed", earned: completed >= 5, emoji: "📚" },
        { label: "10 Lessons Completed", earned: completed >= 10, emoji: "🚀" },
        { label: "15 Lessons Completed", earned: completed >= 15, emoji: "🏥" },
        { label: "25 Lessons Completed", earned: completed >= 25, emoji: "📊" },
        { label: "50 Lessons Completed", earned: completed >= 50, emoji: "🏆" },
        { label: "100 Lessons Completed", earned: completed >= 100, emoji: "🔥" },
        { label: "3 First-Try Wins", earned: firstTry >= 3, emoji: "⚡" },
        { label: "10 First-Try Wins", earned: firstTry >= 10, emoji: "💡" },
        { label: "5 Mastered Lessons", earned: mastered >= 5, emoji: "🧠" },
        { label: "15 Mastered Lessons", earned: mastered >= 15, emoji: "🥇" },
        { label: "30 Mastered Lessons", earned: mastered >= 30, emoji: "👑" }
    ];
}

function categoryBadgeCount() {
    return getAllCategories().filter(category =>
        category.lessons.every(lesson => isLessonCompleted(lesson.id))
    ).length;
}

// ======================
// FEEDBACK / ERROR HELPERS
// ======================
function getExecutionErrorMessage(error) {
    const raw = String(error && error.message ? error.message : error || "");
    const message = raw.toLowerCase();

    if (message.includes("syntax error")) {
        return "SQL syntax error. Check commas, parentheses, aliases, and clause order.";
    }

    if (message.includes("no such table")) {
        return "One of the tables in your query does not exist in this lesson schema.";
    }

    if (message.includes("no such column")) {
        return "One of the columns in your query does not exist in the table you used.";
    }

    if (message.includes("ambiguous")) {
        return "A column reference is ambiguous. Add the table alias or full table.column reference.";
    }

    return raw || "The query could not be executed.";
}

function explainFirstMiss(userQuery, lesson, userError = null) {
    if (userError) {
        return getExecutionErrorMessage(userError);
    }

    const user = analyzeSqlStructure(userQuery);
    const solution = analyzeSqlStructure(lesson.solutionQuery || "");

    if (!user.hasSelect) return "Your query is missing SELECT.";
    if (!user.hasFrom) return "Your query is missing FROM.";

    if (solution.tables.length && user.tables.length) {
        const expected = solution.tables.slice().sort().join(", ");
        const actual = user.tables.slice().sort().join(", ");
        if (expected !== actual) {
            return `You used the wrong table set. Expected ${expected}, but your query used ${actual}.`;
        }
    }

    if (solution.hasJoin && !user.hasJoin) return "This lesson needs a JOIN, but your query does not include one.";
    if (solution.hasLeftJoin && !user.hasLeftJoin) return "This lesson needs a LEFT JOIN, but your query does not include one.";
    if (solution.hasWhere && !user.hasWhere) return "This lesson needs a WHERE clause, but your query does not include one.";
    if (solution.hasGroupBy && !user.hasGroupBy) return "This lesson needs a GROUP BY clause, but your query does not include one.";
    if (solution.hasHaving && !user.hasHaving) return "This lesson needs a HAVING clause, but your query does not include one.";
    if (solution.hasOrderBy && !user.hasOrderBy) return "This lesson needs an ORDER BY clause, but your query does not include one.";

    return "Your SQL ran, but the output still does not match the lesson target.";
}

function explainCorrectAnswer(lesson) {
    const solution = lesson.solutionQuery || "";

    if (/left join/i.test(solution)) {
        return "This works because it preserves the left table while adding matched values from the related table.";
    }

    if (/join/i.test(solution)) {
        return "This works because it joins the correct related tables, uses the right join key, and returns the requested fields.";
    }

    if (/group by/i.test(solution) && /having/i.test(solution)) {
        return "This works because it groups the data correctly, calculates the required summary, and then filters the grouped results.";
    }

    if (/group by/i.test(solution)) {
        return "This works because it summarizes the data at the correct grouping level.";
    }

    if (/case/i.test(solution)) {
        return "This works because it transforms raw values into the requested business categories.";
    }

    if (/avg|sum|count|round/i.test(solution)) {
        return "This works because it calculates the requested metric from the correct table and fields.";
    }

    if (/where/i.test(solution) && /order by/i.test(solution)) {
        return "This works because it filters to the right records and then sorts them in the requested order.";
    }

    if (/where/i.test(solution)) {
        return "This works because it selects the requested fields and filters to the exact records the lesson asked for.";
    }

    if (/order by/i.test(solution)) {
        return "This works because it selects the requested fields and sorts the results correctly.";
    }

    if (/select\s+\*/i.test(solution)) {
        return "This works because the lesson asks for all columns and all rows from the target table.";
    }

    return "This works because it returns exactly what the lesson asked for.";
}

// ======================
// PART 3 OF 4
// SCHEMA UI, DASHBOARD, CURRICULUM NAV, LESSON RENDERING
// ======================

// ======================
// STATE DEFAULTS + UI HELPERS
// ======================
function initializeStateDefaults() {
    const track = getTrack();
    if (!track) return;

    if (!appState.currentCategoryId) {
        appState.currentCategoryId = track.categories[0].id;
    }

    if (!appState.currentLessonId) {
        appState.currentLessonId = track.categories[0].lessons[0].id;
    }

    if (!appState.completedLessonIds) {
        appState.completedLessonIds = [];
    }

    if (!appState.firstTryLessonIds) {
        appState.firstTryLessonIds = [];
    }

    if (!appState.lessonStats || typeof appState.lessonStats !== "object") {
        appState.lessonStats = {};
    }

    if (typeof appState.schemaPanelWidth !== "number") {
        appState.schemaPanelWidth = 320;
    }
}

function sqlFocusText(sqlFocus) {
    return sqlFocus && sqlFocus.length ? sqlFocus.join(", ") : "—";
}

function difficultyClassFromLabel(label) {
    if (label === "Easy") return "difficulty-easy";
    if (label === "Intermediate") return "difficulty-intermediate";
    if (label === "Hard") return "difficulty-hard";
    return "difficulty-advanced";
}

function lessonTypeClass(type) {
    return `lesson-type-${type}`;
}

function formatLessonType(type) {
    if (!type) return "";
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function categoryDifficulty(category) {
    const order = [
        "getting_started",
        "selecting_columns",
        "filtering_rows",
        "sorting_results",
        "strings",
        "numbers_and_calculations",
        "null_handling",
        "boolean_logic",
        "case_statements",
        "aggregations",
        "group_by",
        "having",
        "inner_joins",
        "hospital_throughput",
        "readmissions_observations",
        "readmissions_kpis",
        "observation_kpis",
        "length_of_stay_kpis",
        "denials_kpis",
        "ed_throughput_kpis",
        "appointment_access_kpis",
        "provider_performance_sql",
        "executive_summary_sql"
    ];

    const idx = order.indexOf(category.id);

    if (idx <= 5) return "Easy";
    if (idx <= 12) return "Intermediate";
    if (idx <= 19) return "Hard";
    return "Advanced";
}

// ======================
// SCHEMA LOOKUP HELPERS
// ======================
function getTableByName(name) {
    return schema.tables.find(table => table.name === name);
}

function relatedRelationships(tableName) {
    return schema.relationships.filter(rel => rel.includes(`${tableName}.`));
}

function filterRelevantRelationships(relevantTables) {
    if (!relevantTables || !relevantTables.length) return schema.relationships;

    return schema.relationships.filter(rel => {
        const matches = relevantTables.filter(tableName => rel.includes(`${tableName}.`));
        return matches.length >= 2;
    });
}

// ======================
// LESSON STATE HELPERS
// ======================
function getLessonRecordById(lessonId) {
    return getAllLessons().find(item => item.lesson.id === lessonId) || null;
}

function getCurrentLessonRecord() {
    return getLessonRecordById(appState.currentLessonId);
}

function getCurrentLesson() {
    const record = getCurrentLessonRecord();
    return record ? record.lesson : null;
}

function isLessonCompleted(lessonId) {
    return appState.completedLessonIds.includes(lessonId);
}

function markLessonComplete(lessonId) {
    if (!appState.completedLessonIds.includes(lessonId)) {
        appState.completedLessonIds.push(lessonId);
    }
}

function markLessonFirstTry(lessonId) {
    if (!appState.firstTryLessonIds.includes(lessonId)) {
        appState.firstTryLessonIds.push(lessonId);
    }
}

function totalLessonCount() {
    return getAllLessons().length;
}

function completedLessonCount() {
    return appState.completedLessonIds.length;
}

// ======================
// SCHEMA RENDERING
// ======================
function renderSchemaTables() {
    const container = document.getElementById("schema-tables");
    if (!container) return;

    container.innerHTML = "";

    schema.tables.forEach(table => {
        const details = document.createElement("details");
        details.className = "schema-card";
        details.id = `schema-${table.name}`;

        details.innerHTML = `
            <summary>${escapeHtml(table.name)}</summary>
            <p><strong>Description:</strong> ${escapeHtml(table.description)}</p>
            <p><strong>Keys:</strong> ${escapeHtml(table.keyColumns.join(", "))}</p>
            <p><strong>Columns:</strong> ${escapeHtml(table.notableColumns.join(", "))}</p>
            <div class="schema-table-actions">
                <button class="schema-table-view-btn" onclick="openTableModal('${table.name}')">Open Table Viewer</button>
            </div>
            ${buildPreviewTable(table.notableColumns, table.sampleRows.slice(0, 12))}
        `;

        container.appendChild(details);
    });
}

function renderRelationships(relevantTables = []) {
    const container = document.getElementById("schema-relationships");
    if (!container) return;

    container.innerHTML = "";
    const relationshipsToShow = filterRelevantRelationships(relevantTables);

    relationshipsToShow.forEach(relationship => {
        const item = document.createElement("div");
        item.className = "relationship-item";
        item.innerText = relationship;
        container.appendChild(item);
    });

    if (!relationshipsToShow.length) {
        const item = document.createElement("div");
        item.className = "relationship-item";
        item.innerText = "No direct relationships highlighted for this lesson.";
        container.appendChild(item);
    }
}

function renderSchema() {
    renderSchemaTables();
    renderRelationships([]);
}

function highlightRelevantSchema(tables = []) {
    document.querySelectorAll(".schema-card").forEach(card => {
        card.open = false;
    });

    tables.forEach(tableName => {
        const card = document.getElementById(`schema-${tableName}`);
        if (card) card.open = true;
    });

    renderRelationships(tables);
}

function openTableModal(tableName) {
    const table = getTableByName(tableName);
    if (!table) return;

    const titleEl = document.getElementById("table-modal-title");
    const descriptionEl = document.getElementById("table-modal-description");
    const keysEl = document.getElementById("table-modal-keys");
    const columnsEl = document.getElementById("table-modal-columns");
    const relationshipsWrap = document.getElementById("table-modal-relationships");
    const previewWrap = document.getElementById("table-modal-preview-content");
    const overlay = document.getElementById("table-modal-overlay");

    if (titleEl) titleEl.innerText = table.name;
    if (descriptionEl) descriptionEl.innerText = table.description;
    if (keysEl) keysEl.innerText = table.keyColumns.join(", ");
    if (columnsEl) columnsEl.innerText = table.notableColumns.join(", ");

    if (relationshipsWrap) {
        relationshipsWrap.innerHTML = "";
        relatedRelationships(table.name).forEach(rel => {
            const chip = document.createElement("div");
            chip.className = "modal-relationship-chip";
            chip.innerText = rel;
            relationshipsWrap.appendChild(chip);
        });
    }

    if (previewWrap) {
        previewWrap.innerHTML = buildPreviewTable(table.notableColumns, table.sampleRows);
    }

    if (overlay) {
        overlay.classList.remove("hidden");
    }
}

function closeTableModal(event) {
    if (event && event.target && event.target.id !== "table-modal-overlay") return;

    const overlay = document.getElementById("table-modal-overlay");
    if (overlay) {
        overlay.classList.add("hidden");
    }
}

// ======================
// SCHEMA PANEL RESIZER
// ======================
function applySchemaPanelWidth() {
    const panel = document.getElementById("schema-panel");
    const shell = document.querySelector(".app-shell");
    if (!panel || !shell) return;

    const maxWidth = Math.floor(window.innerWidth * 0.55);
    const width = Math.max(260, Math.min(appState.schemaPanelWidth || 320, maxWidth));

    panel.style.width = `${width}px`;
    shell.style.gridTemplateColumns = `${width}px 14px 1fr`;
    appState.schemaPanelWidth = width;
}

function initSchemaResizer() {
    const resizer = document.getElementById("schema-resizer");
    const shell = document.querySelector(".app-shell");
    if (!resizer || !shell) return;

    let dragging = false;

    document.addEventListener("mousedown", function (event) {
        if (!event.target.closest("#schema-resizer")) return;
        dragging = true;
        event.preventDefault();
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";
        document.body.classList.add("resizing-schema");
    });

    document.addEventListener("mousemove", function (event) {
        if (!dragging) return;

        const shellRect = shell.getBoundingClientRect();
        const nextWidth = event.clientX - shellRect.left;
        const maxWidth = Math.floor(window.innerWidth * 0.55);

        appState.schemaPanelWidth = Math.max(260, Math.min(nextWidth, maxWidth));
        applySchemaPanelWidth();
    });

    document.addEventListener("mouseup", function () {
        if (!dragging) return;

        dragging = false;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        document.body.classList.remove("resizing-schema");
        saveProgress();
    });
}

// ======================
// DASHBOARD + ACHIEVEMENTS UI
// ======================
function updateDashboard() {
    const total = totalLessonCount();
    const completed = completedLessonCount();
    const current = getCurrentLesson();
    const track = getTrack();

    const progressText = document.getElementById("progress-text");
    const progressBar = document.getElementById("progress-bar");
    const currentLevelDisplay = document.getElementById("current-level-display");
    const badgeCount = document.getElementById("badge-count");
    const trackTitle = document.getElementById("track-title");
    const trackDescription = document.getElementById("track-description");

    if (progressText) {
        progressText.innerText = `${completed} / ${total} lessons completed`;
    }

    if (progressBar) {
        progressBar.style.width = `${total ? (completed / total) * 100 : 0}%`;
    }

    if (currentLevelDisplay) {
        const currentStats = current ? getLessonStats(current.id) : null;
        currentLevelDisplay.innerText = current
            ? `${current.title}${currentStats && currentStats.bestTier !== "Not Started" ? ` · ${currentStats.bestTier}` : ""}`
            : "No lesson selected";
    }

    if (badgeCount) {
        badgeCount.innerText = `${categoryBadgeCount()} category badges earned · ${masteryCount()} mastered`;
    }

    if (trackTitle) trackTitle.innerText = track.title;
    if (trackDescription) {
        trackDescription.innerText = "Curriculum, difficulty, completion, and mastery tracking.";
    }
}

function renderAchievements() {
    const container = document.getElementById("badges-container");
    if (!container) return;

    container.innerHTML = "";

    achievements().forEach(achievement => {
        const chip = document.createElement("div");
        chip.className = achievement.earned ? "badge-chip" : "badge-chip locked";
        chip.innerText = `${achievement.emoji} ${achievement.label}`;
        container.appendChild(chip);
    });
}

// ======================
// CURRICULUM SIDE PANEL
// ======================
function renderCurriculumNav() {
    const list = document.getElementById("category-list");
    if (!list) return;

    list.innerHTML = "";

    getAllCategories().forEach(category => {
        const wrap = document.createElement("div");
        wrap.className = "curriculum-category";

        const total = category.lessons.length;
        const done = category.lessons.filter(lesson => isLessonCompleted(lesson.id)).length;
        const mastered = category.lessons.filter(lesson => getLessonStats(lesson.id).mastered).length;
        const isComplete = done === total;

        const header = document.createElement("button");
        header.className = `curriculum-category-header${isComplete ? " is-complete" : ""}`;
        header.type = "button";
        header.innerHTML = `
            <div class="curriculum-category-row">
                <div class="curriculum-category-main">
                    <span class="curriculum-category-title">${escapeHtml(category.title)}</span>
                    <div class="curriculum-category-header-meta">
                        <span class="curriculum-category-meta">${done}/${total} completed</span>
                        <span class="curriculum-category-meta">${mastered} mastered</span>
                        ${isComplete ? '<span class="curriculum-complete-pill">Completed</span>' : ""}
                    </div>
                </div>
                <div class="curriculum-category-arrow">›</div>
            </div>
        `;

        header.addEventListener("click", function () {
            if (category.lessons.length) {
                const firstIncomplete = category.lessons.find(lesson => !isLessonCompleted(lesson.id));
                loadLesson((firstIncomplete || category.lessons[0]).id);
            }
        });

        wrap.appendChild(header);
        list.appendChild(wrap);
    });
}

// ======================
// LESSON BODY VISIBILITY
// ======================
function hideAllLessonBodies() {
    const concept = document.getElementById("concept-content");
    const challenge = document.getElementById("challenge-content");
    const scenario = document.getElementById("scenario-content");
    const executive = document.getElementById("executive-takeaway");

    if (concept) concept.classList.add("hidden");
    if (challenge) challenge.classList.add("hidden");
    if (scenario) scenario.classList.add("hidden");
    if (executive) executive.classList.add("hidden");
}

// ======================
// LESSON HEADER + TAKEAWAYS
// ======================
function renderLessonHeader(record) {
    const { categoryTitle, lesson } = record;
    const track = getTrack();
    const lessonStats = getLessonStats(lesson.id);

    const trackTitleDisplay = document.getElementById("track-title-display");
    const lessonTitle = document.getElementById("lesson-title");
    const lessonObjective = document.getElementById("lesson-objective");
    const typeBadge = document.getElementById("current-lesson-type-badge");
    const categoryBadge = document.getElementById("current-category-badge");
    const lessonTables = document.getElementById("lesson-tables");
    const lessonJoinHint = document.getElementById("lesson-join-hint");
    const lessonSqlFocus = document.getElementById("lesson-sql-focus");

    if (trackTitleDisplay) trackTitleDisplay.innerText = track.title;
    if (lessonTitle) lessonTitle.innerText = lesson.title;

    if (lessonObjective) {
        const masteryText = lessonStats.bestTier !== "Not Started"
            ? ` Current best: ${lessonStats.bestTier} (${formatPercent(lessonStats.bestScore)}).`
            : "";
        lessonObjective.innerText = `${lesson.objective || ""}${masteryText}`;
    }

    if (typeBadge) {
        typeBadge.className = `lesson-type-badge ${lessonTypeClass(lesson.type)}`;
        typeBadge.innerText = formatLessonType(lesson.type);
    }

    if (categoryBadge) {
        categoryBadge.className = "difficulty-badge difficulty-intermediate";
        categoryBadge.innerText = categoryTitle;
    }

    if (lessonTables) {
        lessonTables.innerHTML = `<strong>Relevant Tables:</strong> ${escapeHtml((lesson.relevantTables || []).join(", ") || "—")}`;
    }

    if (lessonJoinHint) {
        lessonJoinHint.innerHTML = `<strong>Join Hint:</strong> ${escapeHtml(lesson.joinHint || "—")}`;
    }

    if (lessonSqlFocus) {
        const masterySuffix = lesson.type === "challenge"
            ? ` | <strong>Best Tier:</strong> ${escapeHtml(lessonStats.bestTier)}`
            : "";
        lessonSqlFocus.innerHTML = `<strong>SQL Focus:</strong> ${escapeHtml(sqlFocusText(lesson.sql_focus))}${masterySuffix}`;
    }
}

function renderHintBox(lesson) {
    const hintBox = document.getElementById("level-hint");
    if (!hintBox) return;

    if (lesson.type === "concept") {
        hintBox.innerText = "Read the concept summary, bullets, and hospital example. Mark the lesson complete when ready.";
    } else if (lesson.type === "scenario") {
        hintBox.innerText = "Respond to the scenario using the business context provided. Think like an analyst supporting leadership.";
    } else {
        hintBox.innerText = "Run your query and check your answer. You earn a grading tier: Perfect, Pass, Almost There, or Needs Work.";
    }
}

function renderExecutiveTakeaway(lesson) {
    const wrap = document.getElementById("executive-takeaway");
    if (!wrap) return;

    if (!lesson.executiveTakeaway || !lesson.executiveTakeaway.show) {
        wrap.classList.add("hidden");
        return;
    }

    wrap.classList.remove("hidden");

    const metricEl = document.getElementById("exec-metric");
    const whyEl = document.getElementById("exec-why");
    const shareEl = document.getElementById("exec-share");
    const actionEl = document.getElementById("exec-action");

    if (metricEl) metricEl.innerHTML = `<strong>Metric:</strong> ${escapeHtml(lesson.executiveTakeaway.metric || "—")}`;
    if (whyEl) whyEl.innerHTML = `<strong>Why it matters:</strong> ${escapeHtml(lesson.executiveTakeaway.whyItMatters || "—")}`;
    if (shareEl) shareEl.innerHTML = `<strong>What to share:</strong> ${escapeHtml(lesson.executiveTakeaway.whatToShare || "—")}`;
    if (actionEl) actionEl.innerHTML = `<strong>Recommended action:</strong> ${escapeHtml(lesson.executiveTakeaway.action || "—")}`;
}

// ======================
// LESSON CONTENT RENDERERS
// ======================
function renderConceptLesson(lesson) {
    hideAllLessonBodies();

    const conceptWrap = document.getElementById("concept-content");
    const summaryEl = document.getElementById("concept-summary");
    const bulletsEl = document.getElementById("concept-bullets");
    const exampleEl = document.getElementById("concept-example");
    const feedbackEl = document.getElementById("feedback");
    const outputEl = document.getElementById("output");

    if (conceptWrap) conceptWrap.classList.remove("hidden");
    if (summaryEl) summaryEl.innerText = lesson.content?.summary || "";

    if (bulletsEl) {
        bulletsEl.innerHTML = "";
        (lesson.content?.bullets || []).forEach(bullet => {
            const li = document.createElement("li");
            li.innerText = bullet;
            bulletsEl.appendChild(li);
        });
    }

    if (exampleEl) exampleEl.innerText = lesson.content?.hospitalExample || "";
    if (feedbackEl) feedbackEl.innerHTML = "";
    if (outputEl) outputEl.innerHTML = "";
}

function renderScenarioLesson(lesson) {
    hideAllLessonBodies();

    const wrap = document.getElementById("scenario-content");
    const summaryEl = document.getElementById("scenario-summary");
    const promptEl = document.getElementById("scenario-prompt");
    const responseEl = document.getElementById("scenario-response");
    const scenarioFeedbackEl = document.getElementById("scenario-feedback");
    const feedbackEl = document.getElementById("feedback");
    const outputEl = document.getElementById("output");

    if (wrap) wrap.classList.remove("hidden");
    if (summaryEl) summaryEl.innerText = lesson.content?.summary || "";
    if (promptEl) promptEl.innerText = lesson.content?.prompt || "";
    if (responseEl) responseEl.value = "";
    if (scenarioFeedbackEl) scenarioFeedbackEl.innerHTML = "";
    if (feedbackEl) feedbackEl.innerHTML = "";
    if (outputEl) outputEl.innerHTML = "";
}

function renderChallengeLesson(lesson) {
    hideAllLessonBodies();

    const wrap = document.getElementById("challenge-content");
    const queryBox = document.getElementById("query");
    const feedbackEl = document.getElementById("feedback");
    const outputEl = document.getElementById("output");

    if (wrap) wrap.classList.remove("hidden");
    if (queryBox) queryBox.value = lesson.starterQuery || "";
    if (feedbackEl) feedbackEl.innerHTML = "";
    if (outputEl) outputEl.innerHTML = "";

    attempts = 0;
    lastRunQuery = "";

    highlightRelevantSchema(lesson.relevantTables || []);

    if (queryBox) {
        queryBox.oninput = function () {
            const detectedTables = detectTablesFromSql(queryBox.value);
            if (detectedTables.length) {
                highlightRelevantSchema(detectedTables);
            } else {
                highlightRelevantSchema(lesson.relevantTables || []);
            }
        };
    }
}

// ======================
// LESSON LOADING
// ======================
function loadLesson(lessonId) {
    const record = getLessonRecordById(lessonId);
    if (!record) return;

    appState.currentLessonId = lessonId;
    appState.currentCategoryId = record.categoryId;
    attempts = 0;
    lastRunQuery = "";

    showLessonWorkspace();
    renderLessonHeader(record);
    renderHintBox(record.lesson);
    renderExecutiveTakeaway(record.lesson);
    highlightRelevantSchema(record.lesson.relevantTables || []);

    if (record.lesson.type === "concept") {
        renderConceptLesson(record.lesson);
    } else if (record.lesson.type === "scenario") {
        renderScenarioLesson(record.lesson);
    } else {
        renderChallengeLesson(record.lesson);
    }

    renderCurriculumNav();
    updateDashboard();
    saveProgress();
}

// ======================
// TRACK OVERVIEW / MAIN SCREEN
// ======================
function showTrackOverview() {
    const overview = document.getElementById("track-overview");
    const workspace = document.getElementById("lesson-workspace");

    if (overview) overview.classList.remove("hidden");
    if (workspace) workspace.classList.add("hidden");

    renderTrackOverview();
}

function showLessonWorkspace() {
    const overview = document.getElementById("track-overview");
    const workspace = document.getElementById("lesson-workspace");

    if (overview) overview.classList.add("hidden");
    if (workspace) workspace.classList.remove("hidden");
}

function renderTrackOverview() {
    const track = getTrack();
    const categories = getAllCategories();
    const completed = completedLessonCount();
    const total = totalLessonCount();

    const titleEl = document.getElementById("track-overview-title");
    const descEl = document.getElementById("track-overview-description");
    const progressTextEl = document.getElementById("track-overview-progress-text");
    const progressBarEl = document.getElementById("track-overview-progress-bar");
    const trackLabelEl = document.getElementById("track-title-display-overview");
    const cardsWrap = document.getElementById("track-category-cards");

    if (trackLabelEl) trackLabelEl.innerText = track.title;
    if (titleEl) titleEl.innerText = track.title;
    if (descEl) descEl.innerText = `${track.description} ${masteryCount()} lesson(s) mastered.`;
    if (progressTextEl) progressTextEl.innerText = `${completed} of ${total} lessons completed`;

    if (progressBarEl) {
        progressBarEl.style.width = `${total ? (completed / total) * 100 : 0}%`;
    }

    if (!cardsWrap) return;
    cardsWrap.innerHTML = "";

    categories.forEach(category => {
        const totalLessons = category.lessons.length;
        const completedLessons = category.lessons.filter(lesson => isLessonCompleted(lesson.id)).length;
        const masteredLessons = category.lessons.filter(lesson => getLessonStats(lesson.id).mastered).length;
        const fullyComplete = completedLessons === totalLessons;
        const difficulty = categoryDifficulty(category);
        const difficultyClass = difficultyClassFromLabel(difficulty);
        const completionPercent = totalLessons ? (completedLessons / totalLessons) * 100 : 0;

        const badge = document.createElement("div");
        badge.className = `track-badge-card ${fullyComplete ? "earned" : "locked"}`;
        badge.innerHTML = `
            <div class="track-badge-icon-wrap">
                <div class="track-badge-ring ${fullyComplete ? "earned" : ""}" style="--badge-progress:${completionPercent}%;">
                    <div class="track-badge-icon ${fullyComplete ? "earned" : "locked"}">
                        ${fullyComplete ? "🏅" : "◌"}
                    </div>
                </div>
            </div>
            <div class="track-badge-name">${escapeHtml(category.title)}</div>
            <div class="track-badge-meta">
                <span class="difficulty-badge ${difficultyClass}">${escapeHtml(difficulty)}</span>
            </div>
            <p style="margin-top:8px; text-align:center; font-size:0.82rem; color:#64748b;">
                ${completedLessons}/${totalLessons} completed · ${masteredLessons} mastered
            </p>
        `;

        cardsWrap.appendChild(badge);
    });
}

// ======================
// TOP-LEVEL BUTTON BINDINGS
// ======================
function bindOverviewButtons() {
    const openOverviewBtn = document.getElementById("open-overview-btn");
    const resumeTrackBtn = document.getElementById("resume-track-btn");
    const startTrackBtn = document.getElementById("start-track-btn");

    if (openOverviewBtn) {
        openOverviewBtn.addEventListener("click", function () {
            showTrackOverview();
        });
    }

    if (resumeTrackBtn) {
        resumeTrackBtn.addEventListener("click", function () {
            if (appState.currentLessonId) {
                loadLesson(appState.currentLessonId);
            }
        });
    }

    if (startTrackBtn) {
        startTrackBtn.addEventListener("click", function () {
            const firstTrack = curriculum[0];
            const firstCategory = firstTrack.categories[0];
            const firstLesson = firstCategory.lessons[0];
            loadLesson(firstLesson.id);
        });
    }
}

function bindLevelsPanelToggle() {
    const btn = document.getElementById("toggle-levels-panel-btn");
    const panel = document.getElementById("levels-panel");
    if (!btn || !panel) return;

    btn.addEventListener("click", function () {
        panel.classList.toggle("collapsed");
        btn.innerText = panel.classList.contains("collapsed") ? "Expand" : "Collapse";
    });
}

// ======================
// PART 4 OF 4
// LESSON ACTIONS, NAVIGATION, RESET, DRAFTS, INIT
// ======================

// ======================
// LESSON ACTIONS
// ======================
function markConceptComplete() {
    const lesson = getCurrentLesson();
    if (!lesson || lesson.type !== "concept") return;

    markLessonComplete(lesson.id);
    renderAchievements();
    renderCurriculumNav();
    updateDashboard();
    renderTrackOverview();
    saveProgress();

    const feedback = document.getElementById("feedback");
    if (feedback) {
        feedback.innerHTML = "<p style='color:#16a34a; font-weight:700;'>✅ Concept marked complete.</p>";
    }
}

async function runQuery() {
    const lesson = getCurrentLesson();
    if (!lesson || lesson.type !== "challenge") return;

    const queryBox = document.getElementById("query");
    const output = document.getElementById("output");
    if (!queryBox || !output) return;

    const query = queryBox.value.trim();
    lastRunQuery = query;

    if (!query) {
        output.innerHTML = "<p>Please enter a SQL query first.</p>";
        return;
    }

    try {
        if (!sqlEngineReady) {
            output.innerHTML = "<p>Loading SQL engine...</p>";
            await initializeSqlEngine();
        }

        const detectedTables = detectTablesFromSql(query);
        if (detectedTables.length) {
            highlightRelevantSchema(detectedTables);
        }

        const result = executeSqlAgainstDb(query);

        output.innerHTML = `
            <p><strong>Query executed.</strong></p>
            <p><code>${escapeHtml(query)}</code></p>
            <p><strong>${result.rows.length}</strong> row(s) returned.</p>
            ${buildResultTable(result.columns, result.rows)}
        `;
    } catch (error) {
        output.innerHTML = `
            <p><strong>Query execution failed.</strong></p>
            <p>${escapeHtml(getExecutionErrorMessage(error))}</p>
        `;
    }
}

async function checkAnswer() {
    const lesson = getCurrentLesson();
    if (!lesson || lesson.type !== "challenge") return;

    const queryBox = document.getElementById("query");
    const feedback = document.getElementById("feedback");
    const hint = document.getElementById("level-hint");

    if (!queryBox || !feedback) return;

    const query = queryBox.value.trim();

    if (!query) {
        feedback.innerHTML = "<p style='color:#dc2626; font-weight:700;'>Please enter a query first.</p>";
        return;
    }

    attempts += 1;

    try {
        if (!sqlEngineReady) {
            await initializeSqlEngine();
        }

        const userResult = executeSqlAgainstDb(query);
        const solutionResult = executeSqlAgainstDb(lesson.solutionQuery || "");
        const gradeResult = buildGradeResult(query, lesson.solutionQuery || "", userResult, solutionResult);

        updateLessonStatsOnGrade(lesson.id, gradeResult, gradeResult.passed);

        if (gradeResult.passed) {
            feedback.innerHTML = `
                <p style='color:#16a34a; font-weight:700;'>✅ ${escapeHtml(gradeResult.tier)}</p>
                ${buildGradeFeedback(gradeResult, lesson)}
            `;

            markLessonComplete(lesson.id);

            if (attempts === 1 && gradeResult.score >= 95) {
                markLessonFirstTry(lesson.id);
            }

            clearQueryDraft(lesson.id);
            renderAchievements();
            renderCurriculumNav();
            updateDashboard();
            renderTrackOverview();
            renderLessonHeader(getCurrentLessonRecord());
            saveProgress();
            return;
        }

        if (attempts === 1) {
            feedback.innerHTML = `
                <p style='color:#dc2626; font-weight:700;'>❌ ${escapeHtml(gradeResult.tier)}</p>
                ${buildGradeFeedback(gradeResult, lesson)}
            `;

            if (hint) {
                hint.innerText = "Try again. Improve the weakest part of the breakdown first: structure, tables, columns, or rows.";
            }

            saveProgress();
            return;
        }

        if (attempts === 2) {
            feedback.innerHTML = `
                <p style='color:#dc2626; font-weight:700;'>❌ ${escapeHtml(gradeResult.tier)}</p>
                ${buildGradeFeedback(gradeResult, lesson)}
            `;

            if (hint) {
                hint.innerText = `Hint: ${lesson.hint || "Review the exact output requested and compare your selected fields, filters, joins, and calculations."}`;
            }

            saveProgress();
            return;
        }

        feedback.innerHTML = `
            <p style='color:#dc2626; font-weight:700;'>❌ ${escapeHtml(gradeResult.tier)}</p>
            ${buildGradeFeedback(gradeResult, lesson)}
            <p><strong>Correct answer:</strong></p>
            <p><code>${escapeHtml(lesson.solutionQuery || "")}</code></p>
            <p><strong>Why:</strong> ${escapeHtml(explainCorrectAnswer(lesson))}</p>
        `;

        if (hint) {
            hint.innerText = `Answer shown. ${explainCorrectAnswer(lesson)}`;
        }

        saveProgress();
    } catch (error) {
        const errorMessage = explainFirstMiss(query, lesson, error);
        const provisionalGrade = {
            score: 25,
            tier: "Needs Work",
            passed: false
        };

        updateLessonStatsOnGrade(lesson.id, provisionalGrade, false);

        if (attempts === 1) {
            feedback.innerHTML = `<p style='color:#dc2626; font-weight:700;'>❌ Needs Work</p><p>${escapeHtml(errorMessage)}</p>`;
            if (hint) {
                hint.innerText = "Try again. Fix the SQL execution issue first.";
            }
            saveProgress();
            return;
        }

        if (attempts === 2) {
            feedback.innerHTML = `<p style='color:#dc2626; font-weight:700;'>❌ Needs Work</p><p>${escapeHtml(errorMessage)}</p>`;
            if (hint) {
                hint.innerText = `Hint: ${lesson.hint || "Review the lesson objective and compare your SQL structure to the target output."}`;
            }
            saveProgress();
            return;
        }

        feedback.innerHTML = `
            <p style='color:#dc2626; font-weight:700;'>❌ Needs Work</p>
            <p>${escapeHtml(errorMessage)}</p>
            <p><strong>Correct answer:</strong></p>
            <p><code>${escapeHtml(lesson.solutionQuery || "")}</code></p>
            <p><strong>Why:</strong> ${escapeHtml(explainCorrectAnswer(lesson))}</p>
        `;

        if (hint) {
            hint.innerText = `Answer shown. ${explainCorrectAnswer(lesson)}`;
        }

        saveProgress();
    }
}

function resetQuery() {
    const lesson = getCurrentLesson();
    if (!lesson || lesson.type !== "challenge") return;

    const queryBox = document.getElementById("query");
    const feedback = document.getElementById("feedback");
    const output = document.getElementById("output");

    if (queryBox) queryBox.value = lesson.starterQuery || "";
    if (feedback) feedback.innerHTML = "";
    if (output) output.innerHTML = "";

    attempts = 0;
    lastRunQuery = "";
    clearQueryDraft(lesson.id);
    highlightRelevantSchema(lesson.relevantTables || []);
    renderHintBox(lesson);
}

function submitScenario() {
    const lesson = getCurrentLesson();
    if (!lesson || lesson.type !== "scenario") return;

    const responseEl = document.getElementById("scenario-response");
    const feedback = document.getElementById("scenario-feedback");
    if (!responseEl || !feedback) return;

    const response = (responseEl.value || "").trim().toLowerCase();
    const expected = (lesson.content?.expectedAnswer || "").trim().toLowerCase();

    if (!response) {
        feedback.innerHTML = "<p style='color:#dc2626; font-weight:700;'>Please enter a response.</p>";
        return;
    }

    if (response.includes(expected) || expected.includes(response)) {
        feedback.innerHTML = "<p style='color:#16a34a; font-weight:700;'>✅ Scenario completed.</p>";
        markLessonComplete(lesson.id);
        renderAchievements();
        renderCurriculumNav();
        updateDashboard();
        renderTrackOverview();
        saveProgress();
    } else {
        feedback.innerHTML = "<p style='color:#dc2626; font-weight:700;'>Not quite. Re-read the prompt and think about which table or action best fits the question.</p>";
    }
}

function resetScenario() {
    const lesson = getCurrentLesson();
    if (!lesson || lesson.type !== "scenario") return;

    const responseEl = document.getElementById("scenario-response");
    const feedback = document.getElementById("scenario-feedback");

    if (responseEl) responseEl.value = "";
    if (feedback) feedback.innerHTML = "";
}

// ======================
// LESSON NAVIGATION
// ======================
function currentLessonIndex() {
    return getAllLessons().findIndex(item => item.lesson.id === appState.currentLessonId);
}

function nextLesson() {
    const all = getAllLessons();
    const idx = currentLessonIndex();

    if (idx >= 0 && idx < all.length - 1) {
        loadLesson(all[idx + 1].lesson.id);
    }
}

function prevLesson() {
    const all = getAllLessons();
    const idx = currentLessonIndex();

    if (idx > 0) {
        loadLesson(all[idx - 1].lesson.id);
    }
}

// ======================
// RESET ALL PROGRESS
// ======================
function resetAllProgress() {
    localStorage.removeItem(STORAGE_KEY);

    const firstTrack = curriculum[0];
    const firstCategory = firstTrack.categories[0];
    const firstLesson = firstCategory.lessons[0];

    appState = {
        currentTrackId: firstTrack.id,
        currentCategoryId: firstCategory.id,
        currentLessonId: firstLesson.id,
        completedLessonIds: [],
        firstTryLessonIds: [],
        schemaPanelWidth: 320,
        lessonStats: {}
    };

    attempts = 0;
    lastRunQuery = "";

    Object.keys(localStorage)
        .filter(key => key.startsWith(QUERY_DRAFT_PREFIX))
        .forEach(key => localStorage.removeItem(key));

    applySchemaPanelWidth();
    renderSchema();
    renderAchievements();
    renderCurriculumNav();
    updateDashboard();
    renderTrackOverview();
    showTrackOverview();
    saveProgress();
}

// ======================
// QUERY DRAFTS
// ======================
const QUERY_DRAFT_PREFIX = "careops_query_draft_";

function saveQueryDraft(lessonId, query) {
    try {
        localStorage.setItem(`${QUERY_DRAFT_PREFIX}${lessonId}`, query);
    } catch (error) {
        console.warn("Failed to save query draft:", error);
    }
}

function loadQueryDraft(lessonId) {
    try {
        return localStorage.getItem(`${QUERY_DRAFT_PREFIX}${lessonId}`) || "";
    } catch (error) {
        console.warn("Failed to load query draft:", error);
        return "";
    }
}

function clearQueryDraft(lessonId) {
    try {
        localStorage.removeItem(`${QUERY_DRAFT_PREFIX}${lessonId}`);
    } catch (error) {
        console.warn("Failed to clear query draft:", error);
    }
}

const originalRenderChallengeLesson = renderChallengeLesson;
renderChallengeLesson = function (lesson) {
    originalRenderChallengeLesson(lesson);

    const queryBox = document.getElementById("query");
    if (!queryBox) return;

    const savedDraft = loadQueryDraft(lesson.id);
    if (savedDraft) {
        queryBox.value = savedDraft;
    }

    // Remove any existing listener before adding a new one
    queryBox.oninput = function () {
        saveQueryDraft(lesson.id, queryBox.value);

        const detectedTables = detectTablesFromSql(queryBox.value);
        if (detectedTables.length) {
            highlightRelevantSchema(detectedTables);
        } else {
            highlightRelevantSchema(lesson.relevantTables || []);
        }
    };
};

// ======================
// KEYBOARD SHORTCUTS
// ======================
document.addEventListener("keydown", function (event) {
    const lesson = getCurrentLesson();

    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        if (lesson && lesson.type === "challenge") {
            event.preventDefault();
            runQuery();
        }
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "Enter") {
        if (lesson && lesson.type === "challenge") {
            event.preventDefault();
            checkAnswer();
        }
    }

    if (event.altKey && event.key === "ArrowRight") {
        event.preventDefault();
        nextLesson();
    }

    if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        prevLesson();
    }

    if (event.key === "Escape") {
        const overlay = document.getElementById("table-modal-overlay");
        if (overlay && !overlay.classList.contains("hidden")) {
            overlay.classList.add("hidden");
        }
    }
});

// ======================
// INIT
// ======================
window.onload = async function () {
    loadProgress();
    initializeStateDefaults();
    applySchemaPanelWidth();
    initSchemaResizer();
    renderSchema();
    renderAchievements();
    renderCurriculumNav();
    updateDashboard();
    bindOverviewButtons();
    bindLevelsPanelToggle();
    renderTrackOverview();
    showTrackOverview();

    try {
        await initializeSqlEngine();
        console.log("SQL engine initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize SQL engine:", error);
        const banner = document.getElementById("js-error-banner");
        if (banner) {
            banner.classList.remove("hidden");
            banner.textContent =
                `SQL Engine Initialization Error:\n${String(error.message || error)}`;
        }
    }

    window.addEventListener("resize", applySchemaPanelWidth);
};

// ======================
// GLOBALS FOR HTML
// ======================
window.runQuery = runQuery;
window.checkAnswer = checkAnswer;
window.resetQuery = resetQuery;
window.nextLesson = nextLesson;
window.prevLesson = prevLesson;
window.markConceptComplete = markConceptComplete;
window.submitScenario = submitScenario;
window.resetScenario = resetScenario;
window.resetAllProgress = resetAllProgress;
window.openTableModal = openTableModal;
window.closeTableModal = closeTableModal;
window.showTrackOverview = showTrackOverview;
window.showLessonWorkspace = showLessonWorkspace;

// ======================
// FINAL LOG
// ======================
console.log("CareOps SQL Analyst - Track 1 initialized successfully.");
