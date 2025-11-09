/**
 * netlify/functions/upload.js
 * Install these in your project:
 * npm install pdf-parse busboy node-fetch@2
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
      body: JSON.stringify({ error: "Expect multipart/form-data" }),
    };
  }

  // Convert Netlify body to buffer
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
      file.on("data", (data) => chunks.push(data));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on("finish", async () => {
      if (!fileBuffer) {
        resolve({
          statusCode: 400,
          body: JSON.stringify({ error: "No file received" }),
        });
        return;
      }

      try {
        // Extract PDF text
        const data = await pdf(fileBuffer);
        const extracted = data?.text || "";

        // If no API key, return dummy values
        if (!process.env.GROQ_API_KEY) {
          resolve({
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ok: true,
              text: extracted.slice(0, 400),
              scores: {
                overall: 72,
                clarity: 68,
                relevance: 74,
                format: 70,
                suggestions: "LLM not enabled (no API key). Using dummy scores."
              }
            }),
          });
          return;
        }

        // Build LLM prompt
        const prompt = `
Score the resume from 0 to 100 in:
- Overall quality
- Skills match
- Experience depth
- Formatting

Then write 3 suggestions.

Resume:
${extracted}
        `;

        // Call Groq LLM
        const llmResponse = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + process.env.GROQ_API_KEY,
            },
            body: JSON.stringify({
              model: "llama3-8b-8192",
              messages: [{ role: "user", content: prompt }],
            }),
          }
        ).then((r) => r.json());

        const resultText = llmResponse?.choices?.[0]?.message?.content || "";

        const nums =
          resultText.match(/\d+/g)?.map((n) => parseInt(n)) ||
          [70, 70, 70, 70];

        const scores = {
          overall: nums[0],
          clarity: nums[1],
          relevance: nums[2],
          format: nums[3],
          suggestions: resultText,
        };

        resolve({
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ok: true,
            scores,
            text: extracted.slice(0, 400),
          }),
        });
      } catch (err) {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: err.message }),
        });
      }
    });

    pass.pipe(bb);
  });
};
