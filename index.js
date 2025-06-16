const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Ruta simple para probar
app.get('/', (req, res) => {
  res.send('¡Hola desde Render + GitHub!');
});

// Ruta para enviar un pick (de prueba)
app.get('/pick', (req, res) => {
  const pickDelDia = "⚽ Pick: Gana el Real Madrid y hay +2.5 goles";
  res.json({ pick: pickDelDia });
});

// Nueva ruta POST para el chat
app.post('/chat', (req, res) => {
  const { message } = req.body;

  // Respuesta simulada por ahora
  const respuesta = `Recibí tu mensaje: "${message}". Pronto te daré un pick ganador 😉`;

  res.json({ reply: respuesta });
});

app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});

