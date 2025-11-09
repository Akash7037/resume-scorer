/*
  score.js
  Loads stored resume scoring result from localStorage
  and updates the score.html UI safely
*/

// Read data saved from upload step
const raw = localStorage.getItem("resume-result");
let data = null;

try {
  data = JSON.parse(raw);
} catch (e) {
  data = null;
}

// If no data found, show placeholders
if (!data || !data.scores) {
  document.getElementById("percent").innerText = "--%";
  document.getElementById("clarity").innerText = "--%";
  document.getElementById("relevance").innerText = "--%";
  document.getElementById("format").innerText = "--%";
  document.getElementById("summary").innerText =
    "No backend data found. Please upload a resume first.";
  document.getElementById("suggestions").innerText =
    "No suggestions available.";
  document.getElementById("circle").style.background =
    "conic-gradient(#ccc 0deg, #eee 0deg)";
  throw new Error("No resume-result in localStorage");
}

// Extract scores
const scores = data.scores;
const overall = scores.overall || 0;
const clarity = scores.clarity || 0;
const relevance = scores.relevance || 0;
const format = scores.format || 0;
const suggestions = scores.suggestions || "No suggestions provided.";

// Update UI
document.getElementById("percent").innerText = overall + "%";
document.getElementById("clarity").innerText = clarity + "%";
document.getElementById("relevance").innerText = relevance + "%";
document.getElementById("format").innerText = format + "%";

document.getElementById("summary").innerText =
  data.text || "No summary extracted.";

document.getElementById("suggestions").innerText = suggestions;

// Circle progress animation
document.getElementById("circle").style.background = `
  conic-gradient(#00c853 ${overall * 3.6}deg, #eee 0deg)
`;
