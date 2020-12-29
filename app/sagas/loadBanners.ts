import { AxiosResponse } from 'axios';
import { put, select, takeEvery } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import * as _ from 'lodash';

import { showDanger } from '../actions/messages';
import { setProgress } from '../actions/progress';
import {
  loadBanners,
  setExchangeShopSelections,
  setRelicDrawBannersAndGroups,
  setRelicDrawProbabilities,
  getBannerExchangeShopIds,
} from '../actions/relicDraws';
import { getLang } from '../actions/session';
import * as apiUrls from '../api/apiUrls';
import * as gachaSchemas from '../api/schemas/gacha';
import {
  convertExchangeShopSelections,
  convertRelicDrawBanners,
  convertRelicDrawProbabilities,
} from '../proxy/relicDraws';
import { IState } from '../reducers';
import { RelicDrawState } from '../reducers/relicDraws';
import { hasSessionState } from '../reducers/session';
import { logger } from '../utils/logger';
import { callApi, sessionErrorText } from './util';

export const progressKey = 'banners';

export function* doLoadBanners(action: ReturnType<typeof loadBanners>) {
  const allBannerIds = action.payload.bannerIds;
  const session = yield select((state: IState) => state.session);
  if (!hasSessionState(session)) {
    yield put(showDanger(sessionErrorText));
    return;
  }
  const lang = getLang(session);

  yield put(setProgress(progressKey, { current: 0, max: allBannerIds.length }));

  // Re-request the main endpoint, to pick up on things like just-opened fest
  // banners.
  logger.info(`Getting banner overview...`);
  const showResult = yield callApi(apiUrls.gachaShow(lang), session, (response: AxiosResponse) => {
    const { banners, groups } = convertRelicDrawBanners(
      lang,
      response.data as gachaSchemas.GachaShow,
    );
    return setRelicDrawBannersAndGroups(banners, _.values(groups));
  });
  if (showResult != null) {
    yield put(showResult);
  }

  for (let i = 0; i < allBannerIds.length; i++) {
    const bannerId = allBannerIds[i];

    yield put(setProgress(progressKey, { current: i, max: allBannerIds.length }));

    logger.info(`Getting relic probabilities for banner ${bannerId}...`);
    const probabilitiesResult = yield callApi(
      apiUrls.gachaProbability(lang, bannerId),
      session,
      (response: AxiosResponse) => {
        // FIXME: Validate data
        const probabilities = convertRelicDrawProbabilities(
          response.data as gachaSchemas.GachaProbability,
        );
        if (!probabilities) {
          return undefined;
        }

        return setRelicDrawProbabilities(bannerId, probabilities);
      },
    );
    if (probabilitiesResult != null) {
      yield put(probabilitiesResult);
    }

    const { banners, selections } = (yield select(
      (state: IState) => state.relicDraws,
    )) as RelicDrawState;
    if (banners[bannerId]) {
      for (const exchangeShopId of getBannerExchangeShopIds(banners[bannerId]) || []) {
        if (!selections[exchangeShopId]) {
          logger.info(`Getting selections for banner ${bannerId} (shop ID ${exchangeShopId})...`);

          const selectionsResult = yield callApi(
            apiUrls.exchangeShopPrizeList(lang, exchangeShopId),
            session,
            (response: AxiosResponse) => {
              // FIXME: Validate data
              const shopSelections = convertExchangeShopSelections(
                response.data as gachaSchemas.ExchangeShopPrizeList,
              );
              return setExchangeShopSelections(exchangeShopId, shopSelections);
            },
          );
          if (selectionsResult != null) {
            yield put(selectionsResult);
          }
        }
      }
    }
  }

  yield put(setProgress(progressKey, undefined));
}

export function* watchLoadBanners() {
  yield takeEvery(getType(loadBanners), doLoadBanners);
}
