/**
 * YoChess SVG Chess Pieces
 * Beautiful vector pieces with 6 visual themes
 * viewBox: 0 0 45 45
 */

// ─── Theme Definitions ────────────────────────────────────────────────────────
// Each theme defines fill, stroke, glow/shadow filter, and eye color for knight

const PIECE_STYLE_THEMES = {
  classic: {
    w: {
      fill: '#f0d5a0',
      stroke: '#7a4e2d',
      strokeWidth: 1.5,
      eyeFill: '#3d1f08',
      filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.55)) drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
    },
    b: {
      fill: '#2a1405',
      stroke: '#a07040',
      strokeWidth: 1.5,
      eyeFill: '#d4a070',
      filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.75)) drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
    },
  },
  traditional: {
    w: {
      fill: '#fefef0',
      stroke: '#c8a870',
      strokeWidth: 1.3,
      eyeFill: '#5a3820',
      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
    },
    b: {
      fill: '#1c0f08',
      stroke: '#7a5838',
      strokeWidth: 1.3,
      eyeFill: '#d4a878',
      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.75)) drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
    },
  },
  neon: {
    w: {
      fill: 'rgba(0,255,255,0.08)',
      stroke: '#00ffff',
      strokeWidth: 1.8,
      eyeFill: '#00ffff',
      filter: 'drop-shadow(0 0 5px #00ffff) drop-shadow(0 0 14px rgba(0,255,255,0.55))',
    },
    b: {
      fill: 'rgba(255,68,255,0.08)',
      stroke: '#ff44ff',
      strokeWidth: 1.8,
      eyeFill: '#ff44ff',
      filter: 'drop-shadow(0 0 5px #ff44ff) drop-shadow(0 0 14px rgba(255,68,255,0.55))',
    },
  },
  pixel: {
    w: {
      fill: '#FFE566',
      stroke: '#885500',
      strokeWidth: 2.5,
      eyeFill: '#553300',
      filter: 'drop-shadow(2px 2px 0px #553300)',
    },
    b: {
      fill: '#EE3311',
      stroke: '#660000',
      strokeWidth: 2.5,
      eyeFill: '#ffdd00',
      filter: 'drop-shadow(2px 2px 0px #220000)',
    },
  },
  royal: {
    w: {
      fill: '#FFD700',
      stroke: '#8B6914',
      strokeWidth: 1.5,
      eyeFill: '#3a2900',
      filter: 'drop-shadow(0 2px 8px rgba(255,215,0,0.85)) drop-shadow(0 4px 5px rgba(0,0,0,0.5))',
    },
    b: {
      fill: '#D8D8E8',
      stroke: '#555570',
      strokeWidth: 1.5,
      eyeFill: '#1a1a2e',
      filter: 'drop-shadow(0 2px 8px rgba(200,200,230,0.75)) drop-shadow(0 4px 5px rgba(0,0,0,0.5))',
    },
  },
  galaxy: {
    w: {
      fill: '#c4b5fd',
      stroke: '#7c3aed',
      strokeWidth: 1.5,
      eyeFill: '#2e1065',
      filter: 'drop-shadow(0 0 9px rgba(124,58,237,0.85)) drop-shadow(0 0 20px rgba(124,58,237,0.45))',
    },
    b: {
      fill: '#fbbf24',
      stroke: '#d97706',
      strokeWidth: 1.5,
      eyeFill: '#451a03',
      filter: 'drop-shadow(0 0 9px rgba(217,119,6,0.85)) drop-shadow(0 0 20px rgba(217,119,6,0.45))',
    },
  },
};

// ─── Standard Piece Shapes ────────────────────────────────────────────────────

function PawnPaths() {
  return (
    <>
      <circle cx="22.5" cy="9.5" r="6.5" />
      <path d="M17.5,16 C15,19.5 14,24 15.5,29 C16.5,32.5 19,34 22.5,34 C26,34 28.5,32.5 29.5,29 C31,24 30,19.5 27.5,16 Z" />
      <rect x="14" y="34" width="17" height="3" rx="1.5" />
      <rect x="12" y="37" width="21" height="5" rx="2.5" />
    </>
  );
}

function RookPaths() {
  return (
    <>
      <rect x="13" y="7" width="5.5" height="7" rx="0.5" />
      <rect x="20" y="7" width="5.5" height="7" rx="0.5" />
      <rect x="27" y="7" width="5.5" height="7" rx="0.5" />
      <rect x="13" y="14" width="19.5" height="2" />
      <rect x="15" y="16" width="15.5" height="17" rx="0.5" />
      <rect x="13" y="33" width="19.5" height="3" rx="1.5" />
      <rect x="11" y="36" width="23.5" height="5.5" rx="2.5" />
    </>
  );
}

function BishopPaths() {
  return (
    <>
      <circle cx="22.5" cy="7" r="3" />
      <path d="M22.5,10 C20,12.5 17,16.5 15.5,21 C14,25.5 14.5,30 16,33 L29,33 C30.5,30 31,25.5 29.5,21 C28,16.5 25,12.5 22.5,10 Z" />
      <ellipse cx="22.5" cy="24.5" rx="7" ry="1.8" />
      <rect x="14" y="33" width="17" height="3" rx="1.5" />
      <rect x="12" y="36" width="21" height="5.5" rx="2.5" />
    </>
  );
}

function KnightBody() {
  return (
    <path d="M13,40 L13,30 C10,27 9,23 11,18 C13,13 16,11 18,10 L17,7 L22,9 C24,7 27,7 29,9 C32,11 32,16 30,20 C28,23 25,24 22,25 C26,26 30,28 31,33 L31,40 Z" />
  );
}

function QueenPaths() {
  return (
    <>
      <path d="M11,14 L13,10 L16,14 L18.5,7 L20.5,14 L22.5,8 L24.5,14 L27,7 L29,14 L32,10 L34,14 L32,31 L13,31 Z" />
      <circle cx="13" cy="10" r="2.5" />
      <circle cx="18.5" cy="7" r="2.5" />
      <circle cx="22.5" cy="8" r="2.5" />
      <circle cx="27" cy="7" r="2.5" />
      <circle cx="32" cy="10" r="2.5" />
      <rect x="13" y="31" width="19" height="3" rx="1.5" />
      <rect x="11" y="34" width="23" height="6" rx="2.5" />
    </>
  );
}

function KingPaths() {
  return (
    <>
      <rect x="21" y="3.5" width="3" height="11" rx="1" />
      <rect x="17.5" y="7" width="10" height="3" rx="1" />
      <rect x="14.5" y="14.5" width="16" height="16.5" rx="0.5" />
      <rect x="13" y="31" width="19" height="3" rx="1.5" />
      <rect x="11" y="34" width="23" height="6" rx="2.5" />
    </>
  );
}

// ─── Traditional Staunton Piece Shapes ───────────────────────────────────────
// More organic, rounded forms — closer to classic Staunton tournament pieces

function TradPawnPaths() {
  return (
    <>
      {/* Sphere head */}
      <circle cx="22.5" cy="10" r="6.5" />
      {/* Organic vase body */}
      <path d="M18.5,16 Q15,19.5 14.5,24 Q14,28.5 16,31.5 Q18.5,34.5 22.5,35 Q26.5,34.5 29,31.5 Q31,28.5 30.5,24 Q30,19.5 26.5,16 Z" />
      {/* Thin collar */}
      <rect x="14.5" y="35" width="16" height="2.5" rx="1.2" />
      {/* Wide base */}
      <rect x="12" y="37.5" width="21" height="4.5" rx="2.5" />
    </>
  );
}

function TradRookPaths() {
  return (
    <>
      {/* Three battlements */}
      <rect x="12" y="7" width="5.5" height="8" rx="0.5" />
      <rect x="19.75" y="7" width="5.5" height="8" rx="0.5" />
      <rect x="27.5" y="7" width="5.5" height="8" rx="0.5" />
      {/* Top bridge */}
      <rect x="12" y="14.5" width="21" height="2" />
      {/* Tower body */}
      <rect x="14.5" y="16.5" width="16" height="15.5" rx="1" />
      {/* Collar */}
      <rect x="12" y="32" width="21" height="3" rx="1.5" />
      {/* Base */}
      <rect x="10" y="35" width="25" height="7" rx="2.5" />
    </>
  );
}

function TradBishopPaths() {
  return (
    <>
      {/* Finial ball */}
      <circle cx="22.5" cy="7" r="3.2" />
      {/* Mitre body — tapered organic shape */}
      <path d="M22.5,10.2 C20.5,12.5 18.5,16.5 17.5,20.5 C16.5,24.5 16.5,28.5 18,31.5 C19.5,33.5 21,34.5 22.5,34.5 C24,34.5 25.5,33.5 27,31.5 C28.5,28.5 28.5,24.5 27.5,20.5 C26.5,16.5 24.5,12.5 22.5,10.2 Z" />
      {/* Characteristic Staunton diagonal slash */}
      <line x1="17.5" y1="26" x2="27.5" y2="21.5" strokeWidth="2.5" />
      {/* Collar */}
      <rect x="14" y="34.5" width="17" height="3" rx="1.5" />
      {/* Base */}
      <rect x="11.5" y="37.5" width="22" height="4.5" rx="2.5" />
    </>
  );
}

function TradKnightBody() {
  return (
    <path d="M11.5,37 L11.5,30 C9,27.5 8.5,24 10,21 C11.5,18 13.5,16 15,13.5 L14,10 L16.5,8 L19.5,8.5 C21,7 23.5,6.5 26.5,8 C30,9.5 31.5,13.5 30,18 C28.5,21.5 26,23.5 23.5,25 C26.5,26 30.5,28 32,32.5 L33.5,37 Z" />
  );
}

function TradQueenPaths() {
  return (
    <>
      {/* Crown body with classic zig-zag silhouette */}
      <path d="M11,14.5 L13,10.5 L16.5,14.5 L18.5,7.5 L20.5,14.5 L22.5,9 L24.5,14.5 L27,7.5 L29,14.5 L32.5,10.5 L34,14.5 L32.5,31 L12.5,31 Z" />
      {/* Five orb finials */}
      <circle cx="13" cy="10.5" r="2.8" />
      <circle cx="18.5" cy="7.5" r="2.8" />
      <circle cx="22.5" cy="9" r="2.8" />
      <circle cx="27" cy="7.5" r="2.8" />
      <circle cx="32.5" cy="10.5" r="2.8" />
      {/* Collar */}
      <rect x="12.5" y="31" width="20" height="3" rx="1.5" />
      {/* Base */}
      <rect x="10.5" y="34" width="24" height="7" rx="2.5" />
    </>
  );
}

function TradKingPaths() {
  return (
    <>
      {/* Bold cross */}
      <rect x="21" y="2.5" width="3" height="12" rx="1.5" />
      <rect x="17.5" y="6.5" width="10" height="3" rx="1.5" />
      {/* Crown body with four points */}
      <path d="M15,14.5 L16,12 L18,14.5 L20.5,10 L22.5,14 L24.5,10 L27,14.5 L29,12 L30,14.5 L30.5,31 L14.5,31 Z" />
      {/* Collar */}
      <rect x="12.5" y="31" width="20" height="3" rx="1.5" />
      {/* Base */}
      <rect x="10.5" y="34" width="24" height="7" rx="2.5" />
    </>
  );
}

// ─── Shape Lookups ────────────────────────────────────────────────────────────

const SHAPE_MAP = {
  p: PawnPaths,
  r: RookPaths,
  b: BishopPaths,
  n: null,
  q: QueenPaths,
  k: KingPaths,
};

const TRAD_SHAPE_MAP = {
  p: TradPawnPaths,
  r: TradRookPaths,
  b: TradBishopPaths,
  n: null,
  q: TradQueenPaths,
  k: TradKingPaths,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChessPiece({
  type,
  color,
  themeId = 'classic',
  isSelected = false,
}) {
  const themes = PIECE_STYLE_THEMES[themeId] || PIECE_STYLE_THEMES.classic;
  const s = themes[color] || themes.w;
  const pieceType = type?.toLowerCase();
  const isKnight = pieceType === 'n';
  const isTraditional = themeId === 'traditional';

  const activeShapeMap = isTraditional ? TRAD_SHAPE_MAP : SHAPE_MAP;

  // Knight eye position varies by theme
  const knightEye = isTraditional
    ? { cx: 26.5, cy: 14.5, r: 2.5 }
    : { cx: 27, cy: 14, r: 2.5 };

  // Knight base rect varies by theme
  const knightBase = isTraditional
    ? { x: 11, y: 37, width: 23, height: 5, rx: 2.5 }
    : { x: 11, y: 37, width: 23, height: 5, rx: 2.5 };

  return (
    <svg
      viewBox="0 0 45 45"
      width="100%"
      height="100%"
      style={{
        display: 'block',
        overflow: 'visible',
        transform: isSelected ? 'scale(1.15) translateY(-4%)' : 'scale(1)',
        transition: 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1)',
        filter: s.filter || 'none',
      }}
    >
      <g
        fill={s.fill}
        stroke={s.stroke}
        strokeWidth={s.strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {isKnight ? (
          <>
            {isTraditional ? <TradKnightBody /> : <KnightBody />}
            <circle
              cx={knightEye.cx}
              cy={knightEye.cy}
              r={knightEye.r}
              fill={s.eyeFill}
              stroke="none"
            />
            <rect
              x={knightBase.x}
              y={knightBase.y}
              width={knightBase.width}
              height={knightBase.height}
              rx={knightBase.rx}
            />
          </>
        ) : (
          (() => {
            const Shape = activeShapeMap[pieceType];
            return Shape ? <Shape /> : null;
          })()
        )}
      </g>
    </svg>
  );
}
