const COMMON = ["password","123456","qwerty","admin","welcome","letmein","monkey","iloveyou"];

function charClasses(p) {
  return {
    lower: /[a-z]/.test(p),
    upper: /[A-Z]/.test(p),
    digit: /[0-9]/.test(p),
    symbol: /[^A-Za-z0-9]/.test(p)
  };
}

function estimateEntropy(p) {
  if (!p) return 0;
  const cls = charClasses(p);
  let pool = 0;
  if (cls.lower) pool += 26;
  if (cls.upper) pool += 26;
  if (cls.digit) pool += 10;
  if (cls.symbol) pool += 32;
  if (pool === 0) return 0;
  return +(p.length * Math.log2(pool)).toFixed(1);
}

function analyze(p) {
  const reasons = [];
  if (!p) return ["No password entered."];

  const lower = p.toLowerCase();
  if (p.length < 8) reasons.push("Too short — 8+ chars recommended.");
  if (p.length >= 8 && p.length < 12) reasons.push("Consider making it longer (12+ chars ideal).");

  for (const w of COMMON) {
    if (lower === w) { reasons.push("It's an exact common password — very weak."); break; }
    if (lower.includes(w)) { reasons.push("Contains a common word or pattern ("+w+")."); break; }
  }

  if (/^(.)\1+$/.test(p)) reasons.push("Same character repeated.");
  if (/(.)\1\1/.test(p)) reasons.push("Repeating characters detected.");
  if (/(012|1234|2345|3456|4567|6789)/.test(p)) reasons.push("Numeric sequence found.");

  const cls = charClasses(p);
  const count = Number(cls.lower)+Number(cls.upper)+Number(cls.digit)+Number(cls.symbol);
  if (count < 2) reasons.push("Not enough character variety.");
  if (!cls.symbol) reasons.push("No symbols — adding one or two symbols helps.");

  return reasons;
}

function generateSuggestion(p) {
  if (!p) return "BlueMoon!42";
  const m = p.match(/[A-Za-z]{3,}/g);
  let core = m ? m.sort((a,b)=>b.length-a.length)[0] : p.slice(0,4);
  core = core.split('').map(ch=>{
    const l = ch.toLowerCase();
    if (l==='a') return '@';
    if (l==='o') return '0';
    if (l==='i') return '1';
    if (l==='e') return '3';
    return ch;
  }).join('');
  const seed = Array.from(p).reduce((s,ch)=>s + ch.charCodeAt(0), 0);
  const symbols = ['!','#','$','%','&','*'];
  const sym = symbols[seed % symbols.length];
  const num = (seed % 90) + 10;
  const mid = Math.ceil(core.length/2);
  const suggestion = core.slice(0,mid) + sym + core.slice(mid) + num;
  return suggestion[0].toUpperCase() + suggestion.slice(1);
}

const pwd = document.getElementById('pwd');
const bar = document.getElementById('bar');
const entropyEl = document.getElementById('entropy');
const reasonsEl = document.getElementById('reasons');
const suggestionsEl = document.getElementById('suggestions');
const copyBtn = document.getElementById('copyBtn');
const debug = document.getElementById('debug');

function update() {
  const v = pwd.value;
  const e = estimateEntropy(v);
  entropyEl.textContent = e + " bits";
  const pct = Math.max(0, Math.min(100, Math.round(e / 80 * 100)));
  bar.style.width = pct + "%";
  bar.style.background = pct < 30 ? "#ef4444" : pct < 60 ? "#f59e0b" : "#10b981";

  const reasons = analyze(v);
  reasonsEl.innerHTML = !v
    ? "<span class='muted'>Start typing to see reasons and suggestion.</span>"
    : "<strong>Why:</strong><ul>" + reasons.map(r=>`<li>${r}</li>`).join('') + "</ul>";

  suggestionsEl.innerHTML = "";
  const sug = generateSuggestion(v);
  const pill = document.createElement('span');
  pill.className = 'pill';
  pill.textContent = sug;

  pill.onclick = async () => {
    try {
      await navigator.clipboard.writeText(sug);
      pill.textContent = "Copied ✓ — " + sug;
      setTimeout(()=> pill.textContent = sug, 1100);
    } catch {
      alert("Copy failed — copy manually: " + sug);
    }
  };
  suggestionsEl.appendChild(pill);

  debug.textContent = `len:${v.length} entropy:${e}`;
}

pwd.addEventListener('input', update);

copyBtn.addEventListener('click', async () => {
  const s = suggestionsEl.querySelector('.pill')?.textContent || pwd.value;
  if (!s) return alert("Nothing to copy.");
  try {
    await navigator.clipboard.writeText(s.replace(/^Copied ✓ — /,''));
    copyBtn.textContent = "Copied!";
    setTimeout(()=> copyBtn.textContent="Copy suggestion",900);
  } catch {
    alert("Copy failed — copy manually: " + s);
  }
});

update();
