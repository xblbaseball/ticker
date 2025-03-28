import _, { update } from 'lodash';
import { ActionDispatch, useContext } from "react";

import Checkbox from '@/components/inputs/checkbox';
import Dropdown from "@/components/inputs/dropdown";
import Input from "@/components/inputs/input";
import Radio from '@/components/inputs/radio';
import StatSelector from '@/components/inputs/stat-selector';
import TextArea from '@/components/inputs/textarea';
import { ModalDispatchContext } from "@/store/modal.context";
import { action as modalAction } from "@/store/modal.reducer";
import { SettingsContext, SettingsDispatchContext } from "@/store/settings.context";
import { isValidStore, action as settingsAction, SettingsStore } from "@/store/settings.reducer";
import { StatsContext } from '@/store/stats.context';

import { TeamSeason } from '@/typings/careers';

import styles from "./settings.module.css";

const punctuation = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;

function isJSON(e: unknown) {
  try {
    JSON.parse(e as string);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    return false;
  }
}

export default function Settings() {
  const modalDispatch: ActionDispatch<[action: modalAction]> = useContext(ModalDispatchContext);
  const settingsDispatch: ActionDispatch<[action: settingsAction]> = useContext(SettingsDispatchContext);
  const settingsStore = useContext(SettingsContext);
  const statsStore = useContext(StatsContext);

  /** dispatch an update to a setting in the store */
  const updateSetting = (path: string[], value: unknown) => {
    settingsDispatch({ type: "set", payload: { path, value } })
  }

  /** all teams who have ever played */
  const allPlayers = _.keys(statsStore.stats.careers.all_players).sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);

  const teamsWithLogos = _.chain(settingsStore.allLogos)
    .filter(filename => !filename.includes("72x72"))
    .map(filename => filename.slice(0, -4))
    .value();

  /** list of all players except one */
  const allPlayersBut = (player = "") => {
    if (player === "") {
      return allPlayers;
    }
    return _.filter(allPlayers, (otherPlayer) => otherPlayer !== player);
  }

  /** given a player, get a list of the teams they've fielded */
  const teamsForPlayer = (player: string) => {
    if (player === "") {
      return [];
    }

    const teams: TeamSeason[] = _.get(
      statsStore,
      ["stats", "careers", "all_players", player, "teams"],
      []
    );

    // use a set to avoid duplicates
    return Array.from(new Set(teams.map((teamSeason) => teamSeason.team_name)));
  }

  /** given a team name for a player, look up the team's abbreviation */
  const getAbbrevFromTeam = (player: string, team: string) => {
    if (player === "") {
      return "";
    }

    if (team === "") {
      return "";
    }

    const teams: TeamSeason[] = _.get(
      statsStore,
      ["stats", "careers", "all_players", player, "teams"],
      []
    );
    // teams are stored in ascending season order. go backwards to make sure we have the team's latest abbreviation (in case they changed abbreviations at some point)
    const thisTeam = teams.reverse().find(teamSeason => team === teamSeason.team_name);
    if (_.isNil(thisTeam)) {
      return "";
    }

    return thisTeam.team_abbrev;
  }

  /** used to select which games to use for left bar stats */
  const statsTimeFrames = [
    ["Regular Season", "regularSeason"],
    ["Playoffs", "playoffs"],
    ["Career Regular Season", "careerRegularSeason"],
    ["Career Playoffs", "careerPlayoffs"],
    ["League Regular Season", "leagueRegularSeason"],
    ["League Playoffs", "leaguePlayoffs"],
    ["Head-to-Head Regular Season", "h2hRegularSeason"],
    ["Head-to-Head Playoffs", "h2hPlayoffs"],
  ]

  return <div className={`flex column ${styles.container}`}>
    <div className={`flex space-between`}>
      <div>Changes are saved as you make them. Your settings {settingsStore.useLocalStorage ? 'will' : 'will NOT'} be saved for the next broadcast.</div>

      <div>
        <button style={{ cursor: 'pointer' }} onClick={() => modalDispatch({ type: "destroyed-modals" })}>Close</button>
      </div>
    </div>

    <h3>Import</h3>

    <TextArea
      value={null}
      onChange={(maybeJSON) => {
        if (!isJSON(maybeJSON)) {
          return;
        }

        const importedStore: SettingsStore = JSON.parse(maybeJSON);

        if (!isValidStore(importedStore)) {
          return;
        }

        settingsDispatch({
          type: "import",
          payload: { store: importedStore }
        })
      }}
      cols={20}
      rows={5}
    >
      It might be easier to play with settings in your browser and then copy them here.
    </TextArea>

    <Dropdown
      options={["XBL", "AAA", "AA"]}
      selected={settingsStore.league}
      onSelect={(league) => {
        updateSetting(["league"], league);
        if (_.get(settingsStore, ['playoffs', league], false)) {
          // write in 'Playoffs' under the season
          updateSetting(['seasonSubtext'], 'Playoffs');
        }
      }}
    >
      Which league is playing? Controls the logo in the top left and some scores and records.
    </Dropdown>

    <h3>Playoffs</h3>

    These are used to control which scores and records are shown.

    <Checkbox
      checked={settingsStore.playoffs.XBL}
      onChange={(checked) => {
        updateSetting(["playoffs", "XBL"], checked);
        // write in "Playoffs" under the season
        if (settingsStore.league === "XBL") {
          updateSetting(["seasonSubtext"], "Playoffs");
        }
      }}
    >
      XBL in playoffs
    </Checkbox>

    <Checkbox
      checked={settingsStore.playoffs.AAA}
      onChange={(checked) => {
        updateSetting(["playoffs", "AAA"], checked);
        // write in "Playoffs" under the season
        if (settingsStore.league === "AAA") {
          updateSetting(["seasonSubtext"], "Playoffs");
        }
      }}
    >
      AAA in playoffs
    </Checkbox>

    <Checkbox
      checked={settingsStore.playoffs.AA}
      onChange={(checked) => {
        updateSetting(["playoffs", "AA"], checked);
        // write in "Playoffs" under the season
        if (settingsStore.league === "AA") {
          updateSetting(["seasonSubtext"], "Playoffs");
        }
      }}
    >
      AA in playoffs
    </Checkbox>

    <h3>Left Bar</h3>

    <Input
      value={`${settingsStore.season || ""}`}
      onChange={(season) => updateSetting(["season"], parseInt(season as string))}
    >
      Season
    </Input>

    <Input
      value={`${settingsStore.seasonSubtext || ""}`}
      onChange={(seasonSubtext) => updateSetting(["seasonSubtext"], seasonSubtext)}
    >
      Optional text to show under the season (e.g., &quot;Playoffs&quot;)
    </Input>

    <Dropdown
      options={allPlayersBut(settingsStore.homePlayer)}
      optionsLabel={"Select a player"}
      selected={settingsStore.awayPlayer}
      onSelect={(player) => updateSetting(["awayPlayer"], player)}
    >
      Away Player
    </Dropdown>

    <Dropdown
      options={teamsForPlayer(settingsStore.awayPlayer)}
      optionsLabel={"Select a team"}
      selected={settingsStore.awayTeam}
      onSelect={(team) => {
        updateSetting(["awayTeam"], team);
        updateSetting(["awayAbbrev"], getAbbrevFromTeam(settingsStore.awayPlayer, team));
        updateSetting(["awayLogo"], team);
      }}
    >
      Away Team
    </Dropdown>

    <Input
      value={settingsStore.awayAbbrev}
      onChange={(abbrev) => updateSetting(["awayAbbrev"], abbrev)}
    >
      Away Abbreviation
    </Input>

    <Dropdown
      options={teamsWithLogos}
      optionsLabel={"Select a logo"}
      selected={settingsStore.awayLogo}
      onSelect={(team) => updateSetting(["awayLogo"], team)}
    >
      Away Logo Override
    </Dropdown>

    <Dropdown
      options={allPlayersBut(settingsStore.awayPlayer)}
      optionsLabel={"Select a player"}
      selected={settingsStore.homePlayer}
      onSelect={(player) => updateSetting(["homePlayer"], player)}
    >
      Home Player
    </Dropdown>

    <Dropdown
      options={teamsForPlayer(settingsStore.homePlayer)}
      optionsLabel={"Select a team"}
      selected={settingsStore.homeTeam}
      onSelect={(team) => {
        updateSetting(["homeTeam"], team);
        updateSetting(["homeAbbrev"], getAbbrevFromTeam(settingsStore.homePlayer, team));
        updateSetting(["homeLogo"], team);
      }}
    >
      Home Team
    </Dropdown>

    <Input
      value={settingsStore.homeAbbrev}
      onChange={(abbrev) => updateSetting(["homeAbbrev"], abbrev)}
    >
      Home Abbreviation
    </Input>

    <Dropdown
      options={teamsWithLogos}
      selected={settingsStore.homeLogo}
      onSelect={(team) => updateSetting(["homeLogo"], team)}
    >
      Home Logo Override
    </Dropdown>

    <Checkbox
      checked={settingsStore.showSeries}
      onChange={(doShow) => updateSetting(["showSeries"], doShow)}
    >
      Show series record
    </Checkbox>

    <Input
      value={settingsStore.awayWins || ""}
      onChange={(wins) => updateSetting(["awayWins"], parseInt(wins as string))}
    >
      Away Wins (if showing series record)
    </Input>

    <Input
      value={settingsStore.homeWins || ""}
      onChange={(wins) => updateSetting(["homeWins"], parseInt(wins as string))}
    >
      Home Wins (if showing series record)
    </Input>

    <Input
      value={settingsStore.seriesLeft}
      onChange={(seriesLeft) => updateSetting(["seriesLeft"], seriesLeft)}
    >
      Left side under the series. Could be a short name for series (e.g., the playoff round like &quot;RD2&quot;)
    </Input>

    <Input
      value={settingsStore.seriesRight}
      onChange={(seriesRight) => updateSetting(["seriesRight"], seriesRight)}
    >
      Right side under the series. Could be the number of games (e.g., &quot;BO7&quot;)
    </Input>

    <h3>Stats in the side bar</h3>

    The timeframes below correspond to which games were used to generate stats.

    <ul>
      <li><strong>Regular Season</strong>: a specific regular season (defaults to the current season)</li>
      <li><strong>Playoffs</strong>: a specific playoff campaign (defaults to the current season)</li>
      <li><strong>Career Regular Season</strong>: all-time regular season performance</li>
      <li><strong>Career Playoffs</strong>: all-time playoffs performance</li>
      <li><strong>League Regular Season</strong>: all-time performance in a specific league&apos;s regular season games</li>
      <li><strong>League Playoffs</strong>: all-time performance in a specific league&apos;s playoff games</li>
      <li><strong>Regular Season Head-to-Head</strong>: all-time regular season performances against the other team</li>
      <li><strong>Playoffs Head-to-Head</strong>: all-time performances in every playoff matchup against the other team</li>
    </ul>

    <Checkbox
      checked={settingsStore.statTimeFramesSameForBothTeams}
      onChange={(doShow) => updateSetting(["statTimeFramesSameForBothTeams"], doShow)}
    >
      Show same stat timeframes for away and home teams
    </Checkbox>

    <Checkbox
      checked={settingsStore.showStatTimeframes}
      onChange={(doShow) => updateSetting(["showStatTimeframes"], doShow)}
    >
      Render the timeframe under each team&apos; stats
    </Checkbox>

    {settingsStore.statTimeFramesSameForBothTeams ? <>
      <Radio
        selected={settingsStore.awayStatsTimeframe}
        options={statsTimeFrames}
        onChange={(timeframe) => {
          updateSetting(["awayStatsTimeframe"], timeframe);
          updateSetting(["homeStatsTimeframe"], timeframe);
        }}
      >
        Stats timeframe. See above
      </Radio>

      {
        (settingsStore.awayStatsTimeframe === "regularSeason" || settingsStore.awayStatsTimeframe === "playoffs") &&
        <Input
          value={settingsStore.awayStatsSeason}
          onChange={(season) => {
            updateSetting(["awayStatsSeason"], season);
            updateSetting(["homeStatsSeason"], season);
          }}
        >
          Season
        </Input>
      }

      {
        (settingsStore.awayStatsTimeframe === "leagueRegularSeason" || settingsStore.awayStatsTimeframe === "leaguePlayoffs") &&
        <Radio
          options={[["XBL", "XBL"], ["AAA", "AAA"], ["AA", "AA"]]}
          selected={settingsStore.awayStatsLeague}
          onChange={(league) => {
            updateSetting(['awayStatsLeague'], league);
            updateSetting(['homeStatsLeague'], league);
          }}
        >
          League
        </Radio>
      }
    </> : <>
      <h4>Away</h4>
      <Radio
        selected={settingsStore.awayStatsTimeframe}
        options={statsTimeFrames}
        onChange={(timeframe) => {
          updateSetting(["awayStatsTimeframe"], timeframe);
        }}
      >
        Away team stats timeframe. See above
      </Radio>

      {
        (settingsStore.awayStatsTimeframe === "regularSeason" || settingsStore.awayStatsTimeframe === "playoffs") &&
        <Input
          value={settingsStore.awayStatsSeason}
          onChange={(season) => {
            updateSetting(["awayStatsSeason"], season);
          }}
        >
          Season
        </Input>
      }

      {
        (settingsStore.awayStatsTimeframe === "leagueRegularSeason" || settingsStore.awayStatsTimeframe === "leaguePlayoffs") &&
        <Radio
          options={[["XBL", "XBL"], ["AAA", "AAA"], ["AA", "AA"]]}
          selected={settingsStore.awayStatsLeague}
          onChange={(league) => {
            updateSetting(['awayStatsLeague'], league);
          }}
        >
          League
        </Radio>
      }

      <h4>Home</h4>
      <Radio
        selected={settingsStore.homeStatsTimeframe}
        options={statsTimeFrames}
        onChange={(timeframe) => {
          updateSetting(["homeStatsTimeframe"], timeframe);
        }}
      >
        Home team stats timeframe. See above
      </Radio>

      {
        (settingsStore.homeStatsTimeframe === "regularSeason" || settingsStore.homeStatsTimeframe === "playoffs") &&
        <Input
          value={settingsStore.homeStatsSeason}
          onChange={(season) => {
            updateSetting(["homeStatsSeason"], season);
          }}
        >
          Season
        </Input>

      }

      {
        (settingsStore.homeStatsTimeframe === "leagueRegularSeason" || settingsStore.homeStatsTimeframe === "leaguePlayoffs") &&
        <Radio
          options={[["XBL", "XBL"], ["AAA", "AAA"], ["AA", "AA"]]}
          selected={settingsStore.homeStatsLeague}
          onChange={(league) => {
            updateSetting(['homeStatsLeague'], league);
          }}
        >
          League
        </Radio>
      }
    </>}

    <Checkbox
      checked={settingsStore.statCategoriesSameForBothTeams}
      onChange={(doShow) => updateSetting(["statCategoriesSameForBothTeams"], doShow)}
    >
      Show same stat categories for away and home teams
    </Checkbox>

    {settingsStore.statCategoriesSameForBothTeams ? <>
      <StatSelector
        stat={settingsStore.awayStatCategories.first}
        onChange={(stat) => {
          updateSetting(["awayStatCategories", "first"], stat)
          updateSetting(["homeStatCategories", "first"], stat)
        }}
      >
        Stat category 1
      </StatSelector>

      <StatSelector
        stat={settingsStore.awayStatCategories.second}
        onChange={(stat) => {
          updateSetting(["awayStatCategories", "second"], stat)
          updateSetting(["homeStatCategories", "second"], stat)
        }}
      >
        Stat category 2
      </StatSelector>

      <StatSelector
        stat={settingsStore.awayStatCategories.third}
        onChange={(stat) => {
          updateSetting(["awayStatCategories", "third"], stat)
          updateSetting(["homeStatCategories", "third"], stat)
        }}
      >
        Stat category 3
      </StatSelector>

      <StatSelector
        stat={settingsStore.awayStatCategories.fourth}
        onChange={(stat) => {
          updateSetting(["awayStatCategories", "fourth"], stat)
          updateSetting(["homeStatCategories", "fourth"], stat)
        }}
      >
        Stat category 4
      </StatSelector>

      <StatSelector
        stat={settingsStore.awayStatCategories.fifth}
        onChange={(stat) => {
          updateSetting(["awayStatCategories", "fifth"], stat)
          updateSetting(["homeStatCategories", "fifth"], stat)
        }}
      >
        Stat category 5
      </StatSelector>

      <StatSelector
        stat={settingsStore.awayStatCategories.sixth}
        onChange={(stat) => {
          updateSetting(["awayStatCategories", "sixth"], stat)
          updateSetting(["homeStatCategories", "sixth"], stat)
        }}
      >
        Stat category 6
      </StatSelector>
    </>
      :
      <>
        <h4>Away</h4>

        <StatSelector
          stat={settingsStore.awayStatCategories.first}
          onChange={(stat) => {
            updateSetting(["awayStatCategories", "first"], stat)
          }}
        >
          Away stat category 1
        </StatSelector>

        <StatSelector
          stat={settingsStore.awayStatCategories.second}
          onChange={(stat) => {
            updateSetting(["awayStatCategories", "second"], stat)
          }}
        >
          Away stat category 2
        </StatSelector>

        <StatSelector
          stat={settingsStore.awayStatCategories.third}
          onChange={(stat) => {
            updateSetting(["awayStatCategories", "third"], stat)
          }}
        >
          Away stat category 3
        </StatSelector>

        <StatSelector
          stat={settingsStore.awayStatCategories.fourth}
          onChange={(stat) => {
            updateSetting(["awayStatCategories", "fourth"], stat)
          }}
        >
          Away stat category 4
        </StatSelector>

        <StatSelector
          stat={settingsStore.awayStatCategories.fifth}
          onChange={(stat) => {
            updateSetting(["awayStatCategories", "fifth"], stat)
          }}
        >
          Away stat category 5
        </StatSelector>

        <StatSelector
          stat={settingsStore.awayStatCategories.sixth}
          onChange={(stat) => {
            updateSetting(["awayStatCategories", "sixth"], stat)
          }}
        >
          Away stat category 6
        </StatSelector>

        <h4>Home</h4>

        <StatSelector
          stat={settingsStore.homeStatCategories.first}
          onChange={(stat) => {
            updateSetting(["homeStatCategories", "first"], stat)
          }}
        >
          Home stat category 1
        </StatSelector>

        <StatSelector
          stat={settingsStore.homeStatCategories.second}
          onChange={(stat) => {
            updateSetting(["homeStatCategories", "second"], stat)
          }}
        >
          Home stat category 2
        </StatSelector>

        <StatSelector
          stat={settingsStore.homeStatCategories.third}
          onChange={(stat) => {
            updateSetting(["homeStatCategories", "third"], stat)
          }}
        >
          Home stat category 3
        </StatSelector>

        <StatSelector
          stat={settingsStore.homeStatCategories.fourth}
          onChange={(stat) => {
            updateSetting(["homeStatCategories", "fourth"], stat)
          }}
        >
          Home stat category 4
        </StatSelector>

        <StatSelector
          stat={settingsStore.homeStatCategories.fifth}
          onChange={(stat) => {
            updateSetting(["homeStatCategories", "fifth"], stat)
          }}
        >
          Home stat category 5
        </StatSelector>

        <StatSelector
          stat={settingsStore.homeStatCategories.sixth}
          onChange={(stat) => {
            updateSetting(["homeStatCategories", "sixth"], stat)
          }}
        >
          Home stat category 6
        </StatSelector>
      </>
    }

    <h3>Headlines</h3>

    <p>Each line in the next text box is a separate headline that will be scrolled in the marquee in the bottom bar. Each headline should follow this format:</p>

    <pre>Category|Text to scroll</pre>

    <p>Example:</p>

    <pre>XBL News|Spokesmen def. Holograms to move on to XBL World Series. Coverage starts Monday</pre>
    <pre>AAA News|Mystery Men win it all! The caster extraordinaire finally walks away with hardware.
    </pre>

    <TextArea
      value={settingsStore.headlines}
      onChange={(value) => {
        settingsDispatch({
          type: "set",
          payload: { path: ["headlines"], value }
        })
      }}
    >
      Headlines
    </TextArea>

    <h3>Bottom Bar</h3>

    <Input
      value={settingsStore.maxBoxScores || ""}
      onChange={(games) => updateSetting(['maxBoxScores'], parseInt(games as string))}
    >
      How many box scores should we rotate through? This number should be divisible by 3. If you change this, you&apos;ll need to reload the page for the changes to take effect.
    </Input>

    <h3>Current Settings</h3>
    Copy this if you want to share your settings with someone else, or just paste them into the ticker settings in the OBS browser.
    <pre className="pre-wrap">{JSON.stringify(settingsStore)}</pre>

    <button style={{ cursor: 'pointer', width: "10em" }} onClick={() => settingsDispatch({ type: "reset-all" })}>Reset settings</button>
  </div >;
}
