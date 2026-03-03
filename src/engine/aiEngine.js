/**
 * YoChess AI Engine
 * Difficulty levels mapped to Glicko-2 ratings
 * Uses chess.js for move generation + evaluation
 */

import { Chess } from 'chess.js';

export const AI_LEVELS = [
  {
    id: 'pixel',
    name: 'Newbie',
    emoji: '🐣',
    rating: 300,
    description: 'Just learning to move pieces!',
    color: '#4ade80',
    depth: 1,
    randomness: 0.9,
    blunderChance: 0.6,
  },
  {
    id: 'nugget',
    name: 'Beginner',
    emoji: '🌱',
    rating: 500,
    description: 'Captures pieces when it can',
    color: '#86efac',
    depth: 1,
    randomness: 0.6,
    blunderChance: 0.35,
  },
  {
    id: 'sparky',
    name: 'Intermediate',
    emoji: '⚔️',
    rating: 700,
    description: 'Thinks one move ahead',
    color: '#fbbf24',
    depth: 2,
    randomness: 0.4,
    blunderChance: 0.2,
  },
  {
    id: 'rocky',
    name: 'Advanced',
    emoji: '🛡️',
    rating: 900,
    description: 'Defends pieces and attacks',
    color: '#94a3b8',
    depth: 2,
    randomness: 0.2,
    blunderChance: 0.1,
  },
  {
    id: 'blaze',
    name: 'Expert',
    emoji: '🔥',
    rating: 1100,
    description: 'Plans tactics and combinations',
    color: '#f97316',
    depth: 3,
    randomness: 0.1,
    blunderChance: 0.05,
  },
  {
    id: 'nova',
    name: 'Champion',
    emoji: '🏅',
    rating: 1300,
    description: 'Sees forks, pins and skewers',
    color: '#a78bfa',
    depth: 3,
    randomness: 0.05,
    blunderChance: 0.02,
  },
  {
    id: 'titan',
    name: 'Chess Master',
    emoji: '👑',
    rating: 1500,
    description: 'Strong middlegame & endgame',
    color: '#4cc9f0',
    depth: 3,
    randomness: 0.02,
    blunderChance: 0,
  },
  {
    id: 'cosmos',
    name: 'Grand Master',
    emoji: '🌌',
    rating: 1800,
    description: 'Near-perfect play',
    color: '#9b5de5',
    depth: 4,
    randomness: 0,
    blunderChance: 0,
  },
];

// Piece values for evaluation
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece-square tables for positional evaluation
const PST = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
  ],
};

function squareIndex(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = 8 - parseInt(square[1]);
  return rank * 8 + file;
}

function evaluateBoard(chess) {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99999 : 99999;
  }
  if (chess.isDraw()) return 0;

  let score = 0;
  const board = chess.board();

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (!piece) continue;
      const idx = rank * 8 + file;
      const flippedIdx = (7 - rank) * 8 + file;
      const pst = PST[piece.type] || [];
      const pstVal = piece.color === 'w' ? (pst[flippedIdx] || 0) : (pst[idx] || 0);
      const val = PIECE_VALUES[piece.type] + pstVal;
      score += piece.color === 'w' ? val : -val;
    }
  }
  return score;
}

function minimax(chess, depth, alpha, beta, maximizing) {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }
  const moves = chess.moves();
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false));
      chess.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true));
      chess.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ─── Web Worker AI (true background thread — zero UI freeze) ──────────────────

let _worker = null;
let _workerCallbacks = new Map();
let _callbackId = 0;

function getAiWorker() {
  if (!_worker) {
    try {
      _worker = new Worker(new URL('./aiWorker.js', import.meta.url), { type: 'module' });
      _worker.onmessage = (e) => {
        const { id, move } = e.data;
        const resolve = _workerCallbacks.get(id);
        if (resolve) {
          _workerCallbacks.delete(id);
          resolve(move);
        }
      };
      _worker.onerror = (err) => {
        console.warn('AI worker error, falling back to sync:', err);
        _worker = null;
      };
    } catch {
      _worker = null;
    }
  }
  return _worker;
}

/** Runs AI in a Web Worker (separate thread) — UI stays fully responsive */
export function getBestMoveAsync(fen, levelId) {
  const aiLevel = AI_LEVELS.find(l => l.id === levelId) || AI_LEVELS[2];
  const worker = getAiWorker();

  if (worker) {
    // True background thread
    return new Promise(resolve => {
      const id = ++_callbackId;
      _workerCallbacks.set(id, resolve);
      worker.postMessage({
        id, fen,
        depth: aiLevel.depth,
        randomness: aiLevel.randomness,
        blunderChance: aiLevel.blunderChance,
      });
    });
  }

  // Fallback: sync with a single yield (if worker not supported)
  return new Promise(resolve => {
    setTimeout(() => resolve(getBestMove(fen, levelId)), 0);
  });
}

export function getBestMove(fen, level) {
  const chess = new Chess(fen);
  const moves = chess.moves();
  if (moves.length === 0) return null;

  const aiLevel = AI_LEVELS.find(l => l.id === level) || AI_LEVELS[2];

  // Random blunder: just return a random move
  if (Math.random() < aiLevel.blunderChance) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Full random move
  if (Math.random() < aiLevel.randomness) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const isMaximizing = chess.turn() === 'w';
  let bestMove = null;
  let bestVal = isMaximizing ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const val = minimax(chess, aiLevel.depth - 1, -Infinity, Infinity, !isMaximizing);
    chess.undo();
    if (isMaximizing ? val > bestVal : val < bestVal) {
      bestVal = val;
      bestMove = move;
    }
  }

  return bestMove || moves[0];
}

/**
 * Analyze a move and return a kid-friendly explanation
 */
export function analyzeMoveQuality(prevFen, move, currentFen) {
  const before = new Chess(prevFen);
  const after = new Chess(currentFen);

  const scoreBefore = evaluateBoard(before);
  const scoreAfter = evaluateBoard(after);
  const isWhite = before.turn() === 'w';
  const diff = isWhite ? scoreAfter - scoreBefore : scoreBefore - scoreAfter;

  // Categorize the move
  if (diff >= 300) return { quality: 'brilliant', emoji: '💡', label: 'Brilliant!', tip: 'Amazing move! You won material or created a huge threat!' };
  if (diff >= 100) return { quality: 'great', emoji: '⭐', label: 'Great move!', tip: 'You improved your position or grabbed a piece!' };
  if (diff >= -50) return { quality: 'good', emoji: '✅', label: 'Good move', tip: 'Solid play — keep it up!' };
  if (diff >= -200) return { quality: 'inaccuracy', emoji: '⚠️', label: 'Could be better', tip: 'This move gave away some advantage. Look for stronger options next time.' };
  if (diff >= -400) return { quality: 'mistake', emoji: '❌', label: 'Mistake', tip: 'This move lost material or created a big weakness. Think about your pieces before moving!' };
  return { quality: 'blunder', emoji: '💀', label: 'Blunder!', tip: 'Oops! This move lost a lot. Always check if your pieces are safe before moving!' };
}

// ─── LIVE AI COACH ───────────────────────────────────────────────────────────

const PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const CENTER = ['e4','d4','e5','d5'];
const EXTENDED_CENTER = ['c3','d3','e3','f3','c4','f4','c5','f5','c6','d6','e6','f6'];

/**
 * Get the top N moves for the current position (for coach hints)
 */
export function getTopMoves(fen, count = 3) {
  const chess = new Chess(fen);
  const verboseMoves = chess.moves({ verbose: true });
  if (!verboseMoves.length) return [];
  const isMaximizing = chess.turn() === 'w';

  const scored = verboseMoves.map(move => {
    chess.move(move);
    const score = minimax(chess, 2, -Infinity, Infinity, !isMaximizing);
    chess.undo();
    return { move, score };
  });

  scored.sort((a, b) => isMaximizing ? b.score - a.score : a.score - b.score);
  return scored.slice(0, count);
}

/**
 * Convert a verbose move object to a plain-English explanation for kids
 */
export function explainMove(fen, move) {
  const chess = new Chess(fen);
  const piece = chess.get(move.from);
  if (!piece) return 'Make your move.';
  const pName = PIECE_NAMES[piece.type] || 'piece';

  // Castling
  if (move.san === 'O-O') return "Castle kingside! Your king moves to safety behind your rook. This is usually a great idea!";
  if (move.san === 'O-O-O') return "Castle queenside! Your king moves to safety. Smart defensive move!";

  const reasons = [];
  const target = chess.get(move.to);

  // Apply move to inspect result
  chess.move(move);

  if (target) {
    const capName = PIECE_NAMES[target.type] || 'piece';
    const worth = { p:1, n:3, b:3, r:5, q:9 }[target.type] || 0;
    reasons.push(`captures their ${capName} — that's worth ${worth} point${worth !== 1 ? 's' : ''}!`);
  }
  if (chess.inCheck()) {
    reasons.push('puts the king in check — a direct threat!');
  }
  if (CENTER.includes(move.to)) {
    reasons.push('controls the center of the board');
  }
  if (move.promotion) {
    reasons.push(`promotes your pawn to a queen — huge power gain!`);
  }

  // Detect fork: does the piece now attack 2+ valuable enemy pieces?
  const attackedSquares = chess.moves({ verbose: true })
    .filter(m => m.from === move.to && chess.get(m.to) && chess.get(m.to).color !== piece.color);
  if (attackedSquares.length >= 2) {
    const targets = attackedSquares.map(m => PIECE_NAMES[chess.get(m.to)?.type] || 'piece');
    reasons.push(`creates a FORK — attacking the ${targets.join(' and ')} at the same time!`);
  }

  chess.undo();

  // Development (moving from back rank, not pawns)
  const backRanks = ['1','8'];
  if (backRanks.includes(move.from[1]) && piece.type !== 'p' && piece.type !== 'k' && !target) {
    reasons.push('develops a piece — great for the opening!');
  }

  const location = CENTER.includes(move.to) ? 'the center' : move.to;
  let explanation = `Move your ${pName} to ${location}`;
  if (reasons.length) {
    explanation += '. This ' + reasons.join(', and ');
  }
  return explanation + '.';
}

/**
 * Analyze the full position and return strategic insights for the live coach
 */
export function analyzePosition(fen, playerColor) {
  const chess = new Chess(fen);
  const alerts = [];
  const tips = [];

  // Check status
  if (chess.inCheck()) {
    alerts.push({ type: 'urgent', text: "You're in check! Move your king, block the check, or capture the attacker." });
  }

  // Material balance
  const vals = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let myMat = 0, theirMat = 0;
  chess.board().flat().filter(Boolean).forEach(p => {
    const v = vals[p.type] || 0;
    if (p.color === playerColor) myMat += v; else theirMat += v;
  });
  if (myMat > theirMat + 3) tips.push({ type: 'good', text: `You're ahead by ${myMat - theirMat} points of material! Look to trade pieces and simplify.` });
  if (theirMat > myMat + 3) tips.push({ type: 'warning', text: `You're behind by ${theirMat - myMat} points. Look for a tactic to win material back!` });

  // Hanging pieces: find player's pieces that can be captured for free
  const opponentTurn = playerColor === 'w' ? 'b' : 'w';
  const opponentMoves = new Chess(chess.fen());
  // Temporarily switch turn to find opponent threats
  const hanging = [];
  chess.board().flat().filter(p => p && p.color === playerColor && p.type !== 'k').forEach(p => {
    const sq = p.square;
    const attackers = chess.moves({ verbose: true }).filter(m => m.to === sq && chess.get(m.from)?.color === opponentTurn);
    if (attackers.length > 0) {
      hanging.push(PIECE_NAMES[p.type] + ' on ' + sq);
    }
  });
  if (hanging.length) {
    alerts.push({ type: 'warning', text: `Watch out! Your ${hanging[0]} is under attack!` });
  }

  // Opening principle: are pieces developed?
  const moveCount = chess.history().length;
  if (moveCount < 10) {
    const myPieces = chess.board().flat().filter(p => p && p.color === playerColor && ['n','b'].includes(p.type));
    const startFiles = playerColor === 'w' ? ['b1','g1','c1','f1'] : ['b8','g8','c8','f8'];
    const undeveloped = myPieces.filter(p => startFiles.includes(p.square)).length;
    if (undeveloped >= 2) tips.push({ type: 'tip', text: "Opening tip: move your knights and bishops out before the queen! They need space to fight." });
    if (!chess.board()[playerColor === 'w' ? 7 : 0][4]) {
      tips.push({ type: 'tip', text: "Think about castling soon to keep your king safe!" });
    }
  }

  return { alerts, tips };
}

/**
 * Generate a full spoken coach hint from the current position — as Boris
 */
export function buildCoachScript(fen, playerColor) {
  const topMoves = getTopMoves(fen, 3);
  const { alerts, tips } = analyzePosition(fen, playerColor);

  const steps = [];

  // Step 1 — Urgent alert or position scan
  if (alerts.length) {
    steps.push(`⚠️ Step 1: ${alerts[0].text}`);
  } else {
    steps.push('👁️ Step 1: Scan the whole board. Are any of your pieces in danger right now?');
  }

  // Step 2 — Best move recommendation
  if (topMoves.length) {
    const best = topMoves[0].move;
    const explanation = explainMove(fen, best);
    steps.push(`♟️ Step 2: ${explanation}`);
  } else {
    steps.push('♟️ Step 2: Look for any piece you can move to a safer or more active square.');
  }

  // Step 3 — Alternative or second option
  if (topMoves.length >= 2) {
    const second = topMoves[1].move;
    const chess = new Chess(fen);
    const p = chess.get(second.from);
    const pn = PIECE_NAMES[p?.type] || 'piece';
    steps.push(`🔄 Step 3: Alternative — try moving your ${pn} to ${second.to}.`);
  } else if (tips.length) {
    steps.push(`💡 Step 3: ${tips[0].text}`);
  } else {
    steps.push('💡 Step 3: Think about controlling the center — it is the key to power!');
  }

  // Boris sign-off
  const signoffs = [
    'Remember, great chess is about thinking one step ahead. You can do it!',
    'Every good player was once a beginner. Keep it up!',
    'Patience and calculation — that is the Boris way!',
    'Do not rush. A good move now beats a great move too late!',
    'Chess is 99% tactics. Check every capture and threat!',
  ];
  const signoff = signoffs[Math.floor(Math.random() * signoffs.length)];

  return `🎩 Boris says:\n${steps.join('\n')}\n\n${signoff}`;
}

/**
 * Generate kid-friendly post-game coaching tips
 */
export function generateCoachTips(moveHistory, playerColor, result) {
  const tips = [];

  if (result === 'win') {
    tips.push({ emoji: '🏆', text: "Excellent! Boris is proud — you played with real chess instinct today!" });
  } else if (result === 'draw') {
    tips.push({ emoji: '🤝', text: "A draw! Very balanced. Boris says: half a point is better than a loss — well held!" });
  } else {
    tips.push({ emoji: '💪', text: "Ah, a tough game! Boris has lost many games too. Every loss teaches more than ten wins. Let's review:" });
  }

  const blunders = moveHistory.filter(m => m.quality === 'blunder').length;
  const mistakes = moveHistory.filter(m => m.quality === 'mistake').length;
  const brilliant = moveHistory.filter(m => m.quality === 'brilliant').length;
  const great = moveHistory.filter(m => m.quality === 'great').length;

  if (brilliant > 0) {
    tips.push({ emoji: '💡', text: `You played ${brilliant} brilliant move${brilliant > 1 ? 's' : ''}! You're a tactical genius!` });
  }
  if (great > 0) {
    tips.push({ emoji: '⭐', text: `${great} great move${great > 1 ? 's' : ''} — your chess sense is growing!` });
  }
  if (blunders > 0) {
    tips.push({ emoji: '🔍', text: `Watch out for ${blunders} big mistake${blunders > 1 ? 's' : ''}. Always ask: "Can my opponent take this piece for free?"` });
  }
  if (mistakes > 0) {
    tips.push({ emoji: '🧠', text: 'Before each move, look at ALL your pieces and make sure they are safe.' });
  }
  if (blunders === 0 && mistakes === 0) {
    tips.push({ emoji: '🛡️', text: 'You kept all your pieces safe — excellent defense!' });
  }

  // General tips based on game length
  if (moveHistory.length < 15) {
    tips.push({ emoji: '⚡', text: 'Tip: In the opening, move your knights and bishops out early — they need space to fight!' });
  } else {
    tips.push({ emoji: '♟️', text: 'Tip: In the middlegame, always look for checks, captures, and threats before picking your move!' });
  }

  return tips;
}

/**
 * Estimate a player's chess rating from a single game
 * Uses move quality analysis + result vs known AI rating
 */
export function estimateRatingFromGame(moveHistory, playerColor, result, aiLevel) {
  const playerMoves = moveHistory.filter(m => m.color === playerColor);
  if (playerMoves.length === 0) return aiLevel.rating;

  const brilliant = playerMoves.filter(m => m.quality?.quality === 'brilliant').length;
  const great     = playerMoves.filter(m => m.quality?.quality === 'great').length;
  const mistake   = playerMoves.filter(m => m.quality?.quality === 'mistake').length;
  const blunder   = playerMoves.filter(m => m.quality?.quality === 'blunder').length;
  const total     = playerMoves.length;

  // Quality score per move: +2 brilliant, +1 great, -1 mistake, -2 blunder
  const rawQuality = (brilliant * 2 + great * 1 - mistake * 1.2 - blunder * 2.5) / total;
  // Normalize to ±1 range
  const qualityNorm = Math.max(-1, Math.min(1, rawQuality));

  // Base rating anchored to AI rating, adjusted by result
  let base = aiLevel.rating;
  if (result === 'win')       base += 180;
  else if (result === 'loss') base -= 140;
  // draw: base stays at AI rating level

  // Quality fine-tunes by up to ±200
  const qualityAdj = qualityNorm * 150;

  const estimated = Math.round(base + qualityAdj);
  return Math.max(300, Math.min(1900, estimated));
}
