import mysql.connector
import os 
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DB", "workout_tracker")
}

def connect():
    return mysql.connector.connect(**DB_CONFIG)

def init_db():
    conn = connect()
    cursor = conn.cursor()
    filepath = os.path.join(os.path.dirname(__file__), "database.sql")
    with open(filepath, "r") as file:
        script = file.read()
    for statement in script.split(";"):
        if statement.strip():
            cursor.execute(statement)
    conn.commit()
    cursor.close()
    conn.close()

def add_workout(workout_day, date, exercises):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO workouts (workout_day, date) VALUES (%s, %s)", (workout_day, date))
    workout_id = cursor.lastrowid
    for exercise in exercises:
        exercise_name = exercise["exercise_name"]
        cursor.execute("INSERT INTO exercises (workout_id, exercise_name) VALUES (%s, %s)", (workout_id, exercise_name))
        exercise_id= cursor.lastrowid
        for data in exercise["sets"]:
            weight = data["weight"]
            reps = data["reps"]
            cursor.execute("INSERT INTO sets (exercise_id, weight, reps) VALUES (%s, %s, %s)", (exercise_id, weight, reps))
    conn.commit()
    cursor.close()
    conn.close()

def get_workouts():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT w.id AS workout_id, w.workout_day, w.date,
            e.id AS exercise_id, e.exercise_name,
            s.weight, s.reps
        FROM workouts w
        LEFT JOIN exercises e ON w.id = e.workout_id
        LEFT JOIN sets s ON e.id = s.exercise_id
        ORDER BY w.date DESC, e.id ASC, s.id ASC
    """)
    data = cursor.fetchall()
    conn.close()
    workouts = {}
    for row in data:
        workout_id = row["workout_id"]
        if workout_id not in workouts:
            workouts[workout_id] = {
                "id": workout_id,
                "workout_day": row["workout_day"],
                "date": row["date"].strftime("%Y-%m-%d"),
                "exercises": []
            }
        exercise_list = workouts[workout_id]["exercises"]
        if not exercise_list or exercise_list[-1]["exercise_name"] != row["exercise_name"]:
            exercise_list.append({
                "exercise_name": row["exercise_name"],
                "sets": []
            })
        if row["weight"] and row["reps"]:
            exercise_list[-1]["sets"].append({
                "weight": row["weight"],
                "reps": row["reps"]
            })
    return list(workouts.values())

def get_progress(exercise_name):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT w.date, s.weight, s.reps
        FROM workouts w
        JOIN exercises e ON w.id = e.workout_id
        JOIN sets s ON e.id = s.exercise_id
        WHERE e.exercise_name = %s AND
            (s.weight * s.reps) = (
                SELECT MAX(s2.weight * s2.reps)
                FROM exercises e2
                JOIN sets s2 ON e2.id = s2.exercise_id
                WHERE e2.workout_id = w.id AND e2.exercise_name = %s
                )
        ORDER BY w.date
    """, (exercise_name, exercise_name))
    data = cursor.fetchall()
    conn.close()
    return [{"date": row["date"], "weight": row["weight"], "reps": row["reps"]} for row in data]

def update_workout_db(workout_id, workout_day, date, exercises):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE workouts SET workout_day = %s, date = %s WHERE id = %s", (workout_day, date, workout_id))
    cursor.execute("DELETE FROM sets WHERE exercise_id IN (SELECT id FROM exercises WHERE workout_id = %s)", (workout_id,))
    cursor.execute("DELETE FROM exercises WHERE workout_id = %s", (workout_id,))
    for exercise in exercises:
        exercise_name = exercise["exercise_name"]
        cursor.execute("INSERT INTO exercises (workout_id, exercise_name) VALUES (%s, %s)", (workout_id, exercise_name))
        exercise_id = cursor.lastrowid
        for data in exercise["sets"]:
            weight = data["weight"]
            reps = data["reps"]
            cursor.execute("INSERT INTO sets (exercise_id, weight, reps) VALUES (%s, %s, %s)", (exercise_id, weight, reps))
    conn.commit()
    cursor.close()
    conn.close()

def delete_workout_db(workout_id):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM workouts WHERE id = %s", (workout_id,))
    conn.commit()
    cursor.close()
    conn.close()

if __name__== "__main__":
    try:
        init_db()
        print("Database initialized")
    except Exception as e:
        print(f"Database initialization failed: {e}")    
    

