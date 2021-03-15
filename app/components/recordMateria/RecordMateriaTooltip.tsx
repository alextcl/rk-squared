import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

import { RecordMateriaDetail, RecordMateriaStatus } from '../../actions/recordMateria';
import { LangType } from '../../api/apiUrls';
import { LangContext } from '../../contexts/LangContext';
import { enlir } from '../../data';
import { EnlirRecordMateria } from '../../data/enlir';
import { convertEnlirSkillToMrP, formatMrPSkill } from '../../data/mrP/skill';
import * as urls from '../../data/urls';
import { BrTextToP } from '../common/BrTextToP';
import { StatusIcon } from './StatusIcon';

const styles = require('./RecordMateriaTooltip.module.scss');

interface Props {
  id: string;
  recordMateria: { [id: number]: RecordMateriaDetail };
  isAnonymous?: boolean;
  descriptionOnly?: boolean;
}

function getEnlirRecordMateriaEffect(rm: EnlirRecordMateria): string {
  const m = rm.effect.match(
    /(?:\d+% chance to turn [Aa]ttack into|[Aa]ttack turns into|[Aa]ttack becomes) ((?:[A-Z][A-Za-z']+ )*[A-Z][A-Za-z']+)/,
  );
  if (m) {
    const ability = enlir.abilitiesByName[m[1]];
    if (ability) {
      return rm.effect + ' (' + formatMrPSkill(convertEnlirSkillToMrP(ability)) + ')';
    }
  }
  return rm.effect;
}

export class RecordMateriaTooltip extends React.Component<Props> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  renderStatus(rm: RecordMateriaDetail) {
    if (this.props.isAnonymous) {
      return (
        <div className={styles.statusBlock}>
          <p className={styles.unlockCondition}>{rm.condition}</p>
        </div>
      );
    } else {
      return (
        <div className={styles.statusBlock}>
          <StatusIcon status={rm.status} />
          <p>
            {rm.statusDescription}
            {rm.status === RecordMateriaStatus.Unlocked && (
              <span className={styles.unlockCondition}> ({rm.condition})</span>
            )}
          </p>
        </div>
      );
    }
  }

  getContent = (recordMateriaId: string) => {
    const rm = this.props.recordMateria[+recordMateriaId];
    if (!rm) {
      return null;
    }
    const lang = this.context as LangType;
    const enlirRM = enlir.recordMateria[rm.id];

    const gameDescription = <BrTextToP text={rm.description} className={styles.gameDescription} />;
    const enlirDescription = enlirRM && (
      <p className={styles.enlirDescription}>{getEnlirRecordMateriaEffect(enlirRM)}</p>
    );

    if (this.props.descriptionOnly) {
      return (
        <div className={styles.textBlock}>
          {gameDescription}
          {enlirDescription}
        </div>
      );
    }
    return (
      <>
        <div className={styles.iconsBlock}>
          <img src={urls.characterImage(lang, rm.characterId)} />
          <img src={urls.recordMateriaImage(lang, rm.id)} />
        </div>

        <div className={styles.textBlock}>
          <h6>{rm.name}</h6>
          {gameDescription}
          {enlirDescription}
          {this.renderStatus(rm)}
        </div>
      </>
    );
  };

  render() {
    const { id } = this.props;
    return (
      <ReactTooltip
        id={id}
        className={styles.component}
        place="bottom"
        getContent={this.getContent}
      />
    );
  }
}
