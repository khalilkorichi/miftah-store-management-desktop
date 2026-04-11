const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

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

function sendStatus(data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', data);
  }
}

ipcMain.handle('updater:version', () => {
  return app.getVersion();
});

ipcMain.handle('updater:open-external', (_event, url) => {
  if (!url || typeof url !== 'string') return;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return;
    if (parsed.hostname !== 'github.com' && parsed.hostname !== 'www.github.com') return;
    shell.openExternal(url);
  } catch {}
});

const TRACKED_PREFIXES = ['dist/', 'electron/', 'src/', 'public/', 'scripts/'];
const TRACKED_FILES = ['index.html', 'package.json', 'vite.config.js', 'eslint.config.js'];
const EXCLUDED = ['node_modules/', '.git/', '.local/', '.cache/', '.replit', 'attached_assets/', 'skills/', '.upm/', '.canvas/', 'package-lock.json'];

function isTrackedFile(filePath) {
  if (EXCLUDED.some(e => filePath.startsWith(e) || filePath === e)) return false;
  if (TRACKED_FILES.includes(filePath)) return true;
  return TRACKED_PREFIXES.some(p => filePath.startsWith(p));
}

function categorizeFile(filePath) {
  if (filePath.startsWith('dist/')) return 'build';
  if (filePath.startsWith('electron/')) return 'core';
  if (filePath.startsWith('src/')) return 'source';
  if (filePath.startsWith('public/')) return 'assets';
  return 'config';
}

function categoryLabel(cat) {
  const labels = { build: 'ملفات البناء', core: 'نواة Electron', source: 'الكود المصدري', assets: 'الأصول', config: 'الإعدادات' };
  return labels[cat] || cat;
}

let lastScanResult = null;

function getAppBasePath() {
  return app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
}

function isPathSafe(filePath) {
  const normalized = path.normalize(filePath).replace(/\\/g, '/');
  if (normalized.startsWith('/') || normalized.startsWith('..') || normalized.includes('/../')) return false;
  if (!isTrackedFile(normalized)) return false;
  return true;
}

function gitBlobSha(buffer) {
  const header = `blob ${buffer.length}\0`;
  return crypto.createHash('sha1').update(Buffer.from(header)).update(buffer).digest('hex');
}

function getLocalFilesRecursive(dir, base) {
  const results = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const rel = path.relative(base, fullPath).replace(/\\/g, '/');
      if (EXCLUDED.some(e => rel.startsWith(e))) continue;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...getLocalFilesRecursive(fullPath, base));
        } else if (isTrackedFile(rel)) {
          const content = fs.readFileSync(fullPath);
          results.push({ path: rel, sha: gitBlobSha(content), size: content.length });
        }
      } catch {}
    }
  } catch {}
  return results;
}

function githubGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'MiftahStore-Updater', 'Accept': 'application/vnd.github.v3+json' },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) { resolve({ _error: true, status: res.statusCode, body: data }); return; }
          resolve(JSON.parse(data));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function downloadRaw(url) {
  return new Promise((resolve, reject) => {
    const makeReq = (reqUrl) => {
      const req = https.get(reqUrl, {
        headers: { 'User-Agent': 'MiftahStore-Updater' },
        timeout: 60000
      }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          makeReq(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    };
    makeReq(url);
  });
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let count = 0;
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

ipcMain.handle('updater:scan-changes', async (_event, repoUrl) => {
  if (!repoUrl) return { success: false, reason: 'لم يتم تحديد رابط المستودع' };
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return { success: false, reason: 'رابط GitHub غير صحيح' };

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');

  try {
    sendStatus({ state: 'checking' });

    const repoInfo = await githubGet(`https://api.github.com/repos/${owner}/${repo}`);
    if (repoInfo._error) {
      if (repoInfo.status === 404) return { success: false, reason: 'المستودع غير موجود' };
      if (repoInfo.status === 403) return { success: false, reason: 'تم تجاوز حد الطلبات — حاول بعد قليل' };
      return { success: false, reason: `خطأ GitHub: ${repoInfo.status}` };
    }
    const branch = repoInfo.default_branch || 'main';

    const commits = await githubGet(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=5`);
    if (!Array.isArray(commits) || commits.length === 0) return { success: false, reason: 'لا توجد commits في المستودع' };

    const latestCommit = {
      sha: commits[0].sha.substring(0, 7),
      message: commits[0].commit.message.split('\n')[0],
      date: commits[0].commit.committer.date,
      author: commits[0].commit.author.name
    };
    const recentCommits = commits.slice(0, 5).map(c => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split('\n')[0],
      date: c.commit.committer.date
    }));

    const tree = await githubGet(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    if (!tree.tree) return { success: false, reason: 'لا يمكن قراءة هيكل المستودع' };

    const remoteFiles = tree.tree
      .filter(t => t.type === 'blob' && isTrackedFile(t.path))
      .map(t => ({ path: t.path, sha: t.sha }));

    const basePath = getAppBasePath();
    const localFiles = getLocalFilesRecursive(basePath, basePath);

    const localMap = {};
    localFiles.forEach(f => { localMap[f.path] = f.sha; });
    const remoteMap = {};
    remoteFiles.forEach(f => { remoteMap[f.path] = f.sha; });

    const modified = [];
    const added = [];

    for (const rf of remoteFiles) {
      if (!isPathSafe(rf.path)) continue;
      const cat = categorizeFile(rf.path);
      if (!localMap[rf.path]) {
        added.push({ path: rf.path, sha: rf.sha, category: cat, categoryLabel: categoryLabel(cat) });
      } else if (localMap[rf.path] !== rf.sha) {
        modified.push({ path: rf.path, sha: rf.sha, category: cat, categoryLabel: categoryLabel(cat) });
      }
    }

    const totalChanges = modified.length + added.length;

    if (totalChanges === 0) {
      sendStatus({ state: 'up-to-date' });
      lastScanResult = null;
      return { success: true, totalChanges: 0, latestCommit };
    }

    const byCategory = {};
    [...modified, ...added].forEach(f => {
      if (!byCategory[f.category]) byCategory[f.category] = { label: f.categoryLabel, modified: 0, added: 0, files: [] };
      if (modified.some(m => m.path === f.path)) byCategory[f.category].modified++;
      else byCategory[f.category].added++;
      byCategory[f.category].files.push(f);
    });

    const result = {
      success: true,
      owner, repo, branch,
      latestCommit,
      recentCommits,
      modified, added,
      totalChanges,
      byCategory,
      releasesUrl: `https://github.com/${owner}/${repo}`
    };

    lastScanResult = result;
    sendStatus({ state: 'changes-found', ...result });
    return result;
  } catch (err) {
    return { success: false, reason: err.message || 'خطأ غير معروف' };
  }
});

ipcMain.handle('updater:create-backup', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'اختر مجلد حفظ النسخة الاحتياطية',
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'حفظ هنا'
  });

  if (result.canceled || !result.filePaths.length) return { success: false, reason: 'canceled' };

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
  const backupDir = path.join(result.filePaths[0], `miftah-backup-${stamp}`);

  try {
    const basePath = getAppBasePath();
    const dirsToBackup = ['dist', 'electron', 'src', 'public'];
    let fileCount = 0;

    for (const dir of dirsToBackup) {
      const srcDir = path.join(basePath, dir);
      const destDir = path.join(backupDir, dir);
      fileCount += copyDirRecursive(srcDir, destDir);
    }

    const configFiles = ['index.html', 'package.json', 'vite.config.js'];
    for (const cf of configFiles) {
      const srcFile = path.join(basePath, cf);
      if (fs.existsSync(srcFile)) {
        fs.mkdirSync(backupDir, { recursive: true });
        fs.copyFileSync(srcFile, path.join(backupDir, cf));
        fileCount++;
      }
    }

    return { success: true, backupPath: backupDir, fileCount };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

ipcMain.handle('updater:apply-update', async () => {
  if (!lastScanResult) return { success: false, reason: 'يجب فحص التحديثات أولاً' };

  const { owner, repo, branch, modified, added } = lastScanResult;
  const files = [...modified, ...added];
  const basePath = getAppBasePath();
  const stagingDir = path.join(app.getPath('temp'), `miftah-update-${Date.now()}`);

  try {
    fs.mkdirSync(stagingDir, { recursive: true });

    const results = { downloaded: 0, failed: 0, total: files.length, errors: [] };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!isPathSafe(file.path)) {
        results.failed++;
        results.errors.push({ path: file.path, error: 'مسار غير آمن' });
        continue;
      }

      const destPath = path.resolve(basePath, file.path);
      if (!destPath.startsWith(path.resolve(basePath))) {
        results.failed++;
        results.errors.push({ path: file.path, error: 'مسار خارج مجلد التطبيق' });
        continue;
      }

      sendStatus({
        state: 'downloading',
        current: i + 1,
        total: files.length,
        currentFile: file.path,
        percent: Math.round(((i + 1) / files.length) * 100)
      });

      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
        const content = await downloadRaw(rawUrl);

        if (file.sha) {
          const downloadedSha = gitBlobSha(content);
          if (downloadedSha !== file.sha) {
            results.failed++;
            results.errors.push({ path: file.path, error: 'تحقق SHA فشل — الملف تالف' });
            continue;
          }
        }

        const stagingPath = path.join(stagingDir, file.path);
        fs.mkdirSync(path.dirname(stagingPath), { recursive: true });
        fs.writeFileSync(stagingPath, content);
        results.downloaded++;
      } catch (err) {
        results.failed++;
        results.errors.push({ path: file.path, error: err.message });
      }
    }

    if (results.downloaded === 0) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
      return { success: false, reason: 'فشل تحميل جميع الملفات', ...results };
    }

    if (results.failed > 0) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
      return { success: false, reason: `فشل تحميل ${results.failed} ملف — تم إلغاء التحديث لتجنب حالة غير متسقة`, ...results };
    }

    sendStatus({ state: 'applying', total: results.downloaded });

    for (const file of files) {
      const stagingPath = path.join(stagingDir, file.path);
      if (!fs.existsSync(stagingPath)) continue;
      const finalDest = path.resolve(basePath, file.path);
      fs.mkdirSync(path.dirname(finalDest), { recursive: true });
      fs.copyFileSync(stagingPath, finalDest);
    }

    fs.rmSync(stagingDir, { recursive: true, force: true });
    lastScanResult = null;

    sendStatus({ state: 'complete', ...results });
    return { success: true, ...results };
  } catch (err) {
    try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch {}
    return { success: false, reason: err.message };
  }
});

ipcMain.handle('updater:restart-app', () => {
  app.relaunch();
  app.exit(0);
});
