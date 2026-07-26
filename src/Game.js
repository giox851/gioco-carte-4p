const VALORI = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SEMI = ['♥️', '♦️', '♣️', '♠️'];

const GERARCHIA_VALORI = {
  'A': 13, 'K': 12, 'Q': 11, 'J': 10, '10': 9, '9': 8,
  '8': 7, '7': 6, '6': 5, '5': 4, '4': 3, '3': 2, '2': 1
};

function creaMazzo() {
  const mazzo = [];
  for (const seme of SEMI) {
    for (const valore of VALORI) {
      mazzo.push({ seme, valore });
    }
  }
  return mazzo;
}

function mescola(array, random) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random.Number() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function assegnaCartaSpettante(G, ctx) {
  const carteManoIniziale = 14 - G.roundCorrente;
  const mazzoMescolato = mescola(creaMazzo(), ctx.random);

  G.totaleMani = carteManoIniziale;
  G.manoCorrente = 1;
  G.tavolo = [];
  G.declarations = {};
  G.prese = { '0': 0, '1': 0, '2': 0, '3': 0 };
  G.ultimoVincitore = null;

  G.hands = {
    '0': mazzoMescolato.slice(0, carteManoIniziale),
    '1': mazzoMescolato.slice(carteManoIniziale, carteManoIniziale * 2),
    '2': mazzoMescolato.slice(carteManoIniziale * 2, carteManoIniziale * 3),
    '3': mazzoMescolato.slice(carteManoIniziale * 3, carteManoIniziale * 4),
  };

  const indiceSemeCasuale = Math.floor(ctx.random.Number() * SEMI.length);
  G.briscola = SEMI[indiceSemeCasuale];
}

function calcolaVincitorePresa(tavolo, briscola) {
  const cartaIniziale = tavolo[0].carta;
  let vincitore = tavolo[0];

  for (let i = 1; i < tavolo.length; i++) {
    const sfidante = tavolo[i];
    const cartaVincitrice = vincitore.carta;
    const cartaSfidante = sfidante.carta;

    if (cartaSfidante.seme === briscola && cartaVincitrice.seme !== briscola) {
      vincitore = sfidante;
    } else if (cartaSfidante.seme === cartaVincitrice.seme) {
      if (GERARCHIA_VALORI[cartaSfidante.valore] > GERARCHIA_VALORI[cartaVincitrice.valore]) {
        vincitore = sfidante;
      }
    }
  }
  return vincitore.player;
}

export const GiocoCarte = {
  name: 'gioco-carte-4p',

  setup: (ctx) => {
    const G = {
      roundCorrente: 1,
      totaleMani: 13,
      manoCorrente: 1,
      briscola: '♥️',
      hands: { '0': [], '1': [], '2': [], '3': [] },
      declarations: {},
      prese: { '0': 0, '1': 0, '2': 0, '3': 0 },
      punti: { '0': 0, '1': 0, '2': 0, '3': 0 },
      tavolo: [],
      ultimoVincitore: null,
    };

    assegnaCartaSpettante(G, ctx);
    return G;
  },

  phases: {
    dichiarazione: {
      start: true,
      moves: {
        faiDichiarazione: ({ G, ctx, playerID }, valore) => {
          G.declarations[playerID] = valore;
          if (Object.keys(G.declarations).length === 4) {
            ctx.events.endPhase();
          } else {
            ctx.events.endTurn();
          }
        }
      },
      next: 'giocoMani'
    },
    giocoMani: {
      moves: {
        giocaCarta: ({ G, ctx, playerID }, cartaIndex) => {
          const cartaGiocata = G.hands[playerID].splice(cartaIndex, 1)[0];
          G.tavolo.push({ player: playerID, carta: cartaGiocata });

          if (G.tavolo.length === 4) {
            const vincitoreID = calcolaVincitorePresa(G.tavolo, G.briscola);
            G.prese[vincitoreID] += 1;
            G.ultimoVincitore = vincitoreID;

            if (G.manoCorrente < G.totaleMani) {
              G.manoCorrente += 1;
              G.tavolo = [];
              ctx.events.endTurn({ next: vincitoreID });
            } else {
              ['0', '1', '2', '3'].forEach(pID => {
                const dich = G.declarations[pID];
                const preseFatte = G.prese[pID];
                if (dich === preseFatte) {
                  G.punti[pID] += 10 + dich;
                }
              });

              if (G.roundCorrente < 13) {
                G.roundCorrente += 1;
                assegnaCartaSpettante(G, ctx);
                ctx.events.setPhase('dichiarazione');
              } else {
                ctx.events.endGame();
              }
            }
          } else {
            ctx.events.endTurn();
          }
        }
      }
    }
  }
};