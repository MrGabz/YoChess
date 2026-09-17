import { useState } from 'react';
import { getRatingLabel } from '../engine/glicko2';
import { AI_LEVELS } from '../engine/aiEngine';

const TIERS = [
  { min: 0, max: 400, label: 'Learner', emoji: '📚' },
  { min: 400, max: 600, label: 'Explorer', emoji: '🔭' },
  { min: 600, max: 800, label: 'Explorer+', emoji: '🔭' },
  { min: 800, max: 1000, label: 'Knight', emoji: '⚔️' },
  { min: 1000, max: 1200, label: 'Castle Guardian', emoji: '🏰' },
  { min: 1200, max: 1400, label: 'Chess Wizard', emoji: '🧙' },
  { min: 1400, max: 1600, label: 'Grand Knight', emoji: '👑' },
  { min: 1600, max: 1800, label: 'Master', emoji: '🌟' },
  { min: 1800, max: 2200, label: 'Grand Master', emoji: '🏆' },
];

const AVATAR_OPTIONS = ['♟️','♙','♞','♘','♝','♗','♜','♖','♛','♕','♚','♔','🎩','🏆','⚔️','🌟','🔥','🧙','👑','🦁'];

export default function HomeScreen({ player, onStartGame, onParentDashboard, onSwitchProfile, onFindRating, onSaveSettings, onChatBoris, onPuzzles }) {
  const ratingInfo = getRatingLabel(player.rating);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <StarField />

      {/* Settings gear button — top right */}
      <button
        onClick={() => setShowSettings(true)}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 12, width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(155,93,229,0.25)'; e.currentTarget.style.borderColor = '#9b5de5'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
        title="Settings"
      >
        ⚙️
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28, animation: 'slide-up 0.5s ease' }}>
        <div style={{ fontSize: 'clamp(48px, 10vw, 72px)', marginBottom: 4, animation: 'float 3s ease-in-out infinite' }}>
          ♟️
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 56px)',
          fontWeight: 900,
          background: 'linear-gradient(90deg, #f7c948, #f72585, #9b5de5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-1px',
          marginBottom: 4,
        }}>
          YoChess
        </h1>
        <p style={{ color: '#a09cc0', fontSize: 16, fontWeight: 600 }}>
          Learn. Play. Become a Chess Legend! 🏆
        </p>
      </div>

      {/* Player Card */}
      <div style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: '20px 28px',
        marginBottom: 28,
        textAlign: 'center',
        width: '100%',
        maxWidth: 360,
        animation: 'slide-up 0.6s ease',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{player.avatar || ratingInfo.emoji}</div>
        <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 2 }}>{player.name}</div>
        <div style={{
          display: 'inline-block',
          background: ratingInfo.color + '33',
          border: `1px solid ${ratingInfo.color}`,
          borderRadius: 20,
          padding: '3px 14px',
          fontSize: 13,
          fontWeight: 700,
          color: ratingInfo.color,
          marginBottom: 12,
        }}>
          {ratingInfo.label}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          marginBottom: 8,
        }}>
          <StatPill label="Rating" value={player.rating} color="#9b5de5" />
          <StatPill label="Wins" value={player.wins} color="#4ade80" />
          <StatPill label="Games" value={player.gamesPlayed} color="#4cc9f0" />
        </div>

        {/* Peak Rating Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 12,
          background: 'rgba(247,201,72,0.10)',
          border: '1px solid rgba(247,201,72,0.35)',
          borderRadius: 20,
          padding: '5px 14px',
          width: 'fit-content',
          margin: '0 auto 12px',
        }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontSize: 12, color: '#f7c948', fontWeight: 800 }}>Personal Best</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#f7c948' }}>
            {player.peakRating ?? player.rating}
          </span>
        </div>

        {/* Mini rating chart */}
        {player.history.length > 1 && <MiniChart history={player.history} />}

        {/* Switch profile */}
        {onSwitchProfile && (
          <button
            onClick={onSwitchProfile}
            style={{
              marginTop: 12,
              background: 'rgba(155,93,229,0.12)',
              border: '1px solid rgba(155,93,229,0.3)',
              borderRadius: 12,
              color: 'rgba(155,93,229,0.85)',
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 16px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            👤 Switch Profile
          </button>
        )}
      </div>

      {/* Play Button */}
      <button
        onClick={onStartGame}
        style={{
          width: '100%',
          maxWidth: 360,
          padding: '18px 0',
          borderRadius: 20,
          border: 'none',
          background: 'linear-gradient(135deg, #9b5de5, #f72585)',
          color: '#fff',
          fontSize: 22,
          fontWeight: 900,
          cursor: 'pointer',
          marginBottom: 14,
          animation: 'pulse-glow 2s infinite, slide-up 0.7s ease',
          transition: 'transform 0.15s',
          fontFamily: 'Nunito, sans-serif',
        }}
        onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
      >
        ⚔️ Play Now!
      </button>

      {/* Quick Play vs AI levels */}
      <div style={{ width: '100%', maxWidth: 360, marginBottom: 28, animation: 'slide-up 0.8s ease' }}>
        <p style={{ color: '#a09cc0', fontSize: 13, fontWeight: 700, marginBottom: 10, textAlign: 'center', letterSpacing: 1 }}>
          QUICK MATCH
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {AI_LEVELS.slice(0, 4).map(level => (
            <button
              key={level.id}
              onClick={() => onStartGame(level.id)}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 14,
                padding: '10px 4px',
                cursor: 'pointer',
                color: '#fff',
                fontFamily: 'Nunito, sans-serif',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = level.color + '33';
                e.currentTarget.style.borderColor = level.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: 22 }}>{level.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: level.color }}>{level.name}</span>
              <span style={{ fontSize: 10, color: '#a09cc0' }}>{level.rating}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress toward next level */}
      <NextLevelProgress player={player} />

      {/* Daily Puzzle */}
      <button
        onClick={onPuzzles}
        style={{
          width: '100%',
          maxWidth: 360,
          padding: '16px 0',
          borderRadius: 18,
          border: '1px solid rgba(247,201,72,0.45)',
          background: 'linear-gradient(135deg, rgba(247,201,72,0.18), rgba(249,115,22,0.12))',
          color: '#fff',
          fontSize: 17,
          fontWeight: 900,
          cursor: 'pointer',
          marginBottom: 12,
          fontFamily: 'Nunito, sans-serif',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(247,201,72,0.35), rgba(249,115,22,0.25))';
          e.currentTarget.style.borderColor = '#f7c948';
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(247,201,72,0.18), rgba(249,115,22,0.12))';
          e.currentTarget.style.borderColor = 'rgba(247,201,72,0.45)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span style={{ fontSize: 22 }}>🧩</span>
        Daily Puzzle
        <span style={{
          background: 'rgba(247,201,72,0.25)',
          border: '1px solid rgba(247,201,72,0.5)',
          borderRadius: 8,
          fontSize: 10,
          fontWeight: 900,
          color: '#f7c948',
          padding: '2px 8px',
          marginLeft: 4,
        }}>NEW</span>
      </button>

      {/* Chat with Boris */}
      <button
        onClick={onChatBoris}
        style={{
          width: '100%',
          maxWidth: 360,
          padding: '16px 0',
          borderRadius: 18,
          border: '1px solid rgba(155,93,229,0.5)',
          background: 'linear-gradient(135deg, rgba(155,93,229,0.2), rgba(247,37,133,0.15))',
          color: '#fff',
          fontSize: 17,
          fontWeight: 900,
          cursor: 'pointer',
          marginBottom: 12,
          fontFamily: 'Nunito, sans-serif',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(155,93,229,0.4), rgba(247,37,133,0.3))';
          e.currentTarget.style.borderColor = '#9b5de5';
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(155,93,229,0.2), rgba(247,37,133,0.15))';
          e.currentTarget.style.borderColor = 'rgba(155,93,229,0.5)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span style={{ fontSize: 22 }}>🎩</span>
        Chat with Boris the Coach
      </button>

      {/* Find My Rating */}
      {onFindRating && (
        <button
          onClick={onFindRating}
          style={{
            width: '100%',
            maxWidth: 360,
            padding: '14px 0',
            borderRadius: 16,
            border: '1px solid rgba(76,201,240,0.4)',
            background: 'rgba(76,201,240,0.08)',
            color: '#4cc9f0',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            marginBottom: 12,
            fontFamily: 'Nunito, sans-serif',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(76,201,240,0.18)'; e.target.style.borderColor = '#4cc9f0'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(76,201,240,0.08)'; e.target.style.borderColor = 'rgba(76,201,240,0.4)'; }}
        >
          🎯 Find My Rating
        </button>
      )}

      {/* Coming Soon Features */}
      <ComingSoonSection />

      {/* Parent Dashboard */}
      <button
        onClick={onParentDashboard}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 12,
          padding: '10px 24px',
          color: '#a09cc0',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'Nunito, sans-serif',
          marginTop: 8,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.target.style.borderColor = '#9b5de5'; e.target.style.color = '#fff'; }}
        onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.color = '#a09cc0'; }}
      >
        👪 Parent Dashboard
      </button>

      {/* Settings Drawer */}
      {showSettings && (
        <SettingsDrawer
          player={player}
          onSave={(updated) => {
            if (onSaveSettings) onSaveSettings(updated);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// ─── Coming Soon Section ──────────────────────────────────────────────────────

const COMING_SOON = [
  { emoji: '📖', label: 'Opening Lessons',   desc: 'Learn e4, d4 & Sicilian!' },
  { emoji: '🔍', label: 'Game Analysis',      desc: 'Review your moves with engine' },
  { emoji: '🏆', label: 'Achievements',       desc: 'Earn badges for milestones' },
  { emoji: '🌐', label: 'Online Play',        desc: 'Challenge real players' },
  { emoji: '🎖️', label: 'Tournaments',       desc: 'Bracket-style competitions' },
  { emoji: '👁️', label: 'Blindfold Mode',    desc: 'Train your board vision' },
];

function ComingSoonSection() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ width: '100%', maxWidth: 360, marginBottom: 8 }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', padding: '10px 16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          color: '#5a5580', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(155,93,229,0.3)'; e.currentTarget.style.color = '#9b5de5'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#5a5580'; }}
      >
        🚀 Coming Soon Features {open ? '▲' : '▼'}
      </button>
      {open && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 10,
          animation: 'slide-up 0.3s ease',
        }}>
          {COMING_SOON.map(f => (
            <div key={f.label} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '10px 12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{f.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#c0b8e0', marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 10, color: '#5a5580' }}>{f.desc}</div>
              <div style={{
                marginTop: 6,
                fontSize: 9, fontWeight: 900,
                color: '#9b5de5',
                background: 'rgba(155,93,229,0.12)',
                borderRadius: 6, padding: '2px 6px',
                display: 'inline-block',
              }}>COMING SOON</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Drawer ──────────────────────────────────────────────────────────

function SettingsDrawer({ player, onSave, onClose }) {
  const [name, setName] = useState(player.name || '');
  const [email, setEmail] = useState(player.email || '');
  const [avatar, setAvatar] = useState(player.avatar || '♟️');
  const [soundOn, setSoundOn] = useState(player.prefSoundOn !== false);
  const [voiceOn, setVoiceOn] = useState(player.prefVoiceOn !== false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      ...player,
      name: name.trim(),
      email: email.trim(),
      avatar,
      prefSoundOn: soundOn,
      prefVoiceOn: voiceOn,
    });
  }

  function handleReset() {
    onSave({
      ...player,
      rating: 800,
      rd: 350,
      volatility: 0.06,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      history: [],
      peakRating: 800,
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'linear-gradient(180deg, #1e1a5a, #0f0c29)',
          borderTop: '2px solid rgba(155,93,229,0.5)',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px 40px',
          animation: 'slide-up 0.3s ease',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>⚙️ Settings</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a09cc0', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Profile Section */}
        <SectionLabel>👤 Profile</SectionLabel>
        <div style={{ marginBottom: 20 }}>
          {/* Avatar picker */}
          <div style={{ fontSize: 12, color: '#a09cc0', fontWeight: 700, marginBottom: 8 }}>AVATAR</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {AVATAR_OPTIONS.map(a => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                style={{
                  width: 40, height: 40, fontSize: 20,
                  borderRadius: 10,
                  background: avatar === a ? 'rgba(155,93,229,0.3)' : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${avatar === a ? '#9b5de5' : 'rgba(255,255,255,0.1)'}`,
                  cursor: 'pointer', transition: 'all 0.12s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {a}
              </button>
            ))}
          </div>

          {/* Display Name */}
          <div style={{ fontSize: 12, color: '#a09cc0', fontWeight: 700, marginBottom: 6 }}>DISPLAY NAME</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={24}
            placeholder="Your name"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12, padding: '10px 14px',
              color: '#fff', fontSize: 15, fontWeight: 700,
              fontFamily: 'Nunito, sans-serif', outline: 'none',
              marginBottom: 14,
            }}
          />

          {/* Email */}
          <div style={{ fontSize: 12, color: '#a09cc0', fontWeight: 700, marginBottom: 6 }}>EMAIL (optional)</div>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            placeholder="your@email.com"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12, padding: '10px 14px',
              color: '#fff', fontSize: 15, fontWeight: 600,
              fontFamily: 'Nunito, sans-serif', outline: 'none',
            }}
          />
        </div>

        {/* Preferences Section */}
        <SectionLabel>🎮 Preferences</SectionLabel>
        <div style={{ marginBottom: 20 }}>
          <ToggleRow
            label="Sound Effects"
            emoji="🔊"
            value={soundOn}
            onChange={setSoundOn}
          />
          <ToggleRow
            label="Coach Voice"
            emoji="🎙️"
            value={voiceOn}
            onChange={setVoiceOn}
          />
        </div>

        {/* Danger Zone */}
        <SectionLabel>⚠️ Danger Zone</SectionLabel>
        <div style={{ marginBottom: 24 }}>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 12,
                background: 'rgba(247,37,133,0.08)',
                border: '1px solid rgba(247,37,133,0.3)',
                color: '#f72585', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
              }}
            >
              🔄 Reset My Stats & Rating
            </button>
          ) : (
            <div style={{
              background: 'rgba(247,37,133,0.12)',
              border: '1px solid rgba(247,37,133,0.5)',
              borderRadius: 12, padding: '14px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, color: '#f72585', fontWeight: 700, marginBottom: 12 }}>
                This will reset your rating to 800 and clear all stats. Are you sure?
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleReset}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                    background: '#f72585', color: '#fff', fontSize: 13, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                  }}
                >Yes, Reset</button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#a09cc0', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                  }}
                >Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 16, border: 'none',
            background: name.trim()
              ? 'linear-gradient(135deg, #9b5de5, #f72585)'
              : 'rgba(255,255,255,0.1)',
            color: name.trim() ? '#fff' : '#666',
            fontSize: 17, fontWeight: 900,
            cursor: name.trim() ? 'pointer' : 'default',
            fontFamily: 'Nunito, sans-serif',
            transition: 'all 0.2s',
          }}
        >
          ✅ Save Settings
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, color: '#a09cc0', fontWeight: 800, letterSpacing: 1.5, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>
      {children}
    </div>
  );
}

function ToggleRow({ label, emoji, value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span>{label}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 48, height: 26, borderRadius: 13,
          background: value ? 'linear-gradient(135deg, #9b5de5, #f72585)' : 'rgba(255,255,255,0.12)',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 25 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  );
}

// ─── Supporting Components ────────────────────────────────────────────────────

function StatPill({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#a09cc0', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function MiniChart({ history }) {
  const last = history.slice(-10);
  const min = Math.min(...last.map(h => h.rating)) - 50;
  const max = Math.max(...last.map(h => h.rating)) + 50;
  const range = max - min || 100;
  const W = 280, H = 48;

  const points = last.map((h, i) => {
    const x = (i / (last.length - 1)) * W;
    const y = H - ((h.rating - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ marginTop: 4 }}>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9b5de5" />
            <stop offset="100%" stopColor="#f72585" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="url(#chartGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {last.map((h, i) => {
          const x = (i / (last.length - 1)) * W;
          const y = H - ((h.rating - min) / range) * H;
          return (
            <circle key={i} cx={x} cy={y} r={i === last.length - 1 ? 4 : 2.5}
              fill={i === last.length - 1 ? '#f7c948' : '#9b5de5'} />
          );
        })}
      </svg>
      <div style={{ fontSize: 10, color: '#a09cc0', textAlign: 'center', marginTop: 2 }}>
        Rating history (last {last.length} games)
      </div>
    </div>
  );
}

function NextLevelProgress({ player }) {
  const tiers = TIERS;
  const current = tiers.find(t => player.rating >= t.min && player.rating < t.max) || tiers[tiers.length - 1];
  const pct = Math.min(100, ((player.rating - current.min) / (current.max - current.min)) * 100);
  const next = tiers[tiers.indexOf(current) + 1];

  return (
    <div style={{ width: '100%', maxWidth: 360, marginBottom: 20, animation: 'slide-up 0.9s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#a09cc0', fontWeight: 700 }}>
        <span>{current.emoji} {current.label}</span>
        {next && <span>{next.emoji} {next.label} at {current.max}</span>}
      </div>
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 100, height: 10, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 100,
          background: 'linear-gradient(90deg, #9b5de5, #f72585)',
          transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, color: '#a09cc0', marginTop: 4 }}>
        {player.rating} / {current.max}
      </div>
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 3,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: '50%',
          background: '#fff',
          opacity: 0.3 + Math.random() * 0.4,
          animation: `float ${2 + s.delay}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
}
