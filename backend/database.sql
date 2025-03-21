CREATE DATABASE IF NOT EXISTS workout_tracker;
USE workout_tracker;


CREATE TABLE IF NOT EXISTS workouts (
	id INT AUTO_INCREMENT PRIMARY KEY,
    workout_day VARCHAR(50) NOT NULL,
    date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
	id INT AUTO_INCREMENT PRIMARY KEY,
    workout_id INT NOT NULL,
    exercise_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );
    
CREATE TABLE IF NOT EXISTS sets (
	id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id INT NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    reps INT NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);