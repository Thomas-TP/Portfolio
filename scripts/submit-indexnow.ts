export {};

const host = 'thomastp.ch';
const key = '868956aab9774265b45be51ee46672bb';
const keyLocation = `https://${host}/${key}.txt`;

const urlList = [
  `https://${host}/`,
  `https://${host}/?lng=en`,
  `https://${host}/sitemap.xml`,
  `https://${host}/llms.txt`,
];

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify({
    host,
    key,
    keyLocation,
    urlList,
  }),
});

const body = await response.text();

console.log(`IndexNow ${response.status} ${response.statusText}`);
if (body) console.log(body);

if (!response.ok && response.status !== 202) {
  process.exit(1);
}
