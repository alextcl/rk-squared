import {
  EnlirAnyRealm,
  EnlirElement,
  EnlirSchool,
  EnlirSkillType,
  EnlirStat,
  EnlirStatusPlaceholders,
} from '../enlir';
import * as statusTypes from './statusTypes';

export type Placeholder = 'X';
export type SignedPlaceholder = 'X' | '-X';
export const placeholder: Placeholder = 'X';
export const negativePlaceholder: SignedPlaceholder = '-X';

export type ValueOrPlaceholder<T> = T | Placeholder;
export type SignedValueOrPlaceholder<T> = T | SignedPlaceholder;

// --------------------------------------------------------------------------
// Common effects

export interface DispelOrEsuna {
  type: 'dispelOrEsuna';
  dispelOrEsuna: 'negative' | 'positive';
  who?: Who;
  perUses?: number;
}

export interface HealPercent {
  type: 'healPercent';
  healPercent: number;
  who?: Who;
}

export interface DamagesUndead {
  type: 'damagesUndead';
}

// --------------------------------------------------------------------------
// Lower-level game rules

export type StatusVerb = 'grants' | 'causes' | 'removes' | "doesn't remove";

export interface StatusLevel {
  type: 'statusLevel';
  name: string;
  value: number | number[];
  max?: number;
  // If true, setting to value; if false, modifying by value.
  set?: boolean;
}

export interface SmartEtherStatus {
  type: 'smartEther';
  amount: number | number[];
  school?: EnlirSchool;
}

export interface StandardStatus {
  type: 'standardStatus';
  name: string;

  // Added by resolveStatuses
  id?: number;
  isUncertain?: boolean;
  placeholders?: EnlirStatusPlaceholders;
  effects?: statusTypes.StatusEffect | null;
  // Added by mergeSimilarStatuses
  /**
   * The number of statuses that have been merged to create this.  Minimum 2.
   */
  mergeCount?: number;
}

export type StatusItem = SmartEtherStatus | StatusLevel | StandardStatus;

export type Conjunction = 'and' | '/' | ',' | '[/]' | 'or';

export interface StatusWithPercent {
  status: StatusItem;
  chance?: number;
  duration?: Duration;
  conj?: Conjunction;
}

export interface Duration {
  value: number;
  valueIsUncertain?: number;
  units: DurationUnits;
}

export type DurationUnits = 'seconds' | 'turns';

export type Who =
  | 'self'
  | 'target'
  | 'enemies'
  | 'sameRow'
  | 'frontRow'
  | 'backRow'
  | 'party'
  | 'lowestHpAlly'
  | 'allyWithoutStatus'
  | 'allyWithNegativeStatus'
  | 'allyWithKO'
  | 'ally'
  // Used in application code (not in the parser directly) to indicate specific
  // toCharacter values.
  | 'namedCharacter';

export type WithoutWith = 'without' | 'with' | 'withoutWith';

export type Condition =
  | { type: 'equipped'; article?: string; equipped: string }
  | { type: 'scaleWithStatusLevel'; status: string }
  | { type: 'statusLevel'; status: string; value: number | number[]; plus?: boolean }
  | { type: 'ifDoomed' }
  | {
      type: 'status';
      status: string | string[];
      who: 'self' | 'target';
      any: boolean;
      withoutWith?: WithoutWith;
    }
  | {
      type: 'statusList';
      status: StatusWithPercent[];
      who: 'self' | 'target';
    }
  | { type: 'conditionalEnElement'; element: EnlirElement | EnlirElement[] }
  | { type: 'scaleUseCount'; useCount: number | number[] }
  | { type: 'scaleWithUses' }
  | { type: 'scaleWithSkillUses'; skill: string }
  | { type: 'afterUseCount'; skill?: string; useCount: UseCount }
  | { type: 'alliesAlive' }
  | {
      type: 'characterAlive';
      character: string | string[] | undefined; // undefined means a pronoun, hopefully with toCharacter
      count?: number | number[];
      all?: boolean;
      withoutWith?: WithoutWith;
    }
  | {
      type: 'characterInParty';
      character: string | string[];
      count?: number | number[];
      all?: boolean;
      withoutWith?: WithoutWith;
    }
  | { type: 'femalesInParty'; count: number | number[] }
  | { type: 'femalesAlive'; count: number | number[] }
  | { type: 'realmCharactersInParty'; realm: EnlirAnyRealm; count: number | number[] }
  | { type: 'realmCharactersAlive'; realm: EnlirAnyRealm; count: number | number[]; plus: boolean }
  | { type: 'charactersAlive'; count: number | number[] }
  | { type: 'alliesJump'; count: number | number[] }
  | { type: 'doomTimer'; value: number | number[] }
  | { type: 'hpBelowPercent'; value: number | number[] }
  | { type: 'hpAtLeastPercent'; value: number | number[] }
  | { type: 'soulBreakPoints'; value: number | number[] | SimpleRange; plus?: boolean }
  | { type: 'targetStatBreaks'; count: number | number[] }
  | { type: 'targetStatusAilments'; count: number | number[] }
  | { type: 'vsWeak'; element?: EnlirElement | EnlirElement[] }
  | { type: 'inFrontRow' }
  | { type: 'hitsTaken'; count: number | number[]; skillType: EnlirSkillType | EnlirSkillType[] }
  | { type: 'attacksTaken'; count: number | number[] }
  | { type: 'damagingActions'; count: number | number[] }
  | { type: 'otherAbilityUsers'; count: number | number[]; school: EnlirSchool }
  | { type: 'differentAbilityUses'; count: number | number[]; school: EnlirSchool }
  | {
      type: 'abilitiesUsedDuringStatus';
      count: number | number[];
      school: EnlirSchool | EnlirSchool[];
    }
  | { type: 'abilitiesUsed'; count: number | number[]; school: EnlirSchool | EnlirSchool[] }
  | {
      type: 'attacksDuringStatus';
      count: number | number[];
      element: EnlirElement | EnlirElement[];
    }
  | {
      type: 'damageDuringStatus';
      value: number | number[];
      element?: EnlirElement | EnlirElement[];
    }
  | { type: 'rankBased' }
  | { type: 'statThreshold'; stat: EnlirStat; value: number | number[] }
  | { type: 'battleStart' };

export type UseCount =
  | {
      x: number | number[];
      y: number;
    }
  | {
      from: number;
    }
  | {
      to: number;
    }
  | {
      from: number;
      to: number;
    };

export interface Fraction {
  numerator: number;
  denominator: number;
}

export interface SimpleRange {
  from: number;
  to: number;
}

export type OrOptions<T> = T | T[] | { options: T[] };

export function isOptions<T>(items: OrOptions<T>): items is { options: T[] } {
  return typeof items === 'object' && 'options' in items;
}
