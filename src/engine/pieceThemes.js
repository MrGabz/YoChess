/**
 * YoChess Piece Theme System
 * 5 visual styles for chess pieces + board colors
 */

export const PIECE_THEMES = {
  traditional: {
    id: 'traditional',
    name: 'Traditional',
    emoji: '🟩',
    description: 'Tournament green & ivory',
    boardLight: '#eeeed2',
    boardDark: '#769656',
    selectedLight: '#f6f669',
    selectedDark: '#baca2b',
    lastMoveLight: '#cfe26a',
    lastMoveDark: '#9dba3a',
    boardBorder: '4px solid #4a3520',
    boardShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 2px rgba(74,53,32,0.5)',
    pieceStyle: (color) => ({
      color: color === 'w' ? '#fefef0' : '#1c0f08',
      WebkitTextStroke: color === 'w' ? '0.5px #c8a870' : '0.5px #7a5838',
      filter: color === 'w'
        ? 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))'
        : 'drop-shadow(0 3px 5px rgba(0,0,0,0.75))',
    }),
  },

  classic: {
    id: 'classic',
    name: 'Classic',
    emoji: '♟️',
    description: 'Traditional wooden look',
    boardLight: '#f0d9b5',
    boardDark: '#b58863',
    selectedLight: '#7fc97f',
    selectedDark: '#5a9e5a',
    lastMoveLight: '#cdd92a',
    lastMoveDark: '#a6b820',
    boardBorder: '3px solid rgba(155,93,229,0.5)',
    boardShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 3px rgba(155,93,229,0.4)',
    pieceStyle: (color) => ({
      color: color === 'w' ? '#fffef0' : '#1a1025',
      WebkitTextStroke: color === 'w' ? '0.5px rgba(0,0,0,0.6)' : '0.5px rgba(255,255,255,0.15)',
      filter: color === 'w'
        ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))'
        : 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))',
    }),
  },

  neon: {
    id: 'neon',
    name: 'Neon',
    emoji: '⚡',
    description: 'Cyberpunk glow effect',
    boardLight: '#0d1b2a',
    boardDark: '#071018',
    selectedLight: '#003366',
    selectedDark: '#002244',
    lastMoveLight: '#004488',
    lastMoveDark: '#003366',
    boardBorder: '3px solid #00ffff88',
    boardShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,255,255,0.2)',
    pieceStyle: (color) => ({
      color: color === 'w' ? '#00ffff' : '#ff44ff',
      textShadow: color === 'w'
        ? '0 0 6px #00ffff, 0 0 18px #00ffff, 0 0 30px #0088ff'
        : '0 0 6px #ff44ff, 0 0 18px #ff44ff, 0 0 30px #aa00ff',
      filter: 'none',
      WebkitTextStroke: 'none',
    }),
  },

  pixel: {
    id: 'pixel',
    name: 'Pixel',
    emoji: '🕹️',
    description: '8-bit retro style',
    boardLight: '#8cc84b',
    boardDark: '#4a7c59',
    selectedLight: '#ffff44',
    selectedDark: '#cccc00',
    lastMoveLight: '#ffaa00',
    lastMoveDark: '#cc8800',
    boardBorder: '3px solid #ffff0066',
    boardShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 0 3px rgba(255,255,0,0.3)',
    pieceStyle: (color) => ({
      color: color === 'w' ? '#FFE566' : '#EE3311',
      WebkitTextStroke: color === 'w' ? '1.5px #885500' : '1.5px #440000',
      filter: color === 'w'
        ? 'drop-shadow(3px 3px 0px #885500)'
        : 'drop-shadow(3px 3px 0px #440000)',
      imageRendering: 'pixelated',
    }),
  },

  royal: {
    id: 'royal',
    name: 'Royal',
    emoji: '👑',
    description: 'Gold & silver luxury',
    boardLight: '#f5e6c8',
    boardDark: '#7a4a1e',
    selectedLight: '#b8960c',
    selectedDark: '#7a6408',
    lastMoveLight: '#c8a832',
    lastMoveDark: '#9a7c1a',
    boardBorder: '3px solid #FFD70088',
    boardShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(255,215,0,0.2)',
    pieceStyle: (color) => ({
      color: color === 'w' ? '#FFD700' : '#C0C0C0',
      WebkitTextStroke: color === 'w' ? '0.5px #8B6914' : '0.5px #555555',
      filter: color === 'w'
        ? 'drop-shadow(0 2px 4px rgba(255,215,0,0.9)) drop-shadow(0 0 10px rgba(255,180,0,0.5))'
        : 'drop-shadow(0 2px 4px rgba(192,192,192,0.9)) drop-shadow(0 0 10px rgba(160,160,160,0.5))',
    }),
  },

  galaxy: {
    id: 'galaxy',
    name: 'Galaxy',
    emoji: '🌌',
    description: 'Cosmic nebula vibes',
    boardLight: '#1a0a3e',
    boardDark: '#0d0520',
    selectedLight: '#3d1a7a',
    selectedDark: '#28104e',
    lastMoveLight: '#4a1a9e',
    lastMoveDark: '#350e6e',
    boardBorder: '3px solid rgba(124,58,237,0.7)',
    boardShadow: '0 8px 40px rgba(0,0,0,0.9), 0 0 30px rgba(124,58,237,0.3)',
    pieceStyle: (color) => ({
      color: color === 'w' ? '#c4b5fd' : '#fbbf24',
      textShadow: color === 'w'
        ? '0 0 8px #7c3aed, 0 0 20px #7c3aed88'
        : '0 0 8px #d97706, 0 0 20px #d9770688',
      filter: 'none',
      WebkitTextStroke: 'none',
    }),
  },
};

export const THEME_ORDER = ['traditional', 'classic', 'neon', 'pixel', 'royal', 'galaxy'];

export function loadPieceTheme() {
  try { return localStorage.getItem('yochess_piece_theme') || 'classic'; } catch { return 'classic'; }
}
export function savePieceTheme(id) {
  try { localStorage.setItem('yochess_piece_theme', id); } catch {}
}
