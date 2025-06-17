// Import necessary modules (CommonJS style - adjust to ES Modules if "type": "module" is in package.json)
const express = require('express');
const cors = require('cors'); // Import cors for handling cross-origin requests
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Import Google Generative AI library

const app = express();

// Use cors middleware to allow cross-origin requests from your frontend
app.use(cors()); 
// Use express.json() middleware to parse JSON request bodies
app.use(express.json());

// REVISAR ERRORES DE SPORTMONKS

app.post('/analisis', async (req, res) => {
  try {
    // Aquí va el código que te pasé para llamar a Sportmonks y Gemini
  } catch (error) {
    // Manejo de errores
  }
});

app.post('/analisis', async (req, res) => {
  console.log("Entré a /analisis");
  try {
    // Código análisis
  } catch (e) {
    console.error("Error en /analisis:", e);
    res.status(500).json({ error: "Error interno" });
  }
});

// Define the port for the server, using environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// --- Configure Google Gemini API ---
// It's CRUCIAL to get the API key from environment variables for security.
// NEVER hardcode your API key in production code.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check if the API key is configured
if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY environment variable is not set.");
  console.error("Please set it in Render's dashboard under Environment Variables.");
  // In a real production app, you might want to stop the server here.
  // process.exit(1); 
}

// Initialize the Google Generative AI client with your API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Select the Gemini model that worked for you.
// 'models/gemini-1.5-flash-latest' is recommended for efficiency and generous free tier limits.
// DO NOT use 'gemini-pro' as it caused a 404 previously.
const geminiModel = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash-latest' });

// --- Existing Routes ---
// Simple root route to confirm server is running
app.get('/', (req, res) => {
  res.send('¡Hola desde Render + GitHub! Backend del bot de apuestas activo.');
});

// Route to get a daily pick (example)
app.get('/pick', (req, res) => {
  const pickDelDia = "⚽ Pick: Gana el Real Madrid y hay +2.5 goles";
  res.json({ pick: pickDelDia });
});

// Route for general chat (example)
app.post('/chat', (req, res) => {
  const { message } = req.body;
  const respuesta = `Recibí tu mensaje: "${message}". Pronto te daré un pick ganador 😉`;
  res.json({ reply: respuesta });
});

// --- NEW: Route to handle AI generation requests ---
// This endpoint will receive a 'prompt' from the frontend, call the Gemini API,
// and send the AI's response back to the frontend.
app.post('/generate-ai-response', async (req, res) => {
  try {
    const { prompt } = req.body; // Extract the prompt from the request body

    // Validate that a prompt was provided
    if (!prompt) {
      return res.status(400).json({ error: "No 'prompt' provided in the request body." });
    }

    console.log(`Received prompt from frontend: "${prompt}"`);

    // Call the Gemini API with the received prompt
    const result = await geminiModel.generateContent(prompt);
    const aiResponseText = result.response.text(); // Extract the text from the AI's response

    console.log(`AI response: "${aiResponseText}"`);

    // Send the AI's response back to the frontend
    res.json({ ai_response: aiResponseText });

  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error calling Gemini API:', error);
    // Send a 500 (Internal Server Error) response with details
    res.status(500).json({ 
      error: "Failed to generate AI response.", 
      details: error.message || "An unknown error occurred." 
    });
  }
});
// Sportmonks API code and conection with Gemini

const axios = require('axios'); // Agrega esto una sola vez al inicio si aún no está

const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

app.get('/analisis', async (req, res) => {
  try {
    const response = await axios.get(`https://soccer.sportmonks.com/api/v2.0/fixtures`, {
      params: {
        api_token: SPORTMONKS_API_TOKEN,
        include: 'localTeam,visitorTeam',
        per_page: 3, // Ajusta el número de partidos que quieras analizar
      }
    });

    const partidos = response.data.data.map(f => {
      return `${f.localTeam.data.name} vs ${f.visitorTeam.data.name}`;
    }).join('\n');

    const prompt = `Analiza los siguientes partidos y dame un pick de apuesta basado en estadísticas y tendencias:\n${partidos}`;

    const result = await geminiModel.generateContent(prompt);
    const aiResponseText = result.response.text();

    res.json({
      partidosAnalizados: partidos,
      recomendacion: aiResponseText
    });

  } catch (error) {
    console.error('Error en /analisis:', error.message);
    res.status(500).json({ error: 'Fallo en el análisis de partidos' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
