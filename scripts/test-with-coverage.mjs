import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const coverageDir = path.resolve('.coverage', 'v8');
fs.rmSync(coverageDir, { recursive: true, force: true });
fs.mkdirSync(coverageDir, { recursive: true });

const result = spawnSync('npm', ['run', 'test'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_V8_COVERAGE: coverageDir,
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
