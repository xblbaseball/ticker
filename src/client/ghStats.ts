/** get stats that are aggregated and served at xblbaseball.github.io/stats */
export default async function ghStats<T>(filepath: string | string[]) {
  let route = "";
  switch (typeof(filepath)) {
    case "string":
      route = filepath;
      break;
    default:
      route = filepath.join("/")
      break;
  }

  const url = `https://xblbaseball.github.io/stats/${route}`;
  const res = await fetch(url);
  const data: T = await res.json();
  return data;
}