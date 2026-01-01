"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type IslandMonster = {
  id: number;
  name: string;
  type: string;
  emoji: string;
  color: string;
  level: number;
  traits: string[];
};

type IslandState = {
  level: number;
  currentXP: number;
  goalXP: number;
  monsters: IslandMonster[];
  setXP: (xp: number) => void;
  setLevel: (lvl: number) => void;
  updateMonster: (id: number, partial: Partial<IslandMonster>) => void;
};

const IslandCtx = createContext<IslandState | undefined>(undefined);

export function IslandProvider({ children }: { children: React.ReactNode }) {
  const [level, setLevel] = useState<number>(3);
  const [currentXP, setCurrentXP] = useState<number>(420);
  const [goalXP, setGoalXP] = useState<number>(600);
  const [monsters, setMonsters] = useState<IslandMonster[]>([
    { id: 1, name: "Sparkle", type: "Starter", emoji: "🦖", color: "bg-green-500", level: 5, traits: ["Frugal", "Cheerful"] },
    { id: 2, name: "Goldie", type: "Savings Master", emoji: "🐉", color: "bg-teal-500", level: 3, traits: ["Persistent", "Lucky"] },
    { id: 3, name: "Bluey", type: "Budget Beast", emoji: "🦕", color: "bg-blue-500", level: 2, traits: ["Planner", "Calm"] },
  ]);

  const setXP = (xp: number) => {
    const next = Math.max(0, xp);
    setCurrentXP(next);
    if (next >= goalXP) {
      // simple demo: level up and roll over xp
      setLevel((l) => l + 1);
      setCurrentXP(next - goalXP);
      setGoalXP((g) => Math.round(g * 1.2));
    }
  };

  const updateMonster = (id: number, partial: Partial<IslandMonster>) => {
    setMonsters((prev) => prev.map((m) => (m.id === id ? { ...m, ...partial } : m)));
  };

  const value = useMemo(
    () => ({ level, currentXP, goalXP, monsters, setXP, setLevel, updateMonster }),
    [level, currentXP, goalXP, monsters]
  );

  return <IslandCtx.Provider value={value}>{children}</IslandCtx.Provider>;
}

export function useIsland() {
  const ctx = useContext(IslandCtx);
  if (!ctx) throw new Error("useIsland must be used within IslandProvider");
  return ctx;
}

