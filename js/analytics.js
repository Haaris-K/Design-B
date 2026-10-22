/* ==========================================================================
   USABILITY TESTING & ANALYTICS MODULE - DESIGN 4
   - Simple, student-friendly vanilla JavaScript for local testing
   - Tracks participant time, step durations, selections, and user actions
   - Saves results to browser localStorage (persists across refreshes)
   - Allows CSV & JSON export for reporting (ideal for ~4 test users)
   ========================================================================== */

const STORAGE_KEY = "cineplex_design4_analytics";

// Analytics System Object
const Analytics = {
  // Stored completed sessions
  sessions: [],

  // Currently running session
  activeSession: null,

  // Live timer interval handle
  timerInterval: null,

  // Elapsed seconds of active session
  elapsedSeconds: 0,

  // Track timestamp when entering each step to measure step duration
  currentStep: 1,
  stepEnteredTime: 0,
  stepDurations: { 1: 0, 2: 0, 3: 0 },

  // --- 1. Initialization ---
  init() {
    this.loadSessions();
    this.setupUI();
    this.updateSavedCountBadge();
  },

  // Load saved test sessions from localStorage
  loadSessions() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      this.sessions = data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("Could not read localStorage for analytics:", e);
      this.sessions = [];
    }
  },

  // Save sessions array to localStorage
  saveSessions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
    this.updateSavedCountBadge();
  },

  // --- 2. Setup UI Event Listeners ---
  setupUI() {
    const startBtn = document.getElementById("btn-start-test");
    const resetBtn = document.getElementById("btn-reset-test");
    const viewBtn = document.getElementById("btn-view-analytics");
    const closeBtn = document.getElementById("btn-close-analytics");
    const exportCsvBtn = document.getElementById("btn-export-csv");
    const exportJsonBtn = document.getElementById("btn-export-json");
    const clearBtn = document.getElementById("btn-clear-analytics");
    const loadSampleBtn = document.getElementById("btn-load-sample");
    const notifClose = document.getElementById("testing-notif-close");

    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const participantSelect = document.getElementById("tester-select");
        const participant = participantSelect ? participantSelect.value : "User 1";
        this.startTest(participant);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetTest();
        if (typeof window.resetPrototype === "function") {
          window.resetPrototype();
        }
      });
    }

    if (viewBtn) {
      viewBtn.addEventListener("click", () => {
        this.openModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.closeModal();
      });
    }

    // Close modal on backdrop click
    const modal = document.getElementById("analytics-modal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => this.exportCSV());
    }

    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", () => this.exportJSON());
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearAllData());
    }

    if (loadSampleBtn) {
      loadSampleBtn.addEventListener("click", () => this.loadSampleData());
    }

    if (notifClose) {
      notifClose.addEventListener("click", () => {
        const notif = document.getElementById("testing-notification");
        if (notif) notif.classList.remove("active");
      });
    }
  },

  // --- 3. Starting a Test Session ---
  startTest(participantName) {
    this.stopTimer();
    this.activeSession = null;

    // Reset prototype UI back to Step 1 before creating new session
    if (typeof window.resetPrototype === "function") {
      window.resetPrototype();
    }

    const now = Date.now();
    this.elapsedSeconds = 0;
    this.currentStep = 1;
    this.stepEnteredTime = now;
    this.stepDurations = { 1: 0, 2: 0, 3: 0 };

    this.activeSession = {
      id: "session_" + now,
      participant: participantName || "User 1",
      startTime: new Date().toLocaleTimeString(),
      startDate: new Date().toLocaleDateString(),
      startTimestamp: now,
      endTimestamp: null,
      totalDurationSeconds: 0,
      step1Seconds: 0,
      step2Seconds: 0,
      step3Seconds: 0,
      selections: {
        movie: "",
        location: "",
        seats: [],
        time: "",
        login: ""
      },
      events: []
    };

    // Log start event
    this.logEvent("Test started for " + this.activeSession.participant);

    // Update status in UI
    const statusEl = document.getElementById("testing-status");
    if (statusEl) statusEl.textContent = "Testing in progress (Step 1)";

    const startBtn = document.getElementById("btn-start-test");
    if (startBtn) startBtn.textContent = "Restart Test";

    // Start live second ticker
    this.updateTimerDisplay(0);
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateTimerDisplay(this.elapsedSeconds);
    }, 1000);

    // Hide any previous completion notification
    const notif = document.getElementById("testing-notification");
    if (notif) notif.classList.remove("active");
  },

  // Stop the live timer
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  // Reset the test
  resetTest() {
    this.stopTimer();
    this.activeSession = null;
    this.elapsedSeconds = 0;
    this.updateTimerDisplay(0);

    const statusEl = document.getElementById("testing-status");
    if (statusEl) statusEl.textContent = "Status: Ready";

    const startBtn = document.getElementById("btn-start-test");
    if (startBtn) startBtn.textContent = "Start Test";
  },

  // Update timer display format (mm:ss)
  updateTimerDisplay(totalSecs) {
    const timerEl = document.getElementById("testing-timer");
    if (!timerEl) return;

    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const formatted = `⏱ ${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    timerEl.textContent = formatted;
  },

  // --- 4. Event & Selection Tracking ---
  // Ensure a test session is active; if not, automatically start one so no clicks are missed
  ensureActiveSession() {
    if (!this.activeSession) {
      const select = document.getElementById("tester-select");
      const participant = select ? select.value : "User 1";
      this.startTest(participant);
    }
  },

  // Log user action with timestamp offset
  logEvent(description) {
    if (!this.activeSession) return;
    this.activeSession.events.push({
      offsetSec: this.elapsedSeconds,
      step: this.currentStep,
      time: new Date().toLocaleTimeString(),
      description: description
    });
  },

  // Record Step Transition (e.g., Step 1 -> Step 2)
  recordStepTransition(fromStep, toStep) {
    this.ensureActiveSession();

    // Accumulate time spent on the step they are leaving
    const now = Date.now();
    const timeSpentOnStepSec = Math.round((now - this.stepEnteredTime) / 1000);
    if (this.stepDurations[fromStep] !== undefined) {
      this.stepDurations[fromStep] += Math.max(0, timeSpentOnStepSec);
    }

    // Set new step
    this.currentStep = toStep;
    this.stepEnteredTime = now;

    // Log the step change
    this.logEvent(`Navigated from Step ${fromStep} to Step ${toStep}`);

    const statusEl = document.getElementById("testing-status");
    if (statusEl) statusEl.textContent = `Testing in progress (Step ${toStep})`;
  },

  // Record specific selections made by user
  recordSelection(type, value) {
    this.ensureActiveSession();

    if (type === "movie") {
      this.activeSession.selections.movie = value;
      this.logEvent(`Selected movie: "${value}"`);
    } else if (type === "location") {
      this.activeSession.selections.location = value;
      this.logEvent(`Selected location: "${value}"`);
    } else if (type === "seats") {
      this.activeSession.selections.seats = Array.isArray(value) ? [...value] : [value];
      this.logEvent(`Updated seats: [${this.activeSession.selections.seats.join(", ") || "none"}]`);
    } else if (type === "time") {
      this.activeSession.selections.time = value;
      this.logEvent(`Selected showtime: "${value}"`);
    } else if (type === "login") {
      this.activeSession.selections.login = value;
      this.logEvent(`Logged in with: "${value}"`);
    }
  },

  // --- 5. Complete Test Session ---
  completeTest(appState) {
    this.ensureActiveSession();
    this.stopTimer();

    const now = Date.now();
    // Add final step duration
    const timeSpentOnLastStepSec = Math.round((now - this.stepEnteredTime) / 1000);
    if (this.stepDurations[this.currentStep] !== undefined) {
      this.stepDurations[this.currentStep] += Math.max(0, timeSpentOnLastStepSec);
    }

    // Populate final selections from appState
    if (appState) {
      if (appState.selectedMovie) {
        this.activeSession.selections.movie = appState.selectedMovie.title;
      }
      if (appState.selectedLocation) {
        this.activeSession.selections.location = appState.selectedLocation.name;
      }
      if (appState.selectedSeats && appState.selectedSeats.length > 0) {
        this.activeSession.selections.seats = [...appState.selectedSeats];
      }
      if (appState.selectedTime) {
        this.activeSession.selections.time = appState.selectedTime.time;
      }
    }

    // Fallbacks if user clicked checkout directly
    if (!this.activeSession.selections.movie) this.activeSession.selections.movie = "Crystal Horizon";
    if (!this.activeSession.selections.location) this.activeSession.selections.location = "Downtown Cinema";
    if (this.activeSession.selections.seats.length === 0) this.activeSession.selections.seats = ["D3", "D4"];
    if (!this.activeSession.selections.time) this.activeSession.selections.time = "6:15 PM";

    this.activeSession.endTimestamp = now;
    this.activeSession.totalDurationSeconds = this.elapsedSeconds;
    this.activeSession.step1Seconds = this.stepDurations[1] || 0;
    this.activeSession.step2Seconds = this.stepDurations[2] || 0;
    this.activeSession.step3Seconds = this.stepDurations[3] || 0;

    this.logEvent("Completed checkout and confirmed order");

    // Save session to list
    this.sessions.push(this.activeSession);
    this.saveSessions();

    const finishedParticipant = this.activeSession.participant;
    const finishedDuration = this.elapsedSeconds;

    // Show completion notification
    this.showCompletionNotification(finishedParticipant, finishedDuration);

    // Update status
    const statusEl = document.getElementById("testing-status");
    if (statusEl) statusEl.textContent = `Status: Completed (${finishedDuration}s)`;

    const startBtn = document.getElementById("btn-start-test");
    if (startBtn) startBtn.textContent = "Start Next Test";

    // Auto-advance participant dropdown to the next user (e.g. User 1 -> User 2)
    this.advanceParticipantDropdown();

    // Reset active session pointer
    this.activeSession = null;
  },

  // Advance participant dropdown to the next user
  advanceParticipantDropdown() {
    const select = document.getElementById("tester-select");
    if (!select) return;
    const currentIndex = select.selectedIndex;
    if (currentIndex < select.options.length - 1) {
      select.selectedIndex = currentIndex + 1;
    }
  },

  // Show notification banner
  showCompletionNotification(participant, duration) {
    const notif = document.getElementById("testing-notification");
    const msg = document.getElementById("testing-notif-message");
    if (notif && msg) {
      msg.textContent = `✓ Test data recorded for ${participant}! Total Time: ${duration}s. Saved locally.`;
      notif.classList.add("active");
    }
  },

  // Update badge showing count of saved sessions
  updateSavedCountBadge() {
    const badge = document.getElementById("saved-sessions-count");
    if (badge) badge.textContent = this.sessions.length;
  },

  // --- 6. Analytics Modal Rendering ---
  openModal() {
    const modal = document.getElementById("analytics-modal");
    if (!modal) return;
    this.renderModalContent();
    modal.style.display = "flex";
  },

  closeModal() {
    const modal = document.getElementById("analytics-modal");
    if (modal) modal.style.display = "none";
  },

  renderModalContent() {
    const count = this.sessions.length;

    // Calculate metrics
    let avgTotal = 0;
    let avgStep1 = 0;
    let avgStep2 = 0;
    let avgStep3 = 0;
    const movieCounts = {};
    const locCounts = {};

    if (count > 0) {
      let sumTotal = 0;
      let sumStep1 = 0;
      let sumStep2 = 0;
      let sumStep3 = 0;

      this.sessions.forEach((s) => {
        sumTotal += s.totalDurationSeconds || 0;
        sumStep1 += s.step1Seconds || 0;
        sumStep2 += s.step2Seconds || 0;
        sumStep3 += s.step3Seconds || 0;

        const mov = s.selections.movie || "Not selected";
        movieCounts[mov] = (movieCounts[mov] || 0) + 1;

        const loc = s.selections.location || "Not selected";
        locCounts[loc] = (locCounts[loc] || 0) + 1;
      });

      avgTotal = (sumTotal / count).toFixed(1);
      avgStep1 = (sumStep1 / count).toFixed(1);
      avgStep2 = (sumStep2 / count).toFixed(1);
      avgStep3 = (sumStep3 / count).toFixed(1);
    }

    // Top movie
    let topMovie = "None";
    let topMovieCount = 0;
    for (const [m, c] of Object.entries(movieCounts)) {
      if (c > topMovieCount) {
        topMovie = m;
        topMovieCount = c;
      }
    }

    // Top location
    let topLocation = "None";
    let topLocCount = 0;
    for (const [l, c] of Object.entries(locCounts)) {
      if (c > topLocCount) {
        topLocation = l;
        topLocCount = c;
      }
    }

    // Render summary stat cards
    const statsContainer = document.getElementById("analytics-stats-grid");
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-card-title">Completed Tests</div>
          <div class="stat-card-value">${count}</div>
          <div class="stat-card-subtitle">Target: ~4 participants</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Avg. Completion Time</div>
          <div class="stat-card-value">${count > 0 ? avgTotal + "s" : "--"}</div>
          <div class="stat-card-subtitle">${count > 0 ? (avgTotal > 60 ? (avgTotal / 60).toFixed(1) + " min" : "Total run-through time") : "No tests yet"}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Time Per Step (Avg)</div>
          <div class="stat-card-value" style="font-size: 15px; margin-top: 4px;">
            S1: ${count > 0 ? avgStep1 + "s" : "-"} | S2: ${count > 0 ? avgStep2 + "s" : "-"} | S3: ${count > 0 ? avgStep3 + "s" : "-"}
          </div>
          <div class="stat-card-subtitle">Movie &amp; Loc &rarr; Seat &amp; Time &rarr; Pay</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Top Movie &amp; Location</div>
          <div class="stat-card-value" style="font-size: 14px; margin-top: 4px;">
            ${count > 0 ? topMovie : "--"}
          </div>
          <div class="stat-card-subtitle">${count > 0 ? topLocation : "No test data"}</div>
        </div>
      `;
    }

    // Render Sessions Table
    const tableBody = document.getElementById("analytics-table-body");
    const emptyMsg = document.getElementById("analytics-empty-msg");
    const tableContainer = document.getElementById("analytics-table-wrapper");

    if (tableBody) {
      if (count === 0) {
        if (emptyMsg) emptyMsg.style.display = "block";
        if (tableContainer) tableContainer.style.display = "none";
        tableBody.innerHTML = "";
      } else {
        if (emptyMsg) emptyMsg.style.display = "none";
        if (tableContainer) tableContainer.style.display = "block";

        tableBody.innerHTML = this.sessions
          .map((s, index) => {
            const seats = s.selections.seats && s.selections.seats.length > 0 ? s.selections.seats.join(", ") : "None";

            return `
              <tr>
                <td><strong>${escapeHtml(s.participant)}</strong></td>
                <td><span class="table-tag">${s.totalDurationSeconds}s</span></td>
                <td>${s.step1Seconds}s</td>
                <td>${s.step2Seconds}s</td>
                <td>${s.step3Seconds}s</td>
                <td>${escapeHtml(s.selections.movie || "-")}</td>
                <td>${escapeHtml(s.selections.location || "-")}</td>
                <td>${escapeHtml(seats)}</td>
                <td>${escapeHtml(s.selections.time || "-")}</td>
                <td>
                  <button type="button" class="table-btn-small" onclick="Analytics.viewTimeline(${index})">
                    View Log (${s.events ? s.events.length : 0})
                  </button>
                </td>
              </tr>
            `;
          })
          .join("");
      }
    }

    // Hide timeline view initially
    const timelineView = document.getElementById("action-timeline-view");
    if (timelineView) timelineView.classList.remove("active");
  },

  // View detailed timeline of actions for a specific test run
  viewTimeline(sessionIndex) {
    const session = this.sessions[sessionIndex];
    if (!session) return;

    const timelineView = document.getElementById("action-timeline-view");
    const titleEl = document.getElementById("timeline-title");
    const listEl = document.getElementById("timeline-list");

    if (!timelineView || !titleEl || !listEl) return;

    titleEl.textContent = `Actions Timeline: ${session.participant} (Total: ${session.totalDurationSeconds}s)`;

    if (!session.events || session.events.length === 0) {
      listEl.innerHTML = `<li>No discrete actions recorded.</li>`;
    } else {
      listEl.innerHTML = session.events
        .map(
          (e) => `
          <li>
            <span class="timeline-offset">+${e.offsetSec}s</span>
            <span class="timeline-step">[Step ${e.step}]</span>
            <span class="timeline-desc">${escapeHtml(e.description)}</span>
          </li>
        `
        )
        .join("");
    }

    timelineView.classList.add("active");
    timelineView.scrollIntoView({ behavior: "smooth" });
  },

  // --- 7. Exporting Data ---
  // Export to CSV file (opens in Excel or Google Sheets)
  exportCSV() {
    if (this.sessions.length === 0) {
      alert("No test session data available to export yet.");
      return;
    }

    const headers = [
      "Participant",
      "Date",
      "Start Time",
      "Total Time (seconds)",
      "Step 1 Time (s)",
      "Step 2 Time (s)",
      "Step 3 Time (s)",
      "Movie Selected",
      "Location Selected",
      "Seats Selected",
      "Seat Count",
      "Showtime Selected",
      "Login Status"
    ];

    const rows = this.sessions.map((s) => {
      const seatsStr = s.selections.seats ? s.selections.seats.join(";") : "";
      const seatCount = s.selections.seats ? s.selections.seats.length : 0;
      return [
        `"${s.participant}"`,
        `"${s.startDate}"`,
        `"${s.startTime}"`,
        s.totalDurationSeconds,
        s.step1Seconds,
        s.step2Seconds,
        s.step3Seconds,
        `"${s.selections.movie || ""}"`,
        `"${s.selections.location || ""}"`,
        `"${seatsStr}"`,
        seatCount,
        `"${s.selections.time || ""}"`,
        `"${s.selections.login || "Guest / Direct"}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cineplex_design4_tests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Export to JSON file
  exportJSON() {
    if (this.sessions.length === 0) {
      alert("No test session data available to export yet.");
      return;
    }

    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.sessions, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `cineplex_design4_analytics_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Pre-load 4 realistic sample users for prototype review or demo
  loadSampleData() {
    const sampleUsers = [
      {
        id: "sample_1",
        participant: "User 1",
        startDate: new Date().toLocaleDateString(),
        startTime: "10:15 AM",
        totalDurationSeconds: 43,
        step1Seconds: 18,
        step2Seconds: 11,
        step3Seconds: 14,
        selections: {
          movie: "Crystal Horizon",
          location: "Downtown Cinema",
          seats: ["D3", "D4"],
          time: "6:15 PM",
          login: "user@cineplex.ca"
        },
        events: [
          { offsetSec: 0, step: 1, description: "Test started for User 1" },
          { offsetSec: 6, step: 1, description: 'Selected movie: "Crystal Horizon"' },
          { offsetSec: 12, step: 1, description: 'Selected location: "Downtown Cinema"' },
          { offsetSec: 18, step: 1, description: "Navigated from Step 1 to Step 2" },
          { offsetSec: 24, step: 2, description: "Updated seats: [D3, D4]" },
          { offsetSec: 29, step: 2, description: 'Selected showtime: "6:15 PM"' },
          { offsetSec: 29, step: 2, description: "Navigated from Step 2 to Step 3" },
          { offsetSec: 36, step: 3, description: 'Logged in with: "user@cineplex.ca"' },
          { offsetSec: 43, step: 3, description: "Completed checkout and confirmed order" }
        ]
      },
      {
        id: "sample_2",
        participant: "User 2",
        startDate: new Date().toLocaleDateString(),
        startTime: "10:30 AM",
        totalDurationSeconds: 56,
        step1Seconds: 22,
        step2Seconds: 16,
        step3Seconds: 18,
        selections: {
          movie: "Speed Wings",
          location: "West End Mall",
          seats: ["B4", "B5"],
          time: "8:45 PM",
          login: ""
        },
        events: [
          { offsetSec: 0, step: 1, description: "Test started for User 2" },
          { offsetSec: 8, step: 1, description: 'Selected movie: "Speed Wings"' },
          { offsetSec: 15, step: 1, description: 'Selected location: "West End Mall"' },
          { offsetSec: 22, step: 1, description: "Navigated from Step 1 to Step 2" },
          { offsetSec: 31, step: 2, description: "Updated seats: [B4, B5]" },
          { offsetSec: 38, step: 2, description: 'Selected showtime: "8:45 PM"' },
          { offsetSec: 38, step: 2, description: "Navigated from Step 2 to Step 3" },
          { offsetSec: 56, step: 3, description: "Completed checkout and confirmed order" }
        ]
      },
      {
        id: "sample_3",
        participant: "User 3",
        startDate: new Date().toLocaleDateString(),
        startTime: "11:05 AM",
        totalDurationSeconds: 36,
        step1Seconds: 14,
        step2Seconds: 9,
        step3Seconds: 13,
        selections: {
          movie: "Chain Reaction",
          location: "North Centre",
          seats: ["E1"],
          time: "3:30 PM",
          login: "guest@example.com"
        },
        events: [
          { offsetSec: 0, step: 1, description: "Test started for User 3" },
          { offsetSec: 5, step: 1, description: 'Selected movie: "Chain Reaction"' },
          { offsetSec: 10, step: 1, description: 'Selected location: "North Centre"' },
          { offsetSec: 14, step: 1, description: "Navigated from Step 1 to Step 2" },
          { offsetSec: 19, step: 2, description: "Updated seats: [E1]" },
          { offsetSec: 23, step: 2, description: 'Selected showtime: "3:30 PM"' },
          { offsetSec: 23, step: 2, description: "Navigated from Step 2 to Step 3" },
          { offsetSec: 36, step: 3, description: "Completed checkout and confirmed order" }
        ]
      },
      {
        id: "sample_4",
        participant: "User 4",
        startDate: new Date().toLocaleDateString(),
        startTime: "11:20 AM",
        totalDurationSeconds: 49,
        step1Seconds: 20,
        step2Seconds: 14,
        step3Seconds: 15,
        selections: {
          movie: "Crystal Horizon",
          location: "Downtown Cinema",
          seats: ["A5", "A6", "A7"],
          time: "1:00 PM",
          login: "alex@cineplex.ca"
        },
        events: [
          { offsetSec: 0, step: 1, description: "Test started for User 4" },
          { offsetSec: 7, step: 1, description: 'Selected movie: "Crystal Horizon"' },
          { offsetSec: 14, step: 1, description: 'Selected location: "Downtown Cinema"' },
          { offsetSec: 20, step: 1, description: "Navigated from Step 1 to Step 2" },
          { offsetSec: 29, step: 2, description: "Updated seats: [A5, A6, A7]" },
          { offsetSec: 34, step: 2, description: 'Selected showtime: "1:00 PM"' },
          { offsetSec: 34, step: 2, description: "Navigated from Step 2 to Step 3" },
          { offsetSec: 49, step: 3, description: "Completed checkout and confirmed order" }
        ]
      }
    ];

    this.sessions = sampleUsers;
    this.saveSessions();
    this.renderModalContent();
  },

  // Clear all saved data
  clearAllData() {
    if (confirm("Are you sure you want to clear all recorded test analytics?")) {
      this.sessions = [];
      this.saveSessions();
      this.renderModalContent();
    }
  }
};

// Helper to escape HTML characters
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  Analytics.init();
});

// Make Analytics globally available
window.Analytics = Analytics;
