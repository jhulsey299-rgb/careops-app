let lastResult = null;
let currentLevel = 1;

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
    data.columns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += "</tr>";

    data.rows.forEach(row => {
        html += "<tr>";
        row.forEach(cell => {
            html += `<td>${cell}</td>`;
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

    if (currentLevel === 1) {
        const expectedColumns = ["patient_id", "first_name", "last_name", "insurance_type"];
        const expectedRows = [
            [1, "John", "Smith", "Medicare"],
            [3, "Bob", "Brown", "Medicare"]
        ];

        const columnsMatch = JSON.stringify(lastResult.columns) === JSON.stringify(expectedColumns);
        const rowsMatch = JSON.stringify(lastResult.rows) === JSON.stringify(expectedRows);

        if (columnsMatch && rowsMatch) {
            feedback.innerHTML = "<p style='color:green;'><strong>Correct!</strong> You completed Level 1.</p>";
            nextLevelDiv.innerHTML = "<button onclick='loadLevel2()'>Next Level</button>";
        } else {
            feedback.innerHTML = "<p style='color:red;'><strong>Not quite.</strong></p>";
        }
    } else if (currentLevel === 2) {
        const expectedColumns = ["facility", "count"];
        const expectedRows = [
            ["TGMH", 2],
            ["Waccamaw", 1]
        ];

        const columnsMatch = JSON.stringify(lastResult.columns) === JSON.stringify(expectedColumns);
        const rowsMatch = JSON.stringify(lastResult.rows) === JSON.stringify(expectedRows);

        if (columnsMatch && rowsMatch) {
            feedback.innerHTML = "<p style='color:green;'><strong>Correct!</strong> You completed Level 2.</p>";
        } else {
            feedback.innerHTML = "<p style='color:red;'><strong>Try again.</strong></p>";
        }
    }
}

function loadLevel2() {
    currentLevel = 2;

    document.querySelector(".mission-box").innerHTML = `
        <h2>Level 2: Encounters by Facility</h2>
        <p><strong>Mission:</strong> Count the number of encounters at each facility.</p>
        <p><strong>Goal:</strong> Return facility and count.</p>
    `;

    document.getElementById("query").value = "SELECT facility, COUNT(*) as count FROM encounters GROUP BY facility;";
    document.getElementById("feedback").innerHTML = "";
    document.getElementById("next-level").innerHTML = "";
    document.getElementById("output").innerHTML = "";
    lastResult = null;
}
