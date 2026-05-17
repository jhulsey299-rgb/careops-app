/* CAREOPS workspace-first app.js
   Full-file replacement.
   Important: to preserve your full lesson catalog exactly, replace the
   fallback curriculum block below with your existing full curriculum array.
*/
(() => {
  "use strict";
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
          summary: `Hospital data is not one giant spreadsheet.
It is a collection of different data types that capture patient care, operations, and reimbursement.`,
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
            hint: "List only these columns, in this order: patient_id, encounter_id, admit_date.",
            smartHint: "Use the exact column order requested: patient_id, encounter_id, admit_date.",
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
          { kind: "concept",
  id: "t5",
  title: "AND vs OR",
  objective: "Understand how AND and OR change the population returned by a query.",
  sql_focus: ["WHERE", "AND", "OR"],
  relevantTables: ["encounters"],
  joinHint: "No join is needed for this lesson.",
  summary: "AND narrows a population because every condition must be true. OR broadens a population because either condition can be true.",
  bullets: [
    "AND requires all listed conditions to be true.",
    "OR returns rows where at least one condition is true.",
    "Using OR when you meant AND can greatly inflate results.",
    "Using AND when you meant OR can accidentally exclude valid rows.",
    "Healthcare analysts must match SQL logic to the exact population definition."
  ],
  example: "Hospital example: ED encounters with LOS greater than 3 days requires AND. ED encounters or ICU encounters requires OR.",
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
      example: "SELECT * FROM encounters ORDER BY admit_date;",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "s17",
      title: "Sort by Date",
      objective: "Order encounters by admit date.",
      sql_focus: ["ORDER BY"],
      relevantTables: ["encounters"],
      challengeCriteria: "Return all encounters sorted by admit_date.",
      starterQuery: "",
      solutionQuery: "SELECT * FROM encounters ORDER BY admit_date;",
      hint: "Use ORDER BY.",
      smartHint: "ORDER BY admit_date",
      thirdHint: "SELECT * FROM encounters ORDER BY admit_date;",
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
      example: "SELECT * FROM encounters ORDER BY admit_date DESC;",
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
      solutionQuery: "SELECT * FROM encounters ORDER BY admit_date DESC;",
      hint: "Use DESC.",
      smartHint: "ORDER BY admit_date DESC",
      thirdHint: "SELECT * FROM encounters ORDER BY admit_date DESC;",
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
      example: "SELECT * FROM encounters ORDER BY department, admit_date DESC;",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "s21",
      title: "Sort by Department and Date",
      objective: "Apply multi-column sorting.",
      sql_focus: ["ORDER BY"],
      relevantTables: ["encounters"],
      challengeCriteria: "Sort encounters by department, then by most recent admit_date.",
      starterQuery: "",
      solutionQuery: "SELECT * FROM encounters ORDER BY department, admit_date DESC;",
      hint: "Use two columns in ORDER BY.",
      smartHint: "ORDER BY department, admit_date DESC",
      thirdHint: "SELECT * FROM encounters ORDER BY department, admit_date DESC;",
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
  objective: "Deliver sorted and interpretable encounter data.",
  relevantTables: ["encounters"],
  joinHint: "Use sorting to make the output useful, then explain the meaning.",
  summary: "A leader wants insight, not raw data.",
  prompt: `A hospital executive asks: "Show me the most recent encounters that may need operational review."

Write a query AND explain what the result means.
Your answer must:
- filter relevant encounters
- sort results by most recent activity
- explain what leadership should take away`,
  expectedKeywords: ["select", "where", "order", "desc"],
  minLength: 80,
  minimumKeywordMatches: 2,
  feedbackGuide: "A strong answer includes filtering, sorting, and a clear explanation of what leadership should learn from the data.",
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
  },
  {
    id: "track_core",
    title: "Core",
    description: "Hospital metrics, aggregation, and real-world analyst thinking using volume, financial, utilization, operational, provider, department, and payment data.",
    order: 2,
    categories: [
      {
        id: "core_volume_activity",
        title: "Volume & Activity Metrics",
        order: 1,
        lessons: [
          {
            kind: "concept",
            id: "cv1",
            title: "Encounter Volume as a KPI",
            objective: "Understand how COUNT turns encounter rows into a basic hospital activity metric.",
            sql_focus: ["COUNT", "Aggregation", "Encounter volume"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed when the metric is only total encounter volume.",
            summary: "Encounter volume tells leaders how much patient activity occurred. It is often the first metric used to understand workload, access, and demand.",
            bullets: [
              "COUNT(*) counts rows in the selected population.",
              "In the encounters table, one row usually represents one visit or stay.",
              "Volume is useful for staffing, capacity planning, access monitoring, and operational trend review.",
              "Volume alone does not explain performance, but it tells you where activity is happening.",
              "Before counting, confirm the table grain so you know what the count represents."
            ],
            example: "Hospital example: counting encounter rows gives total visit volume across the organization.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cv2",
            title: "Total Encounter Volume",
            objective: "Count total encounters across the organization.",
            sql_focus: ["SELECT", "COUNT", "FROM"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table.",
            challengeCriteria: "Return the total number of encounters. Label the result encounter_count.",
            starterQuery: "",
            solutionQuery: "SELECT COUNT(*) AS encounter_count FROM encounters;",
            hint: "Use COUNT(*) on the encounters table.",
            smartHint: "Alias the count as encounter_count so the output is readable.",
            thirdHint: "SELECT COUNT(*) AS encounter_count FROM encounters;",
            explanation: "This produces a basic activity metric: total encounter volume.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cv3",
            title: "Patient Count vs Encounter Count",
            objective: "Distinguish total visits from unique patients.",
            sql_focus: ["COUNT", "COUNT DISTINCT", "Grain"],
            relevantTables: ["encounters", "patients"],
            joinHint: "No join is needed if patient_id is already on encounters.",
            summary: "Encounter volume and unique patient volume answer different questions. Encounters measure activity. Unique patients measure how many people were served.",
            bullets: [
              "COUNT(*) counts visits when used on the encounters table.",
              "COUNT(DISTINCT patient_id) counts unique people represented in those visits.",
              "A patient with multiple visits increases encounter volume but should count once in a unique-patient metric.",
              "Confusing these metrics can overstate patient reach.",
              "Leaders often need both metrics side by side."
            ],
            example: "Hospital example: 1,000 encounters may represent 850 unique patients if some patients visited more than once.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cv4",
            title: "Unique Patient Volume",
            objective: "Count unique patients represented in encounters.",
            sql_focus: ["SELECT", "COUNT", "DISTINCT"],
            relevantTables: ["encounters"],
            joinHint: "Use patient_id from encounters.",
            challengeCriteria: "Return the number of unique patients in encounters. Label the result unique_patient_count.",
            starterQuery: "",
            solutionQuery: "SELECT COUNT(DISTINCT patient_id) AS unique_patient_count FROM encounters;",
            hint: "Use COUNT(DISTINCT patient_id).",
            smartHint: "COUNT(DISTINCT patient_id) prevents counting the same patient more than once.",
            thirdHint: "SELECT COUNT(DISTINCT patient_id) AS unique_patient_count FROM encounters;",
            explanation: "This avoids overstating the number of people served when patients have multiple encounters.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cv5",
            title: "Department Volume",
            objective: "Use GROUP BY to compare activity across hospital departments.",
            sql_focus: ["GROUP BY", "COUNT"],
            relevantTables: ["encounters", "departments"],
            joinHint: "You can group by department from encounters, or join departments for department_name and service_line.",
            summary: "Department volume shows where patient activity is concentrated. This is one of the most common operational summaries in hospital reporting.",
            bullets: [
              "GROUP BY produces one row per department.",
              "COUNT(*) gives encounter volume within each department group.",
              "Department volume helps leaders understand workload distribution.",
              "High volume does not automatically mean poor performance, but it may explain operational pressure.",
              "Readable department names usually require either a department field or a join to departments."
            ],
            example: "Hospital example: ED, ICU, imaging, and outpatient clinics may have very different volume patterns.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cv6",
            title: "Encounters by Department",
            objective: "Group encounter volume by department.",
            sql_focus: ["SELECT", "COUNT", "GROUP BY"],
            relevantTables: ["encounters"],
            joinHint: "Use the department column on encounters for this version.",
            challengeCriteria: "Return department and encounter count by department. Label the count encounter_count.",
            starterQuery: "",
            solutionQuery: "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
            hint: "Select department and COUNT(*), then group by department.",
            smartHint: "Any non-aggregated selected field must be in the GROUP BY.",
            thirdHint: "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
            explanation: "This creates a department-level volume summary.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cv7",
            title: "Encounter Type Mix",
            objective: "Understand why encounter type changes how volume should be interpreted.",
            sql_focus: ["GROUP BY", "encounter_type"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed when encounter_type is on encounters.",
            summary: "Hospital volume becomes more meaningful when it is separated by encounter type, such as ED, inpatient, observation, or outpatient activity.",
            bullets: [
              "Encounter type adds operational context to raw volume.",
              "ED volume may suggest access and throughput pressure.",
              "Inpatient volume affects bed capacity and staffing.",
              "Outpatient volume may reflect clinic access and referral demand.",
              "Mix matters because not all encounters consume the same resources."
            ],
            example: "Hospital example: 500 outpatient encounters and 500 inpatient encounters have very different operational implications.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cv8",
            title: "Volume by Encounter Type",
            objective: "Summarize encounters by encounter type.",
            sql_focus: ["SELECT", "COUNT", "GROUP BY"],
            relevantTables: ["encounters"],
            joinHint: "Use only the encounters table.",
            challengeCriteria: "Return encounter_type and encounter count by encounter_type. Sort the highest volume first.",
            starterQuery: "",
            solutionQuery: "SELECT encounter_type, COUNT(*) AS encounter_count FROM encounters GROUP BY encounter_type ORDER BY encounter_count DESC;",
            hint: "Group by encounter_type and sort by the count descending.",
            smartHint: "Use ORDER BY encounter_count DESC after the GROUP BY.",
            thirdHint: "SELECT encounter_type, COUNT(*) AS encounter_count FROM encounters GROUP BY encounter_type ORDER BY encounter_count DESC;",
            explanation: "This shows the mix of care activity across encounter types.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "cv9",
            title: "Scenario: How Busy Were We?",
            objective: "Explain volume using both total encounters and unique patients.",
            relevantTables: ["encounters"],
            joinHint: "Start with encounters and decide whether the leader is asking about visits, people, or both.",
            summary: "A COO asks how busy the hospital was last month and whether that reflects more visits or more unique patients.",
            prompt: "Write a response explaining what metrics you would produce to answer this question. Include total encounters, unique patients, and why those two metrics can tell different stories.",
            expectedKeywords: ["count", "distinct", "encounters", "patients", "volume"],
            minLength: 100,
            minimumKeywordMatches: 3,
            feedbackGuide: "A strong answer explains both total encounter volume and unique patient volume, then interprets the difference between visits and people.",
            executiveTakeaway: { show: false }
          }
        ]
      },
      {
        id: "core_financial_metrics",
        title: "Financial Metrics",
        order: 2,
        lessons: [
          {
            kind: "concept",
            id: "cf1",
            title: "Gross Charges",
            objective: "Understand how SUM creates a gross charge metric.",
            sql_focus: ["SUM", "Financial metrics"],
            relevantTables: ["charges"],
            joinHint: "No join is needed for a basic total charge metric.",
            summary: "Gross charges show billed activity before adjustments, denials, or claim collections. They are useful, but they are not the same as cash collected.",
            bullets: [
              "SUM(amount) adds charge dollars across rows.",
              "Charges are gross billed values, not guaranteed revenue.",
              "Charge totals help quantify service activity and financial exposure.",
              "Leaders should avoid treating charges as actual claim collections.",
              "Financial metrics require clear definitions."
            ],
            example: "Hospital example: a high-charge department may have high service intensity but not necessarily high net revenue.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cf2",
            title: "Total Gross Charges",
            objective: "Calculate total gross charges.",
            sql_focus: ["SELECT", "SUM"],
            relevantTables: ["charges"],
            joinHint: "Use only the charges table.",
            challengeCriteria: "Return total gross charges from charges. Label the result gross_charges.",
            starterQuery: "",
            solutionQuery: "SELECT SUM(amount) AS gross_charges FROM charges;",
            hint: "Use SUM(amount).",
            smartHint: "Alias the result as gross_charges.",
            thirdHint: "SELECT SUM(amount) AS gross_charges FROM charges;",
            explanation: "This measures total billed charge activity.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cf3",
            title: "Average Charge Per Line",
            objective: "Use AVG to understand typical charge size while recognizing limitations.",
            sql_focus: ["AVG", "Financial interpretation"],
            relevantTables: ["charges"],
            joinHint: "No join is needed for average charge amount.",
            summary: "Average charge amount shows the typical charge line size, but it can be distorted by outliers and does not equal average encounter cost.",
            bullets: [
              "AVG(amount) calculates the average charge row amount.",
              "Charge-line average is different from encounter-level average charges.",
              "Large procedures can distort averages.",
              "Use the metric only if the row grain is understood.",
              "Financial averages should always be interpreted with caution."
            ],
            example: "Hospital example: one operating room charge line can raise the average even if most charges are small ancillary items.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cf4",
            title: "Average Charge Amount",
            objective: "Calculate average charge amount across charge rows.",
            sql_focus: ["SELECT", "AVG"],
            relevantTables: ["charges"],
            joinHint: "Use the charge row grain.",
            challengeCriteria: "Return the average amount from charges. Label the result avg_amount.",
            starterQuery: "",
            solutionQuery: "SELECT AVG(amount) AS avg_amount FROM charges;",
            hint: "Use AVG(amount).",
            smartHint: "Remember this is average per charge row, not necessarily per encounter.",
            thirdHint: "SELECT AVG(amount) AS avg_amount FROM charges;",
            explanation: "This reports the average financial value of a charge line.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cf5",
            title: "Payer Mix and Financial Risk",
            objective: "Understand why payer grouping matters in hospital finance.",
            sql_focus: ["GROUP BY", "Payer mix"],
            relevantTables: ["claims", "charges", "patients"],
            joinHint: "Use the payer field on claims or charges when payer is already available.",
            summary: "Payer mix influences reimbursement, denial patterns, and financial risk. Aggregating by payer helps leaders see where dollars are concentrated.",
            bullets: [
              "Payer categories often reimburse differently.",
              "High charge volume under one payer may not equal high claim collections.",
              "Payer grouping supports revenue cycle prioritization.",
              "Claims are usually better for denial analysis than charges alone.",
              "Payer mix should be interpreted with both volume and dollars."
            ],
            example: "Hospital example: Medicare, Medicaid, Commercial, and Self Pay may each carry different reimbursement risk.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cf6",
            title: "Billed Amount by Payer",
            objective: "Summarize billed claim dollars by payer.",
            sql_focus: ["SELECT", "SUM", "GROUP BY", "ORDER BY"],
            relevantTables: ["claims"],
            joinHint: "Use claims because billed_amount and payer are on the same table.",
            challengeCriteria: "Return payer and total billed_amount by payer. Label the total total_billed_amount and sort highest first.",
            starterQuery: "",
            solutionQuery: "SELECT payer, SUM(billed_amount) AS total_billed_amount FROM claims GROUP BY payer ORDER BY total_billed_amount DESC;",
            hint: "Group by payer and sum billed_amount.",
            smartHint: "Use ORDER BY total_billed_amount DESC so the largest payer segments appear first.",
            thirdHint: "SELECT payer, SUM(billed_amount) AS total_billed_amount FROM claims GROUP BY payer ORDER BY total_billed_amount DESC;",
            explanation: "This identifies which payer groups represent the largest billed-dollar exposure.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cf7",
            title: "Claims vs Charges",
            objective: "Distinguish billed activity from actual payment activity.",
            sql_focus: ["SUM", "Claims", "Net revenue"],
            relevantTables: ["charges", "claims"],
            joinHint: "Use claims for billed/reimbursed activity and charges or claims for billed value.",
            summary: "Claims represent reimbursement activity. Charges represent billed amounts. Comparing the two helps leaders understand revenue cycle performance.",
            bullets: [
              "Charges show gross billed value.",
              "Claims show payer reimbursement status and billed activity.",
              "Claim Collections are usually lower than gross charges.",
              "Payment data is crucial for revenue cycle performance.",
              "Do not use charges alone to claim revenue was collected."
            ],
            example: "Hospital example: a department may generate high charges but lower paid claim activity due to payer mix or denials.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cf8",
            title: "Total Billed by Payer",
            objective: "Summarize payment activity by payer.",
            sql_focus: ["SELECT", "SUM", "GROUP BY"],
            relevantTables: ["claims"],
            joinHint: "Use claims if your dataset includes billed_amount and payer.",
            challengeCriteria: "Return payer and total billed_amount by payer. Label the result total_claims.",
            starterQuery: "",
            solutionQuery: "SELECT payer, SUM(billed_amount) AS total_claims FROM claims GROUP BY payer;",
            hint: "Group claims by payer.",
            smartHint: "Use SUM(billed_amount), not SUM(billed_amount).",
            thirdHint: "SELECT payer, SUM(billed_amount) AS total_claims FROM claims GROUP BY payer;",
            explanation: "This shows where received payment dollars are coming from by payer.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "cf9",
            title: "Scenario: Financial Snapshot",
            objective: "Explain why charges and claims should not be treated as the same metric.",
            relevantTables: ["charges", "claims"],
            joinHint: "Think about which table represents billed value versus billed/reimbursed activity.",
            summary: "A finance leader asks why gross charges increased but paid claims did not increase at the same rate.",
            prompt: "Explain how you would investigate this using charges, claims, and claims. Mention gross charges, claims or claim collections, payer mix, and why a rise in charges does not automatically mean a rise in paid claims.",
            expectedKeywords: ["charges", "payer", "claim collections", "claims"],
            minLength: 110,
            minimumKeywordMatches: 3,
            feedbackGuide: "A strong answer separates gross billed activity from payment activity and identifies payer mix or claim status as possible drivers.",
            executiveTakeaway: { show: false }
          }
        ]
      },
      {
        id: "core_utilization_behavior",
        title: "Utilization & Patient Behavior",
        order: 3,
        lessons: [
          {
            kind: "concept",
            id: "cu1",
            title: "Encounters per Patient",
            objective: "Use grouping to measure utilization at the patient level.",
            sql_focus: ["GROUP BY", "COUNT", "Patient utilization"],
            relevantTables: ["encounters", "patients"],
            joinHint: "Start with encounters because utilization is based on visit activity.",
            summary: "Encounters per patient helps identify utilization patterns and repeat use of hospital services.",
            bullets: [
              "Grouping by patient_id creates one row per patient.",
              "COUNT(*) then measures visits per patient.",
              "Repeat utilization may reflect chronic illness, access barriers, or care coordination needs.",
              "High utilization should trigger investigation, not blame.",
              "Patient-level metrics require privacy and responsible interpretation."
            ],
            example: "Hospital example: patients with many ED visits may need outpatient support or care management.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cu2",
            title: "Visits per Patient",
            objective: "Count encounters for each patient.",
            sql_focus: ["SELECT", "COUNT", "GROUP BY"],
            relevantTables: ["encounters"],
            joinHint: "Use encounters and group by patient_id.",
            challengeCriteria: "Return patient_id and visit count for each patient. Label the count visit_count.",
            starterQuery: "",
            solutionQuery: "SELECT patient_id, COUNT(*) AS visit_count FROM encounters GROUP BY patient_id;",
            hint: "Group by patient_id.",
            smartHint: "COUNT(*) counts encounters within each patient group.",
            thirdHint: "SELECT patient_id, COUNT(*) AS visit_count FROM encounters GROUP BY patient_id;",
            explanation: "This turns encounter rows into a patient-level utilization metric.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cu3",
            title: "High Utilizers",
            objective: "Use HAVING to identify patients above a utilization threshold.",
            sql_focus: ["HAVING", "Thresholds"],
            relevantTables: ["encounters"],
            joinHint: "No join is needed for the basic high-utilizer count.",
            summary: "High utilizers are patients whose visit count exceeds a defined threshold. The threshold must match the business question.",
            bullets: [
              "HAVING filters after grouping.",
              "WHERE filters rows before grouping.",
              "A threshold such as more than 3 visits should be clinically or operationally justified.",
              "High utilizers may need care coordination, social support, or follow-up access.",
              "Always validate whether repeat visits are expected for certain patient populations."
            ],
            example: "Hospital example: patients with more than 3 ED visits in a short period may be reviewed for case management outreach.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cu4",
            title: "Find High Utilizers",
            objective: "Return patients with more than 3 encounters.",
            sql_focus: ["GROUP BY", "HAVING", "COUNT"],
            relevantTables: ["encounters"],
            joinHint: "Group by patient_id first, then filter the grouped count.",
            challengeCriteria: "Return patient_id and visit_count for patients with more than 3 encounters.",
            starterQuery: "",
            solutionQuery: "SELECT patient_id, COUNT(*) AS visit_count FROM encounters GROUP BY patient_id HAVING COUNT(*) > 3;",
            hint: "Use HAVING COUNT(*) > 3.",
            smartHint: "The threshold applies after patient-level grouping.",
            thirdHint: "SELECT patient_id, COUNT(*) AS visit_count FROM encounters GROUP BY patient_id HAVING COUNT(*) > 3;",
            explanation: "This identifies patients who stand out by utilization volume.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cu5",
            title: "Risk Score Segmentation",
            objective: "Use patient attributes to segment utilization results.",
            sql_focus: ["JOIN", "GROUP BY", "Risk segmentation"],
            relevantTables: ["patients", "encounters"],
            joinHint: "Join encounters to patients on patient_id to bring in risk_score.",
            summary: "Utilization becomes more actionable when combined with patient context, such as risk score or payer category.",
            bullets: [
              "Joining patients to encounters enriches utilization analysis.",
              "Risk score can help prioritize outreach or care coordination.",
              "Segmentation prevents one-size-fits-all interpretation.",
              "High utilization with high risk may require a different response than high utilization with low risk.",
              "Context makes utilization metrics more useful."
            ],
            example: "Hospital example: high-risk patients with repeat ED visits may be prioritized for care management review.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cu6",
            title: "Utilization by Insurance Type",
            objective: "Compare encounter volume by insurance type.",
            sql_focus: ["JOIN", "COUNT", "GROUP BY"],
            relevantTables: ["patients", "encounters"],
            joinHint: "Join encounters to patients using patient_id.",
            challengeCriteria: "Return insurance_type and encounter count by insurance_type. Label the count encounter_count.",
            starterQuery: "",
            solutionQuery: "SELECT p.insurance_type, COUNT(*) AS encounter_count FROM encounters e JOIN patients p ON e.patient_id = p.patient_id GROUP BY p.insurance_type;",
            hint: "Join patients so you can group by insurance_type.",
            smartHint: "Use encounters for visit activity and patients for insurance_type.",
            thirdHint: "SELECT p.insurance_type, COUNT(*) AS encounter_count FROM encounters e JOIN patients p ON e.patient_id = p.patient_id GROUP BY p.insurance_type;",
            explanation: "This compares utilization across payer-related patient segments.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cu7",
            title: "Appointment No-Shows as Utilization Signals",
            objective: "Understand why appointment outcomes matter for access and care continuity.",
            sql_focus: ["Appointments", "COUNT", "GROUP BY"],
            relevantTables: ["appointments", "patients", "providers"],
            joinHint: "Use appointments for scheduling status and optionally join providers or departments for context.",
            summary: "No-shows are not just scheduling issues. They can affect access, revenue, provider productivity, and downstream utilization.",
            bullets: [
              "Appointment status can show completed, canceled, or no-show activity.",
              "No-show volume may indicate access barriers or communication gaps.",
              "Department-level no-show review supports operational improvement.",
              "Provider-level no-show review should be interpreted carefully and fairly.",
              "No-show metrics connect outpatient access to broader hospital utilization."
            ],
            example: "Hospital example: high no-show rates in primary care may lead to poorer chronic disease management and higher ED use.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cu8",
            title: "No-Shows by Department",
            objective: "Count no-show appointments by department.",
            sql_focus: ["WHERE", "COUNT", "GROUP BY"],
            relevantTables: ["appointments"],
            joinHint: "Use the appointments table because status and department are available there.",
            challengeCriteria: "Return department and no-show appointment count for appointments where status is 'No Show'. Label the count no_show_count.",
            starterQuery: "",
            solutionQuery: "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department;",
            hint: "Filter to status = 'No Show', then group by department.",
            smartHint: "WHERE happens before GROUP BY.",
            thirdHint: "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department;",
            explanation: "This identifies where missed appointments are concentrated.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "cu9",
            title: "Scenario: Patient Utilization Review",
            objective: "Recommend a responsible next step after finding high utilizers and no-show patterns.",
            relevantTables: ["encounters", "appointments", "patients"],
            joinHint: "Think about how visits, appointment behavior, and patient context can be combined responsibly.",
            summary: "Leadership sees high repeat ED use and high primary care no-shows in the same service area.",
            prompt: "Explain what you would analyze next and why. Mention repeat encounters, no-shows, patient risk or payer context, and how this could support care coordination rather than simply blaming patients.",
            expectedKeywords: ["repeat", "no-show", "risk", "care", "coordination"],
            minLength: 120,
            minimumKeywordMatches: 3,
            feedbackGuide: "A strong answer connects utilization to access barriers, risk, and care coordination rather than treating high use as a simple patient behavior problem.",
            executiveTakeaway: { show: false }
          }
        ]
      },
      {
        id: "core_operational_performance",
        title: "Operational Performance",
        order: 4,
        lessons: [
          {
            kind: "concept",
            id: "co1",
            title: "Throughput Metrics Beyond Volume",
            objective: "Understand operational performance measures that describe patient flow.",
            sql_focus: ["AVG", "MIN", "MAX", "Operational metrics"],
            relevantTables: ["encounters", "discharges", "observations"],
            joinHint: "Choose the table that contains the operational event or delay you are measuring.",
            summary: "Operational performance looks at how care moves, not just how much care occurred. Throughput metrics help leaders identify bottlenecks.",
            bullets: [
              "Volume tells how much activity happened.",
              "Throughput tells how efficiently activity moved through the system.",
              "Discharge delays affect capacity and bed availability.",
              "Observation hours can reveal utilization and flow issues.",
              "Operational metrics often require careful definitions."
            ],
            example: "Hospital example: two departments with similar volume may have very different discharge delay patterns.",
            executiveTakeaway: { show: false }
          },
          {
  kind: "challenge",
  id: "co2",
  title: "Observation Stays Over 48 Hours",
  objective: "Identify observation stays that exceed the 48-hour threshold.",
  sql_focus: ["WHERE", "Observation hours", "Thresholds"],
  relevantTables: ["observations"],
  joinHint: "Use observations because obs_hours is the target field.",
  challengeCriteria: "Return all rows from observations where obs_hours is greater than 48.",
  starterQuery: "",
  solutionQuery: "SELECT * FROM observations WHERE obs_hours > 48;",
  hint: "Filter the observations table using obs_hours.",
  smartHint: "Use WHERE obs_hours > 48.",
  thirdHint: "SELECT * FROM observations WHERE obs_hours > 48;",
  explanation: "Observation stays over 48 hours can indicate utilization review issues, placement delays, documentation gaps, or patients who may need inpatient review.",
  executiveTakeaway: { show: false }
},
{
  kind: "concept",
  id: "co3",
  title: "Observation >48 Hours as a Utilization Signal",
  objective: "Understand why long observation stays matter operationally, financially, and from a compliance standpoint.",
  sql_focus: ["Observation", "Utilization review", "Threshold metrics"],
  relevantTables: ["observations"],
  joinHint: "No join is needed for basic observation duration review.",
  summary: "Observation stays over 48 hours are a warning signal. They may suggest status assignment problems, delayed placement, payer risk, or gaps in utilization review workflow.",
  bullets: [
    "Observation is intended for short-stay evaluation and treatment.",
    "When obs_hours exceeds 48, leaders should ask whether status, placement, or clinical progression is creating delays.",
    "Long observation stays can affect reimbursement, compliance, patient experience, and bed flow.",
    "The metric should be reviewed by facility, department, conversion status, and Code 44 flag.",
    "A high count does not prove failure by itself, but it tells leaders where to investigate."
  ],
  example: "Hospital example: if one facility has many observation stays over 48 hours, utilization review may need to examine status assignment, physician documentation, and inpatient conversion patterns.",
  executiveTakeaway: { show: false }
},
{
  kind: "challenge",
  id: "co4",
  title: "Observation >48 Hours by Department",
  objective: "Summarize long observation stays by department.",
  sql_focus: ["WHERE", "COUNT", "GROUP BY", "ORDER BY"],
  relevantTables: ["observations"],
  joinHint: "Use observations because department and obs_hours are available there.",
  challengeCriteria: "Return department and count of observation stays over 48 hours. Label the count obs_over_48_count and sort highest first.",
  starterQuery: "",
  solutionQuery: "SELECT department, COUNT(*) AS obs_over_48_count FROM observations WHERE obs_hours > 48 GROUP BY department ORDER BY obs_over_48_count DESC;",
  hint: "Filter to obs_hours > 48, group by department, and count rows.",
  smartHint: "Use WHERE before GROUP BY, then ORDER BY the count descending.",
  thirdHint: "SELECT department, COUNT(*) AS obs_over_48_count FROM observations WHERE obs_hours > 48 GROUP BY department ORDER BY obs_over_48_count DESC;",
  explanation: "This turns long observation stays into an actionable department-level utilization review metric.",
  executiveTakeaway: { show: false }
},
          {
            kind: "concept",
            id: "co5",
            title: "Discharge Delay Metrics",
            objective: "Use discharge workflow data to measure delays after discharge orders.",
            sql_focus: ["AVG", "Discharge workflow"],
            relevantTables: ["discharges"],
            joinHint: "Use discharges for order-to-departure timing fields.",
            summary: "Discharge delay metrics help explain bed capacity pressure. They are especially valuable when leaders need to understand why patients are not leaving after discharge orders.",
            bullets: [
              "Discharge order time and departure time measure different workflow moments.",
              "Delay minutes can identify operational bottlenecks.",
              "Transport delays are one possible driver.",
              "Department-level delay summaries help target process improvement.",
              "These metrics should be validated because workflow documentation may vary."
            ],
            example: "Hospital example: if departure happens hours after discharge order, bed availability may be delayed even though the clinical discharge decision was made.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "co6",
            title: "Average Departure Delay",
            objective: "Calculate average time from discharge order to departure.",
            sql_focus: ["AVG", "Calculated fields"],
            relevantTables: ["discharges"],
            joinHint: "Use discharge_order_minutes and departure_minutes from discharges.",
            challengeCriteria: "Return average departure delay calculated as departure_minutes - discharge_order_minutes. Label it avg_departure_delay.",
            starterQuery: "",
            solutionQuery: "SELECT AVG(departure_minutes - discharge_order_minutes) AS avg_departure_delay FROM discharges;",
            hint: "Subtract discharge_order_minutes from departure_minutes inside AVG.",
            smartHint: "AVG(departure_minutes - discharge_order_minutes)",
            thirdHint: "SELECT AVG(departure_minutes - discharge_order_minutes) AS avg_departure_delay FROM discharges;",
            explanation: "This estimates average delay between discharge order and physical departure.",
            executiveTakeaway: { show: false }
          },
          {
  kind: "concept",
  id: "co7",
  title: "ED Boarding as a Capacity Signal",
  objective: "Understand why ED boarding reflects downstream hospital capacity pressure.",
  sql_focus: ["ED boarding", "Throughput", "Capacity"],
  relevantTables: ["encounters", "discharges", "observations"],
  joinHint: "Start with encounters for ED volume, then use discharges or observations to investigate downstream flow.",
  summary: "ED boarding is often a symptom of hospital-wide flow problems. The emergency department may feel like the problem, but the driver is often inpatient bed availability, discharge timing, observation flow, or placement delays.",
  bullets: [
    "ED boarding means patients remain in the ED while waiting for an inpatient or observation bed.",
    "Boarding can indicate inpatient capacity pressure, delayed discharges, or inefficient bed turnover.",
    "Stable ED volume can still produce boarding if beds are blocked downstream.",
    "Useful drilldowns include facility, department, encounter type, discharge delay, observation hours, and conversion status.",
    "Boarding is a patient safety and operational risk, not just an ED inconvenience."
  ],
  example: "Hospital example: if ED volume is stable but boarding worsens, leaders should review discharge delays, observation stays, and inpatient bed availability before blaming ED intake alone.",
  executiveTakeaway: { show: false }
},
{
  kind: "challenge",
  id: "co8",
  title: "ED Capacity Review Cohort",
  objective: "Build a focused ED cohort for capacity review.",
  sql_focus: ["WHERE", "AND", "Encounter type", "Capacity review"],
  relevantTables: ["encounters"],
  joinHint: "Use encounters because department and encounter_type are available there.",
  challengeCriteria: "Return all rows from encounters where department equals 'Emergency Department' and encounter_type equals 'Inpatient'.",
  starterQuery: "",
  solutionQuery: "SELECT * FROM encounters WHERE department = 'Emergency Department' AND encounter_type = 'Inpatient';",
  hint: "Use two filters joined with AND.",
  smartHint: "Filter department to Emergency Department and encounter_type to Inpatient.",
  thirdHint: "SELECT * FROM encounters WHERE department = 'Emergency Department' AND encounter_type = 'Inpatient';",
  explanation: "This creates a review cohort for ED patients who required inpatient-level care, which can support capacity and boarding investigation.",
  executiveTakeaway: { show: false }
},
{
  kind: "scenario",
  id: "co9",
  title: "Scenario: ED Boarding Capacity Review",
  objective: "Explain how to investigate ED boarding using volume, discharge, and observation context.",
  relevantTables: ["encounters", "discharges", "observations"],
  joinHint: "Start with ED encounters, then investigate downstream discharge and observation flow.",
  summary: "Leadership says the ED is overcrowded, but total ED volume has not changed much.",
  prompt: "Explain how you would investigate whether ED boarding is being driven by downstream capacity problems. Mention ED volume, inpatient bed availability or inpatient demand, discharge delays, observation hours over 48, facility or department segmentation, and why stable volume does not rule out a throughput problem.",
  expectedKeywords: ["ed", "boarding", "volume", "discharge", "observation", "capacity"],
  minLength: 140,
  minimumKeywordMatches: 5,
  feedbackGuide: "A strong answer explains that ED boarding can be caused by downstream hospital flow problems even when ED volume is stable.",
  executiveTakeaway: { show: false }
}
        ]
      },
      {
        id: "core_reporting_insight",
        title: "Reporting & Insight",
        order: 5,
        lessons: [
          {
            kind: "concept",
            id: "cr1",
            title: "Combining Metrics for Leadership",
            objective: "Understand why leadership reports usually combine volume, financial, utilization, and operational metrics.",
            sql_focus: ["Multiple aggregates", "Interpretation"],
            relevantTables: ["encounters", "charges", "claims"],
            joinHint: "Combine tables only when the metric definitions require it and the join grain is clear.",
            summary: "Real hospital reporting rarely uses one metric. Leadership needs a balanced view of volume, financial performance, utilization, and operational flow.",
            bullets: [
              "Volume explains workload.",
              "Financial metrics explain billed value and payment activity.",
              "Utilization metrics explain patient behavior and repeat use.",
              "Operational metrics explain throughput and bottlenecks.",
              "Good reporting connects metrics to decisions."
            ],
            example: "Hospital example: a department with high volume, high no-shows, and low claims may need a different response than one with high volume and strong claim collections.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cr2",
            title: "Department Volume with Average Risk",
            objective: "Join patients to encounters and summarize department volume with average risk score.",
            sql_focus: ["JOIN", "COUNT", "AVG", "GROUP BY"],
            relevantTables: ["encounters", "patients"],
            joinHint: "Join encounters to patients on patient_id.",
            challengeCriteria: "Return department, encounter count, and average patient risk_score by department. Label the metrics encounter_count and avg_risk_score.",
            starterQuery: "",
            solutionQuery: "SELECT e.department, COUNT(*) AS encounter_count, AVG(p.risk_score) AS avg_risk_score FROM encounters e JOIN patients p ON e.patient_id = p.patient_id GROUP BY e.department;",
            hint: "Use encounters for department and patients for risk_score.",
            smartHint: "Both COUNT(*) and AVG(p.risk_score) can be calculated after grouping by e.department.",
            thirdHint: "SELECT e.department, COUNT(*) AS encounter_count, AVG(p.risk_score) AS avg_risk_score FROM encounters e JOIN patients p ON e.patient_id = p.patient_id GROUP BY e.department;",
            explanation: "This adds patient context to a department-level volume report.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cr3",
            title: "Ordering for Action",
            objective: "Use ORDER BY to prioritize what leaders see first.",
            sql_focus: ["ORDER BY", "Prioritization"],
            relevantTables: ["encounters", "claims", "charges"],
            joinHint: "Sorting comes after aggregation when prioritizing summarized results.",
            summary: "Ordering is not cosmetic. It determines which risks, opportunities, or problems are most visible to decision-makers.",
            bullets: [
              "Sort high-to-low when surfacing biggest volume, dollars, or risk.",
              "Sort low-to-high when looking for lowest performance or missing activity.",
              "Ordering supports prioritization.",
              "Use aliases so ORDER BY is readable.",
              "A sorted report is easier to act on than an unsorted table."
            ],
            example: "Hospital example: sorting denial dollars highest first helps revenue cycle leaders focus on the largest leakage areas.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cr4",
            title: "Top Payers by Denied Dollars",
            objective: "Rank payers by denied billed amount.",
            sql_focus: ["WHERE", "SUM", "GROUP BY", "ORDER BY"],
            relevantTables: ["claims"],
            joinHint: "Use claims because payer, claim_status, and billed_amount are available there.",
            challengeCriteria: "Return payer and denied billed amount for denied claims only. Label the total denied_billed_amount and sort highest first.",
            starterQuery: "",
            solutionQuery: "SELECT payer, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_billed_amount DESC;",
            hint: "Filter to denied claims before grouping.",
            smartHint: "Use WHERE claim_status = 'Denied', then GROUP BY payer.",
            thirdHint: "SELECT payer, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_billed_amount DESC;",
            explanation: "This prioritizes payer groups by denied dollar exposure.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cr5",
            title: "Thresholds and HAVING",
            objective: "Use HAVING to filter summary reports to meaningful groups.",
            sql_focus: ["HAVING", "Thresholds"],
            relevantTables: ["encounters", "claims", "appointments"],
            joinHint: "HAVING applies to grouped results after aggregation.",
            summary: "Thresholds help analysts focus leadership attention on groups that are large enough or risky enough to matter.",
            bullets: [
              "WHERE filters raw rows before aggregation.",
              "HAVING filters groups after aggregation.",
              "Thresholds should be justified by the business question.",
              "HAVING is useful for high volume departments, repeat patients, and large denied-dollar payer groups.",
              "Do not hide important small groups if the issue is high risk."
            ],
            example: "Hospital example: show only departments with more than 100 encounters so leaders focus on high-volume operational areas.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cr6",
            title: "High-Volume Departments with No-Shows",
            objective: "Filter grouped appointment results using HAVING.",
            sql_focus: ["WHERE", "GROUP BY", "HAVING"],
            relevantTables: ["appointments"],
            joinHint: "Use appointments because status and department are available there.",
            challengeCriteria: "Return departments with more than 10 no-show appointments. Include department and no_show_count.",
            starterQuery: "",
            solutionQuery: "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department HAVING COUNT(*) > 10;",
            hint: "Filter to no-shows first, then use HAVING on the grouped count.",
            smartHint: "WHERE status = 'No Show' happens before GROUP BY. HAVING COUNT(*) > 10 happens after.",
            thirdHint: "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department HAVING COUNT(*) > 10;",
            explanation: "This identifies departments where no-show volume is high enough to require review.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "concept",
            id: "cr7",
            title: "Insight Statements",
            objective: "Translate a metric result into a leadership-ready insight.",
            sql_focus: ["Interpretation", "Executive communication"],
            relevantTables: ["encounters", "claims", "appointments"],
            joinHint: "The query creates the evidence; the insight explains why it matters.",
            summary: "An analyst's job is not finished when the query runs. The result must be translated into what leadership should understand or do next.",
            bullets: [
              "State what changed or stood out.",
              "Explain why it matters operationally, financially, or clinically.",
              "Mention what should be investigated next.",
              "Avoid overstating causation from a summary metric alone.",
              "Good insight is clear, cautious, and action-oriented."
            ],
            example: "Hospital example: 'Denied dollars are concentrated in two payer groups, so revenue cycle should review authorization and documentation workflows for those payers.'",
            executiveTakeaway: { show: false }
          },
          {
            kind: "challenge",
            id: "cr8",
            title: "Explain a Denial Finding",
            objective: "Write an insight statement based on a payer denial summary.",
            challengeMode: "text",
            sql_focus: ["Interpretation", "Financial insight"],
            relevantTables: ["claims"],
            joinHint: "This is an interpretation exercise based on a grouped denial summary.",
            challengeCriteria: `A payer summary shows that one payer has the highest denied billed amount.
Explain what this means, why it matters, and what revenue cycle should investigate next.`,
            starterQuery: "",
            solutionQuery: "",
            minLength: 80,
            requiredConceptGroups: [
              ["denied", "denial", "denials"],
              ["payer"],
              ["investigate", "review", "next step", "follow up"]
            ],
            requiredConceptMatches: 2,
            bonusConceptGroups: [
              ["authorization", "coding", "documentation", "medical necessity"],
              ["revenue", "cash", "financial", "claim collections"]
            ],
            feedbackGuide: "A strong answer explains that the payer represents concentrated financial leakage and recommends reviewing denial causes such as authorization, documentation, coding, or coverage rules.",
            exemplarAnswer: `This means denied billed dollars are concentrated in one payer group, creating a revenue risk that may reduce claim collections. Revenue cycle should investigate denial reasons such as authorization, documentation, coding, or medical necessity issues before assuming the problem is purely payer behavior.`,
            hint: "Connect the payer finding to financial leakage and a next investigation step.",
            smartHint: "Mention denial causes such as authorization, documentation, coding, or medical necessity.",
            thirdHint: "Explain what it means, why it matters, and what should be reviewed next.",
            explanation: "This develops executive communication from a financial metric.",
            executiveTakeaway: { show: false }
          },
          {
            kind: "scenario",
            id: "cr9",
            title: "Scenario: Core Executive Performance Snapshot",
            objective: "Design a balanced Core-level report for leadership.",
            relevantTables: ["encounters", "patients", "claims", "appointments", "discharges", "observations"],
            joinHint: "Pick metrics that answer the leadership question without overloading the report.",
            summary: "The executive team wants a one-page operational and financial snapshot for the month.",
            prompt: "Describe the report you would build. Include at least four metrics across different domains, such as encounter volume, unique patients, payer or payment performance, no-shows, discharge delays, observation hours, or denied dollars. Explain why each metric belongs in the snapshot and what leadership could do with it.",
            expectedKeywords: ["volume", "patients", "payer", "denied", "payment", "no-show", "discharge", "observation"],
            minLength: 150,
           minimumKeywordMatches: 4,
feedbackGuide: "A strong answer includes a balanced set of metrics across operational, financial, utilization, and throughput domains and explains how leadership would use them.",
executiveTakeaway: { show: false }
          }
        ]
      }
    ]
  },
  {
    id: "track_intermediate",
    title: "Intermediate SQL",
    description: "Intermediate SQL learning path focused on advanced filtering, analyst logic, and real-world cohort building.",
    order: 3,
    categories: [
      {
        id: "intermediate_advanced_filtering",
  title: "Advanced Filtering Logic",
  order: 1,
  lessons: [
    {
      kind: "concept",
      id: "i1",
      title: "From Filters to Cohorts",
      objective: "Understand how intermediate filtering turns simple row selection into intentional cohort design.",
      sql_focus: ["WHERE", "Cohorts", "Business logic"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table for this lesson.",
      summary: "A cohort is a defined population. Intermediate SQL is less about writing random filters and more about building a population that exactly matches the business question.",
      bullets: [
        "A cohort is the group of records included in an analysis.",
        "Every filter should have a reason tied to the question.",
        "Adding conditions changes the population and the interpretation.",
        "Good analysts can explain why each row should or should not be included.",
        "Cohort logic is the foundation for KPIs, dashboards, and operational reviews."
      ],
      example: "Hospital example: inpatient encounters at Waccamaw with LOS greater than 5 days is a cohort designed for capacity review.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i2",
      title: "Build an Inpatient Capacity Cohort",
      objective: "Use multiple filters to define a specific operational review population.",
      sql_focus: ["SELECT", "FROM", "WHERE", "AND"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table.",
      challengeCriteria: "Return all rows from encounters where facility equals 'Tidelands Waccamaw', status equals 'Inpatient', and length_of_stay is greater than 5.",
      starterQuery: "",
      solutionQuery: "SELECT * FROM encounters WHERE facility = 'Tidelands Waccamaw' AND status = 'Inpatient' AND length_of_stay > 5;",
      hint: "Use three WHERE conditions joined with AND.",
      smartHint: "The cohort needs facility, status, and length_of_stay filters.",
      thirdHint: "SELECT * FROM encounters WHERE facility = 'Tidelands Waccamaw' AND status = 'Inpatient' AND length_of_stay > 5;",
      explanation: "This query defines a focused inpatient capacity cohort instead of repeating the earlier ED plus LOS example.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "concept",
      id: "i3",
      title: "Multiple Conditions",
      objective: "Combine several filters to define a more precise cohort.",
      sql_focus: ["WHERE", "AND", "Multiple filters"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table for this lesson.",
      summary: "Real hospital questions often require more than one filter. Each added condition changes the cohort being studied.",
      bullets: [
        "Multiple filters help define a precise population.",
        "The more conditions you add with AND, the smaller the population usually becomes.",
        "Each condition should map directly to the business question.",
        "Good analysts can explain why every filter exists.",
        "Unnecessary filters can create misleading results."
      ],
      example: "Hospital example: inpatient encounters at a specific facility with LOS greater than 5 days is a multi-condition cohort.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i4",
      title: "Build a Precise Encounter Cohort",
      objective: "Use multiple AND conditions to define a focused operational cohort.",
      sql_focus: ["SELECT", "FROM", "WHERE", "AND"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table.",
      challengeCriteria: "Return all rows from encounters where facility equals 'Tidelands Georgetown', status equals 'Observation', and length_of_stay is greater than 2.",
      starterQuery: "",
      solutionQuery: "SELECT * FROM encounters WHERE facility = 'Tidelands Georgetown' AND status = 'Observation' AND length_of_stay > 2;",
      hint: "Use three WHERE conditions joined with AND.",
      smartHint: "You need facility, status, and length_of_stay filters.",
      thirdHint: "SELECT * FROM encounters WHERE facility = 'Tidelands Georgetown' AND status = 'Observation' AND length_of_stay > 2;",
      explanation: "This query narrows the data to a specific facility, status, and LOS threshold without duplicating the prior inpatient example.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "concept",
      id: "i5",
      title: "Parentheses Logic",
      objective: "Use parentheses to control how AND and OR are evaluated.",
      sql_focus: ["WHERE", "AND", "OR", "Parentheses"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table for this lesson.",
      summary: "Parentheses control logical grouping. Without them, SQL may evaluate AND and OR in a way that does not match the business question.",
      bullets: [
        "Parentheses make complex logic explicit.",
        "AND usually evaluates before OR.",
        "Complex filters should be grouped for readability and accuracy.",
        "Incorrect grouping can change the population dramatically.",
        "Parentheses are especially important when combining department groups with thresholds."
      ],
      example: "Hospital example: ED or ICU encounters with LOS greater than 3 should group the departments together before applying the LOS condition.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i6",
      title: "Group Department Logic",
      objective: "Use parentheses to filter multiple departments with a shared LOS threshold.",
      sql_focus: ["SELECT", "FROM", "WHERE", "AND", "OR", "Parentheses"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table.",
      challengeCriteria: "Return all rows from encounters where department is either 'Emergency Department' or 'ICU' and length_of_stay is greater than 3.",
      starterQuery: "",
      solutionQuery: "SELECT * FROM encounters WHERE (department = 'Emergency Department' OR department = 'ICU') AND length_of_stay > 3;",
      hint: "Group the department options in parentheses before applying the LOS filter.",
      smartHint: "Use (department = 'Emergency Department' OR department = 'ICU') AND length_of_stay > 3.",
      thirdHint: "SELECT * FROM encounters WHERE (department = 'Emergency Department' OR department = 'ICU') AND length_of_stay > 3;",
      explanation: "The parentheses ensure the LOS threshold applies to both ED and ICU encounters.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "concept",
      id: "i7",
      title: "BETWEEN for Ranges",
      objective: "Use BETWEEN to filter values within a range.",
      sql_focus: ["WHERE", "BETWEEN"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table for this lesson.",
      summary: "BETWEEN returns rows where a value falls within a lower and upper bound. It is useful for ranges like LOS, age, dates, and dollar amounts.",
      bullets: [
        "BETWEEN includes both endpoints.",
        "It is cleaner than writing >= and <= separately.",
        "It works well for numeric ranges and date ranges.",
        "Range filters should be chosen carefully because endpoints matter.",
        "Hospital analysts often use ranges for LOS, age bands, and cost tiers."
      ],
      example: "Hospital example: encounters with length_of_stay BETWEEN 3 AND 7 can represent moderate-length stays.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i8",
      title: "Filter Moderate LOS Encounters",
      objective: "Use BETWEEN to return encounters within a LOS range.",
      sql_focus: ["SELECT", "FROM", "WHERE", "BETWEEN"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table.",
      challengeCriteria: "Return all rows from encounters where length_of_stay is between 3 and 7.",
      starterQuery: "",
      solutionQuery: "SELECT * FROM encounters WHERE length_of_stay BETWEEN 3 AND 7;",
      hint: "Use BETWEEN with the lower and upper LOS values.",
      smartHint: "BETWEEN 3 AND 7 includes both 3 and 7.",
      thirdHint: "SELECT * FROM encounters WHERE length_of_stay BETWEEN 3 AND 7;",
      explanation: "This query returns encounters whose LOS falls within the defined moderate range.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "scenario",
      id: "i9",
      title: "Scenario: Build a Review Cohort",
      objective: "Use advanced filtering logic to define a cohort for operational review.",
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table. Focus on precise filtering logic.",
      summary: "A hospital operations leader wants to review higher-acuity operational activity.",
      prompt: "Write a query that returns encounters from either the Emergency Department or ICU where length_of_stay is greater than 3. Then briefly explain why parentheses matter in this query.",
      expectedKeywords: ["select", "from", "where", "or", "and", "parentheses"],
      minLength: 60,
      minimumKeywordMatches: 3,
      feedbackGuide: "A strong answer uses grouped OR logic for the departments, applies the LOS threshold with AND, and explains that parentheses make the department logic apply correctly.",
      executiveTakeaway: { show: false }
    }
  ]
      },
      {
  id: "intermediate_derived_fields_case",
  title: "Derived Fields & CASE Logic",
  order: 2,
  lessons: [
    {
      kind: "concept",
      id: "i10",
      title: "Calculated Fields",
      objective: "Create new output fields from existing columns.",
      sql_focus: ["SELECT", "Calculated fields", "Aliases"],
      relevantTables: ["discharges"],
      joinHint: "Use only the discharges table for this lesson.",
      summary: "Calculated fields let analysts create meaningful metrics directly in SQL instead of only returning raw columns.",
      bullets: [
        "A calculated field is created from an expression in the SELECT clause.",
        "Calculated fields should usually be aliased with AS.",
        "Operational metrics often come from subtracting one timestamp or numeric value from another.",
        "Calculated fields make raw workflow data easier to interpret.",
        "A strong analyst creates output that answers the business question directly."
      ],
      example: "Hospital example: departure_minutes - discharge_order_minutes calculates how long a patient remained after the discharge order.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i11",
      title: "Calculate Departure Delay",
      objective: "Create a calculated field for discharge delay.",
      sql_focus: ["SELECT", "Calculated fields", "AS"],
      relevantTables: ["discharges"],
      joinHint: "Use only the discharges table.",
      challengeCriteria: "Return discharge_id and a calculated field called departure_delay using departure_minutes - discharge_order_minutes.",
      starterQuery: "",
      solutionQuery: "SELECT discharge_id, departure_minutes - discharge_order_minutes AS departure_delay FROM discharges;",
      hint: "Subtract discharge_order_minutes from departure_minutes.",
      smartHint: "Use AS departure_delay to name the calculated field.",
      thirdHint: "SELECT discharge_id, departure_minutes - discharge_order_minutes AS departure_delay FROM discharges;",
      explanation: "This creates a usable operational delay metric from two raw workflow fields.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "concept",
      id: "i12",
      title: "CASE Basics",
      objective: "Use CASE to create conditional labels in query output.",
      sql_focus: ["CASE", "WHEN", "THEN", "ELSE", "END"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table for this lesson.",
      summary: "CASE lets analysts translate raw values into meaningful categories, flags, or labels.",
      bullets: [
        "CASE evaluates conditions in order.",
        "WHEN defines the condition.",
        "THEN defines the output when the condition is true.",
        "ELSE defines the fallback value.",
        "END closes the CASE expression."
      ],
      example: "Hospital example: CASE WHEN length_of_stay > 3 THEN 'Long Stay' ELSE 'Standard Stay' END AS los_category.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i13",
      title: "Create a LOS Category",
      objective: "Use CASE to classify encounters by length of stay.",
      sql_focus: ["SELECT", "CASE", "WHEN", "THEN", "ELSE", "END"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table.",
      challengeCriteria: "Return encounter_id and a CASE field called los_category where length_of_stay greater than 3 is 'Long Stay' and all others are 'Standard Stay'.",
      starterQuery: "",
      solutionQuery: "SELECT encounter_id, CASE WHEN length_of_stay > 3 THEN 'Long Stay' ELSE 'Standard Stay' END AS los_category FROM encounters;",
      hint: "Use CASE WHEN length_of_stay > 3 THEN 'Long Stay'.",
      smartHint: "Remember to close the CASE expression with END AS los_category.",
      thirdHint: "SELECT encounter_id, CASE WHEN length_of_stay > 3 THEN 'Long Stay' ELSE 'Standard Stay' END AS los_category FROM encounters;",
      explanation: "This turns a numeric LOS value into a readable category for analysis.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "concept",
      id: "i14",
      title: "Boolean Flags",
      objective: "Create 0/1 flags that can be counted or summed later.",
      sql_focus: ["CASE", "Flags", "0/1 logic"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table for this lesson.",
      summary: "Boolean-style flags are useful because they turn conditions into values that can be counted, summed, or filtered later.",
      bullets: [
        "A flag usually returns 1 when a condition is true and 0 when it is false.",
        "Flags are useful for KPI numerator logic.",
        "SUM(flag) can count how many records met the condition.",
        "Clear aliases make flags easier to reuse.",
        "Many dashboard measures start as row-level flags."
      ],
      example: "Hospital example: CASE WHEN department = 'Emergency Department' THEN 1 ELSE 0 END AS ed_flag.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i15",
      title: "Create an ED Flag",
      objective: "Use CASE to create a 0/1 Emergency Department flag.",
      sql_focus: ["SELECT", "CASE", "Flag"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table.",
      challengeCriteria: "Return encounter_id and a field called ed_flag that equals 1 when department is 'Emergency Department' and 0 otherwise.",
      starterQuery: "",
      solutionQuery: "SELECT encounter_id, CASE WHEN department = 'Emergency Department' THEN 1 ELSE 0 END AS ed_flag FROM encounters;",
      hint: "Use CASE WHEN department = 'Emergency Department' THEN 1 ELSE 0 END.",
      smartHint: "Alias the CASE expression as ed_flag.",
      thirdHint: "SELECT encounter_id, CASE WHEN department = 'Emergency Department' THEN 1 ELSE 0 END AS ed_flag FROM encounters;",
      explanation: "This creates a reusable row-level flag for ED encounters.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "concept",
      id: "i16",
      title: "Multiple CASE Branches",
      objective: "Create more than two categories using multiple WHEN clauses.",
      sql_focus: ["CASE", "Multiple WHEN"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table for this lesson.",
      summary: "CASE can classify records into several categories using multiple WHEN clauses.",
      bullets: [
        "Multiple WHEN clauses allow tiered classification.",
        "CASE stops at the first matching condition.",
        "Order matters when conditions overlap.",
        "ELSE catches anything not covered by earlier conditions.",
        "Tiered categories are common in risk, LOS, and cost analysis."
      ],
      example: "Hospital example: classify LOS as Short, Moderate, or Long depending on length_of_stay.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i17",
      title: "Create LOS Tiers",
      objective: "Use multiple WHEN clauses to classify length of stay.",
      sql_focus: ["SELECT", "CASE", "Multiple WHEN"],
      relevantTables: ["encounters"],
      joinHint: "Use only the encounters table.",
      challengeCriteria: "Return encounter_id and a field called los_tier. Use 'Short' when length_of_stay is less than 3, 'Moderate' when length_of_stay is between 3 and 7, and 'Long' otherwise.",
      starterQuery: "",
      solutionQuery: "SELECT encounter_id, CASE WHEN length_of_stay < 3 THEN 'Short' WHEN length_of_stay BETWEEN 3 AND 7 THEN 'Moderate' ELSE 'Long' END AS los_tier FROM encounters;",
      hint: "Use multiple WHEN clauses inside one CASE expression.",
      smartHint: "The final ELSE can be 'Long'.",
      thirdHint: "SELECT encounter_id, CASE WHEN length_of_stay < 3 THEN 'Short' WHEN length_of_stay BETWEEN 3 AND 7 THEN 'Moderate' ELSE 'Long' END AS los_tier FROM encounters;",
      explanation: "This creates tiered LOS categories that are easier to interpret than raw numbers alone.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "scenario",
      id: "i18",
      title: "Scenario: Build Analyst-Ready Fields",
      objective: "Explain how derived fields and CASE logic improve reporting.",
      relevantTables: ["encounters", "discharges"],
      joinHint: "Think about how calculated fields and flags make raw data easier to use.",
      summary: "A leader wants a report that is easier to interpret than raw encounter and discharge fields.",
      prompt: "Describe how you would use calculated fields and CASE logic to make the report more useful. Mention at least two examples, such as departure_delay, los_category, los_tier, or ed_flag, and explain why these fields help leadership understand the data.",
      expectedKeywords: ["case", "calculated", "flag", "delay", "category", "leadership"],
      minLength: 90,
    minimumKeywordMatches: 3,
feedbackGuide: "A strong answer explains that derived fields turn raw data into meaningful metrics, categories, or flags that leadership can interpret quickly.",
executiveTakeaway: { show: false }
          }
        ]
      },
    {
  id: "intermediate_joins_multitable",
  title: "Joins & Multi-Table Analysis",
  order: 3,
  lessons: [
    {
      kind: "concept",
      id: "i19",
      title: "Why Joins Matter",
      objective: "Understand why hospital analysis often requires combining operational, patient, provider, and financial context.",
      sql_focus: ["JOIN", "Table relationships", "Context"],
      relevantTables: ["encounters", "patients", "providers", "departments"],
      joinHint: "Start with the table that matches the event, then join only the context needed.",
      summary: "Joins let analysts connect the event being measured to the context needed to explain it.",
      bullets: [
        "Encounters usually describe visit activity.",
        "Patients add demographic, insurance, or risk context.",
        "Providers add specialty or clinician assignment context.",
        "Departments add facility, service line, and operational unit context.",
        "A good join starts with a clear reason for adding another table."
      ],
      example: "Hospital example: encounters can show visit volume, but joining patients can show whether that volume is concentrated by insurance type or risk level.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i20",
      title: "Add Patient Context",
      objective: "Join encounters to patients to view encounter activity with insurance context.",
      sql_focus: ["JOIN", "SELECT", "FROM"],
      relevantTables: ["encounters", "patients"],
      joinHint: "Join encounters to patients on patient_id.",
      challengeCriteria: "Return encounter_id, patient_id, and insurance_type by joining encounters to patients.",
      starterQuery: "",
      solutionQuery: "SELECT e.encounter_id, e.patient_id, p.insurance_type FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
      hint: "Use encounters as e and patients as p.",
      smartHint: "The join key is patient_id.",
      thirdHint: "SELECT e.encounter_id, e.patient_id, p.insurance_type FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",
      explanation: "This adds patient-level insurance context to visit-level encounter records.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "concept",
      id: "i21",
      title: "Choosing the Starting Table",
      objective: "Choose the table that matches the grain of the business question before joining other context.",
      sql_focus: ["Grain", "JOIN planning", "Starting table"],
      relevantTables: ["patients", "encounters", "claims", "charges"],
      joinHint: "Pick the event table first, then enrich it with related tables.",
      summary: "The starting table matters because it controls the grain of the result.",
      bullets: [
        "Use encounters when the question is about visits or stays.",
        "Use patients when the question is about people.",
        "Use claims when the question is about reimbursement or denial status.",
        "Use charges when the question is about billed line activity.",
        "Joining too early can create duplicate rows or misleading totals."
      ],
      example: "Hospital example: to analyze denied dollars, start with claims rather than patients because the denial event lives on the claim.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i22",
      title: "Join Provider Specialty",
      objective: "Join encounters to providers to add specialty context.",
      sql_focus: ["JOIN", "Provider context"],
      relevantTables: ["encounters", "providers"],
      joinHint: "Join encounters to providers using provider_id.",
      challengeCriteria: "Return encounter_id, provider_id, and specialty by joining encounters to providers.",
      starterQuery: "",
      solutionQuery: "SELECT e.encounter_id, e.provider_id, p.specialty FROM encounters e JOIN providers p ON e.provider_id = p.provider_id;",
      hint: "Use provider_id as the join key.",
      smartHint: "encounters has provider_id, and providers has provider_id.",
      thirdHint: "SELECT e.encounter_id, e.provider_id, p.specialty FROM encounters e JOIN providers p ON e.provider_id = p.provider_id;",
      explanation: "This adds provider specialty context to each encounter.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "concept",
      id: "i23",
      title: "Avoiding Join Duplication",
      objective: "Understand how joins can accidentally multiply rows and distort metrics.",
      sql_focus: ["JOIN grain", "Duplicates", "Overcounting"],
      relevantTables: ["encounters", "charges", "claims"],
      joinHint: "Check the grain of both tables before joining.",
      summary: "Joins can multiply rows when one record on the left matches many records on the right.",
      bullets: [
        "One encounter can have many charge rows.",
        "Joining encounters to charges may create multiple rows per encounter.",
        "COUNT(*) after a one-to-many join may no longer count encounters.",
        "Use COUNT(DISTINCT encounter_id) when you need unique encounters after a one-to-many join.",
        "Always ask what one row represents after the join."
      ],
      example: "Hospital example: joining encounters to charges can inflate encounter counts because one encounter may have several billed charge lines.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i24",
      title: "Protect Encounter Counts After a Join",
      objective: "Use COUNT DISTINCT to avoid overcounting encounters after joining charges.",
      sql_focus: ["JOIN", "COUNT DISTINCT", "Grain"],
      relevantTables: ["encounters", "charges"],
      joinHint: "Join on encounter_id, then count distinct encounter_id.",
      challengeCriteria: "Return the unique encounter count after joining encounters to charges. Label the result encounter_count.",
      starterQuery: "",
      solutionQuery: "SELECT COUNT(DISTINCT e.encounter_id) AS encounter_count FROM encounters e JOIN charges c ON e.encounter_id = c.encounter_id;",
      hint: "Use COUNT(DISTINCT e.encounter_id).",
      smartHint: "A normal COUNT(*) may overcount after joining to charges.",
      thirdHint: "SELECT COUNT(DISTINCT e.encounter_id) AS encounter_count FROM encounters e JOIN charges c ON e.encounter_id = c.encounter_id;",
      explanation: "This protects the encounter count from being inflated by multiple charge rows per encounter.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "concept",
      id: "i25",
      title: "Multi-Table Reporting",
      objective: "Build reports that combine operational volume with patient or financial context.",
      sql_focus: ["JOIN", "GROUP BY", "Multi-table reporting"],
      relevantTables: ["encounters", "patients", "claims"],
      joinHint: "Join only the tables needed for the selected columns and metrics.",
      summary: "Multi-table reports become useful when the join adds context that changes the interpretation.",
      bullets: [
        "Operational reports often start with encounters.",
        "Patient joins can add insurance, risk, age, or demographic context.",
        "Claim joins can add payer, denial, or billed amount context.",
        "Grouped reporting after a join requires careful grain awareness.",
        "Every joined table should answer a specific business need."
      ],
      example: "Hospital example: encounter volume by insurance type requires encounters for visit activity and patients for insurance type.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "challenge",
      id: "i26",
      title: "Encounter Volume by Insurance Type",
      objective: "Use a join and grouping to summarize encounter volume by insurance type.",
      sql_focus: ["JOIN", "COUNT", "GROUP BY"],
      relevantTables: ["encounters", "patients"],
      joinHint: "Join encounters to patients on patient_id.",
      challengeCriteria: "Return insurance_type and encounter count by insurance_type. Label the count encounter_count.",
      starterQuery: "",
      solutionQuery: "SELECT p.insurance_type, COUNT(*) AS encounter_count FROM encounters e JOIN patients p ON e.patient_id = p.patient_id GROUP BY p.insurance_type;",
      hint: "Use patients for insurance_type and encounters for visit activity.",
      smartHint: "Select p.insurance_type, COUNT(*), then GROUP BY p.insurance_type.",
      thirdHint: "SELECT p.insurance_type, COUNT(*) AS encounter_count FROM encounters e JOIN patients p ON e.patient_id = p.patient_id GROUP BY p.insurance_type;",
      explanation: "This combines encounter activity with patient insurance context.",
      executiveTakeaway: { show: false }
    },
    {
      kind: "scenario",
      id: "i27",
      title: "Scenario: Join Strategy Review",
      objective: "Explain how to choose join paths without creating misleading results.",
      relevantTables: ["patients", "encounters", "providers", "charges", "claims"],
      joinHint: "Focus on starting table, grain, join key, and overcounting risk.",
      summary: "A leader wants a report combining visit activity, payer context, provider context, and billed dollars.",
      prompt: "Explain how you would plan the join strategy before writing SQL. Mention the starting table, grain, join keys, and how you would avoid overcounting when joining one-to-many tables like charges.",
      expectedKeywords: ["join", "grain", "encounters", "patient_id", "encounter_id", "distinct", "overcount"],
      minLength: 120,
      minimumKeywordMatches: 4,
      feedbackGuide: "A strong answer starts with the table that matches the event being measured, identifies the join keys, and explains how to avoid inflated counts from one-to-many joins.",
      executiveTakeaway: { show: false }
        }
      ]
    },

    {
      id: "intermediate_kpi_logic",
      title: "Conditional Aggregation & KPI Logic",
      order: 4,
      lessons: [
        {
          kind: "concept",
          id: "k1",
          title: "From Counts to KPIs",
          objective: "Understand how analysts turn raw counts into meaningful performance metrics.",
          sql_focus: ["COUNT", "SUM", "KPI thinking"],
          relevantTables: ["encounters", "appointments", "claims"],
          joinHint: "KPIs start with defining numerator and denominator clearly.",
          summary: "A KPI is not just a count. It is a structured metric that answers a specific business question using a numerator and denominator.",
          bullets: [
            "A KPI requires a clear definition.",
            "Numerator = what you are measuring.",
            "Denominator = total eligible population.",
            "Rates are often more meaningful than raw counts.",
            "Bad KPI definitions lead to misleading conclusions."
          ],
          example: "Hospital example: no-show rate = no-show appointments divided by total scheduled appointments.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "k2",
          title: "CASE Inside Aggregations",
          objective: "Use CASE within SUM to count specific conditions.",
          sql_focus: ["SUM", "CASE", "Conditional aggregation"],
          relevantTables: ["appointments"],
          joinHint: "CASE returns values that can be summed into counts.",
          summary: "CASE inside SUM allows you to count only rows that meet a condition without filtering out the rest of the dataset.",
          bullets: [
            "CASE returns 1 or 0 for each row.",
            "SUM adds the 1s to produce a count.",
            "This allows multiple metrics in one query.",
            "It avoids losing denominator context.",
            "This is foundational for KPI building."
          ],
          example: "Hospital example: SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) counts no-shows.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "k3",
          title: "Count No-Show Appointments",
          objective: "Use CASE inside SUM to count no-shows.",
          sql_focus: ["SELECT", "SUM", "CASE"],
          relevantTables: ["appointments"],
          joinHint: "Use appointments because status is available.",
          challengeCriteria: "Return total no-show appointments. Label the result no_show_count.",
          starterQuery: "",
          solutionQuery: "SELECT SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) AS no_show_count FROM appointments;",
          hint: "Use SUM with CASE returning 1 for no-shows.",
          smartHint: "CASE WHEN status = 'No Show' THEN 1 ELSE 0 END",
          thirdHint: "SELECT SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) AS no_show_count FROM appointments;",
          explanation: "This counts only no-show rows without filtering out other appointment types.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "k4",
          title: "Building Rates",
          objective: "Combine numerator and denominator into a rate.",
          sql_focus: ["SUM", "COUNT", "Division"],
          relevantTables: ["appointments"],
          joinHint: "Rates require both numerator and denominator in the same query.",
          summary: "Rates provide context by comparing a subset to the total population.",
          bullets: [
            "Numerator divided by denominator creates a rate.",
            "Always confirm both pieces are defined correctly.",
            "Avoid integer division errors.",
            "Rates are more interpretable than raw counts.",
            "Misdefined denominators create misleading KPIs."
          ],
          example: "Hospital example: no-show rate = no-show count / total appointments.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "k5",
          title: "Calculate No-Show Rate",
          objective: "Calculate a KPI rate using CASE and COUNT.",
          sql_focus: ["SUM", "COUNT", "Division"],
          relevantTables: ["appointments"],
          joinHint: "Use SUM for numerator and COUNT(*) for denominator.",
          challengeCriteria: "Return no_show_rate using no-show count divided by total appointments.",
          starterQuery: "",
          solutionQuery: "SELECT SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS no_show_rate FROM appointments;",
          hint: "Divide SUM(CASE...) by COUNT(*).",
          smartHint: "Multiply by 1.0 to avoid integer division.",
          thirdHint: "SELECT SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS no_show_rate FROM appointments;",
          explanation: "This calculates the percentage of missed appointments.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "k6",
          title: "KPIs by Group",
          objective: "Calculate KPIs across departments or categories.",
          sql_focus: ["GROUP BY", "SUM", "CASE"],
          relevantTables: ["appointments"],
          joinHint: "Grouping allows KPI comparison across segments.",
          summary: "KPIs become more useful when broken down by department, payer, or provider.",
          bullets: [
            "Grouping allows comparison across units.",
            "Each group gets its own numerator and denominator.",
            "This supports operational decision-making.",
            "Different groups may have different performance patterns.",
            "Grouped KPIs highlight where action is needed."
          ],
          example: "Hospital example: no-show rate by department.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "k7",
          title: "No-Show Rate by Department",
          objective: "Calculate a KPI grouped by department.",
          sql_focus: ["GROUP BY", "SUM", "CASE"],
          relevantTables: ["appointments"],
          joinHint: "Use department as grouping column.",
          challengeCriteria: "Return department and no-show rate by department.",
          starterQuery: "",
          solutionQuery: "SELECT department, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS no_show_rate FROM appointments GROUP BY department;",
          hint: "Group by department.",
          smartHint: "Each department has its own numerator and denominator.",
          thirdHint: "SELECT department, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS no_show_rate FROM appointments GROUP BY department;",
          explanation: "This compares performance across departments.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "k8",
          title: "Multiple KPIs at Once",
          objective: "Build multiple KPIs in one query using CASE.",
          sql_focus: ["SUM", "CASE", "Multiple metrics"],
          relevantTables: ["claims"],
          joinHint: "Each KPI uses its own CASE logic.",
          summary: "Analysts often calculate multiple KPIs in a single query for efficiency and comparison.",
          bullets: [
            "Each KPI has its own CASE logic.",
            "Multiple SUM(CASE...) expressions can coexist.",
            "This creates compact, powerful reports.",
            "Ensure each metric is clearly labeled.",
            "Avoid mixing incompatible definitions."
          ],
          example: "Hospital example: approved claims vs denied claims counts in one query.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "k9",
          title: "Claims Status Breakdown",
          objective: "Calculate multiple KPI counts in one query.",
          sql_focus: ["SUM", "CASE"],
          relevantTables: ["claims"],
          joinHint: "Use claim_status field.",
          challengeCriteria: "Return approved_count and denied_count using CASE logic.",
          starterQuery: "",
          solutionQuery: "SELECT SUM(CASE WHEN claim_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count, SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) AS denied_count FROM claims;",
          hint: "Use two CASE expressions.",
          smartHint: "Each SUM handles a different status.",
          thirdHint: "SELECT SUM(CASE WHEN claim_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count, SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) AS denied_count FROM claims;",
          explanation: "This produces multiple KPIs in one query.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "k10",
          title: "Scenario: KPI Design Review",
          objective: "Explain how to design a KPI correctly.",
          relevantTables: ["appointments", "claims", "encounters"],
          joinHint: "Focus on numerator, denominator, and logic.",
          summary: "A leader asks for a KPI but gives a vague definition.",
          prompt: "Explain how you would define the KPI before writing SQL. Mention numerator, denominator, filtering logic, and why definition clarity matters.",
          expectedKeywords: ["numerator", "denominator", "kpi", "logic", "definition"],
          minLength: 100,
          minimumKeywordMatches: 3,
          feedbackGuide: "A strong answer defines numerator and denominator clearly and explains why ambiguous KPI definitions lead to misleading results.",
          executiveTakeaway: { show: false }
        }
      ]
    },

    {
      id: "intermediate_aggregation_patterns",
      title: "Aggregation Patterns & Multi-Level Analysis",
      order: 5,
      lessons: [
        {
          kind: "concept",
          id: "i28",
          title: "From Simple Aggregation to Real Metrics",
          objective: "Understand how real-world metrics require combining multiple aggregations.",
          sql_focus: ["GROUP BY", "SUM", "COUNT"],
          relevantTables: ["encounters", "claims"],
          joinHint: "Start with a grouped result, then think about how to compare it.",
          summary: "Basic aggregation answers simple questions. Real metrics compare groups, calculate percentages, and provide context.",
          bullets: [
            "GROUP BY creates summarized groups.",
            "Real metrics often compare a group to a total.",
            "Percentages require both a numerator and denominator.",
            "Aggregation can happen at multiple levels.",
            "Thinking in metrics is more important than writing syntax."
          ],
          example: "Hospital example: department volume is useful, but percent of total volume is more meaningful.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "i29",
          title: "Department Volume",
          objective: "Build a grouped aggregation.",
          sql_focus: ["GROUP BY", "COUNT"],
          relevantTables: ["encounters"],
          joinHint: "Use encounters only.",
          challengeCriteria: "Return department and encounter count by department.",
          starterQuery: "",
          solutionQuery: "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
          hint: "Group by department.",
          smartHint: "COUNT(*) per department.",
          thirdHint: "SELECT department, COUNT(*) FROM encounters GROUP BY department;",
          explanation: "This is the base aggregation used for more complex metrics.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "i30",
          title: "Percent of Total",
          objective: "Understand how to compare a group to an overall total.",
          sql_focus: ["SUM", "Subquery thinking"],
          relevantTables: ["encounters"],
          joinHint: "You may need a total separate from the grouped result.",
          summary: "Percent of total is one of the most common metrics in hospital reporting.",
          bullets: [
            "Percent = group value divided by total value.",
            "Requires both grouped aggregation and overall total.",
            "Totals may come from a separate query or subquery.",
            "Percentages provide context, not just volume.",
            "Leaders often care more about percentages than raw counts."
          ],
          example: "Hospital example: ED may represent 35% of total hospital encounters.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "i31",
          title: "Percent of Total Volume",
          objective: "Calculate department share of total encounters.",
          sql_focus: ["GROUP BY", "Subquery", "COUNT"],
          relevantTables: ["encounters"],
          joinHint: "Use a subquery to get total encounters.",
          challengeCriteria: "Return department, encounter_count, and percent_of_total.",
          starterQuery: "",
          solutionQuery: "SELECT department, COUNT(*) AS encounter_count, COUNT(*) * 1.0 / (SELECT COUNT(*) FROM encounters) AS percent_of_total FROM encounters GROUP BY department;",
          hint: "Divide by total encounters.",
          smartHint: "Use a subquery for total.",
          thirdHint: "COUNT(*) / (SELECT COUNT(*) FROM encounters)",
          explanation: "This compares each department to overall hospital activity.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "i32",
          title: "Aggregating After Joins",
          objective: "Understand how joins impact grouped results.",
          sql_focus: ["JOIN", "GROUP BY"],
          relevantTables: ["encounters", "patients"],
          joinHint: "Join first, then aggregate.",
          summary: "Joins allow grouping by fields not in the base table.",
          bullets: [
            "Joins add context before aggregation.",
            "Grouping can be done on joined fields.",
            "Joins must be understood to avoid duplication.",
            "Aggregation after join changes interpretation.",
            "Always confirm grain before grouping."
          ],
          example: "Hospital example: encounter volume by insurance type requires joining patients.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "i33",
          title: "Volume by Insurance Type",
          objective: "Join and aggregate.",
          sql_focus: ["JOIN", "GROUP BY", "COUNT"],
          relevantTables: ["encounters", "patients"],
          joinHint: "Join on patient_id.",
          challengeCriteria: "Return insurance_type and encounter count.",
          starterQuery: "",
          solutionQuery: "SELECT p.insurance_type, COUNT(*) AS encounter_count FROM encounters e JOIN patients p ON e.patient_id = p.patient_id GROUP BY p.insurance_type;",
          hint: "Join then group.",
          smartHint: "Use patients for insurance_type.",
          thirdHint: "GROUP BY p.insurance_type",
          explanation: "This combines join logic with aggregation.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "i34",
          title: "Top-N Analysis",
          objective: "Identify highest performing groups.",
          sql_focus: ["ORDER BY", "LIMIT"],
          relevantTables: ["encounters"],
          joinHint: "Sort after aggregation.",
          summary: "Top-N analysis helps identify the highest or lowest performing groups.",
          bullets: [
            "ORDER BY sorts aggregated results.",
            "DESC shows highest values first.",
            "LIMIT restricts output.",
            "Top-N is used in nearly every dashboard.",
            "Ranking prepares for window functions."
          ],
          example: "Hospital example: top 5 departments by encounter volume.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "i35",
          title: "Top 5 Departments",
          objective: "Find highest volume departments.",
          sql_focus: ["GROUP BY", "ORDER BY", "LIMIT"],
          relevantTables: ["encounters"],
          joinHint: "Group first, then sort.",
          challengeCriteria: "Return top 5 departments by encounter volume.",
          starterQuery: "",
          solutionQuery: "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department ORDER BY encounter_count DESC LIMIT 5;",
          hint: "Sort descending.",
          smartHint: "Use LIMIT 5.",
          thirdHint: "ORDER BY encounter_count DESC LIMIT 5",
          explanation: "This identifies highest activity departments.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "i36",
          title: "Scenario: Executive Volume Breakdown",
          objective: "Combine aggregation techniques into a real-world explanation.",
          relevantTables: ["encounters", "patients"],
          joinHint: "Think about grouping, percent, and context.",
          summary: "Leadership wants to understand where hospital activity is concentrated.",
          prompt: "Explain how you would show department volume, percent of total, and payer mix. Describe the queries and why each metric matters.",
          expectedKeywords: ["group", "percent", "join", "volume", "insurance"],
          minLength: 130,
          minimumKeywordMatches: 4,
          feedbackGuide: "A strong answer combines grouping, percent-of-total logic, and joins to provide context.",
          executiveTakeaway: { show: false }
     }
      ]
    }
  ]
},
{
  id: "track_advanced_sql",
  title: "Advanced SQL",
  description: "Advanced SQL learning path for CareOps hospital analytics: CTEs, window functions, trends, advanced KPIs, and executive-ready analysis.",
  order: 4,
  categories: [
    {
      id: "advanced_ctes_structure",
      title: "CTEs & Query Structure",
      order: 1,
      lessons: [
        {
          kind: "concept",
          id: "a1",
          title: "What Is a CTE?",
          objective: "Understand how Common Table Expressions help structure complex SQL.",
          sql_focus: ["WITH", "CTE", "Query structure"],
          relevantTables: ["encounters"],
          joinHint: "No join is needed for the concept.",
          summary: "A CTE is a named temporary result set created with WITH. It helps analysts break complex SQL into readable steps.",
          bullets: [
            "CTE stands for Common Table Expression.",
            "CTEs make complex queries easier to read.",
            "They are useful when building metrics in stages.",
            "They do not permanently create a table.",
            "Hospital analysts use CTEs to separate cohort logic from final reporting."
          ],
          example: "Hospital example: first define inpatient encounters in a CTE, then summarize LOS from that cohort.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a2",
          title: "Create an ED CTE",
          objective: "Use WITH to create a filtered encounter cohort.",
          sql_focus: ["WITH", "SELECT", "WHERE"],
          relevantTables: ["encounters"],
          joinHint: "Use only the encounters table.",
          challengeCriteria: "Create a CTE called ed_encounters that returns all encounters where department equals 'Emergency Department'. Then select all rows from ed_encounters.",
          starterQuery: "",
          solutionQuery: "WITH ed_encounters AS (SELECT * FROM encounters WHERE department = 'Emergency Department') SELECT * FROM ed_encounters;",
          hint: "Start with WITH ed_encounters AS (...).",
          smartHint: "Put the Emergency Department filter inside the CTE.",
          thirdHint: "WITH ed_encounters AS (SELECT * FROM encounters WHERE department = 'Emergency Department') SELECT * FROM ed_encounters;",
          explanation: "This separates cohort definition from the final SELECT.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "a3",
          title: "CTEs for Cohort Design",
          objective: "Understand how CTEs make cohort logic clearer.",
          sql_focus: ["WITH", "Cohorts", "Filtering"],
          relevantTables: ["encounters"],
          joinHint: "Use the CTE to define the population before calculating metrics.",
          summary: "A strong advanced analyst separates population logic from metric logic. CTEs make that separation easier.",
          bullets: [
            "The CTE can define who or what belongs in the analysis.",
            "The final query can summarize that CTE.",
            "This makes SQL easier to explain to another analyst.",
            "It also reduces the chance of mixing filters into the wrong step.",
            "Cohort-first thinking is critical for reliable KPI work."
          ],
          example: "Hospital example: define observation encounters first, then calculate average observation LOS.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a4",
          title: "Summarize a CTE",
          objective: "Create a filtered CTE and aggregate from it.",
          sql_focus: ["WITH", "COUNT"],
          relevantTables: ["encounters"],
          joinHint: "Use only the encounters table.",
          challengeCriteria: "Create a CTE called inpatient_encounters for encounters where status equals 'Inpatient'. Then return the count as inpatient_count.",
          starterQuery: "",
          solutionQuery: "WITH inpatient_encounters AS (SELECT * FROM encounters WHERE status = 'Inpatient') SELECT COUNT(*) AS inpatient_count FROM inpatient_encounters;",
          hint: "Filter status inside the CTE, then count from the CTE.",
          smartHint: "The final SELECT should read FROM inpatient_encounters.",
          thirdHint: "WITH inpatient_encounters AS (SELECT * FROM encounters WHERE status = 'Inpatient') SELECT COUNT(*) AS inpatient_count FROM inpatient_encounters;",
          explanation: "This keeps the inpatient cohort separate from the final count.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "a5",
          title: "Multiple CTEs",
          objective: "Understand how multiple CTEs support step-by-step analysis.",
          sql_focus: ["WITH", "Multiple CTEs"],
          relevantTables: ["encounters", "patients"],
          joinHint: "Use multiple CTEs when different steps need names.",
          summary: "Multiple CTEs let you build an analysis one named step at a time.",
          bullets: [
            "Each CTE can represent one logical step.",
            "Separate CTEs can make joins, filters, and aggregations easier to debug.",
            "Later CTEs can reference earlier CTEs.",
            "Good names make the query readable.",
            "This is useful for complex hospital reporting logic."
          ],
          example: "Hospital example: one CTE defines ED encounters, another summarizes ED volume by facility.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a6",
          title: "Two-Step CTE Volume",
          objective: "Use multiple CTEs to filter and summarize encounters.",
          sql_focus: ["WITH", "GROUP BY", "COUNT"],
          relevantTables: ["encounters"],
          joinHint: "Use the first CTE for filtering and the second for aggregation.",
          challengeCriteria: "Create a CTE called ed_encounters for Emergency Department rows, then a CTE called facility_volume that counts ED encounters by facility. Select all from facility_volume.",
          starterQuery: "",
          solutionQuery: "WITH ed_encounters AS (SELECT * FROM encounters WHERE department = 'Emergency Department'), facility_volume AS (SELECT facility, COUNT(*) AS encounter_count FROM ed_encounters GROUP BY facility) SELECT * FROM facility_volume;",
          hint: "Use two CTEs separated by a comma.",
          smartHint: "The second CTE should group FROM ed_encounters.",
          thirdHint: "WITH ed_encounters AS (...), facility_volume AS (...) SELECT * FROM facility_volume;",
          explanation: "This creates a readable two-step workflow: filter first, summarize second.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "a7",
          title: "CTEs Before Joins",
          objective: "Understand why filtered CTEs can make joins safer and clearer.",
          sql_focus: ["WITH", "JOIN", "Grain"],
          relevantTables: ["encounters", "patients"],
          joinHint: "Filter the encounter cohort first, then join patient context.",
          summary: "Filtering in a CTE before joining can make the population more explicit and easier to validate.",
          bullets: [
            "Start with the event table that matches the question.",
            "Define the cohort before joining extra context.",
            "Join only the fields needed for interpretation.",
            "This helps avoid accidental population changes.",
            "CTEs make the join path easier to review."
          ],
          example: "Hospital example: define inpatient encounters, then join patients to analyze insurance mix.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a8",
          title: "CTE with Patient Join",
          objective: "Use a CTE and join patient context.",
          sql_focus: ["WITH", "JOIN", "GROUP BY"],
          relevantTables: ["encounters", "patients"],
          joinHint: "Join encounters to patients on patient_id after defining the CTE.",
          challengeCriteria: "Create a CTE called inpatient_encounters for status = 'Inpatient'. Join it to patients and return insurance_type with encounter_count by insurance_type.",
          starterQuery: "",
          solutionQuery: "WITH inpatient_encounters AS (SELECT * FROM encounters WHERE status = 'Inpatient') SELECT p.insurance_type, COUNT(*) AS encounter_count FROM inpatient_encounters e JOIN patients p ON e.patient_id = p.patient_id GROUP BY p.insurance_type;",
          hint: "Define inpatient_encounters first, then join patients.",
          smartHint: "Group by p.insurance_type.",
          thirdHint: "WITH inpatient_encounters AS (...) SELECT p.insurance_type, COUNT(*) AS encounter_count FROM inpatient_encounters e JOIN patients p ON e.patient_id = p.patient_id GROUP BY p.insurance_type;",
          explanation: "This combines clear cohort logic with patient-level context.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "a9",
          title: "Scenario: Clean Up a Messy Query",
          objective: "Explain how CTEs improve readability and validation.",
          relevantTables: ["encounters", "patients", "claims"],
          joinHint: "Think about separating cohort, joins, and aggregation.",
          summary: "A long SQL query mixes filters, joins, and grouped metrics in one block.",
          prompt: "Explain how you would rewrite a messy hospital KPI query using CTEs. Mention at least three steps such as defining the cohort, joining context, aggregating metrics, or validating counts.",
          expectedKeywords: ["cte", "cohort", "join", "aggregate", "validate"],
          minLength: 110,
          minimumKeywordMatches: 3,
          feedbackGuide: "A strong answer explains that CTEs make complex logic easier to read, validate, and explain.",
          executiveTakeaway: { show: false }
        }
      ]
    },
    {
      id: "advanced_window_functions",
      title: "Window Functions",
      order: 2,
      lessons: [
        {
          kind: "concept",
          id: "a10",
          title: "What Are Window Functions?",
          objective: "Understand how window functions calculate across rows without collapsing detail.",
          sql_focus: ["OVER", "Window functions"],
          relevantTables: ["encounters"],
          joinHint: "No join is needed for the concept.",
          summary: "Window functions calculate values across related rows while keeping row-level detail in the output.",
          bullets: [
            "Aggregate queries collapse rows into groups.",
            "Window functions can calculate across rows without collapsing them.",
            "OVER defines the window used for calculation.",
            "PARTITION BY creates groups within the window.",
            "ORDER BY inside OVER controls ranking or running calculations."
          ],
          example: "Hospital example: show each encounter and compare its LOS to the department average.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a11",
          title: "Department Average LOS Window",
          objective: "Use AVG as a window function.",
          sql_focus: ["AVG", "OVER", "PARTITION BY"],
          relevantTables: ["encounters"],
          joinHint: "Use only the encounters table.",
          challengeCriteria: "Return encounter_id, department, length_of_stay, and department_avg_los using AVG(length_of_stay) over each department.",
          starterQuery: "",
          solutionQuery: "SELECT encounter_id, department, length_of_stay, AVG(length_of_stay) OVER (PARTITION BY department) AS department_avg_los FROM encounters;",
          hint: "Use AVG(length_of_stay) OVER (PARTITION BY department).",
          smartHint: "Do not GROUP BY; keep encounter-level rows.",
          thirdHint: "SELECT encounter_id, department, length_of_stay, AVG(length_of_stay) OVER (PARTITION BY department) AS department_avg_los FROM encounters;",
          explanation: "This compares each encounter to its department context without collapsing rows.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "a12",
          title: "ROW_NUMBER for Ranking",
          objective: "Understand how ROW_NUMBER assigns a unique rank to ordered rows.",
          sql_focus: ["ROW_NUMBER", "OVER", "ORDER BY"],
          relevantTables: ["encounters"],
          joinHint: "No join is needed.",
          summary: "ROW_NUMBER assigns a unique sequential number based on the order you define.",
          bullets: [
            "ROW_NUMBER is useful for finding top records.",
            "ORDER BY controls the ranking order.",
            "Each row receives a unique number.",
            "It is often used to pick the latest or highest record.",
            "In hospital analytics, it helps identify top cases, latest visits, or priority rows."
          ],
          example: "Hospital example: rank encounters by longest LOS.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a13",
          title: "Rank Encounters by LOS",
          objective: "Use ROW_NUMBER to rank encounters by length of stay.",
          sql_focus: ["ROW_NUMBER", "ORDER BY"],
          relevantTables: ["encounters"],
          joinHint: "Use only the encounters table.",
          challengeCriteria: "Return encounter_id, length_of_stay, and los_rank using ROW_NUMBER ordered by length_of_stay descending.",
          starterQuery: "",
          solutionQuery: "SELECT encounter_id, length_of_stay, ROW_NUMBER() OVER (ORDER BY length_of_stay DESC) AS los_rank FROM encounters;",
          hint: "Use ROW_NUMBER() OVER (ORDER BY length_of_stay DESC).",
          smartHint: "DESC puts the longest stays first.",
          thirdHint: "SELECT encounter_id, length_of_stay, ROW_NUMBER() OVER (ORDER BY length_of_stay DESC) AS los_rank FROM encounters;",
          explanation: "This identifies the longest LOS encounters in ranked order.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "a14",
          title: "Ranking Within Groups",
          objective: "Use PARTITION BY to rank rows inside each group.",
          sql_focus: ["ROW_NUMBER", "PARTITION BY"],
          relevantTables: ["encounters"],
          joinHint: "No join is needed.",
          summary: "PARTITION BY restarts a window calculation within each group.",
          bullets: [
            "Without PARTITION BY, the ranking applies to the whole result.",
            "With PARTITION BY, ranking restarts inside each group.",
            "This is useful for top departments within each facility.",
            "It helps compare units fairly within their own context.",
            "Partitioning is one of the most important advanced SQL concepts."
          ],
          example: "Hospital example: rank department volumes within each facility.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a15",
          title: "Rank Departments Within Facility",
          objective: "Use ROW_NUMBER with PARTITION BY after aggregation.",
          sql_focus: ["ROW_NUMBER", "PARTITION BY", "GROUP BY"],
          relevantTables: ["encounters"],
          joinHint: "Use only the encounters table.",
          challengeCriteria: "Return facility, department, encounter_count, and facility_rank ranking departments by encounter_count within each facility.",
          starterQuery: "",
          solutionQuery: "SELECT facility, department, COUNT(*) AS encounter_count, ROW_NUMBER() OVER (PARTITION BY facility ORDER BY COUNT(*) DESC) AS facility_rank FROM encounters GROUP BY facility, department;",
          hint: "Partition by facility and order by COUNT(*) descending.",
          smartHint: "The query groups by facility and department before the window rank is applied.",
          thirdHint: "SELECT facility, department, COUNT(*) AS encounter_count, ROW_NUMBER() OVER (PARTITION BY facility ORDER BY COUNT(*) DESC) AS facility_rank FROM encounters GROUP BY facility, department;",
          explanation: "This ranks departments within each facility by volume.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "a16",
          title: "RANK vs DENSE_RANK",
          objective: "Understand how ranking functions handle ties.",
          sql_focus: ["RANK", "DENSE_RANK"],
          relevantTables: ["claims"],
          joinHint: "No join is needed.",
          summary: "RANK and DENSE_RANK both handle ties, but they number the next rank differently.",
          bullets: [
            "RANK leaves gaps after ties.",
            "DENSE_RANK does not leave gaps after ties.",
            "ROW_NUMBER never ties because every row gets a unique number.",
            "Choosing the right ranking function affects interpretation.",
            "For executive summaries, tied rankings should be handled intentionally."
          ],
          example: "Hospital example: two payers with the same denied dollars may share a rank.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a17",
          title: "Rank Payers by Denied Dollars",
          objective: "Use RANK to prioritize denied billed amount by payer.",
          sql_focus: ["RANK", "SUM", "GROUP BY"],
          relevantTables: ["claims"],
          joinHint: "Use only claims.",
          challengeCriteria: "Return payer, denied_billed_amount, and denial_rank for denied claims, ranking highest denied billed amount first.",
          starterQuery: "",
          solutionQuery: "SELECT payer, SUM(billed_amount) AS denied_billed_amount, RANK() OVER (ORDER BY SUM(billed_amount) DESC) AS denial_rank FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
          hint: "Filter denied claims, group by payer, then rank by SUM(billed_amount).",
          smartHint: "Use RANK() OVER (ORDER BY SUM(billed_amount) DESC).",
          thirdHint: "SELECT payer, SUM(billed_amount) AS denied_billed_amount, RANK() OVER (ORDER BY SUM(billed_amount) DESC) AS denial_rank FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
          explanation: "This prioritizes payer groups by denied dollar exposure.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "a18",
          title: "Scenario: Ranking for Leadership",
          objective: "Explain how window functions help leadership prioritize action.",
          relevantTables: ["encounters", "claims", "providers"],
          joinHint: "Think about ranking within groups and ranking overall.",
          summary: "Leadership does not want a giant table. They want to know what stands out.",
          prompt: "Explain how you would use window functions to help leadership prioritize. Mention ranking, partitioning, and at least two hospital examples such as payers, departments, providers, LOS, or denied dollars.",
          expectedKeywords: ["rank", "partition", "department", "payer", "provider", "los", "denied"],
          minLength: 120,
          minimumKeywordMatches: 4,
          feedbackGuide: "A strong answer explains how ranking and partitioning turn raw results into prioritized decision lists.",
          executiveTakeaway: { show: false }
        }
      ]
    },
    {
      id: "advanced_time_analysis",
      title: "Time-Based Analysis",
      order: 3,
      lessons: [
        {
          kind: "concept",
          id: "a19",
          title: "Why Time-Based Analysis Matters",
          objective: "Understand why hospital analytics usually needs trends, not snapshots.",
          sql_focus: ["Dates", "Trends"],
          relevantTables: ["encounters", "claims", "appointments"],
          joinHint: "Choose the table that contains the event date for the metric.",
          summary: "A single number rarely tells the full story. Time-based analysis shows whether performance is improving, worsening, or shifting.",
          bullets: [
            "Trends reveal direction.",
            "Monthly grouping is common for leadership reporting.",
            "Date fields must match the business event being measured.",
            "A volume spike may be seasonal, operational, or data-related.",
            "Trend context helps avoid overreacting to one data point."
          ],
          example: "Hospital example: monthly encounter volume shows whether demand is increasing over time.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a20",
          title: "Monthly Encounter Volume",
          objective: "Group encounter volume by admit month.",
          sql_focus: ["strftime", "GROUP BY", "COUNT"],
          relevantTables: ["encounters"],
          joinHint: "Use admit_date from encounters.",
          challengeCriteria: "Return month and encounter_count by admit month using strftime('%Y-%m', admit_date). Sort by month.",
          starterQuery: "",
          solutionQuery: "SELECT strftime('%Y-%m', admit_date) AS month, COUNT(*) AS encounter_count FROM encounters GROUP BY month ORDER BY month;",
          hint: "Use strftime('%Y-%m', admit_date).",
          smartHint: "Group by the month alias and order by month.",
          thirdHint: "SELECT strftime('%Y-%m', admit_date) AS month, COUNT(*) AS encounter_count FROM encounters GROUP BY month ORDER BY month;",
          explanation: "This creates a month-level encounter trend.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "a21",
          title: "Choosing the Right Date Field",
          objective: "Understand why event date selection changes the answer.",
          sql_focus: ["Date logic", "Metric definition"],
          relevantTables: ["encounters", "claims", "appointments", "discharges"],
          joinHint: "Use the date that matches the business event.",
          summary: "Different date fields answer different questions. Admit date, discharge date, claim date, and appointment date are not interchangeable.",
          bullets: [
            "Admit date supports admission or arrival trends.",
            "Discharge date supports throughput and discharge trends.",
            "Appointment date supports scheduling and no-show trends.",
            "Claim timing supports revenue cycle reporting.",
            "Using the wrong date field can make a trend misleading."
          ],
          example: "Hospital example: LOS by discharge month and volume by admit month may answer different operational questions.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a22",
          title: "Monthly LOS Trend",
          objective: "Calculate average LOS by admit month.",
          sql_focus: ["AVG", "strftime", "GROUP BY"],
          relevantTables: ["encounters"],
          joinHint: "Use admit_date and length_of_stay from encounters.",
          challengeCriteria: "Return month and avg_los by admit month. Sort by month.",
          starterQuery: "",
          solutionQuery: "SELECT strftime('%Y-%m', admit_date) AS month, AVG(length_of_stay) AS avg_los FROM encounters GROUP BY month ORDER BY month;",
          hint: "Group by admit month and average length_of_stay.",
          smartHint: "Use AVG(length_of_stay).",
          thirdHint: "SELECT strftime('%Y-%m', admit_date) AS month, AVG(length_of_stay) AS avg_los FROM encounters GROUP BY month ORDER BY month;",
          explanation: "This tracks whether LOS is changing over time.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "a23",
          title: "Before and After Analysis",
          objective: "Understand how analysts compare periods around an intervention.",
          sql_focus: ["CASE", "Date filters", "Period labels"],
          relevantTables: ["appointments", "encounters"],
          joinHint: "Use CASE to label before and after periods.",
          summary: "Before/after analysis helps evaluate whether an intervention may have changed a metric.",
          bullets: [
            "Define the intervention date clearly.",
            "Label rows as before or after.",
            "Compare the same metric across periods.",
            "Avoid claiming causation from SQL alone.",
            "Use trend and context before making recommendations."
          ],
          example: "Hospital example: compare no-show rate before and after appointment reminder changes.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a24",
          title: "Before/After Appointment Volume",
          objective: "Use CASE to label appointments before and after a date.",
          sql_focus: ["CASE", "COUNT", "GROUP BY"],
          relevantTables: ["appointments"],
          joinHint: "Use appointment date from appointments.",
          challengeCriteria: "Return period and appointment_count where period is 'Before' for dates before '2025-07-01' and 'After' otherwise.",
          starterQuery: "",
          solutionQuery: "SELECT CASE WHEN date < '2025-07-01' THEN 'Before' ELSE 'After' END AS period, COUNT(*) AS appointment_count FROM appointments GROUP BY period;",
          hint: "Use CASE on the date field.",
          smartHint: "Group by the period alias.",
          thirdHint: "SELECT CASE WHEN date < '2025-07-01' THEN 'Before' ELSE 'After' END AS period, COUNT(*) AS appointment_count FROM appointments GROUP BY period;",
          explanation: "This creates a simple before/after comparison.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a25",
          title: "Monthly Denied Dollars",
          objective: "Trend denied billed amount over time.",
          sql_focus: ["SUM", "WHERE", "strftime"],
          relevantTables: ["claims"],
          joinHint: "Use claims because claim_status and billed_amount are available there.",
          challengeCriteria: "Return month and denied_billed_amount for denied claims, grouped by month. Use strftime('%Y-%m', claim_date) if claim_date exists; otherwise use the available date field in your app data.",
          starterQuery: "",
          solutionQuery: "SELECT strftime('%Y-%m', claim_date) AS month, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY month ORDER BY month;",
          hint: "Filter to denied claims and group by month.",
          smartHint: "If your mock claims table does not have claim_date yet, add it before using this lesson.",
          thirdHint: "SELECT strftime('%Y-%m', claim_date) AS month, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY month ORDER BY month;",
          explanation: "This supports revenue cycle trend analysis. Add claim_date to claims if needed.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "a26",
          title: "Scenario: Trend Review",
          objective: "Explain how to investigate a change over time.",
          relevantTables: ["encounters", "claims", "appointments"],
          joinHint: "Pick the date field that matches the business event.",
          summary: "Leadership notices a sharp increase in one metric this quarter.",
          prompt: "Explain how you would investigate a metric that changed over time. Mention date field selection, monthly grouping, baseline comparison, and at least one possible data quality check.",
          expectedKeywords: ["date", "month", "trend", "baseline", "check", "quality"],
          minLength: 120,
          minimumKeywordMatches: 4,
          feedbackGuide: "A strong answer explains that trend analysis requires the correct date field, comparison period, and validation before drawing conclusions.",
          executiveTakeaway: { show: false }
        }
      ]
    },
    {
      id: "advanced_kpi_builds",
      title: "Advanced KPI Builds",
      order: 4,
      lessons: [
        {
          kind: "concept",
          id: "a27",
          title: "Layered KPI Logic",
          objective: "Understand how advanced KPIs combine cohorts, numerators, denominators, and segmentation.",
          sql_focus: ["CTE", "CASE", "Rates", "KPI"],
          relevantTables: ["claims", "appointments", "observations", "discharges"],
          joinHint: "Define the eligible population before calculating the rate.",
          summary: "Advanced KPI builds require more than one expression. The analyst must define the eligible population, numerator, denominator, and grouping level.",
          bullets: [
            "The denominator is the eligible population.",
            "The numerator is the subset meeting the KPI condition.",
            "CASE often creates numerator logic.",
            "CTEs can make KPI steps easier to read.",
            "Grouped KPIs require the denominator to be calculated inside each group."
          ],
          example: "Hospital example: denial rate by payer requires total claims and denied claims by payer.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a28",
          title: "Denial Rate by Payer",
          objective: "Calculate a payer-level denial rate.",
          sql_focus: ["CASE", "COUNT", "GROUP BY"],
          relevantTables: ["claims"],
          joinHint: "Use claims because payer and claim_status are available there.",
          challengeCriteria: "Return payer, total_claims, denied_claims, and denial_rate by payer.",
          starterQuery: "",
          solutionQuery: "SELECT payer, COUNT(*) AS total_claims, SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) AS denied_claims, SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS denial_rate FROM claims GROUP BY payer;",
          hint: "Use SUM(CASE...) for denied claims and divide by COUNT(*).",
          smartHint: "The denominator should be total claims within each payer group.",
          thirdHint: "SELECT payer, COUNT(*) AS total_claims, SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) AS denied_claims, SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS denial_rate FROM claims GROUP BY payer;",
          explanation: "This creates a payer-level revenue cycle KPI.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "a29",
          title: "Grouped Rates Can Mislead",
          objective: "Understand why grouped KPI rates require careful interpretation.",
          sql_focus: ["Rates", "Denominators", "GROUP BY"],
          relevantTables: ["claims", "appointments"],
          joinHint: "Check group size before interpreting rates.",
          summary: "A high rate in a small group may not deserve the same response as a high rate in a large group.",
          bullets: [
            "Rates need denominator context.",
            "Small denominators can create unstable rates.",
            "Always show numerator and denominator alongside the rate.",
            "Volume and rate together tell a better story.",
            "Leadership should know whether a rate represents many events or only a few."
          ],
          example: "Hospital example: a payer with 2 denied claims out of 3 has a high rate but may not be the biggest dollar problem.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a30",
          title: "No-Show Rate by Department",
          objective: "Calculate no-show rate with numerator and denominator.",
          sql_focus: ["CASE", "GROUP BY", "Rates"],
          relevantTables: ["appointments"],
          joinHint: "Use appointments because status and department are available there.",
          challengeCriteria: "Return department, total_appointments, no_show_count, and no_show_rate by department.",
          starterQuery: "",
          solutionQuery: "SELECT department, COUNT(*) AS total_appointments, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) AS no_show_count, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS no_show_rate FROM appointments GROUP BY department;",
          hint: "Count all appointments and sum no-shows.",
          smartHint: "Use SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END).",
          thirdHint: "SELECT department, COUNT(*) AS total_appointments, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) AS no_show_count, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS no_show_rate FROM appointments GROUP BY department;",
          explanation: "This creates a department-level access KPI.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a31",
          title: "Observation Conversion Rate by Facility",
          objective: "Calculate observation-to-inpatient conversion rate by facility.",
          sql_focus: ["CASE", "GROUP BY", "Rates"],
          relevantTables: ["observations"],
          joinHint: "Use observations because converted_to_inpatient is available there.",
          challengeCriteria: "Return facility, total_obs, converted_count, and conversion_rate by facility.",
          starterQuery: "",
          solutionQuery: "SELECT facility, COUNT(*) AS total_obs, SUM(CASE WHEN converted_to_inpatient = 1 THEN 1 ELSE 0 END) AS converted_count, SUM(CASE WHEN converted_to_inpatient = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS conversion_rate FROM observations GROUP BY facility;",
          hint: "Use converted_to_inpatient as the numerator flag.",
          smartHint: "Group by facility.",
          thirdHint: "SELECT facility, COUNT(*) AS total_obs, SUM(CASE WHEN converted_to_inpatient = 1 THEN 1 ELSE 0 END) AS converted_count, SUM(CASE WHEN converted_to_inpatient = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS conversion_rate FROM observations GROUP BY facility;",
          explanation: "This supports utilization review and status conversion monitoring.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "a32",
          title: "KPI Builds with CTEs",
          objective: "Understand how CTEs make advanced KPI logic easier to maintain.",
          sql_focus: ["CTE", "KPI", "CASE"],
          relevantTables: ["claims", "appointments", "observations"],
          joinHint: "Use one CTE for the base population and another for aggregation if needed.",
          summary: "CTEs help analysts build KPIs in clean layers instead of writing one unreadable query.",
          bullets: [
            "Step 1: define the eligible population.",
            "Step 2: create row-level flags.",
            "Step 3: aggregate the flags.",
            "Step 4: calculate rates.",
            "Step 5: rank or filter the final output."
          ],
          example: "Hospital example: define denied claims first, then summarize denied dollars by payer.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a33",
          title: "High-Delay Discharge Rate",
          objective: "Calculate discharge delay rate with CASE.",
          sql_focus: ["CASE", "Calculated fields", "Rates"],
          relevantTables: ["discharges"],
          joinHint: "Use discharge_order_minutes and departure_minutes.",
          challengeCriteria: "Return department, total_discharges, delayed_count, and delayed_rate where delayed means departure_minutes - discharge_order_minutes > 240.",
          starterQuery: "",
          solutionQuery: "SELECT department, COUNT(*) AS total_discharges, SUM(CASE WHEN departure_minutes - discharge_order_minutes > 240 THEN 1 ELSE 0 END) AS delayed_count, SUM(CASE WHEN departure_minutes - discharge_order_minutes > 240 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS delayed_rate FROM discharges GROUP BY department;",
          hint: "Use the calculated delay inside CASE.",
          smartHint: "The threshold is greater than 240 minutes.",
          thirdHint: "SELECT department, COUNT(*) AS total_discharges, SUM(CASE WHEN departure_minutes - discharge_order_minutes > 240 THEN 1 ELSE 0 END) AS delayed_count, SUM(CASE WHEN departure_minutes - discharge_order_minutes > 240 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS delayed_rate FROM discharges GROUP BY department;",
          explanation: "This turns discharge workflow timing into a department-level KPI.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a34",
          title: "Rank KPI Results",
          objective: "Use a CTE and ranking to prioritize KPI results.",
          sql_focus: ["CTE", "RANK", "Rates"],
          relevantTables: ["claims"],
          joinHint: "Build the denial rate first, then rank it.",
          challengeCriteria: "Use a CTE called payer_denials to calculate payer denial_rate, then return payer, denial_rate, and denial_rank ranked highest first.",
          starterQuery: "",
          solutionQuery: "WITH payer_denials AS (SELECT payer, SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS denial_rate FROM claims GROUP BY payer) SELECT payer, denial_rate, RANK() OVER (ORDER BY denial_rate DESC) AS denial_rank FROM payer_denials;",
          hint: "Build payer_denials first, then rank denial_rate.",
          smartHint: "Use RANK() OVER (ORDER BY denial_rate DESC).",
          thirdHint: "WITH payer_denials AS (...) SELECT payer, denial_rate, RANK() OVER (ORDER BY denial_rate DESC) AS denial_rank FROM payer_denials;",
          explanation: "This combines CTE structure with executive prioritization.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "a35",
          title: "Scenario: Build a KPI for Leadership",
          objective: "Explain the structure of an advanced KPI query.",
          relevantTables: ["claims", "appointments", "observations", "discharges"],
          joinHint: "Think in denominator, numerator, grouping, and ranking.",
          summary: "A leader asks for a dashboard metric but does not define it clearly.",
          prompt: "Explain how you would design an advanced KPI query before writing SQL. Mention the eligible population, numerator, denominator, grouping level, rate calculation, and how you would prioritize the results.",
          expectedKeywords: ["numerator", "denominator", "rate", "group", "rank", "population"],
          minLength: 130,
          minimumKeywordMatches: 4,
          feedbackGuide: "A strong answer explains the full KPI design process from definition to prioritization.",
          executiveTakeaway: { show: false }
        }
      ]
    },
    {
      id: "advanced_capstone",
      title: "Advanced Analyst Capstone",
      order: 5,
      lessons: [
        {
          kind: "concept",
          id: "a36",
          title: "Advanced Analyst Workflow",
          objective: "Understand how advanced analysts move from request to validated output.",
          sql_focus: ["Workflow", "CTE", "Validation", "Insight"],
          relevantTables: ["encounters", "claims", "patients", "appointments"],
          joinHint: "Plan before writing SQL.",
          summary: "Advanced analysis is a workflow: define the question, build the cohort, calculate metrics, validate results, and explain what matters.",
          bullets: [
            "Start with the business question.",
            "Translate it into a measurable population.",
            "Use CTEs to structure the query.",
            "Use windows or rankings to prioritize.",
            "Validate before presenting."
          ],
          example: "Hospital example: investigate rising denied dollars by payer, department, and month before recommending next steps.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a37",
          title: "Build a Denial Summary CTE",
          objective: "Use a CTE to summarize denied dollars by payer.",
          sql_focus: ["CTE", "SUM", "WHERE", "GROUP BY"],
          relevantTables: ["claims"],
          joinHint: "Use claims only.",
          challengeCriteria: "Create a CTE called denied_payer_summary that returns payer and denied_billed_amount for denied claims. Select all rows from the CTE ordered by denied_billed_amount descending.",
          starterQuery: "",
          solutionQuery: "WITH denied_payer_summary AS (SELECT payer, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer) SELECT * FROM denied_payer_summary ORDER BY denied_billed_amount DESC;",
          hint: "Filter to denied claims inside the CTE.",
          smartHint: "Order the final SELECT by denied_billed_amount DESC.",
          thirdHint: "WITH denied_payer_summary AS (SELECT payer, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer) SELECT * FROM denied_payer_summary ORDER BY denied_billed_amount DESC;",
          explanation: "This creates a clean payer-level denial driver summary.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a38",
          title: "Add Denial Ranking",
          objective: "Rank payer denial drivers.",
          sql_focus: ["CTE", "RANK"],
          relevantTables: ["claims"],
          joinHint: "Build the summary first, then rank it.",
          challengeCriteria: "Use a CTE to summarize denied billed amount by payer, then return payer, denied_billed_amount, and denial_rank ranked highest first.",
          starterQuery: "",
          solutionQuery: "WITH denied_payer_summary AS (SELECT payer, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer) SELECT payer, denied_billed_amount, RANK() OVER (ORDER BY denied_billed_amount DESC) AS denial_rank FROM denied_payer_summary;",
          hint: "Rank the CTE output using RANK() OVER.",
          smartHint: "ORDER BY denied_billed_amount DESC inside the window function.",
          thirdHint: "WITH denied_payer_summary AS (...) SELECT payer, denied_billed_amount, RANK() OVER (ORDER BY denied_billed_amount DESC) AS denial_rank FROM denied_payer_summary;",
          explanation: "This shows which payers should be reviewed first.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "a39",
          title: "Department KPI Snapshot",
          objective: "Create a department-level operational snapshot.",
          sql_focus: ["CTE", "COUNT", "AVG", "GROUP BY"],
          relevantTables: ["encounters"],
          joinHint: "Use encounters for volume and LOS.",
          challengeCriteria: "Use a CTE called department_snapshot to return department, encounter_count, and avg_los. Select all rows ordered by encounter_count descending.",
          starterQuery: "",
          solutionQuery: "WITH department_snapshot AS (SELECT department, COUNT(*) AS encounter_count, AVG(length_of_stay) AS avg_los FROM encounters GROUP BY department) SELECT * FROM department_snapshot ORDER BY encounter_count DESC;",
          hint: "Build the grouped department summary inside the CTE.",
          smartHint: "Use COUNT(*) and AVG(length_of_stay).",
          thirdHint: "WITH department_snapshot AS (SELECT department, COUNT(*) AS encounter_count, AVG(length_of_stay) AS avg_los FROM encounters GROUP BY department) SELECT * FROM department_snapshot ORDER BY encounter_count DESC;",
          explanation: "This creates a reusable department performance summary.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "a40",
          title: "Scenario: Denial Spike Investigation",
          objective: "Plan an advanced SQL investigation for denied claims.",
          relevantTables: ["claims", "encounters", "departments"],
          joinHint: "Think about payer, department, time, and ranking.",
          summary: "Leadership says denied dollars increased and wants to know where to look first.",
          prompt: "Describe the SQL approach you would take to investigate rising denied dollars. Mention CTEs, payer segmentation, department or facility context, time trend, ranking, and validation checks.",
          expectedKeywords: ["cte", "payer", "department", "trend", "rank", "validate"],
          minLength: 150,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer lays out a structured advanced analysis using CTEs, segmentation, trend review, prioritization, and validation.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "a41",
          title: "Scenario: Advanced SQL Executive Brief",
          objective: "Translate advanced SQL output into leadership-ready insight.",
          relevantTables: ["encounters", "claims", "appointments", "observations", "discharges"],
          joinHint: "Connect technical output to operational or financial action.",
          summary: "You have completed an advanced SQL analysis and need to explain what it means.",
          prompt: "Write an executive-style explanation of an advanced SQL analysis. Include what metric was analyzed, how the SQL was structured, what stood out, what should be validated, and what leadership should investigate next.",
          expectedKeywords: ["metric", "sql", "stood out", "validate", "leadership", "investigate"],
          minLength: 150,
          minimumKeywordMatches: 4,
          feedbackGuide: "A strong answer turns advanced SQL work into a clear, cautious, action-oriented executive explanation.",
          executiveTakeaway: { show: false }
            }
        ]
      }
    ]
  },
{
  id: "track_executive_analyst",
  title: "Executive Analyst",
  description: "Final capstone level for hospital analysts: metric governance, data validation, root cause analysis, dashboard design, and executive-ready investigations.",
  order: 5,
  categories: [
    {
      id: "exec_metric_governance",
      title: "Metric Definition & Governance",
      order: 1,
      lessons: [
        {
          kind: "concept",
          id: "e1",
          title: "Define the Metric Before SQL",
          objective: "Understand why metric definitions must come before query writing.",
          sql_focus: ["Metric definition", "Numerator", "Denominator"],
          relevantTables: ["encounters", "claims", "appointments"],
          joinHint: "Start with the business definition before choosing tables.",
          summary: "Executive analytics starts with definition. A technically correct query can still answer the wrong question if the metric is poorly defined.",
          bullets: [
            "Every KPI needs a clear numerator and denominator.",
            "The table grain must match the metric.",
            "Inclusion and exclusion rules must be documented.",
            "A metric definition should be understandable by non-technical leaders.",
            "Governed metrics build trust."
          ],
          example: "Hospital example: denial rate could mean denied claim count divided by total claims, or denied dollars divided by billed dollars. Those are different KPIs.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e2",
          title: "Define Denial Rate",
          objective: "Write a clear metric definition before building SQL.",
          challengeMode: "text",
          sql_focus: ["Metric definition", "Denial rate"],
          relevantTables: ["claims"],
          joinHint: "Use claims because denial status and billed dollars live there.",
          challengeCriteria: "Define a denial rate metric for leadership. Include numerator, denominator, table source, and one caution about interpretation.",
          starterQuery: "",
          solutionQuery: "",
          minLength: 90,
          requiredConceptGroups: [
            ["numerator", "denied"],
            ["denominator", "total"],
            ["claims", "claim"]
          ],
          requiredConceptMatches: 2,
          bonusConceptGroups: [
            ["dollars", "count"],
            ["payer"],
            ["definition", "governance"]
          ],
          feedbackGuide: "A strong answer defines the numerator, denominator, source table, and interpretation risk.",
          exemplarAnswer: "Denial rate should be defined as denied claims divided by total claims from the claims table. The numerator is claims where claim_status equals Denied, and the denominator is all eligible claims in the reporting period. Leaders should know whether this is claim-count based or dollar-based because those definitions can lead to different conclusions.",
          hint: "Do not jump straight to SQL. Define what counts as denied and what counts as eligible.",
          smartHint: "Mention numerator, denominator, and claims table.",
          thirdHint: "A good answer says denied claims / total eligible claims, using claims as the source.",
          explanation: "This trains the analyst to define the KPI before querying it.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e3",
          title: "Inclusion and Exclusion Rules",
          objective: "Understand how eligibility rules shape KPI results.",
          sql_focus: ["WHERE", "Eligibility", "Exclusions"],
          relevantTables: ["encounters", "claims", "appointments"],
          joinHint: "Eligibility filters should match the approved metric definition.",
          summary: "Most executive KPIs require rules about what should be included or excluded.",
          bullets: [
            "Inclusion rules define what belongs in the metric.",
            "Exclusion rules define what should be left out.",
            "Changing exclusions changes the result.",
            "Rules should be documented beside the KPI.",
            "Analysts should not silently change definitions."
          ],
          example: "Hospital example: readmission metrics may exclude planned readmissions depending on the official definition.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e4",
          title: "Eligible Claims Cohort",
          objective: "Filter claims into an eligible reporting cohort.",
          sql_focus: ["WHERE", "Cohort"],
          relevantTables: ["claims"],
          joinHint: "Use only claims.",
          challengeCriteria: "Return all claims where claim_status is either 'Denied' or 'Paid'.",
          starterQuery: "",
          solutionQuery: "SELECT * FROM claims WHERE claim_status IN ('Denied', 'Paid');",
          hint: "Use IN for the two eligible statuses.",
          smartHint: "claim_status IN ('Denied', 'Paid')",
          thirdHint: "SELECT * FROM claims WHERE claim_status IN ('Denied', 'Paid');",
          explanation: "This creates a simple eligible claim cohort for count-based denial analysis.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e5",
          title: "Baseline vs Benchmark",
          objective: "Distinguish internal baseline from external benchmark.",
          sql_focus: ["Baseline", "Benchmark"],
          relevantTables: ["encounters", "claims"],
          joinHint: "No join is needed.",
          summary: "A baseline is your starting point. A benchmark is a comparison point. Leaders need to know which one they are seeing.",
          bullets: [
            "Baseline usually comes from your own prior performance.",
            "Benchmark may come from industry, peer groups, or targets.",
            "Improvement is usually measured against baseline.",
            "Performance strength is often judged against benchmark.",
            "Confusing the two can mislead leadership."
          ],
          example: "Hospital example: last quarter's denial rate is a baseline; a 9.4% target may be a benchmark or goal.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e6",
          title: "Explain Baseline vs Benchmark",
          objective: "Explain comparison framing in plain English.",
          challengeMode: "text",
          sql_focus: ["Executive communication"],
          relevantTables: ["claims"],
          joinHint: "This is a communication challenge.",
          challengeCriteria: "A leader asks whether a denial rate of 10.2% is good or bad. Explain why you need both baseline and benchmark context.",
          starterQuery: "",
          solutionQuery: "",
          minLength: 80,
          requiredConceptGroups: [
            ["baseline"],
            ["benchmark"],
            ["context", "compare", "comparison"]
          ],
          requiredConceptMatches: 2,
          feedbackGuide: "A strong answer explains that 10.2% cannot be judged without comparing it to prior performance and a target or benchmark.",
          exemplarAnswer: "A denial rate of 10.2% cannot be judged by itself. I would compare it to our internal baseline to see whether it improved or worsened, and compare it to a benchmark or target to know whether the current level is acceptable. Without both, leadership may overreact or underreact.",
          hint: "One number alone does not tell whether performance is good or bad.",
          smartHint: "Mention prior performance and target comparison.",
          thirdHint: "Baseline shows change over time; benchmark shows relative performance.",
          explanation: "This builds executive interpretation discipline.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e7",
          title: "Metric Ownership",
          objective: "Understand why KPI definitions need ownership.",
          sql_focus: ["Governance", "Ownership"],
          relevantTables: ["encounters", "claims", "appointments"],
          joinHint: "No join is needed.",
          summary: "A trusted KPI needs an owner who approves definitions, thresholds, and changes.",
          bullets: [
            "Metric owners prevent definition drift.",
            "Owners help resolve disagreements.",
            "Analysts should document assumptions.",
            "Dashboards should show definition notes when needed.",
            "Metric governance supports long-term trust."
          ],
          example: "Hospital example: revenue cycle leadership may own denial-rate definitions, while operations may own discharge-delay definitions.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e8",
          title: "Document a KPI Definition",
          objective: "Write a short KPI definition note.",
          challengeMode: "text",
          sql_focus: ["Documentation", "Governance"],
          relevantTables: ["appointments"],
          joinHint: "Use appointments for no-show status.",
          challengeCriteria: "Write a KPI definition note for no-show rate. Include source table, numerator, denominator, and owner or stakeholder.",
          starterQuery: "",
          solutionQuery: "",
          minLength: 100,
          requiredConceptGroups: [
            ["appointments"],
            ["no show", "no-show"],
            ["denominator", "total"]
          ],
          requiredConceptMatches: 2,
          feedbackGuide: "A strong answer documents source, numerator, denominator, and stakeholder ownership.",
          exemplarAnswer: "No-show rate is calculated from the appointments table. The numerator is appointments where status equals No Show, and the denominator is total eligible scheduled appointments during the reporting period. The operational owner should be clinic access or ambulatory leadership, with analysts documenting exclusions such as canceled appointments if applicable.",
          hint: "Think source, numerator, denominator, and owner.",
          smartHint: "No-show rate uses appointments and appointment status.",
          thirdHint: "Numerator: No Show. Denominator: eligible appointments.",
          explanation: "This turns a metric into a governed dashboard definition.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e9",
          title: "Scenario: Metric Governance Review",
          objective: "Explain how to prevent conflicting KPI definitions.",
          relevantTables: ["claims", "appointments", "encounters"],
          joinHint: "Think about definition, owner, and documentation.",
          summary: "Two leaders are using different definitions for the same KPI.",
          prompt: "Explain how you would resolve a disagreement where two departments are reporting different denial rates. Mention numerator, denominator, eligibility rules, source table, owner approval, and documentation.",
          expectedKeywords: ["numerator", "denominator", "source", "owner", "definition", "document"],
          minLength: 140,
          minimumKeywordMatches: 4,
          feedbackGuide: "A strong answer explains how metric governance resolves conflicting definitions before dashboard publication.",
          executiveTakeaway: { show: false }
        }
      ]
    },

    {
      id: "exec_data_validation_trust",
      title: "Data Validation & Trust",
      order: 2,
      lessons: [
        {
          kind: "concept",
          id: "e10",
          title: "Validate Before You Present",
          objective: "Understand why validation is part of the analyst workflow.",
          sql_focus: ["Validation", "Trust"],
          relevantTables: ["encounters", "claims", "appointments"],
          joinHint: "Validate totals before deeper interpretation.",
          summary: "A dashboard is only useful if leaders trust it. Validation is the analyst's responsibility before the numbers reach leadership.",
          bullets: [
            "Check row counts.",
            "Compare to prior periods.",
            "Look for missing values.",
            "Check duplicates after joins.",
            "Document known limitations."
          ],
          example: "Hospital example: if monthly ED volume drops by 80%, validate the extract before calling it an operational change.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e11",
          title: "Basic Row Count Validation",
          objective: "Run a row count check before analysis.",
          sql_focus: ["COUNT", "Validation"],
          relevantTables: ["encounters"],
          joinHint: "Use only encounters.",
          challengeCriteria: "Return the total row count from encounters as encounter_rows.",
          starterQuery: "",
          solutionQuery: "SELECT COUNT(*) AS encounter_rows FROM encounters;",
          hint: "Use COUNT(*).",
          smartHint: "Alias the count as encounter_rows.",
          thirdHint: "SELECT COUNT(*) AS encounter_rows FROM encounters;",
          explanation: "A basic row count is often the first validation check.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e12",
          title: "Completeness Checks",
          objective: "Understand how missing fields affect reporting trust.",
          sql_focus: ["NULL", "Completeness"],
          relevantTables: ["encounters", "claims", "appointments"],
          joinHint: "Check key fields needed for the KPI.",
          summary: "Completeness checks identify whether important fields are missing before the metric is trusted.",
          bullets: [
            "Missing dates can break trends.",
            "Missing payer can distort payer mix.",
            "Missing department can hide operational drivers.",
            "Missing discharge fields can distort throughput metrics.",
            "Completeness should be checked before executive reporting."
          ],
          example: "Hospital example: denied claims without payer values cannot support reliable payer-level denial analysis.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e13",
          title: "Missing Payer Check",
          objective: "Count claims missing payer information.",
          sql_focus: ["NULL", "COUNT", "WHERE"],
          relevantTables: ["claims"],
          joinHint: "Use claims.",
          challengeCriteria: "Return the number of claims where payer is NULL. Label it missing_payer_count.",
          starterQuery: "",
          solutionQuery: "SELECT COUNT(*) AS missing_payer_count FROM claims WHERE payer IS NULL;",
          hint: "Use IS NULL.",
          smartHint: "NULL cannot be checked with =.",
          thirdHint: "SELECT COUNT(*) AS missing_payer_count FROM claims WHERE payer IS NULL;",
          explanation: "This checks whether payer-level reporting may be incomplete.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e14",
          title: "Duplicate Risk After Joins",
          objective: "Recognize overcounting risk in one-to-many joins.",
          sql_focus: ["JOIN", "COUNT DISTINCT", "Validation"],
          relevantTables: ["encounters", "charges"],
          joinHint: "Validate row counts before and after joining.",
          summary: "One-to-many joins can multiply rows and inflate metrics if analysts do not validate the grain.",
          bullets: [
            "One encounter can have many charges.",
            "COUNT(*) after the join may count charge rows, not encounters.",
            "COUNT(DISTINCT encounter_id) protects encounter counts.",
            "Compare pre-join and post-join counts.",
            "Explain grain clearly in validation notes."
          ],
          example: "Hospital example: encounter volume can look higher after joining charges because each encounter may have multiple charge lines.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e15",
          title: "Validate Join Inflation",
          objective: "Compare joined rows to distinct encounters.",
          sql_focus: ["JOIN", "COUNT", "DISTINCT"],
          relevantTables: ["encounters", "charges"],
          joinHint: "Join on encounter_id.",
          challengeCriteria: "Join encounters to charges and return joined_rows and distinct_encounters.",
          starterQuery: "",
          solutionQuery: "SELECT COUNT(*) AS joined_rows, COUNT(DISTINCT e.encounter_id) AS distinct_encounters FROM encounters e JOIN charges c ON e.encounter_id = c.encounter_id;",
          hint: "Use COUNT(*) and COUNT(DISTINCT e.encounter_id).",
          smartHint: "joined_rows may be larger than distinct_encounters.",
          thirdHint: "SELECT COUNT(*) AS joined_rows, COUNT(DISTINCT e.encounter_id) AS distinct_encounters FROM encounters e JOIN charges c ON e.encounter_id = c.encounter_id;",
          explanation: "This reveals whether the join creates multiple rows per encounter.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e16",
          title: "Outlier Review",
          objective: "Understand why outliers need review before interpretation.",
          sql_focus: ["ORDER BY", "Outliers"],
          relevantTables: ["encounters", "charges", "discharges"],
          joinHint: "Use sorting to surface unusual values.",
          summary: "Outliers can be real operational stories or data errors. Analysts must review them before summarizing results.",
          bullets: [
            "Outliers can distort averages.",
            "They may reveal true high-impact cases.",
            "They may also reveal bad data.",
            "Sorting is a simple outlier detection method.",
            "Leaders should know whether outliers were included or excluded."
          ],
          example: "Hospital example: one extreme LOS case may raise department average LOS.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e17",
          title: "Find LOS Outliers",
          objective: "Return longest LOS encounters for review.",
          sql_focus: ["ORDER BY", "LIMIT"],
          relevantTables: ["encounters"],
          joinHint: "Use encounters.",
          challengeCriteria: "Return encounter_id, department, and length_of_stay for the 10 longest stays.",
          starterQuery: "",
          solutionQuery: "SELECT encounter_id, department, length_of_stay FROM encounters ORDER BY length_of_stay DESC LIMIT 10;",
          hint: "Sort length_of_stay descending.",
          smartHint: "Use LIMIT 10.",
          thirdHint: "SELECT encounter_id, department, length_of_stay FROM encounters ORDER BY length_of_stay DESC LIMIT 10;",
          explanation: "This surfaces cases that may distort LOS analysis.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e18",
          title: "Scenario: Validation Note for Leadership",
          objective: "Write an executive-facing validation note.",
          relevantTables: ["encounters", "claims", "appointments"],
          joinHint: "Think about row counts, missing fields, duplicates, and outliers.",
          summary: "Before sending a dashboard, you need a short trust statement.",
          prompt: "Write a validation note you would include before presenting a dashboard to leadership. Mention row count checks, missing data, duplicate risk, outliers, and any limitation that should be disclosed.",
          expectedKeywords: ["row count", "missing", "duplicate", "outlier", "limitation", "validate"],
          minLength: 140,
          minimumKeywordMatches: 4,
          feedbackGuide: "A strong answer communicates what was validated and what limitations remain.",
          executiveTakeaway: { show: false }
        }
      ]
    },

    {
      id: "exec_root_cause_analysis",
      title: "Root Cause Analysis",
      order: 3,
      lessons: [
        {
          kind: "concept",
          id: "e19",
          title: "From Metric to Driver",
          objective: "Understand how analysts move from what happened to why it happened.",
          sql_focus: ["Segmentation", "Root cause"],
          relevantTables: ["encounters", "claims", "appointments", "discharges"],
          joinHint: "Segment the metric by meaningful business dimensions.",
          summary: "Root cause analysis starts after a KPI changes. The analyst segments the metric to identify likely drivers.",
          bullets: [
            "A KPI tells you what changed.",
            "Segmentation helps explain where it changed.",
            "Drivers can be payer, department, facility, provider, time, or patient population.",
            "Root cause requires evidence, not guesses.",
            "SQL helps narrow where leaders should investigate."
          ],
          example: "Hospital example: denied dollars increased, so the analyst segments by payer, department, and month.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e20",
          title: "Denied Dollars by Payer",
          objective: "Segment denied billed amount by payer.",
          sql_focus: ["WHERE", "SUM", "GROUP BY"],
          relevantTables: ["claims"],
          joinHint: "Use claims.",
          challengeCriteria: "Return payer and denied_billed_amount for denied claims, sorted highest first.",
          starterQuery: "",
          solutionQuery: "SELECT payer, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_billed_amount DESC;",
          hint: "Filter to denied claims and group by payer.",
          smartHint: "Sort denied_billed_amount descending.",
          thirdHint: "SELECT payer, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_billed_amount DESC;",
          explanation: "This identifies payer-level denial drivers.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e21",
          title: "Segmentation Dimensions",
          objective: "Choose useful dimensions for root cause analysis.",
          sql_focus: ["GROUP BY", "Segmentation"],
          relevantTables: ["encounters", "claims", "appointments", "patients", "providers"],
          joinHint: "Join only when the segmentation field lives in another table.",
          summary: "The best segmentation depends on the operational question.",
          bullets: [
            "Facility shows where the issue is happening.",
            "Department shows operational unit impact.",
            "Payer shows financial pattern.",
            "Provider or specialty may show workflow variation.",
            "Time shows whether the issue is new, seasonal, or persistent."
          ],
          example: "Hospital example: no-show rate may be segmented by department, provider specialty, and month.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e22",
          title: "No-Shows by Department",
          objective: "Segment no-show volume by department.",
          sql_focus: ["WHERE", "COUNT", "GROUP BY"],
          relevantTables: ["appointments"],
          joinHint: "Use appointments.",
          challengeCriteria: "Return department and no_show_count for appointments where status equals 'No Show', sorted highest first.",
          starterQuery: "",
          solutionQuery: "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department ORDER BY no_show_count DESC;",
          hint: "Filter to No Show first.",
          smartHint: "Group by department.",
          thirdHint: "SELECT department, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY department ORDER BY no_show_count DESC;",
          explanation: "This identifies where no-show volume is concentrated.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e23",
          title: "Volume vs Rate as Drivers",
          objective: "Understand why driver analysis needs both counts and rates.",
          sql_focus: ["COUNT", "CASE", "Rates"],
          relevantTables: ["claims", "appointments"],
          joinHint: "Always show numerator and denominator with rates.",
          summary: "The biggest count and the worst rate may not be the same group.",
          bullets: [
            "Counts show operational size.",
            "Rates show relative performance.",
            "A small group can have a high rate but low impact.",
            "A large group can have a moderate rate but high impact.",
            "Executive prioritization often needs both."
          ],
          example: "Hospital example: one payer may have the highest denial rate, while another has the highest denied dollars.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e24",
          title: "No-Show Rate and Count",
          objective: "Return both no-show count and no-show rate by department.",
          sql_focus: ["CASE", "COUNT", "GROUP BY"],
          relevantTables: ["appointments"],
          joinHint: "Use appointments.",
          challengeCriteria: "Return department, total_appointments, no_show_count, and no_show_rate by department.",
          starterQuery: "",
          solutionQuery: "SELECT department, COUNT(*) AS total_appointments, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) AS no_show_count, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS no_show_rate FROM appointments GROUP BY department;",
          hint: "Use SUM(CASE...) for no-shows and divide by COUNT(*).",
          smartHint: "Show both numerator and denominator.",
          thirdHint: "SELECT department, COUNT(*) AS total_appointments, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) AS no_show_count, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS no_show_rate FROM appointments GROUP BY department;",
          explanation: "This supports prioritization using both scale and rate.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e25",
          title: "Triangulating Drivers",
          objective: "Use multiple cuts of the data to narrow likely causes.",
          sql_focus: ["Root cause", "Multiple dimensions"],
          relevantTables: ["encounters", "claims", "appointments", "discharges"],
          joinHint: "Use several views before drawing a conclusion.",
          summary: "One breakdown rarely proves root cause. Analysts triangulate by comparing several related dimensions.",
          bullets: [
            "Segment by time to see when it started.",
            "Segment by facility to see where it happened.",
            "Segment by department to find operational ownership.",
            "Segment by payer or provider when relevant.",
            "Look for consistent patterns across views."
          ],
          example: "Hospital example: discharge delays may be reviewed by department, disposition, transport flag, and month.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e26",
          title: "Discharge Delay by Department",
          objective: "Segment discharge delays by department.",
          sql_focus: ["CASE", "GROUP BY", "Calculated field"],
          relevantTables: ["discharges"],
          joinHint: "Use discharges.",
          challengeCriteria: "Return department, total_discharges, delayed_count, and delayed_rate where delayed means departure_minutes - discharge_order_minutes > 240.",
          starterQuery: "",
          solutionQuery: "SELECT department, COUNT(*) AS total_discharges, SUM(CASE WHEN departure_minutes - discharge_order_minutes > 240 THEN 1 ELSE 0 END) AS delayed_count, SUM(CASE WHEN departure_minutes - discharge_order_minutes > 240 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS delayed_rate FROM discharges GROUP BY department;",
          hint: "Use the calculated delay inside CASE.",
          smartHint: "Threshold is greater than 240 minutes.",
          thirdHint: "SELECT department, COUNT(*) AS total_discharges, SUM(CASE WHEN departure_minutes - discharge_order_minutes > 240 THEN 1 ELSE 0 END) AS delayed_count, SUM(CASE WHEN departure_minutes - discharge_order_minutes > 240 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS delayed_rate FROM discharges GROUP BY department;",
          explanation: "This identifies departments with higher discharge-delay burden.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e27",
          title: "Scenario: Root Cause Plan",
          objective: "Create a structured root-cause analysis plan.",
          relevantTables: ["encounters", "claims", "appointments", "discharges", "observations"],
          joinHint: "Think metric, driver dimensions, and next investigation.",
          summary: "A KPI worsened and leadership wants to know why.",
          prompt: "Create a root cause analysis plan for a hospital KPI that worsened. Mention the metric, the first three segmentation cuts you would run, what would make a segment a likely driver, and what operational team should investigate next.",
          expectedKeywords: ["metric", "segment", "driver", "department", "payer", "facility", "investigate"],
          minLength: 160,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer shows how to move from KPI change to likely drivers and operational follow-up.",
          executiveTakeaway: { show: false }
        }
      ]
    },

    {
      id: "exec_dashboard_reporting",
      title: "Dashboard & Executive Reporting Design",
      order: 4,
      lessons: [
        {
          kind: "concept",
          id: "e28",
          title: "Executive Dashboards Need Focus",
          objective: "Understand how to design dashboards around decisions.",
          sql_focus: ["Dashboard design", "KPI selection"],
          relevantTables: ["encounters", "claims", "appointments"],
          joinHint: "Pick metrics that support decisions.",
          summary: "A dashboard should not be a data dump. It should help leaders see status, risk, trend, and action.",
          bullets: [
            "Use few high-value KPIs.",
            "Show trend, not only current value.",
            "Include drilldowns for root cause.",
            "Add definitions when needed.",
            "Make next action obvious."
          ],
          example: "Hospital example: a denial dashboard should show rate, dollars, payer drivers, trend, and denial reason if available.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e29",
          title: "Choose Dashboard KPIs",
          objective: "Select KPIs for a leadership dashboard.",
          challengeMode: "text",
          sql_focus: ["Dashboard design"],
          relevantTables: ["encounters", "claims", "appointments", "discharges"],
          joinHint: "Think about balance across volume, quality, access, finance, and throughput.",
          challengeCriteria: "Choose five KPIs for a hospital operations dashboard and explain why each belongs.",
          starterQuery: "",
          solutionQuery: "",
          minLength: 130,
          requiredConceptGroups: [
            ["volume"],
            ["denial", "finance", "financial", "claim"],
            ["los", "discharge", "throughput", "delay"]
          ],
          requiredConceptMatches: 2,
          feedbackGuide: "A strong answer selects balanced KPIs and explains the leadership decision each supports.",
          exemplarAnswer: "I would include encounter volume for demand, average LOS for throughput, discharge delay rate for capacity, denial rate or denied dollars for revenue cycle risk, and no-show rate for access. Together these show operational load, patient flow, financial leakage, and outpatient access issues that leadership can act on.",
          hint: "Balance operational, financial, access, and throughput measures.",
          smartHint: "Include what decision each KPI supports.",
          thirdHint: "Do not list random metrics; explain why they belong.",
          explanation: "This reinforces dashboard design around leadership decisions.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e30",
          title: "KPI Cards vs Drilldowns",
          objective: "Understand the difference between summary and diagnostic views.",
          sql_focus: ["Dashboard structure", "Drilldowns"],
          relevantTables: ["encounters", "claims"],
          joinHint: "Use KPI cards for status and drilldowns for drivers.",
          summary: "KPI cards tell leaders where attention is needed. Drilldowns explain where to investigate.",
          bullets: [
            "Cards should be simple and high-level.",
            "Drilldowns should segment by useful dimensions.",
            "Do not overload the top of the dashboard.",
            "Every drilldown should answer a follow-up question.",
            "Good dashboards move from status to diagnosis."
          ],
          example: "Hospital example: top card shows denial rate; drilldowns show payer, department, and trend.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e31",
          title: "Build a Drilldown Query",
          objective: "Create a payer drilldown for denial dashboard.",
          sql_focus: ["GROUP BY", "ORDER BY", "SUM"],
          relevantTables: ["claims"],
          joinHint: "Use claims.",
          challengeCriteria: "Return payer, denied_claims, and denied_billed_amount for denied claims sorted by denied_billed_amount descending.",
          starterQuery: "",
          solutionQuery: "SELECT payer, COUNT(*) AS denied_claims, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_billed_amount DESC;",
          hint: "Filter to denied claims first.",
          smartHint: "Group by payer and sort by denied_billed_amount DESC.",
          thirdHint: "SELECT payer, COUNT(*) AS denied_claims, SUM(billed_amount) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer ORDER BY denied_billed_amount DESC;",
          explanation: "This supports a revenue-cycle drilldown beneath a denial KPI card.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e32",
          title: "Executive Summary Language",
          objective: "Translate metrics into leadership-ready narrative.",
          sql_focus: ["Executive communication"],
          relevantTables: ["encounters", "claims"],
          joinHint: "The SQL provides evidence; the summary explains meaning.",
          summary: "Executives need concise interpretation: what changed, why it matters, and what to do next.",
          bullets: [
            "Lead with the finding.",
            "Include magnitude and direction.",
            "Explain operational or financial impact.",
            "Avoid overclaiming causation.",
            "End with next investigation or action."
          ],
          example: "Hospital example: 'Denied dollars are concentrated in two payers, suggesting revenue cycle should review authorization and documentation workflows.'",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e33",
          title: "Write an Executive Insight",
          objective: "Write a concise dashboard insight.",
          challengeMode: "text",
          sql_focus: ["Executive communication"],
          relevantTables: ["claims"],
          joinHint: "Interpret the metric result.",
          challengeCriteria: "A dashboard shows denied billed amount is highest for one payer. Write a concise executive insight with what it means, why it matters, and what should be investigated.",
          starterQuery: "",
          solutionQuery: "",
          minLength: 80,
          requiredConceptGroups: [
            ["payer"],
            ["denied", "denial"],
            ["investigate", "review"]
          ],
          requiredConceptMatches: 2,
          feedbackGuide: "A strong answer connects payer concentration to financial risk and recommends a next review step.",
          exemplarAnswer: "Denied billed dollars are concentrated in one payer, creating a focused revenue-cycle risk. This matters because the organization may be losing collectible revenue in a specific payer workflow. Revenue cycle should review denial reasons, authorization patterns, documentation, coding, and medical necessity requirements for that payer.",
          hint: "Explain meaning, impact, and next step.",
          smartHint: "Mention payer concentration and revenue-cycle investigation.",
          thirdHint: "Do not just restate the number; say what leadership should do.",
          explanation: "This develops leadership-facing communication.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "concept",
          id: "e34",
          title: "Avoiding Dashboard Overload",
          objective: "Understand why fewer, better metrics are more useful.",
          sql_focus: ["Dashboard design", "UX"],
          relevantTables: ["encounters", "claims", "appointments"],
          joinHint: "Use drilldowns instead of cluttering the main view.",
          summary: "Too many metrics make dashboards harder to use. Executive dashboards should guide attention.",
          bullets: [
            "Do not put every available metric on the top page.",
            "Group related metrics by domain.",
            "Use drilldowns for detail.",
            "Prioritize metrics tied to decisions.",
            "Remove metrics that do not trigger action."
          ],
          example: "Hospital example: show LOS, discharge delay, and observation hours together under throughput rather than scattering them randomly.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "challenge",
          id: "e35",
          title: "Dashboard Layout Plan",
          objective: "Plan an executive dashboard structure.",
          challengeMode: "text",
          sql_focus: ["Dashboard design"],
          relevantTables: ["encounters", "claims", "appointments", "observations", "discharges"],
          joinHint: "Think top-level cards, trend, and drilldowns.",
          challengeCriteria: "Design a dashboard layout for hospital leadership. Include top KPI cards, one trend view, and at least two drilldowns.",
          starterQuery: "",
          solutionQuery: "",
          minLength: 130,
          requiredConceptGroups: [
            ["card", "kpi"],
            ["trend"],
            ["drilldown", "drill down"]
          ],
          requiredConceptMatches: 2,
          feedbackGuide: "A strong answer organizes the dashboard into summary, trend, and diagnostic layers.",
          exemplarAnswer: "The dashboard would start with KPI cards for encounter volume, average LOS, denial rate, no-show rate, and discharge delay rate. A monthly trend would show whether performance is improving or worsening. Drilldowns would include payer denial drivers and department throughput drivers so leaders can move from status to action.",
          hint: "Think card, trend, and drilldown layers.",
          smartHint: "Top cards show status; drilldowns explain drivers.",
          thirdHint: "Include what each section helps leadership decide.",
          explanation: "This teaches dashboard architecture.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e36",
          title: "Scenario: Executive Dashboard Pitch",
          objective: "Explain a dashboard design to leadership.",
          relevantTables: ["encounters", "claims", "appointments", "discharges", "observations"],
          joinHint: "Focus on decision support.",
          summary: "You are presenting a proposed dashboard to executive leadership.",
          prompt: "Write a short pitch explaining your dashboard design. Mention the business problem, the top KPIs, the trend view, the drilldowns, and how leadership should use the dashboard to make decisions.",
          expectedKeywords: ["business", "kpi", "trend", "drilldown", "decision", "leadership"],
          minLength: 160,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer frames the dashboard as a decision-support tool, not just a report.",
          executiveTakeaway: { show: false }
        }
      ]
    },

    {
      id: "exec_capstone_investigations",
      title: "Capstone Investigations",
      order: 5,
      lessons: [
        {
          kind: "scenario",
          id: "e37",
          title: "Capstone: Denial Spike",
          objective: "Investigate a denied-claims increase.",
          relevantTables: ["claims", "encounters", "departments"],
          joinHint: "Start with claims, then join encounter context if department or facility is needed.",
          summary: "Denied billed dollars increased this quarter.",
          prompt: "Create an analysis plan for a denial spike. Include metric definition, validation checks, payer segmentation, department or facility segmentation, trend review, and executive next steps.",
          expectedKeywords: ["denial", "validate", "payer", "department", "trend", "next"],
          minLength: 170,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer moves from validated metric to segmented drivers and next investigation steps.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e38",
          title: "Capstone: LOS Increase",
          objective: "Investigate an increase in length of stay.",
          relevantTables: ["encounters", "discharges", "observations"],
          joinHint: "Start with encounters and add discharge or observation context if needed.",
          summary: "Average LOS increased across the hospital.",
          prompt: "Create an analysis plan for rising average LOS. Mention validation, outliers, department segmentation, facility segmentation, discharge delays, observation patterns, and executive interpretation.",
          expectedKeywords: ["los", "outlier", "department", "facility", "discharge", "observation"],
          minLength: 170,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer explains how to separate true LOS pressure from outliers, documentation issues, and operational bottlenecks.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e39",
          title: "Capstone: Observation Over 48 Hours",
          objective: "Investigate extended observation stays.",
          relevantTables: ["observations", "encounters"],
          joinHint: "Use observations for obs_hours and conversion flags.",
          summary: "Leadership wants to understand observation stays over 48 hours.",
          prompt: "Create an analysis plan for observation stays over 48 hours. Mention numerator, denominator, facility and department segmentation, conversion to inpatient, Code 44, and operational follow-up.",
          expectedKeywords: ["observation", "48", "facility", "department", "conversion", "code 44"],
          minLength: 160,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer defines the extended observation cohort and connects it to utilization review and throughput follow-up.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e40",
          title: "Capstone: Discharge Delay",
          objective: "Investigate delays after discharge orders.",
          relevantTables: ["discharges", "encounters"],
          joinHint: "Use discharges for order-to-departure timing.",
          summary: "Patients are leaving hours after discharge orders.",
          prompt: "Create an analysis plan for discharge delays over 240 minutes. Mention definition, validation, department segmentation, discharge disposition, transport delay, trend review, and leadership action.",
          expectedKeywords: ["discharge", "240", "department", "disposition", "transport", "trend"],
          minLength: 160,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer connects discharge delay metrics to bed capacity and operational process improvement.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e41",
          title: "Capstone: Readmission Pattern",
          objective: "Investigate 30-day readmission drivers.",
          relevantTables: ["readmissions", "encounters", "patients"],
          joinHint: "Use readmissions for flags and days_to_readmit.",
          summary: "Thirty-day readmissions are increasing.",
          prompt: "Create an analysis plan for rising 30-day readmissions. Mention readmission definition, index encounter, days to readmit, department or facility segmentation, patient risk, discharge disposition, and follow-up action.",
          expectedKeywords: ["readmission", "30", "index", "risk", "disposition", "follow"],
          minLength: 170,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer connects readmissions to cohort definition, timing, patient risk, and care coordination follow-up.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e42",
          title: "Capstone: No-Show Access Issue",
          objective: "Investigate outpatient access and no-show patterns.",
          relevantTables: ["appointments", "patients", "providers"],
          joinHint: "Start with appointments and join patients or providers for context.",
          summary: "No-show rates increased in outpatient clinics.",
          prompt: "Create an analysis plan for rising no-show rates. Mention numerator, denominator, department segmentation, provider or specialty context, patient risk or payer context, time trend, and access improvement action.",
          expectedKeywords: ["no-show", "denominator", "department", "provider", "risk", "trend"],
          minLength: 160,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer treats no-shows as an access and continuity issue rather than simply blaming patients.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e43",
          title: "Capstone: ED Boarding and Capacity",
          objective: "Investigate patient flow and capacity pressure.",
          relevantTables: ["encounters", "discharges", "observations"],
          joinHint: "Use encounters for volume and discharges or observations for throughput context.",
          summary: "The ED reports boarding and capacity pressure.",
          prompt: "Create an analysis plan for ED boarding or capacity pressure. Mention ED volume, inpatient capacity, discharge delays, observation hours, LOS, facility segmentation, and operational next steps.",
          expectedKeywords: ["ed", "boarding", "volume", "discharge", "observation", "capacity"],
          minLength: 170,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer connects ED pressure to downstream bed capacity, discharge delays, and observation flow.",
          executiveTakeaway: { show: false }
        },
        {
          kind: "scenario",
          id: "e44",
          title: "Capstone: Payer Mix Shift",
          objective: "Investigate financial risk from payer mix changes.",
          relevantTables: ["patients", "claims", "encounters"],
          joinHint: "Use claims for payer financial metrics and patients for insurance context.",
          summary: "Leadership believes payer mix changed and may be affecting revenue.",
          prompt: "Create an analysis plan for payer mix shift. Mention payer distribution, volume, billed dollars, denial rate, claim collections risk, time trend, and executive interpretation.",
          expectedKeywords: ["payer", "mix", "volume", "denial", "revenue", "trend"],
          minLength: 160,
          minimumKeywordMatches: 5,
          feedbackGuide: "A strong answer connects payer mix to financial exposure, denial risk, and trend context.",
          executiveTakeaway: { show: false }
        },
       {
  kind: "scenario",
  id: "e45",
  title: "Final Capstone: Safety, Quality, and Financial Risk Brief",
  objective: "Produce a complete executive-ready analytical response that balances patient safety, quality, throughput, and financial risk.",
  relevantTables: ["encounters", "claims", "appointments", "discharges", "observations", "readmissions", "patients"],
  joinHint: "Use the correct starting table, validate the data, segment drivers, and explain the operational, safety, quality, and financial implications.",
  summary: "This is the final Executive Analyst scenario.",
  prompt: "Choose one hospital problem such as preventable denials, readmissions, observation stays over 48 hours, ED boarding, discharge delays, or no-shows. Write a complete executive analyst brief. Include the metric definition, numerator and denominator, source tables, validation checks, SQL strategy, segmentation plan, likely drivers, patient safety or quality implications, financial implications, limitations, and recommended next steps for leadership.",
  expectedKeywords: ["definition", "denominator", "source", "validate", "sql", "segment", "driver", "safety", "financial", "next"],
  minLength: 260,
  minimumKeywordMatches: 7,
  feedbackGuide: "A strong final answer demonstrates end-to-end analyst thinking: metric definition, validation, SQL design, root cause, patient safety or quality impact, financial impact, and executive next steps.",
  executiveTakeaway: { show: false }
}
      ]
    }
  ]
}
];
  const STORAGE_KEY = "careops_curriculum_master_v2";
  const AI_API_CONFIG = { endpoint: "/api/ai-companion", method: "POST", timeoutMs: 15000 };
  const W = window;

  // ---------- Safe fallbacks ----------
  function escapeHtml(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function defaultSandboxQuery() {
    return `SELECT facility, department, COUNT(*) AS encounter_count, ROUND(AVG(length_of_stay),2) AS avg_los
FROM encounters
GROUP BY facility, department
ORDER BY encounter_count DESC;`;
  }
  function setMessageState(id, state, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `message-banner ${state || ""}`.trim();
    el.textContent = msg || "";
  }
  if (typeof W.escapeHtml !== "function") W.escapeHtml = escapeHtml;
  if (typeof W.defaultSandboxQuery !== "function") W.defaultSandboxQuery = defaultSandboxQuery;
  if (typeof W.setMessageState !== "function") W.setMessageState = setMessageState;

  let sandboxModeState = typeof W.sandboxModeState === "string" ? W.sandboxModeState : "free";
  let selectedSandboxPromptId = typeof W.selectedSandboxPromptId === "string" ? W.selectedSandboxPromptId : null;
  let selectedExecutivePromptId = typeof W.selectedExecutivePromptId === "string" ? W.selectedExecutivePromptId : null;

  Object.defineProperty(W, "sandboxModeState", { configurable: true, get: () => sandboxModeState, set: v => { sandboxModeState = v === "guided" ? "guided" : "free"; } });
  Object.defineProperty(W, "selectedSandboxPromptId", { configurable: true, get: () => selectedSandboxPromptId, set: v => { selectedSandboxPromptId = v ? String(v) : null; } });
  Object.defineProperty(W, "selectedExecutivePromptId", { configurable: true, get: () => selectedExecutivePromptId, set: v => { selectedExecutivePromptId = v ? String(v) : null; } });

  // ---------- State ----------
  let appState = {
    currentTrackId: "track_foundations",
    currentCategoryId: null,
    currentLessonId: null,
    currentView: "overview",
    completedLessonIds: [],
    firstTryLessonIds: [],
    schemaPanelWidth: 320,
    lessonStats: {},
    xp: 0,
    xpEvents: {},
    analystLevel: 1,
    expandedCategoryIds: [],
    glossarySearch: "",
    glossaryCategory: ""
  };
  if (W.appState && typeof W.appState === "object") appState = { ...appState, ...W.appState };
  W.appState = appState;

  let SQL = null;
  let sqlDb = null;
  let sandboxDb = null;
  let sqlEngineReady = false;
  let attempts = 0;
  let aiThread = [];

  const promptUiState = {
    sql: { search: "", category: "all", page: 1, pageSize: 6 },
    executive: { search: "", category: "all", page: 1, pageSize: 6 }
  };

  // ---------- Data ----------
  const schema = W.schema || {
    tables: [
      { name: "patients", description: "Patient demographic, insurance, and risk information.", notableColumns: ["patient_id","first_name","last_name","age","gender","insurance_type","risk_score","city"], sampleRows: [] },
      { name: "providers", description: "Provider names, specialties, and facility assignments.", notableColumns: ["provider_id","provider_name","specialty","facility"], sampleRows: [] },
      { name: "departments", description: "Hospital and clinic departments by facility and service line.", notableColumns: ["department_id","department_name","facility","service_line"], sampleRows: [] },
      { name: "encounters", description: "Patient encounters tied to providers and departments.", notableColumns: ["encounter_id","patient_id","provider_id","department_id","facility","department","status","encounter_type","length_of_stay","admit_date","discharge_date"], sampleRows: [] },
      { name: "appointments", description: "Scheduled appointments tied to patients and providers.", notableColumns: ["appointment_id","patient_id","provider_id","department_id","facility","department","status","date"], sampleRows: [] },
      { name: "charges", description: "Financial charges tied to patients and encounters.", notableColumns: ["charge_id","patient_id","encounter_id","amount","payer","charge_type"], sampleRows: [] },
      { name: "claims", description: "Claims tied to patients and encounters.", notableColumns: ["claim_id","patient_id","encounter_id","payer","claim_status","billed_amount"], sampleRows: [] },
      { name: "discharges", description: "Discharge workflow details including delays and disposition.", notableColumns: ["discharge_id","encounter_id","patient_id","facility","department","discharge_disposition","discharge_order_minutes","departure_minutes","delayed_for_transport"], sampleRows: [] },
      { name: "readmissions", description: "Thirty-day readmission tracking.", notableColumns: ["readmission_id","index_encounter_id","readmit_encounter_id","patient_id","facility","readmit_within_30_days","days_to_readmit"], sampleRows: [] },
      { name: "observations", description: "Observation stays and conversion details.", notableColumns: ["observation_id","encounter_id","patient_id","facility","department","obs_hours","converted_to_inpatient","code_44_flag"], sampleRows: [] }
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
  W.schema = schema;

  // Replace this fallback curriculum block with your current full curriculum array to preserve every lesson.
  const curriculum = W.curriculum || [
    {
      id: "track_foundations",
      title: "Foundations",
      description: "Foundations learning path for CareOps hospital analytics.",
      categories: [
        {
          id: "foundations_core",
          title: "Understanding Hospital Data",
          lessons: [
            {
              kind: "concept",
              id: "f1",
              title: "What Is Hospital Data?",
              objective: "Understand the main types of hospital data and why each serves a different business purpose.",
              sql_focus: ["Clinical", "Operational", "Financial"],
              relevantTables: ["encounters", "claims", "charges"],
              joinHint: "No join required.",
              summary: "Hospital data is not one giant spreadsheet. It is a collection of datasets that describe patient care, operations, and reimbursement.",
              bullets: [
                "Clinical data describes what happened medically.",
                "Operational data describes timing, flow, and utilization.",
                "Financial data describes charges, claims, and reimbursement."
              ],
              example: "One ED visit can create an encounter, a claim, and charge rows."
            },
            {
              kind: "challenge",
              id: "f2",
              title: "Choose the Right Table",
              objective: "Use grain and business language to choose the best starting table.",
              challengeMode: "text",
              relevantTables: ["patients", "encounters"],
              challengeCriteria: "A leader asks: How many patients came to the hospital last month? Which table is the better starting point: patients or encounters? Explain why.",
              minLength: 45,
              requiredConceptGroups: [["encounters", "encounter"]],
              requiredConceptMatches: 1,
              feedbackGuide: "Start with encounters because the question is about activity during a time period."
            },
            {
              kind: "challenge",
              id: "f3",
              title: "First Aggregation",
              objective: "Count encounters by facility using GROUP BY.",
              challengeMode: "sql",
              relevantTables: ["encounters"],
              joinHint: "One row in encounters is one encounter.",
              starterQuery: "SELECT facility, COUNT(*) AS encounter_count\nFROM encounters\nGROUP BY facility;",
              solutionQuery: "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",
              executiveTakeaway: {
                show: true,
                metric: "Encounter volume by facility",
                why: "Facility-level volume helps leaders understand demand.",
                share: "Share which sites are carrying the most activity.",
                action: "Investigate whether staffing and capacity align to case volume."
              }
            }
          ]
        }
      ]
    }
  ];
  W.curriculum = curriculum;

  const GLOSSARY_TERMS = W.GLOSSARY_TERMS || [
    { term: "SELECT", category: "sql", definition: "Returns the columns you ask for from a table or query.", why: "SELECT starts almost every SQL statement.", example: "SELECT patient_id, insurance_type FROM patients;" },
    { term: "GROUP BY", category: "sql", definition: "Bundles rows into groups so you can summarize them.", why: "Used for department, payer, and facility KPIs.", example: "SELECT facility, COUNT(*) FROM encounters GROUP BY facility;" },
    { term: "JOIN", category: "sql", definition: "Combines related data from multiple tables.", why: "Hospital analysis often needs financial and operational context together.", example: "SELECT * FROM encounters e JOIN claims c ON e.encounter_id = c.encounter_id;" },
    { term: "Length of Stay", category: "clinical", definition: "The time a patient spends in care between admission and discharge.", why: "LOS affects capacity, flow, and cost.", example: "Longer LOS reduces bed availability." },
    { term: "Readmission", category: "clinical", definition: "A return to the hospital after a recent discharge.", why: "Readmissions can signal discharge and follow-up failures.", example: "A return within 30 days may count in a readmission KPI." },
    { term: "Denial", category: "financial", definition: "A claim or service that a payer refuses to reimburse.", why: "Denials create revenue leakage.", example: "Authorization and coding issues often drive denials." },
    { term: "Payer Mix", category: "financial", definition: "The distribution of insurance categories in the patient or claim population.", why: "Payer mix changes yield, denial exposure, and collection risk.", example: "Commercial-heavy service lines behave differently than self-pay-heavy services." },
    { term: "Grain", category: "analytics", definition: "What one row represents in a table.", why: "If you misunderstand grain, counts and rates become wrong.", example: "One row in encounters is one visit." }
  ];

  const SANDBOX_INVESTIGATIONS = W.SANDBOX_INVESTIGATIONS || [
    { id: "sql_denials_payer", type: "investigation", title: "Denial Exposure by Payer", category: "Finance", difficulty: "Intermediate", objective: "Find which payers are driving the largest denied-dollar exposure.", relevantTables: ["claims"], tags: ["denials","payer","revenue leakage"], starterQuery: `SELECT payer, claim_status, COUNT(*) AS claim_count, ROUND(SUM(billed_amount),2) AS billed_dollars
FROM claims
GROUP BY payer, claim_status
ORDER BY billed_dollars DESC;` },
    { id: "sql_denials_facility", type: "investigation", title: "Denied Dollars by Facility", category: "Finance", difficulty: "Intermediate", objective: "Compare denial exposure across facilities to target escalation.", relevantTables: ["claims","encounters"], tags: ["denials","facility","finance"], starterQuery: `SELECT e.facility, c.claim_status, COUNT(*) AS claim_count, ROUND(SUM(c.billed_amount),2) AS billed_dollars
FROM claims c
JOIN encounters e ON c.encounter_id = e.encounter_id
GROUP BY e.facility, c.claim_status
ORDER BY billed_dollars DESC;` },
    { id: "sql_payer_mix", type: "investigation", title: "Payer Mix and Self-Pay Exposure", category: "Finance", difficulty: "Beginner", objective: "Assess payer concentration and self-pay exposure by facility.", relevantTables: ["patients","encounters"], tags: ["payer mix","self pay"], starterQuery: `SELECT e.facility, p.insurance_type, COUNT(*) AS encounters
FROM encounters e
JOIN patients p ON e.patient_id = p.patient_id
GROUP BY e.facility, p.insurance_type
ORDER BY e.facility, encounters DESC;` },
    { id: "sql_revenue_per_encounter", type: "investigation", title: "Revenue Yield per Encounter", category: "Finance", difficulty: "Intermediate", objective: "Estimate gross revenue yield per encounter by facility and department.", relevantTables: ["charges","encounters"], tags: ["charges","revenue"], starterQuery: `SELECT e.facility, e.department, COUNT(DISTINCT e.encounter_id) AS encounter_count, ROUND(SUM(ch.amount),2) AS gross_charges, ROUND(SUM(ch.amount) * 1.0 / COUNT(DISTINCT e.encounter_id),2) AS gross_per_encounter
FROM encounters e
JOIN charges ch ON e.encounter_id = ch.encounter_id
GROUP BY e.facility, e.department
ORDER BY gross_per_encounter DESC;` },
    { id: "sql_los_department", type: "investigation", title: "Length of Stay by Department", category: "Operations", difficulty: "Intermediate", objective: "Identify departments creating throughput pressure through elevated LOS.", relevantTables: ["encounters"], tags: ["los","throughput","capacity"], starterQuery: `SELECT facility, department, COUNT(*) AS encounters, ROUND(AVG(length_of_stay),2) AS avg_los
FROM encounters
GROUP BY facility, department
ORDER BY avg_los DESC, encounters DESC;` },
    { id: "sql_discharge_delays", type: "investigation", title: "Discharge Delay Minutes", category: "Operations", difficulty: "Intermediate", objective: "Compare discharge order-to-departure gaps across departments.", relevantTables: ["discharges"], tags: ["discharge","delays"], starterQuery: `SELECT facility, department, COUNT(*) AS discharges, ROUND(AVG(departure_minutes - discharge_order_minutes),2) AS avg_delay_minutes, SUM(delayed_for_transport) AS transport_delays
FROM discharges
GROUP BY facility, department
ORDER BY avg_delay_minutes DESC;` },
    { id: "sql_observation_48", type: "investigation", title: "Observation Over 48 Hours", category: "Utilization", difficulty: "Intermediate", objective: "Find observation units or services with prolonged stays.", relevantTables: ["observations"], tags: ["observation","ur"], starterQuery: `SELECT facility, department, COUNT(*) AS observation_cases, SUM(CASE WHEN obs_hours > 48 THEN 1 ELSE 0 END) AS obs_over_48, ROUND(AVG(obs_hours),2) AS avg_obs_hours
FROM observations
GROUP BY facility, department
ORDER BY obs_over_48 DESC, avg_obs_hours DESC;` },
    { id: "sql_readmission_facility", type: "investigation", title: "Readmissions by Facility", category: "Quality", difficulty: "Intermediate", objective: "Compare readmission burden across facilities.", relevantTables: ["readmissions"], tags: ["readmissions","quality"], starterQuery: `SELECT facility, COUNT(*) AS index_cases, SUM(readmit_within_30_days) AS readmits, ROUND(SUM(readmit_within_30_days) * 1.0 / COUNT(*), 4) AS readmit_rate
FROM readmissions
GROUP BY facility
ORDER BY readmit_rate DESC;` },
    { id: "sql_no_show_department", type: "investigation", title: "Appointment No-Shows by Department", category: "Access", difficulty: "Beginner", objective: "Measure outpatient access leakage and unused ambulatory capacity.", relevantTables: ["appointments"], tags: ["no show","access"], starterQuery: `SELECT facility, department, status, COUNT(*) AS appointments
FROM appointments
GROUP BY facility, department, status
ORDER BY facility, department, appointments DESC;` },
    { id: "sql_provider_productivity", type: "investigation", title: "Provider Productivity with Risk Context", category: "Workforce", difficulty: "Advanced", objective: "Compare provider encounter volume while keeping patient complexity in view.", relevantTables: ["encounters","providers","patients"], tags: ["productivity","provider"], starterQuery: `SELECT pr.provider_name, pr.specialty, COUNT(*) AS encounters, ROUND(AVG(pa.risk_score),2) AS avg_risk_score, ROUND(AVG(e.length_of_stay),2) AS avg_los
FROM encounters e
JOIN providers pr ON e.provider_id = pr.provider_id
JOIN patients pa ON e.patient_id = pa.patient_id
GROUP BY pr.provider_name, pr.specialty
ORDER BY encounters DESC, avg_risk_score DESC;` }
  ];

  const EXECUTIVE_PROMPT_PACKS = W.EXECUTIVE_PROMPT_PACKS || [
    { id: "exec_denials", type: "executive", category: "Finance", difficulty: "Executive", title: "Denied Revenue Executive Brief", prompt: "Explain why denied dollars are rising, what operating failures are likely, and how leadership should prioritize corrective action.", focusAreas: ["Eligibility","Authorization","Medical necessity","Coding","Appeals"], recommendedVisuals: ["Denial dollars by payer","Top denial categories","Facility variation heatmap"], tags: ["denials","cfo"] },
    { id: "exec_readmissions", type: "executive", category: "Quality", difficulty: "Executive", title: "Readmissions Executive Brief", prompt: "Explain why readmissions matter financially and clinically, how to diagnose elevated readmissions, and what actions reduce preventable returns.", focusAreas: ["Discharge planning","Transitions of care","Follow-up access","Medication reconciliation"], recommendedVisuals: ["Readmission rate by facility","High-risk population segmentation","Discharge disposition mix"], tags: ["readmissions","quality"] },
    { id: "exec_los", type: "executive", category: "Operations", difficulty: "Executive", title: "LOS and Throughput Brief", prompt: "Explain how length of stay affects capacity, staffing strain, cost, and patient flow, including how to diagnose avoidable days.", focusAreas: ["Case management","Testing delays","Rounds discipline","Placement barriers"], recommendedVisuals: ["LOS by department","Long-stay case distribution","Avoidable-day trend"], tags: ["los","capacity"] },
    { id: "exec_discharge", type: "executive", category: "Operations", difficulty: "Executive", title: "Discharge Delay Brief", prompt: "Explain why discharge delays constrain bed capacity and how to diagnose the biggest order-to-departure bottlenecks.", focusAreas: ["Transport","Case management","Post-acute placement","Physician discharge timing"], recommendedVisuals: ["Order-to-departure minutes","Delay reasons by department"], tags: ["discharge","delays"] },
    { id: "exec_observation", type: "executive", category: "Utilization", difficulty: "Executive", title: "Observation Utilization Brief", prompt: "Explain why prolonged observation stays and Code 44 patterns matter operationally, financially, and from a compliance perspective.", focusAreas: ["Observation >48","Status conversion","Code 44","UR escalation"], recommendedVisuals: ["Observation hours distribution","Code 44 rate"], tags: ["observation","compliance"] },
    { id: "exec_ed_boarding", type: "executive", category: "Operations", difficulty: "Executive", title: "ED Boarding Brief", prompt: "Explain how ED boarding affects patient safety, throughput, staff strain, and hospital-wide flow, including how to diagnose root causes.", focusAreas: ["Capacity","Admission holds","Discharge bottlenecks","Bed placement"], recommendedVisuals: ["Boarding hours trend","ED throughput funnel"], tags: ["ed","boarding"] },
    { id: "exec_safety", type: "executive", category: "Safety", difficulty: "Executive", title: "Patient Safety Brief", prompt: "Explain how leaders should monitor preventable harm, what patterns usually precede deterioration, and how operations influence harm rates.", focusAreas: ["Falls","Medication safety","HAI/HAC","Staffing"], recommendedVisuals: ["Harm events trend","Unit variation"], tags: ["safety","quality"] },
    { id: "exec_hcahps", type: "executive", category: "Experience", difficulty: "Executive", title: "HCAHPS and Experience Brief", prompt: "Explain why patient experience affects reputation, loyalty, and reimbursement, and how to diagnose declines in experience performance.", focusAreas: ["Communication","Discharge instructions","Responsiveness","Environment"], recommendedVisuals: ["Experience drivers","Complaint categories"], tags: ["hcahps","experience"] },
    { id: "exec_workforce", type: "executive", category: "Workforce", difficulty: "Executive", title: "Workforce Stability Brief", prompt: "Explain how RN turnover, vacancy, overtime, and agency reliance affect quality, cost, and operational resilience.", focusAreas: ["Turnover","Vacancy","Agency use","Overtime"], recommendedVisuals: ["Vacancy trend","Turnover by unit"], tags: ["workforce","nursing"] },
    { id: "exec_integration", type: "executive", category: "Strategy", difficulty: "Executive", title: "Acquisition Integration Brief", prompt: "Explain how leaders should evaluate new-facility integration using standard KPI domains, ownership, and 90-day stabilization plans.", focusAreas: ["Baseline KPI alignment","Operational ownership","Denials","LOS","Experience"], recommendedVisuals: ["Red-yellow-green KPI board","Facility variance map"], tags: ["integration","stabilization"] }
  ];

  const AI_COPILOT_SYSTEM_PROMPT = "You are CAREOPS Copilot. You are a SQL mentor, hospital analytics advisor, and executive KPI strategist. Always explain why a KPI matters, how it is defined, what data to validate, and what interventions are proven. For SQL requests, explain syntax and common mistakes. For executive prompts, explain drivers, diagnostics, visualizations, and executive-ready recommendations.";

  // ---------- Normalization ----------
  function conceptLesson(spec) {
    return {
      id: spec.id, kind: "concept", type: "concept", title: spec.title, objective: spec.objective,
      sql_focus: Array.isArray(spec.sql_focus) ? spec.sql_focus : [],
      relevantTables: Array.isArray(spec.relevantTables) ? spec.relevantTables : [],
      joinHint: spec.joinHint || "No join required.",
      content: {
        summary: spec.summary || spec.content?.summary || "",
        bullets: Array.isArray(spec.bullets) ? spec.bullets : (Array.isArray(spec.content?.bullets) ? spec.content.bullets : []),
        example: spec.example || spec.content?.example || ""
      },
      executiveTakeaway: spec.executiveTakeaway || null
    };
  }
  function challengeLesson(spec) {
    return {
      id: spec.id, kind: "challenge", type: "challenge", title: spec.title, objective: spec.objective,
      relevantTables: Array.isArray(spec.relevantTables) ? spec.relevantTables : [],
      joinHint: spec.joinHint || "Think carefully about grain and the business question.",
      starterQuery: spec.starterQuery || "", solutionQuery: spec.solutionQuery || "",
      challengeCriteria: spec.challengeCriteria || "", challengeMode: spec.challengeMode || "sql",
      minLength: Number(spec.minLength || 0),
      requiredConceptGroups: Array.isArray(spec.requiredConceptGroups) ? spec.requiredConceptGroups : [],
      requiredConceptMatches: Number(spec.requiredConceptMatches || 0),
      feedbackGuide: spec.feedbackGuide || "",
      executiveTakeaway: spec.executiveTakeaway || null
    };
  }
  function normalizeCurriculum() {
    curriculum.forEach(track => {
      track.categories = Array.isArray(track.categories) ? track.categories : [];
      track.categories = track.categories.map(category => ({
        ...category,
        lessons: (Array.isArray(category.lessons) ? category.lessons : []).map(lesson =>
          (lesson.kind === "concept" || lesson.type === "concept") ? conceptLesson(lesson) : challengeLesson(lesson)
        )
      }));
    });
  }
  normalizeCurriculum();

  function normalizeSandboxPrompt(prompt) {
    const type = prompt?.type === "executive" ? "executive" : "investigation";
    const tables = Array.isArray(prompt?.tables) ? prompt.tables.slice() : Array.isArray(prompt?.relevantTables) ? prompt.relevantTables.slice() : [];
    const query = type === "executive" ? "" : (prompt?.query || prompt?.starterQuery || defaultSandboxQuery());
    return {
      id: String(prompt?.id || `prompt_${Math.random().toString(36).slice(2, 8)}`),
      type,
      title: prompt?.title || (type === "executive" ? "Executive Prompt" : "KPI Investigation"),
      category: prompt?.category || (type === "executive" ? "Executive" : "General"),
      difficulty: prompt?.difficulty || (type === "executive" ? "Executive" : "Intermediate"),
      objective: prompt?.objective || prompt?.prompt || "Investigate a hospital KPI.",
      prompt: prompt?.prompt || prompt?.objective || "",
      tables, relevantTables: tables,
      query, starterQuery: query,
      tags: Array.isArray(prompt?.tags) ? prompt.tags : [],
      focusAreas: Array.isArray(prompt?.focusAreas) ? prompt.focusAreas : [],
      recommendedVisuals: Array.isArray(prompt?.recommendedVisuals) ? prompt.recommendedVisuals : []
    };
  }

  function getSandboxPromptOptions() { return SANDBOX_INVESTIGATIONS.map(normalizeSandboxPrompt); }
  function getExecutivePromptOptions() { return EXECUTIVE_PROMPT_PACKS.map(normalizeSandboxPrompt); }

  // ---------- Storage / lesson helpers ----------
  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); } catch (e) { console.error(e); }
  }
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      appState = {
        ...appState, ...parsed,
        completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
        firstTryLessonIds: Array.isArray(parsed.firstTryLessonIds) ? parsed.firstTryLessonIds : [],
        expandedCategoryIds: Array.isArray(parsed.expandedCategoryIds) ? parsed.expandedCategoryIds : [],
        lessonStats: parsed.lessonStats && typeof parsed.lessonStats === "object" ? parsed.lessonStats : {},
        xpEvents: parsed.xpEvents && typeof parsed.xpEvents === "object" ? parsed.xpEvents : {},
        xp: Number(parsed.xp || 0),
        analystLevel: Number(parsed.analystLevel || 1),
        glossarySearch: String(parsed.glossarySearch || ""),
        glossaryCategory: String(parsed.glossaryCategory || "")
      };
      W.appState = appState;
    } catch (e) { console.error(e); }
  }
  function resetAllProgress() {
    localStorage.removeItem(STORAGE_KEY);
    appState.completedLessonIds = [];
    appState.firstTryLessonIds = [];
    appState.lessonStats = {};
    appState.xp = 0;
    appState.xpEvents = {};
    appState.analystLevel = 1;
    appState.currentView = "overview";
    renderAll();
  }
  function getTrack() { return curriculum.find(track => track.id === appState.currentTrackId) || curriculum[0] || { categories: [] }; }
  function getAllCategories() { return Array.isArray(getTrack().categories) ? getTrack().categories : []; }
  function getAllLessons() { return getAllCategories().flatMap(category => Array.isArray(category.lessons) ? category.lessons : []); }
  function getLessonById(id) { return getAllLessons().find(lesson => lesson.id === id) || null; }
  function getCurrentLesson() { return getLessonById(appState.currentLessonId); }
  function ensureCurrentLesson() {
    const c = getAllCategories()[0];
    const l = c?.lessons?.[0];
    if (!appState.currentCategoryId && c) appState.currentCategoryId = c.id;
    if (!appState.currentLessonId && l) appState.currentLessonId = l.id;
  }
  function totalLessonCount() { return getAllLessons().length; }
  function completedLessonCount() { return [...new Set(appState.completedLessonIds || [])].filter(id => Boolean(getLessonById(id))).length; }
  function isLessonCompleted(id) { return (appState.completedLessonIds || []).includes(id); }
  function xpForLessonCompletion(lesson, firstTry) { return ({ concept: 10, challenge: 25, scenario: 35 }[lesson?.type || lesson?.kind] || 20) + (firstTry ? 10 : 0); }
  function getAnalystLevelFromXP(xp) {
    if (xp >= 5000) return 10; if (xp >= 4000) return 9; if (xp >= 3200) return 8; if (xp >= 2500) return 7;
    if (xp >= 1900) return 6; if (xp >= 1400) return 5; if (xp >= 950) return 4; if (xp >= 550) return 3; if (xp >= 225) return 2;
    return 1;
  }
  function markLessonCompleted(id, firstTry = false) {
    if (!id) return;
    appState.completedLessonIds = Array.isArray(appState.completedLessonIds) ? appState.completedLessonIds : [];
    appState.firstTryLessonIds = Array.isArray(appState.firstTryLessonIds) ? appState.firstTryLessonIds : [];
    appState.xpEvents = appState.xpEvents || {};
    if (!appState.completedLessonIds.includes(id)) {
      appState.completedLessonIds.push(id);
      if (firstTry && !appState.firstTryLessonIds.includes(id)) appState.firstTryLessonIds.push(id);
      if (!appState.xpEvents[id]) {
        const lesson = getLessonById(id);
        const xp = xpForLessonCompletion(lesson, firstTry);
        appState.xp = Number(appState.xp || 0) + xp;
        appState.analystLevel = getAnalystLevelFromXP(appState.xp);
        appState.xpEvents[id] = { xp, firstTry: !!firstTry, completedAt: new Date().toISOString() };
      }
    }
    saveProgress();
  }

  // ---------- SQL engine ----------
  function generateMockData() {
    const patients = [], providers = [];
    const departments = [
      { department_id: 1, department_name: "Emergency Department", facility: "Main Campus", service_line: "Emergency" },
      { department_id: 2, department_name: "Hospital Medicine", facility: "Main Campus", service_line: "Medicine" },
      { department_id: 3, department_name: "Observation Unit", facility: "Main Campus", service_line: "Observation" },
      { department_id: 4, department_name: "Family Medicine Clinic", facility: "North Campus", service_line: "Primary Care" },
      { department_id: 5, department_name: "Cardiology", facility: "Main Campus", service_line: "Heart" }
    ];
    const providerNames = ["Adams","Bennett","Carter","Diaz","Ellis","Foster","Garcia","Hall","Irwin","Jones"];
    const specialties = ["Emergency Medicine","Hospital Medicine","Cardiology","Family Medicine","Observation"];
    const insurance = ["Medicare","Medicaid","Commercial","Self Pay"];
    const cities = ["Myrtle Beach","Georgetown","Conway",null,"Pawleys Island"];
    const firstNames = ["Ava","Liam","Noah","Emma","Mia","Elijah","Sophia","Lucas","Olivia","Mason"];
    const lastNames = ["Smith","Johnson","Williams","Brown","Jones","Miller","Davis","Wilson","Taylor","Moore"];

    for (let i = 1; i <= 10; i += 1) providers.push({ provider_id: i, provider_name: `Dr. ${providerNames[i - 1]}`, specialty: specialties[(i - 1) % specialties.length], facility: i % 2 === 0 ? "North Campus" : "Main Campus" });
    for (let i = 1; i <= 60; i += 1) patients.push({ patient_id: i, first_name: firstNames[(i - 1) % firstNames.length], last_name: lastNames[(i - 1) % lastNames.length], age: 18 + (i % 72), gender: i % 2 === 0 ? "F" : "M", insurance_type: insurance[(i - 1) % insurance.length], risk_score: (i % 10) + 1, city: cities[(i - 1) % cities.length] });

    const encounters = [], charges = [], claims = [], appointments = [], discharges = [], observations = [], readmissions = [];
    let chargeId = 1, claimId = 1, appointmentId = 1, dischargeId = 1, observationId = 1, readmissionId = 1;

    for (let i = 1; i <= 120; i += 1) {
      const patientId = (i % 60) + 1;
      const dept = departments[(i - 1) % departments.length];
      const provider = providers[(i - 1) % providers.length];
      const admitDay = (i % 28) + 1;
      const los = (i % 7) + 1;
      const admitDate = `2026-01-${String(admitDay).padStart(2, "0")}`;
      const dischargeDay = Math.min(28, admitDay + los);
      const dischargeDate = `2026-01-${String(dischargeDay).padStart(2, "0")}`;

      encounters.push({ encounter_id: i, patient_id: patientId, provider_id: provider.provider_id, department_id: dept.department_id, facility: dept.facility, department: dept.department_name, status: i % 6 === 0 ? "In Progress" : "Discharged", encounter_type: i % 4 === 0 ? "Observation" : "Inpatient", length_of_stay: los, admit_date: admitDate, discharge_date: dischargeDate });
      appointments.push({ appointment_id: appointmentId++, patient_id: patientId, provider_id: provider.provider_id, department_id: dept.department_id, facility: dept.facility, department: dept.department_name, status: i % 9 === 0 ? "No Show" : "Completed", date: admitDate });
      const amount = 500 + (i * 37);
      charges.push({ charge_id: chargeId++, patient_id: patientId, encounter_id: i, amount, payer: insurance[i % 4], charge_type: i % 2 === 0 ? "Facility" : "Professional" });
      charges.push({ charge_id: chargeId++, patient_id: patientId, encounter_id: i, amount: amount * 0.45, payer: insurance[i % 4], charge_type: i % 2 === 0 ? "Professional" : "Ancillary" });
      claims.push({ claim_id: claimId++, patient_id: patientId, encounter_id: i, payer: insurance[i % 4], claim_status: i % 7 === 0 ? "Denied" : "Paid", billed_amount: amount * 1.4 });
      discharges.push({ discharge_id: dischargeId++, encounter_id: i, patient_id: patientId, facility: dept.facility, department: dept.department_name, discharge_disposition: i % 10 === 0 ? "SNF" : "Home", discharge_order_minutes: 40 + (i % 180), departure_minutes: 60 + (i % 240), delayed_for_transport: i % 8 === 0 ? 1 : 0 });
      if (i % 4 === 0) observations.push({ observation_id: observationId++, encounter_id: i, patient_id: patientId, facility: dept.facility, department: dept.department_name, obs_hours: 6 + (i % 60), converted_to_inpatient: i % 5 === 0 ? 1 : 0, code_44_flag: i % 11 === 0 ? 1 : 0 });
    }
    for (let i = 1; i <= 30; i += 1) readmissions.push({ readmission_id: readmissionId++, index_encounter_id: i, readmit_encounter_id: i + 60, patient_id: (i % 60) + 1, facility: i % 2 === 0 ? "North Campus" : "Main Campus", readmit_within_30_days: i % 3 === 0 ? 1 : 0, days_to_readmit: 5 + (i % 25) });
    const byTable = { patients, providers, departments, encounters, appointments, charges, claims, discharges, readmissions, observations };
    schema.tables.forEach(t => { t.sampleRows = (byTable[t.name] || []).slice(0, 5); });
    return byTable;
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
    const stmt = db.prepare(`INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`);
    rows.forEach(row => stmt.run(keys.map(k => row[k])));
    stmt.free();
  }
  async function initDatabase() {
    if (sqlEngineReady) return;
    if (typeof initSqlJs !== "function") throw new Error("SQL.js is not loaded.");
    const SQLLib = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}` });
    SQL = SQLLib;
    const mockData = generateMockData();

    sqlDb = new SQL.Database();
    createTablesForDb(sqlDb);
    Object.entries(mockData).forEach(([tableName, rows]) => seedTableIntoDb(sqlDb, tableName, rows));

    sandboxDb = new SQL.Database();
    createTablesForDb(sandboxDb);
    Object.entries(mockData).forEach(([tableName, rows]) => seedTableIntoDb(sandboxDb, tableName, rows));
    sqlEngineReady = true;
  }

  function normalizeSqlResult(execResult) {
    const first = Array.isArray(execResult) && execResult.length ? execResult[0] : null;
    return { columns: Array.isArray(first?.columns) ? first.columns : [], values: Array.isArray(first?.values) ? first.values : [] };
  }
  function formatResultTable(result) {
    const columns = Array.isArray(result?.columns) ? result.columns : [];
    const values = Array.isArray(result?.values) ? result.values : [];
    if (!columns.length) return `<div class="empty-state"><strong>Query ran successfully.</strong><p>No rows were returned.</p></div>`;
    return `<div class="result-table-wrap"><table class="result-table"><thead><tr>${columns.map(c => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead><tbody>${values.map(row => `<tr>${row.map(v => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function getExecutionErrorMessage(error, query) {
    const base = String(error?.message || error || "Unknown execution error");
    if (!query) return base;
    if (/no such column/i.test(base)) return `${base}. Check whether the field exists in the current mock schema.`;
    if (/no such table/i.test(base)) return `${base}. Check the schema explorer for the available tables.`;
    return base;
  }

  // ---------- Schema explorer ----------
  function applySchemaPanelWidth() {
    const panel = document.getElementById("schema-panel");
    const shell = document.querySelector(".app-shell");
    if (!panel || !shell) return;
    const width = Math.max(260, Math.min(Number(appState.schemaPanelWidth || 320), Math.floor(window.innerWidth * 0.55)));
    panel.style.width = `${width}px`;
    shell.style.gridTemplateColumns = `${width}px 12px 1fr`;
  }
  function initSchemaResizer() {
    const resizer = document.getElementById("schema-resizer");
    const shell = document.querySelector(".app-shell");
    if (!resizer || !shell) return;
    let dragging = false;
    resizer.addEventListener("mousedown", () => { dragging = true; document.body.classList.add("resizing-schema"); document.body.style.userSelect = "none"; });
    document.addEventListener("mousemove", e => {
      if (!dragging) return;
      const shellRect = shell.getBoundingClientRect();
      appState.schemaPanelWidth = Math.max(260, Math.min(e.clientX - shellRect.left, Math.floor(window.innerWidth * 0.55)));
      applySchemaPanelWidth();
    });
    document.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("resizing-schema");
      document.body.style.userSelect = "";
      saveProgress();
    });
  }
  function renderSchema() {
    const tablesWrap = document.getElementById("schema-tables");
    const relationshipsWrap = document.getElementById("schema-relationships");
    if (tablesWrap) {
      tablesWrap.innerHTML = schema.tables.map(table => `
        <details class="schema-card">
          <summary>${escapeHtml(table.name)}</summary>
          <p>${escapeHtml(table.description)}</p>
          <div class="schema-columns">${table.notableColumns.map(col => `<span>${escapeHtml(col)}</span>`).join("")}</div>
          <div class="schema-table-actions"><button type="button" class="secondary-btn" data-open-table="${escapeHtml(table.name)}">Open Table Viewer</button></div>
        </details>
      `).join("");
    }
    if (relationshipsWrap) relationshipsWrap.innerHTML = `<ul class="relationship-list">${schema.relationships.map(r => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`;
  }
  function openTableModal(tableName) {
    const modal = document.getElementById("table-modal");
    const title = document.getElementById("table-modal-title");
    const schemaWrap = document.getElementById("table-modal-schema");
    const previewWrap = document.getElementById("table-modal-preview-content");
    const table = schema.tables.find(t => t.name === tableName);
    if (!modal || !title || !schemaWrap || !previewWrap || !table) return;
    title.textContent = table.name;
    schemaWrap.innerHTML = `<p>${escapeHtml(table.description)}</p><div class="schema-columns">${table.notableColumns.map(col => `<span>${escapeHtml(col)}</span>`).join("")}</div>`;
    const rows = Array.isArray(table.sampleRows) ? table.sampleRows : [];
    if (!rows.length) previewWrap.innerHTML = `<div class="empty-state"><p>No preview rows available.</p></div>`;
    else {
      const cols = Object.keys(rows[0]);
      previewWrap.innerHTML = formatResultTable({ columns: cols, values: rows.map(row => cols.map(c => row[c])) });
    }
    modal.classList.remove("hidden");
  }
  function closeTableModal() { document.getElementById("table-modal")?.classList.add("hidden"); }

  // ---------- Dashboard / overview / lessons ----------
  function updateDashboard() {
    const xp = Number(appState.xp || 0), level = Number(appState.analystLevel || 1);
    const currentLesson = getCurrentLesson();
    const thresholds = { 1: 225, 2: 550, 3: 950, 4: 1400, 5: 1900, 6: 2500, 7: 3200, 8: 4000, 9: 5000, 10: 5000 };
    const nextLevelXp = thresholds[level] || thresholds[10];
    const priorLevelXp = level === 1 ? 0 : (thresholds[level - 1] || 0);
    const pct = Math.max(0, Math.min(100, ((xp - priorLevelXp) / Math.max(1, nextLevelXp - priorLevelXp)) * 100));
    const xpLabel = document.querySelector("#xp-status .xp-label");
    const xpPoints = document.querySelector("#xp-status .xp-points");
    const xpSub = document.querySelector("#xp-status .xp-status-sub");
    const xpFill = document.querySelector("#xp-status .xp-bar-fill");
    if (xpLabel) xpLabel.textContent = `Analyst Level ${level}`;
    if (xpPoints) xpPoints.textContent = `${xp} XP`;
    if (xpSub) xpSub.textContent = level >= 10 ? "Max level reached" : `${Math.max(0, nextLevelXp - xp)} XP to Level ${level + 1}`;
    if (xpFill) xpFill.style.width = `${pct}%`;

    const total = totalLessonCount(), completed = completedLessonCount();
    const progressPct = total ? Math.round((completed / total) * 100) : 0;
    const progressText = document.getElementById("progress-text");
    const progressBar = document.getElementById("progress-bar");
    const overviewProgressText = document.getElementById("track-overview-progress-text");
    const overviewProgressBar = document.getElementById("track-overview-progress-bar");
    if (progressText) progressText.textContent = `${completed} / ${total} lessons completed`;
    if (progressBar) progressBar.style.width = `${progressPct}%`;
    if (overviewProgressText) overviewProgressText.textContent = `${completed} of ${total} lessons completed`;
    if (overviewProgressBar) overviewProgressBar.style.width = `${progressPct}%`;
    const lessonDisplay = document.getElementById("current-level-display");
    if (lessonDisplay) lessonDisplay.textContent = currentLesson?.title || "No lesson selected";
  }

  function renderAchievements() {
    const holder = document.getElementById("badges-container");
    if (!holder) return;
    const completed = completedLessonCount();
    const firstTryCount = (appState.firstTryLessonIds || []).length;
    const badges = [
      { label: "First Step", unlocked: completed >= 1, icon: "🚀" },
      { label: "On a Roll", unlocked: completed >= 10, icon: "🔥" },
      { label: "Precision Pro", unlocked: firstTryCount >= 10, icon: "🎯" },
      { label: "Century Club", unlocked: completed >= 100, icon: "💯" }
    ];
    holder.innerHTML = badges.map(b => `<div class="badge-pill ${b.unlocked ? "unlocked" : ""}"><span>${b.icon}</span><span>${escapeHtml(b.label)}</span></div>`).join("");
  }

  function renderOverview() {
    const track = getTrack();
    const title = document.getElementById("track-overview-title");
    const description = document.getElementById("track-overview-description");
    const learnings = document.getElementById("track-overview-learnings");
    const impact = document.getElementById("track-overview-impact");
    const categoriesWrap = document.getElementById("track-category-grid");
    if (title) title.textContent = `${track.title} Learning Track`;
    if (description) description.textContent = track.description || "Learn SQL and hospital analytics through realistic scenarios.";
    if (learnings) learnings.innerHTML = `<li>How to query hospital data with SQL</li><li>How to diagnose KPI performance issues</li><li>How to communicate analysis to leaders</li>`;
    if (impact) impact.innerHTML = `<li>Improve flow, quality, and revenue visibility</li><li>Translate metrics into operational action</li><li>Build executive communication skills alongside SQL</li>`;
    if (categoriesWrap) {
      categoriesWrap.innerHTML = getAllCategories().map(category => {
        const completed = (category.lessons || []).filter(lesson => isLessonCompleted(lesson.id)).length;
        return `<article class="track-category-card">
          <div class="track-category-summary">
            <div><h3>${escapeHtml(category.title)}</h3><p>${completed}/${(category.lessons || []).length} completed</p></div>
            <button type="button" class="secondary-btn" data-open-category="${escapeHtml(category.id)}">Open Category</button>
          </div>
          <div class="track-mini-lesson-list">${(category.lessons || []).slice(0, 4).map(lesson => `<button type="button" class="mini-lesson-pill ${isLessonCompleted(lesson.id) ? "completed" : ""}" data-open-lesson="${escapeHtml(lesson.id)}">${escapeHtml(lesson.title)}</button>`).join("")}</div>
        </article>`;
      }).join("");
    }
  }

  function renderLevelsPanel() {
    const title = document.getElementById("track-title");
    const description = document.getElementById("track-description");
    const categories = document.getElementById("levels-categories");
    const track = getTrack();
    if (title) title.textContent = track.title;
    if (description) description.textContent = "Curriculum, lesson navigation, and completion tracking.";
    if (!categories) return;
    categories.innerHTML = getAllCategories().map(category => {
      const lessons = Array.isArray(category.lessons) ? category.lessons : [];
      return `<section class="levels-category-card">
        <div class="levels-category-head"><div><h4>${escapeHtml(category.title)}</h4><p>${lessons.filter(lesson => isLessonCompleted(lesson.id)).length}/${lessons.length} completed</p></div></div>
        <div class="levels-lesson-list">${lessons.map(lesson => `<button type="button" class="levels-lesson-btn ${lesson.id === appState.currentLessonId ? "active" : ""} ${isLessonCompleted(lesson.id) ? "completed" : ""}" data-open-lesson="${escapeHtml(lesson.id)}">${escapeHtml(lesson.title)}</button>`).join("")}</div>
      </section>`;
    }).join("");
  }

  function renderExecutiveTakeaway(lesson) {
    const wrap = document.getElementById("executive-takeaway");
    const metric = document.getElementById("exec-metric");
    const why = document.getElementById("exec-why");
    const share = document.getElementById("exec-share");
    const action = document.getElementById("exec-action");
    const takeaway = lesson?.executiveTakeaway;
    if (!wrap || !metric || !why || !share || !action) return;
    if (!takeaway?.show) { wrap.classList.add("hidden"); return; }
    wrap.classList.remove("hidden");
    metric.innerHTML = `<strong>Metric:</strong> ${escapeHtml(takeaway.metric || "—")}`;
    why.innerHTML = `<strong>Why it matters:</strong> ${escapeHtml(takeaway.why || "—")}`;
    share.innerHTML = `<strong>What to share:</strong> ${escapeHtml(takeaway.share || "—")}`;
    action.innerHTML = `<strong>Recommended action:</strong> ${escapeHtml(takeaway.action || "—")}`;
  }

  function renderLesson() {
    const lesson = getCurrentLesson(), wrap = document.getElementById("lesson-workspace");
    if (!wrap || !lesson) return;
    wrap.innerHTML = lesson.type === "concept"
      ? `<div class="concept-card">
          <p class="eyebrow">Concept</p>
          <h2>${escapeHtml(lesson.title)}</h2>
          <p>${escapeHtml(lesson.objective)}</p>
          <p><strong>Join hint:</strong> ${escapeHtml(lesson.joinHint)}</p>
          <p>${escapeHtml(lesson.content.summary || "")}</p>
          <ul>${(lesson.content.bullets || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <p><strong>Example:</strong> ${escapeHtml(lesson.content.example || "")}</p>
          <div class="button-row"><button type="button" id="mark-concept-complete-btn">Mark Concept Complete</button></div>
        </div>
        <div id="executive-takeaway" class="card hidden"><h3>Executive Takeaway</h3><p id="exec-metric"><strong>Metric:</strong> —</p><p id="exec-why"><strong>Why it matters:</strong> —</p><p id="exec-share"><strong>What to share:</strong> —</p><p id="exec-action"><strong>Recommended action:</strong> —</p></div>
        <div class="button-row lesson-nav-row"><button type="button" id="prev-lesson-btn" class="secondary-btn">Previous Lesson</button><button type="button" id="next-lesson-btn">Next Lesson</button></div>`
      : `<div class="challenge-card">
          <p class="eyebrow">Challenge</p>
          <h2>${escapeHtml(lesson.title)}</h2>
          <p>${escapeHtml(lesson.objective)}</p>
          <div class="challenge-prompt">${escapeHtml(lesson.challengeCriteria || "")}</div>
          ${lesson.challengeMode === "text"
            ? `<label for="scenario-response" class="query-label">Your response</label>
               <textarea id="scenario-response" rows="8"></textarea>
               <div class="button-row"><button type="button" id="submit-scenario-btn">Submit Response</button><button type="button" id="reset-scenario-btn" class="secondary-btn">Reset Response</button></div>
               <div id="scenario-feedback" class="message-banner"></div>`
            : `<label for="query" class="query-label">Lesson SQL</label>
               <textarea id="query" rows="10" spellcheck="false">${escapeHtml(lesson.starterQuery || "")}</textarea>
               <div class="button-row"><button type="button" id="run-query-btn">Run Lesson Query</button><button type="button" id="reset-query-btn" class="secondary-btn">Reset</button></div>
               <div id="feedback" class="message-banner"></div><div id="output"></div>`}
        </div>
        <div id="executive-takeaway" class="card hidden"><h3>Executive Takeaway</h3><p id="exec-metric"><strong>Metric:</strong> —</p><p id="exec-why"><strong>Why it matters:</strong> —</p><p id="exec-share"><strong>What to share:</strong> —</p><p id="exec-action"><strong>Recommended action:</strong> —</p></div>
        <div class="button-row lesson-nav-row"><button type="button" id="prev-lesson-btn" class="secondary-btn">Previous Lesson</button><button type="button" id="next-lesson-btn">Next Lesson</button></div>`;
    renderExecutiveTakeaway(lesson);
    document.getElementById("mark-concept-complete-btn")?.addEventListener("click", () => { markLessonCompleted(lesson.id, true); nextLesson(); });
    document.getElementById("submit-scenario-btn")?.addEventListener("click", submitScenario);
    document.getElementById("reset-scenario-btn")?.addEventListener("click", resetScenario);
    document.getElementById("run-query-btn")?.addEventListener("click", runQuery);
    document.getElementById("reset-query-btn")?.addEventListener("click", resetQuery);
    document.getElementById("prev-lesson-btn")?.addEventListener("click", prevLesson);
    document.getElementById("next-lesson-btn")?.addEventListener("click", nextLesson);
  }

  function getLessonIndex() { return getAllLessons().findIndex(lesson => lesson.id === appState.currentLessonId); }
  function prevLesson() {
    const lessons = getAllLessons(), i = getLessonIndex();
    if (i <= 0) return;
    appState.currentLessonId = lessons[i - 1].id;
    appState.currentCategoryId = getAllCategories().find(c => (c.lessons || []).some(l => l.id === appState.currentLessonId))?.id || appState.currentCategoryId;
    showLessonsWorkspace(); renderAll();
  }
  function nextLesson() {
    const lessons = getAllLessons(), i = getLessonIndex();
    if (i < 0 || i >= lessons.length - 1) return;
    appState.currentLessonId = lessons[i + 1].id;
    appState.currentCategoryId = getAllCategories().find(c => (c.lessons || []).some(l => l.id === appState.currentLessonId))?.id || appState.currentCategoryId;
    showLessonsWorkspace(); renderAll();
  }
  function compareSqlResults(a, b) { return JSON.stringify(a || {}) === JSON.stringify(b || {}); }
  function runQuery() {
    const lesson = getCurrentLesson(), output = document.getElementById("output"), queryBox = document.getElementById("query");
    if (!lesson || lesson.challengeMode === "text" || !sqlDb || !queryBox) return;
    const query = queryBox.value.trim();
    if (!query) { setMessageState("feedback", "warning", "Enter a SQL statement before running the lesson."); if (output) output.innerHTML = ""; return; }
    try {
      const userResult = normalizeSqlResult(sqlDb.exec(query));
      if (output) output.innerHTML = formatResultTable(userResult);
      attempts += 1;
      if (lesson.solutionQuery) {
        const solutionResult = normalizeSqlResult(sqlDb.exec(lesson.solutionQuery));
        if (compareSqlResults(userResult, solutionResult)) {
          markLessonCompleted(lesson.id, attempts === 1);
          setMessageState("feedback", "success", "Correct. Nice work.");
          attempts = 0; renderAll(); return;
        }
        setMessageState("feedback", "warning", "The query ran, but the result does not match the expected answer yet.");
        return;
      }
      markLessonCompleted(lesson.id, attempts === 1);
      setMessageState("feedback", "success", "Query ran successfully.");
      attempts = 0; renderAll();
    } catch (error) { setMessageState("feedback", "error", getExecutionErrorMessage(error, query)); }
  }
  function submitScenario() {
    const lesson = getCurrentLesson(), box = document.getElementById("scenario-response"), response = String(box?.value || "").trim();
    if (!lesson) return;
    if (!response) { setMessageState("scenario-feedback", "warning", "Enter a response before submitting."); return; }
    const tokens = response.toLowerCase();
    const groups = Array.isArray(lesson.requiredConceptGroups) ? lesson.requiredConceptGroups : [];
    const matchedGroups = groups.filter(group => group.some(term => tokens.includes(String(term).toLowerCase()))).length;
    const passed = response.length >= Number(lesson.minLength || 0) && matchedGroups >= Number(lesson.requiredConceptMatches || 0);
    if (passed) { markLessonCompleted(lesson.id, true); setMessageState("scenario-feedback", "success", lesson.feedbackGuide || "Strong work."); renderAll(); return; }
    setMessageState("scenario-feedback", "warning", `Add more of the core concepts. Required groups matched: ${matchedGroups}/${lesson.requiredConceptMatches || groups.length}.`);
  }
  function resetScenario() { const input = document.getElementById("scenario-response"); if (input) input.value = ""; setMessageState("scenario-feedback", "", ""); }
  function resetQuery() { const lesson = getCurrentLesson(), input = document.getElementById("query"), output = document.getElementById("output"); if (input) input.value = lesson?.starterQuery || ""; if (output) output.innerHTML = ""; setMessageState("feedback", "", ""); attempts = 0; }

  // ---------- Glossary ----------
  function glossaryCategoryLabel(category) {
    const c = String(category || "").toLowerCase();
    if (c === "sql") return "SQL";
    if (c === "clinical") return "Clinical / Operations";
    if (c === "financial") return "Financial / Revenue";
    if (c === "analytics") return "Analytics / Strategy";
    return "General";
  }
  function renderGlossary() {
    const search = String(appState.glossarySearch || "").trim().toLowerCase();
    const activeCategory = String(appState.glossaryCategory || "").trim().toLowerCase();
    const filtered = GLOSSARY_TERMS.filter(item => {
      const haystack = [item.term, item.definition, item.why, item.example, glossaryCategoryLabel(item.category)].join(" ").toLowerCase();
      return (!search || haystack.includes(search)) && (!activeCategory || String(item.category || "").toLowerCase() === activeCategory);
    });
    const workspace = document.getElementById("glossary-workspace");
    if (!workspace) return;
    workspace.innerHTML = `
      <div class="workspace-hero card"><p class="eyebrow">Reference Library</p><h2>Glossary</h2><p>Search SQL, clinical, financial, and analytics concepts used across CAREOPS.</p></div>
      <div class="glossary-toolbar card">
        <div><label class="query-label" for="glossary-search-input">Search Terms</label><input id="glossary-search-input" class="text-input" type="text" value="${escapeHtml(appState.glossarySearch || "")}" placeholder="Search LOS, denial, JOIN, KPI, readmission..." /></div>
        <div><label class="query-label" for="glossary-category-select">Category</label>
          <select id="glossary-category-select" class="select-input">
            <option value="">All Terms</option>
            <option value="sql" ${activeCategory === "sql" ? "selected" : ""}>SQL</option>
            <option value="clinical" ${activeCategory === "clinical" ? "selected" : ""}>Clinical / Operations</option>
            <option value="financial" ${activeCategory === "financial" ? "selected" : ""}>Financial / Revenue</option>
            <option value="analytics" ${activeCategory === "analytics" ? "selected" : ""}>Analytics / Strategy</option>
          </select>
        </div>
      </div>
      <div class="results-meta">${filtered.length} terms shown</div>
      <div class="glossary-card-grid">${filtered.map(item => `
        <article class="glossary-card">
          <div class="glossary-card-top"><h3>${escapeHtml(item.term)}</h3><span class="tag-pill">${escapeHtml(glossaryCategoryLabel(item.category))}</span></div>
          <p><strong>Definition:</strong> ${escapeHtml(item.definition)}</p>
          <p><strong>Why it matters:</strong> ${escapeHtml(item.why)}</p>
          <p><strong>Example:</strong> ${escapeHtml(item.example)}</p>
        </article>`).join("")}
      </div>`;
    document.getElementById("glossary-search-input")?.addEventListener("input", e => { appState.glossarySearch = e.target.value || ""; saveProgress(); renderGlossary(); });
    document.getElementById("glossary-category-select")?.addEventListener("change", e => { appState.glossaryCategory = e.target.value || ""; saveProgress(); renderGlossary(); });
  }

  // ---------- Routing ----------
  function showSection(sectionId) {
    ["track-overview","lesson-workspace","sql-lab","executive-studio","ai-companion","glossary-workspace"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("hidden", id !== sectionId);
    });
  }
  function setBodyViewClass(view) {
    document.body.classList.remove("overview-mode","lesson-mode","sql-lab-mode","executive-mode","ai-mode","glossary-mode","workspace-mode");
    if (view === "overview") document.body.classList.add("overview-mode");
    else if (view === "lesson") document.body.classList.add("lesson-mode");
    else if (view === "sql-lab") document.body.classList.add("sql-lab-mode", "workspace-mode");
    else if (view === "executive-studio") document.body.classList.add("executive-mode", "workspace-mode");
    else if (view === "ai-companion") document.body.classList.add("ai-mode", "workspace-mode");
    else if (view === "glossary") document.body.classList.add("glossary-mode");
  }
  function updateNavActiveState() {
    const map = { overview: "nav-overview-btn", "sql-lab": "nav-sandbox-btn", "executive-studio": "nav-executive-btn", "ai-companion": "nav-ai-btn", glossary: "nav-glossary-btn" };
    document.querySelectorAll(".top-nav button[data-view]").forEach(button => button.classList.toggle("active", button.id === map[appState.currentView]));
  }
  function showOverview() { appState.currentView = "overview"; setBodyViewClass("overview"); showSection("track-overview"); updateNavActiveState(); saveProgress(); }
  function showLessonsWorkspace() { ensureCurrentLesson(); appState.currentView = "lesson"; setBodyViewClass("lesson"); showSection("lesson-workspace"); updateNavActiveState(); saveProgress(); }
  function showSqlLab() { appState.currentView = "sql-lab"; setBodyViewClass("sql-lab"); showSection("sql-lab"); updateNavActiveState(); saveProgress(); }
  function showExecutiveStudio() { appState.currentView = "executive-studio"; setBodyViewClass("executive-studio"); showSection("executive-studio"); updateNavActiveState(); saveProgress(); }
  function showAiCompanion() { appState.currentView = "ai-companion"; setBodyViewClass("ai-companion"); showSection("ai-companion"); updateNavActiveState(); saveProgress(); }
  function showGlossaryWorkspace() { appState.currentView = "glossary"; setBodyViewClass("glossary"); showSection("glossary-workspace"); updateNavActiveState(); saveProgress(); }

  // ---------- Prompt browser ----------
  function getPromptCollection(kind) { return kind === "executive" ? getExecutivePromptOptions() : getSandboxPromptOptions(); }
  function getPromptFilterState(kind) { return kind === "executive" ? promptUiState.executive : promptUiState.sql; }
  function getPromptCategories(kind) { return ["all", ...new Set(getPromptCollection(kind).map(p => p.category).filter(Boolean))]; }
  function filterPrompts(kind) {
    const state = getPromptFilterState(kind), search = String(state.search || "").trim().toLowerCase();
    return getPromptCollection(kind).filter(prompt => {
      const haystack = [prompt.title, prompt.objective, prompt.prompt, prompt.category, ...(prompt.tables || []), ...(prompt.tags || []), ...(prompt.focusAreas || [])].join(" ").toLowerCase();
      return (!search || haystack.includes(search)) && (!state.category || state.category === "all" || prompt.category === state.category);
    });
  }
  function getPaginatedPrompts(kind) {
    const state = getPromptFilterState(kind), filtered = filterPrompts(kind), totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    state.page = Math.max(1, Math.min(state.page, totalPages));
    const start = (state.page - 1) * state.pageSize;
    return { filtered, totalPages, pageItems: filtered.slice(start, start + state.pageSize) };
  }

  function renderPromptBrowser(kind) {
    const cfg = kind === "executive"
      ? { controlsId: "executive-prompt-controls", listId: "executive-prompt-list", paginationId: "executive-prompt-pagination", selectedId: selectedExecutivePromptId, clickHandler: applyExecutivePrompt, emptyCopy: "No executive prompts matched your filters." }
      : { controlsId: "sql-prompt-controls", listId: "prompt-list", paginationId: "sql-prompt-pagination", selectedId: selectedSandboxPromptId, clickHandler: applySandboxPrompt, emptyCopy: "No SQL prompts matched your filters." };
    const controls = document.getElementById(cfg.controlsId), list = document.getElementById(cfg.listId), pagination = document.getElementById(cfg.paginationId);
    if (!controls || !list || !pagination) return;
    const state = getPromptFilterState(kind), categories = getPromptCategories(kind), { filtered, pageItems, totalPages } = getPaginatedPrompts(kind);

    controls.innerHTML = `
      <div class="prompt-toolbar">
        <div><label class="query-label" for="${kind}-prompt-search">Search</label><input id="${kind}-prompt-search" class="text-input" type="text" value="${escapeHtml(state.search || "")}" placeholder="Search KPI, denials, throughput, readmissions..." /></div>
        <div><label class="query-label" for="${kind}-prompt-category">Category</label><select id="${kind}-prompt-category" class="select-input">${categories.map(category => `<option value="${escapeHtml(category)}" ${state.category === category ? "selected" : ""}>${escapeHtml(category === "all" ? "All Categories" : category)}</option>`).join("")}</select></div>
      </div>
      <div class="results-meta">${filtered.length} prompts found</div>`;

    list.innerHTML = !pageItems.length
      ? `<div class="empty-state"><p>${escapeHtml(cfg.emptyCopy)}</p></div>`
      : pageItems.map(prompt => `
        <button type="button" class="prompt-card ${cfg.selectedId === prompt.id ? "active" : ""}" data-prompt-kind="${kind}" data-prompt-id="${escapeHtml(prompt.id)}">
          <div class="prompt-card-topline"><span class="tag-pill emphasis">${escapeHtml(prompt.category)}</span><span class="tag-pill">${escapeHtml(prompt.difficulty)}</span></div>
          <h4>${escapeHtml(prompt.title)}</h4>
          <p>${escapeHtml(prompt.objective || prompt.prompt || "")}</p>
          <div class="prompt-chip-row">${(prompt.tables || []).slice(0, 4).map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join("")}${(prompt.tags || []).slice(0, 3).map(t => `<span class="tag-pill muted">${escapeHtml(t)}</span>`).join("")}</div>
          <div class="prompt-card-action">${kind === "executive" ? "Load into AI Companion" : "Load into SQL Lab"} →</div>
        </button>`
      ).join("");

    pagination.innerHTML = `
      <button type="button" class="secondary-btn" ${state.page <= 1 ? "disabled" : ""} data-pagination-kind="${kind}" data-pagination-direction="prev">Previous</button>
      <span class="pagination-status">Page ${state.page} of ${totalPages}</span>
      <button type="button" class="secondary-btn" ${state.page >= totalPages ? "disabled" : ""} data-pagination-kind="${kind}" data-pagination-direction="next">Next</button>`;

    document.getElementById(`${kind}-prompt-search`)?.addEventListener("input", e => { state.search = e.target.value || ""; state.page = 1; renderPromptBrowser(kind); });
    document.getElementById(`${kind}-prompt-category`)?.addEventListener("change", e => { state.category = e.target.value || "all"; state.page = 1; renderPromptBrowser(kind); });
    list.querySelectorAll("[data-prompt-id]").forEach(button => button.addEventListener("click", () => {
      const prompt = getPromptCollection(kind).find(item => item.id === button.getAttribute("data-prompt-id"));
      if (prompt) cfg.clickHandler(prompt);
    }));
    pagination.querySelectorAll("[data-pagination-direction]").forEach(button => button.addEventListener("click", () => {
      state.page += button.getAttribute("data-pagination-direction") === "next" ? 1 : -1;
      renderPromptBrowser(kind);
    }));
  }

  function renderSqlPromptContext(prompt = null) {
    const panel = document.getElementById("sql-lab-context");
    if (!panel) return;
    if (!prompt || sandboxModeState !== "guided") {
      panel.innerHTML = `<div class="context-grid"><div class="context-block"><h4>Guided mode</h4><p>Select a KPI investigation to load starter SQL and the related tables.</p></div><div class="context-block"><h4>Free play</h4><p>Use any available mock tables in the schema explorer to build your own query.</p></div></div>`;
      return;
    }
    panel.innerHTML = `
      <div class="workspace-title-row"><div><p class="eyebrow">Selected KPI Investigation</p><h3>${escapeHtml(prompt.title)}</h3></div><div class="prompt-chip-row"><span class="tag-pill emphasis">${escapeHtml(prompt.category)}</span><span class="tag-pill">${escapeHtml(prompt.difficulty)}</span></div></div>
      <p>${escapeHtml(prompt.objective)}</p>
      <div class="context-grid">
        <div class="context-block"><h4>Tables Used</h4><div class="prompt-chip-row">${(prompt.tables || []).map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join("") || "<span class='tag-pill'>None listed</span>"}</div></div>
        <div class="context-block"><h4>What to practice</h4><p>Segmentation, prioritization, and root-cause-oriented SQL analysis.</p></div>
      </div>`;
  }

  function renderExecutivePromptDetail(prompt = null) {
    const panel = document.getElementById("executive-studio-detail");
    if (!panel) return;
    if (!prompt) {
      panel.innerHTML = `<div class="empty-state sticky-panel"><h3>No executive prompt selected</h3><p>Select a prompt to load a structured brief into AI Companion without placing anything in the SQL editor.</p></div>`;
      return;
    }
    panel.innerHTML = `
      <div class="sticky-panel card-inner">
        <p class="eyebrow">Executive Prompt Context</p>
        <h3>${escapeHtml(prompt.title)}</h3>
        <p>${escapeHtml(prompt.prompt || prompt.objective || "")}</p>
        <div class="detail-section"><h4>Focus Areas</h4><div class="prompt-chip-row">${(prompt.focusAreas || []).map(item => `<span class="tag-pill">${escapeHtml(item)}</span>`).join("") || "<span class='tag-pill'>None listed</span>"}</div></div>
        <div class="detail-section"><h4>Recommended Visuals</h4><ul>${(prompt.recommendedVisuals || []).map(item => `<li>${escapeHtml(item)}</li>`).join("") || "<li>Executive KPI summary</li>"}</ul></div>
        <div class="detail-section"><h4>AI output structure</h4><ol><li>Metric definition and why it matters</li><li>Signals that performance is worsening</li><li>Likely operational drivers</li><li>How to diagnose the issue</li><li>Recommended actions and ownership</li></ol></div>
        <div class="button-row"><button type="button" id="open-exec-in-ai-btn">Open in AI Companion</button></div>
      </div>`;
    document.getElementById("open-exec-in-ai-btn")?.addEventListener("click", () => loadExecutivePromptIntoAi(prompt, { switchView: true }));
  }

  function applySandboxPrompt(prompt, silent = false) {
    const normalized = normalizeSandboxPrompt(prompt);
    selectedSandboxPromptId = normalized.id;
    sandboxModeState = "guided";
    const sqlBox = document.getElementById("sandbox-query");
    if (sqlBox) sqlBox.value = normalized.query || defaultSandboxQuery();
    renderSqlPromptContext(normalized);
    renderPromptBrowser("sql");
    if (!silent) setMessageState("sandbox-feedback", "success", `Loaded KPI investigation: ${normalized.title}`);
  }

  function buildExecutiveTemplate(prompt) {
    const p = normalizeSandboxPrompt(prompt);
    return `Help me answer this executive prompt:\n\n${p.title}\n\n${p.prompt || p.objective || ""}\n\nFocus areas:\n${(p.focusAreas || []).map(item => `- ${item}`).join("\n")}\n\nUse this structure:\n1. KPI definition\n2. Why the KPI matters\n3. What data to validate\n4. Likely operational drivers\n5. How to diagnose the issue\n6. Proven interventions\n7. Executive-ready summary`;
  }
  function loadExecutivePromptIntoAi(prompt, options = {}) {
    const aiInput = document.getElementById("ai-input");
    if (aiInput) aiInput.value = buildExecutiveTemplate(prompt);
    setMessageState("ai-feedback", "success", `Executive prompt loaded into AI Companion: ${prompt.title}`);
    if (options.switchView) showAiCompanion();
  }
  function applyExecutivePrompt(prompt, silent = false) {
    const normalized = normalizeSandboxPrompt(prompt);
    selectedExecutivePromptId = normalized.id;
    renderExecutivePromptDetail(normalized);
    renderPromptBrowser("executive");
    loadExecutivePromptIntoAi(normalized, { switchView: false });
    if (!silent) setMessageState("executive-feedback", "success", `Loaded executive prompt into AI Companion: ${normalized.title}`);
  }

  function setSandboxMode(mode) {
    sandboxModeState = mode === "guided" ? "guided" : "free";
    document.getElementById("sandbox-free-btn")?.classList.toggle("active", sandboxModeState === "free");
    document.getElementById("sandbox-guided-btn")?.classList.toggle("active", sandboxModeState === "guided");
    document.getElementById("sql-guided-library")?.classList.toggle("hidden", sandboxModeState !== "guided");
    if (sandboxModeState === "free") {
      selectedSandboxPromptId = null;
      renderPromptBrowser("sql");
      renderSqlPromptContext(null);
    } else {
      renderPromptBrowser("sql");
      renderSqlPromptContext(getSandboxPromptOptions().find(item => item.id === selectedSandboxPromptId) || null);
    }
  }

  async function resetSandbox() {
    if (!SQL) return;
    sandboxDb = new SQL.Database();
    createTablesForDb(sandboxDb);
    const mockData = generateMockData();
    Object.entries(mockData).forEach(([tableName, rows]) => seedTableIntoDb(sandboxDb, tableName, rows));
    const output = document.getElementById("sandbox-output");
    if (output) output.innerHTML = "";
    setMessageState("sandbox-feedback", "success", "SQL Lab reset to a clean mock environment.");
    const query = document.getElementById("sandbox-query");
    if (query) query.value = defaultSandboxQuery();
  }
  function runSandboxQuery() {
    const query = String(document.getElementById("sandbox-query")?.value || "").trim();
    if (!query) { setMessageState("sandbox-feedback", "warning", "Enter a SQL statement before running SQL Lab."); return; }
    if (!sandboxDb) { setMessageState("sandbox-feedback", "warning", "SQL Lab is still loading the in-browser database. Try again in a moment."); return; }
    try {
      const result = normalizeSqlResult(sandboxDb.exec(query));
      const output = document.getElementById("sandbox-output");
      if (output) output.innerHTML = formatResultTable(result);
      setMessageState("sandbox-feedback", "success", result.columns.length ? "SQL Lab query ran successfully." : "Query executed successfully. No rows returned.");
    } catch (error) { setMessageState("sandbox-feedback", "error", getExecutionErrorMessage(error, query)); }
  }

  // ---------- AI Companion ----------
  function aiContextPayload() {
    const lesson = getCurrentLesson();
    const sqlPrompt = getSandboxPromptOptions().find(item => item.id === selectedSandboxPromptId) || null;
    const executivePrompt = getExecutivePromptOptions().find(item => item.id === selectedExecutivePromptId) || null;
    return { system: AI_COPILOT_SYSTEM_PROMPT, view: appState.currentView, lesson, sqlPrompt, executivePrompt };
  }
  function setAiStatus(text, isLive = false) {
    const pill = document.getElementById("ai-status-pill");
    if (!pill) return;
    pill.textContent = text;
    pill.classList.toggle("is-ready", !!isLive);
  }
  async function requestAiCompanion(userMessage) {
    const payload = { message: userMessage, context: aiContextPayload(), thread: aiThread.slice(-8) };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_API_CONFIG.timeoutMs);
    try {
      const response = await fetch(AI_API_CONFIG.endpoint, { method: AI_API_CONFIG.method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal });
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
  function fallbackAiResponse(userMessage) {
    const prompt = String(userMessage || "").toLowerCase();
    if (prompt.includes("left join") || prompt.includes(" join")) return [
      "A LEFT JOIN keeps every row from the table on the left and adds matching rows from the table on the right.",
      "",
      "Hospital example",
      "- Start with encounters if you want every encounter",
      "- LEFT JOIN claims if some encounters may not yet have a claim",
      "",
      "Common mistake",
      "- Filtering the right-side table in WHERE can unintentionally turn a LEFT JOIN into an INNER JOIN"
    ].join("\n");
    if (prompt.includes("readmission")) return [
      "Readmissions matter because they can signal breakdowns in discharge planning, follow-up access, medication reconciliation, or care coordination.",
      "",
      "How to diagnose",
      "- segment by facility, service line, disposition, payer, and risk",
      "- compare high-risk vs standard-risk patients",
      "- review follow-up access and transitional care completion",
      "",
      "Recommended actions",
      "- strengthen discharge readiness",
      "- prioritize follow-up scheduling",
      "- expand medication reconciliation and outreach"
    ].join("\n");
    if (prompt.includes("los") || prompt.includes("length of stay")) return [
      "Length of stay matters because it affects capacity, staffing pressure, bed availability, and cost.",
      "",
      "Where to investigate",
      "- long-stay cases by department",
      "- discharge delays by unit",
      "- placement barriers",
      "- diagnostic bottlenecks",
      "- provider variation"
    ].join("\n");
    if (prompt.includes("denial")) return [
      "Denials matter because they convert clinical work into preventable revenue leakage.",
      "",
      "Diagnostic cuts",
      "- payer",
      "- facility",
      "- denial reason",
      "- authorization vs coding vs medical necessity",
      "",
      "Proven actions",
      "- tighten eligibility and authorization workflows",
      "- add denial root-cause review by payer",
      "- strengthen appeals and documentation feedback"
    ].join("\n");
    if (prompt.includes("sql") || prompt.includes("query") || prompt.includes("select ")) return [
      "I can help with the SQL itself.",
      "",
      "Tell me",
      "- the exact output you want",
      "- which table(s) you plan to use",
      "- whether you need grouping, filtering, or joins",
      "",
      "I can then write the query and explain each clause."
    ].join("\n");
    return [
      "I can help with SQL, hospital KPIs, diagnostic thinking, and executive summaries.",
      "",
      "Try asking me to",
      "- explain a SQL function",
      "- define a KPI numerator and denominator",
      "- diagnose why a metric is worsening",
      "- recommend proven hospital interventions",
      "- draft an executive-ready briefing"
    ].join("\n");
  }
  function formatAiResponseBody(text) {
    const safe = escapeHtml(String(text || ""));
    const sections = safe.split(/\n{2,}/).filter(Boolean);
    return sections.map(section => {
      const lines = section.split("\n").filter(Boolean);
      if (!lines.length) return "";
      if (lines.every(line => /^[-•]/.test(line.trim()))) return `<ul>${lines.map(line => `<li>${line.replace(/^[-•]\s*/, "")}</li>`).join("")}</ul>`;
      if (/^\d+\./.test(lines[0].trim())) return `<ol>${lines.map(line => `<li>${line.replace(/^\d+\.\s*/, "")}</li>`).join("")}</ol>`;
      return `<p>${lines.join("<br>")}</p>`;
    }).join("");
  }
  function renderAiMessages() {
    const holder = document.getElementById("ai-messages");
    if (!holder) return;
    if (!aiThread.length) {
      holder.innerHTML = `<div class="ai-message assistant"><div class="ai-message-role">AI Companion</div><div class="ai-message-body"><p><strong>Ask me anything.</strong></p><p>I can explain SQL, define hospital KPIs, suggest diagnostic cuts, and help draft executive-ready answers.</p></div></div>`;
      return;
    }
    holder.innerHTML = aiThread.map(msg => `<div class="ai-message ${msg.role}"><div class="ai-message-role">${msg.role === "user" ? "You" : "AI Companion"}</div><div class="ai-message-body">${formatAiResponseBody(msg.content)}</div></div>`).join("");
    holder.scrollTop = holder.scrollHeight;
  }
  async function sendAiMessage(prefill = null) {
    const input = document.getElementById("ai-input");
    const message = String(prefill || input?.value || "").trim();
    if (!message) return;
    aiThread.push({ role: "user", content: message });
    renderAiMessages();
    if (input) input.value = "";
    setMessageState("ai-feedback", "warning", "AI Companion is generating a response...");
    const reply = await requestAiCompanion(message);
    aiThread.push({ role: "assistant", content: reply });
    renderAiMessages();
    setMessageState("ai-feedback", "success", "AI Companion response ready.");
  }
  function clearAiChat() { aiThread = []; renderAiMessages(); setMessageState("ai-feedback", "", ""); }

  // ---------- Renders / events ----------
  function renderSqlLabWorkspace() {
    renderPromptBrowser("sql");
    renderSqlPromptContext(getSandboxPromptOptions().find(item => item.id === selectedSandboxPromptId) || null);
  }
  function renderExecutiveStudioWorkspace() {
    renderPromptBrowser("executive");
    renderExecutivePromptDetail(getExecutivePromptOptions().find(item => item.id === selectedExecutivePromptId) || null);
  }

  function bindStaticUiActions() {
    document.getElementById("nav-overview-btn")?.addEventListener("click", showOverview);
    document.getElementById("nav-sandbox-btn")?.addEventListener("click", showSqlLab);
    document.getElementById("nav-executive-btn")?.addEventListener("click", showExecutiveStudio);
    document.getElementById("nav-ai-btn")?.addEventListener("click", showAiCompanion);
    document.getElementById("nav-glossary-btn")?.addEventListener("click", showGlossaryWorkspace);
    document.getElementById("nav-reset-btn")?.addEventListener("click", resetAllProgress);

    document.getElementById("resume-track-btn")?.addEventListener("click", () => { ensureCurrentLesson(); showLessonsWorkspace(); renderAll(); });
    document.getElementById("start-track-btn")?.addEventListener("click", () => {
      const firstCategory = getAllCategories()[0], firstLesson = firstCategory?.lessons?.[0];
      if (firstCategory) appState.currentCategoryId = firstCategory.id;
      if (firstLesson) appState.currentLessonId = firstLesson.id;
      showLessonsWorkspace(); renderAll();
    });

    document.getElementById("toggle-levels-panel-btn")?.addEventListener("click", () => {
      const panel = document.getElementById("levels-panel"), button = document.getElementById("toggle-levels-panel-btn");
      if (!panel || !button) return;
      panel.classList.toggle("collapsed");
      button.textContent = panel.classList.contains("collapsed") ? "Expand" : "Collapse";
    });

    document.getElementById("sandbox-free-btn")?.addEventListener("click", () => setSandboxMode("free"));
    document.getElementById("sandbox-guided-btn")?.addEventListener("click", () => setSandboxMode("guided"));
    document.getElementById("run-sandbox-btn")?.addEventListener("click", runSandboxQuery);
    document.getElementById("reset-sandbox-btn")?.addEventListener("click", async () => { selectedSandboxPromptId = null; sandboxModeState = "free"; await resetSandbox(); renderSqlLabWorkspace(); });
    document.getElementById("sandbox-send-ai-btn")?.addEventListener("click", () => {
      const query = String(document.getElementById("sandbox-query")?.value || "").trim();
      const aiInput = document.getElementById("ai-input");
      if (aiInput) aiInput.value = query ? `Help me understand and improve this SQL:\n\n${query}` : "Help me understand and improve my SQL Lab query.";
      showAiCompanion();
    });

    document.getElementById("send-ai-btn")?.addEventListener("click", () => sendAiMessage());
    document.getElementById("clear-ai-btn")?.addEventListener("click", clearAiChat);
    document.getElementById("ai-input")?.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } });

    document.body.addEventListener("click", e => {
      const target = e.target.closest("[data-open-table], [data-open-lesson], [data-open-category]");
      if (!target) return;
      if (target.hasAttribute("data-open-table")) { openTableModal(target.getAttribute("data-open-table")); return; }
      if (target.hasAttribute("data-open-lesson")) {
        const lesson = getLessonById(target.getAttribute("data-open-lesson"));
        if (!lesson) return;
        appState.currentLessonId = lesson.id;
        appState.currentCategoryId = getAllCategories().find(c => (c.lessons || []).some(item => item.id === lesson.id))?.id || appState.currentCategoryId;
        showLessonsWorkspace(); renderAll(); return;
      }
      if (target.hasAttribute("data-open-category")) {
        const category = getAllCategories().find(item => item.id === target.getAttribute("data-open-category"));
        if (!category) return;
        appState.currentCategoryId = category.id;
        appState.currentLessonId = category.lessons?.[0]?.id || appState.currentLessonId;
        showLessonsWorkspace(); renderAll();
      }
    });

    document.getElementById("close-table-modal-btn")?.addEventListener("click", closeTableModal);
    document.getElementById("table-modal")?.addEventListener("click", e => { if (e.target.id === "table-modal") closeTableModal(); });
  }

  function renderAll() {
    applySchemaPanelWidth();
    renderSchema();
    renderAchievements();
    updateDashboard();
    renderOverview();
    renderLevelsPanel();
    renderGlossary();
    renderAiMessages();

    if (appState.currentView === "lesson") { renderLesson(); showLessonsWorkspace(); }
    else if (appState.currentView === "sql-lab") { renderSqlLabWorkspace(); showSqlLab(); }
    else if (appState.currentView === "executive-studio") { renderExecutiveStudioWorkspace(); showExecutiveStudio(); }
    else if (appState.currentView === "ai-companion") showAiCompanion();
    else if (appState.currentView === "glossary") showGlossaryWorkspace();
    else showOverview();
  }

  // ---------- Exports ----------
  W.runQuery = runQuery;
  W.resetQuery = resetQuery;
  W.submitScenario = submitScenario;
  W.resetScenario = resetScenario;
  W.nextLesson = nextLesson;
  W.prevLesson = prevLesson;
  W.runSandboxQuery = runSandboxQuery;
  W.resetSandbox = resetSandbox;
  W.sendAiMessage = sendAiMessage;
  W.showOverview = showOverview;
  W.showLessonsWorkspace = showLessonsWorkspace;
  W.showSqlLab = showSqlLab;
  W.showExecutiveStudio = showExecutiveStudio;
  W.showAiCompanion = showAiCompanion;
  W.showGlossaryWorkspace = showGlossaryWorkspace;
  W.openTableModal = openTableModal;
  W.closeTableModal = closeTableModal;
  W.resetAllProgress = resetAllProgress;
  W.getSandboxPromptOptions = getSandboxPromptOptions;
  W.normalizeSandboxPrompt = normalizeSandboxPrompt;
  W.applySandboxPrompt = applySandboxPrompt;

  document.addEventListener("DOMContentLoaded", async () => {
    loadProgress();
    ensureCurrentLesson();
    applySchemaPanelWidth();
    initSchemaResizer();
    bindStaticUiActions();
    try { await initDatabase(); } catch (error) { console.error(error); setMessageState("sandbox-feedback", "error", "SQL.js did not load correctly. SQL execution is unavailable."); }
    const sandboxQuery = document.getElementById("sandbox-query");
    if (sandboxQuery && !sandboxQuery.value.trim()) sandboxQuery.value = defaultSandboxQuery();
    renderAll();
  });
})();
