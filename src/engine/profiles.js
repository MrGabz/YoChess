/**
 * YoChess Profile System
 * Supports multiple player profiles with localStorage hot-swap
 */

import { newPlayer } from './glicko2';

const PROFILES_KEY = 'yochess_profiles';
const ACTIVE_KEY = 'yochess_active_profile';
const PLAYER_KEY = 'yochess_player';

function profileDataKey(id) {
  return `yochess_player_${id}`;
}

// ─── Profile list management ──────────────────────────────────────────────────

export function loadProfiles() {
  try {
    const s = localStorage.getItem(PROFILES_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {}
}

export function getActiveProfileId() {
  try {
    return localStorage.getItem(ACTIVE_KEY) || null;
  } catch {
    return null;
  }
}

// ─── Profile data (player stats) ─────────────────────────────────────────────

export function loadProfileData(profileId) {
  try {
    const s = localStorage.getItem(profileDataKey(profileId));
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function saveProfileData(profileId, playerData) {
  try {
    localStorage.setItem(profileDataKey(profileId), JSON.stringify(playerData));
  } catch {}
}

// ─── Profile switch ───────────────────────────────────────────────────────────

/**
 * Switch to a profile:
 * 1. Save current player data to current profile slot (if any active)
 * 2. Load target profile data into yochess_player
 * 3. Set active profile
 */
export function switchToProfile(newProfileId, profiles) {
  // Save current active profile data first
  const currentId = getActiveProfileId();
  if (currentId) {
    try {
      const currentData = localStorage.getItem(PLAYER_KEY);
      if (currentData) {
        localStorage.setItem(profileDataKey(currentId), currentData);
      }
    } catch {}
  }

  // Load target profile data
  const profile = profiles.find(p => p.id === newProfileId);
  let profileData = loadProfileData(newProfileId);
  if (!profileData) {
    profileData = newPlayer(profile?.name || 'Champion');
  }

  try {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(profileData));
    localStorage.setItem(ACTIVE_KEY, newProfileId);
  } catch {}

  return profileData;
}

// ─── Create new profile ───────────────────────────────────────────────────────

export function createProfile(name, emoji, color) {
  const id = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const profile = { id, name, emoji, color, created: Date.now() };

  const profiles = loadProfiles();
  profiles.push(profile);
  saveProfiles(profiles);

  // Create fresh player data for this profile
  const playerData = newPlayer(name);
  saveProfileData(id, playerData);

  return { profile, playerData };
}

// ─── Delete profile ───────────────────────────────────────────────────────────

export function deleteProfile(profileId) {
  let profiles = loadProfiles();
  profiles = profiles.filter(p => p.id !== profileId);
  saveProfiles(profiles);

  try {
    localStorage.removeItem(profileDataKey(profileId));
  } catch {}

  // If deleting active profile, clear active
  if (getActiveProfileId() === profileId) {
    try {
      localStorage.removeItem(ACTIVE_KEY);
      localStorage.removeItem(PLAYER_KEY);
    } catch {}
  }
}

// ─── Get current profile data (live) ─────────────────────────────────────────

export function getCurrentProfileData() {
  try {
    const s = localStorage.getItem(PLAYER_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

// ─── Avatar options ───────────────────────────────────────────────────────────

export const AVATAR_EMOJIS = [
  '🦁', '🐯', '🦊', '🐺', '🦅', '🐉', '🦄', '🐙',
  '🤖', '👾', '🧙', '⚡', '🌟', '🔥', '🏆', '♟️',
];

export const PROFILE_COLORS = [
  { id: 'purple', value: '#9b5de5', label: 'Purple' },
  { id: 'blue',   value: '#4cc9f0', label: 'Blue' },
  { id: 'green',  value: '#4ade80', label: 'Green' },
  { id: 'orange', value: '#f97316', label: 'Orange' },
  { id: 'pink',   value: '#f472b6', label: 'Pink' },
  { id: 'gold',   value: '#fbbf24', label: 'Gold' },
];
