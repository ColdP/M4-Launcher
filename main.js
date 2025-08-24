// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path =require('path');
const fs = require('fs');
const { execFile } = require('child_process');

// The Store and getInfo will be initialized asynchronously.
let Store;
let store;
let getInfo;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 450, // 3 * 150
    height: 600, // 4 * 150
    minWidth: 450,
    minHeight: 600,
    frame: false, // Use custom title bar
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'assets/images/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // preload script needs node access
    }
  });

  // Load index.html
  mainWindow.loadFile('index.html');

  // Listen for window control events from renderer
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('close-window', () => {
    mainWindow.close();
  });
}

// --- IPC Event Handling ---
// We define this function to ensure handlers are only set up after the store is ready.
function setupIpcHandlers() {
    // Get game version
    ipcMain.handle('get-game-version', async (event, gameDir) => {
      if (!gameDir) return '未设置游戏目录';
      const exePath = path.join(gameDir, 'TS4_x64.exe');
      try {
        if (fs.existsSync(exePath)) {
          // Use the dynamically imported getInfo function
          const info = await getInfo(exePath);
          // For debugging, you can see what info is retrieved
          console.log('Version Info Object:', info); 
          // FIX: Use correct capitalized property names 'ProductVersion' and 'FileVersion'
          return info.ProductVersion || info.FileVersion || '无法读取版本';
        }
        return 'TS4_x64.exe 未找到';
      } catch (error) {
        console.error('获取游戏版本失败:', error);
        return '获取版本失败';
      }
    });

    // Select game directory
    ipcMain.handle('select-game-directory', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: '请选择游戏目录 (Game/Bin)'
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }

      const selectedPath = result.filePaths[0];
      const dx11Exists = fs.existsSync(path.join(selectedPath, 'TS4_x64.exe'));
      const dx9Exists = fs.existsSync(path.join(selectedPath, 'TS4_DX9_x64.exe'));

      if (dx11Exists && dx9Exists) {
        return { success: true, path: selectedPath };
      } else {
        dialog.showErrorBox('目录无效', `选择的目录中未找到所需的游戏文件。\n请确保已选择到 "Game\\Bin" 目录，并且该目录下包含 "TS4_x64.exe" 和 "TS4_DX9_x64.exe"。`);
        return { success: false };
      }
    });

    // Launch game
    ipcMain.on('launch-game', (event, { gameDir, isDX9 }) => {
      if (!gameDir) {
        dialog.showErrorBox('错误', '请先在设置中指定游戏目录！');
        return;
      }

      const exeName = isDX9 ? 'TS4_DX9_x64.exe' : 'TS4_x64.exe';
      const exePath = path.join(gameDir, exeName);

      if (fs.existsSync(exePath)) {
        execFile(exePath, (error, stdout, stderr) => {
          if (error) {
            console.error(`启动游戏失败: ${error}`);
            dialog.showErrorBox('启动失败', `无法启动游戏: ${error.message}`);
          }
        });
      } else {
        dialog.showErrorBox('文件未找到', `无法在指定目录中找到 ${exeName}。`);
      }
    });

    // Handle electron-store IPC
    ipcMain.handle('electron-store-get', async (event, key) => {
        return store.get(key);
    });
    ipcMain.on('electron-store-set', (event, key, val) => {
        store.set(key, val);
    });
}


// This function will be called when the app is ready.
async function initializeApp() {
  // Dynamically import ESM modules
  Store = (await import('electron-store')).default;
  store = new Store();
  getInfo = (await import('win-version-info')).default;

  // On first launch, force user to select game directory before creating window
  const gameDir = store.get('gameDirectory');
  if (!gameDir) {
    dialog.showMessageBoxSync({
        type: 'info',
        title: '欢迎',
        message: '首次使用，请先设置您的 The Sims 4 游戏目录。需要精准到 "Game\\Bin" 目录哦。'
    });
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '请选择游戏目录 (Game/Bin)'
    });

    if (result.canceled || result.filePaths.length === 0) {
      dialog.showErrorBox('需要设置目录', '必须设置游戏目录才能启动应用。应用即将退出。');
      app.quit();
      return; // Stop execution
    }

    const selectedPath = result.filePaths[0];
    const dx11Exists = fs.existsSync(path.join(selectedPath, 'TS4_x64.exe'));
    const dx9Exists = fs.existsSync(path.join(selectedPath, 'TS4_DX9_x64.exe'));

    if (dx11Exists && dx9Exists) {
      store.set('gameDirectory', selectedPath);
    } else {
      dialog.showErrorBox('目录无效', `您选择的目录无效。\n请确保已选择到 "Game\\Bin" 目录。\n应用即将退出。`);
      app.quit();
      return; // Stop execution
    }
  }

  // Now that setup is complete, set up IPC handlers and create the window.
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

// --- App Lifecycle ---

// When Electron is ready, initialize the app.
app.whenReady().then(initializeApp);

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
