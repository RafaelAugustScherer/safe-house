// Re-export the shared catalog so screens/components can keep importing from
// "../utils". `import * as` works across the CJS/ESM boundary where named
// re-exports do not. Client-only helpers (browser fingerprint, dice) live
// here.
import * as shared from "@safehouse/shared";

export const BOARD = shared.BOARD;
export const GAME = shared.GAME;
export const CARDS = shared.CARDS;
export const ZOMBIES = shared.ZOMBIES;
export const TURN_STAGES = shared.TURN_STAGES;
export const TURN_USER = shared.TURN_USER;
export const ACTIONS = shared.ACTIONS;
export const GAME_STATUS = shared.GAME_STATUS;
export const CARDS_TYPES = shared.CARDS_TYPES;
export const CARDS_ACTIONS = shared.CARDS_ACTIONS;
export const ZOMBIE_KIND = shared.ZOMBIE_KIND;
export const CHEST_POSITIONS = shared.CHEST_POSITIONS;
export const TENT_POSITIONS = shared.TENT_POSITIONS;
export const SPAWN_ROW = shared.SPAWN_ROW;
export const SAFE_HOUSE_ROW = shared.SAFE_HOUSE_ROW;
export const getNextLineBoardId = shared.getNextLineBoardId;

export type BoardRow = shared.BoardRow;
export type BoardColumn = shared.BoardColumn;
export type BoardCell = shared.BoardCell;
export type GameStatus = shared.GameStatus;
export type GameAction = shared.GameAction;
export type TurnStage = shared.TurnStage;
export type ZombieKind = shared.ZombieKind;
export type ZombieSpawn = shared.ZombieSpawn;
export type CardType = shared.CardType;
export type CardAction = shared.CardAction;
export type ItemCard = shared.ItemCard;
export type WeaponCard = shared.WeaponCard;
export type VehicleCard = shared.VehicleCard;

export const getUniqueId = (): string => {
  const stored = localStorage.getItem("safehouse:uid");
  if (stored) return stored;
  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem("safehouse:uid", generated);
  return generated;
};

export const rollDice = (): number => 1 + Math.floor(Math.random() * 6);
