import { Server, Origins } from 'boardgame.io/server';
import { GiocoCarte } from './src/Game.js'; // Assicurati di includere l'estensione .js

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

const PORT = process.env.PORT || 8000;

server.run(PORT, () => {
  console.log(`Server attivo sulla porta ${PORT}`);
});