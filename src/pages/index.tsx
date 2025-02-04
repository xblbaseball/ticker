import Head from "next/head";
import { useSearchParams } from 'next/navigation'
import getBALeaders from "@/client/ba-leaders"
import getHRLeaders from "@/client/hr-leaders"
import getKLeaders from "@/client/k-leaders"
import getPlayoffRecords from "@/client/playoff-records";
import getScoresPlayoffs from "@/client/scores-playoffs";
import getScoresRS from "@/client/scores-rs";
import getStandings from "@/client/standings"
import Bar from "@/components/bar";
import { IndexContext } from "@/store/index.context";
import { IndexStore } from "@/store/index.reducer";
import { League } from "@/typings/league";
import LeagueStats from "@/typings/league-stats";

export default function Home(props: IndexStore) {
  // TODO read query params. get playoffs and whatnot
  const searchParams = useSearchParams()

  const xblPlayoffs = searchParams.get('xbl-playoffs') === "true";
  const aaaPlayoffs = searchParams.get('aaa-playoffs') === "true";
  const aaPlayoffs = searchParams.get('aa-playoffs') === "true";

  props.XBL.showPlayoffs = xblPlayoffs;
  props.AAA.showPlayoffs = aaaPlayoffs;
  props.AA.showPlayoffs = aaPlayoffs;

  return <>
    <Head>
      <title>XBL Ticker v3</title>
      <meta name="description" content="XBL scores and more" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <IndexContext.Provider value={props}>
      <Bar />
    </IndexContext.Provider>
  </>
}

/** at build time, parse all the data from sheets and inject it into the page */
export async function getStaticProps() {
  const props: IndexStore = {
    XBL: {} as LeagueStats,
    AAA: {} as LeagueStats,
    AA: {} as LeagueStats,
  };
  for (const league of ["XBL", "AAA", "AA"] as League[]) {
    const standings = getStandings(league);
    props[league]['standings'] = standings;

    const scoresRS = getScoresRS(league);
    props[league]['scoresRS'] = scoresRS;

    const scoresPlayoffs = getScoresPlayoffs(league);
    props[league]['scoresPlayoffs'] = scoresPlayoffs;

    const playoffRecords = getPlayoffRecords(league);
    props[league]['playoffRecords'] = playoffRecords;

    const baLeaders = getBALeaders(league);
    props[league]['baLeaders'] = baLeaders;

    const kLeaders = getKLeaders(league);
    props[league]['kLeaders'] = kLeaders;

    const hrLeaders = getHRLeaders(league);
    props[league]['hrLeaders'] = hrLeaders;
  }
  return { props };
}
