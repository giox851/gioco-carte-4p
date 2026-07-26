import React, { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { GiocoCarte } from './Game';

const SERVER_URL = 'https://gioco-carte-4p.onrender.com';

function TavoloDaGioco({ G, ctx, moves, playerID }) {
  const mioNome = localStorage.getItem('mio_nome_giocatore') || `Giocatore ${playerID}`;

  useEffect(() => {
    if (moves && moves.entraAlTavolo && G.giocatori && G.giocatori[playerID] !== mioNome) {
      moves.entraAlTavolo(mioNome);
    }
  }, [moves, playerID, mioNome, G.giocatori]);

  if (!G || !ctx) {
    return (
      <div style={styles.centerContainer}>
        <h3>Connessione al server in corso...</h3>
      </div>
    );
  }

  const giocatoriConnessi = Object.values(G.giocatori || {}).filter(n => n !== null);
  const numConnessi = giocatoriConnessi.length;

  const eMioTurno = ctx.currentPlayer === playerID;
  const laMiaMano = G.hands ? (G.hands[playerID] || []) : [];
  const dichFatta = G.declarations ? G.declarations[playerID] !== undefined : false;

  if (numConnessi < 4) {
    return (
      <div style={styles.container}>
        <div style={styles.waitingCard}>
          <h2>⏳ In attesa dei giocatori...</h2>
          <p style={{ fontSize: '18px' }}>
            Giocatori collegati al tavolo: <strong>{numConnessi} / 4</strong>
          </p>
          
          <div style={styles.gridPosti}>
            {['0', '1', '2', '3'].map((id) => {
              const nomeG = G.giocatori?.[id];
              const eMe = id === playerID;
              return (
                <div key={id} style={{ ...styles.slotPosto, borderColor: nomeG ? '#2e7d32' : '#ccc' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>Posto {Number(id) + 1}</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px' }}>
                    {nomeG ? `${nomeG}${eMe ? ' (Tu)' : ''}` : '🪑 In attesa...'}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ marginTop: '20px', color: '#666' }}>
            La partita inizierà automaticamente non appena si collegherà il 4° giocatore.
          </p>
        </div>
      </div>
    );
  }

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
            <p>{eMioTurno ? '👉 È IL TUO TURNO DI DICHIARARE!' : `In attesa di ${G.giocatori?.[ctx.currentPlayer] || 'un altro giocatore'}...`}</p>
            
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3>Round {G.roundCorrente} - Mano {G.manoCorrente} / {G.totaleMani}</h3>
          <p>Briscola: <strong style={{ fontSize: '20px' }}>{G.briscola}</strong></p>
        </div>
        <div>
          <p>Mio Nome: <strong>{G.giocatori?.[playerID]}</strong></p>
          <p style={{ color: eMioTurno ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>
            {eMioTurno ? '👉 È IL TUO TURNO!' : `Turno di: ${G.giocatori?.[ctx.currentPlayer] || ctx.currentPlayer}`}
          </p>
        </div>
      </div>

      <div style={styles.tabellaPunti}>
        <h4>Situazione Giocatori</h4>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {['0', '1', '2', '3'].map(pID => (
            <div key={pID} style={{ padding: '8px', border: pID === ctx.currentPlayer ? '2px solid #2e7d32' : '1px solid #ccc', borderRadius: '6px' }}>
              <strong>{G.giocatori?.[pID] || `Giocatore ${pID}`}</strong>
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
                  {G.giocatori?.[item.player] || item.player}
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
  const [nome, setNome] = useState('');
  const [matchID, setMatchID] = useState('tavolo-1');
  const [playerID, setPlayerID] = useState(null);

  const entraInPartita = (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    localStorage.setItem('mio_nome_giocatore', nome.trim());
    const postoScelto = prompt("Scegli il tuo posto al tavolo (digita 0, 1, 2 o 3):", "0");
    if (postoScelto !== null && ['0', '1', '2', '3'].includes(postoScelto.trim())) {
      setPlayerID(postoScelto.trim());
    } else {
      alert("Posto non valido. Inserisci un numero tra 0 e 3.");
    }
  };

  if (playerID === null) {
    return (
      <div style={styles.loginContainer}>
        <h2>Entra al Tavolo da Gioco</h2>
        <form onSubmit={entraInPartita} style={styles.formLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label>Il tuo Nome:</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="digita qui il tuo nome"
              style={styles.input}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Codice Stanza / Tavolo:</label>
            <input
              type="text"
              value={matchID}
              onChange={(e) => setMatchID(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.btnSubmit}>
            Accedi al Tavolo
          </button>
        </form>
      </div>
    );
  }

  return (
    <GiocoClient
      matchID={matchID}
      playerID={String(playerID)}
    />
  );
}

const styles = {
  container: { padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto' },
  centerContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial' },
  loginContainer: { maxWidth: '400px', margin: '100px auto', padding: '25px', border: '1px solid #ccc', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  formLogin: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  input: { width: '100%', padding: '12px', marginTop: '5px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' },
  btnSubmit: { padding: '14px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  waitingCard: { backgroundColor: '#f9f9f9', border: '2px dashed #1976d2', padding: '30px', borderRadius: '12px', textAlign: 'center', marginTop: '40px' },
  gridPosti: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' },
  slotPosto: { padding: '15px', border: '2px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' },
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