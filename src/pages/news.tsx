import Head from "next/head";
import { useSearchParams } from 'next/navigation';

import getCareers from "@/client/careers";
import getSeason from "@/client/seasons";
import NewsFrame from "@/components/news-frame";
import { StatsContext } from "@/store/stats.context";
import { StatsStore } from "@/store/stats.reducer";

export default function News(props: StatsStore) {
  const searchParams = useSearchParams()

  const xblPlayoffs = searchParams.get('xbl-playoffs') === "true";
  const aaaPlayoffs = searchParams.get('aaa-playoffs') === "true";
  const aaPlayoffs = searchParams.get('aa-playoffs') === "true";

  props.playoffs.XBL = xblPlayoffs;
  props.playoffs.AAA = aaaPlayoffs;
  props.playoffs.AA = aaPlayoffs;

  return <>
    <Head>
      <title>XBL Broadcast News</title>
      <meta name="description" content="XBL scores, stats, and more" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <StatsContext.Provider value={props}>
      <NewsFrame />
    </StatsContext.Provider>
  </>
}

/** at build time, parse all the data from sheets and inject it into the page */
export async function getStaticProps() {
  const props: StatsStore = {
    stats: {
      careers: await getCareers(),
      XBL: await getSeason("XBL"),
      AAA: await getSeason("AAA"),
      AA: await getSeason("AA"),
    },
    playoffs: {
      XBL: false,
      AAA: false,
      AA: false,
    }
  };
  return { props };
}
