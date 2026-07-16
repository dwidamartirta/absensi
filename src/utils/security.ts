/**
 * Security Utilities for GPS Anti-Spoofing & Time Tampering Verification
 * Absensi Mobile PWA - PT. Dwi Damar Tirta
 */

export interface GPSMeasurement {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface SecurityStatus {
  isValid: boolean;
  reason?: string;
  details?: {
    webdriverDetected: boolean;
    perfectAccuracy: boolean;
    zeroDrift: boolean;
    timeOutSync: boolean;
    timeDifferenceMin: number;
  };
}

// Global server time drift in milliseconds (LocalTime - ServerTime)
// Updated automatically by Axios Interceptor on every response
let serverTimeDrift = 0;

export const setServerTimeDrift = (driftMs: number) => {
  serverTimeDrift = driftMs;
  localStorage.setItem('ddt_server_time_drift', String(driftMs));
};

export const getServerTimeDrift = (): number => {
  if (serverTimeDrift === 0) {
    const stored = localStorage.getItem('ddt_server_time_drift');
    if (stored) {
      serverTimeDrift = Number(stored);
    }
  }
  return serverTimeDrift;
};

/**
 * Check if the device's system time is manipulated (Out of Sync with Server)
 */
export const checkTimeTampering = (): { isTampered: boolean; diffMinutes: number } => {
  const drift = getServerTimeDrift();
  const diffMinutes = Math.abs(drift) / (1000 * 60);
  
  // Flag as tampered if time difference is greater than 5 minutes
  return {
    isTampered: diffMinutes > 5,
    diffMinutes: Math.round(diffMinutes * 10) / 10
  };
};

/**
 * Check if automated test tools (Selenium, Puppeteer, Cypress) are being used
 */
export const isAutomationDetected = (): boolean => {
  return !!(
    navigator.webdriver ||
    (window as any).document.documentElement.getAttribute('webdriver') ||
    (window as any)._phantom ||
    (window as any).callPhantom
  );
};

/**
 * Analyze GPS measurements for mock location spoofing.
 * Heuristics applied:
 * 1. Zero-Drift (Statis Sempurna): Real GPS has atmospheric/satellite/sensor jitter.
 *    If two measurements separated by time have exactly identical coordinates (down to 15 decimal places),
 *    it indicates mock location software injecting static coordinates.
 * 2. Perfect Accuracy Integer: Mock providers often hardcode accuracy to exact integers (like exactly 0, 1, 10, 15).
 *    Real GPS accuracy is a high-precision float (e.g. 14.8391823).
 */
export const analyzeGPSPerformance = (
  m1: GPSMeasurement,
  m2: GPSMeasurement
): { isMock: boolean; reason: string; zeroDrift: boolean; perfectAccuracy: boolean } => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Heuristic 1: Perfect Accuracy Check (0 or 1 meter exactly, or perfect static integer like exactly 15.00000000)
  // Accuracy from a real mobile device GPS chip is almost never exactly 0 or 1, and always has float residuals.
  const isPerfectIntAccuracy = m2.accuracy === 0 || m2.accuracy === 1 || (Number.isInteger(m2.accuracy) && m2.accuracy < 10);
  
  // Heuristic 2: Zero-Drift Check (Statis Sempurna)
  // Only highly relevant on mobile devices where GPS sensors are active.
  // If the coordinates match to 14 decimal places after 1-2 seconds, it's highly suspicious.
  const latDiff = Math.abs(m1.latitude - m2.latitude);
  const lngDiff = Math.abs(m1.longitude - m2.longitude);
  const isZeroDrift = latDiff === 0 && lngDiff === 0;

  let isMock = false;
  let reason = '';

  if (isMobile) {
    if (isZeroDrift && m2.accuracy < 30) {
      isMock = true;
      reason = 'GPS Statis Sempurna (Terdeteksi Fake GPS App / Mock Location)';
    } else if (isPerfectIntAccuracy) {
      isMock = true;
      reason = 'Akurasi GPS Tidak Normal (Akurasi Terlalu Sempurna)';
    }
  } else {
    // Desktop check (be more lenient but still alert if webdriver or extreme accuracy)
    if (isPerfectIntAccuracy && m2.accuracy === 0) {
      isMock = true;
      reason = 'Akurasi GPS 0 meter (Lokasi Mocked)';
    }
  }

  return {
    isMock,
    reason,
    zeroDrift: isZeroDrift,
    perfectAccuracy: isPerfectIntAccuracy
  };
};

/**
 * Run a full security audit on current environment and captured GPS data
 */
export const runSecurityAudit = (
  m1: GPSMeasurement | null,
  m2: GPSMeasurement
): SecurityStatus => {
  const webdriverDetected = isAutomationDetected();
  const timeSync = checkTimeTampering();
  
  let gpsAnalysis = { isMock: false, reason: '', zeroDrift: false, perfectAccuracy: false };
  if (m1) {
    gpsAnalysis = analyzeGPSPerformance(m1, m2);
  } else {
    // Single measurement checks (perfect accuracy)
    const isPerfectInt = m2.accuracy === 0 || m2.accuracy === 1;
    if (isPerfectInt) {
      gpsAnalysis.isMock = true;
      gpsAnalysis.perfectAccuracy = true;
      gpsAnalysis.reason = 'Akurasi GPS Tidak Valid (Mocked)';
    }
  }

  const isValid = !webdriverDetected && !timeSync.isTampered && !gpsAnalysis.isMock;
  
  let reason = '';
  if (webdriverDetected) reason = 'Deteksi Penggunaan Bot/Otomasi Browser!';
  else if (timeSync.isTampered) reason = `Jam perangkat tidak sinkron dengan server (${timeSync.diffMinutes} menit selisih). Silakan aktifkan opsi 'Atur Waktu Otomatis' di HP Anda.`;
  else if (gpsAnalysis.isMock) reason = gpsAnalysis.reason || 'Terdeteksi Lokasi Palsu (Fake GPS)!';

  return {
    isValid,
    reason,
    details: {
      webdriverDetected,
      perfectAccuracy: gpsAnalysis.perfectAccuracy,
      zeroDrift: gpsAnalysis.zeroDrift,
      timeOutSync: timeSync.isTampered,
      timeDifferenceMin: timeSync.diffMinutes
    }
  };
};
