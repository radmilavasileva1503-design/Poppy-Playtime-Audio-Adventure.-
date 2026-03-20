import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace opening tags
content = content.replace(/<button/g, '<motion.button whileTap={{ scale: 0.95 }}');

// Replace closing tags
content = content.replace(/<\/button>/g, '</motion.button>');

fs.writeFileSync('src/App.tsx', content);
console.log('Done');
