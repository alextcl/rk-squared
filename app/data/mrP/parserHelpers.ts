import * as _ from 'lodash';

import { logger } from '../../utils/logger';
import { arrayify } from '../../utils/typeUtils';
import * as common from './commonTypes';
import * as skillTypes from './skillTypes';
import { parseNumberString } from './util';

const isEqual = _.isEqual;
export { arrayify, parseNumberString, isEqual };

export function lastValue(value: number | number[]): number {
  value = arrayify(value);
  return value[value.length - 1];
}

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
  maybeCondition: any[] | common.Condition | null | undefined,
  conditionProp: string = 'condition',
) {
  if (Array.isArray(maybeCondition)) {
    // maybeCondition is assumed to be whitespace plus Condition
    return {
      ...value,
      [conditionProp]: maybeCondition[1] as common.Condition,
    };
  } else if (maybeCondition) {
    return {
      ...value,
      [conditionProp]: maybeCondition as common.Condition,
    };
  } else {
    return value;
  }
}

export function mergeAttackExtras(
  effects: Array<skillTypes.EffectClause | skillTypes.StandaloneAttackExtra>,
) {
  const result: skillTypes.EffectClause[] = [];
  let lastAttack: skillTypes.Attack | undefined;
  let lastAttackIndex: number | undefined;
  for (const i of effects) {
    if (i.type !== 'attackExtra') {
      if (i.type === 'attack') {
        lastAttack = i;
        lastAttackIndex = result.length;
      }
      result.push(i);
    } else {
      if (lastAttack == null || lastAttackIndex == null) {
        logger.error(`Error checking effects for attack extras: Attack extras but no attack`);
      } else {
        lastAttack = _.cloneDeep(lastAttack);
        result[lastAttackIndex] = lastAttack;

        // When displayed to the end user, the "followed by" attack's clauses
        // can look like they apply to the whole attack, so we'll put the
        // hit rate there.
        let attack = lastAttack;
        while (attack.followedBy) {
          attack = attack.followedBy;
        }

        Object.assign(attack, i.extra);
      }
    }
  }
  return result;
}
