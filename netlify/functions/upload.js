/**
 * netlify/functions/upload.js
 * requires:
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
        const data = await pdf(fileBuffer);
        const extracted = data?.text || "";

        // Dummy scores (LLM disabled)
        const scores = {
          overall: 72,
          clarity: 68,
          relevance: 74,
          format: 70,
          suggestions: "LLM scoring disabled. Using dummy values."
        };

        resolve({
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ok: true,
            text: extracted.slice(0, 400),
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
