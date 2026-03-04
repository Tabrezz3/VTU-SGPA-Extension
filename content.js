// VTU SGPA Calculator — 2022 Scheme, CSE/ISE

const CREDITS = {
  // --- 3rd Sem ---
  "BCS301": 4, "BIS301": 4,
  "BCS302": 4, "BIS302": 4,
  "BCS303": 4, "BIS303": 4,
  "BCS304": 3, "BIS304": 3,
  "BCSL305": 1, "BISL305": 1,
  "BCS306A": 3, "BCS306B": 3, "BIS306A": 3, "BIS306B": 3,
  "BSCK307": 0, "BNSK359": 0,
  "BCS358A": 1, "BCS358B": 1, "BCS358C": 1, "BCS358D": 1,
  "BIS358A": 1, "BIS358B": 1, "BIS358C": 1,

  // --- 7th Sem ---
  "BCS701": 4, "BIS701": 4,
  "BCS702": 4, "BIS702": 4,
  "BCS703": 4, "BIS703": 4,
  "BCG786": 6, "BIS786": 6, "BCS786": 6,
};

const NAMES = {
  // --- 3rd Sem ---
  "BCS301": "Mathematics for CS", "BIS301": "Mathematics for CS",
  "BCS302": "Digital Design & CO", "BIS302": "Digital Design & CO",
  "BCS303": "Operating Systems", "BIS303": "Operating Systems",
  "BCS304": "Data Structures", "BIS304": "Data Structures",
  "BCSL305": "DS Lab", "BISL305": "DS Lab",
  "BCS306A": "OOP with Java", "BCS306B": "OOP with C++",
  "BIS306A": "OOP with Java", "BIS306B": "OOP with C++",
  "BSCK307": "Social Connect", "BNSK359": "NSS/NSC",
  "BCS358A": "Data Analytics (Excel)", "BCS358B": "Data Analytics (R)",
  "BCS358C": "Project Mgmt (Git)", "BCS358D": "IoT Lab",
  "BIS358A": "Data Analytics (Excel)", "BIS358B": "Data Analytics (R)",
  "BIS358C": "Project Mgmt (Git)",

  // --- 7th Sem ---
  "BCS701": "Internet of Things", "BIS701": "Big Data Analytics",
  "BCS702": "Parallel Computing", "BIS702": "Parallel Computing",
  "BCS703": "Crypto & Network Security", "BIS703": "Info & Network Security",
  "BCG786": "Major Project Phase-II", "BIS786": "Major Project Phase-II", "BCS786": "Major Project Phase-II",
};

// Extract semester number from subject code (first digit in the numeric part)
function getSemester(code) {
  const m = code.match(/\d/);
  return m ? parseInt(m[0]) : 0;
}

function getCredits(code) {
  if (CREDITS[code] !== undefined) return CREDITS[code];
  const sem = getSemester(code);

  // Elective patterns: x14x = PEC (3cr), x55x = OEC (3cr), x86 = project (6cr)
  if (/714/.test(code)) return 3;
  if (/755/.test(code)) return 3;
  if (/786/.test(code)) return 6;

  // 3rd sem fallbacks
  if (sem === 3) {
    if (/3(01|02|03)/.test(code)) return 4;
    if (/3(04|06)/.test(code)) return 3;
    if (/L305|358/.test(code)) return 1;
    if (/307|359/.test(code)) return 0;
  }
  // 7th sem fallbacks
  if (sem === 7) {
    if (/7(01|02|03)/.test(code)) return 4;
  }
  return 3; // safe default for unknown electives
}

// Grade point directly from Total marks (VTU grading scale)
function toGP(m) {
  if (m >= 90) return 10; if (m >= 80) return 9;
  if (m >= 70) return 8; if (m >= 60) return 7;
  if (m >= 55) return 6; if (m >= 50) return 5;
  if (m >= 40) return 4; return 0;
}

function toGrade(m) {
  if (m >= 90) return "O"; if (m >= 80) return "A+";
  if (m >= 70) return "A"; if (m >= 60) return "B+";
  if (m >= 55) return "B"; if (m >= 50) return "C";
  if (m >= 40) return "P"; return "F";
}

function gradeColor(m) {
  if (m >= 80) return "#22c55e";
  if (m >= 60) return "#3b82f6";
  if (m >= 40) return "#f59e0b";
  return "#ef4444";
}

function extractSubjects() {
  const subjects = [], seen = new Set();
  const codeRe = /^[A-Z]{2,5}L?\d{3}[A-Z]?$/;

  document.querySelectorAll("table").forEach(table => {
    let totalColIndex = -1;
    const allRows = Array.from(table.querySelectorAll('tr'));

    // Find "Total" column index from header rows
    for (let i = 0; i < Math.min(5, allRows.length); i++) {
      const cells = Array.from(allRows[i].querySelectorAll('td, th'));
      for (let j = 0; j < cells.length; j++) {
        const txt = cells[j].innerText.trim().replace(/\u00a0/g, ' ').toLowerCase();
        if (txt.includes('total') && !txt.includes('internal') && !txt.includes('external')) {
          totalColIndex = j;
          break;
        }
      }
      if (totalColIndex >= 0) break;
    }

    if (totalColIndex < 0) return;

    allRows.forEach(row => {
      const cells = Array.from(row.querySelectorAll("td, th")).map(c => c.innerText.trim());
      if (cells.length <= totalColIndex) return;

      let code = null;
      for (let i = 0; i < cells.length; i++) {
        if (codeRe.test(cells[i])) { code = cells[i]; break; }
      }
      if (!code || seen.has(code)) return;

      const marks = parseInt(cells[totalColIndex]);
      if (isNaN(marks) || marks < 0) return;

      seen.add(code);
      const credits = getCredits(code);
      const gp = toGP(marks);
      subjects.push({
        code, name: NAMES[code] || code,
        marks, credits, gp, grade: toGrade(marks),
        sem: getSemester(code)
      });
    });
  });

  return subjects;
}

function extractFallback() {
  const subjects = [], seen = new Set();
  const codeRe = /\b([A-Z]{2,5}L?\d{3}[A-Z]?)\b/;
  const lines = document.body.innerText.split("\n").map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(codeRe);
    if (!m || seen.has(m[1])) continue;
    const code = m[1];
    for (let j = i; j < Math.min(i + 3, lines.length); j++) {
      const clean = lines[j].replace(/\d{4}[-\/]\d{2}[-\/]\d{2}/g, '').replace(/[A-Z]{2,5}L?\d{3}[A-Z]?/g, '');
      const nums = (clean.match(/\b(\d{1,3})\b/g) || []).map(Number).filter(n => n >= 0 && n <= 100);
      if (nums.length) {
        seen.add(code);
        const marks = nums[nums.length - 1];
        const credits = getCredits(code);
        subjects.push({
          code, name: NAMES[code] || code,
          marks, credits, gp: toGP(marks), grade: toGrade(marks),
          sem: getSemester(code)
        });
        break;
      }
    }
  }
  return subjects;
}

// Group subjects by semester, return the first semester found on the page
function groupBySemester(subjects) {
  if (!subjects.length) return { sem: 0, subjects: [] };

  // First subject's semester = the topmost table on the page
  const firstSem = subjects[0].sem;
  const filtered = subjects.filter(s => s.sem === firstSem);
  return { sem: firstSem, subjects: filtered };
}

function calcSGPA(subjects) {
  const s = subjects.filter(x => x.credits > 0);
  if (!s.length) return "0.00";
  const tc = s.reduce((a, x) => a + x.credits, 0);
  const ws = s.reduce((a, x) => a + x.gp * x.credits, 0);
  return (ws / tc).toFixed(2);
}

function sgpaLabel(v) {
  if (v >= 9.5) return ["Outstanding!", "#a855f7"];
  if (v >= 9.0) return ["Excellent!", "#22c55e"];
  if (v >= 8.0) return ["Very Good", "#3b82f6"];
  if (v >= 6.5) return ["Good", "#f59e0b"];
  if (v >= 5.0) return ["Average", "#f97316"];
  return ["Needs Improvement", "#ef4444"];
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function buildWidget(subjects, sgpa, sem) {
  document.getElementById("vtu-sgpa-widget")?.remove();
  const [lbl, col] = sgpaLabel(parseFloat(sgpa));
  const fails = subjects.filter(s => s.marks < 40 && s.credits > 0).length;
  const tc = subjects.filter(s => s.credits > 0).reduce((a, s) => a + s.credits, 0);
  const semLabel = sem ? `${ordinal(sem)} Sem` : "";

  const rows = subjects.map(s => {
    const gc = gradeColor(s.marks);
    const right = s.credits === 0
      ? `<span style="font-size:10px;color:#475569;font-style:italic">activity</span>`
      : `<span class="vtu-gp">${s.credits}cr&rarr;${s.gp}GP</span>`;
    return `<div class="vtu-row">
      <div class="vtu-info">
        <span class="vtu-code">${s.code}</span>
        <span class="vtu-name">${s.name.length > 28 ? s.name.slice(0, 26) + "…" : s.name}</span>
      </div>
      <div class="vtu-scores">
        <span class="vtu-marks">${s.marks}</span>
        <span class="vtu-badge" style="background:${gc}20;color:${gc};border:1px solid ${gc}40">${s.grade}</span>
        ${right}
      </div>
    </div>`;
  }).join("");

  const w = document.createElement("div");
  w.id = "vtu-sgpa-widget";
  w.innerHTML = `
    <div class="vtu-header" id="vtu-handle">
      <span class="vtu-logo">📊</span>
      <div>
        <div class="vtu-title">VTU SGPA Calculator</div>
        <div class="vtu-sub">2022 Scheme · ${semLabel} · ${subjects.length} subjects</div>
      </div>
      <button class="vtu-x" id="vtu-x">✕</button>
    </div>
    <div class="vtu-hero">
      <div class="vtu-num" style="color:${col}">${sgpa}</div>
      <div class="vtu-lbl" style="color:${col}">${lbl}</div>
      <div class="vtu-meta">SGPA · ${tc} credits</div>
    </div>
    ${fails ? `<div class="vtu-warn">⚠️ ${fails} subject(s) below passing</div>` : ""}
    <div class="vtu-sec-title">Subject Breakdown</div>
    <div class="vtu-list">${rows}</div>
    <div class="vtu-footer">VTU 2022 Scheme · SGPA = Σ(GP×Credits) / Σ(Credits)</div>`;

  document.body.appendChild(w);
  document.getElementById("vtu-x").onclick = () => w.remove();

  let drag = false, ox, oy, ol, ot;
  document.getElementById("vtu-handle").addEventListener("mousedown", e => {
    if (e.target.id === "vtu-x") return;
    drag = true; ox = e.clientX; oy = e.clientY; ol = w.offsetLeft; ot = w.offsetTop;
    w.style.right = "auto"; w.style.bottom = "auto"; e.preventDefault();
  });
  document.addEventListener("mousemove", e => { if (drag) { w.style.left = ol + e.clientX - ox + "px"; w.style.top = ot + e.clientY - oy + "px"; } });
  document.addEventListener("mouseup", () => drag = false);
}

function showEmpty() {
  document.getElementById("vtu-sgpa-widget")?.remove();
  const w = document.createElement("div");
  w.id = "vtu-sgpa-widget";
  w.innerHTML = `<div class="vtu-header"><span class="vtu-logo">📊</span>
    <div><div class="vtu-title">VTU SGPA Calculator</div><div class="vtu-sub">2022 Scheme</div></div>
    <button class="vtu-x" id="vtu-x">✕</button></div>
    <div style="padding:24px;text-align:center;color:#64748b;font-size:13px">
      <div style="font-size:36px;margin-bottom:8px">🔍</div>
      No results detected.<br>Open your VTU results page with marks visible.
    </div>`;
  document.body.appendChild(w);
  document.getElementById("vtu-x").onclick = () => w.remove();
}

function init() {
  let allSubjects = extractSubjects();
  if (!allSubjects.length) allSubjects = extractFallback();

  if (allSubjects.length) {
    const { sem, subjects } = groupBySemester(allSubjects);
    buildWidget(subjects, calcSGPA(subjects), sem);
    return;
  }

  // Watch for dynamically loaded results
  let retries = 0;
  const observer = new MutationObserver(() => {
    retries++;
    let s2 = extractSubjects();
    if (!s2.length) s2 = extractFallback();
    if (s2.length) {
      observer.disconnect();
      const { sem, subjects } = groupBySemester(s2);
      buildWidget(subjects, calcSGPA(subjects), sem);
    } else if (retries > 30) {
      observer.disconnect();
      showEmpty();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    observer.disconnect();
    if (!document.getElementById("vtu-sgpa-widget")) {
      let s3 = extractSubjects();
      if (!s3.length) s3 = extractFallback();
      if (s3.length) {
        const { sem, subjects } = groupBySemester(s3);
        buildWidget(subjects, calcSGPA(subjects), sem);
      } else showEmpty();
    }
  }, 10000);
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", () => setTimeout(init, 500))
  : setTimeout(init, 500);
