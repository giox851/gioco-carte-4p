import React, { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { GiocoCarte } from './Game';

const SERVER_URL = 'https://gioco-carte-4p.onrender.com';

function TavoloDaGioco({ G, ctx, moves, playerID, matchID }) {
  const [listaGiocatori, setListaGiocatori] = useState([]);

  useEffect(() => {
    const caricaStatoTavolo = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/games/gioco-carte-4p/${matchID}`);
        if (res.ok) {
          const data = await res.json();
          setListaGiocatori(data.players || []);
        }
      } catch (e) {
        console.error("Errore sync giocatori", e);
      }
    };

    caricaStatoTavolo();
    const interval = setInterval(caricaStatoTavolo, 3000);
    return () => clearInterval(interval);
  }, [matchID]);

  if (!G || !ctx) {
    return (
      <div style={styles.centerContainer}>
        <h3>Connessione al server in corso...</h3>
      </div>
    );
  }

  const connessi = listaGiocatori.filter(p => p.name);
  const numConnessi = connessi.length;

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
            {[0, 1, 2, 3].map((idx) => {
              const gInfo = listaGiocatori[idx];
              const nomeG = gInfo ? gInfo.name : null;
              const eMe = String(idx) === playerID;

              return (
                <div key={idx} style={{ ...styles.slotPosto, borderColor: nomeG ? '#2e7d32' : '#ccc' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>Posto {idx + 1}</div>
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
            <p>{eMioTurno ? '👉 È IL TUO TURNO DI DICHIARARE!' : `In attesa di ${listaGiocatori[ctx.currentPlayer]?.name || 'un altro giocatore'}...`}</p>

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
          <p>Mio Nome: <strong>{listaGiocatori[playerID]?.name}</strong></p>
          <p style={{ color: eMioTurno ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>
            {eMioTurno ? '👉 È IL TUO TURNO!' : `Turno di: ${listaGiocatori[ctx.currentPlayer]?.name}`}
          </p>
        </div>
      </div>

      <div style={styles.tabellaPunti}>
        <h4>Situazione Giocatori</h4>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {[0, 1, 2, 3].map(pID => (
            <div key={pID} style={{ padding: '8px', border: String(pID) === ctx.currentPlayer ? '2px solid #2e7d32' : '1px solid #ccc', borderRadius: '6px' }}>
              <strong>{listaGiocatori[pID]?.name || `Giocatore ${pID}`}</strong>
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
                  {listaGiocatori[item.player]?.name || item.player}
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
  const [session, setSession] = useState(null);
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(false);
  const [statoServer, setStatoServer] = useState('Verifica server...');

  // Funzione per effettuare fetch con timeout esteso (evita fallimenti quando Render si sta svegliando)
  const fetchConTimeout = async (url, options = {}, timeoutMs = 20000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  const gestisciIngresso = async (e) => {
    e.preventDefault();
    setErrore('');

    if (!nome.trim()) {
      setErrore('Inserisci un nome valido!');
      return;
    }

    setCaricamento(true);
    setStatoServer('Connessione al server in corso (può richiedere 30s se in standby)...');

    try {
      // 1. Controlla / Crea la stanza con timeout lungo
      let matchRes;
      try {
        matchRes = await fetchConTimeout(`${SERVER_URL}/games/gioco-carte-4p/${matchID}`);
      } catch (err) {
        // Se va in timeout, riprova una seconda volta (ora che il server si è risvegliato)
        setStatoServer('Avvio del server Render in corso, riprovo...');
        matchRes = await fetchConTimeout(`${SERVER_URL}/games/gioco-carte-4p/${matchID}`);
      }

      if (matchRes.status === 404) {
        await fetchConTimeout(`${SERVER_URL}/games/gioco-carte-4p/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numPlayers: 4, setupData: {}, matchID: matchID }),
        });
        matchRes = await fetchConTimeout(`${SERVER_URL}/games/gioco-carte-4p/${matchID}`);
      }

      const matchData = await matchRes.json();
      const players = matchData.players || {};

      // 2. Trova il primo posto vuoto
      const postoLibero = Object.keys(players).find(id => !players[id].name);

      if (postoLibero === undefined) {
        setErrore('❌ Questo tavolo è al completo (4/4)! Cambia codice tavolo.');
        setCaricamento(false);
        return;
      }

      // 3. Registrazione posto
      const joinRes = await fetchConTimeout(`${SERVER_URL}/games/gioco-carte-4p/${matchID}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerID: String(postoLibero),
          playerName: nome.trim(),
        }),
      });

      if (joinRes.ok) {
        const joinData = await joinRes.json();
        setSession({
          playerID: String(postoLibero),
          credentials: joinData.playerCredentials,
        });
      } else {
        setErrore('Errore durante la registrazione al tavolo. Riprova.');
      }
    } catch (err) {
      setErrore('Il server Render sta ancora rispondendo in ritardo o è offline. Clicca nuovamente su "Entra nel Tavolo".');
    } finally {
      setCaricamento(false);
      setStatoServer('');
    }
  };

  if (!session) {
    return (
      <div style={styles.loginContainer}>
        <h2>Entra al Tavolo da Gioco</h2>

        {errore && <div style={styles.alertError}>{errore}</div>}
        {caricamento && <div style={styles.alertInfo}>{statoServer}</div>}

        <form onSubmit={gestisciIngresso} style={styles.formLogin}>
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

          <button type="submit" disabled={caricamento} style={styles.btnSubmit}>
            {caricamento ? 'Connessione...' : 'Entra nel Tavolo'}
          </button>
        </form>
      </div>
    );
  }

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
  alertError: { backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' },
  alertInfo: { backgroundColor: '#e3f2fd', color: '#0d47a1', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' },
  tabellaPunti: { margin: '20px 0', backgroundColor: '#fafafa', padding: '10px', borderRadius: '8px' },
  tavoloVerde: { backgroundColor: '#357a38', color: '#fff', padding: '20px', borderRadius: '12px', minHeight: '150px', textAlign: 'center', margin: '20px 0' },
  carteSulTavolo: { display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' },
  cartaTavolo: { backgroundColor: '#fff', color: '#000', padding: '10px 15px', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }
};