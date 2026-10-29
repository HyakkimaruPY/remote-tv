// Compatibility profile only. No Luna services, LG power actions, or webOS native APIs on Philco.
export const simulatorMode = true;
export function getWebOSVersion(){return 3;}
export function isWebOS25(){return false;}
export function isLegacyWebOS(){return true;}
