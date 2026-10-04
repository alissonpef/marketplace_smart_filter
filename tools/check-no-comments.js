const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');

const ROOT = path.join(__dirname, '..');
const IGNORED = new Set(['node_modules', '.git']);

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (IGNORED.has(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function commentsIn(file, source) {
  const extension = path.extname(file);
  if (extension === '.js') {
    const found = [];
    acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'script', onComment: found });
    return found.map((comment) => comment.start);
  }
  const pattern = extension === '.css' ? /\/\*/g : extension === '.html' ? /<!--/g : null;
  return pattern ? [...source.matchAll(pattern)].map((match) => match.index) : [];
}

const offenders = listFiles(ROOT).flatMap((file) => {
  const source = fs.readFileSync(file, 'utf8');
  return commentsIn(file, source).map((offset) => {
    const line = source.slice(0, offset).split('\n').length;
    return `${path.relative(ROOT, file)}:${line}`;
  });
});

if (offenders.length) {
  console.error(`Comments found:\n${offenders.join('\n')}`);
  process.exit(1);
}
console.log('No comments found.');
