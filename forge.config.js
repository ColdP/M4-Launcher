const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  // packagerConfig 用于配置 Electron Packager 的选项
  packagerConfig: {
    asar: true, // 将应用打包成 asar 文件
    icon: 'assets/images/icon.ico', // 应用图标，从 package.json 的 build.win.icon 获取
    name: 'The Sims 4 Launcher', // 可执行文件的名称，从 package.json 的 build.productName 获取
  },
  rebuildConfig: {},
  // makers 定义了要创建的安装程序类型
  makers: [
    {
      // 为 Windows 创建 Squirrel 安装程序
      name: '@electron-forge/maker-squirrel',
      config: {
        // Squirrel.Windows 安装程序的特定配置
        name: 'sims-4-launcher', // 应用的内部名称，通常与 package.json 的 name 一致
        setupIcon: 'assets/images/icon.ico', // 安装程序的图标
        productName: 'The Sims 4 Launcher', // 安装后在操作系统中显示的产品名称
      },
    },
    {
      // 为 macOS 创建 zip 文件
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      // 为 Debian 系 Linux 创建 .deb 包
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      // 为 Red Hat 系 Linux 创建 .rpm 包
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  // plugins 用于扩展 Electron Forge 的功能
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses 插件用于在打包时开启/关闭 Electron 的某些功能
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