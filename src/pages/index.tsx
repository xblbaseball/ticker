import Head from "next/head";
import { useSearchParams } from 'next/navigation';

import getCareers from "@/client/careers";
import getSeason from "@/client/seasons";
import NewsFrame from "@/components/news-frame";
import { ConstantsContext } from "@/store/constants.context";
import { ConstantsStore } from "@/store/constants.reducer";
import { StatsContext } from "@/store/stats.context";
import { StatsStore } from "@/store/stats.reducer";
import listPublicLogos from "@/client/logos";

export default function News({ statsStore, constantsStore }: { statsStore: StatsStore, constantsStore: ConstantsStore }) {
  const searchParams = useSearchParams()

  const xblPlayoffs = searchParams.get('xbl-playoffs') === "true";
  const aaaPlayoffs = searchParams.get('aaa-playoffs') === "true";
  const aaPlayoffs = searchParams.get('aa-playoffs') === "true";

  return <>
    <Head>
      <title>XBL Broadcast News</title>
      <meta name="description" content="XBL scores, stats, and more" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <ConstantsContext.Provider value={constantsStore}>
      <StatsContext.Provider value={
        {
          ...statsStore,
          ...{ playoffs: { XBL: xblPlayoffs, AAA: aaaPlayoffs, AA: aaPlayoffs } }
        }}>
        <NewsFrame />
      </StatsContext.Provider>
    </ConstantsContext.Provider>
  </>
}

/** at build time, inject all of the stats and some info on the logos into the page */
export async function getStaticProps() {
  const props = {
    statsStore: {
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
    },
    constantsStore: {
      allLogos: listPublicLogos()
    }
  } as {
    statsStore: StatsStore;
    constantsStore: ConstantsStore;
  }

  return { props };
}
