const Store = {
  jobs: [],
  nextId: 1,

  init() {
    this.jobs = [
      {
        id: 1,
        product: "Engine Component A",
        machine: "CNC Mill 01",
        quantity: 500,
        priority: "High",
        startDate: "2025-10-01",
        endDate: "2025-10-05",
        status: "In Progress",
      },
      {
        id: 2,
        product: "Bearing Unit B",
        machine: "Lathe 01",
        quantity: 300,
        priority: "Medium",
        startDate: "2025-10-02",
        endDate: "2025-10-06",
        status: "Scheduled",
      },
      {
        id: 3,
        product: "Power Module C",
        machine: "Assembly Line A",
        quantity: 200,
        priority: "High",
        startDate: "2025-09-28",
        endDate: "2025-10-01",
        status: "Completed",
      },
      {
        id: 4,
        product: "Friction Disc D",
        machine: "CNC Mill 02",
        quantity: 450,
        priority: "Low",
        startDate: "2025-09-25",
        endDate: "2025-09-30",
        status: "Delayed",
      },
      {
        id: 5,
        product: "Transmission Part E",
        machine: "Assembly Line B",
        quantity: 350,
        priority: "Medium",
        startDate: "2025-10-03",
        endDate: "2025-10-08",
        status: "Scheduled",
      },
      {
        id: 6,
        product: "Valve Assembly F",
        machine: "Press Machine 01",
        quantity: 600,
        priority: "High",
        startDate: "2025-10-04",
        endDate: "2025-10-09",
        status: "In Progress",
      },
    ];
    this.nextId = 7;
  },

  getAll() {
    return [...this.jobs];
  },
  getById(id) {
    return this.jobs.find((j) => j.id === id);
  },

  add(job) {
    job.id = this.nextId++;
    this.jobs.push(job);
    return job;
  },

  update(id, updatedJob) {
    const idx = this.jobs.findIndex((j) => j.id === id);
    if (idx !== -1) {
      this.jobs[idx] = { ...this.jobs[idx], ...updatedJob };
      return this.jobs[idx];
    }
    return null;
  },

  delete(id) {
    const idx = this.jobs.findIndex((j) => j.id === id);
    if (idx !== -1) {
      this.jobs.splice(idx, 1);
      return true;
    }
    return false;
  },

  search(term) {
    const lower = term.toLowerCase();
    return this.jobs.filter(
      (j) =>
        j.product.toLowerCase().includes(lower) ||
        j.machine.toLowerCase().includes(lower) ||
        j.status.toLowerCase().includes(lower) ||
        j.priority.toLowerCase().includes(lower)
    );
  },
};

let editingJobId = null;
let searchTimeout = null;
let currentFilter = "all";

function showNotifications() {
  const menu = document.getElementById("notificationMenu");
  const userMenu = document.getElementById("userMenu");
  userMenu.classList.remove("show");
  menu.classList.toggle("show");
}

function showUserMenu() {
  const menu = document.getElementById("userMenu");
  const notifMenu = document.getElementById("notificationMenu");
  notifMenu.classList.remove("show");
  menu.classList.toggle("show");
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    showNotification("👋 Logging out...", "info");
    setTimeout(() => {
      alert(
        "Logged out successfully! This is a demo - in production, you would be redirected to login page."
      );
      window.location.reload();
    }, 1000);
  }
}

function filterByStatus(status) {
  currentFilter = status;
  const allJobs = Store.getAll();
  if (status === "all") {
    renderJobsTable(allJobs);
    showNotification(`📊 Showing all ${allJobs.length} jobs`, "info");
  } else {
    const filtered = allJobs.filter((j) => j.status === status);
    renderJobsTable(filtered);
    showNotification(`🔍 Filtered: ${filtered.length} ${status} jobs`, "info");
  }
}

// Close dropdowns when clicking outside
document.addEventListener("click", function (e) {
  if (!e.target.closest(".nav-btn") && !e.target.closest(".dropdown-menu")) {
    document.getElementById("notificationMenu").classList.remove("show");
    document.getElementById("userMenu").classList.remove("show");
  }
});

function updateDashboard() {
  const jobs = Store.getAll();
  document.getElementById("totalJobs").textContent = jobs.length;
  document.getElementById("completedJobs").textContent = jobs.filter(
    (j) => j.status === "Completed"
  ).length;
  document.getElementById("inProgressJobs").textContent = jobs.filter(
    (j) => j.status === "In Progress"
  ).length;
  document.getElementById("delayedJobs").textContent = jobs.filter(
    (j) => j.status === "Delayed"
  ).length;
}

function renderJobsTable(jobs = null) {
  const jobsToRender = jobs || Store.getAll();
  const tbody = document.getElementById("jobsTableBody");

  if (jobsToRender.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="empty-state"><div class="empty-state-icon">📦</div><div>No jobs found</div></td></tr>';
    return;
  }

  tbody.innerHTML = jobsToRender
    .map(
      (job) => `
                <tr class="fade-in">
                    <td><strong>#${job.id}</strong></td>
                    <td>${job.product}</td>
                    <td>${job.machine}</td>
                    <td>${job.quantity}</td>
                    <td><span class="priority-${job.priority.toLowerCase()}">${
        job.priority
      }</span></td>
                    <td>${job.startDate}</td>
                    <td>${job.endDate}</td>
                    <td><span class="status-badge status-${job.status
                      .toLowerCase()
                      .replace(" ", "-")}">${job.status}</span></td>
                    <td>
                        <button class="btn edit btn-sm" onclick="editJob(${
                          job.id
                        })" title="Edit">✏️</button>
                        <button class="btn delete btn-sm" onclick="deleteJob(${
                          job.id
                        })" title="Delete">🗑️</button>
                    </td>
                </tr>
            `
    )
    .join("");
}

function renderGanttChart() {
  const jobs = Store.getAll().filter((j) => j.status !== "Completed");
  const container = document.getElementById("ganttChart");

  if (jobs.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">📊</div><div>No active jobs to display in timeline</div></div>';
    return;
  }

  const allDates = jobs.flatMap((j) => [
    new Date(j.startDate),
    new Date(j.endDate),
  ]);
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

  const statusColors = {
    Scheduled: "#17a2b8",
    "In Progress": "#ffc107",
    Delayed: "#dc3545",
  };

  container.innerHTML = jobs
    .map((job) => {
      const start = new Date(job.startDate);
      const end = new Date(job.endDate);
      const daysFromStart = Math.floor(
        (start - minDate) / (1000 * 60 * 60 * 24)
      );
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const leftPercent = (daysFromStart / totalDays) * 100;
      const widthPercent = (duration / totalDays) * 100;

      return `
                    <div class="gantt-row">
                        <div class="gantt-label">${job.product}</div>
                        <div class="gantt-timeline">
                            <div class="gantt-bar" style="left: ${leftPercent}%; width: ${widthPercent}%; background: ${
        statusColors[job.status] || "#6c757d"
      }">
                                ${job.machine}
                            </div>
                        </div>
                    </div>
                `;
    })
    .join("");
}

function openAddModal() {
  editingJobId = null;
  document.getElementById("modalTitle").textContent = "Add Production Job";
  document.getElementById("jobForm").reset();
  document.getElementById("jobModal").classList.add("show");
}

function closeModal() {
  document.getElementById("jobModal").classList.remove("show");
}

function editJob(id) {
  const job = Store.getById(id);
  if (!job) return;

  editingJobId = id;
  document.getElementById("modalTitle").textContent = "Edit Production Job";
  document.getElementById("productName").value = job.product;
  document.getElementById("machine").value = job.machine;
  document.getElementById("quantity").value = job.quantity;
  document.getElementById("priority").value = job.priority;
  document.getElementById("startDate").value = job.startDate;
  document.getElementById("endDate").value = job.endDate;
  document.getElementById("status").value = job.status;
  document.getElementById("jobModal").classList.add("show");
}

function saveJob() {
  const form = document.getElementById("jobForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const startDate = new Date(document.getElementById("startDate").value);
  const endDate = new Date(document.getElementById("endDate").value);

  if (endDate < startDate) {
    showNotification("⚠️ End date must be after start date!", "error");
    return;
  }

  const jobData = {
    product: document.getElementById("productName").value,
    machine: document.getElementById("machine").value,
    quantity: parseInt(document.getElementById("quantity").value),
    priority: document.getElementById("priority").value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    status: document.getElementById("status").value,
  };

  if (editingJobId) {
    Store.update(editingJobId, jobData);
    showNotification("✅ Job updated successfully!", "success");
  } else {
    Store.add(jobData);
    showNotification("✅ Job added successfully!", "success");
  }

  closeModal();
  refreshUI();
}

function deleteJob(id) {
  if (confirm("Are you sure you want to delete this job?")) {
    Store.delete(id);
    showNotification("🗑️ Job deleted successfully!", "info");
    refreshUI();
  }
}

function showNotification(message, type) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function refreshUI() {
  updateDashboard();
  renderJobsTable();
  renderGanttChart();
}

const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearSearch");

searchInput.addEventListener("input", function (e) {
  clearTimeout(searchTimeout);
  const term = e.target.value.trim();

  if (term.length > 0) {
    clearBtn.style.display = "inline-block";
  } else {
    clearBtn.style.display = "none";
  }

  searchTimeout = setTimeout(() => {
    if (term) {
      const results = Store.search(term);
      renderJobsTable(results);
    } else {
      renderJobsTable();
    }
  }, 300);
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearBtn.style.display = "none";
  renderJobsTable();
});

document.getElementById("jobModal").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

Store.init();
refreshUI();
