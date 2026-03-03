import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { getBestMove, analyzeMoveQuality, generateCoachTips } from '../engine/aiEngine';
import { updateRating, newPlayer } from '../engine/glicko2';

const STORAGE_KEY = 'yochess_player';

function loadPlayer() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return newPlayer('Champion');
}

function savePlayer(player) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  } catch {}
}

export function useGameState() {
  const [player, setPlayer] = useState(loadPlayer);
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [gameOver, setGameOver] = useState(null); // null | { result, reason }
  const [moveHistory, setMoveHistory] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [coachTips, setCoachTips] = useState(null);
  const [currentAiLevel, setCurrentAiLevel] = useState('sparky');
  const [playerColor, setPlayerColor] = useState('w');
  const aiTimeoutRef = useRef(null);

  const resetGame = useCallback((aiLevelId = currentAiLevel, color = 'w') => {
    chess.reset();
    setFen(chess.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setGameOver(null);
    setMoveHistory([]);
    setCoachTips(null);
    setCurrentAiLevel(aiLevelId);
    setPlayerColor(color);
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);

    // If player is black, AI moves first
    if (color === 'b') {
      setIsAiThinking(true);
      aiTimeoutRef.current = setTimeout(() => {
        const move = getBestMove(chess.fen(), aiLevelId);
        if (move) {
          const prevFen = chess.fen();
          const result = chess.move(move);
          if (result) {
            const newFen = chess.fen();
            setFen(newFen);
            setLastMove({ from: result.from, to: result.to });
          }
        }
        setIsAiThinking(false);
      }, 600);
    }
  }, [chess, currentAiLevel]);

  const handleSquareClick = useCallback((square) => {
    if (gameOver || isAiThinking) return;
    if (chess.turn() !== playerColor) return;

    const piece = chess.get(square);

    // If a square is already selected
    if (selectedSquare) {
      // Try to make a move
      if (legalMoves.includes(square)) {
        const prevFen = chess.fen();
        let moveResult;

        // Check for pawn promotion
        const movingPiece = chess.get(selectedSquare);
        const isPromotion = movingPiece?.type === 'p' &&
          ((playerColor === 'w' && square[1] === '8') ||
           (playerColor === 'b' && square[1] === '1'));

        try {
          moveResult = chess.move({
            from: selectedSquare,
            to: square,
            promotion: isPromotion ? 'q' : undefined,
          });
        } catch {
          moveResult = null;
        }

        if (moveResult) {
          const newFen = chess.fen();
          const quality = analyzeMoveQuality(prevFen, moveResult.san, newFen);

          setMoveHistory(prev => [...prev, { san: moveResult.san, quality, color: playerColor }]);
          setFen(newFen);
          setLastMove({ from: moveResult.from, to: moveResult.to });
          setSelectedSquare(null);
          setLegalMoves([]);

          // Check game over
          if (chess.isGameOver()) {
            const result = chess.isCheckmate()
              ? (chess.turn() === playerColor ? 'loss' : 'win')
              : 'draw';
            const reason = chess.isCheckmate() ? 'checkmate'
              : chess.isStalemate() ? 'stalemate'
              : chess.isDraw() ? 'draw' : 'game over';

            const tips = generateCoachTips(
              [...moveHistory, { san: moveResult.san, quality }],
              playerColor,
              result
            );
            setCoachTips(tips);
            setGameOver({ result, reason });

            // Update rating
            const { AI_LEVELS } = require('../engine/aiEngine');
            const aiLevel = AI_LEVELS.find(l => l.id === currentAiLevel);
            if (aiLevel) {
              const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
              const updatedPlayer = updateRating(player, [{
                opponentRating: aiLevel.rating,
                opponentRd: 100,
                score,
              }]);
              savePlayer(updatedPlayer);
              setPlayer(updatedPlayer);
            }
            return;
          }

          // AI move
          setIsAiThinking(true);
          aiTimeoutRef.current = setTimeout(() => {
            const aiFen = chess.fen();
            const aiMove = getBestMove(aiFen, currentAiLevel);
            if (aiMove) {
              try {
                const aiResult = chess.move(aiMove);
                if (aiResult) {
                  const afterAiFen = chess.fen();
                  setFen(afterAiFen);
                  setLastMove({ from: aiResult.from, to: aiResult.to });
                  setMoveHistory(prev => [...prev, {
                    san: aiResult.san,
                    quality: { quality: 'ai', emoji: '🤖', label: 'AI move' },
                    color: playerColor === 'w' ? 'b' : 'w',
                  }]);

                  if (chess.isGameOver()) {
                    const result = chess.isCheckmate()
                      ? (chess.turn() === playerColor ? 'loss' : 'win')
                      : 'draw';
                    const reason = chess.isCheckmate() ? 'checkmate' : 'draw';
                    const tips = generateCoachTips(moveHistory, playerColor, result);
                    setCoachTips(tips);
                    setGameOver({ result, reason });

                    const { AI_LEVELS } = require('../engine/aiEngine');
                    const aiLvl = AI_LEVELS.find(l => l.id === currentAiLevel);
                    if (aiLvl) {
                      const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
                      const updatedPlayer = updateRating(player, [{
                        opponentRating: aiLvl.rating,
                        opponentRd: 100,
                        score,
                      }]);
                      savePlayer(updatedPlayer);
                      setPlayer(updatedPlayer);
                    }
                  }
                }
              } catch {}
            }
            setIsAiThinking(false);
          }, 500 + Math.random() * 700);

          return;
        }
      }

      // Clicking own piece — reselect
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true });
        setLegalMoves(moves.map(m => m.to));
        return;
      }

      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Select a piece
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalMoves(moves.map(m => m.to));
    }
  }, [chess, selectedSquare, legalMoves, gameOver, isAiThinking, playerColor,
      currentAiLevel, moveHistory, player]);

  const updatePlayerName = useCallback((name) => {
    const updated = { ...player, name };
    savePlayer(updated);
    setPlayer(updated);
  }, [player]);

  return {
    player,
    fen,
    selectedSquare,
    legalMoves,
    lastMove,
    gameOver,
    moveHistory,
    isAiThinking,
    coachTips,
    currentAiLevel,
    playerColor,
    chess,
    resetGame,
    handleSquareClick,
    updatePlayerName,
  };
}
