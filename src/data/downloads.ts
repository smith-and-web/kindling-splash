export const APP_VERSION = '1.2.0';

const BASE_URL = 'https://github.com/smith-and-web/kindling/releases/latest/download';

export const DOWNLOADS = {
  mac: {
    label: 'macOS',
    icon: 'apple',
    url: `${BASE_URL}/Kindling_${APP_VERSION}_universal.dmg`,
    size: '~10 MB',
    note: 'Universal — Intel & Apple Silicon',
    sysReq: 'macOS 12 (Monterey) or later',
    format: '.dmg',
  },
  windows: {
    label: 'Windows',
    icon: 'windows',
    url: `${BASE_URL}/Kindling_${APP_VERSION}_x64-setup.exe`,
    size: '~10 MB',
    note: 'Windows 10+',
    sysReq: 'Windows 10 or later',
    format: '.exe',
  },
  linux: {
    label: 'Linux',
    icon: 'linux',
    url: `${BASE_URL}/Kindling_${APP_VERSION}_amd64.AppImage`,
    size: '~10 MB',
    note: 'x86_64 AppImage',
    sysReq: 'x86_64 Linux',
    format: '.AppImage',
  },
} as const;

export type Platform = keyof typeof DOWNLOADS;
