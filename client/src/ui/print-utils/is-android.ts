/**
 * Check if the current device is Android
 * This function detects Android even when "Desktop mode" is enabled in Chrome
 */
export function isAndroid(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Check for Android in userAgent (works when desktop mode is OFF)
  if (/android/i.test(userAgent)) {
    return true;
  }

  // Check platform API (modern approach)
  if ((navigator as any).userAgentData) {
    const platform = (navigator as any).userAgentData.platform || '';
    if (/android/i.test(platform)) {
      return true;
    }
  }

  // Check traditional platform property
  if (navigator.platform && /android/i.test(navigator.platform)) {
    return true;
  }

  // Additional heuristic: Check for touch support combined with screen characteristics
  // This helps detect Android tablets even in "Desktop mode"
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isLikelyMobile = /Mobile|Tablet/i.test(userAgent) || window.matchMedia('(pointer: coarse)').matches;

  // If we have touch support and mobile-like characteristics, but not iOS, it's likely Android
  if (hasTouchScreen && isLikelyMobile) {
    // Make sure it's not iOS (iPad, iPhone)
    const isIOS = /iPad|iPhone|iPod/i.test(userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isIOS) {
      return true;
    }
  }

  return false;
}
