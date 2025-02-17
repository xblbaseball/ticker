import fs from 'fs';
import path from 'path';

/** get the g sheets JSON from one of the files we cached */
export default function getLocalJson(filename: string) {
  const filePath = path.join(process.cwd(), 'public', 'json', filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  // TODO error handling

  return JSON.parse(fileContents);
}