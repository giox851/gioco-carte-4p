import { Server, Origins } from 'boardgame.io/dist/cjs/server.js';
import { GiocoCarte } from './src/Game.js';

const server = Server({
  games: [GiocoCarte],
  origins: [
    'https://gioco-carte-4p.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    Origins.LOCALHOST,
    '*'
  ],
});

const PORT = process.env.PORT || 10000;

// Eseguiamo il server attivando espressamente la Lobby API
server.run({ port: PORT, lobbyConfig: { apiOrigins: ['*'] } }, () => {
  console.log(`Server attivo sulla porta ${PORT} con Lobby API abilitata`);
});