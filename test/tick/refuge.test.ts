import { describe, it, expect } from "vitest";
import { sameCell } from "@/game/enemies";
import { handleTick } from "@/game/tick";
import { makeEnemy, makeState, seededRng } from "../test-helpers";

describe("tick", () => {
  it("refuge roll 0.002 spawns at L17, not at L18", () => {
    // constant 0.002 rng: below 0.003 (L17) but above 0.0015 (L18); equals the 0.002 enemy-spawn threshold so no enemy spawns
    const constant = () => 0.002;
    const after17 = handleTick(makeState({ level: 17 }), { type: "tick", dt: 1 }, constant);
    expect(after17.refuge).not.toBeNull();
    const after18 = handleTick(makeState({ level: 18 }), { type: "tick", dt: 1 }, constant);
    expect(after18.refuge).toBeNull();
  });

  it("refuge expires after duration", () => {
    const s = makeState({
      refuge: { pos: { col: 0, row: 0 }, expiresAt: 100 },
      simTime: 90,
    });
    const noSpawn = () => 0.5;
    const after = handleTick(s, { type: "tick", dt: 0.2 }, noSpawn);
    expect(after.refuge).toBeNull();
  });

  it("refuge blocks enemy entry", () => {
    const enemy = makeEnemy({ pos: { col: 0, row: 0 }, dir: "right", stepTimer: 420 });
    const refuge = { pos: { col: 1, row: 0 }, expiresAt: 10000 };
    const s = makeState({ enemies: [enemy], refuge, simTime: 0 });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    expect(sameCell(after.enemies[0].pos, { col: 0, row: 0 })).toBe(true);
  });

  it("refuge removes enemy on it", () => {
    const enemy = makeEnemy({ pos: { col: 3, row: 4 }, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], playerPos: { col: 5, row: 4 }, refuge: null, simTime: 0 });
    // 0.001 < 0.003 triggers spawn; 0.9999 picks index 28 = (4,4) (last non-player cell); 0.5 >= 0.002 skips enemy spawn
    const seq = [0.001, 0.9999, 0.5];
    let i = 0;
    const rng = () => (i < seq.length ? seq[i++] : 0.5);
    const after = handleTick(s, { type: "tick", dt: 0.5 }, rng);
    expect(after.refuge).not.toBeNull();
    if (after.refuge) {
      const onRefuge = after.enemies.filter((e) => sameCell(e.pos, after.refuge!.pos));
      expect(onRefuge).toHaveLength(0);
    }
  });
});
