import _ from 'lodash';
import { ActionDispatch, useContext } from "react";

import Checkbox from '@/components/inputs/checkbox';
import Dropdown from "@/components/inputs/dropdown";
import Input from "@/components/inputs/input";
import Radio from '@/components/inputs/radio';
import StatCategory from '@/components/inputs/stat-selector';
import TextArea from '@/components/inputs/textarea';
import { ModalDispatchContext } from "@/store/modal.context";
import { action as modalAction } from "@/store/modal.reducer";
import { SettingsContext, SettingsDispatchContext } from "@/store/settings.context";
import { action as settingsAction, SettingsStore } from "@/store/settings.reducer";
import { StatsContext } from '@/store/stats.context';

import { TeamSeason } from '@/typings/careers';

import styles from "./settings.module.css";

function isJSON(e: unknown) {
  try {
    JSON.parse(e as string);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export default function Settings() {
  const modalDispatch: ActionDispatch<[action: modalAction]> = useContext(ModalDispatchContext);
  const settingsDispatch: ActionDispatch<[action: settingsAction]> = useContext(SettingsDispatchContext);
  const settingsStore = useContext(SettingsContext);
  const statsStore = useContext(StatsContext);

  const updateSetting = (path: string[], value: unknown) => {
    settingsDispatch({ type: "set", payload: { path, value } })
  }

  const allTeams = _.keys(statsStore.stats.careers.all_players).sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);

  const allPlayersBut = (player = "") => {
    if (player === "") {
      return allTeams;
    }
    return _.filter(allTeams, (otherPlayer) => otherPlayer !== player);
  }

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
    const thisTeam = teams.find(teamSeason => team === teamSeason.team_name);
    if (_.isNil(thisTeam)) {
      return "";
    }

    return thisTeam.team_abbrev;
  }

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
      onChange={(maybeJSON) => {
        if (!isJSON(maybeJSON)) {
          return;
        }

        const importedStore: SettingsStore = JSON.parse(maybeJSON);

        settingsDispatch({
          type: "import",
          payload: { store: importedStore }
        })
      }}
    >
      It might be easier to play with settings in your browser and then copy them here.
    </TextArea>

    <h3>Playoffs</h3>

    These are used to control which scores and records are shown.

    <Checkbox
      checked={settingsStore.playoffs.XBL}
      onChange={(checked) => updateSetting(["playoffs", "XBL"], checked)}
    >
      XBL in playoffs
    </Checkbox>

    <Checkbox
      checked={settingsStore.playoffs.AAA}
      onChange={(checked) => updateSetting(["playoffs", "AAA"], checked)}
    >
      AAA in playoffs
    </Checkbox>

    <Checkbox
      checked={settingsStore.playoffs.AA}
      onChange={(checked) => updateSetting(["playoffs", "AA"], checked)}
    >
      AA in playoffs
    </Checkbox>

    <h3>Left Bar</h3>

    <Dropdown
      options={["XBL", "AAA", "AA"]}
      selected={settingsStore.league}
      onSelect={(league) => updateSetting(["league"], league)}
    >
      Which league is playing? Controls the logo in the top left and some scores and records.
    </Dropdown>

    <Input
      value={`${settingsStore.season || ""}`}
      onChange={(season) => updateSetting(["season"], _.parseInt(season as string))}
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

    <Checkbox
      checked={settingsStore.showSeries}
      onChange={(doShow) => updateSetting(["showSeries"], doShow)}
    >
      Show series record
    </Checkbox>

    <Input
      value={settingsStore.awayWins}
      onChange={(wins) => updateSetting(["awayWins"], parseInt(wins as string))}
    >
      Away Wins (if showing series record)
    </Input>

    <Input
      value={settingsStore.homeWins}
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

    The time frames below correspond to which games were used to generate stats.

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
      Show same stat time frames for away and home teams
    </Checkbox>

    {settingsStore.statTimeFramesSameForBothTeams ? <>
      <Radio
        selected={settingsStore.awayStatsTimeFrame}
        options={statsTimeFrames}
        onChange={(timeFrame) => {
          updateSetting(["awayStatsTimeFrame"], timeFrame);
          updateSetting(["homeStatsTimeFrame"], timeFrame);
        }}
      >
        Stats time frame. See above
      </Radio>
    </> : <>
      <h4>Away</h4>
      <Radio
        selected={settingsStore.awayStatsTimeFrame}
        options={statsTimeFrames}
        onChange={(timeFrame) => {
          updateSetting(["awayStatsTimeFrame"], timeFrame);
        }}
      >
        Away team stats time frame. See above
      </Radio>

      <h4>Home</h4>
      <Radio
        selected={settingsStore.awayStatsTimeFrame}
        options={statsTimeFrames}
        onChange={(timeFrame) => {
          updateSetting(["awayStatsTimeFrame"], timeFrame);
        }}
      >
        Home team stats time frame. See above
      </Radio>
    </>}

    <Checkbox
      checked={settingsStore.statCategoriesSameForBothTeams}
      onChange={(doShow) => updateSetting(["statCategoriesSameForBothTeams"], doShow)}
    >
      Show same stat categories for away and home teams
    </Checkbox>

    {settingsStore.statCategoriesSameForBothTeams ? <>
      <StatCategory
        name={"all-1"}
        statCategory={settingsStore.awayStatCategories.first}
        onChange={(newCategory) => {
          updateSetting(["awayStatCategories", "first"], newCategory)
          updateSetting(["homeStatCategories", "first"], newCategory)
        }}
      >
        Stat category 1
      </StatCategory>

      <StatCategory
        name={"all-2"}
        statCategory={settingsStore.awayStatCategories.second}
        onChange={(newCategory) => {
          updateSetting(["awayStatCategories", "second"], newCategory)
          updateSetting(["homeStatCategories", "second"], newCategory)
        }}
      >
        Stat category 2
      </StatCategory>

      <StatCategory
        name={"all-3"}
        statCategory={settingsStore.awayStatCategories.third}
        onChange={(newCategory) => {
          updateSetting(["awayStatCategories", "third"], newCategory)
          updateSetting(["homeStatCategories", "third"], newCategory)
        }}
      >
        Stat category 3
      </StatCategory>

      <StatCategory
        name={"all-4"}
        statCategory={settingsStore.awayStatCategories.fourth}
        onChange={(newCategory) => {
          updateSetting(["awayStatCategories", "fourth"], newCategory)
          updateSetting(["homeStatCategories", "fourth"], newCategory)
        }}
      >
        Stat category 4
      </StatCategory>

      <StatCategory
        name={"all-5"}
        statCategory={settingsStore.awayStatCategories.fifth}
        onChange={(newCategory) => {
          updateSetting(["awayStatCategories", "fifth"], newCategory)
          updateSetting(["homeStatCategories", "fifth"], newCategory)
        }}
      >
        Stat category 5
      </StatCategory>

      <StatCategory
        name={"all-6"}
        statCategory={settingsStore.awayStatCategories.sixth}
        onChange={(newCategory) => {
          updateSetting(["awayStatCategories", "sixth"], newCategory)
          updateSetting(["homeStatCategories", "sixth"], newCategory)
        }}
      >
        Stat category 6
      </StatCategory>
    </>
      :
      <>
        <h4>Away</h4>

        <StatCategory
          name={"away-1"}
          statCategory={settingsStore.awayStatCategories.first}
          onChange={(newCategory) => {
            updateSetting(["awayStatCategories", "first"], newCategory)
          }}
        >
          Away stat category 1
        </StatCategory>

        <StatCategory
          name={"away-2"}
          statCategory={settingsStore.awayStatCategories.second}
          onChange={(newCategory) => {
            updateSetting(["awayStatCategories", "second"], newCategory)
          }}
        >
          Away stat category 2
        </StatCategory>

        <StatCategory
          name={"away-3"}
          statCategory={settingsStore.awayStatCategories.third}
          onChange={(newCategory) => {
            updateSetting(["awayStatCategories", "third"], newCategory)
          }}
        >
          Away stat category 3
        </StatCategory>

        <StatCategory
          name={"away-4"}
          statCategory={settingsStore.awayStatCategories.fourth}
          onChange={(newCategory) => {
            updateSetting(["awayStatCategories", "fourth"], newCategory)
          }}
        >
          Away stat category 4
        </StatCategory>

        <StatCategory
          name={"away-5"}
          statCategory={settingsStore.awayStatCategories.fifth}
          onChange={(newCategory) => {
            updateSetting(["awayStatCategories", "fifth"], newCategory)
          }}
        >
          Away stat category 5
        </StatCategory>

        <StatCategory
          name={"away-6"}
          statCategory={settingsStore.awayStatCategories.sixth}
          onChange={(newCategory) => {
            updateSetting(["awayStatCategories", "sixth"], newCategory)
          }}
        >
          Away stat category 6
        </StatCategory>

        <h4>Home</h4>

        <StatCategory
          name={"home-1"}
          statCategory={settingsStore.homeStatCategories.first}
          onChange={(newCategory) => {
            updateSetting(["homeStatCategories", "first"], newCategory)
          }}
        >
          Home stat category 1
        </StatCategory>

        <StatCategory
          name={"home-2"}
          statCategory={settingsStore.homeStatCategories.second}
          onChange={(newCategory) => {
            updateSetting(["homeStatCategories", "second"], newCategory)
          }}
        >
          Home stat category 2
        </StatCategory>

        <StatCategory
          name={"home-3"}
          statCategory={settingsStore.homeStatCategories.third}
          onChange={(newCategory) => {
            updateSetting(["homeStatCategories", "third"], newCategory)
          }}
        >
          Home stat category 3
        </StatCategory>

        <StatCategory
          name={"home-4"}
          statCategory={settingsStore.homeStatCategories.fourth}
          onChange={(newCategory) => {
            updateSetting(["homeStatCategories", "fourth"], newCategory)
          }}
        >
          Home stat category 4
        </StatCategory>

        <StatCategory
          name={"home-5"}
          statCategory={settingsStore.homeStatCategories.fifth}
          onChange={(newCategory) => {
            updateSetting(["homeStatCategories", "fifth"], newCategory)
          }}
        >
          Home stat category 5
        </StatCategory>

        <StatCategory
          name={"home-6"}
          statCategory={settingsStore.homeStatCategories.sixth}
          onChange={(newCategory) => {
            updateSetting(["homeStatCategories", "sixth"], newCategory)
          }}
        >
          Home stat category 6
        </StatCategory>
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
      onChange={(value) => {
        settingsDispatch({
          type: "set",
          payload: { path: ["headlines"], value }
        })
      }}
    >
      Headlines
    </TextArea>

    <h3>Current Settings</h3>
    Copy this if you want to share your settings with someone else, or just paste them into the ticker settings in the OBS browser.
    <pre className="pre-wrap">{JSON.stringify(settingsStore)}</pre>

    <button style={{ cursor: 'pointer', width: "10em" }} onClick={() => settingsDispatch({ type: "reset-all" })}>Reset settings</button>
  </div >;
}
