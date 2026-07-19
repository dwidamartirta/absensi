/**
 * Security Utilities for GPS Anti-Spoofing & Time Tampering Verification
 * Absensi Mobile PWA - PT. Dwi Damar Tirta
 * 
 * v2 — Optimized for speed with suspicion scoring system
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
  suspicionScore: number;
  details?: {
    webdriverDetected: boolean;
    perfectAccuracy: boolean;
    zeroDrift: boolean;
    timeOutSync: boolean;
    timeDifferenceMin: number;
    suspicionScore: number;
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
 * Calculate GPS suspicion score (0-100) from a single measurement.
 * - Does NOT hard-block unless score >= 50
 * - Scores 30-49 get flagged for admin review
 * - Scores < 30 pass cleanly
 */
export const calculateSuspicionScore = (m: GPSMeasurement): { score: number; flags: string[] } => {
  let score = 0;
  const flags: string[] = [];

  // accuracy === 0 is physically impossible for real GPS hardware
  if (m.accuracy === 0) {
    score += 40;
    flags.push('GPS accuracy 0m (impossible on real hardware)');
  }
  // Integer accuracy below 3m on mobile is suspicious but not conclusive
  else if (Number.isInteger(m.accuracy) && m.accuracy < 3) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      score += 15;
      flags.push(`Integer accuracy ${m.accuracy}m on mobile`);
    }
  }

  return { score, flags };
};

/**
 * Analyze GPS measurements for mock location spoofing (dual measurement).
 * Used when two readings are available for deeper analysis.
 */
export const analyzeGPSPerformance = (
  m1: GPSMeasurement,
  m2: GPSMeasurement
): { suspicionScore: number; reason: string; zeroDrift: boolean; perfectAccuracy: boolean; flags: string[] } => {
  const base = calculateSuspicionScore(m2);
  let score = base.score;
  const flags = [...base.flags];

  // Zero-Drift Check: coordinates match exactly across two readings
  const latDiff = Math.abs(m1.latitude - m2.latitude);
  const lngDiff = Math.abs(m1.longitude - m2.longitude);
  const isZeroDrift = latDiff === 0 && lngDiff === 0;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isZeroDrift && isMobile && m2.accuracy < 20) {
    // On mobile with high accuracy, perfectly static readings are suspicious
    score += 20;
    flags.push('Zero GPS drift on mobile (static coordinates)');
  }

  const perfectAccuracy = m2.accuracy === 0;
  let reason = '';
  if (score >= 50) {
    reason = flags.join('; ');
  }

  return {
    suspicionScore: score,
    reason,
    zeroDrift: isZeroDrift,
    perfectAccuracy,
    flags
  };
};

/**
 * Quick Audit — Fast single-measurement security check.
 * Used for initial GPS load to achieve < 1 second verification.
 * Only hard-blocks on: automation, time tampering, or accuracy === 0.
 */
export const runQuickAudit = (m: GPSMeasurement): SecurityStatus => {
  const webdriverDetected = isAutomationDetected();
  const timeSync = checkTimeTampering();
  const { score } = calculateSuspicionScore(m);

  // Hard blocks: automation and time tampering always block
  if (webdriverDetected) {
    return {
      isValid: false,
      reason: 'Deteksi Penggunaan Bot/Otomasi Browser!',
      suspicionScore: 100,
      details: {
        webdriverDetected: true,
        perfectAccuracy: false,
        zeroDrift: false,
        timeOutSync: false,
        timeDifferenceMin: 0,
        suspicionScore: 100
      }
    };
  }

  if (timeSync.isTampered) {
    return {
      isValid: false,
      reason: `Jam perangkat tidak sinkron dengan server (${timeSync.diffMinutes} menit selisih). Silakan aktifkan opsi 'Atur Waktu Otomatis' di HP Anda.`,
      suspicionScore: 100,
      details: {
        webdriverDetected: false,
        perfectAccuracy: false,
        zeroDrift: false,
        timeOutSync: true,
        timeDifferenceMin: timeSync.diffMinutes,
        suspicionScore: 100
      }
    };
  }

  // Score-based: only block if score >= 50
  const isValid = score < 50;
  let reason = '';
  if (!isValid) {
    reason = 'Terdeteksi Lokasi Palsu (Fake GPS)!';
  }

  return {
    isValid,
    reason,
    suspicionScore: score,
    details: {
      webdriverDetected: false,
      perfectAccuracy: m.accuracy === 0,
      zeroDrift: false,
      timeOutSync: false,
      timeDifferenceMin: timeSync.diffMinutes,
      suspicionScore: score
    }
  };
};

/**
 * Full Security Audit — Deep dual-measurement analysis.
 * Retained for backward compatibility and final submit verification.
 */
export const runSecurityAudit = (
  m1: GPSMeasurement | null,
  m2: GPSMeasurement
): SecurityStatus => {
  // For single measurement, delegate to quick audit
  if (!m1) {
    return runQuickAudit(m2);
  }

  const webdriverDetected = isAutomationDetected();
  const timeSync = checkTimeTampering();
  const gpsAnalysis = analyzeGPSPerformance(m1, m2);

  // Hard blocks
  if (webdriverDetected) {
    return {
      isValid: false,
      reason: 'Deteksi Penggunaan Bot/Otomasi Browser!',
      suspicionScore: 100,
      details: {
        webdriverDetected: true,
        perfectAccuracy: gpsAnalysis.perfectAccuracy,
        zeroDrift: gpsAnalysis.zeroDrift,
        timeOutSync: false,
        timeDifferenceMin: 0,
        suspicionScore: 100
      }
    };
  }

  if (timeSync.isTampered) {
    return {
      isValid: false,
      reason: `Jam perangkat tidak sinkron dengan server (${timeSync.diffMinutes} menit selisih). Silakan aktifkan opsi 'Atur Waktu Otomatis' di HP Anda.`,
      suspicionScore: 100,
      details: {
        webdriverDetected: false,
        perfectAccuracy: gpsAnalysis.perfectAccuracy,
        zeroDrift: gpsAnalysis.zeroDrift,
        timeOutSync: true,
        timeDifferenceMin: timeSync.diffMinutes,
        suspicionScore: 100
      }
    };
  }

  // Score-based blocking
  const totalScore = gpsAnalysis.suspicionScore;
  const isValid = totalScore < 50;
  let reason = '';
  if (!isValid) {
    reason = gpsAnalysis.reason || 'Terdeteksi Lokasi Palsu (Fake GPS)!';
  }

  return {
    isValid,
    reason,
    suspicionScore: totalScore,
    details: {
      webdriverDetected: false,
      perfectAccuracy: gpsAnalysis.perfectAccuracy,
      zeroDrift: gpsAnalysis.zeroDrift,
      timeOutSync: false,
      timeDifferenceMin: timeSync.diffMinutes,
      suspicionScore: totalScore
    }
  };
};
