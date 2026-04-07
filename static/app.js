// ======================
// DROP 1 START
// ======================

// ======================
// STATE + STORAGE
// ======================
const STORAGE_KEY = "careops_curriculum_v3";

let appState = {
    currentTrackId: "track_sql_foundations_hospital",
    currentCategoryId: null,
    currentLessonId: null,
    completedLessonIds: [],
    firstTryLessonIds: [],
    schemaPanelWidth: 320
};

let attempts = 0;
let lastRunQuery = "";

// ======================
// SCHEMA DATA
// ======================
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

// ======================
// LESSON BUILDERS
// ======================
function conceptLesson(id, title, objective, sql_focus, relevantTables, joinHint, summary, bullets, hospitalExample, executiveTakeaway = null) {
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

function challengeLesson(id, title, objective, sql_focus, relevantTables, joinHint, starterQuery, solutionQuery, hint, executiveTakeaway = null) {
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

function scenarioLesson(id, title, objective, relevantTables, joinHint, summary, prompt, expectedAnswer, executiveTakeaway = null) {
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
// CURRICULUM (START)
// ======================
const curriculum = [
{
    id: "track_sql_foundations_hospital",
    title: "SQL Foundations for Hospital Data",
    description: "Learn SQL through real hospital analytics scenarios.",
    order: 1,
    categories: [

        // ======================
        // CATEGORY 1
        // ======================
        {
            id: "getting_started",
            title: "Getting Started",
            order: 1,
            lessons: [

                conceptLesson(
                    "gs_01",
                    "What Hospital Data Looks Like",
                    "Understand core hospital tables.",
                    [],
                    ["patients","encounters","claims"],
                    "No join needed.",
                    "Hospital data revolves around patients, encounters, and financial activity.",
                    ["Patients","Encounters","Claims"],
                    "Everything stems from these tables."
                ),

                challengeLesson(
                    "gs_02",
                    "View Patients",
                    "Return all patients.",
                    ["SELECT"],
                    ["patients"],
                    "No join needed.",
                    "SELECT * FROM patients;",
                    "SELECT * FROM patients;",
                    "Use SELECT *"
                ),

                challengeLesson(
                    "gs_03",
                    "View Encounters",
                    "Return all encounters.",
                    ["SELECT"],
                    ["encounters"],
                    "No join needed.",
                    "SELECT * FROM encounters;",
                    "SELECT * FROM encounters;",
                    "Use SELECT *"
                ),

                challengeLesson(
                    "gs_04",
                    "View Claims",
                    "Return all claims.",
                    ["SELECT"],
                    ["claims"],
                    "No join needed.",
                    "SELECT * FROM claims;",
                    "SELECT * FROM claims;",
                    "Use SELECT *"
                ),

                scenarioLesson(
                    "gs_05",
                    "Choose Table",
                    "Pick correct table",
                    ["claims","patients"],
                    "Think business question",
                    "Pick correct data source",
                    "Where do denials live?",
                    "claims"
                )
            ]
        },

// ======================
// DROP 1 END (DO NOT DELETE)
// ======================

        // ======================
        // CATEGORY 2
        // ======================
        {
            id: "selecting_columns",
            title: "Selecting Columns",
            order: 2,
            lessons: [

                conceptLesson(
                    "sc_01",
                    "SELECT Basics",
                    "Learn to return only needed fields.",
                    ["SELECT"],
                    ["patients","claims"],
                    "No join needed.",
                    "Selecting fewer columns makes outputs clearer and more useful.",
                    ["Return only needed fields","Avoid clutter","Think about audience"],
                    "Executives do not want raw exports."
                ),

                challengeLesson(
                    "sc_02",
                    "Patient Core Fields",
                    "Return patient_id, first_name, last_name.",
                    ["SELECT"],
                    ["patients"],
                    "No join needed.",
                    "SELECT patient_id, first_name, last_name FROM patients;",
                    "SELECT patient_id, first_name, last_name FROM patients;",
                    "Select only the requested fields."
                ),

                challengeLesson(
                    "sc_03",
                    "Claim Financial Fields",
                    "Return claim_id, payer, billed_amount.",
                    ["SELECT"],
                    ["claims"],
                    "No join needed.",
                    "SELECT claim_id, payer, billed_amount FROM claims;",
                    "SELECT claim_id, payer, billed_amount FROM claims;",
                    "Select claim_id, payer, billed_amount."
                ),

                challengeLesson(
                    "sc_04",
                    "Encounter Operational Fields",
                    "Return encounter_id, facility, department, status.",
                    ["SELECT"],
                    ["encounters"],
                    "No join needed.",
                    "SELECT encounter_id, facility, department, status FROM encounters;",
                    "SELECT encounter_id, facility, department, status FROM encounters;",
                    "Return the four requested encounter fields."
                ),

                scenarioLesson(
                    "sc_05",
                    "Executive-Focused Output",
                    "Choose the most relevant columns.",
                    ["claims"],
                    "Think audience first.",
                    "A concise report beats a raw dump.",
                    "For a denial summary, should you emphasize payer and billed amount or every field?",
                    "payer",
                    {
                        show: true,
                        metric: "Focused reporting output",
                        whyItMatters: "Leaders need concise answers.",
                        whatToShare: "Only include columns directly tied to the business question.",
                        action: "Reduce clutter before sharing results."
                    }
                )
            ]
        },

        // ======================
        // CATEGORY 3
        // ======================
        {
            id: "filtering_rows",
            title: "Filtering Rows",
            order: 3,
            lessons: [

                conceptLesson(
                    "fr_01",
                    "Filtering with WHERE",
                    "Use WHERE to isolate meaningful records.",
                    ["WHERE"],
                    ["patients","claims","encounters"],
                    "No join needed.",
                    "Filtering turns broad tables into focused answers.",
                    ["Filter by payer","Filter by status","Filter by department","Filter by amount"],
                    "Most questions are about a subset, not every row."
                ),

                challengeLesson(
                    "fr_02",
                    "Medicare Patients",
                    "Return Medicare patients.",
                    ["WHERE"],
                    ["patients"],
                    "No join needed.",
                    "SELECT patient_id, first_name, last_name FROM patients WHERE insurance_type = 'Medicare';",
                    "SELECT patient_id, first_name, last_name FROM patients WHERE insurance_type = 'Medicare';",
                    "Filter insurance_type = 'Medicare'."
                ),

                challengeLesson(
                    "fr_03",
                    "Denied Claims",
                    "Return denied claims.",
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
                        whatToShare: "Summarize denied count and billed dollars at risk.",
                        action: "Escalate payer spikes and high-dollar denials."
                    }
                ),

                challengeLesson(
                    "fr_04",
                    "Cardiology Encounters",
                    "Return Cardiology encounters.",
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
                    "Return charges over 2000.",
                    ["WHERE"],
                    ["charges"],
                    "No join needed.",
                    "SELECT charge_id, payer, amount FROM charges WHERE amount > 2000;",
                    "SELECT charge_id, payer, amount FROM charges WHERE amount > 2000;",
                    "Filter amount > 2000."
                )
            ]
        },

        // ======================
        // CATEGORY 4
        // ======================
        {
            id: "sorting_results",
            title: "Sorting Results",
            order: 4,
            lessons: [

                conceptLesson(
                    "sr_01",
                    "Ordering Results",
                    "Use ORDER BY to rank and structure outputs.",
                    ["ORDER BY"],
                    ["charges","patients","encounters"],
                    "No join needed.",
                    "Sorting helps surface what matters first.",
                    ["Descending for high-dollar items","Ascending for names/dates","Use multiple sort columns when needed"],
                    "Executives often want the biggest issues first.",
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
                    "Return charges ordered highest to lowest.",
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
                    "Return patients ordered by last_name.",
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
                    "Return encounters ordered by facility then department.",
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
                    "Decide how sorted output should be used.",
                    ["charges","claims"],
                    "Think ranking by impact.",
                    "Sorted output helps leaders focus on biggest issues.",
                    "Should a leadership summary show the full file unsorted or highest-dollar items first?",
                    "highest",
                    {
                        show: true,
                        metric: "Top-ranked opportunities",
                        whyItMatters: "Leadership time is limited.",
                        whatToShare: "Use top-10 or highest-impact outputs in summaries.",
                        action: "Sort by impact before sharing upward."
                    }
                )
            ]
        },

        // ======================
        // CATEGORY 5
        // ======================
        {
            id: "strings",
            title: "Strings",
            order: 5,
            lessons: [

                conceptLesson(
                    "st_01",
                    "Working with Text",
                    "Use string functions to clean and present text values.",
                    ["concatenation","UPPER","LOWER","TRIM"],
                    ["patients","claims"],
                    "No join needed.",
                    "String logic helps create readable outputs and standardized labels.",
                    ["Build display names","Standardize payer text","Clean spacing"],
                    "Reports often need one clean display field instead of several raw fields."
                ),

                challengeLesson(
                    "st_02",
                    "Build Patient Full Name",
                    "Return a full_name field.",
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

        // ======================
        // CATEGORY 6
        // ======================
        {
            id: "numbers_and_calculations",
            title: "Numbers and Calculations",
            order: 6,
            lessons: [

                conceptLesson(
                    "nm_01",
                    "Raw Data vs Metrics",
                    "Understand why leaders prefer metrics over raw lists.",
                    ["ROUND","AVG","CASE","COUNT"],
                    ["claims","encounters","charges"],
                    "No join needed.",
                    "Analysts turn raw rows into rates and metrics leaders can act on.",
                    ["Percent denied","Average LOS","Average charge","Remaining balance"],
                    "A denial rate tells a clearer story than a raw claim list.",
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
                    ["CASE","COUNT","ROUND"],
                    ["claims"],
                    "No join needed.",
                    "SELECT ROUND(100.0 * SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*), 2) AS denial_rate FROM claims;",
                    "SELECT ROUND(100.0 * SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*), 2) AS denial_rate FROM claims;",
                    "Count denied claims inside CASE, divide by total, then round."
                ),

                challengeLesson(
                    "nm_03",
                    "Calculate Average LOS",
                    "Return average length_of_stay.",
                    ["AVG","ROUND"],
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
                    ["AVG","ROUND"],
                    ["charges"],
                    "No join needed.",
                    "SELECT ROUND(AVG(amount), 2) AS avg_charge FROM charges;",
                    "SELECT ROUND(AVG(amount), 2) AS avg_charge FROM charges;",
                    "Use AVG(amount) and ROUND."
                ),

                challengeLesson(
                    "nm_05",
                    "Estimate Remaining Balance",
                    "Return billed_amount minus 1000 as remaining_balance.",
                    ["arithmetic"],
                    ["claims"],
                    "No join needed.",
                    "SELECT claim_id, billed_amount - 1000 AS remaining_balance FROM claims;",
                    "SELECT claim_id, billed_amount - 1000 AS remaining_balance FROM claims;",
                    "Subtract 1000 from billed_amount and alias it."
                )
            ]
        },

        // ======================
        // CATEGORY 7
        // ======================
        {
            id: "null_handling",
            title: "NULL Handling",
            order: 7,
            lessons: [

                conceptLesson(
                    "nh_01",
                    "Understanding NULL",
                    "Understand how missing values affect analysis.",
                    ["IS NULL","IS NOT NULL","COALESCE"],
                    ["encounters","claims"],
                    "No join needed.",
                    "NULL means data is missing or unavailable and can distort metrics if ignored.",
                    ["NULL is not zero","NULL is not blank text","Missing data can break summaries"],
                    "Missing discharge_date can distort LOS reporting."
                ),

                challengeLesson(
                    "nh_02",
                    "Find Missing Discharge Dates",
                    "Return encounters where discharge_date is null.",
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
                    "Return encounters where discharge_date is not null.",
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
                    "Use COALESCE to replace null discharge_date.",
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
                    "Decide when missing data should be escalated.",
                    ["encounters"],
                    "Think about metric impact.",
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

        // ======================
// DROP 2 END (DO NOT DELETE)
// ======================

        // ======================
        // CATEGORY 8
        // ======================
        {
            id: "boolean_logic",
            title: "Boolean Logic",
            order: 8,
            lessons: [

                conceptLesson(
                    "bl_01",
                    "Combining Conditions",
                    "Use AND, OR, and NOT to define meaningful groups.",
                    ["AND","OR","NOT"],
                    ["claims","encounters","patients"],
                    "No join needed.",
                    "Boolean logic helps analysts define the exact population that matters.",
                    ["AND narrows","OR broadens","NOT excludes"],
                    "High-dollar denied claims are more actionable than all denied claims."
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
                    "Filter denied claims and add the billed_amount threshold.",
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
                    "Return Emergency or Observation encounters.",
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
                    "Return encounters where status is not Discharged.",
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
                    "Return Medicare or Medicaid patients.",
                    ["OR"],
                    ["patients"],
                    "No join needed.",
                    "SELECT patient_id, insurance_type FROM patients WHERE insurance_type = 'Medicare' OR insurance_type = 'Medicaid';",
                    "SELECT patient_id, insurance_type FROM patients WHERE insurance_type = 'Medicare' OR insurance_type = 'Medicaid';",
                    "Use OR between Medicare and Medicaid."
                )
            ]
        },

        // ======================
        // CATEGORY 9
        // ======================
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
                    ["charges","encounters","claims"],
                    "No join needed.",
                    "CASE statements turn raw values into categories leadership can interpret faster.",
                    ["High / Medium / Low","Open / Closed","Short / Long"],
                    "Executives usually understand categories faster than raw transactional detail.",
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
                    "Return a charge_bucket field.",
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
                    "Return a status_group of Open or Closed.",
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
                    "Return a los_bucket of Long or Short.",
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
                    ["charges","encounters"],
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

        // ======================
        // CATEGORY 10
        // ======================
        {
            id: "aggregations",
            title: "Aggregations",
            order: 10,
            lessons: [

                conceptLesson(
                    "ag_01",
                    "Summarizing Data with COUNT, SUM, and AVG",
                    "Understand the building blocks of KPIs and dashboards.",
                    ["COUNT","SUM","AVG"],
                    ["encounters","claims","charges"],
                    "No join needed.",
                    "Aggregation functions are the core of most reporting and dashboards.",
                    ["COUNT = volume","SUM = dollars","AVG = typical burden or rate"],
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

        // ======================
        // CATEGORY 11
        // ======================
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
                    ["encounters","claims","charges"],
                    "No join needed.",
                    "GROUP BY turns row-level data into grouped performance summaries.",
                    ["By facility","By payer","By department","By provider"],
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
                    ["GROUP BY","COUNT"],
                    ["encounters"],
                    "No join needed.",
                    "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",
                    "SELECT facility, COUNT(*) AS encounter_count FROM encounters GROUP BY facility;",
                    "Group by facility and count rows."
                ),

                challengeLesson(
                    "gb_03",
                    "Denied Claims by Payer",
                    "Return payer and denied claim count.",
                    ["WHERE","GROUP BY","COUNT"],
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
                    ["GROUP BY","SUM"],
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
                    ["GROUP BY","COUNT"],
                    ["encounters"],
                    "No join needed.",
                    "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
                    "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department;",
                    "Group by department."
                )
            ]
        },

        // ======================
        // CATEGORY 12
        // ======================
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
                    ["claims","encounters","charges"],
                    "No join needed.",
                    "HAVING filters grouped results after aggregation.",
                    ["WHERE filters rows","HAVING filters groups"],
                    "Use HAVING to isolate only the units that exceed a threshold.",
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
                    ["WHERE","GROUP BY","HAVING"],
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
                    ["GROUP BY","HAVING"],
                    ["encounters"],
                    "No join needed.",
                    "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department HAVING COUNT(*) > 1;",
                    "SELECT department, COUNT(*) AS encounter_count FROM encounters GROUP BY department HAVING COUNT(*) > 1;",
                    "Use HAVING COUNT(*) > 1 after grouping by department."
                ),

                challengeLesson(
                    "hv_04",
                    "Payers with High Total Charges",
                    "Return payers whose total charges exceed 2000.",
                    ["GROUP BY","HAVING","SUM"],
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
                    ["claims","charges"],
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

        // ======================
        // CATEGORY 13
        // ======================
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
                    ["patients","encounters","claims","charges","providers"],
                    "Relationships matter: patient_id, encounter_id, and provider_id are common join paths.",
                    "Real insight often comes from combining related tables.",
                    [
                        "Patients + encounters = who had which visit",
                        "Claims + patients = payer and patient context",
                        "Encounters + providers = provider-level operational views"
                    ],
                    "To explain denied dollars by patient or department, you must join data across tables.",
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
                    ["encounters","patients"],
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
                    ["claims","patients"],
                    "claims.patient_id = patients.patient_id",
                    "SELECT c.claim_id, p.first_name, p.insurance_type FROM claims c JOIN patients p ON c.patient_id = p.patient_id;",
                    "SELECT c.claim_id, p.first_name, p.insurance_type FROM claims c JOIN patients p ON c.patient_id = p.patient_id;",
                    "Join claims to patients using patient_id."
                ),

                challengeLesson(
                    "ij_04",
                    "Join Encounters to Providers",
                    "Return encounter_id, provider_name, and specialty.",
                    ["JOIN"],
                    ["encounters","providers"],
                    "encounters.provider_id = providers.provider_id",
                    "SELECT e.encounter_id, p.provider_name, p.specialty FROM encounters e JOIN providers p ON e.provider_id = p.provider_id;",
                    "SELECT e.encounter_id, p.provider_name, p.specialty FROM encounters e JOIN providers p ON e.provider_id = p.provider_id;",
                    "Join encounters to providers using provider_id."
                ),

                challengeLesson(
                    "ij_05",
                    "Join Claims to Encounter Department",
                    "Return claim_id, department, and billed_amount.",
                    ["JOIN"],
                    ["claims","encounters"],
                    "claims.encounter_id = encounters.encounter_id",
                    "SELECT c.claim_id, e.department, c.billed_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id;",
                    "SELECT c.claim_id, e.department, c.billed_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id;",
                    "Join claims to encounters on encounter_id."
                )
            ]
        }

    ]
}
];

// ======================
// DROP 3 END (DO NOT DELETE)
// ======================

// ======================
// DROP 4 START
// ======================

// ======================
// HELPERS
// ======================
function getTrack() {
    return curriculum.find(t => t.id === appState.currentTrackId) || curriculum[0];
}

function getAllCategories() {
    return getTrack().categories || [];
}

function getAllLessons() {
    const lessons = [];
    getAllCategories().forEach(category => {
        category.lessons.forEach(lesson => {
            lessons.push({
                trackId: appState.currentTrackId,
                categoryId: category.id,
                categoryTitle: category.title,
                lesson
            });
        });
    });
    return lessons;
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

function lessonTypeClass(type) {
    return `lesson-type-${type}`;
}

function normalizeSql(sql) {
    return String(sql || "")
        .trim()
        .replace(/;$/, "")
        .replace(/\s+/g, " ")
        .toLowerCase();
}

function sqlFocusText(sqlFocus) {
    return sqlFocus && sqlFocus.length ? sqlFocus.join(", ") : "—";
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

function categoryProgressText(category) {
    const total = category.lessons.length;
    const done = category.lessons.filter(lesson => isLessonCompleted(lesson.id)).length;
    return `${done}/${total} completed`;
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
        { label: "50 Lessons Completed", earned: completed >= 50 },
        { label: "65 Lessons Completed", earned: completed >= 65 },
        { label: "3 First-Try Wins", earned: firstTry >= 3 },
        { label: "10 First-Try Wins", earned: firstTry >= 10 }
    ];
}

// ======================
// STORAGE
// ======================
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
        appState.schemaPanelWidth = typeof parsed.schemaPanelWidth === "number" ? parsed.schemaPanelWidth : 320;
    } catch (error) {
        console.error("Failed to load saved progress", error);
    }
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

// ======================
// SCHEMA RENDERING
// ======================
function buildPreviewTable(columns, rows) {
    let html = "<table class='preview-table'><tr>";
    columns.forEach(column => {
        html += `<th>${column}</th>`;
    });
    html += "</tr>";

    rows.forEach(row => {
        html += "<tr>";
        row.forEach(cell => {
            html += `<td>${cell === null ? "NULL" : cell}</td>`;
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

    schema.tables.forEach(table => {
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

function filterRelevantRelationships(relevantTables) {
    if (!relevantTables || !relevantTables.length) return schema.relationships;

    return schema.relationships.filter(rel => {
        const matches = relevantTables.filter(tableName => rel.includes(`${tableName}.`));
        return matches.length >= 2;
    });
}

function renderRelationships(relevantTables = []) {
    const container = document.getElementById("schema-relationships");
    if (!container) return;

    const relationshipsToShow = filterRelevantRelationships(relevantTables);
    container.innerHTML = "";

    relationshipsToShow.forEach(relationship => {
        const item = document.createElement("div");
        item.className = "relationship-item";
        item.innerText = relationship;
        container.appendChild(item);
    });

    if (relationshipsToShow.length === 0) {
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

function getTableByName(name) {
    return schema.tables.find(table => table.name === name);
}

function relatedRelationships(tableName) {
    return schema.relationships.filter(rel => rel.includes(`${tableName}.`));
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
    relatedRelationships(table.name).forEach(rel => {
        const chip = document.createElement("div");
        chip.className = "modal-relationship-chip";
        chip.innerText = rel;
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

// ======================
// SCHEMA RESIZER
// ======================
function applySchemaPanelWidth() {
    const panel = document.getElementById("schema-panel");
    if (!panel) return;

    const width = Math.max(260, Math.min(appState.schemaPanelWidth || 320, 700));
    panel.style.width = `${width}px`;
    appState.schemaPanelWidth = width;
}

function initSchemaResizer() {
    const resizer = document.getElementById("schema-resizer");
    const panel = document.getElementById("schema-panel");
    if (!resizer || !panel) return;

    let dragging = false;

    resizer.addEventListener("mousedown", function (event) {
        dragging = true;
        event.preventDefault();
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";
    });

    document.addEventListener("mousemove", function (event) {
        if (!dragging) return;
        const nextWidth = Math.max(260, Math.min(event.clientX - 20, 700));
        appState.schemaPanelWidth = nextWidth;
        applySchemaPanelWidth();
    });

    document.addEventListener("mouseup", function () {
        if (!dragging) return;
        dragging = false;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        saveProgress();
    });
}

// ======================
// DASHBOARD / BADGES
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

    const trackTitle = document.getElementById("track-title");
    const trackDescription = document.getElementById("track-description");
    if (trackTitle) trackTitle.innerText = track.title;
    if (trackDescription) trackDescription.innerText = track.description;
}

function renderAchievements() {
    const container = document.getElementById("badges-container");
    if (!container) return;

    container.innerHTML = "";
    achievements().forEach(achievement => {
        const chip = document.createElement("div");
        chip.className = achievement.earned ? "badge-chip" : "badge-chip locked";
        chip.innerText = `${achievement.earned ? "🏅" : "🔒"} ${achievement.label}`;
        container.appendChild(chip);
    });
}

// ======================
// CURRICULUM NAV
// ======================
function renderCurriculumNav() {
    const list = document.getElementById("category-list");
    if (!list) return;

    list.innerHTML = "";

    getAllCategories().forEach(category => {
        const wrap = document.createElement("div");
        wrap.className = "curriculum-category";

        const header = document.createElement("button");
        header.className = "curriculum-category-header";
        header.type = "button";
        header.innerHTML = `
            <span class="curriculum-category-title">${category.title}</span>
            <span class="curriculum-category-meta">${categoryProgressText(category)}</span>
        `;

        const lessonsWrap = document.createElement("div");
        lessonsWrap.className = "curriculum-category-lessons";

        category.lessons.forEach(lesson => {
            const lessonBtn = document.createElement("button");
            lessonBtn.className = "lesson-item";
            lessonBtn.type = "button";

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

// ======================
// DROP 4 END (DO NOT DELETE)
// ======================

// ======================
// DROP 5 START
// ======================

// ======================
// LESSON RENDERING
// ======================
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

function renderHintBox(lesson) {
    const hintBox = document.getElementById("level-hint");
    if (!hintBox) return;

    if (lesson.type === "concept") {
        hintBox.innerText = "Read the concept summary, bullets, and hospital example. Mark the lesson complete when ready.";
    } else if (lesson.type === "scenario") {
        hintBox.innerText = "Respond to the scenario using the business context provided. Think like an analyst supporting leadership.";
    } else {
        hintBox.innerText = "Run your query and check your answer. After two wrong tries, you'll get a targeted hint. After the third wrong try, the answer will be shown.";
    }
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

function renderConceptLesson(lesson) {
    hideAllLessonBodies();
    document.getElementById("concept-content").classList.remove("hidden");

    document.getElementById("concept-summary").innerText = lesson.content?.summary || "";
    const bullets = document.getElementById("concept-bullets");
    bullets.innerHTML = "";
    (lesson.content?.bullets || []).forEach(bullet => {
        const li = document.createElement("li");
        li.innerText = bullet;
        bullets.appendChild(li);
    });
    document.getElementById("concept-example").innerText = lesson.content?.hospitalExample || "";

    document.getElementById("feedback").innerHTML = "";
    document.getElementById("output").innerHTML = "";
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
// LESSON ACTIONS
// ======================
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

// ======================
// NAVIGATION
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
// RESET
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
        schemaPanelWidth: 320
    };

    attempts = 0;
    lastRunQuery = "";

   applySchemaPanelWidth();
    renderSchema();
    renderAchievements();
    renderCurriculumNav();
    updateDashboard();
    renderTrackOverview();
    showTrackOverview();
}

// ======================
// INIT
// ======================
// ======================
// OVERVIEW / TRACK SCREEN
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
    if (descEl) descEl.innerText = track.description;
    if (progressTextEl) progressTextEl.innerText = `${completed} of ${total} lessons completed`;
    if (progressBarEl) {
        progressBarEl.style.width = `${total ? (completed / total) * 100 : 0}%`;
    }

    if (!cardsWrap) return;
    cardsWrap.innerHTML = "";

    categories.forEach((category) => {
        const totalLessons = category.lessons.length;
        const completedLessons = category.lessons.filter((lesson) => isLessonCompleted(lesson.id)).length;
        const firstLesson = category.lessons[0];

        const card = document.createElement("button");
        card.type = "button";
        card.className = "track-category-card";
        card.innerHTML = `
            <div class="track-category-card-top">
                <h3>${category.title}</h3>
                <span class="track-category-count">${totalLessons} Lessons</span>
            </div>
            <p class="track-category-progress">${completedLessons}/${totalLessons} completed</p>
            <div class="progress-bar-wrap">
                <div class="track-category-progress-bar" style="width:${totalLessons ? (completedLessons / totalLessons) * 100 : 0}%"></div>
            </div>
            <p class="track-category-enter">Open Category</p>
        `;

        card.addEventListener("click", function () {
            if (firstLesson) {
                loadLesson(firstLesson.id);
            }
        });

        cardsWrap.appendChild(card);
    });
}

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
window.onload = function () {
    loadProgress();
    initializeStateDefaults();
    applySchemaPanelWidth();
    initSchemaResizer();
    renderSchema();
    renderAchievements();
    renderCurriculumNav();
    updateDashboard();
    bindOverviewButtons();
    renderTrackOverview();
    showTrackOverview();
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

// ======================
// DROP 5 END
// ======================
