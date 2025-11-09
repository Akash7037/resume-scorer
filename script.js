// script.js for index.html

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("resume").files[0];
  if (!file) {
    alert("Select a PDF first!");
    return;
  }

  document.getElementById("status").innerText = "Uploading...";

  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/.netlify/functions/upload", {
    method: "POST",
    body: form
  });

  const result = await response.json();
  console.log(result);

  // Save backend response
  localStorage.setItem("resume-result", JSON.stringify(result));

  // Go to results page
  window.location.href = "score.html";
});
