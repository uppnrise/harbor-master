// Platform detection utilities

export type Platform = 'windows' | 'macos' | 'linux';

export function getOS(): Platform {
  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.indexOf('win') !== -1) {
    return 'windows';
  } else if (userAgent.indexOf('mac') !== -1) {
    return 'macos';
  } else {
    return 'linux';
  }
}

export function isPlatform(platform: Platform): boolean {
  return getOS() === platform;
}

export function isWindows(): boolean {
  return isPlatform('windows');
}

export function isMacOS(): boolean {
  return isPlatform('macos');
}

export function isLinux(): boolean {
  return isPlatform('linux');
}

export function getPlatformName(): string {
  const os = getOS();
  switch (os) {
    case 'windows':
      return 'Windows';
    case 'macos':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return 'Unknown';
  }
}
