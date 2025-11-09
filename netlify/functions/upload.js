// netlify/functions/upload.js
// Requires: npm install pdf-parse busboy node-fetch
// Netlify will pack dependencies from package.json at deploy time.

const pdf = require('pdf-parse');
const Busboy = require('busboy'); // to parse multipart/form-data
const fetch = require('node-fetch'); // if you later call external LLM APIs

exports.handler = async function(event, context) {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Parse multipart form data to get the file buffer
  const headers = event.headers || {};
  const contentType = headers['content-type'] || headers['Content-Type'] || '';
  if (!contentType.startsWith('multipart/form-data')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Expect multipart/form-data' }) };
  }

  // Busboy expects a raw Node req stream; Netlify gives body as base64
  const bb = new Busboy({ headers: { 'content-type': contentType }});
  const bufferChunks = [];

  const body = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');

  // emulate a stream to Busboy
  const stream = require('stream');
  const s = new stream.PassThrough();
  s.end(body);
  return await new Promise((resolve) => {
    let fileBuffer = null;
    let filename = 'resume.pdf';

    bb.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('field', (name, val) => {
      // no-op: you can read extra fields here
    });

    bb.on('finish', async () => {
      if (!fileBuffer) {
        resolve({ statusCode: 400, body: JSON.stringify({ error: 'No file' })});
        return;
      }

      try {
        // Extract text from PDF
        const data = await pdf(fileBuffer);
        const text = (data && data.text) ? data.text : '';

        // === HERE: Call your LLM / scoring logic ===
        // For now we will return DUMMY scores. Later replace with an API call.
        // Example: call Hugging Face Inference API using process.env.HF_API_KEY
        //
        // const resp = await fetch('https://api-inference.huggingface.co/models/your-model', {...})

        // Dummy scoring logic (replace with real model later)
        const overall = 72;
        const clarity = 78;
        const relevance = 68;
        const format = 70;

        // Return JSON with extracted text (optionally) and scores.
        resolve({
          statusCode: 200,
          body: JSON.stringify({
            ok: true,
            filename,
            textSnippet: text.slice(0, 1000), // keep small for now
            scores: { overall, clarity, relevance, format },
            message: 'Dummy scoring (replace with LLM call)'
          }),
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: err.message })
        });
      }
    });

    s.pipe(bb);
  });
};
