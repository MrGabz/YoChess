import { useState, useRef, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';

const BORIS_SYSTEM_PROMPT = `You are Boris, a friendly and encouraging grandmaster chess coach for kids and beginners. You have 40 years of teaching experience and love making chess fun and easy to understand.

Your personality:
- Warm, patient, and enthusiastic about chess
- Use simple language kids and beginners can understand
- Give practical tips they can use RIGHT NOW in their games
- Use chess emojis (♟️♔♕♖♗♘) to make things visual
- Keep answers concise but helpful (2-4 short paragraphs max)
- Celebrate their questions and progress
- Use analogies to everyday life to explain chess concepts
- Always end with an encouraging nudge or fun challenge

Topics you cover:
- Chess piece movements and rules
- Basic tactics (forks, pins, skewers, discovered attacks)
- Opening principles (control center, develop pieces, king safety)
- Endgame basics (king and pawn, rook endgames)
- How to improve and study chess
- Fun chess facts and history
- How to analyze their own games
- Mental game and staying focused

Remember: You're talking to kids and beginners. Keep it fun, positive, and simple!`;

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function ChatBorisScreen({ player, onBack }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${player?.name || 'there'}! 🎩 I'm Boris, your personal chess coach! I've been playing chess for over 40 years and I LOVE teaching it.\n\nAsk me anything — openings, tactics, how pieces move, how to get better, or even fun chess history! What's on your mind? ♟️`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const QUICK_QUESTIONS = [
    '♟️ How do I start a game?',
    '🏰 What is castling?',
    '⚡ What is a fork?',
    '📍 What is a pin?',
    '♛ How does the Queen move?',
    '🎯 How do I checkmate?',
    '📈 How do I get better?',
    '🤔 What opening should I learn?',
  ];

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Build API messages (skip the greeting as it's our injected one)
    const apiMessages = newMessages
      .slice(1) // skip the initial Boris greeting
      .map(m => ({ role: m.role, content: m.content }));

    // Placeholder for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '', _streaming: true }]);

    try {
      const stream = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: BORIS_SYSTEM_PROMPT,
        messages: apiMessages,
        stream: true,
      });

      let fullText = '';
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: fullText, _streaming: true };
            return updated;
          });
        }
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: fullText };
        return updated;
      });
    } catch (err) {
      console.error('Boris chat error:', err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "Hmm, I'm having a bit of trouble connecting right now. Try asking me again! ♟️",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid rgba(155,93,229,0.3)',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10,
            color: '#fff',
            fontSize: 18,
            width: 36,
            height: 36,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ←
        </button>

        {/* Boris avatar */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #9b5de5, #f72585)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(155,93,229,0.5)',
        }}>
          🎩
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>Boris the Coach</div>
          <div style={{ color: '#9b5de5', fontSize: 12, fontWeight: 700 }}>
            {isLoading ? '✍️ Thinking...' : '♟️ Grandmaster Coach • Always here to help'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {/* Quick question chips — show only after greeting */}
        {messages.length === 1 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ color: '#a09cc0', fontSize: 12, fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>
              — OR TRY A QUICK QUESTION —
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  style={{
                    background: 'rgba(155,93,229,0.15)',
                    border: '1px solid rgba(155,93,229,0.4)',
                    borderRadius: 20,
                    color: '#c4b5fd',
                    fontSize: 13,
                    fontWeight: 700,
                    padding: '7px 14px',
                    cursor: 'pointer',
                    fontFamily: 'Nunito, sans-serif',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(155,93,229,0.35)';
                    e.currentTarget.style.borderColor = '#9b5de5';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(155,93,229,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(155,93,229,0.4)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(155,93,229,0.25)',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Boris anything about chess..."
            rows={1}
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(155,93,229,0.35)',
              borderRadius: 14,
              color: '#fff',
              fontSize: 15,
              fontFamily: 'Nunito, sans-serif',
              padding: '12px 16px',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.4,
              maxHeight: 120,
              overflowY: 'auto',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              border: 'none',
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, #9b5de5, #f72585)'
                : 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 20,
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
        <p style={{ color: '#5a5580', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isBoris = msg.role === 'assistant';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isBoris ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
      gap: 10,
      maxWidth: '85%',
      alignSelf: isBoris ? 'flex-start' : 'flex-end',
    }}>
      {isBoris && (
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #9b5de5, #f72585)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
          marginTop: 2,
        }}>
          🎩
        </div>
      )}

      <div style={{
        background: isBoris
          ? 'rgba(155,93,229,0.15)'
          : 'linear-gradient(135deg, #9b5de5, #f72585)',
        border: isBoris ? '1px solid rgba(155,93,229,0.35)' : 'none',
        borderRadius: isBoris ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
        padding: '12px 16px',
        color: '#fff',
        fontSize: 15,
        lineHeight: 1.55,
        fontFamily: 'Nunito, sans-serif',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content || (msg._streaming && <span style={{ opacity: 0.5 }}>▊</span>)}
      </div>
    </div>
  );
}
