import fs from 'fs';
import { compile } from 'json-schema-to-typescript'

/** get stats that are aggregated and served at xblbaseball.github.io/stats */
async function ghStats(filepath: string | string[]) {
  let route = "";
  switch (typeof (filepath)) {
    case "string":
      route = filepath;
      break;
    default:
      route = filepath.join("/")
      break;
  }

  const url = `https://xblbaseball.github.io/stats/${route}`;
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

async function main() {
  const seasonSchema = await ghStats(["schemas", "season-schema.json"]);
  const careerSchema = await ghStats(["schemas", "careers-schema.json"]);

  compile(seasonSchema, 'Season').then(
    (ts) => {
      fs.writeFileSync('src/typings/season.d.ts', ts)
    }
  );

  compile(careerSchema, 'Careers').then(
    (ts) => {
      fs.writeFileSync('src/typings/careers.d.ts', ts)
    }
  );
}

main();