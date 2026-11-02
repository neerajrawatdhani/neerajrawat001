const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('====================================================');
console.log('🚀 Starting Portfolio Backend (:5000) & Frontend (:4000)');
console.log('====================================================');

// 1. Start Backend on port 5000
const backend = spawn('node', ['server.js'], {
  cwd: backendDir,
  env: { ...process.env, PORT: '5000' },
  stdio: 'pipe'
});

backend.stdout.on('data', data => {
  process.stdout.write(`[Backend:5000] ${data}`);
});

backend.stderr.on('data', data => {
  process.stderr.write(`[Backend:5000 ERR] ${data}`);
});

backend.on('exit', code => {
  console.log(`[Backend:5000] process exited with code ${code}`);
});

// 2. Start Frontend on port 4000
const frontend = spawn('node', ['server.js'], {
  cwd: frontendDir,
  env: { ...process.env, PORT: '4000', BACKEND_PORT: '5000' },
  stdio: 'pipe'
});

frontend.stdout.on('data', data => {
  process.stdout.write(`[Frontend:4000] ${data}`);
});

frontend.stderr.on('data', data => {
  process.stderr.write(`[Frontend:4000 ERR] ${data}`);
});

frontend.on('exit', code => {
  console.log(`[Frontend:4000] process exited with code ${code}`);
});

// Clean termination
function shutdown() {
  console.log('\nStopping servers...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
