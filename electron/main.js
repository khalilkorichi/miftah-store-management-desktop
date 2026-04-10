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

function getAutoUpdater(repoUrl) {
  if (!app.isPackaged) return null;

  try {
    const { autoUpdater: au } = require('electron-updater');
    au.autoDownload = false;
    au.autoInstallOnAppQuit = false;

    if (repoUrl) {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        au.setFeedURL({
          provider: 'github',
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''),
        });
      }
    }

    au.removeAllListeners();

    au.on('checking-for-update', () => {
      sendStatus({ state: 'checking' });
    });

    au.on('update-available', (info) => {
      sendStatus({ state: 'available', version: info.version, releaseDate: info.releaseDate });
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

ipcMain.handle('updater:check', async (_event, repoUrl) => {
  const au = getAutoUpdater(repoUrl);
  if (!au) return { success: false, reason: 'dev-mode' };
  try {
    const result = await au.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

ipcMain.handle('updater:download', async () => {
  if (!autoUpdater) return { success: false };
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

ipcMain.handle('updater:install', () => {
  if (!autoUpdater) return;
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('updater:check-github-api', async (_event, repoUrl) => {
  if (!repoUrl) return { success: false, reason: 'no-repo-url' };

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return { success: false, reason: 'invalid-url' };

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

  return new Promise((resolve) => {
    const https = require('https');
    const req = https.get(apiUrl, {
      headers: {
        'User-Agent': 'MiftahStore-Updater',
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 404) {
            resolve({ success: false, reason: 'no-releases' });
            return;
          }
          if (res.statusCode !== 200) {
            resolve({ success: false, reason: `github-api-${res.statusCode}` });
            return;
          }
          const release = JSON.parse(data);
          resolve({
            success: true,
            version: (release.tag_name || '').replace(/^v/, ''),
            tagName: release.tag_name,
            publishedAt: release.published_at,
            htmlUrl: release.html_url,
            releasesUrl: `https://github.com/${owner}/${repo}/releases`,
            body: (release.body || '').substring(0, 1000),
            hasAssets: (release.assets || []).length > 0
          });
        } catch (e) {
          resolve({ success: false, reason: 'parse-error' });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ success: false, reason: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, reason: 'timeout' });
    });
  });
});

ipcMain.handle('updater:open-external', (_event, url) => {
  if (!url || typeof url !== 'string') return;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return;
    if (!parsed.hostname.endsWith('github.com')) return;
    const { shell } = require('electron');
    shell.openExternal(url);
  } catch {}
});
