import fs from 'node:fs';

function assertContains(file, pattern, label) {
  const text = fs.readFileSync(file, 'utf8');
  if (!pattern.test(text)) throw new Error(`Missing ${label} in ${file}`);
}

assertContains('src/hooks/useMotionPreference.js', /MOTION_PREFERENCE/, 'motion preference constants');
assertContains('src/App.jsx', /whiz-motion-preference/, 'persistent motion preference setting');
assertContains('src/index.css', /:root\[data-motion='reduce'\]/, 'explicit reduced-motion override selector');
assertContains('src/index.css', /--motion-base-duration/, 'motion duration token');
assertContains('src/components/whizframe/FrameShell.jsx', /animationPlayState:\s*reduceMotion \? 'paused'/, 'ticker pause override');

console.log('motion reduction checks passed');
