import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <style>
          {`
            /* inline scores-plus animation CSS to guarantee it's there when scores need to rotate */

            /* interval matches the interval for swapping out scores in components/scores-plus.tsx */
            .scores-plus-fade {
              animation: fade 15s ease 0s infinite forwards;
            }

            @keyframes fade {
              0% {
                transform: translateY(30px);
                opacity: 0;
              }

              5% {
                transform: translateY(0px);
                opacity: 1;
              }

              95% {
                transform: translateY(0px);
                opacity: 1;
              }

              100% {
                transform: translateY(-30px);
                opacity: 0;
              }
            }
          `}
        </style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
