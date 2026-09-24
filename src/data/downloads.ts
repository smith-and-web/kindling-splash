export const APP_VERSION = '1.3.0';

const BASE_URL = 'https://github.com/smith-and-web/kindling/releases/latest/download';

/*
 * `size` is the download, measured from the v1.3.0 release assets on
 * 24 Sep 2026: .dmg 21.1 MB, -setup.exe 7.7 MB, .AppImage 85.9 MB. The site
 * said "~10 MB" for all three, 8.6x too small for Linux. Re-measure when a
 * release changes the bundle; `gh release view` lists the asset sizes.
 */

export const DOWNLOADS = {
  mac: {
    label: 'macOS',
    icon: 'apple',
    url: `${BASE_URL}/Kindling_${APP_VERSION}_universal.dmg`,
    size: '~21 MB',
    note: 'Intel & Apple Silicon',
    sysReq: 'macOS 12 (Monterey) or later',
    format: '.dmg',
  },
  windows: {
    label: 'Windows',
    icon: 'windows',
    url: `${BASE_URL}/Kindling_${APP_VERSION}_x64-setup.exe`,
    size: '~8 MB',
    note: 'Windows 10+',
    sysReq: 'Windows 10 or later',
    format: '.exe',
  },
  linux: {
    label: 'Linux',
    icon: 'linux',
    url: `${BASE_URL}/Kindling_${APP_VERSION}_amd64.AppImage`,
    size: '~86 MB',
    note: 'x86_64 AppImage',
    sysReq: 'x86_64 Linux',
    format: '.AppImage',
  },
} as const;

export type Platform = keyof typeof DOWNLOADS;
