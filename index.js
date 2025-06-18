const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { analizarPartidos } = require('./analyzer'); // Importamos lógica separada

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Verificamos si la API Key de Gemini está presente
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY no está definida.");
  console.error("Agrégala en las variables de entorno en Render.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

// Ruta raíz para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡Hola desde Render + GitHub! Backend del bot de apuestas activo.');
});

// Ruta de ejemplo para pick del día
app.get('/pick', (req, res) => {
  const pickDelDia = "⚽ Pick: Gana el América y hay +2.5 goles";
  res.json({ pick: pickDelDia });
});

// Ruta de chat simple
app.post('/chat', (req, res) => {
  const { message } = req.body;
  const respuesta = `Recibí tu mensaje: "${message}". Pronto te daré un pick ganador 😉`;
  res.json({ reply: respuesta });
});

// Ruta para generar respuesta desde Gemini (genérica)
app.post('/generate-ai-response', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Falta el 'prompt' en el cuerpo del request." });
    }

    console.log(`Prompt recibido: "${prompt}"`);
    const result = await geminiModel.generateContent(prompt);
    const aiResponseText = result.response.text();

    res.json({ ai_response: aiResponseText });
  } catch (error) {
    console.error('Error en /generate-ai-response:', error);
    res.status(500).json({ error: "Error generando respuesta", details: error.message });
  }
});

// Ruta para análisis de partidos usando lógica separada
app.post('/analisis', async (req, res) => {
  try {
    const { matches } = req.body;

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({
        error: 'Se requiere un arreglo de partidos en el cuerpo de la solicitud.',
        details: 'Ejemplo: {"matches": [{"homeTeam": "América", "awayTeam": "Cruz Azul", "date": "2025-07-11", "odds": {"home": 2.0, "draw": 3.2, "away": 3.5}}]}'
      });
    }

    const resultado = await analizarPartidos(matches, geminiModel);
    res.json(resultado);
  } catch (error) {
    console.error('Error en /analisis:', error.message);
    res.status(500).json({
      error: 'Fallo en el análisis de partidos',
      details: error.message || 'Error desconocido.'
    });
  }
});

// Arrancamos el servidor
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
