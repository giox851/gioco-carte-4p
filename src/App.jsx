import React from 'react';
import { createRoot } from 'react-dom/client';
import { Client } from 'boardgame.io/react';
import { GiocoCarte } from './Game.js';

const ORDINE_VALORI = {
  'A': 13, 'K': 12, 'Q': 11, 'J': 10, '10': 9, '9': 8,
  '8': 7, '7': 6, '6': 5, '5': 4, '4': 3, '3': 2, '2': 1
};

const ORDINE_SEMI = {
  '♥️': 1, '♦️': 2, '♣️': 3, '♠️': 4
};

function ordinaCarte(carte) {
  return [...carte].map((carta, indexOriginale) => ({ ...carta, indexOriginale })).sort((a, b) => {
    if (ORDINE_SEMI[a.seme] !== ORDINE_SEMI[b.seme]) {
      return ORDINE_SEMI[a.seme] - ORDINE_SEMI[b.seme];
    }
    return ORDINE_VALORI[b.valore] - ORDINE_VALORI[a.valore];
  });
}

const TavoloDiGioco = ({ G, ctx, moves }) => {
  const giocatori = ['0', '1', '2', '3'];
  const dichiarazioni = G?.declarations || {};
  const carteSulTavolo = G?.tavolo || [];

  const sommaAttuale = Object.values(dichiarazioni).reduce(
    (acc, val) => acc + Number(val),
    0
  );

  const eBriscolaRossa = G?.briscola === '♥️' || G?.briscola === '♦️';
  const semeIniziale = carteSulTavolo.length > 0 && carteSulTavolo.length < 4 ? carteSulTavolo[0].carta.seme : null;

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>Tavolo di Gioco (4 Giocatori)</h2>

      {/* BANNER PRINCIPALE E BRISCOLA */}
      <div style={{
        backgroundColor: '#1b2a4a',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '10px',
        marginBottom: '15px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
          🎲 Partita #{G?.roundCorrente || 1} — Mano <span style={{ color: '#4fc3f7', fontSize: '20px' }}>{Math.min(G?.manoCorrente || 1, 13)}</span> di {G?.totaleMani}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#ffffff',
          padding: '6px 16px',
          borderRadius: '8px',
          marginLeft: 'auto',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1b2a4a', textTransform: 'uppercase' }}>
            BRISCOLA
          </span>
          <span style={{
            fontSize: '34px',
            lineHeight: '1',
            color: eBriscolaRossa ? '#d32f2f' : '#111111',
            fontWeight: 'bold'
          }}>
            {G?.briscola}
          </span>
        </div>
      </div>

      {/* TABELLA GLOBALE: PUNTEGGI, DICHIARAZIONI E PRESE */}
      <div style={{
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '10px 15px',
        marginBottom: '15px'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', color: '#333' }}>
          📊 RIEPILOGO PUNTI & MANO CORRENTE:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {giocatori.map((pID) => {
            const decl = dichiarazioni[pID] !== undefined ? dichiarazioni[pID] : '-';
            const preseFatte = G?.prese?.[pID] || 0;
            const puntiTotali = G?.punti?.[pID] || 0;
            const eTurnoCorrente = ctx.currentPlayer === pID;

            return (
              <div key={pID} style={{
                backgroundColor: eTurnoCorrente ? '#e8f5e9' : '#ffffff',
                border: eTurnoCorrente ? '2px solid #2e7d32' : '1px solid #ccc',
                borderRadius: '6px',
                padding: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Giocatore {pID}</div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#555' }}>
                  Dichiarate: <strong>{decl}</strong> | Prese: <strong style={{ color: '#2e7d32' }}>{preseFatte}</strong>
                </div>
                <div style={{ fontSize: '13px', marginTop: '4px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                  Punti Totali: <strong style={{ color: '#1565c0', fontSize: '15px' }}>{puntiTotali}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BARRA DI STATO FASE */}
      <div style={{
        background: ctx.phase === 'dichiarazione' ? '#e3f2fd' : '#e8f5e9',
        padding: '12px 15px',
        borderRadius: '6px',
        marginBottom: '15px',
        textAlign: 'center',
        border: '1px solid #ccc',
        fontSize: '15px'
      }}>
        {ctx.phase === 'dichiarazione' ? (
          <div>
            <strong>FASE DICHIARAZIONE:</strong> Somma mani dichiarate: <strong style={{ fontSize: '17px', color: '#1565c0' }}>{sommaAttuale}</strong>
          </div>
        ) : (
          <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>
            🎮 FASE GIOCO MANI — Tocca al <u>Giocatore {ctx.currentPlayer}</u>
            {semeIniziale && <span> (Seme d'uscita obbligatorio: <strong>{semeIniziale}</strong>)</span>}
          </div>
        )}
      </div>

      {/* AREA CENTRALE DEL TAVOLO */}
      <div style={{
        backgroundColor: '#2e7d32',
        color: '#ffffff',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justify: 'center',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          🃏 Carte sul tavolo ({carteSulTavolo.length} / 4)
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {carteSulTavolo.length === 0 ? (
            <span style={{ fontSize: '13px', opacity: 0.8, fontStyle: 'italic' }}>Nessuna carta sul tavolo. Tocca al Giocatore {ctx.currentPlayer}...</span>
          ) : (
            carteSulTavolo.map((elem, i) => {
              const eRosso = elem.carta.seme === '♥️' || elem.carta.seme === '♦️';
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.3)'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>G{elem.player}</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: eRosso ? '#d32f2f' : '#111' }}>
                    {elem.carta.valore}{elem.carta.seme}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {G.ultimoVincitore !== null && carteSulTavolo.length === 4 && (
          <div style={{ marginTop: '12px', backgroundColor: '#ffeb3b', color: '#000', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}>
            🏆 Presa vinta dal Giocatore {G.ultimoVincitore}! Tocca a lui iniziare la nuova mano.
          </div>
        )}
      </div>

      {/* GRIGLIA 4 GIOCATORI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {giocatori.map((playerID) => {
          const miaManoGrezza = G?.hands?.[playerID] || [];
          const miaManoOrdinata = ordinaCarte(miaManoGrezza);

          const eIlMioTurno = ctx.currentPlayer === playerID;
          const haSemeIniziale = semeIniziale ? miaManoGrezza.some((c) => c.seme === semeIniziale) : false;

          return (
            <div
              key={playerID}
              style={{
                padding: '15px',
                border: eIlMioTurno ? '3px solid #2e7d32' : '1px solid #ccc',
                borderRadius: '8px',
                backgroundColor: eIlMioTurno ? '#f1f8e9' : '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Giocatore {playerID}</h3>
                <span style={{ fontSize: '12px', backgroundColor: '#e3f2fd', border: '1px solid #90caf9', padding: '3px 8px', borderRadius: '12px', color: '#1565c0', fontWeight: 'bold' }}>
                  Punti: {G?.punti?.[playerID] || 0}
                </span>
              </div>

              <p style={{ margin: '8px 0', fontSize: '13px' }}>
                <strong>Status:</strong> {eIlMioTurno ? '👉 TOCCA A TE!' : `In attesa del Giocatore ${ctx.currentPlayer}`}
              </p>

              {/* SEZIONE DICHIARAZIONE */}
              {eIlMioTurno && ctx.phase === 'dichiarazione' && dichiarazioni[playerID] === undefined && (
                <div style={{
                  marginBottom: '10px',
                  padding: '10px',
                  background: '#fffde7',
                  borderRadius: '6px',
                  border: '1px solid #fff59d'
                }}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Scegli la tua dichiarazione:
                  </label>

                  {(() => {
                    const carteInMano = miaManoGrezza.length;
                    const valoreVietato = 13 - sommaAttuale;

                    const opzioniValide = [];
                    for (let i = 0; i <= carteInMano; i++) {
                      if (i !== valoreVietato) {
                        opzioniValide.push(i);
                      }
                    }

                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {opzioniValide.map((val) => (
                          <button
                            key={val}
                            onClick={() => moves.faiDichiarazione(val)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              backgroundColor: '#2e7d32',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* FASE GIOCO MANI CON CARTE ORDINATE */}
              <div style={{ marginTop: '12px' }}>
                <h4 style={{ margin: '5px 0', fontSize: '13px' }}>Carte in mano ({miaManoGrezza.length}):</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {miaManoOrdinata.map((carta) => {
                    const etichetta = `${carta.valore}${carta.seme}`;

                    const eCartaSemeIniziale = carta.seme === semeIniziale;
                    const eMossaLegale = !semeIniziale || !haSemeIniziale || eCartaSemeIniziale;
                    const disabilitato = !eIlMioTurno || ctx.phase !== 'giocoMani' || !eMossaLegale;

                    const eRosso = carta.seme === '♥️' || carta.seme === '♦️';

                    return (
                      <button
                        key={`${carta.seme}-${carta.valore}-${carta.indexOriginale}`}
                        disabled={disabilitato}
                        onClick={() => moves.giocaCarta(carta.indexOriginale)}
                        style={{
                          padding: '6px 8px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          color: eRosso ? '#d32f2f' : '#111',
                          backgroundColor: disabilitato ? '#e0e0e0' : '#fff',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: disabilitato ? 'not-allowed' : 'pointer',
                          opacity: disabilitato ? 0.5 : 1
                        }}
                      >
                        {etichetta}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const App = Client({
  game: GiocoCarte,
  board: TavoloDiGioco,
  numPlayers: 4,
});

const targetEl = document.getElementById('root') || document.getElementById('app');
if (targetEl) {
  const root = createRoot(targetEl);
  root.render(<App />);
}