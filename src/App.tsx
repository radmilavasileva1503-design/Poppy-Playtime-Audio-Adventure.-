import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ArrowRight, ArrowLeft, RefreshCw, Hand, Zap, ShieldAlert, Info, Volume2, VolumeX, Search, MessageSquare, Target, CheckCircle2, User, Camera, Activity, Eye, Unlock, Gamepad2, Settings, X, Map, Radio, Save, Download, Mic, Award, Trophy, Footprints, Cpu, Star, ShieldCheck, Heart, Timer, Maximize, Minimize, Ghost, History } from 'lucide-react';

import { MapModal } from './components/MapModal';
import { GameOfMyLifeModal } from './components/GameOfMyLifeModal';
import { Typewriter } from './components/Typewriter';

type CharacterProfile = {
  background: 'employee' | 'investigator' | 'explorer' | 'paranormal' | '';
  perk: 'tech' | 'athletic' | 'perceptive' | 'heightened_senses' | '';
};

type GameState = {
  inventory: string[];
  objectives: string[];
  completedObjectives: string[];
  character: CharacterProfile;
  collectibles: string[];
  secretNotes: string[];
  ammo: number;
  batteryLevel: number;
  isWindowOpen: boolean;
  discoveredSecretPassage: boolean;
};

type AccessibilitySettings = {
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  narrationSpeed: number;
  autoNarrate: boolean;
  muteFootsteps: boolean;
  muteDoors: boolean;
  muteWindows: boolean;
  muteJumpscares: boolean;
  audioOutputId: string;
  locationEntrySound: boolean;
};

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  fontSize: 'normal',
  highContrast: false,
  narrationSpeed: 1.0,
  autoNarrate: false,
  muteFootsteps: false,
  muteDoors: false,
  muteWindows: false,
  muteJumpscares: false,
  audioOutputId: '',
  locationEntrySound: false,
};

type Choice = {
  id: string;
  text: string;
  nextId: string;
  condition?: (state: GameState) => boolean;
  action?: (state: GameState) => GameState;
  icon?: React.ReactNode;
  actionSound?: string;
};

type Interactable = {
  id: string;
  label: string;
  description: string | ((state: GameState) => string);
  action?: (state: GameState) => GameState;
  condition?: (state: GameState) => boolean;
  actionSound?: string;
  icon?: React.ReactNode;
};

type GameNode = {
  id: string;
  title: string;
  text: string | ((state: GameState) => string);
  choices: Choice[];
  interactables?: Interactable[];
  bgSound?: string;
  bgMusic?: string;
  entrySound?: string;
  vibration?: number | number[];
  timeLimit?: number;
  timeLimitNextId?: string;
};

const MUSIC = {
  exploration: 'https://actions.google.com/sounds/v1/ambiences/large_room_ambience.ogg',
  suspense: 'https://actions.google.com/sounds/v1/science_fiction/scifi_drone.ogg',
  chase: 'https://actions.google.com/sounds/v1/alarms/siren_noise.ogg',
  calm: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
  STOP: 'STOP'
};

const SOUNDS = {
  // Ambient / Environment
  wind: 'https://actions.google.com/sounds/v1/weather/wind_howl_and_whistle.ogg',
  room: 'https://actions.google.com/sounds/v1/ambiences/large_room_ambience.ogg',
  machine: 'https://actions.google.com/sounds/v1/science_fiction/scifi_machine_room_hum.ogg',
  buzz: 'https://actions.google.com/sounds/v1/alarms/fluorescent_light_buzz.ogg',
  drip: 'https://actions.google.com/sounds/v1/water/water_leak.ogg',
  security_bg: 'https://actions.google.com/sounds/v1/ambiences/office_ambience.ogg',
  outside_bg: 'https://actions.google.com/sounds/v1/weather/wind_howl_and_whistle.ogg',
  break_room_bg: 'https://actions.google.com/sounds/v1/alarms/fluorescent_light_buzz.ogg',
  library_bg: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop_ambience.ogg',
  creepy_ambience: 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg',
  factory: 'https://actions.google.com/sounds/v1/science_fiction/scifi_machine_room_hum.ogg',

  // Actions / Foley
  door: 'https://actions.google.com/sounds/v1/doors/metal_door_open_and_close.ogg',
  door_locked: 'https://actions.google.com/sounds/v1/doors/locked_door_handle_rattle.ogg',
  door_heavy: 'https://actions.google.com/sounds/v1/doors/heavy_metal_door_open.ogg',
  vent: 'https://actions.google.com/sounds/v1/doors/creaking_wooden_door.ogg',
  window_open: 'https://actions.google.com/sounds/v1/doors/sliding_glass_door_open.ogg',
  window_close: 'https://actions.google.com/sounds/v1/doors/sliding_glass_door_close.ogg',
  pickup: 'https://actions.google.com/sounds/v1/foley/metal_object_handling.ogg',
  paper: 'https://actions.google.com/sounds/v1/foley/turning_pages.ogg',
  keys: 'https://actions.google.com/sounds/v1/foley/keys_jingle.ogg',
  footsteps: 'https://actions.google.com/sounds/v1/foley/footsteps_on_wood.ogg',
  chase: 'https://actions.google.com/sounds/v1/foley/running_on_concrete.ogg',
  clank: 'https://actions.google.com/sounds/v1/foley/metal_clank.ogg',
  switch: 'https://actions.google.com/sounds/v1/foley/light_switch.ogg',
  glass: 'https://actions.google.com/sounds/v1/foley/glass_shatter.ogg',

  // Tech / Sci-Fi
  zap: 'https://actions.google.com/sounds/v1/science_fiction/electric_spark.ogg',
  power_up: 'https://actions.google.com/sounds/v1/science_fiction/power_up.ogg',
  power_down: 'https://actions.google.com/sounds/v1/science_fiction/power_down.ogg',
  error: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  success: 'https://actions.google.com/sounds/v1/alarms/ding.ogg',
  robot: 'https://actions.google.com/sounds/v1/science_fiction/robot_code_computer_beeps.ogg',
  radio: 'https://actions.google.com/sounds/v1/science_fiction/static_radio_tune.ogg',
  tv: 'https://actions.google.com/sounds/v1/science_fiction/static_radio_tune.ogg',

  // Creepy / Horror
  crash: 'https://actions.google.com/sounds/v1/impacts/crash.ogg',
  whisper: 'https://actions.google.com/sounds/v1/human_voices/human_whisper.ogg',
  breathing: 'https://actions.google.com/sounds/v1/human_voices/male_heavy_breathing.ogg',
  monster_growl: 'https://actions.google.com/sounds/v1/animals/animal_growl.ogg',
  heartbeat: 'https://actions.google.com/sounds/v1/human_voices/heartbeat_fast.ogg',
  scream_distant: 'https://actions.google.com/sounds/v1/human_voices/female_scream.ogg',
  metal_scrape: 'https://actions.google.com/sounds/v1/foley/metal_scrape.ogg',
  
  // Events
  jumpscare: 'https://actions.google.com/sounds/v1/alarms/siren_noise.ogg',
  discovery: 'https://actions.google.com/sounds/v1/alarms/ding.ogg',
  interaction: 'https://actions.google.com/sounds/v1/science_fiction/robot_code_computer_beeps.ogg',
  objective_complete: 'https://actions.google.com/sounds/v1/science_fiction/power_up.ogg',
  intro: 'https://actions.google.com/sounds/v1/horror/creepy_music_box.ogg',
};

const INVENTORY_NAMES: Record<string, string> = {
  blue_hand: 'Синя ръка (GrabPack)',
  vhs_tape: 'Жълта видеокасета',
  screwdriver: 'Отвертка',
  keycard: 'Служебна карта',
  red_battery: 'Червена батерия',
  battery_code: 'Код за батерията',
  bron_moved: 'Доверието на Брон',
  golden_vhs: 'Златна касета',
  empty_flashlight: 'Празно фенерче',
  small_batteries: 'Малки батерии',
  flashlight: 'Работещо фенерче',
  torn_note: 'Скъсана бележка',
  library_unlocked: 'Достъп до библиотеката',
  elliots_diary: 'Дневникът на Елиът',
  manager_badge: 'Работна карта на управител',
  wrench: 'Гаечен ключ',
  owl_monocle: 'Монокълът на Бухала',
  owl_key: 'Ключ с форма на перо',
  treasure_map: 'Карта на съкровищата',
  star_key: 'Звезден ключ',
  employee_manual: 'Наръчник на служителя',
  broken_poker_chip: 'Счупен покер чип',
  ivory_die: 'Слонова кост зар'
};

const INVENTORY_DESCRIPTIONS: Record<string, string> = {
  blue_hand: 'Част от оборудването GrabPack. Позволява ви да достигате далечни предмети и да провеждате електричество.',
  vhs_tape: 'Стара видеокасета. Може би съдържа важна информация за фабриката.',
  screwdriver: 'Обикновена отвертка. Полезна за отваряне на вентилационни шахти и панели.',
  keycard: 'Магнитна карта за достъп до определени зони на фабриката.',
  red_battery: 'Източник на захранване за някои от механизмите.',
  battery_code: 'Код, необходим за активиране на батерията или свързаните с нея системи.',
  bron_moved: 'Спечелихте доверието на играчката Брон. Може да ви помогне по-късно.',
  golden_vhs: 'Рядка златна касета. Съдържа тайна информация от ръководството.',
  empty_flashlight: 'Фенерче без батерии. Не е много полезно в момента.',
  small_batteries: 'Малки батерии, подходящи за фенерче или друга дребна електроника.',
  flashlight: 'Работещо фенерче. Ще ви помогне да виждате в тъмните коридори.',
  torn_note: 'Част от бележка. Може би крие някаква парола или улика.',
  library_unlocked: 'Имате достъп до библиотеката на фабриката.',
  elliots_diary: 'Личният дневник на Елиът Лудвиг, основателят на Playtime Co.',
  manager_badge: 'Карта с високо ниво на достъп, принадлежала на управител.',
  wrench: 'Тежък гаечен ключ. Може да се използва за поправка или като импровизирано оръжие.',
  owl_monocle: 'Странен монокъл. Може би разкрива неща, невидими за просто око.',
  owl_key: 'Ключ с необичайна форма. Отключва специфична врата.',
  treasure_map: 'Карта, показваща разположението на стаите във фабриката.',
  star_key: 'Ключ с необичайна форма на звезда. Вероятно отключва специален шкаф или сейф.',
  employee_manual: 'Секретен наръчник с класифицирана информация за експериментите с играчки.',
  broken_poker_chip: 'Счупен покер чип от казиното. Има странни символи по него.',
  ivory_die: 'Изящно изработен зар от слонова кост. Изглежда много стар.'
};

const playAudio = (soundUrl: string | undefined, volume: number, settings: AccessibilitySettings, loop: boolean = false): HTMLAudioElement | null => {
  if (!soundUrl) return null;
  
  // Check mutes
  if (settings.muteFootsteps && (soundUrl === SOUNDS.footsteps || soundUrl === SOUNDS.chase)) return null;
  if (settings.muteDoors && (soundUrl === SOUNDS.door || soundUrl === SOUNDS.door_locked || soundUrl === SOUNDS.door_heavy)) return null;
  if (settings.muteWindows && (soundUrl === SOUNDS.window_open || soundUrl === SOUNDS.window_close || soundUrl === SOUNDS.vent)) return null;
  if (settings.muteJumpscares && (soundUrl === SOUNDS.jumpscare || soundUrl === SOUNDS.monster_growl || soundUrl === SOUNDS.crash)) return null;
  
  const audio = new Audio(soundUrl);
  audio.volume = volume;
  audio.loop = loop;

  if (settings.audioOutputId && typeof (audio as any).setSinkId === 'function') {
    (audio as any).setSinkId(settings.audioOutputId).catch((e: any) => console.log("setSinkId failed", e));
  }

  audio.play().catch(e => console.log("Audio play failed", e));
  return audio;
};

const OBJECTIVES: Record<string, string> = {
  enter_factory: 'Влезте във фабриката.',
  restore_power: 'Възстановете захранването във фоайето.',
  find_blue_hand: 'Намерете Синята ръка (GrabPack).',
  open_production_door: 'Отворете вратата към Производствената зона.',
  find_red_battery: 'Намерете Червената батерия за машината.',
  escape: 'Избягайте от фабриката!',
  discover_truth: 'Разкрийте истината за Playtime Co. (По желание)',
  explore_library: 'Разкрийте тайните на библиотеката. (По желание)',
};

const CHARACTER_REACTIONS: Record<string, Record<string, string>> = {
  employee: {
    blue_hand: "Това е старата ми Синя ръка... Колко спомени.",
    red_hand: "Червената ръка. Сега мога да отварям всичко.",
    treasure_map: "Карта на съкровищата? Кой ли я е нарисувал?",
    vintage_poster: "Спомням си този плакат. Беше закачен навсякъде.",
    golden_gear: "Златно зъбно колело. Производството тук беше странно.",
    secret_tape: "Тайна касета... Какво ли има на нея?",
    bron_prototype: "Прототип на Брон. Изглежда недовършен.",
    employee_badge: "Работна карта... На някой от старите ми колеги.",
    star_key: "Звезден ключ. Спомням си, че управителят имаше такъв.",
    employee_manual: "Този наръчник... не трябваше да съществува.",
    vhs_tape: "VHS касета. Трябва ми видеоплейър.",
    golden_vhs: "Златна касета. Това трябва да е важно.",
    torn_note: "Скъсана бележка. Почеркът ми е познат.",
    elliots_diary: "Дневникът на Елиът Лудвиг... Това е златно откритие.",
    fuse: "Бушон. Ще ми трябва за електрическото табло.",
    manager_badge: "Карта на управителя. Сега имам достъп до офисите.",
    keycard: "Магнитна карта. Трябва да я използвам на четеца."
  },
  investigator: {
    blue_hand: "Интересен инструмент. Ще ми свърши работа за разследването.",
    red_hand: "Още една ръка. Тези играчки крият много тайни.",
    treasure_map: "Схема на фабриката... или нещо повече?",
    vintage_poster: "Стар плакат. Може да съдържа скрити послания.",
    golden_gear: "Златно зъбно колело. Нетипично за обикновена фабрика за играчки.",
    secret_tape: "Тайна касета. Точно това, което търся.",
    bron_prototype: "Прототип на Брон. Доказателство за експериментите им.",
    employee_badge: "Работна карта. Ще ми даде достъп до нови зони.",
    star_key: "Странен ключ. Трябва да намеря ключалката за него.",
    employee_manual: "Точно доказателствата, които търсех!",
    vhs_tape: "VHS касета. Може да съдържа записи от охранителните камери.",
    golden_vhs: "Златна касета. Изглежда като ключово доказателство.",
    torn_note: "Скъсана бележка. Трябва да сглобя пъзела.",
    elliots_diary: "Дневникът на основателя. Тук са всички отговори.",
    fuse: "Бушон. Трябва да възстановя захранването.",
    manager_badge: "Карта на управителя. Отваря врати към класифицирана информация.",
    keycard: "Магнитна карта. Ключ към следващата улика."
  },
  explorer: {
    blue_hand: "Уау, истинска GrabPack ръка! Супер!",
    red_hand: "Две ръце са по-добре от една! Време е за екшън.",
    treasure_map: "Съкровище?! Обожавам търсенето на съкровища!",
    vintage_poster: "Яко! Ретро плакат на играчките.",
    golden_gear: "Блестящо златно зъбно колело! Ще си го запазя.",
    secret_tape: "Тайна касета! Дали е страшна?",
    bron_prototype: "Еха, прототип на играчка! Много е рядък.",
    employee_badge: "Работна карта! Вече съм официален изследовател.",
    star_key: "Ключ-звезда! Като в онези стари игри.",
    employee_manual: "Наръчник? Звучи скучно, но може да е полезно.",
    vhs_tape: "VHS касета! Какво ли има на нея?",
    golden_vhs: "Златна касета! Това е епично откритие!",
    torn_note: "Тайно съобщение! Мистерията се заплита.",
    elliots_diary: "Дневник! Обичам да чета чужди тайни.",
    fuse: "Бушон! Нека да пуснем тока!",
    manager_badge: "Карта на шефа! Аз командвам сега!",
    keycard: "Магнитна карта! Отварям всички врати!"
  }
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_steps', title: 'Първи стъпки', description: 'Влезте във фабриката.', icon: <Footprints className="w-6 h-6 text-blue-400" /> },
  { id: 'tech_genius', title: 'Технически гений', description: 'Използвайте техническите си умения, за да хакнете система.', icon: <Cpu className="w-6 h-6 text-yellow-400" /> },
  { id: 'collector', title: 'Колекционер', description: 'Намерете всички колекционерски предмети.', icon: <Star className="w-6 h-6 text-yellow-500" /> },
  { id: 'survivor', title: 'Оцелял', description: 'Избягайте от Хъги Въги и завършете играта.', icon: <ShieldCheck className="w-6 h-6 text-green-400" /> },
  { id: 'truth_seeker', title: 'Търсач на истината', description: 'Открийте Абсолютния Истински Край.', icon: <Eye className="w-6 h-6 text-purple-400" /> },
  { id: 'pacifist', title: 'Пацифист', description: 'Избягайте без да използвате оръжие срещу чудовището.', icon: <Heart className="w-6 h-6 text-pink-400" /> },
  { id: 'detective', title: 'Детектив', description: 'Открийте всички тайни бележки и касети.', icon: <Search className="w-6 h-6 text-indigo-400" /> },
  { id: 'cartographer', title: 'Картограф', description: 'Намерете Картата на съкровищата.', icon: <Map className="w-6 h-6 text-emerald-400" /> },
];

const completeObj = (state: GameState, objId: string, newObjId?: string): GameState => {
  const newObjectives = state.objectives.filter(id => id !== objId);
  if (newObjId && !newObjectives.includes(newObjId) && !state.completedObjectives.includes(newObjId)) {
    newObjectives.push(newObjId);
  }
  return {
    ...state,
    objectives: newObjectives,
    completedObjectives: [...state.completedObjectives, objId]
  };
};

const addObj = (state: GameState, objId: string): GameState => {
  if (state.objectives.includes(objId) || state.completedObjectives.includes(objId)) return state;
  return {
    ...state,
    objectives: [...state.objectives, objId]
  };
};

const GAME_NODES: Record<string, GameNode> = {
  intro_screen: {
    id: 'intro_screen',
    title: 'Добре дошли в Poppy Playtime',
    text: 'Добре дошли в аудио приключението на Poppy Playtime. Прекрачете прага на изоставената фабрика за играчки, където сенките шепнат, а играчките винаги ви наблюдават. Готови ли сте да разкриете истината, или ще станете част от играта?',
    bgSound: SOUNDS.intro,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Продължи към Главното меню', nextId: 'start', actionSound: SOUNDS.door_heavy, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  start: {
    id: 'start',
    title: 'Главно меню',
    text: 'Добре дошли в Poppy Playtime: Аудио Приключение. Тази игра е създадена специално за екранни четци. Използвайте клавиша Tab, за да навигирате между опциите, и Enter или Space, за да избирате. Готови ли сте да влезете в изоставената фабрика за играчки Playtime Co.?',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.calm,
    interactables: [
      {
        id: 'i1',
        label: 'Прочети писмото',
        description: 'Писмото, което ви доведе тук: "Всички мислят, че персоналът е изчезнал преди 10 години. Ние все още сме тук. Намерете цветето." В плика имаше и стара видеокасета.',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Започни играта (Пропусни урока)', nextId: 'char_creation_bg', icon: <Play className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Как се играе (Интерактивен урок)', nextId: 'tutorial_1_controls', icon: <Info className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> }
    ]
  },
  tutorial_1_controls: {
    id: 'tutorial_1_controls',
    title: 'Урок 1: Контроли и Навигация',
    text: 'Тази игра е текстово аудио приключение, оптимизирано за екранни четци. Можете да навигирате през текста и бутоните с клавиша Tab (или Shift+Tab за назад). За да изберете действие, натиснете Enter или Space. Нека опитаме сега. Изберете опцията по-долу, за да продължите.',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Разбрах, продължи напред', nextId: 'tutorial_2_audio', actionSound: SOUNDS.success, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  tutorial_2_audio: {
    id: 'tutorial_2_audio',
    title: 'Урок 2: Звукова среда',
    text: 'Звукът е ключов за оцеляването ви. Играта използва фонова музика за атмосфера, фонови звуци за средата (като капеща вода или вятър) и звукови ефекти за вашите действия (като отваряне на врата). Можете да включвате и изключвате звука от бутона горе вдясно. Чухте ли звука от предишното действие? Нека пробваме друг звук.',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Чух го! Продължи към инвентара', nextId: 'tutorial_3_inventory', actionSound: SOUNDS.door, icon: <Volume2 className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> }
    ]
  },
  tutorial_3_inventory: {
    id: 'tutorial_3_inventory',
    title: 'Урок 3: Инвентар и Задачи',
    text: 'По време на играта ще събирате предмети (като ключове или батерии), които ще ви помогнат да отключвате нови пътища. Те ще се показват в списъка "Вашият инвентар" под изборите ви. Също така ще получавате задачи, които да следвате в секцията "Текущи задачи". Готови ли сте да влезете във фабриката?',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Готов съм! Създай своя герой', nextId: 'char_creation_bg', actionSound: SOUNDS.footsteps, icon: <CheckCircle2 className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> }
    ]
  },
  char_creation_bg: {
    id: 'char_creation_bg',
    title: 'Създаване на герой: Предистория',
    text: 'Преди да прекрачите прага на изоставената фабрика, трябва да си припомните кой сте. Каква е вашата история?',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'bg1', text: 'Бивш служител (Познавате мястото, но спомените са болезнени)', nextId: 'char_creation_perk', action: (state) => ({ ...state, character: { ...state.character, background: 'employee' } }), icon: <User className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'bg2', text: 'Частен детектив (Търсите изчезналия персонал, воден от логиката)', nextId: 'char_creation_perk', action: (state) => ({ ...state, character: { ...state.character, background: 'investigator' } }), icon: <User className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'bg3', text: 'Градски изследовател (Търсач на силни усещания с камера в ръка)', nextId: 'char_creation_perk', action: (state) => ({ ...state, character: { ...state.character, background: 'explorer' } }), icon: <Camera className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'bg4', text: 'Паранормален следовател (Усещате невидимото и търсите духове)', nextId: 'char_creation_perk', action: (state) => ({ ...state, character: { ...state.character, background: 'paranormal' } }), icon: <Ghost className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> }
    ]
  },
  char_creation_perk: {
    id: 'char_creation_perk',
    title: 'Създаване на герой: Умение',
    text: (state) => {
      const bgText = state.character.background === 'employee' ? 'Като бивш служител, вие сте виждали много.' : state.character.background === 'investigator' ? 'Като детектив, вашият ум е вашето оръжие.' : state.character.background === 'paranormal' ? 'Като паранормален следовател, вие усещате това, което другите не могат.' : 'Като изследовател, вие сте свикнали с опасностите.';
      return `${bgText} Всеки оцелява по различен начин. Какво е вашето най-силно качество?`;
    },
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'p1', text: 'Технически гений (Можете да хаквате електронни ключалки и машини)', nextId: 'entrance', action: (state) => ({ ...state, character: { ...state.character, perk: 'tech' } }), actionSound: SOUNDS.footsteps, icon: <Zap className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { id: 'p2', text: 'Атлет (Бързи рефлекси и издръжливост при бягане)', nextId: 'entrance', action: (state) => ({ ...state, character: { ...state.character, perk: 'athletic' } }), actionSound: SOUNDS.footsteps, icon: <Activity className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> },
      { id: 'p3', text: 'Наблюдателен (Забелязвате скрити детайли и улики)', nextId: 'entrance', action: (state) => ({ ...state, character: { ...state.character, perk: 'perceptive' } }), actionSound: SOUNDS.footsteps, icon: <Eye className="w-5 h-5 mr-2 text-purple-400" aria-hidden="true" /> },
      { id: 'p4', text: 'Изострени сетива (Усещате присъствието на опасности преди да ги видите)', nextId: 'entrance', action: (state) => ({ ...state, character: { ...state.character, perk: 'heightened_senses' } }), actionSound: SOUNDS.footsteps, icon: <Radio className="w-5 h-5 mr-2 text-indigo-400" aria-hidden="true" /> }
    ]
  },
  entrance: {
    id: 'entrance',
    title: 'Пред фабриката',
    text: '[Звук от студен вятър и ръждясала, скърцаща табела]. Намирате се пред огромната, изоставена фабрика за играчки Playtime Co. Студеният въздух носи мирис на застояло и прах. Вратата е леко открехната, а отвътре лъха мрак и зловеща, неестествена тишина, нарушавана само от слабото ехо на собствените ви стъпки.',
    bgSound: SOUNDS.outside_bg,
    bgMusic: MUSIC.exploration,
    interactables: [
      {
        id: 'poster',
        label: 'Стар плакат',
        description: 'Избледнял, скъсан в краищата плакат на тухлената стена. Хартията е грапава и влажна. На него е изобразен Хъги Въги с огромна, неестествена усмивка и надпис: "Той винаги иска прегръдка!". Празният му поглед изглежда сякаш ви следи в тъмнината.',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'perceptive_clue',
        label: 'Огледай следите (Наблюдателен)',
        description: 'Забелязвате огромни, нечовешки следи в дебелия слой прах пред вратата. Очертанията са пресни, а около тях има фини драскотини по бетона. Някой... или нещо огромно... е минало оттук съвсем скоро.',
        condition: (state) => state.character.perk === 'perceptive',
        actionSound: SOUNDS.footsteps,
        icon: <Eye className="w-4 h-4 mr-2 text-purple-400" />
      },
      {
        id: 'heightened_senses_clue',
        label: 'Усети присъствие (Изострени сетива)',
        description: 'Кожата ви настръхва. Отвътре лъха не просто студ, а неестествена, злонамерена енергия. Нещо древно, огромно и гладно ви очаква в мрака. То знае, че сте тук.',
        condition: (state) => state.character.perk === 'heightened_senses',
        actionSound: SOUNDS.heartbeat,
        icon: <Radio className="w-4 h-4 mr-2 text-indigo-400" />
      },
      {
        id: 'treasure_map',
        label: 'Огледай старата карта',
        description: 'Намирате измачкана, леко мазна на допир Карта на съкровищата, скрита под купчина сухи листа! Мирише на стара хартия и мастило. Може да ви помогне да намерите скрити предмети.',
        condition: (state) => !state.inventory.includes('treasure_map'),
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2 text-yellow-500" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Вземи Картата на съкровищата', nextId: 'entrance_map_picked', condition: (state) => !state.inventory.includes('treasure_map'), actionSound: SOUNDS.pickup, action: (state) => ({ ...state, inventory: [...state.inventory, 'treasure_map'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Влез през открехнатата врата', nextId: 'lobby', actionSound: SOUNDS.door_heavy, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  entrance_map_picked: {
    id: 'entrance_map_picked',
    title: 'Пред фабриката',
    text: '[Звук от студен вятър и ръждясала, скърцаща табела]. Намирате се пред огромната, изоставена фабрика за играчки Playtime Co. Студеният въздух носи мирис на застояло и прах. Вратата е леко открехната, а отвътре лъха мрак и зловеща, неестествена тишина, нарушавана само от слабото ехо на собствените ви стъпки. Мястото под листата, където беше картата, сега е празно.',
    bgSound: SOUNDS.outside_bg,
    bgMusic: MUSIC.exploration,
    interactables: [
      {
        id: 'poster',
        label: 'Стар плакат',
        description: 'Избледнял, скъсан в краищата плакат на тухлената стена. Хартията е грапава и влажна. На него е изобразен Хъги Въги с огромна, неестествена усмивка и надпис: "Той винаги иска прегръдка!". Празният му поглед изглежда сякаш ви следи в тъмнината.',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'perceptive_clue',
        label: 'Огледай следите (Наблюдателен)',
        description: 'Забелязвате огромни, нечовешки следи в дебелия слой прах пред вратата. Очертанията са пресни, а около тях има фини драскотини по бетона. Някой... или нещо огромно... е минало оттук съвсем скоро.',
        condition: (state) => state.character.perk === 'perceptive',
        actionSound: SOUNDS.footsteps,
        icon: <Eye className="w-4 h-4 mr-2 text-purple-400" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Влез през открехнатата врата', nextId: 'lobby', actionSound: SOUNDS.door_heavy, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  lobby: {
    id: 'lobby',
    title: 'Главно фоайе',
    text: '[Глухо ехо от стъпки и слабо бръмчене на електричество]. Вие сте в огромното, прашно главно фоайе. Въздухът е тежък, мирише на мухъл и стара пластмаса. В центъра се извисява огромна, мъхеста статуя на синьото чудовище Хъги Въги (Huggy Wuggy), чиято козина изглежда плашещо реална. На студена, метална табелка в основата ѝ пише: "Проект 1170". Наоколо виждате врата към Охранителната стая, масивна заключена стоманена врата към Производствената зона, която изисква захранване, и дървена врата с избледнял надпис "Управител".',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.exploration,
    interactables: [
      {
        id: 'old_radio',
        label: 'Старо радио',
        description: 'Старо, покрито с дебел слой прах радио. Пластмасовият му корпус е напукан, но отвътре се чува едва доловимо, ритмично електрическо бръмчене, което вибрира леко под пръстите ви. Може би някои части все още работят?',
        condition: (state) => !state.inventory.includes('radio_part'),
        actionSound: SOUNDS.radio,
        action: (state) => ({ ...state, inventory: [...state.inventory, 'radio_part'] }),
        icon: <Radio className="w-4 h-4 mr-2" />
      },
      {
        id: 'reception_desk',
        label: 'Бюро на рецепцията',
        description: 'Зад масивното дървено бюро, покрито с разпилени хартии, намирате стар, мухлясал дневник на охранителя с кожена подвързия. Страниците са пожълтели и чупливи. Последното вписване, надраскано с треперещ почерк, гласи: "Нещо се движи в сенките. Не са само играчките...". Под дневника напипвате студена, метална малка батерия!',
        condition: (state) => !state.inventory.includes('small_batteries'),
        action: (state) => ({ ...state, inventory: [...state.inventory, 'small_batteries'] }),
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'reception_desk_empty',
        label: 'Бюро на рецепцията',
        description: 'Вече претърсихте бюрото. Останаха само празни хартии и дебел слой прах, който полепва по пръстите ви.',
        condition: (state) => state.inventory.includes('small_batteries'),
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'vintage_poster',
        label: 'Вземи Винтидж Плакат (Колекционерски предмет)',
        description: 'Открихте стар, рядък плакат на Хъги Въги от първите дни на фабриката! Цветовете са изненадващо ярки под слоя мръсотия, а хартията е плътна и гладка на допир.',
        condition: (state) => !state.collectibles.includes('vintage_poster'),
        actionSound: SOUNDS.paper,
        action: (state) => ({ ...state, collectibles: [...state.collectibles, 'vintage_poster'] }),
        icon: <Zap className="w-4 h-4 mr-2 text-yellow-500" />
      },
      {
        id: 'heightened_senses_statue',
        label: 'Усети статуята (Изострени сетива)',
        description: 'Приближавате се до статуята на Хъги Въги. Тялото ви се напряга. Излъчва странна, потискаща аура, сякаш е жива. Имате чувството, че очите ѝ ви следят, въпреки че са просто пластмаса.',
        condition: (state) => state.character.perk === 'heightened_senses',
        actionSound: SOUNDS.heartbeat,
        icon: <Radio className="w-4 h-4 mr-2 text-indigo-400" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Отиди в Охранителната стая', nextId: 'security', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Опитай да отвориш голямата врата', nextId: 'lobby_locked', actionSound: SOUNDS.door_locked, icon: <Hand className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c3', text: 'Опитай да отвориш Офиса на управителя', nextId: 'manager_office_locked', condition: (state) => !state.inventory.includes('manager_badge'), actionSound: SOUNDS.door_locked, icon: <Hand className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c4', text: 'Използвай Работната карта за Офиса на управителя', nextId: 'manager_office', condition: (state) => state.inventory.includes('manager_badge'), actionSound: SOUNDS.success, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  manager_office_locked: {
    id: 'manager_office_locked',
    title: 'Заключена врата',
    text: '[Глух звук от заключена брава]. Вратата е масивна и не помръдва. До нея мига червена светлина от електронен четец за карти, който издава тихо, предупредително писукане. Изисква се високо ниво на достъп.',
    bgSound: SOUNDS.error,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Върни се в центъра на фоайето', nextId: 'lobby', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  manager_office: {
    id: 'manager_office',
    title: 'Офис на управителя',
    text: '[Скърцане на дървен под]. Влизате в луксозен, но напълно разхвърлян офис. Въздухът тук е застоял и мирише на стара кожа и прах. На масивното махагоново бюро лежи изгасен компютър с пукнат монитор. На стената се вижда малък, метален сейф, а до него виси странен, зловещ чертеж на експеримент 1006, чиито линии изглеждат нарисувани с трепереща ръка. В дъното на стаята има голям прозорец, който гледа към производствената зона.',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    interactables: [
      {
        id: 'office_window_open',
        label: 'Отвори прозореца',
        description: 'Отваряте тежкия стъклен прозорец. Отдолу се чува глухото ехо на изоставените машини. Въздухът е студен и мирише на машинно масло.',
        action: (state) => ({ ...state, isWindowOpen: true }),
        condition: (state) => !state.isWindowOpen,
        actionSound: SOUNDS.window_open,
        icon: <Hand className="w-4 h-4 mr-2" />
      },
      {
        id: 'office_window_close',
        label: 'Затвори прозореца',
        description: 'Затваряте тежкия стъклен прозорец. Стаята става по-тиха и топла.',
        action: (state) => ({ ...state, isWindowOpen: false }),
        condition: (state) => state.isWindowOpen,
        actionSound: SOUNDS.window_close,
        icon: <Hand className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Разгледай чертежа', nextId: 'manager_drawing', actionSound: SOUNDS.paper, icon: <Search className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Отвори малкия сейф на стената', nextId: 'manager_safe', condition: (state) => !state.inventory.includes('owl_monocle'), actionSound: SOUNDS.clank, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c3', text: 'Върни се във фоайето', nextId: 'lobby', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  manager_safe: {
    id: 'manager_safe',
    title: 'Малък сейф',
    text: '[Рязко метално щракване и скърцане на панти]. Тежката врата на сейфа се отваря бавно. Вътре, върху слой от фин прах, лежи стар монокъл със златна рамка. Стъклото му е студено и леко надраскано. Защо ли управителят е пазил това толкова ревниво?',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.discovery,
    choices: [
      { id: 'c1', text: 'Вземи монокъла', nextId: 'manager_office', actionSound: SOUNDS.pickup, action: (state) => ({ ...state, inventory: [...state.inventory, 'owl_monocle'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> }
    ]
  },
  manager_drawing: {
    id: 'manager_drawing',
    title: 'Чертеж на Експеримент 1006',
    text: 'Хартията на чертежа е груба и пожълтяла. Изобразява дълга, неестествена скелетна ръка с остри като бръснач нокти, нарисувани с натрапчив детайл. Отдолу, с червено мастило, което прилича на засъхнала кръв, пише: "Прототипът. Той е ключът към всичко. Не трябва да се събужда." Студена тръпка преминава по гърба ви.',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Остави чертежа', nextId: 'manager_office', actionSound: SOUNDS.paper, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  lobby_locked: {
    id: 'lobby_locked',
    title: 'Заключена врата',
    text: '[Силен звук от тракане на тежък метал]. Масивната стоманена врата към Производствената зона е здраво заключена и студена на допир. Електронният панел до нея е напълно мъртъв - няма ток. Трябва да намерите начин да възстановите захранването, за да продължите.',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Върни се в центъра на фоайето', nextId: 'lobby', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  security: {
    id: 'security',
    title: 'Охранителна стая',
    text: '[Тихо бръмчене на стари монитори]. Охранителната стая е тясна, прашна и мирише на изгоряла електроника. На металното бюро лежи отворена картонена кутия и прашен касетофон. В ъгъла се забелязва тежък метален сейф с три цветни бутона, покрити с мръсотия.',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    interactables: [
      {
        id: 'monitors',
        label: 'Охранителни монитори',
        description: 'Повечето екрани са напукани или показват само бял шум, който пращи тихо. На един от тях обаче, през смущенията, виждате висока, тъмна фигура, която стои неестествено неподвижно в коридор B. Изведнъж камерата изпуква и екранът почернява.',
        actionSound: SOUNDS.tv,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'perceptive_safe',
        label: 'Огледай сейфа отблизо (Наблюдателен)',
        description: 'Приближавате се и забелязвате леки следи от износване по бутоните. Прахът е изтрит по специфичен начин. Изглежда Средният бутон е натискан последен, а Левият - първи.',
        condition: (state) => state.character.perk === 'perceptive',
        actionSound: SOUNDS.paper,
        icon: <Eye className="w-4 h-4 mr-2 text-purple-400" />
      },
      {
        id: 'heightened_senses_safe',
        label: 'Усети сейфа (Изострени сетива)',
        description: 'Докосвате студения метал на сейфа. Усещате слаба, остатъчна енергия от човека, който го е затворил. В ума ви изниква последователност: ляво, дясно, среда.',
        condition: (state) => state.character.perk === 'heightened_senses',
        actionSound: SOUNDS.heartbeat,
        icon: <Radio className="w-4 h-4 mr-2 text-indigo-400" />
      },
      {
        id: 'golden_gear',
        label: 'Вземи Златно зъбно колело (Колекционерски предмет)',
        description: 'Намерихте скрито Златно зъбно колело зад един от мониторите! То е тежко, студено и блести слабо в полумрака.',
        condition: (state) => !state.collectibles.includes('golden_gear'),
        actionSound: SOUNDS.pickup,
        action: (state) => ({ ...state, collectibles: [...state.collectibles, 'golden_gear'] }),
        icon: <Zap className="w-4 h-4 mr-2 text-yellow-500" />
      }
    ],
    choices: [
      { 
        id: 'c1', 
        text: 'Вземи Синята ръка от кутията', 
        nextId: 'security_hand', 
        condition: (state) => !state.inventory.includes('blue_hand'),
        actionSound: SOUNDS.pickup,
        action: (state) => ({ ...state, inventory: [...state.inventory, 'blue_hand'] }),
        icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> 
      },
      {
        id: 'c2',
        text: 'Претърси ръждясалите метални шкафове',
        nextId: 'security_cabinets',
        condition: (state) => !state.inventory.includes('vhs_tape'),
        actionSound: SOUNDS.door,
        icon: <Search className="w-5 h-5 mr-2" aria-hidden="true" />
      },
      {
        id: 'c_audio',
        text: 'Пуснете стария касетофон',
        nextId: 'security_tape',
        actionSound: SOUNDS.radio,
        icon: <Play className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" />
      },
      {
        id: 'c3',
        text: 'Опитай да отвориш сейфа (Аудио пъзел)',
        nextId: 'safe_puzzle_start',
        condition: (state) => !state.inventory.includes('small_batteries'),
        icon: <Hand className="w-5 h-5 mr-2" aria-hidden="true" />
      },
      {
        id: 'c4',
        text: 'Върни се във фоайето',
        nextId: 'lobby_power',
        condition: (state) => state.inventory.includes('blue_hand'),
        actionSound: SOUNDS.door,
        icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" />
      }
    ]
  },
  security_tape: {
    id: 'security_tape',
    title: 'Стар касетофон',
    text: '[Силно пращене от стара лента, последвано от изкривена мелодия на музикална кутия]. Чувате ентусиазиран, но леко зловещ рекламен глас: "Playtime Co. - където мечтите стават реалност!" Записът завършва с три отчетливи, електронни тона, които отекват в стаята: Нисък, плътен тон; Висок, пронизителен тон; и Среден, резониращ тон.',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Спри записа и се огледай', nextId: 'security', actionSound: SOUNDS.switch, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  safe_puzzle_start: {
    id: 'safe_puzzle_start',
    title: 'Музикален сейф',
    text: 'Сейфът е покрит с ръжда, но трите му големи бутона изглеждат използвани. Левият издава Нисък, дълбок тон. Средният издава Среден, вибриращ тон. Десният издава Висок, пронизителен тон. Трябва да въведете правилната последователност от 3 тона, за да отключите механизма. Кой бутон ще натиснете първо?',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Натисни Левия бутон (Нисък тон)', nextId: 'safe_puzzle_1', actionSound: SOUNDS.clank, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Натисни Средния бутон (Среден тон)', nextId: 'safe_puzzle_fail', actionSound: SOUNDS.clank, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c3', text: 'Натисни Десния бутон (Висок тон)', nextId: 'safe_puzzle_fail', actionSound: SOUNDS.clank, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c4', text: 'Откажи се и се върни назад', nextId: 'security', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  safe_puzzle_1: {
    id: 'safe_puzzle_1',
    title: 'Музикален сейф - Стъпка 2',
    text: '[Дълбок, нисък тон, който отеква в метала]. Чува се тихо механично прещракване вътре в сейфа. Първият тон е приет. Кой бутон ще натиснете сега?',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Натисни Левия бутон (Нисък тон)', nextId: 'safe_puzzle_fail', actionSound: SOUNDS.clank, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Натисни Средния бутон (Среден тон)', nextId: 'safe_puzzle_fail', actionSound: SOUNDS.clank, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c3', text: 'Натисни Десния бутон (Висок тон)', nextId: 'safe_puzzle_2', actionSound: SOUNDS.clank, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c4', text: 'Откажи се и се върни назад', nextId: 'security', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  safe_puzzle_2: {
    id: 'safe_puzzle_2',
    title: 'Музикален сейф - Стъпка 3',
    text: '[Пронзителен, висок тон, който почти дразни слуха]. Още едно, по-силно механично прещракване. Вторият тон е приет. Остава само един. Кой бутон ще натиснете последно?',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Натисни Левия бутон (Нисък тон)', nextId: 'safe_puzzle_fail', actionSound: SOUNDS.clank, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Натисни Средния бутон (Среден тон)', nextId: 'security_safe', actionSound: SOUNDS.success, action: (state) => ({ ...state, inventory: [...state.inventory, 'small_batteries', 'torn_note'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c3', text: 'Натисни Десния бутон (Висок тон)', nextId: 'safe_puzzle_fail', actionSound: SOUNDS.clank, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c4', text: 'Откажи се и се върни назад', nextId: 'security', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  safe_puzzle_fail: {
    id: 'safe_puzzle_fail',
    title: 'Грешен код',
    text: '[Рязък, стържещ звук от силна аларма за грешка]. Червена светлина премигва над бутоните. Въведохте грешна последователност и вътрешният механизъм се нулира с тежко издрънчаване.',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Опитай отново', nextId: 'safe_puzzle_start', icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Върни се към стаята', nextId: 'security', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  security_hand: {
    id: 'security_hand',
    title: 'Охранителна стая',
    text: 'Взехте Синята ръка от устройството GrabPack! Механизмът е тежък, но удобен, а пластмасовата ръка е свързана със здрава, студена стоманена тел. С нея можете да достигате далечни предмети и да взаимодействате с електрически панели.',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.discovery,
    choices: [
      { id: 'c1', text: 'Продължи да оглеждаш стаята', nextId: 'security', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  security_safe: {
    id: 'security_safe',
    title: 'Отворен сейф',
    text: '[Тежко метално щракване и победна мелодия]. Правилният код! Вратата на сейфа се отваря с леко скърцане на пантите. Вътре, сред миризмата на стара хартия, намирате студени Малки батерии и Скъсана бележка с мастило, което се е размазало: "Червено, Синьо, Зелено... пътят към знанието".',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.discovery,
    choices: [
      { id: 'c1', text: 'Продължи да оглеждаш стаята', nextId: 'security', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  security_cabinets: {
    id: 'security_cabinets',
    title: 'Метални шкафове',
    text: '[Силно стържене на ръждясали метални вратички]. Вътре, сред прах и паяжини, намирате стара Жълта видеокасета с избледнял етикет и Празно фенерче с метален корпус (без батерии). Може би някъде има телевизор, на който да пуснете касетата?',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    choices: [
      { 
        id: 'c1', 
        text: 'Вземи предметите и се върни', 
        nextId: 'security', 
        actionSound: SOUNDS.pickup, 
        action: (state) => ({ ...state, inventory: [...state.inventory, 'vhs_tape', 'empty_flashlight'] }), 
        icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> 
      }
    ]
  },
  lobby_power: {
    id: 'lobby_power',
    title: 'Главно фоайе (Със Синя ръка)',
    text: 'Отново сте в огромното, прашно фоайе. Статуята на Хъги Въги все още се извисява в центъра... макар че сякаш сянката ѝ е станала по-дълга. Високо горе, над вратата, забелязвате електрически панел, който искри слабо. Сега можете да го достигнете със Синята ръка. Вратата към Офиса на управителя също е тук.',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Използвай Синята ръка върху електрическия панел', nextId: 'power_restored', actionSound: SOUNDS.power_up, icon: <Zap className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { 
        id: 'c2', 
        text: 'Постави Жълтата касета в стария телевизор до стената', 
        nextId: 'secret_room', 
        condition: (state) => state.inventory.includes('vhs_tape') && !state.inventory.includes('screwdriver'), 
        actionSound: SOUNDS.tv, 
        icon: <Play className="w-5 h-5 mr-2" aria-hidden="true" /> 
      },
      { 
        id: 'c3', 
        text: 'Гледай Златната касета на телевизора', 
        nextId: 'golden_vhs_view', 
        condition: (state) => state.inventory.includes('golden_vhs'), 
        actionSound: SOUNDS.tv, 
        icon: <Play className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> 
      },
      { 
        id: 'c4', 
        text: 'Разгледай старата библиотека до стената', 
        nextId: 'lobby_bookshelf', 
        condition: (state) => state.inventory.includes('torn_note') && !state.inventory.includes('library_unlocked'), 
        actionSound: SOUNDS.paper, 
        icon: <Search className="w-5 h-5 mr-2" aria-hidden="true" /> 
      },
      {
        id: 'c5',
        text: 'Влез в Тайната библиотека',
        nextId: 'secret_library',
        condition: (state) => state.inventory.includes('library_unlocked'),
        actionSound: SOUNDS.door,
        icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" />
      },
      { id: 'c6', text: 'Опитай да отвориш Офиса на управителя', nextId: 'manager_office_locked_power', condition: (state) => !state.inventory.includes('manager_badge'), actionSound: SOUNDS.door_locked, icon: <Hand className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c7', text: 'Използвай Работната карта за Офиса на управителя', nextId: 'manager_office_power', condition: (state) => state.inventory.includes('manager_badge'), actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  manager_office_locked_power: {
    id: 'manager_office_locked_power',
    title: 'Заключена врата',
    text: '[Глух звук от заключена брава]. Вратата е масивна и не помръдва. До нея мига червена светлина от електронен четец за карти, който издава тихо, предупредително писукане. Изисква се високо ниво на достъп.',
    bgSound: SOUNDS.error,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Върни се в центъра на фоайето', nextId: 'lobby_power', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Хакай електронната ключалка (Технически гений)', nextId: 'manager_office_power', condition: (state) => state.character.perk === 'tech', actionSound: SOUNDS.zap, icon: <Unlock className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> }
    ]
  },
  manager_office_power: {
    id: 'manager_office_power',
    title: 'Офис на управителя',
    text: '[Скърцане на дървен под]. Влизате в луксозен, но напълно разхвърлян офис. Въздухът тук е застоял и мирише на стара кожа и прах. На масивното махагоново бюро лежи изгасен компютър с пукнат монитор. На стената се вижда малък, метален сейф, а до него виси странен, зловещ чертеж на експеримент 1006, чиито линии изглеждат нарисувани с трепереща ръка. В дъното на стаята има голям прозорец, който гледа към производствената зона.',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    interactables: [
      {
        id: 'office_window_open',
        label: 'Отвори прозореца',
        description: 'Отваряте тежкия стъклен прозорец. Отдолу се чува глухото ехо на изоставените машини. Въздухът е студен и мирише на машинно масло.',
        action: (state) => ({ ...state, isWindowOpen: true }),
        condition: (state) => !state.isWindowOpen,
        actionSound: SOUNDS.window_open,
        icon: <Hand className="w-4 h-4 mr-2" />
      },
      {
        id: 'office_window_close',
        label: 'Затвори прозореца',
        description: 'Затваряте тежкия стъклен прозорец. Стаята става по-тиха и топла.',
        action: (state) => ({ ...state, isWindowOpen: false }),
        condition: (state) => state.isWindowOpen,
        actionSound: SOUNDS.window_close,
        icon: <Hand className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Разгледай чертежа', nextId: 'manager_drawing_power', icon: <Search className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Отвори малкия сейф на стената', nextId: 'manager_safe_power', condition: (state) => !state.inventory.includes('owl_monocle'), actionSound: SOUNDS.door, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c3', text: 'Върни се във фоайето', nextId: 'lobby_power', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c4', text: 'Отвори шкафа със Звездния ключ', nextId: 'manager_star_cabinet', condition: (state) => state.inventory.includes('star_key') && !state.inventory.includes('employee_manual'), actionSound: SOUNDS.success, icon: <Unlock className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> }
    ]
  },
  manager_star_cabinet: {
    id: 'manager_star_cabinet',
    title: 'Тайният шкаф',
    text: '[Щракване на тежка ключалка]. Звездният ключ пасва идеално в скритата ключалка зад картината. Вътре намирате прашен Наръчник на служителя с гриф "Строго секретно", описващ бруталните експерименти с играчки.',
    bgSound: SOUNDS.door,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Вземи Наръчника на служителя', nextId: 'manager_office_power', actionSound: SOUNDS.pickup, action: (state) => ({ ...state, inventory: Array.from(new Set([...state.inventory, 'employee_manual', 'star_key'])) }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> }
    ]
  },
  manager_safe_power: {
    id: 'manager_safe_power',
    title: 'Малък сейф',
    text: '[Рязко метално щракване и скърцане на панти]. Тежката врата на сейфа се отваря бавно. Вътре, върху слой от фин прах, лежи стар монокъл със златна рамка. Стъклото му е студено и леко надраскано. Защо ли управителят е пазил това толкова ревниво?',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Вземи монокъла', nextId: 'manager_office_power', actionSound: SOUNDS.pickup, action: (state) => ({ ...state, inventory: [...state.inventory, 'owl_monocle'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> }
    ]
  },
  manager_drawing_power: {
    id: 'manager_drawing_power',
    title: 'Чертеж на Експеримент 1006',
    text: 'Хартията на чертежа е груба и пожълтяла. Изобразява дълга, неестествена скелетна ръка с остри като бръснач нокти, нарисувани с натрапчив детайл. Отдолу, с червено мастило, което прилича на засъхнала кръв, пише: "Прототипът. Той е ключът към всичко. Не трябва да се събужда." Студена тръпка преминава по гърба ви.',
    bgSound: SOUNDS.security_bg,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Остави чертежа', nextId: 'manager_office_power', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  lobby_bookshelf: {
    id: 'lobby_bookshelf',
    title: 'Стара библиотека',
    text: 'Пред вас се издига масивна, прашна библиотека от тъмно дърво, пълна с дебели книги с кожени подвързии. Мирише на стара хартия и мухъл. Спомняте си бележката: "Червено, Синьо, Зелено...".',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.exploration,
    choices: [
      { 
        id: 'c1', 
        text: 'Дръпни Червената, Синята и Зелената книга', 
        nextId: 'lobby_bookshelf_success', 
        actionSound: SOUNDS.door_heavy, 
        action: (state) => ({ ...state, inventory: [...state.inventory, 'library_unlocked'] }),
        icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> 
      },
      { id: 'c2', text: 'Върни се в центъра на фоайето', nextId: 'lobby_power', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  lobby_bookshelf_success: {
    id: 'lobby_bookshelf_success',
    title: 'Таен проход',
    text: '[Тътен и звук от стържещ камък]. Дървената библиотека се разтриса и бавно се завърта около оста си, вдигайки облак прах. Зад нея се разкрива тъмен, тесен таен проход към скрито помещение, от който лъха студен въздух!',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Влез в Тайната библиотека', nextId: 'secret_library', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  secret_library: {
    id: 'secret_library',
    title: 'Тайната библиотека',
    text: '[Сухо шумолене на хартия и тихо цъкане на механизъм]. Помещението е тясно, без прозорци, препълнено с високи до тавана архиви и разпилени документи. Мирише силно на мухъл и мастило. В центъра стои масивно дъбово бюро със странна дървена кутия, заключена с избледнял пъзел със символи: Луна, Слънце, Звезда. На един прашен рафт, полускрит в сенките, седи голям механичен бухал, чиито стъклени очи примигват неравномерно с тихо бръмчене.',
    bgSound: SOUNDS.library_bg,
    bgMusic: MUSIC.suspense,
    interactables: [
      {
        id: 'secret_tape',
        label: 'Вземи Тайна касета (Колекционерски предмет)',
        description: 'Открихте прашна, тежка черна касета със странни, ръчно нарисувани символи, скрита зад една от дебелите книги! Пластмасата ѝ е леко разтопена в единия ъгъл.',
        condition: (state) => !state.collectibles.includes('secret_tape'),
        actionSound: SOUNDS.pickup,
        action: (state) => ({ ...state, collectibles: [...state.collectibles, 'secret_tape'] }),
        icon: <Zap className="w-4 h-4 mr-2 text-yellow-500" />
      }
    ],
    choices: [
      { 
        id: 'c1', 
        text: 'Говори с Професор Бухал', 
        nextId: 'dialogue_owl_start', 
        actionSound: SOUNDS.robot, 
        icon: <MessageSquare className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> 
      },
      { 
        id: 'c2', 
        text: 'Прочети разпръснатите документи', 
        nextId: 'secret_library_docs', 
        actionSound: SOUNDS.paper, 
        icon: <Search className="w-5 h-5 mr-2" aria-hidden="true" /> 
      },
      { 
        id: 'c3', 
        text: 'Опитай да отвориш малката дървена кутия', 
        nextId: 'secret_library_box_locked', 
        condition: (state) => !state.inventory.includes('elliots_diary') && !state.inventory.includes('owl_key'),
        actionSound: SOUNDS.door_locked, 
        icon: <Hand className="w-5 h-5 mr-2 text-red-400" aria-hidden="true" /> 
      },
      { 
        id: 'c4', 
        text: 'Използвай Ключа-перо, за да отвориш кутията', 
        nextId: 'secret_library_box', 
        condition: (state) => !state.inventory.includes('elliots_diary') && state.inventory.includes('owl_key'),
        actionSound: SOUNDS.keys, 
        action: (state) => ({ ...state, inventory: [...state.inventory, 'elliots_diary'] }),
        icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> 
      },
      { id: 'c5', text: 'Върни се във фоайето', nextId: 'lobby_power', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  secret_library_box_locked: {
    id: 'secret_library_box_locked',
    title: 'Заключена кутия',
    text: '[Тихо почукване по дърво]. Кутията е изработена от тъмно, полирано дърво. Внимателно оглеждате ключалката - тя има странна, тясна форма на перо. Пъзелът със символите изглежда е фалшив, само за отвличане на вниманието. Трябва ви специален ключ, за да я отворите.',
    bgSound: SOUNDS.error,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Остави кутията', nextId: 'secret_library', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_owl_start: {
    id: 'dialogue_owl_start',
    title: 'Разговор с Професор Бухал',
    text: '[Силно стържене на ръждясали зъбни колела и механично, пресечено бухане]. Професор Бухал рязко завърта главата си на 180 градуса с пронизително скърцане на несмазан метал. Стъклените му очи ви фиксират. Гласът му е дълбок, монотонен, но изненадващо учтив, идващ от стар високоговорител в гърдите му: "Кой нарушава тишината на моето светилище? Аз съм Професор Бухал... или поне това, което остана от него."',
    bgSound: SOUNDS.robot,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.interaction,
    choices: [
      { id: 'c1', text: 'Попитай: "Какво правиш тук?"', nextId: 'dialogue_owl_lore', actionSound: SOUNDS.whisper, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Попитай: "Имаш ли нужда от помощ?"', nextId: 'dialogue_owl_quest', condition: (state) => !state.inventory.includes('owl_monocle') && !state.inventory.includes('owl_key'), actionSound: SOUNDS.whisper, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c3', text: 'Кажи: "Намерих твоя монокъл!"', nextId: 'dialogue_owl_reward', condition: (state) => state.inventory.includes('owl_monocle') && !state.inventory.includes('owl_key'), actionSound: SOUNDS.whisper, icon: <MessageSquare className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { id: 'c4', text: 'Край на разговора', nextId: 'secret_library', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_owl_lore: {
    id: 'dialogue_owl_lore',
    title: 'Историята на Професора',
    text: '[Бързо, нервно тракане на метален клюн]. "Аз бях създаден да обучавам децата," казва той, докато вътрешните му механизми тихо вибрират, "но бях счетен за твърде... плашещ. Затова ме скриха тук, в мрака, при забравените тайни на Елиът Лудвиг. Знам много, но виждам малко."',
    bgSound: SOUNDS.robot,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Върни се към другите въпроси', nextId: 'dialogue_owl_start', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_owl_quest: {
    id: 'dialogue_owl_quest',
    title: 'Молбата на Бухала',
    text: '[Протяжно, тъжно механично свистене, подобно на въздишка]. "Изгубих своя монокъл. Без него светът е само размазани сенки и не мога да чета тайните на фабриката. Мисля, че управителят го взе в своя офис, за да го изследва. Ако ми го върнеш, ще ти дам ключа за най-голямата тайна тук."',
    bgSound: SOUNDS.robot,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Ще го потърся', nextId: 'dialogue_owl_start', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_owl_reward: {
    id: 'dialogue_owl_reward',
    title: 'Наградата на Бухала',
    text: '[Радостно, ритмично щракане и бързо въртене на зъбни колела]. Професор Бухал пляска тежко с металните си крила, вдигайки прах. "Моят монокъл! Светът отново има очертания! Както обещах, ето ключа-перо за дървената кутия на бюрото. Там е истината, която търсиш." Той изплюва малък, изящно изработен метален ключ.',
    bgSound: SOUNDS.success,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.discovery,
    choices: [
      { id: 'c1', text: 'Вземи Ключа-перо и благодари', nextId: 'secret_library', action: (state) => ({ ...state, inventory: [...state.inventory, 'owl_key'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> }
    ]
  },
  secret_library_docs: {
    id: 'secret_library_docs',
    title: 'Разпръснати документи',
    text: 'Хартията е крехка и мирише на химикали. Написано е набързо: "Експеримент 1006 показва безпрецедентна интелигентност. Той координира другите. Трябва да го държим изолиран." Документите, пълни с ужасяващи диаграми, разкриват, че играчките са били съзнателни много преди инцидента.',
    bgSound: SOUNDS.library_bg,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Остави документите', nextId: 'secret_library', actionSound: SOUNDS.paper, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  secret_library_box: {
    id: 'secret_library_box',
    title: 'Отворена кутия',
    text: '[Меко метално щракване и скърцане на дърво]. Кутията се отваря плавно! Вътре, върху червено кадифе, лежи личният Дневник на Елиът. Страниците му са изписани с дребен, маниакален почерк. В него се споменава за таен тунел под вентилацията, който може да се отвори само с отвертка.',
    bgSound: SOUNDS.library_bg,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.discovery,
    choices: [
      { id: 'c1', text: 'Продължи да оглеждаш библиотеката', nextId: 'secret_library', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  golden_vhs_view: {
    id: 'golden_vhs_view',
    title: 'Златната касета',
    text: '[Силно пращене на стар кинескоп и бръмчене на електричество]. На екрана, през вълни от статичен шум, се появява основателят Елиът Лудвиг. Лицето му е бледо и изморено. "Ако гледате това, експериментът се е провалил. Ние си играхме на Бог със сираците. Унищожете фабриката. Разкрийте истината." Получавате тайно знание, което тежи като камък в стомаха ви.',
    bgSound: SOUNDS.machine,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.discovery,
    choices: [
      { id: 'c1', text: 'Изключи телевизора', nextId: 'lobby_power', actionSound: SOUNDS.tv, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  secret_room: {
    id: 'secret_room',
    title: 'Тайна стая за наблюдение',
    text: '[Силно пращене на телевизор и стържене на плъзгащ се панел]. Екранът светва в синьо. Зад телевизора, с глух тътен, се отваря малък таен панел в стената. Отвътре лъха на пот и страх. В тясното пространство се крие изплашен, треперещ бивш работник на име Марк!',
    bgSound: SOUNDS.machine,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.discovery,
    choices: [
      { id: 'c1', text: 'Говори с Марк', nextId: 'dialogue_mark_start', actionSound: SOUNDS.whisper, icon: <MessageSquare className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> }
    ]
  },
  dialogue_mark_start: {
    id: 'dialogue_mark_start',
    title: 'Разговор с Марк',
    text: '[Учестено, треперещо дишане и тракане на зъби]. Марк се свива в ъгъла, очите му са широко отворени от ужас. "Ти... ти не си една от тях! Аз се крия тук от седмици. Открих ужасната истина за експериментите в Playtime Co."',
    bgSound: SOUNDS.machine,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.interaction,
    choices: [
      { id: 'c1', text: 'Попитай: "Каква е истината?"', nextId: 'dialogue_mark_truth', actionSound: SOUNDS.whisper, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Попитай: "Можеш ли да ми помогнеш да избягам?"', nextId: 'dialogue_mark_help', actionSound: SOUNDS.whisper, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_mark_truth: {
    id: 'dialogue_mark_truth',
    title: 'Марк: Ужасната истина',
    text: 'Гласът му спада до пресипнал шепот, докато се оглежда параноично. "Те не са просто играчки. Те са... направени от хора. Сираци от програмата Playcare. Трябва да избягаш и да разкажеш на света какво се случва тук!"',
    bgSound: SOUNDS.machine,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Върни се към другите въпроси', nextId: 'dialogue_mark_start', actionSound: SOUNDS.whisper, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_mark_help: {
    id: 'dialogue_mark_help',
    title: 'Марк: Помощ за бягство',
    text: 'Той сочи към десния си крак, който е неестествено извит. "Не мога да дойда с теб, кракът ми е счупен. Но вземи тази Отвертка." Той ви подава тежък инструмент с жълта дръжка. "Ако Хъги Въги те подгони във вентилацията, търси завинтена решетка на пода. Това е единственият скрит изход!"',
    bgSound: SOUNDS.machine,
    bgMusic: MUSIC.suspense,
    choices: [
      { 
        id: 'c1', 
        text: 'Вземи отвертката и се върни във фоайето', 
        nextId: 'lobby_power', 
        actionSound: SOUNDS.clank, 
        action: (state) => ({ ...state, inventory: [...state.inventory, 'screwdriver'] }), 
        icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> 
      }
    ]
  },
  power_restored: {
    id: 'power_restored',
    title: 'Захранването е възстановено',
    text: '[Силно електрическо искрене и дълбоко бръмчене на стартиращ генератор]. Удряте панела със Синята ръка. Флуоресцентните лампи над вас примигват с бръмчене и заливат фоайето със студена, бяла светлина. Чувате тежък механичен звук откъм голямата врата - тя се отключи. Но чакайте... поглеждате към центъра на фоайето. Огромният пиедестал е празен. Статуята на Хъги Въги е ИЗЧЕЗНАЛА!',
    bgSound: SOUNDS.machine,
    bgMusic: MUSIC.chase,
    vibration: [200, 100, 200],
    choices: [
      { id: 'c1', text: 'Влез внимателно през отключената голяма врата', nextId: 'make_a_friend', actionSound: SOUNDS.door_heavy, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  make_a_friend: {
    id: 'make_a_friend',
    title: 'Зала "Направи си приятел"',
    text: '[Ниско, ритмично механично бръмчене и мирис на машинно масло]. Намирате се в огромна зала с висок таван. В центъра се извисява гигантска, неработеща машина за играчки, чиито конвейери блокират пътя към Производствената зона. За да я преместите, трябва да я включите, но на контролния панел зее празна дупка за Червена батерия. Виждате две други врати: една към Стаята за почивка и една към Склада (която има четец за карти). В сенчестия ъгъл има ръждясала метална врата към Килер за поддръжка.',
    bgSound: SOUNDS.machine,
    bgMusic: MUSIC.exploration,
    interactables: [
      {
        id: 'i1',
        label: 'Огледай машината за играчки',
        description: 'Огромна, сложна машина с конвейерни ленти и роботизирани ръце. На контролния панел има голям празен слот с надпис "Изисква се Червена батерия тип 4".',
        actionSound: SOUNDS.clank,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Отиди в Стаята за почивка', nextId: 'break_room', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Опитай да отвориш Склада', nextId: 'locked_storage', condition: (state) => !state.inventory.includes('keycard'), actionSound: SOUNDS.door_locked, icon: <Hand className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c3', text: 'Използвай Служебната карта, за да влезеш в Склада', nextId: 'storage_warehouse', condition: (state) => state.inventory.includes('keycard'), actionSound: SOUNDS.success, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c4', text: 'Влез в тъмния коридор към Стаята за отхвърлени играчки', nextId: 'dark_corridor', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c5', text: 'Отвори ръждясалата врата към Килера за поддръжка', nextId: 'maintenance_closet', actionSound: SOUNDS.door_heavy, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c6', text: 'Постави Червената батерия в машината', nextId: 'machine_powered', condition: (state) => state.inventory.includes('red_battery'), actionSound: SOUNDS.power_up, icon: <Zap className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { id: 'c7', text: 'Разгледай изоставената Зона за тестване на играчки', nextId: 'toy_testing_area', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  toy_testing_area: {
    id: 'toy_testing_area',
    title: 'Зона за тестване на играчки',
    text: '[Ехо от стъпки в огромно празно помещение]. Влизате в голяма стая, пълна с полуразрушени препятствия и избледнели мишени. Това е мястото, където са тествали издръжливостта и рефлексите на играчките. В ъгъла виждате странна машина с надпис "Тест за интелигентност", а до нея има полуотворена врата към стаята за наблюдение.',
    bgSound: SOUNDS.factory,
    bgMusic: MUSIC.exploration,
    interactables: [
      {
        id: 'testing_machine',
        label: 'Огледай машината за тест',
        description: 'Машината има сложен механизъм. Изглежда, че е била използвана за тестване на когнитивните способности на по-напредналите играчки. За съжаление, захранващият й кабел е прекъснат.',
        actionSound: SOUNDS.clank,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Влез в Стаята за наблюдение', nextId: 'observation_room', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Върни се в Залата "Направи си приятел"', nextId: 'make_a_friend', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  observation_room: {
    id: 'observation_room',
    title: 'Стая за наблюдение',
    text: '[Тихо, ритмично туптене от вентилацията]. Зад прашното еднопосочно стъкло виждате цялата тестова зона. На бюрото има изоставени записки от изследователите и странен ключ с форма на звезда.',
    bgSound: SOUNDS.vent,
    bgMusic: MUSIC.suspense,
    interactables: [
      {
        id: 'research_notes',
        label: 'Прочети записките',
        description: '"Обект 1006 показва безпрецедентна интелигентност. Той не просто решава пъзелите, той ги саботира. Трябва да засилим мерките за сигурност." Това звучи зловещо.',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'secret_note_2',
        label: 'Вземи Тайна бележка (Колекционерски предмет)',
        description: 'Намерихте смачкана бележка под бюрото: "Експериментите излизат извън контрол. Трябва да затворим фабриката, преди да е станало твърде късно."',
        condition: (state) => !state.secretNotes.includes('secret_note_2'),
        actionSound: SOUNDS.paper,
        action: (state) => ({ ...state, secretNotes: [...state.secretNotes, 'secret_note_2'] }),
        icon: <Search className="w-4 h-4 mr-2 text-indigo-400" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Вземи Звездния ключ', nextId: 'observation_room_empty', condition: (state) => !state.inventory.includes('star_key'), actionSound: SOUNDS.pickup, action: (state) => ({ ...state, inventory: [...state.inventory, 'star_key'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Върни се в Зоната за тестване', nextId: 'toy_testing_area', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  observation_room_empty: {
    id: 'observation_room_empty',
    title: 'Стая за наблюдение',
    text: '[Тихо, ритмично туптене от вентилацията]. Зад прашното еднопосочно стъкло виждате цялата тестова зона. Бюрото вече е празно, но звуците от вентилацията продължават да ви държат нащрек.',
    bgSound: SOUNDS.vent,
    bgMusic: MUSIC.suspense,
    interactables: [
      {
        id: 'research_notes',
        label: 'Прочети записките',
        description: '"Обект 1006 показва безпрецедентна интелигентност. Той не просто решава пъзелите, той ги саботира. Трябва да засилим мерките за сигурност." Това звучи зловещо.',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'secret_note_2',
        label: 'Вземи Тайна бележка (Колекционерски предмет)',
        description: 'Намерихте смачкана бележка под бюрото: "Експериментите излизат извън контрол. Трябва да затворим фабриката, преди да е станало твърде късно."',
        condition: (state) => !state.secretNotes.includes('secret_note_2'),
        actionSound: SOUNDS.paper,
        action: (state) => ({ ...state, secretNotes: [...state.secretNotes, 'secret_note_2'] }),
        icon: <Search className="w-4 h-4 mr-2 text-indigo-400" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Върни се в Зоната за тестване', nextId: 'toy_testing_area', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  maintenance_closet: {
    id: 'maintenance_closet',
    title: 'Килер за поддръжка',
    text: '[Мирис на ръжда и влага]. Тясно и прашно помещение, претъпкано със стари инструменти и зловещи, разглобени пластмасови части за играчки. На една от металните полици, покрит с масло, лежи тежък гаечен ключ.',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.exploration,
    interactables: [
      {
        id: 'secret_note_1',
        label: 'Вземи Тайна бележка (Колекционерски предмет)',
        description: 'Намерихте скрита бележка зад кутия с инструменти: "Те не са просто играчки. Те ни наблюдават."',
        condition: (state) => !state.secretNotes.includes('secret_note_1'),
        actionSound: SOUNDS.paper,
        action: (state) => ({ ...state, secretNotes: [...state.secretNotes, 'secret_note_1'], inventory: [...state.inventory, 'secret_note_1'] }),
        icon: <Search className="w-4 h-4 mr-2 text-indigo-400" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Вземи гаечния ключа', nextId: 'maintenance_closet_empty', condition: (state) => !state.inventory.includes('wrench'), actionSound: SOUNDS.clank, action: (state) => ({ ...state, inventory: [...state.inventory, 'wrench'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Върни се в Залата "Направи си приятел"', nextId: 'make_a_friend', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  maintenance_closet_empty: {
    id: 'maintenance_closet_empty',
    title: 'Килер за поддръжка',
    text: '[Мирис на ръжда и влага]. Тясно и прашно помещение, претъпкано със стари инструменти и зловещи, разглобени пластмасови части за играчки. Полицата, от която взехте гаечния ключ, сега е празна.',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.exploration,
    entrySound: SOUNDS.discovery,
    interactables: [
      {
        id: 'secret_note_1',
        label: 'Вземи Тайна бележка (Колекционерски предмет)',
        description: 'Намерихте скрита бележка зад кутия с инструменти: "Те не са просто играчки. Те ни наблюдават."',
        condition: (state) => !state.secretNotes.includes('secret_note_1'),
        actionSound: SOUNDS.paper,
        action: (state) => ({ ...state, secretNotes: [...state.secretNotes, 'secret_note_1'], inventory: [...state.inventory, 'secret_note_1'] }),
        icon: <Search className="w-4 h-4 mr-2 text-indigo-400" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Върни се в Залата "Направи си приятел"', nextId: 'make_a_friend', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dark_corridor: {
    id: 'dark_corridor',
    title: 'Тъмен коридор',
    text: '[Ритмичен звук от капеща вода и далечно ехо]. Коридорът пред вас е непрогледно тъмен. Въздухът става леден. Не виждате абсолютно нищо пред себе си, сякаш мракът е физически плътен. Опасно е да продължите без светлина, но ако се наложи, ще трябва да разчитате единствено на слуха си.',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.suspense,
    interactables: [
      {
        id: 'i1',
        label: 'Опипай стените',
        description: 'Стените са ледени и покрити с лепкава влага. Под пръстите си усещате дълбоки, назъбени драскотини по метала, сякаш нещо с огромни нокти е минало оттук.',
        actionSound: SOUNDS.paper,
        icon: <Hand className="w-4 h-4 mr-2" />
      },
      {
        id: 'perceptive_listen',
        label: 'Ослушай се внимателно (Наблюдателен)',
        description: 'Затваряте очи и се концентрирате. Чувате ниско, гърлено ръмжене отляво и опасно пращене на оголени кабели направо. По-добре да не ходите натам в тъмното.',
        condition: (state) => state.character.perk === 'perceptive',
        actionSound: SOUNDS.monster_growl,
        icon: <Eye className="w-4 h-4 mr-2 text-purple-400" />
      },
      {
        id: 'heightened_senses_listen',
        label: 'Усети опасността (Изострени сетива)',
        description: 'Косата на врата ви настръхва. Инстинктите ви крещят, че отляво дебне огромно, смъртоносно създание, а направо има смъртоносен капан. Само пътят надясно е чист от злонамерена енергия.',
        condition: (state) => state.character.perk === 'heightened_senses',
        actionSound: SOUNDS.heartbeat,
        icon: <Radio className="w-4 h-4 mr-2 text-indigo-400" />
      }
    ],
    choices: [
      { 
        id: 'c1', 
        text: 'Комбинирай Празното фенерче и Малките батерии', 
        nextId: 'dark_corridor_lit', 
        condition: (state) => state.inventory.includes('empty_flashlight') && state.inventory.includes('small_batteries') && !state.inventory.includes('flashlight'), 
        actionSound: SOUNDS.clank, 
        action: (state) => ({ 
          ...state, 
          inventory: [...state.inventory.filter(i => i !== 'empty_flashlight' && i !== 'small_batteries'), 'flashlight'] 
        }),
        icon: <Zap className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> 
      },
      { 
        id: 'c2', 
        text: 'Включи Работещото фенерче и продължи', 
        nextId: 'rejected_room', 
        condition: (state) => state.inventory.includes('flashlight'), 
        actionSound: SOUNDS.zap, 
        icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> 
      },
      { 
        id: 'c3', 
        text: 'Продължи напред в тъмното (Аудио навигация)', 
        nextId: 'dark_maze_1', 
        condition: (state) => !state.inventory.includes('flashlight'), 
        actionSound: SOUNDS.footsteps, 
        icon: <Volume2 className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> 
      },
      { 
        id: 'c4', 
        text: 'Върни се в Залата "Направи си приятел"', 
        nextId: 'make_a_friend', 
        actionSound: SOUNDS.door, 
        icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> 
      },
      {
        id: 'c5',
        text: 'Прескочи пропастта в тъмното (Атлет)',
        nextId: 'rejected_room',
        condition: (state) => state.character.perk === 'athletic',
        actionSound: SOUNDS.footsteps,
        icon: <Activity className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" />
      }
    ]
  },
  dark_maze_1: {
    id: 'dark_maze_1',
    title: 'Тъмен коридор - Стъпка 1',
    text: '[Свистене на студен въздух]. Пълна тъмнина. Всяка стъпка е риск. Трябва да изберете посока само по звука. Отляво се чува дълбоко, неравномерно ръмжащо дишане, което кара косъмчетата по врата ви да настръхнат. Отдясно се чува ритмично, успокояващо капане на вода. Накъде ще тръгнете?',
    bgSound: SOUNDS.wind,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Тръгни наляво (към дишането)', nextId: 'dark_corridor_death_monster', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Тръгни надясно (към капещата вода)', nextId: 'dark_maze_2', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c3', text: 'Върни се назад', nextId: 'dark_corridor', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dark_maze_2: {
    id: 'dark_maze_2',
    title: 'Тъмен коридор - Стъпка 2',
    text: '[Ехо от собствените ви стъпки]. Продължавате напред, плъзгайки ръка по влажната стена. Сега чувате силно, агресивно бръмчене на електричество направо, сякаш цяло табло дава на късо. Отляво усещате лек, студен повей на вятър и чувате ритмичното скърцане на разхлабена метална врата. Накъде ще тръгнете?',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.suspense,
    interactables: [
      {
        id: 'heightened_senses_listen_2',
        label: 'Усети опасността (Изострени сетива)',
        description: 'Въздухът направо пращи от смъртоносно напрежение. Инстинктът ви за самосъхранение ви дърпа силно наляво, към студения повей.',
        condition: (state) => state.character.perk === 'heightened_senses',
        actionSound: SOUNDS.heartbeat,
        icon: <Radio className="w-4 h-4 mr-2 text-indigo-400" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Тръгни направо (към електричеството)', nextId: 'dark_corridor_death_electric', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Тръгни наляво (към вятъра)', nextId: 'rejected_room', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c3', text: 'Върни се назад', nextId: 'dark_corridor', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dark_corridor_death_monster: {
    id: 'dark_corridor_death_monster',
    title: 'Край на играта',
    text: '[Оглушителен рев и звук от разкъсване]. Отидохте право в прегръдките на нещо огромно и гладно, скрито в тъмното. Горещ дъх обгаря лицето ви миг преди челюстите да се затворят. Край на играта.',
    bgSound: SOUNDS.monster_growl,
    bgMusic: MUSIC.chase,
    entrySound: SOUNDS.jumpscare,
    vibration: [300, 100, 300, 100, 500],
    choices: [
      { id: 'c1', text: 'Опитай отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dark_corridor_death_electric: {
    id: 'dark_corridor_death_electric',
    title: 'Край на играта',
    text: '[Ослепителна синя светлина и оглушително пращене]. Настъпихте дебел, оголен кабел под високо напрежение в локва вода. Тялото ви се гърчи неконтролируемо, докато мракът ви поглъща завинаги. Край на играта.',
    bgSound: SOUNDS.zap,
    bgMusic: MUSIC.chase,
    entrySound: SOUNDS.jumpscare,
    vibration: [300, 100, 300, 100, 500],
    choices: [
      { id: 'c1', text: 'Опитай отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dark_corridor_lit: {
    id: 'dark_corridor_lit',
    title: 'Тъмен коридор (Осветен)',
    text: '[Рязко пластмасово щракване]. Комбинирахте батериите и фенерчето! Тесният лъч жълта светлина прорязва мрака, разкривайки пътя напред и спасявайки ви от огромна, зейнала дупка в пода, от която се носи мирис на гнило.',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Продължи към Стаята за отхвърлени играчки', nextId: 'rejected_room', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dark_corridor_death: {
    id: 'dark_corridor_death',
    title: 'Край на играта',
    text: '[Свистене на въздух и отдалечаващ се писък]. Направихте грешна стъпка в тъмното. Подът изчезва изпод краката ви и вие пропадате в дълбока, черна вентилационна шахта. Падането изглежда безкрайно. Край на играта.',
    bgSound: SOUNDS.wind,
    bgMusic: MUSIC.chase,
    entrySound: SOUNDS.jumpscare,
    vibration: [300, 100, 300, 100, 500],
    choices: [
      { id: 'c1', text: 'Опитай отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  rejected_room: {
    id: 'rejected_room',
    title: 'Стая за отхвърлени играчки',
    text: '[Хриптящо, тежко дишане и мирис на изгоряла гума]. Стаята е хаотично претъпкана с дефектни части за играчки. Огромен, червен динозавър играчка на име Брон седи в средата, блокирайки масивна метална врата. Той диша тежко, с механично хриптене, и ви гледа с неестествено тъжни, стъклени очи. В ъгъла, върху купчина скъсани плюшени мечета, виждате захвърлено яке на служител.',
    bgSound: SOUNDS.breathing,
    bgMusic: MUSIC.exploration,
    interactables: [
      {
        id: 'i1',
        label: 'Разгледай дефектните части',
        description: 'Планини от деформирани пластмасови ръце, крака и глави на играчки. Приближавате се и забелязвате, че някои от тях изглеждат ужасяващо органични отвътре, с тъмни петна, които приличат на засъхнала кръв по ръбовете.',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Говори с Брон', nextId: 'dialogue_bron_start', actionSound: SOUNDS.whisper, icon: <MessageSquare className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> },
      { id: 'c5', text: 'Използвай отвертката върху Брон', nextId: 'dialogue_bron_screwdriver_use', condition: (state) => state.inventory.includes('screwdriver'), actionSound: SOUNDS.clank, icon: <Settings className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Влез в Лабораторията за прототипи', nextId: 'prototype_lab', condition: (state) => state.inventory.includes('bron_moved'), actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c3', text: 'Претърси якето', nextId: 'rejected_room_jacket', condition: (state) => !state.inventory.includes('manager_badge'), actionSound: SOUNDS.pickup, action: (state) => ({ ...state, inventory: [...state.inventory, 'manager_badge'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c4', text: 'Върни се в Залата "Направи си приятел"', nextId: 'make_a_friend', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  rejected_room_jacket: {
    id: 'rejected_room_jacket',
    title: 'Стая за отхвърлени играчки',
    text: '[Шумолене на плат и тихо издрънчаване]. Претърсвате прашните джобове на якето и намирате Работна карта на управител. Брон все още ви гледа с онези огромни, неестествено тъжни очи.',
    bgSound: SOUNDS.breathing,
    bgMusic: MUSIC.exploration,
    entrySound: SOUNDS.discovery,
    interactables: [
      {
        id: 'i1',
        label: 'Разгледай дефектните части',
        description: 'Планини от деформирани пластмасови ръце, крака и глави на играчки. Приближавате се и забелязвате, че някои от тях изглеждат ужасяващо органични отвътре, с тъмни петна, които приличат на засъхнала кръв по ръбовете.',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Говори с Брон', nextId: 'dialogue_bron_start', actionSound: SOUNDS.whisper, icon: <MessageSquare className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Влез в Лабораторията за прототипи', nextId: 'prototype_lab', condition: (state) => state.inventory.includes('bron_moved'), actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c3', text: 'Върни се в Залата "Направи си приятел"', nextId: 'make_a_friend', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_bron_start: {
    id: 'dialogue_bron_start',
    title: 'Разговор с Брон',
    text: '[Дълбок, вибриращ в гърдите му глас, придружен от механично хриптене]. "Още един работник... или може би не? Вече не виждам добре. Аз съм толкова уморен." Дъхът му мирише на стара пластмаса и нещо гнило.',
    bgSound: SOUNDS.breathing,
    bgMusic: MUSIC.exploration,
    entrySound: SOUNDS.interaction,
    choices: [
      { id: 'c1', text: 'Попитай: "Кой си ти?"', nextId: 'dialogue_bron_who', actionSound: SOUNDS.whisper, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Попитай: "Можеш ли да се преместиш от вратата?"', nextId: 'dialogue_bron_story', actionSound: SOUNDS.whisper, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c3', text: 'Край на разговора', nextId: 'rejected_room', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_bron_screwdriver_use: {
    id: 'dialogue_bron_screwdriver_use',
    title: 'Брон: Ремонт',
    text: 'Внимателно използвате отвертката, за да затегнете разхлабения болт на гърдите на Брон. Той изпъшка, но механичното хриптене намалява. "Благодаря... това беше... болезнено. Поне сега мога да се движа малко." Той се изправя бавно и се отмества от вратата.',
    bgSound: SOUNDS.clank,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Продължи', nextId: 'rejected_room', actionSound: SOUNDS.door, action: (state) => ({ ...state, inventory: state.inventory.filter(i => i !== 'screwdriver'), bron_moved: true }), icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_bron_who: {
    id: 'dialogue_bron_who',
    title: 'Брон: Изгубената идентичност',
    text: 'Огромната му глава се отпуска леко надолу. "Аз съм Брон. Преди бях Томас... човек. Обещаха ми ново тяло, за да се излекувам от болестта си. Излъгаха. Сега съм просто пластмаса и вечен, изгарящ глад."',
    bgSound: SOUNDS.breathing,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Върни се към другите въпроси', nextId: 'dialogue_bron_start', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_bron_story: {
    id: 'dialogue_bron_story',
    title: 'Брон: Доверие',
    text: 'Той въздъхва тежко, звукът е като изпускане на пара от стар котел. "Ние не сме зли по природа. Експеримент 1006 ни каза, че вие сте враговете... Благодаря ти, че ме изслуша. Ще се преместя. Влез вътре... може би ще намериш Златната касета с истината." С мъчително скърцане на стави, той бавно се отмества от вратата.',
    bgSound: SOUNDS.breathing,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Благодари му и продължи', nextId: 'rejected_room', action: (state) => ({ ...state, inventory: [...state.inventory, 'bron_moved'] }), icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  prototype_lab: {
    id: 'prototype_lab',
    title: 'Лаборатория за прототипи',
    text: '[Ехо от капеща вода и мирис на формалдехид]. Стара, изоставена лаборатория, покрита с дебел слой прах. На едно метално бюро, осветено от мъждукаща крушка, лежи Златна видеокасета с избледнял надпис "Проект Игрово Време - Финал". До нея стои стар, прашен диктофон с касета вътре.',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.suspense,
    interactables: [
      {
        id: 'i1',
        label: 'Разгледай чертежите на стената',
        description: 'Пожълтели скици, изобразяващи анатомията на играчките, гротескно смесена с човешки скелетни структури. Червено мастило подчертава бележки за "интеграция на нервната система" и "болезнено удължаване на крайниците".',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'bron_prototype',
        label: 'Вземи Прототип на Брон (Колекционерски предмет)',
        description: 'Намерихте малка, недовършена фигурка на Брон Динозавъра! Пластмасата ѝ е студена, а очите ѝ липсват.',
        condition: (state) => !state.collectibles.includes('bron_prototype'),
        actionSound: SOUNDS.pickup,
        action: (state) => ({ ...state, collectibles: [...state.collectibles, 'bron_prototype'] }),
        icon: <Zap className="w-4 h-4 mr-2 text-yellow-500" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Вземи Златната касета', nextId: 'prototype_lab_empty', actionSound: SOUNDS.pickup, action: (state) => ({ ...state, inventory: [...state.inventory, 'golden_vhs'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Пуснете аудио записа от диктофона', nextId: 'prototype_audio', actionSound: SOUNDS.machine, icon: <Play className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { id: 'c3', text: 'Върни се при Брон', nextId: 'rejected_room', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  prototype_audio: {
    id: 'prototype_audio',
    title: 'Аудио запис',
    text: '[Силно пращене на магнитна лента и пресипнал, панически шепот]. "Експеримент 814. Опитите да съживим неорганична материя чрез... донорски тела... дават резултат. Но играчките помнят. Те помнят болката. Прототипът се учи твърде бързо. Той ги организира."',
    bgSound: SOUNDS.machine,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Спри записа', nextId: 'prototype_lab', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  prototype_lab_empty: {
    id: 'prototype_lab_empty',
    title: 'Лаборатория за прототипи',
    text: '[Ехо от капеща вода и мирис на формалдехид]. Стара, изоставена лаборатория, покрита с дебел слой прах. Металното бюро вече е празно, освен стария диктофон.',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.discovery,
    interactables: [
      {
        id: 'i1',
        label: 'Разгледай чертежите на стената',
        description: 'Пожълтели скици, изобразяващи анатомията на играчките, гротескно смесена с човешки скелетни структури. Червено мастило подчертава бележки за "интеграция на нервната система" и "болезнено удължаване на крайниците".',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'bron_prototype',
        label: 'Вземи Прототип на Брон (Колекционерски предмет)',
        description: 'Намерихте малка, недовършена фигурка на Брон Динозавъра! Пластмасата ѝ е студена, а очите ѝ липсват.',
        condition: (state) => !state.collectibles.includes('bron_prototype'),
        actionSound: SOUNDS.pickup,
        action: (state) => ({ ...state, collectibles: [...state.collectibles, 'bron_prototype'] }),
        icon: <Zap className="w-4 h-4 mr-2 text-yellow-500" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Пуснете аудио записа от диктофона', nextId: 'prototype_audio_empty', actionSound: SOUNDS.machine, icon: <Play className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Върни се при Брон', nextId: 'rejected_room', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  prototype_audio_empty: {
    id: 'prototype_audio_empty',
    title: 'Аудио запис',
    text: '[Силно пращене на магнитна лента и пресипнал, панически шепот]. "Експеримент 814. Опитите да съживим неорганична материя чрез... донорски тела... дават резултат. Но играчките помнят. Те помнят болката. Прототипът се учи твърде бързо. Той ги организира."',
    bgSound: SOUNDS.machine,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Спри записа', nextId: 'prototype_lab_empty', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  break_room: {
    id: 'break_room',
    title: 'Стая за почивка',
    text: '[Дразнещо, високочестотно бръмчене на развалена неонова лампа]. Помещението е хаотично разхвърляно, сякаш е имало борба. Обърнати пластмасови маси и счупени столове са разпръснати по пода. В една от разбитите вендинг машини, зад напуканото стъкло, виждате заклещена Служебна карта. В сенчестия ъгъл седи Счупена играчка (Буги Бот), чиито очи мигат слабо и неравномерно в червено. На стената виси изпокъсано табло за обяви.',
    bgSound: SOUNDS.break_room_bg,
    bgMusic: MUSIC.exploration,
    interactables: [
      {
        id: 'employee_badge',
        label: 'Вземи Значка на Служител на Месеца (Колекционерски предмет)',
        description: 'Открихте тежка, златна значка, скрита в прахта под една от обърнатите маси! Повърхността ѝ е надраскана, но все още блести.',
        condition: (state) => !state.collectibles.includes('employee_badge'),
        actionSound: SOUNDS.pickup,
        action: (state) => ({ ...state, collectibles: [...state.collectibles, 'employee_badge'] }),
        icon: <Zap className="w-4 h-4 mr-2 text-yellow-500" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Говори със Счупения Бот', nextId: 'dialogue_bot_start', actionSound: SOUNDS.robot, icon: <MessageSquare className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Разгледай таблото за обяви', nextId: 'break_room_board', actionSound: SOUNDS.paper, icon: <Search className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c3', text: 'Използвай Синята ръка, за да издърпаш картата', nextId: 'break_room_card', condition: (state) => !state.inventory.includes('keycard'), actionSound: SOUNDS.pickup, action: (state) => ({ ...state, inventory: [...state.inventory, 'keycard'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c4', text: 'Върни се в Залата "Направи си приятел"', nextId: 'make_a_friend', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  break_room_board: {
    id: 'break_room_board',
    title: 'Табло за обяви',
    text: 'Повечето листове са пожълтели графици за почивки и избледнели менюта от столовата. Но една бележка, написана трескаво с дебел червен маркер, привлича вниманието ви: "Ако чуете дишане откъм вентилацията, НЕ ПОГЛЕЖДАЙТЕ НАГОРЕ. Просто продължете да работите и се молете да отмине."',
    bgSound: SOUNDS.break_room_bg,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Остави таблото', nextId: 'break_room', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_bot_start: {
    id: 'dialogue_bot_start',
    title: 'Разговор със Счупения Бот',
    text: '[Жалко механично стържене и накъсан, статичен роботизиран глас]. "П-п-помощ... Не вдигай шум. Той чува всичко." Очите му примигват в синхрон с думите.',
    bgSound: SOUNDS.break_room_bg,
    bgMusic: MUSIC.exploration,
    entrySound: SOUNDS.interaction,
    choices: [
      { id: 'c1', text: 'Попитай: "Кой е \'той\'?"', nextId: 'dialogue_bot_huggy', actionSound: SOUNDS.robot, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Попитай: "Как да избягам оттук?"', nextId: 'dialogue_bot_escape', actionSound: SOUNDS.robot, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c3', text: 'Край на разговора', nextId: 'break_room', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c4', text: 'Поправи паметта на бота (Технически гений)', nextId: 'dialogue_bot_tech', condition: (state) => state.character.perk === 'tech', actionSound: SOUNDS.zap, icon: <Zap className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> }
    ]
  },
  dialogue_bot_tech: {
    id: 'dialogue_bot_tech',
    title: 'Счупеният Бот: Възстановена памет',
    text: '"[Силно бръмчене и серия от бързи електронни писукания]... Памет възстановена. Предупреждение: Експеримент 1006 контролира останалите. Той е в сенките. Не му вярвай. Вземи това скрито съобщение." (Получавате таен код за достъп до архивите).',
    bgSound: SOUNDS.break_room_bg,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Върни се към другите въпроси', nextId: 'dialogue_bot_start', action: (state) => ({ ...state, inventory: [...state.inventory, 'secret_archive_code'] }), icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_bot_huggy: {
    id: 'dialogue_bot_huggy',
    title: 'Счупеният Бот: За Хъги Въги',
    text: 'Гласът му става още по-насечен. "Експеримент 1170... Хъги Въги. Той пази фабриката. Ако пуснеш голямата машина за играчки, шумът ще го привлече! Бъди готов да бягаш към вентилацията!"',
    bgSound: SOUNDS.break_room_bg,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Върни се към другите въпроси', nextId: 'dialogue_bot_start', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_bot_escape: {
    id: 'dialogue_bot_escape',
    title: 'Счупеният Бот: За бягството',
    text: '"Трябва ти Червената батерия от Склада, за да пуснеш машината. Но складът е заключен. Служебната карта е... [дъжд от искри и звук на късо съединение]... заклещена във вендинг машината до мен. Използвай дългата си ръка."',
    bgSound: SOUNDS.break_room_bg,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Върни се към другите въпроси', nextId: 'dialogue_bot_start', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  break_room_card: {
    id: 'break_room_card',
    title: 'Стая за почивка (Картата е взета)',
    text: '[Звук от счупено стъкло и пластмасово щракване]. Успешно издърпахте Служебната карта със Синята ръка. Сега имате достъп до заключени помещения.',
    bgSound: SOUNDS.break_room_bg,
    bgMusic: MUSIC.exploration,
    entrySound: SOUNDS.discovery,
    choices: [
      { id: 'c1', text: 'Върни се в Залата "Направи си приятел"', nextId: 'make_a_friend', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  locked_storage: {
    id: 'locked_storage',
    title: 'Заключен склад',
    text: '[Рязък, електронен звук за отказан достъп]. Тежката метална врата мига с гневна червена светлина. Екранът до нея показва: "Изисква се Служебна карта за достъп".',
    bgSound: SOUNDS.machine,
    bgMusic: MUSIC.exploration,
    choices: [
      { id: 'c1', text: 'Върни се назад', nextId: 'make_a_friend', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Хакай електронната ключалка (Технически гений)', nextId: 'storage_warehouse', condition: (state) => state.character.perk === 'tech', actionSound: SOUNDS.zap, icon: <Zap className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> }
    ]
  },
  storage_warehouse: {
    id: 'storage_warehouse',
    title: 'Склад за играчки',
    text: '[Ехо от капеща вода и тихо радио пращене]. Вътре е тъмно, студено и мирише на застояла вода и стара пластмаса. Чувате слабо, отчаяно почукване по стъкло. В една изолирана, слабо осветена кабина виждате жена в измачкана лабораторна престилка. Това е Д-р Сара. На стената до нея има масивен, заключен сейф с Червената батерия. На пода, полускрита под един от кашоните, забелязвате смачкана бележка.',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.suspense,
    interactables: [
      {
        id: 'i1',
        label: 'Огледай кашоните',
        description: 'Кашоните са пълни с хиляди еднакви, празни кутии за играчки. Картонът е влажен и мирише на мухъл. На някои от тях има тъмни, лепкави петна, които приличат на засъхнала кал... или нещо по-лошо.',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Говори с Д-р Сара', nextId: 'dialogue_sarah_start', actionSound: SOUNDS.radio, icon: <MessageSquare className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Прочети смачканата бележка', nextId: 'storage_note', actionSound: SOUNDS.paper, icon: <Search className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c3', text: 'Въведи кода и вземи Червената батерия', nextId: 'storage_warehouse_battery', condition: (state) => state.inventory.includes('battery_code') && !state.inventory.includes('red_battery'), actionSound: SOUNDS.pickup, action: (state) => ({ ...state, inventory: [...state.inventory, 'red_battery'] }), icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c4', text: 'Върни се в Залата "Направи си приятел"', nextId: 'make_a_friend', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  storage_note: {
    id: 'storage_note',
    title: 'Смачкана бележка',
    text: 'Хартията е мазна и измачкана. Бележка от работник по поддръжката: "Машината за играчки не просто сглобява пластмаса. Тръбите отдолу... те изпомпват нещо топло. Нещо живо. Страх ме е да погледна в резервоарите под пода. Тези играчки не са просто играчки."',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Остави бележката', nextId: 'storage_warehouse', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_sarah_start: {
    id: 'dialogue_sarah_start',
    title: 'Разговор с Д-р Сара',
    text: (state) => {
      const intro = state.character.background === 'employee' 
        ? '"Чакай... познавам те! Ти работеше тук преди 10 години! Слава богу, че се върна.' 
        : '"Слава богу, човек!';
      return `[Силно радио пращене и глас, изкривен от интеркома]. ${intro} Аз съм Д-р Сара. Заклещена съм тук от деня на инцидента. Системата за сигурност ме блокира вътре." Тя притиска ръце към стъклото.`;
    },
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.interaction,
    choices: [
      { id: 'c1', text: 'Попитай: "Какво се случи тук?"', nextId: 'dialogue_sarah_lore', actionSound: SOUNDS.radio, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Попитай: "Трябва ми Червената батерия."', nextId: 'dialogue_sarah_battery', actionSound: SOUNDS.radio, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c3', text: 'Край на разговора', nextId: 'storage_warehouse', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_sarah_lore: {
    id: 'dialogue_sarah_lore',
    title: 'Д-р Сара: Инцидентът',
    text: 'Гласът ѝ трепери през интеркома. "Експеримент 1006 се освободи. Той координира другите играчки да въстанат. Аз... аз помогнах за създаването им. Може би заслужавам съдбата си. Но ти трябва да избягаш!"',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Върни се към другите въпроси', nextId: 'dialogue_sarah_start', icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  dialogue_sarah_battery: {
    id: 'dialogue_sarah_battery',
    title: 'Д-р Сара: Кодът за батерията',
    text: '"Батерията е в сейфа до мен. Кодът е 0428. Вземи го, но внимавай – пускането на голямата машина ще вдигне много шум и ще привлече Хъги Въги!" Тя се оглежда нервно към тъмните ъгли на склада.',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Запомни кода и се върни', nextId: 'storage_warehouse', action: (state) => ({ ...state, inventory: [...state.inventory, 'battery_code'] }), icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  storage_warehouse_battery: {
    id: 'storage_warehouse_battery',
    title: 'Склад за играчки (Батерията е взета)',
    text: '[Тежко метално щракване и скърцане на панти]. Сейфът е отворен и празен. Д-р Сара ви кима зад стъклото, лицето ѝ е бледо в полумрака: "Бягай сега. И не поглеждай назад."',
    bgSound: SOUNDS.drip,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.discovery,
    interactables: [
      {
        id: 'i1',
        label: 'Огледай кашоните',
        description: 'Кашоните са пълни с хиляди еднакви, празни кутии за играчки. На някои от тях има странни петна, които приличат на засъхнала кал... или нещо по-лошо.',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Говори с Д-р Сара', nextId: 'dialogue_sarah_start', actionSound: SOUNDS.radio, icon: <MessageSquare className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Върни се в Залата "Направи си приятел"', nextId: 'make_a_friend', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  machine_powered: {
    id: 'machine_powered',
    title: 'Машината работи!',
    text: '[Оглушителен метален трясък и рев на събуждащи се конвейери]. Поставяте батерията. Огромната машина се събужда с грохот, който разтърсва пода. Зъбчатите колела се завъртат, изработвайки играчка с плашеща скорост, и тежката изходна врата към Производствената зона се отваря бавно. Но този силен шум със сигурност е привлякъл нечие внимание...',
    bgSound: SOUNDS.clank,
    bgMusic: MUSIC.chase,
    vibration: [100, 50, 100, 50, 100],
    choices: [
      { id: 'c1', text: 'Влез в Производствената зона', nextId: 'production', actionSound: SOUNDS.door_heavy, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  production: {
    id: 'production',
    title: 'Производствена зона - ПРЕСЛЕДВАНЕ!',
    text: '[Тежки, бързи стъпки, които кънтят по метала, и хриптящо, зловещо дишане]. Влизате в огромната производствена зона. Навсякъде висят ръждясали конвейерни ленти и куки. Изведнъж, от непрогледната тъмнина се издига Хъги Въги! Неговата неестествено дълга, синя фигура се извисява над вас. Той ви вижда и се затичва с огромна, пълна с остри като бръснач зъби усмивка! Трябва да действате бързо!',
    bgSound: SOUNDS.chase,
    bgMusic: MUSIC.suspense,
    entrySound: SOUNDS.jumpscare,
    vibration: [300, 100, 300, 100, 500],
    timeLimit: 10,
    timeLimitNextId: 'time_out_death',
    interactables: [
      {
        id: 'i1',
        label: 'Огледай бързо наоколо',
        description: 'Нямате време за детайли! Сърцето ви блъска в гърдите. Хъги Въги е огромен, покрит със сплъстена синя козина и ужасяващо бърз. Периферното ви зрение улавя отворена вентилационна шахта, крехка маса, под която може да се скриете, ръждясала тръба, съскаща от пара под високо напрежение, и тежка врата с надпис "Казино".',
        actionSound: SOUNDS.heartbeat,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'hidden_panel',
        label: 'Развийте панела с гаечния ключ',
        description: 'Зад един от панелите на машината виждате нещо скрито.',
        condition: (state) => state.inventory.includes('wrench') && !state.inventory.includes('torn_note'),
        action: (state) => ({ ...state, inventory: [...state.inventory, 'torn_note'] }),
        actionSound: SOUNDS.clank,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Бягай към отворената вентилационна шахта!', nextId: 'vents', actionSound: SOUNDS.vent, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Скрий се под близката маса', nextId: 'hide_death', actionSound: SOUNDS.crash, icon: <ShieldAlert className="w-5 h-5 mr-2 text-red-600" aria-hidden="true" /> },
      { id: 'c3', text: 'Използвай гаечния ключ, за да счупиш тръбата с пара!', nextId: 'steam_escape', condition: (state) => state.inventory.includes('wrench'), actionSound: SOUNDS.clank, icon: <Zap className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { id: 'c4', text: 'Прескочи конвейера и се плъзни под вратата (Атлет)', nextId: 'secret_escape', condition: (state) => state.character.perk === 'athletic', actionSound: SOUNDS.chase, icon: <Activity className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" /> },
      { id: 'c5', text: 'Избягай към залостения таен тунел', nextId: 'secret_tunnel_entrance', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c6', text: 'Отвори вратата към изоставеното Казино', nextId: 'casino', actionSound: SOUNDS.door, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { 
        id: 'c7', 
        text: 'Вдигни счупения покер чип', 
        nextId: 'production', 
        condition: (state) => !state.inventory.includes('broken_poker_chip'),
        action: (state) => ({ ...state, inventory: [...state.inventory, 'broken_poker_chip'] }),
        actionSound: SOUNDS.pickup, 
        icon: <Search className="w-5 h-5 mr-2" aria-hidden="true" /> 
      },
      {
        id: 'c9',
        text: 'Use the wrench on the steam pipe',
        nextId: 'steam_escape',
        condition: (state) => state.inventory.includes('wrench'),
        actionSound: SOUNDS.clank,
        icon: <Zap className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" />
      },
      { id: 'c8', text: 'Опитай се да говориш с Хъги Въги', nextId: 'huggy_dialogue', actionSound: SOUNDS.jumpscare, icon: <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  huggy_dialogue: {
    id: 'huggy_dialogue',
    title: 'Хъги Въги: Истината',
    text: '[Хъги Въги спира рязко. Усмивката му се разширява още повече, разкривайки редове от игловидни зъби]. "Ти... мислиш ли, че си гост тук? Аз бях създаден да бъда обичан, но те ме превърнаха в чудовище. Сега ти си просто още една играчка, която ще бъде разкъсана на парчета."',
    bgSound: SOUNDS.chase,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Избягай, докато той говори!', nextId: 'vents', actionSound: SOUNDS.chase, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  maintenance_door_entrance: {
    id: 'maintenance_door_entrance',
    title: 'Maintenance Door',
    text: 'You reach the small, rusted maintenance door. It\'s slightly ajar, revealing a dark corridor beyond. A faint, metallic scraping sound can be heard from within.',
    bgSound: SOUNDS.room,
    choices: [
      {
        id: 'c1',
        text: 'Enter the maintenance door',
        nextId: 'dark_corridor',
        actionSound: SOUNDS.door_heavy,
        icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" />
      }
    ]
  },
  casino: {
    id: 'casino',
    title: 'Казиното',
    text: 'Влизате в изоставено казино, скрито дълбоко в производствената зона. Навсякъде има прашни маси за игра и изпочупени ротативки. Атмосферата е зловеща, но поне тук изглежда безопасно за момента.',
    bgSound: SOUNDS.room,
    interactables: [
      {
        id: 'i1',
        label: 'Счупена покер чип',
        description: 'На една от масите забелязвате счупен покер чип. Изглежда странно и може би е важен.',
        actionSound: SOUNDS.pickup,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'hidden_safe',
        label: 'Скрит сейф',
        description: 'Масивна метална врата, изглежда заключена. Има малък процеп отдолу, който може да се използва за манипулация',
        actionSound: SOUNDS.clank,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { 
        id: 'c1', 
        text: 'Погледни чипа', 
        nextId: 'examine_poker_chip', 
        actionSound: SOUNDS.pickup, 
        icon: <Search className="w-5 h-5 mr-2 text-red-600" aria-hidden="true" /> 
      },
      {
        id: 'c3',
        text: 'Огледай масата за карти',
        nextId: 'card_table_search',
        actionSound: SOUNDS.pickup,
        icon: <Search className="w-5 h-5 mr-2" aria-hidden="true" />
      },
      {
        id: 'c5',
        text: 'Влез в тайния проход',
        nextId: 'secret_passage',
        condition: (state) => state.discoveredSecretPassage,
        actionSound: SOUNDS.door,
        icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" />
      },
      {
        id: 'c4',
        text: 'Разгледай зара от слонова кост',
        nextId: 'examine_ivory_die',
        condition: (state) => state.inventory.includes('ivory_die'),
        actionSound: SOUNDS.pickup,
        icon: <Search className="w-5 h-5 mr-2" aria-hidden="true" />
      },
      { 
        id: 'c2', 
        text: 'Върни се назад', 
        nextId: 'production', 
        actionSound: SOUNDS.footsteps, 
        icon: <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" /> 
      },
      { 
        id: 'c5', 
        text: 'Използвай счупения покер чип в процепа на сейфа', 
        nextId: 'use_poker_chip', 
        condition: (state) => state.inventory.includes('broken_poker_chip'),
        actionSound: SOUNDS.clank, 
        icon: <Hand className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> 
      },
      { 
        id: 'c6', 
        text: 'Огледай масата за карти от специфичен ъгъл', 
        nextId: 'reveal_hidden_passage', 
        actionSound: SOUNDS.clank, 
        icon: <Search className="w-5 h-5 mr-2" aria-hidden="true" /> 
      }
    ]
  },
  reveal_hidden_passage: {
    id: 'reveal_hidden_passage',
    title: 'Тайният проход',
    text: 'Когато погледнете масата за карти от точно определен ъгъл, забелязвате, че сенките образуват странен модел върху стената. Натискате леко дървената ламперия и тя се отваря, разкривайки тесен, прашен проход.',
    bgSound: SOUNDS.clank,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Влез в тайния проход', nextId: 'secret_passage', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Върни се в казиното', nextId: 'casino', actionSound: SOUNDS.footsteps, icon: <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  secret_passage: {
    id: 'secret_passage',
    title: 'Тайният проход',
    text: 'Пълзите през тесния проход. Въздухът е застоял и мирише на старо дърво и прах. В края на прохода виждате слаба светлина.',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Продължи напред', nextId: 'production', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  use_poker_chip: {
    id: 'use_poker_chip',
    title: 'Отваряне на сейфа',
    text: 'Чипът се плъзна без усилие в процепа на скрития сейф. Чува се тихо щракване и масивната врата се отваря, разкривайки счупен монокъл.',
    bgSound: SOUNDS.clank,
    bgMusic: MUSIC.suspense,
    choices: [
      { 
        id: 'c1', 
        text: 'Вземи счупения монокъл', 
        nextId: 'hidden_safe_open', 
        action: (state) => ({ ...state, inventory: [...state.inventory, 'broken_monocle'] }),
        actionSound: SOUNDS.pickup, 
        icon: <Search className="w-5 h-5 mr-2" aria-hidden="true" /> 
      }
    ]
  },
  hidden_safe_open: {
    id: 'hidden_safe_open',
    title: 'Скритият сейф е отворен',
    text: 'След като взехте счупения монокъл, сейфът остава празен.',
    bgSound: SOUNDS.discovery,
    bgMusic: MUSIC.suspense,
    choices: [
      { id: 'c1', text: 'Върни се в казиното', nextId: 'casino', actionSound: SOUNDS.footsteps, icon: <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  card_table_search: {
    id: 'card_table_search',
    title: 'Card Table Search',
    text: 'You carefully lift the overturned card table. Beneath it, you find a small, velvet pouch containing a single, intricately carved ivory die. Looking at the table from a different angle, you notice a strange mechanism in the floor.',
    bgSound: SOUNDS.room,
    choices: [
      {
        id: 'c1',
        text: 'Take the pouch and return to the casino.',
        nextId: 'casino',
        action: (state) => ({ ...state, inventory: [...state.inventory, 'ivory_die'] }),
        actionSound: SOUNDS.pickup,
        icon: <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
      },
      {
        id: 'c2',
        text: 'Разгледай масата под определен ъгъл',
        nextId: 'reveal_hidden_passage',
        action: (state) => ({ ...state, discoveredSecretPassage: true }),
        actionSound: SOUNDS.success,
        icon: <Search className="w-5 h-5 mr-2" aria-hidden="true" />
      }
    ]
  },
  examine_ivory_die: {
    id: 'examine_ivory_die',
    title: 'Зарът от слонова кост',
    text: 'Разглеждате внимателно зара. Върху всяка от страните му са гравирани малки символи. Ако ги подредите правилно, може би ще разкриете тайната на казиното...',
    bgSound: SOUNDS.room,
    choices: [
      {
        id: 'c1',
        text: 'Върни се в казиното',
        nextId: 'casino',
        actionSound: SOUNDS.footsteps,
        icon: <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
      },
      {
        id: 'c2',
        text: 'Разгледай символите по-отблизо',
        nextId: 'examine_ivory_die_symbols',
        actionSound: SOUNDS.pickup,
        icon: <Search className="w-5 h-5 mr-2" aria-hidden="true" />
      }
    ]
  },
  examine_ivory_die_symbols: {
    id: 'examine_ivory_die_symbols',
    title: 'Символите по зара',
    text: 'Символите са подредени в последователност: Звезда, Луна, Слънце, Звезда. Изглежда, че това е някакъв вид код. Записвате го в бележника си.',
    bgSound: SOUNDS.room,
    choices: [
      {
        id: 'c1',
        text: 'Върни се при зара',
        nextId: 'examine_ivory_die',
        actionSound: SOUNDS.footsteps,
        icon: <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
      }
    ]
  },
  examine_poker_chip: {
    id: 'examine_poker_chip',
    title: 'Счупена покер чип',
    text: 'Взимате счупения покер чип. На него има гравирани странни символи, които приличат на код. Прибирате го в инвентара си.',
    bgSound: SOUNDS.pickup,
    choices: [
      {
        id: 'c1',
        text: 'Върни се назад',
        nextId: 'casino',
        action: (state) => ({ ...state, inventory: state.inventory.includes('broken_poker_chip') ? state.inventory : [...state.inventory, 'broken_poker_chip'] }),
        actionSound: SOUNDS.footsteps,
        icon: <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
      }
    ]
  },
  secret_tunnel_entrance: {
    id: 'secret_tunnel_entrance',
    title: 'Вход към тайния тунел',
    text: '[Тежко дишане и тропане на стъпки зад вас]. Достигате до малка, скрита врата, водеща към тесен тунел. Вратата обаче е залостена с ръждясал механизъм. Хъги Въги се приближава бързо! Имате нужда от нещо, с което да разбиете или развиете механизма - може би Синята ръка или отвертка.',
    bgSound: SOUNDS.chase,
    bgMusic: MUSIC.chase,
    choices: [
      { id: 'c1', text: 'Използвай Синята ръка, за да издърпаш лоста', nextId: 'secret_escape', condition: (state) => state.inventory.includes('blue_hand'), actionSound: SOUNDS.crash, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Използвай Отвертката, за да развиеш панела', nextId: 'secret_escape', condition: (state) => state.inventory.includes('screwdriver'), actionSound: SOUNDS.clank, icon: <Zap className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { id: 'c3', text: 'Опитай да разбиеш вратата с рамо', nextId: 'tunnel_death', actionSound: SOUNDS.crash, icon: <ShieldAlert className="w-5 h-5 mr-2 text-red-400" aria-hidden="true" /> }
    ]
  },
  tunnel_death: {
    id: 'tunnel_death',
    title: 'Край на играта',
    text: '[Ужасяващ писък и звук от разкъсване]. Блъскате се във вратата, но тя не помръдва. Хъги Въги ви настига. Огромните му зъби са последното нещо, което виждате...',
    bgSound: SOUNDS.monster_growl,
    bgMusic: MUSIC.chase,
    entrySound: SOUNDS.jumpscare,
    vibration: [300, 100, 300, 100, 500],
    choices: [
      { id: 'c1', text: 'Опитай отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  steam_escape: {
    id: 'steam_escape',
    title: 'Бягство в парата',
    text: '[Оглушително свистене на пара и нечовешки рев]. Удряте ръждясалата тръба с гаечния ключ с всички сили! Металът поддава и гъст облак от вряла пара изпълва стаята, ослепявайки Хъги Въги. Докато той реве объркан и размахва дългите си ръце, вие се шмугвате през една тясна сервизна врата и превъртате тежкото резе зад себе си. Пред вас зее дълбок, тъмен тунел.',
    bgSound: SOUNDS.wind,
    bgMusic: MUSIC.chase,
    choices: [
      { id: 'c1', text: 'Продължи напред през тунела', nextId: 'secret_escape', actionSound: SOUNDS.footsteps, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  hide_death: {
    id: 'hide_death',
    title: 'Край на играта',
    text: '[Звук от трошене на дърво и вашият собствен писък]. Крехката маса не е достатъчно голяма, за да ви скрие. Огромна синя ръка я разбива на трески. Хъги Въги ви намира веднага. Острите му зъби са последното нещо, което виждате. Край на играта.',
    bgSound: SOUNDS.monster_growl,
    bgMusic: MUSIC.chase,
    entrySound: SOUNDS.jumpscare,
    vibration: [300, 100, 300, 100, 500],
    choices: [
      { id: 'c1', text: 'Опитай отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  time_out_death: {
    id: 'time_out_death',
    title: 'Край на играта',
    text: '[Ужасяващ писък и звук от разкъсване]. Забавихте се твърде много! Хъги Въги ви настига. Огромните му зъби са последното нещо, което виждате...',
    bgSound: SOUNDS.monster_growl,
    bgMusic: MUSIC.chase,
    entrySound: SOUNDS.jumpscare,
    vibration: [300, 100, 300, 100, 500],
    choices: [
      { id: 'c1', text: 'Опитай отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  vents: {
    id: 'vents',
    title: 'Във вентилацията',
    text: '[Трескаво пълзене по студен метал и оглушително блъскане зад вас]. Вмъквате се в тясната вентилация. Хъги Въги се опитва да се провре след вас, металът стене и се огъва под огромната му тежест! Прах и ръжда падат в очите ви. Шахтата се разделя на две посоки.',
    bgSound: SOUNDS.chase,
    bgMusic: MUSIC.chase,
    vibration: [100, 50, 100, 50, 100],
    interactables: [
      {
        id: 'i1',
        label: 'Погледни назад',
        description: 'Огромни, покрити със синя козина ръце с неестествено дълги, остри като игли нокти драскат по метала само на сантиметри от краката ви. Очите му светят с безумен, жълт блясък в тъмното. Не спирайте!',
        actionSound: SOUNDS.monster_growl,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Завий наляво', nextId: 'vents_left', actionSound: SOUNDS.vent, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Завий надясно', nextId: 'vents_right', actionSound: SOUNDS.vent, icon: <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  vents_left: {
    id: 'vents_left',
    title: 'Вентилация - Наляво (Задънена улица?)',
    text: '[Тъп удар в студена стомана]. Шахтата наляво завършва с плътна метална стена. Задънена улица. Обръщате се и чувате как стърженето на Хъги Въги се приближава с ужасяваща скорост! На пода обаче виждате малка, ръждясала решетка, закрепена с четири винта.',
    bgSound: SOUNDS.chase,
    bgMusic: MUSIC.chase,
    vibration: [100, 50, 100, 50, 100],
    choices: [
      { 
        id: 'c1', 
        text: 'Използвай отвертката, за да отвориш решетката на пода!', 
        nextId: 'secret_escape', 
        condition: (state) => state.inventory.includes('screwdriver'), 
        actionSound: SOUNDS.clank, 
        icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> 
      },
      { 
        id: 'c2', 
        text: 'Опитай да се пребориш с чудовището', 
        nextId: 'vents_left_death', 
        condition: (state) => !state.inventory.includes('screwdriver'), 
        actionSound: SOUNDS.crash, 
        icon: <ShieldAlert className="w-5 h-5 mr-2 text-red-400" aria-hidden="true" /> 
      },
      {
        id: 'c3',
        text: 'Отблъсни се от стената и се плъзни покрай него (Атлет)',
        nextId: 'escape',
        condition: (state) => state.character.perk === 'athletic',
        actionSound: SOUNDS.chase,
        icon: <Activity className="w-5 h-5 mr-2 text-green-400" aria-hidden="true" />
      }
    ]
  },
  vents_left_death: {
    id: 'vents_left_death',
    title: 'Край на играта',
    text: '[Звук от разкъсване на метал и вашият собствен писък]. Ноктите ви се чупят в опит да изтръгнете винтовете. Нямате инструмент. Хъги Въги ви притиска в капана на тясната шахта. Горещият му дъх е последното нещо, което усещате. Край на играта.',
    bgSound: SOUNDS.monster_growl,
    bgMusic: MUSIC.chase,
    entrySound: SOUNDS.jumpscare,
    vibration: [300, 100, 300, 100, 500],
    choices: [
      { id: 'c1', text: 'Опитай отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  secret_escape: {
    id: 'secret_escape',
    title: 'Таен изход - Истинската истина',
    text: '[Звук от падане и дълго ехо в просторен тунел]. Успявате да отворите решетката в последната секунда, плъзгайки се надолу точно когато огромна синя ръка се стоварва там, където бяхте преди миг. Хъги Въги реве безсилно отгоре – не може да се провре. Тунелът ви отвежда до прашна, изоставена лаборатория далеч под фабриката. Оцеляхте!',
    bgSound: SOUNDS.wind,
    bgMusic: MUSIC.calm,
    vibration: [500, 100, 500],
    interactables: [
      {
        id: 'i1',
        label: 'Огледай изоставената лаборатория',
        description: 'Стаята мирише на озон и стара електроника. Пълна е с масивни компютри от миналия век и прашни монитори. Изглежда никой не е стъпвал тук от десетилетия. В центъра, като по чудо, има един работещ телевизор с видеоплейър, чиято лампичка мига в зелено.',
        actionSound: SOUNDS.machine,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Използвай Златната касета и Дневника на Елиът, за да разкриеш пълната истина', nextId: 'true_ending_perfect', condition: (state) => state.inventory.includes('golden_vhs') && state.inventory.includes('elliots_diary'), actionSound: SOUNDS.tv, icon: <Play className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { id: 'c2', text: 'Използвай Златната касета, за да разкриеш истината на света', nextId: 'true_ending', condition: (state) => state.inventory.includes('golden_vhs') && !state.inventory.includes('elliots_diary'), actionSound: SOUNDS.tv, icon: <Play className="w-5 h-5 mr-2 text-yellow-400" aria-hidden="true" /> },
      { id: 'c3', text: 'Избягай и играй отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  },
  true_ending_perfect: {
    id: 'true_ending_perfect',
    title: 'АБСОЛЮТЕН ИСТИНСКИ КРАЙ: Пълното разкритие',
    text: '[Далечен вой на полицейски сирени и шум на вятър]. Успявате да избягате през тайната шахта, излизайки на студения нощен въздух. Предавате Златната касета и Дневника на Елиът на властите. С неоспоримите доказателства от дневника, всички замесени са изправени пред правосъдието. Разкрихте най-дълбоките, кървави тайни на Playtime Co. Вие сте истински герой!',
    bgSound: SOUNDS.outside_bg,
    bgMusic: MUSIC.calm,
    entrySound: SOUNDS.objective_complete,
    interactables: [
      {
        id: 'i1',
        label: 'Погледни към небето',
        description: 'Първите лъчи на слънцето пробиват сивите облаци. Въздухът е свеж, без мирис на пластмаса и кръв. Кошмарът най-накрая свърши. Истината е наяве.',
        actionSound: SOUNDS.wind,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Играй отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Отключи Тайната Стая на Разработчиците (Изисква всички колекционерски предмети)', nextId: 'dev_room', condition: (state) => state.collectibles.includes('vintage_poster') && state.collectibles.includes('golden_gear') && state.collectibles.includes('employee_badge') && state.collectibles.includes('secret_tape') && state.collectibles.includes('bron_prototype'), actionSound: SOUNDS.success, icon: <Zap className="w-5 h-5 mr-2 text-yellow-500" aria-hidden="true" /> }
    ]
  },
  true_ending: {
    id: 'true_ending',
    title: 'ИСТИНСКИ КРАЙ: Истината излиза наяве',
    text: '[Шум на вятър и далечен градски трафик]. Успявате да избягате през тайната шахта и се свързвате с властите, предавайки Златната касета. Светът научава за ужасите в Playtime Co. Фабриката е затворена завинаги, а душите на децата най-накрая намират покой. Вие сте герой!',
    bgSound: SOUNDS.outside_bg,
    bgMusic: MUSIC.calm,
    entrySound: SOUNDS.objective_complete,
    interactables: [
      {
        id: 'i1',
        label: 'Погледни към небето',
        description: 'Първите лъчи на слънцето пробиват сивите облаци. Въздухът е свеж, без мирис на пластмаса и кръв. Кошмарът най-накрая свърши. Истината е наяве.',
        actionSound: SOUNDS.wind,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Играй отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Отключи Тайната Стая на Разработчиците (Изисква всички колекционерски предмети)', nextId: 'dev_room', condition: (state) => state.collectibles.includes('vintage_poster') && state.collectibles.includes('golden_gear') && state.collectibles.includes('employee_badge') && state.collectibles.includes('secret_tape') && state.collectibles.includes('bron_prototype'), actionSound: SOUNDS.success, icon: <Zap className="w-5 h-5 mr-2 text-yellow-500" aria-hidden="true" /> }
    ]
  },
  vents_right: {
    id: 'vents_right',
    title: 'Вентилация - Надясно',
    text: '[Трескаво драскане по метал и тежко, мокро дишане]. Продължавате надясно, лазейки колкото можете по-бързо. Виждате метална решетка, през която се процежда лунна светлина. Води навън към мост, но е здраво затворена. Хъги Въги е точно зад вас, усещате горещия му, гнил дъх по врата си!',
    bgSound: SOUNDS.chase,
    bgMusic: MUSIC.chase,
    vibration: [100, 50, 100, 50, 100],
    interactables: [
      {
        id: 'i1',
        label: 'Огледай решетката',
        description: 'Дебела, ръждясала стоманена решетка. Болтовете са заварени. Не можете да я отворите с голи ръце, но Синята ръка може да има достатъчно сила да я изтръгне от стената.',
        actionSound: SOUNDS.clank,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Използвай Синята ръка, за да счупиш решетката!', nextId: 'escape', actionSound: SOUNDS.crash, icon: <Hand className="w-5 h-5 mr-2 text-blue-400" aria-hidden="true" /> }
    ]
  },
  escape: {
    id: 'escape',
    title: 'Победа!',
    text: '[Оглушителен трясък на огъваща се стомана и пронизителен рев]. Изтръгвате решетката със Синята ръка и се хвърляте напред към моста. Хъги Въги скача сляпо след вас, но ръждясалият мост не издържа огромната му тежест. Металът се къса със стон и той пада в тъмната пропаст под фабриката. Вие оцеляхте... засега. Поздравления, преминахте първа глава!',
    bgSound: SOUNDS.outside_bg,
    bgMusic: MUSIC.calm,
    vibration: [500, 100, 500],
    interactables: [
      {
        id: 'i1',
        label: 'Погледни надолу в пропастта',
        description: 'Непрогледна тъмнина. Не виждате дъното. Чувате само ехото от далечен, тежък удар и зловещо метално стържене, което бавно заглъхва в бездната. Дали наистина е мъртъв?',
        actionSound: SOUNDS.wind,
        icon: <Search className="w-4 h-4 mr-2" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Играй отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> },
      { id: 'c2', text: 'Отключи Тайната Стая на Разработчиците (Изисква всички колекционерски предмети)', nextId: 'dev_room', condition: (state) => state.collectibles.includes('vintage_poster') && state.collectibles.includes('golden_gear') && state.collectibles.includes('employee_badge') && state.collectibles.includes('secret_tape') && state.collectibles.includes('bron_prototype'), actionSound: SOUNDS.success, icon: <Zap className="w-5 h-5 mr-2 text-yellow-500" aria-hidden="true" /> }
    ]
  },
  dev_room: {
    id: 'dev_room',
    title: 'Тайната Стая на Разработчиците',
    text: 'Поздравления! Намерихте всички скрити предмети в играта. Влизате в малка, уютна стая, пълна с концептуални рисунки на Хъги Въги, недовършени модели на играчки и бележки от създателите на играта. На бюрото има златна статуетка с вашето име. Вие сте истински майстор на Poppy Playtime!',
    bgSound: SOUNDS.room,
    bgMusic: MUSIC.calm,
    interactables: [
      {
        id: 'concept_art',
        label: 'Концептуално изкуство',
        description: 'Разглеждате ранни скици на Хъги Въги. Първоначално е трябвало да бъде жълт и с четири очи! Добре че са променили дизайна... Изглежда още по-зловещо на хартия.',
        actionSound: SOUNDS.paper,
        icon: <Eye className="w-4 h-4 mr-2 text-purple-400" />
      },
      {
        id: 'dev_notes',
        label: 'Бележки на разработчика',
        description: 'Бележка на стената: "Не забравяй да направиш вентилационните шахти по-страшни. Добави метален звук от стъпки зад играча." - Главен дизайнер. Друга бележка гласи: "Да скрием ли картата на съкровищата пред входа? Да, играчите никога няма да се сетят да се върнат там!"',
        actionSound: SOUNDS.paper,
        icon: <Search className="w-4 h-4 mr-2" />
      },
      {
        id: 'dev_commentary',
        label: 'Аудио коментар',
        description: 'Натискате малък червен бутон на бюрото. Чува се глас: "Най-трудната част от играта беше да накараме играчите да се чувстват преследвани, дори когато не виждат чудовището. Надяваме се, че сме успели да ви изплашим поне малко! Благодаря, че играхте!"',
        actionSound: SOUNDS.robot,
        icon: <Volume2 className="w-4 h-4 mr-2 text-blue-400" />
      },
      {
        id: 'golden_statue',
        label: 'Златна статуетка',
        description: 'Блестяща златна статуетка на Хъги Въги, на която пише: "За най-добрия играч. 100% завършена игра." Това е вашата награда за перфектната игра!',
        actionSound: SOUNDS.success,
        icon: <Zap className="w-4 h-4 mr-2 text-yellow-500" />
      }
    ],
    choices: [
      { id: 'c1', text: 'Играй отново', nextId: 'start', action: () => INITIAL_STATE, icon: <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" /> }
    ]
  }
};

const INITIAL_STATE: GameState = {
  inventory: [],
  objectives: ['enter_factory'],
  completedObjectives: [],
  character: { background: '', perk: '' },
  collectibles: [],
  secretNotes: [],
  ammo: 10,
  batteryLevel: 100,
  isWindowOpen: false,
  discoveredSecretPassage: false
};

export default function App() {
  const [currentNodeId, setCurrentNodeId] = useState<string>('intro_screen');
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [history, setHistory] = useState<{ title: string; text: string; nodeId: string; gameState: GameState }[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isVoiceEnabled) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.lang = 'bg-BG';
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
          console.log('Transcript:', transcript);
          
          const currentNode = GAME_NODES[currentNodeId];
          const availableChoices = currentNode.choices.filter(c => !c.condition || c.condition(gameState));
          
          const matchedChoice = availableChoices.find(choice => transcript.includes(choice.text.toLowerCase()));
          if (matchedChoice) {
            handleChoice(matchedChoice);
          }
        };
        recognitionRef.current.start();
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isVoiceEnabled, currentNodeId, gameState]);

  const [toast, setToast] = useState<string | null>(null);
  const [visualCue, setVisualCue] = useState<React.ReactNode | null>(null);
  const [examinedObject, setExaminedObject] = useState<{label: string, description: string} | null>(null);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemoryLane, setShowMemoryLane] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showGameOfMyLifeModal, setShowGameOfMyLifeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceLine, setVoiceLine] = useState<{text: string, character: string} | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    const saved = localStorage.getItem('poppy_playtime_achievements');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [audioDevices, setAudioDevices] = useState<{deviceId: string, label: string}[]>([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string | null>(null);

  useEffect(() => {
    if (!isAudioEnabled) return;
    const playRandomHorrorSound = () => {
      if (Math.random() < 0.2) { // 20% chance every 10 seconds
        const horrorSounds = [SOUNDS.whisper, SOUNDS.scream_distant, SOUNDS.metal_scrape];
        const sound = horrorSounds[Math.floor(Math.random() * horrorSounds.length)];
        playAudio(sound, 0.05, accessibility); // Very quiet
      }
    };
    const interval = setInterval(playRandomHorrorSound, 10000);
    return () => clearInterval(interval);
  }, [isAudioEnabled, accessibility]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        setAudioDevices(audioOutputs.map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Устройство ${d.deviceId.substring(0, 5)}...`
        })));
      } catch (err) {
        console.error("Error getting audio devices", err);
      }
    };
    getDevices();
    
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', getDevices);
      return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    }
  }, []);

  useEffect(() => {
    if (accessibility.audioOutputId && typeof (HTMLAudioElement.prototype as any).setSinkId === 'function') {
      if (bgAudioRef.current) {
        (bgAudioRef.current as any).setSinkId(accessibility.audioOutputId).catch(console.error);
      }
      if (bgMusicRef.current) {
        (bgMusicRef.current as any).setSinkId(accessibility.audioOutputId).catch(console.error);
      }
    }
  }, [accessibility.audioOutputId]);

  useEffect(() => {
    localStorage.setItem('poppy_playtime_achievements', JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements]);

  const checkAchievements = (state: GameState, nodeId: string) => {
    const newlyUnlocked: Achievement[] = [];

    const unlock = (id: string) => {
      if (!unlockedAchievements.includes(id)) {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach) {
          setUnlockedAchievements(prev => [...prev, id]);
          newlyUnlocked.push(ach);
        }
      }
    };

    if (nodeId === 'entrance') unlock('first_steps');
    if (nodeId === 'storage_warehouse' && state.character.perk === 'tech') unlock('tech_genius');
    if (state.collectibles.length >= 5) unlock('collector');
    if (nodeId === 'escape' || nodeId === 'true_ending' || nodeId === 'true_ending_perfect') unlock('survivor');
    if (nodeId === 'true_ending_perfect') unlock('truth_seeker');
    if ((nodeId === 'true_ending' || nodeId === 'true_ending_perfect') && !localStorage.getItem('game_of_my_life_offered')) {
      setShowGameOfMyLifeModal(true);
      localStorage.setItem('game_of_my_life_offered', 'true');
    }
    if (nodeId === 'vents_left' && state.character.perk === 'athletic') unlock('pacifist');
    if (state.inventory.includes('vhs_tape') && state.inventory.includes('golden_vhs') && state.inventory.includes('torn_note') && state.inventory.includes('elliots_diary') && state.collectibles.includes('secret_tape') && state.secretNotes.includes('secret_note_1') && state.secretNotes.includes('secret_note_2')) unlock('detective');
    if (state.inventory.includes('treasure_map')) unlock('cartographer');

    if (newlyUnlocked.length > 0) {
      setAchievementToast(newlyUnlocked[0]);
      if (isAudioEnabled) {
        playAudio(SOUNDS.success, 0.5, accessibility);
      }
      setTimeout(() => setAchievementToast(null), 5000);
    }
  };

  const speakLine = (text: string, character: string) => {
    setVoiceLine({ text, character });
    
    if (isAudioEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bg-BG';
      
      if (character === 'employee') {
        utterance.pitch = 1;
        utterance.rate = 0.9;
      } else if (character === 'investigator') {
        utterance.pitch = 0.8;
        utterance.rate = 0.85;
      } else if (character === 'explorer') {
        utterance.pitch = 1.2;
        utterance.rate = 1.1;
      }
      
      window.speechSynthesis.speak(utterance);
    }
    
    const duration = Math.max(3000, text.length * 100);
    setTimeout(() => {
      setVoiceLine(null);
    }, duration);
  };

  const checkVoiceLines = (oldState: GameState, newState: GameState) => {
    if (!newState.character.background) return;
    
    const newItems = newState.inventory.filter(item => !oldState.inventory.includes(item));
    const newCollectibles = newState.collectibles.filter(item => !oldState.collectibles.includes(item));
    const newSecretNotes = newState.secretNotes.filter(item => !oldState.secretNotes.includes(item));
    const allNewItems = [...newItems, ...newCollectibles, ...newSecretNotes];
    
    if (allNewItems.length > 0) {
      const item = allNewItems[0];
      const reaction = CHARACTER_REACTIONS[newState.character.background]?.[item];
      if (reaction) {
        speakLine(reaction, newState.character.background);
      }
    }
  };

  // Refs
  const textContainerRef = useRef<HTMLDivElement>(null);
  const examinedRef = useRef<HTMLDivElement>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const currentNode = GAME_NODES[currentNodeId];

  // Gamepad and Keyboard Navigation Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const items = Array.from(document.querySelectorAll('.focusable-item')) as HTMLElement[];
      if (!items.length) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus();
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        const choices = Array.from(document.querySelectorAll('.choice-item')) as HTMLElement[];
        if (choices[index]) {
          choices[index].click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastButtonPress = 0;
    const COOLDOWN = 200;

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];

      if (gp) {
        const now = Date.now();
        if (now - lastButtonPress > COOLDOWN) {
          const items = Array.from(document.querySelectorAll('.focusable-item')) as HTMLElement[];
          const currentIndex = items.indexOf(document.activeElement as HTMLElement);

          // D-pad Down (13) or Left Stick Down (axes[1] > 0.5) or D-pad Right (15) or Left Stick Right (axes[0] > 0.5)
          if (gp.buttons[13]?.pressed || gp.axes[1] > 0.5 || gp.buttons[15]?.pressed || gp.axes[0] > 0.5) {
            const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            items[nextIndex]?.focus();
            lastButtonPress = now;
          }
          // D-pad Up (12) or Left Stick Up (axes[1] < -0.5) or D-pad Left (14) or Left Stick Left (axes[0] < -0.5)
          else if (gp.buttons[12]?.pressed || gp.axes[1] < -0.5 || gp.buttons[14]?.pressed || gp.axes[0] < -0.5) {
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            items[prevIndex]?.focus();
            lastButtonPress = now;
          }
          // A Button (0)
          else if (gp.buttons[0]?.pressed) {
            if (currentIndex >= 0 && items[currentIndex]) {
              items[currentIndex].click();
              lastButtonPress = now + 300;
            } else if (items.length > 0) {
              items[0].focus();
              lastButtonPress = now + 300;
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    pollGamepad();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Handle focus for screen readers
  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.focus();
    }
  }, [currentNodeId]);

  // Handle background audio
  useEffect(() => {
    if (!isAudioEnabled) {
      if (bgAudioRef.current) {
        const oldAudio = bgAudioRef.current;
        let vol = oldAudio.volume;
        const fadeOut = setInterval(() => {
          if (vol > 0.05) {
            vol -= 0.05;
            oldAudio.volume = vol;
          } else {
            clearInterval(fadeOut);
            oldAudio.pause();
          }
        }, 100);
      }
      return;
    }

    const currentBgSound = currentNode.bgSound;
    
    if (currentBgSound) {
      if (!bgAudioRef.current || bgAudioRef.current.src !== currentBgSound) {
        if (bgAudioRef.current) {
          const oldAudio = bgAudioRef.current;
          let vol = oldAudio.volume;
          const fadeOut = setInterval(() => {
            if (vol > 0.05) {
              vol -= 0.05;
              oldAudio.volume = vol;
            } else {
              clearInterval(fadeOut);
              oldAudio.pause();
            }
          }, 100);
        }
        const audio = playAudio(currentBgSound, 0.15, accessibility, true);
        bgAudioRef.current = audio;
      }
    } else {
      if (bgAudioRef.current) {
        const oldAudio = bgAudioRef.current;
        let vol = oldAudio.volume;
        const fadeOut = setInterval(() => {
          if (vol > 0.05) {
            vol -= 0.05;
            oldAudio.volume = vol;
          } else {
            clearInterval(fadeOut);
            oldAudio.pause();
          }
        }, 100);
        bgAudioRef.current = null;
      }
    }

    return () => {
      // Cleanup is handled by state changes, but we could pause here if unmounting
    };
  }, [currentNodeId, isAudioEnabled, currentNode.bgSound]);

  // Handle dynamic background music
  useEffect(() => {
    if (!isAudioEnabled) {
      if (bgMusicRef.current) {
        const oldAudio = bgMusicRef.current;
        let vol = oldAudio.volume;
        const fadeOut = setInterval(() => {
          if (vol > 0.05) {
            vol -= 0.05;
            oldAudio.volume = vol;
          } else {
            clearInterval(fadeOut);
            oldAudio.pause();
          }
        }, 100);
      }
      return;
    }

    const currentBgMusic = currentNode.bgMusic;
    
    if (currentBgMusic) {
      if (currentBgMusic === MUSIC.STOP) {
        if (bgMusicRef.current) {
          const oldAudio = bgMusicRef.current;
          let vol = oldAudio.volume;
          const fadeOut = setInterval(() => {
            if (vol > 0.05) {
              vol -= 0.05;
              oldAudio.volume = vol;
            } else {
              clearInterval(fadeOut);
              oldAudio.pause();
            }
          }, 100);
          bgMusicRef.current = null;
        }
      } else if (!bgMusicRef.current || bgMusicRef.current.src !== currentBgMusic) {
        if (bgMusicRef.current) {
          const oldAudio = bgMusicRef.current;
          let vol = oldAudio.volume;
          const fadeOut = setInterval(() => {
            if (vol > 0.05) {
              vol -= 0.05;
              oldAudio.volume = vol;
            } else {
              clearInterval(fadeOut);
              oldAudio.pause();
            }
          }, 100);
        }
        const audio = playAudio(currentBgMusic, 0, accessibility, true);
        
        let vol = 0;
        const fadeIn = setInterval(() => {
          if (vol < 0.25) {
            vol += 0.05;
            if (audio) audio.volume = Math.min(vol, 0.25);
          } else {
            clearInterval(fadeIn);
          }
        }, 100);
        
        bgMusicRef.current = audio;
      }
    }
    // If currentBgMusic is undefined, we DO NOT stop the music. 
    // It continues playing the previous track, creating a seamless dynamic experience.

  }, [currentNodeId, isAudioEnabled, currentNode.bgMusic]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error attempting to toggle fullscreen:", err);
    }
  };

  const prevNodeIdRef = useRef(currentNodeId);

  // Handle entry sounds for specific nodes (jumpscares, discoveries, etc.)
  useEffect(() => {
    if (!isAudioEnabled) return;
    
    const nodeChanged = prevNodeIdRef.current !== currentNodeId;
    prevNodeIdRef.current = currentNodeId;

    if (nodeChanged && accessibility.locationEntrySound) {
      playAudio(SOUNDS.footsteps, 0.3, accessibility);
    }

    if (currentNode.entrySound) {
      playAudio(currentNode.entrySound, 0.6, accessibility);
      
      // Visual cue for entry sound
      setVisualCue(<Volume2 className="w-6 h-6" />);
      setTimeout(() => setVisualCue(null), 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId, isAudioEnabled, currentNode.entrySound]);

  // Handle vibration
  useEffect(() => {
    if (currentNode.vibration) {
      // Mobile vibration
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(currentNode.vibration);
        } catch (e) {
          console.log("Mobile vibration failed", e);
        }
      }

      // Controller rumble
      if ('getGamepads' in navigator) {
        try {
          const gamepads = navigator.getGamepads();
          const duration = Array.isArray(currentNode.vibration) 
            ? currentNode.vibration.reduce((a, b) => a + b, 0) 
            : currentNode.vibration;

          for (const gamepad of gamepads) {
            if (gamepad && (gamepad as any).vibrationActuator) {
              (gamepad as any).vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: duration,
                weakMagnitude: 1.0,
                strongMagnitude: 1.0
              }).catch((e: any) => console.log("Gamepad rumble failed", e));
            }
          }
        } catch (e) {
          console.log("Gamepad API failed", e);
        }
      }
    }
  }, [currentNodeId, currentNode.vibration]);

  // TTS Narration
  useEffect(() => {
    if (accessibility.autoNarrate && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop current
      
      const textToRead = typeof currentNode.text === 'function' ? currentNode.text(gameState) : currentNode.text;
      const cleanText = textToRead.replace(/\[.*?\]/g, ''); // Remove sound cues like [Звук от...]
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = accessibility.narrationSpeed;
      utterance.lang = 'bg-BG'; // Bulgarian
      
      window.speechSynthesis.speak(utterance);
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentNodeId, accessibility.autoNarrate, accessibility.narrationSpeed, gameState]);

  const playActionSound = (soundUrl: string) => {
    if (!isAudioEnabled) return;
    playAudio(soundUrl, 0.4, accessibility);
  };

  const autoSaveGame = () => {
    try {
      const saveData = {
        currentNodeId,
        gameState,
        history,
        accessibility,
        isAudioEnabled
      };
      localStorage.setItem('poppy_playtime_save', JSON.stringify(saveData));
    } catch (e) {
      console.error('Auto-save failed', e);
    }
  };

  useEffect(() => {
    if (currentNodeId !== 'start' && currentNodeId !== 'game_over') {
      autoSaveGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId, gameState]);

  const saveGame = () => {
    try {
      setIsSaving(true);
      const saveData = {
        currentNodeId,
        gameState,
        history,
        accessibility,
        isAudioEnabled
      };
      localStorage.setItem('poppy_playtime_save', JSON.stringify(saveData));
      
      setTimeout(() => {
        setIsSaving(false);
        setToast('Играта е запазена успешно!');
        setTimeout(() => setToast(null), 3000);
        if (isAudioEnabled) {
          playAudio(SOUNDS.success, 0.5, accessibility);
        }
      }, 800);
    } catch (e) {
      console.error('Save failed', e);
      setIsSaving(false);
      setToast('Грешка при запазване!');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const loadGame = () => {
    try {
      const saved = localStorage.getItem('poppy_playtime_save');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentNodeId(parsed.currentNodeId);
        setGameState(parsed.gameState);
        setHistory(parsed.history);
        setAccessibility(parsed.accessibility || DEFAULT_ACCESSIBILITY);
        setIsAudioEnabled(parsed.isAudioEnabled || false);
        checkAchievements(parsed.gameState, parsed.currentNodeId);
        setToast('Играта е заредена успешно!');
        setTimeout(() => setToast(null), 3000);
        setShowSettings(false);
        if (parsed.isAudioEnabled) {
          playAudio(SOUNDS.success, 0.5, accessibility);
        }
      } else {
        setToast('Няма намерена запазена игра.');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error('Load failed', e);
      setToast('Грешка при зареждане!');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getInventoryItemActions = (item: string) => {
    const actions: { label: string; icon: React.ReactNode; onExecute: () => void }[] = [];
    
    // Global actions
    if (item === 'treasure_map') {
      actions.push({
        label: 'Отвори карта',
        icon: <Map className="w-5 h-5" />,
        onExecute: () => {
          setShowMapModal(true);
          if (isAudioEnabled) playAudio(SOUNDS.paper, 0.4, accessibility);
        }
      });
    }

    if (item === 'empty_flashlight' && gameState.inventory.includes('small_batteries')) {
      actions.push({
        label: 'Комбинирай с Малки батерии',
        icon: <Zap className="w-5 h-5" />,
        onExecute: () => {
          setGameState(prev => ({
            ...prev,
            inventory: [...prev.inventory.filter(i => i !== 'empty_flashlight' && i !== 'small_batteries'), 'flashlight']
          }));
          if (isAudioEnabled) playAudio(SOUNDS.clank, 0.5, accessibility);
          setToast('Успешно комбинирахте предметите: Работещо фенерче');
          setTimeout(() => setToast(null), 3000);
        }
      });
    }
    
    if (item === 'small_batteries' && gameState.inventory.includes('empty_flashlight')) {
      actions.push({
        label: 'Комбинирай с Празно фенерче',
        icon: <Zap className="w-5 h-5" />,
        onExecute: () => {
          setGameState(prev => ({
            ...prev,
            inventory: [...prev.inventory.filter(i => i !== 'empty_flashlight' && i !== 'small_batteries'), 'flashlight']
          }));
          if (isAudioEnabled) playAudio(SOUNDS.clank, 0.5, accessibility);
          setToast('Успешно комбинирахте предметите: Работещо фенерче');
          setTimeout(() => setToast(null), 3000);
        }
      });
    }

    // Contextual actions based on current scene
    const currentNode = GAME_NODES[currentNodeId];
    if (currentNode && currentNode.choices) {
      const availableChoices = currentNode.choices.filter(c => !c.condition || c.condition(gameState));
      
      availableChoices.forEach(choice => {
        // Skip the scene's combine choice if we already added the global one
        if (choice.text.includes('Комбинирай Празното фенерче') && (item === 'empty_flashlight' || item === 'small_batteries')) {
          return;
        }

        let isRelated = false;
        const textLower = choice.text.toLowerCase();
        if (item === 'vhs_tape' && textLower.includes('касета')) isRelated = true;
        if (item === 'blue_hand' && textLower.includes('синята ръка')) isRelated = true;
        if (item === 'screwdriver' && textLower.includes('отвертка')) isRelated = true;
        if (item === 'keycard' && textLower.includes('карта')) isRelated = true;
        if (item === 'red_battery' && textLower.includes('батерия')) isRelated = true;
        if (item === 'flashlight' && textLower.includes('фенерче')) isRelated = true;
        if (item === 'wrench' && textLower.includes('гаечен ключ')) isRelated = true;
        if (item === 'owl_key' && textLower.includes('ключ')) isRelated = true;
        if (item === 'star_key' && textLower.includes('звезден ключ')) isRelated = true;

        if (isRelated) {
          actions.push({
            label: choice.text,
            icon: choice.icon || <ArrowRight className="w-5 h-5" />,
            onExecute: () => handleChoice(choice)
          });
        }
      });
    }

    return actions;
  };

  const handleChoice = (choice: Choice) => {
    // Auto-enable audio on first interaction if starting the game
    let audioEnabledNow = isAudioEnabled;
    if (!isAudioEnabled && currentNodeId === 'start') {
      setIsAudioEnabled(true);
      audioEnabledNow = true;
    }

    // Play action sound
    if (audioEnabledNow && choice.actionSound) {
      playAudio(choice.actionSound, 0.4, accessibility);
      
      // Visual cue for sound
      setVisualCue(choice.icon || <Volume2 className="w-6 h-6" />);
      setTimeout(() => setVisualCue(null), 1500);
    }

    // Clear examined object
    setExaminedObject(null);

    // Update history
    if (choice.nextId === 'start') {
      setHistory([]);
    } else {
      setHistory(prev => [...prev, { 
        title: currentNode.title, 
        text: typeof currentNode.text === 'function' ? currentNode.text(gameState) : currentNode.text,
        nodeId: currentNodeId,
        gameState: { ...gameState }
      }]);
    }
    
    // Execute action if any
    let nextState = gameState;
    if (choice.action) {
      nextState = choice.action(gameState);
      
      // Check for newly picked up items
      const newInventoryItems = nextState.inventory.filter(i => !gameState.inventory.includes(i));
      const newCollectibles = nextState.collectibles.filter(c => !gameState.collectibles.includes(c));
      const newSecretNotes = nextState.secretNotes.filter(n => !gameState.secretNotes.includes(n));
      
      const pickedUpItem = newInventoryItems.length > 0 || newCollectibles.length > 0 || newSecretNotes.length > 0;
                            
      if (pickedUpItem) {
        if (audioEnabledNow && choice.actionSound !== SOUNDS.pickup) {
          playAudio(SOUNDS.pickup, 0.5, accessibility);
        }
        const itemName = newInventoryItems[0] || newCollectibles[0] || newSecretNotes[0];
        setToast(`Предметът е добавен: ${itemName}`);
        setTimeout(() => setToast(null), 2000);
      }

      const newlyCompleted = nextState.completedObjectives.filter(obj => !gameState.completedObjectives.includes(obj));
      if (newlyCompleted.length > 0) {
        if (audioEnabledNow) {
          playAudio(SOUNDS.objective_complete, 0.5, accessibility);
        }
        setToast(`Задача изпълнена: ${OBJECTIVES[newlyCompleted[0]]}`);
        setTimeout(() => setToast(null), 5000);
      }
      checkVoiceLines(gameState, nextState);
      setGameState(nextState);
    }
    
    // Move to next node
    checkAchievements(nextState, choice.nextId);
    setCurrentNodeId(choice.nextId);
    setSearchTerm('');
  };

  useEffect(() => {
    if (currentNode.timeLimit && currentNode.timeLimitNextId) {
      setTimeLeft(currentNode.timeLimit);
    } else {
      setTimeLeft(null);
    }
  }, [currentNodeId, currentNode.timeLimit, currentNode.timeLimitNextId]);

  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft <= 0) {
      handleChoice({
        id: 'timeout',
        text: 'Времето изтече!',
        nextId: currentNode.timeLimitNextId!
      });
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev !== null ? prev - 1 : null);
      if (isAudioEnabled && timeLeft <= 5) {
        playAudio(SOUNDS.heartbeat, 0.4 + (1 - timeLeft / 5) * 0.6, accessibility);
      }
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Random ambient window/vent sounds
  useEffect(() => {
    if (!isAudioEnabled || accessibility.muteWindows) return;

    let timeout: NodeJS.Timeout;
    
    const playRandomAmbient = () => {
      const sound = Math.random() > 0.5 ? SOUNDS.window_open : SOUNDS.window_close;
      playAudio(sound, 0.15, accessibility);
      
      // Schedule next sound between 15 and 35 seconds
      const nextTime = 15000 + Math.random() * 20000;
      timeout = setTimeout(playRandomAmbient, nextTime);
    };

    // Start the loop
    timeout = setTimeout(playRandomAmbient, 10000 + Math.random() * 10000);

    return () => clearTimeout(timeout);
  }, [isAudioEnabled, accessibility.muteWindows, accessibility.audioOutputId]);

  const handlePreviousScene = () => {
    if (history.length === 0) return;
    
    const newHistory = [...history];
    const previousState = newHistory.pop();
    
    if (previousState) {
      setExaminedObject(null);
      setHistory(newHistory);
      setCurrentNodeId(previousState.nodeId);
      setGameState(previousState.gameState);
      setSearchTerm('');
    }
  };

  const handleInteract = (item: Interactable) => {
    const desc = typeof item.description === 'function' ? item.description(gameState) : item.description;
    setExaminedObject({ label: item.label, description: desc });
    
    if (isAudioEnabled && item.actionSound) {
      playAudio(item.actionSound, 0.4, accessibility);
      setVisualCue(item.icon || <Search className="w-6 h-6" />);
      setTimeout(() => setVisualCue(null), 1500);
    }

    if (item.action) {
      const newState = item.action(gameState);
      
      // Check for newly picked up items
      const pickedUpItem = newState.inventory.length > gameState.inventory.length || 
                           newState.collectibles.length > gameState.collectibles.length ||
                           newState.secretNotes.length > gameState.secretNotes.length;
                           
      if (pickedUpItem && isAudioEnabled && item.actionSound !== SOUNDS.pickup) {
        playAudio(SOUNDS.pickup, 0.5, accessibility);
      }

      const newlyCompleted = newState.completedObjectives.filter(obj => !gameState.completedObjectives.includes(obj));
      if (newlyCompleted.length > 0) {
        if (isAudioEnabled) {
          playAudio(SOUNDS.objective_complete, 0.5, accessibility);
        }
        setToast(`Задача изпълнена: ${OBJECTIVES[newlyCompleted[0]]}`);
        setTimeout(() => setToast(null), 5000);
      }
      checkVoiceLines(gameState, newState);
      setGameState(newState);
    }
    
    // Focus the examined text for screen readers
    setTimeout(() => {
      if (examinedRef.current) {
        examinedRef.current.focus();
      }
    }, 50);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToast('Гласовото търсене не се поддържа от вашия браузър.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'bg-BG';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setToast('Грешка при гласовото търсене.');
      setTimeout(() => setToast(null), 3000);
    };
    
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const normalizedSearch = searchTerm.toLowerCase().trim();

  // Filter choices based on conditions and search term
  const availableChoices = currentNode.choices.filter(
    choice => (!choice.condition || choice.condition(gameState)) &&
              (normalizedSearch === '' || choice.text.toLowerCase().includes(normalizedSearch))
  );

  const availableInteractables = currentNode.interactables?.filter(
    i => (!i.condition || i.condition(gameState)) &&
         (normalizedSearch === '' || 
          i.label.toLowerCase().includes(normalizedSearch) || 
          (typeof i.description === 'string' ? i.description.toLowerCase().includes(normalizedSearch) : i.description(gameState).toLowerCase().includes(normalizedSearch)))
  ) || [];

  return (
    <div className={`min-h-screen font-sans relative overflow-hidden ${accessibility.highContrast ? 'bg-black text-white selection:bg-white selection:text-black' : 'bg-black text-yellow-400 selection:bg-yellow-400 selection:text-black'}`}>
      {/* Save Effect Overlay */}
      <AnimatePresence>
        {isSaving && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-blue-500/20 animate-[pulse_0.4s_ease-in-out_2]"></div>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="bg-black/80 p-8 rounded-2xl border-2 border-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.6)] flex flex-col items-center"
            >
              <Save className="w-16 h-16 text-blue-400 animate-bounce" />
              <div className="mt-4 text-blue-400 font-bold text-xl tracking-widest uppercase">Запазване...</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Profile Indicators */}
      <div className="fixed top-4 left-4 z-40 flex gap-2">
        <div className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider ${accessibility.highContrast ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
          {gameState.character.background === 'employee' ? 'Служител' : 
           gameState.character.background === 'investigator' ? 'Детектив' : 
           gameState.character.background === 'explorer' ? 'Изследовател' : 
           gameState.character.background === 'paranormal' ? 'Паранормален следовател' : 'Неизвестен'}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider ${accessibility.highContrast ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
          {gameState.character.perk === 'tech' ? 'Технически умения' : 
           gameState.character.perk === 'athletic' ? 'Атлетичен' : 
           gameState.character.perk === 'perceptive' ? 'Внимателен' : 
           gameState.character.perk === 'heightened_senses' ? 'Изострени сетива' : 'Без умение'}
        </div>
      </div>

      {/* Dynamic Background Effects for sighted users */}
      {!accessibility.highContrast && (
        <div 
          className={`fixed inset-0 pointer-events-none transition-all duration-1000 mix-blend-screen ${
            currentNode.bgMusic === MUSIC.chase ? 'opacity-20 bg-red-900 animate-pulse' : 
            currentNode.bgMusic === MUSIC.suspense ? 'opacity-10 bg-blue-900' : 
            currentNode.bgSound === SOUNDS.monster_growl ? 'opacity-40 bg-red-900 animate-pulse' :
            currentNode.bgSound === SOUNDS.zap ? 'opacity-30 bg-yellow-400 animate-pulse' :
            currentNode.bgSound === SOUNDS.drip ? 'opacity-10 bg-blue-800' :
            currentNode.bgSound === SOUNDS.wind ? 'opacity-10 bg-gray-600' :
            currentNode.bgSound === SOUNDS.machine ? 'opacity-10 bg-green-900' :
            currentNode.bgSound === SOUNDS.outside_bg ? 'opacity-10 bg-indigo-900' :
            'opacity-0 bg-transparent'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Chase Timer Overlay */}
      <AnimatePresence>
        {timeLeft !== null && currentNode.timeLimit && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none"
          >
            <div className={`text-5xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] ${timeLeft <= 3 ? 'text-red-500 animate-pulse scale-125' : 'text-red-400'}`}>
              <Timer className={`w-10 h-10 inline-block mr-3 ${timeLeft <= 3 ? 'animate-spin' : ''}`} style={{ animationDuration: '1s' }} />
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
            <div className="w-72 h-3 bg-black/80 border border-red-900 rounded-full mt-4 overflow-hidden shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              <div 
                className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-red-500' : 'bg-red-600'}`}
                style={{ width: `${(timeLeft / currentNode.timeLimit) * 100}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <header className={`p-4 border-b flex items-center justify-between relative z-10 backdrop-blur-sm ${accessibility.highContrast ? 'bg-black border-white' : 'bg-black/80 border-yellow-400/30'}`}>
        <h1 className="text-2xl font-bold tracking-wider uppercase">Poppy Playtime: Аудио</h1>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center text-sm opacity-80" aria-hidden="true">
            <Gamepad2 className="w-4 h-4 mr-1" />
            <span className="mr-4">Поддържа контролер</span>
            <Info className="w-4 h-4 mr-1" />
            <span>Оптимизирано за екранни четци</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${accessibility.highContrast ? 'border-white text-white' : 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10'}`} 
              title="Тайни бележки"
              aria-label={`Тайни бележки: ${gameState.secretNotes.length} от 2`}
            >
              <Search className="w-4 h-4" />
              <span className="font-bold font-mono text-sm">{gameState.secretNotes.length}/2</span>
            </div>
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${accessibility.highContrast ? 'border-white text-white' : 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'}`} 
              title="Колекционерски предмети"
              aria-label={`Колекционерски предмети: ${gameState.collectibles.length} от 5`}
            >
              <Zap className="w-4 h-4" />
              <span className="font-bold font-mono text-sm">{gameState.collectibles.length}/5</span>
            </div>
            {isAudioEnabled && (
              <div className="flex items-end gap-1 h-4 mr-2" aria-hidden="true">
                <span className={`w-1 animate-[bounce_1s_infinite_0ms] h-full rounded-full ${accessibility.highContrast ? 'bg-white' : 'bg-yellow-400'}`}></span>
                <span className={`w-1 animate-[bounce_1s_infinite_200ms] h-3/4 rounded-full ${accessibility.highContrast ? 'bg-white' : 'bg-yellow-400'}`}></span>
                <span className={`w-1 animate-[bounce_1s_infinite_400ms] h-full rounded-full ${accessibility.highContrast ? 'bg-white' : 'bg-yellow-400'}`}></span>
              </div>
            )}
            <motion.button whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={handlePreviousScene}
              disabled={history.length === 0}
              className={`flex items-center p-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${accessibility.highContrast ? 'hover:bg-white/20 focus:ring-white' : 'hover:bg-yellow-400/20 focus:ring-yellow-400'}`}
              aria-label="Предишна сцена"
              title="Предишна сцена"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="sr-only">Предишна сцена</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`flex items-center p-2 rounded-lg focus:outline-none focus:ring-2 ${accessibility.highContrast ? 'hover:bg-white/20 focus:ring-white' : 'hover:bg-yellow-400/20 focus:ring-yellow-400'}`}
              aria-pressed={isAudioEnabled}
              aria-label={isAudioEnabled ? "Изключи звуковите ефекти" : "Включи звуковите ефекти"}
              title={isAudioEnabled ? "Изключи звуковите ефекти" : "Включи звуковите ефекти"}
            >
              {isAudioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              <span className="sr-only">{isAudioEnabled ? "Звукът е включен" : "Звукът е изключен"}</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`flex items-center p-2 rounded-lg focus:outline-none focus:ring-2 ${accessibility.highContrast ? 'hover:bg-white/20 focus:ring-white' : 'hover:bg-yellow-400/20 focus:ring-yellow-400'} ${isVoiceEnabled ? 'bg-yellow-400/20' : ''}`}
              aria-pressed={isVoiceEnabled}
              aria-label={isVoiceEnabled ? "Изключи гласово управление" : "Включи гласово управление"}
              title={isVoiceEnabled ? "Изключи гласово управление" : "Включи гласово управление"}
            >
              <Mic className={`w-6 h-6 ${isVoiceEnabled ? 'text-yellow-400' : ''}`} />
              <span className="sr-only">{isVoiceEnabled ? "Гласовото управление е включено" : "Гласовото управление е изключено"}</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setShowMemoryLane(true)}
              className={`flex items-center p-2 rounded-lg focus:outline-none focus:ring-2 ${accessibility.highContrast ? 'hover:bg-white/20 focus:ring-white' : 'hover:bg-yellow-400/20 focus:ring-yellow-400'}`}
              aria-label="Пътека на спомените"
              title="Пътека на спомените"
            >
              <History className="w-6 h-6" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setShowAchievements(true)}
              className={`flex items-center p-2 rounded-lg focus:outline-none focus:ring-2 ${accessibility.highContrast ? 'hover:bg-white/20 focus:ring-white' : 'hover:bg-yellow-400/20 focus:ring-yellow-400'}`}
              aria-label="Постижения"
              title="Постижения"
            >
              <Trophy className="w-6 h-6" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className={`flex items-center p-2 rounded-lg focus:outline-none focus:ring-2 ${accessibility.highContrast ? 'hover:bg-white/20 focus:ring-white' : 'hover:bg-yellow-400/20 focus:ring-yellow-400'}`}
              aria-label="Настройки за достъпност"
              title="Настройки за достъпност"
            >
              <Settings className="w-6 h-6" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className={`flex items-center p-2 rounded-lg focus:outline-none focus:ring-2 ${accessibility.highContrast ? 'hover:bg-white/20 focus:ring-white' : 'hover:bg-yellow-400/20 focus:ring-yellow-400'}`}
              aria-label={isFullscreen ? "Изход от цял екран" : "Цял екран"}
              title={isFullscreen ? "Изход от цял екран" : "Цял екран"}
            >
              {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md p-6 rounded-xl border ${accessibility.highContrast ? 'bg-black border-white' : 'bg-zinc-900 border-zinc-700'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold uppercase tracking-wider">Настройки за достъпност</h2>
              <motion.button whileTap={{ scale: 0.95 }} 
                onClick={() => setShowSettings(false)} 
                className={`p-2 rounded-lg ${accessibility.highContrast ? 'hover:bg-white/20' : 'hover:bg-white/10'}`}
                aria-label="Затвори настройките"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
            
            {/* Audio Output Device */}
            {audioDevices.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Изходно аудио устройство</label>
                <select
                  value={accessibility.audioOutputId}
                  onChange={(e) => setAccessibility(prev => ({ ...prev, audioOutputId: e.target.value }))}
                  className={`w-full p-2 rounded border ${
                    accessibility.highContrast 
                      ? 'bg-black text-white border-white' 
                      : 'bg-zinc-800 text-white border-zinc-600'
                  }`}
                >
                  <option value="">По подразбиране</option>
                  {audioDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1 opacity-70">
                  Изберете високоговорител на телефон или контролер, ако е наличен.
                </p>
                {audioDevices.some(d => d.label.startsWith('Устройство')) && (
                  <motion.button whileTap={{ scale: 0.95 }} 
                    onClick={async () => {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        stream.getTracks().forEach(track => track.stop()); // Stop immediately
                      } catch (e) {
                        console.error("Microphone permission denied", e);
                      }
                    }}
                    className="mt-2 text-xs text-blue-400 underline hover:text-blue-300"
                  >
                    Покажи имената на устройствата (изисква разрешение)
                  </motion.button>
                )}
              </div>
            )}

            {/* Font Size */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Размер на шрифта</label>
              <div className="flex gap-2">
                {['normal', 'large', 'xlarge'].map(size => (
                  <motion.button whileTap={{ scale: 0.95 }}
                    key={size}
                    onClick={() => setAccessibility(prev => ({ ...prev, fontSize: size as any }))}
                    className={`flex-1 py-2 rounded border font-bold ${
                      accessibility.fontSize === size 
                        ? (accessibility.highContrast ? 'bg-white text-black border-white' : 'bg-yellow-400 text-black border-yellow-400') 
                        : (accessibility.highContrast ? 'bg-transparent text-white border-white hover:bg-white/20' : 'bg-transparent border-zinc-600 hover:border-yellow-400')
                    }`}
                  >
                    {size === 'normal' ? 'Нормален' : size === 'large' ? 'Голям' : 'Много голям'}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* High Contrast */}
            <div className="mb-6 flex items-center justify-between">
              <label className="text-sm font-medium">Висок контраст</label>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setAccessibility(prev => ({ ...prev, highContrast: !prev.highContrast }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  accessibility.highContrast ? 'bg-white' : 'bg-zinc-600'
                }`}
                aria-pressed={accessibility.highContrast}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                  accessibility.highContrast ? 'translate-x-6 bg-black' : 'translate-x-0 bg-white'
                }`} />
              </motion.button>
            </div>

            {/* Auto Narrate */}
            <div className="mb-6 flex items-center justify-between">
              <label className="text-sm font-medium">Автоматично четене (TTS)</label>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setAccessibility(prev => ({ ...prev, autoNarrate: !prev.autoNarrate }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  accessibility.autoNarrate 
                    ? (accessibility.highContrast ? 'bg-white' : 'bg-yellow-400') 
                    : 'bg-zinc-600'
                }`}
                aria-pressed={accessibility.autoNarrate}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                  accessibility.autoNarrate 
                    ? `translate-x-6 ${accessibility.highContrast ? 'bg-black' : 'bg-white'}` 
                    : 'translate-x-0 bg-white'
                }`} />
              </motion.button>
            </div>

            {/* Sound Effects Toggles */}
            <div className="mb-6 border-t border-zinc-700 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">Звукови ефекти</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Изключи звука от стъпки</label>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setAccessibility(prev => ({ ...prev, muteFootsteps: !prev.muteFootsteps }))}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      accessibility.muteFootsteps ? (accessibility.highContrast ? 'bg-white' : 'bg-yellow-400') : 'bg-zinc-600'
                    }`}
                    aria-pressed={accessibility.muteFootsteps}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                      accessibility.muteFootsteps ? `translate-x-6 ${accessibility.highContrast ? 'bg-black' : 'bg-white'}` : 'translate-x-0 bg-white'
                    }`} />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Изключи звука от врати</label>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setAccessibility(prev => ({ ...prev, muteDoors: !prev.muteDoors }))}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      accessibility.muteDoors ? (accessibility.highContrast ? 'bg-white' : 'bg-yellow-400') : 'bg-zinc-600'
                    }`}
                    aria-pressed={accessibility.muteDoors}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                      accessibility.muteDoors ? `translate-x-6 ${accessibility.highContrast ? 'bg-black' : 'bg-white'}` : 'translate-x-0 bg-white'
                    }`} />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Изключи звука от прозорци</label>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setAccessibility(prev => ({ ...prev, muteWindows: !prev.muteWindows }))}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      accessibility.muteWindows ? (accessibility.highContrast ? 'bg-white' : 'bg-yellow-400') : 'bg-zinc-600'
                    }`}
                    aria-pressed={accessibility.muteWindows}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                      accessibility.muteWindows ? `translate-x-6 ${accessibility.highContrast ? 'bg-black' : 'bg-white'}` : 'translate-x-0 bg-white'
                    }`} />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Изключи звука от стряскащи моменти</label>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setAccessibility(prev => ({ ...prev, muteJumpscares: !prev.muteJumpscares }))}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      accessibility.muteJumpscares ? (accessibility.highContrast ? 'bg-white' : 'bg-yellow-400') : 'bg-zinc-600'
                    }`}
                    aria-pressed={accessibility.muteJumpscares}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                      accessibility.muteJumpscares ? `translate-x-6 ${accessibility.highContrast ? 'bg-black' : 'bg-white'}` : 'translate-x-0 bg-white'
                    }`} />
                  </motion.button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Звук при влизане в нова локация</label>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setAccessibility(prev => ({ ...prev, locationEntrySound: !prev.locationEntrySound }))}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      accessibility.locationEntrySound ? (accessibility.highContrast ? 'bg-white' : 'bg-yellow-400') : 'bg-zinc-600'
                    }`}
                    aria-pressed={accessibility.locationEntrySound}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                      accessibility.locationEntrySound ? `translate-x-6 ${accessibility.highContrast ? 'bg-black' : 'bg-white'}` : 'translate-x-0 bg-white'
                    }`} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Narration Speed */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-2">Скорост на четене: {accessibility.narrationSpeed}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.25"
                value={accessibility.narrationSpeed}
                onChange={(e) => setAccessibility(prev => ({ ...prev, narrationSpeed: parseFloat(e.target.value) }))}
                className={`w-full ${accessibility.highContrast ? 'accent-white' : 'accent-yellow-400'}`}
                aria-label="Скорост на четене"
              />
            </div>

            {/* Save / Load */}
            <div className="mb-6 border-t border-zinc-700 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">Прогрес</h3>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.95 }} 
                  onClick={saveGame}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border font-medium transition-colors ${
                    accessibility.highContrast ? 'border-white hover:bg-white hover:text-black' : 'border-zinc-600 hover:border-yellow-400 hover:text-yellow-400'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  Запази
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} 
                  onClick={loadGame}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border font-medium transition-colors ${
                    accessibility.highContrast ? 'border-white hover:bg-white hover:text-black' : 'border-zinc-600 hover:border-yellow-400 hover:text-yellow-400'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Зареди
                </motion.button>
              </div>
            </div>
            
            <motion.button whileTap={{ scale: 0.95 }} 
              onClick={() => setShowSettings(false)} 
              className={`w-full py-3 font-bold uppercase tracking-wider rounded-lg mt-2 ${
                accessibility.highContrast ? 'bg-white text-black hover:bg-gray-200' : 'bg-yellow-400 text-black hover:bg-yellow-500'
              }`}
            >
              Запази
            </motion.button>
          </div>
        </div>
      )}

      {showMapModal && (
        <MapModal
          currentNodeId={currentNodeId}
          visitedNodes={new Set(history.map(h => h.nodeId).concat([currentNodeId]))}
          gameNodes={GAME_NODES}
          onClose={() => setShowMapModal(false)}
          highContrast={accessibility.highContrast}
        />
      )}
      {/* Memory Lane Modal */}
      <AnimatePresence>
        {showMemoryLane && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`w-full max-w-2xl p-6 rounded-2xl border ${accessibility.highContrast ? 'bg-black border-white' : 'bg-zinc-900 border-yellow-400/30'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${accessibility.highContrast ? 'text-white' : 'text-yellow-400'}`}>Пътека на спомените</h2>
                <button onClick={() => setShowMemoryLane(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {history.map((h, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${accessibility.highContrast ? 'border-white' : 'border-zinc-700 bg-zinc-800'}`}>
                    <h4 className="font-bold text-lg">{h.title}</h4>
                    <p className="text-sm opacity-80">{h.text.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showGameOfMyLifeModal && (
        <GameOfMyLifeModal
          onClose={() => setShowGameOfMyLifeModal(false)}
        />
      )}

      {showAchievements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-2xl p-6 rounded-xl border max-h-[80vh] overflow-y-auto ${accessibility.highContrast ? 'bg-black border-white' : 'bg-zinc-900 border-zinc-700'}`}>
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-inherit z-10 py-2 border-b border-zinc-800">
              <h2 className="text-2xl font-bold uppercase tracking-wider flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                Постижения ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
              </h2>
              <motion.button whileTap={{ scale: 0.95 }} 
                onClick={() => setShowAchievements(false)} 
                className={`p-2 rounded-lg ${accessibility.highContrast ? 'hover:bg-white/20' : 'hover:bg-white/10'}`}
                aria-label="Затвори постиженията"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = unlockedAchievements.includes(ach.id);
                return (
                  <div 
                    key={ach.id} 
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                      isUnlocked 
                        ? (accessibility.highContrast ? 'border-white bg-white/10' : 'border-yellow-500/50 bg-yellow-900/20') 
                        : (accessibility.highContrast ? 'border-gray-600 opacity-50' : 'border-zinc-800 bg-zinc-900/50 opacity-50 grayscale')
                    }`}
                  >
                    <div className={`p-3 rounded-full ${isUnlocked ? (accessibility.highContrast ? 'bg-white text-black' : 'bg-yellow-500/20') : 'bg-zinc-800'}`}>
                      {isUnlocked ? ach.icon : <Unlock className="w-6 h-6 text-zinc-500" />}
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${isUnlocked ? (accessibility.highContrast ? 'text-white' : 'text-yellow-400') : 'text-zinc-400'}`}>
                        {isUnlocked ? ach.title : '???'}
                      </h3>
                      <p className={`text-sm mt-1 ${isUnlocked ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {isUnlocked ? ach.description : 'Продължете да играете, за да отключите това постижение.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto p-6 md:p-12 relative z-10">
        {/* Visual Cue Overlay for Sounds */}
        <AnimatePresence>
          {visualCue && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`absolute top-0 right-6 md:right-12 flex items-center gap-3 px-5 py-3 rounded-sm border-l-4 shadow-[0_0_20px_rgba(250,204,21,0.2)] backdrop-blur-sm overflow-hidden ${accessibility.highContrast ? 'text-white bg-black border-white shadow-none' : 'text-yellow-400 bg-black/80 border-yellow-500'}`} 
              aria-hidden="true"
            >
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30"></div>
              
              <div className="relative z-10">
                {visualCue}
                <span className="absolute inset-0 animate-ping opacity-50">{visualCue}</span>
              </div>
              
              <div className="flex flex-col z-10">
                <span className="text-[10px] font-mono tracking-[0.2em] opacity-70 uppercase">Аудио сигнал</span>
                <div className="flex items-end gap-[2px] h-3 mt-1">
                  <span className={`w-1 animate-[bounce_0.6s_infinite_0ms] h-full ${accessibility.highContrast ? 'bg-white' : 'bg-yellow-400'}`}></span>
                  <span className={`w-1 animate-[bounce_0.6s_infinite_100ms] h-2/3 ${accessibility.highContrast ? 'bg-white' : 'bg-yellow-400'}`}></span>
                  <span className={`w-1 animate-[bounce_0.6s_infinite_200ms] h-full ${accessibility.highContrast ? 'bg-white' : 'bg-yellow-400'}`}></span>
                  <span className={`w-1 animate-[bounce_0.6s_infinite_300ms] h-1/2 ${accessibility.highContrast ? 'bg-white' : 'bg-yellow-400'}`}></span>
                  <span className={`w-1 animate-[bounce_0.6s_infinite_400ms] h-full ${accessibility.highContrast ? 'bg-white' : 'bg-yellow-400'}`}></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Game Area */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentNodeId}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
            className={`mb-12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:bg-yellow-900/20 rounded-xl p-4 transition-all ${accessibility.highContrast ? 'border-2 border-white' : ''}`}
            tabIndex={-1} 
            ref={textContainerRef}
            aria-live="polite"
            role="region"
            aria-label="Текуща ситуация"
          >
            <h2 className={`font-bold mb-6 ${accessibility.highContrast ? 'text-white' : 'text-white'} ${accessibility.fontSize === 'xlarge' ? 'text-5xl md:text-6xl' : accessibility.fontSize === 'large' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>
              {currentNodeId === 'intro_screen' ? (
                <Typewriter key={currentNodeId} text={currentNode.title} />
              ) : (
                currentNode.title
              )}
            </h2>
            <p className={`leading-relaxed mb-8 ${accessibility.fontSize === 'xlarge' ? 'text-3xl' : accessibility.fontSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
              {currentNodeId === 'intro_screen' ? (
                <Typewriter key={currentNodeId} text={typeof currentNode.text === 'function' ? currentNode.text(gameState) : currentNode.text} />
              ) : (
                typeof currentNode.text === 'function' ? currentNode.text(gameState) : currentNode.text
              )}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Search Bar */}
        {((currentNode.interactables && currentNode.interactables.filter(i => !i.condition || i.condition(gameState)).length > 0) || currentNode.choices.length > 0) && (
          <div className="mb-8" role="search">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`w-5 h-5 ${accessibility.highContrast ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Търсене на действия или обекти..."
                className={`block w-full pl-10 pr-24 py-3 rounded-xl border-2 focus:ring-4 focus:outline-none transition-all ${
                  accessibility.highContrast
                    ? 'bg-black border-white text-white placeholder-gray-400 focus:ring-white focus:border-white'
                    : 'bg-black/50 border-gray-600 text-white placeholder-gray-400 focus:ring-yellow-400 focus:border-yellow-400'
                } ${accessibility.fontSize === 'xlarge' ? 'text-xl' : accessibility.fontSize === 'large' ? 'text-lg' : 'text-base'}`}
                aria-label="Търсене на действия или обекти"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                {searchTerm && (
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchTerm('')}
                    className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                      accessibility.highContrast
                        ? 'text-white hover:bg-white hover:text-black focus:ring-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800 focus:ring-yellow-400'
                    }`}
                    aria-label="Изчисти търсенето"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={handleVoiceSearch}
                  className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                    isListening
                      ? 'text-red-500 bg-red-500/20 animate-pulse'
                      : accessibility.highContrast
                        ? 'text-white hover:bg-white hover:text-black focus:ring-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800 focus:ring-yellow-400'
                  }`}
                  aria-label="Гласово търсене"
                >
                  <Mic className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Interactables Area */}
        {currentNode.interactables && currentNode.interactables.filter(i => !i.condition || i.condition(gameState)).length > 0 && (
          <div className="mb-8" role="region" aria-label="Обекти за разглеждане">
            <h3 className={`font-bold mb-4 flex items-center ${accessibility.highContrast ? 'text-white' : 'text-blue-400'} ${accessibility.fontSize === 'xlarge' ? 'text-2xl' : accessibility.fontSize === 'large' ? 'text-xl' : 'text-lg'}`}>
              <Search className="w-5 h-5 mr-2" />
              Обекти за разглеждане:
            </h3>
            {availableInteractables.length === 0 && searchTerm ? (
              <p className={`italic ${accessibility.highContrast ? 'text-white' : 'text-gray-400'} ${accessibility.fontSize === 'xlarge' ? 'text-xl' : accessibility.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
                Няма намерени обекти за "{searchTerm}".
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {availableInteractables.map(item => {
                  return (
                    <motion.button whileTap={{ scale: 0.95 }}
                      key={item.id}
                      onClick={() => handleInteract(item)}
                    className={`flex items-center px-4 py-2 rounded-full transition-all focusable-item hover:scale-105 focus:scale-105 shadow-[0_0_8px_rgba(96,165,250,0.4)] animate-[pulse_3s_ease-in-out_infinite] hover:shadow-[0_0_20px_rgba(96,165,250,0.8)] focus:shadow-[0_0_20px_rgba(96,165,250,0.8)] ${
                      accessibility.highContrast 
                        ? 'bg-black border border-white text-white hover:bg-white hover:text-black focus:bg-white focus:text-black focus:outline-none focus:ring-4 focus:ring-white' 
                        : 'bg-blue-900/30 border border-blue-400/50 hover:bg-blue-400 hover:text-black focus:bg-blue-400 focus:text-black focus:outline-none focus:ring-4 focus:ring-blue-400'
                    } ${accessibility.fontSize === 'xlarge' ? 'text-xl' : accessibility.fontSize === 'large' ? 'text-lg' : 'text-base'}`}
                  >
                    {item.icon || <Search className="w-4 h-4 mr-2" />}
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* Examined Object Result */}
        {/* Examined Object Area */}
        <AnimatePresence>
          {examinedObject && (
            <motion.div 
              initial={{ opacity: 0, x: -20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`mb-8 p-6 border-l-4 rounded-r-sm focus-visible:outline-none focus-visible:ring-4 relative overflow-hidden ${accessibility.highContrast ? 'bg-black border-white focus-visible:ring-white' : 'bg-blue-900/20 border-blue-500 focus-visible:ring-blue-400'}`}
              role="alert"
              aria-live="assertive"
              ref={examinedRef}
              tabIndex={-1}
            >
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>
              <div className="relative z-10">
                <h4 className={`font-bold mb-2 flex items-center gap-2 ${accessibility.highContrast ? 'text-white' : 'text-blue-400'} ${accessibility.fontSize === 'xlarge' ? 'text-2xl' : accessibility.fontSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                  <Eye className="w-5 h-5 animate-pulse" />
                  Разглеждате: {examinedObject.label}
                </h4>
                <p className={`leading-relaxed ${accessibility.fontSize === 'xlarge' ? 'text-2xl' : accessibility.fontSize === 'large' ? 'text-xl' : 'text-lg'}`}>{examinedObject.description}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Choices Area */}
        <div 
          className="space-y-4" 
          role="group" 
          aria-label="Възможни действия"
        >
          {currentNodeId === 'start' && localStorage.getItem('poppy_playtime_save') && (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={loadGame}
              className={`w-full text-left flex items-center p-4 border-2 rounded-xl transition-all font-medium group relative overflow-hidden focusable-item choice-item hover:scale-[1.02] focus:scale-[1.02] shadow-[0_0_10px_rgba(74,222,128,0.2)] hover:shadow-[0_0_25px_rgba(74,222,128,0.6)] focus:shadow-[0_0_25px_rgba(74,222,128,0.6)] ${
                accessibility.highContrast 
                  ? 'border-white text-white hover:bg-white hover:text-black focus:bg-white focus:text-black focus:ring-4 focus:ring-white focus:ring-offset-2 focus:ring-offset-black' 
                  : 'border-green-400/50 hover:bg-green-400 hover:text-black focus:bg-green-400 focus:text-black focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black'
              } ${accessibility.fontSize === 'xlarge' ? 'text-2xl' : accessibility.fontSize === 'large' ? 'text-xl' : 'text-lg'}`}
            >
              <div className="flex items-center z-10 w-full">
                <span className="opacity-50 mr-3 text-sm font-mono border border-current rounded px-1.5 py-0.5 group-hover:border-black group-focus:border-black" aria-hidden="true">*</span>
                <Download className="w-5 h-5 mr-2" aria-hidden="true" />
                <span>Продължи предишната игра</span>
              </div>
              <div className="absolute right-4 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                <ArrowRight className="w-6 h-6" aria-hidden="true" />
              </div>
            </motion.button>
          )}
          {availableChoices.length === 0 && searchTerm && (
            <p className={`italic ${accessibility.highContrast ? 'text-white' : 'text-gray-400'} ${accessibility.fontSize === 'xlarge' ? 'text-xl' : accessibility.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
              Няма намерени действия за "{searchTerm}".
            </p>
          )}
          {availableChoices.map((choice, index) => (
            <motion.button whileTap={{ scale: 0.95 }}
              key={choice.id}
              onClick={() => handleChoice(choice)}
              className={`w-full text-left flex items-center p-4 border-2 rounded-xl transition-all font-medium group relative overflow-hidden focusable-item choice-item hover:scale-[1.02] focus:scale-[1.02] shadow-[0_0_10px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.6)] focus:shadow-[0_0_25px_rgba(250,204,21,0.6)] ${
                accessibility.highContrast 
                  ? 'border-white text-white hover:bg-white hover:text-black focus:bg-white focus:text-black focus:ring-4 focus:ring-white focus:ring-offset-2 focus:ring-offset-black' 
                  : 'border-yellow-400/50 hover:bg-yellow-400 hover:text-black focus:bg-yellow-400 focus:text-black focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black'
              } ${accessibility.fontSize === 'xlarge' ? 'text-2xl' : accessibility.fontSize === 'large' ? 'text-xl' : 'text-lg'}`}
            >
              <div className="flex items-center z-10 w-full">
                <span className="opacity-50 mr-3 text-sm font-mono border border-current rounded px-1.5 py-0.5 group-hover:border-black group-focus:border-black" aria-hidden="true">{index + 1}</span>
                {choice.icon}
                <span>{choice.text}</span>
              </div>
              <div className="absolute right-4 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                <ArrowRight className="w-6 h-6" aria-hidden="true" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Inventory Status (Screen Reader Only if empty, visible if has items) */}
        <AnimatePresence>
          {gameState.inventory.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`mt-12 p-4 border rounded-lg ${accessibility.highContrast ? 'bg-black border-white' : 'bg-blue-900/20 border-blue-400/30'}`} role="status" aria-live="polite">
              <div className="flex justify-between items-center mb-2">
                <h3 className={`font-bold ${accessibility.highContrast ? 'text-white' : 'text-blue-400'} ${accessibility.fontSize === 'xlarge' ? 'text-2xl' : accessibility.fontSize === 'large' ? 'text-xl' : 'text-lg'}`}>Вашият инвентар:</h3>
                {gameState.inventory.includes('treasure_map') && (
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowMapModal(true);
                      if (isAudioEnabled) {
                        playAudio(SOUNDS.paper, 0.4, accessibility);
                      }
                    }}
                    className={`flex items-center px-3 py-1 text-sm rounded-full transition-colors ${
                      accessibility.highContrast 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-black border border-yellow-500/50'
                    }`}
                  >
                    <Map className="w-4 h-4 mr-1" />
                    Отвори карта
                  </motion.button>
                )}
              </div>
              <ul className={`list-none ${accessibility.highContrast ? 'text-white' : 'text-blue-300'} ${accessibility.fontSize === 'xlarge' ? 'text-xl' : accessibility.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
                {gameState.inventory.map((item, index) => (
                  <li key={index} className="capitalize relative group mb-2 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
                    <button 
                      onClick={() => setSelectedInventoryItem(item)}
                      className="cursor-pointer border-b border-dashed border-blue-400/50 hover:border-blue-400 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                      aria-label={`Отвори опции за ${INVENTORY_NAMES[item] || item.replace('_', ' ')}`}
                    >
                      {INVENTORY_NAMES[item] || item.replace('_', ' ')}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inventory Item Modal */}
        {selectedInventoryItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md p-6 rounded-xl border ${accessibility.highContrast ? 'bg-black border-white' : 'bg-zinc-900 border-zinc-700'}`}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold uppercase tracking-wider text-blue-400">
                  {INVENTORY_NAMES[selectedInventoryItem] || selectedInventoryItem.replace('_', ' ')}
                </h2>
                <motion.button whileTap={{ scale: 0.95 }} 
                  onClick={() => setSelectedInventoryItem(null)} 
                  className={`p-2 rounded-lg ${accessibility.highContrast ? 'hover:bg-white/20' : 'hover:bg-white/10'}`}
                  aria-label="Затвори"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
              
              <p className={`mb-6 ${accessibility.highContrast ? 'text-white' : 'text-zinc-300'} ${accessibility.fontSize === 'xlarge' ? 'text-xl' : accessibility.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
                {INVENTORY_DESCRIPTIONS[selectedInventoryItem] || 'Предмет, който може да ви бъде полезен.'}
              </p>

              <div className="space-y-3">
                {getInventoryItemActions(selectedInventoryItem).length > 0 ? (
                  getInventoryItemActions(selectedInventoryItem).map((action, idx) => (
                    <motion.button whileTap={{ scale: 0.95 }}
                      key={idx}
                      onClick={() => {
                        action.onExecute();
                        setSelectedInventoryItem(null);
                      }}
                      className={`w-full py-3 px-4 flex items-center justify-center gap-2 font-bold rounded-lg transition-colors ${
                        accessibility.highContrast 
                          ? 'bg-white text-black hover:bg-gray-200' 
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      } ${accessibility.fontSize === 'xlarge' ? 'text-xl' : accessibility.fontSize === 'large' ? 'text-lg' : 'text-base'}`}
                    >
                      {action.icon}
                      {action.label}
                    </motion.button>
                  ))
                ) : (
                  <p className="text-sm italic opacity-60 text-center">
                    Този предмет се използва автоматично, когато е необходимо, или в момента няма приложение.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collectibles Status */}
        {gameState.secretNotes.length > 0 && (
          <div className={`mt-8 p-4 border rounded-lg ${accessibility.highContrast ? 'bg-black border-white' : 'bg-indigo-900/20 border-indigo-500/30'}`} role="status" aria-live="polite">
            <h3 className={`font-bold mb-2 flex items-center ${accessibility.highContrast ? 'text-white' : 'text-indigo-400'} ${accessibility.fontSize === 'xlarge' ? 'text-2xl' : accessibility.fontSize === 'large' ? 'text-xl' : 'text-lg'}`}>
              <Search className="w-5 h-5 mr-2" />
              Тайни бележки ({gameState.secretNotes.length}/2):
            </h3>
            <ul className={`list-disc list-inside ${accessibility.highContrast ? 'text-white' : 'text-indigo-300'} ${accessibility.fontSize === 'xlarge' ? 'text-xl' : accessibility.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
              {gameState.secretNotes.map((item, index) => (
                <li key={index} className="capitalize">
                  {item === 'secret_note_1' ? 'Бележка от Килера за поддръжка' : 
                   item === 'secret_note_2' ? 'Бележка от Стаята за наблюдение' : item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {gameState.collectibles.length > 0 && (
          <div className={`mt-8 p-4 border rounded-lg ${accessibility.highContrast ? 'bg-black border-white' : 'bg-yellow-900/20 border-yellow-500/30'}`} role="status" aria-live="polite">
            <h3 className={`font-bold mb-2 flex items-center ${accessibility.highContrast ? 'text-white' : 'text-yellow-500'} ${accessibility.fontSize === 'xlarge' ? 'text-2xl' : accessibility.fontSize === 'large' ? 'text-xl' : 'text-lg'}`}>
              <Zap className="w-5 h-5 mr-2" />
              Колекционерски предмети ({gameState.collectibles.length}/5):
            </h3>
            <ul className={`list-disc list-inside ${accessibility.highContrast ? 'text-white' : 'text-yellow-300'} ${accessibility.fontSize === 'xlarge' ? 'text-xl' : accessibility.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
              {gameState.collectibles.map((item, index) => (
                <li key={index} className="capitalize">
                  {item === 'vintage_poster' ? 'Винтидж Плакат' : 
                   item === 'golden_gear' ? 'Златно зъбно колело' : 
                   item === 'employee_badge' ? 'Значка на Служител на Месеца' : 
                   item === 'secret_tape' ? 'Тайна касета' : 
                   item === 'bron_prototype' ? 'Прототип на Брон' : item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Objectives Status */}
        {gameState.objectives.length > 0 && (
          <div className={`mt-8 p-4 border rounded-lg ${accessibility.highContrast ? 'bg-black border-white' : 'bg-green-900/20 border-green-400/30'}`} role="region" aria-label="Текущи задачи">
            <h3 className={`font-bold mb-2 flex items-center ${accessibility.highContrast ? 'text-white' : 'text-green-400'} ${accessibility.fontSize === 'xlarge' ? 'text-2xl' : accessibility.fontSize === 'large' ? 'text-xl' : 'text-lg'}`}>
              <Target className="w-5 h-5 mr-2" />
              Текущи задачи:
            </h3>
            <ul className={`list-disc list-inside space-y-1 ${accessibility.highContrast ? 'text-white' : 'text-green-300'} ${accessibility.fontSize === 'xlarge' ? 'text-xl' : accessibility.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
              {gameState.objectives.map((obj, index) => (
                <li key={index}>{OBJECTIVES[obj]}</li>
              ))}
            </ul>
          </div>
        )}

        {/* History Area for Context */}
        {history.length > 0 && (
          <div className="mt-24 pt-8 border-t border-yellow-400/20 opacity-60">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">История на събитията</h3>
            <div className="space-y-6">
              {history.map((item, index) => (
                <div key={index}>
                  <h4 className="font-bold text-white/70">{item.title}</h4>
                  <p className="text-sm mt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {voiceLine && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[90%] pointer-events-none"
          >
            <div className={`p-4 rounded-xl backdrop-blur-md border-2 shadow-2xl text-center ${
              voiceLine.character === 'employee' ? 'bg-blue-900/80 border-blue-500 text-blue-50' :
              voiceLine.character === 'investigator' ? 'bg-purple-900/80 border-purple-500 text-purple-50' :
              'bg-emerald-900/80 border-emerald-500 text-emerald-50'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {voiceLine.character === 'employee' ? 'Бивш служител' :
                   voiceLine.character === 'investigator' ? 'Частен следовател' :
                   'Градски изследовател'}
                </span>
              </div>
              <p className="text-lg font-medium italic">"{voiceLine.text}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {achievementToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-4 rounded-sm border-b-4 shadow-[0_0_30px_rgba(250,204,21,0.4)] flex items-center gap-4 z-50 overflow-hidden backdrop-blur-sm ${accessibility.highContrast ? 'bg-black text-white border-white shadow-none' : 'bg-black/90 text-yellow-400 border-yellow-500'}`} 
            role="alert" 
            aria-live="assertive"
          >
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30"></div>
            <div className="relative z-10">
              {achievementToast.icon}
              <span className="absolute inset-0 animate-ping opacity-50">{achievementToast.icon}</span>
            </div>
            <div className="flex flex-col z-10">
              <span className="text-[10px] font-mono tracking-[0.2em] opacity-70 uppercase">Постижение Отключено</span>
              <span className="font-bold text-lg">{achievementToast.title}</span>
              <span className="text-sm opacity-80">{achievementToast.description}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 px-6 py-4 rounded-sm border-l-4 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center gap-4 z-50 overflow-hidden backdrop-blur-sm ${accessibility.highContrast ? 'bg-black text-white border-white shadow-none' : 'bg-black/90 text-green-400 border-green-500'}`} 
            role="alert" 
            aria-live="assertive"
          >
            {/* Glitch scanline effect overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30"></div>
            
            <div className="relative z-10">
              <CheckCircle2 className="w-6 h-6" />
              <span className="absolute inset-0 animate-ping opacity-50"><CheckCircle2 className="w-6 h-6" /></span>
            </div>
            
            <div className="flex flex-col z-10">
              <span className="text-[10px] font-mono tracking-[0.2em] opacity-70 uppercase">Системно съобщение</span>
              <span className="font-bold font-mono tracking-wide">{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
