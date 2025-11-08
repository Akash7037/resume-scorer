const drop = document.getElementById("drop");
const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");
const uploadBtn = document.getElementById("uploadBtn");
const clearBtn = document.getElementById("clearBtn");
const previewBtn = document.getElementById("previewBtn");
const progressBar = document.getElementById("progressBar");
const serverResp = document.getElementById("serverResp");
const pdfEmbedWrap = document.getElementById("pdfEmbedWrap");
const pdfEmbed = document.getElementById("pdfEmbed");
let selectedFile = null;

function setFile(file) {
  if (!file) return clearSelection();
  if (file.type !== "application/pdf") {
    alert("Only PDF allowed");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert("File too large (10MB max)");
    return;
  }

  selectedFile = file;
  fileInfo.innerHTML = `<strong>${file.name}</strong><br>Size: ${(
    file.size / 1024
  ).toFixed(1)} KB`;
  uploadBtn.disabled = false;
  previewBtn.disabled = false;
  serverResp.textContent = "";
}

function clearSelection() {
  selectedFile = null;
  fileInput.value = "";
  fileInfo.textContent = "No file selected.";
  uploadBtn.disabled = true;
  previewBtn.disabled = true;
  progressBar.style.width = "0%";
  pdfEmbedWrap.style.display = "none";
  serverResp.textContent = "";
}

drop.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (f) setFile(f);
});

["dragenter", "dragover"].forEach((evt) => {
  drop.addEventListener(evt, (e) => {
    e.preventDefault();
    drop.classList.add("hover");
  });
});
["dragleave", "drop"].forEach((evt) => {
  drop.addEventListener(evt, (e) => {
    e.preventDefault();
    drop.classList.remove("hover");
  });
});

drop.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files[0];
  if (f) setFile(f);
});

clearBtn.addEventListener("click", clearSelection);

previewBtn.addEventListener("click", () => {
  if (!selectedFile) return;
  const url = URL.createObjectURL(selectedFile);
  pdfEmbed.setAttribute("data", url);
  pdfEmbedWrap.style.display = "block";
});

uploadBtn.addEventListener("click", () => {
  if (!selectedFile) return;
  uploadFile(selectedFile);
});

function uploadFile(file) {
  const endpoint = "/upload";
  const form = new FormData();
  form.append("resume", file);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", endpoint, true);

  xhr.upload.onprogress = function (e) {
    if (e.lengthComputable) {
      const pct = (e.loaded / e.total) * 100;
      progressBar.style.width = pct + "%";
    }
  };

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      serverResp.textContent = "Uploaded successfully";
    } else {
      serverResp.textContent = "Upload failed: " + xhr.status;
    }
  };

  xhr.onerror = function () {
    serverResp.textContent = "Network error";
  };

  xhr.send(form);
}

clearSelection();
