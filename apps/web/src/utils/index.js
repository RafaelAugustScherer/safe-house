export const getUniqueId = () => {
  if (window) {
    var navigator_info = window.navigator;
    var screen_info = window.screen;
    var uid = navigator_info.mimeTypes.length;
    uid += navigator_info.userAgent.replace(/\D+/g, "");
    uid += navigator_info.plugins.length;
    uid += screen_info.height || "";
    uid += screen_info.width || "";
    uid += screen_info.pixelDepth || "";
    return uid;
  } else return 0;
};

export const rollDice = () => 1 + Math.floor(Math.random() * 6);

export const getNextLineBoardId = (id) => {
  let letters = Object.entries(BOARD).map((array) => array[0]);
  return letters[letters.findIndex((value) => value === id) - 1];
};

const BOARD_COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8];

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
};

const GAME_STATUS = {
  WAITING: "waiting", //esperando jogadores entrarem
  PLAYING: "playing", //jogando
  FINISHED: "finished", //jogo encerrado
};

const ACTIONS = {
  ROLL_INIT: "roll-init", //Role o dado para começar
  ROLL: "roll", //Role os dados para movimentar
  MOVE: "move", //Movimentar o token,
  WIN: "win",
};

const TURN_STAGES = {
  // ----------------------------------------------------------------
  ROLL_INIT: "roll-init", //Esperando rolagens iniciais
  // ----------------------------------------------------------------
  GET_INITIAL_CARDS: "get-initial-cards", // Distribuindo cartas iniciais
  // ----------------------------------------------------------------
  MOVE_ROLL: "move-roll", //Aguardando rolagem de um player para se mover
  // ----------------------------------------------------------------
  MOVE: "move", //Aguardando um player se mover
  VEHICLE_MOVE: "vehicle-move", //Aguardando player se mover com um veículo
  VEHICLE_INVITE: "vehicle-invite", //Aguardando player responder convite para entrar no veículo
  FIGHT: "fight-roll", //Aguardando rolagem de ataque
  OPEN_CHEST: "open-chest", //Aguardando rolagem para abrir uma caixa
  GET_CHEST_CARD: "get-chest-card", //Aguardando uma carta ser recebida da caixa
  ENTER_TENT: "enter-tent", //Aguardando rolagem para entrar na tenda
  GET_TENT_CARD: "get-tent-card", //Aguardando uma carta ser recebida da tenda
  // ---------------------------------------------------------------
  ZOMBIE_TURN: "zombie-turn", // Verificando players próximos de zumbis
  ZOMBIE_FIGHT: "zombie-fight", // Aguardando zumbis atacarem players próximos
  // ---------------------------------------------------------------
  HORDE_TURN: "horde-turn", // Verificando se existe penalidade de som para mover a horda
  HORDE_CHECK: "horde-check", // Verificando se existe players próximos a horda
  HORDE_FIGHT: "horde-fight", // Aguardando horda atacar players próximos
  // ---------------------------------------------------------------
  PLAYER_HEALTH_CHECK: "player-health-check", // Verificando saúde do player
  // ---------------------------------------------------------------
  NEXT_TURN_CHECK: "next-turn-check", // Verificando próximo jogador a jogar
  // ----------------------------------------------------------------
};

const TURN_USER = {
  ALL_USERS: "all_users", //Todos usuários
  GAME: "game", //Todos usuários
};

const ZOMBIES = [
  {
    id: 1,
    position: "k7",
  },
  {
    id: 2,
    position: "j3",
  },
  {
    id: 3,
    position: "h6",
  },
  {
    id: 4,
    position: "f7",
  },
  {
    id: 5,
    position: "f2",
  },
  {
    id: 6,
    position: "e5",
  },
  {
    id: 7,
    position: "c1",
  },
  {
    id: 8,
    position: "b3",
  },
  {
    id: 9,
    position: "b8",
  },
  {
    id: 10,
    position: "a6",
  },
];

export const GAME_EXAMPLE = {
  maxUsers: 2,
  name: "Nome da sala",
  owner: "Nome do dono da sala",
  status: GAME_STATUS.WAITING,
  users: {
    1: {
      username: "Jogador 1",
      initRollValue: 6,
    },
  },
  zombies: ZOMBIES,
  actions: [
    {
      userId: "1", //id usuário || 'all_users' = todos usuários || 'game' = jogo,
      action: ACTIONS.ROLL_INIT,
    },
  ],
};

const CARDS_TYPES = {
  HEAL: "heal", // Curar
  STORE: "store", // Armazenar
  GUN: "gun", // Lutar
  VEHICLE: "vehicle", // Movimentar
  TOOL: "tool", // Ferramenta para lidar com algo
  CONSUMABLE: "consumable", // Consumível, uso único
};

const CARDS_ACTIONS = {
  MEELE_ATTACK: "melee-attack", // Atacar corpo-a-corpo
  GUN_ATTACK: "gun-attack", // Atacar com arma de fogo
  HEAL: "heal", // Curar
  UPGRADE: "upgrade", // Melhorar
  OPEN_CHEST: "open-chest", // Abrir caixas
  MOVEMENT: "movement", //Movimentar
};

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
};

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
};

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
  // @todo terminar a lista de itens, armas, etc.
};

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
};

export const CARDS = { ITEMS, FIRE_GUNS, COLD_WEAPONS, VEHICLES };

export const GAME = {
  GAME_STATUS,
  ZOMBIES,
  ACTIONS,
  TURN_USER,
  CARDS,
  CARDS_TYPES,
  CARDS_ACTIONS,
  TURN_STAGES,
};
