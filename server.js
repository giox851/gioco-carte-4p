import { Server, Origins } from 'boardgame.io/dist/cjs/server.js';
import { GiocoCarte } from './src/Game.js';

const allowedOrigins = [
  'https://gioco-carte-4p.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  Origins.LOCALHOST,
];

const server = Server({
  games: [GiocoCarte],
  // Limitiamo a origini note per sicurezza
  origins: allowedOrigins,
});

const PORT = process.env.PORT || 10000;

// Aggiungiamo middleware CORS esplicito sull'app Express usata da boardgame.io
if (server.app) {
  // Debug: permettiamo temporaneamente tutte le origini per identificare problemi CORS
  server.app.use((req, res, next) => {
    // Impostiamo header permissivi per verificare il problema
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });
}

// Eseguiamo il server attivando espressamente la Lobby API
server.run({ port: PORT, lobbyConfig: { apiOrigins: allowedOrigins } }, () => {
  console.log(`Server attivo sulla porta ${PORT} con Lobby API abilitata`);
});