import * as React from 'react';

import * as _ from 'lodash';

import { getOffBannerRelics, RelicDrawProbabilities } from '../../actions/relicDraws';
import { enlir } from '../../data/enlir';
import { tierOrder } from '../../data/mrP';
import { RelicDrawBannerDetails } from '../../selectors/relicDraws';
import RelicDrawBannerTable from './RelicDrawBannerTable';

interface Props {
  banner: RelicDrawBannerDetails;
  probabilities?: RelicDrawProbabilities;
  isAnonymous?: boolean;
}

function sortRelics(relicIds: number[]) {
  return _.sortBy(relicIds, [
    (i: number) =>
      enlir.relics[i].character ? enlir.charactersByName[enlir.relics[i].character!].id : 0,
    (i: number) => (enlir.relicSoulBreaks[i] ? -tierOrder[enlir.relicSoulBreaks[i].tier] : 0),
    (i: number) =>
      enlir.relicSoulBreaks[i]
        ? -enlir.relicSoulBreaks[i].id
        : enlir.relicLegendMateria[i]
        ? -enlir.relicLegendMateria[i].id
        : 0,
  ]);
}

export class RelicDrawBannerContents extends React.PureComponent<Props> {
  renderSelections() {
    const { banner, isAnonymous } = this.props;
    if (!banner.selections || !banner.selections.length) {
      return null;
    }
    return (
      <RelicDrawBannerTable
        title={'Available Selections'}
        relics={banner.selections}
        isAnonymous={isAnonymous}
      />
    );
  }

  renderFeatured() {
    const { banner, probabilities, isAnonymous } = this.props;
    if (!banner.bannerRelics || !banner.bannerRelics.length) {
      return null;
    }
    return (
      <RelicDrawBannerTable
        title={'Featured Relics'}
        relics={banner.bannerRelics}
        probabilities={probabilities}
        isAnonymous={isAnonymous}
      />
    );
  }

  renderAll() {
    const { banner, probabilities, isAnonymous } = this.props;
    if ((banner.bannerRelics && banner.bannerRelics.length) || !probabilities) {
      return null;
    }
    return (
      <RelicDrawBannerTable
        title={'All Relics'}
        relics={sortRelics(_.keys(probabilities.byRelic).map(i => +i))}
        probabilities={probabilities}
        isAnonymous={isAnonymous}
      />
    );
  }

  renderOffBanner() {
    const { banner, probabilities, isAnonymous } = this.props;
    const offBanner =
      banner.bannerRelics && banner.bannerRelics.length && probabilities
        ? sortRelics(getOffBannerRelics(banner, probabilities))
        : undefined;
    if (!offBanner) {
      return null;
    }
    return (
      <RelicDrawBannerTable
        title={'Off-Banner'}
        relics={offBanner}
        probabilities={probabilities}
        isAnonymous={isAnonymous}
      />
    );
  }

  renderFallback() {
    const { banner, probabilities } = this.props;
    if ((banner.bannerRelics && banner.bannerRelics.length) || probabilities) {
      return null;
    }
    return <div>No details are available for this banner.</div>;
  }

  render() {
    return (
      <>
        {this.renderSelections()}
        {this.renderFeatured()}
        {this.renderAll()}
        {this.renderOffBanner()}
        {this.renderFallback()}
      </>
    );
  }
}