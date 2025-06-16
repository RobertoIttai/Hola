const express = require('express');
const cors = require('cors');        // 1. Importa cors
const app = express();

app.use(cors());                     // 2. Usa cors antes de tus rutas
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Rutas
app.get('/', (req, res) => {
  res.send('¡Hola desde Render + GitHub!');
});

app.get('/pick', (req, res) => {
  const pickDelDia = "⚽ Pick: Gana el Real Madrid y hay +2.5 goles";
  res.json({ pick: pickDelDia });
});

app.post('/chat', (req, res) => {
  const { message } = req.body;
  const respuesta = `Recibí tu mensaje: "${message}". Pronto te daré un pick ganador 😉`;
  res.json({ reply: respuesta });
});

app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});


