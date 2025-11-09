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
                model: "llama3-8b-8192",
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
