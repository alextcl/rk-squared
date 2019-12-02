import * as _ from 'lodash';

import { logger } from '../../utils/logger';
import * as types from './types';
import { parseNumberString } from './util';

export { parseNumberString };

export function pegList(head: any, tail: any, index: number, forceSingle: boolean = false): any[] {
  if (forceSingle && !tail.length) {
    return head;
  }
  return tail.reduce(
    (result: any, element: any) => {
      result.push(element[index]);
      return result;
    },
    [head],
  );
}

export function pegSlashList(head: any, tail: any): any[] {
  return pegList(head, tail, 1, true);
}

export function addCondition<T>(
  value: T,
  maybeCondition: any[] | types.Condition | null | undefined,
  conditionProp: string = 'condition',
) {
  if (Array.isArray(maybeCondition)) {
    // maybeCondition is assumed to be whitespace plus Condition
    return {
      ...value,
      [conditionProp]: maybeCondition[1] as types.Condition,
    };
  } else if (maybeCondition) {
    return {
      ...value,
      [conditionProp]: maybeCondition as types.Condition,
    };
  } else {
    return value;
  }
}

export function mergeHitRates(effects: Array<types.EffectClause | types.StandaloneHitRate>) {
  const result: types.EffectClause[] = [];
  let lastAttack: types.Attack | undefined;
  let lastAttackIndex: number | undefined;
  for (const i of effects) {
    if (i.type !== 'hitRate') {
      if (i.type === 'attack') {
        lastAttack = i;
        lastAttackIndex = result.length;
      }
      result.push(i);
    } else {
      if (lastAttack == null || lastAttackIndex == null) {
        logger.error(`Error checking effects for hit rate: Hit rate but no attack`);
      } else {
        let attack = _.cloneDeep(lastAttack);
        result[lastAttackIndex] = attack;

        // When displayed to the end user, the "followed by" attack's clauses
        // can look like they apply to the whole attack, so we'll put the
        // hit rate there.
        while (attack.followedBy) {
          attack = attack.followedBy;
        }

        if (attack.hitRate) {
          logger.error(`Error checking effects for hit rate: Duplicate hit rates`);
        }
        attack.hitRate = i.hitRate;
      }
    }
  }
  return result;
}
