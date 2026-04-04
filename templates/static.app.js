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
        return;
    }

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
