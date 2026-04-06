from flask import Flask, render_template, request, jsonify
import sqlite3
import os
import random
from datetime import datetime, timedelta

app = Flask(__name__)

DB = "hospital.db"
random.seed(42)


def random_date(start_date, end_date):
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)


def safe_los(admit_date, discharge_date):
    if discharge_date is None:
        return None
    return (discharge_date - admit_date).days

VALID_TABLES = {
    "patients",
    "providers",
    "encounters",
    "appointments",
    "charges",
    "claims"
}

@app.route("/preview/<table_name>")
def preview_table(table_name):
    if table_name not in VALID_TABLES:
        return jsonify({"error": "Invalid table name"}), 400

    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    try:
        cur.execute(f"SELECT * FROM {table_name} LIMIT 8")
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description] if cur.description else []
        return jsonify({"columns": columns, "rows": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

def init_db():
    if os.path.exists(DB):
        os.remove(DB)

    conn = sqlite3.connect(DB)
    c = conn.cursor()

    # Drop tables if they exist
    c.execute("DROP TABLE IF EXISTS patients")
    c.execute("DROP TABLE IF EXISTS providers")
    c.execute("DROP TABLE IF EXISTS encounters")
    c.execute("DROP TABLE IF EXISTS appointments")
    c.execute("DROP TABLE IF EXISTS charges")
    c.execute("DROP TABLE IF EXISTS claims")

    # Create tables
    c.execute("""
        CREATE TABLE patients (
            patient_id INTEGER PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            age INTEGER,
            gender TEXT,
            insurance_type TEXT,
            risk_score INTEGER,
            city TEXT
        )
    """)

    c.execute("""
        CREATE TABLE providers (
            provider_id INTEGER PRIMARY KEY,
            provider_name TEXT,
            specialty TEXT,
            facility TEXT,
            department TEXT,
            years_experience INTEGER
        )
    """)

    c.execute("""
        CREATE TABLE encounters (
            encounter_id INTEGER PRIMARY KEY,
            patient_id INTEGER,
            provider_id INTEGER,
            facility TEXT,
            department TEXT,
            encounter_type TEXT,
            status TEXT,
            admit_date TEXT,
            discharge_date TEXT,
            length_of_stay INTEGER
        )
    """)

    c.execute("""
        CREATE TABLE appointments (
            appointment_id INTEGER PRIMARY KEY,
            patient_id INTEGER,
            provider_id INTEGER,
            facility TEXT,
            department TEXT,
            appointment_date TEXT,
            status TEXT
        )
    """)

    c.execute("""
        CREATE TABLE charges (
            charge_id INTEGER PRIMARY KEY,
            encounter_id INTEGER,
            patient_id INTEGER,
            payer TEXT,
            amount REAL,
            charge_type TEXT,
            charge_date TEXT
        )
    """)

    c.execute("""
        CREATE TABLE claims (
            claim_id INTEGER PRIMARY KEY,
            encounter_id INTEGER,
            patient_id INTEGER,
            payer TEXT,
            claim_status TEXT,
            denial_reason TEXT,
            billed_amount REAL,
            paid_amount REAL
        )
    """)

    first_names = [
        "John", "Jane", "Bob", "Alice", "Michael", "Sarah", "David", "Emily", "Chris", "Laura",
        "James", "Olivia", "Daniel", "Sophia", "Matthew", "Ava", "Andrew", "Mia", "Joshua", "Charlotte"
    ]
    last_names = [
        "Smith", "Doe", "Brown", "Johnson", "Williams", "Jones", "Davis", "Miller", "Wilson", "Taylor",
        "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson"
    ]
    genders = ["Male", "Female"]
    insurance_types = ["Medicare", "Commercial", "Medicaid", "Self-Pay"]
    cities = ["Myrtle Beach", "Georgetown", "Murrells Inlet", "Conway", "Pawleys Island", "Surfside", "Socastee"]
    specialties = ["Cardiology", "Family Medicine", "Hospitalist", "Emergency Medicine", "Orthopedics", "Neurology"]
    facilities = ["TGMH", "Waccamaw", "Market Common", "Carolina Forest"]
    departments = ["Cardiology", "ER", "Med-Surg", "Orthopedics", "Neurology", "Family Medicine"]
    encounter_types = ["Inpatient", "Outpatient", "ED", "Observation"]
    encounter_statuses = ["Active", "Discharged", "Completed"]
    appointment_statuses = ["Completed", "No Show", "Canceled", "Scheduled"]
    charge_types = ["Room Charge", "Lab", "Imaging", "Procedure", "Medication", "Consult"]
    payers = ["Medicare", "Commercial", "Medicaid", "Self-Pay", "UHC", "Humana"]
    denial_reasons = ["Authorization", "Coding", "Medical Necessity", "Eligibility", "Timely Filing", None]

    # Insert patients
    patients = []
    for i in range(1, 1001):
        patients.append((
            i,
            random.choice(first_names),
            random.choice(last_names),
            random.randint(18, 90),
            random.choice(genders),
            random.choice(insurance_types),
            random.randint(1, 100),
            random.choice(cities)
        ))

    c.executemany("""
        INSERT INTO patients (
            patient_id, first_name, last_name, age, gender, insurance_type, risk_score, city
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, patients)

    # Insert providers
    providers = []
    for i in range(1, 1001):
        specialty = random.choice(specialties)
        facility = random.choice(facilities)
        if specialty == "Emergency Medicine":
            department = "ER"
        elif specialty == "Family Medicine":
            department = "Family Medicine"
        else:
            department = specialty

        providers.append((
            i,
            f"Dr. {random.choice(first_names)} {random.choice(last_names)}",
            specialty,
            facility,
            department,
            random.randint(1, 35)
        ))

    c.executemany("""
        INSERT INTO providers (
            provider_id, provider_name, specialty, facility, department, years_experience
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, providers)

    # Insert encounters
    encounters = []
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 4, 1)

    for i in range(1, 1001):
        patient_id = random.randint(1, 1000)
        provider_id = random.randint(1, 1000)
        facility = random.choice(facilities)
        department = random.choice(departments)
        encounter_type = random.choice(encounter_types)
        status = random.choice(encounter_statuses)

        admit = random_date(start_date, end_date)
        if status == "Active":
            discharge = None
            los = None
        else:
            discharge = admit + timedelta(days=random.randint(0, 10))
            los = safe_los(admit, discharge)

        encounters.append((
            i,
            patient_id,
            provider_id,
            facility,
            department,
            encounter_type,
            status,
            admit.strftime("%Y-%m-%d"),
            discharge.strftime("%Y-%m-%d") if discharge else None,
            los
        ))

    c.executemany("""
        INSERT INTO encounters (
            encounter_id, patient_id, provider_id, facility, department, encounter_type,
            status, admit_date, discharge_date, length_of_stay
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, encounters)

    # Insert appointments
    appointments = []
    for i in range(1, 1001):
        patient_id = random.randint(1, 1000)
        provider_id = random.randint(1, 1000)
        facility = random.choice(facilities)
        department = random.choice(departments)
        appt_date = random_date(start_date, end_date)

        appointments.append((
            i,
            patient_id,
            provider_id,
            facility,
            department,
            appt_date.strftime("%Y-%m-%d"),
            random.choice(appointment_statuses)
        ))

    c.executemany("""
        INSERT INTO appointments (
            appointment_id, patient_id, provider_id, facility, department, appointment_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, appointments)

    # Insert charges
    charges = []
    for i in range(1, 1001):
        encounter_id = random.randint(1, 1000)
        patient_id = random.randint(1, 1000)
        payer = random.choice(payers)
        amount = round(random.uniform(75, 15000), 2)
        charge_type = random.choice(charge_types)
        charge_date = random_date(start_date, end_date)

        charges.append((
            i,
            encounter_id,
            patient_id,
            payer,
            amount,
            charge_type,
            charge_date.strftime("%Y-%m-%d")
        ))

    c.executemany("""
        INSERT INTO charges (
            charge_id, encounter_id, patient_id, payer, amount, charge_type, charge_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, charges)

    # Insert claims
    claims = []
    for i in range(1, 1001):
        encounter_id = random.randint(1, 1000)
        patient_id = random.randint(1, 1000)
        payer = random.choice(payers)
        claim_status = random.choices(
            ["Paid", "Denied", "Pending"],
            weights=[60, 20, 20],
            k=1
        )[0]

        billed_amount = round(random.uniform(100, 20000), 2)

        if claim_status == "Paid":
            paid_amount = billed_amount
            denial_reason = None
        elif claim_status == "Denied":
            paid_amount = 0.0
            denial_reason = random.choice([r for r in denial_reasons if r is not None])
        else:
            paid_amount = round(billed_amount * random.uniform(0, 0.8), 2)
            denial_reason = None

        claims.append((
            i,
            encounter_id,
            patient_id,
            payer,
            claim_status,
            denial_reason,
            billed_amount,
            paid_amount
        ))

    c.executemany("""
        INSERT INTO claims (
            claim_id, encounter_id, patient_id, payer, claim_status,
            denial_reason, billed_amount, paid_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, claims)

    conn.commit()
    conn.close()


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


init_db()

if __name__ == "__main__":
    app.run()
