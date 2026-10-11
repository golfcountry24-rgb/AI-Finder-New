/**
 * Stand-alone fake FreeSerp for local checks that run outside the browser
 * (build-time pre-render, site.php): `node e2e/mock-api-server.js 4599`
 * then PRERENDER_API=http://127.0.0.1:4599/api.php npm run build.
 */
import { createServer } from 'node:http';
import { fakeApi } from './fixtures.js';

const port = Number(process.argv[2]) || 4599;
createServer((req, res) => {
  const url = new URL(req.url, 'http://local');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(fakeApi(url.searchParams)));
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`fake FreeSerp on http://127.0.0.1:${port}/api.php\n`);
});
