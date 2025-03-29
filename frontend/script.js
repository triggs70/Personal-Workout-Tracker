const exercisesCont = document.getElementById("exercises-container");
const addExerciseBtn = document.getElementById("add-exercise");
const workoutForm = document.getElementById("workout-form");

addExerciseBtn.addEventListener("click", () => {
    const exerciseDiv = document.createElement("div");
    exerciseDiv.classList.add("exercise");
    exerciseDiv.innerHTML = `
        <label>Exercise Name: <input type="text" class="exercise-name" list="exercise-list" required></label>
        <div class="sets-container"></div>
        <button type="button" class="add-set-btn">+ Add Set</button>
        <hr>
    `;
    const addSetBtn = exerciseDiv.querySelector(".add-set-btn");
    const setsCont = exerciseDiv.querySelector(".sets-container");
    
    addSetBtn.addEventListener("click", () => {
        const setDiv = document.createElement("div");
        setDiv.classList.add("set");
        setDiv.innerHTML = `
            <label>Weight: <input type="number" class="set-weight" required></label>
            <label>Reps: <input type="number" class="set-reps" required></label>
        `;
        setsCont.appendChild(setDiv);
    });

    addSetBtn.click();
    exercisesCont.appendChild(exerciseDiv);
});

workoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
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
    const payload = {workout_day: day, exercises: exercises};
    try {
        const res = await fetch("http://127.0.0.1:5000/workouts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        alert(data.message || "Workout logged");
        workoutForm.reset();
        exercisesCont.innerHTML = "";
        populateExerciseDropdown();
    } catch (err) {
        console.error(err);
        alert("Error occured, check console");
    }
});

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

window.onload = populateExerciseDropdown;