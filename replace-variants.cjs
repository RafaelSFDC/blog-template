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

  // Replace component variants
  content = content.replace(/variant="zine"/g, 'variant="default"');
  content = content.replace(/variant='zine'/g, "variant='default'");
  content = content.replace(/variant="zine-outline"/g, 'variant="outline"');
  content = content.replace(/variant='zine-outline'/g, "variant='outline'");
  content = content.replace(/variant="zine-destructive"/g, 'variant="destructive"');
  content = content.replace(/variant='zine-destructive'/g, "variant='destructive'");
  content = content.replace(/variant="zine-secondary"/g, 'variant="secondary"');
  content = content.replace(/variant='zine-secondary'/g, "variant='secondary'");

  if (content !== original) {
    fs.writeFileSync(file, content);
    changedCount++;
    console.log(`Updated ${file.replace(__dirname, '')}`);
  }
});

console.log(`\nSuccessfully updated ${changedCount} files.`);
