// Helper per generare e mescolare un mazzo di 40 carte italiane/piacentine
function creaMazzo() {
  const semi = ['Bastoni', 'Coppe', 'Denari', 'Spade'];
  const valori = ['1', '2', '3', '4', '5', '6', '7', 'Fante', 'Cavallo', 'Re'];
  const mazzo = [];

  for (const seme of semi) {
    for (const valore of valori) {
      mazzo.push({ seme, valore });
    }
  }

  // Shuffle (Algoritmo Fisher-Yates)
  for (let i = mazzo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mazzo[i], mazzo[j]] = [mazzo[j], mazzo[i]];
  }

  return mazzo;
}

// Helper per calcolare la forza di una carta
function calcolaValoreCarta(carta, briscola, semeDiMano) {
  // Gerarchia valore standard: Re > Cavallo > Fante > 7 > 6 > 5 > 4 > 3 > 2 > 1
  const gerarchia = {
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, 'Fante': 8, 'Cavallo': 9, 'Re': 10
  };

  let punteggio = gerarchia[carta.valore] || 0;

  // Se è briscola ha un peso dominante
  if (carta.seme === briscola) {
    punteggio += 100;
  } 
  // Se rispetta il seme di mano della prima carta giocata
  else if (carta.seme === semeDiMano) {
    punteggio += 10;
  }

  return punteggio;
}

export const GiocoCarte = {
  name: 'gioco-carte-4p',

  setup: () => ({
    roundCorrente: 1,
    manoCorrente: 1,
    totaleMani: 10, // Inizia con 10 carte a testa nel primo round
    briscola: '',
    hands: { 0: [], 1: [], 2: [], 3: [] },
    declarations: {},
    prese: { 0: 0, 1: 0, 2: 0, 3: 0 },
    punteggiTotali: { 0: 0, 1: 0, 2: 0, 3: 0 },
    tavolo: [],
    nomiGiocatori: { 0: 'Giocatore 1', 1: 'Giocatore 2', 2: 'Giocatore 3', 3: 'Giocatore 4' },
  }),

  moves: {
    // Registra il nome del giocatore nello stato condiviso G
    registraGiocatore: (G, ctx, { playerID, name }) => {
      if (!G.nomiGiocatori) {
        G.nomiGiocatori = {};
      }
      if (name && name.trim() !== '') {
        G.nomiGiocatori[playerID] = name.trim();
      }
    },

    // Mossa per registrare la dichiarazione (scommessa) sulle prese
    faiDichiarazione: (G, ctx, numeroPrese) => {
      G.declarations[ctx.currentPlayer] = numeroPrese;
    },

    // Mossa per calare la carta sul tavolo
    giocaCarta: (G, ctx, cartaIndex) => {
      const player = ctx.currentPlayer;
      const cartaGiocata = G.hands[player][cartaIndex];

      if (!cartaGiocata) return;

      // Rimuovi la carta dalla mano del giocatore
      G.hands[player].splice(cartaIndex, 1);

      // Aggiungi la carta al tavolo
      G.tavolo.push({
        player: player,
        carta: cartaGiocata
      });
    }
  },

  phases: {
    dichiarazione: {
      start: true,
      onBegin: (G, ctx) => {
        // Ripristina tavolo e conteggi del round
        G.tavolo = [];
        G.declarations = {};
        G.prese = { 0: 0, 1: 0, 2: 0, 3: 0 };

        // Crea e distribuisce le carte
        const mazzo = creaMazzo();
        const cartePerGiocatore = Math.min(11 - G.roundCorrente, 10); // Scala ad ogni round
        G.totaleMani = cartePerGiocatore;

        for (let i = 0; i < 4; i++) {
          G.hands[i] = mazzo.splice(0, cartePerGiocatore);
        }

        // Estrai la briscola
        const cartaBriscola = mazzo.pop();
        G.briscola = cartaBriscola ? cartaBriscola.seme : 'Bastoni';
      },
      endIf: (G) => {
        // La fase termina quando tutti e 4 i giocatori hanno dichiarato
        return Object.keys(G.declarations).length === 4;
      },
      next: 'gioco',
    },

    gioco: {
      turn: {
        moveLimit: 1,
      },
      onEnd: (G, ctx) => {
        // Fine della singola mano (quando ci sono 4 carte sul tavolo)
        if (G.tavolo.length === 4) {
          const semeDiMano = G.tavolo[0].carta.seme;
          let vincitoreMano = G.tavolo[0].player;
          let punteggioMassimo = -1;

          // Determina il vincitore della presa
          for (const giocata of G.tavolo) {
            const valore = calcolaValoreCarta(giocata.carta, G.briscola, semeDiMano);
            if (valore > punteggioMassimo) {
              punteggioMassimo = valore;
              vincitoreMano = giocata.player;
            }
          }

          // Assegna la presa al vincitore
          G.prese[vincitoreMano] = (G.prese[vincitoreMano] || 0) + 1;
          G.tavolo = [];
          G.manoCorrente += 1;
        }
      },
      endIf: (G) => {
        // Il round finisce quando tutte le carte in mano sono state giocate
        return G.hands[0].length === 0 &&
               G.hands[1].length === 0 &&
               G.hands[2].length === 0 &&
               G.hands[3].length === 0;
      },
      onEndPhase: (G) => {
        // Calcolo punteggi di fine round
        for (let i = 0; i < 4; i++) {
          const dichiarate = G.declarations[i] || 0;
          const fatte = G.prese[i] || 0;

          if (dichiarate === fatte) {
            // Punti per aver azzeccato la dichiarazione
            G.punteggiTotali[i] += 10 + fatte;
          } else {
            // Penalità per errore
            G.punteggiTotali[i] -= Math.abs(dichiarate - fatte);
          }
        }

        // Avanza di round
        G.roundCorrente += 1;
        G.manoCorrente = 1;
      },
      next: 'dichiarazione',
    }
  }
};