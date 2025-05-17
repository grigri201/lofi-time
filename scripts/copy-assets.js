const { cpSync, mkdirSync } = require('fs');
const { join } = require('path');

const root = process.cwd();
const dist = join(root, 'dist');

mkdirSync(dist, { recursive: true });

// Copy config.json
cpSync(join(root, 'config.json'), join(dist, 'config.json'));

// Copy assets directory recursively
cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true });

console.log('Assets and config.json copied to dist');


