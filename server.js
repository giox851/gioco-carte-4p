const { Server, Origins } = require('boardgame.io/server');
const { GiocoCarte } = require('./src/Game'); // Assicurati che il percorso del file Game sia corretto

const server = Server({
  games: [GiocoCarte],
  origins: [Origins.LOCALHOST, '*'],
});

const PORT = process.env.PORT || 8000;

server.run(PORT, () => {
  console.log(`Server attivo sulla porta ${PORT}`);
});