const STORAGE_KEY = "careops_curriculum_master_v2";

let appState = {
  currentTrackId: "track_foundations",
  currentCategoryId: null,
  currentLessonId: null,
  currentView: "overview",
  completedLessonIds: [],
  firstTryLessonIds: [],
  schemaPanelWidth: 320,
  lessonStats: {}
};

let SQL = null;
let sqlDb = null;
let sqlEngineReady = false;
let attempts = 0;
let lastRunQuery = "";
let activeDifficultyFilter = null;

const LEARNING_LEVELS = [
  { label: "Foundations", key: "foundations", color: "#22c55e", trackId: "track_foundations" },
  { label: "Core", key: "core", color: "#2563eb", trackId: "track_core" },
  { label: "Applied", key: "applied", color: "#f59e0b", trackId: "track_applied" },
  { label: "Advanced", key: "advanced", color: "#ef4444", trackId: "track_advanced" },
  { label: "Expert", key: "expert", color: "#7c3aed", trackId: "track_expert" }
];

const schema = {
  tables: [
    { name: "patients", description: "Patient demographic, insurance, and risk information.", keyColumns: ["patient_id"], notableColumns: ["patient_id","first_name","last_name","age","gender","insurance_type","risk_score","city"], sampleRows: [] },
    { name: "providers", description: "Provider names, specialties, and facility assignments.", keyColumns: ["provider_id"], notableColumns: ["provider_id","provider_name","specialty","facility"], sampleRows: [] },
    { name: "departments", description: "Hospital and clinic departments by facility and service line.", keyColumns: ["department_id"], notableColumns: ["department_id","department_name","facility","service_line"], sampleRows: [] },
    { name: "encounters", description: "Patient encounters tied to providers and departments.", keyColumns: ["encounter_id"], notableColumns: ["encounter_id","patient_id","provider_id","department_id","facility","department","status","encounter_type","length_of_stay","admit_date","discharge_date"], sampleRows: [] },
    { name: "appointments", description: "Scheduled appointments tied to patients and providers.", keyColumns: ["appointment_id"], notableColumns: ["appointment_id","patient_id","provider_id","department_id","facility","department","status","date"], sampleRows: [] },
    { name: "charges", description: "Financial charges tied to patients and encounters.", keyColumns: ["charge_id"], notableColumns: ["charge_id","patient_id","encounter_id","amount","payer","charge_type"], sampleRows: [] },
    { name: "claims", description: "Claims tied to patients and encounters.", keyColumns: ["claim_id"], notableColumns: ["claim_id","patient_id","encounter_id","payer","claim_status","billed_amount"], sampleRows: [] },
    { name: "discharges", description: "Discharge workflow details including delays and disposition.", keyColumns: ["discharge_id"], notableColumns: ["discharge_id","encounter_id","patient_id","facility","department","discharge_disposition","discharge_order_minutes","departure_minutes","delayed_for_transport"], sampleRows: [] },
    { name: "readmissions", description: "Thirty-day readmission tracking.", keyColumns: ["readmission_id"], notableColumns: ["readmission_id","index_encounter_id","readmit_encounter_id","patient_id","facility","readmit_within_30_days","days_to_readmit"], sampleRows: [] },
    { name: "observations", description: "Observation stays and conversion details.", keyColumns: ["observation_id"], notableColumns: ["observation_id","encounter_id","patient_id","facility","department","obs_hours","converted_to_inpatient","code_44_flag"], sampleRows: [] }
  ],
  relationships: [
    "patients.patient_id = encounters.patient_id",
    "patients.patient_id = appointments.patient_id",
    "patients.patient_id = charges.patient_id",
    "patients.patient_id = claims.patient_id",
    "encounters.provider_id = providers.provider_id",
    "encounters.department_id = departments.department_id",
    "appointments.provider_id = providers.provider_id",
    "appointments.department_id = departments.department_id",
    "charges.encounter_id = encounters.encounter_id",
    "claims.encounter_id = encounters.encounter_id",
    "discharges.encounter_id = encounters.encounter_id",
    "readmissions.patient_id = patients.patient_id",
    "observations.encounter_id = encounters.encounter_id"
  ]
};

const curriculum = [
  {
    "id": "track_foundations",
    "title": "Foundations",
    "description": "Foundations learning path for CareOps hospital analytics.",
    "order": 1,
    "categories": [
      {
        "id": "intro_relational_databases",
        "title": "Introduction to Relational Databases",
        "order": 1,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_001",
            "title": "What Is a Relational Database?",
            "objective": "Understand what a relational database is, why it is organized into related tables, and why that matters in hospital analytics.",
            "sql_focus": [
              "SELECT",
              "FROM",
              "JOIN"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "A relational database becomes useful when you connect related tables at the correct grain.",
            "summary": "A relational database stores information in separate but connected tables. Instead of putting every patient, encounter, claim, and charge field into one giant spreadsheet, it organizes each subject into its own table and links them with keys so analysts can ask precise questions without duplicating data.",
            "bullets": [
              "A table stores one type of business entity, such as patients, encounters, claims, or charges.",
              "Rows are individual records and columns are the attributes that describe each record.",
              "Relationships let you connect tables by shared keys such as patient_id or encounter_id.",
              "In SQL, you usually start with a base table that matches your reporting grain, then join related tables only when you need additional context.",
              "In hospital analytics, this structure prevents double counting and makes operational, financial, and quality reporting more trustworthy."
            ],
            "example": "Hospital example: if leadership asks for average charges per encounter, you would likely start with the encounters table as the reporting grain, then connect charges using encounter_id. Basic SQL pattern: SELECT e.encounter_id, c.amount FROM encounters e JOIN charges c ON e.encounter_id = c.encounter_id;",
            "executiveTakeaway": {
              "show": false
            }
          },
          {
            "kind": "concept",
            "id": "l_002",
            "title": "Tables, Rows, and Columns",
            "objective": "Identify how healthcare data is organized into tables, rows, and columns and how to inspect that structure with SQL.",
            "sql_focus": [
              "SELECT",
              "LIMIT"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Before you write a complex query, confirm what each table represents and what each row means.",
            "summary": "A table is a collection of records about one subject. Each row is one record, and each column is one field about that record. Analysts must understand row meaning before counting anything, because a bad assumption about row grain leads directly to bad hospital reporting.",
            "bullets": [
              "In patients, one row should represent one patient; in encounters, one row should represent one encounter.",
              "Columns define what you can analyze, such as admit_date, payer, amount, department, or provider_id.",
              "If you do not understand the row grain, you can easily overstate metrics like volume, revenue, or denials.",
              "A quick way to inspect a table in SQL is to query a few rows: SELECT * FROM patients LIMIT 5;",
              "Use the column list to decide whether the table already contains what you need or whether you will need a join."
            ],
            "example": "Hospital example: if encounters has one row per visit and charges has multiple rows per visit, counting rows in charges does not equal counting encounters. SQL inspection example: SELECT encounter_id, patient_id, department, admit_date FROM encounters LIMIT 5;",
            "executiveTakeaway": {
              "show": false
            }
          },
          {
            "kind": "concept",
            "id": "l_003",
            "title": "Primary Keys and Unique Identifiers",
            "objective": "Learn what a primary key is, how it supports data integrity, and how to recognize likely unique identifiers in SQL tables.",
            "sql_focus": [
              "COUNT",
              "GROUP BY",
              "HAVING"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "A primary key should uniquely identify one row in its table and should never be duplicated.",
            "summary": "A primary key is a column or combination of columns that uniquely identifies each row in a table. In analytics, primary keys help you trust that you are looking at one record only once and give you a stable field to use in joins and quality checks.",
            "bullets": [
              "Common healthcare examples include patient_id in patients, encounter_id in encounters, claim_id in claims, and charge_id in charges.",
              "A true unique identifier should not repeat within the same table.",
              "You can test whether a field behaves like a key by grouping and checking for duplicates.",
              "One SQL pattern to validate uniqueness is: SELECT patient_id, COUNT(*) FROM patients GROUP BY patient_id HAVING COUNT(*) > 1;",
              "If your supposed key has duplicates, your downstream counts, joins, and KPI calculations may be wrong."
            ],
            "example": "Hospital example: before joining encounters to charges, confirm that encounter_id is unique in encounters. If it is not, total charges by encounter may be overstated. SQL check: SELECT encounter_id, COUNT(*) FROM encounters GROUP BY encounter_id HAVING COUNT(*) > 1;",
            "executiveTakeaway": {
              "show": false
            }
          },
          {
            "kind": "concept",
            "id": "l_004",
            "title": "Foreign Keys and Relationships",
            "objective": "Understand what a foreign key is, how relationships work between tables, and how to use those keys in SQL joins.",
            "sql_focus": [
              "JOIN",
              "ON"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "charges",
              "claims"
            ],
            "joinHint": "A foreign key usually points to a primary key in another table and tells you how records are related.",
            "summary": "A foreign key is a column in one table that references the primary key of another table. It is what allows a relational database to connect patients to encounters, encounters to charges, and encounters to claims.",
            "bullets": [
              "patients.patient_id is a likely primary key, and encounters.patient_id is a likely foreign key pointing back to patients.",
              "encounters.encounter_id is a likely primary key, and charges.encounter_id and claims.encounter_id are likely foreign keys.",
              "In SQL, you use relationships in a JOIN ... ON clause to connect tables correctly.",
              "A common pattern is: SELECT e.encounter_id, p.first_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
              "If you join on the wrong fields, you can create duplicate rows and distort operational or financial metrics."
            ],
            "example": "Hospital example: to report charges by patient, you may connect patients to encounters through patient_id and then connect encounters to charges through encounter_id. SQL pattern: SELECT p.patient_id, e.encounter_id, c.amount FROM patients p JOIN encounters e ON p.patient_id = e.patient_id JOIN charges c ON e.encounter_id = c.encounter_id;",
            "executiveTakeaway": {
              "show": false
            }
          },
          {
            "kind": "concept",
            "id": "l_005",
            "title": "Understanding Healthcare Data Entities",
            "objective": "Recognize the difference between patients, encounters, providers, claims, and charges so you choose the correct table for the question you are answering.",
            "sql_focus": [
              "Reporting grain",
              "Entity selection"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "providers",
              "claims",
              "charges"
            ],
            "joinHint": "Choose the table that matches the business question before you worry about joins.",
            "summary": "Healthcare analytics depends on knowing which entity you are analyzing. A patient is not the same as an encounter, a claim is not the same as a charge, and a provider is not the same as a department. Strong analysts match the question to the right entity before writing SQL.",
            "bullets": [
              "Use patients when the question is about unique people, such as how many patients had a visit.",
              "Use encounters when the question is about visits, admissions, or stays.",
              "Use charges when the question is about itemized financial activity, and claims when the question is about billed submissions.",
              "Use providers when the question is about physician, APP, or clinic productivity.",
              "The first decision in SQL is often not the syntax but the grain: one patient, one encounter, one claim, or one charge."
            ],
            "example": "Hospital example: 'How many patients visited the ED?' should start at patients joined to encounters, while 'How many ED encounters occurred?' starts at encounters. 'How much revenue was charged?' likely starts at charges. The table choice changes the answer.",
            "executiveTakeaway": {
              "show": false
            }
          },
          {
            "kind": "challenge",
            "id": "l_006",
            "title": "Introduction to SQL Syntax",
            "objective": "Use a basic SELECT statement to inspect a table and return the exact columns requested.",

            "challengeCriteria": "From the patients table, return exactly these four columns: patient_id, first_name, last_name, and insurance_type. Limit the result to the first 5 rows so you can inspect the table structure without returning the full dataset.",
            "sql_focus": [
              "SELECT",
              "FROM",
              "LIMIT"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Start simple: select only the fields you need from one base table.",
            "starterQuery": "SELECT patient_id, first_name, last_name, insurance_type\nFROM patients\nLIMIT 5;",
            "solutionQuery": "SELECT patient_id, first_name, last_name, insurance_type\nFROM patients\nLIMIT 5;",
            "hint": "Use SELECT to list four columns from patients, then use LIMIT 5 to inspect the first few rows.",

            "smartHint": "Use patients as the only table. Select patient_id, first_name, last_name, and insurance_type in that order, then add LIMIT 5.",

            "thirdHint": "You do not need a WHERE clause or a JOIN. The expected pattern is SELECT column1, column2, column3, column4 FROM patients LIMIT 5;",

            "explanation": "This answer is correct because the lesson asks you to inspect one table, not combine tables. It returns the exact four requested columns from patients and limits the result to 5 rows for quick inspection.",
            "executiveTakeaway": {
              "show": false
            }
          },
          {
            "kind": "scenario",
            "id": "l_007",
            "title": "Navigating a SQL Environment",
            "objective": "Explain how you would validate that a SQL workspace is ready before building a hospital analytics report.",
            "relevantTables": [
              "patients",
              "encounters"
            ],
            "joinHint": "Start by confirming the table exists, the key fields are visible, and a simple query returns expected results.",
            "summary": "Validate the environment, inspect the base table, and confirm that the query output matches the business question before building anything more complex.",
            "prompt": "You are a new CareOps analyst and have been asked to build a patient volume report. Describe the first steps you would take in the SQL workspace. Your response should name the first table you would inspect, mention an example SQL query you would run, explain what result would tell you the environment is working, and note one mistake that could happen if you misunderstand the table grain.",
            "expectedKeywords": [
              "patients",
              "select",
              "limit",
              "rows",
              "grain",
              "query"
            ],
            "minLength": 120,
            "minimumKeywordMatches": 3,
            "feedbackGuide": "A strong answer should identify the patients table, reference a simple SELECT ... LIMIT query, explain that returned rows confirm the environment is working, and mention the risk of using the wrong grain or table.",
            "executiveTakeaway": {
              "show": false
            }
          }
        ]
      },
      {
        "id": "basic_select_queries",
        "title": "Basic SELECT Queries",
        "order": 2,
        "lessons": [
          {
            "kind": "challenge",
            "id": "l_008",
            "title": "Selecting All Columns with SELECT *",
            "objective": "Retrieve complete datasets from a table.",

            "challengeCriteria": "Write a SQL query that pulls all columns and all patient records from the patients table. Use SELECT * and only the patients table for this lesson.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM patients;",
            "solutionQuery": "SELECT * FROM patients;",
            hint: "Start with a basic SELECT query against the patients table. This lesson is asking for every row and every column.",
smartHint: "You only need one table for this lesson, and you should use the wildcard symbol to return every column.",
thirdHint: "The correct pattern is SELECT * FROM patients; with no WHERE clause, no JOIN, and no LIMIT.",

            "explanation": "This answer is correct because SELECT * returns the full dataset from the table. In this lesson, the goal is to understand what the complete patients table looks like before narrowing queries.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Selecting All Columns with SELECT *",
              "whyItMatters": "Retrieve complete datasets from a table.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_009",
            "title": "Selecting Specific Columns",
            "objective": "Extract only relevant fields for analysis.",

            "challengeCriteria": "Return only these three columns from the patients table: patient_id, first_name, and last_name. Do not return any other columns.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT patient_id, first_name, last_name FROM patients;",
            "solutionQuery": "SELECT patient_id, first_name, last_name FROM patients;",
            "hint": "Select three columns from patients.",

            "smartHint": "List the three requested columns after SELECT and use patients in the FROM clause.",

            "thirdHint": "The structure should be SELECT patient_id, first_name, last_name FROM patients;",

            "explanation": "This answer is correct because it pulls only the three requested fields from patients. It teaches how selecting specific columns reduces noise and keeps the output focused on the business question.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Selecting Specific Columns",
              "whyItMatters": "Extract only relevant fields for analysis.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_010",
            "title": "Using Column Aliases",
            "objective": "Improve readability of query results.",

            "challengeCriteria": "Return patient_id and first_name from the patients table, but rename patient_id to id and first_name to fname using column aliases.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT patient_id AS id, first_name AS fname FROM patients;",
            "solutionQuery": "SELECT patient_id AS id, first_name AS fname FROM patients;",
            "hint": "Use AS to rename selected columns.",

            "smartHint": "Use AS to rename each selected field after the original column name.",

            "thirdHint": "The expected pattern is SELECT patient_id AS id, first_name AS fname FROM patients;",

            "explanation": "This answer is correct because it selects the requested columns and uses aliases to make the output labels easier to read. Aliases are useful when preparing a clean report for analysts or leaders.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Using Column Aliases",
              "whyItMatters": "Improve readability of query results.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_011",
            "title": "Removing Duplicates with DISTINCT",
            "objective": "Identify unique values in healthcare datasets.",

            "challengeCriteria": "Return each unique insurance_type value from the patients table one time only. This lesson is about removing duplicates from a single column.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT DISTINCT insurance_type FROM patients;",
            "solutionQuery": "SELECT DISTINCT insurance_type FROM patients;",
            "hint": "Use DISTINCT on insurance_type.",

            "smartHint": "Use DISTINCT directly after SELECT and before insurance_type.",

            "thirdHint": "The expected query is SELECT DISTINCT insurance_type FROM patients;",

            "explanation": "This answer is correct because DISTINCT removes duplicate insurance_type values and returns only the unique payer categories present in patients.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Removing Duplicates with DISTINCT",
              "whyItMatters": "Identify unique values in healthcare datasets.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_012",
            "title": "Limiting Results with LIMIT/TOP",
            "objective": "Restrict the number of rows returned.",

            "challengeCriteria": "Return all columns from the encounters table, but limit the result to 10 rows so you can preview a small sample instead of the full table.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM encounters LIMIT 10;",
            "solutionQuery": "SELECT * FROM encounters LIMIT 10;",
            "hint": "Use LIMIT to restrict rows.",

            "smartHint": "Use encounters as the base table and add LIMIT 10 at the end.",

            "thirdHint": "The pattern should be SELECT * FROM encounters LIMIT 10;",

            "explanation": "This answer is correct because it previews the encounters table without returning the full dataset. LIMIT is useful when validating table contents before building larger queries.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Limiting Results with LIMIT/TOP",
              "whyItMatters": "Restrict the number of rows returned.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_013",
            "title": "Sorting Results with ORDER BY",
            "objective": "Organize data for better interpretation.",

            "challengeCriteria": "Return all columns from the encounters table and sort the results by admit_date in descending order so the most recent admissions appear first.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM encounters ORDER BY admit_date DESC;",
            "solutionQuery": "SELECT * FROM encounters ORDER BY admit_date DESC;",
            "hint": "Sort by admit_date descending.",

            "smartHint": "Use ORDER BY admit_date DESC after selecting from encounters.",

            "thirdHint": "The expected structure is SELECT * FROM encounters ORDER BY admit_date DESC;",

            "explanation": "This answer is correct because it sorts encounters from most recent to oldest admission date. ORDER BY helps analysts review data in a meaningful sequence.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Sorting Results with ORDER BY",
              "whyItMatters": "Organize data for better interpretation.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_014",
            "title": "Combining SELECT Features",
            "objective": "Construct queries using multiple clauses.",

            "challengeCriteria": "Return the first 5 unique department names from the encounters table in alphabetical order. Use DISTINCT to avoid duplicates, ORDER BY to sort, and LIMIT to cap the output.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT DISTINCT department FROM encounters ORDER BY department LIMIT 5;",
            "solutionQuery": "SELECT DISTINCT department FROM encounters ORDER BY department LIMIT 5;",
            "hint": "Combine DISTINCT, ORDER BY, and LIMIT.",

            "smartHint": "Select DISTINCT department, sort by department, and limit to 5 rows.",

            "thirdHint": "The expected pattern is SELECT DISTINCT department FROM encounters ORDER BY department LIMIT 5;",

            "explanation": "This answer is correct because it combines three core SQL features: DISTINCT removes duplicates, ORDER BY sorts alphabetically, and LIMIT restricts the output to 5 rows.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Combining SELECT Features",
              "whyItMatters": "Construct queries using multiple clauses.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "filtering_and_logical_conditions",
        "title": "Filtering and Logical Conditions",
        "order": 3,
        "lessons": [
          {
            "kind": "challenge",
            "id": "l_015",
            "title": "Filtering with WHERE",
            "objective": "Retrieve records that meet specific criteria.",

            "challengeCriteria": "Use the encounters table to return only rows where status equals 'Discharged'. Do not join to any other table for this lesson.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM encounters WHERE status = 'Discharged';",
            "solutionQuery": "SELECT * FROM encounters WHERE status = 'Discharged';",
            "hint": "Filter encounters by status.",

            "smartHint": "Start with encounters, then use WHERE status = 'Discharged'.",

            "thirdHint": "The expected query is SELECT * FROM encounters WHERE status = 'Discharged';",

            "explanation": "This answer is correct because it filters encounters down to only discharged visits. WHERE is used when you need records that meet a specific condition.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Filtering with WHERE",
              "whyItMatters": "Retrieve records that meet specific criteria.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_016",
            "title": "Comparison Operators",
            "objective": "Apply conditional logic to filter healthcare data.",

            "challengeCriteria": "Use the charges table to return only rows where amount is greater than 1000. This lesson is about comparison operators such as >, <, >=, and <=.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM charges WHERE amount > 1000;",
            "solutionQuery": "SELECT * FROM charges WHERE amount > 1000;",
            "hint": "Use a comparison operator on amount.",

            "smartHint": "Filter charges using WHERE amount > 1000.",

            "thirdHint": "The expected pattern is SELECT * FROM charges WHERE amount > 1000;",

            "explanation": "This answer is correct because it uses a comparison operator to restrict the result to higher-dollar charges. Comparison logic is foundational for identifying thresholds and exceptions.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Comparison Operators",
              "whyItMatters": "Apply conditional logic to filter healthcare data.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_017",
            "title": "Logical Operators",
            "objective": "Combine multiple filtering conditions.",

            "challengeCriteria": "Use the patients table to return only rows where age is 65 or older and insurance_type is Medicare. You must combine both conditions in the same WHERE clause.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM patients WHERE age >= 65 AND insurance_type = 'Medicare';",
            "solutionQuery": "SELECT * FROM patients WHERE age >= 65 AND insurance_type = 'Medicare';",
            "hint": "Use AND or OR to combine filters.",

            "smartHint": "Use AND to connect age >= 65 with insurance_type = 'Medicare'.",

            "thirdHint": "The expected query is SELECT * FROM patients WHERE age >= 65 AND insurance_type = 'Medicare';",

            "explanation": "This answer is correct because it combines two filters in one query. Logical operators let you narrow the result to the exact business population you want.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Logical Operators",
              "whyItMatters": "Combine multiple filtering conditions.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_018",
            "title": "Using BETWEEN for Range Filtering",
            "objective": "Analyze metrics within defined ranges.",

            "challengeCriteria": "Use the encounters table to return only rows where length_of_stay is between 2 and 5 days, inclusive.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM encounters WHERE length_of_stay BETWEEN 2 AND 5;",
            "solutionQuery": "SELECT * FROM encounters WHERE length_of_stay BETWEEN 2 AND 5;",
            "hint": "Use BETWEEN on length_of_stay.",

            "smartHint": "Use BETWEEN 2 AND 5 on length_of_stay.",

            "thirdHint": "The expected query is SELECT * FROM encounters WHERE length_of_stay BETWEEN 2 AND 5;",

            "explanation": "This answer is correct because BETWEEN is designed for inclusive range filtering. It is often used when identifying patients or encounters within a defined threshold.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Using BETWEEN for Range Filtering",
              "whyItMatters": "Analyze metrics within defined ranges.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_019",
            "title": "Using IN for Multiple Values",
            "objective": "Filter datasets by multiple categories.",

            "challengeCriteria": "Use the claims table to return only rows where payer is either Medicare or Medicaid. This lesson is about filtering for more than one allowed value.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM claims WHERE payer IN ('Medicare','Medicaid');",
            "solutionQuery": "SELECT * FROM claims WHERE payer IN ('Medicare','Medicaid');",
            "hint": "Use IN with payer values.",

            "smartHint": "Use WHERE payer IN ('Medicare','Medicaid').",

            "thirdHint": "The expected query is SELECT * FROM claims WHERE payer IN ('Medicare','Medicaid');",

            "explanation": "This answer is correct because IN is the cleanest way to filter a column for multiple accepted values without writing repeated OR conditions.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Using IN for Multiple Values",
              "whyItMatters": "Filter datasets by multiple categories.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_020",
            "title": "Handling Missing Data with IS NULL",
            "objective": "Identify incomplete healthcare records.",

            "challengeCriteria": "Use the patients table to return only rows where city is missing. This lesson is about identifying null values correctly.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM patients WHERE city IS NULL;",
            "solutionQuery": "SELECT * FROM patients WHERE city IS NULL;",
            "hint": "Use IS NULL on a nullable field.",

            "smartHint": "Use IS NULL rather than = NULL.",

            "thirdHint": "The expected query is SELECT * FROM patients WHERE city IS NULL;",

            "explanation": "This answer is correct because SQL uses IS NULL to detect missing values. This is important when auditing data quality or incomplete records.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Handling Missing Data with IS NULL",
              "whyItMatters": "Identify incomplete healthcare records.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_021",
            "title": "Pattern Matching with LIKE",
            "objective": "Search for text patterns in patient or provider data.",

            "challengeCriteria": "Use the providers table to return only rows where provider_name starts with the letter A. This lesson is about pattern matching with LIKE and wildcards.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "providers"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM providers WHERE provider_name LIKE 'A%';",
            "solutionQuery": "SELECT * FROM providers WHERE provider_name LIKE 'A%';",
            "hint": "Use LIKE with a wildcard.",

            "smartHint": "Use LIKE with the pattern 'A%'.",

            "thirdHint": "The expected query is SELECT * FROM providers WHERE provider_name LIKE 'A%';",

            "explanation": "This answer is correct because LIKE supports text pattern searches. The A% pattern returns provider names that begin with A.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Pattern Matching with LIKE",
              "whyItMatters": "Search for text patterns in patient or provider data.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "data_types_and_expressions",
        "title": "Data Types and Expressions",
        "order": 4,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_022",
            "title": "Understanding Common SQL Data Types",
            "objective": "Recognize numeric, text, and date data types.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Recognize numeric, text, and date data types.",
            "bullets": [
              "Understanding Common SQL Data Types is part of the Data Types and Expressions module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, understanding common sql data types supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Understanding Common SQL Data Types",
              "whyItMatters": "Recognize numeric, text, and date data types.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_023",
            "title": "Working with Numeric Calculations",
            "objective": "Perform arithmetic operations within queries.",

            "challengeCriteria": "From the charges table, return charge_id, amount, and a new calculated column called adjusted_amount that multiplies amount by 1.05.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT charge_id, amount, amount * 1.05 AS adjusted_amount FROM charges;",
            "solutionQuery": "SELECT charge_id, amount, amount * 1.05 AS adjusted_amount FROM charges;",
            "hint": "Create a derived numeric column.",

            "smartHint": "Select charge_id and amount, then create amount * 1.05 AS adjusted_amount.",

            "thirdHint": "The expected query is SELECT charge_id, amount, amount * 1.05 AS adjusted_amount FROM charges;",

            "explanation": "This answer is correct because it demonstrates arithmetic inside a SELECT statement and creates a derived numeric column with an alias.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Working with Numeric Calculations",
              "whyItMatters": "Perform arithmetic operations within queries.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_024",
            "title": "String Manipulation Functions",
            "objective": "Format and clean textual healthcare data.",

            "challengeCriteria": "From the patients table, return the last_name column in uppercase and rename the result last_name_upper.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT UPPER(last_name) AS last_name_upper FROM patients;",
            "solutionQuery": "SELECT UPPER(last_name) AS last_name_upper FROM patients;",
            "hint": "Use a string function like UPPER.",

            "smartHint": "Use the UPPER() function around last_name and alias the result.",

            "thirdHint": "The expected query is SELECT UPPER(last_name) AS last_name_upper FROM patients;",

            "explanation": "This answer is correct because it uses a string function to standardize text formatting, which is helpful when cleaning or comparing names.",
            "executiveTakeaway": {
              "show": true,
              "metric": "String Manipulation Functions",
              "whyItMatters": "Format and clean textual healthcare data.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_025",
            "title": "Date and Time Functions",
            "objective": "Analyze time-based healthcare events.",

            "challengeCriteria": "From the encounters table, return encounter_id and a new column called los_days that calculates the difference between discharge_date and admit_date in days using SQLite syntax.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT encounter_id, julianday(discharge_date) - julianday(admit_date) AS los_days FROM encounters;",
            "solutionQuery": "SELECT encounter_id, julianday(discharge_date) - julianday(admit_date) AS los_days FROM encounters;",
            "hint": "Calculate date difference in SQLite syntax.",

            "smartHint": "Use julianday(discharge_date) - julianday(admit_date) and alias it los_days.",

            "thirdHint": "The expected query is SELECT encounter_id, julianday(discharge_date) - julianday(admit_date) AS los_days FROM encounters;",

            "explanation": "This answer is correct because it calculates a date difference in SQLite and labels the result clearly. Date functions are essential for operational measures like LOS.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Date and Time Functions",
              "whyItMatters": "Analyze time-based healthcare events.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_026",
            "title": "Using CAST and CONVERT",
            "objective": "Transform data types for accurate analysis.",

            "challengeCriteria": "From the patients table, return patient_id and a new column called age_text that casts age to text.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT patient_id, CAST(age AS TEXT) AS age_text FROM patients;",
            "solutionQuery": "SELECT patient_id, CAST(age AS TEXT) AS age_text FROM patients;",
            "hint": "Use CAST on age.",

            "smartHint": "Use CAST(age AS TEXT) AS age_text.",

            "thirdHint": "The expected query is SELECT patient_id, CAST(age AS TEXT) AS age_text FROM patients;",

            "explanation": "This answer is correct because it transforms age from its numeric type into text using CAST, which is useful when formatting or combining fields.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Using CAST and CONVERT",
              "whyItMatters": "Transform data types for accurate analysis.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_027",
            "title": "Conditional Logic with CASE Statements",
            "objective": "Create derived categorical fields.",

            "challengeCriteria": "From the patients table, return patient_id and a derived column called age_group that labels patients age 65 or older as Senior and everyone else as Adult.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT patient_id, CASE WHEN age >= 65 THEN 'Senior' ELSE 'Adult' END AS age_group FROM patients;",
            "solutionQuery": "SELECT patient_id, CASE WHEN age >= 65 THEN 'Senior' ELSE 'Adult' END AS age_group FROM patients;",
            "hint": "Use CASE to create a grouped label.",

            "smartHint": "Use CASE WHEN age >= 65 THEN 'Senior' ELSE 'Adult' END AS age_group.",

            "thirdHint": "The expected query is SELECT patient_id, CASE WHEN age >= 65 THEN 'Senior' ELSE 'Adult' END AS age_group FROM patients;",

            "explanation": "This answer is correct because CASE lets you create business-friendly categories directly in SQL from existing numeric fields.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Conditional Logic with CASE Statements",
              "whyItMatters": "Create derived categorical fields.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_028",
            "title": "Creating Derived Columns",
            "objective": "Build new analytical fields from existing data.",

            "challengeCriteria": "From the encounters table, return encounter_id and a new column called los_hours that converts length_of_stay from days to hours by multiplying by 24.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT encounter_id, length_of_stay * 24 AS los_hours FROM encounters;",
            "solutionQuery": "SELECT encounter_id, length_of_stay * 24 AS los_hours FROM encounters;",
            "hint": "Create a new derived metric.",

            "smartHint": "Multiply length_of_stay by 24 and alias the result los_hours.",

            "thirdHint": "The expected query is SELECT encounter_id, length_of_stay * 24 AS los_hours FROM encounters;",

            "explanation": "This answer is correct because it creates a derived operational metric from an existing field. Derived columns help translate raw data into more useful business measures.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Creating Derived Columns",
              "whyItMatters": "Build new analytical fields from existing data.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "intro_healthcare_analytics",
        "title": "Introduction to Healthcare Analytics",
        "order": 5,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_029",
            "title": "Overview of Healthcare Data Systems",
            "objective": "Understand EMR, billing, and operational systems.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Understand EMR, billing, and operational systems.",
            "bullets": [
              "Overview of Healthcare Data Systems is part of the Introduction to Healthcare Analytics module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, overview of healthcare data systems supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Overview of Healthcare Data Systems",
              "whyItMatters": "Understand EMR, billing, and operational systems.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_030",
            "title": "Patient vs. Encounter vs. Account",
            "objective": "Distinguish between key healthcare data concepts.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Distinguish between key healthcare data concepts.",
            "prompt": "Explain how you would approach 'Patient vs. Encounter vs. Account' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Patient vs. Encounter vs. Account",
              "whyItMatters": "Distinguish between key healthcare data concepts.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_031",
            "title": "Introduction to Revenue Cycle Data",
            "objective": "Learn the flow from charges to payments.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Learn the flow from charges to payments.",
            "bullets": [
              "Introduction to Revenue Cycle Data is part of the Introduction to Healthcare Analytics module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, introduction to revenue cycle data supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Introduction to Revenue Cycle Data",
              "whyItMatters": "Learn the flow from charges to payments.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_032",
            "title": "Basic Operational Metrics",
            "objective": "Identify foundational healthcare KPIs.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Identify foundational healthcare KPIs.",
            "prompt": "Explain how you would approach 'Basic Operational Metrics' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Basic Operational Metrics",
              "whyItMatters": "Identify foundational healthcare KPIs.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_033",
            "title": "Understanding Payer and Insurance Data",
            "objective": "Recognize how payer information impacts analysis.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Recognize how payer information impacts analysis.",
            "bullets": [
              "Understanding Payer and Insurance Data is part of the Introduction to Healthcare Analytics module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, understanding payer and insurance data supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Understanding Payer and Insurance Data",
              "whyItMatters": "Recognize how payer information impacts analysis.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_034",
            "title": "Data Quality and Integrity in Healthcare",
            "objective": "Appreciate the importance of accurate data.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Appreciate the importance of accurate data.",
            "bullets": [
              "Data Quality and Integrity in Healthcare is part of the Introduction to Healthcare Analytics module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, data quality and integrity in healthcare supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Data Quality and Integrity in Healthcare",
              "whyItMatters": "Appreciate the importance of accurate data.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_035",
            "title": "Foundations Capstone: Patient Encounter Overview",
            "objective": "Apply foundational SQL skills to a healthcare scenario.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Apply foundational SQL skills to a healthcare scenario.",
            "prompt": "Explain how you would approach 'Foundations Capstone: Patient Encounter Overview' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Foundations Capstone: Patient Encounter Overview",
              "whyItMatters": "Apply foundational SQL skills to a healthcare scenario.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      }
    ]
  },
  {
    "id": "track_core",
    "title": "Core",
    "description": "Core learning path for CareOps hospital analytics.",
    "order": 2,
    "categories": [
      {
        "id": "aggregations_and_grouping",
        "title": "Aggregations and Grouping",
        "order": 1,
        "lessons": [
          {
            "kind": "challenge",
            "id": "l_036",
            "title": "Introduction to Aggregate Functions",
            "objective": "Use COUNT, SUM, AVG in healthcare analysis.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT COUNT(*) AS encounter_count, AVG(length_of_stay) AS avg_los FROM encounters;",
            "solutionQuery": "SELECT COUNT(*) AS encounter_count, AVG(length_of_stay) AS avg_los FROM encounters;",
            "hint": "Use COUNT and AVG.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Introduction to Aggregate Functions",
              "whyItMatters": "Use COUNT, SUM, AVG in healthcare analysis.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_037",
            "title": "Finding Minimum and Maximum Values",
            "objective": "Use MIN and MAX to identify extremes.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT MIN(amount) AS min_charge, MAX(amount) AS max_charge FROM charges;",
            "solutionQuery": "SELECT MIN(amount) AS min_charge, MAX(amount) AS max_charge FROM charges;",
            "hint": "Use MIN and MAX.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Finding Minimum and Maximum Values",
              "whyItMatters": "Use MIN and MAX to identify extremes.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_038",
            "title": "Grouping Data with GROUP BY",
            "objective": "Summarize data at department, payer, or provider level.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
            "solutionQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
            "hint": "Group by department and count rows.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Grouping Data with GROUP BY",
              "whyItMatters": "Summarize data at department, payer, or provider level.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_039",
            "title": "Filtering Aggregated Results with HAVING",
            "objective": "Apply post-aggregation filtering.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department HAVING COUNT(*) > 5;",
            "solutionQuery": "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department HAVING COUNT(*) > 5;",
            "hint": "Use HAVING after GROUP BY.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Filtering Aggregated Results with HAVING",
              "whyItMatters": "Apply post-aggregation filtering.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_040",
            "title": "Counting Distinct Values",
            "objective": "Avoid duplicate counts in healthcare reporting.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT DISTINCT insurance_type FROM patients;",
            "solutionQuery": "SELECT DISTINCT insurance_type FROM patients;",
            "hint": "Use DISTINCT on insurance_type.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Counting Distinct Values",
              "whyItMatters": "Avoid duplicate counts in healthcare reporting.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_041",
            "title": "Multi-Level Aggregations",
            "objective": "Build layered summaries for executive reporting.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT facility, department, COUNT(*) AS encounter_count FROM encounters GROUP BY facility, department;",
            "solutionQuery": "SELECT facility, department, COUNT(*) AS encounter_count FROM encounters GROUP BY facility, department;",
            "hint": "Group by more than one field.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Multi-Level Aggregations",
              "whyItMatters": "Build layered summaries for executive reporting.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_042",
            "title": "Aggregation Capstone: Department Utilization",
            "objective": "Apply grouping logic to utilization analysis.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Apply grouping logic to utilization analysis.",
            "prompt": "Explain how you would approach 'Aggregation Capstone: Department Utilization' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Aggregation Capstone: Department Utilization",
              "whyItMatters": "Apply grouping logic to utilization analysis.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "joining_multiple_tables",
        "title": "Joining Multiple Tables",
        "order": 2,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_043",
            "title": "Understanding Table Relationships",
            "objective": "Understand how patient, encounter, and provider tables relate.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Understand how patient, encounter, and provider tables relate.",
            "bullets": [
              "Understanding Table Relationships is part of the Joining Multiple Tables module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, understanding table relationships supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Understanding Table Relationships",
              "whyItMatters": "Understand how patient, encounter, and provider tables relate.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_044",
            "title": "INNER JOIN for Matching Records",
            "objective": "Join records that match across tables.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients",
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT e.encounter_id, p.first_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
            "solutionQuery": "SELECT e.encounter_id, p.first_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
            "hint": "Join encounters to patients on patient_id.",
            "executiveTakeaway": {
              "show": true,
              "metric": "INNER JOIN for Matching Records",
              "whyItMatters": "Join records that match across tables.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_045",
            "title": "LEFT JOIN for Retaining Unmatched Records",
            "objective": "Preserve base table rows when data is missing.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients",
              "claims"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT p.patient_id, c.claim_id FROM patients p LEFT JOIN claims c ON p.patient_id = c.patient_id;",
            "solutionQuery": "SELECT p.patient_id, c.claim_id FROM patients p LEFT JOIN claims c ON p.patient_id = c.patient_id;",
            "hint": "Use LEFT JOIN to retain all patients.",
            "executiveTakeaway": {
              "show": true,
              "metric": "LEFT JOIN for Retaining Unmatched Records",
              "whyItMatters": "Preserve base table rows when data is missing.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_046",
            "title": "RIGHT and FULL OUTER JOINs",
            "objective": "Recognize broader join behavior and when to use it.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Recognize broader join behavior and when to use it.",
            "bullets": [
              "RIGHT and FULL OUTER JOINs is part of the Joining Multiple Tables module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, right and full outer joins supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "RIGHT and FULL OUTER JOINs",
              "whyItMatters": "Recognize broader join behavior and when to use it.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_047",
            "title": "Joining Multiple Tables in a Single Query",
            "objective": "Connect patients, encounters, providers, and departments.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients",
              "providers",
              "departments",
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT e.encounter_id, p.first_name, pr.provider_name, d.department_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id JOIN providers pr ON e.provider_id = pr.provider_id JOIN departments d ON e.department_id = d.department_id;",
            "solutionQuery": "SELECT e.encounter_id, p.first_name, pr.provider_name, d.department_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id JOIN providers pr ON e.provider_id = pr.provider_id JOIN departments d ON e.department_id = d.department_id;",
            "hint": "Join all requested tables.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Joining Multiple Tables in a Single Query",
              "whyItMatters": "Connect patients, encounters, providers, and departments.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_048",
            "title": "Self Joins in Healthcare Data",
            "objective": "Use a table more than once in a query.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "providers"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT a.provider_id, a.provider_name, b.provider_name AS peer_name FROM providers a JOIN providers b ON a.facility = b.facility AND a.provider_id <> b.provider_id LIMIT 10;",
            "solutionQuery": "SELECT a.provider_id, a.provider_name, b.provider_name AS peer_name FROM providers a JOIN providers b ON a.facility = b.facility AND a.provider_id <> b.provider_id LIMIT 10;",
            "hint": "Join providers to themselves by facility.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Self Joins in Healthcare Data",
              "whyItMatters": "Use a table more than once in a query.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_049",
            "title": "Join Capstone: Patient Encounter Summary",
            "objective": "Summarize encounter activity across tables.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Summarize encounter activity across tables.",
            "prompt": "Explain how you would approach 'Join Capstone: Patient Encounter Summary' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Join Capstone: Patient Encounter Summary",
              "whyItMatters": "Summarize encounter activity across tables.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "subqueries_and_ctes",
        "title": "Subqueries and CTEs",
        "order": 3,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_050",
            "title": "Introduction to Subqueries",
            "objective": "Understand nested query patterns.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Understand nested query patterns.",
            "bullets": [
              "Introduction to Subqueries is part of the Subqueries and CTEs module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, introduction to subqueries supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Introduction to Subqueries",
              "whyItMatters": "Understand nested query patterns.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_051",
            "title": "Subqueries in the WHERE Clause",
            "objective": "Use subqueries to filter results dynamically.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients",
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM encounters WHERE patient_id IN (SELECT patient_id FROM patients WHERE insurance_type = 'Medicare');",
            "solutionQuery": "SELECT * FROM encounters WHERE patient_id IN (SELECT patient_id FROM patients WHERE insurance_type = 'Medicare');",
            "hint": "Use a subquery inside WHERE.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Subqueries in the WHERE Clause",
              "whyItMatters": "Use subqueries to filter results dynamically.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_052",
            "title": "Correlated Subqueries",
            "objective": "Understand row-dependent nested queries.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients",
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT p.patient_id, p.first_name FROM patients p WHERE EXISTS (SELECT 1 FROM encounters e WHERE e.patient_id = p.patient_id);",
            "solutionQuery": "SELECT p.patient_id, p.first_name FROM patients p WHERE EXISTS (SELECT 1 FROM encounters e WHERE e.patient_id = p.patient_id);",
            "hint": "Use EXISTS in a correlated subquery.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Correlated Subqueries",
              "whyItMatters": "Understand row-dependent nested queries.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_053",
            "title": "Introduction to Common Table Expressions",
            "objective": "Use CTEs to make complex SQL readable.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "WITH encounter_counts AS (SELECT patient_id, COUNT(*) AS cnt FROM encounters GROUP BY patient_id) SELECT * FROM encounter_counts;",
            "solutionQuery": "WITH encounter_counts AS (SELECT patient_id, COUNT(*) AS cnt FROM encounters GROUP BY patient_id) SELECT * FROM encounter_counts;",
            "hint": "Start with WITH and select from the CTE.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Introduction to Common Table Expressions",
              "whyItMatters": "Use CTEs to make complex SQL readable.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_054",
            "title": "Recursive CTEs",
            "objective": "Recognize recursive patterns for hierarchical data.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Recognize recursive patterns for hierarchical data.",
            "bullets": [
              "Recursive CTEs is part of the Subqueries and CTEs module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, recursive ctes supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Recursive CTEs",
              "whyItMatters": "Recognize recursive patterns for hierarchical data.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_055",
            "title": "Refactoring Queries Using CTEs",
            "objective": "Rewrite complex logic into structured steps.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "WITH denied AS (SELECT payer, billed_amount FROM claims WHERE claim_status = 'Denied') SELECT payer, SUM(billed_amount) AS denied_dollars FROM denied GROUP BY payer;",
            "solutionQuery": "WITH denied AS (SELECT payer, billed_amount FROM claims WHERE claim_status = 'Denied') SELECT payer, SUM(billed_amount) AS denied_dollars FROM denied GROUP BY payer;",
            "hint": "Use a CTE to simplify logic.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Refactoring Queries Using CTEs",
              "whyItMatters": "Rewrite complex logic into structured steps.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_056",
            "title": "CTE Capstone: Readmission Identification",
            "objective": "Apply CTE logic to a hospital workflow problem.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Apply CTE logic to a hospital workflow problem.",
            "prompt": "Explain how you would approach 'CTE Capstone: Readmission Identification' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "CTE Capstone: Readmission Identification",
              "whyItMatters": "Apply CTE logic to a hospital workflow problem.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "window_functions",
        "title": "Window Functions",
        "order": 4,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_057",
            "title": "Introduction to Window Functions",
            "objective": "Understand analytic calculations across result sets.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Understand analytic calculations across result sets.",
            "bullets": [
              "Introduction to Window Functions is part of the Window Functions module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, introduction to window functions supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Introduction to Window Functions",
              "whyItMatters": "Understand analytic calculations across result sets.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_058",
            "title": "ROW_NUMBER for Sequential Ranking",
            "objective": "Assign row order within groups.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT encounter_id, patient_id, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY admit_date) AS rn FROM encounters;",
            "solutionQuery": "SELECT encounter_id, patient_id, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY admit_date) AS rn FROM encounters;",
            "hint": "Use ROW_NUMBER with OVER.",
            "executiveTakeaway": {
              "show": true,
              "metric": "ROW_NUMBER for Sequential Ranking",
              "whyItMatters": "Assign row order within groups.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_059",
            "title": "RANK and DENSE_RANK",
            "objective": "Compare ranking methods for operational metrics.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT provider_id, COUNT(*) AS encounter_count, RANK() OVER (ORDER BY COUNT(*) DESC) AS provider_rank FROM encounters GROUP BY provider_id;",
            "solutionQuery": "SELECT provider_id, COUNT(*) AS encounter_count, RANK() OVER (ORDER BY COUNT(*) DESC) AS provider_rank FROM encounters GROUP BY provider_id;",
            "hint": "Rank providers by volume.",
            "executiveTakeaway": {
              "show": true,
              "metric": "RANK and DENSE_RANK",
              "whyItMatters": "Compare ranking methods for operational metrics.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_060",
            "title": "Running Totals with SUM OVER",
            "objective": "Build cumulative views of performance.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT admit_date, COUNT(*) AS daily_encounters, SUM(COUNT(*)) OVER (ORDER BY admit_date) AS running_total FROM encounters GROUP BY admit_date ORDER BY admit_date;",
            "solutionQuery": "SELECT admit_date, COUNT(*) AS daily_encounters, SUM(COUNT(*)) OVER (ORDER BY admit_date) AS running_total FROM encounters GROUP BY admit_date ORDER BY admit_date;",
            "hint": "Build a running total.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Running Totals with SUM OVER",
              "whyItMatters": "Build cumulative views of performance.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_061",
            "title": "Partitioning Data with PARTITION BY",
            "objective": "Restart calculations across groups.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT patient_id, encounter_id, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY admit_date DESC) AS recent_rank FROM encounters;",
            "solutionQuery": "SELECT patient_id, encounter_id, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY admit_date DESC) AS recent_rank FROM encounters;",
            "hint": "Use PARTITION BY patient_id.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Partitioning Data with PARTITION BY",
              "whyItMatters": "Restart calculations across groups.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_062",
            "title": "LAG and LEAD for Temporal Analysis",
            "objective": "Compare events across time.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT patient_id, admit_date, LAG(admit_date) OVER (PARTITION BY patient_id ORDER BY admit_date) AS prior_admit FROM encounters;",
            "solutionQuery": "SELECT patient_id, admit_date, LAG(admit_date) OVER (PARTITION BY patient_id ORDER BY admit_date) AS prior_admit FROM encounters;",
            "hint": "Use LAG across ordered encounters.",
            "executiveTakeaway": {
              "show": true,
              "metric": "LAG and LEAD for Temporal Analysis",
              "whyItMatters": "Compare events across time.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_063",
            "title": "Window Function Capstone: Patient Visit Trends",
            "objective": "Analyze trends with analytic functions.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Analyze trends with analytic functions.",
            "prompt": "Explain how you would approach 'Window Function Capstone: Patient Visit Trends' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Window Function Capstone: Patient Visit Trends",
              "whyItMatters": "Analyze trends with analytic functions.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "data_manipulation_and_management",
        "title": "Data Manipulation and Management",
        "order": 5,
        "lessons": [
          {
            "kind": "challenge",
            "id": "l_064",
            "title": "INSERT Statements",
            "objective": "Add new rows to a table.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "providers"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "INSERT INTO providers (provider_id, provider_name, specialty, facility) VALUES (999, 'Taylor Example', 'General Medicine', 'Main Campus');",
            "solutionQuery": "INSERT INTO providers (provider_id, provider_name, specialty, facility) VALUES (999, 'Taylor Example', 'General Medicine', 'Main Campus');",
            "hint": "Insert a new provider row.",
            "executiveTakeaway": {
              "show": true,
              "metric": "INSERT Statements",
              "whyItMatters": "Add new rows to a table.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_065",
            "title": "UPDATE Statements",
            "objective": "Modify existing records safely.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "providers"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "UPDATE providers SET facility = 'North Campus' WHERE provider_id = 1;",
            "solutionQuery": "UPDATE providers SET facility = 'North Campus' WHERE provider_id = 1;",
            "hint": "Update one provider row.",
            "executiveTakeaway": {
              "show": true,
              "metric": "UPDATE Statements",
              "whyItMatters": "Modify existing records safely.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_066",
            "title": "DELETE Statements",
            "objective": "Remove records with precise criteria.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "providers"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "DELETE FROM providers WHERE provider_id = 999;",
            "solutionQuery": "DELETE FROM providers WHERE provider_id = 999;",
            "hint": "Delete the example provider row.",
            "executiveTakeaway": {
              "show": true,
              "metric": "DELETE Statements",
              "whyItMatters": "Remove records with precise criteria.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_067",
            "title": "Creating Tables with CREATE TABLE",
            "objective": "Define new storage structures.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "sandbox_notes"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "CREATE TABLE sandbox_notes (note_id INTEGER, note_text TEXT);",
            "solutionQuery": "CREATE TABLE sandbox_notes (note_id INTEGER, note_text TEXT);",
            "hint": "Use CREATE TABLE with two columns.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Creating Tables with CREATE TABLE",
              "whyItMatters": "Define new storage structures.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_068",
            "title": "Modifying Tables with ALTER TABLE",
            "objective": "Change a table without recreating it.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "sandbox_notes"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "ALTER TABLE sandbox_notes ADD COLUMN created_by TEXT;",
            "solutionQuery": "ALTER TABLE sandbox_notes ADD COLUMN created_by TEXT;",
            "hint": "Use ALTER TABLE ADD COLUMN.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Modifying Tables with ALTER TABLE",
              "whyItMatters": "Change a table without recreating it.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_069",
            "title": "Dropping Objects with DROP",
            "objective": "Recognize destructive statements and when not to use them.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Recognize destructive statements and when not to use them.",
            "bullets": [
              "Dropping Objects with DROP is part of the Data Manipulation and Management module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, dropping objects with drop supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Dropping Objects with DROP",
              "whyItMatters": "Recognize destructive statements and when not to use them.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_070",
            "title": "CRUD Capstone: Maintaining Provider Records",
            "objective": "Apply data management statements in context.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Apply data management statements in context.",
            "prompt": "Explain how you would approach 'CRUD Capstone: Maintaining Provider Records' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "CRUD Capstone: Maintaining Provider Records",
              "whyItMatters": "Apply data management statements in context.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      }
    ]
  },
  {
    "id": "track_applied",
    "title": "Applied",
    "description": "Applied learning path for CareOps hospital analytics.",
    "order": 3,
    "categories": [
      {
        "id": "healthcare_operational_analytics",
        "title": "Healthcare Operational Analytics",
        "order": 1,
        "lessons": [
          {
            "kind": "challenge",
            "id": "l_071",
            "title": "Calculating Average Length of Stay",
            "objective": "Measure average LOS using encounter data.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT AVG(length_of_stay) AS avg_los FROM encounters;",
            "solutionQuery": "SELECT AVG(length_of_stay) AS avg_los FROM encounters;",
            "hint": "Average the length_of_stay field.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Calculating Average Length of Stay",
              "whyItMatters": "Measure average LOS using encounter data.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_072",
            "title": "Emergency Department Throughput Analysis",
            "objective": "Analyze wait and throughput times.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "charges",
              "discharges"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT facility, AVG(discharge_order_minutes) AS avg_order_to_discharge FROM discharges GROUP BY facility;",
            "solutionQuery": "SELECT facility, AVG(discharge_order_minutes) AS avg_order_to_discharge FROM discharges GROUP BY facility;",
            "hint": "Use discharges for throughput timing.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Emergency Department Throughput Analysis",
              "whyItMatters": "Analyze wait and throughput times.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_073",
            "title": "Bed Utilization and Capacity Metrics",
            "objective": "Evaluate how beds are being used.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT facility, COUNT(*) AS active_encounters FROM encounters GROUP BY facility;",
            "solutionQuery": "SELECT facility, COUNT(*) AS active_encounters FROM encounters GROUP BY facility;",
            "hint": "Summarize active encounter volume by facility.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Bed Utilization and Capacity Metrics",
              "whyItMatters": "Evaluate how beds are being used.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_074",
            "title": "Observation vs. Inpatient Conversion Rates",
            "objective": "Calculate conversion and escalation rates.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "observations"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT facility, AVG(CASE WHEN converted_to_inpatient = 1 THEN 1.0 ELSE 0 END) AS conversion_rate FROM observations GROUP BY facility;",
            "solutionQuery": "SELECT facility, AVG(CASE WHEN converted_to_inpatient = 1 THEN 1.0 ELSE 0 END) AS conversion_rate FROM observations GROUP BY facility;",
            "hint": "Calculate observation conversion rate.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Observation vs. Inpatient Conversion Rates",
              "whyItMatters": "Calculate conversion and escalation rates.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_075",
            "title": "Provider Productivity and Visit Volumes",
            "objective": "Measure provider activity and volume.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT provider_id, COUNT(*) AS encounter_count FROM encounters GROUP BY provider_id ORDER BY encounter_count DESC;",
            "solutionQuery": "SELECT provider_id, COUNT(*) AS encounter_count FROM encounters GROUP BY provider_id ORDER BY encounter_count DESC;",
            "hint": "Count encounters by provider.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Provider Productivity and Visit Volumes",
              "whyItMatters": "Measure provider activity and volume.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_076",
            "title": "Patient No-Show Rate Analysis",
            "objective": "Quantify access leakage from no-shows.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "appointments"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT department, AVG(CASE WHEN status = 'No Show' THEN 1.0 ELSE 0 END) AS no_show_rate FROM appointments GROUP BY department;",
            "solutionQuery": "SELECT department, AVG(CASE WHEN status = 'No Show' THEN 1.0 ELSE 0 END) AS no_show_rate FROM appointments GROUP BY department;",
            "hint": "Calculate no-show rate from appointments.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Patient No-Show Rate Analysis",
              "whyItMatters": "Quantify access leakage from no-shows.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_077",
            "title": "Operational Analytics Capstone",
            "objective": "Tie operational metrics together in one story.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Tie operational metrics together in one story.",
            "prompt": "Explain how you would approach 'Operational Analytics Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Operational Analytics Capstone",
              "whyItMatters": "Tie operational metrics together in one story.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "revenue_cycle_analytics",
        "title": "Revenue Cycle Analytics",
        "order": 2,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_078",
            "title": "Charges, Claims, and Payments Overview",
            "objective": "Understand the main revenue cycle entities.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Understand the main revenue cycle entities.",
            "bullets": [
              "Charges, Claims, and Payments Overview is part of the Revenue Cycle Analytics module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, charges, claims, and payments overview supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Charges, Claims, and Payments Overview",
              "whyItMatters": "Understand the main revenue cycle entities.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_079",
            "title": "Payer Mix Analysis",
            "objective": "Quantify the distribution of payer types.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT payer, COUNT(*) AS claim_count FROM claims GROUP BY payer ORDER BY claim_count DESC;",
            "solutionQuery": "SELECT payer, COUNT(*) AS claim_count FROM claims GROUP BY payer ORDER BY claim_count DESC;",
            "hint": "Group claims by payer.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Payer Mix Analysis",
              "whyItMatters": "Quantify the distribution of payer types.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_080",
            "title": "Denial Rate Calculations",
            "objective": "Measure denial volume and rate.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT AVG(CASE WHEN claim_status = 'Denied' THEN 1.0 ELSE 0 END) AS denial_rate FROM claims;",
            "solutionQuery": "SELECT AVG(CASE WHEN claim_status = 'Denied' THEN 1.0 ELSE 0 END) AS denial_rate FROM claims;",
            "hint": "Calculate a denial rate from claims.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Denial Rate Calculations",
              "whyItMatters": "Measure denial volume and rate.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_081",
            "title": "Days in Accounts Receivable",
            "objective": "Estimate aging and revenue velocity.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT AVG(julianday('2026-01-31') - julianday(admit_date)) AS avg_days_open FROM encounters;",
            "solutionQuery": "SELECT AVG(julianday('2026-01-31') - julianday(admit_date)) AS avg_days_open FROM encounters;",
            "hint": "Use dates to estimate aging.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Days in Accounts Receivable",
              "whyItMatters": "Estimate aging and revenue velocity.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_082",
            "title": "Net vs. Gross Revenue",
            "objective": "Separate booked revenue from collected value.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT SUM(amount) AS gross_charges, SUM(amount) * 0.82 AS estimated_net_revenue FROM charges;",
            "solutionQuery": "SELECT SUM(amount) AS gross_charges, SUM(amount) * 0.82 AS estimated_net_revenue FROM charges;",
            "hint": "Compare gross to estimated net.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Net vs. Gross Revenue",
              "whyItMatters": "Separate booked revenue from collected value.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_083",
            "title": "Contractual Adjustments and Write-Offs",
            "objective": "Recognize the impact of reimbursement rules.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT payer, SUM(billed_amount) * 0.1 AS estimated_adjustments FROM claims GROUP BY payer;",
            "solutionQuery": "SELECT payer, SUM(billed_amount) * 0.1 AS estimated_adjustments FROM claims GROUP BY payer;",
            "hint": "Estimate adjustments by payer.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Contractual Adjustments and Write-Offs",
              "whyItMatters": "Recognize the impact of reimbursement rules.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_084",
            "title": "Revenue Cycle Capstone",
            "objective": "Summarize financial performance drivers.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Summarize financial performance drivers.",
            "prompt": "Explain how you would approach 'Revenue Cycle Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Revenue Cycle Capstone",
              "whyItMatters": "Summarize financial performance drivers.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "quality_and_clinical_metrics",
        "title": "Quality and Clinical Metrics",
        "order": 3,
        "lessons": [
          {
            "kind": "challenge",
            "id": "l_085",
            "title": "30-Day Readmission Rates",
            "objective": "Calculate readmission performance accurately.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "readmissions"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT AVG(CASE WHEN readmit_within_30_days = 1 THEN 1.0 ELSE 0 END) AS readmission_rate FROM readmissions;",
            "solutionQuery": "SELECT AVG(CASE WHEN readmit_within_30_days = 1 THEN 1.0 ELSE 0 END) AS readmission_rate FROM readmissions;",
            "hint": "Calculate average readmission rate.",
            "executiveTakeaway": {
              "show": true,
              "metric": "30-Day Readmission Rates",
              "whyItMatters": "Calculate readmission performance accurately.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_086",
            "title": "Mortality and Complication Indicators",
            "objective": "Recognize quality and safety metrics.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Recognize quality and safety metrics.",
            "bullets": [
              "Mortality and Complication Indicators is part of the Quality and Clinical Metrics module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, mortality and complication indicators supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Mortality and Complication Indicators",
              "whyItMatters": "Recognize quality and safety metrics.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_087",
            "title": "Chronic Disease Cohort Identification",
            "objective": "Define cohorts for analytics.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT patient_id, risk_score FROM patients WHERE risk_score >= 8;",
            "solutionQuery": "SELECT patient_id, risk_score FROM patients WHERE risk_score >= 8;",
            "hint": "Use risk_score to define a high-risk cohort.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Chronic Disease Cohort Identification",
              "whyItMatters": "Define cohorts for analytics.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_088",
            "title": "Preventive Care Compliance",
            "objective": "Track compliance with expected care steps.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT insurance_type, AVG(CASE WHEN risk_score <= 5 THEN 1.0 ELSE 0 END) AS estimated_compliance_rate FROM patients GROUP BY insurance_type;",
            "solutionQuery": "SELECT insurance_type, AVG(CASE WHEN risk_score <= 5 THEN 1.0 ELSE 0 END) AS estimated_compliance_rate FROM patients GROUP BY insurance_type;",
            "hint": "Create a simple compliance estimate by group.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Preventive Care Compliance",
              "whyItMatters": "Track compliance with expected care steps.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_089",
            "title": "Risk Stratification Using SQL",
            "objective": "Segment populations by risk.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT CASE WHEN risk_score >= 8 THEN 'High' WHEN risk_score >= 5 THEN 'Moderate' ELSE 'Low' END AS risk_band, COUNT(*) AS patient_count FROM patients GROUP BY risk_band;",
            "solutionQuery": "SELECT CASE WHEN risk_score >= 8 THEN 'High' WHEN risk_score >= 5 THEN 'Moderate' ELSE 'Low' END AS risk_band, COUNT(*) AS patient_count FROM patients GROUP BY risk_band;",
            "hint": "Stratify by risk_score using CASE.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Risk Stratification Using SQL",
              "whyItMatters": "Segment populations by risk.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_090",
            "title": "Clinical Outcome Trend Analysis",
            "objective": "Evaluate outcomes over time.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT admit_date, AVG(length_of_stay) AS avg_los FROM encounters GROUP BY admit_date ORDER BY admit_date;",
            "solutionQuery": "SELECT admit_date, AVG(length_of_stay) AS avg_los FROM encounters GROUP BY admit_date ORDER BY admit_date;",
            "hint": "Trend LOS by date.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Clinical Outcome Trend Analysis",
              "whyItMatters": "Evaluate outcomes over time.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_091",
            "title": "Quality Metrics Capstone",
            "objective": "Translate clinical metrics into action.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Translate clinical metrics into action.",
            "prompt": "Explain how you would approach 'Quality Metrics Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Quality Metrics Capstone",
              "whyItMatters": "Translate clinical metrics into action.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "dimensional_modeling_for_analytics",
        "title": "Dimensional Modeling for Analytics",
        "order": 4,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_092",
            "title": "Introduction to Data Warehousing Concepts",
            "objective": "Understand analytic storage models.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Understand analytic storage models.",
            "bullets": [
              "Introduction to Data Warehousing Concepts is part of the Dimensional Modeling for Analytics module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, introduction to data warehousing concepts supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Introduction to Data Warehousing Concepts",
              "whyItMatters": "Understand analytic storage models.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_093",
            "title": "Fact and Dimension Tables",
            "objective": "Differentiate measures from descriptors.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Differentiate measures from descriptors.",
            "bullets": [
              "Fact and Dimension Tables is part of the Dimensional Modeling for Analytics module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, fact and dimension tables supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Fact and Dimension Tables",
              "whyItMatters": "Differentiate measures from descriptors.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_094",
            "title": "Star and Snowflake Schemas",
            "objective": "Compare common warehouse patterns.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Compare common warehouse patterns.",
            "bullets": [
              "Star and Snowflake Schemas is part of the Dimensional Modeling for Analytics module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, star and snowflake schemas supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Star and Snowflake Schemas",
              "whyItMatters": "Compare common warehouse patterns.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_095",
            "title": "Building a Healthcare Fact Table",
            "objective": "Design a fact table for encounters or claims.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Design a fact table for encounters or claims.",
            "prompt": "Explain how you would approach 'Building a Healthcare Fact Table' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Building a Healthcare Fact Table",
              "whyItMatters": "Design a fact table for encounters or claims.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_096",
            "title": "Slowly Changing Dimensions",
            "objective": "Handle historical attribute changes.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Handle historical attribute changes.",
            "bullets": [
              "Slowly Changing Dimensions is part of the Dimensional Modeling for Analytics module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, slowly changing dimensions supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Slowly Changing Dimensions",
              "whyItMatters": "Handle historical attribute changes.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_097",
            "title": "Designing an Analytical Data Mart",
            "objective": "Plan a focused reporting layer.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Plan a focused reporting layer.",
            "prompt": "Explain how you would approach 'Designing an Analytical Data Mart' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Designing an Analytical Data Mart",
              "whyItMatters": "Plan a focused reporting layer.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_098",
            "title": "Dimensional Modeling Capstone",
            "objective": "Apply warehouse thinking to a healthcare case.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Apply warehouse thinking to a healthcare case.",
            "prompt": "Explain how you would approach 'Dimensional Modeling Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Dimensional Modeling Capstone",
              "whyItMatters": "Apply warehouse thinking to a healthcare case.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "executive_communication_and_insights",
        "title": "Executive Communication and Insights",
        "order": 5,
        "lessons": [
          {
            "kind": "scenario",
            "id": "l_099",
            "title": "Translating SQL Results into Business Insights",
            "objective": "Move from data to action.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Move from data to action.",
            "prompt": "Explain how you would approach 'Translating SQL Results into Business Insights' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Translating SQL Results into Business Insights",
              "whyItMatters": "Move from data to action.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_100",
            "title": "Identifying Financial Risks and Opportunities",
            "objective": "Highlight what leadership should notice first.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Highlight what leadership should notice first.",
            "prompt": "Explain how you would approach 'Identifying Financial Risks and Opportunities' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Identifying Financial Risks and Opportunities",
              "whyItMatters": "Highlight what leadership should notice first.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_101",
            "title": "Writing Executive Summaries",
            "objective": "Summarize findings clearly for leaders.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Summarize findings clearly for leaders.",
            "prompt": "Explain how you would approach 'Writing Executive Summaries' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Writing Executive Summaries",
              "whyItMatters": "Summarize findings clearly for leaders.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_102",
            "title": "Storytelling with Data for Healthcare Leaders",
            "objective": "Structure insights to drive decisions.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Structure insights to drive decisions.",
            "prompt": "Explain how you would approach 'Storytelling with Data for Healthcare Leaders' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Storytelling with Data for Healthcare Leaders",
              "whyItMatters": "Structure insights to drive decisions.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_103",
            "title": "Designing Metrics for Executive Dashboards",
            "objective": "Select meaningful KPI definitions.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Select meaningful KPI definitions.",
            "prompt": "Explain how you would approach 'Designing Metrics for Executive Dashboards' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Designing Metrics for Executive Dashboards",
              "whyItMatters": "Select meaningful KPI definitions.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_104",
            "title": "Recommending Operational Improvements",
            "objective": "Tie findings to next-step actions.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Tie findings to next-step actions.",
            "prompt": "Explain how you would approach 'Recommending Operational Improvements' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Recommending Operational Improvements",
              "whyItMatters": "Tie findings to next-step actions.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_105",
            "title": "Executive Insight Capstone",
            "objective": "Deliver a concise executive-ready recommendation.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Deliver a concise executive-ready recommendation.",
            "prompt": "Explain how you would approach 'Executive Insight Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Executive Insight Capstone",
              "whyItMatters": "Deliver a concise executive-ready recommendation.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      }
    ]
  },
  {
    "id": "track_advanced",
    "title": "Advanced",
    "description": "Advanced learning path for CareOps hospital analytics.",
    "order": 4,
    "categories": [
      {
        "id": "query_optimization_and_performance",
        "title": "Query Optimization and Performance",
        "order": 1,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_106",
            "title": "Understanding Query Execution Plans",
            "objective": "See how the database interprets a query.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "See how the database interprets a query.",
            "bullets": [
              "Understanding Query Execution Plans is part of the Query Optimization and Performance module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, understanding query execution plans supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Understanding Query Execution Plans",
              "whyItMatters": "See how the database interprets a query.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_107",
            "title": "Indexing Strategies for Performance",
            "objective": "Use indexes to improve search speed.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Use indexes to improve search speed.",
            "bullets": [
              "Indexing Strategies for Performance is part of the Query Optimization and Performance module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, indexing strategies for performance supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Indexing Strategies for Performance",
              "whyItMatters": "Use indexes to improve search speed.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_108",
            "title": "Avoiding Common SQL Performance Pitfalls",
            "objective": "Recognize wasteful patterns.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Recognize wasteful patterns.",
            "prompt": "Explain how you would approach 'Avoiding Common SQL Performance Pitfalls' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Avoiding Common SQL Performance Pitfalls",
              "whyItMatters": "Recognize wasteful patterns.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_109",
            "title": "Table Partitioning Techniques",
            "objective": "Understand partitioning for large datasets.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Understand partitioning for large datasets.",
            "bullets": [
              "Table Partitioning Techniques is part of the Query Optimization and Performance module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, table partitioning techniques supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Table Partitioning Techniques",
              "whyItMatters": "Understand partitioning for large datasets.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_110",
            "title": "Materialized Views",
            "objective": "Use precomputed structures for faster reporting.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Use precomputed structures for faster reporting.",
            "bullets": [
              "Materialized Views is part of the Query Optimization and Performance module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, materialized views supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Materialized Views",
              "whyItMatters": "Use precomputed structures for faster reporting.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_111",
            "title": "Optimizing Joins and Aggregations",
            "objective": "Reduce cost in heavy analytical queries.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Reduce cost in heavy analytical queries.",
            "prompt": "Explain how you would approach 'Optimizing Joins and Aggregations' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Optimizing Joins and Aggregations",
              "whyItMatters": "Reduce cost in heavy analytical queries.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_112",
            "title": "Performance Optimization Capstone",
            "objective": "Improve a slow healthcare query.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Improve a slow healthcare query.",
            "prompt": "Explain how you would approach 'Performance Optimization Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Performance Optimization Capstone",
              "whyItMatters": "Improve a slow healthcare query.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "advanced_database_design",
        "title": "Advanced Database Design",
        "order": 2,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_113",
            "title": "Normalization",
            "objective": "Organize tables to reduce redundancy.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Organize tables to reduce redundancy.",
            "bullets": [
              "Normalization is part of the Advanced Database Design module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, normalization supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Normalization",
              "whyItMatters": "Organize tables to reduce redundancy.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_114",
            "title": "Denormalization for Analytics",
            "objective": "Trade purity for analytical usability when appropriate.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Trade purity for analytical usability when appropriate.",
            "bullets": [
              "Denormalization for Analytics is part of the Advanced Database Design module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, denormalization for analytics supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Denormalization for Analytics",
              "whyItMatters": "Trade purity for analytical usability when appropriate.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_115",
            "title": "Referential Integrity and Constraints",
            "objective": "Protect data integrity with rules.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Protect data integrity with rules.",
            "bullets": [
              "Referential Integrity and Constraints is part of the Advanced Database Design module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, referential integrity and constraints supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Referential Integrity and Constraints",
              "whyItMatters": "Protect data integrity with rules.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_116",
            "title": "Surrogate vs. Natural Keys",
            "objective": "Choose identifier strategies intentionally.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Choose identifier strategies intentionally.",
            "bullets": [
              "Surrogate vs. Natural Keys is part of the Advanced Database Design module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, surrogate vs. natural keys supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Surrogate vs. Natural Keys",
              "whyItMatters": "Choose identifier strategies intentionally.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_117",
            "title": "Data Governance and Metadata Management",
            "objective": "Document definitions and ownership.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Document definitions and ownership.",
            "prompt": "Explain how you would approach 'Data Governance and Metadata Management' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Data Governance and Metadata Management",
              "whyItMatters": "Document definitions and ownership.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_118",
            "title": "Managing Slowly Changing Dimensions",
            "objective": "Preserve history without breaking reports.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Preserve history without breaking reports.",
            "prompt": "Explain how you would approach 'Managing Slowly Changing Dimensions' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Managing Slowly Changing Dimensions",
              "whyItMatters": "Preserve history without breaking reports.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_119",
            "title": "Database Design Capstone",
            "objective": "Assess design quality for a reporting need.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Assess design quality for a reporting need.",
            "prompt": "Explain how you would approach 'Database Design Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Database Design Capstone",
              "whyItMatters": "Assess design quality for a reporting need.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "transactions_and_data_integrity",
        "title": "Transactions and Data Integrity",
        "order": 3,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_120",
            "title": "ACID Principles",
            "objective": "Understand transaction guarantees.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Understand transaction guarantees.",
            "bullets": [
              "ACID Principles is part of the Transactions and Data Integrity module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, acid principles supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "ACID Principles",
              "whyItMatters": "Understand transaction guarantees.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_121",
            "title": "Transaction Control",
            "objective": "Use BEGIN, COMMIT, and ROLLBACK appropriately.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM patients LIMIT 10;",
            "solutionQuery": "SELECT * FROM patients LIMIT 10;",
            "hint": "Run a simple valid query against the mock data.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Transaction Control",
              "whyItMatters": "Use BEGIN, COMMIT, and ROLLBACK appropriately.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_122",
            "title": "Isolation Levels and Concurrency",
            "objective": "Recognize how users affect one another.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Recognize how users affect one another.",
            "bullets": [
              "Isolation Levels and Concurrency is part of the Transactions and Data Integrity module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, isolation levels and concurrency supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Isolation Levels and Concurrency",
              "whyItMatters": "Recognize how users affect one another.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_123",
            "title": "Locking and Deadlocks",
            "objective": "Understand contention and recovery.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Understand contention and recovery.",
            "bullets": [
              "Locking and Deadlocks is part of the Transactions and Data Integrity module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, locking and deadlocks supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Locking and Deadlocks",
              "whyItMatters": "Understand contention and recovery.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_124",
            "title": "Error Handling in SQL",
            "objective": "Protect workflows from partial failure.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Protect workflows from partial failure.",
            "prompt": "Explain how you would approach 'Error Handling in SQL' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Error Handling in SQL",
              "whyItMatters": "Protect workflows from partial failure.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_125",
            "title": "Auditing and Change Tracking",
            "objective": "Track what changed and why.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Track what changed and why.",
            "prompt": "Explain how you would approach 'Auditing and Change Tracking' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Auditing and Change Tracking",
              "whyItMatters": "Track what changed and why.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_126",
            "title": "Transactions Capstone",
            "objective": "Apply integrity thinking to a sensitive workflow.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Apply integrity thinking to a sensitive workflow.",
            "prompt": "Explain how you would approach 'Transactions Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Transactions Capstone",
              "whyItMatters": "Apply integrity thinking to a sensitive workflow.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "data_governance_and_compliance",
        "title": "Data Governance and Compliance",
        "order": 4,
        "lessons": [
          {
            "kind": "concept",
            "id": "l_127",
            "title": "Introduction to HIPAA and PHI",
            "objective": "Recognize compliance boundaries.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Recognize compliance boundaries.",
            "bullets": [
              "Introduction to HIPAA and PHI is part of the Data Governance and Compliance module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, introduction to hipaa and phi supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Introduction to HIPAA and PHI",
              "whyItMatters": "Recognize compliance boundaries.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_128",
            "title": "De-identification and Data Masking",
            "objective": "Protect sensitive information in analytics.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM patients LIMIT 10;",
            "solutionQuery": "SELECT * FROM patients LIMIT 10;",
            "hint": "Run a simple valid query against the mock data.",
            "executiveTakeaway": {
              "show": true,
              "metric": "De-identification and Data Masking",
              "whyItMatters": "Protect sensitive information in analytics.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "concept",
            "id": "l_129",
            "title": "Role-Based Access Control",
            "objective": "Restrict data access intentionally.",
            "sql_focus": [
              "Concept"
            ],
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "No join required unless you choose to connect related data for context.",
            "summary": "Restrict data access intentionally.",
            "bullets": [
              "Role-Based Access Control is part of the Data Governance and Compliance module.",
              "Focus on how the concept changes measurement quality, business meaning, or query structure.",
              "Tie the concept back to real hospital analytics whenever possible."
            ],
            "example": "In CareOps, role-based access control supports clearer operational, financial, or quality analysis.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Role-Based Access Control",
              "whyItMatters": "Restrict data access intentionally.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_130",
            "title": "Data Stewardship and Ownership",
            "objective": "Assign accountability to key data assets.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Assign accountability to key data assets.",
            "prompt": "Explain how you would approach 'Data Stewardship and Ownership' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Data Stewardship and Ownership",
              "whyItMatters": "Assign accountability to key data assets.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_131",
            "title": "Data Lineage and Traceability",
            "objective": "Trace where a metric comes from.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Trace where a metric comes from.",
            "prompt": "Explain how you would approach 'Data Lineage and Traceability' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Data Lineage and Traceability",
              "whyItMatters": "Trace where a metric comes from.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_132",
            "title": "Ethical Use of Healthcare Data",
            "objective": "Recognize responsible analytical practice.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Recognize responsible analytical practice.",
            "prompt": "Explain how you would approach 'Ethical Use of Healthcare Data' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Ethical Use of Healthcare Data",
              "whyItMatters": "Recognize responsible analytical practice.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_133",
            "title": "Governance Capstone",
            "objective": "Evaluate a report for compliance and stewardship.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Evaluate a report for compliance and stewardship.",
            "prompt": "Explain how you would approach 'Governance Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Governance Capstone",
              "whyItMatters": "Evaluate a report for compliance and stewardship.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "advanced_analytical_techniques",
        "title": "Advanced Analytical Techniques",
        "order": 5,
        "lessons": [
          {
            "kind": "challenge",
            "id": "l_134",
            "title": "Cohort Analysis Using SQL",
            "objective": "Track populations through time.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM patients LIMIT 10;",
            "solutionQuery": "SELECT * FROM patients LIMIT 10;",
            "hint": "Run a simple valid query against the mock data.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Cohort Analysis Using SQL",
              "whyItMatters": "Track populations through time.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_135",
            "title": "Time-Series Analysis in Healthcare",
            "objective": "Examine trends by day, month, or quarter.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "patients"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT * FROM patients LIMIT 10;",
            "solutionQuery": "SELECT * FROM patients LIMIT 10;",
            "hint": "Run a simple valid query against the mock data.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Time-Series Analysis in Healthcare",
              "whyItMatters": "Examine trends by day, month, or quarter.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_136",
            "title": "Predictive Feature Engineering",
            "objective": "Prepare analytical inputs in SQL.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Prepare analytical inputs in SQL.",
            "prompt": "Explain how you would approach 'Predictive Feature Engineering' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Predictive Feature Engineering",
              "whyItMatters": "Prepare analytical inputs in SQL.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_137",
            "title": "Risk Scoring Models",
            "objective": "Support risk-based operational targeting.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Support risk-based operational targeting.",
            "prompt": "Explain how you would approach 'Risk Scoring Models' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Risk Scoring Models",
              "whyItMatters": "Support risk-based operational targeting.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_138",
            "title": "Integrating SQL with BI Tools",
            "objective": "Prepare output for visualization layers.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Prepare output for visualization layers.",
            "prompt": "Explain how you would approach 'Integrating SQL with BI Tools' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Integrating SQL with BI Tools",
              "whyItMatters": "Prepare output for visualization layers.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_139",
            "title": "Preparing Data for Machine Learning",
            "objective": "Shape reliable model-ready datasets.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Shape reliable model-ready datasets.",
            "prompt": "Explain how you would approach 'Preparing Data for Machine Learning' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Preparing Data for Machine Learning",
              "whyItMatters": "Shape reliable model-ready datasets.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_140",
            "title": "Advanced Analytics Capstone",
            "objective": "Combine analytical techniques for a strategic view.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Combine analytical techniques for a strategic view.",
            "prompt": "Explain how you would approach 'Advanced Analytics Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Advanced Analytics Capstone",
              "whyItMatters": "Combine analytical techniques for a strategic view.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      }
    ]
  },
  {
    "id": "track_expert",
    "title": "Expert",
    "description": "Expert learning path for CareOps hospital analytics.",
    "order": 5,
    "categories": [
      {
        "id": "strategic_healthcare_analytics",
        "title": "Strategic Healthcare Analytics",
        "order": 1,
        "lessons": [
          {
            "kind": "scenario",
            "id": "l_141",
            "title": "Population Health Management",
            "objective": "Use analytics to understand populations.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Use analytics to understand populations.",
            "prompt": "Explain how you would approach 'Population Health Management' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Population Health Management",
              "whyItMatters": "Use analytics to understand populations.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_142",
            "title": "Service Line Profitability",
            "objective": "Measure performance by service line.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "departments",
              "encounters",
              "charges"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT d.service_line, SUM(c.amount) AS total_charges FROM charges c JOIN encounters e ON c.encounter_id = e.encounter_id JOIN departments d ON e.department_id = d.department_id GROUP BY d.service_line ORDER BY total_charges DESC;",
            "solutionQuery": "SELECT d.service_line, SUM(c.amount) AS total_charges FROM charges c JOIN encounters e ON c.encounter_id = e.encounter_id JOIN departments d ON e.department_id = d.department_id GROUP BY d.service_line ORDER BY total_charges DESC;",
            "hint": "Use charges, encounters, and departments.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Service Line Profitability",
              "whyItMatters": "Measure performance by service line.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_143",
            "title": "Market Share and Growth Analysis",
            "objective": "Estimate organizational opportunity.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Estimate organizational opportunity.",
            "prompt": "Explain how you would approach 'Market Share and Growth Analysis' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Market Share and Growth Analysis",
              "whyItMatters": "Estimate organizational opportunity.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_144",
            "title": "Value-Based Care Metrics",
            "objective": "Align analytics to quality and cost incentives.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Align analytics to quality and cost incentives.",
            "prompt": "Explain how you would approach 'Value-Based Care Metrics' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Value-Based Care Metrics",
              "whyItMatters": "Align analytics to quality and cost incentives.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_145",
            "title": "Cost-of-Care Analysis",
            "objective": "Connect utilization and financial performance.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT facility, AVG(length_of_stay) * 1250 AS estimated_cost_of_care FROM encounters GROUP BY facility;",
            "solutionQuery": "SELECT facility, AVG(length_of_stay) * 1250 AS estimated_cost_of_care FROM encounters GROUP BY facility;",
            "hint": "Estimate cost of care by facility.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Cost-of-Care Analysis",
              "whyItMatters": "Connect utilization and financial performance.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_146",
            "title": "Strategic Planning with Data",
            "objective": "Support future planning with evidence.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Support future planning with evidence.",
            "prompt": "Explain how you would approach 'Strategic Planning with Data' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Strategic Planning with Data",
              "whyItMatters": "Support future planning with evidence.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_147",
            "title": "Strategic Analytics Capstone",
            "objective": "Develop an insight for strategic leadership.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Develop an insight for strategic leadership.",
            "prompt": "Explain how you would approach 'Strategic Analytics Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Strategic Analytics Capstone",
              "whyItMatters": "Develop an insight for strategic leadership.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "revenue_optimization_strategies",
        "title": "Revenue Optimization Strategies",
        "order": 2,
        "lessons": [
          {
            "kind": "challenge",
            "id": "l_148",
            "title": "Identifying Revenue Leakage",
            "objective": "Find where money is being lost.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "claims"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "solutionQuery": "SELECT payer, SUM(billed_amount) AS denied_dollars FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_dollars DESC;",
            "hint": "Summarize denied dollars by payer.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Identifying Revenue Leakage",
              "whyItMatters": "Find where money is being lost.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_149",
            "title": "Denial Prevention Strategies",
            "objective": "Move from denial measurement to prevention.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Move from denial measurement to prevention.",
            "prompt": "Explain how you would approach 'Denial Prevention Strategies' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Denial Prevention Strategies",
              "whyItMatters": "Move from denial measurement to prevention.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_150",
            "title": "Contract Modeling and Reimbursement",
            "objective": "Understand reimbursement scenarios analytically.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Understand reimbursement scenarios analytically.",
            "prompt": "Explain how you would approach 'Contract Modeling and Reimbursement' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Contract Modeling and Reimbursement",
              "whyItMatters": "Understand reimbursement scenarios analytically.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_151",
            "title": "Charge Capture Optimization",
            "objective": "Find missed or delayed charges.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "charges"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT encounter_id, COUNT(*) AS charge_count FROM charges GROUP BY encounter_id HAVING COUNT(*) < 2;",
            "solutionQuery": "SELECT encounter_id, COUNT(*) AS charge_count FROM charges GROUP BY encounter_id HAVING COUNT(*) < 2;",
            "hint": "Find encounters with low charge volume.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Charge Capture Optimization",
              "whyItMatters": "Find missed or delayed charges.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_152",
            "title": "Financial Impact of Coding Accuracy",
            "objective": "Connect coding quality to net revenue.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Connect coding quality to net revenue.",
            "prompt": "Explain how you would approach 'Financial Impact of Coding Accuracy' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Financial Impact of Coding Accuracy",
              "whyItMatters": "Connect coding quality to net revenue.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_153",
            "title": "Scenario Modeling for Revenue Growth",
            "objective": "Project impact under multiple futures.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Project impact under multiple futures.",
            "prompt": "Explain how you would approach 'Scenario Modeling for Revenue Growth' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Scenario Modeling for Revenue Growth",
              "whyItMatters": "Project impact under multiple futures.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_154",
            "title": "Revenue Optimization Capstone",
            "objective": "Deliver a revenue improvement recommendation.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Deliver a revenue improvement recommendation.",
            "prompt": "Explain how you would approach 'Revenue Optimization Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Revenue Optimization Capstone",
              "whyItMatters": "Deliver a revenue improvement recommendation.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "operational_performance_improvement",
        "title": "Operational Performance Improvement",
        "order": 3,
        "lessons": [
          {
            "kind": "scenario",
            "id": "l_155",
            "title": "Throughput and Capacity Optimization",
            "objective": "Use flow data to improve operations.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Use flow data to improve operations.",
            "prompt": "Explain how you would approach 'Throughput and Capacity Optimization' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Throughput and Capacity Optimization",
              "whyItMatters": "Use flow data to improve operations.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "challenge",
            "id": "l_156",
            "title": "Workforce Productivity Analysis",
            "objective": "Assess efficiency without losing context.",
            "sql_focus": [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "JOIN"
            ],
            "relevantTables": [
              "encounters"
            ],
            "joinHint": "Use the base table that matches the reporting grain, then join outward only when needed.",
            "starterQuery": "SELECT provider_id, COUNT(*) AS encounter_count FROM encounters GROUP BY provider_id ORDER BY encounter_count DESC;",
            "solutionQuery": "SELECT provider_id, COUNT(*) AS encounter_count FROM encounters GROUP BY provider_id ORDER BY encounter_count DESC;",
            "hint": "Summarize encounters per provider.",
            "executiveTakeaway": {
              "show": true,
              "metric": "Workforce Productivity Analysis",
              "whyItMatters": "Assess efficiency without losing context.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_157",
            "title": "Supply Chain Analytics",
            "objective": "Connect operations to resource availability.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Connect operations to resource availability.",
            "prompt": "Explain how you would approach 'Supply Chain Analytics' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Supply Chain Analytics",
              "whyItMatters": "Connect operations to resource availability.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_158",
            "title": "Scheduling Optimization",
            "objective": "Use analytics to improve appointment access.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Use analytics to improve appointment access.",
            "prompt": "Explain how you would approach 'Scheduling Optimization' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Scheduling Optimization",
              "whyItMatters": "Use analytics to improve appointment access.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_159",
            "title": "Benchmarking Against Industry Standards",
            "objective": "Compare internal performance to external targets.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Compare internal performance to external targets.",
            "prompt": "Explain how you would approach 'Benchmarking Against Industry Standards' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Benchmarking Against Industry Standards",
              "whyItMatters": "Compare internal performance to external targets.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_160",
            "title": "Continuous Performance Monitoring",
            "objective": "Design repeatable monitoring logic.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Design repeatable monitoring logic.",
            "prompt": "Explain how you would approach 'Continuous Performance Monitoring' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Continuous Performance Monitoring",
              "whyItMatters": "Design repeatable monitoring logic.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_161",
            "title": "Operational Improvement Capstone",
            "objective": "Recommend a measurable improvement plan.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Recommend a measurable improvement plan.",
            "prompt": "Explain how you would approach 'Operational Improvement Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Operational Improvement Capstone",
              "whyItMatters": "Recommend a measurable improvement plan.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "executive_decision_support",
        "title": "Executive Decision Support",
        "order": 4,
        "lessons": [
          {
            "kind": "scenario",
            "id": "l_162",
            "title": "Building Executive KPI Frameworks",
            "objective": "Define a leadership-facing KPI set.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Define a leadership-facing KPI set.",
            "prompt": "Explain how you would approach 'Building Executive KPI Frameworks' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Building Executive KPI Frameworks",
              "whyItMatters": "Define a leadership-facing KPI set.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_163",
            "title": "Designing CFO and CMO Dashboards",
            "objective": "Tailor views to executive priorities.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Tailor views to executive priorities.",
            "prompt": "Explain how you would approach 'Designing CFO and CMO Dashboards' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Designing CFO and CMO Dashboards",
              "whyItMatters": "Tailor views to executive priorities.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_164",
            "title": "Communicating Insights to Leadership",
            "objective": "Present findings with clarity and prioritization.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Present findings with clarity and prioritization.",
            "prompt": "Explain how you would approach 'Communicating Insights to Leadership' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Communicating Insights to Leadership",
              "whyItMatters": "Present findings with clarity and prioritization.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_165",
            "title": "Change Management Through Analytics",
            "objective": "Use data to support adoption and accountability.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Use data to support adoption and accountability.",
            "prompt": "Explain how you would approach 'Change Management Through Analytics' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Change Management Through Analytics",
              "whyItMatters": "Use data to support adoption and accountability.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_166",
            "title": "Data-Driven Strategic Recommendations",
            "objective": "Translate metrics into actions.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Translate metrics into actions.",
            "prompt": "Explain how you would approach 'Data-Driven Strategic Recommendations' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Data-Driven Strategic Recommendations",
              "whyItMatters": "Translate metrics into actions.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_167",
            "title": "Measuring ROI of Analytics Initiatives",
            "objective": "Quantify the value of analytics work.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Quantify the value of analytics work.",
            "prompt": "Explain how you would approach 'Measuring ROI of Analytics Initiatives' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Measuring ROI of Analytics Initiatives",
              "whyItMatters": "Quantify the value of analytics work.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_168",
            "title": "Executive Decision Support Capstone",
            "objective": "Create a concise decision-support package.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Create a concise decision-support package.",
            "prompt": "Explain how you would approach 'Executive Decision Support Capstone' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Executive Decision Support Capstone",
              "whyItMatters": "Create a concise decision-support package.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      },
      {
        "id": "careops_master_capstone",
        "title": "CareOps Master Capstone",
        "order": 5,
        "lessons": [
          {
            "kind": "scenario",
            "id": "l_169",
            "title": "Integrated Healthcare Data Scenario",
            "objective": "Work across multiple subject areas at once.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Work across multiple subject areas at once.",
            "prompt": "Explain how you would approach 'Integrated Healthcare Data Scenario' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Integrated Healthcare Data Scenario",
              "whyItMatters": "Work across multiple subject areas at once.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_170",
            "title": "Financial Diagnosis and Root Cause Analysis",
            "objective": "Find the cause behind a financial problem.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Find the cause behind a financial problem.",
            "prompt": "Explain how you would approach 'Financial Diagnosis and Root Cause Analysis' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Financial Diagnosis and Root Cause Analysis",
              "whyItMatters": "Find the cause behind a financial problem.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_171",
            "title": "Operational Improvement Strategy",
            "objective": "Recommend a change backed by data.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Recommend a change backed by data.",
            "prompt": "Explain how you would approach 'Operational Improvement Strategy' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Operational Improvement Strategy",
              "whyItMatters": "Recommend a change backed by data.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_172",
            "title": "Executive Summary and Presentation",
            "objective": "Package your findings for leadership.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Package your findings for leadership.",
            "prompt": "Explain how you would approach 'Executive Summary and Presentation' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Executive Summary and Presentation",
              "whyItMatters": "Package your findings for leadership.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_173",
            "title": "Building an End-to-End Analytical Solution",
            "objective": "Move from data question to deployable answer.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Move from data question to deployable answer.",
            "prompt": "Explain how you would approach 'Building an End-to-End Analytical Solution' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Building an End-to-End Analytical Solution",
              "whyItMatters": "Move from data question to deployable answer.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_174",
            "title": "Peer Review and Iteration",
            "objective": "Refine analysis through critique.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Refine analysis through critique.",
            "prompt": "Explain how you would approach 'Peer Review and Iteration' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Peer Review and Iteration",
              "whyItMatters": "Refine analysis through critique.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          },
          {
            "kind": "scenario",
            "id": "l_175",
            "title": "Final CareOps Certification Assessment",
            "objective": "Demonstrate readiness across the curriculum.",
            "relevantTables": [
              "patients",
              "encounters",
              "claims",
              "charges"
            ],
            "joinHint": "Think about the correct grain, the business audience, and the operational consequence.",
            "summary": "Demonstrate readiness across the curriculum.",
            "prompt": "Explain how you would approach 'Final CareOps Certification Assessment' in a CareOps hospital analytics context. Mention the likely data sources, the business interpretation, and one practical action.",
            "expectedKeywords": [
              "data",
              "insight",
              "action"
            ],
            "executiveTakeaway": {
              "show": true,
              "metric": "Final CareOps Certification Assessment",
              "whyItMatters": "Demonstrate readiness across the curriculum.",
              "whatToShare": "Summarize the most material insight, the likely driver, and the operational or financial impact.",
              "action": "Identify the next action leadership should consider based on the pattern in the data."
            }
          }
        ]
      }
    ]
  }
];

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      appState = {
        ...appState,
        ...parsed,
        lessonStats: parsed.lessonStats || {},
        completedLessonIds: parsed.completedLessonIds || [],
        firstTryLessonIds: parsed.firstTryLessonIds || []
      };
    }
  } catch (error) {
    console.error("Could not load progress:", error);
  }
}

function applySchemaPanelWidth() {
  const panel = document.getElementById("schema-panel");
  const shell = document.querySelector(".app-shell");
  if (!panel || !shell) return;
  const width = Math.max(260, Math.min(appState.schemaPanelWidth || 320, Math.floor(window.innerWidth * 0.55)));
  panel.style.width = `${width}px`;
  shell.style.gridTemplateColumns = `${width}px 14px 1fr`;
}

function initSchemaResizer() {
  const resizer = document.getElementById("schema-resizer");
  const shell = document.querySelector(".app-shell");
  if (!resizer || !shell) return;
  let dragging = false;
  resizer.addEventListener("mousedown", function () {
    dragging = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    document.body.classList.add("resizing-schema");
  });
  document.addEventListener("mousemove", function (event) {
    if (!dragging) return;
    const shellRect = shell.getBoundingClientRect();
    const nextWidth = event.clientX - shellRect.left;
    appState.schemaPanelWidth = Math.max(260, Math.min(nextWidth, Math.floor(window.innerWidth * 0.55)));
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

function conceptLesson(spec) {
  return {
    id: spec.id,
    type: "concept",
    title: spec.title,
    objective: spec.objective,
    sql_focus: spec.sql_focus || [],
    relevantTables: spec.relevantTables || [],
    joinHint: spec.joinHint || "No join required.",
    content: {
      summary: spec.summary || "",
      bullets: spec.bullets || [],
      example: spec.example || ""
    },
    executiveTakeaway: spec.executiveTakeaway || null
  };
}

function challengeLesson(spec) {
  return {
    id: spec.id,
    kind: "challenge",
    type: "challenge",
    title: spec.title,
    objective: spec.objective,
    sql_focus: spec.sql_focus || [],
    relevantTables: spec.relevantTables || [],
    joinHint: spec.joinHint || "Think carefully about the reporting grain and join path.",
    starterQuery: spec.starterQuery || "",
    solutionQuery: spec.solutionQuery || "",
    challengeCriteria: (spec.challengeCriteria || "").trim() || buildChallengePrompt(spec),
    hint: spec.hint || "",
    smartHint: spec.smartHint || spec.secondHint || "",
    secondHint: spec.secondHint || spec.smartHint || "",
    thirdHint: spec.thirdHint || "",
    explanation: spec.explanation || "",
    executiveTakeaway: spec.executiveTakeaway || null
  };
}

function scenarioLesson(spec) {
  return {
    id: spec.id,
    kind: "scenario",
    type: "scenario",
    title: spec.title,
    objective: spec.objective,
    sql_focus: [],
    relevantTables: spec.relevantTables || [],
    joinHint: spec.joinHint || "Think about data sources, grain, and business meaning.",
    content: {
      summary: spec.summary || "",
      prompt: spec.prompt || "",
      expectedKeywords: spec.expectedKeywords || [],
      minLength: spec.minLength || 100,
      minimumKeywordMatches: spec.minimumKeywordMatches || 2,
      feedbackGuide: spec.feedbackGuide || ""
    },
    executiveTakeaway: spec.executiveTakeaway || null
  };
}

function normalizeCurriculum() {
  curriculum.forEach(track => {
    track.categories.forEach(category => {
      category.lessons = category.lessons.map(lesson => {
        if (lesson.kind === "concept") return conceptLesson(lesson);
        if (lesson.kind === "challenge") return challengeLesson(lesson);
        return scenarioLesson(lesson);
      });
    });
  });
}

function getTrack() {
  return curriculum.find(track => track.id === appState.currentTrackId) || curriculum[0];
}

function getAllCategories() {
  return getTrack().categories || [];
}

function getCurrentCategory() {
  return getAllCategories().find(category => category.id === appState.currentCategoryId) || getAllCategories()[0] || null;
}

function getAllLessons() {
  return getAllCategories().flatMap(category => category.lessons);
}

function getCurrentLesson() {
  return getAllLessons().find(lesson => lesson.id === appState.currentLessonId) || null;
}

function totalLessonCount() {
  return getAllLessons().length;
}

function completedLessonCount() {
  return appState.completedLessonIds.length;
}

function isLessonCompleted(lessonId) {
  return appState.completedLessonIds.includes(lessonId);
}

function markLessonCompleted(lessonId, firstTry = false) {
  if (!isLessonCompleted(lessonId)) {
    appState.completedLessonIds.push(lessonId);
  }
  if (firstTry && !appState.firstTryLessonIds.includes(lessonId)) {
    appState.firstTryLessonIds.push(lessonId);
  }
  saveProgress();
}

function getLessonStats(lessonId) {
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

function tierRank(tier) {
  return {
    "Not Started": 0,
    "Developing": 1,
    "Passing": 2,
    "Strong": 3,
    "Perfect": 4
  }[tier] || 0;
}

function updateLessonStatsOnGrade(lessonId, gradeResult, passed) {
  const stats = getLessonStats(lessonId);
  stats.attempts += 1;
  stats.lastScore = gradeResult.score;
  stats.lastTier = gradeResult.tier;
  if (passed) stats.passes += 1;
  if (gradeResult.score > stats.bestScore) stats.bestScore = gradeResult.score;
  if (tierRank(gradeResult.tier) > tierRank(stats.bestTier)) stats.bestTier = gradeResult.tier;
  if (gradeResult.score >= 90 || gradeResult.tier === "Perfect") stats.mastered = true;
}

function masteryCount() {
  return Object.values(appState.lessonStats).filter(stat => stat && stat.mastered).length;
}

function categoryComplete(category) {
  return category.lessons.every(lesson => isLessonCompleted(lesson.id));
}

function categoryBadgeCount() {
  return getAllCategories().filter(categoryComplete).length;
}

function levelBadgeCount() {
  return LEARNING_LEVELS.filter(level => {
    const track = curriculum.find(item => item.id === level.trackId);
    return !!track && track.categories.every(categoryComplete);
  }).length;
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
    { label: "First Step", earned: completed >= 1, emoji: "🚀", description: "Unlock by completing your first lesson." },
    { label: "Getting the Hang of It", earned: completed >= 5, emoji: "📘", description: "Unlock by completing 5 lessons." },
    { label: "On a Roll", earned: completed >= 10, emoji: "🔥", description: "Unlock by completing 10 lessons." },
    { label: "Quarter Century", earned: completed >= 25, emoji: "🏅", description: "Unlock by completing 25 lessons." },
    { label: "Halfway Hero", earned: completed >= 50, emoji: "🥈", description: "Unlock by completing 50 lessons." },
    { label: "Century Club", earned: completed >= 100, emoji: "💯", description: "Unlock by completing 100 lessons." },
    { label: "First-Try Flash", earned: firstTry >= 3, emoji: "⚡", description: "Unlock by solving 3 challenge lessons correctly on the first try." },
    { label: "Precision Pro", earned: firstTry >= 10, emoji: "🎯", description: "Unlock by solving 10 challenge lessons correctly on the first try." },
    { label: "Mastermind", earned: mastered >= 5, emoji: "🧠", description: "Unlock by mastering 5 lessons." },
    { label: "Master of Masters", earned: mastered >= 25, emoji: "👑", description: "Unlock by mastering 25 lessons." },
    { label: "Join Genius", earned: catComplete("joining_multiple_tables"), emoji: "🔗", description: "Unlock by completing every lesson in Joining Multiple Tables." },
    { label: "Aggregate King", earned: catComplete("aggregations_and_grouping"), emoji: "👑", description: "Unlock by completing every lesson in Aggregations and Grouping." },
    { label: "Filter Fanatic", earned: catComplete("filtering_and_logical_conditions"), emoji: "🎯", description: "Unlock by completing every lesson in Filtering and Logical Conditions." },
    { label: "Grouping Guru", earned: catComplete("aggregations_and_grouping"), emoji: "📊", description: "Unlock by mastering grouped summaries and aggregate reporting in Aggregations and Grouping." },
    { label: "CASE Commander", earned: catComplete("data_types_and_expressions"), emoji: "🧩", description: "Unlock by completing every lesson in Data Types and Expressions." },
    { label: "Null Navigator", earned: catComplete("filtering_and_logical_conditions"), emoji: "🧭", description: "Unlock by completing the filtering module, including null-handling lessons." },
    { label: "Throughput Thinker", earned: catComplete("healthcare_operational_analytics"), emoji: "🏥", description: "Unlock by completing every lesson in Healthcare Operational Analytics." },
    { label: "Readmission Ranger", earned: catComplete("quality_and_clinical_metrics"), emoji: "🔁", description: "Unlock by completing every lesson in Quality and Clinical Metrics." },
    { label: "Financial Fixer", earned: catComplete("revenue_cycle_analytics"), emoji: "💰", description: "Unlock by completing every lesson in Revenue Cycle Analytics." },
    { label: "Executive Whisperer", earned: catComplete("executive_communication_and_insights"), emoji: "🗣️", description: "Unlock by completing every lesson in Executive Communication and Insights." }
  ];
}

let achievementTooltipEl = null;

function ensureAchievementTooltipStyles() {
  if (document.getElementById("achievement-tooltip-style")) return;
  const style = document.createElement("style");
  style.id = "achievement-tooltip-style";
  style.textContent = `
    .achievement-tooltip {
      position: fixed;
      z-index: 99999;
      max-width: 280px;
      background: rgba(15, 23, 42, 0.96);
      color: #ffffff;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 0.82rem;
      line-height: 1.35;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.25);
      pointer-events: none;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.12s ease, transform 0.12s ease;
      white-space: normal;
    }
    .achievement-tooltip.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .badge-chip {
      position: relative;
      cursor: help;
    }
  `;
  document.head.appendChild(style);
}

function ensureAchievementTooltip() {
  ensureAchievementTooltipStyles();
  if (achievementTooltipEl && document.body.contains(achievementTooltipEl)) return achievementTooltipEl;
  achievementTooltipEl = document.createElement("div");
  achievementTooltipEl.className = "achievement-tooltip";
  achievementTooltipEl.setAttribute("role", "tooltip");
  document.body.appendChild(achievementTooltipEl);
  return achievementTooltipEl;
}

function positionAchievementTooltip(event) {
  const tooltip = ensureAchievementTooltip();
  const offset = 14;
  const rect = tooltip.getBoundingClientRect();
  let left = event.clientX + offset;
  let top = event.clientY + offset;

  if (left + rect.width > window.innerWidth - 12) {
    left = Math.max(12, window.innerWidth - rect.width - 12);
  }
  if (top + rect.height > window.innerHeight - 12) {
    top = Math.max(12, event.clientY - rect.height - offset);
  }

  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

function showAchievementTooltip(event, text) {
  if (!text) return;
  const tooltip = ensureAchievementTooltip();
  tooltip.textContent = text;
  tooltip.classList.add("visible");
  positionAchievementTooltip(event);
}

function hideAchievementTooltip() {
  if (!achievementTooltipEl) return;
  achievementTooltipEl.classList.remove("visible");
}

function attachAchievementTooltip(node, text) {
  if (!node || !text) return;
  node.dataset.unlockDescription = text;
  node.addEventListener("mouseenter", event => showAchievementTooltip(event, text));
  node.addEventListener("mousemove", event => positionAchievementTooltip(event));
  node.addEventListener("mouseleave", hideAchievementTooltip);
  node.addEventListener("blur", hideAchievementTooltip);
  node.addEventListener("focus", event => showAchievementTooltip(event, text));
}

function renderAchievements() {
  const container = document.getElementById("badges-container");
  if (!container) return;

  ensureAchievementTooltipStyles();
  container.innerHTML = "";

  achievements().forEach((achievement) => {
    const chip = document.createElement("div");
    chip.className = achievement.earned ? "badge-chip" : "badge-chip locked";
    chip.innerText = `${achievement.emoji} ${achievement.label}`;
    chip.setAttribute("tabindex", "0");
    chip.setAttribute("aria-label", `${achievement.label}: ${achievement.description || ""}`);
    chip.dataset.unlockDescription = achievement.description || "";

    attachAchievementTooltip(chip, achievement.description || "");

    container.appendChild(chip);
  });
}

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
  if (progressText) progressText.innerText = `${completed} / ${total} lessons completed`;
  if (progressBar) progressBar.style.width = `${total ? (completed / total) * 100 : 0}%`;
  if (currentLevelDisplay) {
    const currentStats = current ? getLessonStats(current.id) : null;
    currentLevelDisplay.innerText = current ? `${current.title}${currentStats && currentStats.bestTier !== "Not Started" ? ` · ${currentStats.bestTier}` : ""}` : "No lesson selected";
  }
  if (badgeCount) {
    badgeCount.innerText = `${levelBadgeCount()} learning level badges earned · ${masteryCount()} mastered`;
  }
  if (trackTitle) trackTitle.innerText = track.title;
  if (trackDescription) trackDescription.innerText = "Curriculum, learning levels, completion, and mastery tracking.";
}

function renderSchema() {
  const tablesWrap = document.getElementById("schema-tables");
  const relationshipsWrap = document.getElementById("schema-relationships");

  const activeLesson = appState.currentView === "lesson" ? getCurrentLesson() : null;
  const relevantTables = new Set(
    (activeLesson?.relevantTables || []).map(name => String(name).toLowerCase())
  );

  if (tablesWrap) {
    tablesWrap.innerHTML = "";

    schema.tables.forEach(table => {
      const details = document.createElement("details");
      details.className = "schema-card";
      details.open =
        appState.currentView === "lesson" &&
        relevantTables.size > 0 &&
        relevantTables.has(String(table.name).toLowerCase());

      const summary = document.createElement("summary");
      summary.textContent = table.name;
      details.appendChild(summary);

      const p = document.createElement("p");
      p.innerHTML = `<strong>Description:</strong> ${table.description}<br><strong>Columns:</strong> ${table.notableColumns.join(", ")}`;
      details.appendChild(p);

      const actions = document.createElement("div");
      actions.className = "schema-table-actions";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "schema-table-view-btn";
      btn.textContent = "Open Table Viewer";
      btn.addEventListener("click", () => openTableModal(table.name));

      actions.appendChild(btn);
      details.appendChild(actions);
      tablesWrap.appendChild(details);
    });
  }

  if (relationshipsWrap) {
    relationshipsWrap.innerHTML = "";
    schema.relationships.forEach(item => {
      const div = document.createElement("div");
      div.className = "relationship-item";
      div.textContent = item;
      relationshipsWrap.appendChild(div);
    });
  }
}


function levelForTrack(trackId) {
  return LEARNING_LEVELS.find(level => level.trackId === trackId);
}

function shouldShowExecutiveTakeaway(lesson) {
  const levelKey = levelForTrack(appState.currentTrackId)?.key;
  return Boolean(
    lesson &&
    lesson.executiveTakeaway &&
    lesson.executiveTakeaway.show &&
    (
      lesson.executiveTakeaway.audience === "executive" ||
      ["applied", "advanced", "expert"].includes(levelKey)
    )
  );
}


function getVisibleCategories() {
  return getAllCategories();
}

function renderTrackCategoryCards() {
  const container = document.getElementById("track-category-cards");
  if (!container) return;

  container.innerHTML = "";
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(3, minmax(220px, 1fr))";
  container.style.gap = "18px";

  const cards = LEARNING_LEVELS.map(level => {
    const track = curriculum.find(item => item.id === level.trackId);
    const totalCategories = track.categories.length;
    const doneCategories = track.categories.filter(categoryComplete).length;
    const totalLessons = track.categories.flatMap(c => c.lessons).length;
    const doneLessons = track.categories.flatMap(c => c.lessons).filter(lesson => isLessonCompleted(lesson.id)).length;
    const percent = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "track-badge-card level-card" + (appState.currentTrackId === track.id ? " active" : "");
    card.style.borderColor = level.color;

    card.innerHTML = `
      <div class="track-badge-icon-wrap">
        <div class="track-badge-ring" style="--badge-progress: ${percent}%; background: conic-gradient(${level.color} ${percent}%, #e2e8f0 0);">
          <div class="track-badge-icon level-icon" style="color:${level.color};">${percent}%</div>
        </div>
      </div>
      <div class="track-badge-name">${level.label}</div>
      <div class="track-badge-stats">${doneCategories} / ${totalCategories} curriculum complete<br>${doneLessons} / ${totalLessons} lessons completed</div>
      <div class="track-badge-helper">Click to view this learning level</div>
    `;

    card.addEventListener("click", () => {
      appState.currentTrackId = track.id;
      appState.currentCategoryId = track.categories[0]?.id || null;
      appState.currentLessonId = null;
      appState.currentView = "overview";
      attempts = 0;
      saveProgress();
      renderAll();
    });

    return card;
  });

  cards.slice(0, 3).forEach(card => container.appendChild(card));

  if (cards.length > 3) {
    const bottomRow = document.createElement("div");
    bottomRow.style.gridColumn = "1 / -1";
    bottomRow.style.display = "flex";
    bottomRow.style.justifyContent = "center";
    bottomRow.style.gap = "18px";
    bottomRow.style.flexWrap = "wrap";

    cards.slice(3).forEach(card => {
      card.style.width = "calc((100% - 36px) / 3)";
      card.style.maxWidth = "340px";
      card.style.minWidth = "220px";
      bottomRow.appendChild(card);
    });

    container.appendChild(bottomRow);
  }
}

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
    const header = document.createElement("button");
    header.type = "button";
    header.className = "curriculum-category-header" + (done === total ? " is-complete" : "");
    header.innerHTML = `
      <div class="curriculum-category-row">
        <div class="curriculum-category-main">
          <span class="curriculum-category-title">${category.title}</span>
          <div class="curriculum-category-header-meta">
            <span class="curriculum-category-meta">${done}/${total} completed</span>
            <span class="curriculum-category-meta">${mastered} mastered</span>
          </div>
        </div>
        <span class="curriculum-category-arrow">›</span>
      </div>
    `;
    header.addEventListener("click", () => {
      appState.currentCategoryId = category.id;
      if (!appState.currentLessonId || !category.lessons.find(lesson => lesson.id === appState.currentLessonId)) {
        appState.currentLessonId = category.lessons[0]?.id || null;
      }
      appState.currentView = "lesson";
      attempts = 0;
      saveProgress();
      renderAll();
    });
    wrap.appendChild(header);
    list.appendChild(wrap);
  });
}

function renderOverview() {
  const track = getTrack();
  const cats = track.categories;
  const total = cats.flatMap(c => c.lessons).length;
  const completed = cats.flatMap(c => c.lessons).filter(l => isLessonCompleted(l.id)).length;
  const title = document.getElementById("track-overview-title");
  const desc = document.getElementById("track-overview-description");
  const trackTitleDisplay = document.getElementById("track-title-display-overview");
  const progressText = document.getElementById("track-overview-progress-text");
  const progressBar = document.getElementById("track-overview-progress-bar");
  const learnings = document.getElementById("track-overview-learnings");
  const impact = document.getElementById("track-overview-impact");
  if (title) title.innerText = track.title;
  if (desc) desc.innerText = track.description;
  if (trackTitleDisplay) trackTitleDisplay.innerText = levelForTrack(track.id)?.label || "Track";
  if (progressText) progressText.innerText = `${completed} of ${total} lessons completed`;
  if (progressBar) progressBar.style.width = `${total ? (completed / total) * 100 : 0}%`;
  if (learnings) learnings.innerHTML = "<li>How to query healthcare data with SQL</li><li>How to interpret operational and financial metrics</li><li>How to communicate findings to leaders</li>";
  if (impact) impact.innerHTML = "<li>Improve quality and operational visibility</li><li>Support financial performance and denial reduction</li><li>Communicate what leaders should act on</li>";
  const startBtn = document.getElementById("start-track-btn");
  const resumeBtn = document.getElementById("resume-track-btn");
  if (startBtn) startBtn.onclick = function () {
    appState.currentCategoryId = track.categories[0]?.id || null;
    appState.currentLessonId = track.categories[0]?.lessons[0]?.id || null;
    appState.currentView = "lesson";
    attempts = 0;
    appState.currentView = "lesson";
    saveProgress();
    renderAll();
  };
  if (resumeBtn) resumeBtn.onclick = function () {
    const firstIncomplete = track.categories.flatMap(c => c.lessons).find(l => !isLessonCompleted(l.id));
    const lesson = firstIncomplete || track.categories[0]?.lessons[0];
    if (!lesson) return;
    appState.currentLessonId = lesson.id;
    appState.currentCategoryId = track.categories.find(c => c.lessons.some(l => l.id === lesson.id))?.id || null;
    appState.currentView = "lesson";
    attempts = 0;
    appState.currentView = "lesson";
    saveProgress();
    renderAll();
  };
}

function showLessonWorkspace() {
  appState.currentView = "lesson";
  const overview = document.getElementById("track-overview");
  const workspace = document.getElementById("lesson-workspace");
  if (overview) overview.classList.add("hidden");
  if (workspace) workspace.classList.remove("hidden");
}

function showOverview() {
  appState.currentView = "overview";
  const overview = document.getElementById("track-overview");
  const workspace = document.getElementById("lesson-workspace");
  if (overview) overview.classList.remove("hidden");
  if (workspace) workspace.classList.add("hidden");
}


function cleanInstructionExpression(expression) {
  return String(expression || "")
    .replace(/\s+/g, " ")
    .replace(/\bAS\b/gi, "as")
    .trim();
}

function listToSentence(items) {
  const cleaned = (items || []).map(item => String(item || "").trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return cleaned[0] + " and " + cleaned[1];
  return cleaned.slice(0, -1).join(", ") + ", and " + cleaned[cleaned.length - 1];
}

function extractSelectExpressions(query) {
  const match = String(query || "").match(/select\s+([\s\S]+?)\s+from\s+/i);
  if (!match) return [];
  return match[1]
    .split(/,(?![^()]*\))/)
    .map(part => cleanInstructionExpression(part))
    .filter(Boolean);
}

function extractTableNames(query) {
  const matches = String(query || "").match(/\b(?:from|join|update|into)\s+([a-zA-Z_][\w]*)/gi) || [];
  const seen = new Set();
  const tables = [];
  matches.forEach(fragment => {
    const tableMatch = fragment.match(/\b(?:from|join|update|into)\s+([a-zA-Z_][\w]*)/i);
    const table = tableMatch ? tableMatch[1] : "";
    if (table && !seen.has(table.toLowerCase())) {
      seen.add(table.toLowerCase());
      tables.push(table);
    }
  });
  return tables;
}

function extractGroupByFields(query) {
  const match = String(query || "").match(/group\s+by\s+([\s\S]+?)(?:\s+having\s+|\s+order\s+by\s+|\s+limit\s+|;|$)/i);
  if (!match) return [];
  return match[1]
    .split(/,(?![^()]*\))/)
    .map(part => cleanInstructionExpression(part))
    .filter(Boolean);
}

function extractOrderByFields(query) {
  const match = String(query || "").match(/order\s+by\s+([\s\S]+?)(?:\s+limit\s+|;|$)/i);
  if (!match) return "";
  return cleanInstructionExpression(match[1]);
}

function extractLimitValue(query) {
  const match = String(query || "").match(/limit\s+(\d+)/i);
  return match ? match[1] : "";
}
function buildChallengePrompt(lesson) {
  if (!lesson) return "Write a SQL query that satisfies the lesson objective.";
  const direct = (lesson.challengeCriteria || "").trim();
  if (direct) return direct;

  const query = String(lesson.solutionQuery || lesson.starterQuery || "").trim();
  const tables = (lesson.relevantTables || []).filter(Boolean);
  const tableList = tables.join(", ");
  const firstTable = tables[0] || "relevant table";

  if (/^SELECT\s+\*\s+FROM\s+([a-zA-Z_][\w]*)\s*;?$/i.test(query)) {
    const table = query.match(/^SELECT\s+\*\s+FROM\s+([a-zA-Z_][\w]*)\s*;?$/i)[1];
    return `Write a SQL query that returns all columns and all rows from the ${table} table.`;
  }

  if (/SELECT\s+DISTINCT\s+.+\s+FROM\s+([a-zA-Z_][\w]*)/i.test(query)) {
    return `Use the ${firstTable} table to return unique values only. Follow the lesson objective and remove duplicates with DISTINCT.`;
  }

  if (/\sWHERE\s/i.test(query) && /\sIN\s*\(/i.test(query)) {
    return `Use the ${firstTable} table to return only rows where the filter matches one of several allowed values. Follow the lesson objective and use an IN filter.`;
  }

  if (/\sWHERE\s/i.test(query) && /\sBETWEEN\s/i.test(query)) {
    return `Use the ${firstTable} table to return only rows that fall within the requested range. Follow the lesson objective and use BETWEEN for the filter.`;
  }

  if (/\sWHERE\s/i.test(query) && /\sLIKE\s/i.test(query)) {
    return `Use the ${firstTable} table to return only rows that match the requested text pattern. Follow the lesson objective and use LIKE with the appropriate wildcard.`;
  }

  if (/\sWHERE\s/i.test(query) && /\sIS\s+NULL/i.test(query)) {
    return `Use the ${firstTable} table to return only rows where the requested field is missing. Follow the lesson objective and use IS NULL correctly.`;
  }

  if (/\sWHERE\s/i.test(query)) {
    return `Use the ${firstTable} table to return only the rows that match the requested filter condition in the lesson objective.`;
  }

  if (/\sGROUP\s+BY\s/i.test(query) && /\sHAVING\s/i.test(query)) {
    return `Use the ${firstTable} table to summarize records at the requested grouped level, then filter the grouped results with HAVING.`;
  }

  if (/\sGROUP\s+BY\s/i.test(query)) {
    return `Use the ${firstTable} table to group the data at the requested level and return the summary requested in the lesson objective.`;
  }

  if (/\sORDER\s+BY\s/i.test(query) && /\sLIMIT\s/i.test(query)) {
    return `Use the ${firstTable} table to return the requested result, sort it in the correct order, and limit the number of rows returned.`;
  }

  if (/\sORDER\s+BY\s/i.test(query)) {
    return `Use the ${firstTable} table to return the requested rows and sort them in the correct order.`;
  }

  if (/\sLIMIT\s/i.test(query)) {
    return `Use the ${firstTable} table to return the requested fields and limit the result to the requested number of rows.`;
  }

  if (/\sJOIN\s/i.test(query)) {
    return `Use ${tableList || "the relevant tables"} to write a SQL query that joins the needed tables and returns the fields requested in the lesson objective.`;
  }

  if (/\bCASE\b/i.test(query)) {
    return `Use the ${firstTable} table to create a derived field with CASE that matches the business rule described in the lesson objective.`;
  }

  if (/\bCAST\s*\(/i.test(query)) {
    return `Use the ${firstTable} table to convert the requested field to a new data type and return it with the requested alias.`;
  }

  if (/\bUPPER\s*\(|\bLOWER\s*\(|\bSUBSTR\s*\(/i.test(query)) {
    return `Use the ${firstTable} table to apply the requested string function and return the transformed value.`;
  }

  if (/\bjulianday\s*\(/i.test(query)) {
    return `Use the ${firstTable} table to calculate the requested date difference and return it with the requested alias.`;
  }

  if (/^SELECT\s+/i.test(query)) {
    return `Use the ${firstTable} table to write a SQL query that returns exactly the fields or calculation described in the lesson objective.`;
  }

  return lesson.objective || "Write a SQL query that satisfies the lesson objective.";
}

// ✅ ADD THIS BLOCK HERE
function enforceChallengeCriteria(curriculum) {
  curriculum.forEach(track => {
    track.categories.forEach(category => {
      category.lessons.forEach(lesson => {
        if (lesson.kind !== "challenge") return;

        if (lesson.challengeCriteria && lesson.challengeCriteria.trim()) return;

        const query = (lesson.solutionQuery || "").toLowerCase();
        const table = (lesson.relevantTables || [])[0] || "the table";

        if (query.includes("count(") || query.includes("avg(") || query.includes("sum(")) {
          lesson.challengeCriteria = `Using the ${table} table, write a SQL query that:
- calculates the requested aggregate values (such as COUNT, AVG, or SUM)
- returns clearly labeled columns using aliases
- matches the calculation described in the lesson objective`;
          return;
        }

        if (query.includes("group by")) {
          lesson.challengeCriteria = `Using the ${table} table, write a SQL query that:
- groups the data at the correct level
- calculates the required aggregate values
- returns one row per group as described in the lesson objective`;
          return;
        }

        if (query.includes("order by") && query.includes("limit")) {
          lesson.challengeCriteria = `Using the ${table} table, write a SQL query that:
- returns the requested fields
- sorts the results correctly
- limits the output to the required number of rows`;
          return;
        }

        if (query.includes("where")) {
          lesson.challengeCriteria = `Using the ${table} table, write a SQL query that:
- filters the data based on the required condition
- returns only rows that meet the criteria described in the lesson`;
          return;
        }

        if (query.includes("distinct")) {
          lesson.challengeCriteria = `Using the ${table} table, write a SQL query that:
- returns unique values only
- removes duplicate records for the specified field`;
          return;
        }

        if (query.includes("join")) {
          lesson.challengeCriteria = `Using the relevant tables, write a SQL query that:
- joins the necessary tables correctly
- returns the requested fields
- avoids duplicate or inflated results`;
          return;
        }

        lesson.challengeCriteria = `Using the ${table} table, write a SQL query that:
- returns exactly the fields or calculations described in the lesson objective
- follows proper SQL structure and syntax`;
      });
    });
  });
}
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function renderLesson() {
  const lesson = getCurrentLesson();
  if (!lesson) return;
  showLessonWorkspace();
  document.getElementById("track-title-display").innerText = getCurrentCategory()?.title || "Category";
  document.getElementById("lesson-title").innerText = lesson.title;
  document.getElementById("lesson-objective").innerText = lesson.objective;
  document.getElementById("lesson-tables").innerHTML = `<strong>Relevant Tables:</strong> ${lesson.relevantTables.join(", ") || "—"}`;
  document.getElementById("lesson-join-hint").innerHTML = `<strong>Join Hint:</strong> ${lesson.joinHint || "—"}`;
  document.getElementById("lesson-sql-focus").innerHTML = `<strong>SQL Focus:</strong> ${(lesson.sql_focus || []).join(", ") || "—"}`;

  const typeBadge = document.getElementById("current-lesson-type-badge");
  const catBadge = document.getElementById("current-category-badge");
  if (typeBadge) {
    typeBadge.className = "lesson-type-badge lesson-type-" + lesson.type;
    typeBadge.innerText = lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1);
  }
  const level = levelForTrack(appState.currentTrackId);
  if (catBadge && level) {
    const map = { foundations: "difficulty-easy", core: "difficulty-intermediate", applied: "difficulty-hard", advanced: "difficulty-advanced", expert: "difficulty-advanced" };
    catBadge.className = "difficulty-badge " + (map[level.key] || "difficulty-intermediate");
    catBadge.innerText = level.label;
  }

  ["concept-content","challenge-content","scenario-content","executive-takeaway"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  if (lesson.type === "concept") {
    document.getElementById("concept-content").classList.remove("hidden");
    document.getElementById("concept-summary").innerText = lesson.content.summary;
    const bullets = document.getElementById("concept-bullets");
    bullets.innerHTML = "";
    (lesson.content.bullets || []).forEach(item => {
      const li = document.createElement("li");
      li.innerText = item;
      bullets.appendChild(li);
    });
    document.getElementById("concept-example").innerText = lesson.content.example || "";
  }

  if (lesson.type === "challenge") {
    const challengeContent = document.getElementById("challenge-content");
    challengeContent.classList.remove("hidden");

let criteriaBox = document.getElementById("challenge-criteria");

if (!criteriaBox) {
  criteriaBox = document.createElement("div");
  criteriaBox.id = "challenge-criteria";
  criteriaBox.className = "concept-card";
  const firstLabel = challengeContent.querySelector(".query-label");
  if (firstLabel && firstLabel.parentNode) {
    challengeContent.insertBefore(criteriaBox, firstLabel);
  } else {
    challengeContent.insertBefore(criteriaBox, challengeContent.firstChild);
  }
}

    criteriaBox.innerHTML = `
      <h4>Your Task</h4>
      <p>${escapeHtml(lesson.challengeCriteria || buildChallengePrompt(lesson) || lesson.objective || "")}</p>
    `;

    const query = document.getElementById("query");
    query.value = lesson.starterQuery || "";
    document.getElementById("feedback").innerText = "";
    document.getElementById("feedback").classList.remove("success","error","warning");
    document.getElementById("output").innerHTML = "";
  }

  if (lesson.type === "scenario") {
    document.getElementById("scenario-content").classList.remove("hidden");
    document.getElementById("scenario-summary").innerText = lesson.content.summary || "";
    document.getElementById("scenario-prompt").innerText = lesson.content.prompt || lesson.objective || "";
    document.getElementById("scenario-response").value = "";
    document.getElementById("scenario-feedback").innerText = "";
  }

  if (shouldShowExecutiveTakeaway(lesson)) {
    document.getElementById("executive-takeaway").classList.remove("hidden");
    document.getElementById("exec-metric").innerHTML = `<strong>Metric:</strong> ${lesson.executiveTakeaway.metric}`;
    document.getElementById("exec-why").innerHTML = `<strong>Why it matters:</strong> ${lesson.executiveTakeaway.whyItMatters}`;
    document.getElementById("exec-share").innerHTML = `<strong>What to share:</strong> ${lesson.executiveTakeaway.whatToShare}`;
    document.getElementById("exec-action").innerHTML = `<strong>Recommended action:</strong> ${lesson.executiveTakeaway.action}`;
  }
}

function renderAll() {
  applySchemaPanelWidth();
  renderSchema();
  renderAchievements();
  updateDashboard();
  renderCurriculumNav();
  renderTrackCategoryCards();
  renderOverview();
  if (appState.currentView === "lesson" && appState.currentLessonId) {
    renderLesson();
  } else {
    showOverview();
  }
}

function generateMockData() {
  const patients = [];
  const providers = [];
  const departments = [
    { department_id: 1, department_name: "Emergency Department", facility: "Main Campus", service_line: "Emergency" },
    { department_id: 2, department_name: "Hospital Medicine", facility: "Main Campus", service_line: "Medicine" },
    { department_id: 3, department_name: "Observation Unit", facility: "Main Campus", service_line: "Observation" },
    { department_id: 4, department_name: "Family Medicine Clinic", facility: "North Campus", service_line: "Primary Care" },
    { department_id: 5, department_name: "Cardiology", facility: "Main Campus", service_line: "Heart" }
  ];
  const providerNames = ["Adams","Bennett","Carter","Diaz","Ellis","Foster","Garcia","Hall","Irwin","Jones"];
  const specialties = ["Emergency Medicine","Hospital Medicine","Cardiology","Family Medicine","Observation"];
  for (let i = 1; i <= 10; i++) {
    providers.push({ provider_id: i, provider_name: `Dr. ${providerNames[i-1]}`, specialty: specialties[(i-1)%specialties.length], facility: i % 2 === 0 ? "North Campus" : "Main Campus" });
  }
  const firstNames = ["Ava","Liam","Noah","Emma","Mia","Elijah","Sophia","Lucas","Olivia","Mason"];
  const lastNames = ["Smith","Johnson","Williams","Brown","Jones","Miller","Davis","Wilson","Taylor","Moore"];
  const insurance = ["Medicare","Medicaid","Commercial","Self Pay"];
  const cities = ["Myrtle Beach","Georgetown","Conway", null, "Pawleys Island"];
  for (let i = 1; i <= 60; i++) {
    patients.push({
      patient_id: i,
      first_name: firstNames[(i-1)%firstNames.length],
      last_name: lastNames[(i-1)%lastNames.length],
      age: 18 + (i % 72),
      gender: i % 2 === 0 ? "F" : "M",
      insurance_type: insurance[(i-1)%insurance.length],
      risk_score: (i % 10) + 1,
      city: cities[(i-1)%cities.length]
    });
  }
  const encounters = [];
  const charges = [];
  const claims = [];
  const appointments = [];
  const discharges = [];
  const observations = [];
  const readmissions = [];
  let chargeId = 1, claimId = 1, appointmentId = 1, dischargeId = 1, observationId = 1, readmissionId = 1;
  for (let i = 1; i <= 120; i++) {
    const patientId = (i % 60) + 1;
    const dept = departments[(i-1)%departments.length];
    const provider = providers[(i-1)%providers.length];
    const admitDay = (i % 28) + 1;
    const los = (i % 7) + 1;
    const admitDate = `2026-01-${String(admitDay).padStart(2,"0")}`;
    const dischargeDay = Math.min(28, admitDay + los);
    const dischargeDate = `2026-01-${String(dischargeDay).padStart(2,"0")}`;
    const encounter = {
      encounter_id: i,
      patient_id: patientId,
      provider_id: provider.provider_id,
      department_id: dept.department_id,
      facility: dept.facility,
      department: dept.department_name,
      status: i % 6 === 0 ? "In Progress" : "Discharged",
      encounter_type: i % 4 === 0 ? "Observation" : "Inpatient",
      length_of_stay: los,
      admit_date: admitDate,
      discharge_date: dischargeDate
    };
    encounters.push(encounter);

    appointments.push({
      appointment_id: appointmentId++,
      patient_id: patientId,
      provider_id: provider.provider_id,
      department_id: dept.department_id,
      facility: dept.facility,
      department: dept.department_name,
      status: i % 9 === 0 ? "No Show" : "Completed",
      date: admitDate
    });

    const amount = 500 + (i * 37);
    charges.push({
      charge_id: chargeId++,
      patient_id: patientId,
      encounter_id: i,
      amount: amount,
      payer: ["Medicare","Medicaid","Commercial","Self Pay"][i % 4],
      charge_type: i % 2 === 0 ? "Facility" : "Professional"
    });
    charges.push({
      charge_id: chargeId++,
      patient_id: patientId,
      encounter_id: i,
      amount: amount * 0.45,
      payer: ["Medicare","Medicaid","Commercial","Self Pay"][i % 4],
      charge_type: i % 2 === 0 ? "Professional" : "Ancillary"
    });

    claims.push({
      claim_id: claimId++,
      patient_id: patientId,
      encounter_id: i,
      payer: ["Medicare","Medicaid","Commercial","Self Pay"][i % 4],
      claim_status: i % 7 === 0 ? "Denied" : "Paid",
      billed_amount: amount * 1.4
    });

    discharges.push({
      discharge_id: dischargeId++,
      encounter_id: i,
      patient_id: patientId,
      facility: dept.facility,
      department: dept.department_name,
      discharge_disposition: i % 10 === 0 ? "SNF" : "Home",
      discharge_order_minutes: 40 + (i % 180),
      departure_minutes: 60 + (i % 240),
      delayed_for_transport: i % 8 === 0 ? 1 : 0
    });

    if (encounter.encounter_type === "Observation") {
      observations.push({
        observation_id: observationId++,
        encounter_id: i,
        patient_id: patientId,
        facility: dept.facility,
        department: dept.department_name,
        obs_hours: 6 + (i % 60),
        converted_to_inpatient: i % 5 === 0 ? 1 : 0,
        code_44_flag: i % 11 === 0 ? 1 : 0
      });
    }
  }

  for (let i = 1; i <= 30; i++) {
    readmissions.push({
      readmission_id: readmissionId++,
      index_encounter_id: i,
      readmit_encounter_id: i + 60,
      patient_id: (i % 60) + 1,
      facility: i % 2 === 0 ? "North Campus" : "Main Campus",
      readmit_within_30_days: i % 3 === 0 ? 1 : 0,
      days_to_readmit: 5 + (i % 25)
    });
  }

  schema.tables.forEach(table => {
    const rows = {patients, providers, departments, encounters, appointments, charges, claims, discharges, readmissions, observations}[table.name];
    table.sampleRows = rows.slice(0, 5);
  });

  return { patients, providers, departments, encounters, appointments, charges, claims, discharges, readmissions, observations };
}

function initDatabase() {
  return new Promise((resolve, reject) => {
    if (sqlEngineReady) return resolve();
    if (typeof initSqlJs !== "function") return reject(new Error("SQL.js not loaded."));
    initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}` })
      .then(SQLLib => {
        SQL = SQLLib;
        sqlDb = new SQL.Database();
        const data = generateMockData();
        createTables();
        seedTable("patients", data.patients);
        seedTable("providers", data.providers);
        seedTable("departments", data.departments);
        seedTable("encounters", data.encounters);
        seedTable("appointments", data.appointments);
        seedTable("charges", data.charges);
        seedTable("claims", data.claims);
        seedTable("discharges", data.discharges);
        seedTable("readmissions", data.readmissions);
        seedTable("observations", data.observations);
        sqlEngineReady = true;
        resolve();
      })
      .catch(reject);
  });
}

function createTables() {
  sqlDb.run(`CREATE TABLE patients (patient_id INTEGER, first_name TEXT, last_name TEXT, age INTEGER, gender TEXT, insurance_type TEXT, risk_score INTEGER, city TEXT);`);
  sqlDb.run(`CREATE TABLE providers (provider_id INTEGER, provider_name TEXT, specialty TEXT, facility TEXT);`);
  sqlDb.run(`CREATE TABLE departments (department_id INTEGER, department_name TEXT, facility TEXT, service_line TEXT);`);
  sqlDb.run(`CREATE TABLE encounters (encounter_id INTEGER, patient_id INTEGER, provider_id INTEGER, department_id INTEGER, facility TEXT, department TEXT, status TEXT, encounter_type TEXT, length_of_stay INTEGER, admit_date TEXT, discharge_date TEXT);`);
  sqlDb.run(`CREATE TABLE appointments (appointment_id INTEGER, patient_id INTEGER, provider_id INTEGER, department_id INTEGER, facility TEXT, department TEXT, status TEXT, date TEXT);`);
  sqlDb.run(`CREATE TABLE charges (charge_id INTEGER, patient_id INTEGER, encounter_id INTEGER, amount REAL, payer TEXT, charge_type TEXT);`);
  sqlDb.run(`CREATE TABLE claims (claim_id INTEGER, patient_id INTEGER, encounter_id INTEGER, payer TEXT, claim_status TEXT, billed_amount REAL);`);
  sqlDb.run(`CREATE TABLE discharges (discharge_id INTEGER, encounter_id INTEGER, patient_id INTEGER, facility TEXT, department TEXT, discharge_disposition TEXT, discharge_order_minutes INTEGER, departure_minutes INTEGER, delayed_for_transport INTEGER);`);
  sqlDb.run(`CREATE TABLE readmissions (readmission_id INTEGER, index_encounter_id INTEGER, readmit_encounter_id INTEGER, patient_id INTEGER, facility TEXT, readmit_within_30_days INTEGER, days_to_readmit INTEGER);`);
  sqlDb.run(`CREATE TABLE observations (observation_id INTEGER, encounter_id INTEGER, patient_id INTEGER, facility TEXT, department TEXT, obs_hours INTEGER, converted_to_inpatient INTEGER, code_44_flag INTEGER);`);
}

function seedTable(tableName, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const stmt = sqlDb.prepare(`INSERT INTO ${tableName} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")});`);
  rows.forEach(row => stmt.run(cols.map(col => row[col])));
  stmt.free();
}

function queryToResult(query) {
  const result = sqlDb.exec(query);
  if (!result.length) return { columns: [], values: [] };
  return { columns: result[0].columns, values: result[0].values };
}

function formatResultTable(result) {
  if (!result.columns.length) return "<p>No rows returned.</p>";
  let html = '<div class="query-results-table-wrap"><table class="preview-table"><thead><tr>';
  result.columns.forEach(col => html += `<th>${col}</th>`);
  html += "</tr></thead><tbody>";
  result.values.forEach(row => {
    html += "<tr>";
    row.forEach(cell => html += `<td>${cell === null ? "" : cell}</td>`);
    html += "</tr>";
  });
  html += "</tbody></table></div>";
  return html;
}

function getExecutionErrorMessage(error) {
  const raw = String(error && error.message ? error.message : error || "");
  const message = raw.toLowerCase();
  if (message.includes("syntax error")) return "SQL syntax error. Check commas, parentheses, aliases, and clause order.";
  if (message.includes("no such table")) return "One of the tables in your query does not exist in this lesson schema.";
  if (message.includes("no such column")) return "One of the columns in your query does not exist in the table you used.";
  if (message.includes("ambiguous")) return "A column reference is ambiguous. Add the table alias or full table.column reference.";
  return raw || "The query could not be executed.";
}

function runQuery() {
  const lesson = getCurrentLesson();
  const output = document.getElementById("output");
  const feedback = document.getElementById("feedback");
  const queryBox = document.getElementById("query");

  if (!lesson || (lesson.kind !== "challenge" && lesson.type !== "challenge") || !queryBox) return;

  const query = queryBox.value.trim();
  lastRunQuery = query;

  if (!query) {
    setFeedbackState(feedback, "error", "Please enter a query before running it.");
    if (output) output.innerHTML = "";
    return;
  }

  const hintOne =
    lesson.hint ||
    "Start with the correct table and make sure you are selecting the required fields.";

  const hintTwo =
    lesson.smartHint ||
    lesson.secondHint ||
    "Double-check the exact columns, filters, joins, or grouping needed to match the lesson objective.";

  const finalExplanation =
    lesson.explanation ||
    "This answer is correct because it uses the right table, selects the required fields, and returns the expected result for the lesson objective.";

  try {
    const result = queryToResult(query);
    if (output) output.innerHTML = formatResultTable(result);

    const solutionResult = queryToResult(lesson.solutionQuery);
    const passed = normalizeResult(result) === normalizeResult(solutionResult);

    if (passed) {
      markLessonCompleted(lesson.id, attempts === 0);
      setFeedbackState(
        feedback,
        "success",
        "Correct — your query returned the expected result."
      );
      attempts = 0;
      saveProgress();
      refreshLessonChrome();
      return;
    }

    attempts += 1;

    if (attempts === 1) {
      setFeedbackState(feedback, "warning", `Not correct yet. Hint 1: ${hintOne}`);
    } else if (attempts === 2) {
      setFeedbackState(feedback, "warning", `Still not correct. Hint 2: ${hintTwo}`);
    } else {
      setFeedbackState(
        feedback,
        "error",
        `You have used all 3 attempts.\n\nCorrect Answer:\n${lesson.solutionQuery}\n\nExplanation:\n${finalExplanation}`
      );
    }

    saveProgress();
    refreshLessonChrome();
  } catch (error) {
    if (output) output.innerHTML = "";

    attempts += 1;

    const executionMessage = getExecutionErrorMessage(error);

    if (attempts === 1) {
      setFeedbackState(
        feedback,
        "warning",
        `Not correct yet. Hint 1: ${executionMessage} ${hintOne}`
      );
    } else if (attempts === 2) {
      setFeedbackState(
        feedback,
        "warning",
        `Still not correct. Hint 2: ${executionMessage} ${hintTwo}`
      );
    } else {
      setFeedbackState(
        feedback,
        "error",
        `You have used all 3 attempts.\n\nCorrect Answer:\n${lesson.solutionQuery}\n\nExplanation:\n${finalExplanation}`
      );
    }

    saveProgress();
    refreshLessonChrome();
  }
}
function normalizeResult(result) {
  return JSON.stringify({
    columns: result.columns,
    values: result.values
  });
}

function gradePass() {
  if (attempts === 0) return { score: 100, tier: "Perfect" };
  if (attempts === 1) return { score: 92, tier: "Strong" };
  return { score: 82, tier: "Passing" };
}
function refreshLessonChrome() {
  applySchemaPanelWidth();
  renderSchema();
  renderAchievements();
  updateDashboard();
  renderCurriculumNav();
  renderTrackCategoryCards();
}

function setFeedbackState(element, state, message) {
  if (!element) return;
  element.classList.remove("success", "error", "warning");
  if (state) element.classList.add(state);
  element.innerText = message;
}
function checkAnswer() {
  runQuery();
}
function resetQuery() {
  const queryBox = document.getElementById("query");
  const feedback = document.getElementById("feedback");
  const output = document.getElementById("output");

  if (queryBox) queryBox.value = "";
  if (feedback) {
    feedback.classList.remove("success", "error", "warning");
    feedback.innerText = "";
  }
  if (output) output.innerHTML = "";

  attempts = 0;
  lastRunQuery = "";
}

function submitScenario() {
  const lesson = getCurrentLesson();
  const box = document.getElementById("scenario-response");
  const feedback = document.getElementById("scenario-feedback");

  if (!lesson || lesson.type !== "scenario" || !box || !feedback) return;

  attempts += 1;

  const rawAnswer = box.value.trim();
  const answer = rawAnswer.toLowerCase();

  if (!rawAnswer) {
    setFeedbackState(feedback, "error", "Please enter a response before submitting.");
    return;
  }

  const expectedKeywords = lesson.content.expectedKeywords || [];
  const minLength = lesson.content.minLength || 80;
  const minimumKeywordMatches =
    lesson.content.minimumKeywordMatches || Math.min(2, expectedKeywords.length);

  const matchedKeywords = expectedKeywords.filter(k =>
    answer.includes(String(k).toLowerCase())
  );
  const missingKeywords = expectedKeywords.filter(k =>
    !answer.includes(String(k).toLowerCase())
  );

  const passed =
    rawAnswer.length >= minLength &&
    matchedKeywords.length >= minimumKeywordMatches;

  const partial =
    !passed &&
    rawAnswer.length >= Math.max(50, Math.floor(minLength * 0.6)) &&
    matchedKeywords.length >= 1;

  if (passed) {
    const perfect = matchedKeywords.length >= expectedKeywords.length;
    const grade = perfect
      ? { score: 100, tier: "Perfect" }
      : { score: 92, tier: "Strong" };

    updateLessonStatsOnGrade(lesson.id, grade, true);
    markLessonCompleted(lesson.id, attempts === 1);

    setFeedbackState(
      feedback,
      "success",
      `Correct — ${lesson.content.feedbackGuide || "You covered the right business context, likely data source, and practical action."}`
    );

    saveProgress();
    refreshLessonChrome();
    return;
  }

  if (partial) {
    updateLessonStatsOnGrade(lesson.id, { score: 72, tier: "Partial" }, false);

    const missingText = missingKeywords.length
      ? `Missing ideas to mention: ${missingKeywords.slice(0, 4).join(", ")}.`
      : "Add more specificity to the response.";

    setFeedbackState(
      feedback,
      "warning",
      `Partially correct — you are on the right track, but the response needs more specificity. ${missingText}`
    );

    saveProgress();
    refreshLessonChrome();
    return;
  }

  updateLessonStatsOnGrade(lesson.id, { score: 55, tier: "Developing" }, false);

  const missingText = missingKeywords.length
    ? `Missing ideas to mention: ${missingKeywords.slice(0, 4).join(", ")}.`
    : "";

  setFeedbackState(
    feedback,
    "error",
    `Not correct yet. Build the response around the likely table or data source, the business meaning, and one practical action. ${missingText}`.trim()
  );

  saveProgress();
  refreshLessonChrome();
}

function resetScenario() {
  const box = document.getElementById("scenario-response");
  const feedback = document.getElementById("scenario-feedback");
  if (box) box.value = "";
  if (feedback) feedback.innerText = "";
}

function markConceptComplete() {
  const lesson = getCurrentLesson();
  if (!lesson || lesson.type !== "concept") return;
  updateLessonStatsOnGrade(lesson.id, { score: 100, tier: "Perfect" }, true);
  markLessonCompleted(lesson.id, true);
  saveProgress();
  renderAll();
}

function nextLesson() {
  const lessons = getAllLessons();
  const idx = lessons.findIndex(item => item.id === appState.currentLessonId);
  if (idx >= 0 && idx < lessons.length - 1) {
    appState.currentLessonId = lessons[idx + 1].id;
    appState.currentCategoryId = getAllCategories().find(cat => cat.lessons.some(l => l.id === appState.currentLessonId))?.id || appState.currentCategoryId;
    attempts = 0;
    appState.currentView = "lesson";
    saveProgress();
    renderAll();
  }
}

function prevLesson() {
  const lessons = getAllLessons();
  const idx = lessons.findIndex(item => item.id === appState.currentLessonId);
  if (idx > 0) {
    appState.currentLessonId = lessons[idx - 1].id;
    appState.currentCategoryId = getAllCategories().find(cat => cat.lessons.some(l => l.id === appState.currentLessonId))?.id || appState.currentCategoryId;
    attempts = 0;
    appState.currentView = "lesson";
    saveProgress();
    renderAll();
  }
}

function resetAllProgress() {
  if (!window.confirm("Reset all progress for CareOps SQL Analyst?")) return;
  appState.completedLessonIds = [];
  appState.firstTryLessonIds = [];
  appState.lessonStats = {};
  attempts = 0;
  appState.currentView = "overview";
  saveProgress();
  showOverview();
  renderAll();
}

function openTableModal(tableName) {
  const overlay = document.getElementById("table-modal-overlay");
  const table = schema.tables.find(item => item.name === tableName);
  if (!overlay || !table) return;
  document.getElementById("table-modal-title").innerText = table.name;
  document.getElementById("table-modal-description").innerText = table.description;
  document.getElementById("table-modal-keys").innerText = table.keyColumns.join(", ");
  document.getElementById("table-modal-columns").innerText = table.notableColumns.join(", ");
  const relWrap = document.getElementById("table-modal-relationships");
  relWrap.innerHTML = "";
  schema.relationships.filter(item => item.includes(table.name + ".")).forEach(item => {
    const chip = document.createElement("div");
    chip.className = "modal-relationship-chip";
    chip.innerText = item;
    relWrap.appendChild(chip);
  });
  const previewContent = document.getElementById("table-modal-preview-content");
  const headers = table.notableColumns;
  let html = '<table><thead><tr>';
  headers.forEach(col => html += `<th>${col}</th>`);
  html += '</tr></thead><tbody>';
  table.sampleRows.forEach(row => {
    html += '<tr>';
    headers.forEach(col => html += `<td>${row[col] ?? ""}</td>`);
    html += '</tr>';
  });
  html += '</tbody></table>';
  previewContent.innerHTML = html;
  overlay.classList.remove("hidden");
}

function closeTableModal(event) {
  if (event && event.target && event.target.id && event.target.id !== "table-modal-overlay") return;
  const overlay = document.getElementById("table-modal-overlay");
  if (overlay) overlay.classList.add("hidden");
}

function initUiActions() {
  const openOverviewBtn = document.getElementById("open-overview-btn");
 if (openOverviewBtn) openOverviewBtn.onclick = () => {
  appState.currentView = "overview";
  attempts = 0;
  showOverview();
  renderAll();
};
  const toggleBtn = document.getElementById("toggle-levels-panel-btn");
  const panel = document.getElementById("levels-panel");
  if (toggleBtn && panel) {
    toggleBtn.onclick = () => {
      panel.classList.toggle("collapsed");
      toggleBtn.innerText = panel.classList.contains("collapsed") ? "Expand" : "Collapse";
      toggleBtn.setAttribute("aria-expanded", panel.classList.contains("collapsed") ? "false" : "true");
    };
  }
}



const AI_API_CONFIG = {
  endpoint: "/api/ai-companion",
  method: "POST",
  timeoutMs: 15000
};

let sandboxDb = null;
let aiThread = [];

function showSection(sectionId) {
  ["track-overview", "lesson-workspace", "sandbox-workspace"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", id !== sectionId);
  });
}

function showLessonWorkspace() {
  appState.currentView = "lesson";
  showSection("lesson-workspace");
}

function showOverview() {
  appState.currentView = "overview";
  showSection("track-overview");
}

function showSandboxWorkspace() {
  appState.currentView = "sandbox";
  showSection("sandbox-workspace");
  syncSandboxStarterQuery();
}

function setMessageState(elementId, state, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = "";
  if (!message) {
    el.textContent = "";
    return;
  }
  el.classList.add(state);
  el.textContent = message;
}

async function initializeSandboxDatabase() {
  if (!SQL) return;
  sandboxDb = new SQL.Database();
  const mockData = generateMockData();
  createTablesForDb(sandboxDb);
  Object.entries(mockData).forEach(([tableName, rows]) => seedTableIntoDb(sandboxDb, tableName, rows));
}

function createTablesForDb(db) {
  db.run(`
    CREATE TABLE patients (patient_id INTEGER, first_name TEXT, last_name TEXT, age INTEGER, gender TEXT, insurance_type TEXT, risk_score REAL, city TEXT);
    CREATE TABLE providers (provider_id INTEGER, provider_name TEXT, specialty TEXT, facility TEXT);
    CREATE TABLE departments (department_id INTEGER, department_name TEXT, facility TEXT, service_line TEXT);
    CREATE TABLE encounters (encounter_id INTEGER, patient_id INTEGER, provider_id INTEGER, department_id INTEGER, facility TEXT, department TEXT, status TEXT, encounter_type TEXT, length_of_stay INTEGER, admit_date TEXT, discharge_date TEXT);
    CREATE TABLE appointments (appointment_id INTEGER, patient_id INTEGER, provider_id INTEGER, department_id INTEGER, facility TEXT, department TEXT, status TEXT, date TEXT);
    CREATE TABLE charges (charge_id INTEGER, patient_id INTEGER, encounter_id INTEGER, amount REAL, payer TEXT, charge_type TEXT);
    CREATE TABLE claims (claim_id INTEGER, patient_id INTEGER, encounter_id INTEGER, payer TEXT, claim_status TEXT, billed_amount REAL);
    CREATE TABLE discharges (discharge_id INTEGER, encounter_id INTEGER, patient_id INTEGER, facility TEXT, department TEXT, discharge_disposition TEXT, discharge_order_minutes INTEGER, departure_minutes INTEGER, delayed_for_transport INTEGER);
    CREATE TABLE readmissions (readmission_id INTEGER, index_encounter_id INTEGER, readmit_encounter_id INTEGER, patient_id INTEGER, facility TEXT, readmit_within_30_days INTEGER, days_to_readmit INTEGER);
    CREATE TABLE observations (observation_id INTEGER, encounter_id INTEGER, patient_id INTEGER, facility TEXT, department TEXT, obs_hours INTEGER, converted_to_inpatient INTEGER, code_44_flag INTEGER);
  `);
}

function seedTableIntoDb(db, tableName, rows) {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const placeholders = keys.map(() => "?").join(", ");
  const stmt = db.prepare(`INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${placeholders})`);
  rows.forEach((row) => stmt.run(keys.map((key) => row[key])));
  stmt.free();
}

async function resetSandbox() {
  await initializeSandboxDatabase();
  document.getElementById("sandbox-output").innerHTML = "";
  setMessageState("sandbox-feedback", "success", "Sandbox reset. You are back to a clean mock environment.");
  syncSandboxStarterQuery();
}

function syncSandboxStarterQuery() {
  const box = document.getElementById("sandbox-query");
  if (!box) return;
  const lesson = getCurrentLesson();
  if (lesson && (lesson.starterQuery || lesson.solutionQuery)) {
    box.value = lesson.starterQuery || lesson.solutionQuery;
  }
}

function runSandboxQuery() {
  const query = (document.getElementById("sandbox-query")?.value || "").trim();
  if (!query) {
    setMessageState("sandbox-feedback", "warning", "Enter a SQL statement before running the sandbox.");
    return;
  }
  if (!sandboxDb) {
    setMessageState("sandbox-feedback", "warning", "Sandbox database is still loading. Try again in a moment.");
    return;
  }
  try {
    const result = sandboxDb.exec(query);
    document.getElementById("sandbox-output").innerHTML = formatResultTable(result);
    setMessageState("sandbox-feedback", "success", result.length ? "Sandbox query ran successfully." : "Query executed successfully. No result rows were returned.");
  } catch (error) {
    setMessageState("sandbox-feedback", "error", getExecutionErrorMessage(error));
  }
}

function aiContextPayload() {
  const lesson = getCurrentLesson();
  return {
    trackId: appState.currentTrackId,
    categoryId: appState.currentCategoryId,
    lessonId: lesson?.id || null,
    lessonTitle: lesson?.title || null,
    lessonType: lesson?.type || null,
    objective: lesson?.objective || null,
    starterQuery: lesson?.starterQuery || null,
    currentQuery: document.getElementById("query")?.value || null,
    sandboxQuery: document.getElementById("sandbox-query")?.value || null,
    progress: {
      completedLessons: completedLessonCount(),
      totalLessons: totalLessonCount(),
      badges: levelBadgeCount()
    }
  };
}

function renderAiMessages() {
  const holder = document.getElementById("ai-messages");
  if (!holder) return;
  if (!aiThread.length) {
    holder.innerHTML = `<div class="ai-message assistant"><div class="ai-message-role">AI companion</div><div>I can help with SQL hints, debugging, executive summaries, and next-step practice. Ask about the current lesson or use a quick action.</div></div>`;
    return;
  }
  holder.innerHTML = aiThread.map((msg) => `
    <div class="ai-message ${msg.role}">
      <div class="ai-message-role">${msg.role === "user" ? "You" : "AI companion"}</div>
      <div>${escapeHtml(msg.content).replace(/\n/g, "<br>")}</div>
    </div>
  `).join("");
  holder.scrollTop = holder.scrollHeight;
}

function setAiStatus(text, isLive = false) {
  const pill = document.getElementById("ai-status-pill");
  if (!pill) return;
  pill.textContent = text;
  pill.classList.toggle("is-ready", !!isLive);
}

function fallbackAiResponse(userMessage) {
  const lesson = getCurrentLesson();
  const prompt = userMessage.toLowerCase();
  if (!lesson) {
    return "Start or resume a lesson first so I can tailor the guidance to the objective, tables, and SQL pattern you are practicing.";
  }
  if (prompt.includes("hint")) {
    return [
      `Focus on the lesson objective: ${lesson.objective}`,
      lesson.joinHint ? `Join hint: ${lesson.joinHint}` : null,
      lesson.relevantTables?.length ? `Relevant tables: ${lesson.relevantTables.join(", ")}.` : null,
      lesson.sql_focus?.length ? `SQL focus: ${lesson.sql_focus.join(", ")}.` : null,
      "Try solving it without copying the full solution first."
    ].filter(Boolean).join("\n");
  }
  if (prompt.includes("executive")) {
    return `Executive framing for ${lesson.title}: highlight the metric or operational pattern being studied, explain why it matters to quality, revenue, or throughput, and recommend one action a leader should take next.`;
  }
  if (prompt.includes("debug") || prompt.includes("wrong")) {
    return "Check four things in order: the base table, the exact columns requested, filter logic, and whether the result grain matches the business question. If a join is involved, verify the key and whether you created duplicate rows.";
  }
  return `For ${lesson.title}, start by matching the request to the right grain, then use ${lesson.relevantTables?.[0] || "the relevant table"} as your anchor. If you want, ask me for a hint, a debug pass, or an executive summary.`;
}

async function requestAiCompanion(userMessage) {
  const payload = {
    message: userMessage,
    context: aiContextPayload(),
    thread: aiThread.slice(-8)
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_API_CONFIG.timeoutMs);
  try {
    const response = await fetch(AI_API_CONFIG.endpoint, {
      method: AI_API_CONFIG.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    setAiStatus("Live API mode", true);
    return data.reply || data.message || fallbackAiResponse(userMessage);
  } catch (error) {
    clearTimeout(timeoutId);
    setAiStatus("Fallback mode", false);
    return fallbackAiResponse(userMessage);
  }
}

async function sendAiMessage(prefill = null) {
  const input = document.getElementById("ai-input");
  const message = (prefill || input?.value || "").trim();
  if (!message) return;
  aiThread.push({ role: "user", content: message });
  renderAiMessages();
  if (input) input.value = "";
  const reply = await requestAiCompanion(message);
  aiThread.push({ role: "assistant", content: reply });
  renderAiMessages();
}

function clearAiChat() {
  aiThread = [];
  renderAiMessages();
}

function scrollToAiCompanion() {
  document.getElementById("ai-companion-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateAiContextBanner() {
  const lesson = getCurrentLesson();
  if (!lesson) return;
  if (!aiThread.length) renderAiMessages();
}

function renderAll() {
  applySchemaPanelWidth();
  renderSchema();
  renderAchievements();
  updateDashboard();
  renderCurriculumNav();
  renderTrackCategoryCards();
  renderOverview();
  if (appState.currentView === "lesson" && appState.currentLessonId) {
    renderLesson();
  } else if (appState.currentView === "sandbox") {
    showSandboxWorkspace();
  } else {
    showOverview();
  }
  updateAiContextBanner();
}

function initUiActions() {
  const openOverviewBtn = document.getElementById("open-overview-btn");
  if (openOverviewBtn) openOverviewBtn.onclick = () => {
    attempts = 0;
    showOverview();
    renderAll();
  };
  const openSandboxBtn = document.getElementById("open-sandbox-btn");
  if (openSandboxBtn) openSandboxBtn.onclick = () => {
    showSandboxWorkspace();
    renderAll();
  };
  const jumpToAiBtn = document.getElementById("jump-to-ai-btn");
  if (jumpToAiBtn) jumpToAiBtn.onclick = scrollToAiCompanion;
  const runSandboxBtn = document.getElementById("run-sandbox-btn");
  if (runSandboxBtn) runSandboxBtn.onclick = runSandboxQuery;
  const resetSandboxBtn = document.getElementById("reset-sandbox-btn");
  if (resetSandboxBtn) resetSandboxBtn.onclick = resetSandbox;
  const loadLessonBtn = document.getElementById("load-lesson-query-btn");
  if (loadLessonBtn) loadLessonBtn.onclick = syncSandboxStarterQuery;
  const sendAiBtn = document.getElementById("send-ai-btn");
  if (sendAiBtn) sendAiBtn.onclick = () => sendAiMessage();
  const clearAiBtn = document.getElementById("clear-ai-btn");
  if (clearAiBtn) clearAiBtn.onclick = clearAiChat;
  document.querySelectorAll(".quick-ai-btn").forEach((btn) => btn.onclick = () => sendAiMessage(btn.dataset.aiPrompt || ""));

  const toggleBtn = document.getElementById("toggle-levels-panel-btn");
  const panel = document.getElementById("levels-panel");
  if (toggleBtn && panel) {
    toggleBtn.onclick = () => {
      panel.classList.toggle("collapsed");
      toggleBtn.innerText = panel.classList.contains("collapsed") ? "Expand" : "Collapse";
      toggleBtn.setAttribute("aria-expanded", panel.classList.contains("collapsed") ? "false" : "true");
    };
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  normalizeCurriculum();
  loadProgress();
  if (!appState.currentCategoryId) appState.currentCategoryId = getTrack().categories[0]?.id || null;
  if (!appState.currentLessonId) appState.currentLessonId = getTrack().categories[0]?.lessons[0]?.id || null;
  if (!appState.currentView) appState.currentView = "overview";
  initUiActions();
  initSchemaResizer();
  await initDatabase();
  await initializeSandboxDatabase();
  renderAiMessages();
  renderAll();
  window.addEventListener("scroll", hideAchievementTooltip, true);
  window.addEventListener("resize", hideAchievementTooltip);
});
