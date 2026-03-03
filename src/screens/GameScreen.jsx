import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../components/ChessBoard';
import {
  getBestMoveAsync, analyzeMoveQuality, generateCoachTips,
  AI_LEVELS, buildCoachScript, getTopMoves, explainMove, estimateRatingFromGame,
} from '../engine/aiEngine';
import { updateRating, getRatingLabel, newPlayer } from '../engine/glicko2';
import {
  Sounds, CoachVoice, setSpeechEnabled,
  setSoundTheme, loadSoundTheme, SOUND_THEMES,
} from '../engine/sounds';
import { PIECE_THEMES, THEME_ORDER, loadPieceTheme, savePieceTheme } from '../engine/pieceThemes';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'yochess_player';

const PIECE_POINTS = { P: 1, N: 3, B: 3, R: 5, Q: 9 };
const PIECE_UNICODE = {
  wP: '♙', wN: '♘', wB: '♗', wR: '♖', wQ: '♕',
  bP: '♟', bN: '♞', bB: '♝', bR: '♜', bQ: '♛',
};

const TIME_CONTROLS = [
  { id: '3min',      label: '3 min',  seconds: 180 },
  { id: '5min',      label: '5 min',  seconds: 300 },
  { id: '10min',     label: '10 min', seconds: 600 },
  { id: 'unlimited', label: '∞',      seconds: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadPlayer() {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch {}
  return newPlayer('Champion');
}
function savePlayer(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}
function loadTimeControl() {
  try { return localStorage.getItem('yochess_time_control') || '10min'; } catch { return '10min'; }
}
function saveTimeControl(id) {
  try { localStorage.setItem('yochess_time_control', id); } catch {}
}
function fmtTime(secs) {
  if (secs === null) return '∞';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function sumPoints(pieces) {
  return pieces.reduce((acc, t) => acc + (PIECE_POINTS[t] || 0), 0);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GameScreen({ aiLevelId, playerColor: initColor = 'w', calibrationMode = false, onBack, onHome }) {
  const chessRef = useRef(new Chess());
  const chess = chessRef.current;

  const [player, setPlayer] = useState(loadPlayer);
  const [fen, setFen] = useState(() => chess.fen());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [moveHistory, setMoveHistoryState] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [coachTips, setCoachTips] = useState(null);
  const [ratingDelta, setRatingDelta] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showCoach, setShowCoach] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastMoveQuality, setLastMoveQuality] = useState(null);
  const [playerColor] = useState(initColor);
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to }
  const [calibrationResult, setCalibrationResult] = useState(null); // estimated rating

  // Themes
  const [pieceThemeId, setPieceThemeIdState] = useState(loadPieceTheme);
  const [soundThemeId, setSoundThemeIdState] = useState(loadSoundTheme);

  // Live coach
  const [coachSquare, setCoachSquare] = useState(null);
  const [coachHintData, setCoachHintData] = useState(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  // Captured pieces: track by TYPE (uppercase) taken FROM each color
  // capturedFromWhite = white pieces that have been captured (taken from white)
  // capturedFromBlack = black pieces that have been captured (taken from black)
  const [capturedFromWhite, setCapturedFromWhite] = useState([]);
  const [capturedFromBlack, setCapturedFromBlack] = useState([]);

  // Timer
  const [timeControlId] = useState(loadTimeControl);
  const tcConfig = TIME_CONTROLS.find(t => t.id === timeControlId) || TIME_CONTROLS[2];
  const [timeWhite, setTimeWhite] = useState(tcConfig.seconds);
  const [timeBlack, setTimeBlack] = useState(tcConfig.seconds);

  // Refs for stable closure access
  const moveHistoryRef = useRef([]);
  const playerRef = useRef(player);
  playerRef.current = player;
  const gameOverRef = useRef(null);
  const soundOnRef = useRef(true);
  soundOnRef.current = soundOn;
  const voiceOnRef = useRef(true);
  voiceOnRef.current = voiceOn;
  const aiTimerRef = useRef(null);
  const clockRef = useRef(null);

  const aiLevel = AI_LEVELS.find(l => l.id === aiLevelId) || AI_LEVELS[2];

  // ── Theme setters ───────────────────────────────────────────────────────────

  function setPieceThemeId(id) {
    setPieceThemeIdState(id);
    savePieceTheme(id);
  }
  function setSoundThemeId(id) {
    setSoundThemeIdState(id);
    setSoundTheme(id);
  }

  // ── Clock ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (tcConfig.seconds === null) return;
    clockRef.current = setInterval(() => {
      if (gameOverRef.current) { clearInterval(clockRef.current); return; }
      const turn = chessRef.current.turn();
      if (turn === 'w') {
        setTimeWhite(prev => Math.max(0, (prev ?? 0) - 1));
      } else {
        setTimeBlack(prev => Math.max(0, (prev ?? 0) - 1));
      }
    }, 1000);
    return () => clearInterval(clockRef.current);
  }, []); // eslint-disable-line

  // Low-time warning at 30s
  useEffect(() => {
    if (tcConfig.seconds === null) return;
    const playerTime = playerColor === 'w' ? timeWhite : timeBlack;
    if (playerTime === 30) {
      if (soundOnRef.current) Sounds.lowTime();
      if (voiceOnRef.current) CoachVoice.lowTime();
    }
  }, [timeWhite, timeBlack]); // eslint-disable-line

  // Timeout detection — white
  useEffect(() => {
    if (timeWhite === 0 && tcConfig.seconds !== null && !gameOverRef.current) {
      clearInterval(clockRef.current);
      endGame(playerColor === 'w' ? 'loss' : 'win', 'timeout', moveHistoryRef.current);
    }
  }, [timeWhite]); // eslint-disable-line

  // Timeout detection — black
  useEffect(() => {
    if (timeBlack === 0 && tcConfig.seconds !== null && !gameOverRef.current) {
      clearInterval(clockRef.current);
      endGame(playerColor === 'b' ? 'loss' : 'win', 'timeout', moveHistoryRef.current);
    }
  }, [timeBlack]); // eslint-disable-line

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (voiceOn) CoachVoice.gameStart(aiLevel.name);
    if (playerColor === 'b') doAiMove();
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      clearInterval(clockRef.current);
    };
  }, []); // eslint-disable-line

  useEffect(() => { setSpeechEnabled(voiceOn); }, [voiceOn]);

  // ── Game logic ─────────────────────────────────────────────────────────────

  function endGame(result, reason, finalMoveHistory) {
    if (gameOverRef.current) return;
    gameOverRef.current = { result, reason };
    clearInterval(clockRef.current);
    setGameOver({ result, reason });

    const tips = generateCoachTips(finalMoveHistory, playerColor, result);
    setCoachTips(tips);

    const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    const oldRating = playerRef.current.rating;
    const updatedPlayer = updateRating(playerRef.current, [{
      opponentRating: aiLevel.rating, opponentRd: 100, score,
    }]);
    savePlayer(updatedPlayer);
    setPlayer(updatedPlayer);
    setRatingDelta(updatedPlayer.rating - oldRating);

    // Calibration mode: compute estimated rating
    if (calibrationMode) {
      const estimated = estimateRatingFromGame(finalMoveHistory, playerColor, result, aiLevel);
      setCalibrationResult(estimated);
    }

    if (soundOnRef.current) {
      if (result === 'win') Sounds.win();
      else if (result === 'loss') Sounds.loss();
      else Sounds.draw();
    }
    if (voiceOnRef.current) {
      setTimeout(() => {
        if (reason === 'timeout') {
          CoachVoice.timeout();
        } else if (result === 'win') {
          CoachVoice.win();
        } else if (result === 'loss') {
          CoachVoice.loss();
        } else {
          CoachVoice.coachHint("It's a draw! A very balanced game!");
        }
        setTimeout(() => {
          const delta = updatedPlayer.rating - oldRating;
          if (delta > 0) CoachVoice.ratingUp(updatedPlayer.rating);
          else if (delta < 0) CoachVoice.ratingDown(updatedPlayer.rating);
        }, 3000);
      }, 1000);
    }
  }

  function doAiMove() {
    if (gameOverRef.current) return;
    setIsAiThinking(true);
    const thinkTime = 350 + Math.random() * 600;
    aiTimerRef.current = setTimeout(async () => {
      if (gameOverRef.current) { setIsAiThinking(false); return; }
      const currentFen = chessRef.current.fen();
      // Use async version so UI stays responsive during computation
      const aiMove = await getBestMoveAsync(currentFen, aiLevelId);
      if (aiMove) {
        try {
          const result = chessRef.current.move(aiMove);
          if (result) {
            const newFen = chessRef.current.fen();
            setFen(newFen);
            setLastMove({ from: result.from, to: result.to });

            // Track AI captures
            if (result.captured) {
              // result.color === 'b' means black/AI captured a white piece
              if (result.color === 'b') {
                setCapturedFromWhite(prev => [...prev, result.captured.toUpperCase()]);
              } else {
                setCapturedFromBlack(prev => [...prev, result.captured.toUpperCase()]);
              }
            }

            if (soundOnRef.current) {
              if (result.captured) Sounds.capture();
              else if (result.san === 'O-O' || result.san === 'O-O-O') Sounds.castle();
              else Sounds.move();
              if (chessRef.current.inCheck()) Sounds.check();
            }
            if (voiceOnRef.current && chessRef.current.inCheck()) CoachVoice.check();

            const newHistory = [...moveHistoryRef.current, {
              san: result.san,
              color: playerColor === 'w' ? 'b' : 'w',
              quality: { quality: 'ai', emoji: '🤖', label: 'AI' },
            }];
            moveHistoryRef.current = newHistory;
            setMoveHistoryState([...newHistory]);

            if (chessRef.current.isGameOver()) {
              const res = chessRef.current.isCheckmate()
                ? (chessRef.current.turn() === playerColor ? 'loss' : 'win')
                : 'draw';
              endGame(res, chessRef.current.isCheckmate() ? 'checkmate' : 'draw', newHistory);
            }
          }
        } catch {}
      }
      setIsAiThinking(false);
    }, thinkTime);
  }

  function handleSquareClick(square) {
    if (gameOverRef.current || isAiThinking) return;
    if (chess.turn() !== playerColor) return;

    const piece = chess.get(square);

    if (selectedSquare) {
      if (legalMoves.includes(square)) {
        const prevFen = chess.fen();
        const movingPiece = chess.get(selectedSquare);
        const isPromotion = movingPiece?.type === 'p' &&
          ((playerColor === 'w' && square[1] === '8') || (playerColor === 'b' && square[1] === '1'));

        // Show promotion picker instead of auto-queening
        if (isPromotion) {
          setSelectedSquare(null);
          setLegalMoves([]);
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }

        let moveResult;
        try {
          moveResult = chess.move({ from: selectedSquare, to: square, promotion: undefined });
        } catch { moveResult = null; }

        if (moveResult) {
          // Clear coach hint
          setCoachSquare(null);
          setCoachHintData(null);

          const newFen = chess.fen();
          const quality = analyzeMoveQuality(prevFen, moveResult.san, newFen);
          setLastMoveQuality(quality);

          // Track player captures
          if (moveResult.captured) {
            if (moveResult.color === 'w') {
              setCapturedFromBlack(prev => [...prev, moveResult.captured.toUpperCase()]);
            } else {
              setCapturedFromWhite(prev => [...prev, moveResult.captured.toUpperCase()]);
            }
          }

          if (soundOn) {
            if (moveResult.captured) Sounds.capture();
            else if (moveResult.san === 'O-O' || moveResult.san === 'O-O-O') Sounds.castle();
            else if (isPromotion) Sounds.promotion();
            else Sounds.move();
            if (chess.inCheck()) Sounds.check();
            if (quality.quality === 'brilliant') Sounds.brilliant();
            else if (quality.quality === 'mistake') Sounds.mistake();
            else if (quality.quality === 'blunder') Sounds.blunder();
          }
          if (voiceOn) {
            if (chess.inCheck()) CoachVoice.check();
            else if (isPromotion) CoachVoice.promotion();
            else if (moveResult.san === 'O-O' || moveResult.san === 'O-O-O') CoachVoice.castle();
            else if (quality.quality === 'brilliant') setTimeout(() => CoachVoice.greatMove(), 200);
            else if (quality.quality === 'great') setTimeout(() => CoachVoice.goodMove(), 200);
            else if (quality.quality === 'mistake') setTimeout(() => CoachVoice.mistake(), 200);
            else if (quality.quality === 'blunder') setTimeout(() => CoachVoice.blunder(), 200);
          }

          const newHistory = [...moveHistoryRef.current, { san: moveResult.san, quality, color: playerColor }];
          moveHistoryRef.current = newHistory;
          setMoveHistoryState([...newHistory]);
          setFen(newFen);
          setLastMove({ from: moveResult.from, to: moveResult.to });
          setSelectedSquare(null);
          setLegalMoves([]);

          if (chess.isGameOver()) {
            const res = chess.isCheckmate()
              ? (chess.turn() === playerColor ? 'loss' : 'win')
              : 'draw';
            endGame(res, chess.isCheckmate() ? 'checkmate' : 'draw', newHistory);
            return;
          }
          doAiMove();
          return;
        }
      }

      if (piece?.color === playerColor) {
        if (soundOn) Sounds.select();
        setSelectedSquare(square);
        setLegalMoves(chess.moves({ square, verbose: true }).map(m => m.to));
        return;
      }
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (piece?.color === playerColor) {
      if (soundOn) Sounds.select();
      setSelectedSquare(square);
      setLegalMoves(chess.moves({ square, verbose: true }).map(m => m.to));
    }
  }

  function executePromotion(promotionPiece) {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    setPendingPromotion(null);

    const prevFen = chess.fen();
    let moveResult;
    try {
      moveResult = chess.move({ from, to, promotion: promotionPiece });
    } catch { moveResult = null; }

    if (!moveResult) return;

    setCoachSquare(null);
    setCoachHintData(null);

    const newFen = chess.fen();
    const quality = analyzeMoveQuality(prevFen, moveResult.san, newFen);
    setLastMoveQuality(quality);

    if (moveResult.captured) {
      if (moveResult.color === 'w') {
        setCapturedFromBlack(prev => [...prev, moveResult.captured.toUpperCase()]);
      } else {
        setCapturedFromWhite(prev => [...prev, moveResult.captured.toUpperCase()]);
      }
    }

    if (soundOn) { Sounds.promotion(); if (chess.inCheck()) Sounds.check(); }
    if (voiceOn) { CoachVoice.promotion(); }

    const newHistory = [...moveHistoryRef.current, { san: moveResult.san, quality, color: playerColor }];
    moveHistoryRef.current = newHistory;
    setMoveHistoryState([...newHistory]);
    setFen(newFen);
    setLastMove({ from: moveResult.from, to: moveResult.to });
    setSelectedSquare(null);
    setLegalMoves([]);

    if (chess.isGameOver()) {
      const res = chess.isCheckmate()
        ? (chess.turn() === playerColor ? 'loss' : 'win')
        : 'draw';
      endGame(res, chess.isCheckmate() ? 'checkmate' : 'draw', newHistory);
      return;
    }
    doAiMove();
  }

  function handleCoachHint() {
    if (gameOver || chess.turn() !== playerColor || isCoachLoading) return;
    setIsCoachLoading(true);
    try {
      const currentFen = chess.fen();
      const topMoves = getTopMoves(currentFen, 3);
      const script = buildCoachScript(currentFen, playerColor);

      // Add per-move explanations
      const movesWithInfo = topMoves.map(m => ({
        ...m,
        explanation: m.move ? explainMove(currentFen, m.move) : 'Consider this move.',
      }));

      // Highlight best move destination
      if (topMoves.length > 0 && topMoves[0].move?.to) {
        setCoachSquare(topMoves[0].move.to);
        setTimeout(() => setCoachSquare(null), 6000);
      }

      setCoachHintData({ topMoves: movesWithInfo, script });
      setShowCoach(true);
      if (voiceOn) CoachVoice.coachHint(script);
    } catch (e) {
      console.error('Coach hint error', e);
    }
    setIsCoachLoading(false);
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const ratingInfo = getRatingLabel(player.rating);
  const inCheck = chess.inCheck();
  const turn = chess.turn();

  // Pieces captured BY player (from AI) vs BY AI (from player)
  const playerCaptured = playerColor === 'w' ? capturedFromBlack : capturedFromWhite;
  const aiCaptured     = playerColor === 'w' ? capturedFromWhite : capturedFromBlack;
  const playerPts      = sumPoints(playerCaptured);
  const aiPts          = sumPoints(aiCaptured);
  const pointAdv       = playerPts - aiPts;

  const aiColor = playerColor === 'w' ? 'b' : 'w';

  const playerTimeSecs = playerColor === 'w' ? timeWhite : timeBlack;
  const aiTimeSecs     = playerColor === 'w' ? timeBlack : timeWhite;
  const playerTimeLow  = tcConfig.seconds !== null && (playerTimeSecs ?? 999) <= 30;
  const aiTimeLow      = tcConfig.seconds !== null && (aiTimeSecs ?? 999) <= 30;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 8px 20px',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        width: '100%', maxWidth: 520,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <button onClick={onBack} style={btnStyle}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>{aiLevel.emoji}</span>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{aiLevel.name}</span>
          <span style={{ color: '#a09cc0', fontSize: 12 }}>({aiLevel.rating})</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <IconButton icon={soundOn ? '🔊' : '🔇'} onClick={() => { setSoundOn(p => !p); }} active={soundOn} />
          <IconButton icon={voiceOn ? '🗣️' : '🤐'} onClick={() => setVoiceOn(p => !p)} active={voiceOn} />
          <IconButton icon="⚙️" onClick={() => setShowSettings(true)} active={false} />
        </div>
      </div>

      {/* ── AI info bar + timer ── */}
      <div style={{
        width: '100%', maxWidth: 520,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255,255,255,0.06)', borderRadius: 12,
        padding: '6px 12px', marginBottom: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{aiLevel.emoji}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: aiLevel.color }}>{aiLevel.name}</div>
            <div style={{ fontSize: 11, color: '#a09cc0' }}>Rating {aiLevel.rating}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {turn !== playerColor && !gameOver && (
            <div style={{
              background: aiLevel.color + '22', border: `1px solid ${aiLevel.color}`,
              borderRadius: 20, padding: '3px 10px',
              fontSize: 11, fontWeight: 700, color: aiLevel.color,
              animation: 'pulse-glow 1.5s infinite',
            }}>
              {isAiThinking ? '🤔 Thinking...' : '🎯 Their turn'}
            </div>
          )}
          {tcConfig.seconds !== null && (
            <TimerDisplay secs={aiTimeSecs} active={turn !== playerColor && !gameOver} isLow={aiTimeLow} />
          )}
        </div>
      </div>

      {/* ── AI's captured pieces (player took these FROM AI) ── */}
      <CapturedBar
        pieces={playerCaptured}
        pieceColor={aiColor}
        advantage={pointAdv > 0 ? pointAdv : 0}
      />

      {/* ── Board ── */}
      <ChessBoard
        fen={fen}
        selectedSquare={selectedSquare}
        legalMoves={legalMoves}
        lastMove={lastMove}
        onSquareClick={handleSquareClick}
        playerColor={playerColor}
        isAiThinking={isAiThinking}
        check={inCheck}
        pieceThemeId={pieceThemeId}
        coachSquare={coachSquare}
      />

      {/* ── Move quality flash ── */}
      {lastMoveQuality && lastMoveQuality.quality !== 'ai' && (
        <div style={{
          marginTop: 4,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '4px 14px',
          fontSize: 12, fontWeight: 700,
          animation: 'bounce-in 0.3s ease',
          display: 'flex', alignItems: 'center', gap: 6,
          maxWidth: 520, width: '100%',
        }}>
          <span>{lastMoveQuality.emoji}</span>
          <span style={{ color: '#fff' }}>{lastMoveQuality.label}</span>
          <span style={{ color: '#a09cc0', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lastMoveQuality.tip}
          </span>
        </div>
      )}

      {/* ── Player's captured pieces (AI took these FROM player) ── */}
      <CapturedBar
        pieces={aiCaptured}
        pieceColor={playerColor}
        advantage={pointAdv < 0 ? -pointAdv : 0}
        dimmed
      />

      {/* ── Player bar + coach hint button + timer ── */}
      <div style={{
        width: '100%', maxWidth: 520,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255,255,255,0.06)', borderRadius: 12,
        padding: '6px 12px', marginTop: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{ratingInfo.emoji}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{player.name}</div>
            <div style={{ fontSize: 11, color: '#a09cc0' }}>Rating {player.rating}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {turn === playerColor && !gameOver && (
            <div style={{
              background: inCheck ? 'rgba(224,85,85,0.2)' : 'rgba(74,222,128,0.12)',
              border: `1px solid ${inCheck ? '#e05555' : '#4ade80'}`,
              borderRadius: 20, padding: '3px 10px',
              fontSize: 11, fontWeight: 700,
              color: inCheck ? '#ff8080' : '#4ade80',
              animation: inCheck ? 'pulse-glow 0.8s infinite' : undefined,
            }}>
              {inCheck ? '⚠️ CHECK!' : '⚡ Your turn'}
            </div>
          )}
          {tcConfig.seconds !== null && (
            <TimerDisplay secs={playerTimeSecs} active={turn === playerColor && !gameOver} isLow={playerTimeLow} />
          )}
          <button
            onClick={handleCoachHint}
            disabled={turn !== playerColor || !!gameOver || isCoachLoading}
            style={{
              background: 'rgba(155,93,229,0.2)',
              border: '1px solid rgba(155,93,229,0.5)',
              borderRadius: 20, padding: '5px 12px',
              color: (turn === playerColor && !gameOver) ? '#c4b5fd' : '#6b50a0',
              fontSize: 12, fontWeight: 700,
              cursor: (turn === playerColor && !gameOver) ? 'pointer' : 'default',
              fontFamily: 'Nunito, sans-serif',
              opacity: (turn === playerColor && !gameOver) ? 1 : 0.4,
              transition: 'all 0.15s',
            }}
          >
            {isCoachLoading ? '🔄' : '🎩 Boris'}
          </button>
        </div>
      </div>

      {/* ── Persistent Boris suggestion strip ── */}
      {!gameOver && (
        <div
          onClick={turn === playerColor && !isCoachLoading ? handleCoachHint : undefined}
          style={{
            width: '100%', maxWidth: 520, marginTop: 6,
            display: 'flex', alignItems: 'center', gap: 10,
            background: coachHintData
              ? 'rgba(155,93,229,0.14)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${coachHintData ? 'rgba(155,93,229,0.45)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12, padding: '8px 14px',
            cursor: turn === playerColor && !gameOver ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            if (turn === playerColor && !gameOver) e.currentTarget.style.background = 'rgba(155,93,229,0.22)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = coachHintData ? 'rgba(155,93,229,0.14)' : 'rgba(255,255,255,0.04)';
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #4cc9f0, #9b5de5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, boxShadow: '0 0 8px rgba(155,93,229,0.5)',
          }}>🎩</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isCoachLoading ? (
              <span style={{ fontSize: 12, color: '#a09cc0' }}>🔄 Boris is thinking...</span>
            ) : coachHintData?.topMoves?.[0] ? (
              <>
                <span style={{ fontSize: 11, color: '#a09cc0', fontWeight: 700 }}>Best move: </span>
                <span style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 800 }}>
                  {coachHintData.topMoves[0].move?.san || '—'}
                </span>
                <span style={{ fontSize: 11, color: '#a09cc0' }}>
                  {' '}— {(coachHintData.topMoves[0].explanation || '').slice(0, 48)}{coachHintData.topMoves[0].explanation?.length > 48 ? '…' : ''}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: turn === playerColor ? '#a09cc0' : '#5a5070', fontStyle: 'italic' }}>
                {turn === playerColor ? '🎩 Tap for Boris\'s advice on your turn' : 'Boris is watching the game...'}
              </span>
            )}
          </div>
          {turn === playerColor && !isCoachLoading && (
            <span style={{ fontSize: 11, color: '#7c55c0', fontWeight: 700, flexShrink: 0 }}>
              {coachHintData ? 'More ›' : 'Ask ›'}
            </span>
          )}
        </div>
      )}

      {/* ── Move history ── */}
      <MoveList moves={moveHistory} playerColor={playerColor} />

      {/* ── Promotion Picker ── */}
      {pendingPromotion && (
        <PromotionPicker
          playerColor={playerColor}
          onPick={executePromotion}
          onCancel={() => setPendingPromotion(null)}
        />
      )}

      {/* ── Overlays ── */}
      {showCoach && (
        <CoachPanel
          onClose={() => setShowCoach(false)}
          coachHintData={coachHintData}
        />
      )}
      {showSettings && (
        <SettingsSheet
          pieceThemeId={pieceThemeId}
          onPieceTheme={setPieceThemeId}
          soundThemeId={soundThemeId}
          onSoundTheme={setSoundThemeId}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Calibration Result Modal ── */}
      {calibrationMode && calibrationResult && (
        <CalibrationModal
          estimatedRating={calibrationResult}
          result={gameOver?.result}
          player={player}
          onApply={() => {
            const updated = { ...player, rating: calibrationResult, peakRating: Math.max(player.peakRating ?? player.rating, calibrationResult) };
            savePlayer(updated);
            setPlayer(updated);
            setCalibrationResult(null);
            onHome();
          }}
          onDismiss={() => { setCalibrationResult(null); onHome(); }}
        />
      )}

      {/* ── Game Over Modal ── */}
      {gameOver && !calibrationMode && (
        <GameOverModal
          result={gameOver.result}
          reason={gameOver.reason}
          aiLevel={aiLevel}
          player={player}
          ratingDelta={ratingDelta}
          coachTips={coachTips}
          onRematch={onBack}
          onHome={onHome}
        />
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TimerDisplay({ secs, active, isLow }) {
  if (secs === null || secs === undefined) return null;
  return (
    <div style={{
      fontFamily: 'monospace', fontSize: 15, fontWeight: 900,
      color: isLow ? '#f72585' : active ? '#4ade80' : '#a09cc0',
      background: isLow ? 'rgba(247,37,133,0.15)' : active ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${isLow ? '#f72585' : active ? '#4ade8066' : 'rgba(255,255,255,0.12)'}`,
      borderRadius: 8, padding: '3px 10px',
      minWidth: 58, textAlign: 'center',
      animation: isLow && active ? 'pulse-glow 0.8s infinite' : undefined,
      transition: 'color 0.3s, background 0.3s',
    }}>
      {fmtTime(secs)}
    </div>
  );
}

function CapturedBar({ pieces, pieceColor, advantage, dimmed }) {
  if (pieces.length === 0 && advantage === 0) return <div style={{ height: 6 }} />;
  const sorted = [...pieces].sort((a, b) => (PIECE_POINTS[b] || 0) - (PIECE_POINTS[a] || 0));
  return (
    <div style={{
      width: '100%', maxWidth: 520,
      display: 'flex', alignItems: 'center',
      padding: '3px 12px', minHeight: 24,
      opacity: dimmed ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1, alignItems: 'center' }}>
        {sorted.map((type, i) => {
          const key = pieceColor + type;
          return (
            <span key={i} style={{
              fontSize: 15,
              color: pieceColor === 'w' ? '#fffef0' : '#1a1025',
              WebkitTextStroke: pieceColor === 'w' ? '0.5px rgba(0,0,0,0.5)' : '0.5px rgba(255,255,255,0.2)',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
              lineHeight: 1,
            }}>
              {PIECE_UNICODE[key] || '?'}
            </span>
          );
        })}
      </div>
      {advantage > 0 && (
        <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 900, marginLeft: 8, flexShrink: 0 }}>
          +{advantage}
        </span>
      )}
    </div>
  );
}

function MoveList({ moves, playerColor }) {
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push([moves[i], moves[i + 1]]);
  if (pairs.length === 0) return null;

  const qualColor = (q) => {
    if (q === 'brilliant') return '#f7c948';
    if (q === 'blunder') return '#f72585';
    if (q === 'mistake') return '#fb923c';
    return undefined;
  };

  return (
    <div style={{
      width: '100%', maxWidth: 520, marginTop: 8,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '6px 12px',
      maxHeight: 90, overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 14px' }}>
        {pairs.map((pair, i) => (
          <span key={i} style={{ fontSize: 12, color: '#a09cc0', fontWeight: 600 }}>
            <span style={{ color: '#555', marginRight: 3 }}>{i + 1}.</span>
            <span style={{ color: qualColor(pair[0]?.quality?.quality) || '#e0daf0' }}>
              {pair[0]?.san}
              {pair[0]?.quality?.emoji && pair[0].quality.quality !== 'good' && pair[0].quality.quality !== 'ai' && (
                <sup style={{ fontSize: 9 }}>{pair[0].quality.emoji}</sup>
              )}
            </span>
            {pair[1] && (
              <span style={{ marginLeft: 5, color: qualColor(pair[1]?.quality?.quality) || '#a09cc0' }}>
                {' '}{pair[1]?.san}
                {pair[1]?.quality?.emoji && pair[1].quality.quality !== 'good' && pair[1].quality.quality !== 'ai' && (
                  <sup style={{ fontSize: 9 }}>{pair[1].quality.emoji}</sup>
                )}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Calibration Result Modal ──────────────────────────────────────────────────

function CalibrationModal({ estimatedRating, result, player, onApply, onDismiss }) {
  const { label, emoji, color } = getRatingLabel(estimatedRating);
  const resultEmoji = result === 'win' ? '🏆' : result === 'loss' ? '💪' : '🤝';
  const resultText  = result === 'win' ? 'You Won!' : result === 'loss' ? 'Good Effort!' : 'Draw!';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1050, #0f0c29)',
        border: '2px solid rgba(76,201,240,0.5)',
        borderRadius: 28, padding: '32px 24px',
        textAlign: 'center', width: '100%', maxWidth: 380,
        animation: 'slide-up 0.3s ease',
        boxShadow: '0 12px 60px rgba(76,201,240,0.25)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎯</div>
        <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 4 }}>Rating Found!</div>
        <div style={{ color: '#a09cc0', fontSize: 14, marginBottom: 24 }}>
          {resultEmoji} {resultText} — Based on your game, Boris estimates:
        </div>

        {/* Big rating display */}
        <div style={{
          background: `${color}18`,
          border: `2px solid ${color}`,
          borderRadius: 20, padding: '20px 24px',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 60, fontWeight: 900, color, lineHeight: 1 }}>
            {estimatedRating}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color, marginTop: 4 }}>
            {emoji} {label}
          </div>
          <div style={{ fontSize: 12, color: '#a09cc0', marginTop: 6 }}>
            🎩 Boris&apos;s Estimated Rating
          </div>
        </div>

        {/* Comparison */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 24,
          fontSize: 13, color: '#a09cc0',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#9b5de5' }}>Current</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{player.rating}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 20 }}>→</div>
          <div>
            <div style={{ fontWeight: 700, color }}>New</div>
            <div style={{ fontWeight: 900, fontSize: 18, color }}>{estimatedRating}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onApply}
            style={{
              flex: 2, padding: '14px 0', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${color}, #9b5de5)`,
              color: '#fff', fontSize: 15, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >✅ Apply This Rating</button>
          <button
            onClick={onDismiss}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#a09cc0', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >Keep {player.rating}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Promotion Picker ─────────────────────────────────────────────────────────

const PROMO_PIECES = [
  { piece: 'q', label: 'Queen',  unicode: { w: '♕', b: '♛' }, desc: 'Most powerful' },
  { piece: 'r', label: 'Rook',   unicode: { w: '♖', b: '♜' }, desc: 'Powerful in endgame' },
  { piece: 'b', label: 'Bishop', unicode: { w: '♗', b: '♝' }, desc: 'Great on open diagonals' },
  { piece: 'n', label: 'Knight', unicode: { w: '♘', b: '♞' }, desc: 'Tricky moves!' },
];

function PromotionPicker({ playerColor, onPick, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e1a5a, #0f0c29)',
        border: '2px solid rgba(155,93,229,0.6)',
        borderRadius: 24, padding: '28px 24px',
        textAlign: 'center', width: 300,
        animation: 'slide-up 0.25s ease',
        boxShadow: '0 8px 48px rgba(155,93,229,0.4)',
      }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>👑</div>
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 4 }}>Pawn Promotion!</div>
        <div style={{ color: '#a09cc0', fontSize: 13, marginBottom: 20 }}>
          Your pawn made it! Choose what it becomes:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {PROMO_PIECES.map(({ piece, label, unicode, desc }) => (
            <button
              key={piece}
              onClick={() => onPick(piece)}
              style={{
                background: piece === 'q' ? 'rgba(155,93,229,0.25)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${piece === 'q' ? 'rgba(155,93,229,0.7)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 14, padding: '12px 8px',
                cursor: 'pointer', color: '#fff',
                fontFamily: 'Nunito, sans-serif',
                transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(155,93,229,0.35)';
                e.currentTarget.style.borderColor = 'rgba(155,93,229,0.9)';
                e.currentTarget.style.transform = 'scale(1.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = piece === 'q' ? 'rgba(155,93,229,0.25)' : 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = piece === 'q' ? 'rgba(155,93,229,0.7)' : 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span style={{ fontSize: 34, lineHeight: 1 }}>{unicode[playerColor]}</span>
              <span style={{ fontSize: 13, fontWeight: 900 }}>{label}</span>
              <span style={{ fontSize: 10, color: '#a09cc0' }}>{desc}</span>
              {piece === 'q' && (
                <span style={{ fontSize: 9, background: '#9b5de5', color: '#fff', borderRadius: 6, padding: '1px 6px', fontWeight: 800 }}>
                  RECOMMENDED
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10, padding: '8px 20px', color: '#a09cc0',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
          }}
        >
          ← Cancel move
        </button>
      </div>
    </div>
  );
}

function CoachPanel({ onClose, coachHintData }) {
  const staticTips = [
    { emoji: '♟️', text: 'Control the center! Pawns on e4 and d4 give you power.' },
    { emoji: '🏇', text: 'Move your knights and bishops out early — before your queen!' },
    { emoji: '🏰', text: 'Castle early to keep your king safe!' },
    { emoji: '👁️', text: 'Ask yourself: "Can my opponent take one of my pieces for free?"' },
    { emoji: '🍴', text: 'Look for forks — one piece attacking two targets at once!' },
    { emoji: '📌', text: 'Pins keep enemy pieces stuck. Use them!' },
  ];
  const tip = staticTips[Math.floor(Math.random() * staticTips.length)];

  const rankEmoji = ['⭐', '2️⃣', '3️⃣'];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(180deg, #1e1a5a, #0f0c29)',
      borderTop: '2px solid rgba(155,93,229,0.6)',
      padding: '16px 20px 32px',
      animation: 'slide-up 0.3s ease',
      zIndex: 100, maxHeight: '65vh', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4cc9f0, #9b5de5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
            boxShadow: '0 0 12px rgba(155,93,229,0.6)',
          }}>🎩</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, lineHeight: 1.1 }}>Coach Boris</div>
            <div style={{ fontSize: 10, color: '#a09cc0', fontWeight: 700 }}>GRANDMASTER ADVISOR</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
      </div>

      {coachHintData ? (
        <>
          {/* Top moves list */}
          {coachHintData.topMoves?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#a09cc0', fontWeight: 800, letterSpacing: 1.5, marginBottom: 8 }}>
                TOP MOVES
              </div>
              {coachHintData.topMoves.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '8px 12px', marginBottom: 6,
                  background: i === 0 ? 'rgba(155,93,229,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === 0 ? 'rgba(155,93,229,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10,
                }}>
                  <span style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }}>{rankEmoji[i]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: i === 0 ? '#c4b5fd' : '#e0daf0', marginBottom: 2 }}>
                      {m.move?.san || `${m.move?.from}→${m.move?.to}`}
                    </div>
                    <div style={{ fontSize: 11, color: '#a09cc0', lineHeight: 1.4 }}>
                      {m.explanation}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#6b50a0', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                    {typeof m.score === 'number' ? (m.score > 0 ? '+' : '') + m.score.toFixed(0) : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Voice script / full advice — Boris style */}
          {coachHintData.script && (
            <div style={{
              background: 'rgba(76,201,240,0.07)',
              border: '1px solid rgba(76,201,240,0.25)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              {coachHintData.script.split('\n').map((line, i) => {
                if (!line.trim()) return null;
                const isHeader = line.startsWith('🎩');
                const isSignoff = i > 0 && !line.startsWith('⚠️') && !line.startsWith('♟️') && !line.startsWith('🔄') && !line.startsWith('💡') && !line.startsWith('👁️') && !line.startsWith('🎩');
                return (
                  <div key={i} style={{
                    fontSize: isHeader ? 12 : 13,
                    fontWeight: isHeader ? 800 : isSignoff ? 600 : 700,
                    color: isHeader ? '#4cc9f0' : isSignoff ? '#a09cc0' : '#d4cfee',
                    lineHeight: 1.55,
                    marginBottom: isHeader ? 8 : 6,
                    fontStyle: isSignoff ? 'italic' : 'normal',
                    letterSpacing: isHeader ? 0.5 : 0,
                  }}>
                    {line}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Static tip when no live data */
        <div style={{
          background: 'rgba(155,93,229,0.12)',
          border: '1px solid rgba(155,93,229,0.35)',
          borderRadius: 14, padding: '14px 16px',
          fontSize: 14, lineHeight: 1.6,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>{tip.emoji}</span>
          <span>{tip.text}</span>
        </div>
      )}
    </div>
  );
}

function SettingsSheet({ pieceThemeId, onPieceTheme, soundThemeId, onSoundTheme, onClose }) {
  const [localTimeControl, setLocalTimeControl] = useState(loadTimeControl);

  function handleTimeControl(id) {
    setLocalTimeControl(id);
    saveTimeControl(id);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 150,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'linear-gradient(180deg, #1f1a52, #0f0c29)',
        borderTop: '2px solid rgba(155,93,229,0.5)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 40px',
        maxHeight: '80vh', overflowY: 'auto',
        animation: 'slide-up 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>⚙️ Settings</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* ── Piece Themes ── */}
        <SectionLabel>PIECE THEME</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 24 }}>
          {THEME_ORDER.map(id => {
            const theme = PIECE_THEMES[id];
            const active = pieceThemeId === id;
            return (
              <button
                key={id}
                onClick={() => onPieceTheme(id)}
                style={{
                  background: active ? 'rgba(155,93,229,0.25)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${active ? '#9b5de5' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12, padding: '10px 4px',
                  cursor: 'pointer', color: '#fff',
                  fontFamily: 'Nunito, sans-serif',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                {/* Mini 2×2 board preview */}
                <div style={{
                  width: 34, height: 34, borderRadius: 6, overflow: 'hidden',
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  border: active ? `1px solid ${theme.boardBorder?.split(' ').pop() || '#9b5de5'}` : '1px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{ background: theme.boardLight }} />
                  <div style={{ background: theme.boardDark }} />
                  <div style={{ background: theme.boardDark }} />
                  <div style={{ background: theme.boardLight }} />
                </div>
                <span style={{ fontSize: 16 }}>{theme.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: active ? '#c4b5fd' : '#a09cc0' }}>
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Sound Themes ── */}
        <SectionLabel>SOUND THEME</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
          {SOUND_THEMES.map(theme => {
            const active = soundThemeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => { onSoundTheme(theme.id); Sounds.move(); }}
                style={{
                  background: active ? 'rgba(155,93,229,0.25)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${active ? '#9b5de5' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12, padding: '10px 6px',
                  cursor: 'pointer', color: '#fff',
                  fontFamily: 'Nunito, sans-serif',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 22 }}>{theme.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: active ? '#c4b5fd' : '#e0daf0' }}>{theme.name}</span>
                <span style={{ fontSize: 9, color: '#a09cc0', textAlign: 'center', lineHeight: 1.3 }}>{theme.description}</span>
              </button>
            );
          })}
        </div>

        {/* ── Time Control ── */}
        <SectionLabel>
          TIME CONTROL{' '}
          <span style={{ fontSize: 9, color: '#6b50a0', fontWeight: 600 }}>(next game)</span>
        </SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {TIME_CONTROLS.map(tc => {
            const active = localTimeControl === tc.id;
            return (
              <button
                key={tc.id}
                onClick={() => handleTimeControl(tc.id)}
                style={{
                  flex: 1, padding: '10px 4px',
                  background: active ? 'rgba(155,93,229,0.25)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${active ? '#9b5de5' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, color: active ? '#c4b5fd' : '#e0daf0',
                  cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                  fontSize: 14, fontWeight: 800,
                  transition: 'all 0.15s',
                }}
              >
                {tc.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, color: '#a09cc0', fontWeight: 800,
      letterSpacing: 1.5, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function GameOverModal({ result, reason, aiLevel, player, ratingDelta, coachTips, onRematch, onHome }) {
  const cfg = {
    win:  { emoji: '🏆', title: 'You Won!',    color: '#f7c948', bg: 'linear-gradient(135deg, #f7c948, #f97316)' },
    loss: { emoji: '💪', title: 'Good Game!',  color: '#9b5de5', bg: 'linear-gradient(135deg, #9b5de5, #4cc9f0)' },
    draw: { emoji: '🤝', title: "It's a Draw!", color: '#4cc9f0', bg: 'linear-gradient(135deg, #4cc9f0, #9b5de5)' },
  }[result];

  const reasonLabel = reason === 'timeout' ? 'On time'
    : reason === 'checkmate' ? 'By checkmate'
    : reason === 'stalemate' ? 'By stalemate'
    : 'Draw';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, zIndex: 200, backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1550, #0f0c29)',
        border: `2px solid ${cfg.color}55`,
        borderRadius: 24, padding: '28px 24px',
        maxWidth: 420, width: '100%',
        animation: 'bounce-in 0.4s ease',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Result header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 64, marginBottom: 8, animation: 'float 2s ease-in-out infinite' }}>
            {cfg.emoji}
          </div>
          <h2 style={{
            fontSize: 32, fontWeight: 900, marginBottom: 4,
            background: cfg.bg,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{cfg.title}</h2>
          <p style={{ color: '#a09cc0', fontSize: 14 }}>
            {reasonLabel} vs {aiLevel.emoji} {aiLevel.name}
          </p>
        </div>

        {/* Rating delta */}
        {ratingDelta !== null && (
          <div style={{
            background: ratingDelta >= 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,37,133,0.12)',
            border: `1px solid ${ratingDelta >= 0 ? '#4ade80' : '#f72585'}`,
            borderRadius: 14, padding: '12px 16px',
            textAlign: 'center', marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, color: '#a09cc0', fontWeight: 700, marginBottom: 4 }}>RATING CHANGE</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: ratingDelta >= 0 ? '#4ade80' : '#f72585' }}>
              {ratingDelta >= 0 ? '+' : ''}{ratingDelta}
            </div>
            <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>
              New rating: {player.rating} {getRatingLabel(player.rating).emoji}
            </div>
            {ratingDelta > 0 && (
              <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4, animation: 'star-pop 0.5s ease' }}>
                ⭐ Great job!
              </div>
            )}
          </div>
        )}

        {/* Boris's Notes */}
        {coachTips?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4cc9f0, #9b5de5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, flexShrink: 0,
              }}>🎩</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#9b5de5' }}>
                Boris&apos;s Notes:
              </div>
            </div>
            {coachTips.map((tip, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '8px 0',
                borderBottom: i < coachTips.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                fontSize: 13, lineHeight: 1.5,
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.emoji}</span>
                <span style={{ color: '#c0b8e0' }}>{tip.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onRematch}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #9b5de5, #f72585)',
              color: '#fff', fontSize: 16, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >⚔️ Play Again</button>
          <button
            onClick={onHome}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 14,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 16, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >🏠 Home</button>
        </div>
      </div>
    </div>
  );
}

function IconButton({ icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(155,93,229,0.2)' : 'rgba(255,255,255,0.07)',
        border: `1px solid ${active ? 'rgba(155,93,229,0.5)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 10, padding: '6px 10px',
        fontSize: 16, cursor: 'pointer',
        fontFamily: 'Nunito, sans-serif',
        transition: 'all 0.15s',
        color: '#fff',
      }}
    >{icon}</button>
  );
}

const btnStyle = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 12, padding: '8px 16px',
  color: '#fff', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
};
