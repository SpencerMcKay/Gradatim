// build.js — pre-compile JSX so the browser doesn't have to run Babel at load time.
// Reads every *.jsx in project/, transforms via lib/babel.min.js in a Node VM
// context, writes *.js next to the source.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval };
ctx.global = ctx; ctx.self = ctx; ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'lib/babel.min.js'), 'utf8'), ctx);

const SRC = path.join(__dirname, 'project');
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.jsx'));

for (const f of files) {
  const src = fs.readFileSync(path.join(SRC, f), 'utf8');
  const { code } = ctx.Babel.transform(src, {
    presets: ['react'],
    // Match what the browser-side @babel/standalone would emit; no module wrapping.
    sourceType: 'script',
  });
  const out = path.join(SRC, f.replace(/\.jsx$/, '.js'));
  fs.writeFileSync(out, code);
  console.log(`build: ${f} → ${path.basename(out)} (${code.length} bytes)`);
}

console.log(`done: ${files.length} files`);
