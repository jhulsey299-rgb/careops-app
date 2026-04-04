from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)

DB = "hospital.db"

def init_db():
    if os.path.exists(DB):
        return
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("CREATE TABLE patients (patient_id INTEGER, first_name TEXT, last_name TEXT, insurance_type TEXT)")
    c.execute("CREATE TABLE encounters (encounter_id INTEGER, patient_id INTEGER, department TEXT, status TEXT, admit_date TEXT, discharge_date TEXT, facility TEXT)")

    patients = [
        (1, "John", "Smith", "Medicare"),
        (2, "Jane", "Doe", "Commercial"),
        (3, "Bob", "Brown", "Medicare")
    ]

    encounters = [
        (1, 1, "Cardiology", "Active", "2026-04-01", None, "TGMH"),
        (2, 2, "ER", "Discharged", "2026-03-30", "2026-03-31", "Waccamaw"),
        (3, 3, "Cardiology", "Active", "2026-04-02", None, "TGMH")
    ]

    c.executemany("INSERT INTO patients VALUES (?, ?, ?, ?)", patients)
    c.executemany("INSERT INTO encounters VALUES (?, ?, ?, ?, ?, ?, ?)", encounters)

    conn.commit()
    conn.close()

init_db()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/query", methods=["POST"])
def query():
    sql = request.json.get("query", "")
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    try:
        cur.execute(sql)
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description] if cur.description else []
        return jsonify({"columns": columns, "rows": rows})
    except Exception as e:
        return jsonify({"error": str(e)})
    finally:
        conn.close()

if __name__ == "__main__":
    app.run()
