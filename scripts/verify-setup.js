#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying project setup...\n');

let hasErrors = false;

// Check required files
const requiredFiles = [
  'package.json',
  'backend/package.json',
  'frontend/package.json',
  'backend/tsconfig.json',
  'frontend/tsconfig.json',
  'backend/src/index.ts',
  'frontend/src/main.tsx',
  'docker-compose.yml',
  'backend/.env.example',
  'frontend/.env.example',
  'README.md'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    hasErrors = true;
  }
});

// Check if node_modules exist
console.log('\n📦 Checking dependencies...');
if (fs.existsSync('node_modules')) {
  console.log('  ✅ Root node_modules exists');
} else {
  console.log('  ⚠️  Root node_modules not found - run "npm install"');
}

if (fs.existsSync('backend/node_modules')) {
  console.log('  ✅ Backend node_modules exists');
} else {
  console.log('  ⚠️  Backend node_modules not found - run "npm install"');
}

if (fs.existsSync('frontend/node_modules')) {
  console.log('  ✅ Frontend node_modules exists');
} else {
  console.log('  ⚠️  Frontend node_modules not found - run "npm install"');
}

// Check environment files
console.log('\n🔐 Checking environment files...');
if (fs.existsSync('backend/.env')) {
  console.log('  ✅ backend/.env exists');
} else {
  console.log('  ⚠️  backend/.env not found - copy from backend/.env.example');
}

if (fs.existsSync('frontend/.env')) {
  console.log('  ✅ frontend/.env exists');
} else {
  console.log('  ⚠️  frontend/.env not found - copy from frontend/.env.example');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Setup verification failed - please fix the errors above');
  process.exit(1);
} else {
  console.log('✅ Setup verification passed!');
  console.log('\nYou can now:');
  console.log('  1. Start services: docker-compose up -d');
  console.log('  2. Install dependencies: npm install');
  console.log('  3. Start development: npm run dev');
}
console.log('='.repeat(50) + '\n');
