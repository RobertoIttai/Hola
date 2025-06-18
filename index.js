const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Enable CORS for cross-origin requests from your frontend
app.use(cors());
app.use(express.json());

// Define the port, using environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// --- Configure Google Gemini API ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY environment variable is not set.");
  console.error("Please set it in Render's dashboard under Environment Variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

// --- Routes ---

// Root route to confirm server is running
app.get('/', (req, res) => {
  res.send('¡Hola desde Render + GitHub! Backend del bot de apuestas activo.');
});

// Route for a daily pick (example)
app.get('/pick', (req, res) => {
  const pickDelDia = "⚽ Pick: Gana el América y hay +2.5 goles";
  res.json({ pick: pickDelDia });
});

// Route for general chat (example)
app.post('/chat', (req, res) => {
  const { message } = req.body;
  const respuesta = `Recibí tu mensaje: "${message}". Pronto te daré un pick ganador 😉`;
  res.json({ reply: respuesta });
});

// Route for AI-generated responses
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

// Route for match analysis using user-provided match data and Gemini
app.post('/analisis', async (req, res) => {
  try {
    const { matches } = req.body;
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({
        error: 'Se requiere un arreglo de partidos en el cuerpo de la solicitud.',
        details: 'Ejemplo: {"matches": [{"homeTeam": "América", "awayTeam": "Cruz Azul", "date": "2025-07-11", "odds": {"home": 2.0, "draw": 3.2, "away": 3.5}}, ...]}'
      });
    }

    // Format matches for the Gemini prompt
    const partidos = matches.map(match => {
      const { homeTeam, awayTeam, date, odds } = match;
      if (!homeTeam || !awayTeam || !date) {
        return 'Partido inválido: faltan homeTeam, awayTeam o date.';
      }
      const winHome = odds?.home || 'N/A';
      const draw = odds?.draw || 'N/A';
      const winAway = odds?.away || 'N/A';
      return `${homeTeam} vs ${awayTeam} (Fecha: ${date}, Cuotas: ${winHome}/${draw}/${winAway})`;
    });

    // Create prompt for Gemini
    const prompt = `Analiza los siguientes partidos de la Liga MX y dame un pick de apuesta basado en estadísticas, tendencias y cuotas:\n${partidos.join('\n')}\nProporciona un pronóstico breve (máximo 100 palabras) por partido, explicando tu razonamiento. Si las cuotas son 'N/A', usa el contexto de los equipos para sugerir un pronóstico.`;

    // Call Gemini for the recommendation
    const result = await geminiModel.generateContent(prompt);
    const aiResponseText = result.response.text();

    // Respond with analyzed matches and recommendation
    res.json({
      partidosAnalizados: partidos,
      recomendacion: aiResponseText
    });
  } catch (error) {
    console.error('Error en /analisis:', error.message);
    res.status(500).json({
      error: 'Fallo en el análisis de partidos',
      details: error.message || 'An unknown error occurred.'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});