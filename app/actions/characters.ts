import { createAction } from 'typesafe-actions';

export interface Character {
  name: string;
  id: number;
  uniqueId: number;
  level: number;
  levelCap: number;
}

export enum InventoryType {
  INVENTORY,
  VAULT,
}

export interface ExpMap {
  [id: number]: number;
}

export const setCharacters = createAction(
  'SET_CHARACTERS',
  (characters: { [id: number]: Character }) => ({
    type: 'SET_CHARACTERS',
    payload: {
      characters,
    },
  }),
);

export const setCharacter = createAction('SET_CHARACTER', (character: Character) => ({
  type: 'SET_CHARACTER',
  payload: character,
}));

export const updateCharacter = createAction(
  'UPDATE_CHARACTER',
  (id: number, character: Partial<Character>) => ({
    type: 'UPDATE_CHARACTER',
    payload: {
      id,
      character,
    },
  }),
);

export const setSoulBreaks = createAction(
  'SET_SOUL_BREAKS',
  (soulBreakIds: number[], inventoryType = InventoryType.INVENTORY) => ({
    type: 'SET_SOUL_BREAKS',
    payload: {
      soulBreakIds,
      inventoryType,
    },
  }),
);

export const setLegendMateria = createAction(
  'SET_LEGEND_MATERIA',
  (legendMateriaIds: number[], inventoryType = InventoryType.INVENTORY) => ({
    type: 'SET_LEGEND_MATERIA',
    payload: {
      legendMateriaIds,
      inventoryType,
    },
  }),
);

/**
 * Sets a new soul break experience map, replacing whatever's there.
 */
export const setSoulBreakExp = createAction('SET_SOUL_BREAK_EXP', (exp: ExpMap) => ({
  type: 'SET_SOUL_BREAK_EXP',
  payload: exp,
}));

/**
 * Sets a new legend materia experience map, replacing whatever's there.
 */
export const setLegendMateriaExp = createAction('SET_LEGEND_MATERIA_EXP', (exp: ExpMap) => ({
  type: 'SET_LEGEND_MATERIA_EXP',
  payload: exp,
}));

/**
 * Updates the soul break experience map, adding to or updating existing content.
 */
export const updateSoulBreakExp = createAction('UPDATE_SOUL_BREAK_EXP', (exp: ExpMap) => ({
  type: 'UPDATE_SOUL_BREAK_EXP',
  payload: exp,
}));

/**
 * Updates the legend materia experience map, adding to or updating existing content.
 */
export const updateLegendMateriaExp = createAction('UPDATE_LEGEND_MATERIA_EXP', (exp: ExpMap) => ({
  type: 'UPDATE_LEGEND_MATERIA_EXP',
  payload: exp,
}));

export type CharacterAction = ReturnType<
  | typeof setCharacter
  | typeof setCharacters
  | typeof updateCharacter
  | typeof setSoulBreaks
  | typeof setLegendMateria
  | typeof setSoulBreakExp
  | typeof setLegendMateriaExp
  | typeof updateSoulBreakExp
  | typeof updateLegendMateriaExp
>;
