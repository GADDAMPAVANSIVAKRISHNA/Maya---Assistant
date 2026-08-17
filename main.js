const { app, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let chatWindow = null;
let tray = null;
let isListening = false;

// ============ APP CONFIGURATION ============
// Map of app names to their executable names
const APP_MAP = {
  'notepad': 'notepad.exe',
  'calculator': 'calc.exe',
  'chrome': 'chrome.exe',
  'firefox': 'firefox.exe',
  'edge': 'msedge.exe',
  'vs code': 'code.exe',
  'vscode': 'code.exe',
  'visual studio code': 'code.exe',
  'spotify': 'spotify.exe',
  'discord': 'discord.exe',
  'slack': 'slack.exe',
  'teams': 'teams.exe',
  'outlook': 'outlook.exe',
  'word': 'winword.exe',
  'excel': 'excel.exe',
  'powerpoint': 'powerpnt.exe',
  'explorer': 'explorer.exe',
  'file explorer': 'explorer.exe',
  'task manager': 'taskmgr.exe',
  'cmd': 'cmd.exe',
  'command prompt': 'cmd.exe',
  'powershell': 'powershell.exe',
  'paint': 'mspaint.exe',
  'snipping tool': 'SnippingTool.exe',
  'gmail': 'https://mail.google.com',
  'youtube': 'https://youtube.com',
  'github': 'https://github.com'
};

// ============ CREATE WINDOWS ============

function createAvatarWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: 80,
    height: 80,
    x: width - 100,
    y: 50,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'public/index.html'));
  mainWindow.setVisibleOnAllWorkspaces(true);
}

function createChatWindow() {
  chatWindow = new BrowserWindow({
    width: 450,
    height: 650,
    frame: true,
    resizable: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  
  chatWindow.loadFile(path.join(__dirname, 'public/chat.html'));
  
  chatWindow.on('close', (event) => {
    event.preventDefault();
    chatWindow.hide();
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('🤖 Maya Assistant');
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '💬 Open Chat', click: () => chatWindow.show() },
    { label: '🎤 Start Voice', click: () => startVoiceRecognition() },
    { label: '📸 Screenshot', click: () => takeScreenshot() },
    { type: 'separator' },
    { label: '📝 Notepad', click: () => launchApp('notepad') },
    { label: '🌐 Chrome', click: () => launchApp('chrome') },
    { label: '💻 VS Code', click: () => launchApp('vs code') },
    { type: 'separator' },
    { label: '❌ Quit', click: () => app.quit() }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => chatWindow.show());
}

// ============ VOICE RECOGNITION ============

function startVoiceRecognition() {
  if (isListening) {
    stopVoiceRecognition();
    return;
  }
  
  isListening = true;
  
  mainWindow.webContents.send('voice-status', 'listening');
  chatWindow.webContents.send('voice-status', '🎤 Listening... Speak now!');
  
  // Use PowerShell for voice recognition (built into Windows)
  const psScript = `
    Add-Type -AssemblyName System.Speech
    $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $recognizer.SetInputToDefaultAudioDevice()
    $recognizer.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
    $result = $recognizer.Recognize([TimeSpan]::FromSeconds(5))
    if ($result) {
      Write-Output $result.Text
    }
  `;
  
  const tempFile = path.join(__dirname, 'temp_voice.ps1');
  fs.writeFileSync(tempFile, psScript);
  
  exec(`powershell -ExecutionPolicy Bypass -File "${tempFile}"`, (error, stdout, stderr) => {
    fs.unlinkSync(tempFile);
    
    const recognizedText = stdout.trim();
    console.log('🎤 Recognized:', recognizedText);
    
    if (recognizedText && recognizedText.length > 0) {
      chatWindow.webContents.send('voice-command', recognizedText);
      chatWindow.webContents.send('voice-status', `✅ Heard: "${recognizedText}"`);
      processVoiceCommand(recognizedText);
    } else {
      chatWindow.webContents.send('voice-status', '❌ No speech detected. Try again!');
      mainWindow.webContents.send('voice-status', 'idle');
    }
    
    isListening = false;
  });
}

function stopVoiceRecognition() {
  isListening = false;
  mainWindow.webContents.send('voice-status', 'idle');
  chatWindow.webContents.send('voice-status', '⏹️ Stopped listening');
}

// ============ PROCESS VOICE COMMANDS ============

function processVoiceCommand(command) {
  const lower = command.toLowerCase();
  let response = '';
  let action = null;

  // Check for app opening commands
  const appKeywords = ['open', 'launch', 'start', 'run'];
  let appName = null;
  
  for (const keyword of appKeywords) {
    if (lower.includes(keyword)) {
      // Extract app name after the keyword
      const parts = lower.split(keyword);
      if (parts.length > 1) {
        appName = parts[1].trim();
        break;
      }
    }
  }

  // If we found an app name, try to open it
  if (appName) {
    // Check if it's a website
    if (appName.includes('gmail') || appName.includes('mail')) {
      launchWebsite('https://mail.google.com');
      response = `📧 Opening Gmail in your browser...`;
    } else if (appName.includes('youtube')) {
      launchWebsite('https://youtube.com');
      response = `▶️ Opening YouTube...`;
    } else if (appName.includes('github')) {
      launchWebsite('https://github.com');
      response = `🐙 Opening GitHub...`;
    } else {
      // Try to find the app in our map
      let foundApp = null;
      for (const [key, value] of Object.entries(APP_MAP)) {
        if (appName.includes(key) || key.includes(appName)) {
          foundApp = value;
          break;
        }
      }
      
      if (foundApp) {
        if (foundApp.startsWith('http')) {
          launchWebsite(foundApp);
        } else {
          launchApp(foundApp);
        }
        response = `🚀 Opening ${appName}...`;
      } else {
        // Try to open it directly
        launchApp(appName);
        response = `🚀 Opening ${appName}...`;
      }
    }
    
    sendVoiceResponse(response);
    return;
  }

  // Other voice commands
  if (lower.includes('screenshot') || lower.includes('capture')) {
    takeScreenshot();
    response = '📸 Taking screenshot... Check your Desktop!';
  } else if (lower.includes('volume up') || lower.includes('increase volume')) {
    volumeUp();
    response = '🔊 Volume increased!';
  } else if (lower.includes('volume down') || lower.includes('decrease volume')) {
    volumeDown();
    response = '🔉 Volume decreased!';
  } else if (lower.includes('mute') || lower.includes('silent')) {
    volumeMute();
    response = '🔇 Volume muted!';
  } else if (lower.includes('time') || lower.includes('clock')) {
    response = `🕐 ${getCurrentTime()}`;
  } else if (lower.includes('brightness')) {
    const match = lower.match(/\d+/);
    if (match) {
      setBrightness(parseInt(match[0]));
      response = `☀️ Brightness set to ${match[0]}%`;
    } else {
      getBrightness().then(b => {
        chatWindow.webContents.send('voice-status', `☀️ Current brightness: ${b}%`);
      });
      response = '☀️ Checking brightness...';
    }
  } else if (lower.includes('help') || lower.includes('what can you do')) {
    response = `🤖 I can help you with:
• Open any app: "Open Chrome", "Open VS Code"
• Open websites: "Open Gmail", "Open YouTube"
• Take a screenshot
• Volume up/down/mute
• Brightness control
• Show time
• Just say what you need!`;
  } else if (lower.includes('hello') || lower.includes('hi')) {
    response = '👋 Hello! How can I help you today?';
  } else if (lower.includes('thank you') || lower.includes('thanks')) {
    response = '😊 You\'re welcome!';
  } else {
    response = `🤔 I heard: "${command}"\n\nTry saying:\n"Open Chrome"\n"Open VS Code"\n"Open Gmail"\n"Take a screenshot"`;
  }
  
  sendVoiceResponse(response);
}

function sendVoiceResponse(response) {
  setTimeout(() => {
    chatWindow.webContents.send('voice-response', response);
    // Speak the response using Windows TTS
    speakText(response);
  }, 500);
}

// ============ TEXT TO SPEECH ============

function speakText(text) {
  const cleanText = text.replace(/[^\w\s.,?!]/g, '').trim();
  if (cleanText.length > 0) {
    exec(`powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${cleanText}')"`);
  }
}

// ============ LAUNCH FUNCTIONS ============

function launchApp(appName) {
  // Check if it's a website
  if (appName.startsWith('http')) {
    launchWebsite(appName);
    return;
  }
  
  // Check our app map
  const lowerApp = appName.toLowerCase();
  let executable = null;
  
  for (const [key, value] of Object.entries(APP_MAP)) {
    if (lowerApp.includes(key) || key.includes(lowerApp)) {
      executable = value;
      break;
    }
  }
  
  if (!executable) {
    // Try using the app name directly
    executable = appName;
  }
  
  console.log(`🚀 Launching: ${executable}`);
  
  if (executable.startsWith('http')) {
    launchWebsite(executable);
    return;
  }
  
  // Try different ways to launch
  const commands = [
    `start "" "${executable}"`,
    `start ${executable}`,
    `"${executable}"`
  ];
  
  for (const cmd of commands) {
    exec(cmd, (error) => {
      if (!error) {
        console.log(`✅ Launched: ${executable}`);
        chatWindow.webContents.send('app-result', `✅ Opened ${appName}`);
        return;
      }
    });
  }
  
  // If all fail, try to find the app in common locations
  const commonPaths = [
    `C:\\Program Files\\${appName}\\${appName}.exe`,
    `C:\\Program Files (x86)\\${appName}\\${appName}.exe`,
    `C:\\Users\\${require('os').userInfo().username}\\AppData\\Local\\Programs\\${appName}\\${appName}.exe`,
  ];
  
  for (const path of commonPaths) {
    if (fs.existsSync(path)) {
      exec(`start "" "${path}"`);
      return;
    }
  }
}

function launchWebsite(url) {
  exec(`start ${url}`);
  chatWindow.webContents.send('app-result', `🌐 Opened ${url}`);
}

// ============ AUTOMATION FUNCTIONS ============

function takeScreenshot() {
  const timestamp = Date.now();
  const desktopPath = require('os').homedir() + '/Desktop';
  const filename = path.join(desktopPath, `screenshot_${timestamp}.png`);
  
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($screen.X, $screen.Y, 0, 0, $screen.Size)
    $bitmap.Save('${filename}')
    $bitmap.Dispose()
    $graphics.Dispose()
  `;
  
  exec(`powershell -Command "${psScript}"`, (error) => {
    if (error) {
      console.error('Screenshot error:', error);
      chatWindow.webContents.send('screenshot-result', '❌ Screenshot failed!');
    } else {
      console.log(`📸 Screenshot saved: ${filename}`);
      chatWindow.webContents.send('screenshot-result', `📸 Screenshot saved to Desktop!`);
      speakText('Screenshot taken and saved to desktop');
    }
  });
}

function getBrightness() {
  return new Promise((resolve) => {
    exec('powershell (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness',
      (error, stdout) => {
        if (error) resolve(50);
        else resolve(parseInt(stdout.trim()) || 50);
      }
    );
  });
}

function setBrightness(level) {
  const clamped = Math.min(100, Math.max(0, level));
  exec(`powershell (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(${clamped}, 0)`);
}

function volumeUp() {
  exec(`powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]174)"`);
}

function volumeDown() {
  exec(`powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"`);
}

function volumeMute() {
  exec(`powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"`);
}

function getCurrentTime() {
  return new Date().toLocaleString();
}

// ============ IPC HANDLERS ============

ipcMain.handle('take-screenshot', () => {
  takeScreenshot();
  return 'Screenshot taken!';
});

ipcMain.handle('launch-app', (event, appName) => {
  launchApp(appName);
  return `Opening ${appName}...`;
});

ipcMain.handle('get-brightness', async () => {
  return await getBrightness();
});

ipcMain.handle('set-brightness', (event, level) => {
  setBrightness(level);
  return `Brightness set to ${level}%`;
});

ipcMain.handle('volume-up', () => {
  volumeUp();
  return 'Volume up!';
});

ipcMain.handle('volume-down', () => {
  volumeDown();
  return 'Volume down!';
});

ipcMain.handle('volume-mute', () => {
  volumeMute();
  return 'Volume muted!';
});

ipcMain.handle('get-time', () => {
  return getCurrentTime();
});

ipcMain.handle('start-voice', () => {
  startVoiceRecognition();
  return 'Voice started!';
});

ipcMain.on('show-chat', () => {
  chatWindow.show();
});

// ============ APP LIFECYCLE ============

app.whenReady().then(() => {
  createAvatarWindow();
  createChatWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});