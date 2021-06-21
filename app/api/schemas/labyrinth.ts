export enum DisplayPaintingId {
  GreenCombatant = 100001,
  OrangeCombatant = 100002,
  RedCombatant = 100003,
  Exploration = 400001,
  Onslaught = 500001,
  Portal = 600001,
}

// Sample URL: http://ffrk.denagames.com/dff/event/labyrinth/4500/get_display_paintings
export interface LabyrinthDisplayPaintings {
  success: boolean;

  labyrinth_dungeon_session: LabyrinthDungeonSession;
  labyrinth_items: LabyrinthItem[];
  unsettled_items: any[];
  current_labyrinth_point: number;

  SERVER_TIME: number;
}

interface LabyrinthDungeonSession {
  current_floor: number;
  labyrinth_point: number;
  party_info: {
    historia_crystal_ids: number[];
    user_equipment_ids: number[];
    user_ability_ids: number[];
    record_materia_ids: number[];
    user_beast_ids: number[];
    user_buddy_ids: number[];
  };
  current_painting_status: number;
  display_paintings: DisplayPainting[];
  addon_record_materia_id_map: { [key: string]: number };
  remaining_painting_num: number;
}

interface DisplayPainting {
  /** A DisplayPaintingId value */
  painting_id: number;
  name: string;
  /** Equals the first digit of painting_id */
  type: number;
  /** Sequential number of the painting on this floor */
  no: number;
  is_special_effect: boolean;
  description: string;
  display_type?: number;
  dungeon?: Dungeon;
}

interface Dungeon {
  unlock_conditions: {};
  closed_at: number;
  order_no: number;
  is_restricted: boolean;
  stamina_consume_type: number;
  supporter_type: number;
  epilogue_image_path: string;
  bgm: string;
  is_require_ranking: boolean;
  stamina_list: number[];
  ability_category_bonus_map: {};
  is_auto_lap: boolean;
  unlocked_series_ids: any[];
  id: number;
  world_id: number;
  button_style: string;
  total_stamina: number;
  name: string;
  ss_gauge_type: number;
  has_battle: boolean;
  type: number;
  epilogue: string;
  progress_map_level: number;
  platform_style: number;
  has_field: boolean;
  prologue: string;
  buddy_additional_status_bonus_level: number;
  challenge_level: number;
  prizes: { [key: string]: any[] };
  battle_ticket_id_2_num: {};
  battle_drop_items: any[];
  series_id: number;
  required_max_stamina: number;
  opened_at: number;
  continue_allowable_type: number;
  prologue_image_path: string;
  background_image_path: string;
  captures: Capture[];
}

interface Capture {
  enemy_id: string;
  sp_scores: any[];
  image_path: string;
  tip_battle: {
    group_id: number;
    html_content: string;
    id: number;
    title: string;
    wiki_guide_url: string;
    message: string;
  };
}

interface LabyrinthItem {
  num: number;
  labyrinth_item: {
    image_path: string;
    rarity: number;
    name: string;
    id: number;
    sale_gil: number;
    description: string;
  };
}

// Sample URL: http://ffrk.denagames.com/dff/event/labyrinth/4500/select_painting
export interface LabyrinthSelectPainting {
  success: boolean;

  labyrinth_dungeon_session: LabyrinthDungeonSession & {
    explore_painting_event: ExplorePaintingEvent;
  };
  current_labyrinth_point: number;

  SERVER_TIME: number;
}

export interface CurrentPainting {
  painting_id: number;
  name: string;
  type: number;
  description: string;
}

export interface ExplorePaintingEvent {
  sub_text_master_id_3: string;
  sub_text_master_id_1: string;
  id: number;
  type: number;
  sub_text_master_id_2: string;
  text_master_id: string;
}