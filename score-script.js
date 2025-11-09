<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Resume Scorer — Results</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Make sure styles.css is in the root folder -->
  <link rel="stylesheet" href="styles-score.css">
</head>

<body>

  <div class="card" role="main" style="max-width: 600px; margin: auto;">

    <h1>Resume Scorer — Results</h1>
    <p>This page shows results returned from backend.</p>

    <div class="score-section">

      <!-- Score Circle -->
      <div id="circle" class="circle">
        <span id="percent">--%</span>
      </div>

      <h2>Summary</h2>
      <p id="summary">Waiting for backend result...</p>

      <h3>Clarity: <span id="clarity">--%</span></h3>
      <h3>Relevance: <span id="relevance">--%</span></h3>
      <h3>Format: <span id="format">--%</span></h3>

      <h2>Suggestions</h2>
      <p id="suggestions">Loading...</p>

      <br>
      <a href="index.html" class="btn">Upload another resume</a>

    </div>

  </div>

  <script src="score.js"></script>
</body>
</html>
