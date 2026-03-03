import { useState } from 'react';
import { AI_LEVELS } from '../engine/aiEngine';
import { getRatingLabel } from '../engine/glicko2';

export default function LevelSelectScreen({ player, onSelect, onBack }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedColor, setSelectedColor] = useState('w');

  const playerRatingInfo = getRatingLabel(player.rating);

  // Recommend a level close to player's rating
  const recommended = AI_LEVELS.reduce((prev, curr) =>
    Math.abs(curr.rating - player.rating) < Math.abs(prev.rating - player.rating) ? curr : prev
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: '8px 16px',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif',
          }}
        >← Back</button>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 900 }}>
          ⚔️ Choose Your Opponent
        </h2>
        <div style={{ width: 70 }} />
      </div>

      {/* Your rating */}
      <div style={{
        background: 'rgba(155,93,229,0.15)',
        border: '1px solid rgba(155,93,229,0.4)',
        borderRadius: 14,
        padding: '10px 20px',
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 700,
      }}>
        {playerRatingInfo.emoji} You are a <span style={{ color: playerRatingInfo.color }}>{playerRatingInfo.label}</span> — Rating {player.rating}
      </div>

      {/* Color selection */}
      <div style={{ marginBottom: 20, width: '100%', maxWidth: 520 }}>
        <p style={{ color: '#a09cc0', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>
          PLAY AS
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {[
            { val: 'w', label: 'White', emoji: '♔', desc: 'You go first' },
            { val: 'b', label: 'Black', emoji: '♚', desc: 'AI goes first' },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setSelectedColor(opt.val)}
              style={{
                flex: 1,
                maxWidth: 160,
                padding: '14px 10px',
                borderRadius: 16,
                border: `2px solid ${selectedColor === opt.val ? '#9b5de5' : 'rgba(255,255,255,0.15)'}`,
                background: selectedColor === opt.val ? 'rgba(155,93,229,0.2)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
                fontFamily: 'Nunito, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 28 }}>{opt.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: '#a09cc0' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Level Grid */}
      <div style={{ width: '100%', maxWidth: 520, marginBottom: 20 }}>
        <p style={{ color: '#a09cc0', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>
          SELECT DIFFICULTY
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {AI_LEVELS.map(level => {
            const isSelected = selectedLevel?.id === level.id;
            const isRecommended = level.id === recommended.id;
            const diff = Math.abs(level.rating - player.rating);
            let difficulty = 'Challenge';
            if (diff < 100) difficulty = '⚡ Perfect Match';
            else if (level.rating < player.rating - 100) difficulty = '😊 Easy';
            else if (level.rating < player.rating + 200) difficulty = '💪 Good Practice';
            else difficulty = '🔥 Hard';

            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level)}
                style={{
                  background: isSelected ? `${level.color}22` : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${isSelected ? level.color : isRecommended ? level.color + '55' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 16,
                  padding: '16px 12px',
                  cursor: 'pointer',
                  color: '#fff',
                  fontFamily: 'Nunito, sans-serif',
                  textAlign: 'left',
                  position: 'relative',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = level.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = isRecommended ? level.color + '55' : 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isRecommended && (
                  <div style={{
                    position: 'absolute', top: -10, right: 10,
                    background: '#f7c948', color: '#000', borderRadius: 20,
                    padding: '2px 10px', fontSize: 10, fontWeight: 900,
                  }}>
                    ⭐ RECOMMENDED
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 28 }}>{level.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: level.color }}>{level.name}</div>
                    <div style={{ fontSize: 11, color: '#a09cc0' }}>Rating {level.rating}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#c0b8e0', marginBottom: 4 }}>{level.description}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: level.color }}>{difficulty}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={() => selectedLevel && onSelect(selectedLevel.id, selectedColor)}
        disabled={!selectedLevel}
        style={{
          width: '100%',
          maxWidth: 520,
          padding: '18px 0',
          borderRadius: 20,
          border: 'none',
          background: selectedLevel
            ? `linear-gradient(135deg, ${selectedLevel.color}, #f72585)`
            : 'rgba(255,255,255,0.1)',
          color: selectedLevel ? '#fff' : '#666',
          fontSize: 20,
          fontWeight: 900,
          cursor: selectedLevel ? 'pointer' : 'not-allowed',
          fontFamily: 'Nunito, sans-serif',
          transition: 'all 0.2s',
          transform: selectedLevel ? 'scale(1)' : 'scale(0.98)',
        }}
        onMouseEnter={e => selectedLevel && (e.target.style.transform = 'scale(1.02)')}
        onMouseLeave={e => selectedLevel && (e.target.style.transform = 'scale(1)')}
      >
        {selectedLevel
          ? `⚔️ Battle ${selectedLevel.emoji} ${selectedLevel.name}!`
          : 'Pick an opponent above ↑'}
      </button>
    </div>
  );
}
