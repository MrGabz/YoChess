import { getRatingLabel } from '../engine/glicko2';
import { AI_LEVELS } from '../engine/aiEngine';

export default function ParentDashboard({ player, onBack }) {
  const ratingInfo = getRatingLabel(player.rating);
  const winRate = player.gamesPlayed > 0
    ? Math.round((player.wins / player.gamesPlayed) * 100)
    : 0;

  const recentHistory = player.history.slice(-10);
  const recentTrend = recentHistory.length >= 2
    ? recentHistory[recentHistory.length - 1].rating - recentHistory[0].rating
    : 0;

  // Plain-language skill assessment
  function getSkillSummary() {
    const r = player.rating;
    if (r < 400) return {
      summary: `${player.name} is just starting out and learning how the pieces move. This is a great time to play together and explain why pieces move the way they do!`,
      focusArea: 'Learning how each piece moves',
      nextGoal: 'Win their first game against Pixel (the easiest AI)',
      parentTip: 'Sit together and name the pieces. Ask "where can this piece move?" before each turn.',
    };
    if (r < 700) return {
      summary: `${player.name} understands how all the pieces move and is starting to capture pieces on purpose! They're building good habits.`,
      focusArea: 'Remembering to keep pieces safe',
      nextGoal: 'Reach a 600 rating by beating Nugget',
      parentTip: 'Before their move, ask "Is any of your pieces in danger?" This habit prevents most losses at this level.',
    };
    if (r < 1000) return {
      summary: `${player.name} is playing real chess! They think about what the opponent might do and try to make plans. They're doing great!`,
      focusArea: 'Planning 2-3 moves ahead',
      nextGoal: 'Try beating Sparky or Rocky and crack the 1000 rating!',
      parentTip: 'Encourage them to say their plan out loud: "I\'m moving here because..." This builds strategic thinking.',
    };
    if (r < 1300) return {
      summary: `${player.name} is a serious chess player now! They understand tactics like forks and pins and can outplay beginners consistently.`,
      focusArea: 'Tactical combinations (forks, pins, skewers)',
      nextGoal: 'Reach Chess Wizard level and beat Blaze',
      parentTip: 'Consider a chess club or local tournament — they\'re ready for real competition!',
    };
    return {
      summary: `${player.name} is an advanced player with a strong understanding of strategy and tactics. They could compete in youth tournaments!`,
      focusArea: 'Opening theory and endgame technique',
      nextGoal: 'Beat Cosmos (the hardest AI) or enter a rated tournament',
      parentTip: 'Look into USCF membership for official tournament ratings. They\'re ready!',
    };
  }

  const skillSummary = getSkillSummary();

  // Determine favorite opponent
  const favoriteLevel = AI_LEVELS[Math.min(
    Math.floor(player.rating / 250),
    AI_LEVELS.length - 1
  )];

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
        <button onClick={onBack} style={btnStyle}>← Back</button>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 900 }}>
          👪 Parent Dashboard
        </h2>
        <div style={{ width: 70 }} />
      </div>

      {/* Player overview */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `linear-gradient(135deg, ${ratingInfo.color}, #9b5de5)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, flexShrink: 0,
          }}>
            {ratingInfo.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 20 }}>{player.name}</div>
            <div style={{
              display: 'inline-block',
              background: ratingInfo.color + '33',
              border: `1px solid ${ratingInfo.color}`,
              borderRadius: 20, padding: '2px 10px',
              fontSize: 12, fontWeight: 700, color: ratingInfo.color,
            }}>{ratingInfo.label}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#9b5de5' }}>{player.rating}</div>
            <div style={{ fontSize: 11, color: '#a09cc0' }}>Glicko-2 Rating</div>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 520, marginBottom: 16 }}>
        <StatCard label="Games Played" value={player.gamesPlayed} icon="🎯" color="#4cc9f0" />
        <StatCard label="Win Rate" value={`${winRate}%`} icon="🏆" color="#4ade80" />
        <StatCard
          label="Trend"
          value={recentTrend >= 0 ? `+${recentTrend}` : recentTrend}
          icon={recentTrend >= 0 ? '📈' : '📉'}
          color={recentTrend >= 0 ? '#4ade80' : '#f72585'}
          sub="last 10 games"
        />
      </div>

      {/* W/L/D breakdown */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Game Results</SectionTitle>
        <div style={{ display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden', height: 24, marginBottom: 8 }}>
          {player.gamesPlayed > 0 && (
            <>
              <div style={{ flex: player.wins, background: '#4ade80', minWidth: player.wins > 0 ? 4 : 0 }} />
              <div style={{ flex: player.draws, background: '#4cc9f0', minWidth: player.draws > 0 ? 4 : 0 }} />
              <div style={{ flex: player.losses, background: '#f72585', minWidth: player.losses > 0 ? 4 : 0 }} />
            </>
          )}
          {player.gamesPlayed === 0 && (
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#4ade80', fontWeight: 700 }}>✅ {player.wins} wins</span>
          <span style={{ color: '#4cc9f0', fontWeight: 700 }}>🤝 {player.draws} draws</span>
          <span style={{ color: '#f72585', fontWeight: 700 }}>❌ {player.losses} losses</span>
        </div>
      </Card>

      {/* Rating history chart */}
      {player.history.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Rating Progress</SectionTitle>
          <RatingChart history={player.history} />
        </Card>
      )}

      {/* Plain-language summary */}
      <Card style={{ marginBottom: 16, background: 'rgba(155,93,229,0.1)', borderColor: 'rgba(155,93,229,0.3)' }}>
        <SectionTitle icon="🧙">Skill Summary (for parents)</SectionTitle>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#c0b8e0', marginBottom: 12 }}>
          {skillSummary.summary}
        </p>
        <InfoRow icon="🎯" label="Currently working on" value={skillSummary.focusArea} />
        <InfoRow icon="🚀" label="Next goal" value={skillSummary.nextGoal} />
        <div style={{
          marginTop: 12, background: 'rgba(247,201,72,0.1)',
          border: '1px solid rgba(247,201,72,0.3)',
          borderRadius: 10, padding: '10px 12px',
          fontSize: 13, color: '#f7c948', lineHeight: 1.6,
        }}>
          <strong>💡 Parent Tip:</strong> {skillSummary.parentTip}
        </div>
      </Card>

      {/* Difficulty breakdown */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle icon="🤖">AI Opponents Unlocked</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {AI_LEVELS.map(level => {
            const unlocked = player.rating >= level.rating - 300;
            return (
              <div key={level.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                opacity: unlocked ? 1 : 0.4,
                padding: '6px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: 20 }}>{level.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: level.color }}>{level.name}</div>
                  <div style={{ fontSize: 11, color: '#a09cc0' }}>{level.description}</div>
                </div>
                <div style={{ fontSize: 12, color: '#a09cc0' }}>Rating {level.rating}</div>
                {unlocked
                  ? <span style={{ color: '#4ade80', fontSize: 14 }}>✅</span>
                  : <span style={{ color: '#666', fontSize: 12 }}>🔒</span>
                }
              </div>
            );
          })}
        </div>
      </Card>

      {/* About the rating system */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle icon="📊">About the Glicko-2 Rating System</SectionTitle>
        <p style={{ fontSize: 13, color: '#a09cc0', lineHeight: 1.7 }}>
          YoChess uses the <strong style={{ color: '#fff' }}>Glicko-2 rating system</strong> — the same system used by Lichess and Chess.com.
          It's more accurate than simple ELO because it tracks <em>rating confidence</em>: a player with fewer games
          has more uncertainty, so their rating changes more dramatically until it stabilizes.
        </p>
        <p style={{ fontSize: 13, color: '#a09cc0', lineHeight: 1.7, marginTop: 8 }}>
          We start kids at <strong style={{ color: '#f7c948' }}>800</strong> (not 1500 like Lichess) to make early wins
          feel achievable and prevent rapid early rating drops that discourage beginners.
        </p>
      </Card>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      width: '100%', maxWidth: 520,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, padding: '16px 18px',
      animation: 'slide-up 0.4s ease',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, icon }) {
  return (
    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: '#9b5de5', display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon && <span>{icon}</span>}{children}
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14, padding: '12px 10px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#a09cc0', fontWeight: 700 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: '#666' }}>{sub}</div>}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, fontSize: 13 }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <div>
        <span style={{ color: '#a09cc0', fontWeight: 700 }}>{label}: </span>
        <span style={{ color: '#fff' }}>{value}</span>
      </div>
    </div>
  );
}

function RatingChart({ history }) {
  const data = history.slice(-20);
  const W = 460, H = 80;
  const min = Math.min(...data.map(h => h.rating)) - 30;
  const max = Math.max(...data.map(h => h.rating)) + 30;
  const range = max - min || 100;

  const points = data.map((h, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((h.rating - min) / range) * H;
    return [x, y];
  });

  const polyline = points.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `${points[0][0]},${H} ${polyline} ${points[points.length - 1][0]},${H}`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W} height={H + 20} style={{ display: 'block', minWidth: W }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9b5de5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#9b5de5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9b5de5" />
            <stop offset="100%" stopColor="#f72585" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#areaGrad)" />
        <polyline points={polyline} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 5 : 3}
            fill={i === points.length - 1 ? '#f7c948' : '#9b5de5'} />
        ))}
        {/* Labels */}
        <text x={0} y={H + 16} fontSize={10} fill="#a09cc0">{data[0]?.rating}</text>
        <text x={W} y={H + 16} fontSize={10} fill="#f7c948" textAnchor="end">
          {data[data.length - 1]?.rating}
        </text>
      </svg>
    </div>
  );
}

const btnStyle = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 12, padding: '8px 16px',
  color: '#fff', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
};
