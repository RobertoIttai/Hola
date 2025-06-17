// Import necessary modules (CommonJS style - adjust to ES Modules if "type": "module" is in package.json)
const express = require('express');
const cors = require('cors'); // Import cors for handling cross-origin requests
const axios = require('axios'); // Para hacer peticiones HTTP a Sportmonks
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Import Google Generative AI library

const app = express();

// Use cors middleware to allow cross-origin requests from your frontend
app.use(cors()); 
// Use express.json() middleware to parse JSON request bodies
app.use(express.json());

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
  // process.exit(1); // Opcionalmente detener el servidor si no hay API Key
}

// Initialize the Google Generative AI client with your API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Select the Gemini model that worked for you.
// 'models/gemini-1.5-flash-latest' is recommended for efficiency and generous free tier limits.
const geminiModel = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash-latest' });

// --- Sportmonks API Token ---
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

if (!SPORTMONKS_API_TOKEN) {
  console.error("ERROR: SPORTMONKS_API_TOKEN environment variable is not set.");
  console.error("Please set it in Render's dashboard under Environment Variables.");
  // process.exit(1);
}

// --- Routes ---

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

// Route to handle AI generation requests
app.post('/generate-ai-response', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "No 'prompt' provided in the request body." });
    }

    console.log(`Received prompt from frontend: "${prompt}"`);

    const result = await geminiModel.generateContent(prompt);
    const aiResponseText = result.response.text();

    console.log(`AI response: "${aiResponseText}"`);

    res.json({ ai_response: aiResponseText });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ 
      error: "Failed to generate AI response.", 
      details: error.message || "An unknown error occurred." 
    });
  }
});

// *** Nueva ruta POST /analisis con Sportmonks y Gemini ***

app.post('/analisis', async (req, res) => {
  try {
    // Petición a Sportmonks para obtener los próximos partidos
    const response = await axios.get(`https://soccer.sportmonks.com/api/v2.0/fixtures`, {
      params: {
        api_token: SPORTMONKS_API_TOKEN,
        include: 'localTeam,visitorTeam',
        per_page: 3,
      }
    });

    // Formatear los partidos para el prompt
    const partidos = response.data.data.map(f => {
      return `${f.localTeam.data.name} vs ${f.visitorTeam.data.name}`;
    }).join('\n');

    // Crear prompt para Gemini con la info de partidos
    const prompt = `Analiza los siguientes partidos y dame un pick de apuesta basado en estadísticas y tendencias:\n${partidos}`;

    // Llamar a Gemini para generar la recomendación
    const result = await geminiModel.generateContent(prompt);
    const aiResponseText = result.response.text();

    // Responder con los partidos y la recomendación
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
