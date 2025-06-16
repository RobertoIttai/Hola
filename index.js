// Import necessary React hooks and axios
import React, { useState } from 'react';
import axios from 'axios';

function AiChatBot() {
  const [userMessage, setUserMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle sending the message to the backend
  const sendMessageToAI = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Clear previous states
    setLoading(true);
    setAiResponse('');
    setError(null);

    try {
      // Define the URL of your backend's AI endpoint on Render
      // Replace 'https://YOUR-RENDER-BACKEND-URL.onrender.com' with your actual Render backend URL
      // Example: 'https://my-sports-bot.onrender.com/generate-ai-response'
      // During local development, this might be 'http://localhost:3000/generate-ai-response'
      const backendUrl = 'https://pickdeldia-mvp-1.onrender.com';

      // Send a POST request to your backend with the user's message as prompt
      const response = await axios.post(backendUrl, { 
        prompt: userMessage 
      });

      // Update the state with the AI's response
      setAiResponse(response.data.ai_response);
      setUserMessage(''); // Clear the input field

    } catch (err) {
      // Log and display any errors
      console.error('Error communicating with backend:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Error from backend: ${err.response.data.error || err.response.statusText}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError("No response from backend server. Check network connection or backend URL.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Request error: ${err.message}`);
      }
    } finally {
      // Always stop loading, whether success or failure
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>💬 Tu Asistente de Apuestas Deportivo</h1>
      <p>¡Pregúntame sobre deportes o picks!</p>

      <form onSubmit={sendMessageToAI} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Escribe tu pregunta o análisis aquí..."
          rows="5"
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          disabled={loading}
        ></textarea>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px 15px', 
            borderRadius: '5px', 
            border: 'none', 
            backgroundColor: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            cursor: loading ? 'not-allowed' : 'pointer' 
          }}
        >
          {loading ? 'Analizando...' : 'Enviar a la IA'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#ffe0e0', border: '1px solid #ff0000', borderRadius: '5px' }}>
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {aiResponse && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', border: '1px solid #b0e0e6', borderRadius: '5px' }}>
          <h2>Respuesta del Bot:</h2>
          <p>{aiResponse}</p>
        </div>
      )}
    </div>
  );
}

export default AiChatBot;


