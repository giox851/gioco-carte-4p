import { Server, Origins } from 'boardgame.io/dist/cjs/server.js';
import { GiocoCarte } from './src/Game.js';

const server = Server({
  games: [GiocoCarte],
  origins: [
    'https://gioco-carte-4p.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    Origins.LOCALHOST,
    '*',
  ],
});

const PORT = proceimport { Server, Origins } from 'boardgame.io/dist/cjs/server.js';
import { GiocoCarte } from './src/Game.js';

const server = Server({
  games: [GiocoCarte],
  origins: [Origins.LOCALHOST, '*'],
});

const PORT = process.env.PORT || 10000;

server.run(PORT, () => {
  console.log(`Server attivo sulla porta ${PORT}`);
});ss.env.PORT || 8000;

// Per abilitare le chiamate REST (join, create, ecc.) e la gestione della Lobby
server.run({ port: PORT }, () => {
  console.log(`Server attivo sulla porta ${PORT}`);
});