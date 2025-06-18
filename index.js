const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Enable CORS for cross-origin requests from your frontend
app.use(cors());
app.use(express.json());

// Define the port, using environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// --- Configure API-Football (RapidAPI) ---
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
if (!API_FOOTBALL_KEY) {
  console.error("ERROR: API_FOOTBALL_KEY environment variable is not set.");
  console.error("Please set it in Render's dashboard under Environment Variables.");
}

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

// Route for match analysis using API-Football and Gemini
app.post('/analisis', async (req, res) => {
  try {
    // Fetch upcoming or recent Liga MX matches (league_id=262, season=2025)
    const fixturesUrl = 'https://api-football-v1.p.rapidapi.com/v3/fixtures';
    const fixturesResponse = await axios.get(fixturesUrl, {
      headers: {
        'X-RapidAPI-Key': API_FOOTBALL_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      },
      params: {
        league: 262, // Liga MX
        season: 2025,
        next: 3 // Get the next 3 upcoming matches (or use 'last: 3' for recent matches)
      }
    });

    const matches = fixturesResponse.data.response;
    if (!matches || matches.length === 0) {
      return res.status(404).json({ error: 'No se encontraron partidos de la Liga MX.' });
    }

    // Format matches for the Gemini prompt
    const partidos = await Promise.all(matches.map(async (match) => {
      const homeTeam = match.teams.home.name;
      const awayTeam = match.teams.away.name;
      const date = match.fixture.date;

      // Fetch odds for this match
      let winHome = 'N/A';
      let draw = 'N/A';
      let winAway = 'N/A';
      try {
        const oddsUrl = 'https://api-football-v1.p.rapidapi.com/v3/odds';
        const oddsResponse = await axios.get(oddsUrl, {
          headers: {
            'X-RapidAPI-Key': API_FOOTBALL_KEY,
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
          },
          params: { fixture: match.fixture.id }
        });
        const oddsData = oddsResponse.data.response[0]?.bookmakers[0]?.bets[0]?.values || [];
        winHome = oddsData.find(o => o.value === 'Home')?.odd || 'N/A';
        draw = oddsData.find(o => o.value === 'Draw')?.odd || 'N/A';
        winAway = oddsData.find(o => o.value === 'Away')?.odd || 'N/A';
      } catch (error) {
        console.warn(`No odds for ${homeTeam} vs ${awayTeam}:`, error.message);
      }

      return `${homeTeam} vs ${awayTeam} (Fecha: ${date}, Cuotas: ${winHome}/${draw}/${winAway})`;
    }));

    // Create prompt for Gemini
    const prompt = `Analiza los siguientes partidos de la Liga MX y dame un pick de apuesta basado en estadísticas, tendencias y cuotas:\n${partidos.join('\n')}\nProporciona un pronóstico breve (máximo 100 palabras) por partido, explicando tu razonamiento.`;

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