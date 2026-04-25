const STORAGE_KEY = "careops_curriculum_master_v2";

let appState = {
  currentTrackId: "track_foundations",
  currentCategoryId: null,
  currentLessonId: null,
  currentView: "overview",
  completedLessonIds: [],
  firstTryLessonIds: [],
  schemaPanelWidth: 320,
  lessonStats: {},
  expandedCategoryIds: [],
  glossarySearch: "",
  glossaryCategory: ""
};

let SQL = null;
let sqlDb = null;
let sqlEngineReady = false;
let attempts = 0;
let lastRunQuery = "";
let activeDifficultyFilter = null;

const LEARNING_LEVELS = [
  { label: "Foundations", key: "foundations", color: "#22c55e", trackId: "track_foundations" }
  ];
  

const BUSINESS_LOGIC_MAP = {
  revenue_net_vs_gross: {
    analystFrame: "You are preparing a board-facing revenue cycle summary.",
    promptIntro: "Using the charges table, write a SQL query that:",
    rules: [
      {
        match: /sum\s*\(\s*amount\s*\)\s*\*\s*0?\.82/i,
        explanation: "estimates net revenue by assuming the organization realizes 82% of gross charges"
      },
      {
        match: /sum\s*\(\s*amount\s*\)\s+as\s+gross_charges/i,
        explanation: "calculates total gross charges"
      },
      {
        match: /sum\s*\(\s*amount\s*\)/i,
        explanation: "calculates total gross charges"
      }
    ],
    executiveQuestion: "How much gross billed value is likely to convert into collectible net revenue?"
  },
  los_summary: {
    analystFrame: "You are preparing a board-facing throughput and capacity summary.",
    promptIntro: "Using the encounters table, write a SQL query that:",
    rules: [
      {
        match: /count\s*\(\s*\*\s*\)\s+as\s+encounter_count/i,
        explanation: "returns total encounter volume"
      },
      {
        match: /avg\s*\(\s*length_of_stay\s*\)/i,
        explanation: "calculates average length of stay (LOS)"
      }
    ],
    executiveQuestion: "Is patient flow trending efficiently, or are longer stays creating operational pressure?"
  },
  departmental_utilization: {
    analystFrame: "You are summarizing service-line and department utilization for leadership.",
    promptIntro: "Using the encounters table, write a SQL query that:",
    rules: [
      {
        match: /group\s+by\s+department/i,
        explanation: "summarizes encounter activity by department"
      },
      {
        match: /count\s*\(\s*\*\s*\)/i,
        explanation: "returns encounter volume for each department"
      }
    ],
    executiveQuestion: "Which departments are driving the highest utilization and where should leaders focus throughput review?"
  },
  facility_rollup: {
    analystFrame: "You are preparing a facility-level operating summary for executives.",
    promptIntro: "Using the encounters table, write a SQL query that:",
    rules: [
      {
        match: /group\s+by\s+facility/i,
        explanation: "summarizes results at the facility level"
      },
      {
        match: /group\s+by\s+facility\s*,\s*department/i,
        explanation: "summarizes results by facility and department"
      },
      {
        match: /count\s*\(\s*\*\s*\)/i,
        explanation: "returns encounter volume for each reporting group"
      }
    ],
    executiveQuestion: "How is volume distributed across facilities and operational units?"
  },
  payer_mix: {
    analystFrame: "You are preparing a payer-mix summary for financial leadership.",
    promptIntro: "Using the patients or claims table, write a SQL query that:",
    rules: [
      {
        match: /distinct\s+insurance_type/i,
        explanation: "identifies the payer categories represented in the data"
      },
      {
        match: /group\s+by\s+.*payer|group\s+by\s+.*insurance_type/i,
        explanation: "summarizes the population by payer category"
      },
      {
        match: /count\s*\(\s*\*\s*\)/i,
        explanation: "returns the population size for each payer segment"
      }
    ],
    executiveQuestion: "What payer categories shape reimbursement risk and financial exposure?"
  },
  join_population_enrichment: {
    analystFrame: "You are combining operational and demographic data for executive reporting.",
    promptIntro: "Using the related hospital tables, write a SQL query that:",
    rules: [
      {
        match: /\bjoin\b/i,
        explanation: "links the necessary tables so leaders can view the complete business picture"
      }
    ],
    executiveQuestion: "What additional patient, provider, or financial context is needed to interpret the operational results?"
  }
};

const GLOSSARY_TERMS = [
  { term: "SELECT", category: "sql", definition: "Returns the columns you ask for from a table or query.", why: "SELECT is the starting point for almost every SQL query an analyst writes.", example: "SELECT patient_id, insurance_type FROM patients;" },
  { term: "WHERE", category: "sql", definition: "Filters rows so only matching records are returned.", why: "It lets analysts focus on the exact population or event they need to study.", example: "SELECT * FROM encounters WHERE length_of_stay > 5;" },
  { term: "GROUP BY", category: "sql", definition: "Bundles rows into groups so you can summarize them.", why: "Most hospital dashboards depend on grouped results by facility, department, payer, or provider.", example: "SELECT facility, COUNT(*) FROM encounters GROUP BY facility;" },
  { term: "ORDER BY", category: "sql", definition: "Sorts query results in ascending or descending order.", why: "Sorting helps leaders quickly see the highest volume, highest LOS, or biggest denial drivers first.", example: "SELECT * FROM charges ORDER BY amount DESC;" },
  { term: "JOIN", category: "sql", definition: "Combines related data from multiple tables.", why: "Hospital analysis often requires linking operational, financial, and patient context together.", example: "SELECT * FROM encounters e JOIN claims c ON e.encounter_id = c.encounter_id;" },
  { term: "COUNT", category: "sql", definition: "Counts rows or non-null values.", why: "It is the foundation of encounter volume, appointment counts, and other basic KPIs.", example: "SELECT COUNT(*) AS encounter_count FROM encounters;" },
  { term: "AVG", category: "sql", definition: "Calculates the average value for a field.", why: "Analysts use AVG for LOS, delays, payment amounts, and many throughput metrics.", example: "SELECT AVG(length_of_stay) AS avg_los FROM encounters;" },
  { term: "SUM", category: "sql", definition: "Adds values together across matching rows.", why: "Revenue, charges, denied dollars, and volumes often rely on SUM.", example: "SELECT SUM(billed_amount) AS total_billed FROM claims;" },
  { term: "DISTINCT", category: "sql", definition: "Returns only unique values and removes duplicates.", why: "Useful when an analyst needs a clean list of facilities, payers, or departments.", example: "SELECT DISTINCT payer FROM claims;" },
  { term: "NULL", category: "sql", definition: "Represents a missing or unknown value.", why: "Null handling matters when a result may look complete but actually contains missing data.", example: "SELECT * FROM patients WHERE city IS NULL;" },
  { term: "Primary Key", category: "sql", definition: "A field that uniquely identifies each row in a table.", why: "Primary keys help preserve row-level uniqueness and support correct joins.", example: "patient_id uniquely identifies each patient row." },
  { term: "Foreign Key", category: "sql", definition: "A field that links one table to another.", why: "Foreign keys let analysts connect patients to encounters, claims, and charges.", example: "encounters.patient_id links back to patients.patient_id." },
  { term: "Encounter", category: "clinical", definition: "A single patient visit or stay recorded in the system.", why: "Many hospital metrics are encounter-based, not patient-based, so the grain matters.", example: "One patient may have multiple encounters in a year." },
  { term: "Admission", category: "clinical", definition: "The point when a patient is formally admitted for care.", why: "Admission timing affects LOS, bed usage, and throughput measures.", example: "An inpatient admission usually starts the LOS clock." },
  { term: "Discharge", category: "clinical", definition: "The point when a patient leaves the hospital or unit.", why: "Discharge delays affect capacity, patient flow, and operational efficiency.", example: "A delayed discharge can increase LOS without changing clinical need." },
  { term: "Length of Stay (LOS)", category: "clinical", definition: "The amount of time a patient spends in care between admission and discharge.", why: "LOS is one of the most important throughput and capacity metrics in hospital operations.", example: "A patient admitted Monday and discharged Wednesday has a LOS of about 2 days." },
  { term: "Observation", category: "clinical", definition: "A short-stay status used when a patient needs evaluation or treatment without full inpatient admission.", why: "Observation status affects reimbursement, throughput, and reporting logic.", example: "Observation hours are often tracked separately from inpatient days." },
  { term: "Readmission", category: "clinical", definition: "A return to the hospital after a recent discharge, often within 30 days.", why: "Readmissions can signal discharge planning, follow-up, or care coordination issues.", example: "A patient discharged Friday and readmitted two weeks later may count as a readmission." },
  { term: "ED Boarder", category: "clinical", definition: "A patient who remains in the emergency department while waiting for an inpatient or observation bed.", why: "Boarders can signal bed constraints, discharge bottlenecks, or hospital flow problems.", example: "High ED boarding often reflects inpatient capacity pressure." },
  { term: "Code 44", category: "clinical", definition: "A status change that converts a patient from inpatient to observation when criteria were not met for inpatient admission.", why: "Code 44 affects utilization review, compliance, and observation reporting.", example: "A patient admitted as inpatient may later be changed to observation under Code 44." },
  { term: "Discharge Disposition", category: "clinical", definition: "The destination or care setting a patient goes to after discharge.", why: "Disposition helps explain follow-up needs, placement delays, and readmission risk.", example: "Common dispositions include home, SNF, rehab, and hospice." },
  { term: "Provider", category: "clinical", definition: "The clinician or practitioner responsible for the patient visit or service.", why: "Provider-level analysis can reveal performance variation and workflow differences.", example: "A provider may be grouped by specialty, department, or facility." },
  { term: "Charge", category: "financial", definition: "The billed amount attached to a service or encounter before payment adjustments.", why: "Charges represent gross activity, but not all charges turn into collectible revenue.", example: "Facility and professional charges may both be linked to one encounter." },
  { term: "Claim", category: "financial", definition: "A request for payment sent to a payer for services rendered.", why: "Claims are the basis for reimbursement tracking, denials, and revenue cycle monitoring.", example: "A denied claim may require correction and resubmission." },
  { term: "Denial", category: "financial", definition: "A claim or service that a payer refuses to reimburse.", why: "Denials create revenue leakage and often reveal workflow or documentation problems.", example: "Authorization, coding, and coverage issues can all lead to denials." },
  { term: "Denial Rate", category: "financial", definition: "The share of claims or dollars that are denied by payers.", why: "It helps leaders measure financial leakage and prioritize revenue cycle improvement.", example: "A 9% denial rate means roughly 9 out of 100 claims or claim dollars are denied, depending on the definition used." },
  { term: "Payer", category: "financial", definition: "The organization or program responsible for reimbursing a claim.", why: "Payer segmentation often explains reimbursement, denial, and LOS variation.", example: "Common payer groups include Medicare, Medicaid, Commercial, and Self Pay." },
  { term: "Payer Mix", category: "financial", definition: "The distribution of patients, visits, or dollars across payer categories.", why: "Payer mix shapes reimbursement risk, margin, and financial planning.", example: "A facility with more Medicare and Medicaid may have a different financial profile than one with more commercial volume." },
  { term: "Gross Charges", category: "financial", definition: "The full billed amount before adjustments, write-offs, and collections.", why: "Gross charges show billing activity but usually overstate true realized revenue.", example: "Gross charges are often used as the starting point for estimating net revenue." },
  { term: "Net Revenue", category: "financial", definition: "The portion of gross charges that the organization expects to realize after contractual adjustments and nonpayment.", why: "Net revenue is a more realistic measure of financial performance than gross charges alone.", example: "Some analyses estimate net revenue as a percentage of gross charges." },
  { term: "Collections", category: "financial", definition: "Actual cash received from payers or patients.", why: "Collections matter because billed charges alone do not equal money received.", example: "A hospital may bill one amount but collect less after payer adjudication." },
  { term: "RVU", category: "financial", definition: "Relative Value Unit, a standardized measure of service intensity often used in provider compensation and productivity.", why: "RVUs help compare provider output even when procedures differ.", example: "A provider contract may include RVU-based compensation targets." },
  { term: "KPI", category: "analytics", definition: "Key Performance Indicator, a metric used to monitor whether performance is on target.", why: "KPIs focus leadership attention on the few measures that matter most.", example: "LOS, readmission rate, and denial rate are common hospital KPIs." },
  { term: "Benchmark", category: "analytics", definition: "A comparison point used to judge whether performance is strong, average, or weak.", why: "Benchmarks help leaders know whether a number is actually good or bad.", example: "A denial rate may be compared against an internal or industry benchmark." },
  { term: "Baseline", category: "analytics", definition: "The starting level of performance before changes or interventions are made.", why: "You need a baseline to show whether improvement actually happened.", example: "Average LOS before a throughput initiative becomes the baseline for future comparison." },
  { term: "Trend", category: "analytics", definition: "The direction a metric moves over time.", why: "One isolated number may be misleading, but a trend shows whether performance is improving or worsening.", example: "Monthly readmission trend lines often reveal sustained deterioration or improvement." },
  { term: "Variance", category: "analytics", definition: "The difference between expected and actual performance.", why: "Variance helps identify where a process or unit is performing outside normal expectations.", example: "A department may show high LOS variance compared with the organizational average." },
  { term: "Root Cause", category: "analytics", definition: "The underlying reason a problem is happening.", why: "Without root cause analysis, teams treat symptoms rather than the real operational driver.", example: "High LOS may be caused by placement delays, not physician rounding speed." },
  { term: "Outlier", category: "analytics", definition: "A value or case that stands out as unusually high, low, or different from the rest.", why: "Outliers can distort averages but also reveal important operational stories.", example: "One department with far higher LOS than others may be an outlier worth investigation." },
  { term: "Cohort", category: "analytics", definition: "A defined group of records analyzed together because they share a common trait.", why: "Cohorts let analysts study targeted populations with more relevant comparisons.", example: "All Medicare inpatient encounters discharged home can be a cohort." },
  { term: "Aggregation", category: "analytics", definition: "The process of summarizing data into counts, sums, averages, or grouped outputs.", why: "Aggregation turns row-level data into decision-ready reporting.", example: "Grouping by facility and counting encounters is a simple aggregation." },
  { term: "Throughput", category: "analytics", definition: "How efficiently patients move through the care process.", why: "Throughput connects LOS, boarding, discharge timing, and capacity.", example: "A rise in discharge delays often harms throughput across the hospital." },
  { term: "Bottleneck", category: "analytics", definition: "A step in the process that slows down the overall system.", why: "Finding bottlenecks helps leaders know where to intervene first.", example: "Placement delays, pending consults, or transport waits can become bottlenecks." }
];

function glossaryCategoryLabel(category) {
  return {
    sql: "SQL",
    clinical: "Clinical / Operations",
    financial: "Financial / Revenue",
    analytics: "Analytics / Strategy"
  }[category] || "Reference";
}

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
    id: "track_foundations",
    title: "Foundations",
    description: "Foundations learning path for CareOps hospital analytics.",
    order: 1,
    categories: [
      {
        id: "foundations_core",
        title: "Understanding Hospital Data",
        order: 1,
        lessons: [
          {
            kind: "concept",
            id: "f1",
            title: "What Is Hospital Data?",
            objective: "Understand the main types of hospital data and why each serves a different business purpose.",
            sql_focus: ["Clinical data", "Operational data", "Financial data"],
            relevantTables: ["encounters", "claims", "charges"],
            joinHint: "No join is needed for this lesson.",
            summary: "Hospital data is not one giant spreadsheet. It is a collection of different data types that capture patient care, operations, and reimbursement.",
            bullets: [
              "Clinical data describes what happened medically, such as diagnoses, procedures, and care decisions.",
              "Operational data describes how care moved through the system, such as encounters, departments, and visit dates.",
              "Financial data describes how services were billed and reimbursed, such as charges and claims.",
              "A strong analyst starts by identifying what kind of question is being asked before choosing a dataset.",
              "The same patient can generate clinical, operational, and financial records during one episode of care."
            ],
            example: "Hospital example: an ED visit creates an encounter record for the visit itself, a claim for reimbursement activity, and charge rows for billed services.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f2",
            title: "Identify the Data Type",
            objective: "Match a business question to the right kind of hospital data.",
            challengeMode: "text",
            sql_focus: ["Reasoning", "Dataset selection"],
            relevantTables: ["encounters", "claims", "charges"],
            joinHint: "Think about whether the question is about care, operations, or money.",
            challengeCriteria: `For each question below, identify the primary type of data you would start with and explain why.

1. Emergency department wait times
2. Total billed charges for a hospital stay
3. Diagnosis trends by quarter

Use the categories clinical, operational, and financial in your explanation.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 70,
            requiredConceptGroups: [
              ["operational"],
              ["financial"],
              ["clinical"]
            ],
            requiredConceptMatches: 3,
            bonusConceptGroups: [
              ["wait", "wait times", "throughput", "flow"],
              ["charges", "billed", "billing", "reimbursement"],
              ["diagnosis", "diagnoses", "condition", "medical"]
            ],
            feedbackGuide: "Correct — ED wait times are operational, billed charges are financial, and diagnosis trends are clinical.",
            exemplarAnswer: `Emergency department wait times are operational because they describe how patients move through care. Total billed charges are financial because they measure billing and reimbursement activity. Diagnosis trends are clinical because they describe patient conditions and medical patterns.`,
            hint: "Tie each question to what it is really measuring: care, operations, or money.",
            smartHint: "Wait times are operational, billed charges are financial, and diagnoses are clinical.",
            thirdHint: "Use all three category words in your response and explain each one briefly.",
            explanation: "This challenge builds the habit of matching the business question to the correct data domain before you ever write SQL.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "f3",
            title: "Tables, Rows, and Columns",
            objective: "Understand how relational tables organize hospital data into records and fields.",
            sql_focus: ["Table structure", "Rows", "Columns"],
            relevantTables: ["patients", "encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "A table stores one subject at a time. Rows are records, and columns are the fields that describe each record.",
            bullets: [
              "A patients table should describe people, while an encounters table should describe visits or stays.",
              "Columns such as patient_id, encounter_id, department, and visit_date tell you what information is available.",
              "Rows tell the story one record at a time.",
              "Before analyzing anything, an analyst should understand what one row represents.",
              "Good SQL starts with good table reading."
            ],
            example: "Hospital example: in encounters, one row is likely one visit. In patients, one row is likely one patient.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f4",
            title: "Interpret the Table Structure",
            objective: "Explain what one row most likely represents in a table.",
            challengeMode: "text",
            sql_focus: ["Reasoning", "Row meaning"],
            relevantTables: ["encounters"],
            joinHint: "Look for the most specific identifier in the column list.",
            challengeCriteria: `You are given a table with these columns: patient_id, encounter_id, department, and visit_date.

Explain what one row in this table most likely represents and why.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 45,
            requiredConceptGroups: [
              ["encounter", "visit", "patient visit", "visit level", "encounter level"]
            ],
            requiredConceptMatches: 1,
            bonusConceptGroups: [
              ["encounter_id"],
              ["multiple", "more than once", "repeat", "same patient", "many visits"]
            ],
            feedbackGuide: "Correct — one row most likely represents a single encounter or patient visit.",
            exemplarAnswer: `One row most likely represents a single encounter, or patient visit. The clue is that the table includes encounter_id and visit_date, which suggests visit-level activity rather than one row per patient. A patient could appear more than once if they had multiple encounters.`,
            hint: "Do not explain only what patient_id means. Explain what the whole row means.",
            smartHint: "A strong answer says the row is one encounter or one patient visit.",
            thirdHint: "Mentioning encounter_id helps, but the main idea is that the row is visit-level.",
            explanation: "This challenge trains you to identify row meaning first. The key learning goal is recognizing that the row is visit-level, not forcing one exact explanation.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "f5",
            title: "What Is a Record? (Grain)",
            objective: "Understand that grain means what one row represents and why it changes the business answer.",
            sql_focus: ["Grain", "Row-level meaning"],
            relevantTables: ["patients", "encounters", "charges"],
            joinHint: "No join is needed for this lesson.",
            summary: "Grain is the row-level meaning of a table. If you misunderstand grain, your counts and conclusions will be wrong.",
            bullets: [
              "One row in patients usually means one patient.",
              "One row in encounters usually means one visit or stay.",
              "One row in charges usually means one billed line item or charge event.",
              "The same patient can appear once in patients, several times in encounters, and many times in charges.",
              "Analysts must align the table grain with the business question."
            ],
            example: "Hospital example: one patient with three ED visits may appear once in patients, three times in encounters, and several more times in charges.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f6",
            title: "Choose the Right Table for the Question",
            objective: "Use grain to explain which table is the better starting point.",
            challengeMode: "text",
            sql_focus: ["Reasoning", "Grain", "Table choice"],
            relevantTables: ["patients", "encounters"],
            joinHint: "The wording of the business question should guide your table choice.",
            challengeCriteria: `A leader asks, "How many patients came to the hospital last month?"

Which table is the better starting point: patients or encounters? Explain your reasoning.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 45,
            requiredConceptGroups: [
              ["encounters", "encounter"]
            ],
            requiredConceptMatches: 1,
            bonusConceptGroups: [
              ["visit", "activity", "last month", "time period"],
              ["distinct", "unique", "patient_id"],
              ["multiple", "more than one", "many visits", "multiple encounters"]
            ],
            feedbackGuide: "Correct — encounters is the better starting point because the question is about who came in during a time period, which is visit activity.",
            exemplarAnswer: `Encounters is the better starting point because the question is about hospital activity during a time period, and encounters records the visits that actually happened. From there, you would make sure you count unique patients rather than overstating people with multiple visits.`,
            hint: "The phrase last month points toward visit activity rather than the static patient list.",
            smartHint: "Start with the table that records visits. Mentioning unique patients is a strong extra detail, but not required for full credit.",
            thirdHint: "A good answer says encounters is better because the question is about who came in during a time period.",
            explanation: "This challenge is about choosing the right starting table. Naming encounters with a sound reason should pass; DISTINCT is a stronger follow-up point, not a required phrase.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "f7",
            title: "Relationships Between Tables",
            objective: "Understand how common hospital tables relate before learning formal joins.",
            sql_focus: ["Patient → encounter → department", "Relationships"],
            relevantTables: ["patients", "encounters", "departments"],
            joinHint: "No join is needed for this lesson.",
            summary: "Hospital tables are connected. Patients have encounters, encounters happen in departments, and those relationships let analysts answer more complete questions.",
            bullets: [
              "Patients describe who received care.",
              "Encounters describe when and where a visit happened.",
              "Departments describe the operational unit involved in that visit.",
              "You do not need to memorize every relationship at once, but you must know that tables are connected by keys.",
              "Understanding the relationship path helps you choose the right starting table and avoids unnecessary joins later."
            ],
            example: "Hospital example: to understand which department saw the most patients, you usually start with encounters because that table records the visit and the department connected to it.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f8",
            title: "Follow the Data Flow",
            objective: "Choose the best dataset to start with for an operational question.",
            challengeMode: "text",
            sql_focus: ["Reasoning", "Dataset selection"],
            relevantTables: ["patients", "encounters", "charges"],
            joinHint: "Start with the table that directly captures the event being measured.",
            challengeCriteria: `You are asked, "Which department saw the most patients last week?"

Should you start with patients, encounters, or charges? Explain your reasoning.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 18,
            requiredConceptGroups: [
              ["encounters", "encounter"]
            ],
            requiredConceptMatches: 1,
            bonusConceptGroups: [
              ["department"],
              ["last week", "time period", "visit", "activity"],
              ["charges", "financial", "patients table", "patient table"]
            ],
            feedbackGuide: "Correct — encounters is the best starting point because the question is about department-level visit activity over time.",
            exemplarAnswer: `You should start with encounters because the question is about visit activity over time, and encounters records both the visit and the department tied to it. Patients is too static for this question, and charges is financial rather than operational.`,
            hint: "The best starting table is the one that directly records visits in departments.",
            smartHint: "Encounters ties the event, the department, and the time period together.",
            thirdHint: "A strong answer names encounters and explains that the question is about department-level visit activity.",
            explanation: "This challenge builds the habit of starting with the table that best matches the event being measured. Naming encounters with the right general reason should pass.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "f9",
            title: "Scenario: What Data Do I Even Use?",
            objective: "Apply Section 1 concepts to explain the best starting point for ED volume analysis.",
            relevantTables: ["patients", "encounters", "charges"],
            joinHint: "Focus on which table best represents ED visit activity before worrying about calculations.",
            summary: "An analyst is asked to analyze ED volume and must decide where to start.",
            prompt: "You are asked to analyze emergency department volume for last month. You have access to patients, encounters, and charges. Explain which table you would start with and why. In your response, mention table grain, visit activity, and why the other tables are not the best first choice.",
            expectedKeywords: ["encounters", "grain", "visit", "patients", "charges", "volume"],
            minLength: 110,
            minimumKeywordMatches: 3,
            feedbackGuide: "A strong answer starts with encounters because ED volume is a visit-based operational question and explains why patients and charges are not the best first table.",
            executiveTakeaway: { show: false }
          }
        ]
      },
      {
        id: "foundations_selecting_data",
        title: "Selecting & Exploring Data",
        order: 2,
        lessons: [
          {
            kind: "concept",
            id: "s1",
            title: "SELECT Basics",
            objective: "Understand how to choose relevant columns from a table.",
            sql_focus: ["SELECT"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "SELECT chooses which columns to return from a table.",
            bullets: [
              "You should only pull the data you need.",
              "Selecting fewer columns improves performance and readability.",
              "Good analysts are intentional about what they select.",
              "The business question should decide which fields belong in the output.",
              "Exploration is easier when you start with a focused set of columns."
            ],
            example: "Hospital example: to review ED activity, you might select patient_id, encounter_id, department, and admit_date from encounters.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s2",
            title: "Select Key Fields",
            objective: "Return a focused set of encounter columns.",
            sql_focus: ["SELECT", "FROM"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return patient_id, encounter_id, and admit_date from encounters.",
            starterQuery: "",
            solutionQuery: "SELECT patient_id, encounter_id, admit_date FROM encounters;",
            hint: "List the columns explicitly in the SELECT statement.",
            smartHint: "Use patient_id, encounter_id, and admit_date in that order or any order.",
            thirdHint: "SELECT patient_id, encounter_id, admit_date FROM encounters;",
            explanation: "Selecting specific columns keeps the query efficient and keeps the learner focused on the fields that matter.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "s3",
            title: "SELECT *",
            objective: "Understand when to use SELECT * and when to avoid it.",
            sql_focus: ["SELECT *"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "SELECT * returns all columns from a table.",
            bullets: [
              "It can be useful for quick exploration when you do not yet know the dataset well.",
              "It is usually a bad habit in production queries and dashboards.",
              "Large hospital tables can become messy and slower when you pull every column.",
              "Focused output is usually better for analysts and much better for leaders.",
              "Use SELECT * to learn first, then narrow down to what you actually need."
            ],
            example: "Hospital example: an analyst may use SELECT * FROM encounters during exploration, then replace it with a cleaner query once the needed fields are known.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s4",
            title: "Return All Columns",
            objective: "Pull the full encounters dataset for exploration.",
            sql_focus: ["SELECT *", "FROM"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all columns from encounters.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters;",
            hint: "Use the wildcard operator.",
            smartHint: "The asterisk returns every column in the table.",
            thirdHint: "SELECT * FROM encounters;",
            explanation: "This challenge teaches how to explore quickly, while the concept explains why this should not become your default habit.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "s5",
            title: "LIMIT / TOP",
            objective: "Preview data safely without pulling the full table.",
            sql_focus: ["LIMIT"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "LIMIT restricts the number of rows returned.",
            bullets: [
              "LIMIT is one of the safest ways to preview unfamiliar data.",
              "It prevents unnecessarily loading large datasets during exploration.",
              "Analysts often preview first before building a more targeted query.",
              "Previewing a small sample can help catch field issues and table grain problems early.",
              "TOP serves a similar purpose in some SQL dialects, but this app uses LIMIT."
            ],
            example: "Hospital example: when checking a large encounters table, an analyst might return only 10 rows first to inspect the fields before filtering further.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s6",
            title: "Preview Data",
            objective: "Return only 10 rows from encounters.",
            sql_focus: ["SELECT *", "FROM", "LIMIT"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return 10 rows from encounters.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters LIMIT 10;",
            hint: "Use LIMIT to restrict the result size.",
            smartHint: "Start with SELECT * FROM encounters and add LIMIT 10.",
            thirdHint: "SELECT * FROM encounters LIMIT 10;",
            explanation: "Previewing data is critical before deeper analysis because it lets you inspect the shape of the table without returning everything.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "s7",
            title: "Aliases (AS)",
            objective: "Make SQL output easier for humans to read.",
            sql_focus: ["AS"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "Aliases rename columns in the output.",
            bullets: [
              "Aliases make raw field names more readable.",
              "They are especially helpful when sharing outputs with non-technical audiences.",
              "Clear output is part of good analysis, not just good presentation.",
              "Aliases do not change the underlying table. They only change the returned column name.",
              "Good analysts translate database language into business language."
            ],
            example: 'Hospital example: encounter_id AS "Visit ID" makes the result easier for a manager to understand than encounter_id alone.',
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s8",
            title: "Rename Fields",
            objective: "Use aliases to create a more readable output.",
            sql_focus: ["SELECT", "AS", "FROM"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: 'Rename encounter_id to "Visit ID" in the output.',
            starterQuery: "",
            solutionQuery: 'SELECT encounter_id AS "Visit ID" FROM encounters;',
            hint: "Use AS to rename the column.",
            smartHint: 'Write encounter_id AS "Visit ID" inside the SELECT statement.',
            thirdHint: 'SELECT encounter_id AS "Visit ID" FROM encounters;',
            explanation: "Readable outputs are critical in real reporting because the audience often cares more about clarity than raw field names.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "s9",
            title: "Scenario: Initial Data Pull",
            objective: "Pull a clean preview of encounter data for review.",
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this scenario.",
            summary: "A manager asks for a clean preview of encounter data before a deeper review.",
            prompt: "Write a query that selects relevant fields from encounters, renames at least one column for readability, and limits the results so the manager gets only a clean preview.",
            expectedKeywords: ["select", "from", "limit", "as"],
            minLength: 20,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer uses the encounters table, selects a focused set of fields, makes at least one field more readable, and limits the number of rows returned.",
            executiveTakeaway: { show: false }
          }
        ]
      },
      {
        id: "foundations_filtering_questions",
        title: "Filtering for Real Questions",
        order: 3,
        lessons: [
          {
            kind: "concept",
            id: "t1",
            title: "WHERE Basics",
            objective: "Understand that WHERE limits rows to only the records that match the business question.",
            sql_focus: ["WHERE"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "WHERE is how analysts stop looking at everything and start looking at the right population.",
            bullets: [
              "WHERE filters records before results are returned.",
              "It is one of the most important tools in SQL.",
              "Good filtering starts with the exact wording of the business question.",
              "A weak analyst pulls everything. A strong analyst narrows the dataset intentionally.",
              "If leadership asks about one department, one payer, or one population, WHERE is usually involved."
            ],
            example: "Hospital example: if a leader asks about ED visits, you should not query all encounters. You should filter to only encounters where department equals Emergency Department.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "t2",
            title: "Filter ED Visits",
            objective: "Filter the encounters table to only emergency department visits.",
            sql_focus: ["SELECT", "FROM", "WHERE"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all rows from encounters where department equals 'Emergency Department'.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters WHERE department = 'Emergency Department';",
            hint: "Start with SELECT * FROM encounters and then add a WHERE filter.",
            smartHint: "Use the department column and match the department name exactly.",
            thirdHint: "SELECT * FROM encounters WHERE department = 'Emergency Department';",
            explanation: "This is the first step in moving from broad exploration to question-driven analysis. The filter should match the business ask directly.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "t3",
            title: "Comparison Operators",
            objective: "Use comparison operators to find records above, below, or equal to a threshold.",
            sql_focus: ["WHERE", "=", ">", "<", ">=", "<="],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "Comparison operators let analysts turn threshold-based questions into SQL.",
            bullets: [
              "= checks for exact matches.",
              "> and < check whether a value is above or below a threshold.",
              ">= and <= include the threshold itself.",
              "These operators are common in LOS, charges, risk scores, and turnaround time analysis.",
              "The operator you choose changes the population you return."
            ],
            example: "Hospital example: if leadership wants to review long-stay encounters, you need a threshold such as length_of_stay greater than 3 days.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "t4",
            title: "Find Long-Stay Encounters",
            objective: "Return encounters with length_of_stay greater than 3 days.",
            sql_focus: ["SELECT", "FROM", "WHERE", ">"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all rows from encounters where length_of_stay is greater than 3.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters WHERE length_of_stay > 3;",
            hint: "Use a numeric comparison operator.",
            smartHint: "You are not looking for exactly 3. You are looking for more than 3.",
            thirdHint: "SELECT * FROM encounters WHERE length_of_stay > 3;",
            explanation: "This query teaches how business thresholds become filter logic. A leader says long stay, and the analyst defines the threshold clearly.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "t5",
            title: "AND / OR Logic",
            objective: "Use multiple conditions in one filter.",
            sql_focus: ["WHERE", "AND", "OR"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "AND narrows the result. OR broadens it.",
            bullets: [
              "AND means both conditions must be true.",
              "OR means either condition can be true.",
              "The business question tells you which one to use.",
              "Bad logic changes the population and can completely distort the answer.",
              "Always ask whether the question is asking for overlap or for multiple possible groups."
            ],
            example: "Hospital example: if a manager wants ED encounters with length_of_stay greater than 3 days, both conditions must be true.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "t6",
            title: "Filter High-LOS ED Encounters",
            objective: "Return emergency department encounters with length_of_stay above 3 days.",
            sql_focus: ["SELECT", "FROM", "WHERE", "AND"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all rows from encounters where department equals 'Emergency Department' and length_of_stay is greater than 3.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters WHERE department = 'Emergency Department' AND length_of_stay > 3;",
            hint: "Both conditions must be true.",
            smartHint: "Use AND, not OR.",
            thirdHint: "SELECT * FROM encounters WHERE department = 'Emergency Department' AND length_of_stay > 3;",
            explanation: "This query narrows the population to only the encounters that match both the operational setting and the threshold.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "t7",
            title: "IN / NOT IN",
            objective: "Use grouped filtering instead of writing repeated OR statements.",
            sql_focus: ["WHERE", "IN", "NOT IN"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "IN is a cleaner way to filter for several allowed values at once.",
            bullets: [
              "IN is often easier to read than multiple OR conditions.",
              "NOT IN excludes groups of values.",
              "This is common when leaders ask about several departments, facilities, or payers.",
              "Readability matters in production SQL.",
              "Cleaner SQL is easier to maintain and easier for teammates to understand."
            ],
            example: "Hospital example: if leadership wants to review Emergency Department and ICU activity together, IN is cleaner than repeating OR.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "t8",
            title: "Filter Multiple Departments",
            objective: "Return encounters from the Emergency Department and ICU.",
            sql_focus: ["SELECT", "FROM", "WHERE", "IN"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all rows from encounters where department is either 'Emergency Department' or 'ICU'.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters WHERE department IN ('Emergency Department', 'ICU');",
            hint: "Use one grouped filter instead of two separate equals conditions.",
            smartHint: "IN (...) is the cleanest syntax here.",
            thirdHint: "SELECT * FROM encounters WHERE department IN ('Emergency Department', 'ICU');",
            explanation: "This challenge teaches cleaner filter structure. The output may match an OR query, but IN is usually more readable and easier to maintain.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "t9",
            title: "Scenario: Find High-Risk Encounters",
            objective: "Combine filters and logic to identify encounters that need review.",
            relevantTables: ["encounters"],
            joinHint: "Use one table well before trying to expand to multiple tables.",
            summary: "A leader wants a list of encounters that may need operational review.",
            prompt: "Build a query that returns encounters that meet both of these conditions: the department is 'Emergency Department' and the length_of_stay is greater than 3. Your query should use the encounters table and return only the population that needs review.",
            expectedKeywords: ["select", "where", "and", "department", "length_of_stay"],
            minLength: 35,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer identifies that this is a two-condition filter, uses the encounters table, and applies both conditions with AND.",
            executiveTakeaway: { show: false }
          }
        ]
      },
      {
        id: "foundations_sorting_interpreting",
        title: "Sorting & Interpreting Results",
        order: 4,
        lessons: [
          {
            kind: "concept",
            id: "s16",
            title: "ORDER BY Basics",
            objective: "Understand how to sort query results.",
            sql_focus: ["ORDER BY"],
            relevantTables: ["encounters"],
            joinHint: "No join needed.",
            summary: "ORDER BY controls how results are sorted.",
            bullets: [
              "Sorting helps you understand patterns in data.",
              "Most analysis requires ordering results.",
              "Default sort is ascending (ASC)."
            ],
            example: "SELECT * FROM encounters ORDER BY visit_date;",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s17",
            title: "Sort by Date",
            objective: "Order encounters by visit date.",
            sql_focus: ["ORDER BY"],
            relevantTables: ["encounters"],
            challengeCriteria: "Return all encounters sorted by visit_date.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters ORDER BY visit_date;",
            hint: "Use ORDER BY.",
            smartHint: "ORDER BY visit_date",
            thirdHint: "SELECT * FROM encounters ORDER BY visit_date;",
            explanation: "Sorting by date allows you to view records chronologically.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "s18",
            title: "ASC vs DESC",
            objective: "Understand sort direction.",
            sql_focus: ["ASC", "DESC"],
            relevantTables: ["encounters"],
            joinHint: "No join needed.",
            summary: "ASC sorts low to high. DESC sorts high to low.",
            bullets: [
              "DESC is commonly used for most recent or highest values.",
              "ASC is useful for timelines or smallest values.",
              "Direction changes interpretation."
            ],
            example: "SELECT * FROM encounters ORDER BY visit_date DESC;",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s19",
            title: "Most Recent Visits",
            objective: "Return newest encounters first.",
            sql_focus: ["ORDER BY", "DESC"],
            relevantTables: ["encounters"],
            challengeCriteria: "Return encounters sorted with the most recent visits first.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters ORDER BY visit_date DESC;",
            hint: "Use DESC.",
            smartHint: "ORDER BY visit_date DESC",
            thirdHint: "SELECT * FROM encounters ORDER BY visit_date DESC;",
            explanation: "Descending order shows most recent activity first.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "s20",
            title: "Multiple Sort Fields",
            objective: "Sort by more than one column.",
            sql_focus: ["ORDER BY multiple"],
            relevantTables: ["encounters"],
            joinHint: "No join needed.",
            summary: "You can sort by multiple columns to organize results more precisely.",
            bullets: [
              "First column controls primary order.",
              "Second column breaks ties.",
              "Multi-column sorting is useful for grouped analysis."
            ],
            example: "SELECT * FROM encounters ORDER BY department, visit_date DESC;",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s21",
            title: "Sort by Department and Date",
            objective: "Apply multi-column sorting.",
            sql_focus: ["ORDER BY"],
            relevantTables: ["encounters"],
            challengeCriteria: "Sort encounters by department, then by most recent visit_date.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters ORDER BY department, visit_date DESC;",
            hint: "Use two columns in ORDER BY.",
            smartHint: "ORDER BY department, visit_date DESC",
            thirdHint: "SELECT * FROM encounters ORDER BY department, visit_date DESC;",
            explanation: "Multi-column sorting helps structure grouped data.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "s22",
            title: "Interpreting Results",
            objective: "Understand what query output actually means.",
            sql_focus: ["Interpretation"],
            relevantTables: ["encounters"],
            joinHint: "No join needed.",
            summary: "SQL output is useless unless you can explain what it means.",
            bullets: [
              "Data answers questions, but analysts must interpret it.",
              "Sorting highlights trends and outliers.",
              "Analysts must translate data into insight.",
              "Executives do not want raw data. They want meaning.",
              "A strong analyst explains the operational implication of the result."
            ],
            example: "Hospital example: if the top results show high LOS, that may indicate capacity issues, discharge delays, or complex cases.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s23",
            title: "Explain the Output",
            objective: "Translate data into plain English.",
            challengeMode: "text",
            sql_focus: ["Interpretation"],
            relevantTables: ["encounters"],
            challengeCriteria: `You run a query and see the top 5 encounters with the longest length_of_stay.

Explain what this result means and why it matters.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 50,
            requiredConceptGroups: [
              ["long", "length of stay", "los"],
              ["impact", "important", "matters", "problem", "issue"]
            ],
            requiredConceptMatches: 1,
            feedbackGuide: "Correct — long length of stay can indicate operational or capacity issues.",
            exemplarAnswer: `This result shows the encounters with the longest length of stay, which may indicate inefficiencies, complex cases, or delays in discharge. This matters because long stays impact hospital capacity and cost.`,
            hint: "Think about why long stays matter operationally.",
            smartHint: "Long LOS affects capacity and cost.",
            thirdHint: "Explain both what it shows and why it matters.",
            explanation: "This is the first step in thinking like an analyst, not just writing SQL.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "s24",
            title: "Scenario: Executive Request",
            objective: "Deliver sorted and interpretable data.",
            relevantTables: ["encounters"],
            joinHint: "Use sorting to make the output useful, then explain the meaning.",
            summary: "A leader wants insight, not raw data.",
            prompt: `A hospital executive asks: "Show me the most recent high-cost encounters."

Write a query AND explain what the result means.

Your answer must:
- filter relevant encounters
- sort results
- explain what leadership should take away`,
            expectedKeywords: ["select", "where", "order", "desc"],
            minLength: 80,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer includes sorting, filtering, and a clear explanation of what leadership should learn from the data.",
            executiveTakeaway: { show: false }
          }
        ]
      },
      {
        id: "foundations_data_quality",
        title: "Data Quality & Analyst Thinking",
        order: 5,
        lessons: [
          {
            kind: "concept",
            id: "dq1",
            title: "Why Data Quality Matters",
            objective: "Understand how bad data leads to bad decisions.",
            sql_focus: ["Data validation", "Trust"],
            relevantTables: ["encounters", "patients"],
            joinHint: "No join needed.",
            summary: "Bad data leads to bad decisions. Analysts must question the data before trusting it.",
            bullets: [
              "Executives assume data is correct unless told otherwise.",
              "Missing or incorrect data can completely distort results.",
              "Analysts are responsible for validating outputs.",
              "Trust in analytics is built on data quality.",
              "Always question results that feel off."
            ],
            example: "Hospital example: if ED visits suddenly drop to zero, it is likely a data issue, not reality.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "dq2",
            title: "Spot the Data Issue",
            objective: "Recognize when results likely indicate bad data.",
            challengeMode: "text",
            sql_focus: ["Reasoning"],
            relevantTables: ["encounters"],
            challengeCriteria: `You run a report and see that emergency department visits dropped to zero last week.

Explain why this is likely a data issue and not a real operational change.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 50,
            requiredConceptGroups: [
              ["data issue", "error", "incorrect", "problem"],
              ["unlikely", "unrealistic", "not possible"]
            ],
            requiredConceptMatches: 1,
            feedbackGuide: "Correct — a sudden drop to zero is almost always a data issue.",
            exemplarAnswer: `A sudden drop to zero ED visits is extremely unlikely in a real hospital setting, which suggests a data issue such as missing records, ETL failure, or incorrect filtering rather than a true operational change.`,
            hint: "Think about whether zero visits is realistic.",
            smartHint: "Hospitals do not suddenly stop seeing patients.",
            thirdHint: "Call out that this is likely a data error, not reality.",
            explanation: "Analysts must challenge results that do not make sense before presenting them.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "dq3",
            title: "NULL Values",
            objective: "Understand how missing data appears and impacts analysis.",
            sql_focus: ["NULL"],
            relevantTables: ["encounters"],
            joinHint: "No join needed.",
            summary: "NULL means missing data, not zero.",
            bullets: [
              "NULL represents unknown or missing values.",
              "NULL is not the same as 0.",
              "Ignoring NULLs can skew results.",
              "Analysts must decide how to handle missing data.",
              "Data completeness is part of data quality."
            ],
            example: "Hospital example: a missing discharge date does not mean the patient stayed zero days.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "dq4",
            title: "Handle Missing Data",
            objective: "Filter out NULL values.",
            sql_focus: ["WHERE", "IS NOT NULL"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all encounters where discharge_date is not NULL.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters WHERE discharge_date IS NOT NULL;",
            hint: "Use IS NOT NULL.",
            smartHint: "NULL cannot be compared with =.",
            thirdHint: "SELECT * FROM encounters WHERE discharge_date IS NOT NULL;",
            explanation: "Handling NULL values correctly is critical for accurate analysis.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "dq5",
            title: "Duplicates & Overcounting",
            objective: "Understand how duplicate rows inflate results.",
            sql_focus: ["DISTINCT"],
            relevantTables: ["encounters"],
            joinHint: "No join needed.",
            summary: "Duplicates can inflate counts and mislead decision-making.",
            bullets: [
              "Duplicate rows can double-count activity.",
              "Counting rows is not always the same as counting unique entities.",
              "DISTINCT is used to remove duplicates.",
              "Understanding grain prevents overcounting.",
              "Always verify what you are counting."
            ],
            example: "Hospital example: counting rows in encounters may overcount patients if they had multiple visits.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "dq6",
            title: "Count Unique Patients",
            objective: "Avoid duplicate counting.",
            sql_focus: ["COUNT", "DISTINCT"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Count the number of unique patients in encounters.",
            starterQuery: "",
            solutionQuery: "SELECT COUNT(DISTINCT patient_id) FROM encounters;",
            hint: "Use DISTINCT inside COUNT.",
            smartHint: "COUNT(DISTINCT patient_id)",
            thirdHint: "SELECT COUNT(DISTINCT patient_id) FROM encounters;",
            explanation: "This prevents overcounting patients with multiple visits.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "dq7",
            title: "Sanity Checking Results",
            objective: "Validate whether results make sense before sharing.",
            sql_focus: ["Validation"],
            relevantTables: ["encounters"],
            joinHint: "No join needed.",
            summary: "Good analysts validate results before presenting them.",
            bullets: [
              "Always check if results are realistic.",
              "Compare against expectations or prior trends.",
              "Extreme values should be investigated.",
              "Small mistakes can create large errors.",
              "Validation builds trust with leadership."
            ],
            example: "Hospital example: if LOS averages jump from 3 days to 30 days overnight, something is wrong.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "dq8",
            title: "Explain a Suspicious Result",
            objective: "Interpret questionable output.",
            challengeMode: "text",
            sql_focus: ["Interpretation"],
            relevantTables: ["encounters"],
            challengeCriteria: `You calculate average length_of_stay and get 45 days.

Explain why this result is likely incorrect and what you would check.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 60,
            requiredConceptGroups: [
              ["incorrect", "wrong", "issue", "problem"],
              ["check", "validate", "investigate"]
            ],
            requiredConceptMatches: 1,
            feedbackGuide: "Correct — the value is unrealistic and requires validation.",
            exemplarAnswer: `An average length of stay of 45 days is unusually high and likely incorrect. I would check for data errors such as missing discharge dates, duplicate rows, or incorrect filters that could inflate the result.`,
            hint: "Does 45 days sound realistic?",
            smartHint: "Think about data errors like duplicates or NULLs.",
            thirdHint: "Explain both why it is wrong and what you would check.",
            explanation: "Analysts must validate outputs before sharing them with leadership.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "dq9",
            title: "Scenario: Analyst Reality Check",
            objective: "Validate results before presenting to leadership.",
            relevantTables: ["encounters"],
            joinHint: "Think about validation checks before presenting to leadership.",
            summary: "A leader is about to act on your data.",
            prompt: `You are about to present a report showing a sudden spike in hospital volume.

Explain how you would validate the data before presenting it and what checks you would perform.`,
            expectedKeywords: ["validate", "check", "data", "error"],
            minLength: 90,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer includes validation steps and data quality checks before presenting.",
            executiveTakeaway: { show: false }
          }
        ]
      }
    ]
  }
];

backfillChallengeCriteria(curriculum);
enforceChallengeCriteria(curriculum);

appState.currentTrackId = "track_foundations";
appState.currentCategoryId = "foundation_core";
 
const track = curriculum.find(item => item.id === level.trackId);

if (!track) {
  console.error("Track not found for level:", level);
  return null; // prevents crash
}

const totalCategories = track.categories.length;

 
backfillChallengeCriteria(curriculum);
enforceChallengeCriteria(curriculum);

appState.currentTrackId = "track_foundations";
appState.currentCategoryId = "foundations_core";

Get Outlook for iOS
From: Josh Hulsey <jhulsey@tidelandshealth.org>
Sent: Friday, April 24, 2026 8:35:04 AM
To: Josh Hulsey <jhulsey@tidelandshealth.org>
Subject: Re:
 
const curriculum = [
  {
    id: "track_foundations",
    title: "Foundations",
    description: "Foundations learning path for CareOps hospital analytics.",
    order: 1,
    categories: [
      {
        id: "foundations_core",
        title: "Understanding Hospital Data",
        order: 1,
        lessons: [
          {
            kind: "concept",
            id: "f1",
            title: "What Is Hospital Data?",
            objective: "Understand the main types of hospital data and why each serves a different business purpose.",
            sql_focus: ["Clinical data", "Operational data", "Financial data"],
            relevantTables: ["encounters", "claims", "charges"],
            joinHint: "No join is needed for this lesson.",
            summary: "Hospital data is not one giant spreadsheet. It is a collection of different data types that capture patient care, operations, and reimbursement.",
            bullets: [
              "Clinical data describes what happened medically, such as diagnoses, procedures, and care decisions.",
              "Operational data describes how care moved through the system, such as encounters, departments, and visit dates.",
              "Financial data describes how services were billed and reimbursed, such as charges and claims.",
              "A strong analyst starts by identifying what kind of question is being asked before choosing a dataset.",
              "The same patient can generate clinical, operational, and financial records during one episode of care."
            ],
            example: "Hospital example: an ED visit creates an encounter record for the visit itself, a claim for reimbursement activity, and charge rows for billed services.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f2",
            title: "Identify the Data Type",
            objective: "Match a business question to the right kind of hospital data.",
            challengeMode: "text",
            sql_focus: ["Reasoning", "Dataset selection"],
            relevantTables: ["encounters", "claims", "charges"],
            joinHint: "Think about whether the question is about care, operations, or money.",
            challengeCriteria: `For each question below, identify the primary type of data you would start with and explain why.

1. Emergency department wait times
2. Total billed charges for a hospital stay
3. Diagnosis trends by quarter

Use the categories clinical, operational, and financial in your explanation.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 70,
            requiredConceptGroups: [
              ["operational"],
              ["financial"],
              ["clinical"]
            ],
            requiredConceptMatches: 3,
            bonusConceptGroups: [
              ["wait", "wait times", "throughput", "flow"],
              ["charges", "billed", "billing", "reimbursement"],
              ["diagnosis", "diagnoses", "condition", "medical"]
            ],
            feedbackGuide: "Correct — ED wait times are operational, billed charges are financial, and diagnosis trends are clinical.",
            exemplarAnswer: `Emergency department wait times are operational because they describe how patients move through care. Total billed charges are financial because they measure billing and reimbursement activity. Diagnosis trends are clinical because they describe patient conditions and medical patterns.`,
            hint: "Tie each question to what it is really measuring: care, operations, or money.",
            smartHint: "Wait times are operational, billed charges are financial, and diagnoses are clinical.",
            thirdHint: "Use all three category words in your response and explain each one briefly.",
            explanation: "This challenge builds the habit of matching the business question to the correct data domain before you ever write SQL.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "f3",
            title: "Tables, Rows, and Columns",
            objective: "Understand how relational tables organize hospital data into records and fields.",
            sql_focus: ["Table structure", "Rows", "Columns"],
            relevantTables: ["patients", "encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "A table stores one subject at a time. Rows are records, and columns are the fields that describe each record.",
            bullets: [
              "A patients table should describe people, while an encounters table should describe visits or stays.",
              "Columns such as patient_id, encounter_id, department, and visit_date tell you what information is available.",
              "Rows tell the story one record at a time.",
              "Before analyzing anything, an analyst should understand what one row represents.",
              "Good SQL starts with good table reading."
            ],
            example: "Hospital example: in encounters, one row is likely one visit. In patients, one row is likely one patient.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f4",
            title: "Interpret the Table Structure",
            objective: "Explain what one row most likely represents in a table.",
            challengeMode: "text",
            sql_focus: ["Reasoning", "Row meaning"],
            relevantTables: ["encounters"],
            joinHint: "Look for the most specific identifier in the column list.",
            challengeCriteria: `You are given a table with these columns: patient_id, encounter_id, department, and visit_date.

Explain what one row in this table most likely represents and why.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 45,
            requiredConceptGroups: [
              ["encounter", "visit", "patient visit", "visit level", "encounter level"]
            ],
            requiredConceptMatches: 1,
            bonusConceptGroups: [
              ["encounter_id"],
              ["multiple", "more than once", "repeat", "same patient", "many visits"]
            ],
            feedbackGuide: "Correct — one row most likely represents a single encounter or patient visit.",
            exemplarAnswer: `One row most likely represents a single encounter, or patient visit. The clue is that the table includes encounter_id and visit_date, which suggests visit-level activity rather than one row per patient. A patient could appear more than once if they had multiple encounters.`,
            hint: "Do not explain only what patient_id means. Explain what the whole row means.",
            smartHint: "A strong answer says the row is one encounter or one patient visit.",
            thirdHint: "Mentioning encounter_id helps, but the main idea is that the row is visit-level.",
            explanation: "This challenge trains you to identify row meaning first. The key learning goal is recognizing that the row is visit-level, not forcing one exact explanation.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "f5",
            title: "What Is a Record? (Grain)",
            objective: "Understand that grain means what one row represents and why it changes the business answer.",
            sql_focus: ["Grain", "Row-level meaning"],
            relevantTables: ["patients", "encounters", "charges"],
            joinHint: "No join is needed for this lesson.",
            summary: "Grain is the row-level meaning of a table. If you misunderstand grain, your counts and conclusions will be wrong.",
            bullets: [
              "One row in patients usually means one patient.",
              "One row in encounters usually means one visit or stay.",
              "One row in charges usually means one billed line item or charge event.",
              "The same patient can appear once in patients, several times in encounters, and many times in charges.",
              "Analysts must align the table grain with the business question."
            ],
            example: "Hospital example: one patient with three ED visits may appear once in patients, three times in encounters, and several more times in charges.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f6",
            title: "Choose the Right Table for the Question",
            objective: "Use grain to explain which table is the better starting point.",
            challengeMode: "text",
            sql_focus: ["Reasoning", "Grain", "Table choice"],
            relevantTables: ["patients", "encounters"],
            joinHint: "The wording of the business question should guide your table choice.",
            challengeCriteria: `A leader asks, "How many patients came to the hospital last month?"

Which table is the better starting point: patients or encounters? Explain your reasoning.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 45,
            requiredConceptGroups: [
              ["encounters", "encounter"]
            ],
            requiredConceptMatches: 1,
            bonusConceptGroups: [
              ["visit", "activity", "last month", "time period"],
              ["distinct", "unique", "patient_id"],
              ["multiple", "more than one", "many visits", "multiple encounters"]
            ],
            feedbackGuide: "Correct — encounters is the better starting point because the question is about who came in during a time period, which is visit activity.",
            exemplarAnswer: `Encounters is the better starting point because the question is about hospital activity during a time period, and encounters records the visits that actually happened. From there, you would make sure you count unique patients rather than overstating people with multiple visits.`,
            hint: "The phrase last month points toward visit activity rather than the static patient list.",
            smartHint: "Start with the table that records visits. Mentioning unique patients is a strong extra detail, but not required for full credit.",
            thirdHint: "A good answer says encounters is better because the question is about who came in during a time period.",
            explanation: "This challenge is about choosing the right starting table. Naming encounters with a sound reason should pass; DISTINCT is a stronger follow-up point, not a required phrase.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "f7",
            title: "Relationships Between Tables",
            objective: "Understand how common hospital tables relate before learning formal joins.",
            sql_focus: ["Patient → encounter → department", "Relationships"],
            relevantTables: ["patients", "encounters", "departments"],
            joinHint: "No join is needed for this lesson.",
            summary: "Hospital tables are connected. Patients have encounters, encounters happen in departments, and those relationships let analysts answer more complete questions.",
            bullets: [
              "Patients describe who received care.",
              "Encounters describe when and where a visit happened.",
              "Departments describe the operational unit involved in that visit.",
              "You do not need to memorize every relationship at once, but you must know that tables are connected by keys.",
              "Understanding the relationship path helps you choose the right starting table and avoids unnecessary joins later."
            ],
            example: "Hospital example: to understand which department saw the most patients, you usually start with encounters because that table records the visit and the department connected to it.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f8",
            title: "Follow the Data Flow",
            objective: "Choose the best dataset to start with for an operational question.",
            challengeMode: "text",
            sql_focus: ["Reasoning", "Dataset selection"],
            relevantTables: ["patients", "encounters", "charges"],
            joinHint: "Start with the table that directly captures the event being measured.",
            challengeCriteria: `You are asked, "Which department saw the most patients last week?"

Should you start with patients, encounters, or charges? Explain your reasoning.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 18,
            requiredConceptGroups: [
              ["encounters", "encounter"]
            ],
            requiredConceptMatches: 1,
            bonusConceptGroups: [
              ["department"],
              ["last week", "time period", "visit", "activity"],
              ["charges", "financial", "patients table", "patient table"]
            ],
            feedbackGuide: "Correct — encounters is the best starting point because the question is about department-level visit activity over time.",
            exemplarAnswer: `You should start with encounters because the question is about visit activity over time, and encounters records both the visit and the department tied to it. Patients is too static for this question, and charges is financial rather than operational.`,
            hint: "The best starting table is the one that directly records visits in departments.",
            smartHint: "Encounters ties the event, the department, and the time period together.",
            thirdHint: "A strong answer names encounters and explains that the question is about department-level visit activity.",
            explanation: "This challenge builds the habit of starting with the table that best matches the event being measured. Naming encounters with the right general reason should pass.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "f9",
            title: "Scenario: What Data Do I Even Use?",
            objective: "Apply Section 1 concepts to explain the best starting point for ED volume analysis.",
            relevantTables: ["patients", "encounters", "charges"],
            joinHint: "Focus on which table best represents ED visit activity before worrying about calculations.",
            summary: "An analyst is asked to analyze ED volume and must decide where to start.",
            prompt: "You are asked to analyze emergency department volume for last month. You have access to patients, encounters, and charges. Explain which table you would start with and why. In your response, mention table grain, visit activity, and why the other tables are not the best first choice.",
            expectedKeywords: ["encounters", "grain", "visit", "patients", "charges", "volume"],
            minLength: 110,
            minimumKeywordMatches: 3,
            feedbackGuide: "A strong answer starts with encounters because ED volume is a visit-based operational question and explains why patients and charges are not the best first table.",
            executiveTakeaway: { show: false }
          }
        ]
      },
      {
        id: "foundations_selecting_data",
        title: "Selecting & Exploring Data",
        order: 2,
        lessons: [
          {
            kind: "concept",
            id: "s1",
            title: "SELECT Basics",
            objective: "Understand how to choose relevant columns from a table.",
            sql_focus: ["SELECT"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "SELECT chooses which columns to return from a table.",
            bullets: [
              "You should only pull the data you need.",
              "Selecting fewer columns improves performance and readability.",
              "Good analysts are intentional about what they select.",
              "The business question should decide which fields belong in the output.",
              "Exploration is easier when you start with a focused set of columns."
            ],
            example: "Hospital example: to review ED activity, you might select patient_id, encounter_id, department, and admit_date from encounters.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s2",
            title: "Select Key Fields",
            objective: "Return a focused set of encounter columns.",
            sql_focus: ["SELECT", "FROM"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return patient_id, encounter_id, and admit_date from encounters.",
            starterQuery: "",
            solutionQuery: "SELECT patient_id, encounter_id, admit_date FROM encounters;",
            hint: "List the columns explicitly in the SELECT statement.",
            smartHint: "Use patient_id, encounter_id, and admit_date in that order or any order.",
            thirdHint: "SELECT patient_id, encounter_id, admit_date FROM encounters;",
            explanation: "Selecting specific columns keeps the query efficient and keeps the learner focused on the fields that matter.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "s3",
            title: "SELECT *",
            objective: "Understand when to use SELECT * and when to avoid it.",
            sql_focus: ["SELECT *"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "SELECT * returns all columns from a table.",
            bullets: [
              "It can be useful for quick exploration when you do not yet know the dataset well.",
              "It is usually a bad habit in production queries and dashboards.",
              "Large hospital tables can become messy and slower when you pull every column.",
              "Focused output is usually better for analysts and much better for leaders.",
              "Use SELECT * to learn first, then narrow down to what you actually need."
            ],
            example: "Hospital example: an analyst may use SELECT * FROM encounters during exploration, then replace it with a cleaner query once the needed fields are known.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s4",
            title: "Return All Columns",
            objective: "Pull the full encounters dataset for exploration.",
            sql_focus: ["SELECT *", "FROM"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all columns from encounters.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters;",
            hint: "Use the wildcard operator.",
            smartHint: "The asterisk returns every column in the table.",
            thirdHint: "SELECT * FROM encounters;",
            explanation: "This challenge teaches how to explore quickly, while the concept explains why this should not become your default habit.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "s5",
            title: "LIMIT / TOP",
            objective: "Preview data safely without pulling the full table.",
            sql_focus: ["LIMIT"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "LIMIT restricts the number of rows returned.",
            bullets: [
              "LIMIT is one of the safest ways to preview unfamiliar data.",
              "It prevents unnecessarily loading large datasets during exploration.",
              "Analysts often preview first before building a more targeted query.",
              "Previewing a small sample can help catch field issues and table grain problems early.",
              "TOP serves a similar purpose in some SQL dialects, but this app uses LIMIT."
            ],
            example: "Hospital example: when checking a large encounters table, an analyst might return only 10 rows first to inspect the fields before filtering further.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s6",
            title: "Preview Data",
            objective: "Return only 10 rows from encounters.",
            sql_focus: ["SELECT *", "FROM", "LIMIT"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return 10 rows from encounters.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters LIMIT 10;",
            hint: "Use LIMIT to restrict the result size.",
            smartHint: "Start with SELECT * FROM encounters and add LIMIT 10.",
            thirdHint: "SELECT * FROM encounters LIMIT 10;",
            explanation: "Previewing data is critical before deeper analysis because it lets you inspect the shape of the table without returning everything.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "s7",
            title: "Aliases (AS)",
            objective: "Make SQL output easier for humans to read.",
            sql_focus: ["AS"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "Aliases rename columns in the output.",
            bullets: [
              "Aliases make raw field names more readable.",
              "They are especially helpful when sharing outputs with non-technical audiences.",
              "Clear output is part of good analysis, not just good presentation.",
              "Aliases do not change the underlying table. They only change the returned column name.",
              "Good analysts translate database language into business language."
            ],
            example: 'Hospital example: encounter_id AS "Visit ID" makes the result easier for a manager to understand than encounter_id alone.',
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "s8",
            title: "Rename Fields",
            objective: "Use aliases to create a more readable output.",
            sql_focus: ["SELECT", "AS", "FROM"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: 'Rename encounter_id to "Visit ID" in the output.',
            starterQuery: "",
            solutionQuery: 'SELECT encounter_id AS "Visit ID" FROM encounters;',
            hint: "Use AS to rename the column.",
            smartHint: 'Write encounter_id AS "Visit ID" inside the SELECT statement.',
            thirdHint: 'SELECT encounter_id AS "Visit ID" FROM encounters;',
            explanation: "Readable outputs are critical in real reporting because the audience often cares more about clarity than raw field names.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "s9",
            title: "Scenario: Initial Data Pull",
            objective: "Pull a clean preview of encounter data for review.",
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this scenario.",
            summary: "A manager asks for a clean preview of encounter data before a deeper review.",
            prompt: "Write a query that selects relevant fields from encounters, renames at least one column for readability, and limits the results so the manager gets only a clean preview.",
            expectedKeywords: ["select", "from", "limit", "as"],
            minLength: 20,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer uses the encounters table, selects a focused set of fields, makes at least one field more readable, and limits the number of rows returned.",
            executiveTakeaway: { show: false }
          }
        ]
      },
      {
        id: "foundations_filtering_questions",
        title: "Filtering for Real Questions",
        order: 3,
        lessons: [
          {
            kind: "concept",
            id: "t1",
            title: "WHERE Basics",
            objective: "Understand that WHERE limits rows to only the records that match the business question.",
            sql_focus: ["WHERE"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "WHERE is how analysts stop looking at everything and start looking at the right population.",
            bullets: [
              "WHERE filters records before results are returned.",
              "It is one of the most important tools in SQL.",
              "Good filtering starts with the exact wording of the business question.",
              "A weak analyst pulls everything. A strong analyst narrows the dataset intentionally.",
              "If leadership asks about one department, one payer, or one population, WHERE is usually involved."
            ],
            example: "Hospital example: if a leader asks about ED visits, you should not query all encounters. You should filter to only encounters where department equals Emergency Department.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "t2",
            title: "Filter ED Visits",
            objective: "Filter the encounters table to only emergency department visits.",
            sql_focus: ["SELECT", "FROM", "WHERE"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all rows from encounters where department equals 'Emergency Department'.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters WHERE department = 'Emergency Department';",
            hint: "Start with SELECT * FROM encounters and then add a WHERE filter.",
            smartHint: "Use the department column and match the department name exactly.",
            thirdHint: "SELECT * FROM encounters WHERE department = 'Emergency Department';",
            explanation: "This is the first step in moving from broad exploration to question-driven analysis. The filter should match the business ask directly.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "t3",
            title: "Comparison Operators",
            objective: "Use comparison operators to find records above, below, or equal to a threshold.",
            sql_focus: ["WHERE", "=", ">", "<", ">=", "<="],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "Comparison operators let analysts turn threshold-based questions into SQL.",
            bullets: [
              "= checks for exact matches.",
              "> and < check whether a value is above or below a threshold.",
              ">= and <= include the threshold itself.",
              "These operators are common in LOS, charges, risk scores, and turnaround time analysis.",
              "The operator you choose changes the population you return."
            ],
            example: "Hospital example: if leadership wants to review long-stay encounters, you need a threshold such as length_of_stay greater than 3 days.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "t4",
            title: "Find Long-Stay Encounters",
            objective: "Return encounters with length_of_stay greater than 3 days.",
            sql_focus: ["SELECT", "FROM", "WHERE", ">"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all rows from encounters where length_of_stay is greater than 3.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters WHERE length_of_stay > 3;",
            hint: "Use a numeric comparison operator.",
            smartHint: "You are not looking for exactly 3. You are looking for more than 3.",
            thirdHint: "SELECT * FROM encounters WHERE length_of_stay > 3;",
            explanation: "This query teaches how business thresholds become filter logic. A leader says long stay, and the analyst defines the threshold clearly.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "t5",
            title: "AND / OR Logic",
            objective: "Use multiple conditions in one filter.",
            sql_focus: ["WHERE", "AND", "OR"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "AND narrows the result. OR broadens it.",
            bullets: [
              "AND means both conditions must be true.",
              "OR means either condition can be true.",
              "The business question tells you which one to use.",
              "Bad logic changes the population and can completely distort the answer.",
              "Always ask whether the question is asking for overlap or for multiple possible groups."
            ],
            example: "Hospital example: if a manager wants ED encounters with length_of_stay greater than 3 days, both conditions must be true.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "t6",
            title: "Filter High-LOS ED Encounters",
            objective: "Return emergency department encounters with length_of_stay above 3 days.",
            sql_focus: ["SELECT", "FROM", "WHERE", "AND"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all rows from encounters where department equals 'Emergency Department' and length_of_stay is greater than 3.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters WHERE department = 'Emergency Department' AND length_of_stay > 3;",
            hint: "Both conditions must be true.",
            smartHint: "Use AND, not OR.",
            thirdHint: "SELECT * FROM encounters WHERE department = 'Emergency Department' AND length_of_stay > 3;",
            explanation: "This query narrows the population to only the encounters that match both the operational setting and the threshold.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "t7",
            title: "IN / NOT IN",
            objective: "Use grouped filtering instead of writing repeated OR statements.",
            sql_focus: ["WHERE", "IN", "NOT IN"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "IN is a cleaner way to filter for several allowed values at once.",
            bullets: [
              "IN is often easier to read than multiple OR conditions.",
              "NOT IN excludes groups of values.",
              "This is common when leaders ask about several departments, facilities, or payers.",
              "Readability matters in production SQL.",
              "Cleaner SQL is easier to maintain and easier for teammates to understand."
            ],
            example: "Hospital example: if leadership wants to review Emergency Department and ICU activity together, IN is cleaner than repeating OR.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "t8",
            title: "Filter Multiple Departments",
            objective: "Return encounters from the Emergency Department and ICU.",
            sql_focus: ["SELECT", "FROM", "WHERE", "IN"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: "Return all rows from encounters where department is either 'Emergency Department' or 'ICU'.",
            starterQuery: "",
            solutionQuery: "SELECT * FROM encounters WHERE department IN ('Emergency Department', 'ICU');",
            hint: "Use one grouped filter instead of two separate equals conditions.",
            smartHint: "IN (...) is the cleanest syntax here.",
            thirdHint: "SELECT * FROM encounters WHERE department IN ('Emergency Department', 'ICU');",
            explanation: "This challenge teaches cleaner filter structure. The output may match an OR query, but IN is usually more readable and easier to maintain.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "t9",
            title: "Scenario: Find High-Risk Encounters",
            objective: "Combine filters and logic to identify encounters that need review.",
            relevantTables: ["encounters"],
            joinHint: "Use one table well before trying to expand to multiple tables.",
            summary: "A leader wants a list of encounters that may need operational review.",
            prompt: "Build a query that returns encounters that meet both of these conditions: the department is 'Emergency Department' and the length_of_stay is greater than 3. Your query should use the encounters table and return only the population that needs review.",
            expectedKeywords: ["select", "where", "and", "department", "length_of_stay"],
            minLength: 35,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer identifies that this is a two-condition filter, uses the encounters table, and applies both conditions with AND.",
            executiveTakeaway: { show: false }
          }
          ]
      },
          {
  id: "foundations_sorting_interpreting",
  title: "Sorting & Interpreting Results",
  order: 4,
  lessons: [

    // LESSON 16
    {
      kind: "concept",
      id: "s16",
      title: "ORDER BY Basics",
      objective: "Understand how to sort query results.",
      sql_focus: ["ORDER BY"],
      relevantTables: ["encounters"],
      joinHint: "No join needed.",
      summary: "ORDER BY controls how results are sorted.",
      bullets: [
        "Sorting helps you understand patterns in data",
        "Most analysis requires ordering results",
        "Default sort is ascending (ASC)"
      ],
      example: "SELECT * FROM encounters ORDER BY visit_date;"
    },

    {
      kind: "challenge",
      id: "s17",
      title: "Sort by Date",
      objective: "Order encounters by visit date.",
      sql_focus: ["ORDER BY"],
      relevantTables: ["encounters"],
      challengeCriteria: `Return all encounters sorted by visit_date.`,
      solutionQuery: "SELECT * FROM encounters ORDER BY visit_date;",
      hint: "Use ORDER BY.",
      smartHint: "ORDER BY visit_date",
      thirdHint: "SELECT * FROM encounters",
      explanation: "Sorting by date allows you to view records chronologically."
    },

    // LESSON 17
    {
      kind: "concept",
      id: "s18",
      title: "ASC vs DESC",
      objective: "Understand sort direction.",
      sql_focus: ["ASC", "DESC"],
      relevantTables: ["encounters"],
      joinHint: "No join needed.",
      summary: "ASC sorts low to high. DESC sorts high to low.",
      bullets: [
        "DESC is commonly used for most recent or highest values",
        "ASC is useful for timelines or smallest values",
        "Direction changes interpretation"
      ],
      example: "SELECT * FROM encounters ORDER BY visit_date DESC;"
    },

    {
      kind: "challenge",
      id: "s19",
      title: "Most Recent Visits",
      objective: "Return newest encounters first.",
      sql_focus: ["ORDER BY", "DESC"],
      relevantTables: ["encounters"],
      challengeCriteria: `Return encounters sorted with the most recent visits first.`,
      solutionQuery: "SELECT * FROM encounters ORDER BY visit_date DESC;",
      hint: "Use DESC.",
      smartHint: "ORDER BY visit_date DESC",
      thirdHint: "SELECT * FROM encounters",
      explanation: "Descending order shows most recent activity first."
    },

    // LESSON 18
    {
      kind: "concept",
      id: "s20",
      title: "Multiple Sort Fields",
      objective: "Sort by more than one column.",
      sql_focus: ["ORDER BY multiple"],
      relevantTables: ["encounters"],
      joinHint: "No join needed.",
      summary: "You can sort by multiple columns to organize results more precisely.",
      bullets: [
        "First column controls primary order",
        "Second column breaks ties",
        "Useful for grouped analysis"
      ],
      example: "SELECT * FROM encounters ORDER BY department, visit_date DESC;"
    },

    {
      kind: "challenge",
      id: "s21",
      title: "Sort by Department and Date",
      objective: "Apply multi-column sorting.",
      sql_focus: ["ORDER BY"],
      relevantTables: ["encounters"],
      challengeCriteria: `Sort encounters by department, then by most recent visit_date.`,
      solutionQuery: "SELECT * FROM encounters ORDER BY department, visit_date DESC;",
      hint: "Use two columns in ORDER BY.",
      smartHint: "ORDER BY department, visit_date DESC",
      thirdHint: "SELECT * FROM encounters",
      explanation: "Multi-column sorting helps structure grouped data."
    },

    // LESSON 19 (🔥 DIFFERENTIATOR)
    {
      kind: "concept",
      id: "s22",
      title: "Interpreting Results",
      objective: "Understand what query output actually means.",
      sql_focus: ["Interpretation"],
      relevantTables: ["encounters"],
      joinHint: "No join needed.",
      summary: "SQL output is useless unless you can explain what it means.",
      bullets: [
        "Data answers questions — but you must interpret it",
        "Sorting highlights trends and outliers",
        "Analysts must translate data into insight",
        "Executives do not want raw data — they want meaning"
      ],
      example: "If the top results show high LOS, that may indicate capacity issues."
    },

    {
      kind: "challenge",
      id: "s23",
      title: "Explain the Output",
      objective: "Translate data into plain English.",
      challengeMode: "text",
      sql_focus: ["Interpretation"],
      relevantTables: ["encounters"],
      challengeCriteria: `You run a query and see the top 5 encounters with the longest length_of_stay.

Explain what this result means and why it matters.`,
      minLength: 50,
      requiredConceptGroups: [
        ["long", "length of stay", "los"],
        ["impact", "important", "matters", "problem", "issue"]
      ],
      requiredConceptMatches: 1,
      feedbackGuide: "Correct — long length of stay can indicate operational or capacity issues.",
      exemplarAnswer: `This result shows the encounters with the longest length of stay, which may indicate inefficiencies, complex cases, or delays in discharge. This matters because long stays impact hospital capacity and cost.`,
      hint: "Think about why long stays matter operationally.",
      smartHint: "Long LOS affects capacity and cost.",
      thirdHint: "Explain both what it shows and why it matters.",
      explanation: "This is the first step in thinking like an analyst, not just writing SQL.",
      executiveTakeaway: { show: false }
    },

    // SCENARIO (🔥 REAL ANALYST MOMENT)
    {
      kind: "scenario",
      id: "s24",
      title: "Scenario: Executive Request",
      objective: "Deliver sorted and interpretable data.",
      relevantTables: ["encounters"],
      summary: "A leader wants insight, not raw data.",
      prompt: `A hospital executive asks: "Show me the most recent high-cost encounters."

Write a query AND explain what the result means.

Your answer must:
- filter relevant encounters
- sort results
- explain what leadership should take away`,
      expectedKeywords: ["select", "where", "order", "desc"],
      minLength: 80,
      minimumKeywordMatches: 2,
      feedbackGuide: "A strong answer includes sorting, filtering, and a clear explanation of what leadership should learn from the data.",
      executiveTakeaway: { show: false }
      }
    ]
  }
    ]
  }
];

backfillChallengeCriteria(curriculum);
enforceChallengeCriteria(curriculum);

  }
];

backfillChallengeCriteria(curriculum);
enforceChallengeCriteria(curriculum);

appState.currentTrackId = "track_foundations";
appState.currentCategoryId = "foundations_core";


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
        firstTryLessonIds: parsed.firstTryLessonIds || [],
        expandedCategoryIds: parsed.expandedCategoryIds || [],
        glossarySearch: parsed.glossarySearch || "",
        glossaryCategory: parsed.glossaryCategory || ""
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
    businessContext: spec.businessContext || null,
    executiveTakeaway: spec.executiveTakeaway || null,
    challengeMode: spec.challengeMode || "sql",
    minLength: spec.minLength || 0,
    acceptedConceptGroups: spec.acceptedConceptGroups || [],
    minimumConceptMatches: spec.minimumConceptMatches || 0,
    requiredConceptGroups: spec.requiredConceptGroups || [],
    bonusConceptGroups: spec.bonusConceptGroups || [],
    requiredConceptMatches: spec.requiredConceptMatches || 0,
    feedbackGuide: spec.feedbackGuide || "",
    exemplarAnswer: spec.exemplarAnswer || ""
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

function getCategoryById(categoryId) {
  for (const track of curriculum) {
    const category = (track.categories || []).find(category => category.id === categoryId);
    if (category) return category;
  }
  return null;
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

function lessonsForTrack(trackId = appState.currentTrackId) {
  const track = curriculum.find(item => item.id === trackId) || curriculum[0];
  return (track?.categories || []).flatMap(category => category.lessons || []);
}

function allCurriculumLessons() {
  return curriculum.flatMap(track => (track.categories || []).flatMap(category => category.lessons || []));
}

function allCurriculumLessonIds() {
  return new Set(allCurriculumLessons().map(lesson => lesson.id));
}

function totalLessonCount() {
  return allCurriculumLessons().length;
}

function completedLessonCount() {
  const validIds = allCurriculumLessonIds();
  return [...new Set(appState.completedLessonIds || [])].filter(id => validIds.has(id)).length;
}

function currentTrackLessonCount() {
  return totalLessonCount();
}

function currentTrackCompletedLessonCount() {
  return completedLessonCount();
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
  return !!category && Array.isArray(category.lessons) && category.lessons.every(lesson => isLessonCompleted(lesson.id));
}

function categoryBadgeCount() {
  return getAllCategories().filter(categoryComplete).length;
}

function levelBadgeCount() {
  return LEARNING_LEVELS.filter(level => {
    const track = curriculum.find(item => item.id === level.trackId);
    return !!track && (track.categories || []).length > 0 && (track.categories || []).every(categoryComplete);
  }).length;
}

function achievements() {
  const completed = completedLessonCount();
  const firstTry = appState.firstTryLessonIds.length;
  const mastered = masteryCount();
  const catComplete = categoryId => {
  const category = getCategoryById(categoryId);
  return categoryComplete(category);
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
    { label: "Foundations Builder", earned: catComplete("foundations_core"), emoji: "🔗", description: "Unlock by completing every lesson in SQL Foundations for Hospital Data." },
    { label: "Core Analyst", earned: catComplete("core_hospital_analytics"), emoji: "👑", description: "Unlock by completing every lesson in Core Hospital Analytics." },
    { label: "Applied Investigator", earned: catComplete("applied_trends_investigation"), emoji: "🏥", description: "Unlock by completing every lesson in Applied Analytics: Trends & Investigation." },
    { label: "Root Cause Hunter", earned: catComplete("advanced_root_cause_analysis"), emoji: "📊", description: "Unlock by completing every lesson in Diagnosis: Root Cause Analysis." },
    { label: "Executive Whisperer", earned: catComplete("expert_decision_making"), emoji: "🧩", description: "Unlock by completing every lesson in Executive Analytics & Decision Making." }
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
  const total = currentTrackLessonCount();
  const completed = currentTrackCompletedLessonCount();
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
  updateLevelsPanelTheme(track.id);
}

function updateLevelsPanelTheme(trackId) {
  const panel = document.getElementById("levels-panel");
  if (!panel) return;
  panel.classList.remove(
    "track-theme-foundations",
    "track-theme-core",
    "track-theme-applied",
    "track-theme-advanced",
    "track-theme-expert"
  );
  const level = levelForTrack(trackId);
  if (!level) return;
  panel.classList.add(`track-theme-${level.key}`);
  panel.style.borderColor = level.color;
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
    const section = relationshipsWrap.closest(".schema-section");
    if (section) section.style.display = "none";
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

if (!track) {
  console.error("Track not found for level:", level);
  return null; // prevents crash
}
    const doneCategories = track.categories.filter(categoryComplete).length;
    const totalLessons = track.categories.flatMap(c => c.lessons).length;
    const doneLessons = track.categories.flatMap(c => c.lessons).filter(lesson => isLessonCompleted(lesson.id)).length;
    const percent = totalLessons ? Math.round((doneLessons.length / totalLessons) * 100) : 0;

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
      <div class="track-badge-stats">${doneCategories.length} of ${track.categories.length} sections complete</div>
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
  initUiActions();
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

function ensureCurriculumLessonListStyles() {
  if (document.getElementById("curriculum-lesson-list-style")) return;
  const style = document.createElement("style");
  style.id = "curriculum-lesson-list-style";
  style.textContent = `
    .curriculum-category {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .curriculum-category-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
    }
    .curriculum-category-main-btn {
      width: 100%;
      border: 0;
      border-radius: 14px;
      padding: 14px 16px;
      text-align: left;
      background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      cursor: pointer;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
    }
    .curriculum-category-main-btn:hover {
      filter: brightness(1.02);
    }
    .curriculum-category-main-btn .curriculum-category-title {
      color: #ffffff;
      display: block;
      font-size: 1.02rem;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    .curriculum-category-main-btn .curriculum-category-header-meta {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      color: rgba(255,255,255,0.88);
      font-size: 0.78rem;
      font-weight: 600;
    }
    .curriculum-category-main-btn .curriculum-category-meta {
      color: rgba(255,255,255,0.88);
    }
    .curriculum-category-toggle-wrap {
      display: flex;
      justify-content: center;
      margin-top: -2px;
    }
    .curriculum-category-toggle {
      border: 1px solid #dbe3f0;
      background: #ffffff;
      color: #475569;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 999px;
      line-height: 1;
      min-width: 40px;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04);
    }
    .curriculum-category-toggle:hover {
      background: #f8fafc;
      color: #111827;
      border-color: #cbd5e1;
    }
    .curriculum-category-body {
      margin-top: 0;
      padding: 8px;
      border-top: 1px solid #e5e7eb;
    }
    .curriculum-lesson-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .curriculum-lesson-row {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #ffffff;
      padding: 10px 12px;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      cursor: pointer;
    }
    .curriculum-lesson-row:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .curriculum-lesson-row.is-active {
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
    }
    .curriculum-lesson-row.is-complete .curriculum-lesson-title {
      color: #0f172a;
    }
    .curriculum-lesson-main {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .curriculum-lesson-title {
      font-size: 0.92rem;
      font-weight: 600;
      color: #111827;
      white-space: normal;
    }
    .curriculum-lesson-meta {
      font-size: 0.76rem;
      color: #6b7280;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .curriculum-lesson-status {
      font-size: 0.76rem;
      font-weight: 600;
      color: #16a34a;
      white-space: nowrap;
    }
    .curriculum-lesson-status.is-pending {
      color: #6b7280;
    }
  `;
  document.head.appendChild(style);
}

function isCategoryExpanded(categoryId) {
  return (appState.expandedCategoryIds || []).includes(categoryId);
}

function toggleCategoryExpanded(categoryId) {
  const expanded = new Set(appState.expandedCategoryIds || []);
  if (expanded.has(categoryId)) expanded.delete(categoryId);
  else expanded.add(categoryId);
  appState.expandedCategoryIds = Array.from(expanded);
  saveProgress();
  renderAll();
}

function ensureCurrentCategoryExpanded() {
  const categoryId = appState.currentCategoryId;
  if (!categoryId) return;
  const expanded = new Set(appState.expandedCategoryIds || []);
  if (!expanded.has(categoryId)) {
    expanded.add(categoryId);
    appState.expandedCategoryIds = Array.from(expanded);
  }
}

function renderCurriculumNav() {
  ensureCurriculumLessonListStyles();
  ensureCurrentCategoryExpanded();
  const list = document.getElementById("category-list");
  if (!list) return;
  list.innerHTML = "";

  getAllCategories().forEach(category => {
    const wrap = document.createElement("div");
    wrap.className = "curriculum-category";

    const total = (category.lessons || []).length;
    const done = (category.lessons || []).filter(lesson => isLessonCompleted(lesson.id)).length;
    const mastered = (category.lessons || []).filter(lesson => getLessonStats(lesson.id).mastered).length;
    const expanded = isCategoryExpanded(category.id);

    const header = document.createElement("div");
    header.className = "curriculum-category-header" + (done === total ? " is-complete" : "");
    header.innerHTML = `
      <button type="button" class="curriculum-category-main-btn" aria-label="Open ${category.title}">
        <div class="curriculum-category-main">
          <span class="curriculum-category-title">${category.title}</span>
          <div class="curriculum-category-header-meta">
            <span class="curriculum-category-meta">${done}/${total} completed</span>
            <span class="curriculum-category-meta">${mastered} mastered</span>
          </div>
        </div>
      </button>
      <div class="curriculum-category-toggle-wrap">
        <button type="button" class="curriculum-category-toggle" aria-label="${expanded ? "Collapse" : "Expand"} ${category.title}" aria-expanded="${expanded ? "true" : "false"}">${expanded ? "⌄" : "›"}</button>
      </div>
    `;

    const mainBtn = header.querySelector(".curriculum-category-main-btn");
    const toggleBtn = header.querySelector(".curriculum-category-toggle");

    mainBtn?.addEventListener("click", () => {
      appState.currentCategoryId = category.id;
      if (!appState.currentLessonId || !(category.lessons || []).find(lesson => lesson.id === appState.currentLessonId)) {
        appState.currentLessonId = category.lessons?.[0]?.id || null;
      }
      appState.currentView = "lesson";
      attempts = 0;
      ensureCurrentCategoryExpanded();
      saveProgress();
      renderAll();
    });

    toggleBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleCategoryExpanded(category.id);
    });

    wrap.appendChild(header);

    const body = document.createElement("div");
    body.className = "curriculum-category-body" + (expanded ? "" : " hidden");

    const lessonList = document.createElement("div");
    lessonList.className = "curriculum-lesson-list";

    (category.lessons || []).forEach(lesson => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "curriculum-lesson-row" +
        (lesson.id === appState.currentLessonId ? " is-active" : "") +
        (isLessonCompleted(lesson.id) ? " is-complete" : "");

      const typeLabel = lesson.type ? lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1) : "Lesson";
      const statusLabel = isLessonCompleted(lesson.id) ? "Completed" : "Not started";

      row.innerHTML = `
        <div class="curriculum-lesson-main">
          <span class="curriculum-lesson-title">${lesson.title}</span>
          <div class="curriculum-lesson-meta">
            <span>${typeLabel}</span>
          </div>
        </div>
        <span class="curriculum-lesson-status ${isLessonCompleted(lesson.id) ? "" : "is-pending"}">${statusLabel}</span>
      `;

      row.addEventListener("click", () => {
        appState.currentCategoryId = category.id;
        appState.currentLessonId = lesson.id;
        appState.currentView = "lesson";
        attempts = 0;
        ensureCurrentCategoryExpanded();
        saveProgress();
        renderAll();
      });

      lessonList.appendChild(row);
    });

    body.appendChild(lessonList);
    wrap.appendChild(body);
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


/* duplicate removed during stabilization pass */



/* duplicate removed during stabilization pass */



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


function extractWhereClause(query) {
  const match = String(query || "").match(/\bwhere\s+([\s\S]+?)(?:\s+group\s+by\s+|\s+having\s+|\s+order\s+by\s+|\s+limit\s+|;|$)/i);
  return match ? match[1].trim() : "";
}

function extractGroupByClause(query) {
  const match = String(query || "").match(/\bgroup\s+by\s+([\s\S]+?)(?:\s+having\s+|\s+order\s+by\s+|\s+limit\s+|;|$)/i);
  return match ? match[1].trim() : "";
}

function extractHavingClause(query) {
  const match = String(query || "").match(/\bhaving\s+([\s\S]+?)(?:\s+order\s+by\s+|\s+limit\s+|;|$)/i);
  return match ? match[1].trim() : "";
}

function extractOrderByClause(query) {
  const match = String(query || "").match(/\border\s+by\s+([\s\S]+?)(?:\s+limit\s+|;|$)/i);
  return match ? match[1].trim() : "";
}


function extractLimitValue(query) {
  const match = String(query || "").match(/limit\s+(\d+)/i);
  return match ? match[1] : "";
}

function cleanExpression(expr) {
  return String(expr || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/;$/, "");
}

function splitSelectColumns(selectClause) {
  if (!selectClause) return [];
  const parts = [];
  let current = "";
  let depth = 0;

  for (const char of selectClause) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function extractAlias(expr) {
  const asMatch = String(expr).match(/\bAS\s+([a-zA-Z_][\w]*)$/i);
  if (asMatch) return asMatch[1];

  const trimmed = String(expr).trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && !/[()*/+-]/.test(parts[parts.length - 2])) {
    return parts[parts.length - 1];
  }
  return null;
}

function prettifyFieldName(name) {
  return String(name || "")
    .replace(/\bavg\b/gi, "average")
    .replace(/\bqty\b/gi, "quantity")
    .replace(/\bnum\b/gi, "number")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function inferMetricType(lesson, normalizedQuery) {
  const query = String(normalizedQuery || "").toLowerCase();
  const tables = Array.isArray(lesson?.relevantTables) ? lesson.relevantTables : [];
  const firstTable = tables[0] || "";

  if (/sum\s*\(\s*amount\s*\)\s*\*\s*0?\.82/i.test(query)) return "revenue_net_vs_gross";
  if (/avg\s*\(\s*length_of_stay\s*\)/i.test(query) || /encounter_count/i.test(query)) return "los_summary";
  if (/group\s+by\s+facility\s*,\s*department/i.test(query)) return "facility_rollup";
  if (/group\s+by\s+department/i.test(query)) return "departmental_utilization";
  if (/insurance_type|payer/i.test(query) || /insurance_type|payer/i.test(firstTable)) return "payer_mix";
  if (/\bjoin\b/i.test(query)) return "join_population_enrichment";
  return null;
}

function getBusinessLogicConfig(lesson, normalizedQuery) {
  if (lesson?.businessContext?.metricType && BUSINESS_LOGIC_MAP[lesson.businessContext.metricType]) {
    return BUSINESS_LOGIC_MAP[lesson.businessContext.metricType];
  }
  const inferred = inferMetricType(lesson, normalizedQuery);
  return inferred ? BUSINESS_LOGIC_MAP[inferred] : null;
}

function formatFieldForPrompt(value) {
  return prettifyFieldName(String(value || "").replace(/\b[a-zA-Z_][\w]*\./g, ""));
}

function cleanIdentifier(value) {
  return String(value || "").replace(/\b[a-zA-Z_][\w]*\./g, "").trim();
}

function extractFunctionArg(expr, fnName) {
  const re = new RegExp(fnName + "\\s*\\((.+?)\\)", "i");
  const match = String(expr || "").match(re);
  return match ? cleanIdentifier(match[1]) : "";
}

function parseSelectExpressions(query) {
  const selectMatch = String(query || "").match(/select\s+(.+?)\s+from\s+/i);
  return splitSelectColumns(selectMatch ? selectMatch[1] : "");
}

function sentenceCase(text) {
  const s = String(text || "").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function buildWhyItMatters(lesson, config) {
  if (lesson?.businessContext?.businessGoal) return lesson.businessContext.businessGoal;
  if (lesson?.executiveTakeaway?.whyItMatters) return lesson.executiveTakeaway.whyItMatters;
  if (config?.executiveQuestion) return config.executiveQuestion;
  return "";
}

function buildExplicitTaskFromQuery(lesson) {
  const query = String(lesson?.solutionQuery || lesson?.starterQuery || "").trim();
  const normalized = cleanExpression(query);
  if (!normalized) return lesson?.objective || "Write a SQL query that satisfies the lesson objective.";

  const lower = normalized.toLowerCase();
  const baseTableMatch = normalized.match(/\bfrom\s+([a-zA-Z_][\w]*)/i);
  const baseTable = baseTableMatch ? baseTableMatch[1] : (lesson?.relevantTables?.[0] || "the relevant table");
  const selectExpressions = parseSelectExpressions(normalized);

  const whereClause = (() => {
    const m = normalized.match(/\bwhere\s+([\s\S]+?)(?:\s+group\s+by\s+|\s+having\s+|\s+order\s+by\s+|\s+limit\s+|;|$)/i);
    return m ? m[1].trim() : "";
  })();

  const groupByClause = (() => {
    const m = normalized.match(/\bgroup\s+by\s+([\s\S]+?)(?:\s+having\s+|\s+order\s+by\s+|\s+limit\s+|;|$)/i);
    return m ? m[1].trim() : "";
  })();

  const havingClause = (() => {
    const m = normalized.match(/\bhaving\s+([\s\S]+?)(?:\s+order\s+by\s+|\s+limit\s+|;|$)/i);
    return m ? m[1].trim() : "";
  })();

  const orderByClause = (() => {
    const m = normalized.match(/\border\s+by\s+([\s\S]+?)(?:\s+limit\s+|;|$)/i);
    return m ? m[1].trim() : "";
  })();

  const limitValue = extractLimitValue(normalized);

  const joinTables = [];
  const joinRegex = /\bjoin\s+([a-zA-Z_][\w]*)/gi;
  let joinHit;
  while ((joinHit = joinRegex.exec(normalized)) !== null) {
    joinTables.push(joinHit[1]);
  }

  if (/\bwhere\b[\s\S]*\bin\s*\(\s*select\b/i.test(lower)) {
    const subFrom = normalized.match(/\(\s*select[\s\S]*?\bfrom\s+([a-zA-Z_][\w]*)/i);
    const nestedTable = subFrom ? subFrom[1] : "the related table";
    const nestedWhere = normalized.match(/\(\s*select[\s\S]*?\bwhere\s+(.+?)\s*\)/i);
    const subCondition = nestedWhere ? cleanInstructionExpression(nestedWhere[1]) : "the requested condition";
    return `Return all records from the \`${baseTable}\` table for rows that match a subquery against \`${nestedTable}\`, where ${subCondition}.`;
  }

  if (/\bjoin\b/i.test(lower)) {
    const allTables = [baseTable, ...joinTables].filter(Boolean);
    const selectedFields = selectExpressions
      .map(expr => formatFieldForPrompt(expr.replace(/\s+AS\s+[a-zA-Z_][\w]*$/i, "")))
      .filter(Boolean);
    let task = `Join \`${allTables.join("\`, \`")}\` and return `;
    if (selectedFields.length === 1) {
      task += `${selectedFields[0]}.`;
    } else if (selectedFields.length > 1) {
      task += `${selectedFields.slice(0, -1).join(", ")} and ${selectedFields.slice(-1)[0]}.`;
    } else {
      task += "the requested fields.";
    }
    if (whereClause) task += ` Keep only rows where ${cleanInstructionExpression(whereClause)}.`;
    return task;
  }

  const countExpr = selectExpressions.find(expr => /\bcount\s*\(/i.test(expr));
  const avgExpr = selectExpressions.find(expr => /\bavg\s*\(/i.test(expr));
  const sumExprs = selectExpressions.filter(expr => /\bsum\s*\(/i.test(expr));
  const minExpr = selectExpressions.find(expr => /\bmin\s*\(/i.test(expr));
  const maxExpr = selectExpressions.find(expr => /\bmax\s*\(/i.test(expr));
  const distinctExpr = selectExpressions.find(expr => /\bdistinct\b/i.test(expr));
  const caseExpr = selectExpressions.find(expr => /\bcase\b/i.test(expr));
  const castExpr = selectExpressions.find(expr => /\bcast\s*\(/i.test(expr));
  const dateDiffExpr = selectExpressions.find(expr => /\bjulianday\s*\(/i.test(expr));
  const textTransformExpr = selectExpressions.find(expr => /\bupper\s*\(|\blower\s*\(|\bsubstr\s*\(|\btrim\s*\(/i.test(expr));

  if (groupByClause && countExpr) {
    const groupFields = formatFieldForPrompt(groupByClause);
    const countAlias = extractAlias(countExpr) || "count";
    let task = `Return ${countAlias.replace(/_/g, " ")} by ${groupFields} from the \`${baseTable}\` table. Group the results by ${groupFields}.`;
    if (havingClause) task += ` Keep only groups where ${cleanInstructionExpression(havingClause)}.`;
    if (orderByClause) task += ` Sort the output by ${cleanInstructionExpression(orderByClause)}.`;
    return sentenceCase(task);
  }

  if (countExpr && avgExpr && !groupByClause) {
    const countAlias = extractAlias(countExpr) || "count";
    const avgField = formatFieldForPrompt(extractFunctionArg(avgExpr, "avg"));
    const avgAlias = extractAlias(avgExpr) || "average";
    return `Return total ${countAlias.replace(/_/g, " ")} and average ${avgField} from the \`${baseTable}\` table. Label the results \`${countAlias}\` and \`${avgAlias}\`.`;
  }

  if (sumExprs.length >= 2 && /0?\.82/.test(lower)) {
    const aliases = sumExprs.map(extractAlias).filter(Boolean);
    const grossAlias = aliases.find(a => /gross/i.test(a)) || aliases[0] || "gross_total";
    const netAlias = aliases.find(a => /net/i.test(a)) || aliases[1] || "estimated_net";
    return `Return total gross charges and estimated net revenue from the \`${baseTable}\` table. Assume net revenue equals 82% of gross charges and label the results \`${grossAlias}\` and \`${netAlias}\`.`;
  }

  if (sumExprs.length === 1 && !groupByClause) {
    const sumExpr = sumExprs[0];
    const field = formatFieldForPrompt(extractFunctionArg(sumExpr, "sum"));
    const alias = extractAlias(sumExpr);
    const multiplierMatch = sumExpr.match(/\*\s*(0?\.\d+)/);
    if (multiplierMatch) {
      const percent = Math.round(parseFloat(multiplierMatch[1]) * 100);
      const aliasText = alias ? ` and label the result \`${alias}\`` : "";
      return `Calculate a derived total based on ${field} from the \`${baseTable}\` table using a ${percent}% assumption${aliasText}.`;
    }
    if (alias) return `Return total ${field} from the \`${baseTable}\` table and label the result \`${alias}\`.`;
    return `Return total ${field} from the \`${baseTable}\` table.`;
  }

  if (minExpr && maxExpr) {
    const field = formatFieldForPrompt(extractFunctionArg(minExpr, "min") || extractFunctionArg(maxExpr, "max"));
    const minAlias = extractAlias(minExpr) || "minimum_value";
    const maxAlias = extractAlias(maxExpr) || "maximum_value";
    return `Return the lowest and highest ${field} from the \`${baseTable}\` table. Label the results \`${minAlias}\` and \`${maxAlias}\`.`;
  }

  if (distinctExpr) {
    const field = formatFieldForPrompt(distinctExpr.replace(/^distinct\s+/i, "").replace(/\s+AS\s+.+$/i, ""));
    let task = `Return each unique ${field} from the \`${baseTable}\` table one time only.`;
    if (orderByClause) task += ` Sort the results by ${cleanInstructionExpression(orderByClause)}.`;
    if (limitValue) task += ` Limit the output to ${limitValue} rows.`;
    return task;
  }

  if (caseExpr) {
    const alias = extractAlias(caseExpr) || "derived_value";
    return `Return the requested base fields from the \`${baseTable}\` table and create a derived field labeled \`${alias}\` using CASE logic that matches the lesson rule.`;
  }

  if (castExpr) {
    const alias = extractAlias(castExpr) || "converted_value";
    const castArg = extractFunctionArg(castExpr, "cast");
    const field = formatFieldForPrompt(castArg.split(/\s+as\s+/i)[0]);
    return `Return the requested fields from the \`${baseTable}\` table and convert ${field} into a new data type labeled \`${alias}\`.`;
  }

  if (dateDiffExpr) {
    const alias = extractAlias(dateDiffExpr) || "date_metric";
    return `Return the requested identifier from the \`${baseTable}\` table and calculate the date difference metric labeled \`${alias}\`.`;
  }

  if (textTransformExpr) {
    const alias = extractAlias(textTransformExpr) || "transformed_text";
    return `Return the requested text transformation from the \`${baseTable}\` table and label it \`${alias}\`.`;
  }

  if (whereClause && /^select\s+\*/i.test(lower)) {
    let task = `Return all rows from the \`${baseTable}\` table where ${cleanInstructionExpression(whereClause)}.`;
    if (orderByClause) task += ` Sort the output by ${cleanInstructionExpression(orderByClause)}.`;
    if (limitValue) task += ` Limit the output to ${limitValue} rows.`;
    return task;
  }

  if (whereClause) {
    const fieldLabels = selectExpressions.map(expr => {
      const bare = expr.replace(/\s+AS\s+[a-zA-Z_][\w]*$/i, "");
      return formatFieldForPrompt(bare);
    }).filter(Boolean);
    let selected = "the requested fields";
    if (fieldLabels.length === 1) selected = fieldLabels[0];
    if (fieldLabels.length > 1) selected = `${fieldLabels.slice(0, -1).join(", ")} and ${fieldLabels.slice(-1)[0]}`;
    let task = `Return ${selected} from the \`${baseTable}\` table where ${cleanInstructionExpression(whereClause)}.`;
    if (orderByClause) task += ` Sort the output by ${cleanInstructionExpression(orderByClause)}.`;
    if (limitValue) task += ` Limit the output to ${limitValue} rows.`;
    return task;
  }

  if (/^select\s+\*/i.test(lower)) {
    let task = `Return all columns from the \`${baseTable}\` table.`;
    if (orderByClause) task += ` Sort the output by ${cleanInstructionExpression(orderByClause)}.`;
    if (limitValue) task += ` Limit the output to ${limitValue} rows.`;
    return task;
  }

  if (selectExpressions.length) {
    const aliasLabels = selectExpressions.map(expr => extractAlias(expr)).filter(Boolean);
    if (aliasLabels.length) {
      let task = `Return the requested result from the \`${baseTable}\` table.`;
      task += ` Label the output columns ${aliasLabels.map(a => `\`${a}\``).join(", ")}.`;
      if (orderByClause) task += ` Sort the output by ${cleanInstructionExpression(orderByClause)}.`;
      if (limitValue) task += ` Limit the output to ${limitValue} rows.`;
      return task;
    }
  }

  return lesson?.objective || `Write a SQL query using the \`${baseTable}\` table that satisfies the lesson objective.`;
}

function buildBoardLevelChallengePrompt(lesson) {
  if (!lesson) return "Write a SQL query that satisfies the lesson objective.";

  const direct = (lesson.challengeCriteria || "").trim();
  if (direct) return direct;

  const config = getBusinessLogicConfig(lesson, cleanExpression(lesson.solutionQuery || lesson.starterQuery || ""));
  const task = buildExplicitTaskFromQuery(lesson);
  const why = buildWhyItMatters(lesson, config);

  if (why) {
    return `${task}\n\nWhy this matters: ${why}`;
  }

  return task;
}

function buildChallengePrompt(lesson) {
  if (!lesson) return "Write a SQL query that satisfies the lesson objective.";
  const direct = (lesson.challengeCriteria || "").trim();
  if (direct) return direct;
  return buildBoardLevelChallengePrompt(lesson) || lesson.objective || "Write a SQL query that satisfies the lesson objective.";
}

function backfillChallengeCriteria(curriculum) {
  curriculum.forEach(track => {
    track.categories.forEach(category => {
      category.lessons.forEach(lesson => {
        if (lesson.kind !== "challenge") return;
        if (lesson.challengeCriteria && lesson.challengeCriteria.trim()) return;
        lesson.challengeCriteria = buildBoardLevelChallengePrompt(lesson);
      });
    });
  });
}

function enforceChallengeCriteria(curriculum) {
  curriculum.forEach(track => {
    track.categories.forEach(category => {
      category.lessons.forEach(lesson => {
        if (lesson.kind !== "challenge") return;
        lesson.challengeCriteria = (lesson.challengeCriteria || "").trim() || buildBoardLevelChallengePrompt(lesson);
      });
    });
  });
}


function sanitizeProgressState() {
  const firstTrack = curriculum[0] || null;
  const validTrackIds = new Set(curriculum.map(track => track.id));
  const validLessonIds = allCurriculumLessonIds();

  appState.completedLessonIds = [...new Set((appState.completedLessonIds || []).filter(id => validLessonIds.has(id)))];
  appState.firstTryLessonIds = [...new Set((appState.firstTryLessonIds || []).filter(id => validLessonIds.has(id)))];

  const nextStats = {};
  Object.entries(appState.lessonStats || {}).forEach(([lessonId, stats]) => {
    if (validLessonIds.has(lessonId)) nextStats[lessonId] = stats;
  });
  appState.lessonStats = nextStats;

  if (!validTrackIds.has(appState.currentTrackId)) {
    appState.currentTrackId = firstTrack?.id || "track_foundations";
  }

  const activeTrack = getTrack();
  const validCategories = activeTrack?.categories || [];
  const validCategoryIds = new Set(validCategories.map(category => category.id));

  if (!validCategoryIds.has(appState.currentCategoryId)) {
    appState.currentCategoryId = validCategories[0]?.id || null;
  }

  const validLessonIdsForTrack = new Set(validCategories.flatMap(category => (category.lessons || []).map(lesson => lesson.id)));
  if (!validLessonIdsForTrack.has(appState.currentLessonId)) {
    appState.currentLessonId = validCategories[0]?.lessons?.[0]?.id || null;
  }

  if (!["overview", "lesson", "sandbox", "glossary"].includes(appState.currentView)) {
    appState.currentView = "overview";
  }
}

function ensurePatchedUiStyles() {
  if (document.getElementById("careops-patched-ui-styles")) return;
  const style = document.createElement("style");
  style.id = "careops-patched-ui-styles";
  style.textContent = `
    #levels-panel {
      border: 2px solid transparent;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }
    #levels-panel.track-theme-foundations { border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.08); }
    #levels-panel.track-theme-core { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08); }
    #levels-panel.track-theme-applied { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.08); }
    #levels-panel.track-theme-advanced { border-color: #ef4444; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.08); }
    #levels-panel.track-theme-expert { border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.08); }

    .track-badge-ring .level-icon,
    .track-badge-icon.level-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      text-align: center;
      font-size: clamp(11px, 1.2vw, 16px);
      line-height: 1;
      font-weight: 700;
    }
  `;
  document.head.appendChild(style);
}

function isTextChallenge(lesson) {
  return !!lesson && lesson.type === "challenge" && lesson.challengeMode === "text";
}

function challengeConceptMatches(lesson, answerText) {
  const text = String(answerText || "").toLowerCase();
  const requiredGroups = Array.isArray(lesson.requiredConceptGroups) && lesson.requiredConceptGroups.length
    ? lesson.requiredConceptGroups
    : (Array.isArray(lesson.acceptedConceptGroups) ? lesson.acceptedConceptGroups : []);
  const bonusGroups = Array.isArray(lesson.bonusConceptGroups) ? lesson.bonusConceptGroups : [];

  const matchedRequired = [];
  const missingRequired = [];
  const matchedBonus = [];

  requiredGroups.forEach((group) => {
    const terms = Array.isArray(group) ? group : [group];
    const didMatch = terms.some((term) => text.includes(String(term).toLowerCase()));
    if (didMatch) matchedRequired.push(terms[0]);
    else missingRequired.push(terms[0]);
  });

  bonusGroups.forEach((group) => {
    const terms = Array.isArray(group) ? group : [group];
    const didMatch = terms.some((term) => text.includes(String(term).toLowerCase()));
    if (didMatch) matchedBonus.push(terms[0]);
  });

  return {
    matchedCount: matchedRequired.length,
    missing: missingRequired,
    matchedRequired,
    matchedBonus,
    requiredGroupCount: requiredGroups.length
  };
}

function gradeTextChallenge(lesson, rawAnswer) {
  const answer = String(rawAnswer || "").trim();
  const minLength = lesson.minLength || 60;
  const fallbackMinimum = Math.max(1, (lesson.acceptedConceptGroups || []).length - 1);
  const requiredGroupCount = Array.isArray(lesson.requiredConceptGroups) && lesson.requiredConceptGroups.length
    ? lesson.requiredConceptGroups.length
    : (Array.isArray(lesson.acceptedConceptGroups) ? lesson.acceptedConceptGroups.length : 0);
  const minimumConceptMatches = lesson.requiredConceptMatches || lesson.minimumConceptMatches || fallbackMinimum;
  const { matchedCount, missing, matchedRequired, matchedBonus } = challengeConceptMatches(lesson, answer);
  const longEnough = answer.length >= minLength;
  const passed = longEnough && matchedCount >= minimumConceptMatches;
  const partial = !passed && answer.length >= Math.max(35, Math.floor(minLength * 0.55)) && matchedCount >= 1;
  return {
    passed,
    partial,
    missing,
    matchedCount,
    matchedRequired,
    matchedBonus,
    minLength,
    minimumConceptMatches,
    requiredGroupCount
  };
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
      <p style="white-space: pre-line;">${escapeHtml(lesson.challengeCriteria || buildChallengePrompt(lesson) || lesson.objective || "")}</p>
    `;

    const query = document.getElementById("query");
    const queryLabel = challengeContent.querySelector(".query-label");
    const challengeButtons = challengeContent.querySelectorAll("button");
    if (query) {
      query.value = isTextChallenge(lesson) ? "" : (lesson.starterQuery || "");
      query.placeholder = isTextChallenge(lesson) ? "Write your explanation here." : "Write your SQL query here.";
    }
    if (queryLabel) {
      queryLabel.innerText = isTextChallenge(lesson) ? "Enter your response" : "Write your SQL query:";
    }
    if (challengeButtons[0]) {
      challengeButtons[0].innerText = isTextChallenge(lesson) ? "Submit Response" : "Run Query";
    }
    if (challengeButtons[1]) {
      challengeButtons[1].innerText = isTextChallenge(lesson) ? "Reset Response" : "Reset Query";
    }
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


/* duplicate removed during stabilization pass */


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
    setFeedbackState(feedback, "error", isTextChallenge(lesson) ? "Please enter a response before submitting." : "Please enter a query before running it.");
    if (output) output.innerHTML = "";
    return;
  }

  if (isTextChallenge(lesson)) {
    if (output) output.innerHTML = "";
    attempts += 1;
    const result = gradeTextChallenge(lesson, query);

    if (result.passed) {
      updateLessonStatsOnGrade(lesson.id, attempts === 1 ? { score: 100, tier: "Perfect" } : { score: 92, tier: "Strong" }, true);
      markLessonCompleted(lesson.id, attempts === 1);
      setFeedbackState(feedback, "success", lesson.feedbackGuide || "Correct — your explanation shows the right reasoning.");
      attempts = 0;
      saveProgress();
      refreshLessonChrome();
      return;
    }

    const missingText = result.missing.length ? ` Missing ideas to mention: ${result.missing.slice(0, 3).join(", ")}.` : "";

    if (result.partial && attempts < 3) {
      setFeedbackState(feedback, "warning", `You are on the right track, but the explanation is incomplete.${missingText}`);
      saveProgress();
      refreshLessonChrome();
      return;
    }

    if (attempts < 3) {
      const nextHint = attempts === 1 ? (lesson.hint || "Focus on what one row represents and why.") : (lesson.smartHint || lesson.thirdHint || lesson.hint || "Use the business wording and the table grain to guide your answer.");
      setFeedbackState(feedback, "warning", `Not correct yet. Hint ${attempts}: ${nextHint}${missingText}`);
      saveProgress();
      refreshLessonChrome();
      return;
    }

    setFeedbackState(
      feedback,
      "error",
      `You have used all 3 attempts.

Suggested Answer:
${lesson.exemplarAnswer || lesson.explanation || "Review the lesson and try again."}

Explanation:
${lesson.explanation || lesson.feedbackGuide || "This lesson is testing your reasoning, not verbatim wording."}`
    );
    saveProgress();
    refreshLessonChrome();
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
        `You have used all 3 attempts.

Correct Answer:
${lesson.solutionQuery}

Explanation:
${finalExplanation}`
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
        `You have used all 3 attempts.

Correct Answer:
${lesson.solutionQuery}

Explanation:
${finalExplanation}`
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
  removeLevelsPanelOverviewButton();
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
  } else {
    const trackIndex = curriculum.findIndex(track => track.id === appState.currentTrackId);
    if (trackIndex >= 0 && trackIndex < curriculum.length - 1) {
      const nextTrack = curriculum[trackIndex + 1];
      appState.currentTrackId = nextTrack.id;
      appState.currentCategoryId = nextTrack.categories[0]?.id || null;
      appState.currentLessonId = nextTrack.categories[0]?.lessons[0]?.id || null;
    }
  }
  attempts = 0;
  appState.currentView = "lesson";
  saveProgress();
  renderAll();
}

function prevLesson() {
  const lessons = getAllLessons();
  const idx = lessons.findIndex(item => item.id === appState.currentLessonId);
  if (idx > 0) {
    appState.currentLessonId = lessons[idx - 1].id;
    appState.currentCategoryId = getAllCategories().find(cat => cat.lessons.some(l => l.id === appState.currentLessonId))?.id || appState.currentCategoryId;
  } else {
    const trackIndex = curriculum.findIndex(track => track.id === appState.currentTrackId);
    if (trackIndex > 0) {
      const prevTrack = curriculum[trackIndex - 1];
      const prevLessons = (prevTrack.categories || []).flatMap(category => category.lessons || []);
      appState.currentTrackId = prevTrack.id;
      appState.currentLessonId = prevLessons[prevLessons.length - 1]?.id || null;
      appState.currentCategoryId = prevTrack.categories.find(cat => cat.lessons.some(l => l.id === appState.currentLessonId))?.id || prevTrack.categories[0]?.id || null;
    }
  }
  attempts = 0;
  appState.currentView = "lesson";
  saveProgress();
  renderAll();
}

function resetAllProgress() {
  if (!window.confirm("Reset all progress for CareOps SQL Analyst?")) return;
  const firstTrack = curriculum[0] || null;
  appState.completedLessonIds = [];
  appState.firstTryLessonIds = [];
  appState.lessonStats = {};
  appState.currentTrackId = firstTrack?.id || "track_foundations";
  appState.currentCategoryId = firstTrack?.categories?.[0]?.id || null;
  appState.currentLessonId = firstTrack?.categories?.[0]?.lessons?.[0]?.id || null;
  appState.currentView = "overview";
  activeDifficultyFilter = null;
  appState.glossarySearch = "";
  appState.glossaryCategory = "";
  attempts = 0;
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


/* duplicate removed during stabilization pass */


const AI_API_CONFIG = {
  endpoint: "/api/ai-companion",
  method: "POST",
  timeoutMs: 15000
};

let sandboxDb = null;
let aiThread = [];

function showSection(sectionId) {
  ["track-overview", "lesson-workspace", "sandbox-workspace", "glossary-workspace"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", id !== sectionId);
  });
}

function showLessonWorkspace() {
  appState.currentView = "lesson";
  showSection("lesson-workspace");
}

function ensureCurrentLesson() {
  if (appState.currentLessonId) return;
  const firstTrack = getTrack();
  const firstCategory = firstTrack?.categories?.[0] || null;
  const firstLesson = firstCategory?.lessons?.[0] || null;
  if (firstCategory) appState.currentCategoryId = firstCategory.id;
  if (firstLesson) appState.currentLessonId = firstLesson.id;
}


/* duplicate removed during stabilization pass */



/* duplicate removed during stabilization pass */



/* duplicate removed during stabilization pass */


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


/* duplicate removed during stabilization pass */



/* duplicate removed during stabilization pass */



/* duplicate removed during stabilization pass */


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


/* duplicate removed during stabilization pass */


function setAiStatus(text, isLive = false) {
  const pill = document.getElementById("ai-status-pill");
  if (!pill) return;
  pill.textContent = text;
  pill.classList.toggle("is-ready", !!isLive);
}


/* duplicate removed during stabilization pass */


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




/* duplicate removed during stabilization pass */



/* duplicate removed during stabilization pass */



/* duplicate removed during stabilization pass */



/* duplicate removed during stabilization pass */




/* duplicate removed during stabilization pass */


window.showCareopsOverview = function () {
  appState.currentView = "overview";
  attempts = 0;
  saveProgress();
  renderAll();
};

window.showCareopsLessons = function () {
  attempts = 0;
  showLessonsWorkspace();
  saveProgress();
  renderAll();
};

window.showCareopsSandbox = function () {
  appState.currentView = "sandbox";
  attempts = 0;
  saveProgress();
  renderAll();
};

window.showCareopsGlossary = function () {
  appState.currentView = "glossary";
  attempts = 0;
  saveProgress();
  renderAll();
};


document.addEventListener("DOMContentLoaded", async function () {
  ensurePatchedUiStyles();
  normalizeCurriculum();
  backfillChallengeCriteria(curriculum);
  enforceChallengeCriteria(curriculum);
  loadProgress();
  sanitizeProgressState();
  if (!appState.currentCategoryId) appState.currentCategoryId = getTrack().categories[0]?.id || null;
  if (!appState.currentLessonId) appState.currentLessonId = getTrack().categories[0]?.lessons[0]?.id || null;
  if (!appState.currentView) appState.currentView = "overview";
  ensureGlossaryWorkspace();
  ensureGlossaryNavButton();
  initUiActions();
  attachPersistentNavigationDelegates();
  initSchemaResizer();
  await initDatabase();
  await initializeSandboxDatabase();
  renderAiMessages();
  renderAll();
  window.addEventListener("scroll", hideAchievementTooltip, true);
  window.addEventListener("resize", hideAchievementTooltip);
});


/* ================= PATCHED SANDBOX / AI / MOBILE BEHAVIOR ================= */

let sandboxModeState = "free";
let selectedSandboxPromptId = null;

function setSandboxModeUi(isSandbox) {
  document.body.classList.toggle("sandbox-mode", !!isSandbox);
}

function defaultSandboxQuery() {
  return "SELECT * FROM patients;";
}

function getSandboxPromptOptions() {
  const current = getCurrentLesson();
  const lessons = (typeof getAllLessons === "function" ? getAllLessons() : []).filter(
    (lesson) => lesson && (lesson.starterQuery || lesson.solutionQuery)
  );

  const prompts = [];
  if (current && (current.starterQuery || current.solutionQuery)) {
    prompts.push({
      id: current.id,
      title: current.title || "Current lesson",
      objective: current.challengeCriteria || current.objective || "Use this lesson's SQL pattern.",
      query: current.starterQuery || current.solutionQuery || "",
      tables: Array.isArray(current.relevantTables) ? current.relevantTables : []
    });
  }

  lessons.slice(0, 12).forEach((lesson) => {
    if (current && lesson.id === current.id) return;
    prompts.push({
      id: lesson.id,
      title: lesson.title || "Guided prompt",
      objective: lesson.challengeCriteria || lesson.objective || "Use this lesson's SQL pattern.",
      query: lesson.starterQuery || lesson.solutionQuery || "",
      tables: Array.isArray(lesson.relevantTables) ? lesson.relevantTables : []
    });
  });

  return prompts;
}

function getSelectedSandboxPrompt() {
  const prompts = getSandboxPromptOptions();
  return prompts.find((prompt) => prompt.id === selectedSandboxPromptId) || null;
}

function renderSandboxLessonContext(prompt = null) {
  const panel = document.getElementById("sandbox-lesson-context");
  const titleEl = document.getElementById("sandbox-lesson-title");
  const objectiveEl = document.getElementById("sandbox-lesson-objective");
  const tablesEl = document.getElementById("sandbox-lesson-tables");
  if (!panel || !titleEl || !objectiveEl || !tablesEl) return;

  if (sandboxModeState !== "guided" || !prompt) {
    panel.classList.add("hidden");
    titleEl.textContent = "Choose a guided prompt.";
    objectiveEl.textContent = "Select a guided prompt to load its objective, SQL starter pattern, and related tables.";
    tablesEl.innerHTML = "";
    return;
  }

  panel.classList.remove("hidden");
  titleEl.textContent = prompt.title || "Guided prompt";
  objectiveEl.textContent = prompt.objective || "Use this guided prompt in the sandbox.";
  const tables = Array.isArray(prompt.tables) ? prompt.tables : [];
  tablesEl.innerHTML = tables.length
    ? tables.map((table) => `<div class="sandbox-schema-pill"><span>${escapeHtml(table)}</span><code>${escapeHtml(table)}</code></div>`).join("")
    : '<p class="sandbox-note">No related tables were supplied for this prompt.</p>';
}

function applySandboxPrompt(prompt, silent = false) {
  if (!prompt) return;
  selectedSandboxPromptId = prompt.id || null;
  sandboxModeState = "guided";

  const box = document.getElementById("sandbox-query");
  if (box) box.value = prompt.query || "";

  renderSandboxLessonContext(prompt);

  const holder = document.getElementById("sandbox-prompt-list");
  holder?.querySelectorAll(".sandbox-prompt-card").forEach((card) => {
    card.classList.toggle("active", card.getAttribute("data-prompt-id") === String(prompt.id));
  });

  if (!silent) {
    setMessageState("sandbox-feedback", "success", `Loaded guided prompt: ${prompt.title}`);
  }
}

function renderSandboxPromptList() {
  const holder = document.getElementById("sandbox-prompt-list");
  if (!holder) return;

  const prompts = getSandboxPromptOptions();
  if (!prompts.length) {
    holder.innerHTML = '<p class="sandbox-note">No guided prompts are available yet. Open a lesson first, then return to the sandbox.</p>';
    renderSandboxLessonContext(null);
    return;
  }

  holder.innerHTML = prompts.map((prompt) => `
    <div class="sandbox-prompt-card ${prompt.id === selectedSandboxPromptId ? "active" : ""}" data-prompt-id="${escapeHtml(prompt.id)}">
      <h5>${escapeHtml(prompt.title)}</h5>
      <p>${escapeHtml(prompt.objective)}</p>
      <div class="sandbox-prompt-meta">
        ${(prompt.tables || []).map((table) => `<span class="helper-chip">${escapeHtml(table)}</span>`).join("")}
      </div>
    </div>
  `).join("");

  holder.querySelectorAll(".sandbox-prompt-card").forEach((card) => {
    card.onclick = () => {
      const prompt = prompts.find((item) => item.id === card.getAttribute("data-prompt-id"));
      if (!prompt) return;
      applySandboxPrompt(prompt);
      document.getElementById("sandbox-query")?.focus();
    };
  });

  if (selectedSandboxPromptId) {
    const selected = prompts.find((prompt) => prompt.id === selectedSandboxPromptId);
    renderSandboxLessonContext(selected || null);
  } else {
    renderSandboxLessonContext(null);
  }
}

function setSandboxMode(mode = "free") {
  sandboxModeState = mode === "guided" ? "guided" : "free";

  const guidedPanel = document.getElementById("sandbox-guided-panel");
  const guidedBtn = document.getElementById("sandbox-guided-btn");
  const freeBtn = document.getElementById("sandbox-free-btn");
  const box = document.getElementById("sandbox-query");

  if (sandboxModeState === "guided") {
    guidedPanel?.classList.remove("hidden");
    guidedBtn?.classList.add("active");
    freeBtn?.classList.remove("active");
    renderSandboxPromptList();

    const selected = getSelectedSandboxPrompt();
    if (selected) {
      applySandboxPrompt(selected, true);
    } else {
      renderSandboxLessonContext(null);
      if (box && !box.value.trim()) box.value = defaultSandboxQuery();
    }
    return;
  }

  guidedPanel?.classList.add("hidden");
  freeBtn?.classList.add("active");
  guidedBtn?.classList.remove("active");
  selectedSandboxPromptId = null;
  renderSandboxLessonContext(null);
  if (box && (!box.value.trim() || box.value.trim() === "")) {
    box.value = defaultSandboxQuery();
  }
}

function syncSandboxStarterQuery() {
  const box = document.getElementById("sandbox-query");
  if (!box) return;

  if (sandboxModeState === "guided") {
    const selected = getSelectedSandboxPrompt();
    if (selected) {
      applySandboxPrompt(selected, true);
      return;
    }
  }

  if (!box.value.trim()) {
    box.value = defaultSandboxQuery();
  }
  renderSandboxLessonContext(null);
}

function ensureGlossaryWorkspace() {
  let workspace = document.getElementById("glossary-workspace");
  if (workspace) return workspace;

  const playArea = document.querySelector(".play-area") || document.querySelector(".main-content") || document.body;
  workspace = document.createElement("section");
  workspace.id = "glossary-workspace";
  workspace.className = "glossary-workspace hidden";
  playArea.appendChild(workspace);
  return workspace;
}

function setGlossaryModeUi(isGlossary) {
  document.body.classList.toggle("glossary-mode", !!isGlossary);
  if (isGlossary) document.body.classList.remove("sandbox-mode");
}

function ensureGlossaryNavButton() {
  let button = document.getElementById("open-glossary-btn");
  if (button) return button;

  const sandboxBtn = document.getElementById("open-sandbox-btn") || document.getElementById("nav-sandbox-btn") || Array.from(document.querySelectorAll("button")).find((btn) => String(btn.textContent || "").trim().toLowerCase() === "sandbox");
  const resetBtn = Array.from(document.querySelectorAll("button")).find((btn) => /reset progress/i.test(String(btn.textContent || "")));
  const parent = sandboxBtn?.parentElement || resetBtn?.parentElement || document.querySelector(".main-nav-actions") || document.querySelector(".dashboard-actions.main-nav-actions") || document.querySelector(".dashboard-actions");
  if (!parent) return null;

  button = document.createElement("button");
  button.type = "button";
  button.id = "open-glossary-btn";
  button.className = "glossary-nav-btn";
  button.textContent = "Glossary";

  if (resetBtn && resetBtn.parentElement === parent) {
    parent.insertBefore(button, resetBtn);
  } else if (sandboxBtn && sandboxBtn.parentElement === parent) {
    sandboxBtn.insertAdjacentElement("afterend", button);
  } else {
    parent.appendChild(button);
  }

  return button;
}

function getFilteredGlossaryTerms() {
  const query = String(appState.glossarySearch || "").trim().toLowerCase();
  const activeCategory = String(appState.glossaryCategory || "").trim().toLowerCase();

  return GLOSSARY_TERMS.filter((item) => {
    const matchesCategory = !activeCategory || item.category === activeCategory;
    const haystack = [item.term, item.definition, item.why, item.example, glossaryCategoryLabel(item.category)].join(" ").toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesCategory && matchesQuery;
  });
}

function renderGlossaryCard(item) {
  return `
    <article class="glossary-card glossary-card-${escapeHtml(item.category)}">
      <div class="glossary-card-accent"></div>
      <div class="glossary-card-body">
        <div class="glossary-card-top">
          <h3>${escapeHtml(item.term)}</h3>
          <span class="glossary-category-pill glossary-category-pill-${escapeHtml(item.category)}">${escapeHtml(glossaryCategoryLabel(item.category))}</span>
        </div>
        <div class="glossary-copy-block">
          <div class="glossary-copy-label">Definition</div>
          <p>${escapeHtml(item.definition)}</p>
        </div>
        <div class="glossary-copy-block">
          <div class="glossary-copy-label">Why it matters</div>
          <p>${escapeHtml(item.why)}</p>
        </div>
        <div class="glossary-copy-block">
          <div class="glossary-copy-label">Example</div>
          <div class="glossary-example">${escapeHtml(item.example)}</div>
        </div>
      </div>
    </article>
  `;
}

function renderGlossary() {
  const workspace = ensureGlossaryWorkspace();
  const filteredTerms = getFilteredGlossaryTerms();

  workspace.innerHTML = `
    <div class="glossary-page">
      <div class="glossary-header-card">
        <div>
          <div class="glossary-kicker">Reference Library</div>
          <h2>Glossary</h2>
          <p>Definitions for SQL, hospital operations, finance, and analytics terms used throughout the CareOps curriculum.</p>
        </div>
      </div>

      <div class="glossary-toolbar">
        <div>
          <label class="glossary-label" for="glossary-search-input">Search Terms</label>
          <input id="glossary-search-input" class="glossary-search-input" type="text" placeholder="Search LOS, denial, JOIN, KPI, readmission..." value="${escapeHtml(appState.glossarySearch || "")}" />
        </div>
        <div>
          <div class="glossary-label">Categories</div>
          <div class="glossary-filter-chips">
            <button type="button" class="glossary-filter-chip ${!appState.glossaryCategory ? "active" : ""}" data-glossary-filter="">All Terms</button>
            <button type="button" class="glossary-filter-chip ${appState.glossaryCategory === "sql" ? "active" : ""}" data-glossary-filter="sql">SQL</button>
            <button type="button" class="glossary-filter-chip ${appState.glossaryCategory === "clinical" ? "active" : ""}" data-glossary-filter="clinical">Clinical / Operations</button>
            <button type="button" class="glossary-filter-chip ${appState.glossaryCategory === "financial" ? "active" : ""}" data-glossary-filter="financial">Financial / Revenue</button>
            <button type="button" class="glossary-filter-chip ${appState.glossaryCategory === "analytics" ? "active" : ""}" data-glossary-filter="analytics">Analytics / Strategy</button>
          </div>
        </div>
      </div>

      <div class="glossary-results-meta">${filteredTerms.length} terms shown</div>

      ${filteredTerms.length ? `<div class="glossary-card-grid">${filteredTerms.map(renderGlossaryCard).join("")}</div>` : `
        <div class="glossary-empty-state">
          <h3>No terms matched</h3>
          <p>Try a different keyword or switch back to All Terms.</p>
        </div>
      `}
    </div>
  `;

  const input = document.getElementById("glossary-search-input");
  if (input) {
    input.addEventListener("input", (event) => {
      appState.glossarySearch = event.target.value || "";
      saveProgress();
      renderGlossary();
    });
  }

  workspace.querySelectorAll("[data-glossary-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.glossaryCategory = button.getAttribute("data-glossary-filter") || "";
      saveProgress();
      renderGlossary();
    });
  });
}

function showGlossaryWorkspace() {
  appState.currentView = "glossary";
  setGlossaryModeUi(true);
  showSection("glossary-workspace");
  renderGlossary();
  document.getElementById("glossary-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showOverview() {
  appState.currentView = "overview";
  setSandboxModeUi(false);
  setGlossaryModeUi(false);
  showSection("track-overview");
  document.getElementById("track-overview")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showLessonsWorkspace() {
  ensureCurrentLesson();
  appState.currentView = "lesson";
  setSandboxModeUi(false);
  setGlossaryModeUi(false);
  showSection("lesson-workspace");
  document.getElementById("lesson-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showSandboxWorkspace() {
  appState.currentView = "sandbox";
  setSandboxModeUi(true);
  showSection("sandbox-workspace");
  setSandboxMode(sandboxModeState);
  document.getElementById("sandbox-query")?.focus();
}

function formatSandboxResultTable(result) {
  const columns = Array.isArray(result?.columns) ? result.columns : [];
  const values = Array.isArray(result?.values) ? result.values : [];
  if (!columns.length) return "<p>No rows returned.</p>";
  let out = '<div class="query-results-table-wrap"><table class="preview-table"><thead><tr>';
  columns.forEach((column) => {
    out += `<th>${escapeHtml(String(column))}</th>`;
  });
  out += "</tr></thead><tbody>";
  values.forEach((row) => {
    out += "<tr>";
    (Array.isArray(row) ? row : []).forEach((cell) => {
      const value = cell === null || typeof cell === "undefined" ? "" : String(cell);
      out += `<td>${escapeHtml(value)}</td>`;
    });
    out += "</tr>";
  });
  out += "</tbody></table></div>";
  return out;
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
    const execResult = sandboxDb.exec(query);
    const first = Array.isArray(execResult) && execResult.length ? execResult[0] : null;
    const normalized = {
      columns: Array.isArray(first?.columns) ? first.columns : [],
      values: Array.isArray(first?.values) ? first.values : []
    };
    const output = document.getElementById("sandbox-output");
    if (output) output.innerHTML = formatSandboxResultTable(normalized);
    setMessageState(
      "sandbox-feedback",
      "success",
      normalized.columns.length || normalized.values.length
        ? "Sandbox query ran successfully."
        : "Query executed successfully. No result rows were returned."
    );
  } catch (error) {
    setMessageState("sandbox-feedback", "error", getExecutionErrorMessage(error));
  }
}

function formatAiResponseBody(text) {
  const safe = escapeHtml(String(text || ""));
  const sections = safe.split(/\n{2,}/).filter(Boolean);
  return sections.map((section) => {
    const lines = section.split("\n").filter(Boolean);
    if (!lines.length) return "";
    if (lines.every((line) => /^[-•]/.test(line.trim()))) {
      return `<ul>${lines.map((line) => `<li>${line.replace(/^[-•]\s*/, "")}</li>`).join("")}</ul>`;
    }
    return `<p>${lines.join("<br>")}</p>`;
  }).join("");
}

function renderAiMessages() {
  const holder = document.getElementById("ai-messages");
  if (!holder) return;

  if (!aiThread.length) {
    holder.innerHTML = `
      <div class="ai-message assistant">
        <div class="ai-message-role">AI companion</div>
        <div class="ai-message-body">
          <p><strong>Ask me anything</strong></p>
          <p>I can help with SQL code, explain why metrics like readmissions or LOS matter, and suggest where to investigate when a measure is high.</p>
        </div>
      </div>`;
    return;
  }

  holder.innerHTML = aiThread.map((msg) => `
    <div class="ai-message ${msg.role}">
      <div class="ai-message-role">${msg.role === "user" ? "You" : "AI companion"}</div>
      <div class="ai-message-body">${formatAiResponseBody(msg.content)}</div>
    </div>
  `).join("");
  holder.scrollTop = holder.scrollHeight;
}

function fallbackAiResponse(userMessage) {
  const lesson = getCurrentLesson();
  const prompt = String(userMessage || "").toLowerCase();
  const lessonTitle = lesson?.title || "the current topic";
  const objective = lesson?.objective || "the question you are exploring";
  const relevantTables = lesson?.relevantTables?.length ? lesson.relevantTables.join(", ") : "the relevant tables";

  if (prompt.includes("readmission")) {
    return [
      "Readmissions matter because they can signal breakdowns in discharge planning, follow-up access, medication reconciliation, or care coordination.",
      "",
      "Where to investigate",
      "- discharge disposition and follow-up timing",
      "- diagnosis groups driving repeat returns",
      "- provider or facility variation",
      "- payer mix and barriers to outpatient follow-up",
      "- length of stay, case management involvement, and ED bounce-backs"
    ].join("\n");
  }

  if (prompt.includes("los") || prompt.includes("length of stay")) {
    return [
      "Length of stay matters because it affects capacity, throughput, staffing pressure, and cost of care.",
      "",
      "If LOS is high, look at",
      "- discharge delays by department",
      "- case management and consult turnaround",
      "- placement barriers",
      "- diagnostic bottlenecks",
      "- provider or unit variation"
    ].join("\n");
  }

  if (prompt.includes("code") || prompt.includes("sql") || prompt.includes("query")) {
    return [
      `You are working on ${lessonTitle}.`,
      `Objective: ${objective}`,
      `Relevant tables: ${relevantTables}`,
      "",
      "Best next step",
      "Tell me exactly what output you want and I will write or improve the SQL for you."
    ].join("\n");
  }

  return [
    `You are currently in ${lessonTitle}.`,
    `Objective: ${objective}`,
    `Relevant tables: ${relevantTables}`,
    "",
    "You can ask me to",
    "- write SQL",
    "- explain what a metric means",
    "- suggest where to investigate when a metric is high",
    "- help translate the result for leaders"
  ].join("\n");
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
  const target = document.getElementById("ai-companion-section") || document.getElementById("ai-input");
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("ai-input")?.focus();
}

function updateAiContextBanner() {
  if (!aiThread.length) renderAiMessages();
}


function removeLevelsPanelOverviewButton() {
  const panel = document.getElementById("levels-panel");
  if (!panel) return;

  const overviewBtn =
    panel.querySelector("#open-overview-btn") ||
    Array.from(panel.querySelectorAll("button")).find((button) =>
      String(button.textContent || "").trim().toLowerCase() === "track overview"
    );

  if (!overviewBtn) return;

  const wrapper = overviewBtn.closest(".side-panel-actions, .levels-panel-action-row, .panel-action-row");
  if (wrapper) {
    wrapper.remove();
    return;
  }

  overviewBtn.remove();
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
  } else if (appState.currentView === "glossary") {
    showGlossaryWorkspace();
  } else {
    showOverview();
  }
  updateAiContextBanner();
  initUiActions();
  removeLevelsPanelOverviewButton();
  attachPersistentNavigationDelegates();
}

function initUiActions() {
  const openOverviewBtn = document.getElementById("open-overview-btn");
  if (openOverviewBtn) {
    openOverviewBtn.onclick = () => {
      appState.currentView = "overview";
      attempts = 0;
      showOverview();
      saveProgress();
      renderAll();
      document.getElementById("track-overview")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }

  const openSandboxBtn = document.getElementById("open-sandbox-btn");
  if (openSandboxBtn) {
    openSandboxBtn.onclick = () => {
      appState.currentView = "sandbox";
      attempts = 0;
      showSandboxWorkspace();
      saveProgress();
      renderAll();
      document.getElementById("sandbox-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }

  const openGlossaryBtn = ensureGlossaryNavButton();
  if (openGlossaryBtn) {
    openGlossaryBtn.onclick = () => {
      appState.currentView = "glossary";
      attempts = 0;
      showGlossaryWorkspace();
      saveProgress();
      renderAll();
    };
  }

  const toggleBtn = document.getElementById("toggle-levels-panel-btn");
  const panel = document.getElementById("levels-panel");
  if (toggleBtn && panel) {
    toggleBtn.onclick = () => {
      panel.classList.toggle("collapsed");
      toggleBtn.innerText = panel.classList.contains("collapsed") ? "Expand" : "Collapse";
      toggleBtn.setAttribute("aria-expanded", panel.classList.contains("collapsed") ? "false" : "true");
    };
  }

  const runSandboxBtn = document.getElementById("run-sandbox-btn");
  if (runSandboxBtn) runSandboxBtn.onclick = runSandboxQuery;

  const resetSandboxBtn = document.getElementById("reset-sandbox-btn");
  if (resetSandboxBtn) {
    resetSandboxBtn.onclick = () => {
      selectedSandboxPromptId = null;
      sandboxModeState = "free";
      resetSandbox();
      setSandboxMode("free");
    };
  }

  const guidedBtn = document.getElementById("sandbox-guided-btn");
  const freeBtn = document.getElementById("sandbox-free-btn");
  if (guidedBtn) guidedBtn.onclick = () => {
    setSandboxMode("guided");
    renderSandboxPromptList();
  };
  if (freeBtn) freeBtn.onclick = () => {
    setSandboxMode("free");
  };

  const askAiAboutQueryBtn = document.getElementById("sandbox-send-ai-btn");
  if (askAiAboutQueryBtn) {
    askAiAboutQueryBtn.onclick = () => {
      const input = document.getElementById("ai-input");
      const sandboxQuery = (document.getElementById("sandbox-query")?.value || "").trim();
      if (input && !input.value.trim()) {
        input.value = sandboxQuery
          ? `Help me understand and improve this SQL:\n\n${sandboxQuery}`
          : "Help me understand and improve this sandbox query.";
      }
      sendAiMessage();
      scrollToAiCompanion();
    };
  }

  const sendAiBtn = document.getElementById("send-ai-btn");
  if (sendAiBtn) sendAiBtn.onclick = () => sendAiMessage();

  const aiInput = document.getElementById("ai-input");
  if (aiInput && !aiInput.dataset.enterBound) {
    aiInput.dataset.enterBound = "true";
    aiInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendAiMessage();
      }
    });
  }
}

function attachPersistentNavigationDelegates() {
  if (window.__careopsNavDelegatePatchedV2) return;
  window.__careopsNavDelegatePatchedV2 = true;

  document.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;
    const label = String(button.textContent || "").trim().toLowerCase();

    const isOverview = button.id === "open-overview-btn" || button.id === "nav-overview-btn" || label === "track overview";
    const isSandbox = button.id === "open-sandbox-btn" || button.id === "nav-sandbox-btn" || label === "sandbox" || label === "sql sandbox";
    const isGlossary = button.id === "open-glossary-btn" || label === "glossary";

    if (isOverview) {
      event.preventDefault();
      attempts = 0;
      showOverview();
      saveProgress();
      renderAll();
      return;
    }

    if (isSandbox) {
      event.preventDefault();
      attempts = 0;
      showSandboxWorkspace();
      saveProgress();
      renderAll();
      return;
    }

    if (isGlossary) {
      event.preventDefault();
      attempts = 0;
      showGlossaryWorkspace();
      saveProgress();
      renderAll();
      return;
    }
  });
}
