// Helper per generare e mescolare un mazzo di 52 carte francesi
function creaMazzo() {
  const semi = ['Cuori', 'Quadri', 'Fiori', 'Picche'];
  const valori = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const mazzo = [];

  for (const seme of semi) {
    for (const valore of valori) {
      mazzo.push({ seme, valore });
    }
  }

  // Shuffle (Fisher-Yates)
  for (let i = mazzo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mazzo[i], mazzo[j]] = [mazzo[j], mazzo[i]];
  }

  return mazzo;
}

// Helper per calcolare la forza della carta
function calcolaValoreCarta(carta, briscola, semeDiMano) {
  const gerarchia = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11,
    'Q': 12, 'K': 13, 'A': 14
  };

  let punteggio = gerarchia[carta.valore] || 0;

  if (carta.seme === briscola) {
    punteggio += 100;
  } else if (carta.seme === semeDiMano) {
    punteggio += 10;
  }

  return punteggio;
}

export const GiocoCarte = {
  name: 'gioco-carte-4p',

  setup: (ctx) => {
    const G = {
      roundCorrente: 1,
      manoCorrente: 1,
      totaleMani: 13,
      briscola: '',
      hands: { 0: [], 1: [], 2: [], 3: [] },
      declarations: {},
      prese: { 0: 0, 1: 0, 2: 0, 3: 0 },
      punteggiTotali: { 0: 0, 1: 0, 2: 0, 3: 0 },
      tavolo: [],
      nomiGiocatori: { 0: 'Giocatore 1', 1: 'Giocatore 2', 2: 'Giocatore 3', 3: 'Giocatore 4' },
    };

    // Crea mazzo, mescola e distribuisce 13 carte per giocatore
    const mazzo = creaMazzo();
    const cartePerGiocatore = 13;
    for (let i = 0; i < 4; i++) {
      G.hands[i] = mazzo.splice(0, cartePerGiocatore);
    }

    // Sceglie un seme di briscola comune a tutti
    const suits = ['Cuori', 'Quadri', 'Fiori', 'Picche'];
    G.briscola = suits[Math.floor(Math.random() * suits.length)];

    return G;
  },

  moves: {
    // Permette di registrare il nome in qualsiasi momento.
    // Riceve solo il "name" come argomento semplice (non un oggetto da
    // destrutturare): usiamo ctx.playerID, che boardgame.io imposta da solo
    // in base al client connesso, evitando così il crash quando la mossa
    // viene invocata senza argomenti (es. durante una ri-sincronizzazione).
    registraGiocatore: {
      move: (G, ctx, name) => {
        if (!G.nomiGiocatori) {
          G.nomiGiocatori = {};
        }
        const pid = ctx.playerID;
        if (name && name.trim() !== '' && pid !== undefined) {
          G.nomiGiocatori[pid] = name.trim();
        }
      },
      noLimit: true, // Consente l'esecuzione anche se non è il proprio turno
    },

    faiDichiarazione: (G, ctx, numeroPrese) => {
      if (!G.declarations) G.declarations = {};
      G.declarations[ctx.playerID || ctx.currentPlayer] = numeroPrese;
    },

    giocaCarta: (G, ctx, cartaIndex) => {
      const player = ctx.currentPlayer;
      if (!G.hands || !G.hands[player]) return;

      const cartaGiocata = G.hands[player][cartaIndex];
      if (!cartaGiocata) return;

      G.hands[player].splice(cartaIndex, 1);

      if (!G.tavolo) G.tavolo = [];
      G.tavolo.push({
        player: player,
        carta: cartaGiocata
      });
    }
  },

  phases: {
    dichiarazione: {
      start: true,
      // Usiamo 'ALL' come stringa per evitare import incompatibili con ESM su Node 24
      turn: {
        activePlayers: 'ALL',
      },
      onBegin: (G, ctx) => {
        // Non riassegnare le mani o la briscola se già presenti (per evitare inconsistenze tra client/server)
        G.tavolo = [];
        G.declarations = {};
        G.prese = { 0: 0, 1: 0, 2: 0, 3: 0 };

        if (!G.hands || [0,1,2,3].some(i => !G.hands[i] || G.hands[i].length === 0)) {
          const mazzo = creaMazzo();
          const cartePerGiocatore = 13;
          G.totaleMani = cartePerGiocatore;
          for (let i = 0; i < 4; i++) {
            G.hands[i] = mazzo.splice(0, cartePerGiocatore);
          }

          const suits = ['Cuori', 'Quadri', 'Fiori', 'Picche'];
          G.briscola = suits[Math.floor(Math.random() * suits.length)];
        }
      },

      endIf: (G) => {
        if (!G || !G.declarations) return false;
        return Object.keys(G.declarations).length === 4;
      },
      next: 'gioco',
    },

    gioco: {
      turn: {
        moveLimit: 1,
      },
      onEnd: (G, ctx) => {
        if (G.tavolo && G.tavolo.length === 4) {
          const semeDiMano = G.tavolo[0].carta.seme;
          let vincitoreMano = G.tavolo[0].player;
          let punteggioMassimo = -1;

          for (const giocata of G.tavolo) {
            const valore = calcolaValoreCarta(giocata.carta, G.briscola, semeDiMano);
            if (valore > punteggioMassimo) {
              punteggioMassimo = valore;
              vincitoreMano = giocata.player;
            }
          }

          if (!G.prese) G.prese = { 0: 0, 1: 0, 2: 0, 3: 0 };
          G.prese[vincitoreMano] = (G.prese[vincitoreMano] || 0) + 1;
          G.tavolo = [];
          G.manoCorrente += 1;
        }
      },
      endIf: (G) => {
        if (!G || !G.hands) return false;
        return (G.hands[0]?.length === 0) &&
               (G.hands[1]?.length === 0) &&
               (G.hands[2]?.length === 0) &&
               (G.hands[3]?.length === 0);
      },
      onEndPhase: (G) => {
        if (!G.punteggiTotali) G.punteggiTotali = { 0: 0, 1: 0, 2: 0, 3: 0 };

        for (let i = 0; i < 4; i++) {
          const dichiarate = (G.declarations && G.declarations[i]) || 0;
          const fatte = (G.prese && G.prese[i]) || 0;

          if (dichiarate === fatte) {
            G.punteggiTotali[i] += 10 + fatte;
          } else {
            G.punteggiTotali[i] -= Math.abs(dichiarate - fatte);
          }
        }

        G.roundCorrente += 1;
        G.manoCorrente = 1;
      },
      next: 'dichiarazione',
    }
  }
};