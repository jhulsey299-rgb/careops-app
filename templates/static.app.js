let currentLevel = 1;

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

        const columnsMatch =
            JSON.stringify(lastResult.columns) === JSON.stringify(expectedColumns);

        const rowsMatch =
            JSON.stringify(lastResult.rows) === JSON.stringify(expectedRows);

        if (columnsMatch && rowsMatch) {
            feedback.innerHTML = "<p style='color:green;'><strong>Correct!</strong> You completed Level 1.</p>";
            nextLevelDiv.innerHTML = "<button onclick='loadLevel2()'>Next Level</button>";
        } else {
            feedback.innerHTML = "<p style='color:red;'><strong>Not quite.</strong></p>";
        }
    }

    if (currentLevel === 2) {
        const expectedColumns = ["facility", "count"];
        const expectedRows = [
            ["TGMH", 2],
            ["Waccamaw", 1]
        ];

        const columnsMatch =
            JSON.stringify(lastResult.columns) === JSON.stringify(expectedColumns);

        const rowsMatch =
            JSON.stringify(lastResult.rows) === JSON.stringify(expectedRows);

        if (columnsMatch && rowsMatch) {
            feedback.innerHTML = "<p style='color:green;'><strong>Correct!</strong> You completed Level 2.</p>";
        } else {
            feedback.innerHTML = "<p style='color:red;'><strong>Try again.</strong></p>";
        }
    }
}
