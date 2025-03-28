import fs from "fs";
import path from "path";

/** get a list of all logos available */
export default function listPublicLogos(directory="public/logos", current: string[] = []) {
  const ret: string[] = current;

  try {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        ret.push(file);
      } else if (stats.isDirectory()) {
        return listPublicLogos(filePath, current=ret);
      }
    });
  } catch (err) {
    console.error("Error reading directory:", err);
  }

  return ret;
}
