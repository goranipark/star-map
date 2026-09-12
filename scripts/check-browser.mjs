import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const port = 4187;
const url = `http://127.0.0.1:${port}`;
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'inherit', windowsHide: true });
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (preview.exitCode !== null) throw new Error('Preview exited before becoming ready');
    try { if ((await fetch(url)).ok) { ready = true; break; } } catch { /* starting */ }
    await delay(250);
  }
  if (!ready) throw new Error('Preview did not become ready');
  for (const [script, env] of [
    ['check-welcome.mjs', {}],
    ['check-local-sky.mjs', {}],
    ['check-weaver.mjs', { WEAVER_FULL: '0' }],
    ['check-weaver.mjs', { WEAVER_FULL: '1' }],
    ['check-preservation.mjs', {}],
    ['check-reset.mjs', {}],
    ['check-offline.mjs', {}],
  ]) {
    const child = spawn(process.execPath, [`scripts/${script}`], {
      env: { ...process.env, PREVIEW_URL: url, ...env }, stdio: 'inherit', windowsHide: true,
    });
    const timer = setTimeout(() => child.kill(), 120_000);
    const [code] = await once(child, 'exit');
    clearTimeout(timer);
    if (code !== 0) throw new Error(`${script} failed (${code})`);
    // Windows에서 직전 Edge 프로세스가 완전히 정리되기 전에 다음 다중 탭 검사를
    // 시작하면 포인터 입력을 놓칠 수 있어 짧게 양보한다.
    await delay(750);
  }
} finally {
  if (preview.exitCode === null) {
    const stopped = once(preview, 'exit');
    preview.kill();
    await stopped;
  }
}
