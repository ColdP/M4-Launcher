const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  // packagerConfig 用於配置 Electron Packager 的選項
  packagerConfig: {
    asar: true, // 將應用打包成 asar 檔案
    icon: 'assets/images/icon.ico', // 應用圖示
    name: 'The Sims 4 Launcher', // 應用程式資料夾的名稱
    executableName: 'sims-4-launcher', // 強制指定可執行檔的名稱
  },
  rebuildConfig: {},
  // makers 定義了要創建的安裝程式類型
  makers: [
    {
      // 為 Windows 創建 Squirrel 安裝程式
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'sims-4-launcher',
        setupIcon: 'assets/images/icon.ico',
        productName: 'The Sims 4 Launcher',
      },
    },
    {
      // 為 macOS 創建 zip 文件
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      // 為 Debian 系 Linux 創建 .deb 包
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      // 為 Red Hat 系 Linux 創建 .rpm 包
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  // plugins 用於擴展 Electron Forge 的功能
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses 插件用於在打包時開啟/關閉 Electron 的某些功能
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
