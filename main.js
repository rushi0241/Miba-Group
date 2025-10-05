const stationsData = [
  {
    id: "S1",
    name: "Loader",
    x: 120,
    status: "running",
    oee: 92,
    uptime: "99.2%",
    notes: "Automated loader",
  },
  {
    id: "S2",
    name: "Robot Arm A",
    x: 260,
    status: "running",
    oee: 88,
    uptime: "97.5%",
    notes: "Pick & place",
  },
  {
    id: "S3",
    name: "Inspection",
    x: 400,
    status: "starved",
    oee: 75,
    uptime: "95.1%",
    notes: "Vision system",
  },
  {
    id: "S4",
    name: "Robot Arm B",
    x: 540,
    status: "running",
    oee: 86,
    uptime: "96.0%",
    notes: "Assembly",
  },
  {
    id: "S5",
    name: "Packer",
    x: 700,
    status: "down",
    oee: 0,
    uptime: "88.2%",
    notes: "Maintenance",
  },
];

let items = [];
let playing = true;
let speed = 1;
let timePct = 0;
const lineWidth = 820;

function $(sel) {
  return document.querySelector(sel);
}
function $all(sel) {
  return Array.from(document.querySelectorAll(sel));
}

function init() {
  const g = document.getElementById("stations");
  stationsData.forEach((s, idx) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "station");
    group.dataset.id = s.id;

    const baseY = 120;
    const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    body.setAttribute("x", s.x);
    body.setAttribute("y", baseY - 40);
    body.setAttribute("rx", 6);
    body.setAttribute("width", 90);
    body.setAttribute("height", 60);
    body.setAttribute("fill", stationColor(s.status));
    group.appendChild(body);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", s.x + 6);
    text.setAttribute("y", baseY + 35);
    text.setAttribute("class", "label");
    text.textContent = s.name;
    group.appendChild(text);

    group.addEventListener("click", () => openStation(s));
    g.appendChild(group);
  });

  const select = document.getElementById("stationSelect");
  select.innerHTML = stationsData
    .map((s) => `<option value="${s.id}">${s.id} - ${s.name}</option>`)
    .join("");
  select.addEventListener("change", (e) => {
    const s = stationsData.find((x) => x.id === e.target.value);
    if (s) openStation(s);
  });

  document.getElementById("searchStation").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    $all("#stations .station").forEach((node) => {
      const s = stationsData.find((x) => x.id === node.dataset.id);
      node.style.opacity =
        !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
          ? 1
          : 0.15;
    });
  });

  document
    .getElementById("btnPlay")
    .addEventListener("click", () => (playing = true));
  document
    .getElementById("btnPause")
    .addEventListener("click", () => (playing = false));
  document.getElementById("btnReset").addEventListener("click", () => {
    timePct = 0;
    $("#timeline").value = 0;
  });
  document.getElementById("speedRange").addEventListener("input", (e) => {
    speed = parseFloat(e.target.value);
    document.getElementById("speedLabel").textContent = `${speed}x`;
  });
  document.getElementById("timeline").addEventListener("input", (e) => {
    timePct = parseInt(e.target.value, 10);
    playing = false;
  });

  ["Running", "Starved", "Down"].forEach((name) => {
    document
      .getElementById("filter" + name)
      .addEventListener("change", updateFilters);
  });

  document
    .getElementById("toggleTheme")
    .addEventListener("click", () =>
      document.body.classList.toggle("dark-mode")
    );

  for (let i = 0; i < 8; i++) items.push({ pos: (i * 0.12) % 1, state: "ok" });

  if (stationsData.length) {
    openStation(stationsData[0]);
    select.value = stationsData[0].id;
  }

  updateKPIs();
  requestAnimationFrame(tick);
}

function stationColor(status) {
  if (status === "running") return "#2ecc71";
  if (status === "starved") return "#f1c40f";
  return "#e74c3c";
}

function updateFilters() {
  const show = {
    running: document.getElementById("filterRunning").checked,
    starved: document.getElementById("filterStarved").checked,
    down: document.getElementById("filterDown").checked,
  };
  $all("#stations .station").forEach((node) => {
    const s = stationsData.find((x) => x.id === node.dataset.id);
    node.style.display = show[s.status] ? "" : "none";
  });
}

function updateKPIs() {
  const running = stationsData.filter((s) => s.status === "running").length;
  const alerts = stationsData.filter((s) => s.status === "down").length;
  const throughput = Math.round(120 + Math.random() * 30 * running);
  const oee = Math.round(
    (running / stationsData.length) * 100 - Math.random() * 5
  );
  const wip = items.length;
  document.getElementById("kpiThroughput").textContent = throughput;
  document.getElementById("kpiOee").innerHTML = `${Math.max(
    0,
    oee
  )}<sup style="font-size:20px">%</sup>`;
  document.getElementById("kpiWip").textContent = wip;
  document.getElementById("kpiAlerts").textContent = alerts;
}

function renderItems(dt) {
  const itemsGroup = document.getElementById("items");
  itemsGroup.innerHTML = "";

  if (playing) {
    timePct = Math.min(100, timePct + dt * 0.6 * speed);
    document.getElementById("timeline").value = Math.floor(timePct);
  }
  items.forEach((it) => {
    if (playing) it.pos = (it.pos + dt * 0.0006 * speed) % 1;
    const cx = 40 + it.pos * lineWidth;
    const cy = 180;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", cx);
    c.setAttribute("cy", cy);
    c.setAttribute("r", 8);
    c.setAttribute(
      "class",
      "item" +
        (it.state === "warn"
          ? " warning"
          : it.state === "down"
          ? " danger"
          : "")
    );
    itemsGroup.appendChild(c);
  });
}

function renderStationStates() {
  if (Math.random() < 0.01) {
    const s = stationsData[Math.floor(Math.random() * stationsData.length)];
    const all = ["running", "starved", "down"];
    s.status = all[Math.floor(Math.random() * all.length)];
  }

  $all("#stations .station").forEach((node) => {
    const s = stationsData.find((x) => x.id === node.dataset.id);
    const rect = node.querySelector("rect");
    rect.setAttribute("fill", stationColor(s.status));
  });
}

function openStation(s) {
  const el = document.getElementById("stationDetails");
  el.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h4 class="mb-0">${s.name} <small class="text-muted">(${
    s.id
  })</small></h4>
      <span class="badge ${
        s.status === "running"
          ? "badge-success"
          : s.status === "starved"
          ? "badge-warning"
          : "badge-danger"
      } text-uppercase">${s.status}</span>
    </div>
    <ul class="list-unstyled mb-2">
      <li><i class="fas fa-percentage mr-2 text-muted"></i>OEE: <strong>${
        s.oee
      }%</strong></li>
      <li><i class="fas fa-clock mr-2 text-muted"></i>Uptime: <strong>${
        s.uptime
      }</strong></li>
      <li><i class="fas fa-sticky-note mr-2 text-muted"></i>${s.notes}</li>
    </ul>
    <button class="btn btn-sm btn-outline-primary" data-toggle="modal" data-target="#stationModal">View Details</button>
  `;
  document.getElementById(
    "stationModalTitle"
  ).textContent = `${s.name} (${s.id})`;
  document.getElementById("stationModalBody").innerHTML = `
    <p>Status: <strong>${s.status.toUpperCase()}</strong></p>
    <p>OEE: <strong>${s.oee}%</strong></p>
    <p>Uptime: <strong>${s.uptime}</strong></p>
    <p>${s.notes}</p>
  `;
}

let last = performance.now();
function tick(ts) {
  const dt = ts - last;
  last = ts;
  renderItems(dt);
  renderStationStates();
  if (Math.random() < 0.02) updateKPIs();
  requestAnimationFrame(tick);
}

document.addEventListener("DOMContentLoaded", init);

const Store = (() => {
  const state = {
    orders: [
      {
        id: "WO-1001",
        product: "Gearbox",
        qty: 120,
        due: dateAdd(2),
        priority: "High",
        status: "Planned",
      },
      {
        id: "WO-1002",
        product: "Chassis",
        qty: 60,
        due: dateAdd(5),
        priority: "Normal",
        status: "In Progress",
      },
      {
        id: "WO-1003",
        product: "Motor",
        qty: 40,
        due: dateAdd(1),
        priority: "High",
        status: "Quality Check",
      },
    ],
    filter: { q: "", status: "" },
  };

  function nextId() {
    const max = state.orders.reduce(
      (m, o) => Math.max(m, parseInt(o.id.split("-")[1])),
      1000
    );
    return `WO-${max + 1}`;
  }

  function list() {
    const { q, status } = state.filter;
    const lc = q.trim().toLowerCase();
    return state.orders.filter((o) => {
      const matchQ = !lc || `${o.id} ${o.product}`.toLowerCase().includes(lc);
      const matchS = !status || o.status === status;
      return matchQ && matchS;
    });
  }

  function add(order) {
    order.id = nextId();
    state.orders.unshift(order);
    return order;
  }

  function update(id, patch) {
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("Order not found");
    state.orders[idx] = { ...state.orders[idx], ...patch };
    return state.orders[idx];
  }

  function remove(id) {
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx !== -1) state.orders.splice(idx, 1);
  }

  function setFilter(partial) {
    Object.assign(state.filter, partial);
  }
  function get() {
    return state;
  }

  return { list, add, update, remove, setFilter, get };
})();

function dateAdd(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toast(message, type = "success") {
  const wrap = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = `toast-item ${type}`;
  el.innerHTML = `<i class="fas ${
    type === "success" ? "fa-check" : "fa-times"
  }"></i><span>${message}</span><button class="close">&times;</button>`;
  wrap.appendChild(el);
  const close = () => {
    el.remove();
  };
  el.querySelector(".close").addEventListener("click", close);
  setTimeout(close, 3000);
}

function badge(status) {
  return `<span class="wo-badge wo-${status.replace(
    / /g,
    "\\ "
  )}">${status}</span>`;
}

function renderTable() {
  const tbody = document.getElementById("woTbody");
  if (!tbody) return;
  const rows = Store.list()
    .map(
      (o) => `
    <tr>
      <td>${o.id}</td>
      <td>${o.product}</td>
      <td>${o.qty}</td>
      <td>${o.due}</td>
      <td>${o.priority}</td>
      <td>${badge(o.status)}</td>
      <td class="actions">
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-outline-secondary" title="Edit" data-edit="${
            o.id
          }"><i class="fas fa-edit"></i></button>
          <button class="btn btn-outline-danger" title="Delete" data-del="${
            o.id
          }"><i class="fas fa-trash"></i></button>
          <div class="btn-group" role="group">
            <button id="act-${
              o.id
            }" type="button" class="btn btn-outline-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" ${
        o.status === "Completed" || o.status === "Cancelled" ? "disabled" : ""
      }>
              Move
            </button>
            <div class="dropdown-menu dropdown-menu-right" aria-labelledby="act-${
              o.id
            }">
              ${workflowMenuItems(o)}
            </div>
          </div>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
  tbody.innerHTML =
    rows ||
    `<tr><td colspan="7" class="text-center text-muted">No orders</td></tr>`;
}

function workflowMenuItems(o) {
  const items = [];
  if (o.status === "Planned")
    items.push(
      `<a class="dropdown-item" href="javascript:;" data-action="start:${o.id}"><i class="fas fa-play mr-2 text-primary"></i>Start</a>`
    );
  if (o.status === "In Progress")
    items.push(
      `<a class="dropdown-item" href="javascript:;" data-action="qc:${o.id}"><i class="fas fa-clipboard-check mr-2 text-warning"></i>Send to QC</a>`
    );
  if (o.status === "Quality Check")
    items.push(
      `<a class="dropdown-item" href="javascript:;" data-action="complete:${o.id}"><i class="fas fa-check mr-2 text-success"></i>Complete</a>`
    );
  if (o.status !== "Cancelled" && o.status !== "Completed")
    items.push(
      `<a class="dropdown-item" href="javascript:;" data-action="cancel:${o.id}"><i class="fas fa-ban mr-2 text-muted"></i>Cancel</a>`
    );
  return items.join("");
}

function validate(form) {
  const errs = [];
  const product = form.woProduct.value.trim();
  const qty = parseInt(form.woQty.value, 10);
  const due = form.woDue.value;
  if (!product) errs.push("Product is required");
  if (!(qty > 0)) errs.push("Quantity must be > 0");
  if (!due) errs.push("Due date is required");
  return { ok: errs.length === 0, errs };
}

function initWorkOrders() {
  const statusSel = document.getElementById("woStatusFilter");
  const search = document.getElementById("woSearch");
  const addBtn = document.getElementById("btnAddOrder");
  const tbody = document.getElementById("woTbody");
  const form = document.getElementById("woForm");
  const save = document.getElementById("woSave");
  const errorBox = document.getElementById("woError");

  if (!statusSel) return;

  let t;
  const applySearch = () => {
    Store.setFilter({ q: search.value });
    renderTable();
  };
  search.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(applySearch, 200);
  });
  statusSel.addEventListener("change", () => {
    Store.setFilter({ status: statusSel.value });
    renderTable();
  });

  addBtn.addEventListener("click", () => {
    document.getElementById("woModalTitle").textContent = "Add Work Order";
    form.reset();
    document.getElementById("woId").value = "";
    window.jQuery("#woModal").modal("show");
  });

  save.addEventListener("click", () => {
    const result = validate(form);
    if (!result.ok) {
      errorBox.classList.remove("d-none");
      errorBox.textContent = result.errs.join(" • ");
      return;
    }
    errorBox.classList.add("d-none");
    const payload = {
      product: form.woProduct.value.trim(),
      qty: parseInt(form.woQty.value, 10),
      due: form.woDue.value,
      priority: form.woPriority.value,
      status: form.woStatus.value,
    };
    const id = document.getElementById("woId").value;
    if (id) {
      Store.update(id, payload);
      toast("Order updated");
    } else {
      const o = Store.add(payload);
      toast(`Order ${o.id} created`);
    }
    window.jQuery("#woModal").modal("hide");
    renderTable();
  });

  tbody.addEventListener("click", (e) => {
    const editId = e.target.closest("[data-edit]")?.dataset.edit;
    const delId = e.target.closest("[data-del]")?.dataset.del;
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (editId) {
      const o = Store.get().orders.find((x) => x.id === editId);
      document.getElementById("woModalTitle").textContent = `Edit ${o.id}`;
      document.getElementById("woId").value = o.id;
      document.getElementById("woProduct").value = o.product;
      document.getElementById("woQty").value = o.qty;
      document.getElementById("woDue").value = o.due;
      document.getElementById("woPriority").value = o.priority;
      document.getElementById("woStatus").value = o.status;
      window.jQuery("#woModal").modal("show");
    }
    if (delId) {
      if (confirm("Delete this order?")) {
        Store.remove(delId);
        toast("Order deleted", "error");
        renderTable();
      }
    }
    if (action) {
      const [act, id] = action.split(":");
      const map = {
        start: "In Progress",
        qc: "Quality Check",
        complete: "Completed",
        cancel: "Cancelled",
      };
      Store.update(id, { status: map[act] });
      toast(`Order ${id} -> ${map[act]}`);
      renderTable();
    }
  });

  renderTable();
}

document.addEventListener("DOMContentLoaded", initWorkOrders);
