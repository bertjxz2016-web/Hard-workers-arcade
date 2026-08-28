const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const stylesheets = ['style.css', 'task-builder.css', 'economy.css', 'spin-wheel.css', 'arcade.css'];
const scripts = ['arcade-games.js', 'script.js'];

let page = read('index.html');
page = page.replace(/  <link rel="stylesheet" href="[^"]+">\r?\n/g, '');
page = page.replace(
  '</head>',
  '<style>\n' + stylesheets.map(read).join('\n\n') + '\n</style>\n</head>'
);
page = page.replace(
  /  <script src="[^"]*arcade-games\.js[^"]*"><\/script>\r?\n  <script src="[^"]*script\.js[^"]*"><\/script>/,
  scripts.map(file => '<script>\n' + read(file) + '\n</script>').join('\n')
);

const worker = [
  'const page = ' + JSON.stringify(page) + ';',
  '',
  'export default {',
  '  async fetch(request) {',
  '    const url = new URL(request.url);',
  "    if (url.pathname === '/' || url.pathname === '/index.html') {",
  "      return new Response(page, { headers: { 'content-type': 'text/html; charset=UTF-8' } });",
  '    }',
  "    return new Response('Not found', { status: 404 });",
  '  }',
  '};',
  ''
].join('\n');

const output = path.join(root, 'dist', 'server', 'index.js');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, worker);
const hostedMetadata = path.join(root, 'dist', '.openai', 'hosting.json');
fs.mkdirSync(path.dirname(hostedMetadata), { recursive: true });
fs.copyFileSync(path.join(root, '.openai', 'hosting.json'), hostedMetadata);
console.log('Built static worker:', output);
