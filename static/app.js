et lastResult = null;
let currentLevel = 1;

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

function loadLevel2() {
    currentLevel = 2;

    document.querySelector(".mission-box").innerHTML = `
        <h2>Level 2: Encounters by Facility</h2>
        <p><strong>Mission:</strong> Count the number of encounters at each facility.</p>
        <p><strong>Goal:</strong> Return facility and count.</p>
    `;

    document.getElementById("query").value =
        "SELECT facility, COUNT(*) as count FROM encounters GROUP BY facility;";

    document.getElementById("feedback").innerHTML = "";
    document.getElementById("next-level").innerHTML = "";
    document.getElementById("output").innerHTML = "";
}
