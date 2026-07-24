import { Server, Origins } from 'boardgame.io/dist/cjs/server.js';
import { GiocoCarte } from './Game.js';

const server = Server({
  games: [GiocoCarte],
  origins: [Origins.LOCALHOST],
});

const PORT = 8000;
server.run(PORT, () => {
  console.log(`Server di gioco e Lobby avviati sulla porta ${PORT}`);
});