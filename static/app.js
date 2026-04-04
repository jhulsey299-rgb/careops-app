let lastResult = null;

async function runQuery() {
    const query = document.getElementById("query").value;

    const res = await fetch("/query", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({query})
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
    data.columns.forEach(col => html += `<th>${col}</th>`);
    html += "</tr>";

    data.rows.forEach(row => {
        html += "<tr>";
        row.forEach(cell => html += `<td>${cell}</td>`);
        html += "</tr>";
    });

    html += "</table>";

    output.innerHTML = html;
}

function checkAnswer() {
    const feedback = document.getElementById("feedback");

    if (!lastResult) {
        feedback.innerHTML = "<p style='color:red;'><strong>Run your query first.</strong></p>";
        return;
    }

    const expectedColumns = ["patient_id", "first_name", "last_name", "insurance_type"];
    const expectedRows = [
        [1, "John", "Smith", "Medicare"],
        [3, "Bob", "Brown", "Medicare"]
    ];

    const columnsMatch =
        JSON.stringify(lastResult.columns) === JSON.stringify(expectedColumns);

    const rowsMatch =
        JSON.stringify(lastResult.rows) === JSON.stringify(expectedRows);

    if (columnsMatch && rowsMatch) {
        feedback.innerHTML = "<p style='color:green;'><strong>Correct!</strong> You completed Level 1.</p>";
    } else {
        feedback.innerHTML = "<p style='color:red;'><strong>Not quite.</strong> Make sure you return only Medicare patients and include the correct columns.</p>";
    }
}
