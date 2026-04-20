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
        title: "SQL Foundations for Hospital Data",
        order: 1,
        lessons: [
          {
            kind: "concept",
            id: "f1",
            title: "Selecting All Columns with SELECT *",
            objective: "Understand how SELECT * retrieves all columns from a table.",
            sql_focus: ["SELECT", "FROM"],
            relevantTables: ["patients"],
            joinHint: "No join is needed for this lesson.",
            summary: "SELECT * retrieves all columns from a table.",
            bullets: [
              "Use it when exploring a dataset for the first time.",
              "It helps validate table structure and available fields.",
              "It is helpful for quick review, but should be used carefully in large production queries."
            ],
            example: "SELECT provider_id, provider_name, specialty FROM providers;",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f2",
            title: "Pull All Patient Records",
            objective: "Retrieve all patient records.",
            sql_focus: ["SELECT", "FROM"],
            relevantTables: ["patients"],
            joinHint: "Use only the patients table for this lesson.",
            challengeCriteria: `You are reviewing the patient master dataset.

Return all columns and all records from the patients table.
Do not filter or limit results.

This helps you understand the structure of patient-level data before performing deeper analysis.`,
            starterQuery: "SELECT * FROM patients;",
            solutionQuery: "SELECT * FROM patients;",
            hint: "Start by selecting everything from the patients table.",
            smartHint: "Use SELECT * and reference the patients table.",
            thirdHint: "SELECT * FROM patients;",
            explanation: `SELECT * returns every column and every row from a table.

This is typically used early in analysis to:
- understand available fields
- validate data
- explore dataset structure

It should be used carefully in large datasets, but is essential during early exploration.`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "f3",
            title: "Filtering with WHERE",
            objective: "Understand how WHERE filters records.",
            sql_focus: ["SELECT", "FROM", "WHERE"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "The WHERE clause filters records.",
            bullets: [
              "Use WHERE to isolate a specific population.",
              "Filtering is essential for identifying risk groups and operational exceptions.",
              "It allows leaders to focus on the subset of records that matter."
            ],
            example: "SELECT claim_id, payer, claim_status, billed_amount FROM claims WHERE claim_status = 'Denied';",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f4",
            title: "Identify Long Length of Stay Patients",
            objective: "Filter encounters with long LOS.",
            sql_focus: ["SELECT", "FROM", "WHERE"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: `Leadership wants to understand which patients are experiencing extended hospital stays.

Return all encounter records where length_of_stay is greater than 5 days.

This helps identify patients who may be contributing to capacity constraints.`,
            starterQuery: "SELECT * FROM encounters WHERE length_of_stay > 5;",
            solutionQuery: "SELECT * FROM encounters WHERE length_of_stay > 5;",
            hint: "Filter encounters based on length_of_stay.",
            smartHint: "Use WHERE length_of_stay > 5.",
            thirdHint: "SELECT * FROM encounters WHERE length_of_stay > 5;",
            explanation: `Filtering allows you to isolate specific populations.

High LOS patients are important because they:
- consume bed capacity
- may indicate inefficiencies
- often require deeper case review`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "f5",
            title: "Sorting Results",
            objective: "Understand how ORDER BY sorts query results.",
            sql_focus: ["SELECT", "FROM", "ORDER BY"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "ORDER BY sorts your results.",
            bullets: [
              "Sorting helps surface the highest-priority records first.",
              "Descending order is useful for reviewing biggest drivers.",
              "Leaders often need ranked outputs to prioritize intervention."
            ],
            example: "SELECT charge_id, encounter_id, amount FROM charges ORDER BY amount DESC;",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "f6",
            title: "Find Highest LOS Patients",
            objective: "Sort LOS descending.",
            sql_focus: ["SELECT", "FROM", "ORDER BY"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: `You are asked to identify the highest length of stay cases first.

Return all encounters sorted by length_of_stay in descending order.

This helps prioritize cases that may require immediate review.`,
            starterQuery: "SELECT * FROM encounters ORDER BY length_of_stay DESC;",
            solutionQuery: "SELECT * FROM encounters ORDER BY length_of_stay DESC;",
            hint: "Sort by length_of_stay descending.",
            smartHint: "Use ORDER BY length_of_stay DESC.",
            thirdHint: "SELECT * FROM encounters ORDER BY length_of_stay DESC;",
            explanation: `Sorting allows you to prioritize records.

Descending order is commonly used to:
- identify highest cost cases
- surface operational issues quickly`,
            executiveTakeaway: { show: false }
          }
        ]
      }
    ]
  },

  {
    id: "track_core",
    title: "Core",
    description: "Core learning path for CareOps hospital analytics.",
    order: 2,
    categories: [
      {
        id: "core_hospital_analytics",
        title: "Core Hospital Analytics",
        order: 1,
        lessons: [
          {
            kind: "concept",
            id: "c1",
            title: "Counting Records",
            objective: "Understand how COUNT() measures volume.",
            sql_focus: ["SELECT", "COUNT"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "COUNT() is used to measure volume.",
            bullets: [
              "COUNT(*) tells you how many rows exist in a dataset.",
              "In healthcare, this supports encounter volume and workload measurement.",
              "Volume is one of the most basic operational KPIs."
            ],
            example: "SELECT COUNT(*) FROM appointments;",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "c2",
            title: "Total Encounter Volume",
            objective: "Measure encounter volume.",
            sql_focus: ["SELECT", "COUNT"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: `Leadership wants to understand total hospital activity.

Return the total number of encounters.

Label the column encounter_count.

This represents overall patient volume.`,
            starterQuery: "SELECT COUNT(*) AS encounter_count FROM encounters;",
            solutionQuery: "SELECT COUNT(*) AS encounter_count FROM encounters;",
            hint: "Count all rows in encounters.",
            smartHint: "Use COUNT(*) and alias it encounter_count.",
            thirdHint: "SELECT COUNT(*) AS encounter_count FROM encounters;",
            explanation: `COUNT(*) measures total volume.

This is a foundational KPI used across:
- operations
- finance
- capacity planning`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "c3",
            title: "Grouping Data",
            objective: "Understand how GROUP BY aggregates data by category.",
            sql_focus: ["SELECT", "COUNT", "GROUP BY"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "GROUP BY aggregates data by category.",
            bullets: [
              "Grouping allows comparison across departments, facilities, or payers.",
              "It is the backbone of summary reporting.",
              "Choose the grouping field that matches the leader’s question."
            ],
            example: "SELECT payer, COUNT(*) FROM claims GROUP BY payer;",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "c4",
            title: "Encounters by Department",
            objective: "Group encounters.",
            sql_focus: ["SELECT", "COUNT", "GROUP BY"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: `Leadership wants to understand which departments are seeing the most patients.

Return encounter volume grouped by department_id.

Label the count encounter_count.

This helps identify high-demand areas.`,
            starterQuery: "SELECT department_id, COUNT(*) AS encounter_count FROM encounters GROUP BY department_id;",
            solutionQuery: "SELECT department_id, COUNT(*) AS encounter_count FROM encounters GROUP BY department_id;",
            hint: "Group encounters by department_id.",
            smartHint: "Use GROUP BY department_id and COUNT(*).",
            thirdHint: "SELECT department_id, COUNT(*) AS encounter_count FROM encounters GROUP BY department_id;",
            explanation: `Grouping allows comparison across units.

This helps:
- identify high volume departments
- guide staffing decisions`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "c5",
            title: "Average Metrics",
            objective: "Understand how AVG() calculates averages.",
            sql_focus: ["SELECT", "AVG"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for this lesson.",
            summary: "AVG() calculates averages.",
            bullets: [
              "AVG is commonly used for LOS, charge amount, and delay minutes.",
              "Averages help evaluate efficiency and performance.",
              "Context matters because outliers can distort interpretation."
            ],
            example: "SELECT AVG(departure_minutes) FROM discharges;",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "c6",
            title: "Average Length of Stay",
            objective: "Calculate average LOS.",
            sql_focus: ["SELECT", "AVG"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table for this lesson.",
            challengeCriteria: `Leadership wants to understand overall efficiency.

Return the average length_of_stay across all encounters.

Label the result avg_los.

This helps evaluate throughput performance.`,
            starterQuery: "SELECT AVG(length_of_stay) AS avg_los FROM encounters;",
            solutionQuery: "SELECT AVG(length_of_stay) AS avg_los FROM encounters;",
            hint: "Use AVG on length_of_stay.",
            smartHint: "Use AVG(length_of_stay) and alias it avg_los.",
            thirdHint: "SELECT AVG(length_of_stay) AS avg_los FROM encounters;",
            explanation: `Average LOS is a key efficiency metric.

Higher LOS often indicates:
- bottlenecks
- delays
- complex patient populations`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "c7",
            title: "Scenario: Operational Insight",
            objective: "Interpret department-level LOS variation and recommend the right next step.",
            relevantTables: ["encounters"],
            joinHint: "Think about what operational factors would explain why one department has much higher LOS than others.",
            summary: "One department shows significantly higher LOS than others.",
            prompt: "You ran a query showing that one department has significantly higher length_of_stay than other departments. Explain the most appropriate next step. In your response, mention workflow delays, case complexity, or discharge barriers and explain why ignoring or averaging away the result would be a mistake.",
            expectedKeywords: ["workflow", "delay", "complexity", "discharge", "investigate"],
            minLength: 90,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer explains that high LOS should trigger investigation into discharge delays, workflow issues, or patient complexity rather than being ignored or averaged away.",
            executiveTakeaway: { show: false }
          }
        ]
      }
    ]
  },

  {
    id: "track_applied",
    title: "Applied",
    description: "Applied learning path for CareOps hospital analytics.",
    order: 3,
    categories: [
      {
        id: "applied_trends_investigation",
        title: "Applied Analytics: Trends & Investigation",
        order: 1,
        lessons: [
          {
            kind: "challenge",
            id: "a1",
            title: "Top Departments by Volume",
            objective: "Rank departments by volume.",
            sql_focus: ["SELECT", "COUNT", "GROUP BY", "ORDER BY", "LIMIT"],
            relevantTables: ["encounters"],
            joinHint: "Use encounters as the base table and summarize at the department level.",
            challengeCriteria: `Leadership wants to identify the busiest departments.

Return department_id and encounter volume.
Sort results from highest to lowest volume.
Limit results to the top 5 departments.

This helps prioritize resource allocation and staffing.`,
            starterQuery: "SELECT department_id, COUNT(*) AS encounter_count FROM encounters GROUP BY department_id ORDER BY encounter_count DESC LIMIT 5;",
            solutionQuery: "SELECT department_id, COUNT(*) AS encounter_count FROM encounters GROUP BY department_id ORDER BY encounter_count DESC LIMIT 5;",
            hint: "Group by department_id and count encounters.",
            smartHint: "Use COUNT(*) with GROUP BY department_id and ORDER BY encounter_count DESC.",
            thirdHint: `SELECT department_id, COUNT(*) AS encounter_count
FROM encounters
GROUP BY department_id
ORDER BY encounter_count DESC
LIMIT 5;`,
            explanation: `Ranking allows leadership to focus on the highest-impact areas.

Top departments often:
- drive staffing needs
- create bottlenecks
- influence financial performance`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "a2",
            title: "High Utilization Patients",
            objective: "Find repeat patients.",
            sql_focus: ["SELECT", "COUNT", "GROUP BY", "HAVING"],
            relevantTables: ["encounters"],
            joinHint: "Use encounters and summarize at the patient level.",
            challengeCriteria: `Leadership wants to identify patients with frequent visits.

Return patient_id and number of encounters.
Only include patients with more than 3 encounters.

This helps identify high utilizers who may need care coordination.`,
            starterQuery: "SELECT patient_id, COUNT(*) AS visit_count FROM encounters GROUP BY patient_id HAVING COUNT(*) > 3;",
            solutionQuery: "SELECT patient_id, COUNT(*) AS visit_count FROM encounters GROUP BY patient_id HAVING COUNT(*) > 3;",
            hint: "Group encounters by patient_id.",
            smartHint: "Use HAVING COUNT(*) > 3 after grouping by patient_id.",
            thirdHint: `SELECT patient_id, COUNT(*) AS visit_count
FROM encounters
GROUP BY patient_id
HAVING COUNT(*) > 3;`,
            explanation: `High utilization patients often indicate:
- chronic conditions
- gaps in outpatient care
- potential readmission risk`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "a3",
            title: "Average LOS by Department",
            objective: "Compare department efficiency.",
            sql_focus: ["SELECT", "AVG", "GROUP BY", "ORDER BY"],
            relevantTables: ["encounters"],
            joinHint: "Use encounters and summarize at the department level.",
            challengeCriteria: `Leadership wants to compare efficiency across departments.

Return department_id and average length_of_stay.
Sort from highest to lowest average LOS.

This helps identify departments with potential inefficiencies.`,
            starterQuery: "SELECT department_id, AVG(length_of_stay) AS avg_los FROM encounters GROUP BY department_id ORDER BY avg_los DESC;",
            solutionQuery: "SELECT department_id, AVG(length_of_stay) AS avg_los FROM encounters GROUP BY department_id ORDER BY avg_los DESC;",
            hint: "Use AVG and group by department_id.",
            smartHint: "Sort the grouped results by avg_los descending.",
            thirdHint: `SELECT department_id, AVG(length_of_stay) AS avg_los
FROM encounters
GROUP BY department_id
ORDER BY avg_los DESC;`,
            explanation: `Comparing LOS across departments helps:
- identify operational issues
- surface discharge delays
- guide performance improvement efforts`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "a4",
            title: "Scenario: Investigating a Spike",
            objective: "Interpret a departmental LOS spike and propose the next investigation step.",
            relevantTables: ["encounters"],
            joinHint: "Think about what changed in operations, staffing, or patient mix.",
            summary: "One department’s LOS increased significantly this month.",
            prompt: "You discover that one department’s length_of_stay increased significantly this month. Explain the best next step. In your response, mention patient mix, discharge delays, workflow constraints, or staffing and explain why removing the department from reporting or averaging it away would be a mistake.",
            expectedKeywords: ["patient", "mix", "discharge", "workflow", "staffing", "investigate"],
            minLength: 90,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer recommends investigation into patient mix, discharge barriers, staffing, or workflow constraints rather than ignoring or masking the signal.",
            executiveTakeaway: { show: false }
          }
        ]
      }
    ]
  },

  {
    id: "track_advanced",
    title: "Advanced",
    description: "Advanced learning path for CareOps hospital analytics.",
    order: 4,
    categories: [
      {
        id: "advanced_root_cause_analysis",
        title: "Diagnosis: Root Cause Analysis",
        order: 1,
        lessons: [
          {
            kind: "challenge",
            id: "d1",
            title: "LOS by Payer",
            objective: "Segment LOS by payer.",
            sql_focus: ["SELECT", "AVG", "JOIN", "GROUP BY"],
            relevantTables: ["encounters", "claims"],
            joinHint: "Join claims to encounters on encounter_id so you can compare LOS across payer segments.",
            challengeCriteria: `Leadership suspects payer type may influence LOS.

Return payer and average length_of_stay.

This helps identify whether certain populations are driving inefficiencies.`,
            starterQuery: "SELECT c.payer, AVG(e.length_of_stay) AS avg_los FROM encounters e JOIN claims c ON e.encounter_id = c.encounter_id GROUP BY c.payer;",
            solutionQuery: "SELECT c.payer, AVG(e.length_of_stay) AS avg_los FROM encounters e JOIN claims c ON e.encounter_id = c.encounter_id GROUP BY c.payer;",
            hint: "Join encounters with claims.",
            smartHint: "Group by payer after joining claims to encounters on encounter_id.",
            thirdHint: `SELECT c.payer, AVG(e.length_of_stay) AS avg_los
FROM encounters e
JOIN claims c ON e.encounter_id = c.encounter_id
GROUP BY c.payer;`,
            explanation: `Different payer populations often:
- have different care pathways
- experience delays in discharge or placement

Segmenting data reveals hidden drivers.`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "d2",
            title: "Readmissions by Department",
            objective: "Identify readmission drivers.",
            sql_focus: ["SELECT", "COUNT", "JOIN", "GROUP BY"],
            relevantTables: ["readmissions", "encounters"],
            joinHint: "Use the readmit encounter to connect readmissions back to the department where the readmission occurred.",
            challengeCriteria: `Leadership wants to understand which departments are driving readmissions.

Return department_id and readmission count.

This helps target quality improvement initiatives.`,
            starterQuery: "SELECT e.department_id, COUNT(*) AS readmit_count FROM readmissions r JOIN encounters e ON r.readmit_encounter_id = e.encounter_id GROUP BY e.department_id;",
            solutionQuery: "SELECT e.department_id, COUNT(*) AS readmit_count FROM readmissions r JOIN encounters e ON r.readmit_encounter_id = e.encounter_id GROUP BY e.department_id;",
            hint: "Join readmissions to encounters.",
            smartHint: "Use readmit_encounter_id to connect the readmission record back to encounters, then group by department_id.",
            thirdHint: `SELECT e.department_id, COUNT(*) AS readmit_count
FROM readmissions r
JOIN encounters e ON r.readmit_encounter_id = e.encounter_id
GROUP BY e.department_id;`,
            explanation: `High readmissions may indicate:
- poor discharge planning
- lack of follow-up care
- quality gaps

Department-level analysis helps isolate the issue.`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "d3",
            title: "Denials by Payer",
            objective: "Find financial leakage.",
            sql_focus: ["SELECT", "SUM", "WHERE", "GROUP BY"],
            relevantTables: ["claims"],
            joinHint: "Use claims and isolate denied records before summarizing by payer.",
            challengeCriteria: `Finance wants to understand denial patterns.

Return payer and total denied billed_amount.

This helps identify where revenue is being lost.`,
            starterQuery: "SELECT payer, SUM(billed_amount) AS denied_total FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
            solutionQuery: "SELECT payer, SUM(billed_amount) AS denied_total FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
            hint: "Filter denied claims.",
            smartHint: "Use WHERE claim_status = 'Denied' and SUM(billed_amount), then group by payer.",
            thirdHint: `SELECT payer, SUM(billed_amount) AS denied_total
FROM claims
WHERE claim_status = 'Denied'
GROUP BY payer;`,
            explanation: `Denials impact revenue directly.

Analyzing by payer helps:
- identify contract issues
- improve billing processes
- reduce financial losses`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "d4",
            title: "Scenario: Root Cause Identification",
            objective: "Explain the right next step when a department stands out for readmissions.",
            relevantTables: ["readmissions", "encounters"],
            joinHint: "Think about discharge process, transition of care, and follow-up support.",
            summary: "One department has the highest readmission rate in the organization.",
            prompt: "You find that readmissions are highest in one department. Explain the most appropriate next step. In your response, mention discharge process, follow-up care, care transitions, or quality review and explain why blaming the data or removing the department from analysis would be the wrong move.",
            expectedKeywords: ["discharge", "follow-up", "care", "transition", "quality", "investigate"],
            minLength: 90,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer focuses on discharge process, follow-up, care transitions, or quality review rather than ignoring the result or blaming the data.",
            executiveTakeaway: { show: false }
          }
        ]
      }
    ]
  },

  {
    id: "track_expert",
    title: "Expert",
    description: "Expert learning path for CareOps hospital analytics.",
    order: 5,
    categories: [
      {
        id: "expert_decision_making",
        title: "Executive Analytics & Decision Making",
        order: 1,
        lessons: [
          {
            kind: "scenario",
            id: "e1",
            title: "Identify Top Operational Issue",
            objective: "Prioritize the most urgent operational problem from a set of metrics.",
            relevantTables: ["encounters", "readmissions"],
            joinHint: "Think about how LOS and readmissions together affect flow, quality, and cost.",
            summary: "LOS is rising, readmissions are increasing, and volume is stable.",
            prompt: "Your analysis shows that length_of_stay is rising, readmissions are increasing, and overall volume is stable. Explain what leadership should prioritize and why. In your response, mention discharge efficiency, care transitions, or patient flow and explain why focusing only on volume would miss the real issue.",
            expectedKeywords: ["discharge", "transition", "flow", "readmission", "los", "priority"],
            minLength: 90,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer prioritizes discharge efficiency and care transitions because rising LOS and readmissions together usually signal a process problem rather than simple volume growth.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "e2",
            title: "Executive Summary Thinking",
            objective: "Frame insights for leadership.",
            sql_focus: ["Executive communication"],
            relevantTables: ["encounters"],
            joinHint: "This is a communication exercise, so focus on the issue, likely cause, and next action.",
            challengeCriteria: `You ran an analysis showing high length_of_stay in one department.

Write a summary that includes:
- the key issue
- likely cause
- recommended next step

This simulates real executive communication.`,
            starterQuery: "",
            solutionQuery: "",
            hint: "Focus on impact and action.",
            smartHint: "Explain what happened, why it matters, and what leadership should do next.",
            thirdHint: "Summarize the issue, likely driver, and recommendation clearly in business language.",
            explanation: `Executives care about:
- the problem
- why it matters
- what to do next

Clear communication drives action.`,
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "e3",
            title: "Prioritization",
            objective: "Decide which issue should be addressed first.",
            relevantTables: ["claims", "encounters"],
            joinHint: "Think about operational impact, financial effect, and patient outcomes.",
            summary: "You identify moderate denial issues, severe LOS issues, and minor volume fluctuation.",
            prompt: "You identify moderate denial issues, severe length_of_stay issues, and minor volume fluctuation. Explain what should be prioritized first and why. In your response, mention capacity, cost, patient outcomes, or throughput and explain why volume fluctuation is not the top concern here.",
            expectedKeywords: ["capacity", "cost", "outcomes", "throughput", "los", "priority"],
            minLength: 90,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer prioritizes severe LOS because it affects capacity, cost, and patient outcomes more broadly than minor volume fluctuation.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "e4",
            title: "Action Planning",
            objective: "Translate a high LOS finding into a concrete next step.",
            relevantTables: ["encounters", "discharges"],
            joinHint: "Think about discharge delays, workflow bottlenecks, and downstream process review.",
            summary: "LOS is high in one department.",
            prompt: "LOS is high in one department. Explain the best next action. In your response, mention discharge delays, workflow bottlenecks, or process review and explain why reducing reporting or ignoring the problem would be a poor response.",
            expectedKeywords: ["discharge", "workflow", "bottleneck", "process", "review", "investigate"],
            minLength: 90,
            minimumKeywordMatches: 2,
            feedbackGuide: "A strong answer recommends investigating discharge delays, workflow bottlenecks, or process breakdowns rather than ignoring the problem or reducing visibility.",
            executiveTakeaway: { show: false }
          }
        ]
      }
    ]
  }
];

backfillChallengeCriteria(curriculum);
enforceChallengeCriteria(curriculum);
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
    businessContext: spec.businessContext || null,
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

  if (!["overview", "lesson", "sandbox"].includes(appState.currentView)) {
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
  ["track-overview", "lesson-workspace", "sandbox-workspace"].forEach((id) => {
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

function showOverview() {
  appState.currentView = "overview";
  setSandboxModeUi(false);
  showSection("track-overview");
  document.getElementById("track-overview")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showLessonsWorkspace() {
  ensureCurrentLesson();
  appState.currentView = "lesson";
  setSandboxModeUi(false);
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
  initUiActions();
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
  });
}
