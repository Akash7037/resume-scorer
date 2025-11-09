/**
 * netlify/functions/upload.js
 * Requires:
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
      file.on("data", (data) => chunks.push(data));
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
        // STEP 1: Extract text from PDF
        const data = await pdf(fileBuffer);
        const extracted = data.text || "";

        // STEP 2: Call Groq API for scoring
        const groqKey = process.env.GROQ_API_KEY;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "mixtral-8x7b-32768",
            messages: [
              {
                role: "system",
                content:
                  "You score resumes. Provide numerical scores between 0 and 100 for clarity, relevance, and format. Also generate 3 improvements."
              },
              {
                role: "user",
                content: extracted
              }
            ]
          })
        });

        const groqData = await groqRes.json();

        let scores = {
          clarity: 0,
          relevance: 0,
          format: 0,
          suggestions: "No suggestions generated."
        };

        try {
          // Parse Groq response
          const text = groqData.choices[0].message.content;

          // Expected format: "Clarity: 80, Relevance: 75, Format: 65..."
          const clarity = text.match(/clarity[:\- ]+(\d+)/i)?.[1];
          const relevance = text.match(/relevance[:\- ]+(\d+)/i)?.[1];
          const format = text.match(/format[:\- ]+(\d+)/i)?.[1];

          scores = {
            clarity: Number(clarity) || 0,
            relevance: Number(relevance) || 0,
            format: Number(format) || 0,
            suggestions: text
          };
        } catch (e) {
          console.log("Groq parse error:", e.message);
        }

        // STEP 3: Return results to frontend (score.html)
        resolve({
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ok: true,
            text: extracted.slice(0, 600),
            scores
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
