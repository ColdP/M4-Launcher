// preload.js
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// 将选择的API安全地暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // 游戏逻辑
  getGameVersion: (gameDir) => ipcRenderer.invoke('get-game-version', gameDir),
  selectGameDirectory: () => ipcRenderer.invoke('select-game-directory'),
  launchGame: (options) => ipcRenderer.send('launch-game', options),

  // 文件系统 (只暴露需要的功能)
  pathExists: (filePath) => fs.existsSync(filePath),
  
  // 持久化存储
  store: {
    get: (key) => ipcRenderer.invoke('electron-store-get', key),
    set: (key, val) => ipcRenderer.send('electron-store-set', key, val),
  },
});
