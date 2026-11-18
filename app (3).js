(() => {
  const $ = (s) => document.querySelector(s);
  const KEY = "expense-tracker:v1";
  const CATS = {
    expense: ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Education", "Other"],
    income: ["Salary", "Freelance", "Gift", "Other"],
  };
  const PALETTE = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#ec4899", "#8b5cf6", "#64748b"];
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

  let state = load();
  let editId = null;
  let month = new Date().toISOString().slice(0, 7);

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.tx)) return s;
    } catch {}
    return { tx: [], budget: 0, theme: null };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
  const catColor = (c) => PALETTE[CATS.expense.indexOf(c) >= 0 ? CATS.expense.indexOf(c) : 7];

  // ---------- Theme ----------
  function applyTheme() {
    const t = state.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = t;
  }
  $("#themeBtn").onclick = () => {
    state.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    save(); applyTheme(); render();
  };

  // ---------- Form ----------
  const typeVal = () => document.querySelector('input[name="type"]:checked').value;
  function fillCategories() {
    const sel = $("#category");
    sel.innerHTML = CATS[typeVal()].map((c) => `<option>${c}</option>`).join("");
  }
  document.querySelectorAll('input[name="type"]').forEach((r) => (r.onchange = fillCategories));

  function resetForm() {
    editId = null;
    $("#txForm").reset();
    $("#date").value = today();
    fillCategories();
    $("#formTitle").textContent = "Add transaction";
    $("#saveBtn").textContent = "Add";
    $("#cancelBtn").hidden = true;
  }
  $("#cancelBtn").onclick = resetForm;

  $("#txForm").onsubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat($("#amount").value);
    if (!(amount > 0)) return;
    const tx = {
      id: editId || uid(),
      type: typeVal(),
      title: $("#title").value.trim(),
      amount,
      category: $("#category").value,
      date: $("#date").value,
      note: $("#note").value.trim(),
    };
    if (editId) state.tx = state.tx.map((t) => (t.id === editId ? tx : t));
    else state.tx.push(tx);
    save();
    month = tx.date.slice(0, 7);
    $("#monthPicker").value = month;
    resetForm();
    render();
  };

  function startEdit(id) {
    const t = state.tx.find((x) => x.id === id);
    if (!t) return;
    editId = id;
    document.querySelector(`input[name="type"][value="${t.type}"]`).checked = true;
    fillCategories();
    $("#title").value = t.title;
    $("#amount").value = t.amount;
    $("#date").value = t.date;
    $("#category").value = t.category;
    $("#note").value = t.note || "";
    $("#formTitle").textContent = "Edit transaction";
    $("#saveBtn").textContent = "Save";
    $("#cancelBtn").hidden = false;
    $("#title").focus();
    scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Filters / month ----------
  $("#monthPicker").onchange = (e) => { month = e.target.value || month; render(); };
  ["#search", "#filterType", "#filterCat"].forEach((s) => ($(s).oninput = renderList));

  $("#filterCat").innerHTML =
    '<option value="all">All categories</option>' +
    [...new Set([...CATS.expense, ...CATS.income])].map((c) => `<option>${c}</option>`).join("");

  // ---------- Budget ----------
  $("#budgetBtn").onclick = () => {
    const v = prompt("Monthly budget in ₹ (0 to remove):", state.budget || "");
    if (v === null) return;
    const n = parseFloat(v);
    state.budget = n > 0 ? n : 0;
    save(); render();
  };

  // ---------- Export / clear ----------
  $("#exportBtn").onclick = () => {
    const rows = [["Date", "Type", "Title", "Category", "Amount", "Note"]].concat(
      [...state.tx].sort((a, b) => a.date.localeCompare(b.date)).map((t) => [t.date, t.type, t.title, t.category, t.amount, t.note || ""])
    );
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $("#clearBtn").onclick = () => {
    if (confirm("Delete ALL transactions and settings? This cannot be undone.")) {
      state = { tx: [], budget: 0, theme: state.theme };
      save(); resetForm(); render();
    }
  };

  // ---------- Render ----------
  const monthTx = () => state.tx.filter((t) => t.date.startsWith(month));

  function renderSummary() {
    const tx = monthTx();
    const inc = tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    $("#income").textContent = money.format(inc);
    $("#expense").textContent = money.format(exp);
    $("#balance").textContent = money.format(inc - exp);
    $("#balance").style.color = inc - exp < 0 ? "var(--expense)" : "";
    const fill = $("#budgetFill");
    if (state.budget > 0) {
      const pct = Math.min(100, (exp / state.budget) * 100);
      $("#budgetText").textContent = `${money.format(exp)} / ${money.format(state.budget)}`;
      fill.style.width = pct + "%";
      fill.style.background = pct >= 100 ? "var(--expense)" : pct >= 80 ? "#f59e0b" : "var(--income)";
    } else {
      $("#budgetText").textContent = "Not set";
      fill.style.width = "0";
    }
  }

  function renderChart() {
    const cv = $("#chart");
    const dpr = window.devicePixelRatio || 1;
    const size = 260;
    cv.width = size * dpr; cv.height = size * dpr;
    cv.style.width = size + "px"; cv.style.height = size + "px";
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const totals = {};
    monthTx().filter((t) => t.type === "expense").forEach((t) => (totals[t.category] = (totals[t.category] || 0) + t.amount));
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const sum = entries.reduce((s, [, v]) => s + v, 0);
    const style = getComputedStyle(document.documentElement);
    const c = size / 2, R = 115, r = 70;

    if (!sum) {
      ctx.beginPath(); ctx.arc(c, c, (R + r) / 2, 0, 7);
      ctx.lineWidth = R - r; ctx.strokeStyle = style.getPropertyValue("--border"); ctx.stroke();
      ctx.fillStyle = style.getPropertyValue("--muted"); ctx.textAlign = "center"; ctx.font = "14px system-ui";
      ctx.fillText("No expenses", c, c + 5);
      $("#legend").innerHTML = "";
      return;
    }
    let a = -Math.PI / 2;
    entries.forEach(([cat, v]) => {
      const ang = (v / sum) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(c, c, (R + r) / 2, a, a + ang);
      ctx.lineWidth = R - r; ctx.strokeStyle = catColor(cat); ctx.stroke();
      a += ang;
    });
    ctx.fillStyle = style.getPropertyValue("--text"); ctx.textAlign = "center";
    ctx.font = "600 18px system-ui"; ctx.fillText(money.format(sum), c, c + 4);
    ctx.fillStyle = style.getPropertyValue("--muted"); ctx.font = "12px system-ui"; ctx.fillText("spent", c, c + 22);

    $("#legend").innerHTML = entries
      .map(([cat, v]) => `<li><span class="dot" style="background:${catColor(cat)}"></span>${esc(cat)}<span class="pct">${Math.round((v / sum) * 100)}% · ${money.format(v)}</span></li>`)
      .join("");
  }

  function renderList() {
    const q = $("#search").value.trim().toLowerCase();
    const ft = $("#filterType").value, fc = $("#filterCat").value;
    const items = monthTx()
      .filter((t) => (ft === "all" || t.type === ft) && (fc === "all" || t.category === fc) &&
        (!q || (t.title + " " + t.category + " " + (t.note || "")).toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date));
    $("#empty").hidden = items.length > 0;
    $("#list").innerHTML = items.map((t) => `
      <li class="item">
        <div class="badge" style="background:${t.type === "income" ? "#16a34a" : catColor(t.category)}">${esc(t.category[0])}</div>
        <div class="meta">
          <div class="t">${esc(t.title)}</div>
          <div class="s">${esc(t.category)} · ${t.date}${t.note ? " · " + esc(t.note) : ""}</div>
        </div>
        <div class="amt ${t.type}">${t.type === "income" ? "+" : "−"}${money.format(t.amount)}</div>
        <button class="icon-btn" data-edit="${t.id}" title="Edit">✏️</button>
        <button class="icon-btn" data-del="${t.id}" title="Delete">🗑️</button>
      </li>`).join("");
  }

  $("#list").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.edit) startEdit(b.dataset.edit);
    if (b.dataset.del && confirm("Delete this transaction?")) {
      state.tx = state.tx.filter((t) => t.id !== b.dataset.del);
      save(); render();
    }
  };

  function render() { renderSummary(); renderChart(); renderList(); }

  // ---------- Init ----------
  applyTheme();
  $("#monthPicker").value = month;
  resetForm();
  render();
})();
