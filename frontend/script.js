const exercisesCont = document.getElementById("exercises-container");
const addExerciseBtn = document.getElementById("add-exercise");
const workoutForm = document.getElementById("workout-form");
const cancelEdit = document.getElementById("cancel-edit");
let editingWorkoutId = null;

addExerciseBtn.addEventListener("click", () => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("exercise-wrapper");
    const header = document.createElement("div");
    header.classList.add("exercise-header");
    header.innerHTML = `
        <span>New Exercise</span>
        <button type="button" class="toggle-exercise">–</button>
    `;
    const exerciseDiv = document.createElement("div");
    exerciseDiv.classList.add("exercise");
    exerciseDiv.innerHTML = `
        <label>Exercise Name: <input type="text" class="exercise-name" list="exercise-list" required></label>
        <div class="sets-container"></div>
        <button type="button" class="add-set-btn">+ Add Set</button>
        <button type="button" class="remove-exercise-btn">Remove Exercise</button>
        <hr>
    `;
    header.querySelector(".toggle-exercise").addEventListener("click", () => {
        exerciseDiv.classList.toggle("collapsed");
    });
    exerciseDiv.querySelector(".remove-exercise-btn").addEventListener("click", () => {
        wrapper.remove();
    });
    const setsCont = exerciseDiv.querySelector(".sets-container");
    const addSet = (weight = "", reps = "") => {
        const setDiv = document.createElement("div");
        setDiv.classList.add("set");
        setDiv.innerHTML = `
            <label>Weight: <input type="number" class="set-weight" required value="${weight}"></label>
            <label>Reps: <input type="number" class="set-reps" required value="${reps}"></label>
            <button type="button" class="remove-set-btn">Remove Set</button>
        `;
        setDiv.querySelector(".remove-set-btn").addEventListener("click", () => setDiv.remove());
        setsCont.appendChild(setDiv);
    };
    addSet();
    exerciseDiv.querySelector(".add-set-btn").addEventListener("click", () => addSet());
    wrapper.appendChild(header);
    wrapper.appendChild(exerciseDiv);
    exercisesCont.appendChild(wrapper);
});


workoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("workout-date").value;
    const day = document.getElementById("workout-day").value;
    const exercises = [];
    document.querySelectorAll(".exercise").forEach(exerciseEle => {
        const name = exerciseEle.querySelector(".exercise-name").value;
        const sets =[];
        exerciseEle.querySelectorAll(".set").forEach(setEle => {
            const weight = parseFloat(setEle.querySelector(".set-weight").value);
            const reps = parseInt(setEle.querySelector(".set-reps").value);
            sets.push({weight, reps});
        });
        exercises.push({exercise_name: name, sets});
    });
    const payload = {workout_day: day, date: date, exercises: exercises};
    const url = editingWorkoutId
        ? `http://127.0.0.1:5000/workouts/${editingWorkoutId}`
        : "http://127.0.0.1:5000/workouts";
    const method = editingWorkoutId ? "PUT" : "POST";    
    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        alert(data.message || (editingWorkoutId ? "Workout updated" : "Workout logged"));
        workoutForm.reset();
        exercisesCont.innerHTML = "";
        editingWorkoutId = null;
        cancelEdit.style.display ="none";
        document.querySelector("h1").textContent = "Log Workout";
        populateExerciseDropdown();
        loadWorkouts();
    } catch (err) {
        console.error(err);
        alert("Error occured, check console");
    }
});

cancelEdit.addEventListener("click", () => {
    workoutForm.reset();
    exercisesCont.innerHTML = "";
    editingWorkoutId = null;
    cancelEdit.style.display = "none";
    document.querySelector("h1").textContent = "Log Workout";
})

async function populateExerciseDropdown() {
    const dropdown = document.getElementById("exercise-search");
    const datalist = document.getElementById("exercise-list");
    dropdown.innerHTML = `<option value="" disabled selected>Select an exercise</option>`;
    datalist.innerHTML = "";
    try {
        const res = await fetch("http://127.0.0.1:5000/exercises");
        const exercises = await res.json();
        exercises.forEach(exercise => {
            const option = document.createElement("option");
            option.value = exercise;
            option.textContent = exercise;
            dropdown.appendChild(option);
            const dataListOptions = document.createElement("option");
            dataListOptions.value = exercise;
            datalist.appendChild(dataListOptions);
        });
    } catch (err) {
        console.error("Couldnt load exercises", err);
    }
}

document.getElementById("fetch-progress").addEventListener("click", async () => {
    const selected = document.getElementById("exercise-search").value;
    if (!selected) return;
    try {
        const res = await fetch(`http://127.0.0.1:5000/progress/${encodeURIComponent(selected)}`);
        const data = await res.json();
        if (!Array.isArray(data)) {
            alert("No workouts logged with this exercise");
            return;
        }
        const labels = data.map(entry => entry.date);
        const volumes = data.map(entry => entry.weight * entry.reps);
        const graph = document.getElementById("progress-chart").getContext("2d");
        if (window.progressChart) window.progressChart.destroy();
        window.progressChart = new Chart(graph, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${selected} (Volume)`,
                    data: volumes,
                    fill: false,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {display:true}
                },
                scales: {
                    y: {beginAtZero: true}
                }
            }
        });
    } catch (err) {
        console.error(err);
        alert("Failed to get exercise progress data");
    }
});

async function loadWorkouts() {
    const history = document.getElementById("workout-history");
    history.innerHTML = "<p>Loading...</p>";
    try {
        const res = await fetch("http://127.0.0.1:5000/workouts");
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            history.innerHTML = "<p>No workouts recorded</p>";
            return;
        }
        history.innerHTML = "";
        data.forEach((workout, index) => {
            const indWorkout = document.createElement("div");
            indWorkout.classList.add("workout-entry");
            let date = "Unknown Date";
            console.log("RAW workout.date:", workout.date);
            if (workout.date) {
                const dateActual = workout.date.slice(0,10);
                const dateObj = new Date(`${dateActual}T00:00:00`);
                date = dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });
            } 
            indWorkout.innerHTML = `
            <h4>${workout.workout_day} (${date})</h4>
            <ul>
                ${
                    (Array.isArray(workout.exercises) 
                    ? workout.exercises 
                    : Object.entries(workout.exercises).map(([exercise_name, sets]) => ({exercise_name, sets}))
                    ).map(ex => 
                        `<li class="exercise-entry">
                            <strong>${ex.exercise_name}</strong>
                            ${ex.sets.map(set => `<span>${set.weight} x ${set.reps}</span>`).join("")}
                        </li>`
                    ).join("")}
            </ul>
            <button data-id="${workout.id}" class="edit-btn">Edit Workout</button>
            <button data-id="${workout.id}" class="delete-btn">Delete Workout</button>
            <hr>
            `;
        const deleteBtn = indWorkout.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", async () => {
            const workoutId = deleteBtn.getAttribute("data-id");
            const confirmDel = confirm("Are you sure you want to delete the workout?");
            if (!confirmDel) return;
            try {
                const res = await fetch(`http://127.0.0.1:5000/workouts/${workoutId}`, {
                    method: "DELETE"
                });
                const result = await res.json();
                alert(result.message || "Workout Deleted");
                loadWorkouts();
            } catch (err) {
                console.error("Couldnt delete:", err);
                alert("Couldnt delete workout");
            }
        })
        const editBtn = indWorkout.querySelector(".edit-btn");
        editBtn.addEventListener("click", () => {
            const workoutId = editBtn.getAttribute("data-id");
            loadWorkoutForm(workoutId, workout);
        })
        history.appendChild(indWorkout);
        })
    } catch (err) {
        console.error("Failed to load workouts", err);
        history.innerHTML = "<p>Error loading workouts</p>";
    }
}

function loadWorkoutForm(id, workout) {
    document.getElementById("workout-day").value = workout.workout_day;
    document.getElementById("workout-date").value = workout.date;
    exercisesCont.innerHTML = "";
    editingWorkoutId = id;
    document.querySelector("h1").textContent = "Edit Workout";
    cancelEdit.style.display = "inline";
    const exerciseList = Array.isArray(workout.exercises)
        ? workout.exercises
        : Object.entries(workout.exercises).map(([exercise_name, sets]) => ({exercise_name, sets}));
        exerciseList.forEach(({ exercise_name, sets }) => {
            const wrapper = document.createElement("div");
            wrapper.classList.add("exercise-wrapper");
            const header = document.createElement("div");
            header.classList.add("exercise-header");
            header.innerHTML = `
                <span>${exercise_name}</span>
                <button type="button" class="toggle-exercise">–</button>
            `;
            const exerciseDiv = document.createElement("div");
            exerciseDiv.classList.add("exercise");
            exerciseDiv.innerHTML = `
                <label>Exercise Name:
                    <input type="text" class="exercise-name" list="exercise-list" required value="${exercise_name}">
                </label>
                <div class="sets-container"></div>
                <button type="button" class="add-set-btn">+ Add Set</button>
                <button type="button" class="remove-exercise-btn">Remove Exercise</button>
                <hr>
            `;
            header.querySelector(".toggle-exercise").addEventListener("click", () => {
                exerciseDiv.classList.toggle("collapsed");
            });
            exerciseDiv.querySelector(".remove-exercise-btn").addEventListener("click", () => {
                wrapper.remove();
            });
            const setsCont = exerciseDiv.querySelector(".sets-container");
            sets.forEach(set => {
                const setDiv = document.createElement("div");
                setDiv.classList.add("set");
                setDiv.innerHTML = `
                    <label>Weight: <input type="number" class="set-weight" required value="${set.weight}"></label>
                    <label>Reps: <input type="number" class="set-reps" required value="${set.reps}"></label>
                    <button type="button" class="remove-set-btn">Remove Set</button>
                `;
                setDiv.querySelector(".remove-set-btn").addEventListener("click", () => setDiv.remove());
                setsCont.appendChild(setDiv);
            });
            exerciseDiv.querySelector(".add-set-btn").addEventListener("click", () => {
                const setDiv = document.createElement("div");
                setDiv.classList.add("set");
                setDiv.innerHTML = `
                    <label>Weight: <input type="number" class="set-weight" required></label>
                    <label>Reps: <input type="number" class="set-reps" required></label>
                    <button type="button" class="remove-set-btn">Remove Set</button>
                `;
                setDiv.querySelector(".remove-set-btn").addEventListener("click", () => setDiv.remove());
                setsCont.appendChild(setDiv);
            });
            wrapper.appendChild(header);
            wrapper.appendChild(exerciseDiv);
            exercisesCont.appendChild(wrapper);
        });
    workoutForm.scrollIntoView({behavior: "smooth"});
}

window.onload = () => {
    populateExerciseDropdown();
    loadWorkouts();
};