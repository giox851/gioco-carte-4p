import { INVALID_MOVE } from 'boardgame.io/core';

const VALORI_ORDINE = {
  '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6,
  '8': 7, '9': 8, '10': 9, 'J': 10, 'Q': 11, 'K': 12, 'A': 13
};

function creaMazzoMescolato() {
  const semi = ['♥️', '♦️', '♣️', '♠️'];
  const valori = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const mazzo = [];

  for (const seme of semi) {
    for (const valore of valori) {
      mazzo.push({ valore, seme });
    }
  }

  for (let i = mazzo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mazzo[i], mazzo[j]] = [mazzo[j], mazzo[i]];
  }

  return mazzo;
}

function scegliBriscolaCasuale() {
  const semi = ['♥️', '♦️', '♣️', '♠️'];
  return semi[Math.floor(Math.random() * semi.length)];
}

function calcolaVincitoreMano(tavolo, briscola) {
  const semeIniziale = tavolo[0].carta.seme;
  let cartaVincente = tavolo[0];

  for (let i = 1; i < tavolo.length; i++) {
    const corrente = tavolo[i];
    const cartaCorr = corrente.carta;
    const cartaVinc = cartaVincente.carta;

    if (cartaCorr.seme === briscola) {
      if (cartaVinc.seme !== briscola) {
        cartaVincente = corrente;
      } else if (VALORI_ORDINE[cartaCorr.valore] > VALORI_ORDINE[cartaVinc.valore]) {
        cartaVincente = corrente;
      }
    } else if (cartaCorr.seme === semeIniziale && cartaVinc.seme !== briscola) {
      if (VALORI_ORDINE[cartaCorr.valore] > VALORI_ORDINE[cartaVinc.valore]) {
        cartaVincente = corrente;
      }
    }
  }

  return cartaVincente.player;
}

// Prepara un nuovo round (mescola, distribuisce 13 carte e sceglie nuova briscola)
function resettaPerNuovoRound(G) {
  const mazzo = creaMazzoMescolato();
  G.manoCorrente = 1;
  G.briscola = scegliBriscolaCasuale();
  G.hands = {
    '0': mazzo.slice(0, 13),
    '1': mazzo.slice(13, 26),
    '2': mazzo.slice(26, 39),
    '3': mazzo.slice(39, 52),
  };
  G.declarations = {};
  G.prese = { '0': 0, '1': 0, '2': 0, '3': 0 };
  G.tavolo = [];
  G.ultimoVincitore = null;
}

export const GiocoCarte = {
  name: 'gioco-carte-4p',

  setup: () => {
    const mazzo = creaMazzoMescolato();
    return {
      manoCorrente: 1,
      totaleMani: 13,
      roundCorrente: 1,
      briscola: scegliBriscolaCasuale(),
      hands: {
        '0': mazzo.slice(0, 13),
        '1': mazzo.slice(13, 26),
        '2': mazzo.slice(26, 39),
        '3': mazzo.slice(39, 52),
      },
      declarations: {},
      punti: { '0': 0, '1': 0, '2': 0, '3': 0 },
      prese: { '0': 0, '1': 0, '2': 0, '3': 0 },
      tavolo: [],
      ultimoVincitore: null,
    };
  },

  phases: {
    dichiarazione: {
      start: true,
      turn: {
        moveLimit: 1,
      },
      moves: {
        faiDichiarazione: ({ G, ctx }, valore) => {
          const valNum = Number(valore);
          const attuali = G.declarations || {};
          const somma = Object.values(attuali).reduce((a, b) => Number(a) + Number(b), 0);

          if (somma + valNum === 13) {
            return INVALID_MOVE;
          }

          G.declarations[ctx.currentPlayer] = valNum;
        },
      },
      endIf: ({ G }) => Object.keys(G.declarations || {}).length === 4,
      next: 'giocoMani',
    },

    giocoMani: {
      turn: {
        moveLimit: 1,
        order: {
          first: ({ G }) => {
            if (G.ultimoVincitore !== null) {
              return Number(G.ultimoVincitore);
            }
            return 0;
          },
          next: ({ G, ctx }) => {
            if (G.tavolo.length === 4 && G.ultimoVincitore !== null) {
              return Number(G.ultimoVincitore);
            }
            return (ctx.playOrderPos + 1) % ctx.numPlayers;
          },
        },
      },
      moves: {
        giocaCarta: ({ G, ctx }, cardIndex) => {
          const player = ctx.currentPlayer;
          const manoGiocatore = G.hands[player];
          if (!manoGiocatore) return INVALID_MOVE;

          const cartaScelta = manoGiocatore[cardIndex];
          if (!cartaScelta) return INVALID_MOVE;

          // Pulisce il tavolo prima della nuova giocata se la mano precedente è finita
          if (G.tavolo.length === 4) {
            G.tavolo = [];
          }

          // Verifichiamo l'obbligo del seme
          if (G.tavolo.length > 0) {
            const semeIniziale = G.tavolo[0].carta.seme;
            const haSemeIniziale = manoGiocatore.some((c) => c.seme === semeIniziale);

            if (haSemeIniziale && cartaScelta.seme !== semeIniziale) {
              return INVALID_MOVE;
            }
          }

          // Gioca la carta
          G.hands[player].splice(cardIndex, 1);
          G.tavolo.push({ player, carta: cartaScelta });

          // Quando viene giocata la 4a carta:
          if (G.tavolo.length === 4) {
            const vincitore = calcolaVincitoreMano(G.tavolo, G.briscola);
            G.prese[vincitore] = (G.prese[vincitore] || 0) + 1;
            G.ultimoVincitore = vincitore;
            G.manoCorrente += 1;
          }
        },
      },
      // Quando finisce la 13ª mano del round
      endIf: ({ G }) => G.manoCorrente > 13,
      onEnd: ({ G }) => {
        // 1. Calcola e assegna i punti del round completato
        const giocatori = ['0', '1', '2', '3'];
        giocatori.forEach((pID) => {
          const preseFatte = G.prese[pID] || 0;
          const dichiarate = G.declarations[pID] || 0;
          let puntiMano = preseFatte;

          if (preseFatte === dichiarate) {
            puntiMano += 10;
          }

          G.punti[pID] = (G.punti[pID] || 0) + puntiMano;
        });

        // 2. Prepara le carte e lo stato per il nuovo round automatico
        G.roundCorrente = (G.roundCorrente || 1) + 1;
        resettaPerNuovoRound(G);
      },
      next: 'dichiarazione', // Torna subito e automaticamente alla fase di dichiarazione
    },
  },
};