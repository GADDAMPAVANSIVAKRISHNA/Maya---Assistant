import { exec } from 'child_process';
import screenshot from 'screenshot-desktop';
import robot from 'robotjs';

// Launch an app
export function launchApp(appName: string) {
  exec(`start ${appName}`);
}

// Get screen brightness (Windows)
export function getBrightness() {
  // Use Windows Management Instrumentation
  return new Promise((resolve) => {
    exec('powershell (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness', 
      (err, stdout) => resolve(parseInt(stdout)));
  });
}

// Take screenshot
export function captureScreen() {
  screenshot().then((img: Buffer) => {
    require('fs').writeFileSync('screenshot.png', img);
  });
}

// Type text
export function typeText(text: string) {
  robot.typeString(text);
}

// Press keys (e.g., Ctrl+C)
export function pressKey(key: string) {
  robot.keyTap(key);
}
