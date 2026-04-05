let lastResult = null;
let currentLevel = 0;

const levels = [
    // EASY: 1-5
    {
        title: "Level 1: Medicare Population",
        mission: "Return all patients with Medicare insurance.",
        goal: "Show patient_id, first_name, last_name, and insurance_type.",
        starterQuery: `SELECT patient_id, first_name, last_name, insurance_type
FROM patients
WHERE insurance_type = 'Medicare';`,
        solutionQuery: `SELECT patient_id, first_name, last_name, insurance_type
FROM patients
WHERE insurance_type = 'Medicare';`
    },
    {
        title: "Level 2: Encounters by Facility",
        mission: "Count the number of encounters at each facility.",
        goal: "Return facility and count.",
        starterQuery: `SELECT facility, COUNT(*) AS count
FROM encounters
GROUP BY facility;`,
        solutionQuery: `SELECT facility, COUNT(*) AS count
FROM encounters
GROUP BY facility;`
    },
    {
        title: "Level 3: Active Cardiology Patients",
        mission: "Find all active encounters currently in Cardiology.",
        goal: "Show encounter_id, patient_id, department, and status.",
        starterQuery: `SELECT encounter_id, patient_id, department, status
FROM encounters
WHERE department = 'Cardiology'
  AND status = 'Active';`,
        solutionQuery: `SELECT encounter_id, patient_id, department, status
FROM encounters
WHERE department = 'Cardiology'
  AND status = 'Active';`
    },
    {
        title: "Level 4: Discharged Encounters",
        mission: "Return all discharged encounters.",
        goal: "Show encounter_id, patient_id, department, and discharge_date.",
        starterQuery: `SELECT encounter_id, patient_id, department, discharge_date
FROM encounters
WHERE status = 'Discharged';`,
        solutionQuery: `SELECT encounter_id, patient_id, department, discharge_date
FROM encounters
WHERE status = 'Discharged';`
    },
    {
        title: "Level 5: Patients Sorted by Last Name",
        mission: "Return all patients sorted by last name, then first name.",
        goal: "Show patient_id, first_name, last_name, and insurance_type.",
        starterQuery: `SELECT patient_id, first_name, last_name, insurance_type
FROM patients
ORDER BY last_name, first_name;`,
        solutionQuery: `SELECT patient_id, first_name, last_name, insurance_type
FROM patients
ORDER BY last_name, first_name;`
    },

    // INTERMEDIATE: 6-10
    {
        title: "Level 6: Patients by Insurance Type",
        mission: "Count patients by insurance type.",
        goal: "Return insurance_type and patient_count.",
        starterQuery: `SELECT insurance_type, COUNT(*) AS patient_count
FROM patients
GROUP BY insurance_type;`,
        solutionQuery: `SELECT insurance_type, COUNT(*) AS patient_count
FROM patients
GROUP BY insurance_type;`
    },
    {
        title: "Level 7: No-Show Appointments by Facility",
        mission: "Count no-show appointments by facility.",
        goal: "Return facility and no_show_count.",
        starterQuery: `SELECT facility, COUNT(*) AS no_show_count
FROM appointments
WHERE status = 'No Show'
GROUP BY facility;`,
        solutionQuery: `SELECT facility, COUNT(*) AS no_show_count
FROM appointments
WHERE status = 'No Show'
GROUP BY facility;`
    },
    {
        title: "Level 8: Charges by Payer",
        mission: "Calculate total charged dollars by payer.",
        goal: "Return payer and total_amount.",
        starterQuery: `SELECT payer, ROUND(SUM(amount), 2) AS total_amount
FROM charges
GROUP BY payer;`,
        solutionQuery: `SELECT payer, ROUND(SUM(amount), 2) AS total_amount
FROM charges
GROUP BY payer;`
    },
    {
        title: "Level 9: Average LOS by Facility",
        mission: "Calculate average length of stay for completed encounters by facility.",
        goal: "Return facility and avg_los.",
        starterQuery: `SELECT facility, ROUND(AVG(length_of_stay), 2) AS avg_los
FROM encounters
WHERE length_of_stay IS NOT NULL
GROUP BY facility;`,
        solutionQuery: `SELECT facility, ROUND(AVG(length_of_stay), 2) AS avg_los
FROM encounters
WHERE length_of_stay IS NOT NULL
GROUP BY facility;`
    },
    {
        title: "Level 10: ER Encounters by Status",
        mission: "Count ER encounters by status.",
        goal: "Return status and encounter_count.",
        starterQuery: `SELECT status, COUNT(*) AS encounter_count
FROM encounters
WHERE department = 'ER'
GROUP BY status;`,
        solutionQuery: `SELECT status, COUNT(*) AS encounter_count
FROM encounters
WHERE department = 'ER'
GROUP BY status;`
    },

    // HARD: 11-15
    {
        title: "Level 11: Encounters with Patient Names",
        mission: "Join encounters to patients.",
        goal: "Show encounter_id, first_name, last_name, facility, and department for discharged encounters.",
        starterQuery: `SELECT e.encounter_id, p.first_name, p.last_name, e.facility, e.department
FROM encounters e
JOIN patients p
  ON e.patient_id = p.patient_id
WHERE e.status = 'Discharged';`,
        solutionQuery: `SELECT e.encounter_id, p.first_name, p.last_name, e.facility, e.department
FROM encounters e
JOIN patients p
  ON e.patient_id = p.patient_id
WHERE e.status = 'Discharged';`
    },
    {
        title: "Level 12: Visits per Provider",
        mission: "Count encounters for each provider.",
        goal: "Return provider_name and visit_count, highest to lowest.",
        starterQuery: `SELECT pr.provider_name, COUNT(*) AS visit_count
FROM encounters e
JOIN providers pr
  ON e.provider_id = pr.provider_id
GROUP BY pr.provider_name
ORDER BY visit_count DESC, pr.provider_name;`,
        solutionQuery: `SELECT pr.provider_name, COUNT(*) AS visit_count
FROM encounters e
JOIN providers pr
  ON e.provider_id = pr.provider_id
GROUP BY pr.provider_name
ORDER BY visit_count DESC, pr.provider_name;`
    },
    {
        title: "Level 13: Patients Without Scheduled Appointments",
        mission: "Find patients who have never had an appointment.",
        goal: "Show patient_id, first_name, and last_name.",
        starterQuery: `SELECT p.patient_id, p.first_name, p.last_name
FROM patients p
LEFT JOIN appointments a
  ON p.patient_id = a.patient_id
WHERE a.appointment_id IS NULL;`,
        solutionQuery: `SELECT p.patient_id, p.first_name, p.last_name
FROM patients p
LEFT JOIN appointments a
  ON p.patient_id = a.patient_id
WHERE a.appointment_id IS NULL;`
    },
    {
        title: "Level 14: Denied Claims by Payer",
        mission: "Count denied claims and sum billed dollars by payer.",
        goal: "Return payer, denied_claims, and denied_billed_amount.",
        starterQuery: `SELECT payer,
       COUNT(*) AS denied_claims,
       ROUND(SUM(billed_amount), 2) AS denied_billed_amount
FROM claims
WHERE claim_status = 'Denied'
GROUP BY payer;`,
        solutionQuery: `SELECT payer,
       COUNT(*) AS denied_claims,
       ROUND(SUM(billed_amount), 2) AS denied_billed_amount
FROM claims
WHERE claim_status = 'Denied'
GROUP BY payer;`
    },
    {
        title: "Level 15: Charges by Provider Specialty",
        mission: "Sum total charge dollars by provider specialty using encounters and providers.",
        goal: "Return specialty and total_charge_amount.",
        starterQuery: `SELECT pr.specialty,
       ROUND(SUM(ch.amount), 2) AS total_charge_amount
FROM charges ch
JOIN encounters e
  ON ch.encounter_id = e.encounter_id
JOIN providers pr
  ON e.provider_id = pr.provider_id
GROUP BY pr.specialty;`,
        solutionQuery: `SELECT pr.specialty,
       ROUND(SUM(ch.amount), 2) AS total_charge_amount
FROM charges ch
JOIN encounters e
  ON ch.encounter_id = e.encounter_id
JOIN providers pr
  ON e.provider_id = pr.provider_id
GROUP BY pr.specialty;`
    },

    // ADVANCED: 16-20
    {
        title: "Level 16: 30-Day Readmissions",
        mission: "Identify patients who had another encounter within 30 days after discharge.",
        goal: "Show distinct patient_id values.",
        starterQuery: `SELECT DISTINCT e1.patient_id
FROM encounters e1
JOIN encounters e2
  ON e1.patient_id = e2.patient_id
 AND e2.admit_date > e1.discharge_date
 AND julianday(e2.admit_date) - julianday(e1.discharge_date) <= 30
WHERE e1.discharge_date IS NOT NULL
ORDER BY e1.patient_id;`,
        solutionQuery: `SELECT DISTINCT e1.patient_id
FROM encounters e1
JOIN encounters e2
  ON e1.patient_id = e2.patient_id
 AND e2.admit_date > e1.discharge_date
 AND julianday(e2.admit_date) - julianday(e1.discharge_date) <= 30
WHERE e1.discharge_date IS NOT NULL
ORDER BY e1.patient_id;`
    },
    {
        title: "Level 17: Top Denied Dollars by Facility",
        mission: "Find denied billed dollars by facility.",
        goal: "Return facility and denied_amount ordered highest to lowest.",
        starterQuery: `SELECT e.facility,
       ROUND(SUM(c.billed_amount), 2) AS denied_amount
FROM claims c
JOIN encounters e
  ON c.encounter_id = e.encounter_id
WHERE c.claim_status = 'Denied'
GROUP BY e.facility
ORDER BY denied_amount DESC, e.facility;`,
        solutionQuery: `SELECT e.facility,
       ROUND(SUM(c.billed_amount), 2) AS denied_amount
FROM claims c
JOIN encounters e
  ON c.encounter_id = e.encounter_id
WHERE c.claim_status = 'Denied'
GROUP BY e.facility
ORDER BY denied_amount DESC, e.facility;`
    },
    {
        title: "Level 18: High-Risk Patients with Multiple ER Visits",
        mission: "Find high-risk patients with more than one ER encounter.",
        goal: "Show patient_id, first_name, last_name, risk_score, and er_visits.",
        starterQuery: `SELECT p.patient_id,
       p.first_name,
       p.last_name,
       p.risk_score,
       COUNT(*) AS er_visits
FROM patients p
JOIN encounters e
  ON p.patient_id = e.patient_id
WHERE e.department = 'ER'
  AND p.risk_score >= 70
GROUP BY p.patient_id, p.first_name, p.last_name, p.risk_score
HAVING COUNT(*) > 1
ORDER BY er_visits DESC, p.patient_id;`,
        solutionQuery: `SELECT p.patient_id,
       p.first_name,
       p.last_name,
       p.risk_score,
       COUNT(*) AS er_visits
FROM patients p
JOIN encounters e
  ON p.patient_id = e.patient_id
WHERE e.department = 'ER'
  AND p.risk_score >= 70
GROUP BY p.patient_id, p.first_name, p.last_name, p.risk_score
HAVING COUNT(*) > 1
ORDER BY er_visits DESC, p.patient_id;`
    },
    {
        title: "Level 19: Patients with Appointments but No Completed Encounter",
        mission: "Find patients who had a completed appointment but no completed encounter.",
        goal: "Show distinct patient_id, first_name, and last_name.",
        starterQuery: `SELECT DISTINCT p.patient_id, p.first_name, p.last_name
FROM patients p
JOIN appointments a
  ON p.patient_id = a.patient_id
LEFT JOIN encounters e
  ON p.patient_id = e.patient_id
 AND e.status = 'Completed'
WHERE a.status = 'Completed'
  AND e.encounter_id IS NULL
ORDER BY p.patient_id;`,
        solutionQuery: `SELECT DISTINCT p.patient_id, p.first_name, p.last_name
FROM patients p
JOIN appointments a
  ON p.patient_id = a.patient_id
LEFT JOIN encounters e
  ON p.patient_id = e.patient_id
 AND e.status = 'Completed'
WHERE a.status = 'Completed'
  AND e.encounter_id IS NULL
ORDER BY p.patient_id;`
    },
    {
        title: "Level 20: Rank Providers by Encounter Volume",
        mission: "Rank providers by total encounter volume.",
        goal: "Return provider_name, specialty, encounter_count, and volume_rank.",
        starterQuery: `SELECT provider_name,
       specialty,
       encounter_count,
       RANK() OVER (ORDER BY encounter_count DESC) AS volume_rank
FROM (
    SELECT pr.provider_name,
           pr.specialty,
           COUNT(*) AS encounter_count
    FROM providers pr
    JOIN encounters e
      ON pr.provider_id = e.provider_id
    GROUP BY pr.provider_id, pr.provider_name, pr.specialty
) t
ORDER BY volume_rank, provider_name;`,
        solutionQuery: `SELECT provider_name,
       specialty,
       encounter_count,
       RANK() OVER (ORDER BY encounter_count DESC) AS volume_rank
FROM (
    SELECT pr.provider_name,
           pr.specialty,
           COUNT(*) AS encounter_count
    FROM providers pr
    JOIN encounters e
      ON pr.provider_id = e.provider_id
    GROUP BY pr.provider_id, pr.provider_name, pr.specialty
) t
ORDER BY volume_rank, provider_name;`
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
