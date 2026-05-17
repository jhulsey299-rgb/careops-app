/* CAREOPS workspace-first app.js
   Full-file replacement.
   Important: to preserve your full lesson catalog exactly, replace the
   fallback curriculum block below with your existing full curriculum array.
*/
(() => {
  "use strict";

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
