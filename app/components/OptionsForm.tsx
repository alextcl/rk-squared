import * as React from 'react';
import { connect } from 'react-redux';

import { Options, setOption as setOptionAction } from '../actions/options';
import { IState } from '../reducers';
import { BrowserLink } from './BrowserLink';

const styles = require('./OptionsForm.scss');

const FFRK_COMMUNITY =
  'https://docs.google.com/spreadsheets/d/1f8OJIQhpycljDQ8QNDk_va1GJ1u7RVoMaNjFcHH0LKk';
const FFRK_COMMUNITY_HELP = 'Open the FFRK Community Google Docs spreadsheet in your browser.';
const MISTER_P = 'http://happypluto.com/~misterp/r/ffrk.pdf';
const MISTER_P_HELP = "Open MisterP's FFRK PDF in your browser.";

interface Props {
  options: Options;
  capturePath: string;
  setOption: (newOptions: Options) => any;
}

const Checkbox = ({
  id,
  children,
  options,
  setOption,
}: {
  id: string;
  children: any;
  options: Options;
  setOption: (o: Options) => void;
}) => (
  <div className="form-check">
    <input
      className="form-check-input"
      id={id}
      name={id}
      type="checkbox"
      checked={(options as any)[id]}
      onChange={() => setOption({ [id]: !(options as any)[id] })}
    />
    <label className="form-check-label" htmlFor={id}>
      {children}
    </label>
  </div>
);

const HelpText = ({ children }: { children: any }) => (
  <small className="form-text text-muted">{children}</small>
);

export class OptionsForm extends React.Component<Props> {
  render() {
    const { options, capturePath, setOption } = this.props;
    return (
      <div className={styles.component}>
        <div className="form-group">
          <Checkbox id="alwaysShowTimer" {...{ options, setOption }}>
            Always show timer
          </Checkbox>
          <HelpText>
            Besides self-imposed speedrun challenges, this can be useful for tracking when buffs and
            debuffs might expire. Check{' '}
            <BrowserLink href={FFRK_COMMUNITY} title={FFRK_COMMUNITY_HELP}>
              FFRK Community
            </BrowserLink>{' '}
            or{' '}
            <BrowserLink href={MISTER_P} title={MISTER_P_HELP}>
              MisterP
            </BrowserLink>{' '}
            for details on buff durations.
          </HelpText>
        </div>

        <div className="form-group">
          <Checkbox id="staticBattleBackground" {...{ options, setOption }}>
            Show static battle backgrounds
          </Checkbox>
          <HelpText>
            <p>
              Replaces all battle backgrounds with the Nightmare's plain, dark caverns. This may
              help performance on older phones or tablets.
            </p>
            <p>
              You may also want to enable &ldquo;Simplified Display&rdquo; in the in-game Config
              menu to reduce animations and effects on game menus.
            </p>
          </HelpText>
        </div>

        <div className="form-group">
          <Checkbox id="saveTrafficCaptures" {...{ options, setOption }}>
            Save captured game traffic
          </Checkbox>
          <HelpText>
            <p>
              Save captured FFRK network traffic
              {capturePath && (
                <span>
                  {' '}
                  under <code>{capturePath}</code>
                </span>
              )}
              . This can be helpful for testing and troubleshooting but is otherwise not needed.
            </p>
          </HelpText>
        </div>
      </div>
    );
  }
}

export default connect(
  ({ options, proxy }: IState) => ({ options, capturePath: proxy.capturePath }),
  dispatch => ({
    setOption: (newOptions: Options) => dispatch(setOptionAction(newOptions)),
  }),
)(OptionsForm);
