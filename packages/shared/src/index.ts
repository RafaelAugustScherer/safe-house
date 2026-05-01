// Source of truth for board, game-state enums, and card catalog.
// Consumed by both apps/api (rule engine) and apps/web (UI).

const BOARD_COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const BOARD = {
  a: BOARD_COLUMNS,
  b: BOARD_COLUMNS,
  c: BOARD_COLUMNS,
  d: BOARD_COLUMNS,
  e: BOARD_COLUMNS,
  f: BOARD_COLUMNS,
  g: BOARD_COLUMNS,
  h: BOARD_COLUMNS,
  i: BOARD_COLUMNS,
  j: BOARD_COLUMNS,
  k: BOARD_COLUMNS,
  l: BOARD_COLUMNS,
} as const;

export type BoardRow = keyof typeof BOARD;
export type BoardColumn = (typeof BOARD_COLUMNS)[number];
export type BoardCell = `${BoardRow}${BoardColumn}`;

// Spawn line is row 'l' (bottom). Safe house is row 'a' (top).
export const SPAWN_ROW: BoardRow = "l";
export const SAFE_HOUSE_ROW: BoardRow = "a";

export const GAME_STATUS = {
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
} as const;
export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];

export const ACTIONS = {
  ROLL_INIT: "roll-init",
  ROLL: "roll",
  MOVE: "move",
  WIN: "win",
} as const;
export type GameAction = (typeof ACTIONS)[keyof typeof ACTIONS];

export const TURN_STAGES = {
  ROLL_INIT: "roll-init",
  GET_INITIAL_CARDS: "get-initial-cards",
  MOVE_ROLL: "move-roll",
  MOVE: "move",
  VEHICLE_MOVE: "vehicle-move",
  VEHICLE_INVITE: "vehicle-invite",
  FIGHT: "fight-roll",
  OPEN_CHEST: "open-chest",
  GET_CHEST_CARD: "get-chest-card",
  ENTER_TENT: "enter-tent",
  GET_TENT_CARD: "get-tent-card",
  ZOMBIE_TURN: "zombie-turn",
  ZOMBIE_FIGHT: "zombie-fight",
  HORDE_TURN: "horde-turn",
  HORDE_CHECK: "horde-check",
  HORDE_FIGHT: "horde-fight",
  PLAYER_HEALTH_CHECK: "player-health-check",
  NEXT_TURN_CHECK: "next-turn-check",
} as const;
export type TurnStage = (typeof TURN_STAGES)[keyof typeof TURN_STAGES];

export const TURN_USER = {
  ALL_USERS: "all_users",
  GAME: "game",
} as const;

export const ZOMBIE_KIND = {
  SINGLE: "single",
  HORDE: "horde",
} as const;
export type ZombieKind = (typeof ZOMBIE_KIND)[keyof typeof ZOMBIE_KIND];

export interface ZombieSpawn {
  id: number;
  position: BoardCell;
  kind: ZombieKind;
}

export const ZOMBIES: ZombieSpawn[] = [
  { id: 1, position: "k7", kind: "single" },
  { id: 2, position: "j3", kind: "single" },
  { id: 3, position: "h6", kind: "single" },
  { id: 4, position: "f7", kind: "single" },
  { id: 5, position: "f2", kind: "single" },
  { id: 6, position: "e5", kind: "single" },
  { id: 7, position: "c1", kind: "single" },
  { id: 8, position: "b3", kind: "single" },
  { id: 9, position: "b8", kind: "single" },
  { id: 10, position: "a6", kind: "single" },
  // 2 hordes per the README rules.
  { id: 11, position: "i4", kind: "horde" },
  { id: 12, position: "d5", kind: "horde" },
];

export const CARDS_TYPES = {
  HEAL: "heal",
  STORE: "store",
  GUN: "gun",
  VEHICLE: "vehicle",
  TOOL: "tool",
  CONSUMABLE: "consumable",
} as const;
export type CardType = (typeof CARDS_TYPES)[keyof typeof CARDS_TYPES];

export const CARDS_ACTIONS = {
  MEELE_ATTACK: "melee-attack",
  GUN_ATTACK: "gun-attack",
  HEAL: "heal",
  UPGRADE: "upgrade",
  OPEN_CHEST: "open-chest",
  MOVEMENT: "movement",
} as const;
export type CardAction = (typeof CARDS_ACTIONS)[keyof typeof CARDS_ACTIONS];

export interface ItemCard {
  key: string;
  name: string;
  description: string;
  type: CardType;
  cardAction: CardAction;
}

export interface WeaponCard extends ItemCard {
  normalValue: number;
  specialValue: number;
  soundPenalty: boolean;
}

export interface VehicleCard extends ItemCard {
  value: number;
  specialValue: number;
  duo: boolean;
  soundPenalty: boolean;
}

const ITEMS = {
  MEDICINE: {
    key: "medicine",
    name: "Bandagens",
    description:
      "Algumas bandagens que podem ser utilizadas para estancar sangramentos e machucados.",
    type: CARDS_TYPES.HEAL,
    cardAction: CARDS_ACTIONS.HEAL,
  },
  BAG: {
    key: "bag",
    name: "Mochila",
    description:
      "Uma mochila que serve para você conseguir carregar mais um item.",
    type: CARDS_TYPES.STORE,
    cardAction: CARDS_ACTIONS.UPGRADE,
  },
  CROWBAR: {
    key: "crowbar",
    name: "Pé de cabra",
    description:
      "Serve para abrir as caixas espalhadas pelo mapa, mas sem fazer barulho.",
    type: CARDS_TYPES.TOOL,
    cardAction: CARDS_ACTIONS.OPEN_CHEST,
  },
  MAP: {
    key: "map",
    name: "Mapa",
    description:
      "O mapa mostra alguns esconderijos. Use-o para evitar um ataque de zumbi. Obs: Não pode ser utilizado na horda!",
    type: CARDS_TYPES.CONSUMABLE,
    cardAction: CARDS_ACTIONS.MOVEMENT,
  },
  WALKIE_TALKIE: {
    key: "walkie-talkie",
    name: "Walkie Talkie",
    description:
      "Se mais alguém tiver como te ouvir, quem estiver mais próximo da casa pode ajudar o outro!",
    type: CARDS_TYPES.CONSUMABLE,
    cardAction: CARDS_ACTIONS.MOVEMENT,
  },
} as const satisfies Record<string, ItemCard>;

const FIRE_GUNS = {
  PISTOL: {
    key: "pistol",
    name: "Pistola",
    description:
      "Arma de fogo leve e de cano curto. Pequena e de rápido manuseio.",
    normalValue: 2,
    specialValue: 0,
    type: CARDS_TYPES.GUN,
    cardAction: CARDS_ACTIONS.GUN_ATTACK,
    soundPenalty: true,
  },
  RIFLE: {
    key: "rifle",
    name: "Rifle",
    description:
      "Fuzil de serviço padrão dos Estados Unidos utilizado durante a Segunda Guerra Mundial.",
    normalValue: 5,
    specialValue: 3,
    type: CARDS_TYPES.GUN,
    cardAction: CARDS_ACTIONS.GUN_ATTACK,
    soundPenalty: true,
  },
  MACHINE_GUN: {
    key: "machine-gun",
    name: "Metraladora",
    description:
      "Arma de fogo automática que dispara tiros rapidamente a partir de um cinto de munição.",
    normalValue: 4,
    specialValue: 2,
    type: CARDS_TYPES.GUN,
    cardAction: CARDS_ACTIONS.GUN_ATTACK,
    soundPenalty: true,
  },
  SHOTGUN: {
    key: "shotgun",
    name: "Escopeta",
    description: "Espingarda normalmente utilizada para caça.",
    normalValue: 3,
    specialValue: 1,
    type: CARDS_TYPES.GUN,
    cardAction: CARDS_ACTIONS.GUN_ATTACK,
    soundPenalty: true,
  },
} as const satisfies Record<string, WeaponCard>;

const COLD_WEAPONS = {
  CHAINSAW: {
    key: "chainsaw",
    name: "Motossera",
    description:
      "Serra utilizada para corte de madeira, podas e corte de árvores.",
    normalValue: 2,
    specialValue: 0,
    type: CARDS_TYPES.GUN,
    cardAction: CARDS_ACTIONS.MEELE_ATTACK,
    soundPenalty: false,
  },
  KNIFE: {
    key: "knife",
    name: "Faca de sobrevivência",
    description: "Faca destinada à sobrevivência em ambientes selvagens.",
    normalValue: 2,
    specialValue: 0,
    type: CARDS_TYPES.GUN,
    cardAction: CARDS_ACTIONS.MEELE_ATTACK,
    soundPenalty: false,
  },
  SHOVEL: {
    key: "shovel",
    name: "Pá",
    description: "Pá comum. Normalmente utilizada para cavar buracos.",
    normalValue: 2,
    specialValue: 0,
    type: CARDS_TYPES.GUN,
    cardAction: CARDS_ACTIONS.MEELE_ATTACK,
    soundPenalty: false,
  },
  BAT: {
    key: "bat",
    name: "Taco de baseball",
    description: "Taco de madeira utilizado para jogar baseball.",
    normalValue: 2,
    specialValue: 0,
    type: CARDS_TYPES.GUN,
    cardAction: CARDS_ACTIONS.MEELE_ATTACK,
    soundPenalty: false,
  },
  AXE: {
    key: "axe",
    name: "Machado",
    description:
      "Um machado normalmente utilizado para cortar lenha ou árvores pequenas.",
    normalValue: 3,
    specialValue: 0,
    type: CARDS_TYPES.GUN,
    cardAction: CARDS_ACTIONS.MEELE_ATTACK,
    soundPenalty: false,
  },
  MECHETE: {
    key: "machete",
    name: "Facão",
    description:
      "Faca de mato grande, utilizada em acampamentos, caça, pesca, e por militares",
    normalValue: 2,
    specialValue: 0,
    type: CARDS_TYPES.GUN,
    cardAction: CARDS_ACTIONS.MEELE_ATTACK,
    soundPenalty: false,
  },
} as const satisfies Record<string, WeaponCard>;

const VEHICLES = {
  MOTORCYCLE: {
    key: "motorcycle",
    name: "Motocicleta",
    description: "Veículo motorizado de duas rodas e tração traseira.",
    type: CARDS_TYPES.VEHICLE,
    cardAction: CARDS_ACTIONS.MOVEMENT,
    value: 4,
    specialValue: 2,
    duo: true,
    soundPenalty: true,
  },
  BIKE: {
    key: "bike",
    name: "Bicicleta",
    description: "Veículo não motorizado de duas rodas com pedais.",
    type: CARDS_TYPES.VEHICLE,
    cardAction: CARDS_ACTIONS.MOVEMENT,
    value: 5,
    specialValue: 2,
    duo: false,
    soundPenalty: true,
  },
  BUGGY: {
    key: "buggy",
    name: "Buggy",
    description:
      "Veículo automotor pequeno, sem portas, com pneus grandes atrás e pequenos na frente.",
    type: CARDS_TYPES.VEHICLE,
    cardAction: CARDS_ACTIONS.MOVEMENT,
    value: 5,
    specialValue: 3,
    duo: true,
    soundPenalty: true,
  },
  TRACTOR: {
    key: "tractor",
    name: "Trator",
    description:
      "Veículo grande usado para puxar, transportar ou rebocar objetos pesados.",
    type: CARDS_TYPES.VEHICLE,
    cardAction: CARDS_ACTIONS.MOVEMENT,
    value: 3,
    specialValue: 5,
    duo: false,
    soundPenalty: true,
  },
  PICKUP: {
    key: "pickup",
    name: "Pickup",
    description:
      "Veículo com cabine fechada e uma área de carga aberta com laterais baixas e porta traseira.",
    type: CARDS_TYPES.VEHICLE,
    cardAction: CARDS_ACTIONS.MOVEMENT,
    value: 4,
    specialValue: 4,
    duo: false,
    soundPenalty: true,
  },
} as const satisfies Record<string, VehicleCard>;

export const CARDS = { ITEMS, FIRE_GUNS, COLD_WEAPONS, VEHICLES } as const;

export const GAME = {
  GAME_STATUS,
  ZOMBIES,
  ACTIONS,
  TURN_USER,
  CARDS,
  CARDS_TYPES,
  CARDS_ACTIONS,
  TURN_STAGES,
} as const;

// Pre-determined chest and tent positions on the board.
// Chests: harder to open without crowbar; trigger sound penalty on failure.
// Tents:  always trigger a roll; safe-ish loot.
export const CHEST_POSITIONS: BoardCell[] = ["j5", "h2", "g7", "e3", "c5", "b1"];
export const TENT_POSITIONS: BoardCell[] = ["i7", "g2", "d8", "c4"];

export const getNextLineBoardId = (id: BoardRow): BoardRow | undefined => {
  const letters = Object.keys(BOARD) as BoardRow[];
  return letters[letters.findIndex((value) => value === id) - 1];
};
