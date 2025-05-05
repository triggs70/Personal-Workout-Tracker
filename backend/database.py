import sqlite3
import os

DB_FILE = os.path.join(os.path.dirname(__file__), "database.sqlite3")

def connect():
    return sqlite3.connect(DB_FILE, check_same_thread=False)

def init_db():
    conn = connect()
    cursor = conn.cursor()
    filepath = os.path.join(os.path.dirname(__file__), "../database.sql")
    with open(filepath, "r") as f:
        script = f.read()
    cursor.executescript(script)
    conn.commit()
    conn.close()

def add_workout(workout_day, date, exercises):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO workouts (workout_day, date) VALUES (?, ?)", (workout_day, date))
    workout_id = cursor.lastrowid
    for exercise in exercises:
        cursor.execute("INSERT INTO exercises (workout_id, exercise_name) VALUES (?, ?)", (workout_id, exercise["exercise_name"]))
        exercise_id = cursor.lastrowid
        for set in exercise["sets"]:
            cursor.execute("INSERT INTO sets (exercise_id, weight, reps) VALUES (?, ?, ?)", (exercise_id, set["weight"], set["reps"]))
    conn.commit()
    conn.close()

def get_workouts():
    conn = connect()
    cursor = conn.cursor()
    cursor.row_factory = sqlite3.Row
    cursor.execute("""
        SELECT w.id AS workout_id, w.workout_day, w.date,
               e.id AS exercise_id, e.exercise_name,
               s.weight, s.reps
        FROM workouts w
        LEFT JOIN exercises e ON w.id = e.workout_id
        LEFT JOIN sets s ON e.id = s.exercise_id
        ORDER BY w.date DESC, e.id ASC, s.id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    workouts = {}
    for row in rows:
        wid = row["workout_id"]
        if wid not in workouts:
            workouts[wid] = {
                "id": wid,
                "workout_day": row["workout_day"],
                "date": row["date"],
                "exercises": []
            }
        ex_list = workouts[wid]["exercises"]
        if not ex_list or ex_list[-1]["exercise_name"] != row["exercise_name"]:
            ex_list.append({"exercise_name": row["exercise_name"], "sets": []})
        if row["weight"] and row["reps"]:
            ex_list[-1]["sets"].append({"weight": row["weight"], "reps": row["reps"]})
    return list(workouts.values())

def update_workout_db(workout_id, workout_day, date, exercises):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE workouts SET workout_day = ?, date = ? WHERE id = ?", (workout_day, date, workout_id))
    cursor.execute("DELETE FROM sets WHERE exercise_id IN (SELECT id FROM exercises WHERE workout_id = ?)", (workout_id,))
    cursor.execute("DELETE FROM exercises WHERE workout_id = ?", (workout_id,))
    for ex in exercises:
        cursor.execute("INSERT INTO exercises (workout_id, exercise_name) VALUES (?, ?)", (workout_id, ex["exercise_name"]))
        exercise_id = cursor.lastrowid
        for set in ex["sets"]:
            cursor.execute("INSERT INTO sets (exercise_id, weight, reps) VALUES (?, ?, ?)", (exercise_id, set["weight"], set["reps"]))
    conn.commit()
    conn.close()

def delete_workout_db(workout_id):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM workouts WHERE id = ?", (workout_id,))
    conn.commit()
    conn.close()

def get_progress(exercise_name):
    conn = connect()
    cursor = conn.cursor()
    cursor.row_factory = sqlite3.Row
    cursor.execute("""
        SELECT w.date, s.weight, s.reps
        FROM workouts w
        JOIN exercises e ON w.id = e.workout_id
        JOIN sets s ON e.id = s.exercise_id
        WHERE e.exercise_name = ?
        ORDER BY w.date
    """, (exercise_name,))
    data = cursor.fetchall()
    conn.close()
    return [{"date": row["date"], "weight": row["weight"], "reps": row["reps"]} for row in data]

