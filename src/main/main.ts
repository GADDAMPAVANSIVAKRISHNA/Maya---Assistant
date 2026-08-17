import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Check possible index.html paths for robustness
  const distPublicPath = path.join(__dirname, '../public/index.html');
  const rootPublicPath = path.join(__dirname, '../../public/index.html');
  const localPublicPath = path.join(__dirname, 'public/index.html');

  if (fs.existsSync(distPublicPath)) {
    mainWindow.loadFile(distPublicPath);
  } else if (fs.existsSync(rootPublicPath)) {
    mainWindow.loadFile(rootPublicPath);
  } else if (fs.existsSync(localPublicPath)) {
    mainWindow.loadFile(localPublicPath);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'public/index.html'));
  }

  // Open DevTools
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});