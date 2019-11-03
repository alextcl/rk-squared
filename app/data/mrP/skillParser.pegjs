// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

{
  let parsedNumberString: number | null = null;

  // Hack: Suppress warnings about unused functions.
  location;
  expected;
  error;
  peg$anyExpectation;
}

SkillEffect
  = head:EffectClause tail:(',' _ EffectClause)* {
    return tail.reduce((result: any, element: any) => {
      result.push(element[2]);
      return result;
    }, [head]);
  }

EffectClause = Attack / DrainHp / RecoilHp / Heal / DamagesUndead / DispelOrEsuna / StatMod / StatusEffect


//---------------------------------------------------------------------------
// Attacks

Attack
  = numAttacks:NumAttacks _ attackType:AttackType modifiers:AttackModifiers _ "attack" "s"?
    _
    "("
      attackMultiplier:DecimalNumberSlashList
      hybridDamageMultiplier:(_ "or" _ n:DecimalNumber { return n; })?
      _ "each"?
    ")"
    _ overstrike:("capped" _ "at" _ "99999")?
    _ scaleType:AttackScaleType?
    extras:AttackExtras {
    const result = {
      type: 'attack',
      numAttacks,
      attackMultiplier,
      ...extras
    };
    if (hybridDamageMultiplier) {
      result.hybridDamageMultiplier = hybridDamageMultiplier;
    }
    if (overstrike) {
      result.isOverstrike = true;
    }
    if (scaleType) {
      result.scaleType = scaleType;
    }
    if (attackType === 'group') {
      result.isAoE = true;
    }
    if (attackType === 'ranged') {
      result.isRanged = true;
    }
    if (modifiers.jump) {
      result.isJump = true;
    }
    if (modifiers.ranged) {
      result.isRanged = true;
    }
    return result;
  }

NumAttacks
  = NumberString / IntegerSlashList

AttackType
  = "group" / "random" / "single"

AttackModifiers
  = modifiers:(_ ("hybrid" / "rang." / "ranged" / "jump"))* {
    return {
      hybrid: modifiers.indexOf('hybrid') !== -1,
      ranged: modifiers.indexOf('ranged') !== -1 || modifiers.indexOf('rang.') !== -1,
      jump: modifiers.indexOf('hybrid') !== -1,
    };
  }


AttackScaleType
  = "at" _ status:StatusName { return { type: 'status', status, who: 'self' }; }


AttackExtras
  = extras:("," _ (AdditionalCrit / AirTime / FollowedByAttack / MinDamage / NoMiss / OrMultiplier / Piercing))* {
    return extras.reduce((result: any, element: any) => Object.assign(result, element[2]), {});
  }

AdditionalCrit
  = additionalCrit:Integer '%' _ ('additional' / 'add.') _ 'critical' _ 'chance' condition:(_ Condition)? {
    return util.addCondition({ additionalCrit }, condition);
  }

AirTime
  = "air" _ "time" _ "(" airTime:DecimalNumber _ "sec.)" { return { airTime }; }

FollowedByAttack
  = "followed" _ "by" _ followedBy:Attack { return { followedBy }; }

MinDamage
  = "minimum" _ "damage" _ minDamage:Integer { return { minDamage }; }

NoMiss
  = "100%" _ "hit" _ "rate" { return { isNoMiss: true }; }

OrMultiplier
  = orMultiplier:DecimalNumber _ ("multiplier" / "mult.") _ orMultiplierCondition:Condition {
    return { orMultiplier, orMultiplierCondition };
  }

Piercing
  = "ignores" _ ("DEF" / "RES") { return { isPiercing: true }; }


//---------------------------------------------------------------------------
// Drain HP, recoil HP

DrainHp
  = ("heals" / "restores" _ "HP" _ "to") _ "the" _ "user" _ "for" _ healPercent:Integer "%" _ "of" _ "the" _ "damage" _ "dealt" {
    return {
      type: 'drainHp',
      healPercent
    }
  }

RecoilHp
  = "damages" _ "the" _ "user" _ "for" _ damagePercent:Integer "%"
  _ maxOrCurrent:("max" "."? "imum"? / "current" { return text().startsWith('max') ? 'max' : 'curr'; })
  _ "HP" {
    return {
      type: 'recoilHp',
      damagePercent,
      maxOrCurrent,
    }
  }


//---------------------------------------------------------------------------
// Healing

Heal
  = "restores"i _ "HP" _ "(" healFactor:Integer ")" {
    return {
      type: 'heal',
      healFactor
    };
  }

DamagesUndead
  = 'damages' _ 'undeads' {
    return {};
  }

DispelOrEsuna
  = 'removes'i _ dispelOrEsuna:('negative' / 'positive') _ 'status'? _ 'effects' {
    return { dispelOrEsuna };
  }


//---------------------------------------------------------------------------
// Status effects

StatusEffect
  = verb:StatusVerb _ statuses:StatusList {
    return { type: 'status', verb, statuses };
  }

StatusVerb
  = "grants"i / "causes"i / "removes"i / "doesn't"i _ "remove"

StatusList
  = head:StatusWithPercent tail:(!NextClause AndList StatusWithPercent)* {
    return util.pegAndList(head, tail);
  }

StatusWithPercent
  = status:StatusName
    chance:(_ '(' chanceValue:Integer '%)' { return chanceValue; } )?
    statusClauses:StatusClause*
  {
    const result: any = {
      status
    };
    if (chance) {
      result.chance = chance;
    }
    for (const i of statusClauses) {
      Object.assign(result, i);
    }
    return result;
  }

StatusName "status effect"
  = // Stat mods in particular have a distinctive format.
    ([A-Z] [a-z]+ _)? StatList _ SignedInteger '%'
  / // Generic status names - somewhat complex expression to match those
  (
    StatusWord (_
    (
      StatusWord
      / 'in' / 'or'
      / SignedIntegerSlashList '%'?
      / '='? IntegerSlashList '%'?
      / '(' [A-Za-z-0-9]+ ')'
    ))*
  ) {
    return text();
  }
StatusWord = ([A-Z] [a-zA-Z-']* (':' / '...' / '!')?)

StatusClause
  = _ clause:(
    "for" _ duration:Integer _ durationUnits:DurationUnits { return { duration, durationUnits }; }
    / "every" _ "two" _ "uses" { return { perUses: 2 }; }
    / who:Who { return { who }; }
    / "if" _ "successful" { return { ifSuccessful: true }; }
    / condition:Condition { return { condition }; }
  ) {
    return clause;
  }

DurationUnits
  = ("second" / "turn") "s"? {
    let result = text();
    if (!result.endsWith('s')) {
      result += 's';
    }
    return result;
  }


//---------------------------------------------------------------------------
// Stat mods

StatMod
  = stats:StatList _ percent:SignedInteger '%' who:(_ Who)? duration:(_ Duration)? {
    const result: any = {
      type: 'statMod',
      stats,
      percent,
    };
    if (who) {
      result.who = who[1];
    }
    if (duration) {
      result.duration = duration[1];
    }
    return result;
  }

StatList
  = head:Stat tail:(AndList Stat)* {
    return util.pegAndList(head, tail);
  }


//---------------------------------------------------------------------------
// Lower-level game rules

Duration
  = "for" _ duration:Integer _ "second" "s"? {
    return duration;
  }

Stat "stat"
  = "ATK" / "DEF" / "MAG" / "RES" / "MND" / "SPD" / "ACC" / "EVA"

NextClause
  = "," _ ("grants" / "causes" / "removes" / "doesn't" _ "remove"
      / "restores" _ "HP"
      / "damages" _ "the" _ "user"
      / "heals" _ "the" _ "user"
      / "casts" _ "the" _ "last" _ "ability" _ "used" _ "by" _ "an" _ "ally"
      / "reset"
  )

Who
  = "to" _ "the" _ "user" { return 'self'; }
  / "to" _ "the" _ "target" { return 'target'; }
  / "to" _ "all" _ "allies" row:(_ "in" _ "the" _ row:("front" / "back" / "character's") _ "row" { return row === "character's" ? 'sameRow' : row + 'frontRow'; })? {
    return row || 'party';
  }
  / "to" _ "the" _ "lowest" _ "HP%" _ "ally" { return 'lowestHpAlly'; }
  / "to" _ "a" _ "random" _ "ally" _ "without" _ "status" { return 'allyWithoutStatus'; }
  / "to" _ "a" _ "random" _ "ally" _ "with" _ "negative" _ "status"? _ "effects" { return 'allyWithNegativeStatus'; }

Condition
  = "when" _ "equipping" _ "a" "n"? _ equipped:[a-z- ]+ { return { type: 'equipped', equipped: equipped.join('') }; }
  / "if" _ "the" _ who:("user" / "target") _ "has" _ any:"any"? _ status:StatusName { return { type: 'status', status, who: who === 'user' ? 'self' : 'target', any: !!any }; }


//---------------------------------------------------------------------------
// Primitive types

AndList
  = (',' _) / (','? _ 'and' _)

NumberString "numeric text"
  = numberString:[a-zA-Z\-]+
  & { parsedNumberString = util.parseNumberString(numberString.join('')); return parsedNumberString != null; }
  { return parsedNumberString; }


DecimalNumber "decimal number"
  = ([0-9.]+ / '?') { return parseFloat(text()) }

Integer "integer"
  = ([0-9]+ / '?') { return parseInt(text(), 10); }

SignedInteger "signed integer"
  = sign:[+-] _ value:[0-9]+ { return parseInt(sign + value.join(''), 10); }


IntegerSlashList "slash-separated integers"
  = head:Integer tail:('/' Integer)* { return util.pegSlashList(head, tail); }

SignedIntegerSlashList "slash-separated signed integers"
  = sign:[+-] _ values:IntegerSlashList {
    const applySign = (i: number) => sign === '-' ? -i : i;
    if (Array.isArray(values)) {
      return values.map(applySign);
    } else {
      return applySign(values);
    }
  }

DecimalNumberSlashList "slash-separated decimal numbers"
  = head:DecimalNumber tail:('/' DecimalNumber)* { return util.pegSlashList(head, tail); }


_ "whitespace"
  = [ \t\n\r]*
