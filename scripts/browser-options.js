export const browserOptions = {
  headless: true,
  channel: process.env.BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
};
