import boardgameServer from 'boardgame.io/dist/cjs/server.js';
import { GiocoCarte } from './src/Game.js';

const { Server, Origins } = boardgameServer;

const server = Server({
  games: [GiocoCarte],
  origins: [Origins.LOCALHOST],
});

server.run(8000, () => {
  console.log('🚀 Server boardgame.io attivo sulla porta 8000!');
});