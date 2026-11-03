const path = require('path');

// If running in production or cloud host (PORT set) or UNIFIED mode
const isCloudOrProd = process.env.NODE_ENV === 'production' || !!process.env.PORT;

if (isCloudOrProd || process.env.UNIFIED === 'true') {
  console.log('====================================================');
  console.log('⚡ Starting Dhani Tech Unified Production Server');
  console.log('====================================================');
  require('./backend/server.js');
} else {
  // Local development mode: Spawns Backend (:5000) and Frontend (:4000)
  const { spawn } = require('child_process');
  const rootDir = __dirname;
  const backendDir = path.join(rootDir, 'backend');
  const frontendDir = path.join(rootDir, 'frontend');

  console.log('====================================================');
  console.log('🚀 Starting Portfolio Backend (:5000) & Frontend (:4000)');
  console.log('====================================================');

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

  function shutdown() {
    console.log('\nStopping servers...');
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
    process.exit();
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
