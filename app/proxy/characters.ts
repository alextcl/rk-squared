/**
 * @file
 * Support for tracking characters
 */

import { Store } from 'redux';

import * as schemas from '../api/schemas';
import * as charactersSchemas from '../api/schemas/characters';
import { Handler, HandlerRequest } from './common';

import { IState } from '../reducers';

import { Character, setCharacter, setCharacters, updateCharacter } from '../actions/characters';

import * as _ from 'lodash';
import { logger } from '../utils/logger';

function convertCharacter(data: charactersSchemas.Buddy): Character {
  return {
    name: data.name,
    id: data.buddy_id,
    uniqueId: data.id,
    level: data.level,
    levelCap: data.level_max,
  };
}

export function convertCharacters(data: schemas.PartyList): { [id: number]: Character } {
  return _.keyBy(data.buddies.map(i => convertCharacter(i)), 'id');
}

function handleWinBattle(data: schemas.WinBattle, store: Store<IState>) {
  for (const buddy of data.result.buddy) {
    if (+buddy.exp.current_level !== +buddy.exp.previous_level) {
      store.dispatch(
        updateCharacter(+buddy.buddy_id, {
          level: +buddy.exp.current_level,
        }),
      );
    }
  }
}

const charactersHandler: Handler = {
  'party/list'(data: schemas.PartyList, store: Store<IState>, request: HandlerRequest) {
    if (schemas.isRecordDungeonPartyList(request.url)) {
      return;
    }
    store.dispatch(setCharacters(convertCharacters(data)));
  },

  win_battle: handleWinBattle,
  battle_win: handleWinBattle,
  'battle/win': handleWinBattle,

  'grow_egg/use'(
    data: charactersSchemas.GrowEggUse,
    store: Store<IState>,
    request: HandlerRequest,
  ) {
    if (typeof request.body !== 'object' || request.body.exec == null) {
      logger.warn(`Unknown POST request for grow_egg/use: ${request.body}`);
      return;
    }
    const post = request.body as charactersSchemas.GrowEggUsePost;

    if (!post.exec) {
      return;
    }

    store.dispatch(setCharacter(convertCharacter(data.buddy)));
  },

  'buddy/evolve'(
    data: charactersSchemas.BuddyEvolve,
    store: Store<IState>,
    request: HandlerRequest,
  ) {
    if (typeof request.body !== 'object' || request.body.exec == null) {
      logger.warn(`Unknown POST request for buddy/evolve: ${request.body}`);
      return;
    }
    const post = request.body as charactersSchemas.BuddyEvolvePost;

    if (!post.exec) {
      return;
    }

    store.dispatch(setCharacter(convertCharacter(data.buddy)));
  },
};

export default charactersHandler;
