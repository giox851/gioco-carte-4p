import React, { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { GiocoCarte } from './Game';

//  server Render
const SERVER_URL = 'https://gioco-carte-4p.onrender.com';

function TavoloDaGioco({ G, ctx, moves, playerID }) {
  if (!G || !ctx) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
        <h3>Connessione al server in corso...</h3>
        <p>Assicurati che il server Node.js sia avviato sulla porta 8000.</p>
      </div>
    );
  }

  const eMioTurno = ctx.currentPlayer === playerID;
  const laMiaMano = G.hands ? (G.hands[playerID] || []) : [];
  const dichFatta = G.declarations ? G.declarations[playerID] !== undefined : false;

  useEffect(() => {
    const nomeSalvato = localStorage.getItem(`nome_giocatore_${playerID}`);
    if (nomeSalvato && moves && moves.impostaNome) {
      moves.impostaNome(nomeSalvato);
    }
  }, [playerID, moves]);

  // Fase di Dichiarazione
  if (ctx.phase === 'dichiarazione') {
    return (
      <div style={styles.container}>
        <div style={styles.cardInfo}>
          <h2>Fase di Dichiarazione</h2>
          <p><strong>Round:</strong> {G.roundCorrente} / 13</p>
          <p><strong>Briscola di questo round:</strong> <span style={{ fontSize: '24px' }}>{G.briscola}</span></p>
          <p><strong>Carte in mano:</strong> {laMiaMano.length}</p>
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
            <p>{eMioTurno ? 'È il tuo turno di dichiarare!' : `In attesa del Giocatore ${G.nomiGiocatori?.[ctx.currentPlayer] || ctx.currentPlayer}...`}</p>
            
            {eMioTurno && (
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
            )}
          </div>
        )}
      </div>
    );
  }

  // Fase Gioco Mani
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3>Round {G.roundCorrente} - Mano {G.manoCorrente} / {G.totaleMani}</h3>
          <p>Briscola: <strong style={{ fontSize: '20px' }}>{G.briscola}</strong></p>
        </div>
        <div>
          <p>Mio Nome: <strong>{G.nomiGiocatori?.[playerID] || playerID}</strong> (Posto {playerID})</p>
          <p style={{ color: eMioTurno ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>
            {eMioTurno ? '👉 È IL TUO TURNO!' : `Turno di: ${G.nomiGiocatori?.[ctx.currentPlayer] || ctx.currentPlayer}`}
          </p>
        </div>
      </div>

      <div style={styles.tabellaPunti}>
        <h4>Situazione Giocatori</h4>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {['0', '1', '2', '3'].map(pID => (
            <div key={pID} style={{ padding: '8px', border: pID === ctx.currentPlayer ? '2px solid #2e7d32' : '1px solid #ccc', borderRadius: '6px' }}>
              <strong>{G.nomiGiocatori?.[pID] || `Giocatore ${pID}`}</strong>
              <div>Dichiarato: {G.declarations?.[pID] ?? '-'}</div>
              <div>Prese Fatte: {G.prese?.[pID] ?? 0}</div>
              <div>Punti Totali: {G.punti?.[pID] ?? 0}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.tavoloVerde}>
        <h4>Carte sul Tavolo</h4>
        <div style={styles.carteSulTavolo}>
          {!G.tavolo || G.tavolo.length === 0 ? (
            <p style={{ color: '#aaa' }}>Nessuna carta sul tavolo</p>
          ) : (
            G.tavolo.map((item, idx) => (
              <div key={idx} style={styles.cartaTavolo}>
                <span style={{ fontSize: '12px', color: '#555' }}>
                  {G.nomiGiocatori?.[item.player] || item.player}
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

const GiocoClient = Client({
  game: GiocoCarte,
  board: TavoloDaGioco,
  multiplayer: SocketIO({ server: SERVER_URL }),
  debug: false,
});

export default function App() {
  const [nome, setNome] = useState('Giox');
  const [matchID, setMatchID] = useState('tavolo-1');
  const [playerID, setPlayerID] = useState('0');
  const [inPartita, setInPartita] = useState(false);

  const gestisciEntrata = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Inserisci il tuo nome!');
      return;
    }
    if (playerID === '') {
      alert('Seleziona un posto!');
      return;
    }

    localStorage.setItem(`nome_giocatore_${playerID}`, nome.trim());
    setInPartita(true);
  };

  if (!inPartita) {
    return (
      <div style={styles.loginContainer}>
        <h2>Entra al Tavolo da Gioco</h2>
        <form onSubmit={gestisciEntrata} style={styles.formLogin}>
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

          <div style={{ marginBottom: '15px' }}>
            <label>Codice Stanza:</label>
            <input
              type="text"
              value={matchID}
              onChange={(e) => setMatchID(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Scegli il tuo Posto:</label>
            <select
              value={playerID}
              onChange={(e) => setPlayerID(e.target.value)}
              style={styles.input}
              required
            >
              <option value="0">Posto 0 (Giocatore 1)</option>
              <option value="1">Posto 1 (Giocatore 2)</option>
              <option value="2">Posto 2 (Giocatore 3)</option>
              <option value="3">Posto 3 (Giocatore 4)</option>
            </select>
          </div>

          <button type="submit" style={styles.btnSubmit}>
            Entra in Partita
          </button>
        </form>
      </div>
    );
  }

  return (
    <GiocoClient
      matchID={matchID}
      playerID={String(playerID)}
      credentials={`cred_${playerID}`}
    />
  );
}

const styles = {
  container: { padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto' },
  loginContainer: { maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' },
  formLogin: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  input: { width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' },
  btnSubmit: { padding: '12px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ccc', paddingBottom: '10px' },
  cardInfo: { backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' },
  manoContainer: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  cartaMano: { padding: '15px 20px', backgroundColor: '#fff', border: '2px solid #333', borderRadius: '6px', fontWeight: 'bold' },
  cartaInteractive: { padding: '15px 20px', backgroundColor: '#fff', border: '2px solid #2e7d32', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  grigliaPulsanti: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '15px' },
  btnDichiarazione: { padding: '10px 15px', fontSize: '16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  alertSuccess: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '15px', borderRadius: '6px', textAlign: 'center', marginTop: '20px' },
  tabellaPunti: { margin: '20px 0', backgroundColor: '#fafafa', padding: '10px', borderRadius: '8px' },
  tavoloVerde: { backgroundColor: '#357a38', color: '#fff', padding: '20px', borderRadius: '12px', minHeight: '150px', textAlign: 'center', margin: '20px 0' },
  carteSulTavolo: { display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' },
  cartaTavolo: { backgroundColor: '#fff', color: '#000', padding: '10px 15px', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }
};