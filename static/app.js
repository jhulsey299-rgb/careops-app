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
    currentTrackId: "track_sql_master_curriculum_hospital",
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

let activeDifficultyFilter = null;

const LEARNING_LEVELS = [
    {
        label: "Foundations",
        key: "foundations",
        color: "#22c55e",
        categoryIds: [
            "getting_started",
            "selecting_columns",
            "filtering_rows",
            "sorting_results",
            "strings",
            "numbers_and_calculations",
            "null_handling"
        ]
    },
    {
        label: "Core",
        key: "core",
        color: "#2563eb",
        categoryIds: [
            "boolean_logic",
            "case_statements",
            "aggregations",
            "group_by",
            "having",
            "inner_joins",
            "join_strategy"
        ]
    },
    {
        label: "Applied",
        key: "applied",
        color: "#f59e0b",
        categoryIds: [
            "hospital_throughput",
            "readmissions_observations",
            "readmissions_kpis",
            "observation_kpis",
            "length_of_stay_kpis",
            "denials_kpis",
            "ed_throughput_kpis"
        ]
    },
    {
        label: "Advanced",
        key: "advanced",
        color: "#ef4444",
        categoryIds: [
            "appointment_access_kpis",
            "provider_performance_sql",
            "executive_summary_sql",
            "left_joins_missing_data",
            "date_filters_reporting_periods",
            "conditional_aggregation",
            "distinct_counts_and_grain"
        ]
    },
    {
        label: "Expert",
        key: "expert",
        color: "#7c3aed",
        categoryIds: [
            "subqueries",
            "ctes",
            "window_functions",
            "readmissions_build_logic",
            "observation_and_throughput_logic",
            "revenue_cycle_denials_analysis",
            "executive_rollups_and_framing"
        ]
    }
];


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
function generateMockCell(tableName, columnName, rowIndex) {
  const firstNames = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer",
    "Michael", "Linda", "William", "Elizabeth", "David", "Barbara",
    "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah"
  ];

  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
    "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez",
    "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas"
  ];

  const cities = [
    "Myrtle Beach", "Georgetown", "Murrells Inlet",
    "Conway", "Pawleys Island", "Surfside Beach", "Socastee"
  ];

  const insuranceTypes = [
    "Medicare", "Medicaid", "Blue Cross", "Aetna",
    "UnitedHealthcare", "Cigna", "Self Pay"
  ];

  const payers = [
    "Medicare", "Medicaid", "Blue Cross", "Aetna",
    "UnitedHealthcare", "Cigna", "Self Pay"
  ];

  const departments = [
    "Emergency", "Cardiology", "Orthopedics", "Neurology",
    "Oncology", "Pediatrics", "General Surgery",
    "Family Medicine", "ICU", "Observation"
  ];

  const facilities = ["TGMH", "TWCH"];

  const encounterTypes = ["Inpatient", "Outpatient", "Emergency", "Observation"];
  const encounterStatuses = ["Admitted", "Discharged", "In Progress"];
  const claimStatuses = ["Paid", "Denied", "Pending"];
  const appointmentStatuses = ["Completed", "Scheduled", "No Show", "Cancelled"];

  const specialties = [
    "Family Medicine", "Cardiology", "Orthopedics",
    "Neurology", "Emergency Medicine", "Oncology",
    "Pediatrics", "General Surgery"
  ];

  const dischargeDispositions = [
    "Home", "Home Health", "Skilled Nursing Facility",
    "Rehabilitation", "Expired", "Against Medical Advice"
  ];

  const genders = ["Male", "Female"];

  const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomDate = (start, end) =>
    new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
      .toISOString()
      .split("T")[0];

  switch (String(columnName).toLowerCase()) {
    case "patient_id":
      return Number(rowIndex);

    case "provider_id":
      return 200 + rowIndex;

    case "department_id":
      return 500 + rowIndex;

    case "encounter_id":
      return 1000 + rowIndex;

    case "appointment_id":
      return 2000 + rowIndex;

    case "charge_id":
      return 3000 + rowIndex;

    case "claim_id":
      return 4000 + rowIndex;

    case "discharge_id":
      return 5000 + rowIndex;

    case "readmission_id":
      return 6000 + rowIndex;

    case "observation_id":
      return 7000 + rowIndex;

    case "index_encounter_id":
      return 1000 + rowIndex;

    case "readmit_encounter_id":
      return 1000 + (((rowIndex + 7) % 80) + 1);

    case "first_name":
      return randomItem(firstNames);

    case "last_name":
      return randomItem(lastNames);

    case "age":
      return randomInt(18, 90);

    case "gender":
      return randomItem(genders);

    case "insurance_type":
      return randomItem(insuranceTypes);

    case "risk_score":
      return randomInt(1, 100);

    case "city":
      return randomItem(cities);

    case "provider_name":
      return `Dr. ${randomItem(firstNames)} ${randomItem(lastNames)}`;

    case "specialty":
      return randomItem(specialties);

    case "department":
    case "department_name":
      return randomItem(departments);

    case "facility":
      return randomItem(facilities);

    case "service_line":
      return randomItem([
        "Cardiovascular",
        "Emergency",
        "Primary Care",
        "Neurosciences",
        "Orthopedics",
        "Oncology",
        "Pediatrics",
        "Critical Care"
      ]);

    case "status":
      return tableName === "appointments"
        ? randomItem(appointmentStatuses)
        : randomItem(encounterStatuses);

    case "encounter_type":
      return randomItem(encounterTypes);

    case "length_of_stay":
      return Number((Math.random() * 9 + 0.5).toFixed(1));

    case "admit_date":
      return randomDate(new Date(2023, 0, 1), new Date(2025, 11, 31));

    case "discharge_date":
      return Math.random() < 0.1
        ? null
        : randomDate(new Date(2023, 0, 2), new Date(2025, 11, 31));

    case "date":
      return randomDate(new Date(2024, 0, 1), new Date(2025, 11, 31));

    case "amount":
      return randomInt(100, 10000);

    case "billed_amount":
      return randomInt(500, 20000);

    case "payer":
      return randomItem(payers);

    case "claim_status":
      return randomItem(claimStatuses);

    case "charge_type":
      return randomItem([
        "Room Charge",
        "Pharmacy",
        "Imaging",
        "Lab",
        "Procedure",
        "Supplies"
      ]);

    case "discharge_disposition":
      return randomItem(dischargeDispositions);

    case "discharge_order_minutes":
      return randomInt(30, 600);

    case "departure_minutes":
      return randomInt(30, 480);

    case "delayed_for_transport":
      return randomItem([0, 1]);

    case "readmit_within_30_days":
      return randomItem([0, 1]);

    case "days_to_readmit":
      return randomInt(1, 30);

    case "obs_hours":
      return randomInt(1, 72);

    case "converted_to_inpatient":
      return randomItem([0, 1]);

    case "code_44_flag":
      return randomItem([0, 1]);

    default:
      return `${tableName}_${columnName}_${rowIndex}`;
  }
}

function rowToArray(table, rowObject) {
  return table.notableColumns.map(col => rowObject[col] ?? null);
}

function generateRelationalSampleRows() {
  const rowCount = 80;

  const patientsTable = schema.tables.find(t => t.name === "patients");
  const providersTable = schema.tables.find(t => t.name === "providers");
  const departmentsTable = schema.tables.find(t => t.name === "departments");
  const encountersTable = schema.tables.find(t => t.name === "encounters");
  const appointmentsTable = schema.tables.find(t => t.name === "appointments");
  const chargesTable = schema.tables.find(t => t.name === "charges");
  const claimsTable = schema.tables.find(t => t.name === "claims");
  const dischargesTable = schema.tables.find(t => t.name === "discharges");
  const readmissionsTable = schema.tables.find(t => t.name === "readmissions");
  const observationsTable = schema.tables.find(t => t.name === "observations");

  const patients = [];
  const providers = [];
  const departments = [];
  const encounters = [];
  const appointments = [];
  const charges = [];
  const claims = [];
  const discharges = [];
  const readmissions = [];
  const observations = [];

  for (let i = 1; i <= rowCount; i += 1) {
    patients.push({
      patient_id: i,
      first_name: generateMockCell("patients", "first_name", i),
      last_name: generateMockCell("patients", "last_name", i),
      age: generateMockCell("patients", "age", i),
      gender: generateMockCell("patients", "gender", i),
      insurance_type: generateMockCell("patients", "insurance_type", i),
      risk_score: generateMockCell("patients", "risk_score", i),
      city: generateMockCell("patients", "city", i)
    });
  }

  for (let i = 1; i <= 40; i += 1) {
    providers.push({
      provider_id: 200 + i,
      provider_name: generateMockCell("providers", "provider_name", i),
      specialty: generateMockCell("providers", "specialty", i),
      facility: generateMockCell("providers", "facility", i)
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    departments.push({
      department_id: 500 + i,
      department_name: generateMockCell("departments", "department_name", i),
      facility: generateMockCell("departments", "facility", i),
      service_line: generateMockCell("departments", "service_line", i)
    });
  }

  for (let i = 1; i <= rowCount; i += 1) {
    const patient = patients[(i - 1) % patients.length];
    const provider = providers[(i - 1) % providers.length];
    const dept = departments[(i - 1) % departments.length];

    encounters.push({
      encounter_id: 1000 + i,
      patient_id: patient.patient_id,
      provider_id: provider.provider_id,
      department_id: dept.department_id,
      facility: dept.facility,
      department: dept.department_name,
      status: generateMockCell("encounters", "status", i),
      encounter_type: generateMockCell("encounters", "encounter_type", i),
      length_of_stay: generateMockCell("encounters", "length_of_stay", i),
      admit_date: generateMockCell("encounters", "admit_date", i),
      discharge_date: generateMockCell("encounters", "discharge_date", i)
    });
  }

  for (let i = 1; i <= rowCount; i += 1) {
    const patient = patients[(i - 1) % patients.length];
    const provider = providers[(i - 1) % providers.length];
    const dept = departments[(i - 1) % departments.length];

    appointments.push({
      appointment_id: 2000 + i,
      patient_id: patient.patient_id,
      provider_id: provider.provider_id,
      department_id: dept.department_id,
      facility: dept.facility,
      department: dept.department_name,
      status: generateMockCell("appointments", "status", i),
      date: generateMockCell("appointments", "date", i)
    });
  }

  for (let i = 1; i <= rowCount; i += 1) {
    const encounter = encounters[i - 1];
    const patient = patients.find(p => p.patient_id === encounter.patient_id);

    charges.push({
      charge_id: 3000 + i,
      patient_id: patient.patient_id,
      encounter_id: encounter.encounter_id,
      amount: generateMockCell("charges", "amount", i),
      payer: patient.insurance_type === "Self Pay"
        ? "Self Pay"
        : generateMockCell("charges", "payer", i),
      charge_type: generateMockCell("charges", "charge_type", i)
    });

    claims.push({
      claim_id: 4000 + i,
      patient_id: patient.patient_id,
      encounter_id: encounter.encounter_id,
      payer: patient.insurance_type === "Self Pay"
        ? "Self Pay"
        : generateMockCell("claims", "payer", i),
      claim_status: generateMockCell("claims", "claim_status", i),
      billed_amount: generateMockCell("claims", "billed_amount", i)
    });

    discharges.push({
      discharge_id: 5000 + i,
      encounter_id: encounter.encounter_id,
      patient_id: patient.patient_id,
      facility: encounter.facility,
      department: encounter.department,
      discharge_disposition: generateMockCell("discharges", "discharge_disposition", i),
      discharge_order_minutes: generateMockCell("discharges", "discharge_order_minutes", i),
      departure_minutes: generateMockCell("discharges", "departure_minutes", i),
      delayed_for_transport: generateMockCell("discharges", "delayed_for_transport", i)
    });

    observations.push({
      observation_id: 7000 + i,
      encounter_id: encounter.encounter_id,
      patient_id: patient.patient_id,
      facility: encounter.facility,
      department: encounter.department,
      obs_hours: generateMockCell("observations", "obs_hours", i),
      converted_to_inpatient: generateMockCell("observations", "converted_to_inpatient", i),
      code_44_flag: generateMockCell("observations", "code_44_flag", i)
    });
  }

  for (let i = 1; i <= rowCount; i += 1) {
  const indexEncounter = encounters[i - 1];

  const samePatientEncounters = encounters.filter(
    e => e.patient_id === indexEncounter.patient_id && e.encounter_id !== indexEncounter.encounter_id
  );

  const readmitEncounter =
    samePatientEncounters.length > 0
      ? samePatientEncounters[0]
      : indexEncounter;

  readmissions.push({
    readmission_id: 6000 + i,
    index_encounter_id: indexEncounter.encounter_id,
    readmit_encounter_id: readmitEncounter.encounter_id,
    patient_id: indexEncounter.patient_id,
    facility: indexEncounter.facility,
    readmit_within_30_days: generateMockCell("readmissions", "readmit_within_30_days", i),
    days_to_readmit: generateMockCell("readmissions", "days_to_readmit", i)
  });
}


  patientsTable.sampleRows = patients.map(row => rowToArray(patientsTable, row));
  providersTable.sampleRows = providers.map(row => rowToArray(providersTable, row));
  departmentsTable.sampleRows = departments.map(row => rowToArray(departmentsTable, row));
  encountersTable.sampleRows = encounters.map(row => rowToArray(encountersTable, row));
  appointmentsTable.sampleRows = appointments.map(row => rowToArray(appointmentsTable, row));
  chargesTable.sampleRows = charges.map(row => rowToArray(chargesTable, row));
  claimsTable.sampleRows = claims.map(row => rowToArray(claimsTable, row));
  dischargesTable.sampleRows = discharges.map(row => rowToArray(dischargesTable, row));
  readmissionsTable.sampleRows = readmissions.map(row => rowToArray(readmissionsTable, row));
  observationsTable.sampleRows = observations.map(row => rowToArray(observationsTable, row));
}

generateRelationalSampleRows();

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
// ===============================
// SQL CURRICULUM FOR HOSPITAL ANALYTICS
// Tracks 1 and 2 - Ready to Paste
// ===============================

const curriculum = [
  {
    "id": "track_sql_master_curriculum_hospital",
    "title": "CareOps SQL Analyst Full Curriculum",
    "description": "A complete SQL learning path for hospital analytics covering foundations, core analysis, applied operational analytics, advanced decision support, and expert-level hospital SQL design.",
    "order": 1,
    "categories": [
      {
        "id": "getting_started",
        "title": "Getting Started",
        "order": 1,
        "lessons": [
          {
            "id": "gs_01",
            "type": "concept",
            "title": "What Hospital Data Looks Like",
            "objective": "Understand the core hospital tables and how analysts think about them.",
            "sql_focus": [],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "Hospital analytics usually starts with patients, encounters, finance, and workflow tables.",
              "bullets": [
                "Patients describe who the person is",
                "Encounters describe what happened clinically",
                "Claims and charges represent the financial side",
                "Operational tables explain why metrics move"
              ],
              "hospitalExample": "A denial or readmission rate always originates from a defined data model."
            },
            "executiveTakeaway": null
          },
          {
            "id": "gs_02",
            "type": "challenge",
            "title": "View Patients",
            "objective": "Return all rows and columns from patients.",
            "sql_focus": [
              "SELECT"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT * FROM patients;",
            "solutionQuery": "SELECT * FROM patients;",
            "hint": "Use SELECT * FROM patients;",
            "executiveTakeaway": null
          },
          {
            "id": "gs_03",
            "type": "challenge",
            "title": "View Encounters",
            "objective": "Return all rows and columns from encounters.",
            "sql_focus": [
              "SELECT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT * FROM encounters;",
            "solutionQuery": "SELECT * FROM encounters;",
            "hint": "Use SELECT * FROM encounters;",
            "executiveTakeaway": null
          },
          {
            "id": "gs_04",
            "type": "challenge",
            "title": "View Claims",
            "objective": "Return all rows and columns from claims.",
            "sql_focus": [
              "SELECT"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT * FROM claims;",
            "solutionQuery": "SELECT * FROM claims;",
            "hint": "Use SELECT * FROM claims;",
            "executiveTakeaway": null
          },
          {
            "id": "gs_05",
            "type": "scenario",
            "title": "Choose the Right Table",
            "objective": "Identify the correct table for a denial question.",
            "sql_focus": [],
            "relevantTables": [
              "claims",
              "patients"
            ],
            "joinHint": "Think about where denial status lives.",
            "content": {
              "summary": "Picking the correct source table is the first analyst skill.",
              "prompt": "Where should you start if leadership asks for denied claims by payer?",
              "expectedAnswer": "claims"
            },
            "executiveTakeaway": null
          }
        ]
      },
      {
        "id": "selecting_columns",
        "title": "Selecting Columns",
        "order": 2,
        "lessons": [
          {
            "id": "sc_01",
            "type": "concept",
            "title": "SELECT Basics",
            "objective": "Learn to return only the fields a stakeholder needs.",
            "sql_focus": [
              "SELECT"
            ],
            "relevantTables": [
              "patients",
              "claims",
              "encounters"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "Good analysts reduce noise by selecting only the fields needed for the business question.",
              "bullets": [
                "Executives rarely want raw exports",
                "Choose fields tied directly to the ask",
                "Cleaner outputs are easier to validate"
              ],
              "hospitalExample": "If someone asks for denied dollars by payer, you probably do not need every patient demographic field."
            },
            "executiveTakeaway": null
          },
          {
            "id": "sc_02",
            "type": "challenge",
            "title": "Patient Core Fields",
            "objective": "Return patient_id, first_name, and last_name from patients.",
            "sql_focus": [
              "SELECT"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT patient_id, first_name, last_name FROM patients;",
            "solutionQuery": "SELECT patient_id, first_name, last_name FROM patients;",
            "hint": "Select only the requested three columns.",
            "executiveTakeaway": null
          },
          {
            "id": "sc_03",
            "type": "challenge",
            "title": "Claim Financial Fields",
            "objective": "Return claim_id, payer, and billed_amount from claims.",
            "sql_focus": [
              "SELECT"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT claim_id, payer, billed_amount FROM claims;",
            "solutionQuery": "SELECT claim_id, payer, billed_amount FROM claims;",
            "hint": "Only return claim_id, payer, billed_amount.",
            "executiveTakeaway": null
          },
          {
            "id": "sc_04",
            "type": "challenge",
            "title": "Encounter Operational Fields",
            "objective": "Return encounter_id, facility, department, status from encounters.",
            "sql_focus": [
              "SELECT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, facility, department, status FROM encounters;",
            "solutionQuery": "SELECT encounter_id, facility, department, status FROM encounters;",
            "hint": "Return the four requested operational fields.",
            "executiveTakeaway": null
          },
          {
            "id": "sc_05",
            "type": "scenario",
            "title": "Executive-Focused Output",
            "objective": "Choose the more executive-ready answer.",
            "sql_focus": [],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Think audience first.",
            "content": {
              "summary": "The same data question can be answered with either clutter or clarity.",
              "prompt": "For a leadership denial summary, should you emphasize payer and billed_amount or dump every claim field?",
              "expectedAnswer": "payer"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Focused reporting output",
              "whyItMatters": "Leadership needs concise answers.",
              "whatToShare": "Keep only the fields directly tied to the business question.",
              "action": "Reduce clutter before sharing results."
            }
          }
        ]
      },
      {
        "id": "filtering_rows",
        "title": "Filtering Rows",
        "order": 3,
        "lessons": [
          {
            "id": "fr_01",
            "type": "concept",
            "title": "Filtering with WHERE",
            "objective": "Use WHERE to isolate the records that matter.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "patients",
              "claims",
              "encounters",
              "charges"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "Most healthcare questions are about a subset of rows, not the full table.",
              "bullets": [
                "Filter by payer",
                "Filter by status",
                "Filter by department",
                "Filter by amount"
              ],
              "hospitalExample": "A denial analysis is usually a subset of claims, not the whole claims table."
            },
            "executiveTakeaway": null
          },
          {
            "id": "fr_02",
            "type": "challenge",
            "title": "Medicare Patients",
            "objective": "Return Medicare patients with patient_id, first_name, and last_name.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT patient_id, first_name, last_name FROM patients WHERE insurance_type = 'Medicare';",
            "solutionQuery": "SELECT patient_id, first_name, last_name FROM patients WHERE insurance_type = 'Medicare';",
            "hint": "Filter on insurance_type = 'Medicare'.",
            "executiveTakeaway": null
          },
          {
            "id": "fr_03",
            "type": "challenge",
            "title": "Denied Claims",
            "objective": "Return denied claims with claim_id, payer, billed_amount.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied';",
            "solutionQuery": "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied';",
            "hint": "Filter claim_status = 'Denied'.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Denied claims inventory",
              "whyItMatters": "Denied claims represent reimbursement risk.",
              "whatToShare": "Summarize denied count and dollars at risk.",
              "action": "Escalate payer spikes and high-dollar denials."
            }
          },
          {
            "id": "fr_04",
            "type": "challenge",
            "title": "Cardiology Encounters",
            "objective": "Return encounter_id, patient_id, department for Cardiology encounters.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, patient_id, department FROM encounters WHERE department = 'Cardiology';",
            "solutionQuery": "SELECT encounter_id, patient_id, department FROM encounters WHERE department = 'Cardiology';",
            "hint": "Filter department = 'Cardiology'.",
            "executiveTakeaway": null
          },
          {
            "id": "fr_05",
            "type": "challenge",
            "title": "High-Dollar Charges",
            "objective": "Return charge_id, payer, amount for charges over 2000.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT charge_id, payer, amount FROM charges WHERE amount > 2000;",
            "solutionQuery": "SELECT charge_id, payer, amount FROM charges WHERE amount > 2000;",
            "hint": "Use amount > 2000.",
            "executiveTakeaway": null
          }
        ]
      },
      {
        "id": "sorting_results",
        "title": "Sorting Results",
        "order": 4,
        "lessons": [
          {
            "id": "sr_01",
            "type": "concept",
            "title": "Ordering Results",
            "objective": "Use ORDER BY to rank and structure results for review.",
            "sql_focus": [
              "ORDER BY"
            ],
            "relevantTables": [
              "charges",
              "patients",
              "encounters"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "Sorting helps surface what matters first.",
              "bullets": [
                "Descending is useful for biggest risks",
                "Ascending is useful for names and timelines",
                "You can sort by more than one field"
              ],
              "hospitalExample": "Executives often want the highest-dollar risk first, not an unsorted dump."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Priority ranking",
              "whyItMatters": "Sorting identifies top risks and opportunities quickly.",
              "whatToShare": "Use ranked outputs instead of unsorted detail.",
              "action": "Lead with highest-impact items."
            }
          },
          {
            "id": "sr_02",
            "type": "challenge",
            "title": "Sort Charges Descending",
            "objective": "Return charge_id, payer, amount ordered highest to lowest amount.",
            "sql_focus": [
              "ORDER BY"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT charge_id, payer, amount FROM charges ORDER BY amount DESC;",
            "solutionQuery": "SELECT charge_id, payer, amount FROM charges ORDER BY amount DESC;",
            "hint": "Use ORDER BY amount DESC.",
            "executiveTakeaway": null
          },
          {
            "id": "sr_03",
            "type": "challenge",
            "title": "Sort Patients by Last Name",
            "objective": "Return all patients ordered by last_name.",
            "sql_focus": [
              "ORDER BY"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT * FROM patients ORDER BY last_name;",
            "solutionQuery": "SELECT * FROM patients ORDER BY last_name;",
            "hint": "Use ORDER BY last_name.",
            "executiveTakeaway": null
          },
          {
            "id": "sr_04",
            "type": "challenge",
            "title": "Sort Encounters by Facility and Department",
            "objective": "Return all encounters ordered by facility, then department.",
            "sql_focus": [
              "ORDER BY"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT * FROM encounters ORDER BY facility, department;",
            "solutionQuery": "SELECT * FROM encounters ORDER BY facility, department;",
            "hint": "Use ORDER BY facility, department.",
            "executiveTakeaway": null
          },
          {
            "id": "sr_05",
            "type": "scenario",
            "title": "Top Items for Executives",
            "objective": "Recognize when ranked results are better than full detail.",
            "sql_focus": [],
            "relevantTables": [
              "charges",
              "claims"
            ],
            "joinHint": "Think ranking by impact.",
            "content": {
              "summary": "Sorted output helps leadership focus on the biggest issues first.",
              "prompt": "Should a leadership summary show the full unsorted file or highest-dollar items first?",
              "expectedAnswer": "highest"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Top-ranked opportunities",
              "whyItMatters": "Leadership time is limited.",
              "whatToShare": "Use top items or highest-impact outputs in summaries.",
              "action": "Sort by impact before sharing upward."
            }
          }
        ]
      },
      {
        "id": "strings",
        "title": "Strings",
        "order": 5,
        "lessons": [
          {
            "id": "st_01",
            "type": "concept",
            "title": "Working with Text",
            "objective": "Use string functions to clean and present text values.",
            "sql_focus": [
              "concatenation",
              "UPPER",
              "LOWER",
              "TRIM"
            ],
            "relevantTables": [
              "patients",
              "claims"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "String logic helps create readable and standardized outputs.",
              "bullets": [
                "Build display names",
                "Standardize payer text",
                "Clean unwanted spacing"
              ],
              "hospitalExample": "Many reports need one polished display field instead of several raw fields."
            },
            "executiveTakeaway": null
          },
          {
            "id": "st_02",
            "type": "challenge",
            "title": "Build Patient Full Name",
            "objective": "Return a full_name field from patients.",
            "sql_focus": [
              "concatenation"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT first_name || ' ' || last_name AS full_name FROM patients;",
            "solutionQuery": "SELECT first_name || ' ' || last_name AS full_name FROM patients;",
            "hint": "Concatenate first_name and last_name with a space.",
            "executiveTakeaway": null
          },
          {
            "id": "st_03",
            "type": "challenge",
            "title": "Standardize Payer Labels",
            "objective": "Return payer names in uppercase.",
            "sql_focus": [
              "UPPER"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT UPPER(payer) AS payer_standardized FROM claims;",
            "solutionQuery": "SELECT UPPER(payer) AS payer_standardized FROM claims;",
            "hint": "Use UPPER(payer).",
            "executiveTakeaway": null
          },
          {
            "id": "st_04",
            "type": "challenge",
            "title": "Lowercase City Names",
            "objective": "Return city values in lowercase.",
            "sql_focus": [
              "LOWER"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT LOWER(city) AS city_lower FROM patients;",
            "solutionQuery": "SELECT LOWER(city) AS city_lower FROM patients;",
            "hint": "Use LOWER(city).",
            "executiveTakeaway": null
          },
          {
            "id": "st_05",
            "type": "challenge",
            "title": "Trim Payer Text",
            "objective": "Return payer values with TRIM applied.",
            "sql_focus": [
              "TRIM"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT TRIM(payer) AS payer_trimmed FROM claims;",
            "solutionQuery": "SELECT TRIM(payer) AS payer_trimmed FROM claims;",
            "hint": "Use TRIM(payer).",
            "executiveTakeaway": null
          }
        ]
      },
      {
        "id": "numbers_and_calculations",
        "title": "Numbers and Calculations",
        "order": 6,
        "lessons": [
          {
            "id": "nm_01",
            "type": "concept",
            "title": "Raw Data vs Metrics",
            "objective": "Understand why leaders prefer metrics over raw lists.",
            "sql_focus": [
              "ROUND",
              "AVG",
              "CASE",
              "COUNT"
            ],
            "relevantTables": [
              "claims",
              "encounters",
              "charges"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "Analysts turn raw rows into rates and summary metrics leaders can act on.",
              "bullets": [
                "Percent denied",
                "Average LOS",
                "Average charge",
                "Remaining balance logic"
              ],
              "hospitalExample": "A denial rate tells a clearer story than a raw list of claims."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Executive-friendly metrics",
              "whyItMatters": "Leaders need directionally meaningful summaries.",
              "whatToShare": "Translate rows into rates, averages, and dollar impact.",
              "action": "Pick the KPI that best answers the question."
            }
          },
          {
            "id": "nm_02",
            "type": "challenge",
            "title": "Calculate Denial Rate",
            "objective": "Return the percent of claims that are denied.",
            "sql_focus": [
              "CASE",
              "COUNT",
              "ROUND"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT ROUND(100.0 * SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*), 2) AS denial_rate FROM claims;",
            "solutionQuery": "SELECT ROUND(100.0 * SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*), 2) AS denial_rate FROM claims;",
            "hint": "Use CASE inside an aggregate, divide by COUNT(*), then ROUND.",
            "executiveTakeaway": null
          },
          {
            "id": "nm_03",
            "type": "challenge",
            "title": "Calculate Average LOS",
            "objective": "Return average length_of_stay.",
            "sql_focus": [
              "AVG",
              "ROUND"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters;",
            "solutionQuery": "SELECT ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters;",
            "hint": "Use AVG(length_of_stay) and ROUND.",
            "executiveTakeaway": null
          },
          {
            "id": "nm_04",
            "type": "challenge",
            "title": "Calculate Average Charge",
            "objective": "Return average amount from charges.",
            "sql_focus": [
              "AVG",
              "ROUND"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT ROUND(AVG(amount), 2) AS avg_charge FROM charges;",
            "solutionQuery": "SELECT ROUND(AVG(amount), 2) AS avg_charge FROM charges;",
            "hint": "Use AVG(amount) and ROUND.",
            "executiveTakeaway": null
          },
          {
            "id": "nm_05",
            "type": "challenge",
            "title": "Estimate Remaining Balance",
            "objective": "Return claim_id and billed_amount minus 1000 as remaining_balance.",
            "sql_focus": [
              "arithmetic"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT claim_id, billed_amount - 1000 AS remaining_balance FROM claims;",
            "solutionQuery": "SELECT claim_id, billed_amount - 1000 AS remaining_balance FROM claims;",
            "hint": "Subtract 1000 from billed_amount and alias it.",
            "executiveTakeaway": null
          }
        ]
      },
      {
        "id": "null_handling",
        "title": "NULL Handling",
        "order": 7,
        "lessons": [
          {
            "id": "nh_01",
            "type": "concept",
            "title": "Understanding NULL",
            "objective": "Understand how missing values affect analysis.",
            "sql_focus": [
              "IS NULL",
              "IS NOT NULL",
              "COALESCE"
            ],
            "relevantTables": [
              "encounters",
              "claims"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "NULL means data is missing or unavailable and can distort reporting if ignored.",
              "bullets": [
                "NULL is not zero",
                "NULL is not blank text",
                "Missing data can distort summary logic"
              ],
              "hospitalExample": "Missing discharge_date values can distort throughput and LOS analysis."
            },
            "executiveTakeaway": null
          },
          {
            "id": "nh_02",
            "type": "challenge",
            "title": "Find Missing Discharge Dates",
            "objective": "Return encounter_id and patient_id where discharge_date is null.",
            "sql_focus": [
              "IS NULL"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, patient_id FROM encounters WHERE discharge_date IS NULL;",
            "solutionQuery": "SELECT encounter_id, patient_id FROM encounters WHERE discharge_date IS NULL;",
            "hint": "Use WHERE discharge_date IS NULL.",
            "executiveTakeaway": null
          },
          {
            "id": "nh_03",
            "type": "challenge",
            "title": "Find Non-Null Discharge Dates",
            "objective": "Return encounter_id where discharge_date is not null.",
            "sql_focus": [
              "IS NOT NULL"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id FROM encounters WHERE discharge_date IS NOT NULL;",
            "solutionQuery": "SELECT encounter_id FROM encounters WHERE discharge_date IS NOT NULL;",
            "hint": "Use WHERE discharge_date IS NOT NULL.",
            "executiveTakeaway": null
          },
          {
            "id": "nh_04",
            "type": "challenge",
            "title": "Replace Null Discharge Dates",
            "objective": "Use COALESCE to replace null discharge_date with Still Admitted.",
            "sql_focus": [
              "COALESCE"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, COALESCE(discharge_date, 'Still Admitted') AS discharge_status FROM encounters;",
            "solutionQuery": "SELECT encounter_id, COALESCE(discharge_date, 'Still Admitted') AS discharge_status FROM encounters;",
            "hint": "Use COALESCE(discharge_date, 'Still Admitted').",
            "executiveTakeaway": null
          },
          {
            "id": "nh_05",
            "type": "scenario",
            "title": "Data Quality Scenario",
            "objective": "Decide whether missing data should be escalated.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think about business impact.",
            "content": {
              "summary": "Not every missing field matters equally, but some directly affect KPIs.",
              "prompt": "If discharge_date is missing for many inpatient encounters, should that be escalated for LOS reporting accuracy?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Data quality risk",
              "whyItMatters": "Missing data can directly distort executive reporting.",
              "whatToShare": "Escalate data quality issues when they affect trusted KPIs.",
              "action": "Tie data quality escalation to business impact."
            }
          }
        ]
      },
      {
        "id": "boolean_logic",
        "title": "Boolean Logic",
        "order": 8,
        "lessons": [
          {
            "id": "bl_01",
            "type": "concept",
            "title": "Combining Conditions",
            "objective": "Use AND, OR, and NOT to define meaningful populations.",
            "sql_focus": [
              "AND",
              "OR",
              "NOT"
            ],
            "relevantTables": [
              "claims",
              "encounters",
              "patients"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "Boolean logic helps analysts define the exact population that matters.",
              "bullets": [
                "AND narrows",
                "OR broadens",
                "NOT excludes"
              ],
              "hospitalExample": "High-dollar denied claims are more actionable than all denied claims together."
            },
            "executiveTakeaway": null
          },
          {
            "id": "bl_02",
            "type": "challenge",
            "title": "High-Priority Denials",
            "objective": "Return denied claims over 2000 billed dollars.",
            "sql_focus": [
              "AND"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied' AND billed_amount > 2000;",
            "solutionQuery": "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied' AND billed_amount > 2000;",
            "hint": "Use AND to combine claim_status and billed_amount filters.",
            "executiveTakeaway": {
              "show": true,
              "metric": "High-priority denied claims",
              "whyItMatters": "Not all denials carry the same financial importance.",
              "whatToShare": "Separate high-dollar denials from overall denial volume.",
              "action": "Prioritize analyst review on the largest risks."
            }
          },
          {
            "id": "bl_03",
            "type": "challenge",
            "title": "ER or Observation Encounters",
            "objective": "Return encounter_id and encounter_type for Emergency or Observation encounters.",
            "sql_focus": [
              "OR"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, encounter_type FROM encounters WHERE encounter_type = 'Emergency' OR encounter_type = 'Observation';",
            "solutionQuery": "SELECT encounter_id, encounter_type FROM encounters WHERE encounter_type = 'Emergency' OR encounter_type = 'Observation';",
            "hint": "Use OR between Emergency and Observation.",
            "executiveTakeaway": null
          },
          {
            "id": "bl_04",
            "type": "challenge",
            "title": "Not Discharged Encounters",
            "objective": "Return encounter_id and status where status is not Discharged.",
            "sql_focus": [
              "NOT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, status FROM encounters WHERE NOT status = 'Discharged';",
            "solutionQuery": "SELECT encounter_id, status FROM encounters WHERE NOT status = 'Discharged';",
            "hint": "Use NOT with status = 'Discharged'.",
            "executiveTakeaway": null
          },
          {
            "id": "bl_05",
            "type": "challenge",
            "title": "Medicare or Medicaid Patients",
            "objective": "Return patient_id and insurance_type for Medicare or Medicaid patients.",
            "sql_focus": [
              "OR"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT patient_id, insurance_type FROM patients WHERE insurance_type = 'Medicare' OR insurance_type = 'Medicaid';",
            "solutionQuery": "SELECT patient_id, insurance_type FROM patients WHERE insurance_type = 'Medicare' OR insurance_type = 'Medicaid';",
            "hint": "Use OR between Medicare and Medicaid.",
            "executiveTakeaway": null
          }
        ]
      },
      {
        "id": "case_statements",
        "title": "CASE Statements",
        "order": 9,
        "lessons": [
          {
            "id": "cs_01",
            "type": "concept",
            "title": "Categorizing Data with CASE",
            "objective": "Use CASE to turn raw values into business buckets.",
            "sql_focus": [
              "CASE"
            ],
            "relevantTables": [
              "charges",
              "encounters",
              "claims"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "CASE statements turn raw values into categories that leaders can interpret faster.",
              "bullets": [
                "High / Medium / Low",
                "Open / Closed",
                "Short / Long"
              ],
              "hospitalExample": "Leadership usually understands categories faster than noisy raw transactional detail."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Categorized business summaries",
              "whyItMatters": "Leadership prefers grouped insights over raw values.",
              "whatToShare": "Use categories to simplify complex patterns.",
              "action": "Turn raw detail into interpretable segments."
            }
          },
          {
            "id": "cs_02",
            "type": "challenge",
            "title": "Bucket Charges by Size",
            "objective": "Return charge_id and a charge_bucket field.",
            "sql_focus": [
              "CASE"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT charge_id, CASE WHEN amount >= 3000 THEN 'High' WHEN amount >= 1000 THEN 'Medium' ELSE 'Low' END AS charge_bucket FROM charges;",
            "solutionQuery": "SELECT charge_id, CASE WHEN amount >= 3000 THEN 'High' WHEN amount >= 1000 THEN 'Medium' ELSE 'Low' END AS charge_bucket FROM charges;",
            "hint": "Use CASE with High, Medium, and Low thresholds.",
            "executiveTakeaway": null
          },
          {
            "id": "cs_03",
            "type": "challenge",
            "title": "Group Claim Statuses",
            "objective": "Return claim_id and a status_group of Open or Closed.",
            "sql_focus": [
              "CASE"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT claim_id, CASE WHEN claim_status = 'Pending' THEN 'Open' ELSE 'Closed' END AS status_group FROM claims;",
            "solutionQuery": "SELECT claim_id, CASE WHEN claim_status = 'Pending' THEN 'Open' ELSE 'Closed' END AS status_group FROM claims;",
            "hint": "Map Pending to Open and everything else to Closed.",
            "executiveTakeaway": null
          },
          {
            "id": "cs_04",
            "type": "challenge",
            "title": "Bucket Length of Stay",
            "objective": "Return encounter_id and a los_bucket of Long or Short.",
            "sql_focus": [
              "CASE"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, CASE WHEN length_of_stay >= 3 THEN 'Long' ELSE 'Short' END AS los_bucket FROM encounters;",
            "solutionQuery": "SELECT encounter_id, CASE WHEN length_of_stay >= 3 THEN 'Long' ELSE 'Short' END AS los_bucket FROM encounters;",
            "hint": "Use CASE on length_of_stay.",
            "executiveTakeaway": null
          },
          {
            "id": "cs_05",
            "type": "scenario",
            "title": "CASE for Executive Use",
            "objective": "Recognize why CASE helps leadership communication.",
            "sql_focus": [],
            "relevantTables": [
              "charges",
              "encounters"
            ],
            "joinHint": "Think readability first.",
            "content": {
              "summary": "CASE makes reporting more interpretable for non-technical audiences.",
              "prompt": "Would leadership usually understand raw decimals faster, or categorized buckets like Long and Short?",
              "expectedAnswer": "buckets"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Executive-friendly categorization",
              "whyItMatters": "Categories are easier to discuss than raw distributions.",
              "whatToShare": "Use buckets when raw values are too noisy.",
              "action": "Apply CASE when clarity matters more than precision."
            }
          }
        ]
      },
      {
        "id": "aggregations",
        "title": "Aggregations",
        "order": 10,
        "lessons": [
          {
            "id": "ag_01",
            "type": "concept",
            "title": "Summarizing Data with COUNT, SUM, and AVG",
            "objective": "Understand the building blocks of KPIs and dashboards.",
            "sql_focus": [
              "COUNT",
              "SUM",
              "AVG"
            ],
            "relevantTables": [
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "Aggregation functions are the core of most dashboards and executive reporting.",
              "bullets": [
                "COUNT = volume",
                "SUM = dollars",
                "AVG = typical burden or rate"
              ],
              "hospitalExample": "Executive dashboards often use encounter counts, total charges, and average LOS."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "KPI building blocks",
              "whyItMatters": "Most executive summaries are built from counts, sums, and averages.",
              "whatToShare": "Translate row-level data into interpretable metrics.",
              "action": "Use the summary statistic that best answers the question."
            }
          },
          {
            "id": "ag_02",
            "type": "challenge",
            "title": "Calculate Total Charges",
            "objective": "Return total charge dollars.",
            "sql_focus": [
              "SUM"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT SUM(amount) AS total_amount FROM charges;",
            "solutionQuery": "SELECT SUM(amount) AS total_amount FROM charges;",
            "hint": "Use SUM(amount).",
            "executiveTakeaway": null
          },
          {
            "id": "ag_03",
            "type": "challenge",
            "title": "Count Total Encounters",
            "objective": "Return total encounter volume.",
            "sql_focus": [
              "COUNT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT COUNT(*) AS total_encounters FROM encounters;",
            "solutionQuery": "SELECT COUNT(*) AS total_encounters FROM encounters;",
            "hint": "Use COUNT(*) from encounters.",
            "executiveTakeaway": null
          },
          {
            "id": "ag_04",
            "type": "challenge",
            "title": "Average Billed Amount",
            "objective": "Return average billed_amount.",
            "sql_focus": [
              "AVG"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT AVG(billed_amount) AS avg_billed_amount FROM claims;",
            "solutionQuery": "SELECT AVG(billed_amount) AS avg_billed_amount FROM claims;",
            "hint": "Use AVG(billed_amount).",
            "executiveTakeaway": null
          },
          {
            "id": "ag_05",
            "type": "challenge",
            "title": "Count Total Claims",
            "objective": "Return total claim count.",
            "sql_focus": [
              "COUNT"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT COUNT(*) AS total_claims FROM claims;",
            "solutionQuery": "SELECT COUNT(*) AS total_claims FROM claims;",
            "hint": "Use COUNT(*) from claims.",
            "executiveTakeaway": null
          }
        ]
      },
      {
        "id": "group_by",
        "title": "GROUP BY",
        "order": 11,
        "lessons": [
          {
            "id": "gb_01",
            "type": "concept",
            "title": "From Rows to Summaries",
            "objective": "Understand how GROUP BY creates grouped reporting views.",
            "sql_focus": [
              "GROUP BY"
            ],
            "relevantTables": [
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "GROUP BY turns row-level data into grouped performance summaries.",
              "bullets": [
                "By facility",
                "By payer",
                "By department",
                "By provider"
              ],
              "hospitalExample": "Leadership often wants comparisons across units rather than raw rows."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Grouped performance view",
              "whyItMatters": "Leaders compare units, not row-level detail.",
              "whatToShare": "Use grouped summaries to show who is driving volume or risk.",
              "action": "Organize results by the unit leadership can act on."
            }
          },
          {
            "id": "gb_02",
            "type": "challenge",
            "title": "Count Encounters by Facility",
            "objective": "Return facility and encounter_count.",
            "sql_focus": [
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",
            "solutionQuery": "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",
            "hint": "Group by facility and count rows.",
            "executiveTakeaway": null
          },
          {
            "id": "gb_03",
            "type": "challenge",
            "title": "Denied Claims by Payer",
            "objective": "Return payer and denied_claim_count.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT payer, COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
            "solutionQuery": "SELECT payer, COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
            "hint": "Filter denied claims, then group by payer.",
            "executiveTakeaway": null
          },
          {
            "id": "gb_04",
            "type": "challenge",
            "title": "Charges by Payer",
            "objective": "Return payer and total_amount.",
            "sql_focus": [
              "GROUP BY",
              "SUM"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer;",
            "solutionQuery": "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer;",
            "hint": "Group by payer and sum amount.",
            "executiveTakeaway": null
          },
          {
            "id": "gb_05",
            "type": "challenge",
            "title": "Encounters by Department",
            "objective": "Return department and encounter_count.",
            "sql_focus": [
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
            "solutionQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
            "hint": "Group by department.",
            "executiveTakeaway": null
          }
        ]
      },
      {
        "id": "having",
        "title": "HAVING",
        "order": 12,
        "lessons": [
          {
            "id": "hv_01",
            "type": "concept",
            "title": "Filtering Groups with HAVING",
            "objective": "Use HAVING to find exceptions after grouping.",
            "sql_focus": [
              "HAVING"
            ],
            "relevantTables": [
              "claims",
              "encounters",
              "charges"
            ],
            "joinHint": "No join needed.",
            "content": {
              "summary": "HAVING filters grouped results after aggregation.",
              "bullets": [
                "WHERE filters rows",
                "HAVING filters groups"
              ],
              "hospitalExample": "Use HAVING to isolate only the groups that exceed a threshold."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Outlier detection",
              "whyItMatters": "Leadership often cares about exceptions more than normal performance.",
              "whatToShare": "Present only material outliers when the goal is action.",
              "action": "Use HAVING to reduce noise."
            }
          },
          {
            "id": "hv_02",
            "type": "challenge",
            "title": "Payers with Multiple Denials",
            "objective": "Return payers with more than one denied claim.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "HAVING"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT payer, COUNT(*) AS denied_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer HAVING COUNT(*) > 1;",
            "solutionQuery": "SELECT payer, COUNT(*) AS denied_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer HAVING COUNT(*) > 1;",
            "hint": "Use HAVING COUNT(*) > 1.",
            "executiveTakeaway": null
          },
          {
            "id": "hv_03",
            "type": "challenge",
            "title": "Departments with Multiple Encounters",
            "objective": "Return departments with more than one encounter.",
            "sql_focus": [
              "GROUP BY",
              "HAVING"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department HAVING COUNT(*) > 1;",
            "solutionQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department HAVING COUNT(*) > 1;",
            "hint": "Use HAVING COUNT(*) > 1 after grouping.",
            "executiveTakeaway": null
          },
          {
            "id": "hv_04",
            "type": "challenge",
            "title": "Payers with High Total Charges",
            "objective": "Return payers whose total charges exceed 2000.",
            "sql_focus": [
              "GROUP BY",
              "HAVING",
              "SUM"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer HAVING SUM(amount) > 2000;",
            "solutionQuery": "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer HAVING SUM(amount) > 2000;",
            "hint": "Use HAVING SUM(amount) > 2000.",
            "executiveTakeaway": null
          },
          {
            "id": "hv_05",
            "type": "scenario",
            "title": "Outlier-Focused Leadership Review",
            "objective": "Recognize why HAVING helps reduce clutter.",
            "sql_focus": [],
            "relevantTables": [
              "claims",
              "charges"
            ],
            "joinHint": "Think exceptions, not everything.",
            "content": {
              "summary": "HAVING helps isolate only the categories leadership really needs to discuss.",
              "prompt": "If leaders only want groups above a meaningful threshold, should you use HAVING after grouping?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Threshold-based review",
              "whyItMatters": "Leadership time is limited.",
              "whatToShare": "Use HAVING to show only above-threshold groups.",
              "action": "Filter to material exceptions before review."
            }
          }
        ]
      },
      {
        "id": "inner_joins",
        "title": "Inner Joins",
        "order": 13,
        "lessons": [
          {
            "id": "ij_01",
            "type": "concept",
            "title": "Why Joins Matter",
            "objective": "Understand why most real analysis requires more than one table.",
            "sql_focus": [
              "JOIN"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges",
              "providers"
            ],
            "joinHint": "Relationships matter: patient_id, encounter_id, provider_id, and department_id are common join paths.",
            "content": {
              "summary": "Real insight usually comes from combining related tables.",
              "bullets": [
                "Patients + encounters = who had which visit",
                "Claims + patients = payer and patient context",
                "Encounters + providers = provider-level operational views",
                "Encounters + departments = service line reporting"
              ],
              "hospitalExample": "To explain denied dollars by department or provider, you need joined data."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Integrated business story",
              "whyItMatters": "Executives need context, not isolated facts.",
              "whatToShare": "Joined data explains not only what happened, but where and to whom.",
              "action": "Use joins when one table gives an incomplete answer."
            }
          },
          {
            "id": "ij_02",
            "type": "challenge",
            "title": "Join Encounters to Patients",
            "objective": "Return encounter_id, first_name, and last_name.",
            "sql_focus": [
              "JOIN"
            ],
            "relevantTables": [
              "encounters",
              "patients"
            ],
            "joinHint": "encounters.patient_id = patients.patient_id",
            "starterQuery": "SELECT e.encounter_id, p.first_name, p.last_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
            "solutionQuery": "SELECT e.encounter_id, p.first_name, p.last_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
            "hint": "Join encounters to patients on patient_id.",
            "executiveTakeaway": null
          },
          {
            "id": "ij_03",
            "type": "challenge",
            "title": "Join Claims to Patients",
            "objective": "Return claim_id, first_name, and insurance_type.",
            "sql_focus": [
              "JOIN"
            ],
            "relevantTables": [
              "claims",
              "patients"
            ],
            "joinHint": "claims.patient_id = patients.patient_id",
            "starterQuery": "SELECT c.claim_id, p.first_name, p.insurance_type FROM claims c JOIN patients p ON c.patient_id = p.patient_id;",
            "solutionQuery": "SELECT c.claim_id, p.first_name, p.insurance_type FROM claims c JOIN patients p ON c.patient_id = p.patient_id;",
            "hint": "Join claims to patients on patient_id.",
            "executiveTakeaway": null
          },
          {
            "id": "ij_04",
            "type": "challenge",
            "title": "Join Encounters to Providers",
            "objective": "Return encounter_id, provider_name, and specialty.",
            "sql_focus": [
              "JOIN"
            ],
            "relevantTables": [
              "encounters",
              "providers"
            ],
            "joinHint": "encounters.provider_id = providers.provider_id",
            "starterQuery": "SELECT e.encounter_id, p.provider_name, p.specialty FROM encounters e JOIN providers p ON e.provider_id = p.provider_id;",
            "solutionQuery": "SELECT e.encounter_id, p.provider_name, p.specialty FROM encounters e JOIN providers p ON e.provider_id = p.provider_id;",
            "hint": "Join encounters to providers on provider_id.",
            "executiveTakeaway": null
          },
          {
            "id": "ij_05",
            "type": "challenge",
            "title": "Join Claims to Encounter Department",
            "objective": "Return claim_id, department, and billed_amount.",
            "sql_focus": [
              "JOIN"
            ],
            "relevantTables": [
              "claims",
              "encounters"
            ],
            "joinHint": "claims.encounter_id = encounters.encounter_id",
            "starterQuery": "SELECT c.claim_id, e.department, c.billed_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id;",
            "solutionQuery": "SELECT c.claim_id, e.department, c.billed_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id;",
            "hint": "Join claims to encounters on encounter_id.",
            "executiveTakeaway": null
          }
        ]
      },
      {
        "id": "hospital_throughput",
        "title": "Hospital Throughput",
        "order": 14,
        "lessons": [
          {
            "id": "ht_01",
            "type": "concept",
            "title": "What Throughput Metrics Measure",
            "objective": "Understand discharge speed, departure lag, and delayed discharge concepts.",
            "sql_focus": [
              "AVG",
              "WHERE",
              "GROUP BY"
            ],
            "relevantTables": [
              "discharges",
              "encounters"
            ],
            "joinHint": "Most throughput questions start with discharges joined to encounters only if you need more context.",
            "content": {
              "summary": "Throughput measures how efficiently patients move through the system after care decisions are made.",
              "bullets": [
                "Discharge order to departure time is a common operational KPI",
                "Delay flags help isolate preventable barriers",
                "Department-level views help managers act"
              ],
              "hospitalExample": "A discharge delay problem is not just clinical. It often reflects transport, staffing, or workflow issues."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Discharge turnaround",
              "whyItMatters": "Long discharge lag ties up beds and hurts patient flow.",
              "whatToShare": "Average minutes, high-delay departments, and common delay flags.",
              "action": "Escalate units with persistent extended discharge timing."
            }
          },
          {
            "id": "ht_02",
            "type": "challenge",
            "title": "Average Discharge Order Minutes",
            "objective": "Return average discharge_order_minutes from discharges.",
            "sql_focus": [
              "AVG"
            ],
            "relevantTables": [
              "discharges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT AVG(discharge_order_minutes) AS avg_discharge_order_minutes FROM discharges;",
            "solutionQuery": "SELECT AVG(discharge_order_minutes) AS avg_discharge_order_minutes FROM discharges;",
            "hint": "Use AVG(discharge_order_minutes).",
            "executiveTakeaway": null
          },
          {
            "id": "ht_03",
            "type": "challenge",
            "title": "Delayed for Transport Cases",
            "objective": "Return discharge_id, encounter_id, and department where delayed_for_transport = 1.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "discharges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT discharge_id, encounter_id, department FROM discharges WHERE delayed_for_transport = 1;",
            "solutionQuery": "SELECT discharge_id, encounter_id, department FROM discharges WHERE delayed_for_transport = 1;",
            "hint": "Filter delayed_for_transport = 1.",
            "executiveTakeaway": null
          },
          {
            "id": "ht_04",
            "type": "challenge",
            "title": "Average Departure Minutes by Department",
            "objective": "Return department and average departure_minutes by department.",
            "sql_focus": [
              "GROUP BY",
              "AVG"
            ],
            "relevantTables": [
              "discharges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT department, AVG(departure_minutes) AS avg_departure_minutes FROM discharges GROUP BY department;",
            "solutionQuery": "SELECT department, AVG(departure_minutes) AS avg_departure_minutes FROM discharges GROUP BY department;",
            "hint": "Group by department and average departure_minutes.",
            "executiveTakeaway": null
          },
          {
            "id": "ht_05",
            "type": "scenario",
            "title": "Operational Escalation Scenario",
            "objective": "Choose the right direction when throughput worsens.",
            "sql_focus": [],
            "relevantTables": [
              "discharges"
            ],
            "joinHint": "Think manager-level actionability.",
            "content": {
              "summary": "Operations leaders need department-specific lag visibility, not just system averages.",
              "prompt": "If discharge lag worsens, should you show only a hospital total or break it out by department?",
              "expectedAnswer": "department"
            },
            "executiveTakeaway": null
          }
        ]
      },
      {
        "id": "readmissions_observations",
        "title": "Readmissions and Observation",
        "order": 15,
        "lessons": [
          {
            "id": "ro_01",
            "type": "concept",
            "title": "Why Readmissions and Observation Matter",
            "objective": "Understand how readmissions and observation metrics support hospital operations and finance.",
            "sql_focus": [
              "COUNT",
              "AVG",
              "GROUP BY",
              "WHERE"
            ],
            "relevantTables": [
              "readmissions",
              "observations"
            ],
            "joinHint": "These topics are usually analyzed separately, then combined into broader utilization stories.",
            "content": {
              "summary": "Readmissions and observation stays help explain utilization, avoidable returns, and reimbursement-sensitive activity.",
              "bullets": [
                "Thirty-day readmission is a classic hospital performance metric",
                "Observation conversion rates reveal utilization patterns",
                "Code 44 activity can signal documentation or status management issues"
              ],
              "hospitalExample": "A hospital can look financially stable but still have avoidable utilization friction hidden in readmission and observation trends."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Utilization quality indicators",
              "whyItMatters": "These measures affect both operations and reimbursement.",
              "whatToShare": "Readmit volume, days to readmit, obs hours, and inpatient conversion patterns.",
              "action": "Investigate spikes by department or facility."
            }
          },
          {
            "id": "ro_02",
            "type": "challenge",
            "title": "Count 30-Day Readmissions",
            "objective": "Return the count of rows where readmit_within_30_days = 1.",
            "sql_focus": [
              "COUNT",
              "WHERE"
            ],
            "relevantTables": [
              "readmissions"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT COUNT(*) AS readmit_count FROM readmissions WHERE readmit_within_30_days = 1;",
            "solutionQuery": "SELECT COUNT(*) AS readmit_count FROM readmissions WHERE readmit_within_30_days = 1;",
            "hint": "Filter readmit_within_30_days = 1 and count rows.",
            "executiveTakeaway": null
          },
          {
            "id": "ro_03",
            "type": "challenge",
            "title": "Average Days to Readmit",
            "objective": "Return average days_to_readmit for readmissions within 30 days.",
            "sql_focus": [
              "AVG",
              "WHERE"
            ],
            "relevantTables": [
              "readmissions"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT AVG(days_to_readmit) AS avg_days_to_readmit FROM readmissions WHERE readmit_within_30_days = 1;",
            "solutionQuery": "SELECT AVG(days_to_readmit) AS avg_days_to_readmit FROM readmissions WHERE readmit_within_30_days = 1;",
            "hint": "Filter to readmit_within_30_days = 1, then average days_to_readmit.",
            "executiveTakeaway": null
          },
          {
            "id": "ro_04",
            "type": "challenge",
            "title": "Observation Conversions by Facility",
            "objective": "Return facility and count of converted observation encounters by facility.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "observations"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT facility, COUNT(*) AS converted_obs_count FROM observations WHERE converted_to_inpatient = 1 GROUP BY facility;",
            "solutionQuery": "SELECT facility, COUNT(*) AS converted_obs_count FROM observations WHERE converted_to_inpatient = 1 GROUP BY facility;",
            "hint": "Filter converted_to_inpatient = 1 and group by facility.",
            "executiveTakeaway": null
          },
          {
            "id": "ro_05",
            "type": "challenge",
            "title": "Code 44 Cases",
            "objective": "Return observation_id, encounter_id, and facility where code_44_flag = 1.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "observations"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT observation_id, encounter_id, facility FROM observations WHERE code_44_flag = 1;",
            "solutionQuery": "SELECT observation_id, encounter_id, facility FROM observations WHERE code_44_flag = 1;",
            "hint": "Filter code_44_flag = 1.",
            "executiveTakeaway": null
          }
        ]
      },
      {
        "id": "readmissions_kpis",
        "title": "Readmissions KPIs",
        "order": 16,
        "lessons": [
          {
            "id": "rd_01",
            "type": "concept",
            "title": "How Readmissions Logic Works",
            "objective": "Understand the business logic behind readmissions reporting.",
            "sql_focus": [
              "JOIN",
              "WHERE",
              "DATE",
              "CASE"
            ],
            "relevantTables": [
              "encounters",
              "patients"
            ],
            "joinHint": "Readmissions logic compares an index encounter to a later encounter for the same patient.",
            "content": {
              "summary": "Readmissions reporting depends on defining the index discharge, the readmission window, and the exclusions that belong in the metric.",
              "bullets": [
                "A readmission metric starts with a qualifying index encounter",
                "The later visit must occur within the defined time window",
                "Metric definitions matter as much as SQL logic"
              ],
              "hospitalExample": "Leadership uses readmissions metrics to understand avoidable utilization, discharge quality, and opportunity by service line or facility."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "30-day readmission performance",
              "whyItMatters": "Readmissions affect quality, cost, and leadership perception of care transitions.",
              "whatToShare": "Be explicit about the index definition, time window, and exclusions.",
              "action": "Validate metric logic before socializing trends."
            }
          },
          {
            "id": "rd_02",
            "type": "challenge",
            "title": "Index Discharges",
            "objective": "Return discharged inpatient encounters.",
            "sql_focus": [
              "WHERE",
              "SELECT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, patient_id, discharge_date FROM encounters WHERE encounter_type = 'Inpatient' AND discharge_date IS NOT NULL;",
            "solutionQuery": "SELECT encounter_id, patient_id, discharge_date FROM encounters WHERE encounter_type = 'Inpatient' AND discharge_date IS NOT NULL;",
            "hint": "Filter to inpatient encounters with a discharge date.",
            "executiveTakeaway": null
          },
          {
            "id": "rd_03",
            "type": "challenge",
            "title": "Potential Readmission Population",
            "objective": "Return patients with more than one encounter.",
            "sql_focus": [
              "GROUP BY",
              "COUNT",
              "HAVING"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT patient_id, COUNT(*) AS encounter_count FROM encounters GROUP BY patient_id HAVING COUNT(*) > 1;",
            "solutionQuery": "SELECT patient_id, COUNT(*) AS encounter_count FROM encounters GROUP BY patient_id HAVING COUNT(*) > 1;",
            "hint": "Group by patient_id and keep only those with more than one encounter.",
            "executiveTakeaway": null
          },
          {
            "id": "rd_04",
            "type": "challenge",
            "title": "Encounter Timeline by Patient",
            "objective": "Return patient encounters ordered by patient and discharge_date.",
            "sql_focus": [
              "ORDER BY",
              "SELECT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT patient_id, encounter_id, discharge_date FROM encounters ORDER BY patient_id, discharge_date;",
            "solutionQuery": "SELECT patient_id, encounter_id, discharge_date FROM encounters ORDER BY patient_id, discharge_date;",
            "hint": "Sort first by patient, then by discharge_date.",
            "executiveTakeaway": null
          },
          {
            "id": "rd_05",
            "type": "scenario",
            "title": "Readmission Definition Scenario",
            "objective": "Recognize why metric definitions must be standardized.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think denominator and exclusions.",
            "content": {
              "summary": "A readmission number is only useful if everyone agrees on what counts as an index event and what counts as a return.",
              "prompt": "If one team uses all discharges and another excludes observation stays, can those readmission rates be compared as the same KPI?",
              "expectedAnswer": "no"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Readmission governance",
              "whyItMatters": "Different inclusion logic produces different rates and undermines trust.",
              "whatToShare": "Document the denominator before discussing performance.",
              "action": "Standardize the measure specification before executive review."
            }
          }
        ]
      },
      {
        "id": "observation_kpis",
        "title": "Observation KPIs",
        "order": 17,
        "lessons": [
          {
            "id": "ob_01",
            "type": "concept",
            "title": "Observation Reporting Basics",
            "objective": "Understand how observation metrics differ from inpatient reporting.",
            "sql_focus": [
              "WHERE",
              "CASE",
              "AVG",
              "GROUP BY"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Observation metrics usually begin with encounter_type = 'Observation'.",
            "content": {
              "summary": "Observation reporting often focuses on LOS by hours or days, conversions, and patients who remain in observation beyond target thresholds.",
              "bullets": [
                "Observation is a distinct operational workflow",
                "LOS thresholds often drive review",
                "Observation reporting frequently supports throughput and utilization management"
              ],
              "hospitalExample": "Leadership may care about prolonged observation stays, conversion patterns, and department ownership."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Observation utilization",
              "whyItMatters": "Observation volume and prolonged stays affect flow, capacity, and revenue interpretation.",
              "whatToShare": "Summarize observation counts, average LOS, and long-stay exceptions.",
              "action": "Use consistent thresholds for observation review."
            }
          },
          {
            "id": "ob_02",
            "type": "challenge",
            "title": "Observation Encounters",
            "objective": "Return all observation encounters.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, patient_id, department, length_of_stay FROM encounters WHERE encounter_type = 'Observation';",
            "solutionQuery": "SELECT encounter_id, patient_id, department, length_of_stay FROM encounters WHERE encounter_type = 'Observation';",
            "hint": "Filter encounter_type = 'Observation'.",
            "executiveTakeaway": null
          },
          {
            "id": "ob_03",
            "type": "challenge",
            "title": "Average Observation LOS",
            "objective": "Return average LOS for observation encounters.",
            "sql_focus": [
              "WHERE",
              "AVG",
              "ROUND"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT ROUND(AVG(length_of_stay), 2) AS avg_observation_los FROM encounters WHERE encounter_type = 'Observation';",
            "solutionQuery": "SELECT ROUND(AVG(length_of_stay), 2) AS avg_observation_los FROM encounters WHERE encounter_type = 'Observation';",
            "hint": "Filter to observation, then average LOS.",
            "executiveTakeaway": null
          },
          {
            "id": "ob_04",
            "type": "challenge",
            "title": "Long Observation Stays",
            "objective": "Return observation encounters with LOS over 2.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, patient_id, length_of_stay FROM encounters WHERE encounter_type = 'Observation' AND length_of_stay > 2;",
            "solutionQuery": "SELECT encounter_id, patient_id, length_of_stay FROM encounters WHERE encounter_type = 'Observation' AND length_of_stay > 2;",
            "hint": "Filter to observation and LOS > 2.",
            "executiveTakeaway": null
          },
          {
            "id": "ob_05",
            "type": "scenario",
            "title": "Observation Threshold Scenario",
            "objective": "Recognize why long-stay thresholds need consistency.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think operational definition.",
            "content": {
              "summary": "Threshold reporting only works when everyone agrees on the cutoff that triggers review.",
              "prompt": "If one report uses >24 hours and another uses >48 hours, are they describing the same prolonged observation KPI?",
              "expectedAnswer": "no"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Threshold-based observation review",
              "whyItMatters": "Different cutoffs will produce very different exception counts.",
              "whatToShare": "Define the long-stay threshold up front.",
              "action": "Lock threshold logic before leadership distribution."
            }
          }
        ]
      },
      {
        "id": "length_of_stay_kpis",
        "title": "Length of Stay KPIs",
        "order": 18,
        "lessons": [
          {
            "id": "ls_01",
            "type": "concept",
            "title": "Length of Stay as an Operational KPI",
            "objective": "Understand how LOS helps explain utilization and throughput.",
            "sql_focus": [
              "AVG",
              "GROUP BY",
              "CASE",
              "ORDER BY"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "LOS is usually summarized by department, facility, service line, or encounter type.",
            "content": {
              "summary": "Length of stay can reveal throughput challenges, discharge barriers, and variation across operational units.",
              "bullets": [
                "Average LOS summarizes typical duration",
                "Outlier LOS highlights exceptions",
                "Grouped LOS views help leaders focus on where variation is occurring"
              ],
              "hospitalExample": "Leadership often wants average LOS plus a view of units with longer-than-expected stays."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Length of stay performance",
              "whyItMatters": "LOS affects capacity, patient flow, staffing pressure, and cost.",
              "whatToShare": "Summarize average LOS and identify areas with elevated stay duration.",
              "action": "Pair LOS summaries with ranked exception views."
            }
          },
          {
            "id": "ls_02",
            "type": "challenge",
            "title": "Average LOS by Facility",
            "objective": "Return facility and average LOS.",
            "sql_focus": [
              "GROUP BY",
              "AVG",
              "ROUND"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT facility, ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters GROUP BY facility;",
            "solutionQuery": "SELECT facility, ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters GROUP BY facility;",
            "hint": "Group by facility and average LOS.",
            "executiveTakeaway": null
          },
          {
            "id": "ls_03",
            "type": "challenge",
            "title": "Longest Stay Encounters",
            "objective": "Return encounters ordered by LOS descending.",
            "sql_focus": [
              "ORDER BY"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, patient_id, department, length_of_stay FROM encounters ORDER BY length_of_stay DESC;",
            "solutionQuery": "SELECT encounter_id, patient_id, department, length_of_stay FROM encounters ORDER BY length_of_stay DESC;",
            "hint": "Sort LOS from longest to shortest.",
            "executiveTakeaway": null
          },
          {
            "id": "ls_04",
            "type": "challenge",
            "title": "LOS Buckets by Encounter",
            "objective": "Return encounter_id and a LOS bucket of Long or Short.",
            "sql_focus": [
              "CASE"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, CASE WHEN length_of_stay >= 3 THEN 'Long' ELSE 'Short' END AS los_bucket FROM encounters;",
            "solutionQuery": "SELECT encounter_id, CASE WHEN length_of_stay >= 3 THEN 'Long' ELSE 'Short' END AS los_bucket FROM encounters;",
            "hint": "Use CASE on length_of_stay.",
            "executiveTakeaway": null
          },
          {
            "id": "ls_05",
            "type": "scenario",
            "title": "LOS Interpretation Scenario",
            "objective": "Recognize why average LOS alone is not always enough.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think variation and outliers.",
            "content": {
              "summary": "An average can hide whether the issue is broad or driven by a few very long stays.",
              "prompt": "If average LOS is high, should you usually also look at the longest individual stays or unit-level variation?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "LOS interpretation depth",
              "whyItMatters": "A single average can hide operational root causes.",
              "whatToShare": "Pair average LOS with ranked outliers or grouped comparisons.",
              "action": "Do not stop at the mean."
            }
          }
        ]
      },
      {
        "id": "denials_kpis",
        "title": "Denials KPIs",
        "order": 19,
        "lessons": [
          {
            "id": "dn_01",
            "type": "concept",
            "title": "Denials as Financial and Operational Signals",
            "objective": "Understand how denials reporting supports revenue cycle action.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "SUM",
              "COUNT",
              "ORDER BY"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Denials logic usually starts with claim_status = 'Denied'.",
            "content": {
              "summary": "Denials reporting can be framed by count, dollars, payer, department, or claim category depending on the leadership question.",
              "bullets": [
                "Count shows volume",
                "Billed dollars show financial impact",
                "Grouped payer views help target action"
              ],
              "hospitalExample": "A payer with fewer denials can still be the biggest financial problem if the denied dollars are much larger."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Denial count and dollars at risk",
              "whyItMatters": "Denials directly affect reimbursement and cash flow.",
              "whatToShare": "Show both count and dollar impact, not just one.",
              "action": "Prioritize high-dollar denial categories first."
            }
          },
          {
            "id": "dn_02",
            "type": "challenge",
            "title": "Denied Claim Count",
            "objective": "Return total count of denied claims.",
            "sql_focus": [
              "WHERE",
              "COUNT"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied';",
            "solutionQuery": "SELECT COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied';",
            "hint": "Filter claim_status to Denied and count rows.",
            "executiveTakeaway": null
          },
          {
            "id": "dn_03",
            "type": "challenge",
            "title": "Denied Dollars Total",
            "objective": "Return total billed amount for denied claims.",
            "sql_focus": [
              "WHERE",
              "SUM"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied';",
            "solutionQuery": "SELECT SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied';",
            "hint": "Filter denied claims and sum billed_amount.",
            "executiveTakeaway": null
          },
          {
            "id": "dn_04",
            "type": "challenge",
            "title": "Denied Claims by Payer Ranked",
            "objective": "Return payer and denied dollars ordered highest to lowest.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "SUM",
              "ORDER BY"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "solutionQuery": "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "hint": "Filter denied, group by payer, sum billed_amount, and sort descending.",
            "executiveTakeaway": null
          },
          {
            "id": "dn_05",
            "type": "scenario",
            "title": "Denial Prioritization Scenario",
            "objective": "Recognize why denied dollars matter along with denied volume.",
            "sql_focus": [],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Think financial impact, not just counts.",
            "content": {
              "summary": "The biggest operational focus is not always the category with the most rows.",
              "prompt": "If one payer has fewer denials but far more denied dollars, should leadership still prioritize that payer for review?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "High-impact denial prioritization",
              "whyItMatters": "Dollar exposure can outweigh raw volume.",
              "whatToShare": "Separate count-based and dollar-based prioritization.",
              "action": "Escalate high-dollar denial risk even when volume is smaller."
            }
          }
        ]
      },
      {
        "id": "ed_throughput_kpis",
        "title": "ED Throughput KPIs",
        "order": 20,
        "lessons": [
          {
            "id": "ed_01",
            "type": "concept",
            "title": "ED Throughput Framing",
            "objective": "Understand how SQL supports emergency department throughput review.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "COUNT",
              "AVG"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Emergency department reporting often starts with encounter_type = 'Emergency' or department = 'ER'.",
            "content": {
              "summary": "ED throughput views typically focus on volume, LOS, boarding proxies, and timing distribution by facility or department.",
              "bullets": [
                "ED volume is a starting point",
                "ED LOS highlights operational burden",
                "Grouped views help compare performance across sites or times"
              ],
              "hospitalExample": "Leadership often wants to know both how much volume exists and where throughput pressure may be building."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "ED throughput visibility",
              "whyItMatters": "ED pressure affects patient experience, flow, and hospital operations.",
              "whatToShare": "Summarize ED volume, average LOS, and top exception areas.",
              "action": "Use grouped comparisons to focus operational response."
            }
          },
          {
            "id": "ed_02",
            "type": "challenge",
            "title": "Emergency Encounter Count",
            "objective": "Return total count of emergency encounters.",
            "sql_focus": [
              "WHERE",
              "COUNT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT COUNT(*) AS emergency_encounter_count FROM encounters WHERE encounter_type = 'Emergency';",
            "solutionQuery": "SELECT COUNT(*) AS emergency_encounter_count FROM encounters WHERE encounter_type = 'Emergency';",
            "hint": "Filter encounter_type = 'Emergency' and count rows.",
            "executiveTakeaway": null
          },
          {
            "id": "ed_03",
            "type": "challenge",
            "title": "Average ED LOS",
            "objective": "Return average LOS for emergency encounters.",
            "sql_focus": [
              "WHERE",
              "AVG",
              "ROUND"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT ROUND(AVG(length_of_stay), 2) AS avg_ed_los FROM encounters WHERE encounter_type = 'Emergency';",
            "solutionQuery": "SELECT ROUND(AVG(length_of_stay), 2) AS avg_ed_los FROM encounters WHERE encounter_type = 'Emergency';",
            "hint": "Filter emergency encounters and average LOS.",
            "executiveTakeaway": null
          },
          {
            "id": "ed_04",
            "type": "challenge",
            "title": "ED Volume by Facility",
            "objective": "Return facility and emergency encounter count.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT facility, COUNT(*) AS emergency_encounter_count FROM encounters WHERE encounter_type = 'Emergency' GROUP BY facility;",
            "solutionQuery": "SELECT facility, COUNT(*) AS emergency_encounter_count FROM encounters WHERE encounter_type = 'Emergency' GROUP BY facility;",
            "hint": "Filter emergency encounters, then group by facility.",
            "executiveTakeaway": null
          },
          {
            "id": "ed_05",
            "type": "scenario",
            "title": "Throughput Scenario",
            "objective": "Recognize why ED throughput needs both volume and duration views.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think volume plus time burden.",
            "content": {
              "summary": "A department can have high volume, long stays, or both, and each pattern suggests a different operational problem.",
              "prompt": "If ED encounters are rising, should leadership usually also look at LOS instead of only raw volume?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "ED throughput interpretation",
              "whyItMatters": "Volume alone does not explain operational strain.",
              "whatToShare": "Pair encounter counts with stay duration metrics.",
              "action": "Use both load and time burden in ED reviews."
            }
          }
        ]
      },
      {
        "id": "appointment_access_kpis",
        "title": "Appointment Access KPIs",
        "order": 21,
        "lessons": [
          {
            "id": "aa_01",
            "type": "concept",
            "title": "Access and Scheduling Logic",
            "objective": "Understand how appointment data supports access reporting.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "COUNT",
              "CASE"
            ],
            "relevantTables": [
              "appointments"
            ],
            "joinHint": "Scheduling reporting often centers on status, department, provider, and date.",
            "content": {
              "summary": "Access reporting helps leaders understand completed visits, no-shows, scheduled demand, and possible scheduling gaps.",
              "bullets": [
                "Appointment status is central to access reporting",
                "No-shows often matter by department or provider",
                "Grouped volume helps identify operational pressure points"
              ],
              "hospitalExample": "Access KPIs often become the first signal that downstream throughput or clinic utilization issues are developing."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Access and scheduling performance",
              "whyItMatters": "Appointment completion and no-show patterns affect access, continuity, and revenue.",
              "whatToShare": "Summarize completed, scheduled, and no-show activity by the unit leaders can influence.",
              "action": "Escalate recurring no-show concentration by area."
            }
          },
          {
            "id": "aa_02",
            "type": "challenge",
            "title": "Completed Appointments Count",
            "objective": "Return count of completed appointments.",
            "sql_focus": [
              "WHERE",
              "COUNT"
            ],
            "relevantTables": [
              "appointments"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT COUNT(*) AS completed_appointment_count FROM appointments WHERE status = 'Completed';",
            "solutionQuery": "SELECT COUNT(*) AS completed_appointment_count FROM appointments WHERE status = 'Completed';",
            "hint": "Filter status = 'Completed' and count rows.",
            "executiveTakeaway": null
          },
          {
            "id": "aa_03",
            "type": "challenge",
            "title": "No-Shows by Department",
            "objective": "Return department and no-show count.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "appointments"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department;",
            "solutionQuery": "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department;",
            "hint": "Filter No Show and group by department.",
            "executiveTakeaway": null
          },
          {
            "id": "aa_04",
            "type": "challenge",
            "title": "Appointments by Status",
            "objective": "Return status and appointment count.",
            "sql_focus": [
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "appointments"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT status, COUNT(*) AS appointment_count FROM appointments GROUP BY status;",
            "solutionQuery": "SELECT status, COUNT(*) AS appointment_count FROM appointments GROUP BY status;",
            "hint": "Group by status and count appointments.",
            "executiveTakeaway": null
          },
          {
            "id": "aa_05",
            "type": "scenario",
            "title": "Access Review Scenario",
            "objective": "Recognize why no-shows should usually be grouped, not only totaled.",
            "sql_focus": [],
            "relevantTables": [
              "appointments"
            ],
            "joinHint": "Think actionability by unit.",
            "content": {
              "summary": "A system-wide total may confirm a problem, but grouped views show where to intervene.",
              "prompt": "If no-shows are high, should leadership usually also want to know which departments or providers drive them?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Actionable no-show reporting",
              "whyItMatters": "Grouped views reveal where intervention can actually occur.",
              "whatToShare": "Move from overall totals to department or provider detail.",
              "action": "Always tie access issues to an accountable unit."
            }
          }
        ]
      },
      {
        "id": "provider_performance_sql",
        "title": "Provider Performance SQL",
        "order": 22,
        "lessons": [
          {
            "id": "pp_01",
            "type": "concept",
            "title": "Provider-Level Reporting Basics",
            "objective": "Understand how provider performance views are constructed from encounter and appointment data.",
            "sql_focus": [
              "JOIN",
              "GROUP BY",
              "COUNT",
              "AVG"
            ],
            "relevantTables": [
              "providers",
              "encounters",
              "appointments"
            ],
            "joinHint": "Provider reporting usually joins provider dimension data to activity tables.",
            "content": {
              "summary": "Provider-level SQL can support views of volume, specialty comparisons, access patterns, and operational burden.",
              "bullets": [
                "Join providers to activity",
                "Group by provider_name or specialty",
                "Be careful not to mix provider and department questions"
              ],
              "hospitalExample": "Leaders often want to compare providers, but the reporting unit must match the actual question being asked."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Provider activity visibility",
              "whyItMatters": "Provider-level views support staffing, access, and performance review.",
              "whatToShare": "Use provider grouping only when the business question is truly provider-specific.",
              "action": "Align the reporting grain to the decision-maker."
            }
          },
          {
            "id": "pp_02",
            "type": "challenge",
            "title": "Encounters by Provider",
            "objective": "Return provider_name and encounter count.",
            "sql_focus": [
              "JOIN",
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "providers",
              "encounters"
            ],
            "joinHint": "encounters.provider_id = providers.provider_id",
            "starterQuery": "SELECT p.provider_name, COUNT(*) AS encounter_count FROM encounters e JOIN providers p ON e.provider_id = p.provider_id GROUP BY p.provider_name;",
            "solutionQuery": "SELECT p.provider_name, COUNT(*) AS encounter_count FROM encounters e JOIN providers p ON e.provider_id = p.provider_id GROUP BY p.provider_name;",
            "hint": "Join encounters to providers and group by provider_name.",
            "executiveTakeaway": null
          },
          {
            "id": "pp_03",
            "type": "challenge",
            "title": "Appointments by Provider",
            "objective": "Return provider_name and appointment count.",
            "sql_focus": [
              "JOIN",
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "providers",
              "appointments"
            ],
            "joinHint": "appointments.provider_id = providers.provider_id",
            "starterQuery": "SELECT p.provider_name, COUNT(*) AS appointment_count FROM appointments a JOIN providers p ON a.provider_id = p.provider_id GROUP BY p.provider_name;",
            "solutionQuery": "SELECT p.provider_name, COUNT(*) AS appointment_count FROM appointments a JOIN providers p ON a.provider_id = p.provider_id GROUP BY p.provider_name;",
            "hint": "Join appointments to providers and group by provider_name.",
            "executiveTakeaway": null
          },
          {
            "id": "pp_04",
            "type": "challenge",
            "title": "Average LOS by Provider",
            "objective": "Return provider_name and average LOS.",
            "sql_focus": [
              "JOIN",
              "GROUP BY",
              "AVG",
              "ROUND"
            ],
            "relevantTables": [
              "providers",
              "encounters"
            ],
            "joinHint": "encounters.provider_id = providers.provider_id",
            "starterQuery": "SELECT p.provider_name, ROUND(AVG(e.length_of_stay), 2) AS avg_los FROM encounters e JOIN providers p ON e.provider_id = p.provider_id GROUP BY p.provider_name;",
            "solutionQuery": "SELECT p.provider_name, ROUND(AVG(e.length_of_stay), 2) AS avg_los FROM encounters e JOIN providers p ON e.provider_id = p.provider_id GROUP BY p.provider_name;",
            "hint": "Join encounters to providers, group by provider_name, and average LOS.",
            "executiveTakeaway": null
          },
          {
            "id": "pp_05",
            "type": "scenario",
            "title": "Provider Grain Scenario",
            "objective": "Recognize why reporting grain matters.",
            "sql_focus": [],
            "relevantTables": [
              "providers",
              "encounters",
              "appointments"
            ],
            "joinHint": "Think accountability and business question.",
            "content": {
              "summary": "A report can be technically correct but still wrong for the decision if the grain does not match the question.",
              "prompt": "If leadership asks about provider performance, should you usually group by provider rather than only by department?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Correct reporting grain",
              "whyItMatters": "Wrong grouping hides the accountable unit.",
              "whatToShare": "Match provider questions with provider-level output.",
              "action": "Confirm the grain before building the metric."
            }
          }
        ]
      },
      {
        "id": "executive_summary_sql",
        "title": "Executive Summary SQL",
        "order": 23,
        "lessons": [
          {
            "id": "ex_01",
            "type": "concept",
            "title": "What Makes SQL Executive-Ready",
            "objective": "Understand how to shape technical results for leadership use.",
            "sql_focus": [
              "GROUP BY",
              "ORDER BY",
              "SUM",
              "COUNT",
              "AVG",
              "CASE"
            ],
            "relevantTables": [
              "claims",
              "charges",
              "encounters",
              "appointments"
            ],
            "joinHint": "Choose the metric and grouping that leadership can act on.",
            "content": {
              "summary": "Executive-ready SQL is not just correct. It is concise, prioritized, and tied to a business decision.",
              "bullets": [
                "Use grouped summaries instead of raw row dumps",
                "Rank outputs when leaders need prioritization",
                "Translate technical output into operational meaning"
              ],
              "hospitalExample": "A good analyst does not just return data. They frame what matters, why it matters, and what action should follow."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Executive-facing summary quality",
              "whyItMatters": "Leaders need interpretable, prioritized information rather than raw extracts.",
              "whatToShare": "Provide grouped results, ranking, and business framing.",
              "action": "Always ask what decision the SQL is meant to support."
            }
          },
          {
            "id": "ex_02",
            "type": "challenge",
            "title": "Top Payers by Charges",
            "objective": "Return payer and total charges ordered highest to lowest.",
            "sql_focus": [
              "GROUP BY",
              "SUM",
              "ORDER BY"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer ORDER BY total_amount DESC;",
            "solutionQuery": "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer ORDER BY total_amount DESC;",
            "hint": "Group by payer, sum amount, then sort descending.",
            "executiveTakeaway": null
          },
          {
            "id": "ex_03",
            "type": "challenge",
            "title": "Top Departments by Encounters",
            "objective": "Return department and encounter count ordered highest to lowest.",
            "sql_focus": [
              "GROUP BY",
              "COUNT",
              "ORDER BY"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department ORDER BY encounter_count DESC;",
            "solutionQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department ORDER BY encounter_count DESC;",
            "hint": "Group by department, count rows, and sort descending.",
            "executiveTakeaway": null
          },
          {
            "id": "ex_04",
            "type": "challenge",
            "title": "Denied Dollars by Payer",
            "objective": "Return payer and denied dollars ordered highest to lowest.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "SUM",
              "ORDER BY"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "solutionQuery": "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "hint": "Filter denied claims, group by payer, sum billed_amount, and rank descending.",
            "executiveTakeaway": null
          },
          {
            "id": "ex_05",
            "type": "scenario",
            "title": "Leadership Summary Scenario",
            "objective": "Recognize what should be surfaced first for executives.",
            "sql_focus": [],
            "relevantTables": [
              "claims",
              "charges",
              "encounters"
            ],
            "joinHint": "Think actionability and priority.",
            "content": {
              "summary": "Leadership usually needs the most material issues first, not an undifferentiated export.",
              "prompt": "If you are briefing executives, should you usually rank the biggest issues first instead of showing an unsorted full dataset?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Executive prioritization",
              "whyItMatters": "Ranking focuses attention on what most needs action.",
              "whatToShare": "Lead with the biggest risks, opportunities, or exceptions.",
              "action": "Sort by impact before presenting upward."
            }
          }
        ]
      },
      {
        "id": "join_strategy",
        "title": "Join Strategy",
        "order": 1,
        "lessons": [
          {
            "id": "t2_js_01",
            "type": "concept",
            "title": "Understanding Data Grain",
            "objective": "Understand why encounter-level, patient-level, and provider-level reporting require different grains.",
            "sql_focus": [
              "JOIN",
              "GROUP BY"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "providers",
              "departments"
            ],
            "joinHint": "Start with the table that matches the reporting grain, then join outward for attributes.",
            "content": {
              "summary": "Data grain is the level each row represents. Choosing the wrong grain causes duplicates, incorrect counts, and misleading metrics.",
              "bullets": [
                "Encounter grain means one row per visit",
                "Patient grain means one row per person",
                "Provider grain means one row per provider summary",
                "Joining at the wrong grain can inflate counts"
              ],
              "hospitalExample": "If leadership asks for encounter volume by provider, encounter rows should stay the base grain while provider data is joined in."
            },
            "executiveTakeaway": null
          },
          {
            "id": "t2_js_02",
            "type": "challenge",
            "title": "Join Encounters to Patients",
            "objective": "Return encounter_id, first_name, last_name, and insurance_type.",
            "sql_focus": [
              "JOIN"
            ],
            "relevantTables": [
              "encounters",
              "patients"
            ],
            "joinHint": "encounters.patient_id = patients.patient_id",
            "starterQuery": "SELECT e.encounter_id, p.first_name, p.last_name, p.insurance_type FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
            "solutionQuery": "SELECT e.encounter_id, p.first_name, p.last_name, p.insurance_type FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
            "hint": "Join encounters to patients on patient_id.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_js_03",
            "type": "scenario",
            "title": "Choosing the Correct Base Table",
            "objective": "Recognize which table should drive an encounter-volume analysis.",
            "sql_focus": [],
            "relevantTables": [
              "encounters",
              "patients",
              "providers"
            ],
            "joinHint": "Think about what one row should represent.",
            "content": {
              "summary": "Many SQL errors happen before the query even starts, when the wrong table is chosen as the base.",
              "prompt": "If you need visit counts by provider, should encounters usually be the base table rather than providers?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": null
          },
          {
            "id": "t2_js_04",
            "type": "challenge",
            "title": "Join Encounters to Providers",
            "objective": "Return encounter_id and provider_name by joining encounters to providers.",
            "sql_focus": [
              "JOIN"
            ],
            "relevantTables": [
              "encounters",
              "providers"
            ],
            "joinHint": "encounters.provider_id = providers.provider_id",
            "starterQuery": "SELECT e.encounter_id, p.provider_name FROM encounters e JOIN providers p ON e.provider_id = p.provider_id;",
            "solutionQuery": "SELECT e.encounter_id, p.provider_name FROM encounters e JOIN providers p ON e.provider_id = p.provider_id;",
            "hint": "Join encounters to providers on provider_id.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_js_05",
            "type": "scenario",
            "title": "Protecting the Grain",
            "objective": "Recognize that the base table should match the grain of the KPI before adding joins.",
            "sql_focus": [],
            "relevantTables": [
              "encounters",
              "charges",
              "claims"
            ],
            "joinHint": "Think one row per encounter before joining one-to-many tables.",
            "content": {
              "summary": "Analysts often break KPIs by joining detail tables before deciding what one row should represent.",
              "prompt": "If the metric is encounter count, should the query usually start from encounters and only then join other tables carefully?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Grain-safe reporting",
              "whyItMatters": "Wrong grain can inflate counts and destroy trust in the dashboard.",
              "whatToShare": "State the reporting grain before presenting the result.",
              "action": "Validate row counts after every one-to-many join."
            }
          }
        ]
      },
      {
        "id": "left_joins_missing_data",
        "title": "Left Joins and Missing Data",
        "order": 2,
        "lessons": [
          {
            "id": "t2_lj_01",
            "type": "concept",
            "title": "INNER JOIN vs LEFT JOIN",
            "objective": "Understand when unmatched rows should be preserved.",
            "sql_focus": [
              "LEFT JOIN",
              "IS NULL"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "appointments"
            ],
            "joinHint": "Use LEFT JOIN when the left table defines the full population you want to preserve.",
            "content": {
              "summary": "LEFT JOIN keeps all rows from the left table even when no match exists in the joined table.",
              "bullets": [
                "INNER JOIN keeps only matched rows",
                "LEFT JOIN preserves the full left-side denominator",
                "NULLs after a LEFT JOIN often indicate missing activity",
                "LEFT JOIN is critical for access and gap analyses"
              ],
              "hospitalExample": "If you want all patients, including those without appointments, patients should stay on the left side."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Denominator preservation",
              "whyItMatters": "Dropping unmatched rows can hide access gaps.",
              "whatToShare": "Clarify whether unmatched records were included or excluded.",
              "action": "Use LEFT JOIN when missing activity is itself the finding."
            }
          },
          {
            "id": "t2_lj_02",
            "type": "challenge",
            "title": "Patients Without Encounters",
            "objective": "Return patient_id, first_name, and last_name for patients with no encounter.",
            "sql_focus": [
              "LEFT JOIN",
              "WHERE",
              "IS NULL"
            ],
            "relevantTables": [
              "patients",
              "encounters"
            ],
            "joinHint": "patients.patient_id = encounters.patient_id",
            "starterQuery": "SELECT p.patient_id, p.first_name, p.last_name FROM patients p LEFT JOIN encounters e ON p.patient_id = e.patient_id WHERE e.encounter_id IS NULL;",
            "solutionQuery": "SELECT p.patient_id, p.first_name, p.last_name FROM patients p LEFT JOIN encounters e ON p.patient_id = e.patient_id WHERE e.encounter_id IS NULL;",
            "hint": "LEFT JOIN encounters to patients, then keep only rows where encounter_id is NULL.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_lj_03",
            "type": "scenario",
            "title": "Finding Missing Activity",
            "objective": "Recognize why LEFT JOIN is useful for identifying gaps.",
            "sql_focus": [],
            "relevantTables": [
              "patients",
              "appointments"
            ],
            "joinHint": "Think preserved population first.",
            "content": {
              "summary": "Gap analyses are about who or what did not have activity, so matched rows alone are not enough.",
              "prompt": "If leadership wants to know which departments had no appointments, should unmatched rows be preserved with a LEFT JOIN?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Access gap visibility",
              "whyItMatters": "Missing activity can be operationally important.",
              "whatToShare": "Include units with zero activity when that absence matters.",
              "action": "Use preserved-population logic for gap analysis."
            }
          },
          {
            "id": "t2_lj_04",
            "type": "challenge",
            "title": "Departments Without Appointments",
            "objective": "Return department_name for departments with no matching appointments.",
            "sql_focus": [
              "LEFT JOIN",
              "IS NULL"
            ],
            "relevantTables": [
              "departments",
              "appointments"
            ],
            "joinHint": "departments.department_id = appointments.department_id",
            "starterQuery": "SELECT d.department_name FROM departments d LEFT JOIN appointments a ON d.department_id = a.department_id WHERE a.appointment_id IS NULL;",
            "solutionQuery": "SELECT d.department_name FROM departments d LEFT JOIN appointments a ON d.department_id = a.department_id WHERE a.appointment_id IS NULL;",
            "hint": "LEFT JOIN appointments to departments and filter where appointment_id is NULL.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_lj_05",
            "type": "scenario",
            "title": "Preserving the Denominator",
            "objective": "Recognize why LEFT JOIN supports accurate denominators.",
            "sql_focus": [],
            "relevantTables": [
              "patients",
              "encounters"
            ],
            "joinHint": "Think total eligible population.",
            "content": {
              "summary": "Some KPIs depend on the full eligible population, not just those with activity.",
              "prompt": "If your denominator is all patients, should an INNER JOIN to encounters usually be avoided because it removes patients with no visits?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Trusted denominator logic",
              "whyItMatters": "The wrong join type can quietly shrink the denominator.",
              "whatToShare": "Document what population is being preserved in the query.",
              "action": "Check denominator logic before discussing rates."
            }
          }
        ]
      },
      {
        "id": "date_filters_reporting_periods",
        "title": "Date Filters and Reporting Periods",
        "order": 3,
        "lessons": [
          {
            "id": "t2_dt_01",
            "type": "concept",
            "title": "Filtering by Reporting Period",
            "objective": "Understand how date filters define the reporting window.",
            "sql_focus": [
              "WHERE",
              "BETWEEN",
              "strftime"
            ],
            "relevantTables": [
              "encounters",
              "appointments"
            ],
            "joinHint": "Use admit_date, discharge_date, or date depending on the business question.",
            "content": {
              "summary": "Time-based reporting depends on explicitly choosing the date field and reporting window that match the metric definition.",
              "bullets": [
                "Different date fields answer different questions",
                "Monthly reporting should use a clearly defined time column",
                "The reporting period should be explicit and reproducible",
                "Trend summaries depend on consistent date logic"
              ],
              "hospitalExample": "A discharge-based metric should not accidentally be filtered on admit_date if leadership expects discharge month reporting."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Reporting period consistency",
              "whyItMatters": "Mismatched date logic changes the meaning of the metric.",
              "whatToShare": "State which date field defines the reporting period.",
              "action": "Lock the date logic before trending results."
            }
          },
          {
            "id": "t2_dt_02",
            "type": "challenge",
            "title": "Admissions in 2025",
            "objective": "Return encounter_id, patient_id, and admit_date for encounters admitted in 2025.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, patient_id, admit_date FROM encounters WHERE admit_date BETWEEN '2025-01-01' AND '2025-12-31';",
            "solutionQuery": "SELECT encounter_id, patient_id, admit_date FROM encounters WHERE admit_date BETWEEN '2025-01-01' AND '2025-12-31';",
            "hint": "Filter admit_date between 2025-01-01 and 2025-12-31.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_dt_03",
            "type": "scenario",
            "title": "Choosing the Right Date Field",
            "objective": "Recognize why date-field selection changes the story.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think event timing.",
            "content": {
              "summary": "The same table may have multiple time columns, and each one reflects a different operational milestone.",
              "prompt": "If the question is discharges by month, should discharge_date usually define the month instead of admit_date?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Correct time attribution",
              "whyItMatters": "Wrong date fields misplace volume into the wrong periods.",
              "whatToShare": "Tie the date field to the event leadership is asking about.",
              "action": "Validate the time anchor before distribution."
            }
          },
          {
            "id": "t2_dt_04",
            "type": "challenge",
            "title": "Encounter Count by Admit Month",
            "objective": "Return admit_month and encounter_count.",
            "sql_focus": [
              "GROUP BY",
              "COUNT",
              "strftime"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT strftime('%Y-%m', admit_date) AS admit_month, COUNT(*) AS encounter_count FROM encounters GROUP BY strftime('%Y-%m', admit_date) ORDER BY admit_month;",
            "solutionQuery": "SELECT strftime('%Y-%m', admit_date) AS admit_month, COUNT(*) AS encounter_count FROM encounters GROUP BY strftime('%Y-%m', admit_date) ORDER BY admit_month;",
            "hint": "Use strftime('%Y-%m', admit_date), group by it, and count rows.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_dt_05",
            "type": "scenario",
            "title": "Trend Interpretation",
            "objective": "Recognize why consistent period logic matters for trends.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think apples-to-apples comparison.",
            "content": {
              "summary": "Trend lines only mean something when each period is built using the same logic and same date anchor.",
              "prompt": "If monthly comparisons use different date fields across reports, can those trends become misleading?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Reliable trending",
              "whyItMatters": "Inconsistent period logic makes trends untrustworthy.",
              "whatToShare": "Keep monthly logic consistent across all periods.",
              "action": "Standardize period definitions before presenting trends."
            }
          }
        ]
      },
      {
        "id": "conditional_aggregation",
        "title": "Conditional Aggregation",
        "order": 4,
        "lessons": [
          {
            "id": "t2_ca_01",
            "type": "concept",
            "title": "Building KPIs with Conditional Aggregation",
            "objective": "Use CASE inside aggregates to build multi-part metrics in one query.",
            "sql_focus": [
              "CASE",
              "SUM",
              "COUNT"
            ],
            "relevantTables": [
              "encounters",
              "claims",
              "appointments"
            ],
            "joinHint": "Conditional aggregation lets one grouped query calculate multiple business measures.",
            "content": {
              "summary": "Conditional aggregation is one of the most useful SQL patterns for dashboards because it turns categories into KPI columns.",
              "bullets": [
                "CASE inside SUM can count condition-specific rows",
                "One query can produce several related KPIs",
                "This pattern is common in dashboards",
                "It reduces the need for multiple separate queries"
              ],
              "hospitalExample": "A single access query can report completed, cancelled, and no-show appointment counts side by side."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Multi-KPI summary construction",
              "whyItMatters": "Leadership often wants several related metrics together.",
              "whatToShare": "Group once, then create multiple KPI columns with CASE.",
              "action": "Use conditional aggregation to simplify dashboard logic."
            }
          },
          {
            "id": "t2_ca_02",
            "type": "challenge",
            "title": "Appointment Status Counts",
            "objective": "Return completed_count and no_show_count from appointments.",
            "sql_focus": [
              "CASE",
              "SUM"
            ],
            "relevantTables": [
              "appointments"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_count, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) AS no_show_count FROM appointments;",
            "solutionQuery": "SELECT SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_count, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) AS no_show_count FROM appointments;",
            "hint": "Use CASE inside SUM for both Completed and No Show.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_ca_03",
            "type": "scenario",
            "title": "Multi-Metric Reporting",
            "objective": "Recognize why leaders prefer several KPI columns in one grouped result.",
            "sql_focus": [],
            "relevantTables": [
              "appointments",
              "claims"
            ],
            "joinHint": "Think concise summary table.",
            "content": {
              "summary": "Decision-makers often prefer one grouped view with several metrics rather than several separate outputs they must mentally combine.",
              "prompt": "If leadership wants completed visits and no-shows by department in one table, is conditional aggregation usually a strong approach?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Compact KPI reporting",
              "whyItMatters": "One grouped table is easier to interpret than multiple disconnected queries.",
              "whatToShare": "Show related KPIs side by side when they support the same decision.",
              "action": "Use CASE-based metrics in grouped summaries."
            }
          },
          {
            "id": "t2_ca_04",
            "type": "challenge",
            "title": "Encounter Type Counts by Facility",
            "objective": "Return facility, inpatient_count, and emergency_count.",
            "sql_focus": [
              "GROUP BY",
              "CASE",
              "SUM"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT facility, SUM(CASE WHEN encounter_type = 'Inpatient' THEN 1 ELSE 0 END) AS inpatient_count, SUM(CASE WHEN encounter_type = 'Emergency' THEN 1 ELSE 0 END) AS emergency_count FROM encounters GROUP BY facility;",
            "solutionQuery": "SELECT facility, SUM(CASE WHEN encounter_type = 'Inpatient' THEN 1 ELSE 0 END) AS inpatient_count, SUM(CASE WHEN encounter_type = 'Emergency' THEN 1 ELSE 0 END) AS emergency_count FROM encounters GROUP BY facility;",
            "hint": "Group by facility and use CASE inside SUM for each encounter type.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_ca_05",
            "type": "scenario",
            "title": "Operational Interpretation",
            "objective": "Recognize why segmented counts are more useful than one total.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think operational meaning.",
            "content": {
              "summary": "A single total may confirm volume, but segmented KPI columns explain what kinds of volume are driving the result.",
              "prompt": "If one facility has the same total encounters as another but a much higher emergency_count, does the segmented view provide more operational insight than the total alone?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Segmented activity mix",
              "whyItMatters": "Composition often matters as much as total volume.",
              "whatToShare": "Pair totals with component breakdowns.",
              "action": "Use conditional categories to reveal what is driving the metric."
            }
          }
        ]
      },
      {
        "id": "distinct_counts_and_grain",
        "title": "Distinct Counts and Data Grain",
        "order": 5,
        "lessons": [
          {
            "id": "t2_dc_01",
            "type": "concept",
            "title": "COUNT vs COUNT DISTINCT",
            "objective": "Understand when counting rows is different from counting unique entities.",
            "sql_focus": [
              "COUNT",
              "COUNT DISTINCT"
            ],
            "relevantTables": [
              "encounters",
              "patients",
              "appointments"
            ],
            "joinHint": "Use COUNT(*) for row volume and COUNT(DISTINCT ...) for unique entities.",
            "content": {
              "summary": "Distinct counting prevents one entity from being counted multiple times when it appears across many rows.",
              "bullets": [
                "Encounter count is not the same as patient count",
                "One patient can have many encounters",
                "Distinct counts are often needed for denominators",
                "Wrong counting methods can inflate utilization"
              ],
              "hospitalExample": "A clinic with 100 visits may only have 60 unique patients, and those two numbers answer different questions."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Unique population measurement",
              "whyItMatters": "Volume and unique reach are not the same thing.",
              "whatToShare": "Specify whether the metric counts visits or people.",
              "action": "Choose DISTINCT when unique entities matter."
            }
          },
          {
            "id": "t2_dc_02",
            "type": "challenge",
            "title": "Unique Patients by Department",
            "objective": "Return department and unique_patient_count.",
            "sql_focus": [
              "GROUP BY",
              "COUNT DISTINCT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT department, COUNT(DISTINCT patient_id) AS unique_patient_count FROM encounters GROUP BY department;",
            "solutionQuery": "SELECT department, COUNT(DISTINCT patient_id) AS unique_patient_count FROM encounters GROUP BY department;",
            "hint": "Group by department and count distinct patient_id.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_dc_03",
            "type": "scenario",
            "title": "Visits vs Patients",
            "objective": "Recognize why visit volume and unique patients answer different questions.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think rows versus people.",
            "content": {
              "summary": "A high visit count can be driven by repeat utilizers, while a high unique-patient count reflects broader reach.",
              "prompt": "If leadership asks how many individual patients were seen, should COUNT(DISTINCT patient_id) usually be preferred over COUNT(*)?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Unique reach",
              "whyItMatters": "Leaders often need to know whether volume reflects many people or repeat visits.",
              "whatToShare": "Separate unique patients from total encounters.",
              "action": "State clearly whether the output is visit-based or person-based."
            }
          },
          {
            "id": "t2_dc_04",
            "type": "challenge",
            "title": "Unique Patients by Facility",
            "objective": "Return facility and unique_patient_count.",
            "sql_focus": [
              "GROUP BY",
              "COUNT DISTINCT"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT facility, COUNT(DISTINCT patient_id) AS unique_patient_count FROM encounters GROUP BY facility;",
            "solutionQuery": "SELECT facility, COUNT(DISTINCT patient_id) AS unique_patient_count FROM encounters GROUP BY facility;",
            "hint": "Group by facility and count distinct patient_id.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_dc_05",
            "type": "scenario",
            "title": "High Utilizer Interpretation",
            "objective": "Recognize when the gap between total encounters and unique patients suggests repeat utilization.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think repeated visits.",
            "content": {
              "summary": "When encounter counts are much higher than unique patient counts, repeat utilization is likely contributing to the difference.",
              "prompt": "If a department has many more encounters than unique patients, could that indicate repeat utilization by the same patients?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Repeat-utilization signal",
              "whyItMatters": "Repeat activity can indicate chronic demand or care coordination issues.",
              "whatToShare": "Compare total encounters against distinct patients.",
              "action": "Investigate areas with large gaps between rows and unique people."
            }
          }
        ]
      },
      {
        "id": "subqueries",
        "title": "Subqueries",
        "order": 6,
        "lessons": [
          {
            "id": "t2_sq_01",
            "type": "concept",
            "title": "Using Subqueries for Comparison Logic",
            "objective": "Understand how subqueries support comparisons against averages, thresholds, and filtered populations.",
            "sql_focus": [
              "SUBQUERY",
              "AVG",
              "WHERE"
            ],
            "relevantTables": [
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Subqueries are useful when the filter depends on a value calculated from the data itself.",
            "content": {
              "summary": "A subquery can calculate a comparison value first, then let the outer query filter against it.",
              "bullets": [
                "Subqueries can appear in WHERE or SELECT logic",
                "They are useful for average comparisons",
                "They help define dynamic thresholds",
                "They can keep complex logic readable"
              ],
              "hospitalExample": "To find encounters above average LOS, you first need the average LOS value, which a subquery can calculate."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Dynamic benchmark logic",
              "whyItMatters": "Some filters depend on the dataset rather than a fixed number.",
              "whatToShare": "Explain the benchmark used for comparison.",
              "action": "Use subqueries when thresholds come from the data."
            }
          },
          {
            "id": "t2_sq_02",
            "type": "challenge",
            "title": "Encounters Above Average LOS",
            "objective": "Return encounter_id and length_of_stay for encounters above the overall average LOS.",
            "sql_focus": [
              "SUBQUERY",
              "AVG",
              "WHERE"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, length_of_stay FROM encounters WHERE length_of_stay > (SELECT AVG(length_of_stay) FROM encounters);",
            "solutionQuery": "SELECT encounter_id, length_of_stay FROM encounters WHERE length_of_stay > (SELECT AVG(length_of_stay) FROM encounters);",
            "hint": "Use a subquery to get AVG(length_of_stay) from encounters.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_sq_03",
            "type": "scenario",
            "title": "Benchmark Comparison",
            "objective": "Recognize when a subquery is useful for comparing rows to a system benchmark.",
            "sql_focus": [],
            "relevantTables": [
              "encounters",
              "claims"
            ],
            "joinHint": "Think compare-to-average.",
            "content": {
              "summary": "Subqueries are especially helpful when you want rows that exceed an average or other derived benchmark.",
              "prompt": "If you need departments whose average LOS exceeds the system-wide average LOS, is subquery logic a reasonable approach?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Benchmark-based exception detection",
              "whyItMatters": "Operational review often focuses on performance relative to a benchmark.",
              "whatToShare": "Describe whether the comparison is against system average, target, or peer rate.",
              "action": "Use data-derived benchmarks when fixed thresholds are not enough."
            }
          },
          {
            "id": "t2_sq_04",
            "type": "challenge",
            "title": "Charges Above Average Amount",
            "objective": "Return charge_id and amount for charges above the average charge amount.",
            "sql_focus": [
              "SUBQUERY",
              "AVG"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT charge_id, amount FROM charges WHERE amount > (SELECT AVG(amount) FROM charges);",
            "solutionQuery": "SELECT charge_id, amount FROM charges WHERE amount > (SELECT AVG(amount) FROM charges);",
            "hint": "Use a subquery with AVG(amount).",
            "executiveTakeaway": null
          },
          {
            "id": "t2_sq_05",
            "type": "scenario",
            "title": "Executive Interpretation of Benchmarks",
            "objective": "Recognize why benchmark-based exceptions are more actionable than raw lists.",
            "sql_focus": [],
            "relevantTables": [
              "charges",
              "encounters"
            ],
            "joinHint": "Think what exceeds normal.",
            "content": {
              "summary": "Executives often care less about the full list and more about which rows or groups exceed a meaningful benchmark.",
              "prompt": "If only above-average outliers matter for review, does a benchmark-based filter make the output more actionable?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Actionable exception filtering",
              "whyItMatters": "Leadership review improves when the output is narrowed to what stands out.",
              "whatToShare": "Highlight what exceeds the benchmark instead of everything.",
              "action": "Use comparison logic to isolate meaningful exceptions."
            }
          }
        ]
      },
      {
        "id": "ctes",
        "title": "Common Table Expressions",
        "order": 7,
        "lessons": [
          {
            "id": "t2_cte_01",
            "type": "concept",
            "title": "Why CTEs Improve Complex SQL",
            "objective": "Use CTEs to break complex logic into readable steps.",
            "sql_focus": [
              "WITH",
              "CTE"
            ],
            "relevantTables": [
              "encounters",
              "claims",
              "appointments"
            ],
            "joinHint": "CTEs let you define intermediate datasets before the final query.",
            "content": {
              "summary": "Common Table Expressions improve readability, maintainability, and validation by splitting complex SQL into named steps.",
              "bullets": [
                "CTEs create named temporary result sets",
                "They make long SQL easier to debug",
                "They help isolate denominator and numerator logic",
                "They improve readability for future analysts"
              ],
              "hospitalExample": "A readmissions metric is much easier to validate when index encounters and return encounters are defined in separate named steps."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Readable analytic logic",
              "whyItMatters": "Complex metrics are easier to trust when their pieces are visible.",
              "whatToShare": "Organize multi-step logic into named intermediate sets.",
              "action": "Use CTEs when one long query becomes hard to reason about."
            }
          },
          {
            "id": "t2_cte_02",
            "type": "challenge",
            "title": "CTE for Discharged Encounters",
            "objective": "Use a CTE called discharged_encounters to return encounter_id, patient_id, and discharge_date for encounters with a non-null discharge_date.",
            "sql_focus": [
              "WITH",
              "CTE",
              "IS NOT NULL"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Define the filtered encounter set first, then select from it.",
            "starterQuery": "WITH discharged_encounters AS (SELECT encounter_id, patient_id, discharge_date FROM encounters WHERE discharge_date IS NOT NULL) SELECT encounter_id, patient_id, discharge_date FROM discharged_encounters;",
            "solutionQuery": "WITH discharged_encounters AS (SELECT encounter_id, patient_id, discharge_date FROM encounters WHERE discharge_date IS NOT NULL) SELECT encounter_id, patient_id, discharge_date FROM discharged_encounters;",
            "hint": "Use WITH discharged_encounters AS (...) and then select from it.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_cte_03",
            "type": "scenario",
            "title": "Readable Multi-Step Logic",
            "objective": "Recognize why a CTE can be better than one long nested query.",
            "sql_focus": [],
            "relevantTables": [
              "encounters",
              "claims"
            ],
            "joinHint": "Think modular logic.",
            "content": {
              "summary": "When a metric has multiple steps, readability is often just as important as technical correctness.",
              "prompt": "If a query has a denominator step, a numerator step, and then a final rate calculation, can CTEs make that logic easier to validate?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Transparent metric construction",
              "whyItMatters": "Named steps make validation and review easier.",
              "whatToShare": "Separate population-building from final calculation logic.",
              "action": "Use CTEs for multi-step KPIs."
            }
          },
          {
            "id": "t2_cte_04",
            "type": "challenge",
            "title": "CTE with Grouped Output",
            "objective": "Use a CTE called denied_claims to return payer and denied_count from denied claims.",
            "sql_focus": [
              "WITH",
              "GROUP BY",
              "COUNT",
              "WHERE"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Define denied_claims first, then aggregate from it.",
            "starterQuery": "WITH denied_claims AS (SELECT * FROM claims WHERE claim_status = 'Denied') SELECT payer, COUNT(*) AS denied_count FROM denied_claims GROUP BY payer;",
            "solutionQuery": "WITH denied_claims AS (SELECT * FROM claims WHERE claim_status = 'Denied') SELECT payer, COUNT(*) AS denied_count FROM denied_claims GROUP BY payer;",
            "hint": "Build a denied_claims CTE first, then group by payer.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_cte_05",
            "type": "scenario",
            "title": "Executive Confidence in Logic",
            "objective": "Recognize why transparent SQL design helps executive trust.",
            "sql_focus": [],
            "relevantTables": [
              "claims",
              "encounters"
            ],
            "joinHint": "Think explainability.",
            "content": {
              "summary": "Even when leaders never see the SQL, explainable logic improves the analyst's ability to defend and validate the metric.",
              "prompt": "If a KPI is likely to be questioned, can CTE-based stepwise logic make it easier to explain and defend?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Defensible metric design",
              "whyItMatters": "Transparent logic is easier to audit and explain.",
              "whatToShare": "Be ready to describe the metric in steps, not just with one final number.",
              "action": "Use readable SQL for high-visibility metrics."
            }
          }
        ]
      },
      {
        "id": "window_functions",
        "title": "Window Functions",
        "order": 8,
        "lessons": [
          {
            "id": "t2_wf_01",
            "type": "concept",
            "title": "Introduction to Window Functions",
            "objective": "Understand how window functions calculate row-level analytics without collapsing rows.",
            "sql_focus": [
              "ROW_NUMBER",
              "RANK",
              "OVER",
              "PARTITION BY",
              "ORDER BY"
            ],
            "relevantTables": [
              "encounters",
              "providers"
            ],
            "joinHint": "Window functions keep detail rows while adding rankings, sequence numbers, or cumulative values.",
            "content": {
              "summary": "Window functions are powerful because they add context to each row without forcing a grouped summary.",
              "bullets": [
                "ROW_NUMBER creates sequence within a partition",
                "RANK compares rows within a partition",
                "Window functions do not collapse rows like GROUP BY",
                "They are useful for ranking and timeline logic"
              ],
              "hospitalExample": "If you want the first encounter per patient, ROW_NUMBER can label each encounter in order within each patient group."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Row-level analytic context",
              "whyItMatters": "Some questions require both row detail and comparative context.",
              "whatToShare": "Use rankings and sequence logic when grouped summaries are not enough.",
              "action": "Apply window functions for ordering within groups."
            }
          },
          {
            "id": "t2_wf_02",
            "type": "challenge",
            "title": "Encounter Sequence by Patient",
            "objective": "Return patient_id, encounter_id, discharge_date, and encounter_sequence using ROW_NUMBER over patient_id ordered by discharge_date.",
            "sql_focus": [
              "ROW_NUMBER",
              "OVER",
              "PARTITION BY",
              "ORDER BY"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Partition by patient_id and order by discharge_date.",
            "starterQuery": "SELECT patient_id, encounter_id, discharge_date, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY discharge_date) AS encounter_sequence FROM encounters;",
            "solutionQuery": "SELECT patient_id, encounter_id, discharge_date, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY discharge_date) AS encounter_sequence FROM encounters;",
            "hint": "Use ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY discharge_date).",
            "executiveTakeaway": null
          },
          {
            "id": "t2_wf_03",
            "type": "scenario",
            "title": "First Encounter Logic",
            "objective": "Recognize why window functions help identify first or latest events.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think sequence within patient.",
            "content": {
              "summary": "Questions about first, latest, or top rows within a category are strong candidates for window functions.",
              "prompt": "If you need the first encounter for each patient, is ROW_NUMBER usually more appropriate than a simple GROUP BY alone?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "First-event identification",
              "whyItMatters": "Operational timelines often require event sequencing, not just counts.",
              "whatToShare": "Use sequence logic when the question is about order, not just totals.",
              "action": "Choose window functions for first/latest-row logic."
            }
          },
          {
            "id": "t2_wf_04",
            "type": "challenge",
            "title": "Rank Providers by Encounter Volume",
            "objective": "Return provider_id, encounter_count, and provider_rank ranked by encounter_count descending.",
            "sql_focus": [
              "RANK",
              "COUNT",
              "GROUP BY",
              "OVER",
              "ORDER BY"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Aggregate provider encounter counts first, then rank them.",
            "starterQuery": "SELECT provider_id, encounter_count, RANK() OVER (ORDER BY encounter_count DESC) AS provider_rank FROM (SELECT provider_id, COUNT(*) AS encounter_count FROM encounters GROUP BY provider_id);",
            "solutionQuery": "SELECT provider_id, encounter_count, RANK() OVER (ORDER BY encounter_count DESC) AS provider_rank FROM (SELECT provider_id, COUNT(*) AS encounter_count FROM encounters GROUP BY provider_id);",
            "hint": "Count encounters by provider in a subquery, then apply RANK() over encounter_count DESC.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_wf_05",
            "type": "scenario",
            "title": "Ranking Interpretation",
            "objective": "Recognize why rankings can be more useful than raw sorted lists.",
            "sql_focus": [],
            "relevantTables": [
              "encounters",
              "providers"
            ],
            "joinHint": "Think comparative position.",
            "content": {
              "summary": "Rankings show not just order, but relative position, which often makes discussion easier for leadership.",
              "prompt": "If leaders want to know the top providers by volume, can a ranked output be easier to discuss than a raw unsorted list?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Comparative standing",
              "whyItMatters": "Rankings clarify position and priority.",
              "whatToShare": "Use ranks when leadership needs a relative ordering.",
              "action": "Convert sorted outputs into ranked summaries when useful."
            }
          }
        ]
      },
      {
        "id": "readmissions_build_logic",
        "title": "Readmissions Build Logic",
        "order": 9,
        "lessons": [
          {
            "id": "t2_rd_01",
            "type": "concept",
            "title": "Readmissions Logic Foundations",
            "objective": "Understand how a readmissions metric links an index encounter to a later return encounter.",
            "sql_focus": [
              "JOIN",
              "WHERE",
              "DATE LOGIC"
            ],
            "relevantTables": [
              "encounters",
              "readmissions"
            ],
            "joinHint": "Readmissions metrics depend on qualifying index events and a later return within the defined window.",
            "content": {
              "summary": "A readmissions metric is only meaningful when the index population, return window, and exclusions are clearly specified.",
              "bullets": [
                "The index event must be defined",
                "The return event must occur after the index event",
                "The time window matters",
                "Specification consistency matters as much as SQL"
              ],
              "hospitalExample": "A 30-day readmission rate changes immediately if one analyst includes observation discharges and another does not."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Readmission measure specification",
              "whyItMatters": "Metric definitions drive the trustworthiness of the rate.",
              "whatToShare": "Document the index definition and return window before sharing the rate.",
              "action": "Validate specification before trend interpretation."
            }
          },
          {
            "id": "t2_rd_02",
            "type": "challenge",
            "title": "Qualifying Index Encounters",
            "objective": "Return encounter_id, patient_id, and discharge_date for inpatient encounters with a non-null discharge_date.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT encounter_id, patient_id, discharge_date FROM encounters WHERE encounter_type = 'Inpatient' AND discharge_date IS NOT NULL;",
            "solutionQuery": "SELECT encounter_id, patient_id, discharge_date FROM encounters WHERE encounter_type = 'Inpatient' AND discharge_date IS NOT NULL;",
            "hint": "Filter to encounter_type = 'Inpatient' and discharge_date IS NOT NULL.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_rd_03",
            "type": "scenario",
            "title": "Readmission Governance",
            "objective": "Recognize why inconsistent denominator logic breaks comparability.",
            "sql_focus": [],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Think consistent specification.",
            "content": {
              "summary": "Even perfectly written SQL produces untrustworthy rates if the business definition is not standardized.",
              "prompt": "If one report excludes observation stays from the index denominator and another includes them, are the readmission rates directly comparable?",
              "expectedAnswer": "no"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Readmission comparability",
              "whyItMatters": "Different denominators produce different rates.",
              "whatToShare": "Standardize what counts as an eligible index event.",
              "action": "Do not compare rates built from different specifications."
            }
          },
          {
            "id": "t2_rd_04",
            "type": "challenge",
            "title": "Count 30-Day Readmission Flags by Facility",
            "objective": "Return facility and readmit_count for rows where readmit_within_30_days = 1.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "readmissions"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT facility, COUNT(*) AS readmit_count FROM readmissions WHERE readmit_within_30_days = 1 GROUP BY facility;",
            "solutionQuery": "SELECT facility, COUNT(*) AS readmit_count FROM readmissions WHERE readmit_within_30_days = 1 GROUP BY facility;",
            "hint": "Filter readmit_within_30_days = 1, then group by facility.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_rd_05",
            "type": "scenario",
            "title": "Operational Interpretation of Readmissions",
            "objective": "Recognize why readmission counts alone are not enough without denominator context.",
            "sql_focus": [],
            "relevantTables": [
              "readmissions",
              "encounters"
            ],
            "joinHint": "Think rate, not just volume.",
            "content": {
              "summary": "Facilities with higher discharge volume may naturally have more readmission counts, so counts alone can be misleading.",
              "prompt": "If one facility has more readmissions but also far more discharges, should leadership usually want a readmission rate instead of count alone?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Rate-based readmission review",
              "whyItMatters": "Counts do not account for underlying discharge volume.",
              "whatToShare": "Pair readmission counts with denominator-based rates.",
              "action": "Avoid interpreting counts without context."
            }
          }
        ]
      },
      {
        "id": "observation_and_throughput_logic",
        "title": "Observation and Throughput Logic",
        "order": 10,
        "lessons": [
          {
            "id": "t2_ot_01",
            "type": "concept",
            "title": "Observation and Throughput Reporting",
            "objective": "Understand how observation and discharge workflow metrics reflect operational efficiency.",
            "sql_focus": [
              "AVG",
              "WHERE",
              "GROUP BY"
            ],
            "relevantTables": [
              "observations",
              "discharges",
              "encounters"
            ],
            "joinHint": "Observation and throughput metrics often focus on hours, delays, and conversion patterns.",
            "content": {
              "summary": "Throughput metrics explain how efficiently patients move through the hospital, while observation metrics explain status management and prolonged stays.",
              "bullets": [
                "Observation hours reflect utilization burden",
                "Discharge timing reflects operational friction",
                "Department and facility rollups support manager action",
                "Threshold-based exceptions are common"
              ],
              "hospitalExample": "A prolonged observation stay may indicate throughput bottlenecks, status issues, or downstream discharge barriers."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Throughput and status efficiency",
              "whyItMatters": "These measures affect flow, capacity, and patient experience.",
              "whatToShare": "Highlight long stays, delayed departures, and conversion patterns.",
              "action": "Investigate units with persistent delay patterns."
            }
          },
          {
            "id": "t2_ot_02",
            "type": "challenge",
            "title": "Average Observation Hours by Facility",
            "objective": "Return facility and avg_obs_hours.",
            "sql_focus": [
              "GROUP BY",
              "AVG"
            ],
            "relevantTables": [
              "observations"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT facility, AVG(obs_hours) AS avg_obs_hours FROM observations GROUP BY facility;",
            "solutionQuery": "SELECT facility, AVG(obs_hours) AS avg_obs_hours FROM observations GROUP BY facility;",
            "hint": "Group by facility and average obs_hours.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_ot_03",
            "type": "scenario",
            "title": "Observation Review Scenario",
            "objective": "Recognize why average observation hours should be paired with long-stay exceptions.",
            "sql_focus": [],
            "relevantTables": [
              "observations"
            ],
            "joinHint": "Think mean plus outliers.",
            "content": {
              "summary": "An average can hide whether the issue is widespread or driven by a smaller number of very long stays.",
              "prompt": "If average observation hours rise, should you usually also look at long observation cases rather than stopping at the average alone?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Observation exception review",
              "whyItMatters": "Averages alone can hide operational outliers.",
              "whatToShare": "Pair average duration with long-stay exception counts.",
              "action": "Do not stop at the average."
            }
          },
          {
            "id": "t2_ot_04",
            "type": "challenge",
            "title": "Discharge Delays Over 240 Minutes",
            "objective": "Return discharge_id, department, and departure_minutes for discharges where departure_minutes > 240.",
            "sql_focus": [
              "WHERE"
            ],
            "relevantTables": [
              "discharges"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT discharge_id, department, departure_minutes FROM discharges WHERE departure_minutes > 240;",
            "solutionQuery": "SELECT discharge_id, department, departure_minutes FROM discharges WHERE departure_minutes > 240;",
            "hint": "Filter departure_minutes > 240.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_ot_05",
            "type": "scenario",
            "title": "Department-Level Throughput Action",
            "objective": "Recognize why throughput problems should usually be broken out by department.",
            "sql_focus": [],
            "relevantTables": [
              "discharges"
            ],
            "joinHint": "Think manager actionability.",
            "content": {
              "summary": "A hospital total confirms the problem exists, but department-level results show where leaders can intervene.",
              "prompt": "If discharge delays over 240 minutes are increasing, should leadership usually want the result broken out by department?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Department throughput accountability",
              "whyItMatters": "Operational action happens at the unit level.",
              "whatToShare": "Move from hospital totals to department-specific exception views.",
              "action": "Tie throughput problems to accountable areas."
            }
          }
        ]
      },
      {
        "id": "revenue_cycle_denials_analysis",
        "title": "Revenue Cycle and Denials Analysis",
        "order": 11,
        "lessons": [
          {
            "id": "t2_dn_01",
            "type": "concept",
            "title": "Denials as a Revenue Cycle KPI",
            "objective": "Understand why denials should be analyzed by both count and dollars.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "SUM",
              "COUNT"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Denials can be measured as volume, dollar exposure, or both.",
            "content": {
              "summary": "A denial analysis should usually separate denial count from denied dollars because the largest financial issue is not always the largest volume issue.",
              "bullets": [
                "Count shows operational workload",
                "Denied dollars show financial impact",
                "Payer grouping helps focus action",
                "High-dollar denials may deserve priority even at lower volume"
              ],
              "hospitalExample": "A payer with fewer denied claims can still be the biggest problem if its denied dollars are much higher than everyone else's."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Denial count and dollar exposure",
              "whyItMatters": "Revenue cycle action depends on both workload and financial impact.",
              "whatToShare": "Present both denial count and denied dollars.",
              "action": "Prioritize high-dollar categories first."
            }
          },
          {
            "id": "t2_dn_02",
            "type": "challenge",
            "title": "Denied Claims by Payer",
            "objective": "Return payer and denied_claim_count.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "COUNT"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT payer, COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
            "solutionQuery": "SELECT payer, COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
            "hint": "Filter denied claims, then group by payer.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_dn_03",
            "type": "scenario",
            "title": "Count vs Dollars Scenario",
            "objective": "Recognize why a payer with fewer denials can still be the higher priority issue.",
            "sql_focus": [],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Think financial impact.",
            "content": {
              "summary": "Operational focus should not be driven by count alone when dollar exposure differs meaningfully.",
              "prompt": "If Payer A has fewer denied claims than Payer B but much higher denied dollars, should leadership still consider Payer A a priority?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "High-impact denial prioritization",
              "whyItMatters": "Dollar risk can outweigh raw volume.",
              "whatToShare": "Separate count-based and dollar-based prioritization.",
              "action": "Escalate high-dollar denial categories."
            }
          },
          {
            "id": "t2_dn_04",
            "type": "challenge",
            "title": "Denied Dollars by Payer",
            "objective": "Return payer and denied_dollars ordered highest to lowest.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "SUM",
              "ORDER BY"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "solutionQuery": "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "hint": "Filter denied claims, sum billed_amount by payer, and order descending.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_dn_05",
            "type": "scenario",
            "title": "Executive Denials Summary",
            "objective": "Recognize what leaders should usually see first in a denials review.",
            "sql_focus": [],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Think ranked material issues.",
            "content": {
              "summary": "Leaders usually need the biggest financial risks first, not an undifferentiated file of all denied claims.",
              "prompt": "If you are preparing a denials briefing for executives, should you usually rank denied dollars by payer instead of showing raw claim detail first?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Executive denial prioritization",
              "whyItMatters": "Ranking focuses attention on the biggest financial issues.",
              "whatToShare": "Lead with the highest-dollar denial categories.",
              "action": "Sort by impact before presenting upward."
            }
          }
        ]
      },
      {
        "id": "executive_rollups_and_framing",
        "title": "Executive Rollups and Analyst Framing",
        "order": 12,
        "lessons": [
          {
            "id": "t2_ex_01",
            "type": "concept",
            "title": "What Makes an Intermediate Query Executive-Ready",
            "objective": "Understand how to turn technically correct output into decision-support reporting.",
            "sql_focus": [
              "GROUP BY",
              "ORDER BY",
              "CASE",
              "SUM",
              "COUNT",
              "AVG"
            ],
            "relevantTables": [
              "encounters",
              "claims",
              "charges",
              "appointments"
            ],
            "joinHint": "Use the grouping and metric that aligns to the decision-maker's level of action.",
            "content": {
              "summary": "Executive-ready SQL is concise, prioritized, and tied to a business question. It does not stop at correctness.",
              "bullets": [
                "Group by the accountable unit",
                "Use rates, counts, or dollars appropriately",
                "Rank results when priority matters",
                "Translate raw output into business meaning"
              ],
              "hospitalExample": "A good executive summary shows where the issue is, how big it is, and what likely needs attention next."
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Executive-ready analytic output",
              "whyItMatters": "Leaders need prioritized, interpretable information.",
              "whatToShare": "Summarize what matters, why it matters, and where action should happen.",
              "action": "Design SQL around the decision it supports."
            }
          },
          {
            "id": "t2_ex_02",
            "type": "challenge",
            "title": "Executive Summary of Encounters by Department",
            "objective": "Return department and encounter_count ordered highest to lowest.",
            "sql_focus": [
              "GROUP BY",
              "COUNT",
              "ORDER BY"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department ORDER BY encounter_count DESC;",
            "solutionQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department ORDER BY encounter_count DESC;",
            "hint": "Group by department, count rows, and sort descending.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_ex_03",
            "type": "scenario",
            "title": "Actionability Scenario",
            "objective": "Recognize why grouped and ranked summaries are more useful than raw detail for executives.",
            "sql_focus": [],
            "relevantTables": [
              "encounters",
              "claims"
            ],
            "joinHint": "Think decision support.",
            "content": {
              "summary": "Executives usually need to know which areas deserve attention first rather than reading through raw detail extracts.",
              "prompt": "If leadership is short on time, is a ranked grouped summary usually more useful than a full raw export?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Leadership-focused summary design",
              "whyItMatters": "Decision-makers need signal, not noise.",
              "whatToShare": "Use grouped and ranked results for quick prioritization.",
              "action": "Reduce clutter before sharing upward."
            }
          },
          {
            "id": "t2_ex_04",
            "type": "challenge",
            "title": "Executive Summary of No-Shows by Department",
            "objective": "Return department and no_show_count ordered highest to lowest.",
            "sql_focus": [
              "WHERE",
              "GROUP BY",
              "COUNT",
              "ORDER BY"
            ],
            "relevantTables": [
              "appointments"
            ],
            "joinHint": "No join needed.",
            "starterQuery": "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department ORDER BY no_show_count DESC;",
            "solutionQuery": "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department ORDER BY no_show_count DESC;",
            "hint": "Filter to No Show, then group by department and order descending.",
            "executiveTakeaway": null
          },
          {
            "id": "t2_ex_05",
            "type": "scenario",
            "title": "Analyst Framing Scenario",
            "objective": "Recognize that analysts should frame the result, not just return data.",
            "sql_focus": [],
            "relevantTables": [
              "appointments",
              "claims",
              "encounters"
            ],
            "joinHint": "Think insight plus implication.",
            "content": {
              "summary": "An analyst adds value by connecting the result to operational meaning and likely next steps, not just by producing the dataset.",
              "prompt": "If one department clearly leads in no-shows, should the analyst usually frame that as a department-level access opportunity instead of just handing over the table?",
              "expectedAnswer": "yes"
            },
            "executiveTakeaway": {
              "show": true,
              "metric": "Analyst framing quality",
              "whyItMatters": "Data becomes useful when tied to implication and action.",
              "whatToShare": "State what stands out and what it likely means.",
              "action": "Do not stop at returning the table."
            }
          }
        ]
      }
    ]
  }
];

// ======================
// HELPER FUNCTIONS
// ======================
function getTrack() {
    return curriculum.find(t => t.id === appState.currentTrackId) || curriculum[0];
}


function getAllCategories() {
    return getTrack().categories || [];
}

function getVisibleCategories() {
    const categories = getAllCategories();
    if (!activeDifficultyFilter) return categories;

    const matchedLevel = LEARNING_LEVELS.find(level => level.label === activeDifficultyFilter);
    if (!matchedLevel) return categories;

    return categories.filter(category => matchedLevel.categoryIds.includes(category.id));
}

function getLearningLevelStats() {
    return LEARNING_LEVELS.map(level => {
        const categories = getAllCategories().filter(category => level.categoryIds.includes(category.id));
        const totalLessons = categories.reduce((sum, category) => sum + category.lessons.length, 0);
        const completedLessons = categories.reduce(
            (sum, category) => sum + category.lessons.filter(lesson => isLessonCompleted(lesson.id)).length,
            0
        );
        const completedCurriculum = categories.filter(category =>
            category.lessons.every(lesson => isLessonCompleted(lesson.id))
        ).length;

        return {
            ...level,
            categories,
            totalLessons,
            completedLessons,
            totalCurriculum: categories.length,
            completedCurriculum,
            completionPercent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
        };
    });
}

function levelBadgeCount() {
    return getLearningLevelStats().filter(level => level.completedLessons === level.totalLessons && level.totalLessons > 0).length;
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
    const catComplete = categoryId => {
        const category = getAllCategories().find(item => item.id === categoryId);
        return !!category && category.lessons.every(lesson => isLessonCompleted(lesson.id));
    };

    return [
        { label: "First Step", earned: completed >= 1, emoji: "🚀" },
        { label: "Getting the Hang of It", earned: completed >= 5, emoji: "📘" },
        { label: "On a Roll", earned: completed >= 10, emoji: "🔥" },
        { label: "Quarter Century", earned: completed >= 25, emoji: "🏅" },
        { label: "Halfway Hero", earned: completed >= 50, emoji: "🥈" },
        { label: "Century Club", earned: completed >= 100, emoji: "💯" },

        { label: "First-Try Flash", earned: firstTry >= 3, emoji: "⚡" },
        { label: "Precision Pro", earned: firstTry >= 10, emoji: "🎯" },
        { label: "Mastermind", earned: mastered >= 5, emoji: "🧠" },
        { label: "Master of Masters", earned: mastered >= 25, emoji: "👑" },

        { label: "Join Genius", earned: catComplete("inner_joins"), emoji: "🔗" },
        { label: "Aggregate King", earned: catComplete("aggregations"), emoji: "👑" },
        { label: "Filter Fanatic", earned: catComplete("filtering_rows"), emoji: "🎯" },
        { label: "Grouping Guru", earned: catComplete("group_by"), emoji: "📊" },
        { label: "CASE Commander", earned: catComplete("case_statements"), emoji: "🧩" },
        { label: "Null Navigator", earned: catComplete("null_handling"), emoji: "🧭" },

        { label: "Throughput Thinker", earned: catComplete("hospital_throughput"), emoji: "🏥" },
        { label: "Readmission Ranger", earned: catComplete("readmissions_kpis"), emoji: "🔁" },
        { label: "Financial Fixer", earned: catComplete("denials_kpis"), emoji: "💰" },
        { label: "Executive Whisperer", earned: catComplete("executive_summary_sql"), emoji: "🗣️" }
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
    if (label === "Foundations") return "difficulty-foundations";
    if (label === "Core") return "difficulty-core";
    if (label === "Applied") return "difficulty-applied";
    if (label === "Advanced") return "difficulty-advanced";
    return "difficulty-expert";
}

function lessonTypeClass(type) {
    return `lesson-type-${type}`;
}

function formatLessonType(type) {
    if (!type) return "";
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function categoryDifficulty(category) {
    const matchedLevel = LEARNING_LEVELS.find(level => level.categoryIds.includes(category.id));
    return matchedLevel ? matchedLevel.label : "Advanced";
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
    <div class="schema-card-body">
        <p><strong>Description:</strong> ${escapeHtml(table.description)}</p>
        <p><strong>Keys:</strong> ${escapeHtml(table.keyColumns.join(", "))}</p>
        <p><strong>Columns:</strong> ${escapeHtml(table.notableColumns.join(", "))}</p>
        <div class="schema-table-actions">
            <button
                type="button"
                class="schema-table-view-btn"
                onclick="openTableModal('${table.name}')"
            >
                Open Table Viewer
            </button>
        </div>
    </div>
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
        badgeCount.innerText = `${levelBadgeCount()} learning level badges earned · ${masteryCount()} mastered`;
    }

    if (trackTitle) trackTitle.innerText = track.title;
    if (trackDescription) {
        trackDescription.innerText = activeDifficultyFilter
            ? `${activeDifficultyFilter} curriculum view · completion and mastery tracking.`
            : "Curriculum, learning levels, completion, and mastery tracking.";
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

    getVisibleCategories().forEach(category => {
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
    const completed = completedLessonCount();
    const total = totalLessonCount();
    const levelStats = getLearningLevelStats();

    const titleEl = document.getElementById("track-overview-title");
    const descEl = document.getElementById("track-overview-description");
    const progressTextEl = document.getElementById("track-overview-progress-text");
    const progressBarEl = document.getElementById("track-overview-progress-bar");
    const trackLabelEl = document.getElementById("track-title-display-overview");
    const cardsWrap = document.getElementById("track-category-cards");

    if (trackLabelEl) {
        trackLabelEl.innerText = activeDifficultyFilter ? `${track.title} · ${activeDifficultyFilter}` : track.title;
    }

    if (titleEl) {
        titleEl.innerText = activeDifficultyFilter ? `${activeDifficultyFilter} Learning Level` : track.title;
    }

    if (descEl) {
        descEl.innerText = activeDifficultyFilter
            ? `Showing only ${activeDifficultyFilter.toLowerCase()} curriculum. Click the active level card again to clear the filter.`
            : `${track.description} ${masteryCount()} lesson(s) mastered.`;
    }

    if (progressTextEl) {
        progressTextEl.innerText = `${completed} of ${total} lessons completed`;
    }

    if (progressBarEl) {
        progressBarEl.style.width = `${total ? (completed / total) * 100 : 0}%`;
    }

    if (!cardsWrap) return;
    cardsWrap.innerHTML = "";

    levelStats.forEach(level => {
        const card = document.createElement("div");
        const isActive = activeDifficultyFilter === level.label;
        card.className = `track-badge-card level-card${isActive ? " active" : ""}`;
        card.style.borderColor = level.color;
        card.innerHTML = `
            <div class="track-badge-icon-wrap">
                <div class="track-badge-ring level-ring" style="background: conic-gradient(${level.color} ${level.completionPercent}%, #e2e8f0 0);">
                    <div class="track-badge-icon level-icon" style="color:${level.color}; border-color:${level.color}33;">
                        ${level.completionPercent}%
                    </div>
                </div>
            </div>
            <div class="track-badge-name">${escapeHtml(level.label)}</div>
            <div class="track-badge-meta">
                <span class="difficulty-badge ${difficultyClassFromLabel(level.label)}">${escapeHtml(level.label)}</span>
            </div>
            <div class="track-badge-stats">
                <div><strong>${level.completedCurriculum}/${level.totalCurriculum}</strong> curriculum complete</div>
                <div>${level.completedLessons}/${level.totalLessons} lessons completed</div>
                <div class="track-badge-helper">${isActive ? "Click to show all curriculum" : "Click to view this learning level"}</div>
            </div>
        `;

        card.addEventListener("click", function () {
            activeDifficultyFilter = isActive ? null : level.label;
            renderTrackOverview();
            renderCurriculumNav();
        });

        cardsWrap.appendChild(card);
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
            activeDifficultyFilter = null;
            showTrackOverview();
            renderCurriculumNav();
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
