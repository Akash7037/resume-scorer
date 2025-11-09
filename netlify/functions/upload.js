/**
 * netlify/functions/upload.js
 */

const pdf = require("pdf-parse");
const Busboy = require("busboy");
const fetch = require("node-fetch");
const stream = require("stream");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const contentType =
    event.headers["content-type"] ||
    event.headers["Content-Type"] ||
    "";

  if (!contentType.startsWith("multipart/form-data")) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Expect multipart/form-data" })
    };
  }

  const body = Buffer.from(
    event.body,
    event.isBase64Encoded ? "base64" : "utf8"
  );

  const pass = new stream.PassThrough();
  pass.end(body);

  return await new Promise((resolve) => {
    const bb = Busboy({ headers: { "content-type": contentType } });

    let fileBuffer = null;

    bb.on("file", (name, file, info) => {
      const chunks = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on("finish", async () => {
      if (!fileBuffer) {
        resolve({
          statusCode: 400,
          body: JSON.stringify({ error: "No file received" })
        });
        return;
      }

      try {
        const pdfData = await pdf(fileBuffer);
        const extracted = pdfData?.text || "";

        const prompt = `
You are ChatGPT, a senior HR expert specializing in technical recruiting. Given an IT/AI resume text as input, do the following:\n- Detected Target Role: Identify the most likely job role the candidate is targeting (e.g., Data Scientist, AI Engineer, Backend Developer). Scores: Assign a numeric score (0-100) for each of these categories: Overall Quality, Clarity and Communication, Relevance to Intended Role, and Formatting and Structure. List each as a bullet point (for example: \"Overall Quality: 85/100\").\n- Strengths: Provide bullet points of the resume's clear strengths (e.g., relevant skills, quantified achievements, clear language, strong projects).\n- Weaknesses: Provide bullet points of any weaknesses or missing elements (e.g., missing key skills, passive language, lack of detail or metrics, formatting issues).\n- Suggestions: Provide bullet-point suggestions to improve the resume, including missing technical skills or tools to add, phrasing or layout improvements, and alignment with current AI/IT industry trends (e.g., AI/ML, cloud technologies, data science). Use a strict, professional tone as an automated HR screener.\nOutput the results under the headings: Detected Target Role, Scores, Strengths, Weaknesses, Suggestions. No additional commentary outside these sections.
Score this resume from 0-100 in:
- Overall quality
- Clarity
- Relevance
- Formatting
Then provide a short suggestion block.

Resume:
${extracted}
        `;

        const groqKey = process.env.GROQ_API_KEY;

        let scores = {
          overall: 70,
          clarity: 70,
          relevance: 70,
          format: 70,
          suggestions: "LLM scoring disabled. Add API key in Netlify to enable."
        };

        if (groqKey) {
          const llm = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + groqKey
              },
              body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }]
              })
            }
          ).then((r) => r.json());

          const output =
            llm?.choices?.[0]?.message?.content || "";

          const nums =
            output.match(/\d+/g)?.map((n) => parseInt(n)) ||
            [70, 70, 70, 70];

          scores = {
            overall: nums[0],
            clarity: nums[1],
            relevance: nums[2],
            format: nums[3],
            suggestions: output
          };
        }

        resolve({
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ok: true,
            scores,
            text: extracted.slice(0, 300)
          })
        });
      } catch (err) {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: err.message })
        });
      }
    });

    pass.pipe(bb);
  });
};
