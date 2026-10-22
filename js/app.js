// Mid-Fidelity Wireframe Prototype Logic (Sketch D)
// Simple, clean JavaScript for student prototype

// Embedded JSON data fallback for direct file:// execution
const defaultData = {
  movies: [
    { id: "m1", title: "Crystal Horizon", genre: "Sci-Fi", placeholder: "[ Poster: Diamond ]" },
    { id: "m2", title: "Stick Runner", genre: "Comedy", placeholder: "[ Poster: Figure ]" },
    { id: "m3", title: "Chain Reaction", genre: "Thriller", placeholder: "[ Poster: Circles ]" },
    { id: "m4", title: "Happy Days", genre: "Animation", placeholder: "[ Poster: Smiley ]" },
    { id: "m5", title: "Starlight Quest", genre: "Fantasy", placeholder: "[ Poster: Star ]" },
    { id: "m6", title: "The Web", genre: "Mystery", placeholder: "[ Poster: Web ]" },
    { id: "m7", title: "Speed Wings", genre: "Action", placeholder: "[ Poster: Wing ]" },
    { id: "m8", title: "The Cloaked One", genre: "Drama", placeholder: "[ Poster: Cloak ]" }
  ],
  locations: [
    { id: "loc-1", name: "Downtown Cinema", detail: "Auditorium 1" },
    { id: "loc-2", name: "West End Mall", detail: "Auditorium 4" },
    { id: "loc-3", name: "North Centre", detail: "Auditorium 2" },
    { id: "loc-4", name: "Valley Plaza", detail: "Auditorium 6" }
  ],
  times: [
    { id: "t1", time: "1:00 PM", type: "Matinee" },
    { id: "t2", time: "3:30 PM", type: "Regular" },
    { id: "t3", time: "6:15 PM", type: "Prime" },
    { id: "t4", time: "8:45 PM", type: "Prime" },
    { id: "t5", time: "11:00 PM", type: "Late Night" }
  ]
};

// Global State
const appState = {
  currentStep: 1,
  data: defaultData,
  selectedMovie: null,
  selectedLocation: null,
  selectedSeats: [],
  selectedTime: null
};

// Middle seats marked occupied in sketch (Row C, seats 3, 4, 5, 6)
const occupiedSeats = ["C3", "C4", "C5", "C6"];

// Initialize prototype
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});

// Load JSON filler data
function loadData() {
  fetch("data/data.json")
    .then((res) => {
      if (!res.ok) throw new Error("Local fetch error");
      return res.json();
    })
    .then((jsonData) => {
      appState.data = jsonData;
      initApp();
    })
    .catch(() => {
      // Fallback for file:// protocol
      appState.data = defaultData;
      initApp();
    });
}

function initApp() {
  setupStepperTabs();
  renderMovieGrid();
  renderLocationList();
  renderSeatChart();
  renderTimeList();
  setupNavButtons();
  updateSummary();
}

// Stepper Tab Switching
function goToStep(step) {
  const prevStep = appState.currentStep;
  appState.currentStep = step;

  document.querySelectorAll(".step-tab").forEach((tab) => {
    tab.classList.toggle("active", Number(tab.dataset.step) === step);
  });

  document.querySelectorAll(".step-view").forEach((view) => {
    view.classList.toggle("active", Number(view.dataset.step) === step);
  });

  updateSummary();
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (window.Analytics && window.Analytics.activeSession && prevStep !== step) {
    window.Analytics.recordStepTransition(prevStep, step);
  }
}

function setupStepperTabs() {
  document.querySelectorAll(".step-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      goToStep(Number(tab.dataset.step));
    });
  });
}

// STEP 1: Render 8 Movies (2 rows x 4 columns)
function renderMovieGrid() {
  const container = document.getElementById("movie-grid-8");
  if (!container) return;
  container.innerHTML = "";

  appState.data.movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.dataset.id = movie.id;

    if (appState.selectedMovie && appState.selectedMovie.id === movie.id) {
      card.classList.add("selected");
    }

    card.innerHTML = `
      <div class="poster-placeholder-box">${movie.placeholder}</div>
      <div class="movie-title">${movie.title}</div>
    `;

    card.addEventListener("click", () => {
      appState.selectedMovie = movie;
      document.querySelectorAll(".movie-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      updateSummary();
      if (window.Analytics) window.Analytics.recordSelection("movie", movie.title);
    });

    container.appendChild(card);
  });
}

// STEP 1: Render 4 Locations
function renderLocationList() {
  const list = document.getElementById("location-list");
  if (!list) return;
  list.innerHTML = "";

  appState.data.locations.forEach((loc) => {
    const li = document.createElement("li");
    li.className = "selection-item";
    li.dataset.id = loc.id;

    if (appState.selectedLocation && appState.selectedLocation.id === loc.id) {
      li.classList.add("selected");
    }

    li.innerHTML = `
      <div class="selection-icon">📍</div>
      <div class="selection-text">
        <div class="selection-title">${loc.name}</div>
        <div class="selection-sub">${loc.detail}</div>
      </div>
    `;

    li.addEventListener("click", () => {
      appState.selectedLocation = loc;
      document.querySelectorAll("#location-list .selection-item").forEach((item) => item.classList.remove("selected"));
      li.classList.add("selected");
      updateSummary();
      if (window.Analytics) window.Analytics.recordSelection("location", loc.name);
    });

    list.appendChild(li);
  });
}

// STEP 2: Render Cinema Seat Chart (6 rows x 8 cols)
function renderSeatChart() {
  const chart = document.getElementById("seating-chart");
  if (!chart) return;
  chart.innerHTML = "";

  const rows = ["A", "B", "C", "D", "E", "F"];
  const cols = 8;

  rows.forEach((rowLetter) => {
    for (let col = 1; col <= cols; col++) {
      const seatId = `${rowLetter}${col}`;
      const seat = document.createElement("div");
      seat.className = "seat";
      seat.dataset.seat = seatId;
      seat.textContent = seatId;

      if (occupiedSeats.includes(seatId)) {
        seat.classList.add("occupied");
        seat.title = "Seat Occupied";
      } else {
        if (appState.selectedSeats.includes(seatId)) {
          seat.classList.add("selected");
        }

        seat.addEventListener("click", () => {
          toggleSeat(seatId, seat);
        });
      }

      chart.appendChild(seat);
    }
  });
}

function toggleSeat(seatId, seatElement) {
  const index = appState.selectedSeats.indexOf(seatId);
  if (index > -1) {
    appState.selectedSeats.splice(index, 1);
    seatElement.classList.remove("selected");
  } else {
    appState.selectedSeats.push(seatId);
    seatElement.classList.add("selected");
  }
  updateSummary();
  if (window.Analytics) window.Analytics.recordSelection("seats", appState.selectedSeats);
}

// STEP 2: Render 5 Times
function renderTimeList() {
  const list = document.getElementById("time-list");
  if (!list) return;
  list.innerHTML = "";

  appState.data.times.forEach((t) => {
    const li = document.createElement("li");
    li.className = "selection-item";
    li.dataset.id = t.id;

    if (appState.selectedTime && appState.selectedTime.id === t.id) {
      li.classList.add("selected");
    }

    li.innerHTML = `
      <div class="selection-icon">🕒</div>
      <div class="selection-text">
        <div class="selection-title">${t.time}</div>
        <div class="selection-sub">${t.type}</div>
      </div>
    `;

    li.addEventListener("click", () => {
      appState.selectedTime = t;
      document.querySelectorAll("#time-list .selection-item").forEach((item) => item.classList.remove("selected"));
      li.classList.add("selected");
      updateSummary();
      if (window.Analytics) window.Analytics.recordSelection("time", t.time);
    });

    list.appendChild(li);
  });
}

// Navigation and Action Buttons
function setupNavButtons() {
  // Step 1 -> Step 2
  const toStep2 = document.getElementById("btn-to-step2");
  if (toStep2) toStep2.addEventListener("click", () => goToStep(2));

  // Step 2 -> Step 1
  const backTo1 = document.getElementById("btn-back-step1");
  if (backTo1) backTo1.addEventListener("click", () => goToStep(1));

  // Step 2 -> Step 3
  const toStep3 = document.getElementById("btn-to-step3");
  if (toStep3) toStep3.addEventListener("click", () => goToStep(3));

  // Step 3 -> Step 2
  const backTo2 = document.getElementById("btn-back-step2");
  if (backTo2) backTo2.addEventListener("click", () => goToStep(2));

  // Step 3: Login button
  const loginBtn = document.getElementById("btn-login");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const userField = document.getElementById("login-username");
      const username = userField && userField.value ? userField.value.trim() : "user@cineplex.ca";
      loginBtn.textContent = "✓ Logged In";
      if (window.Analytics) window.Analytics.recordSelection("login", username);
    });
  }

  // Step 3: Shopping cart checkout button
  const cartBtn = document.getElementById("btn-cart-checkout");
  if (cartBtn) {
    cartBtn.addEventListener("click", handleCheckout);
  }
}

// Update summary texts
function updateSummary() {
  const movieText = appState.selectedMovie ? appState.selectedMovie.title : "(None selected)";
  const locText = appState.selectedLocation ? appState.selectedLocation.name : "(None selected)";
  const seatsText = appState.selectedSeats.length > 0 ? appState.selectedSeats.join(", ") : "(None selected)";
  const timeText = appState.selectedTime ? appState.selectedTime.time : "(None selected)";

  document.querySelectorAll(".sum-movie").forEach((el) => (el.textContent = movieText));
  document.querySelectorAll(".sum-loc").forEach((el) => (el.textContent = locText));
  document.querySelectorAll(".sum-seats").forEach((el) => (el.textContent = seatsText));
  document.querySelectorAll(".sum-time").forEach((el) => (el.textContent = timeText));
}

// Handle Checkout submit
function handleCheckout(e) {
  e.preventDefault();

  const confirmBox = document.getElementById("confirmation-box");
  const details = document.getElementById("confirmation-details");

  const movie = appState.selectedMovie ? appState.selectedMovie.title : "Crystal Horizon";
  const loc = appState.selectedLocation ? appState.selectedLocation.name : "Downtown Cinema";
  const seats = appState.selectedSeats.length > 0 ? appState.selectedSeats.join(", ") : "D3, D4";
  const time = appState.selectedTime ? appState.selectedTime.time : "6:15 PM";

  details.innerHTML = `
    <p><strong>Movie:</strong> ${movie}</p>
    <p><strong>Location:</strong> ${loc}</p>
    <p><strong>Selected Seats:</strong> ${seats}</p>
    <p><strong>Time:</strong> ${time}</p>
    <p><strong>Order Status:</strong> Confirmed &amp; Paid via Wireframe Checkout</p>
  `;

  confirmBox.classList.add("active");
  confirmBox.scrollIntoView({ behavior: "smooth" });

  if (window.Analytics) {
    window.Analytics.completeTest(appState);
  }
}

// Reset prototype back to initial step 1 state
function resetPrototype() {
  appState.selectedMovie = null;
  appState.selectedLocation = null;
  appState.selectedSeats = [];
  appState.selectedTime = null;

  document.querySelectorAll(".movie-card").forEach((c) => c.classList.remove("selected"));
  document.querySelectorAll("#location-list .selection-item").forEach((i) => i.classList.remove("selected"));
  document.querySelectorAll("#time-list .selection-item").forEach((i) => i.classList.remove("selected"));
  document.querySelectorAll(".seat").forEach((s) => {
    if (!occupiedSeats.includes(s.dataset.seat)) {
      s.classList.remove("selected");
    }
  });

  const confirmBox = document.getElementById("confirmation-box");
  if (confirmBox) confirmBox.classList.remove("active");

  const loginBtn = document.getElementById("btn-login");
  if (loginBtn) loginBtn.textContent = "Login";

  goToStep(1);
}

// Expose resetPrototype globally
window.resetPrototype = resetPrototype;

