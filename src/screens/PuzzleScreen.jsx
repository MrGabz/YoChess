import { useState, useRef, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard';

// ── Helpers ───────────────────────────────────────────────────────────────────

function moveToUci(move) {
  return move.from + move.to + (move.promotion || '');
}

function uciToChessMove(chess, uci) {
  try {
    return chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
  } catch {
    return null;
  }
}

const STREAK_KEY = 'yochess_puzzle_streak';
const TODAY = new Date().toISOString().split('T')[0];

function loadStreak() {
  try {
    const s = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
    return {
      streak: s.streak || 0,
      lastDate: s.lastDate || '',
      solvedToday: s.lastDate === TODAY && s.solved,
    };
  } catch { return { streak: 0, lastDate: '', solvedToday: false }; }
}

function saveStreak(streak, solved) {
  try {
    const prev = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
    // Check if yesterday was solved to maintain streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = solved
      ? (prev.lastDate === yesterday || prev.lastDate === TODAY ? (prev.streak || 0) + (prev.lastDate !== TODAY ? 1 : 0) : 1)
      : streak;
    localStorage.setItem(STREAK_KEY, JSON.stringify({
      streak: Math.max(newStreak, streak),
      lastDate: TODAY,
      solved,
    }));
  } catch {}
}

// ── Puzzle Parser ─────────────────────────────────────────────────────────────

function buildPuzzlePosition(pgn, initialPly) {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
    const allMoves = chess.history({ verbose: true });
    chess.reset();
    for (let i = 0; i < initialPly && i < allMoves.length; i++) {
      chess.move(allMoves[i]);
    }
    return chess;
  } catch (e) {
    console.error('Puzzle parse error:', e);
    return null;
  }
}

// ── Status colours ────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  ready:    { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: '#a09cc0', text: "Find the best move!" },
  correct:  { bg: 'rgba(74,222,128,0.15)',  border: '#4ade80',                color: '#4ade80', text: "✅ Correct! Keep going..." },
  wrong:    { bg: 'rgba(247,37,133,0.15)',  border: '#f72585',                color: '#f72585', text: "❌ Not quite — try again!" },
  solved:   { bg: 'rgba(247,201,72,0.18)',  border: '#f7c948',                color: '#f7c948', text: "🏆 Puzzle Solved!" },
  opponent: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)',  color: '#a09cc0', text: "Opponent is responding..." },
  loading:  { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)',  color: '#a09cc0', text: "Loading daily puzzle..." },
  error:    { bg: 'rgba(247,37,133,0.12)',  border: '#f72585',                color: '#f72585', text: "Could not load puzzle. Check your connection." },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuzzleScreen({ player, onBack }) {
  const chessRef = useRef(null);

  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [selectedSq, setSelectedSq] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  const [puzzleMeta, setPuzzleMeta] = useState(null);       // { id, rating, themes, players }
  const [solution, setSolution] = useState([]);              // UCI move array
  const [moveIndex, setMoveIndex] = useState(0);             // index into solution[]
  const [puzzleColor, setPuzzleColor] = useState('w');

  const [status, setStatus] = useState('loading');
  const [showSolution, setShowSolution] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);

  const streakData = useRef(loadStreak());
  const [streakDisplay, setStreakDisplay] = useState(streakData.current);

  // ── Fetch daily puzzle ──────────────────────────────────────────────────────

  const fetchPuzzle = useCallback(async () => {
    setStatus('loading');
    setShowSolution(false);
    setSelectedSq(null);
    setLegalMoves([]);
    setLastMove(null);
    setSolution([]);
    setMoveIndex(0);

    try {
      const res = await fetch('https://lichess.org/api/puzzle/daily', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      const { game, puzzle } = data;
      const chess = buildPuzzlePosition(game.pgn, puzzle.initialPly);
      if (!chess) throw new Error('Parse error');

      chessRef.current = chess;
      const color = chess.turn(); // player's color = whoever is to move

      // Find white/black player names from the game
      const wp = game.players?.find(p => p.color === 'white');
      const bp = game.players?.find(p => p.color === 'black');

      setPuzzleColor(color);
      setSolution(puzzle.solution);
      setFen(chess.fen());
      setPuzzleMeta({
        id: puzzle.id,
        rating: puzzle.rating,
        plays: puzzle.plays,
        themes: puzzle.themes || [],
        white: wp?.name || 'White',
        whiteRating: wp?.rating,
        black: bp?.name || 'Black',
        blackRating: bp?.rating,
      });
      setStatus('ready');
    } catch (err) {
      console.error('Puzzle fetch error:', err);
      setStatus('error');
    }
  }, []);

  useEffect(() => { fetchPuzzle(); }, [fetchPuzzle]);

  // ── Board click handler ─────────────────────────────────────────────────────

  function handleSquareClick(sq) {
    if (status !== 'ready' && status !== 'wrong' && status !== 'correct') return;
    if (status === 'opponent') return;

    const chess = chessRef.current;
    if (!chess) return;
    const board = chess.board();

    // Get piece on clicked square
    const file = sq.charCodeAt(0) - 97;
    const rank = 8 - parseInt(sq[1]);
    const piece = board[rank]?.[file];

    // If selecting own piece
    if (piece && piece.color === puzzleColor) {
      const moves = chess.moves({ square: sq, verbose: true });
      setSelectedSq(sq);
      setLegalMoves(moves.map(m => m.to));
      if (status === 'wrong') setStatus('ready');
      return;
    }

    // If clicking a legal destination
    if (selectedSq && legalMoves.includes(sq)) {
      attemptMove(selectedSq, sq);
      return;
    }

    // Click elsewhere — deselect
    setSelectedSq(null);
    setLegalMoves([]);
    if (status === 'wrong') setStatus('ready');
  }

  function attemptMove(from, to) {
    const chess = chessRef.current;
    if (!chess) return;

    // Build UCI for the attempted move (handle promotion → default queen)
    const piece = (() => {
      const b = chess.board();
      const f = from.charCodeAt(0) - 97;
      const r = 8 - parseInt(from[1]);
      return b[r]?.[f];
    })();

    const isPromotion = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
    const attempted = from + to + (isPromotion ? 'q' : '');

    const expected = solution[moveIndex];
    const isCorrect = attempted === expected || (from + to) === expected.slice(0, 4);

    if (isCorrect) {
      // Make the move on the chess instance
      const move = uciToChessMove(chess, expected);
      if (!move) return;

      const newFen = chess.fen();
      setFen(newFen);
      setLastMove({ from: move.from, to: move.to });
      setSelectedSq(null);
      setLegalMoves([]);

      const nextIndex = moveIndex + 1;

      if (nextIndex >= solution.length) {
        // Puzzle complete!
        setStatus('solved');
        setMoveIndex(nextIndex);
        saveStreak(streakData.current.streak, true);
        setStreakDisplay(loadStreak());
        return;
      }

      // Play opponent response
      setStatus('opponent');
      setMoveIndex(nextIndex);

      setTimeout(() => {
        if (chessRef.current) {
          const oppUci = solution[nextIndex];
          const oppMove = uciToChessMove(chessRef.current, oppUci);
          if (oppMove) {
            setFen(chessRef.current.fen());
            setLastMove({ from: oppMove.from, to: oppMove.to });
          }
          const afterOpp = nextIndex + 1;
          setMoveIndex(afterOpp);
          if (afterOpp >= solution.length) {
            setStatus('solved');
            saveStreak(streakData.current.streak, true);
            setStreakDisplay(loadStreak());
          } else {
            setStatus('ready');
          }
        }
      }, 700);

    } else {
      // Wrong move
      setWrongFlash(true);
      setStatus('wrong');
      setSelectedSq(null);
      setLegalMoves([]);
      setTimeout(() => setWrongFlash(false), 600);
    }
  }

  // ── Show solution ───────────────────────────────────────────────────────────

  function revealSolution() {
    setShowSolution(true);
    const chess = chessRef.current;
    if (!chess) return;
    // Replay remaining solution moves with delays
    let delay = 300;
    const remaining = solution.slice(moveIndex);
    remaining.forEach((uci) => {
      setTimeout(() => {
        if (chessRef.current) {
          const m = uciToChessMove(chessRef.current, uci);
          if (m) {
            setFen(chessRef.current.fen());
            setLastMove({ from: m.from, to: m.to });
          }
        }
      }, delay);
      delay += 800;
    });
    setTimeout(() => {
      setStatus('solved');
      setMoveIndex(solution.length);
    }, delay);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const st = STATUS_STYLES[status] || STATUS_STYLES.ready;
  const solvedPct = solution.length > 0
    ? Math.round((Math.min(moveIndex, solution.length) / solution.length) * 100)
    : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 0 24px',
    }}>
      {/* ── Header ── */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid rgba(247,201,72,0.25)',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10,
            color: '#fff',
            fontSize: 18,
            width: 36,
            height: 36,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >←</button>

        <div style={{ flex: 1 }}>
          <div style={{ color: '#f7c948', fontWeight: 900, fontSize: 17 }}>🧩 Daily Puzzle</div>
          <div style={{ color: '#a09cc0', fontSize: 12 }}>
            {puzzleMeta ? `Puzzle #${puzzleMeta.id} · Rating ${puzzleMeta.rating}` : 'Powered by Lichess'}
          </div>
        </div>

        {/* Streak badge */}
        <div style={{
          background: 'rgba(247,201,72,0.15)',
          border: '1px solid rgba(247,201,72,0.4)',
          borderRadius: 12,
          padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#f7c948', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>
              {streakDisplay.streak}
            </div>
            <div style={{ color: '#a09cc0', fontSize: 10, fontWeight: 700 }}>streak</div>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 520, padding: '0 12px', boxSizing: 'border-box' }}>

        {/* ── Theme tags ── */}
        {puzzleMeta?.themes?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 0 8px' }}>
            {puzzleMeta.themes.slice(0, 5).map(theme => (
              <span key={theme} style={{
                background: 'rgba(155,93,229,0.18)',
                border: '1px solid rgba(155,93,229,0.35)',
                borderRadius: 20,
                color: '#c4b5fd',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                textTransform: 'capitalize',
              }}>
                {theme.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            ))}
          </div>
        )}

        {/* ── Status banner ── */}
        <div style={{
          width: '100%',
          background: st.bg,
          border: `1px solid ${st.border}`,
          borderRadius: 12,
          padding: '10px 16px',
          textAlign: 'center',
          marginBottom: 10,
          fontWeight: 800,
          fontSize: 14,
          color: st.color,
          transition: 'all 0.3s',
          animation: wrongFlash ? 'shake 0.4s ease' : undefined,
        }}>
          {st.text}
          {status === 'ready' && puzzleColor && (
            <span style={{ color: '#6b6090', fontSize: 12, display: 'block', marginTop: 2, fontWeight: 600 }}>
              {puzzleColor === 'w' ? 'White' : 'Black'} to move
            </span>
          )}
        </div>

        {/* ── Progress bar ── */}
        {solution.length > 0 && (
          <div style={{
            width: '100%', height: 4, background: 'rgba(255,255,255,0.1)',
            borderRadius: 2, overflow: 'hidden', marginBottom: 10,
          }}>
            <div style={{
              height: '100%',
              width: `${solvedPct}%`,
              background: status === 'solved' ? '#f7c948' : '#9b5de5',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
        )}

        {/* ── Chess Board ── */}
        {status === 'loading' ? (
          <div style={{
            width: '100%',
            aspectRatio: '1',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}>
            <div style={{ fontSize: 48, animation: 'float 1.5s ease-in-out infinite' }}>🧩</div>
            <div style={{ color: '#a09cc0', fontWeight: 700, fontSize: 16 }}>Loading daily puzzle...</div>
            <div style={{ color: '#5a5070', fontSize: 13 }}>Powered by Lichess.org</div>
          </div>
        ) : status === 'error' ? (
          <div style={{
            width: '100%',
            aspectRatio: '1',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
          }}>
            <div style={{ fontSize: 48 }}>📡</div>
            <div style={{ color: '#f72585', fontWeight: 700, fontSize: 16, textAlign: 'center' }}>
              Could not load puzzle
            </div>
            <div style={{ color: '#a09cc0', fontSize: 13, textAlign: 'center' }}>
              Check your internet connection and try again
            </div>
            <button
              onClick={fetchPuzzle}
              style={{
                padding: '12px 28px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #9b5de5, #f72585)',
                color: '#fff', fontSize: 15, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
              }}
            >Try Again</button>
          </div>
        ) : (
          <ChessBoard
            fen={fen}
            selectedSquare={selectedSq}
            legalMoves={legalMoves}
            lastMove={lastMove}
            onSquareClick={status === 'opponent' || status === 'solved' ? () => {} : handleSquareClick}
            playerColor={puzzleColor}
            isAiThinking={status === 'opponent'}
            pieceThemeId="traditional"
          />
        )}

        {/* ── Players info ── */}
        {puzzleMeta && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 12, color: '#a09cc0' }}>
              ⬜ {puzzleMeta.white} {puzzleMeta.whiteRating ? `(${puzzleMeta.whiteRating})` : ''}
            </div>
            <div style={{ fontSize: 11, color: '#5a5070', fontWeight: 700 }}>vs</div>
            <div style={{ fontSize: 12, color: '#a09cc0' }}>
              ⬛ {puzzleMeta.black} {puzzleMeta.blackRating ? `(${puzzleMeta.blackRating})` : ''}
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {status !== 'solved' && status !== 'loading' && status !== 'error' && (
            <button
              onClick={revealSolution}
              disabled={showSolution}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 14,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: showSolution ? '#5a5070' : '#a09cc0',
                fontSize: 14, fontWeight: 800,
                cursor: showSolution ? 'default' : 'pointer',
                fontFamily: 'Nunito, sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!showSolution) { e.currentTarget.style.borderColor = '#f7c948'; e.currentTarget.style.color = '#f7c948'; } }}
              onMouseLeave={e => { if (!showSolution) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#a09cc0'; } }}
            >
              💡 Show Solution
            </button>
          )}

          {status === 'solved' && (
            <button
              onClick={fetchPuzzle}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #f7c948, #f97316)',
                color: '#1a1025', fontSize: 15, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
              }}
            >
              🔄 New Puzzle
            </button>
          )}

          <button
            onClick={fetchPuzzle}
            style={{
              flex: status === 'solved' ? 0 : 1,
              padding: status === 'solved' ? '14px 18px' : '12px 0',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#a09cc0', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#9b5de5'; e.currentTarget.style.color = '#9b5de5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#a09cc0'; }}
            title="Skip to another puzzle"
          >
            ↻ Skip
          </button>
        </div>

        {/* ── Solved congratulations ── */}
        {status === 'solved' && (
          <div style={{
            marginTop: 14,
            background: 'rgba(247,201,72,0.12)',
            border: '1px solid rgba(247,201,72,0.4)',
            borderRadius: 16,
            padding: '16px 20px',
            textAlign: 'center',
            animation: 'bounce-in 0.4s ease',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#f7c948', marginBottom: 4 }}>
              {showSolution ? 'Solution shown' : 'Puzzle Solved!'}
            </div>
            <div style={{ color: '#a09cc0', fontSize: 13, marginBottom: 12 }}>
              {showSolution
                ? "No worries — keep practicing and you'll get it next time! 🎩"
                : `Great job! Today's streak: 🔥 ${streakDisplay.streak} day${streakDisplay.streak !== 1 ? 's' : ''}`}
            </div>
            {/* Theme tags as learning takeaway */}
            {puzzleMeta?.themes?.length > 0 && (
              <div style={{ fontSize: 12, color: '#7c55c0' }}>
                🧠 You practiced: <strong style={{ color: '#c4b5fd' }}>
                  {puzzleMeta.themes.slice(0, 3).map(t => t.replace(/([A-Z])/g, ' $1').trim()).join(', ')}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* ── Boris tip for puzzle ── */}
        {(status === 'ready' || status === 'wrong') && puzzleMeta?.themes?.length > 0 && (
          <div style={{
            marginTop: 14,
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(155,93,229,0.1)',
            border: '1px solid rgba(155,93,229,0.3)',
            borderRadius: 12,
            padding: '10px 14px',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #9b5de5, #f72585)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>🎩</div>
            <div style={{ color: '#c4b5fd', fontSize: 12, lineHeight: 1.5 }}>
              <strong>Boris says:</strong> Look for a{' '}
              <em>{THEME_HINTS[puzzleMeta.themes[0]] || puzzleMeta.themes[0]}</em>.
              The key is to find the move that creates the most trouble for your opponent!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Theme hints from Boris ────────────────────────────────────────────────────

const THEME_HINTS = {
  fork:            'knight or queen fork — one piece attacking TWO things at once!',
  pin:             'pin! A piece is stuck because moving it would expose something valuable behind it',
  skewer:          'skewer — like a pin, but the more valuable piece is in FRONT',
  discoveredAttack:'discovered attack — move one piece to unleash a hidden attacker',
  backRankMate:    'back rank weakness — the king is trapped behind its own pawns',
  mateIn1:         'checkmate in ONE move. Look for forcing checks!',
  mateIn2:         'checkmate in TWO moves. Look for a forcing sequence!',
  sacrifice:       'brilliant sacrifice — give up material to gain a winning position',
  doubleCheck:     'double check — both pieces give check at the same time!',
  deflection:      'deflection — force a defending piece away from its duty',
  hanging:         'hanging piece — an undefended piece you can capture for free!',
  trappedPiece:    'trapped piece — your opponent has a piece with no escape!',
  zugzwang:        'zugzwang — any move your opponent makes will make things worse for them',
  endgame:         'endgame technique — precise play with few pieces',
  middlegame:      'tactical combination — calculate carefully and look for forcing moves',
  opening:         'opening trap — a sneaky move that punishes a mistake',
  crushing:        'crushing combination that wins material or checkmates!',
};
