// score-script.js

document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("resume-result"));

  if (!data) {
    // No backend data found
    document.getElementById("percent").innerText = "0%";
    document.getElementById("summary").innerText =
      "No resume score found. Please upload again.";
    document.getElementById("clarity").innerText = "0%";
    document.getElementById("relevance").innerText = "0%";
    document.getElementById("format").innerText = "0%";
    document.getElementById("suggestions").innerText =
      "No suggestions generated.";
    return;
  }

  // Extract data
  const scores = data.scores || {};
  const overall = scores.overall || 0;
  const clarity = scores.clarity || 0;
  const relevance = scores.relevance || 0;
  const format = scores.format || 0;
  const suggestions =
    scores.suggestions || "No suggestions generated.";

  // Update UI
  document.getElementById("percent").innerText = overall + "%";
  document.getElementById("summary").innerText =
    "These scores were generated in backend.";
  document.getElementById("clarity").innerText = clarity + "%";
  document.getElementById("relevance").innerText = relevance + "%";
  document.getElementById("format").innerText = format + "%";
  document.getElementById("suggestions").innerText = suggestions;

  // Delete local storage AFTER using it
  setTimeout(() => {
    localStorage.removeItem("resume-result");
  }, 500);
});
