import React, { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { GiocoCarte } from './Game';

const SERVER_URL = 'https://gioco-carte-4p.onrender.com';

function TavoloDaGioco({ G, ctx, moves, playerID, matchID }) {
  const nomeGiocatore = localStorage.getItem('playerName') || `Giocatore ${Number(playerID) + 1}`;

  useEffect(() => {
    // Passiamo solo il nome (stringa semplice): la mossa usa ctx.playerID
    // internamente, quindi non serve costruire un oggetto da destrutturare
    // ed evitiamo il crash se la mossa viene invocata senza argomenti.
    if (moves && moves.registraGiocatore && nomeGiocatore) {
      moves.registraGiocatore(nomeGiocatore);
    }
  }, [playerID, nomeGiocatore]);

  if (!G || !ctx) {
    return (
      <div style={styles.centerContainer}>
        <h3>Connessione al tavolo in corso...</h3>
      </div>
    );
  }

  const eMioTurno = ctx.phase === 'dichiarazione' ? true : ctx.currentPlayer === playerID;
  const laMiaMano = G.hands ? (G.hands[playerID] || []) : [];
  const dichFatta = G.declarations ? G.declarations[playerID] !== undefined : false;

  const getNomePosto = (id) => {
    if (G.nomiGiocatori && G.nomiGiocatori[id]) {
      return G.nomiGiocatori[id];
    }
    return `Giocatore ${Number(id) + 1}`;
  };

  if (ctx.phase === 'dichiarazione') {
    return (
      <div style={styles.container}>
        <div style={styles.topBar}>
          <h2>Tavolo: <span style={{ color: '#1976d2' }}>{matchID}</span></h2>
          <p>Sei collegato come: <strong>{nomeGiocatore}</strong> (Posto {Number(playerID) + 1})</p>
        </div>

        <div style={styles.cardInfo}>
          <h2>Fase di Dichiarazione</h2>
          <p><strong>Round:</strong> {G.roundCorrente} / 13</p>
          <p><strong>Briscola:</strong> <span style={{ fontSize: '24px' }}>{G.briscola}</span></p>
        </div>

        <div style={{ margin: '20px 0' }}>
          <h3>La tua mano:</h3>
          <div style={styles.manoContainer}>
            {laMiaMano.map((c, i) => (
              <div key={i} style={styles.cartaMano}>
                {c.valore} {c.seme}
              </div>
            ))}
          </div>
        </div>

        {dichFatta ? (
          <div style={styles.alertSuccess}>
            Hai dichiarato <strong>{G.declarations[playerID]}</strong> prese. In attesa degli altri giocatori...
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h3>Quante prese pensi di fare?</h3>

            <div style={styles.grigliaPulsanti}>
              {Array.from({ length: (G.totaleMani || 0) + 1 }, (_, i) => i).map(num => (
                <button
                  key={num}
                  style={styles.btnDichiarazione}
                  onClick={() => moves.faiDichiarazione(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2>Tavolo: <span style={{ color: '#1976d2' }}>{matchID}</span></h2>
        <p>Giocatore: <strong>{nomeGiocatore}</strong> (Posto {Number(playerID) + 1})</p>
      </div>

      <div style={styles.header}>
        <div>
          <h3>Round {G.roundCorrente} - Mano {G.manoCorrente} / {G.totaleMani}</h3>
          <p>Briscola: <strong style={{ fontSize: '20px' }}>{G.briscola}</strong></p>
        </div>
        <div>
          <p style={{ color: eMioTurno ? '#2e7d32' : '#d32f2f', fontWeight: 'bold', fontSize: '18px' }}>
            {eMioTurno ? '👉 È IL TUO TURNO!' : `Turno di: ${getNomePosto(ctx.currentPlayer)}`}
          </p>
        </div>
      </div>

      <div style={styles.tavoloVerde}>
        <h4>Carte sul Tavolo</h4>
        <div style={styles.carteSulTavolo}>
          {!G.tavolo || G.tavolo.length === 0 ? (
            <p style={{ color: '#ccc' }}>Nessuna carta sul tavolo</p>
          ) : (
            G.tavolo.map((item, idx) => (
              <div key={idx} style={styles.cartaTavolo}>
                <span style={{ fontSize: '12px', color: '#555', display: 'block' }}>
                  {getNomePosto(item.player)}
                </span>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {item.carta.valore} {item.carta.seme}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Le tue Carte ({laMiaMano.length}):</h3>
        <div style={styles.manoContainer}>
          {laMiaMano.map((carta, index) => (
            <button
              key={index}
              disabled={!eMioTurno}
              style={{
                ...styles.cartaInteractive,
                opacity: eMioTurno ? 1 : 0.6,
                cursor: eMioTurno ? 'pointer' : 'not-allowed'
              }}
              onClick={() => eMioTurno && moves.giocaCarta(index)}
            >
              <div style={{ fontSize: '22px' }}>{carta.valore}</div>
              <div style={{ fontSize: '26px' }}>{carta.seme}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [nome, setNome] = useState('');
  const [matchID, setMatchID] = useState('tavolo-1');
  const [session, setSession] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(''); // '' = assegnazione automatica

  const gestisciIngresso = (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    localStorage.setItem('playerName', nome.trim());

    const key = `seat_${matchID.trim()}_${nome.trim()}`;
    let savedSeat = localStorage.getItem(key);

    // Se non c'è un posto già salvato per questo giocatore
    if (!savedSeat) {
      // Troviamo i posti già registrati per questa stanza
      const existingKeys = Object.keys(localStorage).filter(k => k.startsWith(`seat_${matchID.trim()}_`));
      const takenSeats = existingKeys.map(k => localStorage.getItem(k));

      if (selectedSeat !== '') {
        // L'utente ha scelto un posto manuale: verificare conflitto
        if (takenSeats.includes(String(selectedSeat))) {
          alert('Il posto scelto è già occupato. Scegli un altro posto o lascia vuoto per assegnazione automatica.');
          return;
        }
        savedSeat = String(selectedSeat);
        localStorage.setItem(key, savedSeat);
      } else {
        // assegnazione automatica come prima
        savedSeat = String(existingKeys.length % 4);
        localStorage.setItem(key, savedSeat);
      }
    }

    setSession({
      matchID: matchID.trim(),
      playerID: savedSeat
    });
  };

  if (!session) {
    return (
      <div style={styles.loginContainer}>
        <h2>Entra al Tavolo da Gioco</h2>

        <form onSubmit={gestisciIngresso} style={styles.formLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label>Il tuo Nome:</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Inserisci il tuo nome"
              style={styles.input}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Codice Stanza / Nome Tavolo:</label>
            <input
              type="text"
              value={matchID}
              onChange={(e) => setMatchID(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Scegli il posto (opzionale):</label>
            <select
              value={selectedSeat}
              onChange={(e) => setSelectedSeat(e.target.value)}
              style={styles.input}
            >
              <option value="">Assegna automaticamente</option>
              <option value="0">Posto 1</option>
              <option value="1">Posto 2</option>
              <option value="2">Posto 3</option>
              <option value="3">Posto 4</option>
            </select>
          </div>

          <button type="submit" style={styles.btnSubmit}>
            Entra nel Tavolo
          </button>
        </form>
      </div>
    );
  }

  const GiocoClient = Client({
    game: GiocoCarte,
    board: (props) => <TavoloDaGioco {...props} matchID={session.matchID} />,
    multiplayer: SocketIO({ server: SERVER_URL }),
    debug: false,
  });

  return <GiocoClient matchID={session.matchID} playerID={session.playerID} />;
}

const styles = {
  container: { padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto' },
  centerContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial' },
  loginContainer: { maxWidth: '400px', margin: '100px auto', padding: '25px', border: '1px solid #ccc', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  formLogin: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  input: { width: '100%', padding: '12px', marginTop: '5px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' },
  btnSubmit: { padding: '14px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f4f8', padding: '10px 20px', borderRadius: '8px', marginBottom: '15px', borderLeft: '5px solid #1976d2' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ccc', paddingBottom: '10px' },
  cardInfo: { backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' },
  manoContainer: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  cartaMano: { padding: '15px 20px', backgroundColor: '#fff', border: '2px solid #333', borderRadius: '6px', fontWeight: 'bold' },
  cartaInteractive: { padding: '15px 20px', backgroundColor: '#fff', border: '2px solid #2e7d32', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  grigliaPulsanti: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '15px' },
  btnDichiarazione: { padding: '10px 15px', fontSize: '16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  alertSuccess: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '15px', borderRadius: '6px', textAlign: 'center', marginTop: '20px' },
  tavoloVerde: { backgroundColor: '#357a38', color: '#fff', padding: '20px', borderRadius: '12px', minHeight: '150px', textAlign: 'center', margin: '20px 0' },
  carteSulTavolo: { display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' },
  cartaTavolo: { backgroundColor: '#fff', color: '#000', padding: '10px 15px', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', minWidth: '80px' }
};
