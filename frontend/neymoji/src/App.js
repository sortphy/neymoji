import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Play, RotateCcw, Trophy, Clock, Target, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// ⏱️ Backend agora usa 10 s por rodada
const ROUND_DURATION = 10;

const EmojiGuessingGame = () => {
  /* ---------- Refs ---------- */
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  /* ---------- State ---------- */
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [gameState, setGameState] = useState({
    gameActive: false,
    currentEmoji: null,
    currentRound: 0,
    score: 0,
    totalRounds: 10,
    timeLeft: ROUND_DURATION
  });
  const [freezeFrames, setFreezeFrames] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [showSuccessEffect, setShowSuccessEffect] = useState(false);
  const [showFailEffect, setShowFailEffect] = useState(false);

  // Styles object
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #312e81 100%)',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    },
    backgroundEffect: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      zIndex: 0
    },
    backgroundCircle1: {
      position: 'absolute',
      top: '-16px',
      right: '-16px',
      width: '288px',
      height: '288px',
      background: 'rgba(168, 85, 247, 0.2)',
      borderRadius: '50%',
      filter: 'blur(60px)',
      animation: 'pulse 3s ease-in-out infinite'
    },
    backgroundCircle2: {
      position: 'absolute',
      bottom: '-32px',
      left: '-16px',
      width: '288px',
      height: '288px',
      background: 'rgba(59, 130, 246, 0.2)',
      borderRadius: '50%',
      filter: 'blur(60px)',
      animation: 'pulse 3s ease-in-out infinite 1s'
    },
    backgroundCircle3: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '384px',
      height: '384px',
      background: 'rgba(99, 102, 241, 0.1)',
      borderRadius: '50%',
      filter: 'blur(60px)',
      animation: 'pulse 3s ease-in-out infinite 2s'
    },
    content: {
      position: 'relative',
      zIndex: 10,
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 16px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    title: {
      fontSize: '3.75rem',
      fontWeight: 'bold',
      background: 'linear-gradient(to right, #f472b6, #a855f7)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '16px'
    },
    subtitle: {
      fontSize: '1.25rem',
      color: '#d1d5db'
    },
    gameStats: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '24px'
    },
    statsContainer: {
      display: 'flex',
      gap: '32px',
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '32px'
    },
    mainGridLarge: {
      gridTemplateColumns: '2fr 1fr'
    },
    webcamSection: {
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    videoContainer: {
      position: 'relative'
    },
    videoPlaceholder: {
      aspectRatio: '16/9',
      background: '#374151',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    video: {
      width: '100%',
      aspectRatio: '16/9',
      background: '#111827',
      borderRadius: '12px'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
      padding: '16px 32px',
      borderRadius: '12px',
      fontWeight: '600',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: 'scale(1)'
    },
    buttonHover: {
      background: 'linear-gradient(to right, #2563eb, #7c3aed)',
      transform: 'scale(1.05)'
    },
    buttonDisabled: {
      background: 'linear-gradient(to right, #6b7280, #6b7280)',
      cursor: 'not-allowed',
      transform: 'scale(1)'
    },
    overlay: {
      position: 'absolute',
      top: '16px',
      left: '16px',
      right: '16px',
      display: 'flex',
      justifyContent: 'space-between'
    },
    liveIndicator: {
      background: '#ef4444',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      animation: 'pulse 2s ease-in-out infinite'
    },
    analyzingIndicator: {
      background: '#eab308',
      color: 'black',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.875rem',
      fontWeight: 'bold'
    },
    countdownOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    countdownNumber: {
      fontSize: '5rem',
      fontWeight: 'bold',
      color: 'white',
      animation: 'ping 1s ease-in-out infinite'
    },
    sidePanel: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    card: {
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center'
    },
    challengeEmoji: {
      fontSize: '5rem',
      marginBottom: '16px',
      animation: 'bounce 2s ease-in-out infinite'
    },
    challengeName: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#fbbf24'
    },
    progressBar: {
      marginTop: '16px'
    },
    progressBarBg: {
      background: '#374151',
      borderRadius: '9999px',
      height: '8px'
    },
    progressBarFill: {
      background: 'linear-gradient(to right, #10b981, #3b82f6)',
      height: '8px',
      borderRadius: '9999px',
      transition: 'all 0.3s ease'
    },
    resultCard: {
      background: 'rgba(34, 197, 94, 0.2)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      padding: '16px',
      textAlign: 'center'
    },
    gameOverCard: {
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center'
    },
    freezeFramesGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px'
    },
    freezeFrame: {
      position: 'relative',
      cursor: 'pointer'
    },
    freezeFrameImg: {
  width: '100%',
  aspectRatio: '1 / 1', // <-- makes it square
  objectFit: 'cover',
  borderRadius: '8px',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  transition: 'border-color 0.3s ease'
},
    freezeFrameImgHover: {
      borderColor: 'rgba(255, 255, 255, 0.5)'
    },
    freezeFrameEmoji: {
      position: 'absolute',
      top: '4px',
      left: '4px',
      fontSize: '0.75rem',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '2px 8px',
      borderRadius: '4px'
    },
    instructions: {
      marginTop: '48px',
      background: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(8px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    instructionsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '16px'
    },
    instructionsGridMd: {
      gridTemplateColumns: '1fr 1fr 1fr'
    },
    instructionItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      fontSize: '0.875rem'
    }
  };


  /* ---------- Webcam ---------- */
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      setIsWebcamActive(true);
    } catch (err) {
      console.error('Error accessing webcam:', err);
      alert('Unable to access webcam. Please allow camera permissions.');
    }
  };

useEffect(() => {
    if (isWebcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => videoRef.current.play();
    }
  }, [isWebcamActive]);

  // Capture frame from video
  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  }, []);

  /* ---------- Efeitos Visuais ---------- */
  useEffect(() => {
    if (showSuccessEffect) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      const t = setTimeout(() => setShowSuccessEffect(false), 1500);
      return () => clearTimeout(t);
    }
  }, [showSuccessEffect]);


  // Start new game
  const startGame = async () => {
    // 3‑second countdown
    setCountdown(3);
    const cd = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(cd);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // start after countdown
    setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:5000/start_game', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        if (data.success) {
          setGameState({
            gameActive: true,
            currentEmoji: data.game_state.current_emoji,
            currentRound: data.game_state.current_round,
            score: data.game_state.score,
            totalRounds: data.game_state.total_rounds,
            timeLeft: data.game_state.time_left
          });
          setGameOver(false);
          setFreezeFrames([]);
          setLastResult('');
        }
      } catch (err) {
        console.error('Failed to start game:', err);
        alert('Failed to connect to game server. Make sure the Python backend is running on port 5000.');
      }
    }, 3000);
  };

  // Check current frame
  const checkFrame = useCallback(async () => {
    if (!gameState.gameActive || isChecking) return;
    const frame = captureFrame();
    if (!frame) return;

    setIsChecking(true);
    try {
      const res = await fetch('http://localhost:5000/check_frame', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ frame })
      });
      const data = await res.json();

      if (data.success) {
        if (data.game_over) {
          setGameOver(true);
          setGameState(prev => ({ ...prev, gameActive: false }));
          if (data.freeze_frames) setFreezeFrames(data.freeze_frames);
        } else if (data.expression_matched) {
          // ✅ Acertou
          setLastResult('🎉 Perfect! +100 points');
          setShowSuccessEffect(true);

          if (data.freeze_frame) {
            setFreezeFrames(prev => [...prev, { round: gameState.currentRound, emoji: gameState.currentEmoji, image: data.freeze_frame }]);
          }

          setGameState({
            gameActive: true,
            currentEmoji: data.game_state.current_emoji,
            currentRound: data.game_state.current_round,
            score: data.game_state.score,
            totalRounds: data.game_state.total_rounds,
            timeLeft: data.game_state.time_left
          });
        } else if (data.round_timeout) {
          // ❌ Errou/Tempo esgotou
          setLastResult('⏰ Time\'s up! Next round...');
          setShowFailEffect(true);
          setGameState({
            gameActive: true,
            currentEmoji: data.game_state.current_emoji,
            currentRound: data.game_state.current_round,
            score: data.game_state.score,
            totalRounds: data.game_state.total_rounds,
            timeLeft: data.game_state.time_left
          });
        } else {
          // atualização normal de tempo
          setGameState(prev => ({ ...prev, timeLeft: data.game_state.time_left }));
        }
      }
    } catch (err) {
      console.error('Failed to check frame:', err);
    }
    setIsChecking(false);
  }, [gameState, isChecking, captureFrame]);

  // Auto-check frames during game
useEffect(() => {
    if (gameState.gameActive && isWebcamActive) {
      const interval = setInterval(checkFrame, 500);
      return () => clearInterval(interval);
    }
  }, [gameState.gameActive, isWebcamActive, checkFrame]);

  // Clear last result after 3 seconds
  useEffect(() => {
    if (lastResult) {
      const timeout = setTimeout(() => setLastResult(''), 3000);
      return () => clearTimeout(timeout);
    }
  }, [lastResult]);

    useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5}}@keyframes bounce{0%,20%,53%,80%,100%{transform:translate3d(0,0,0);}40%,43%{transform:translate3d(0,-20px,0);}70%{transform:translate3d(0,-10px,0);}90%{transform:translate3d(0,-4px,0);} }@keyframes ping{75%,100%{transform:scale(2);opacity:0;}}`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
        40%, 43% { transform: translate3d(0,-20px,0); }
        70% { transform: translate3d(0,-10px,0); }
        90% { transform: translate3d(0,-4px,0); }
      }
      @keyframes ping {
        75%, 100% { transform: scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
  <div style={styles.container}>
    {/* Confetti overlay (canvas-confetti desenha direto no canvas, aqui só placeholder para controle z-index) */}
    {showSuccessEffect && (
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999 }} />
    )}

    {/* X vermelho overlay (overlay semi-transparente vermelho com X grande no centro) */}
    {showFailEffect && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(255,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 998,
        }}
      >
        <XCircle size={160} color="white" />
      </div>
    )}

    {/* --- Seu conteúdo atual do componente começa aqui --- */}

    {/* Animated Background */}
    <div style={styles.backgroundEffect}>
      <div style={styles.backgroundCircle1}></div>
      <div style={styles.backgroundCircle2}></div>
      <div style={styles.backgroundCircle3}></div>
    </div>

    <div style={styles.content}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🎭 Emoji Face Game</h1>
        <p style={styles.subtitle}>Make the emoji expression with your face!</p>
      </div>

      {/* Game Stats */}
      {gameState.gameActive && (
        <div style={styles.gameStats}>
          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <Target size={20} color="#10b981" />
              <span>
                Round {gameState.currentRound}/{gameState.totalRounds}
              </span>
            </div>
            <div style={styles.statItem}>
              <Trophy size={20} color="#fbbf24" />
              <span>{gameState.score} points</span>
            </div>
            <div style={styles.statItem}>
              <Clock size={20} color="#ef4444" />
              <span>{Math.ceil(gameState.timeLeft)}s</span>
            </div>
          </div>
        </div>
      )}

      <div
        style={
          window.innerWidth >= 1024
            ? { ...styles.mainGrid, ...styles.mainGridLarge }
            : styles.mainGrid
        }
      >
        {/* Webcam Section */}
        <div style={styles.webcamSection}>
          <div style={styles.videoContainer}>
            {!isWebcamActive ? (
              <div style={styles.videoPlaceholder}>
                <button
                  onClick={startWebcam}
                  style={styles.button}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
                  onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
                >
                  <Camera size={24} />
                  Start Camera
                </button>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Overlay indicators */}
                {gameState.gameActive && (
                  <div style={styles.overlay}>
                    <div style={styles.liveIndicator}>LIVE</div>
                    {isChecking && <div style={styles.analyzingIndicator}>Analyzing...</div>}
                  </div>
                )}

                {/* Countdown overlay */}
                {countdown && (
                  <div style={styles.countdownOverlay}>
                    <div style={styles.countdownNumber}>{countdown}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Game Panel */}
        <div style={styles.sidePanel}>
          {/* Current Challenge */}
          {gameState.gameActive && gameState.currentEmoji ? (
            <div style={styles.card}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>
                Make This Expression:
              </h3>
              <div style={styles.challengeEmoji}>{gameState.currentEmoji.emoji}</div>
              <p style={styles.challengeName}>{gameState.currentEmoji.name}</p>

              {/* Progress Bar */}
              <div style={styles.progressBar}>
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${(gameState.timeLeft / ROUND_DURATION) * 100}%`, // Usar constante ROUND_DURATION para tempo de cada round
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ) : !gameOver && (
            <div style={styles.card}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px' }}>Ready to Play?</h3>
              <button
                onClick={startGame}
                disabled={!isWebcamActive || countdown !== null}
                style={
                  !isWebcamActive || countdown !== null
                    ? { ...styles.button, ...styles.buttonDisabled }
                    : { ...styles.button, background: 'linear-gradient(to right, #10b981, #3b82f6)' }
                }
                onMouseEnter={(e) => {
                  if (isWebcamActive && countdown === null) {
                    Object.assign(e.target.style, { background: 'linear-gradient(to right, #059669, #2563eb)' });
                  }
                }}
                onMouseLeave={(e) => {
                  if (isWebcamActive && countdown === null) {
                    Object.assign(e.target.style, { background: 'linear-gradient(to right, #10b981, #3b82f6)' });
                  }
                }}
              >
                <Play size={24} />
                Start Game
              </button>
            </div>
          )}

          {/* Last Result */}
          {lastResult && (
            <div style={styles.resultCard}>
              <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>{lastResult}</p>
            </div>
          )}

          {/* Game Over */}
          {gameOver && (
            <div style={styles.gameOverCard}>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '16px' }}>🎉 Game Over!</h3>
              <p style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
                Final Score:{' '}
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{gameState.score}</span>
              </p>
              <button
                onClick={startGame}
                style={{ ...styles.button, background: 'linear-gradient(to right, #a855f7, #ec4899)' }}
                onMouseEnter={(e) =>
                  Object.assign(e.target.style, { background: 'linear-gradient(to right, #9333ea, #db2777)' })
                }
                onMouseLeave={(e) =>
                  Object.assign(e.target.style, { background: 'linear-gradient(to right, #a855f7, #ec4899)' })
                }
              >
                <RotateCcw size={20} />
                Play Again
              </button>
            </div>
          )}

          {/* Freeze Frames Gallery */}
          {freezeFrames.length > 0 && (
            <div style={styles.card}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>Your Expressions:</h3>
              <div style={styles.freezeFramesGrid}>
                {freezeFrames.slice(-4).map((frame, index) => (
                  <div key={index} style={styles.freezeFrame}>
                    <img
                      src={`data:image/jpeg;base64,${frame.image}`}
                      alt={`Expression ${frame.round}`}
                      style={styles.freezeFrameImg}
                      onMouseEnter={(e) => Object.assign(e.target.style, styles.freezeFrameImgHover)}
                      onMouseLeave={(e) => Object.assign(e.target.style, styles.freezeFrameImg)}
                    />
                    <div style={styles.freezeFrameEmoji}>{frame.emoji?.emoji}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={styles.instructions}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>How to Play:</h3>
        <div
          style={
            window.innerWidth >= 768
              ? { ...styles.instructionsGrid, ...styles.instructionsGridMd }
              : styles.instructionsGrid
          }
        >
          <div style={styles.instructionItem}>
            <span style={{ fontSize: '1.5rem' }}>📷</span>
            <div>
              <strong>Step 1:</strong> Allow camera access and click "Start Camera"
            </div>
          </div>
          <div style={styles.instructionItem}>
            <span style={{ fontSize: '1.5rem' }}>🎭</span>
            <div>
              <strong>Step 2:</strong> Make the emoji expression shown on screen
            </div>
          </div>
          <div style={styles.instructionItem}>
            <span style={{ fontSize: '1.5rem' }}>🏆</span>
            <div>
              <strong>Step 3:</strong> Hold the expression until detected for points!
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default EmojiGuessingGame;