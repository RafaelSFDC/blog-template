const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace utility classes
  content = content.replace(/border-4/g, 'border');
  content = content.replace(/border-3/g, 'border');
  content = content.replace(/border-2/g, 'border');
  
  content = content.replace(/shadow-zine-sm/g, 'shadow-sm');
  content = content.replace(/shadow-zine-hover/g, 'shadow-md');
  content = content.replace(/shadow-zine/g, 'shadow-md');
  content = content.replace(/shadow-toy/g, 'shadow-md');
  
  content = content.replace(/island-shell/g, 'bg-card border shadow-sm');
  content = content.replace(/zine-panel/g, 'bg-card border shadow-sm');
  content = content.replace(/zine-label/g, 'text-xs font-semibold uppercase tracking-wider');

  // Hex colors to remove if found
  content = content.replace(/#ff5c00/g, 'var(--primary)');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedCount++;
    console.log(`Updated ${file.replace(__dirname, '')}`);
  }
});

console.log(`\nSuccessfully updated ${changedCount} files with standard classes.`);
