import * as React from 'react';
import { connect } from 'react-redux';
import { Route, RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';

import { loadBanners, RelicDrawProbabilities } from '../actions/relicDraws';
import { BadRelicDrawMessage } from '../components/relicDraws/BadRelicDrawMessage';
import { RelicDrawBannerList } from '../components/relicDraws/RelicDrawBannerList';
import LoadMissingPrompt from '../components/shared/LoadMissingPrompt';
import { IState } from '../reducers';
import { progressKey } from '../sagas/loadBanners';
import {
  getBannersAndGroups,
  getMissingBanners,
  MissingBanner,
  RelicDrawBannersAndGroups,
} from '../selectors/relicDraws';
import { joinUrl } from '../utils/textUtils';
import { Page } from './Page';
import RelicDrawBannerPage from './RelicDrawBannerPage';
import RelicDrawGroupPage from './RelicDrawGroupPage';

interface Props {
  bannersAndGroups: RelicDrawBannersAndGroups;
  probabilities: {
    [bannerId: string]: RelicDrawProbabilities;
  };
  want?: { [relicId: number]: boolean };
  missingBanners: MissingBanner[];
  currentTime: number;
  dispatch: Dispatch;
}

export class RelicDrawsPage extends React.PureComponent<Props & RouteComponentProps> {
  pageRef: React.RefObject<Page>;

  constructor(props: Props & RouteComponentProps) {
    super(props);
    this.pageRef = React.createRef();
  }

  groupLink = (group: string) => joinUrl(this.props.match.url, '/group-' + group);
  bannerLink = (banner: string | number) => joinUrl(this.props.match.url, '/banner' + banner);
  groupBannerLink = (group: string, banner: string | number) =>
    joinUrl(this.props.match.url, '/group-' + group + '/banner' + banner);

  handleLoad = () => {
    const { missingBanners, dispatch } = this.props;
    dispatch(loadBanners(missingBanners));
  };

  componentDidUpdate = (prevProps: Props & RouteComponentProps) => {
    if (prevProps.match !== this.props.match && this.pageRef.current) {
      this.pageRef.current.scrollToTop();
    }
  };

  renderContents() {
    const {
      bannersAndGroups,
      probabilities,
      missingBanners,
      currentTime,
      match,
      want,
    } = this.props;
    const details = bannersAndGroups['undefined'];
    if (!details || !details.length) {
      return <BadRelicDrawMessage />;
    }
    const isAnonymous = !process.env.IS_ELECTRON;
    return (
      <>
        <LoadMissingPrompt
          missingCount={missingBanners.length}
          missingText="Details for %s have not been loaded."
          countText="banner"
          loadingText="Loading banner details"
          onLoad={this.handleLoad}
          progressKey={progressKey}
        />

        {/* HACK: Support only one layer of nesting (group -> banner) */}
        <Route
          path={this.groupBannerLink(':group', ':banner')}
          render={(props: RouteComponentProps<any>) => (
            <RelicDrawBannerPage
              {...props}
              isAnonymous={isAnonymous}
              backLink={this.groupLink(props.match.params.group)}
            />
          )}
        />

        <Route
          exact
          path={this.groupLink(':group')}
          render={(props: RouteComponentProps<any>) => (
            <RelicDrawGroupPage
              {...props}
              isAnonymous={isAnonymous}
              bannerLink={(banner: string | number) =>
                this.groupBannerLink(props.match.params.group, banner)
              }
              groupLink={this.groupLink}
              backLink={match.url}
            />
          )}
        />
        <Route
          path={this.bannerLink(':banner')}
          render={(props: RouteComponentProps<any>) => (
            <RelicDrawBannerPage {...props} isAnonymous={isAnonymous} backLink={match.url} />
          )}
        />

        <Route
          exact
          path={match.url}
          render={() => (
            <RelicDrawBannerList
              details={details}
              isAnonymous={isAnonymous}
              currentTime={currentTime}
              bannerLink={this.bannerLink}
              groupLink={this.groupLink}
              probabilities={probabilities}
              want={want}
            />
          )}
        />
      </>
    );
  }

  render() {
    return (
      <Page title="Relic Draws" ref={this.pageRef}>
        {this.renderContents()}
      </Page>
    );
  }
}

export default connect((state: IState) => ({
  bannersAndGroups: getBannersAndGroups(state),
  probabilities: state.relicDraws.probabilities,
  want: state.relicDraws.want,
  missingBanners: getMissingBanners(state),
  currentTime: state.timeState.currentTime,
}))(RelicDrawsPage);
