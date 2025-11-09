// Dummy scoring page script
// This replaces real LLM scoring with placeholder values so you can see the UI.
const params = new URLSearchParams(window.location.search);
const scoreValue = params.get("score") || "0";

document.getElementById("scoreNumber").textContent = scoreValue + "%";
document.getElementById("scoreLabel").textContent = scoreValue + "% (under development)";

function setMeter(percent){
  const fg = document.getElementById('meterFg');
  const total = 2 * Math.PI * 50; // circle circumference (r=50)
  const offset = total * (1 - percent/100);
  fg.style.strokeDashoffset = offset;
  document.getElementById('scorePercent').textContent = Math.round(percent) + '%';
}

function setMetrics(c1,c2,c3){
  document.getElementById('m1').textContent = Math.round(c1) + '%';
  document.getElementById('m2').textContent = Math.round(c2) + '%';
  document.getElementById('m3').textContent = Math.round(c3) + '%';
}

function populateDummy(){
  // you can replace these with values returned from your backend/LLM later
  const overall = 72; // dummy overall score
  const clarity = 78;
  const relevance = 68;
  const format = 70;

  setMeter(overall);
  setMetrics(clarity,relevance,format);
  document.getElementById('summary').textContent = 'Test score shown — model scoring is under development.';
}

// Regenerate button shows random dummy values to demonstrate behavior
document.getElementById('regenerate').addEventListener('click', ()=>{
  const o = 50 + Math.random() * 40;
  const a = 50 + Math.random() * 50;
  const b = 40 + Math.random() * 60;
  const c = 45 + Math.random() * 55;
  setMeter(o);
  setMetrics(a,b,c);
});

// initialize
function getQs(){
  const url = new URL(window.location.href);
  return {
    overall: Number(url.searchParams.get('overall')) || null,
    clarity: Number(url.searchParams.get('clarity')) || null,
    relevance: Number(url.searchParams.get('relevance')) || null,
    format: Number(url.searchParams.get('format')) || null
  };
}

function populateFromQs(){
  const q = getQs();
  const overall = q.overall ?? 72; // fallback dummy
  const clarity = q.clarity ?? 78;
  const relevance = q.relevance ?? 68;
  const format = q.format ?? 70;

  setMeter(overall);
  setMetrics(clarity, relevance, format);
  document.getElementById('summary').textContent = 'Score (from server) — under development';
}

// init
populateFromQs();
