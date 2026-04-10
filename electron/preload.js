const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronUpdater', {
  checkForUpdates: (repoUrl) => ipcRenderer.invoke('updater:check', repoUrl),
  checkGithubReleases: (repoUrl) => ipcRenderer.invoke('updater:check-github-api', repoUrl),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  getVersion: () => ipcRenderer.invoke('updater:version'),
  openExternal: (url) => ipcRenderer.invoke('updater:open-external', url),
  onUpdateStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.removeListener('updater:status', handler);
  },
});
