let lastResult = null;
let currentLevel = 0;

const levels = [
    {
        title: "Level 1: Medicare Population",
        mission: "Return all patients with Medicare insurance.",
        goal: "Show patient_id, first_name, last_name, and insurance_type.",
        starterQuery: "SELECT patient_id, first_name, last_name, insurance_type FROM patients WHERE insurance_type = 'Medicare';",
        expectedColumns: ["patient_id", "first_name", "last_name", "insurance_type"],
        expectedRows: [
            [1, "John", "Smith", "Medicare"],
            [3, "Bob", "Brown", "Medicare"]
        ]
    },
    {
        title: "Level 2: Encounters by Facility",
        mission: "Count the number of encounters at each facility.",
        goal: "Return facility and count.",
        starterQuery: "SELECT facility, COUNT(*) as count FROM encounters GROUP BY facility;",
        expectedColumns: ["facility", "count"],
        expectedRows: [
            ["TGMH", 2],
            ["Waccamaw", 1]
        ]
    },
    {
        title: "Level 3: Active Cardiology Patients",
        mission: "Find all active patients currently in Cardiology.",
        goal: "Show encounter_id, patient_id, department, and status.",
        starterQuery: "SELECT encounter_id, patient_id, department, status FROM encounters WHERE department = 'Cardiology' AND status = 'Active';",
        expectedColumns: ["encounter_id", "patient_id", "department", "status"],
        expectedRows: [
            [1, 1, "Cardiology", "Active"],
            [3, 3, "Cardiology", "Active"]
        ]
    },
    {
        title: "Level 4: Discharged Encounters",
        mission: "Return all discharged encounters.",
        goal: "Show encounter_id, patient_id, department, and discharge_date.",
        starterQuery: "SELECT encounter_id, patient_id, department, discharge_date FROM encounters WHERE status = 'Discharged';",
        expectedColumns: ["encounter_id", "patient_id", "department", "discharge_date"],
        expectedRows: [
            [2, 2, "ER", "2026-03-31"]
        ]
    },
    {
        title: "Level 5: Patients Sorted by Last Name",
        mission: "Return all patients sorted by last name.",
        goal: "Show patient_id, first_name, last_name, and insurance_type ordered by last_name.",
        starterQuery: "SELECT patient_id, first_name, last_name, insurance_type FROM patients ORDER BY last_name;",
        expectedColumns: ["patient_id", "first_name", "last_name", "insurance_type"],
        expectedRows: [
            [3, "Bob", "Brown", "Medicare"],
            [2, "Jane", "Doe", "Commercial"],
            [1, "John", "Smith", "Medicare"]
        ]
    },
    {
        title: "Level 6: Patients by Insurance Type",
        mission: "Count the number of patients by insurance type.",
        goal: "Return insurance_type and count.",
        starterQuery: "SELECT insurance_type, COUNT(*) as count FROM patients GROUP BY insurance_type;",
        expectedColumns: ["insurance_type", "count"],
        expectedRows: [
            ["Commercial", 1],
            ["Medicare", 2]
        ]
    },
    {
        title: "Level 7: Encounters by Department",
        mission: "Count encounters by department.",
        goal: "Return department and count.",
        starterQuery: "SELECT department, COUNT(*) as count FROM encounters GROUP BY department;",
        expectedColumns: ["department", "count"],
        expectedRows: [
            ["Cardiology", 2],
            ["ER", 1]
        ]
    },
    {
        title: "Level 8: Medicare Patients Sorted by First Name",
        mission: "Return only Medicare patients sorted by first name.",
        goal: "Show patient_id, first_name, last_name, and insurance_type ordered by first_name.",
        starterQuery: "SELECT patient_id, first_name, last_name, insurance_type FROM patients WHERE insurance_type = 'Medicare' ORDER BY first_name;",
        expectedColumns: ["patient_id", "first_name", "last_name", "insurance_type"],
        expectedRows: [
            [3, "Bob", "Brown", "Medicare"],
            [1, "John", "Smith", "Medicare"]
        ]
    },
    {
        title: "Level 9: Non-Cardiology Encounters",
        mission: "Return all encounters that are not in Cardiology.",
        goal: "Show encounter_id, patient_id, department, and status.",
        starterQuery: "SELECT encounter_id, patient_id, department, status FROM encounters WHERE department != 'Cardiology';",
        expectedColumns: ["encounter_id", "patient_id", "department", "status"],
        expectedRows: [
            [2, 2, "ER", "Discharged"]
        ]
    },
    {
        title: "Level 10: Active Encounters by Department",
        mission: "Count active encounters by department.",
        goal: "Return department and count for active encounters only.",
        starterQuery: "SELECT department, COUNT(*) as count FROM encounters WHERE status = 'Active' GROUP BY department;",
        expectedColumns: ["department", "count"],
        expectedRows: [
            ["Cardiology", 2]
        ]
    }
];

async function runQuery() {
    const query = document.getElementById("query").value;

    const res = await fetch("/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query })
    });

    const data = await res.json();
    const output = document.getElementById("output");

    if (data.error) {
        output.innerText = data.error;
        lastResult = null;
        return;
    }

    lastResult = data;

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

function checkAnswer() {
    const feedback = document.getElementById("feedback");
    const nextLevelDiv = document.getElementById("next-level");

    if (!lastResult) {
        feedback.innerHTML = "<p style='color:red;'><strong>Run your query first.</strong></p>";
        return;
    }

    const level = levels[currentLevel];

    const columnsMatch = JSON.stringify(lastResult.columns) === JSON.stringify(level.expectedColumns);
    const rowsMatch = JSON.stringify(lastResult.rows) === JSON.stringify(level.expectedRows);

    if (columnsMatch && rowsMatch) {
        feedback.innerHTML = "<p style='color:green;'><strong>Correct!</strong> You completed " + level.title + ".</p>";

        if (currentLevel < levels.length - 1) {
            nextLevelDiv.innerHTML = '<button onclick="loadLevel(' + (currentLevel + 1) + ')">Next Level</button>';
        } else {
            nextLevelDiv.innerHTML = "<p><strong>You completed all 10 levels.</strong></p>";
        }
    } else {
        feedback.innerHTML = "<p style='color:red;'><strong>Not quite.</strong> Check your filters, ordering, and columns.</p>";
        nextLevelDiv.innerHTML = "";
    }
}

function loadLevel(index) {
    currentLevel = index;
    const level = levels[index];

    document.querySelector(".mission-box").innerHTML =
        "<h2>" + level.title + "</h2>" +
        "<p><strong>Mission:</strong> " + level.mission + "</p>" +
        "<p><strong>Goal:</strong> " + level.goal + "</p>";


    document.getElementById("query").value = level.starterQuery;
    document.getElementById("feedback").innerHTML = "";
    document.getElementById("next-level").innerHTML = "";
    document.getElementById("output").innerHTML = "";
    lastResult = null;
}

window.onload = function() {
    loadLevel(0);
};
