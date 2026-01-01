// =============================================================================
// SmaRTC TypeScript Example - Serveur Express avec interface de chat
// =============================================================================

import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3500;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          SmaRTC TypeScript Chat Example                      ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  🌐 Application: http://localhost:${PORT}                       ║`);
  console.log('║  📡 API SmaRTC: http://localhost:8080                        ║');
  console.log('║  🔌 SignalR Hub: http://localhost:5001/signalhub             ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  Ouvrez l\'URL dans votre navigateur pour commencer          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
});
