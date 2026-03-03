/**
 * YoChess Profile Screen
 * Select or create player profiles — like "signing in" for kids
 */

import { useState } from 'react';
import {
  loadProfiles, loadProfileData, createProfile, deleteProfile, switchToProfile,
  AVATAR_EMOJIS, PROFILE_COLORS,
} from '../engine/profiles';

const BG = 'linear-gradient(145deg, #0d0015 0%, #1a0a3e 60%, #0d0015 100%)';

// ─── Profile Card ─────────────────────────────────────────────────────────────

function ProfileCard({ profile, isSelected, onSelect, onDelete }) {
  const [pressing, setPressing] = useState(false);
  const color = profile.color || '#9b5de5';
  const playerData = loadProfileData(profile.id);

  return (
    <div
      onClick={() => onSelect(profile)}
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
      onMouseLeave={() => setPressing(false)}
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${color}33, ${color}22)`
          : 'rgba(255,255,255,0.04)',
        border: isSelected ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '18px 16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
        transform: pressing ? 'scale(0.97)' : isSelected ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: isSelected
          ? `0 0 0 2px ${color}44, 0 8px 24px ${color}33`
          : '0 2px 8px rgba(0,0,0,0.3)',
        userSelect: 'none',
        minWidth: 110,
        maxWidth: 140,
        flexShrink: 0,
      }}
    >
      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(profile.id); }}
        style={{
          position: 'absolute', top: 6, right: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 14, color: 'rgba(255,100,100,0.6)',
          padding: 2, lineHeight: 1,
          opacity: 0.7,
        }}
        title="Remove profile"
      >
        ✕
      </button>

      {/* Avatar */}
      <div style={{
        fontSize: 42,
        lineHeight: 1,
        background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
        borderRadius: '50%',
        width: 70,
        height: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isSelected ? `0 0 20px ${color}66` : 'none',
        transition: 'box-shadow 0.3s',
      }}>
        {profile.emoji}
      </div>

      {/* Name */}
      <div style={{
        fontWeight: 800,
        fontSize: 15,
        color: isSelected ? '#fff' : 'rgba(255,255,255,0.85)',
        letterSpacing: 0.3,
        textAlign: 'center',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {profile.name}
      </div>

      {/* Rating + games */}
      <div style={{
        background: isSelected ? `${color}55` : 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 700,
        color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
      }}>
        {playerData ? `♟ ${playerData.rating}` : '♟ New!'}
      </div>
      {playerData && playerData.gamesPlayed > 0 && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
          {playerData.gamesPlayed} game{playerData.gamesPlayed !== 1 ? 's' : ''}
        </div>
      )}

      {isSelected && (
        <div style={{
          position: 'absolute', bottom: -10,
          background: color,
          borderRadius: '50%',
          width: 20, height: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: '#fff', fontWeight: 700,
          boxShadow: `0 2px 8px ${color}`,
        }}>
          ✓
        </div>
      )}
    </div>
  );
}

// ─── New Profile Form ─────────────────────────────────────────────────────────

function NewProfileForm({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(AVATAR_EMOJIS[0]);
  const [color, setColor] = useState(PROFILE_COLORS[0].id);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const selectedColor = PROFILE_COLORS.find(c => c.id === color)?.value || '#9b5de5';
    onSave(trimmed, emoji, selectedColor);
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '2px solid rgba(155,93,229,0.4)',
      borderRadius: 24,
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      maxWidth: 400,
      margin: '0 auto',
    }}>
      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', textAlign: 'center' }}>
        Create Profile ✨
      </h3>

      {/* Avatar picker */}
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>
          CHOOSE YOUR AVATAR
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {AVATAR_EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{
                width: 44, height: 44,
                fontSize: 22,
                background: emoji === e ? 'rgba(155,93,229,0.4)' : 'rgba(255,255,255,0.06)',
                border: emoji === e ? '2px solid #9b5de5' : '2px solid transparent',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Name input */}
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>
          YOUR NAME
        </div>
        <input
          value={name}
          onChange={e => setName(e.target.value.slice(0, 16))}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Enter your name..."
          maxLength={16}
          autoFocus
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.08)',
            border: '2px solid rgba(155,93,229,0.4)',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Color picker */}
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>
          PROFILE COLOR
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PROFILE_COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => setColor(c.id)}
              title={c.label}
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                background: c.value,
                border: color === c.id ? '3px solid #fff' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: color === c.id ? `0 0 12px ${c.value}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 14,
            background: 'rgba(255,255,255,0.07)',
            border: '2px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 14,
            background: name.trim() ? 'linear-gradient(135deg,#9b5de5,#7c3aed)' : 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            boxShadow: name.trim() ? '0 4px 16px rgba(124,58,237,0.5)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          Create Profile 🎉
        </button>
      </div>
    </div>
  );
}

// ─── Main Profile Screen ──────────────────────────────────────────────────────

export default function ProfileScreen({ onProfileSelected }) {
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function handleCreate(name, emoji, color) {
    const { profile } = createProfile(name, emoji, color);
    const updated = loadProfiles();
    setProfiles(updated);
    setSelectedId(profile.id);
    setShowCreate(false);
  }

  function handleDelete(profileId) {
    setDeleteConfirm(profileId);
  }

  function confirmDelete(profileId) {
    deleteProfile(profileId);
    const updated = loadProfiles();
    setProfiles(updated);
    if (selectedId === profileId) setSelectedId(null);
    setDeleteConfirm(null);
  }

  function handlePlay() {
    if (!selectedId) return;
    const updatedProfiles = loadProfiles();
    const playerData = switchToProfile(selectedId, updatedProfiles);
    onProfileSelected(selectedId, playerData);
  }

  const selectedProfile = profiles.find(p => p.id === selectedId);

  return (
    <div style={{
      minHeight: '100dvh',
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(155,93,229,0.18) 0%, transparent 70%)',
        top: '10%', left: '20%', transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(76,201,240,0.12) 0%, transparent 70%)',
        bottom: '15%', right: '15%',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>♟️</div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(26px, 6vw, 34px)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: -0.5,
          }}>
            Who's Playing?
          </h1>
          <p style={{
            margin: '8px 0 0',
            fontSize: 15,
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 500,
          }}>
            Pick your profile or create a new one
          </p>
        </div>

        {/* Show create form OR profile list */}
        {showCreate ? (
          <NewProfileForm
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        ) : (
          <>
            {/* Profile cards */}
            {profiles.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 15,
                padding: '32px 0',
              }}>
                No profiles yet — create your first one! 👇
              </div>
            ) : (
              <div style={{
                display: 'flex',
                gap: 14,
                overflowX: 'auto',
                padding: '10px 4px 20px',
                justifyContent: profiles.length <= 3 ? 'center' : 'flex-start',
                scrollbarWidth: 'none',
              }}>
                {profiles.map(profile => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    isSelected={selectedId === profile.id}
                    onSelect={p => setSelectedId(p.id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* New Profile button */}
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '14px',
                background: 'rgba(255,255,255,0.05)',
                border: '2px dashed rgba(155,93,229,0.5)',
                borderRadius: 16,
                color: 'rgba(155,93,229,0.9)',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 20,
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 20 }}>+</span>
              New Profile
            </button>

            {/* Play button */}
            <button
              onClick={handlePlay}
              disabled={!selectedId}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: 18,
                background: selectedId
                  ? `linear-gradient(135deg, ${selectedProfile?.color || '#9b5de5'}, ${selectedProfile?.color ? selectedProfile.color + 'cc' : '#7c3aed'})`
                  : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                fontSize: 18,
                fontWeight: 900,
                cursor: selectedId ? 'pointer' : 'not-allowed',
                letterSpacing: 0.5,
                fontFamily: 'inherit',
                boxShadow: selectedId ? `0 6px 24px ${selectedProfile?.color || '#9b5de5'}66` : 'none',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                transform: selectedId ? 'scale(1)' : 'scale(0.97)',
              }}
            >
              {selectedId
                ? `Play as ${selectedProfile?.emoji} ${selectedProfile?.name}!`
                : 'Select a profile to play'}
            </button>
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20,
        }}>
          <div style={{
            background: '#1a0a3e',
            border: '2px solid rgba(255,100,100,0.5)',
            borderRadius: 20,
            padding: '28px 24px',
            maxWidth: 320,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: 18 }}>
              Delete this profile?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', fontSize: 14 }}>
              All progress for{' '}
              <strong style={{ color: '#fff' }}>
                {profiles.find(p => p.id === deleteConfirm)?.name}
              </strong>{' '}
              will be lost forever.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirm)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  background: 'rgba(255,60,60,0.3)',
                  border: '2px solid rgba(255,100,100,0.5)',
                  color: '#ff8888', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
