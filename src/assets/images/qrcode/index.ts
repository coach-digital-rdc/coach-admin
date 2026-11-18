import { default as QROpenAppNP } from './open_app_np.png';
import { default as QROpenAppSL } from './open_app_sl.png';
import { default as QROpenAppCD } from './open_app_cd.png';
export { default as QRScan } from './scan_qr.png';
export { default as QRSelectSchool } from './select_school.png';
const QROpenApps: Record<string, string> = { cd: QROpenAppCD, np: QROpenAppNP, sl: QROpenAppSL };
export const QROpenApp = QROpenApps[import.meta.env.VITE_COUNTRY] ?? QROpenAppSL;
