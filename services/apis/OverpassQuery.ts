export function buildQuery(
  lat: number,
  lon: number,
  category: string
) {
  return `
[out:json][timeout:25];

(
node
["shop"~"${category}",i]
(around:10000,${lat},${lon});

way
["shop"~"${category}",i]
(around:10000,${lat},${lon});

relation
["shop"~"${category}",i]
(around:10000,${lat},${lon});
);

out center tags;
`;
}