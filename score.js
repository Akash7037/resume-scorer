const data = JSON.parse(localStorage.getItem("resume-result"));

if (!data) {
  document.getElementById("summary").innerText =
    "No backend response found!";
}

const scores = data?.scores || {};

const overall = scores.overall || 0;
const clarity = scores.clarity || 0;
const relevance = scores.relevance || 0;
const format = scores.format || 0;

document.getElementById("percent").innerText = overall + "%";
document.getElementById("clarity").innerText = clarity + "%";
document.getElementById("relevance").innerText = relevance + "%";
document.getElementById("format").innerText = format + "%";

document.getElementById("summary").innerText =
  "These scores were generated in backend.";

document.getElementById("suggestions").innerText =
  scores.suggestions || "No suggestions generated.";

// Update circle color animation
document.getElementById("circle").style.background = `
  conic-gradient(#00c853 ${overall * 3.6}deg, #ddd 0deg)
`;

// Delete after load
localStorage.removeItem("resume-result");
