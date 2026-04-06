let lastResult = null;
let currentLevel = 0;

const schema = {
  tables: [
    {
      name: "patients",
      description: "Patient demographic and risk information.",
      keyColumns: ["patient_id"],
      notableColumns: ["first_name", "last_name", "age", "gender", "insurance_type", "risk_score", "city"]
    },
    {
      name: "providers",
      description: "Provider, specialty, and facility assignment data.",
      keyColumns: ["provider_id"],
      notableColumns: ["provider_name", "specialty", "facility", "department", "years_experience"]
    },
    {
      name: "encounters",
      description: "Hospital and clinic encounters tied to patients and providers.",
      keyColumns: ["encounter_id", "patient_id", "provider_id"],
      notableColumns: ["facility", "department", "encounter_type", "status", "admit_date", "discharge_date", "length_of_stay"]
    },
    {
      name: "appointments",
      description: "Scheduled visits tied to patients and providers.",
      keyColumns: ["appointment_id", "patient_id", "provider_id"],
      notableColumns: ["facility", "department", "appointment_date", "status"]
    },
    {
      name: "charges",
      description: "Financial charges tied to encounters and patients.",
      keyColumns: ["charge_id", "encounter_id", "patient_id"],
      notableColumns: ["payer", "amount", "charge_type", "charge_date"]
    },
    {
      name: "claims",
      description: "Claim outcomes tied to encounters and patients.",
      keyColumns: ["claim_id", "encounter_id", "patient_id"],
      notableColumns: ["payer", "claim_status", "denial_reason", "billed_amount", "paid_amount"]
    }
  ]
};

const levels = [
  {
    title: "Level 1: Medicare Population",
    mission: "Return all patients with Medicare insurance.",
    goal: "Show patient_id, first_name, last_name, and insurance_type.",
    starterQuery: "SELECT patient_id, first_name, last_name, insurance_type FROM patients WHERE insurance_type = 'Medicare';",
    solutionQuery: "SELECT patient_id, first_name, last_name, insurance_type FROM patients WHERE insurance_type = 'Medicare';",
    hint: "Use the patients table and filter insurance_type to Medicare.",
    tablesUsed: ["patients"],
    joinHint: "No join needed.",
    requiredConcepts: ["WHERE"],
    expectedColumns: ["patient_id", "first_name", "last_name", "insurance_type"],
    commonMistakes: [
      "Forgetting to filter insurance_type to Medicare",
      "Returning extra columns",
      "Using the wrong table"
    ]
  },
  {
    title: "Level 2: Encounters by Facility",
    mission: "Count the number of encounters at each facility.",
    goal: "Return facility and count.",
    starterQuery: "SELECT facility, COUNT(*) AS count FROM encounters GROUP BY facility;",
    solutionQuery: "SELECT facility, COUNT(*) AS count FROM encounters GROUP BY facility;",
    hint: "Use the encounters table. Group by facility and count the rows.",
    tablesUsed: ["encounters"],
    joinHint: "No join needed.",
    requiredConcepts: ["GROUP BY", "COUNT"],
    expectedColumns: ["facility", "count"],
    commonMistakes: [
      "Missing GROUP BY facility",
      "Returning encounter-level detail instead of grouped counts"
    ]
  },
  {
    title: "Level 3: Active Cardiology Patients",
    mission: "Find all active encounters currently in Cardiology.",
    goal: "Show encounter_id, patient_id, department, and status.",
    starterQuery: "SELECT encounter_id, patient_id, department, status FROM encounters WHERE department = 'Cardiology' AND status = 'Active';",
    solutionQuery: "SELECT encounter_id, patient_id, department, status FROM encounters WHERE department = 'Cardiology' AND status = 'Active';",
    hint: "Stay in the encounters table and filter both department and status.",
    tablesUsed: ["encounters"],
    joinHint: "No join needed.",
    requiredConcepts: ["WHERE"],
    expectedColumns: ["encounter_id", "patient_id", "department", "status"],
    commonMistakes: [
      "Filtering only department but not status",
      "Filtering only status but not department"
    ]
  },
  {
    title: "Level 4: Discharged Encounters",
    mission: "Return all discharged encounters.",
    goal: "Show encounter_id, patient_id, department, and discharge_date.",
    starterQuery: "SELECT encounter_id, patient_id, department, discharge_date FROM encounters WHERE status = 'Discharged';",
    solutionQuery: "SELECT encounter_id, patient_id, department, discharge_date FROM encounters WHERE status = 'Discharged';",
    hint: "Filter the encounters table to discharged rows.",
    tablesUsed: ["encounters"],
    joinHint: "No join needed.",
    requiredConcepts: ["WHERE"],
    expectedColumns: ["encounter_id", "patient_id", "department", "discharge_date"],
    commonMistakes: [
      "Returning all encounters instead of discharged only",
      "Returning status instead of discharge_date"
    ]
  },
  {
    title: "Level 5: Patients Sorted by Last Name",
    mission: "Return all patients sorted by last name, then first name.",
    goal: "Show patient_id, first_name, last_name, and insurance_type.",
    starterQuery: "SELECT patient_id, first_name, last_name, insurance_type FROM patients ORDER BY last_name, first_name;",
    solutionQuery: "SELECT patient_id, first_name, last_name, insurance_type FROM patients ORDER BY last_name, first_name;",
    hint: "Use ORDER BY last_name, first_name.",
    tablesUsed: ["patients"],
    joinHint: "No join needed.",
    requiredConcepts: ["ORDER BY"],
    expectedColumns: ["patient_id", "first_name", "last_name", "insurance_type"],
    commonMistakes: [
      "Sorting by first_name first",
      "No ORDER BY at all"
    ]
  },
  {
    title: "Level 6: Patients by Insurance Type",
    mission: "Count patients by insurance type.",
    goal: "Return insurance_type and patient_count.",
    starterQuery: "SELECT insurance_type, COUNT(*) AS patient_count FROM patients GROUP BY insurance_type;",
    solutionQuery: "SELECT insurance_type, COUNT(*) AS patient_count FROM patients GROUP BY insurance_type;",
    hint: "Group the patients table by insurance_type.",
    tablesUsed: ["patients"],
    joinHint: "No join needed.",
    requiredConcepts: ["GROUP BY", "COUNT"],
    expectedColumns: ["insurance_type", "patient_count"],
    commonMistakes: [
      "Missing GROUP BY",
      "Returning individual patients instead of grouped counts"
    ]
  },
  {
    title: "Level 7: No-Show Appointments by Facility",
    mission: "Count no-show appointments by facility.",
    goal: "Return facility and no_show_count.",
    starterQuery: "SELECT facility, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY facility;",
    solutionQuery: "SELECT facility, COUNT(*) AS no_show_count FROM appointments WHERE status = 'No Show' GROUP BY facility;",
    hint: "Use appointments, filter to No Show, then group by facility.",
    tablesUsed: ["appointments"],
    joinHint: "No join needed.",
    requiredConcepts: ["WHERE", "GROUP BY", "COUNT"],
    expectedColumns: ["facility", "no_show_count"],
    commonMistakes: [
      "Forgetting the No Show filter",
      "Grouping by department instead of facility"
    ]
  },
  {
    title: "Level 8: Charges by Payer",
    mission: "Calculate total charged dollars by payer.",
    goal: "Return payer and total_amount.",
    starterQuery: "SELECT payer, ROUND(SUM(amount), 2) AS total_amount FROM charges GROUP BY payer;",
    solutionQuery: "SELECT payer, ROUND(SUM(amount), 2) AS total_amount FROM charges GROUP BY payer;",
    hint: "Use SUM(amount) grouped by payer.",
    tablesUsed: ["charges"],
    joinHint: "No join needed.",
    requiredConcepts: ["GROUP BY", "SUM"],
    expectedColumns: ["payer", "total_amount"],
    commonMistakes: [
      "Using COUNT instead of SUM",
      "Grouping by charge_type instead of payer"
    ]
  },
  {
    title: "Level 9: Average LOS by Facility",
    mission: "Calculate average length of stay for completed encounters by facility.",
    goal: "Return facility and avg_los.",
    starterQuery: "SELECT facility, ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters WHERE length_of_stay IS NOT NULL GROUP BY facility;",
    solutionQuery: "SELECT facility, ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters WHERE length_of_stay IS NOT NULL GROUP BY facility;",
    hint: "Only average non-null length_of_stay values.",
    tablesUsed: ["encounters"],
    joinHint: "No join needed.",
    requiredConcepts: ["WHERE", "GROUP BY", "AVG"],
    expectedColumns: ["facility", "avg_los"],
    commonMistakes: [
      "Averaging all rows including null LOS",
      "Using SUM instead of AVG"
    ]
  },
  {
    title: "Level 10: ER Encounters by Status",
    mission: "Count ER encounters by status.",
    goal: "Return status and encounter_count.",
    starterQuery: "SELECT status, COUNT(*) AS encounter_count FROM encounters WHERE department = 'ER' GROUP BY status;",
    solutionQuery: "SELECT status, COUNT(*) AS encounter_count FROM encounters WHERE department = 'ER' GROUP BY status;",
    hint: "Filter department to ER, then group by status.",
    tablesUsed: ["encounters"],
    joinHint: "No join needed.",
    requiredConcepts: ["WHERE", "GROUP BY", "COUNT"],
    expectedColumns: ["status", "encounter_count"],
    commonMistakes: [
      "Forgetting the ER filter",
      "Grouping by department instead of status"
    ]
  },
  {
    title: "Level 11: Encounters with Patient Names",
    mission: "Join encounters to patients.",
    goal: "Show encounter_id, first_name, last_name, facility, and department for discharged encounters.",
    starterQuery: "SELECT e.encounter_id, p.first_name, p.last_name, e.facility, e.department FROM encounters e JOIN patients p ON e.patient_id = p.patient_id WHERE e.status = 'Discharged';",
    solutionQuery: "SELECT e.encounter_id, p.first_name, p.last_name, e.facility, e.department FROM encounters e JOIN patients p ON e.patient_id = p.patient_id WHERE e.status = 'Discharged';",
    hint: "Join encounters.patient_id to patients.patient_id.",
    tablesUsed: ["encounters", "patients"],
    joinHint: "encounters.patient_id = patients.patient_id",
    requiredConcepts: ["JOIN", "WHERE"],
    expectedColumns: ["encounter_id", "first_name", "last_name", "facility", "department"],
    commonMistakes: [
      "Missing JOIN",
      "Joining on the wrong key",
      "Forgetting the discharged filter"
    ]
  },
  {
    title: "Level 12: Visits per Provider",
    mission: "Count encounters for each provider.",
    goal: "Return provider_name and visit_count, highest to lowest.",
    starterQuery: "SELECT pr.provider_name, COUNT(*) AS visit_count FROM encounters e JOIN providers pr ON e.provider_id = pr.provider_id GROUP BY pr.provider_name ORDER BY visit_count DESC, pr.provider_name;",
    solutionQuery: "SELECT pr.provider_name, COUNT(*) AS visit_count FROM encounters e JOIN providers pr ON e.provider_id = pr.provider_id GROUP BY pr.provider_name ORDER BY visit_count DESC, pr.provider_name;",
    hint: "Join encounters to providers using provider_id.",
    tablesUsed: ["encounters", "providers"],
    joinHint: "encounters.provider_id = providers.provider_id",
    requiredConcepts: ["JOIN", "GROUP BY", "ORDER BY"],
    expectedColumns: ["provider_name", "visit_count"],
    commonMistakes: [
      "Missing JOIN",
      "No GROUP BY",
      "Missing ORDER BY visit_count DESC"
    ]
  },
  {
    title: "Level 13: Patients Without Scheduled Appointments",
    mission: "Find patients who have never had an appointment.",
    goal: "Show patient_id, first_name, and last_name.",
    starterQuery: "SELECT p.patient_id, p.first_name, p.last_name FROM patients p LEFT JOIN appointments a ON p.patient_id = a.patient_id WHERE a.appointment_id IS NULL;",
    solutionQuery: "SELECT p.patient_id, p.first_name, p.last_name FROM patients p LEFT JOIN appointments a ON p.patient_id = a.patient_id WHERE a.appointment_id IS NULL;",
    hint: "Use a LEFT JOIN from patients to appointments, then find NULL appointment_id values.",
    tablesUsed: ["patients", "appointments"],
    joinHint: "patients.patient_id = appointments.patient_id",
    requiredConcepts: ["LEFT JOIN", "WHERE"],
    expectedColumns: ["patient_id", "first_name", "last_name"],
    commonMistakes: [
      "Using INNER JOIN instead of LEFT JOIN",
      "Checking the wrong column for NULL"
    ]
  },
  {
    title: "Level 14: Denied Claims by Payer",
    mission: "Count denied claims and sum billed dollars by payer.",
    goal: "Return payer, denied_claims, and denied_billed_amount.",
    starterQuery: "SELECT payer, COUNT(*) AS denied_claims, ROUND(SUM(billed_amount), 2) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
    solutionQuery: "SELECT payer, COUNT(*) AS denied_claims, ROUND(SUM(billed_amount), 2) AS denied_billed_amount FROM claims WHERE claim_status = 'Denied' GROUP BY payer;",
    hint: "Stay in claims and filter claim_status to Denied.",
    tablesUsed: ["claims"],
    joinHint: "No join needed.",
    requiredConcepts: ["WHERE", "GROUP BY", "SUM", "COUNT"],
    expectedColumns: ["payer", "denied_claims", "denied_billed_amount"],
    commonMistakes: [
      "Forgetting claim_status = 'Denied'",
      "Using paid_amount instead of billed_amount"
    ]
  },
  {
    title: "Level 15: Charges by Provider Specialty",
    mission: "Sum total charge dollars by provider specialty using encounters and providers.",
    goal: "Return specialty and total_charge_amount.",
    starterQuery: "SELECT pr.specialty, ROUND(SUM(ch.amount), 2) AS total_charge_amount FROM charges ch JOIN encounters e ON ch.encounter_id = e.encounter_id JOIN providers pr ON e.provider_id = pr.provider_id GROUP BY pr.specialty;",
    solutionQuery: "SELECT pr.specialty, ROUND(SUM(ch.amount), 2) AS total_charge_amount FROM charges ch JOIN encounters e ON ch.encounter_id = e.encounter_id JOIN providers pr ON e.provider_id = pr.provider_id GROUP BY pr.specialty;",
    hint: "Join charges to encounters using encounter_id, then encounters to providers using provider_id.",
    tablesUsed: ["charges", "encounters", "providers"],
    joinHint: "charges.encounter_id = encounters.encounter_id; encounters.provider_id = providers.provider_id",
    requiredConcepts: ["JOIN", "GROUP BY", "SUM"],
    expectedColumns: ["specialty", "total_charge_amount"],
    commonMistakes: [
      "Missing one of the joins",
      "Grouping by provider_name instead of specialty"
    ]
  },
  {
    title: "Level 16: 30-Day Readmissions",
    mission: "Identify patients who had another encounter within 30 days after discharge.",
    goal: "Show distinct patient_id values.",
    starterQuery: "SELECT DISTINCT e1.patient_id FROM encounters e1 JOIN encounters e2 ON e1.patient_id = e2.patient_id AND e2.admit_date > e1.discharge_date AND julianday(e2.admit_date) - julianday(e1.discharge_date) <= 30 WHERE e1.discharge_date IS NOT NULL ORDER BY e1.patient_id;",
    solutionQuery: "SELECT DISTINCT e1.patient_id FROM encounters e1 JOIN encounters e2 ON e1.patient_id = e2.patient_id AND e2.admit_date > e1.discharge_date AND julianday(e2.admit_date) - julianday(e1.discharge_date) <= 30 WHERE e1.discharge_date IS NOT NULL ORDER BY e1.patient_id;",
    hint: "Self-join encounters on patient_id and compare later admit_date to earlier discharge_date.",
    tablesUsed: ["encounters"],
    joinHint: "Self-join: encounters.patient_id = encounters.patient_id",
    requiredConcepts: ["JOIN", "WHERE", "ORDER BY"],
    expectedColumns: ["patient_id"],
    commonMistakes: [
      "Missing DISTINCT",
      "Not comparing dates correctly",
      "Forgetting to exclude null discharge_date"
    ]
  },
  {
    title: "Level 17: Top Denied Dollars by Facility",
    mission: "Find denied billed dollars by facility.",
    goal: "Return facility and denied_amount ordered highest to lowest.",
    starterQuery: "SELECT e.facility, ROUND(SUM(c.billed_amount), 2) AS denied_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id WHERE c.claim_status = 'Denied' GROUP BY e.facility ORDER BY denied_amount DESC, e.facility;",
    solutionQuery: "SELECT e.facility, ROUND(SUM(c.billed_amount), 2) AS denied_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id WHERE c.claim_status = 'Denied' GROUP BY e.facility ORDER BY denied_amount DESC, e.facility;",
    hint: "Join claims to encounters using encounter_id, then group by facility.",
    tablesUsed: ["claims", "encounters"],
    joinHint: "claims.encounter_id = encounters.encounter_id",
    requiredConcepts: ["JOIN", "WHERE", "GROUP BY", "ORDER BY"],
    expectedColumns: ["facility", "denied_amount"],
    commonMistakes: [
      "Using paid_amount instead of billed_amount",
      "Missing denied filter",
      "Missing ORDER BY"
    ]
  },
  {
    title: "Level 18: High-Risk Patients with Multiple ER Visits",
    mission: "Find high-risk patients with more than one ER encounter.",
    goal: "Show patient_id, first_name, last_name, risk_score, and er_visits.",
    starterQuery: "SELECT p.patient_id, p.first_name, p.last_name, p.risk_score, COUNT(*) AS er_visits FROM patients p JOIN encounters e ON p.patient_id = e.patient_id WHERE e.department = 'ER' AND p.risk_score >= 70 GROUP BY p.patient_id, p.first_name, p.last_name, p.risk_score HAVING COUNT(*) > 1 ORDER BY er_visits DESC, p.patient_id;",
    solutionQuery: "SELECT p.patient_id, p.first_name, p.last_name, p.risk_score, COUNT(*) AS er_visits FROM patients p JOIN encounters e ON p.patient_id = e.patient_id WHERE e.department = 'ER' AND p.risk_score >= 70 GROUP BY p.patient_id, p.first_name, p.last_name, p.risk_score HAVING COUNT(*) > 1 ORDER BY er_visits DESC, p.patient_id;",
    hint: "Join patients to encounters, filter to ER, group by patient, then use HAVING COUNT(*) > 1.",
    tablesUsed: ["patients", "encounters"],
    joinHint: "patients.patient_id = encounters.patient_id",
    requiredConcepts: ["JOIN", "WHERE", "GROUP BY", "HAVING", "ORDER BY"],
    expectedColumns: ["patient_id", "first_name", "last_name", "risk_score", "er_visits"],
    commonMistakes: [
      "Forgetting risk_score >= 70",
      "Missing HAVING COUNT(*) > 1",
      "Grouping incorrectly"
    ]
  },
  {
    title: "Level 19: Patients with Appointments but No Completed Encounter",
    mission: "Find patients who had a completed appointment but no completed encounter.",
    goal: "Show distinct patient_id, first_name, and last_name.",
    starterQuery: "SELECT DISTINCT p.patient_id, p.first_name, p.last_name FROM patients p JOIN appointments a ON p.patient_id = a.patient_id LEFT JOIN encounters e ON p.patient_id = e.patient_id AND e.status = 'Completed' WHERE a.status = 'Completed' AND e.encounter_id IS NULL ORDER BY p.patient_id;",
    solutionQuery: "SELECT DISTINCT p.patient_id, p.first_name, p.last_name FROM patients p JOIN appointments a ON p.patient_id = a.patient_id LEFT JOIN encounters e ON p.patient_id = e.patient_id AND e.status = 'Completed' WHERE a.status = 'Completed' AND e.encounter_id IS NULL ORDER BY p.patient_id;",
    hint: "Join patients to appointments, then LEFT JOIN encounters filtered to Completed.",
    tablesUsed: ["patients", "appointments", "encounters"],
    joinHint: "patients.patient_id = appointments.patient_id; patients.patient_id = encounters.patient_id",
    requiredConcepts: ["JOIN", "LEFT JOIN", "WHERE", "ORDER BY"],
    expectedColumns: ["patient_id", "first_name", "last_name"],
    commonMistakes: [
      "Using INNER JOIN instead of LEFT JOIN",
      "Forgetting DISTINCT",
      "Filtering encounter status in the wrong place"
    ]
  },
  {
    title: "Level 20: Rank Providers by Encounter Volume",
    mission: "Rank providers by total encounter volume.",
    goal: "Return provider_name, specialty, encounter_count, and volume_rank.",
    starterQuery: "SELECT provider_name, specialty, encounter_count, RANK() OVER (ORDER BY encounter_count DESC) AS volume_rank FROM (SELECT pr.provider_name, pr.specialty, COUNT(*) AS encounter_count FROM providers pr JOIN encounters e ON pr.provider_id = e.provider_id GROUP BY pr.provider_id, pr.provider_name, pr.specialty) t ORDER BY volume_rank, provider_name;",
    solutionQuery: "SELECT provider_name, specialty, encounter_count, RANK() OVER (ORDER BY encounter_count DESC) AS volume_rank FROM (SELECT pr.provider_name, pr.specialty, COUNT(*) AS encounter_count FROM providers pr JOIN encounters e ON pr.provider_id = e.provider_id GROUP BY pr.provider_id, pr.provider_name, pr.specialty) t ORDER BY volume_rank, provider_name;",
    hint: "Aggregate encounter counts in a subquery, then apply RANK().",
    tablesUsed: ["providers", "encounters"],
    joinHint: "providers.provider_id = encounters.provider_id",
    requiredConcepts: ["JOIN", "GROUP BY", "ORDER BY", "RANK"],
    expectedColumns: ["provider_name", "specialty", "encounter_count", "volume_rank"],
    commonMistakes: [
      "Missing RANK()",
      "Ranking raw encounters instead of aggregated counts",
      "No subquery"
    ]
  },
  {
    title: "Level 21: Readmission Count by Facility",
    mission: "Calculate 30-day readmission counts by facility.",
    goal: "Return facility and readmission_count.",
    starterQuery: "SELECT e1.facility, COUNT(DISTINCT e2.encounter_id) AS readmission_count FROM encounters e1 JOIN encounters e2 ON e1.patient_id = e2.patient_id AND e2.admit_date > e1.discharge_date AND julianday(e2.admit_date) - julianday(e1.discharge_date) <= 30 WHERE e1.discharge_date IS NOT NULL GROUP BY e1.facility;",
    solutionQuery: "SELECT e1.facility, COUNT(DISTINCT e2.encounter_id) AS readmission_count FROM encounters e1 JOIN encounters e2 ON e1.patient_id = e2.patient_id AND e2.admit_date > e1.discharge_date AND julianday(e2.admit_date) - julianday(e1.discharge_date) <= 30 WHERE e1.discharge_date IS NOT NULL GROUP BY e1.facility;",
    hint: "Use a self-join on encounters and group the later readmissions by facility.",
    tablesUsed: ["encounters"],
    joinHint: "Self-join: encounters.patient_id = encounters.patient_id",
    requiredConcepts: ["JOIN", "WHERE", "GROUP BY", "COUNT"],
    expectedColumns: ["facility", "readmission_count"],
    commonMistakes: [
      "Forgetting the self-join",
      "Missing the 30-day date logic",
      "Counting all encounters instead of readmissions"
    ]
  },
  {
    title: "Level 22: Average LOS by Department and Encounter Type",
    mission: "Calculate average LOS by department and encounter type.",
    goal: "Return department, encounter_type, and avg_los.",
    starterQuery: "SELECT department, encounter_type, ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters WHERE length_of_stay IS NOT NULL GROUP BY department, encounter_type;",
    solutionQuery: "SELECT department, encounter_type, ROUND(AVG(length_of_stay), 2) AS avg_los FROM encounters WHERE length_of_stay IS NOT NULL GROUP BY department, encounter_type;",
    hint: "Group by both department and encounter_type.",
    tablesUsed: ["encounters"],
    joinHint: "No join needed.",
    requiredConcepts: ["WHERE", "GROUP BY", "AVG"],
    expectedColumns: ["department", "encounter_type", "avg_los"],
    commonMistakes: [
      "Grouping by only one column",
      "Using SUM instead of AVG",
      "Including null LOS values"
    ]
  },
  {
    title: "Level 23: Denial Rate by Payer",
    mission: "Calculate denied claims as a percent of all claims by payer.",
    goal: "Return payer, total_claims, denied_claims, and denial_rate.",
    starterQuery: "SELECT payer, COUNT(*) AS total_claims, SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) AS denied_claims, ROUND(100.0 * SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*), 2) AS denial_rate FROM claims GROUP BY payer;",
    solutionQuery: "SELECT payer, COUNT(*) AS total_claims, SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) AS denied_claims, ROUND(100.0 * SUM(CASE WHEN claim_status = 'Denied' THEN 1 ELSE 0 END) / COUNT(*), 2) AS denial_rate FROM claims GROUP BY payer;",
    hint: "Use CASE WHEN inside SUM to count denied claims.",
    tablesUsed: ["claims"],
    joinHint: "No join needed.",
    requiredConcepts: ["GROUP BY", "SUM", "COUNT", "CASE"],
    expectedColumns: ["payer", "total_claims", "denied_claims", "denial_rate"],
    commonMistakes: [
      "Missing CASE expression",
      "Using only denied claims instead of all claims in the denominator",
      "Forgetting to group by payer"
    ]
  },
  {
    title: "Level 24: Top 10 Highest-Risk Patients by Total Charges",
    mission: "Find the top 10 highest-risk patients by total charges.",
    goal: "Return patient_id, first_name, last_name, risk_score, and total_charges.",
    starterQuery: "SELECT p.patient_id, p.first_name, p.last_name, p.risk_score, ROUND(SUM(c.amount), 2) AS total_charges FROM patients p JOIN charges c ON p.patient_id = c.patient_id GROUP BY p.patient_id, p.first_name, p.last_name, p.risk_score ORDER BY p.risk_score DESC, total_charges DESC LIMIT 10;",
    solutionQuery: "SELECT p.patient_id, p.first_name, p.last_name, p.risk_score, ROUND(SUM(c.amount), 2) AS total_charges FROM patients p JOIN charges c ON p.patient_id = c.patient_id GROUP BY p.patient_id, p.first_name, p.last_name, p.risk_score ORDER BY p.risk_score DESC, total_charges DESC LIMIT 10;",
    hint: "Join patients to charges, sum charges, sort by risk then dollars, and limit to 10.",
    tablesUsed: ["patients", "charges"],
    joinHint: "patients.patient_id = charges.patient_id",
    requiredConcepts: ["JOIN", "GROUP BY", "ORDER BY", "LIMIT", "SUM"],
    expectedColumns: ["patient_id", "first_name", "last_name", "risk_score", "total_charges"],
    commonMistakes: [
      "Missing LIMIT 10",
      "Sorting by charges only",
      "Forgetting to aggregate charges"
    ]
  },
  {
    title: "Level 25: No-Show Rate by Department",
    mission: "Calculate appointment no-show rate by department.",
    goal: "Return department, total_appointments, no_shows, and no_show_rate.",
    starterQuery: "SELECT department, COUNT(*) AS total_appointments, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) AS no_shows, ROUND(100.0 * SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) / COUNT(*), 2) AS no_show_rate FROM appointments GROUP BY department;",
    solutionQuery: "SELECT department, COUNT(*) AS total_appointments, SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) AS no_shows, ROUND(100.0 * SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) / COUNT(*), 2) AS no_show_rate FROM appointments GROUP BY department;",
    hint: "Use conditional aggregation grouped by department.",
    tablesUsed: ["appointments"],
    joinHint: "No join needed.",
    requiredConcepts: ["GROUP BY", "SUM", "COUNT", "CASE"],
    expectedColumns: ["department", "total_appointments", "no_shows", "no_show_rate"],
    commonMistakes: [
      "Using WHERE status = 'No Show' which removes total appointments",
      "Missing the percentage calculation",
      "Grouping by facility instead of department"
    ]
  },
  {
    title: "Level 26: Providers Above Average Encounter Volume",
    mission: "Find providers whose encounter volume is above the average provider volume.",
    goal: "Return provider_name and encounter_count.",
    starterQuery: "SELECT provider_name, encounter_count FROM (SELECT pr.provider_name, COUNT(*) AS encounter_count FROM providers pr JOIN encounters e ON pr.provider_id = e.provider_id GROUP BY pr.provider_id, pr.provider_name) t WHERE encounter_count > (SELECT AVG(encounter_count) FROM (SELECT COUNT(*) AS encounter_count FROM encounters GROUP BY provider_id) x) ORDER BY encounter_count DESC, provider_name;",
    solutionQuery: "SELECT provider_name, encounter_count FROM (SELECT pr.provider_name, COUNT(*) AS encounter_count FROM providers pr JOIN encounters e ON pr.provider_id = e.provider_id GROUP BY pr.provider_id, pr.provider_name) t WHERE encounter_count > (SELECT AVG(encounter_count) FROM (SELECT COUNT(*) AS encounter_count FROM encounters GROUP BY provider_id) x) ORDER BY encounter_count DESC, provider_name;",
    hint: "Use a subquery for encounter volume, then compare it to the average provider volume.",
    tablesUsed: ["providers", "encounters"],
    joinHint: "providers.provider_id = encounters.provider_id",
    requiredConcepts: ["JOIN", "GROUP BY", "ORDER BY"],
    expectedColumns: ["provider_name", "encounter_count"],
    commonMistakes: [
      "Not using a subquery for the average",
      "Comparing against average rows instead of average provider counts",
      "Missing the provider join"
    ]
  },
  {
    title: "Level 27: Patients with Multiple ED Visits",
    mission: "Identify patients with more than one ED encounter.",
    goal: "Return patient_id and ed_visits.",
    starterQuery: "SELECT patient_id, COUNT(*) AS ed_visits FROM encounters WHERE department = 'ER' GROUP BY patient_id HAVING COUNT(*) > 1 ORDER BY ed_visits DESC, patient_id;",
    solutionQuery: "SELECT patient_id, COUNT(*) AS ed_visits FROM encounters WHERE department = 'ER' GROUP BY patient_id HAVING COUNT(*) > 1 ORDER BY ed_visits DESC, patient_id;",
    hint: "Filter to ER encounters, group by patient_id, then use HAVING COUNT(*) > 1.",
    tablesUsed: ["encounters"],
    joinHint: "No join needed.",
    requiredConcepts: ["WHERE", "GROUP BY", "HAVING", "ORDER BY"],
    expectedColumns: ["patient_id", "ed_visits"],
    commonMistakes: [
      "Using WHERE COUNT(*) > 1 instead of HAVING",
      "Forgetting the ER filter",
      "Missing ORDER BY"
    ]
  },
  {
    title: "Level 28: Net Collection Rate by Payer",
    mission: "Calculate paid amount as a percentage of billed amount by payer.",
    goal: "Return payer, billed_total, paid_total, and net_collection_rate.",
    starterQuery: "SELECT payer, ROUND(SUM(billed_amount), 2) AS billed_total, ROUND(SUM(paid_amount), 2) AS paid_total, ROUND(100.0 * SUM(paid_amount) / SUM(billed_amount), 2) AS net_collection_rate FROM claims GROUP BY payer;",
    solutionQuery: "SELECT payer, ROUND(SUM(billed_amount), 2) AS billed_total, ROUND(SUM(paid_amount), 2) AS paid_total, ROUND(100.0 * SUM(paid_amount) / SUM(billed_amount), 2) AS net_collection_rate FROM claims GROUP BY payer;",
    hint: "Use SUM(paid_amount) divided by SUM(billed_amount), grouped by payer.",
    tablesUsed: ["claims"],
    joinHint: "No join needed.",
    requiredConcepts: ["GROUP BY", "SUM"],
    expectedColumns: ["payer", "billed_total", "paid_total", "net_collection_rate"],
    commonMistakes: [
      "Using AVG instead of SUM",
      "Dividing row-level values instead of totals",
      "Forgetting to group by payer"
    ]
  },
  {
    title: "Level 29: Observation Encounters Over 48 Hours",
    mission: "Find observation encounters with LOS greater than 48 hours.",
    goal: "Return encounter_id, patient_id, facility, department, and length_of_stay.",
    starterQuery: "SELECT encounter_id, patient_id, facility, department, length_of_stay FROM encounters WHERE encounter_type = 'Observation' AND length_of_stay > 2 ORDER BY length_of_stay DESC, encounter_id;",
    solutionQuery: "SELECT encounter_id, patient_id, facility, department, length_of_stay FROM encounters WHERE encounter_type = 'Observation' AND length_of_stay > 2 ORDER BY length_of_stay DESC, encounter_id;",
    hint: "Observation over 48 hours means length_of_stay > 2 in this simplified dataset.",
    tablesUsed: ["encounters"],
    joinHint: "No join needed.",
    requiredConcepts: ["WHERE", "ORDER BY"],
    expectedColumns: ["encounter_id", "patient_id", "facility", "department", "length_of_stay"],
    commonMistakes: [
      "Filtering only by LOS but not encounter_type",
      "Using >= 2 instead of > 2",
      "Missing ORDER BY"
    ]
  },
  {
    title: "Level 30: Department Ranking by Denied Dollars",
    mission: "Rank departments by total denied billed amount.",
    goal: "Return department, denied_amount, and denial_rank.",
    starterQuery: "SELECT department, denied_amount, RANK() OVER (ORDER BY denied_amount DESC) AS denial_rank FROM (SELECT e.department, ROUND(SUM(c.billed_amount), 2) AS denied_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id WHERE c.claim_status = 'Denied' GROUP BY e.department) t ORDER BY denial_rank, department;",
    solutionQuery: "SELECT department, denied_amount, RANK() OVER (ORDER BY denied_amount DESC) AS denial_rank FROM (SELECT e.department, ROUND(SUM(c.billed_amount), 2) AS denied_amount FROM claims c JOIN encounters e ON c.encounter_id = e.encounter_id WHERE c.claim_status = 'Denied' GROUP BY e.department) t ORDER BY denial_rank, department;",
    hint: "Aggregate denied dollars by department in a subquery, then apply RANK().",
    tablesUsed: ["claims", "encounters"],
    joinHint: "claims.encounter_id = encounters.encounter_id",
    requiredConcepts: ["JOIN", "WHERE", "GROUP BY", "ORDER BY", "RANK"],
    expectedColumns: ["department", "denied_amount", "denial_rank"],
    commonMistakes: [
      "Missing the subquery",
      "Ranking before aggregation",
      "Using paid_amount instead of billed_amount"
    ]
  }
];

async function runBackendQuery(queryText) {
  const res = await fetch("/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: queryText })
  });
  return await res.json();
}

function renderResultTable(data) {
  const output = document.getElementById("output");
  let html = "<table border='1'><tr>";

  data.columns.forEach(function(col) {
    html += "<th>" + col + "</th>";
  });
  html += "</tr>";

  data.rows.forEach(function(row) {
    html += "<tr>";
    row.forEach(function(cell) {
      html += "<td>" + cell + "</td>";
    });
    html += "</tr>";
  });

  html += "</table>";
  output.innerHTML = html;
}

function normalizeResults(data) {
  return {
    columns: data.columns.map(function(col) {
      return String(col);
    }),
    rows: data.rows.map(function(row) {
      return row.map(function(cell) {
        if (cell === null || cell === undefined) return null;
        return String(cell);
      });
    })
  };
}

function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getRowKey(row) {
  return JSON.stringify(row);
}

function countDuplicateRows(rows) {
  const counts = {};
  rows.forEach(function(row) {
    const key = getRowKey(row);
    counts[key] = (counts[key] || 0) + 1;
  });

  let duplicates = 0;
  Object.keys(counts).forEach(function(key) {
    if (counts[key] > 1) {
      duplicates += counts[key] - 1;
    }
  });

  return duplicates;
}

function missingColumns(userCols, expectedCols) {
  return expectedCols.filter(function(col) {
    return userCols.indexOf(col) === -1;
  });
}

function extraColumns(userCols, expectedCols) {
  return userCols.filter(function(col) {
    return expectedCols.indexOf(col) === -1;
  });
}

function analyzeQueryStructure(level, userQuery) {
  const q = userQuery.toUpperCase();
  const issues = [];

  level.tablesUsed.forEach(function(table) {
    if (q.indexOf(table.toUpperCase()) === -1) {
      issues.push("You may be missing the `" + table + "` table.");
    }
  });

  level.requiredConcepts.forEach(function(concept) {
    const c = concept.toUpperCase();
    if (q.indexOf(c) === -1) {
      issues.push("You may be missing `" + concept + "`.");
    }
  });

  if (level.joinHint && level.joinHint !== "No join needed.") {
    if (level.requiredConcepts.indexOf("LEFT JOIN") !== -1 && q.indexOf("LEFT JOIN") === -1) {
      issues.push("This level likely requires a `LEFT JOIN`.");
    } else if (q.indexOf("JOIN") === -1) {
      issues.push("This level likely requires a `JOIN`.");
    }
  }

  return issues;
}

function analyzeResultDifferences(level, userData, solutionData) {
  const messages = [];

  const userCols = userData.columns;
  const solutionCols = solutionData.columns;

  const missingCols = missingColumns(userCols, solutionCols);
  const extraCols = extraColumns(userCols, solutionCols);

  if (missingCols.length > 0) {
    messages.push("You are missing expected columns: " + missingCols.join(", ") + ".");
  }

  if (extraCols.length > 0) {
    messages.push("You returned extra columns: " + extraCols.join(", ") + ".");
  }

  if (userData.rows.length > solutionData.rows.length) {
    messages.push("Your result has too many rows. You may be missing a filter, DISTINCT, GROUP BY, or correct join condition.");
  } else if (userData.rows.length < solutionData.rows.length) {
    messages.push("Your result has too few rows. You may be filtering too much or using the wrong join.");
  }

  const userDupes = countDuplicateRows(userData.rows);
  if (userDupes > 0) {
    messages.push("Your result has duplicate rows. This often means the join condition is too broad or DISTINCT is needed.");
  }

  const sameCols = arraysEqual(userCols, solutionCols);
  if (sameCols && userData.rows.length === solutionData.rows.length && !arraysEqual(userData.rows, solutionData.rows)) {
    messages.push("Your columns and row count look close, but the values or sort order are off.");
  }

  return messages;
}

function buildHintMessage(level, userQuery, userData, solutionData) {
  let messages = [];

  messages = messages.concat(analyzeQueryStructure(level, userQuery));
  messages = messages.concat(analyzeResultDifferences(level, userData, solutionData));

  if (messages.length === 0) {
    messages.push(level.hint);
  }

  if (level.commonMistakes && level.commonMistakes.length > 0) {
    messages.push("Common mistakes for this level: " + level.commonMistakes.join("; ") + ".");
  }

  return messages.join(" ");
}

function resetQuery() {
  document.getElementById("query").value = levels[currentLevel].starterQuery;
}

async function runQuery() {
  const query = document.getElementById("query").value;
  const output = document.getElementById("output");
  const data = await runBackendQuery(query);

  if (data.error) {
    output.innerText = data.error;
    lastResult = null;
    return;
  }

  lastResult = data;
  renderResultTable(data);
}

async function checkAnswer() {
  const feedback = document.getElementById("feedback");
  const nextLevelDiv = document.getElementById("next-level");
  const userQuery = document.getElementById("query").value;

  if (!lastResult) {
    feedback.innerHTML = "<p style='color:red;'><strong>Run your query first.</strong></p>";
    return;
  }

  const level = levels[currentLevel];
  const solutionResult = await runBackendQuery(level.solutionQuery);

  if (solutionResult.error) {
    feedback.innerHTML = "<p style='color:red;'><strong>Validation error:</strong> " + solutionResult.error + "</p>";
    return;
  }

  const userNormalized = normalizeResults(lastResult);
  const solutionNormalized = normalizeResults(solutionResult);

  const columnsMatch = arraysEqual(userNormalized.columns, solutionNormalized.columns);
  const rowsMatch = arraysEqual(userNormalized.rows, solutionNormalized.rows);

  if (columnsMatch && rowsMatch) {
    feedback.innerHTML =
      "<p style='color:green;'><strong>Correct!</strong> You completed " + level.title + ".</p>";

    if (currentLevel < levels.length - 1) {
      nextLevelDiv.innerHTML =
        '<button onclick="loadLevel(' + (currentLevel + 1) + ')">Next Level</button>';
    } else {
      nextLevelDiv.innerHTML =
        "<p><strong>You completed all 30 levels.</strong></p>";
    }
  } else {
    const smartHint = buildHintMessage(level, userQuery, userNormalized, solutionNormalized);
    feedback.innerHTML =
      "<p style='color:red;'><strong>Not quite.</strong> " + smartHint + "</p>";
    nextLevelDiv.innerHTML = "";
  }
}

function loadLevel(index) {
  currentLevel = index;
  const level = levels[index];

  const missionBox = document.querySelector(".mission-box");
  missionBox.innerHTML =
    "<h2>" + level.title + "</h2>" +
    "<p><strong>Mission:</strong> " + level.mission + "</p>" +
    "<p><strong>Goal:</strong> " + level.goal + "</p>" +
    "<p><strong>Relevant Tables:</strong> " + level.tablesUsed.join(", ") + "</p>" +
    "<p><strong>Join Hint:</strong> " + level.joinHint + "</p>";

  const levelHint = document.getElementById("level-hint");
  if (levelHint) {
    levelHint.innerHTML = level.hint || "No hint available for this level.";
  }

  document.getElementById("query").value = level.starterQuery;
  document.getElementById("feedback").innerHTML = "";
  document.getElementById("next-level").innerHTML = "";
  document.getElementById("output").innerHTML = "";
  lastResult = null;
}

window.onload = function() {
  loadLevel(0);
};
