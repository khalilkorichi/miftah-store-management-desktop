const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'مفتاح - إدارة المتجر'
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (app.isPackaged) {
      const appUrl = `file://${path.join(__dirname, '../dist/index.html')}`;
      if (!url.startsWith(appUrl)) event.preventDefault();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

let autoUpdater = null;

function getAutoUpdater() {
  if (!autoUpdater && app.isPackaged) {
    try {
      const { autoUpdater: au } = require('electron-updater');
      au.autoDownload = true;
      au.autoInstallOnAppQuit = true;

      au.on('checking-for-update', () => {
        sendStatus({ state: 'checking' });
      });

      au.on('update-available', (info) => {
        sendStatus({ state: 'downloading', version: info.version, releaseDate: info.releaseDate, percent: 0 });
      });

      au.on('update-not-available', () => {
        sendStatus({ state: 'up-to-date' });
      });

      au.on('download-progress', (progress) => {
        sendStatus({ state: 'downloading', percent: Math.round(progress.percent) });
      });

      au.on('update-downloaded', (info) => {
        sendStatus({ state: 'downloaded', version: info.version });
      });

      au.on('error', (err) => {
        sendStatus({ state: 'error', message: err.message || String(err) });
      });

      autoUpdater = au;
    } catch (e) {
      console.error('electron-updater not available:', e.message);
    }
  }
  return autoUpdater;
}

function sendStatus(data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', data);
  }
}

ipcMain.handle('updater:version', () => {
  return app.getVersion();
});

ipcMain.handle('updater:check', async () => {
  const au = getAutoUpdater();
  if (!au) return { success: false, reason: 'dev-mode' };
  try {
    const result = await au.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

ipcMain.handle('updater:install', () => {
  const au = getAutoUpdater();
  if (!au) return;
  au.quitAndInstall(false, true);
});
