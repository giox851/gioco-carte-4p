import React, { useState } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { LobbyClient } from 'boardgame.io/client';
import { GiocoCarte } from './Game';

const SERVER_URL = 'https://gioco-carte-4p.onrender.com';
const lobbyClient = new LobbyClient({ server: SERVER_URL });

function TavoloDaGioco({ G, ctx, moves, playerID }) {
  if (!G || !ctx) {
    return (
      <div style={styles.centerContainer}>
        <h3>Connessione al tavolo in corso...</h3>
      </div>
    );
  }

  const eMioTurno = ctx.currentPlayer === playerID;
  const laMiaMano = G.hands ? (G.hands[playerID] || []) : [];
  const dichFatta = G.declarations ? G.declarations[playerID] !== undefined : false;

  if (ctx.phase === 'dichiarazione') {
    return (
      <div style={styles.container}>
        <div style={styles.cardInfo}>
          <h2>Fase di Dichiarazione - Posto {Number(playerID) + 1}</h2>
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
            Hai dichiarato <strong>{G.declarations[playerID]}</strong> prese. In attesa degli altri...
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h3>Quante prese pensi di fare?</h3>
            <p>{eMioTurno ? '👉 È IL TUO TURNO DI DICHIARARE!' : 'In attesa degli altri giocatori...'}</p>

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
          <p>Sei il Giocatore: <strong>Posto {Number(playerID) + 1}</strong></p>
          <p style={{ color: eMioTurno ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>
            {eMioTurno ? '👉 È IL TUO TURNO!' : `Turno del Giocatore ${Number(ctx.currentPlayer) + 1}`}
          </p>
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
                  Giocatore {Number(item.player) + 1}
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
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState('');

  const gestisciIngresso = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setCaricamento(true);
    setErrore('');

    try {
      // 1. Prova a creare la partita su Render (se non esiste già)
      try {
        await lobbyClient.createMatch('gioco-carte-4p', {
          numPlayers: 4,
          setupData: {},
          matchID: matchID
        });
      } catch (err) {
        // Se esiste già va bene, proseguiamo col join
      }

      // 2. Ottieni lo stato della partita per trovare il primo posto libero
      const match = await lobbyClient.getMatch('gioco-carte-4p', matchID);
      let freeSeat = match.players.find(p => p.name === nome.trim());
      let playerID = freeSeat ? String(freeSeat.id) : null;
      let playerCredentials = freeSeat ? freeSeat.credentials : null;

      if (!playerID) {
        const availableSeat = match.players.find(p => !p.name);
        if (!availableSeat) {
          throw new Error('Il tavolo è pieno (massimo 4 giocatori)!');
        }
        playerID = String(availableSeat.id);

        // 3. Unisciti alla partita
        const res = await lobbyClient.joinMatch('gioco-carte-4p', matchID, {
          playerID: playerID,
          playerName: nome.trim()
        });
        playerCredentials = res.playerCredentials;
      }

      setSession({
        playerID,
        credentials: playerCredentials
      });
    } catch (err) {
      console.error(err);
      setErrore('Impossibile connettersi al server. Riprova tra qualche secondo.');
    } finally {
      setCaricamento(false);
    }
  };

  if (!session) {
    return (
      <div style={styles.loginContainer}>
        <h2>Entra al Tavolo da Gioco</h2>

        {errore && <div style={styles.alertError}>{errore}</div>}

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
            <label>Codice Stanza / Tavolo:</label>
            <input
              type="text"
              value={matchID}
              onChange={(e) => setMatchID(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={caricamento} style={styles.btnSubmit}>
            {caricamento ? 'Connessione in corso...' : 'Entra nel Tavolo'}
          </button>
        </form>
      </div>
    );
  }

  const GiocoClient = Client({
    game: GiocoCarte,
    board: TavoloDaGioco,
    multiplayer: SocketIO({ server: SERVER_URL }),
    debug: false,
  });

  return (
    <GiocoClient
      matchID={matchID}
      playerID={session.playerID}
      credentials={session.credentials}
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
  alertError: { backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' },
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
  cartaTavolo: { backgroundColor: '#fff', color: '#000', padding: '10px 15px', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }
};