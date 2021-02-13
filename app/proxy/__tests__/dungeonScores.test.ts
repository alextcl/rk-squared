import configureStore from 'redux-mock-store';

import * as _ from 'lodash';

import { DungeonScoreType } from '../../actions/dungeonScores';
import { WorldCategory } from '../../actions/worlds';
import * as dungeonsSchemas from '../../api/schemas/dungeons';
import { IState } from '../../reducers';
import { default as dungeonScoresHandler, getElementsClaimed } from '../dungeonScores';

const neoTormentT280Battles = require('./data/neo_torment_t_280_world_battles.json');
const neoTormentTUnkBattles = require('./data/neo_torment_t_unk_world_battles.json');
const magiciteWorldBattles = require('./data/magicite_world_battles.json');
const magiciteWinBattle = require('./data/magicite_win_battle.json');
const darkOdinDungeons = require('./data/dark_odin_dungeons.json');
const argentOdinBattles = require('./data/argent_odin_world_battles.json');

describe('dungeonScores proxy handler', () => {
  const mockStore = configureStore<IState>();

  describe('battles', () => {
    it('handles magicite', () => {
      const store = mockStore();

      dungeonScoresHandler.battles(magiciteWorldBattles.data, store, {});

      expect(store.getActions()).toEqual([
        {
          payload: {
            dungeonId: 10082101,
            score: {
              time: 19607,
              type: DungeonScoreType.ClearTime,
              won: true,
            },
          },
          type: 'SET_DUNGEON_SCORE',
        },
      ]);
    });

    it('handles mastered Neo Torments', () => {
      const store = mockStore();

      dungeonScoresHandler.battles(neoTormentT280Battles.data, store, {});

      expect(store.getActions()).toEqual([
        {
          payload: {
            dungeonId: 15048602,
            score: {
              maxHp: 1000000,
              time: 22683,
              totalDamage: 1000000,
              type: DungeonScoreType.PercentHpOrClearTime,
              won: true,
            },
          },
          type: 'SET_DUNGEON_SCORE',
        },
      ]);
    });

    it('handles percent completed Neo Torments', () => {
      const store = mockStore();

      dungeonScoresHandler.battles(neoTormentTUnkBattles.data, store, {});

      expect(store.getActions()).toEqual([
        {
          payload: {
            dungeonId: 15048603,
            score: {
              maxHp: 2000000,
              time: 35355,
              totalDamage: 1432340,
              type: DungeonScoreType.PercentHpOrClearTime,
              won: false,
            },
          },
          type: 'SET_DUNGEON_SCORE',
        },
      ]);
    });

    it('handles Argent Odin', () => {
      const store = mockStore();

      dungeonScoresHandler.battles(argentOdinBattles.data, store, {});

      expect(store.getActions()).toEqual([
        {
          payload: {
            dungeonId: 1305205,
            score: {
              percentHp: 100,
              time: 45710,
              type: DungeonScoreType.PercentHpOrClearTime,
              won: true,
            },
          },
          type: 'SET_DUNGEON_SCORE',
        },
      ]);
    });
  });

  describe('win_battle', () => {
    it('updates score on winning a magicite battle', () => {
      const dungeonId = +magiciteWinBattle.data.result.dungeon_id;
      // Magicite dungeon IDs happen to correspond to world ID + a 2 digit number.
      const worldId = Math.floor(dungeonId / 100);

      // HACK: Declare enough state for the test to pass, even if it's not all valid...
      const initialState = {
        dungeons: {
          byWorld: {
            [worldId]: [dungeonId],
          },
        },
        dungeonScores: {
          scores: {},
        },
        worlds: {
          worlds: {
            [worldId]: {
              category: WorldCategory.Magicite,
            },
          },
        },
      } as IState;

      const store = mockStore(initialState);

      dungeonScoresHandler.win_battle(magiciteWinBattle.data, store, {});

      expect(store.getActions()).toEqual([
        {
          type: 'UPDATE_DUNGEON_SCORE',
          payload: {
            dungeonId: 10082302,
            newScore: {
              time: 21033,
              type: 1,
              won: true,
            },
          },
        },
      ]);
    });
  });

  describe('dungeons', () => {
    it('handles Dark Odin with no wins', () => {
      const elements = getElementsClaimed(darkOdinDungeons.data.dungeons[0]);

      expect(elements.claimed).toEqual([]);
      expect(elements.unclaimed).toEqual([
        'Fire',
        'Ice',
        'Wind',
        'Earth',
        'Lightning',
        'Water',
        'Holy',
        'Dark',
      ]);
    });

    it('handles Dark Odin with two simulated wins', () => {
      const dungeon = _.cloneDeep(darkOdinDungeons.data.dungeons[0]) as dungeonsSchemas.Dungeon;
      _.forEach(
        dungeon.prizes[dungeonsSchemas.RewardType.ElementalEarth],
        i => (i.is_got_grade_bonus_prize = 1),
      );
      _.forEach(
        dungeon.prizes[dungeonsSchemas.RewardType.ElementalHoly],
        i => (i.is_got_grade_bonus_prize = 1),
      );

      const elements = getElementsClaimed(dungeon);

      expect(elements.claimed).toEqual(['Earth', 'Holy']);
      expect(elements.unclaimed).toEqual(['Fire', 'Ice', 'Wind', 'Lightning', 'Water', 'Dark']);
    });
  });
});
