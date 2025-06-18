const Joi = require('joi');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

// Esquema de validación con Joi
const matchSchema = Joi.object({
  homeTeam: Joi.string().min(2).required(),
  awayTeam: Joi.string().min(2).required(),
  date: Joi.string().isoDate().required(), // formato ISO
  odds: Joi.object({
    home: Joi.number().positive().required(),
    draw: Joi.number().positive().required(),
    away: Joi.number().positive().required(),
  }).required()
});

const validateMatches = (matches) => {
  const schema = Joi.array().items(matchSchema).min(1);
  const { error } = schema.validate(matches);
  return error;
};

async function analizarPartidos(matches) {
  // Validar con Joi antes de seguir
  const validationError = validateMatches(matches);
  if (validationError) {
    throw new Error(`Datos inválidos: ${validationError.message}`);
  }

  // Preparar los partidos para el prompt
  const partidos = matches.map(({ homeTeam, awayTeam, date, odds }) => {
    const winHome = odds.home;
    const draw = odds.draw;
    const winAway = odds.away;
    return `${homeTeam} vs ${awayTeam} (Fecha: ${date}, Cuotas: ${winHome}/${draw}/${winAway})`;
  });

  const prompt = `
Actúa como un analista experto en apuestas deportivas.
Analiza los siguientes partidos y sugiere una apuesta razonada para cada uno considerando: rendimiento actual, cuotas, historia entre los equipos y valor esperado.

Partidos:
${partidos.join('\n')}

Formato esperado:
- 1 análisis por partido (máximo 100 palabras cada uno).
- Sé directo, profesional y no des rodeos.
`.trim();

  const result = await geminiModel.generateContent(prompt);
  const aiResponseText = result.response.text();

  return {
    partidosAnalizados: partidos,
    recomendacion: aiResponseText
  };
}

module.exports = { analizarPartidos };
