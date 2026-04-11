const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronUpdater', {
  getVersion: () => ipcRenderer.invoke('updater:version'),
  openExternal: (url) => ipcRenderer.invoke('updater:open-external', url),
  scanChanges: (repoUrl) => ipcRenderer.invoke('updater:scan-changes', repoUrl),
  createBackup: () => ipcRenderer.invoke('updater:create-backup'),
  applyUpdate: () => ipcRenderer.invoke('updater:apply-update'),
  restartApp: () => ipcRenderer.invoke('updater:restart-app'),
  onUpdateStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.removeListener('updater:status', handler);
  },
});
