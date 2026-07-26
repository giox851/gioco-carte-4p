const { Server, Origins } = require('boardgame.io/server');
const { GiocoCarte } = require('./src/Game'); // controlla il percorso del file Game

const server = Server({
  games: [GiocoCarte],
  origins: [
    'https://gioco-carte-4p.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    Origins.LOCALHOST,
    '*' // Permette tutte le origini per evitare blocchi CORS sulle API Lobby
  ],
});

const PORT = process.env.PORT || 8000;

server.run(PORT, () => {
  console.log(`Server attivo sulla porta ${PORT}`);
});