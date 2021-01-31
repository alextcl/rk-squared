/**
 * @file
 *
 * Utility functions for MrP code.  Most of this is text-processing logic that
 * could perhaps be part of a general text utility module, but it's written for
 * and optimized for parsing Enlir and outputting MrP.
 */

import * as _ from 'lodash';

import { andJoin } from '../../utils/textUtils';
import { arrayify, getAllSameValue, getSign, isAllSame } from '../../utils/typeUtils';
import * as common from './commonTypes';
import { allElementsShortName } from './typeHelpers';

export { andJoin };

export const andList = /,? and |, /;
export const orList = /,? or |, /;
export const andOrList = /,? and |,? or |, /;

const numbers: { [s: string]: number } = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const tuple: Array<string | undefined> = [
  undefined,
  undefined,
  'dual',
  'triple',
  'quad',
  'penta',
  'hex',
  'sext',
];

export const tupleVerb = (count: number, verb: string) => (tuple[count] || `${count}-`) + verb;

export function isNumeric(s: string): boolean {
  return !isNaN(Number(s));
}

export function lowerCaseFirst(s: string): string {
  return s.replace(/^([A-Z])/, c => c.toLowerCase());
}

export const numberOrUnknown = (n: number) => (isNaN(n) ? '?' : n.toString());
export const absNumberOrUnknown = (n: number) => (isNaN(n) ? '?' : Math.abs(n).toString());
export const fixedNumberOrUnknown = (n: number, fractionDigits: number) =>
  isNaN(n) ? '?' : n.toFixed(fractionDigits);

/**
 * Formats one of the SlashLists from our Enlir grammar.  Following MrP, we use
 * hyphens to separate these.  (We also use hyphens to separate options for
 * attack damage, because attack damage values contain slashes themselves, so
 * using hyphens for conditions and supporting values has the advantage of
 * matching.)
 */
export function formatNumberSlashList(
  n: number | number[],
  converter: (n: number) => string = numberOrUnknown,
): string {
  return typeof n === 'number' ? converter(n) : n.map(converter).join('-');
}

export function formatSignedIntegerSlashList(n: number | number[]): string {
  n = arrayify(n);
  // Explicitly join with slashes - using hyphens to join negative numbers
  // looks weird.
  return (n[0] < 0 ? '-' : '+') + n.map(i => (isNaN(i) ? '?' : Math.abs(i))).join('/');
}

/**
 * Newer alternative to formatNumberSlashList. TODO - Clean up
 * @param n
 * @param converter
 * @param joinString
 */
export function numberSlashList(
  n: number | number[],
  converter: (n: number) => string = numberOrUnknown,
  joinString = '/',
) {
  const values = arrayify(n).map(converter);

  if (values.length >= 8) {
    // Hack: Abbreviate particularly long lists.
    return (
      values[0] + joinString + values[1] + joinString + '…' + joinString + values[values.length - 1]
    );
  } else {
    return values.join(joinString);
  }
}

export function signedNumberSlashList(n: number | number[], joinString = '/') {
  const sign = getAllSameValue(arrayify(n).filter(i => i !== 0 && !isNaN(i)), getSign);
  if (sign == null) {
    return numberSlashList(n, signedNumber, joinString);
  } else {
    return (sign === -1 ? '-' : '+') + numberSlashList(n, absNumberOrUnknown, joinString);
  }
}

export function stringSlashList(s: string | string[], joinString = '/') {
  return arrayify(s).join(joinString);
}

/**
 * As formatNumberSlashList, but include spaces when joining, to directly match
 * how we handle attack damage values.
 */
export function hyphenJoin(numberList: number | number[]): string {
  return arrayify(numberList)
    .map(n => (isNaN(n) ? '?' : n.toString()))
    .join(' - ');
}

/**
 * Parses a numeric string like "one" or "twenty-two"
 */
export function parseNumberString(s: string): number | null {
  if (!s) {
    return null;
  }
  if (isNumeric(s)) {
    return +s;
  }
  let result = 0;
  for (const i of s.toLowerCase().split('-')) {
    if (numbers[i] == null) {
      return null;
    }
    result += numbers[i];
  }
  return result;
}

export function parseThresholdValues(s: string): number[] {
  return s.split('/').map(parseFloat);
}

export function toMrPFixed(n: number): string {
  if (isNaN(n)) {
    return '?';
  }
  let result = n.toFixed(2);
  if (result.endsWith('0')) {
    result = result.substr(0, result.length - 1);
  }
  return result;
}

/**
 * Formats as kilo (k), following MrP's example
 *
 * @param n          Numeric value
 * @param favorSmall Allow small values to show as ones instead of fractional
 *                   values.  Very subjective - it happens to work the way we
 *                   use it.
 */
export function toMrPKilo(n: number | string, favorSmall = false): string {
  if (n === '?') {
    return '?';
  }
  let suffix = '';
  if (typeof n === 'string') {
    if (n.length > 1 && n.endsWith('?')) {
      suffix = '?';
    }
    n = parseFloat(n);
  }

  if ((n === 0 || favorSmall) && n < 1000) {
    return n + suffix;
  } else {
    // Damage thresholds like 100001 can reasonably be rounded.
    if (n % 1000 === 1) {
      n--;
    }

    return +n / 1000 + 'k' + suffix;
  }
}

export function signedNumber(x: number): string {
  if (isNaN(x)) {
    return '+?';
  }
  return (x >= 0 ? '+' : '') + x;
}

export function joinOr<T>(items: T[]): string {
  if (items.length === 1) {
    return '' + items[0];
  } else {
    return items.slice(0, -1).join(', ') + ' or ' + items[items.length - 1];
  }
}

export const enDashJoin = ' – ';

interface SlashMergeOptions {
  join?: string;
}

interface InternalSlashMergeOptions extends SlashMergeOptions {
  splitAtPlus: boolean;
}

function rawSlashMerge(options: string[], opt: InternalSlashMergeOptions) {
  // We normally break at plus signs, so, e.g., f+n / wa+n / wi+n / e+n can
  // become f/wa/wi/e+n.  But there are times when it works out better to
  // instead treat plus-separated terms as units.
  const splitAt = opt.splitAtPlus ? /([,? +=])/ : /([,? ])/;

  const optionParts = options.map(i => i.split(splitAt));
  const maxLength = _.max(optionParts.map(i => i.length))!;
  const minLength = _.min(optionParts.map(i => i.length))!;

  const join = (parts: string[]) => {
    let joinString: string;
    if (opt.join) {
      joinString = opt.join;
    } else {
      // Merge with slashes if the parts don't have slashes themselves.  Merge
      // with en dashes otherwise.
      joinString = _.some(parts, s => s.match('/')) ? enDashJoin : '/';
    }
    if (parts.length >= 8) {
      // Hack: Abbreviate particularly long lists.
      if (parts.join('/') === allElementsShortName) {
        return 'element';
      } else {
        return (
          parts[0] + joinString + parts[1] + joinString + '…' + joinString + parts[parts.length - 1]
        );
      }
    } else {
      return parts.join(joinString);
    }
  };

  let result = '';
  let same = 0;
  let sameChars = 0;
  let different = 0;
  let differentChars = 0;
  for (let i = 0; i < minLength; i++) {
    if (isAllSame(optionParts, parts => parts[i])) {
      result += optionParts[0][i];
      same++;
      sameChars += optionParts[0][i].length;
    } else {
      const mergeParts = optionParts.filter(parts => parts[i] !== undefined).map(parts => parts[i]);
      result += join(mergeParts);
      different++;
      differentChars += _.max(mergeParts.map(p => p.length)) || 0;
    }
  }

  // Try taking left-over parts and appending them to the end.
  if (maxLength !== minLength) {
    let extraParts = optionParts.map(i => i.slice(minLength));

    // Special case: Extra parts start with ", ".
    if (_.every(extraParts, i => i.length === 0 || (i[0] === ',' && i[1] === '' && i[2] === ' '))) {
      result += ', ';
      extraParts = extraParts.map(i => i.slice(3));
    } else {
      result += ' ';
    }

    result += join(extraParts.map(i => (i.length ? i.join('') : '0̸')));
    different += maxLength - minLength;
  }

  return { result, same, sameChars, different, differentChars };
}

export function slashMergeWithDetails(options: string[], opt: SlashMergeOptions = {}) {
  const standardPlus = rawSlashMerge(options, { ...opt, splitAtPlus: true });
  const standardNoPlus = rawSlashMerge(options, { ...opt, splitAtPlus: false });
  const useNoPlus = standardNoPlus.different < standardPlus.different;
  const standard = useNoPlus ? standardNoPlus : standardPlus;

  // Try it again, without splitting up stat mods.
  const optionsWithCombinedStats = options.map(i => i.replace(/(\d+%) ([A-Z]{3})/g, '$1\u00A0$2'));
  const combinedStats = rawSlashMerge(optionsWithCombinedStats, { ...opt, splitAtPlus: true });

  // If combining pieces of stat mods lets us combine more parts, then we'll
  // allow that.
  const useCombinedStats = combinedStats.different < standard.different;
  const picked = useCombinedStats ? combinedStats : standard;
  let result = picked.result;

  if (useCombinedStats) {
    result = result.replace(/\u00A0/gu, ' ');
  }

  // Check if values are too different to practically combine.  If they are,
  // fall back to separating the whole list with en dashes.  (Should we instead
  // use slashes here?  Unfortunately, MrP isn't completely consistent - a lot
  // depends on whether the clauses we're separating use slashes or hyphens
  // internally.)
  //
  // Add a character-count fudge factor to address issues like Squall SASB.
  const mergeFailed =
    picked.same < picked.different ||
    (picked.sameChars * 1.5 < picked.differentChars && picked.differentChars > 20);
  if (mergeFailed) {
    result = options.join(enDashJoin);
  }

  return { result, same: picked.same, different: picked.different, mergeFailed };
}

export function slashMerge(options: string[], opt: SlashMergeOptions = {}): string {
  return slashMergeWithDetails(options, opt).result;
}

export function isSequential(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) {
      return false;
    }
  }
  return true;
}

export function formatUseNumber(count: number | undefined): string {
  if (!count) {
    return 'w/ uses';
  } else if (count > 4) {
    return 'w/ 1…' + count + ' uses';
  } else {
    return 'w/ ' + formatNumberSlashList(_.times(count)) + ' uses';
  }
}

export function formatUseCount(count: common.UseCount): string {
  if ('x' in count) {
    return arrayify(count.x).join('/') + ` +${count.y}n`;
  } else if (!('from' in count)) {
    return `≤${count.to}`;
  } else if (!('to' in count)) {
    return `≥${count.from}`;
  } else if (count.from === count.to) {
    return '' + count.from;
  } else {
    return `${count.from}-${count.to}`;
  }
}

export function countMatches(haystack: string, needle: RegExp): number {
  return (haystack.match(needle) || []).length;
}

export function describeChances(
  options: string[],
  percentChances: number[],
  join = '-',
): [string | undefined, string] {
  const allSamePercentage = _.every(percentChances, i => i === percentChances[0]);
  if (allSamePercentage) {
    return [undefined, options.join(' or ')];
  } else {
    // There are a couple of ways we could do this.  E.g., Fujin USB could be
    // "40-60% m7.8/5-15.6/10" or "40% m7.8/5 or 60% 15.6/10".  However, it's
    // probably not worth further development right now.
    return [percentChances.join('-') + '%', options.join(join)];
  }
}

export function percentToMultiplier(percent: number | string): string {
  let suffix = '';
  if (typeof percent === 'string') {
    if (percent.length > 1 && percent.endsWith('?')) {
      suffix = '?';
    }
    percent = parseFloat(percent);
  }
  return toMrPFixed(1 + percent / 100) + suffix;
}

export function handleUncertain<T>(f: (value: string) => T) {
  return (value: string) => {
    return {
      ...f(value.replace(/\?$/, '')),
      isUncertain: value.endsWith('?'),
    };
  };
}

export function handleOrOptions<T>(options: common.OrOptions<T>, f: (item: T) => string): string {
  if (Array.isArray(options)) {
    return options.map(f).join('+');
  } else if (typeof options === 'object' && 'options' in options) {
    return slashMerge(options.options.map(f));
  } else {
    return f(options);
  }
}
