// Force Next.js to use the current Node.js executable
// This script directly spawns Next.js using the same Node.js that runs this script

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log(`Using Node.js ${process.version} from ${process.execPath}`);

// Ensure .npmrc exists with legacy-peer-deps
fs.writeFileSync('.npmrc', 'legacy-peer-deps=true\n');

// Get the path to the node_modules/.bin directory
const binDir = path.join(process.cwd(), 'node_modules', '.bin');
const isWindows = process.platform === 'win32';
const nextBin = path.join(binDir, isWindows ? 'next.cmd' : 'next');

// Check if next binary exists
if (!fs.existsSync(nextBin)) {
  console.error(`Next.js binary not found at ${nextBin}`);
  console.error('Make sure you have installed dependencies with npm install');
  process.exit(1);
}

console.log(`Starting Next.js using ${nextBin}...`);

// Spawn the Next.js process with the same Node.js executable
const nextProcess = spawn(isWindows ? nextBin : process.execPath, 
                         isWindows ? [] : [nextBin, 'dev'], 
                         { 
                           stdio: 'inherit',
                           env: {
                             ...process.env,
                             NEXT_TELEMETRY_DISABLED: '1',
                             NODE_OPTIONS: '--no-deprecation'
                           }
                         });

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
});

process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
});

nextProcess.on('close', (code) => {
  console.log(`Next.js exited with code ${code}`);
}); 