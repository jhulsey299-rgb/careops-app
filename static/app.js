const STORAGE_KEY = "careops_curriculum_v1";



let appState = {

    currentTrackId: "track_sql_foundations_hospital",

    currentCategoryId: null,

    currentLessonId: null,

    completedLessonIds: [],

    firstTryLessonIds: []

};



let attempts = 0;

let lastRunQuery = "";



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

            notableColumns: ["encounter_id", "patient_id", "provider_id", "facility", "department", "status", "encounter_type", "length_of_stay", "discharge_date"],

            sampleRows: [

                [1001, 1, 101, "Waccamaw", "Cardiology", "Active", "Inpatient", 4.2, null],

                [1002, 2, 104, "Georgetown", "ER", "Discharged", "Emergency", 1.1, "2026-04-01"],

                [1003, 3, 102, "Georgetown", "Family Medicine", "Active", "Outpatient", 0.0, null],

                [1004, 4, 103, "Waccamaw", "Neurology", "Discharged", "Inpatient", 5.7, "2026-04-02"],

                [1005, 5, 105, "Waccamaw", "Orthopedics", "Active", "Observation", 2.4, null]

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



const curriculum = [

  {

    id: "track_sql_foundations_hospital",

    title: "SQL Foundations for Hospital Data",

    description: "Learn SQL through real hospital analytics scenarios.",

    order: 1,

    categories: [

      {

        id: "getting_started",

        title: "Getting Started",

        description: "Understand the shape of hospital data and how analysts use it.",

        order: 1,

        lessons: [

          {

            id: "gs_01_hospital_data_landscape",

            type: "concept",

            title: "What Hospital Data Looks Like",

            objective: "Understand the role of patients, encounters, appointments, charges, and claims tables.",

            sql_focus: [],

            relevantTables: ["patients", "encounters", "appointments", "charges", "claims"],

            joinHint: "No join needed.",

            content: {

              summary: "Hospital analytics usually starts with a small group of core tables. Different business questions require different source tables.",

              bullets: [

                "Patients = who the patient is",

                "Encounters = visits or stays",

                "Appointments = scheduled care",

                "Charges = what was billed",

                "Claims = what was submitted to the payer"

              ],

              hospitalExample: "If leadership asks why reimbursement is down, you usually start with claims and charges, not just patients."

            },

            executiveTakeaway: null

          },

          {

            id: "gs_02_rows_columns_records",

            type: "concept",

            title: "Rows, Columns, and Records",

            objective: "Understand how rows and columns store hospital information.",

            sql_focus: [],

            relevantTables: ["patients", "encounters"],

            joinHint: "No join needed.",

            content: {

              summary: "Each row is a record, and each column describes something about that record.",

              bullets: [

                "One patient row = one patient record",

                "One encounter row = one visit/stay",

                "Columns define attributes like payer, department, provider, or billed amount"

              ],

              hospitalExample: "One encounter row might tell you facility, department, status, and encounter type for a single visit."

            },

            executiveTakeaway: null

          },

          {

            id: "gs_03_select_all_patients",

            type: "challenge",

            title: "View All Patients",

            objective: "Return all rows from the patients table.",

            sql_focus: ["SELECT", "FROM"],

            relevantTables: ["patients"],

            joinHint: "No join needed.",

            starterQuery: "SELECT * FROM patients;",

            solutionQuery: "SELECT * FROM patients;",

            hint: "Use SELECT * FROM patients.",

            executiveTakeaway: null

          },

          {

            id: "gs_04_select_all_encounters",

            type: "challenge",

            title: "View All Encounters",

            objective: "Return all rows from the encounters table.",

            sql_focus: ["SELECT", "FROM"],

            relevantTables: ["encounters"],

            joinHint: "No join needed.",

            starterQuery: "SELECT * FROM encounters;",

            solutionQuery: "SELECT * FROM encounters;",

            hint: "Use SELECT * FROM encounters.",

            executiveTakeaway: null

          },

          {

            id: "gs_05_choose_the_right_table",

            type: "scenario",

            title: "Choose the Right Table",

            objective: "Identify which table best answers a hospital business question.",

            sql_focus: [],

            relevantTables: ["claims", "charges", "encounters", "patients"],

            joinHint: "Think about the business question first.",

            content: {

              summary: "A good analyst starts by choosing the right source data, not by writing SQL immediately.",

              prompt: "Leadership asks why denied reimbursement increased. Which table is the best starting point?",

              expectedAnswer: "claims"

            },

            executiveTakeaway: {

              show: true,

              metric: "Data source selection",

              whyItMatters: "Using the wrong source table leads to the wrong answer, even if the SQL is correct.",

              whatToShare: "Start with claims for denials, then connect charges to show the dollar impact.",

              action: "Define the business question before writing the query."

            }

          }

        ]

      },



      {

        id: "selecting_columns",

        title: "Selecting Columns",

        description: "Learn to return only the fields needed for analysis.",

        order: 2,

        lessons: [

          {

            id: "sc_01_select_basics",

            type: "concept",

            title: "SELECT Basics",

            objective: "Understand how to choose useful columns instead of returning everything.",

            sql_focus: ["SELECT"],

            relevantTables: ["patients", "claims"],

            joinHint: "No join needed.",

            content: {

              summary: "Selecting fewer columns usually makes your output more readable and more useful.",

              bullets: [

                "Only return what answers the question",

                "Avoid unnecessary noise",

                "Think about the audience"

              ],

              hospitalExample: "Executives usually want 3 to 6 fields in a summary view, not 25 raw columns."

            },

            executiveTakeaway: {

              show: true,

              metric: "Focused reporting output",

              whyItMatters: "Leadership needs concise answers, not raw exports.",

              whatToShare: "Present only the fields tied directly to the question being asked.",

              action: "Reduce clutter before showing results upward."

            }

          },

          {

            id: "sc_02_patient_identity_columns",

            type: "challenge",

            title: "Return Core Patient Fields",

            objective: "Return patient_id, first_name, and last_name from patients.",

            sql_focus: ["SELECT", "FROM"],

            relevantTables: ["patients"],

            joinHint: "No join needed.",

            starterQuery: "SELECT patient_id, first_name, last_name FROM patients;",

            solutionQuery: "SELECT patient_id, first_name, last_name FROM patients;",

            hint: "Select exactly the three requested columns from patients.",

            executiveTakeaway: null

          },

          {

            id: "sc_03_claim_financial_fields",

            type: "challenge",

            title: "Return Claim Financial Fields",

            objective: "Return claim_id, payer, and billed_amount from claims.",

            sql_focus: ["SELECT", "FROM"],

            relevantTables: ["claims"],

            joinHint: "No join needed.",

            starterQuery: "SELECT claim_id, payer, billed_amount FROM claims;",

            solutionQuery: "SELECT claim_id, payer, billed_amount FROM claims;",

            hint: "Select claim_id, payer, and billed_amount from claims.",

            executiveTakeaway: {

              show: true,

              metric: "Claim financial summary fields",

              whyItMatters: "Focused financial extracts are easier to interpret and act on.",

              whatToShare: "Use only claim ID, payer, amount, and status when presenting denial or payer performance issues.",

              action: "Build clean, targeted outputs for finance and operations leaders."

            }

          }

        ]

      },



      {

        id: "filtering_rows",

        title: "Filtering Rows",

        description: "Use WHERE to isolate meaningful cohorts and transactions.",

        order: 3,

        lessons: [

          {

            id: "fr_01_where_basics",

            type: "concept",

            title: "Filtering with WHERE",

            objective: "Use WHERE to isolate the rows that matter.",

            sql_focus: ["WHERE"],

            relevantTables: ["patients", "claims", "encounters"],

            joinHint: "No join needed.",

            content: {

              summary: "Filtering turns broad tables into focused answers.",

              bullets: [

                "Filter by payer",

                "Filter by department",

                "Filter by status",

                "Filter by amount"

              ],

              hospitalExample: "Most business questions are not about all claims or all encounters. They are about a specific group."

            },

            executiveTakeaway: null

          },

          {

            id: "fr_02_medicare_patients",

            type: "challenge",

            title: "Medicare Patients",

            objective: "Return Medicare patients with patient_id, first_name, and last_name.",

            sql_focus: ["WHERE"],

            relevantTables: ["patients"],

            joinHint: "No join needed.",

            starterQuery: "SELECT patient_id, first_name, last_name FROM patients WHERE insurance_type = 'Medicare';",

            solutionQuery: "SELECT patient_id, first_name, last_name FROM patients WHERE insurance_type = 'Medicare';",

            hint: "Filter patients where insurance_type equals Medicare.",

            executiveTakeaway: null

          },

          {

            id: "fr_03_denied_claims",

            type: "challenge",

            title: "Denied Claims",

            objective: "Return denied claims with claim_id, payer, and billed_amount.",

            sql_focus: ["WHERE"],

            relevantTables: ["claims"],

            joinHint: "No join needed.",

            starterQuery: "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied';",

            solutionQuery: "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied';",

            hint: "Filter claims to only those with claim_status = 'Denied'.",

            executiveTakeaway: {

              show: true,

              metric: "Denied claims inventory",

              whyItMatters: "Denied claims represent reimbursement risk and rework burden.",

              whatToShare: "Summarize denied claim count and billed dollars at risk.",

              action: "Escalate payer-specific denial spikes and high-dollar denial items."

            }

          },

          {

            id: "fr_04_cardiology_encounters",

            type: "challenge",

            title: "Cardiology Encounters",

            objective: "Return encounter_id, patient_id, and department for Cardiology encounters.",

            sql_focus: ["WHERE"],

            relevantTables: ["encounters"],

            joinHint: "No join needed.",

            starterQuery: "SELECT encounter_id, patient_id, department FROM encounters WHERE department = 'Cardiology';",

            solutionQuery: "SELECT encounter_id, patient_id, department FROM encounters WHERE department = 'Cardiology';",

            hint: "Filter encounters to department = 'Cardiology'.",

            executiveTakeaway: null

          }

        ]

      },



      {

        id: "sorting_results",

        title: "Sorting Results",

        description: "Use ORDER BY to rank, prioritize, and structure output.",

        order: 4,

        lessons: [

          {

            id: "sr_01_order_by_basics",

            type: "concept",

            title: "Ordering Results",

            objective: "Sort data in ways that make reporting easier to consume.",

            sql_focus: ["ORDER BY"],

            relevantTables: ["charges", "patients", "encounters"],

            joinHint: "No join needed.",

            content: {

              summary: "Sorting helps surface the most important records first.",

              bullets: [

                "Use descending for high-dollar and high-volume outputs",

                "Use ascending for names and dates",

                "Use multiple sort columns when needed"

              ],

              hospitalExample: "Finance leaders often want the biggest items first, while patient lists may be sorted alphabetically."

            },

            executiveTakeaway: {

              show: true,

              metric: "Priority ranking",

              whyItMatters: "Sorting identifies top risks and top opportunities quickly.",

              whatToShare: "Use top-ranked items in leadership views instead of unsorted detail.",

              action: "Lead with highest-impact items first."

            }

          },

          {

            id: "sr_02_sort_charges_desc",

            type: "challenge",

            title: "Sort Charges Highest to Lowest",

            objective: "Return charge_id, payer, and amount ordered by amount descending.",

            sql_focus: ["ORDER BY"],

            relevantTables: ["charges"],

            joinHint: "No join needed.",

            starterQuery: "SELECT charge_id, payer, amount FROM charges ORDER BY amount DESC;",

            solutionQuery: "SELECT charge_id, payer, amount FROM charges ORDER BY amount DESC;",

            hint: "Use ORDER BY amount DESC.",

            executiveTakeaway: {

              show: true,

              metric: "High-dollar charge review",

              whyItMatters: "Large-dollar opportunities and risks should be prioritized before low-dollar items.",

              whatToShare: "Show the largest financial items first when discussing review priorities.",

              action: "Focus analyst time on the highest-impact records."

            }

          }

        ]

      },



      {

        id: "strings",

        title: "Strings",

        description: "Manipulate text values using hospital data.",

        order: 5,

        lessons: [

          {

            id: "st_01_string_concepts",

            type: "concept",

            title: "Working with Text",

            objective: "Use string logic to clean and present data.",

            sql_focus: ["concatenation", "UPPER", "LOWER", "TRIM"],

            relevantTables: ["patients", "claims"],

            joinHint: "No join needed.",

            content: {

              summary: "Text manipulation helps create cleaner outputs and more readable reporting.",

              bullets: [

                "Build display names",

                "Standardize payer text",

                "Clean leading or trailing spaces"

              ],

              hospitalExample: "Reports often need one clean patient or provider display field instead of several separate pieces."

            },

            executiveTakeaway: null

          },

          {

            id: "st_02_build_patient_full_name",

            type: "challenge",

            title: "Build Patient Full Name",

            objective: "Return a full_name field using first_name and last_name.",

            sql_focus: ["string concatenation"],

            relevantTables: ["patients"],

            joinHint: "No join needed.",

            starterQuery: "SELECT first_name || ' ' || last_name AS full_name FROM patients;",

            solutionQuery: "SELECT first_name || ' ' || last_name AS full_name FROM patients;",

            hint: "Concatenate first_name and last_name with a space between them.",

            executiveTakeaway: null

          },

          {

            id: "st_03_standardize_payer_labels",

            type: "challenge",

            title: "Standardize Payer Labels",

            objective: "Return payer names in uppercase.",

            sql_focus: ["UPPER"],

            relevantTables: ["claims"],

            joinHint: "No join needed.",

            starterQuery: "SELECT UPPER(payer) AS payer_standardized FROM claims;",

            solutionQuery: "SELECT UPPER(payer) AS payer_standardized FROM claims;",

            hint: "Use UPPER(payer).",

            executiveTakeaway: null

          }

        ]

      },



      {

        id: "numbers_and_calculations",

        title: "Numbers and Calculations",

        description: "Turn data into useful rates, averages, and percentages.",

        order: 6,

        lessons: [

          {

            id: "nm_01_metric_thinking",

            type: "concept",

            title: "Raw Data vs Metrics",

            objective: "Understand why executives prefer metrics over raw lists.",

            sql_focus: ["ROUND", "AVG", "CASE", "COUNT"],

            relevantTables: ["claims", "encounters"],

            joinHint: "No join needed.",

            content: {

              summary: "Analysts turn raw rows into rates and metrics that leaders can act on.",

              bullets: [

                "Percent denied",

                "Average LOS",

                "Average charge",

                "Remaining balance"

              ],

              hospitalExample: "A denial rate tells a clearer story than a raw denied claim list."

            },

            executiveTakeaway: {

              show: true,

              metric: "Executive-friendly metric framing",

              whyItMatters: "Leaders need directionally meaningful summaries, not raw detail.",

              whatToShare: "Translate rows into rates, averages, and dollar impact.",

              action: "Always ask what KPI or ratio best answers the business question."

            }

          },

          {

            id: "nm_02_denial_rate",

            type: "challenge",

            title: "Calculate Denial Rate",

            objective: "Return the percentage of claims that are denied.",

            sql_focus: ["CASE", "COUNT", "ROUND"],

            relevantTables: ["claims"],

            joinHint: "No join needed.",

            starterQuery: "SELECT ROUND(100.0 * SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*), 2) AS denial_rate FROM claims;",

            solutionQuery: "SELECT ROUND(100.0 * SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*), 2) AS denial_rate FROM claims;",

            hint: "Count denied claims inside a CASE expression, divide by total claims, and round.",

            executiveTakeaway: {

              show: true,

              metric: "Denial rate",

              whyItMatters: "Rising denial rate can indicate revenue leakage and workflow inefficiency.",

              whatToShare: "Share denial rate with trend direction and payer breakdown when possible.",

              action: "If denial rate worsens, review coding, authorization, or payer-specific workflows."

            }

          },

          {

            id: "nm_03_average_los",

            type: "challenge",

            title: "Calculate Average LOS",

            objective: "Return average length_of_stay from encounters.",

            sql_focus: ["AVG", "ROUND"],

            relevantTables: ["encounters"],

            joinHint: "No join needed.",

            starterQuery: "SELECT ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters;",

            solutionQuery: "SELECT ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters;",

            hint: "Use AVG(length_of_stay) and ROUND the result.",

            executiveTakeaway: {

              show: true,

              metric: "Average LOS",

              whyItMatters: "Length of stay affects throughput, bed availability, labor utilization, and cost.",

              whatToShare: "Show average LOS with department or facility context when it affects operations.",

              action: "Use this metric to identify discharge or throughput bottlenecks."

            }

          }

        ]

      },



      {

        id: "null_handling",

        title: "NULL Handling",

        description: "Manage missing values safely.",

        order: 7,

        lessons: [

          {

            id: "nh_01_null_concepts",

            type: "concept",

            title: "Understanding NULL",

            objective: "Understand how missing values can distort analysis.",

            sql_focus: ["IS NULL", "IS NOT NULL", "COALESCE"],

            relevantTables: ["encounters", "claims"],

            joinHint: "No join needed.",

            content: {

              summary: "NULL means data is missing or unavailable and can affect metrics if ignored.",

              bullets: [

                "NULL is not zero",

                "NULL is not empty text",

                "Missing data can break summaries"

              ],

              hospitalExample: "Missing discharge_date can make LOS incomplete or misleading."

            },

            executiveTakeaway: null

          },

          {

            id: "nh_02_missing_discharge_date",

            type: "challenge",

            title: "Find Missing Discharge Dates",

            objective: "Return encounter_id and patient_id where discharge_date is null.",

            sql_focus: ["IS NULL"],

            relevantTables: ["encounters"],

            joinHint: "No join needed.",

            starterQuery: "SELECT encounter_id, patient_id FROM encounters WHERE discharge_date IS NULL;",

            solutionQuery: "SELECT encounter_id, patient_id FROM encounters WHERE discharge_date IS NULL;",

            hint: "Use WHERE discharge_date IS NULL.",

            executiveTakeaway: {

              show: true,

              metric: "Documentation/data quality exceptions",

              whyItMatters: "Missing fields can undermine the credibility of reported KPIs.",

              whatToShare: "Only elevate data quality gaps when they materially affect executive metrics.",

              action: "Partner with operational teams to improve source documentation."

            }

          }

        ]

      },



      {

        id: "boolean_logic",

        title: "Boolean Logic",

        description: "Use AND, OR, and NOT to define high-value business cohorts.",

        order: 8,

        lessons: [

          {

            id: "bl_01_and_or_not",

            type: "concept",

            title: "Combining Conditions",

            objective: "Use Boolean logic to define more meaningful patient and claim groups.",

            sql_focus: ["AND", "OR", "NOT"],

            relevantTables: ["claims", "encounters"],

            joinHint: "No join needed.",

            content: {

              summary: "Boolean logic helps analysts define the exact populations that matter to the business question.",

              bullets: [

                "AND narrows",

                "OR broadens",

                "NOT excludes"

              ],

              hospitalExample: "High-dollar denied claims are often more actionable than all denied claims."

            },

            executiveTakeaway: null

          },

          {

            id: "bl_02_high_priority_denials",

            type: "challenge",

            title: "Find High-Priority Denials",

            objective: "Return denied claims over 2000 billed dollars.",

            sql_focus: ["AND"],

            relevantTables: ["claims"],

            joinHint: "No join needed.",

            starterQuery: "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied' AND billed_amount > 2000;",

            solutionQuery: "SELECT claim_id, payer, billed_amount FROM claims WHERE claim_status = 'Denied' AND billed_amount > 2000;",

            hint: "Filter denied claims and add the billed_amount threshold.",

            executiveTakeaway: {

              show: true,

              metric: "High-priority denied claims",

              whyItMatters: "Not all denials carry the same financial importance.",

              whatToShare: "Summarize high-dollar denied claims separately from overall denial volume.",

              action: "Prioritize analyst review and appeal effort on the largest risks first."

            }

          }

        ]

      },



      {

        id: "case_statements",

        title: "CASE Statements",

        description: "Translate raw values into business-friendly categories.",

        order: 9,

        lessons: [

          {

            id: "cs_01_case_for_reporting",

            type: "concept",

            title: "Categorizing Data with CASE",

            objective: "Use CASE to turn raw values into meaningful business buckets.",

            sql_focus: ["CASE"],

            relevantTables: ["charges", "encounters"],

            joinHint: "No join needed.",

            content: {

              summary: "CASE statements make results easier to interpret by converting raw values into categories.",

              bullets: [

                "High / medium / low",

                "Short / medium / long",

                "Collectible / non-collectible"

              ],

              hospitalExample: "Executives usually understand categories faster than raw transaction-level detail."

            },

            executiveTakeaway: {

              show: true,

              metric: "Categorized business summaries",

              whyItMatters: "Leadership prefers grouped insights over long lists of raw numbers.",

              whatToShare: "Use categories to simplify complex patterns into digestible summaries.",

              action: "Turn raw detail into interpretable business segments."

            }

          },

          {

            id: "cs_02_charge_buckets",

            type: "challenge",

            title: "Bucket Charges by Size",

            objective: "Return charge_id and a charge_bucket category.",

            sql_focus: ["CASE"],

            relevantTables: ["charges"],

            joinHint: "No join needed.",

            starterQuery: "SELECT charge_id, CASE WHEN amount >= 3000 THEN 'High' WHEN amount >= 1000 THEN 'Medium' ELSE 'Low' END AS charge_bucket FROM charges;",

            solutionQuery: "SELECT charge_id, CASE WHEN amount >= 3000 THEN 'High' WHEN amount >= 1000 THEN 'Medium' ELSE 'Low' END AS charge_bucket FROM charges;",

            hint: "Use CASE with thresholds for High, Medium, and Low.",

            executiveTakeaway: {

              show: true,

              metric: "Charge size mix",

              whyItMatters: "Buckets make financial concentration easier to discuss than raw line items.",

              whatToShare: "Summarize the mix of high, medium, and low-dollar activity.",

              action: "Use buckets to guide workload prioritization and escalation."

            }

          }

        ]

      },



      {

        id: "aggregations",

        title: "Aggregations",

        description: "Use COUNT, SUM, and AVG to summarize operations and finance.",

        order: 10,

        lessons: [

          {

            id: "ag_01_aggregation_concepts",

            type: "concept",

            title: "Summarizing Data with COUNT, SUM, and AVG",

            objective: "Understand the building blocks of KPIs and dashboards.",

            sql_focus: ["COUNT", "SUM", "AVG"],

            relevantTables: ["encounters", "claims", "charges"],

            joinHint: "No join needed.",

            content: {

              summary: "Aggregation functions are the core of most operational and financial reporting.",

              bullets: [

                "COUNT = volume",

                "SUM = dollars",

                "AVG = typical burden or rate"

              ],

              hospitalExample: "Executive dashboards often use encounter counts, total charges, and average LOS."

            },

            executiveTakeaway: {

              show: true,

              metric: "KPI building blocks",

              whyItMatters: "Most executive summaries are built from counts, sums, and averages.",

              whatToShare: "Translate row-level data into simple, interpretable metrics.",

              action: "Choose the summary statistic that best answers the business question."

            }

          },

          {

            id: "ag_02_total_charges",

            type: "challenge",

            title: "Calculate Total Charges",

            objective: "Return total charge dollars.",

            sql_focus: ["SUM"],

            relevantTables: ["charges"],

            joinHint: "No join needed.",

            starterQuery: "SELECT SUM(amount) AS total_amount FROM charges;",

            solutionQuery: "SELECT SUM(amount) AS total_amount FROM charges;",

            hint: "Use SUM(amount).",

            executiveTakeaway: {

              show: true,

              metric: "Total charges",

              whyItMatters: "Charge totals help quantify activity and financial scale.",

              whatToShare: "Use total charges as context, ideally alongside payer mix or trend.",

              action: "Do not share totals in isolation without interpretation."

            }

          },

          {

            id: "ag_03_total_encounters",

            type: "challenge",

            title: "Count Total Encounters",

            objective: "Return total encounter volume.",

            sql_focus: ["COUNT"],

            relevantTables: ["encounters"],

            joinHint: "No join needed.",

            starterQuery: "SELECT COUNT(*) AS total_encounters FROM encounters;",

            solutionQuery: "SELECT COUNT(*) AS total_encounters FROM encounters;",

            hint: "Use COUNT(*) from encounters.",

            executiveTakeaway: {

              show: true,

              metric: "Encounter volume",

              whyItMatters: "Volume informs staffing, access, and capacity planning.",

              whatToShare: "Use volume alongside facility, service line, or time context.",

              action: "Trend volume over time or compare across operating units."

            }

          }

        ]

      },



      {

        id: "group_by",

        title: "GROUP BY",

        description: "Create grouped summaries by facility, payer, department, and provider.",

        order: 11,

        lessons: [

          {

            id: "gb_01_group_by_concepts",

            type: "concept",

            title: "From Rows to Summaries",

            objective: "Understand how GROUP BY creates reporting categories.",

            sql_focus: ["GROUP BY"],

            relevantTables: ["encounters", "claims", "charges"],

            joinHint: "No join needed.",

            content: {

              summary: "GROUP BY turns row-level tables into grouped performance summaries.",

              bullets: [

                "By facility",

                "By payer",

                "By department",

                "By provider"

              ],

              hospitalExample: "Leadership often wants comparisons across facilities, payers, or departments rather than a raw list."

            },

            executiveTakeaway: {

              show: true,

              metric: "Grouped performance view",

              whyItMatters: "Leaders compare organizations across units, not across raw rows.",

              whatToShare: "Use grouped summaries to show who is driving volume, dollars, or risk.",

              action: "Organize results by the operating unit that leadership can act on."

            }

          },

          {

            id: "gb_02_encounters_by_facility",

            type: "challenge",

            title: "Count Encounters by Facility",

            objective: "Return facility and encounter_count.",

            sql_focus: ["GROUP BY", "COUNT"],

            relevantTables: ["encounters"],

            joinHint: "No join needed.",

            starterQuery: "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",

            solutionQuery: "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",

            hint: "Group by facility and count the rows.",

            executiveTakeaway: {

              show: true,

              metric: "Encounter volume by facility",

              whyItMatters: "Facility-level demand affects staffing, access, and strategic investment.",

              whatToShare: "Show which facilities are carrying more volume and how that is changing.",

              action: "Use facility comparisons to guide staffing and capacity planning."

            }

          },

          {

            id: "gb_03_denied_claims_by_payer",

            type: "challenge",

            title: "Denied Claims by Payer",

            objective: "Return payer and denied claim count.",

            sql_focus: ["WHERE", "GROUP BY", "COUNT"],

            relevantTables: ["claims"],

            joinHint: "No join needed.",

            starterQuery: "SELECT payer, COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",

            solutionQuery: "SELECT payer, COUNT(*) AS denied_claim_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",

            hint: "Filter denied claims, then group by payer.",

            executiveTakeaway: {

              show: true,

              metric: "Denied claims by payer",

              whyItMatters: "Payer concentration can reveal where the organization is losing time or money.",

              whatToShare: "Highlight which payer is driving denial count and, later, denial dollars.",

              action: "Target revenue-cycle improvement at the biggest payer problem."

            }

          }

        ]

      },



      {

        id: "having",

        title: "HAVING",

        description: "Find outliers after aggregation.",

        order: 12,

        lessons: [

          {

            id: "hv_01_having_concepts",

            type: "concept",

            title: "Filtering Groups with HAVING",

            objective: "Use HAVING to find exceptions after grouping.",

            sql_focus: ["HAVING"],

            relevantTables: ["claims", "encounters"],

            joinHint: "No join needed.",

            content: {

              summary: "HAVING lets you keep only the grouped results that exceed a threshold.",

              bullets: [

                "WHERE filters rows before grouping",

                "HAVING filters groups after grouping"

              ],

              hospitalExample: "Use HAVING to isolate payers, facilities, or departments that are true outliers."

            },

            executiveTakeaway: {

              show: true,

              metric: "Outlier detection",

              whyItMatters: "Leadership usually needs attention focused on the biggest exceptions, not every category.",

              whatToShare: "Present only groups materially above threshold when trying to drive action.",

              action: "Use HAVING to reduce noise and spotlight actionable outliers."

            }

          },

          {

            id: "hv_02_payers_with_multiple_denials",

            type: "challenge",

            title: "Find Payers with Multiple Denials",

            objective: "Return payers with more than one denied claim.",

            sql_focus: ["WHERE", "GROUP BY", "HAVING"],

            relevantTables: ["claims"],

            joinHint: "No join needed.",

            starterQuery: "SELECT payer, COUNT(*) AS denied_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer HAVING COUNT(*) > 1;",

            solutionQuery: "SELECT payer, COUNT(*) AS denied_count FROM claims WHERE claim_status = 'Denied' GROUP BY payer HAVING COUNT(*) > 1;",

            hint: "Use HAVING COUNT(*) > 1 after grouping denied claims by payer.",

            executiveTakeaway: {

              show: true,

              metric: "Outlier payer groups",

              whyItMatters: "Filtering to material outliers keeps executive attention on the highest-value issues.",

              whatToShare: "Only present payers above a meaningful threshold when escalating denial burden.",

              action: "Set thresholds that align with leadership priorities."

            }

          }

        ]

      },



      {

        id: "inner_joins",

        title: "Inner Joins",

        description: "Combine multiple tables to answer realistic hospital questions.",

        order: 13,

        lessons: [

          {

            id: "ij_01_join_concepts",

            type: "concept",

            title: "Why Joins Matter",

            objective: "Understand why most real hospital analysis requires multiple tables.",

            sql_focus: ["JOIN"],

            relevantTables: ["patients", "encounters", "claims", "charges"],

            joinHint: "Relationships matter: patient_id and encounter_id are common join paths.",

            content: {

              summary: "Real insight often comes from combining two or more related tables.",

              bullets: [

                "Patients + encounters = who had which visit",

                "Claims + patients = payer and patient context",

                "Charges + encounters = dollars by department or facility"

              ],

              hospitalExample: "To explain denied dollars by patient or department, you must join data across tables."

            },

            executiveTakeaway: {

              show: true,

              metric: "Integrated business story",

              whyItMatters: "Executives need context, not just isolated facts.",

              whatToShare: "Joined data allows you to explain not only what happened, but where and to whom.",

              action: "Use joins when a single-table answer would be incomplete."

            }

          },

          {

            id: "ij_02_encounters_with_patients",

            type: "challenge",

            title: "Join Encounters to Patients",

            objective: "Return encounter_id, first_name, and last_name.",

            sql_focus: ["JOIN"],

            relevantTables: ["encounters", "patients"],

            joinHint: "encounters.patient_id = patients.patient_id",

            starterQuery: "SELECT e.encounter_id, p.first_name, p.last_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",

            solutionQuery: "SELECT e.encounter_id, p.first_name, p.last_name FROM encounters e JOIN patients p ON e.patient_id = p.patient_id;",

            hint: "Join encounters to patients on patient_id.",

            executiveTakeaway: null

          },

          {

            id: "ij_03_claims_with_patients",

            type: "challenge",

            title: "Join Claims to Patients",

            objective: "Return claim_id, first_name, and insurance_type.",

            sql_focus: ["JOIN"],

            relevantTables: ["claims", "patients"],

            joinHint: "claims.patient_id = patients.patient_id",

            starterQuery: "SELECT c.claim_id, p.first_name, p.insurance_type FROM claims c JOIN patients p ON c.patient_id = p.patient_id;",

            solutionQuery: "SELECT c.claim_id, p.first_name, p.insurance_type FROM claims c JOIN patients p ON c.patient_id = p.patient_id;",

            hint: "Join claims to patients using patient_id.",

            executiveTakeaway: {

              show: true,

              metric: "Claims with patient context",

              whyItMatters: "Joined data creates a fuller picture than isolated financial rows.",

              whatToShare: "Use joined views when explaining who is impacted by a financial trend.",

              action: "Present integrated summaries instead of disconnected extracts."

            }

          }

        ]

      }

    ]

  }

];



// ---------- helpers ----------

function getTrack() {

    return curriculum.find(t => t.id === appState.currentTrackId) || curriculum[0];

}



function getAllLessons() {

    const track = getTrack();

    const lessons = [];

    track.categories.forEach((category) => {

        category.lessons.forEach((lesson) => {

            lessons.push({

                trackId: track.id,

                categoryId: category.id,

                categoryTitle: category.title,

                categoryDescription: category.description,

                lesson

            });

        });

    });

    return lessons;

}



function getAllCategories() {

    return getTrack().categories;

}



function getCategoryById(categoryId) {

    return getAllCategories().find(c => c.id === categoryId) || null;

}



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



function normalizeSql(sql) {

    return String(sql || "")

        .trim()

        .replace(/;$/, "")

        .replace(/\s+/g, " ")

        .toLowerCase();

}



function saveProgress() {

    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));

}



function loadProgress() {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;



    try {

        const parsed = JSON.parse(saved);

        appState.currentTrackId = parsed.currentTrackId || appState.currentTrackId;

        appState.currentCategoryId = parsed.currentCategoryId || appState.currentCategoryId;

        appState.currentLessonId = parsed.currentLessonId || appState.currentLessonId;

        appState.completedLessonIds = Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [];

        appState.firstTryLessonIds = Array.isArray(parsed.firstTryLessonIds) ? parsed.firstTryLessonIds : [];

    } catch (error) {

        console.error("Failed to parse saved progress", error);

    }

}



function isLessonCompleted(lessonId) {

    return appState.completedLessonIds.includes(lessonId);

}



function isLessonFirstTry(lessonId) {

    return appState.firstTryLessonIds.includes(lessonId);

}



function markLessonComplete(lessonId) {

    if (!isLessonCompleted(lessonId)) {

        appState.completedLessonIds.push(lessonId);

    }

}



function markLessonFirstTry(lessonId) {

    if (!isLessonFirstTry(lessonId)) {

        appState.firstTryLessonIds.push(lessonId);

    }

}



function totalLessonCount() {

    return getAllLessons().length;

}



function completedLessonCount() {

    return appState.completedLessonIds.length;

}



function achievements() {

    const completed = completedLessonCount();

    const firstTry = appState.firstTryLessonIds.length;

    return [

        { label: "First Lesson", earned: completed >= 1 },

        { label: "3 Lessons Completed", earned: completed >= 3 },

        { label: "5 Lessons Completed", earned: completed >= 5 },

        { label: "10 Lessons Completed", earned: completed >= 10 },

        { label: "15 Lessons Completed", earned: completed >= 15 },

        { label: "20 Lessons Completed", earned: completed >= 20 },

        { label: "30 Lessons Completed", earned: completed >= 30 },

        { label: "3 First-Try Wins", earned: firstTry >= 3 }

    ];

}



function lessonTypeClass(type) {

    return `lesson-type-${type}`;

}



function difficultyClass(label) {

    const val = String(label || "Easy").toLowerCase();

    if (val.includes("intermediate")) return "difficulty-intermediate";

    if (val.includes("hard")) return "difficulty-hard";

    if (val.includes("advanced")) return "difficulty-advanced";

    return "difficulty-easy";

}



function sqlFocusText(sqlFocus) {

    if (!sqlFocus || !sqlFocus.length) return "—";

    return sqlFocus.join(", ");

}



function categoryProgressText(category) {

    const total = category.lessons.length;

    const done = category.lessons.filter(l => isLessonCompleted(l.id)).length;

    return `${done}/${total} completed`;

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

            html += `<td>${cell === null ? "NULL" : cell}</td>`;

        });

        html += "</tr>";

    });



    html += "</table>";

    return html;

}



// ---------- schema ----------

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



function highlightRelevantSchema(tables) {

    document.querySelectorAll(".schema-card").forEach((card) => {

        card.open = false;

    });



    (tables || []).forEach((tableName) => {

        const card = document.getElementById(`schema-${tableName}`);

        if (card) card.open = true;

    });

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



// ---------- dashboard ----------

function updateDashboard() {

    const progressText = document.getElementById("progress-text");

    const progressBar = document.getElementById("progress-bar");

    const currentLevelDisplay = document.getElementById("current-level-display");

    const badgeCount = document.getElementById("badge-count");



    const total = totalLessonCount();

    const completed = completedLessonCount();

    const current = getCurrentLesson();



    if (progressText) {

        progressText.innerText = `${completed} / ${total} lessons completed`;

    }



    if (progressBar) {

        progressBar.style.width = `${total ? (completed / total) * 100 : 0}%`;

    }



    if (currentLevelDisplay) {

        currentLevelDisplay.innerText = current ? current.title : "No lesson selected";

    }



    if (badgeCount) {

        badgeCount.innerText = `${achievements().filter(a => a.earned).length} earned`;

    }



    const track = getTrack();

    document.getElementById("track-title").innerText = track.title;

    document.getElementById("track-description").innerText = track.description;

}



function renderAchievements() {

    const container = document.getElementById("badges-container");

    if (!container) return;



    container.innerHTML = "";

    achievements().forEach((achievement) => {

        const chip = document.createElement("div");

        chip.className = achievement.earned ? "badge-chip" : "badge-chip locked";

        chip.innerText = `${achievement.earned ? "🏅" : "🔒"} ${achievement.label}`;

        container.appendChild(chip);

    });

}



// ---------- curriculum nav ----------

function renderCurriculumNav() {

    const list = document.getElementById("category-list");

    if (!list) return;



    list.innerHTML = "";



    getAllCategories().forEach((category) => {

        const wrap = document.createElement("div");

        wrap.className = "curriculum-category";



        const header = document.createElement("button");

        header.className = "curriculum-category-header";

        header.innerHTML = `

            <span class="curriculum-category-title">${category.title}</span>

            <span class="curriculum-category-meta">${categoryProgressText(category)}</span>

        `;



        const lessonsWrap = document.createElement("div");

        lessonsWrap.className = "curriculum-category-lessons";



        category.lessons.forEach((lesson) => {

            const lessonBtn = document.createElement("button");

            lessonBtn.className = "lesson-item";



            if (lesson.id === appState.currentLessonId) lessonBtn.classList.add("current");

            if (isLessonCompleted(lesson.id)) lessonBtn.classList.add("completed");



            lessonBtn.innerHTML = `

                <div class="lesson-item-head">

                    <span class="lesson-item-title">${lesson.title}</span>

                    <span class="lesson-type-badge ${lessonTypeClass(lesson.type)}">${lesson.type}</span>

                </div>

                <span class="lesson-status">${isLessonCompleted(lesson.id) ? "Completed" : "Available"}</span>

            `;



            lessonBtn.addEventListener("click", function () {

                loadLesson(lesson.id);

            });



            lessonsWrap.appendChild(lessonBtn);

        });



        wrap.appendChild(header);

        wrap.appendChild(lessonsWrap);

        list.appendChild(wrap);

    });

}



// ---------- lesson rendering ----------

function hideAllLessonBodies() {

    document.getElementById("concept-content").classList.add("hidden");

    document.getElementById("challenge-content").classList.add("hidden");

    document.getElementById("scenario-content").classList.add("hidden");

    document.getElementById("executive-takeaway").classList.add("hidden");

}



function renderLessonHeader(record) {

    const { categoryTitle, lesson } = record;

    const track = getTrack();



    document.getElementById("track-title-display").innerText = track.title;

    document.getElementById("lesson-title").innerText = lesson.title;

    document.getElementById("lesson-objective").innerText = lesson.objective || "";



    const typeBadge = document.getElementById("current-lesson-type-badge");

    typeBadge.className = `lesson-type-badge ${lessonTypeClass(lesson.type)}`;

    typeBadge.innerText = lesson.type;



    const categoryBadge = document.getElementById("current-category-badge");

    categoryBadge.className = "difficulty-badge difficulty-intermediate";

    categoryBadge.innerText = categoryTitle;



    document.getElementById("lesson-tables").innerHTML =

        `<strong>Relevant Tables:</strong> ${(lesson.relevantTables || []).join(", ") || "—"}`;

    document.getElementById("lesson-join-hint").innerHTML =

        `<strong>Join Hint:</strong> ${lesson.joinHint || "—"}`;

    document.getElementById("lesson-sql-focus").innerHTML =

        `<strong>SQL Focus:</strong> ${sqlFocusText(lesson.sql_focus)}`;

}



function renderConceptLesson(lesson) {

    hideAllLessonBodies();

    const wrap = document.getElementById("concept-content");

    wrap.classList.remove("hidden");



    document.getElementById("concept-summary").innerText = lesson.content?.summary || "";

    const bullets = document.getElementById("concept-bullets");

    bullets.innerHTML = "";

    (lesson.content?.bullets || []).forEach((bullet) => {

        const li = document.createElement("li");

        li.innerText = bullet;

        bullets.appendChild(li);

    });

    document.getElementById("concept-example").innerText = lesson.content?.hospitalExample || "";

}



function renderChallengeLesson(lesson) {

    hideAllLessonBodies();

    document.getElementById("challenge-content").classList.remove("hidden");

    document.getElementById("query").value = lesson.starterQuery || "";

    document.getElementById("feedback").innerHTML = "";

    document.getElementById("output").innerHTML = "";

    attempts = 0;

    lastRunQuery = "";

}



function renderScenarioLesson(lesson) {

    hideAllLessonBodies();

    document.getElementById("scenario-content").classList.remove("hidden");

    document.getElementById("scenario-summary").innerText = lesson.content?.summary || "";

    document.getElementById("scenario-prompt").innerText = lesson.content?.prompt || "";

    document.getElementById("scenario-response").value = "";

    document.getElementById("scenario-feedback").innerHTML = "";

}



function renderExecutiveTakeaway(lesson) {

    const wrap = document.getElementById("executive-takeaway");

    if (!lesson.executiveTakeaway || !lesson.executiveTakeaway.show) {

        wrap.classList.add("hidden");

        return;

    }



    wrap.classList.remove("hidden");

    document.getElementById("exec-metric").innerHTML = `<strong>Metric:</strong> ${lesson.executiveTakeaway.metric || "—"}`;

    document.getElementById("exec-why").innerHTML = `<strong>Why it matters:</strong> ${lesson.executiveTakeaway.whyItMatters || "—"}`;

    document.getElementById("exec-share").innerHTML = `<strong>What to share:</strong> ${lesson.executiveTakeaway.whatToShare || "—"}`;

    document.getElementById("exec-action").innerHTML = `<strong>Recommended action:</strong> ${lesson.executiveTakeaway.action || "—"}`;

}



function renderHintBox(lesson) {

    const hintBox = document.getElementById("level-hint");

    if (!hintBox) return;



    if (lesson.type === "concept") {

        hintBox.innerText = "Read the concept summary, examples, and hospital context. Mark the lesson complete when ready.";

    } else if (lesson.type === "scenario") {

        hintBox.innerText = "Respond to the scenario using the business context provided. Think like an analyst supporting leaders.";

    } else {

        hintBox.innerText = "Run your query and check your answer. After two wrong tries, you'll get a targeted hint. After the third wrong try, the answer will be shown.";

    }

}



function loadLesson(lessonId) {

    const record = getLessonRecordById(lessonId);

    if (!record) return;



    appState.currentLessonId = lessonId;

    appState.currentCategoryId = record.categoryId;

    attempts = 0;

    lastRunQuery = "";



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



function markConceptComplete() {

    const lesson = getCurrentLesson();

    if (!lesson || lesson.type !== "concept") return;



    markLessonComplete(lesson.id);

    renderAchievements();

    renderCurriculumNav();

    updateDashboard();

    saveProgress();



    const feedback = document.getElementById("feedback");

    if (feedback) {

        feedback.innerHTML = "<p style='color:#16a34a; font-weight:700;'>✅ Concept marked complete.</p>";

    }

}



function runQuery() {

    const lesson = getCurrentLesson();

    if (!lesson || lesson.type !== "challenge") return;



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

    const lesson = getCurrentLesson();

    if (!lesson || lesson.type !== "challenge") return;



    const query = document.getElementById("query").value.trim();

    const feedback = document.getElementById("feedback");

    const hint = document.getElementById("level-hint");



    if (!query) {

        feedback.innerHTML = "<p style='color:#dc2626; font-weight:700;'>Please enter a query first.</p>";

        return;

    }



    attempts += 1;

    const userSql = normalizeSql(query);

    const solutionSql = normalizeSql(lesson.solutionQuery || "");



    if (userSql === solutionSql) {

        feedback.innerHTML = "<p style='color:#16a34a; font-weight:700;'>✅ Correct!</p>";

        markLessonComplete(lesson.id);

        if (attempts === 1) {

            markLessonFirstTry(lesson.id);

        }

        renderAchievements();

        renderCurriculumNav();

        updateDashboard();

        saveProgress();

        return;

    }



    feedback.innerHTML = "<p style='color:#dc2626; font-weight:700;'>❌ Not quite.</p>";



    if (attempts === 2) {

        hint.innerText = `Hint: ${lesson.hint || "Review the requested output and relevant tables."}`;

    } else if (attempts >= 3) {

        hint.innerText = `Answer: ${lesson.solutionQuery || ""}`;

    }

}



function resetQuery() {

    const lesson = getCurrentLesson();

    if (!lesson || lesson.type !== "challenge") return;



    document.getElementById("query").value = lesson.starterQuery || "";

    document.getElementById("feedback").innerHTML = "";

    document.getElementById("output").innerHTML = "";

    attempts = 0;

}



function submitScenario() {

    const lesson = getCurrentLesson();

    if (!lesson || lesson.type !== "scenario") return;



    const response = (document.getElementById("scenario-response").value || "").trim().toLowerCase();

    const expected = (lesson.content?.expectedAnswer || "").trim().toLowerCase();

    const feedback = document.getElementById("scenario-feedback");



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

        saveProgress();

    } else {

        feedback.innerHTML = "<p style='color:#dc2626; font-weight:700;'>Not quite. Re-read the prompt and think about which table or action best fits the question.</p>";

    }

}



function resetScenario() {

    const lesson = getCurrentLesson();

    if (!lesson || lesson.type !== "scenario") return;



    document.getElementById("scenario-response").value = "";

    document.getElementById("scenario-feedback").innerHTML = "";

}



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

        firstTryLessonIds: []

    };



    attempts = 0;

    lastRunQuery = "";



    renderAchievements();

    renderCurriculumNav();

    updateDashboard();

    loadLesson(firstLesson.id);

}



function initializeStateDefaults() {

    const track = getTrack();

    if (!track) return;



    if (!appState.currentCategoryId) {

        appState.currentCategoryId = track.categories[0].id;

    }



    if (!appState.currentLessonId) {

        appState.currentLessonId = track.categories[0].lessons[0].id;

    }

}



window.onload = function () {

    loadProgress();

    initializeStateDefaults();

    renderSchema();

    renderAchievements();

    renderCurriculumNav();

    updateDashboard();

    loadLesson(appState.currentLessonId);

};



// global handlers for HTML

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
