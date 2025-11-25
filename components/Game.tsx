import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Heart, Trophy, Zap, Skull, Lock, Unlock, Star, ShieldPlus, PlusCircle, Pause, Play, Home } from 'lucide-react';
import { Button } from './Button';
import { AppState } from '../types';

interface GameProps {
  setAppState: (state: AppState) => void;
}

// --- Game Constants ---
let CANVAS_WIDTH = 1000;
let CANVAS_HEIGHT = 700;
const SHOOTER_PLAYER_SPEED = 6; 
const BOSS_SCORE_THRESHOLD = 1000;
const MAX_LEVEL = 3;

type GameObject = {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  color: string;
  hp: number;
  maxHp?: number;
  type: 'player' | 'enemy' | 'boss' | 'bullet' | 'particle' | 'powerup' | 'obstacle';
  subType?: 'basic' | 'fast' | 'tank' | 'tracker' | 'spread' | 'rapid' | 'shield' | 'health';
  remove?: boolean;
};

// Background Asteroid type
type Asteroid = {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  points: {x: number, y: number}[];
  color: string;
};

export const Game: React.FC<GameProps> = ({ setAppState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 });
  
  // Game UI States
  const [gameStatus, setGameStatus] = useState<'select_level' | 'playing' | 'paused' | 'gameover' | 'victory'>('select_level');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);

  // Load progress on mount
  useEffect(() => {
    const savedLevel = localStorage.getItem('unlockedLevel');
    if (savedLevel) {
      setUnlockedLevel(parseInt(savedLevel, 10));
    }
    
    // Resize Logic to fit screen
    const updateSize = () => {
      const newWidth = Math.min(window.innerWidth - 40, 1600);
      const newHeight = Math.min(window.innerHeight - 120, 900);
      CANVAS_WIDTH = newWidth;
      CANVAS_HEIGHT = newHeight;
      setCanvasSize({ width: newWidth, height: newHeight });
    };
    
    window.addEventListener('resize', updateSize);
    updateSize(); // Initial call
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Game State Refs (Mutable for performance)
  const gameState = useRef({
    keys: { w: false, a: false, s: false, d: false, space: false },
    player: { x: 100, y: 300, width: 40, height: 30, vx: 0, vy: 0, color: '#3b82f6', hp: 100, maxHp: 100, type: 'player' } as GameObject,
    bullets: [] as GameObject[],
    enemies: [] as GameObject[],
    particles: [] as GameObject[],
    powerups: [] as GameObject[],
    stars: [] as { x: number; y: number; size: number; speed: number }[],
    asteroids: [] as Asteroid[], // New background elements
    lastShot: 0,
    fireRate: 250,
    weaponType: 'normal' as 'normal' | 'spread' | 'rapid',
    bossActive: false,
    frameCount: 0,
    score: 0,
    levelDifficultyMultiplier: 1
  });

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Pause Toggle with ESC
      if (key === 'escape') {
        if (gameStatus === 'playing') {
          setGameStatus('paused');
        } else if (gameStatus === 'paused') {
          setGameStatus('playing');
        }
        return;
      }

      if (gameStatus !== 'playing') return;
      
      if (key === 'w') gameState.current.keys.w = true;
      if (key === 'a') gameState.current.keys.a = true;
      if (key === 's') gameState.current.keys.s = true;
      if (key === 'd') gameState.current.keys.d = true;
      if (key === ' ') gameState.current.keys.space = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w') gameState.current.keys.w = false;
      if (key === 'a') gameState.current.keys.a = false;
      if (key === 's') gameState.current.keys.s = false;
      if (key === 'd') gameState.current.keys.d = false;
      if (key === ' ') gameState.current.keys.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus]);

  // --- Main Loop ---
  useEffect(() => {
    // Stop loop if paused (renders last frame but doesn't update logic)
    if (gameStatus !== 'playing') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId: number;

    const loop = (time: number) => {
      updateShooter(ctx, time);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus, score, health, maxHealth, canvasSize]); 

  // ----------------------------------------------------------------
  // --- SHOOTER ENGINE ---
  // ----------------------------------------------------------------
  const updateShooter = (ctx: CanvasRenderingContext2D, time: number) => {
    const state = gameState.current;

    // 1. Init Scenery if empty
    if (state.stars.length === 0) {
      initStars(CANVAS_WIDTH, CANVAS_HEIGHT);
      initAsteroids(CANVAS_WIDTH, CANVAS_HEIGHT, selectedLevel);
    }

    // 2. Background Drawing based on Level
    drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 3. Draw Stars & Asteroids (Background Layer)
    drawStars(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, state.bossActive ? 5 : 1);
    drawAsteroids(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 4. Player Movement
    if (state.keys.w && state.player.y > 0) state.player.y -= SHOOTER_PLAYER_SPEED;
    if (state.keys.s && state.player.y < CANVAS_HEIGHT - state.player.height) state.player.y += SHOOTER_PLAYER_SPEED;
    if (state.keys.a && state.player.x > 0) state.player.x -= SHOOTER_PLAYER_SPEED;
    if (state.keys.d && state.player.x < CANVAS_WIDTH - state.player.width) state.player.x += SHOOTER_PLAYER_SPEED;

    // 5. Shooting
    if (state.keys.space && time - state.lastShot > state.fireRate) {
      state.lastShot = time;
      const spawnBullet = (angleOffset: number = 0) => {
        state.bullets.push({
          x: state.player.x + state.player.width,
          y: state.player.y + state.player.height / 2 - 4,
          width: 15, height: 8, vx: 10, vy: angleOffset, color: '#fbbf24', hp: 1, type: 'bullet'
        });
      };
      spawnBullet(0);
      if (state.weaponType === 'spread') { spawnBullet(-2); spawnBullet(2); }
    }

    // 6. Spawning
    state.frameCount++;
    if (!state.bossActive && state.frameCount % 60 === 0) {
       const spawnCount = 1 + Math.floor(state.score / 800);
       for(let i=0; i<Math.min(spawnCount, 4); i++) spawnShooterEnemy(state);
    }
    if (!state.bossActive && state.score >= BOSS_SCORE_THRESHOLD) {
      const hasBoss = state.enemies.some(e => e.type === 'boss');
      if (!hasBoss) spawnBoss(state);
    }

    // 7. Logic & Collisions
    // Bullets
    state.bullets.forEach(b => { b.x += b.vx; b.y += b.vy; if (b.x > CANVAS_WIDTH) b.remove = true; });

    // Enemies
    state.enemies.forEach(e => {
      e.x += e.vx; e.y += e.vy;
      
      // Tracker Logic (Seeks Player Y)
      if (e.subType === 'tracker') {
          const targetY = state.player.y + state.player.height / 2;
          const enemyY = e.y + e.height / 2;
          // Move towards player Y smoothly
          if (Math.abs(targetY - enemyY) > 5) {
             e.y += targetY > enemyY ? 1.5 : -1.5;
          }
      }

      // Boss Logic
      if (e.type === 'boss') {
        if (e.x < CANVAS_WIDTH - 300) e.vx = 0; 
        if (e.y <= 0 || e.y + e.height >= CANVAS_HEIGHT) e.vy *= -1;
        
        // Boss Shooting Patterns
        const fireChance = selectedLevel === 2 ? 0.05 : 0.02; 
        if (Math.random() < fireChance * state.levelDifficultyMultiplier) { 
           // Level 3 Boss shoots spread
           if (selectedLevel === 3) {
              state.enemies.push({ x: e.x, y: e.y + e.height/2, width: 15, height: 15, vx: -5, vy: 0, color: '#fbbf24', hp: 1, type: 'obstacle' });
              state.enemies.push({ x: e.x, y: e.y + e.height/2, width: 15, height: 15, vx: -5, vy: 2, color: '#fbbf24', hp: 1, type: 'obstacle' });
              state.enemies.push({ x: e.x, y: e.y + e.height/2, width: 15, height: 15, vx: -5, vy: -2, color: '#fbbf24', hp: 1, type: 'obstacle' });
           } else {
              state.enemies.push({ x: e.x, y: e.y + e.height/2, width: 20, height: 20, vx: -4, vy: (Math.random() - 0.5) * 6, color: '#ef4444', hp: 1, type: 'obstacle' });
           }
        }
      }
      if (e.x + e.width < 0) e.remove = true;

      // Collision: Player vs Enemy
      if (!e.remove && rectIntersect(state.player, e)) {
        state.player.hp -= 20;
        createExplosion(state.player.x, state.player.y, '#3b82f6', 20);
        if (e.type !== 'boss') { e.remove = true; createExplosion(e.x, e.y, e.color); }
      }
    });

    // Powerups
    state.powerups.forEach(p => {
      p.x += p.vx;
      if (rectIntersect(state.player, p)) {
        p.remove = true;
        if (p.subType === 'shield') {
          // Shield
          state.player.maxHp = 200;
          state.player.hp = 200; 
        } else if (p.subType === 'health') {
          // Health
          state.player.hp = state.player.maxHp || 100; 
        } else {
           // Weapons
           state.weaponType = p.subType as any;
           if (p.subType === 'rapid') {
              state.fireRate = 80; // Very fast
           } else {
              state.fireRate = 250; // Normal
           }
        }
      }
      if (p.x + p.width < 0) p.remove = true;
    });

    // Bullet vs Enemy
    state.bullets.forEach(b => {
      state.enemies.forEach(e => {
        if (!b.remove && !e.remove && rectIntersect(b, e)) {
          b.remove = true;
          e.hp--;
          if (e.hp <= 0) {
            e.remove = true;
            state.score += (e.type === 'boss' ? 1000 : 50);
            spawnPowerup(e.x, e.y);
            createExplosion(e.x, e.y, e.color, e.type === 'boss' ? 50 : 10);
            if (e.type === 'boss') { setGameStatus('victory'); return; }
          } else {
            createExplosion(b.x, b.y, '#fbbf24', 2);
          }
        }
      });
    });

    // Particles
    updateParticles();

    cleanup(state);

    // 8. Draw Game Objects
    if (state.player.hp > 0) {
      drawShip(ctx, state.player.x, state.player.y, state.player.width, state.player.height, state.player.color);
      if (state.player.maxHp === 200) {
         ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(state.player.x + 20, state.player.y + 15, 40, 0, Math.PI*2); ctx.stroke();
      }
    }

    state.enemies.forEach(e => {
      if (e.type === 'boss') drawBoss(ctx, e.x, e.y, e.width, e.height, e.color, e.hp, e.maxHp || 100, selectedLevel);
      else if (e.type === 'obstacle') { ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(e.x+10, e.y+10, 10, 0, Math.PI*2); ctx.fill(); }
      else drawEnemy(ctx, e.x, e.y, e.width, e.height, e.color, e.subType);
    });

    ctx.fillStyle = '#fbbf24'; state.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
    drawPowerups(ctx);
    drawParticles(ctx);

    syncState();
  };

  // ----------------------------------------------------------------
  // --- HELPERS ---
  // ----------------------------------------------------------------
  
  const syncState = () => {
    const state = gameState.current;
    if (state.score !== score) setScore(state.score);
    if (state.player.hp !== health) {
      setHealth(Math.max(0, state.player.hp));
      if (state.player.hp <= 0) setGameStatus('gameover');
    }
    if (state.player.maxHp !== maxHealth) setMaxHealth(state.player.maxHp || 100);
  };

  const spawnShooterEnemy = (state: any) => {
      const levelMult = state.levelDifficultyMultiplier;
      const rand = Math.random();
      let type: 'basic' | 'fast' | 'tank' | 'tracker' = 'basic';
      let width = 30, height = 30, hp = 1 * levelMult, color = '#ef4444', vx = -3 * levelMult;

      // Probabilities adjusted for variety
      if (rand > 0.55 && rand < 0.70) {
        type = 'fast'; width = 20; height = 15; color = '#f97316'; vx = -6 * levelMult;
      } else if (rand >= 0.70 && rand < 0.85) {
        type = 'tank'; width = 50; height = 50; hp = 5 * levelMult; color = '#a855f7'; vx = -1.5 * levelMult;
      } else if (rand >= 0.85 && selectedLevel >= 2) {
        // New Enemy type: Tracker (Appears from Level 2+)
        type = 'tracker'; width = 25; height = 25; hp = 2 * levelMult; color = '#06b6d4'; vx = -4 * levelMult;
      }

      state.enemies.push({
        x: CANVAS_WIDTH + 50, y: Math.random() * (CANVAS_HEIGHT - height),
        width, height, vx, vy: 0, color, hp, type: 'enemy', subType: type
      });
  };

  const spawnBoss = (state: any) => {
      const levelMult = state.levelDifficultyMultiplier;
      
      let bossHp = 60; 
      let color = '#dc2626'; // Red
      let w = 150, h = 150;

      if (selectedLevel === 2) {
        bossHp = 100; // Lower than level 3
        color = '#7e22ce'; // Purple
      } else if (selectedLevel === 3) {
        bossHp = 120; // Reduced from 150 (as requested)
        color = '#f59e0b'; // Gold
        w = 180; h = 180;
      }

      state.enemies.push({
        x: CANVAS_WIDTH + 100, y: CANVAS_HEIGHT / 2 - h/2,
        width: w, height: h, vx: -2, vy: 2, color: color,
        hp: bossHp, maxHp: bossHp, type: 'boss'
      });
      state.bossActive = true;
  };

  const spawnPowerup = (x: number, y: number) => {
      if (Math.random() > 0.3) return; 
      const r = Math.random();
      let type = 'spread';
      let color = '#fde047';
      
      if (r < 0.3) { type = 'spread'; color = '#fde047'; }
      else if (r < 0.6) { type = 'rapid'; color = '#22d3ee'; }
      else if (r < 0.8) { type = 'shield'; color = '#60a5fa'; } // Blue Shield
      else { type = 'health'; color = '#22c55e'; } // Green Health

      gameState.current.powerups.push({
        x, y, width: 20, height: 20, vx: -2, vy: 0, hp: 1,
        color, type: 'powerup', subType: type as any
      });
  };

  const createExplosion = (x: number, y: number, color: string, count: number = 10) => {
      for (let i = 0; i < count; i++) {
        gameState.current.particles.push({
          x, y, width: 4, height: 4,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          color, hp: 1, type: 'particle'
        });
      }
  };

  const updateParticles = () => {
     gameState.current.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.width *= 0.95; p.height *= 0.95;
        if (p.width < 0.5) p.remove = true;
     });
  };

  const cleanup = (state: any) => {
      state.bullets = state.bullets.filter((x: any) => !x.remove);
      state.enemies = state.enemies.filter((x: any) => !x.remove);
      state.powerups = state.powerups.filter((x: any) => !x.remove);
      state.particles = state.particles.filter((x: any) => !x.remove);
  };

  const initStars = (w: number, h: number) => {
      gameState.current.stars = [];
      for (let i = 0; i < 100; i++) {
        gameState.current.stars.push({
          x: Math.random() * w, y: Math.random() * h,
          size: Math.random() * 2 + 0.5, speed: Math.random() * 3 + 0.5
        });
      }
  };

  const initAsteroids = (w: number, h: number, level: number) => {
      gameState.current.asteroids = [];
      // No asteroids on level 1
      if (level === 1) return;

      const count = level === 2 ? 5 : 12; // More on level 3
      const asteroidColor = level === 2 ? '#4c1d95' : '#7c2d12'; // Purple/Dark or Brown/Red

      for (let i = 0; i < count; i++) {
         const points = [];
         const sides = 5 + Math.floor(Math.random() * 4);
         for(let j=0; j<sides; j++) {
            const angle = (j / sides) * Math.PI * 2;
            const radius = 20 + Math.random() * 20;
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
         }
         
         gameState.current.asteroids.push({
            x: Math.random() * w, 
            y: Math.random() * h,
            size: 30 + Math.random() * 40,
            speed: Math.random() * 0.5 + 0.2,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            points: points,
            color: asteroidColor
         });
      }
  };

  // ----------------------------------------------------------------
  // --- DRAWING ---
  // ----------------------------------------------------------------
  
  const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
     let gradient = ctx.createLinearGradient(0, 0, 0, h);
     
     if (selectedLevel === 2) {
        gradient.addColorStop(0, '#0f0524');
        gradient.addColorStop(1, '#2e1065');
     } else if (selectedLevel === 3) {
        gradient.addColorStop(0, '#1c0505');
        gradient.addColorStop(1, '#450a0a');
     } else {
        gradient.addColorStop(0, '#020617');
        gradient.addColorStop(1, '#0f172a');
     }
     
     ctx.fillStyle = gradient;
     ctx.fillRect(0, 0, w, h);
  };

  const drawStars = (ctx: CanvasRenderingContext2D, w: number, h: number, speedMult: number) => {
     ctx.fillStyle = '#ffffff';
      gameState.current.stars.forEach(star => {
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
        ctx.fillRect(star.x, star.y, star.size, star.size);
        star.x -= star.speed * speedMult;
        if (star.x < 0) star.x = w;
        ctx.globalAlpha = 1.0;
      });
  };

  const drawAsteroids = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      gameState.current.asteroids.forEach(ast => {
          ctx.save();
          ctx.translate(ast.x, ast.y);
          ctx.rotate(ast.rotation);
          
          ctx.fillStyle = ast.color;
          ctx.globalAlpha = 0.6;
          
          ctx.beginPath();
          if (ast.points.length > 0) {
              ctx.moveTo(ast.points[0].x, ast.points[0].y);
              for (let i = 1; i < ast.points.length; i++) {
                  ctx.lineTo(ast.points[i].x, ast.points[i].y);
              }
          }
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();

          ast.x -= ast.speed;
          ast.rotation += ast.rotationSpeed;
          if (ast.x + 100 < 0) {
              ast.x = w + 100;
              ast.y = Math.random() * h;
          }
          ctx.globalAlpha = 1.0;
      });
  };

  const drawShip = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x + w, y + h / 2); ctx.lineTo(x, y); ctx.lineTo(x + w * 0.2, y + h / 2); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(x, y + h / 2 - 5); ctx.lineTo(x - (Math.random() * 20 + 10), y + h / 2); ctx.lineTo(x, y + h / 2 + 5); ctx.fill();
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, type?: string) => {
    ctx.fillStyle = color;
    if (type === 'fast') { 
      // Arrow shape
      ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.fill(); 
    } else if (type === 'tank') { 
      // Square with inner detail
      ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 5, y + 5, w - 10, h - 10); 
    } else if (type === 'tracker') {
      // Triangle pointing left (Tracker)
      ctx.beginPath(); 
      ctx.moveTo(x, y + h/2); 
      ctx.lineTo(x + w, y); 
      ctx.lineTo(x + w, y + h); 
      ctx.closePath();
      ctx.fill();
      // Eye
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x + w/2, y + h/2, 3, 0, Math.PI*2); ctx.fill();
    } else { 
      // Standard
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h / 2); ctx.lineTo(x, y + h); ctx.fill(); 
    }
  };

  const drawBoss = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, hp: number, maxHp: number, level: number) => {
    ctx.fillStyle = color; 
    
    // Different shapes based on Level
    if (level === 2) {
      // UFO / Saucer Shape
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + h/2, w/2, h/3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Dome
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(x + w/2, y + h/2 - 20, 40, Math.PI, 0);
      ctx.fill();
    } else if (level === 3) {
      // Spiky Star / Destroyer
      ctx.beginPath();
      const cx = x + w/2;
      const cy = y + h/2;
      const outerRadius = w/2;
      const innerRadius = w/4;
      const spikes = 8;
      
      for (let i = 0; i < spikes * 2; i++) {
         const radius = i % 2 === 0 ? outerRadius : innerRadius;
         const angle = (Math.PI * i) / spikes;
         const px = cx + Math.cos(angle) * radius;
         const py = cy + Math.sin(angle) * radius;
         if (i === 0) ctx.moveTo(px, py);
         else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      
      // Core
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2); ctx.fill();

    } else {
      // Level 1: Standard Tank Box (Previous design)
      ctx.fillRect(x + 20, y, w - 40, h); 
      ctx.fillRect(x, y + 40, w, h - 80);
      // Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 30, y + 40, 30, 30);
      ctx.fillRect(x + w - 60, y + 40, 30, 30);
    }
    
    // Glowing red eyes for all
    if (level !== 1) {
       ctx.fillStyle = '#f00';
       ctx.beginPath(); ctx.arc(x + w/2 - 20, y + h/2, 5, 0, Math.PI*2); ctx.fill();
       ctx.beginPath(); ctx.arc(x + w/2 + 20, y + h/2, 5, 0, Math.PI*2); ctx.fill();
    } else {
       ctx.fillStyle = '#f00';
       ctx.fillRect(x + 40, y + 50, 10, 10);
       ctx.fillRect(x + w - 50, y + 50, 10, 10);
    }

    // Health Bar
    ctx.fillStyle = '#333'; ctx.fillRect(x, y - 20, w, 10);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x, y - 20, Math.max(0, (hp / maxHp) * w), 10);
  };

  const drawPowerups = (ctx: CanvasRenderingContext2D) => {
     gameState.current.powerups.forEach(p => {
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x + 10, p.y + 10, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = 'bold 12px Arial';
        let letter = 'W';
        if(p.subType === 'spread') letter = 'S';
        if(p.subType === 'rapid') letter = 'R';
        if(p.subType === 'shield') letter = '+';
        if(p.subType === 'health') letter = 'H';
        ctx.fillText(letter, p.x + 6, p.y + 14);
      });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
     gameState.current.particles.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.width, p.height); });
  };

  const rectIntersect = (r1: GameObject, r2: GameObject) => {
    return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
  };

  // --- Game Flow Controls ---

  const handleLevelComplete = () => {
    // Increment level even if at MAX_LEVEL to indicate full completion (Level 4 status)
    if (selectedLevel === unlockedLevel && unlockedLevel <= MAX_LEVEL) {
      const newLevel = unlockedLevel + 1;
      setUnlockedLevel(newLevel);
      localStorage.setItem('unlockedLevel', newLevel.toString());
    }
    setGameStatus('select_level');
  };

  const startGame = (lvl: number) => {
    setSelectedLevel(lvl);
    
    // Reset State
    const state = gameState.current;
    state.player.hp = 100;
    state.player.maxHp = 100;
    state.player.x = 100;
    state.player.y = CANVAS_HEIGHT / 2;
    state.score = 0;
    state.enemies = [];
    state.bullets = [];
    state.powerups = [];
    state.particles = [];
    
    // Clear and re-init scenery based on new level
    state.stars = []; 
    state.asteroids = []; // Clear old asteroids so init runs again in loop
    
    state.bossActive = false;
    state.weaponType = 'normal';
    state.fireRate = 250;
    state.levelDifficultyMultiplier = 1 + (lvl * 0.2);

    setScore(0);
    setHealth(100);
    setMaxHealth(100);
    setGameStatus('playing');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
      
      {/* HUD */}
      {(gameStatus === 'playing' || gameStatus === 'paused') && (
        <div className="w-full max-w-4xl flex justify-between items-center mb-2 text-white bg-slate-900/80 p-3 rounded-xl border border-slate-800 backdrop-blur absolute top-4 z-20 pointer-events-auto">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="text-amber-400" size={20} />
                <span className="font-mono text-xl font-bold">{score} / {BOSS_SCORE_THRESHOLD}</span>
              </div>
            <div className="flex items-center gap-2">
              <Zap className="text-blue-400" size={20} />
              <span className="font-mono text-lg">LVL {selectedLevel}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className={`${health < 30 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} fill="currentColor" size={24} />
              <div className="w-32 h-4 bg-slate-800 rounded-full overflow-hidden relative">
                 <div className={`h-full transition-all duration-300 ${health > 100 ? 'bg-blue-500' : (health < 30 ? 'bg-red-500' : 'bg-green-500')}`} style={{ width: `${(health / maxHealth) * 100}%` }} />
                 {health > 100 && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              </div>
              <span className="text-xs font-mono">{health}/{maxHealth}</span>
            </div>
            
            {/* HUD Pause Button */}
            <button 
              onClick={() => setGameStatus(gameStatus === 'paused' ? 'playing' : 'paused')}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              title={gameStatus === 'paused' ? "Continuar" : "Pausar (ESC)"}
            >
               {gameStatus === 'paused' ? <Play size={20} className="fill-current text-green-400" /> : <Pause size={20} className="fill-current text-slate-200" />}
            </button>
          </div>
        </div>
      )}

      <div className="relative group w-full h-full flex items-center justify-center">
        {gameStatus !== 'select_level' && (
          <canvas 
            ref={canvasRef} 
            width={canvasSize.width} 
            height={canvasSize.height}
            className="bg-slate-900 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.1)] border border-slate-800 cursor-crosshair block"
          />
        )}

        {/* Level Selection Screen */}
        {gameStatus === 'select_level' && (
          <div className="w-full max-w-4xl bg-slate-900/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 border border-slate-800 p-8 min-h-[500px]">
            <h2 className="text-4xl font-display font-bold text-white mb-2">SELEÇÃO DE MISSÃO</h2>
            <p className="text-slate-400 mb-12">Complete os 3 níveis para desbloquear todas as memórias.</p>
            
            <div className="grid grid-cols-3 gap-8 mb-12">
              {[1, 2, 3].map((lvl) => {
                const isLocked = lvl > unlockedLevel;
                const isCompleted = lvl < unlockedLevel;
                return (
                  <button
                    key={lvl}
                    onClick={() => !isLocked && startGame(lvl)}
                    disabled={isLocked}
                    className={`
                      relative group flex flex-col items-center justify-center w-32 h-40 rounded-2xl border-2 transition-all duration-300
                      ${isLocked 
                        ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed' 
                        : 'border-amber-500 bg-slate-800 hover:bg-amber-500/10 hover:scale-110 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] cursor-pointer'}
                    `}
                  >
                    {isLocked ? (
                      <Lock className="w-10 h-10 text-slate-600 mb-3" />
                    ) : (
                      <>
                         {isCompleted ? <Star className="w-10 h-10 text-amber-400 mb-3 fill-amber-400" /> : <Unlock className="w-10 h-10 text-amber-400 mb-3" />}
                      </>
                    )}
                    <span className={`font-black text-3xl ${isLocked ? 'text-slate-600' : 'text-white'}`}>{lvl}</span>
                    <span className="text-[10px] uppercase tracking-widest mt-2 text-slate-500">
                       {isCompleted ? 'COMPLETO' : (lvl === 3 ? 'FINAL' : 'MISSÃO')}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button onClick={() => setAppState(AppState.MENU)} variant="secondary">
              Voltar ao Menu Principal
            </Button>
          </div>
        )}

        {/* PAUSE Screen Overlay */}
        {gameStatus === 'paused' && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl z-30 animate-in fade-in duration-200">
              <div className="flex flex-col items-center gap-6 p-8 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl min-w-[320px]">
                 <div className="flex flex-col items-center mb-2">
                    <div className="p-4 bg-slate-800 rounded-full mb-4 ring-2 ring-amber-500/20">
                      <Pause className="w-10 h-10 text-amber-400 fill-current" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white tracking-widest">JOGO PAUSADO</h2>
                 </div>
                 
                 <div className="w-full space-y-3">
                   <Button 
                     onClick={() => setGameStatus('playing')} 
                     variant="primary" 
                     icon={<Play className="w-5 h-5 fill-current" />}
                     className="w-full justify-center"
                   >
                     Continuar
                   </Button>
                   
                   <Button 
                     onClick={() => setGameStatus('select_level')} 
                     variant="secondary"
                     icon={<ArrowLeft className="w-5 h-5" />}
                     className="w-full justify-center"
                   >
                     Seleção de Fase
                   </Button>

                   <Button 
                     onClick={() => setAppState(AppState.MENU)} 
                     variant="danger"
                     icon={<Home className="w-5 h-5" />}
                     className="w-full justify-center"
                   >
                     Menu Principal
                   </Button>
                 </div>
              </div>
           </div>
        )}

        {/* Victory Screen */}
        {gameStatus === 'victory' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-md rounded-xl z-20 animate-in zoom-in duration-300">
             <div className="flex flex-col items-center">
                <Star className="w-20 h-20 text-amber-400 mb-4 animate-bounce" fill="currentColor" />
                <h2 className="text-5xl font-display font-bold text-white mb-4">MISSÃO CUMPRIDA!</h2>
                <p className="text-xl text-slate-300 mb-2">Nível {selectedLevel} Completo</p>
                <p className="text-amber-400 text-sm mb-8 uppercase tracking-widest">15 Novas fotos desbloqueadas</p>
                <Button onClick={handleLevelComplete} variant="primary" className="px-8">Continuar</Button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameStatus === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/90 backdrop-blur-md rounded-xl z-20 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center">
                <Skull className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-4xl font-display font-bold text-white mb-2">MISSÃO FALHOU</h2>
                <div className="text-6xl font-black text-amber-400 mb-8 drop-shadow-lg">{score} pts</div>
                <div className="flex gap-4">
                <Button onClick={() => startGame(selectedLevel)} variant="primary">Tentar Novamente</Button>
                <Button onClick={() => setGameStatus('select_level')} variant="secondary">Sair</Button>
                </div>
            </div>
          </div>
        )}
      </div>
      
       {gameStatus !== 'select_level' && (
         <div className="mt-2 w-full max-w-4xl text-slate-500 text-xs flex justify-between px-4">
             <span>Controles: WASD para Voar, Espaço para Atirar</span>
             <span className="flex items-center gap-2"><div className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700">ESC</div> para Pausar</span>
         </div>
       )}
    </div>
  );
};