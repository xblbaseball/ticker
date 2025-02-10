import fs from 'fs';
import path from 'path';
import { League } from "@/typings/league";

/** get the g sheets JSON from one of the files we cached */
export default function getLocalJson(league: League, tab: string) {
  const filePath = path.join(process.cwd(), 'public', 'json', 'raw', `${league}__${tab}.json`);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  // TODO error handling

  return JSON.parse(fileContents);
}