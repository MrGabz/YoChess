import { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import LevelSelectScreen from './screens/LevelSelectScreen';
import GameScreen from './screens/GameScreen';
import ParentDashboard from './screens/ParentDashboard';
import ProfileScreen from './screens/ProfileScreen';
import ChatBorisScreen from './screens/ChatBorisScreen';
import PuzzleScreen from './screens/PuzzleScreen';
import { getActiveProfileId, loadProfiles, getCurrentProfileData } from './engine/profiles';

const PLAYER_KEY = 'yochess_player';
function savePlayerToStorage(p) {
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); } catch {}
}

function loadCurrentPlayer() {
  return getCurrentProfileData();
}

export default function App() {
  // On first load: check if there's an active profile
  const [screen, setScreen] = useState(() => {
    const activeId = getActiveProfileId();
    const profiles = loadProfiles();
    // If no profiles exist yet OR no active profile, show profile picker
    if (!activeId || !profiles.find(p => p.id === activeId)) return 'profile';
    return 'home';
  });

  const [gameConfig, setGameConfig] = useState({ aiLevelId: 'sparky', playerColor: 'w', calibration: false });
  const [player, setPlayer] = useState(() => loadCurrentPlayer());

  // Sync player from localStorage (and profile data) whenever we return to home
  function goHome() {
    setPlayer(loadCurrentPlayer());
    setScreen('home');
  }

  function handleProfileSelected(profileId, playerData) {
    setPlayer(playerData);
    setScreen('home');
  }

  function handleStartGame(aiLevelId) {
    if (aiLevelId) {
      setGameConfig({ aiLevelId, playerColor: 'w', calibration: false });
      setScreen('game');
    } else {
      setScreen('levelSelect');
    }
  }

  function handleLevelSelect(aiLevelId, playerColor) {
    setGameConfig({ aiLevelId, playerColor, calibration: false });
    setScreen('game');
  }

  function handleFindRating() {
    // Calibration game: Rocky (900) is a solid mid-level reference point
    setGameConfig({ aiLevelId: 'rocky', playerColor: 'w', calibration: true });
    setScreen('game');
  }

  function handleSaveSettings(updatedPlayer) {
    savePlayerToStorage(updatedPlayer);
    setPlayer(updatedPlayer);
  }

  if (screen === 'profile') {
    return (
      <ProfileScreen
        onProfileSelected={handleProfileSelected}
      />
    );
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        player={player}
        onStartGame={handleStartGame}
        onParentDashboard={() => setScreen('parent')}
        onSwitchProfile={() => setScreen('profile')}
        onFindRating={handleFindRating}
        onSaveSettings={handleSaveSettings}
        onChatBoris={() => setScreen('chatBoris')}
        onPuzzles={() => setScreen('puzzles')}
      />
    );
  }

  if (screen === 'puzzles') {
    return (
      <PuzzleScreen
        player={player}
        onBack={goHome}
      />
    );
  }

  if (screen === 'chatBoris') {
    return (
      <ChatBorisScreen
        player={player}
        onBack={goHome}
      />
    );
  }

  if (screen === 'levelSelect') {
    return (
      <LevelSelectScreen
        player={player}
        onSelect={handleLevelSelect}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'game') {
    return (
      <GameScreen
        aiLevelId={gameConfig.aiLevelId}
        playerColor={gameConfig.playerColor}
        calibrationMode={gameConfig.calibration}
        onBack={() => setScreen('levelSelect')}
        onHome={goHome}
      />
    );
  }

  if (screen === 'parent') {
    return (
      <ParentDashboard
        player={player}
        onBack={goHome}
      />
    );
  }

  return null;
}
