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
    const readmitEncounter = encounters[(i + 6) % encounters.length];

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

// ============================================
// SQL Foundations for Hospital Data Curriculum
// ============================================

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
      },
      {
        id: "selecting_columns",
        title: "Selecting Columns",
        order: 2,
        lessons: [
          conceptLesson(
            "sc_01",
            "SELECT Basics",
            "Learn to return only the fields a stakeholder needs.",
            ["SELECT"],
            ["patients", "claims", "encounters"],
            "No join needed.",
            "Good analysts reduce noise by selecting only the fields needed for the business question.",
            [
              "Executives rarely want raw exports",
              "Choose fields tied directly to the ask",
              "Cleaner outputs are easier to validate"
            ],
            "If someone asks for denied dollars by payer, you probably do not need every patient demographic field."
          ),
          challengeLesson(
            "sc_02",
            "Patient Core Fields",
            "Return patient_id, first_name, and last_name from patients.",
            ["SELECT"],
            ["patients"],
            "No join needed.",
            "SELECT patient_id, first_name, last_name FROM patients;",
            "SELECT patient_id, first_name, last_name FROM patients;",
            "Select only the requested three columns."
          ),
          challengeLesson(
            "sc_03",
            "Claim Financial Fields",
            "Return claim_id, payer, and billed_amount from claims.",
            ["SELECT"],
            ["claims"],
            "No join needed.",
            "SELECT claim_id, payer, billed_amount FROM claims;",
            "SELECT claim_id, payer, billed_amount FROM claims;",
            "Only return claim_id, payer, billed_amount."
          ),
          challengeLesson(
            "sc_04",
            "Encounter Operational Fields",
            "Return encounter_id, facility, department, status from encounters.",
            ["SELECT"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, facility, department, status FROM encounters;",
            "SELECT encounter_id, facility, department, status FROM encounters;",
            "Return the four requested operational fields."
          ),
          scenarioLesson(
            "sc_05",
            "Executive-Focused Output",
            "Choose the more executive-ready answer.",
            ["claims"],
            "Think audience first.",
            "The same data question can be answered with either clutter or clarity.",
            "For a leadership denial summary, should you emphasize payer and billed_amount or dump every claim field?",
            "payer",
            {
              show: true,
              metric: "Focused reporting output",
              whyItMatters: "Leadership needs concise answers.",
              whatToShare: "Keep only the fields directly tied to the business question.",
              action: "Reduce clutter before sharing results."
            }
          )
        ]
      },
      {
        id: "filtering_rows",
        title: "Filtering Rows",
        order: 3,
        lessons: [
          conceptLesson(
            "fr_01",
            "Filtering with WHERE",
            "Use WHERE to isolate the records that matter.",
            ["WHERE"],
            ["patients", "claims", "encounters", "charges"],
            "No join needed.",
            "Most healthcare questions are about a subset of rows, not the full table.",
            [
              "Filter by payer",
              "Filter by status",
              "Filter by department",
              "Filter by amount"
            ],
            "A denial analysis is usually a subset of claims, not the whole claims table."
          ),
          challengeLesson(
            "fr_02",
            "Medicare Patients",
            "Return Medicare patients with patient_id, first_name, and last_name.",
            ["WHERE"],
            ["patients"],
            "No join needed.",
            "SELECT patient_id, first_name, last_name FROM patients WHERE insurance_type = 'Medicare';",
            "SELECT patient_id, first_name, last_name FROM patients WHERE insurance_type = 'Medicare';",
            "Filter on insurance_type = 'Medicare'."
          ),
          challengeLesson(
            "fr_03",
            "Denied Claims",
            "Return denied claims with claim_id, payer, billed_amount.",
            ["WHERE"],
            ["claims"],
            "No join needed.",
            "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied';",
            "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied';",
            "Filter claim_status = 'Denied'.",
            {
              show: true,
              metric: "Denied claims inventory",
              whyItMatters: "Denied claims represent reimbursement risk.",
              whatToShare: "Summarize denied count and dollars at risk.",
              action: "Escalate payer spikes and high-dollar denials."
            }
          ),
          challengeLesson(
            "fr_04",
            "Cardiology Encounters",
            "Return encounter_id, patient_id, department for Cardiology encounters.",
            ["WHERE"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, patient_id, department FROM encounters WHERE department = 'Cardiology';",
            "SELECT encounter_id, patient_id, department FROM encounters WHERE department = 'Cardiology';",
            "Filter department = 'Cardiology'."
          ),
          challengeLesson(
            "fr_05",
            "High-Dollar Charges",
            "Return charge_id, payer, amount for charges over 2000.",
            ["WHERE"],
            ["charges"],
            "No join needed.",
            "SELECT charge_id, payer, amount FROM charges WHERE amount > 2000;",
            "SELECT charge_id, payer, amount FROM charges WHERE amount > 2000;",
            "Use amount > 2000."
          )
        ]
      },
      {
        id: "sorting_results",
        title: "Sorting Results",
        order: 4,
        lessons: [
          conceptLesson(
            "sr_01",
            "Ordering Results",
            "Use ORDER BY to rank and structure results for review.",
            ["ORDER BY"],
            ["charges", "patients", "encounters"],
            "No join needed.",
            "Sorting helps surface what matters first.",
            [
              "Descending is useful for biggest risks",
              "Ascending is useful for names and timelines",
              "You can sort by more than one field"
            ],
            "Executives often want the highest-dollar risk first, not an unsorted dump.",
            {
              show: true,
              metric: "Priority ranking",
              whyItMatters: "Sorting identifies top risks and opportunities quickly.",
              whatToShare: "Use ranked outputs instead of unsorted detail.",
              action: "Lead with highest-impact items."
            }
          ),
          challengeLesson(
            "sr_02",
            "Sort Charges Descending",
            "Return charge_id, payer, amount ordered highest to lowest amount.",
            ["ORDER BY"],
            ["charges"],
            "No join needed.",
            "SELECT charge_id, payer, amount FROM charges ORDER BY amount DESC;",
            "SELECT charge_id, payer, amount FROM charges ORDER BY amount DESC;",
            "Use ORDER BY amount DESC."
          ),
          challengeLesson(
            "sr_03",
            "Sort Patients by Last Name",
            "Return all patients ordered by last_name.",
            ["ORDER BY"],
            ["patients"],
            "No join needed.",
            "SELECT * FROM patients ORDER BY last_name;",
            "SELECT * FROM patients ORDER BY last_name;",
            "Use ORDER BY last_name."
          ),
          challengeLesson(
            "sr_04",
            "Sort Encounters by Facility and Department",
            "Return all encounters ordered by facility, then department.",
            ["ORDER BY"],
            ["encounters"],
            "No join needed.",
            "SELECT * FROM encounters ORDER BY facility, department;",
            "SELECT * FROM encounters ORDER BY facility, department;",
            "Use ORDER BY facility, department."
          ),
          scenarioLesson(
            "sr_05",
            "Top Items for Executives",
            "Recognize when ranked results are better than full detail.",
            ["charges", "claims"],
            "Think ranking by impact.",
            "Sorted output helps leadership focus on the biggest issues first.",
            "Should a leadership summary show the full unsorted file or highest-dollar items first?",
            "highest",
            {
              show: true,
              metric: "Top-ranked opportunities",
              whyItMatters: "Leadership time is limited.",
              whatToShare: "Use top items or highest-impact outputs in summaries.",
              action: "Sort by impact before sharing upward."
            }
          )
        ]
      },
      {
        id: "strings",
        title: "Strings",
        order: 5,
        lessons: [
          conceptLesson(
            "st_01",
            "Working with Text",
            "Use string functions to clean and present text values.",
            ["concatenation", "UPPER", "LOWER", "TRIM"],
            ["patients", "claims"],
            "No join needed.",
            "String logic helps create readable and standardized outputs.",
            [
              "Build display names",
              "Standardize payer text",
              "Clean unwanted spacing"
            ],
            "Many reports need one polished display field instead of several raw fields."
          ),
          challengeLesson(
            "st_02",
            "Build Patient Full Name",
            "Return a full_name field from patients.",
            ["concatenation"],
            ["patients"],
            "No join needed.",
            "SELECT first_name || ' ' || last_name AS full_name FROM patients;",
            "SELECT first_name || ' ' || last_name AS full_name FROM patients;",
            "Concatenate first_name and last_name with a space."
          ),
          challengeLesson(
            "st_03",
            "Standardize Payer Labels",
            "Return payer names in uppercase.",
            ["UPPER"],
            ["claims"],
            "No join needed.",
            "SELECT UPPER(payer) AS payer_standardized FROM claims;",
            "SELECT UPPER(payer) AS payer_standardized FROM claims;",
            "Use UPPER(payer)."
          ),
          challengeLesson(
            "st_04",
            "Lowercase City Names",
            "Return city values in lowercase.",
            ["LOWER"],
            ["patients"],
            "No join needed.",
            "SELECT LOWER(city) AS city_lower FROM patients;",
            "SELECT LOWER(city) AS city_lower FROM patients;",
            "Use LOWER(city)."
          ),
          challengeLesson(
            "st_05",
            "Trim Payer Text",
            "Return payer values with TRIM applied.",
            ["TRIM"],
            ["claims"],
            "No join needed.",
            "SELECT TRIM(payer) AS payer_trimmed FROM claims;",
            "SELECT TRIM(payer) AS payer_trimmed FROM claims;",
            "Use TRIM(payer)."
          )
        ]
      },
      {
        id: "numbers_and_calculations",
        title: "Numbers and Calculations",
        order: 6,
        lessons: [
          conceptLesson(
            "nm_01",
            "Raw Data vs Metrics",
            "Understand why leaders prefer metrics over raw lists.",
            ["ROUND", "AVG", "CASE", "COUNT"],
            ["claims", "encounters", "charges"],
            "No join needed.",
            "Analysts turn raw rows into rates and summary metrics leaders can act on.",
            [
              "Percent denied",
              "Average LOS",
              "Average charge",
              "Remaining balance logic"
            ],
            "A denial rate tells a clearer story than a raw list of claims.",
            {
              show: true,
              metric: "Executive-friendly metrics",
              whyItMatters: "Leaders need directionally meaningful summaries.",
              whatToShare: "Translate rows into rates, averages, and dollar impact.",
              action: "Pick the KPI that best answers the question."
            }
          ),
          challengeLesson(
            "nm_02",
            "Calculate Denial Rate",
            "Return the percent of claims that are denied.",
            ["CASE", "COUNT", "ROUND"],
            ["claims"],
            "No join needed.",
            "SELECT ROUND(100.0 * SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*), 2) AS denial_rate FROM claims;",
            "SELECT ROUND(100.0 * SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*), 2) AS denial_rate FROM claims;",
            "Use CASE inside an aggregate, divide by COUNT(*), then ROUND."
          ),
          challengeLesson(
            "nm_03",
            "Calculate Average LOS",
            "Return average length_of_stay.",
            ["AVG", "ROUND"],
            ["encounters"],
            "No join needed.",
            "SELECT ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters;",
            "SELECT ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters;",
            "Use AVG(length_of_stay) and ROUND."
          ),
          challengeLesson(
            "nm_04",
            "Calculate Average Charge",
            "Return average amount from charges.",
            ["AVG", "ROUND"],
            ["charges"],
            "No join needed.",
            "SELECT ROUND(AVG(amount), 2) AS avg_charge FROM charges;",
            "SELECT ROUND(AVG(amount), 2) AS avg_charge FROM charges;",
            "Use AVG(amount) and ROUND."
          ),
          challengeLesson(
            "nm_05",
            "Estimate Remaining Balance",
            "Return claim_id and billed_amount minus 1000 as remaining_balance.",
            ["arithmetic"],
            ["claims"],
            "No join needed.",
            "SELECT claim_id, billed_amount - 1000 AS remaining_balance FROM claims;",
            "SELECT claim_id, billed_amount - 1000 AS remaining_balance FROM claims;",
            "Subtract 1000 from billed_amount and alias it."
          )
        ]
      },
      {
        id: "null_handling",
        title: "NULL Handling",
        order: 7,
        lessons: [
          conceptLesson(
            "nh_01",
            "Understanding NULL",
            "Understand how missing values affect analysis.",
            ["IS NULL", "IS NOT NULL", "COALESCE"],
            ["encounters", "claims"],
            "No join needed.",
            "NULL means data is missing or unavailable and can distort reporting if ignored.",
            [
              "NULL is not zero",
              "NULL is not blank text",
              "Missing data can distort summary logic"
            ],
            "Missing discharge_date values can distort throughput and LOS analysis."
          ),
          challengeLesson(
            "nh_02",
            "Find Missing Discharge Dates",
            "Return encounter_id and patient_id where discharge_date is null.",
            ["IS NULL"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, patient_id FROM encounters WHERE discharge_date IS NULL;",
            "SELECT encounter_id, patient_id FROM encounters WHERE discharge_date IS NULL;",
            "Use WHERE discharge_date IS NULL."
          ),
          challengeLesson(
            "nh_03",
            "Find Non-Null Discharge Dates",
            "Return encounter_id where discharge_date is not null.",
            ["IS NOT NULL"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id FROM encounters WHERE discharge_date IS NOT NULL;",
            "SELECT encounter_id FROM encounters WHERE discharge_date IS NOT NULL;",
            "Use WHERE discharge_date IS NOT NULL."
          ),
          challengeLesson(
            "nh_04",
            "Replace Null Discharge Dates",
            "Use COALESCE to replace null discharge_date with Still Admitted.",
            ["COALESCE"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, COALESCE(discharge_date, 'Still Admitted') AS discharge_status FROM encounters;",
            "SELECT encounter_id, COALESCE(discharge_date, 'Still Admitted') AS discharge_status FROM encounters;",
            "Use COALESCE(discharge_date, 'Still Admitted')."
          ),
          scenarioLesson(
            "nh_05",
            "Data Quality Scenario",
            "Decide whether missing data should be escalated.",
            ["encounters"],
            "Think about business impact.",
            "Not every missing field matters equally, but some directly affect KPIs.",
            "If discharge_date is missing for many inpatient encounters, should that be escalated for LOS reporting accuracy?",
            "yes",
            {
              show: true,
              metric: "Data quality risk",
              whyItMatters: "Missing data can directly distort executive reporting.",
              whatToShare: "Escalate data quality issues when they affect trusted KPIs.",
              action: "Tie data quality escalation to business impact."
            }
          )
        ]
      },
      {
        id: "boolean_logic",
        title: "Boolean Logic",
        order: 8,
        lessons: [
          conceptLesson(
            "bl_01",
            "Combining Conditions",
            "Use AND, OR, and NOT to define meaningful populations.",
            ["AND", "OR", "NOT"],
            ["claims", "encounters", "patients"],
            "No join needed.",
            "Boolean logic helps analysts define the exact population that matters.",
            [
              "AND narrows",
              "OR broadens",
              "NOT excludes"
            ],
            "High-dollar denied claims are more actionable than all denied claims together."
          ),
          challengeLesson(
            "bl_02",
            "High-Priority Denials",
            "Return denied claims over 2000 billed dollars.",
            ["AND"],
            ["claims"],
            "No join needed.",
            "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied' AND billed_amount > 2000;",
            "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied' AND billed_amount > 2000;",
            "Use AND to combine claim_status and billed_amount filters.",
            {
              show: true,
              metric: "High-priority denied claims",
              whyItMatters: "Not all denials carry the same financial importance.",
              whatToShare: "Separate high-dollar denials from overall denial volume.",
              action: "Prioritize analyst review on the largest risks."
            }
          ),
          challengeLesson(
            "bl_03",
            "ER or Observation Encounters",
            "Return encounter_id and encounter_type for Emergency or Observation encounters.",
            ["OR"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, encounter_type FROM encounters WHERE encounter_type = 'Emergency' OR encounter_type = 'Observation';",
            "SELECT encounter_id, encounter_type FROM encounters WHERE encounter_type = 'Emergency' OR encounter_type = 'Observation';",
            "Use OR between Emergency and Observation."
          ),
          challengeLesson(
            "bl_04",
            "Not Discharged Encounters",
            "Return encounter_id and status where status is not Discharged.",
            ["NOT"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, status FROM encounters WHERE NOT status = 'Discharged';",
            "SELECT encounter_id, status FROM encounters WHERE NOT status = 'Discharged';",
            "Use NOT with status = 'Discharged'."
          ),
          challengeLesson(
            "bl_05",
            "Medicare or Medicaid Patients",
            "Return patient_id and insurance_type for Medicare or Medicaid patients.",
            ["OR"],
            ["patients"],
            "No join needed.",
            "SELECT patient_id, insurance_type FROM patients WHERE insurance_type = 'Medicare' OR insurance_type = 'Medicaid';",
            "SELECT patient_id, insurance_type FROM patients WHERE insurance_type = 'Medicare' OR insurance_type = 'Medicaid';",
            "Use OR between Medicare and Medicaid."
          )
        ]
      },
      {
        id: "case_statements",
        title: "CASE Statements",
        order: 9,
        lessons: [
          conceptLesson(
            "cs_01",
            "Categorizing Data with CASE",
            "Use CASE to turn raw values into business buckets.",
            ["CASE"],
            ["charges", "encounters", "claims"],
            "No join needed.",
            "CASE statements turn raw values into categories that leaders can interpret faster.",
            [
              "High / Medium / Low",
              "Open / Closed",
              "Short / Long"
            ],
            "Leadership usually understands categories faster than noisy raw transactional detail.",
            {
              show: true,
              metric: "Categorized business summaries",
              whyItMatters: "Leadership prefers grouped insights over raw values.",
              whatToShare: "Use categories to simplify complex patterns.",
              action: "Turn raw detail into interpretable segments."
            }
          ),
          challengeLesson(
            "cs_02",
            "Bucket Charges by Size",
            "Return charge_id and a charge_bucket field.",
            ["CASE"],
            ["charges"],
            "No join needed.",
            "SELECT charge_id, CASE WHEN amount >= 3000 THEN 'High' WHEN amount >= 1000 THEN 'Medium' ELSE 'Low' END AS charge_bucket FROM charges;",
            "SELECT charge_id, CASE WHEN amount >= 3000 THEN 'High' WHEN amount >= 1000 THEN 'Medium' ELSE 'Low' END AS charge_bucket FROM charges;",
            "Use CASE with High, Medium, and Low thresholds."
          ),
          challengeLesson(
            "cs_03",
            "Group Claim Statuses",
            "Return claim_id and a status_group of Open or Closed.",
            ["CASE"],
            ["claims"],
            "No join needed.",
            "SELECT claim_id, CASE WHEN claim_status = 'Pending' THEN 'Open' ELSE 'Closed' END AS status_group FROM claims;",
            "SELECT claim_id, CASE WHEN claim_status = 'Pending' THEN 'Open' ELSE 'Closed' END AS status_group FROM claims;",
            "Map Pending to Open and everything else to Closed."
          ),
          challengeLesson(
            "cs_04",
            "Bucket Length of Stay",
            "Return encounter_id and a los_bucket of Long or Short.",
            ["CASE"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, CASE WHEN length_of_stay >= 3 THEN 'Long' ELSE 'Short' END AS los_bucket FROM encounters;",
            "SELECT encounter_id, CASE WHEN length_of_stay >= 3 THEN 'Long' ELSE 'Short' END AS los_bucket FROM encounters;",
            "Use CASE on length_of_stay."
          ),
          scenarioLesson(
            "cs_05",
            "CASE for Executive Use",
            "Recognize why CASE helps leadership communication.",
            ["charges", "encounters"],
            "Think readability first.",
            "CASE makes reporting more interpretable for non-technical audiences.",
            "Would leadership usually understand raw decimals faster, or categorized buckets like Long and Short?",
            "buckets",
            {
              show: true,
              metric: "Executive-friendly categorization",
              whyItMatters: "Categories are easier to discuss than raw distributions.",
              whatToShare: "Use buckets when raw values are too noisy.",
              action: "Apply CASE when clarity matters more than precision."
            }
          )
        ]
      },
      {
        id: "aggregations",
        title: "Aggregations",
        order: 10,
        lessons: [
          conceptLesson(
            "ag_01",
            "Summarizing Data with COUNT, SUM, and AVG",
            "Understand the building blocks of KPIs and dashboards.",
            ["COUNT", "SUM", "AVG"],
            ["encounters", "claims", "charges"],
            "No join needed.",
            "Aggregation functions are the core of most dashboards and executive reporting.",
            [
              "COUNT = volume",
              "SUM = dollars",
              "AVG = typical burden or rate"
            ],
            "Executive dashboards often use encounter counts, total charges, and average LOS.",
            {
              show: true,
              metric: "KPI building blocks",
              whyItMatters: "Most executive summaries are built from counts, sums, and averages.",
              whatToShare: "Translate row-level data into interpretable metrics.",
              action: "Use the summary statistic that best answers the question."
            }
          ),
          challengeLesson(
            "ag_02",
            "Calculate Total Charges",
            "Return total charge dollars.",
            ["SUM"],
            ["charges"],
            "No join needed.",
            "SELECT SUM(amount) AS total_amount FROM charges;",
            "SELECT SUM(amount) AS total_amount FROM charges;",
            "Use SUM(amount)."
          ),
          challengeLesson(
            "ag_03",
            "Count Total Encounters",
            "Return total encounter volume.",
            ["COUNT"],
            ["encounters"],
            "No join needed.",
            "SELECT COUNT(*) AS total_encounters FROM encounters;",
            "SELECT COUNT(*) AS total_encounters FROM encounters;",
            "Use COUNT(*) from encounters."
          ),
          challengeLesson(
            "ag_04",
            "Average Billed Amount",
            "Return average billed_amount.",
            ["AVG"],
            ["claims"],
            "No join needed.",
            "SELECT AVG(billed_amount) AS avg_billed_amount FROM claims;",
            "SELECT AVG(billed_amount) AS avg_billed_amount FROM claims;",
            "Use AVG(billed_amount)."
          ),
          challengeLesson(
            "ag_05",
            "Count Total Claims",
            "Return total claim count.",
            ["COUNT"],
            ["claims"],
            "No join needed.",
            "SELECT COUNT(*) AS total_claims FROM claims;",
            "SELECT COUNT(*) AS total_claims FROM claims;",
            "Use COUNT(*) from claims."
          )
        ]
      },
      {
        id: "group_by",
        title: "GROUP BY",
        order: 11,
        lessons: [
          conceptLesson(
            "gb_01",
            "From Rows to Summaries",
            "Understand how GROUP BY creates grouped reporting views.",
            ["GROUP BY"],
            ["encounters", "claims", "charges"],
            "No join needed.",
            "GROUP BY turns row-level data into grouped performance summaries.",
            [
              "By facility",
              "By payer",
              "By department",
              "By provider"
            ],
            "Leadership often wants comparisons across units rather than raw rows.",
            {
              show: true,
              metric: "Grouped performance view",
              whyItMatters: "Leaders compare units, not row-level detail.",
              whatToShare: "Use grouped summaries to show who is driving volume or risk.",
              action: "Organize results by the unit leadership can act on."
            }
          ),
          challengeLesson(
            "gb_02",
            "Count Encounters by Facility",
            "Return facility and encounter_count.",
            ["GROUP BY", "COUNT"],
            ["encounters"],
            "No join needed.",
            "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",
            "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",
            "Group by facility and count rows."
          ),
          challengeLesson(
            "gb_03",
            "Denied Claims by Payer",
            "Return payer and denied_claim_count.",
            ["WHERE", "GROUP BY", "COUNT"],
            ["claims"],
            "No join needed.",
            "SELECT payer, COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
            "SELECT payer, COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
            "Filter denied claims, then group by payer."
          ),
          challengeLesson(
            "gb_04",
            "Charges by Payer",
            "Return payer and total_amount.",
            ["GROUP BY", "SUM"],
            ["charges"],
            "No join needed.",
            "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer;",
            "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer;",
            "Group by payer and sum amount."
          ),
          challengeLesson(
            "gb_05",
            "Encounters by Department",
            "Return department and encounter_count.",
            ["GROUP BY", "COUNT"],
            ["encounters"],
            "No join needed.",
            "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
            "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
            "Group by department."
          )
        ]
      },
      {
        id: "having",
        title: "HAVING",
        order: 12,
        lessons: [
          conceptLesson(
            "hv_01",
            "Filtering Groups with HAVING",
            "Use HAVING to find exceptions after grouping.",
            ["HAVING"],
            ["claims", "encounters", "charges"],
            "No join needed.",
            "HAVING filters grouped results after aggregation.",
            [
              "WHERE filters rows",
              "HAVING filters groups"
            ],
            "Use HAVING to isolate only the groups that exceed a threshold.",
            {
              show: true,
              metric: "Outlier detection",
              whyItMatters: "Leadership often cares about exceptions more than normal performance.",
              whatToShare: "Present only material outliers when the goal is action.",
              action: "Use HAVING to reduce noise."
            }
          ),
          challengeLesson(
            "hv_02",
            "Payers with Multiple Denials",
            "Return payers with more than one denied claim.",
            ["WHERE", "GROUP BY", "HAVING"],
            ["claims"],
            "No join needed.",
            "SELECT payer, COUNT(*) AS denied_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer HAVING COUNT(*) > 1;",
            "SELECT payer, COUNT(*) AS denied_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer HAVING COUNT(*) > 1;",
            "Use HAVING COUNT(*) > 1."
          ),
          challengeLesson(
            "hv_03",
            "Departments with Multiple Encounters",
            "Return departments with more than one encounter.",
            ["GROUP BY", "HAVING"],
            ["encounters"],
            "No join needed.",
            "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department HAVING COUNT(*) > 1;",
            "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department HAVING COUNT(*) > 1;",
            "Use HAVING COUNT(*) > 1 after grouping."
          ),
          challengeLesson(
            "hv_04",
            "Payers with High Total Charges",
            "Return payers whose total charges exceed 2000.",
            ["GROUP BY", "HAVING", "SUM"],
            ["charges"],
            "No join needed.",
            "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer HAVING SUM(amount) > 2000;",
            "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer HAVING SUM(amount) > 2000;",
            "Use HAVING SUM(amount) > 2000."
          ),
          scenarioLesson(
            "hv_05",
            "Outlier-Focused Leadership Review",
            "Recognize why HAVING helps reduce clutter.",
            ["claims", "charges"],
            "Think exceptions, not everything.",
            "HAVING helps isolate only the categories leadership really needs to discuss.",
            "If leaders only want groups above a meaningful threshold, should you use HAVING after grouping?",
            "yes",
            {
              show: true,
              metric: "Threshold-based review",
              whyItMatters: "Leadership time is limited.",
              whatToShare: "Use HAVING to show only above-threshold groups.",
              action: "Filter to material exceptions before review."
            }
          )
        ]
      },
      {
        id: "inner_joins",
        title: "Inner Joins",
        order: 13,
        lessons: [
          conceptLesson(
            "ij_01",
            "Why Joins Matter",
            "Understand why most real analysis requires more than one table.",
            ["JOIN"],
            ["patients", "encounters", "claims", "charges", "providers"],
            "Relationships matter: patient_id, encounter_id, provider_id, and department_id are common join paths.",
            "Real insight usually comes from combining related tables.",
            [
              "Patients + encounters = who had which visit",
              "Claims + patients = payer and patient context",
              "Encounters + providers = provider-level operational views",
              "Encounters + departments = service line reporting"
            ],
            "To explain denied dollars by department or provider, you need joined data.",
            {
              show: true,
              metric: "Integrated business story",
              whyItMatters: "Executives need context, not isolated facts.",
              whatToShare: "Joined data explains not only what happened, but where and to whom.",
              action: "Use joins when one table gives an incomplete answer."
            }
          ),
          challengeLesson(
            "ij_02",
            "Join Encounters to Patients",
            "Return encounter_id, first_name, and last_name.",
            ["JOIN"],
            ["encounters", "patients"],
            "encounters.patient_id = patients.patient_id",
            "SELECT e.encounter_id, p.first_name, p.last_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
            "SELECT e.encounter_id, p.first_name, p.last_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
            "Join encounters to patients on patient_id."
          ),
          challengeLesson(
            "ij_03",
            "Join Claims to Patients",
            "Return claim_id, first_name, and insurance_type.",
            ["JOIN"],
            ["claims", "patients"],
            "claims.patient_id = patients.patient_id",
            "SELECT c.claim_id, p.first_name, p.insurance_type FROM claims c JOIN patients p ON c.patient_id = p.patient_id;",
            "SELECT c.claim_id, p.first_name, p.insurance_type FROM claims c JOIN patients p ON c.patient_id = p.patient_id;",
            "Join claims to patients on patient_id."
          ),
          challengeLesson(
            "ij_04",
            "Join Encounters to Providers",
            "Return encounter_id, provider_name, and specialty.",
            ["JOIN"],
            ["encounters", "providers"],
            "encounters.provider_id = providers.provider_id",
            "SELECT e.encounter_id, p.provider_name, p.specialty FROM encounters e JOIN providers p ON e.provider_id = p.provider_id;",
            "SELECT e.encounter_id, p.provider_name, p.specialty FROM encounters e JOIN providers p ON e.provider_id = p.provider_id;",
            "Join encounters to providers on provider_id."
          ),
          challengeLesson(
            "ij_05",
            "Join Claims to Encounter Department",
            "Return claim_id, department, and billed_amount.",
            ["JOIN"],
            ["claims", "encounters"],
            "claims.encounter_id = encounters.encounter_id",
            "SELECT c.claim_id, e.department, c.billed_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id;",
            "SELECT c.claim_id, e.department, c.billed_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id;",
            "Join claims to encounters on encounter_id."
          )
        ]
      },
      {
        id: "hospital_throughput",
        title: "Hospital Throughput",
        order: 14,
        lessons: [
          conceptLesson(
            "ht_01",
            "What Throughput Metrics Measure",
            "Understand discharge speed, departure lag, and delayed discharge concepts.",
            ["AVG", "WHERE", "GROUP BY"],
            ["discharges", "encounters"],
            "Most throughput questions start with discharges joined to encounters only if you need more context.",
            "Throughput measures how efficiently patients move through the system after care decisions are made.",
            [
              "Discharge order to departure time is a common operational KPI",
              "Delay flags help isolate preventable barriers",
              "Department-level views help managers act"
            ],
            "A discharge delay problem is not just clinical. It often reflects transport, staffing, or workflow issues.",
            {
              show: true,
              metric: "Discharge turnaround",
              whyItMatters: "Long discharge lag ties up beds and hurts patient flow.",
              whatToShare: "Average minutes, high-delay departments, and common delay flags.",
              action: "Escalate units with persistent extended discharge timing."
            }
          ),
          challengeLesson(
            "ht_02",
            "Average Discharge Order Minutes",
            "Return average discharge_order_minutes from discharges.",
            ["AVG"],
            ["discharges"],
            "No join needed.",
            "SELECT AVG(discharge_order_minutes) AS avg_discharge_order_minutes FROM discharges;",
            "SELECT AVG(discharge_order_minutes) AS avg_discharge_order_minutes FROM discharges;",
            "Use AVG(discharge_order_minutes)."
          ),
          challengeLesson(
            "ht_03",
            "Delayed for Transport Cases",
            "Return discharge_id, encounter_id, and department where delayed_for_transport = 1.",
            ["WHERE"],
            ["discharges"],
            "No join needed.",
            "SELECT discharge_id, encounter_id, department FROM discharges WHERE delayed_for_transport = 1;",
            "SELECT discharge_id, encounter_id, department FROM discharges WHERE delayed_for_transport = 1;",
            "Filter delayed_for_transport = 1."
          ),
          challengeLesson(
            "ht_04",
            "Average Departure Minutes by Department",
            "Return department and average departure_minutes by department.",
            ["GROUP BY", "AVG"],
            ["discharges"],
            "No join needed.",
            "SELECT department, AVG(departure_minutes) AS avg_departure_minutes FROM discharges GROUP BY department;",
            "SELECT department, AVG(departure_minutes) AS avg_departure_minutes FROM discharges GROUP BY department;",
            "Group by department and average departure_minutes."
          ),
          scenarioLesson(
            "ht_05",
            "Operational Escalation Scenario",
            "Choose the right direction when throughput worsens.",
            ["discharges"],
            "Think manager-level actionability.",
            "Operations leaders need department-specific lag visibility, not just system averages.",
            "If discharge lag worsens, should you show only a hospital total or break it out by department?",
            "department"
          )
        ]
      },
      {
        id: "readmissions_observations",
        title: "Readmissions and Observation",
        order: 15,
        lessons: [
          conceptLesson(
            "ro_01",
            "Why Readmissions and Observation Matter",
            "Understand how readmissions and observation metrics support hospital operations and finance.",
            ["COUNT", "AVG", "GROUP BY", "WHERE"],
            ["readmissions", "observations"],
            "These topics are usually analyzed separately, then combined into broader utilization stories.",
            "Readmissions and observation stays help explain utilization, avoidable returns, and reimbursement-sensitive activity.",
            [
              "Thirty-day readmission is a classic hospital performance metric",
              "Observation conversion rates reveal utilization patterns",
              "Code 44 activity can signal documentation or status management issues"
            ],
            "A hospital can look financially stable but still have avoidable utilization friction hidden in readmission and observation trends.",
            {
              show: true,
              metric: "Utilization quality indicators",
              whyItMatters: "These measures affect both operations and reimbursement.",
              whatToShare: "Readmit volume, days to readmit, obs hours, and inpatient conversion patterns.",
              action: "Investigate spikes by department or facility."
            }
          ),
          challengeLesson(
            "ro_02",
            "Count 30-Day Readmissions",
            "Return the count of rows where readmit_within_30_days = 1.",
            ["COUNT", "WHERE"],
            ["readmissions"],
            "No join needed.",
            "SELECT COUNT(*) AS readmit_count FROM readmissions WHERE readmit_within_30_days = 1;",
            "SELECT COUNT(*) AS readmit_count FROM readmissions WHERE readmit_within_30_days = 1;",
            "Filter readmit_within_30_days = 1 and count rows."
          ),
          challengeLesson(
            "ro_03",
            "Average Days to Readmit",
            "Return average days_to_readmit for readmissions within 30 days.",
            ["AVG", "WHERE"],
            ["readmissions"],
            "No join needed.",
            "SELECT AVG(days_to_readmit) AS avg_days_to_readmit FROM readmissions WHERE readmit_within_30_days = 1;",
            "SELECT AVG(days_to_readmit) AS avg_days_to_readmit FROM readmissions WHERE readmit_within_30_days = 1;",
            "Filter to readmit_within_30_days = 1, then average days_to_readmit."
          ),
          challengeLesson(
            "ro_04",
            "Observation Conversions by Facility",
            "Return facility and count of converted observation encounters by facility.",
            ["WHERE", "GROUP BY", "COUNT"],
            ["observations"],
            "No join needed.",
            "SELECT facility, COUNT(*) AS converted_obs_count FROM observations WHERE converted_to_inpatient = 1 GROUP BY facility;",
            "SELECT facility, COUNT(*) AS converted_obs_count FROM observations WHERE converted_to_inpatient = 1 GROUP BY facility;",
            "Filter converted_to_inpatient = 1 and group by facility."
          ),
          challengeLesson(
            "ro_05",
            "Code 44 Cases",
            "Return observation_id, encounter_id, and facility where code_44_flag = 1.",
            ["WHERE"],
            ["observations"],
            "No join needed.",
            "SELECT observation_id, encounter_id, facility FROM observations WHERE code_44_flag = 1;",
            "SELECT observation_id, encounter_id, facility FROM observations WHERE code_44_flag = 1;",
            "Filter code_44_flag = 1."
          )
        ]
      },
      {
        id: "readmissions_kpis",
        title: "Readmissions KPIs",
        order: 16,
        lessons: [
          conceptLesson(
            "rd_01",
            "How Readmissions Logic Works",
            "Understand the business logic behind readmissions reporting.",
            ["JOIN", "WHERE", "DATE", "CASE"],
            ["encounters", "patients"],
            "Readmissions logic compares an index encounter to a later encounter for the same patient.",
            "Readmissions reporting depends on defining the index discharge, the readmission window, and the exclusions that belong in the metric.",
            [
              "A readmission metric starts with a qualifying index encounter",
              "The later visit must occur within the defined time window",
              "Metric definitions matter as much as SQL logic"
            ],
            "Leadership uses readmissions metrics to understand avoidable utilization, discharge quality, and opportunity by service line or facility.",
            {
              show: true,
              metric: "30-day readmission performance",
              whyItMatters: "Readmissions affect quality, cost, and leadership perception of care transitions.",
              whatToShare: "Be explicit about the index definition, time window, and exclusions.",
              action: "Validate metric logic before socializing trends."
            }
          ),
          challengeLesson(
            "rd_02",
            "Index Discharges",
            "Return discharged inpatient encounters.",
            ["WHERE", "SELECT"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, patient_id, discharge_date FROM encounters WHERE encounter_type = 'Inpatient' AND discharge_date IS NOT NULL;",
            "SELECT encounter_id, patient_id, discharge_date FROM encounters WHERE encounter_type = 'Inpatient' AND discharge_date IS NOT NULL;",
            "Filter to inpatient encounters with a discharge date."
          ),
          challengeLesson(
            "rd_03",
            "Potential Readmission Population",
            "Return patients with more than one encounter.",
            ["GROUP BY", "COUNT", "HAVING"],
            ["encounters"],
            "No join needed.",
            "SELECT patient_id, COUNT(*) AS encounter_count FROM encounters GROUP BY patient_id HAVING COUNT(*) > 1;",
            "SELECT patient_id, COUNT(*) AS encounter_count FROM encounters GROUP BY patient_id HAVING COUNT(*) > 1;",
            "Group by patient_id and keep only those with more than one encounter."
          ),
          challengeLesson(
            "rd_04",
            "Encounter Timeline by Patient",
            "Return patient encounters ordered by patient and discharge_date.",
            ["ORDER BY", "SELECT"],
            ["encounters"],
            "No join needed.",
            "SELECT patient_id, encounter_id, discharge_date FROM encounters ORDER BY patient_id, discharge_date;",
            "SELECT patient_id, encounter_id, discharge_date FROM encounters ORDER BY patient_id, discharge_date;",
            "Sort first by patient, then by discharge_date."
          ),
          scenarioLesson(
            "rd_05",
            "Readmission Definition Scenario",
            "Recognize why metric definitions must be standardized.",
            ["encounters"],
            "Think denominator and exclusions.",
            "A readmission number is only useful if everyone agrees on what counts as an index event and what counts as a return.",
            "If one team uses all discharges and another excludes observation stays, can those readmission rates be compared as the same KPI?",
            "no",
            {
              show: true,
              metric: "Readmission governance",
              whyItMatters: "Different inclusion logic produces different rates and undermines trust.",
              whatToShare: "Document the denominator before discussing performance.",
              action: "Standardize the measure specification before executive review."
            }
          )
        ]
      },
      {
        id: "observation_kpis",
        title: "Observation KPIs",
        order: 17,
        lessons: [
          conceptLesson(
            "ob_01",
            "Observation Reporting Basics",
            "Understand how observation metrics differ from inpatient reporting.",
            ["WHERE", "CASE", "AVG", "GROUP BY"],
            ["encounters"],
            "Observation metrics usually begin with encounter_type = 'Observation'.",
            "Observation reporting often focuses on LOS by hours or days, conversions, and patients who remain in observation beyond target thresholds.",
            [
              "Observation is a distinct operational workflow",
              "LOS thresholds often drive review",
              "Observation reporting frequently supports throughput and utilization management"
            ],
            "Leadership may care about prolonged observation stays, conversion patterns, and department ownership.",
            {
              show: true,
              metric: "Observation utilization",
              whyItMatters: "Observation volume and prolonged stays affect flow, capacity, and revenue interpretation.",
              whatToShare: "Summarize observation counts, average LOS, and long-stay exceptions.",
              action: "Use consistent thresholds for observation review."
            }
          ),
          challengeLesson(
            "ob_02",
            "Observation Encounters",
            "Return all observation encounters.",
            ["WHERE"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, patient_id, department, length_of_stay FROM encounters WHERE encounter_type = 'Observation';",
            "SELECT encounter_id, patient_id, department, length_of_stay FROM encounters WHERE encounter_type = 'Observation';",
            "Filter encounter_type = 'Observation'."
          ),
          challengeLesson(
            "ob_03",
            "Average Observation LOS",
            "Return average LOS for observation encounters.",
            ["WHERE", "AVG", "ROUND"],
            ["encounters"],
            "No join needed.",
            "SELECT ROUND(AVG(length_of_stay), 2) AS avg_observation_los FROM encounters WHERE encounter_type = 'Observation';",
            "SELECT ROUND(AVG(length_of_stay), 2) AS avg_observation_los FROM encounters WHERE encounter_type = 'Observation';",
            "Filter to observation, then average LOS."
          ),
          challengeLesson(
            "ob_04",
            "Long Observation Stays",
            "Return observation encounters with LOS over 2.",
            ["WHERE"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, patient_id, length_of_stay FROM encounters WHERE encounter_type = 'Observation' AND length_of_stay > 2;",
            "SELECT encounter_id, patient_id, length_of_stay FROM encounters WHERE encounter_type = 'Observation' AND length_of_stay > 2;",
            "Filter to observation and LOS > 2."
          ),
          scenarioLesson(
            "ob_05",
            "Observation Threshold Scenario",
            "Recognize why long-stay thresholds need consistency.",
            ["encounters"],
            "Think operational definition.",
            "Threshold reporting only works when everyone agrees on the cutoff that triggers review.",
            "If one report uses >24 hours and another uses >48 hours, are they describing the same prolonged observation KPI?",
            "no",
            {
              show: true,
              metric: "Threshold-based observation review",
              whyItMatters: "Different cutoffs will produce very different exception counts.",
              whatToShare: "Define the long-stay threshold up front.",
              action: "Lock threshold logic before leadership distribution."
            }
          )
        ]
      },
      {
        id: "length_of_stay_kpis",
        title: "Length of Stay KPIs",
        order: 18,
        lessons: [
          conceptLesson(
            "ls_01",
            "Length of Stay as an Operational KPI",
            "Understand how LOS helps explain utilization and throughput.",
            ["AVG", "GROUP BY", "CASE", "ORDER BY"],
            ["encounters"],
            "LOS is usually summarized by department, facility, service line, or encounter type.",
            "Length of stay can reveal throughput challenges, discharge barriers, and variation across operational units.",
            [
              "Average LOS summarizes typical duration",
              "Outlier LOS highlights exceptions",
              "Grouped LOS views help leaders focus on where variation is occurring"
            ],
            "Leadership often wants average LOS plus a view of units with longer-than-expected stays.",
            {
              show: true,
              metric: "Length of stay performance",
              whyItMatters: "LOS affects capacity, patient flow, staffing pressure, and cost.",
              whatToShare: "Summarize average LOS and identify areas with elevated stay duration.",
              action: "Pair LOS summaries with ranked exception views."
            }
          ),
          challengeLesson(
            "ls_02",
            "Average LOS by Facility",
            "Return facility and average LOS.",
            ["GROUP BY", "AVG", "ROUND"],
            ["encounters"],
            "No join needed.",
            "SELECT facility, ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters GROUP BY facility;",
            "SELECT facility, ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters GROUP BY facility;",
            "Group by facility and average LOS."
          ),
          challengeLesson(
            "ls_03",
            "Longest Stay Encounters",
            "Return encounters ordered by LOS descending.",
            ["ORDER BY"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, patient_id, department, length_of_stay FROM encounters ORDER BY length_of_stay DESC;",
            "SELECT encounter_id, patient_id, department, length_of_stay FROM encounters ORDER BY length_of_stay DESC;",
            "Sort LOS from longest to shortest."
          ),
          challengeLesson(
            "ls_04",
            "LOS Buckets by Encounter",
            "Return encounter_id and a LOS bucket of Long or Short.",
            ["CASE"],
            ["encounters"],
            "No join needed.",
            "SELECT encounter_id, CASE WHEN length_of_stay >= 3 THEN 'Long' ELSE 'Short' END AS los_bucket FROM encounters;",
            "SELECT encounter_id, CASE WHEN length_of_stay >= 3 THEN 'Long' ELSE 'Short' END AS los_bucket FROM encounters;",
            "Use CASE on length_of_stay."
          ),
          scenarioLesson(
            "ls_05",
            "LOS Interpretation Scenario",
            "Recognize why average LOS alone is not always enough.",
            ["encounters"],
            "Think variation and outliers.",
            "An average can hide whether the issue is broad or driven by a few very long stays.",
            "If average LOS is high, should you usually also look at the longest individual stays or unit-level variation?",
            "yes",
            {
              show: true,
              metric: "LOS interpretation depth",
              whyItMatters: "A single average can hide operational root causes.",
              whatToShare: "Pair average LOS with ranked outliers or grouped comparisons.",
              action: "Do not stop at the mean."
            }
          )
        ]
      },
      {
        id: "denials_kpis",
        title: "Denials KPIs",
        order: 19,
        lessons: [
          conceptLesson(
            "dn_01",
            "Denials as Financial and Operational Signals",
            "Understand how denials reporting supports revenue cycle action.",
            ["WHERE", "GROUP BY", "SUM", "COUNT", "ORDER BY"],
            ["claims"],
            "Denials logic usually starts with claim_status = 'Denied'.",
            "Denials reporting can be framed by count, dollars, payer, department, or claim category depending on the leadership question.",
            [
              "Count shows volume",
              "Billed dollars show financial impact",
              "Grouped payer views help target action"
            ],
            "A payer with fewer denials can still be the biggest financial problem if the denied dollars are much larger.",
            {
              show: true,
              metric: "Denial count and dollars at risk",
              whyItMatters: "Denials directly affect reimbursement and cash flow.",
              whatToShare: "Show both count and dollar impact, not just one.",
              action: "Prioritize high-dollar denial categories first."
            }
          ),
          challengeLesson(
            "dn_02",
            "Denied Claim Count",
            "Return total count of denied claims.",
            ["WHERE", "COUNT"],
            ["claims"],
            "No join needed.",
            "SELECT COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied';",
            "SELECT COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied';",
            "Filter claim_status to Denied and count rows."
          ),
          challengeLesson(
            "dn_03",
            "Denied Dollars Total",
            "Return total billed amount for denied claims.",
            ["WHERE", "SUM"],
            ["claims"],
            "No join needed.",
            "SELECT SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied';",
            "SELECT SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied';",
            "Filter denied claims and sum billed_amount."
          ),
          challengeLesson(
            "dn_04",
            "Denied Claims by Payer Ranked",
            "Return payer and denied dollars ordered highest to lowest.",
            ["WHERE", "GROUP BY", "SUM", "ORDER BY"],
            ["claims"],
            "No join needed.",
            "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "Filter denied, group by payer, sum billed_amount, and sort descending."
          ),
          scenarioLesson(
            "dn_05",
            "Denial Prioritization Scenario",
            "Recognize why denied dollars matter along with denied volume.",
            ["claims"],
            "Think financial impact, not just counts.",
            "The biggest operational focus is not always the category with the most rows.",
            "If one payer has fewer denials but far more denied dollars, should leadership still prioritize that payer for review?",
            "yes",
            {
              show: true,
              metric: "High-impact denial prioritization",
              whyItMatters: "Dollar exposure can outweigh raw volume.",
              whatToShare: "Separate count-based and dollar-based prioritization.",
              action: "Escalate high-dollar denial risk even when volume is smaller."
            }
          )
        ]
      },
      {
        id: "ed_throughput_kpis",
        title: "ED Throughput KPIs",
        order: 20,
        lessons: [
          conceptLesson(
            "ed_01",
            "ED Throughput Framing",
            "Understand how SQL supports emergency department throughput review.",
            ["WHERE", "GROUP BY", "COUNT", "AVG"],
            ["encounters"],
            "Emergency department reporting often starts with encounter_type = 'Emergency' or department = 'ER'.",
            "ED throughput views typically focus on volume, LOS, boarding proxies, and timing distribution by facility or department.",
            [
              "ED volume is a starting point",
              "ED LOS highlights operational burden",
              "Grouped views help compare performance across sites or times"
            ],
            "Leadership often wants to know both how much volume exists and where throughput pressure may be building.",
            {
              show: true,
              metric: "ED throughput visibility",
              whyItMatters: "ED pressure affects patient experience, flow, and hospital operations.",
              whatToShare: "Summarize ED volume, average LOS, and top exception areas.",
              action: "Use grouped comparisons to focus operational response."
            }
          ),
          challengeLesson(
            "ed_02",
            "Emergency Encounter Count",
            "Return total count of emergency encounters.",
            ["WHERE", "COUNT"],
            ["encounters"],
            "No join needed.",
            "SELECT COUNT(*) AS emergency_encounter_count FROM encounters WHERE encounter_type = 'Emergency';",
            "SELECT COUNT(*) AS emergency_encounter_count FROM encounters WHERE encounter_type = 'Emergency';",
            "Filter encounter_type = 'Emergency' and count rows."
          ),
          challengeLesson(
            "ed_03",
            "Average ED LOS",
            "Return average LOS for emergency encounters.",
            ["WHERE", "AVG", "ROUND"],
            ["encounters"],
            "No join needed.",
            "SELECT ROUND(AVG(length_of_stay), 2) AS avg_ed_los FROM encounters WHERE encounter_type = 'Emergency';",
            "SELECT ROUND(AVG(length_of_stay), 2) AS avg_ed_los FROM encounters WHERE encounter_type = 'Emergency';",
            "Filter emergency encounters and average LOS."
          ),
          challengeLesson(
            "ed_04",
            "ED Volume by Facility",
            "Return facility and emergency encounter count.",
            ["WHERE", "GROUP BY", "COUNT"],
            ["encounters"],
            "No join needed.",
            "SELECT facility, COUNT(*) AS emergency_encounter_count FROM encounters WHERE encounter_type = 'Emergency' GROUP BY facility;",
            "SELECT facility, COUNT(*) AS emergency_encounter_count FROM encounters WHERE encounter_type = 'Emergency' GROUP BY facility;",
            "Filter emergency encounters, then group by facility."
          ),
          scenarioLesson(
            "ed_05",
            "Throughput Scenario",
            "Recognize why ED throughput needs both volume and duration views.",
            ["encounters"],
            "Think volume plus time burden.",
            "A department can have high volume, long stays, or both, and each pattern suggests a different operational problem.",
            "If ED encounters are rising, should leadership usually also look at LOS instead of only raw volume?",
            "yes",
            {
              show: true,
              metric: "ED throughput interpretation",
              whyItMatters: "Volume alone does not explain operational strain.",
              whatToShare: "Pair encounter counts with stay duration metrics.",
              action: "Use both load and time burden in ED reviews."
            }
          )
        ]
      },
      {
        id: "appointment_access_kpis",
        title: "Appointment Access KPIs",
        order: 21,
        lessons: [
          conceptLesson(
            "aa_01",
            "Access and Scheduling Logic",
            "Understand how appointment data supports access reporting.",
            ["WHERE", "GROUP BY", "COUNT", "CASE"],
            ["appointments"],
            "Scheduling reporting often centers on status, department, provider, and date.",
            "Access reporting helps leaders understand completed visits, no-shows, scheduled demand, and possible scheduling gaps.",
            [
              "Appointment status is central to access reporting",
              "No-shows often matter by department or provider",
              "Grouped volume helps identify operational pressure points"
            ],
            "Access KPIs often become the first signal that downstream throughput or clinic utilization issues are developing.",
            {
              show: true,
              metric: "Access and scheduling performance",
              whyItMatters: "Appointment completion and no-show patterns affect access, continuity, and revenue.",
              whatToShare: "Summarize completed, scheduled, and no-show activity by the unit leaders can influence.",
              action: "Escalate recurring no-show concentration by area."
            }
          ),
          challengeLesson(
            "aa_02",
            "Completed Appointments Count",
            "Return count of completed appointments.",
            ["WHERE", "COUNT"],
            ["appointments"],
            "No join needed.",
            "SELECT COUNT(*) AS completed_appointment_count FROM appointments WHERE status = 'Completed';",
            "SELECT COUNT(*) AS completed_appointment_count FROM appointments WHERE status = 'Completed';",
            "Filter status = 'Completed' and count rows."
          ),
          challengeLesson(
            "aa_03",
            "No-Shows by Department",
            "Return department and no-show count.",
            ["WHERE", "GROUP BY", "COUNT"],
            ["appointments"],
            "No join needed.",
            "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department;",
            "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department;",
            "Filter No Show and group by department."
          ),
          challengeLesson(
            "aa_04",
            "Appointments by Status",
            "Return status and appointment count.",
            ["GROUP BY", "COUNT"],
            ["appointments"],
            "No join needed.",
            "SELECT status, COUNT(*) AS appointment_count FROM appointments GROUP BY status;",
            "SELECT status, COUNT(*) AS appointment_count FROM appointments GROUP BY status;",
            "Group by status and count appointments."
          ),
          scenarioLesson(
            "aa_05",
            "Access Review Scenario",
            "Recognize why no-shows should usually be grouped, not only totaled.",
            ["appointments"],
            "Think actionability by unit.",
            "A system-wide total may confirm a problem, but grouped views show where to intervene.",
            "If no-shows are high, should leadership usually also want to know which departments or providers drive them?",
            "yes",
            {
              show: true,
              metric: "Actionable no-show reporting",
              whyItMatters: "Grouped views reveal where intervention can actually occur.",
              whatToShare: "Move from overall totals to department or provider detail.",
              action: "Always tie access issues to an accountable unit."
            }
          )
        ]
      },
      {
        id: "provider_performance_sql",
        title: "Provider Performance SQL",
        order: 22,
        lessons: [
          conceptLesson(
            "pp_01",
            "Provider-Level Reporting Basics",
            "Understand how provider performance views are constructed from encounter and appointment data.",
            ["JOIN", "GROUP BY", "COUNT", "AVG"],
            ["providers", "encounters", "appointments"],
            "Provider reporting usually joins provider dimension data to activity tables.",
            "Provider-level SQL can support views of volume, specialty comparisons, access patterns, and operational burden.",
            [
              "Join providers to activity",
              "Group by provider_name or specialty",
              "Be careful not to mix provider and department questions"
            ],
            "Leaders often want to compare providers, but the reporting unit must match the actual question being asked.",
            {
              show: true,
              metric: "Provider activity visibility",
              whyItMatters: "Provider-level views support staffing, access, and performance review.",
              whatToShare: "Use provider grouping only when the business question is truly provider-specific.",
              action: "Align the reporting grain to the decision-maker."
            }
          ),
          challengeLesson(
            "pp_02",
            "Encounters by Provider",
            "Return provider_name and encounter count.",
            ["JOIN", "GROUP BY", "COUNT"],
            ["providers", "encounters"],
            "encounters.provider_id = providers.provider_id",
            "SELECT p.provider_name, COUNT(*) AS encounter_count FROM encounters e JOIN providers p ON e.provider_id = p.provider_id GROUP BY p.provider_name;",
            "SELECT p.provider_name, COUNT(*) AS encounter_count FROM encounters e JOIN providers p ON e.provider_id = p.provider_id GROUP BY p.provider_name;",
            "Join encounters to providers and group by provider_name."
          ),
          challengeLesson(
            "pp_03",
            "Appointments by Provider",
            "Return provider_name and appointment count.",
            ["JOIN", "GROUP BY", "COUNT"],
            ["providers", "appointments"],
            "appointments.provider_id = providers.provider_id",
            "SELECT p.provider_name, COUNT(*) AS appointment_count FROM appointments a JOIN providers p ON a.provider_id = p.provider_id GROUP BY p.provider_name;",
            "SELECT p.provider_name, COUNT(*) AS appointment_count FROM appointments a JOIN providers p ON a.provider_id = p.provider_id GROUP BY p.provider_name;",
            "Join appointments to providers and group by provider_name."
          ),
          challengeLesson(
            "pp_04",
            "Average LOS by Provider",
            "Return provider_name and average LOS.",
            ["JOIN", "GROUP BY", "AVG", "ROUND"],
            ["providers", "encounters"],
            "encounters.provider_id = providers.provider_id",
            "SELECT p.provider_name, ROUND(AVG(e.length_of_stay), 2) AS avg_los FROM encounters e JOIN providers p ON e.provider_id = p.provider_id GROUP BY p.provider_name;",
            "SELECT p.provider_name, ROUND(AVG(e.length_of_stay), 2) AS avg_los FROM encounters e JOIN providers p ON e.provider_id = p.provider_id GROUP BY p.provider_name;",
            "Join encounters to providers, group by provider_name, and average LOS."
          ),
          scenarioLesson(
            "pp_05",
            "Provider Grain Scenario",
            "Recognize why reporting grain matters.",
            ["providers", "encounters", "appointments"],
            "Think accountability and business question.",
            "A report can be technically correct but still wrong for the decision if the grain does not match the question.",
            "If leadership asks about provider performance, should you usually group by provider rather than only by department?",
            "yes",
            {
              show: true,
              metric: "Correct reporting grain",
              whyItMatters: "Wrong grouping hides the accountable unit.",
              whatToShare: "Match provider questions with provider-level output.",
              action: "Confirm the grain before building the metric."
            }
          )
        ]
      },
      {
        id: "executive_summary_sql",
        title: "Executive Summary SQL",
        order: 23,
        lessons: [
          conceptLesson(
            "ex_01",
            "What Makes SQL Executive-Ready",
            "Understand how to shape technical results for leadership use.",
            ["GROUP BY", "ORDER BY", "SUM", "COUNT", "AVG", "CASE"],
            ["claims", "charges", "encounters", "appointments"],
            "Choose the metric and grouping that leadership can act on.",
            "Executive-ready SQL is not just correct. It is concise, prioritized, and tied to a business decision.",
            [
              "Use grouped summaries instead of raw row dumps",
              "Rank outputs when leaders need prioritization",
              "Translate technical output into operational meaning"
            ],
            "A good analyst does not just return data. They frame what matters, why it matters, and what action should follow.",
            {
              show: true,
              metric: "Executive-facing summary quality",
              whyItMatters: "Leaders need interpretable, prioritized information rather than raw extracts.",
              whatToShare: "Provide grouped results, ranking, and business framing.",
              action: "Always ask what decision the SQL is meant to support."
            }
          ),
          challengeLesson(
            "ex_02",
            "Top Payers by Charges",
            "Return payer and total charges ordered highest to lowest.",
            ["GROUP BY", "SUM", "ORDER BY"],
            ["charges"],
            "No join needed.",
            "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer ORDER BY total_amount DESC;",
            "SELECT payer, SUM(amount) AS total_amount FROM charges GROUP BY payer ORDER BY total_amount DESC;",
            "Group by payer, sum amount, then sort descending."
          ),
          challengeLesson(
            "ex_03",
            "Top Departments by Encounters",
            "Return department and encounter count ordered highest to lowest.",
            ["GROUP BY", "COUNT", "ORDER BY"],
            ["encounters"],
            "No join needed.",
            "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department ORDER BY encounter_count DESC;",
            "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department ORDER BY encounter_count DESC;",
            "Group by department, count rows, and sort descending."
          ),
          challengeLesson(
            "ex_04",
            "Denied Dollars by Payer",
            "Return payer and denied dollars ordered highest to lowest.",
            ["WHERE", "GROUP BY", "SUM", "ORDER BY"],
            ["claims"],
            "No join needed.",
            "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "Filter denied claims, group by payer, sum billed_amount, and rank descending."
          ),
          scenarioLesson(
            "ex_05",
            "Leadership Summary Scenario",
            "Recognize what should be surfaced first for executives.",
            ["claims", "charges", "encounters"],
            "Think actionability and priority.",
            "Leadership usually needs the most material issues first, not an undifferentiated export.",
            "If you are briefing executives, should you usually rank the biggest issues first instead of showing an unsorted full dataset?",
            "yes",
            {
              show: true,
              metric: "Executive prioritization",
              whyItMatters: "Ranking focuses attention on what most needs action.",
              whatToShare: "Lead with the biggest risks, opportunities, or exceptions.",
              action: "Sort by impact before presenting upward."
            }
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
    return curriculum.find(t => t.id === appState.currentTrackId) || curriculum[0];
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
