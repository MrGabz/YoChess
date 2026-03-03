/**
 * Glicko-2 Rating System Implementation
 * Based on Mark Glickman's Glicko-2 algorithm
 * Kid-friendly starting rating: 800 (not 1500 like Lichess)
 */

const DEFAULT_RATING = 800;
const DEFAULT_RD = 350;       // Rating Deviation — high = less confident
const DEFAULT_VOLATILITY = 0.06;
const TAU = 0.5;              // System constant (constrains volatility change)
const EPSILON = 0.000001;

function toGlicko2Scale(r, rd) {
  return {
    mu: (r - 1500) / 173.7178,
    phi: rd / 173.7178,
  };
}

function fromGlicko2Scale(mu, phi) {
  return {
    rating: Math.round(173.7178 * mu + 1500),
    rd: Math.round(173.7178 * phi),
  };
}

function g(phi) {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

function E(mu, muj, phij) {
  return 1 / (1 + Math.exp(-g(phij) * (mu - muj)));
}

export function newPlayer(name = 'Player') {
  return {
    name,
    rating: DEFAULT_RATING,
    rd: DEFAULT_RD,
    volatility: DEFAULT_VOLATILITY,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    history: [],
    peakRating: DEFAULT_RATING,
  };
}

/**
 * Calculate new rating after a period of games
 * @param {Object} player - player object with rating, rd, volatility
 * @param {Array} results - [{opponentRating, opponentRd, score}] score: 1=win, 0=loss, 0.5=draw
 * @returns {Object} updated player object
 */
export function updateRating(player, results) {
  if (!results || results.length === 0) {
    // No games: RD increases (uncertainty grows)
    const { mu, phi } = toGlicko2Scale(player.rating, player.rd);
    const phiStar = Math.sqrt(phi * phi + player.volatility * player.volatility);
    const { rd: newRd } = fromGlicko2Scale(mu, Math.min(phiStar, 350 / 173.7178));
    return { ...player, rd: newRd };
  }

  const { mu, phi } = toGlicko2Scale(player.rating, player.rd);

  // Step 3: compute v (variance)
  let v = 0;
  const opponents = results.map(r => {
    const { mu: muj, phi: phij } = toGlicko2Scale(r.opponentRating, r.opponentRd);
    const gPhij = g(phij);
    const eVal = E(mu, muj, phij);
    v += gPhij * gPhij * eVal * (1 - eVal);
    return { muj, phij, gPhij, eVal, score: r.score };
  });
  v = 1 / v;

  // Step 4: compute delta
  let delta = 0;
  for (const opp of opponents) {
    delta += opp.gPhij * (opp.score - opp.eVal);
  }
  delta *= v;

  // Step 5: compute new volatility (iterative)
  const a = Math.log(player.volatility * player.volatility);
  const deltaSq = delta * delta;
  const phiSq = phi * phi;

  function f(x) {
    const ex = Math.exp(x);
    const d2 = phiSq + v + ex;
    return (ex * (deltaSq - phiSq - v - ex)) / (2 * d2 * d2) - (x - a) / (TAU * TAU);
  }

  let A = a;
  let B;
  if (deltaSq > phiSq + v) {
    B = Math.log(deltaSq - phiSq - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) k++;
    B = a - k * TAU;
  }

  let fA = f(A);
  let fB = f(B);
  while (Math.abs(B - A) > EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) { A = B; fA = fB; }
    else { fA /= 2; }
    B = C;
    fB = fC;
  }
  const newVolatility = Math.exp(A / 2);

  // Step 6: update RD
  const phiStar = Math.sqrt(phiSq + newVolatility * newVolatility);

  // Step 7: compute new mu and phi
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  let newMu = mu;
  for (const opp of opponents) {
    newMu += newPhi * newPhi * opp.gPhij * (opp.score - opp.eVal);
  }

  const { rating: newRating, rd: newRd } = fromGlicko2Scale(newMu, newPhi);

  // Track stats
  const wins = player.wins + results.filter(r => r.score === 1).length;
  const losses = player.losses + results.filter(r => r.score === 0).length;
  const draws = player.draws + results.filter(r => r.score === 0.5).length;

  const finalRating = Math.max(100, newRating);
  return {
    ...player,
    rating: finalRating,
    rd: Math.max(30, Math.min(350, newRd)),
    volatility: newVolatility,
    gamesPlayed: player.gamesPlayed + results.length,
    wins,
    losses,
    draws,
    peakRating: Math.max(player.peakRating || player.rating, finalRating),
    history: [
      ...player.history.slice(-49),  // Keep last 50
      {
        date: new Date().toISOString(),
        rating: finalRating,
        result: results[results.length - 1]?.score,
      },
    ],
  };
}

export function getRatingLabel(rating) {
  if (rating < 400) return { label: 'Beginner', emoji: '🌱', color: '#4ade80' };
  if (rating < 600) return { label: 'Learner', emoji: '📚', color: '#4ade80' };
  if (rating < 800) return { label: 'Explorer', emoji: '🔭', color: '#4cc9f0' };
  if (rating < 1000) return { label: 'Knight', emoji: '⚔️', color: '#4cc9f0' };
  if (rating < 1200) return { label: 'Castle Guardian', emoji: '🏰', color: '#9b5de5' };
  if (rating < 1400) return { label: 'Chess Wizard', emoji: '🧙', color: '#9b5de5' };
  if (rating < 1600) return { label: 'Grand Knight', emoji: '👑', color: '#f7c948' };
  if (rating < 1800) return { label: 'Master', emoji: '🌟', color: '#f7c948' };
  return { label: 'Grand Master', emoji: '🏆', color: '#f72585' };
}

export function getExpectedScore(playerRating, opponentRating) {
  const { mu: muP } = toGlicko2Scale(playerRating, 200);
  const { mu: muO, phi: phiO } = toGlicko2Scale(opponentRating, 200);
  return E(muP, muO, phiO);
}
