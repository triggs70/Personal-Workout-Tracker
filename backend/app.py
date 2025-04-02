from flask import Flask, request, jsonify
from flask_cors import CORS
from database import connect, add_workout, get_workouts, get_progress, update_workout_db, delete_workout_db

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to workout tracker api"})

@app.route("/workouts", methods=["POST"])
def log_workout():
    data = request.json
    if not all(k in data for k in ["workout_day", "exercises", "date"]):
        return jsonify({"error": "Missing required fields"}), 400

    workout_day = data["workout_day"]
    date = data["date"]
    exercises = data["exercises"]
    try:
        add_workout(workout_day, date, exercises)
        return jsonify({"message": "Workout logged"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/workouts", methods=["GET"])
def fetch_workouts():
    try: 
        workouts = get_workouts()
        return jsonify(workouts), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/workouts/<int:workout_id>", methods=["PUT"])
def update_workout(workout_id):
    data = request.json
    if not all (k in data for k in ["workout_day", "exercises"]):
        return jsonify({"error": "Missing required fields"}), 400
    workout_day = data["workout_day"]
    date = data["date"]
    exercises = data["exercises"]
    try:
        update_workout_db(workout_id, workout_day, date, exercises)
        return jsonify({"message": "Workout updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/workouts/<int:workout_id>", methods=["DELETE"])
def delete_workout(workout_id):
    try: 
        delete_workout_db(workout_id)
        return jsonify({"message": "Workout deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/progress/<exercise_name>", methods=["GET"])
def fetch_progress(exercise_name):
    try:
        progress = get_progress(exercise_name)
        return jsonify(progress), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/exercises", methods=["GET"])
def get_exercise_names():
    conn = connect()
    cursor=conn.cursor()
    cursor.execute("SELECT DISTINCT exercise_name FROM exercises ORDER BY exercise_name ASC")
    result = [row[0] for row in cursor.fetchall()]
    conn.close()
    return jsonify(result)

if __name__=="__main__":
    app.run(debug=True)