"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Vec = { x: number; y: number };
type GameState = "playing" | "paused" | "dead";
enum Dir {
  Up,
  Down,
  Left,
  Right,
}

const GRID_W = 28;
const GRID_H = 20;
const TICK_MS = 110;

const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const eq = (a: Vec, b: Vec): boolean => a.x === b.x && a.y === b.y;
const wrap = (p: Vec): Vec => ({
  x: (p.x + GRID_W) % GRID_W,
  y: (p.y + GRID_H) % GRID_H,
});
const dirVec = (d: Dir): Vec =>
  d === Dir.Up
    ? { x: 0, y: -1 }
    : d === Dir.Down
      ? { x: 0, y: 1 }
      : d === Dir.Left
        ? { x: -1, y: 0 }
        : { x: 1, y: 0 };
const isOpposite = (a: Dir, b: Dir): boolean =>
  (a === Dir.Up && b === Dir.Down) ||
  (a === Dir.Down && b === Dir.Up) ||
  (a === Dir.Left && b === Dir.Right) ||
  (a === Dir.Right && b === Dir.Left);

function randomApple(exclude: ReadonlyArray<Vec>): Vec {
  for (let i = 0; i < 1000; i++) {
    const v = {
      x: (Math.random() * GRID_W) | 0,
      y: (Math.random() * GRID_H) | 0,
    };
    if (!exclude.some((s) => eq(s, v))) return v;
  }
  return { x: 0, y: 0 };
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(performance.now());
  const accRef = useRef<number>(0);

  const snakeRef = useRef<Vec[]>([
    { x: (GRID_W / 2) | 0, y: (GRID_H / 2) | 0 },
  ]);
  const dirRef = useRef<Dir>(Dir.Right);
  const nextDirRef = useRef<Dir>(Dir.Right);
  const appleRef = useRef<Vec>(randomApple(snakeRef.current));

  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(0);
  const [state, setState] = useState<GameState>("playing");

  useEffect(() => {
    const savedBest = localStorage.getItem("snake_best");
    if (savedBest) {
      setBest(Number(savedBest));
    }
  }, []);

  const stateRef = useRef<GameState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const scoreRef = useRef<number>(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  const bestRef = useRef<number>(best);
  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  const restart = useCallback(() => {
    snakeRef.current = [{ x: (GRID_W / 2) | 0, y: (GRID_H / 2) | 0 }];
    dirRef.current = Dir.Right;
    nextDirRef.current = Dir.Right;
    appleRef.current = randomApple(snakeRef.current);
    setScore(0);
    setState("playing");
    stateRef.current = "playing";
    accRef.current = 0;
    lastRef.current = performance.now();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const map: Record<string, Dir | undefined> = {
        arrowup: Dir.Up,
        w: Dir.Up,
        arrowdown: Dir.Down,
        s: Dir.Down,
        arrowleft: Dir.Left,
        a: Dir.Left,
        arrowright: Dir.Right,
        d: Dir.Right,
      };
      if (k in map) {
        const nd = map[k]!;
        const cur = dirRef.current;
        if (!(snakeRef.current.length > 1 && isOpposite(cur, nd)))
          nextDirRef.current = nd;
      }
      if (k === "p") {
        if (stateRef.current !== "dead") {
          const next = stateRef.current === "paused" ? "playing" : "paused";
          setState(next);
          stateRef.current = next;
        }
      }
      if (k === "r") restart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [restart]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;

    const stepGame = () => {
      dirRef.current = nextDirRef.current;
      const body = snakeRef.current;
      const head = body[0];
      const nextHead = wrap(add(head, dirVec(dirRef.current)));
      if (body.some((p) => eq(p, nextHead))) {
        setState("dead");
        stateRef.current = "dead";
        const nb = Math.max(bestRef.current, scoreRef.current);
        if (nb !== bestRef.current) {
          setBest(nb);
          localStorage.setItem("snake_best", String(nb));
        }
        return;
      }
      const newBody = [nextHead, ...body];
      if (eq(nextHead, appleRef.current)) {
        setScore((s) => s + 10);
        appleRef.current = randomApple(newBody);
      } else {
        newBody.pop();
      }
      snakeRef.current = newBody;
    };

    const render = (W: number, H: number) => {
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, W, H);
      const cell = Math.floor(Math.min(W / GRID_W, H / GRID_H));
      const ox = Math.floor((W - cell * GRID_W) / 2);
      const oy = Math.floor((H - cell * GRID_H) / 2);
      ctx.globalAlpha = 0.7;
      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = "#0e1730";
            ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
          }
        }
      }
      ctx.globalAlpha = 1;
      const a = appleRef.current;
      ctx.fillStyle = "#eab308";
      ctx.fillRect(
        ox + a.x * cell + 2,
        oy + a.y * cell + 2,
        cell - 4,
        cell - 4,
      );
      const snake = snakeRef.current;
      for (let i = 0; i < snake.length; i++) {
        const p = snake[i];
        const isHead = i === 0;
        ctx.fillStyle = isHead ? "#22c55e" : "#16a34a";
        ctx.fillRect(
          ox + p.x * cell + 1.5,
          oy + p.y * cell + 1.5,
          cell - 3,
          cell - 3,
        );
      }
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${scoreRef.current}`, 12, 22);
      ctx.fillText(
        `Best: ${Math.max(bestRef.current, scoreRef.current)}`,
        12,
        40,
      );
      if (stateRef.current === "paused" || stateRef.current === "dead") {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font =
          "700 22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.fillText(
          stateRef.current === "paused" ? "Paused" : "Game Over",
          W / 2,
          H / 2 - 8,
        );
        ctx.font =
          "500 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.fillText("P: pause • R: restart", W / 2, H / 2 + 16);
      }
      ctx.textAlign = "right";
      ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText("Arrows/WASD • P • R", W - 12, 20);
    };

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const parent = c.parentElement!;
      const rect = parent.getBoundingClientRect();
      const cssW = Math.floor(rect.width);
      const cssH = Math.floor(rect.height);
      const pxW = Math.floor(cssW * dpr);
      const pxH = Math.floor(cssH * dpr);
      if (c.width !== pxW || c.height !== pxH) {
        c.width = pxW;
        c.height = pxH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dt = now - lastRef.current;
      lastRef.current = now;
      if (stateRef.current === "playing") {
        accRef.current += dt;
        while (accRef.current >= TICK_MS) {
          stepGame();
          accRef.current -= TICK_MS;
        }
      }
      render(cssW, cssH);
    };

    lastRef.current = performance.now();
    accRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div
          style={{
            width: "100%",
            aspectRatio: "4 / 3",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            background:
              "radial-gradient(120% 120% at 0% 0%, #0f172a 0%, #0b0f17 55%, #070b12 100%)",
            position: "relative",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              imageRendering: "pixelated",
            }}
          />
        </div>
      </div>
    </main>
  );
}
