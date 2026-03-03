import { useRef } from 'react';
import { PIECE_THEMES } from '../engine/pieceThemes';
import ChessPiece from './ChessPiece';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function parseFen(fen) {
  const board = {};
  const rows = fen.split(' ')[0].split('/');
  RANKS.forEach((rank, ri) => {
    let fileIdx = 0;
    for (const ch of rows[ri]) {
      if (!isNaN(ch)) {
        fileIdx += parseInt(ch);
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        const type = ch.toUpperCase();
        board[FILES[fileIdx] + rank] = { color, type };
        fileIdx++;
      }
    }
  });
  return board;
}

export default function ChessBoard({
  fen,
  selectedSquare,
  legalMoves = [],
  lastMove,
  onSquareClick,
  playerColor = 'w',
  isAiThinking = false,
  check = false,
  pieceThemeId = 'classic',
  coachSquare = null,
}) {
  const boardRef = useRef(null);
  const theme = PIECE_THEMES[pieceThemeId] || PIECE_THEMES.classic;
  const boardPieces = parseFen(fen);
  const isFlipped = playerColor === 'b';
  const ranks = isFlipped ? [...RANKS].reverse() : RANKS;
  const files = isFlipped ? [...FILES].reverse() : FILES;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {isAiThinking && (
        <div style={{
          position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(155,93,229,0.9)', borderRadius: 20, padding: '4px 16px',
          fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
          zIndex: 10, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span>
          Thinking...
        </div>
      )}

      <div
        ref={boardRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          width: 'min(460px, 90vw, 52vh)',
          height: 'min(460px, 90vw, 52vh)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: theme.boardShadow,
          border: theme.boardBorder,
          transition: 'box-shadow 0.4s, border-color 0.4s',
        }}
      >
        {ranks.map((rank, ri) =>
          files.map((file, fi) => {
            const square = file + rank;
            const piece = boardPieces[square];
            const isLight = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLegal = legalMoves.includes(square);
            const isLastFrom = lastMove?.from === square;
            const isLastTo = lastMove?.to === square;
            const isCoach = coachSquare === square;
            const isInCheck = check && piece?.type === 'K' && piece?.color === fen.split(' ')[1];

            let bg = isLight ? theme.boardLight : theme.boardDark;
            if (isSelected) bg = isLight ? theme.selectedLight : theme.selectedDark;
            else if (isLastFrom || isLastTo) bg = isLight ? theme.lastMoveLight : theme.lastMoveDark;
            if (isInCheck) bg = '#e05555';
            if (isCoach && !isSelected) bg = isLight ? '#c4b5fd66' : '#7c3aed55';


            return (
              <div
                key={square}
                onClick={() => onSquareClick(square)}
                style={{
                  background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  cursor: piece?.color === playerColor || isLegal ? 'pointer' : 'default',
                  userSelect: 'none',
                  transition: 'background 0.15s',
                }}
              >
                {/* Coordinate labels */}
                {fi === 0 && (
                  <span style={{
                    position: 'absolute', top: 2, left: 3,
                    fontSize: 'clamp(7px, 1.3vw, 10px)', fontWeight: 800,
                    color: isLight ? theme.boardDark : theme.boardLight, opacity: 0.7, lineHeight: 1,
                  }}>{rank}</span>
                )}
                {ri === 7 && (
                  <span style={{
                    position: 'absolute', bottom: 2, right: 3,
                    fontSize: 'clamp(7px, 1.3vw, 10px)', fontWeight: 800,
                    color: isLight ? theme.boardDark : theme.boardLight, opacity: 0.7, lineHeight: 1,
                  }}>{file}</span>
                )}

                {/* Coach hint ring */}
                {isCoach && (
                  <div style={{
                    position: 'absolute', inset: 2, borderRadius: 4,
                    border: '3px solid #a78bfa',
                    boxShadow: '0 0 14px #7c3aed',
                    animation: 'pulse-glow 1.2s infinite',
                    pointerEvents: 'none', zIndex: 2,
                  }} />
                )}

                {/* Legal move dot */}
                {isLegal && !piece && (
                  <div style={{ width: '28%', height: '28%', borderRadius: '50%', background: 'rgba(0,0,0,0.22)', zIndex: 1 }} />
                )}
                {isLegal && piece && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid rgba(0,0,0,0.28)', pointerEvents: 'none', zIndex: 1 }} />
                )}

                {/* Piece */}
                {piece && (
                  <div style={{
                    width: '88%', height: '88%',
                    zIndex: 2, userSelect: 'none',
                    pointerEvents: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ChessPiece
                      type={piece.type.toLowerCase()}
                      color={piece.color}
                      themeId={pieceThemeId}
                      isSelected={isSelected}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
