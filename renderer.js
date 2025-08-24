// renderer.js
document.addEventListener('DOMContentLoaded', () => {
    // --- 元素获取 ---
    const mainView = document.getElementById('main-view');
    const settingsView = document.getElementById('settings-view');
    const settingsBtn = document.getElementById('settings-btn');
    const backBtn = document.getElementById('back-btn');

    // 窗口控制
    document.getElementById('minimize-btn').addEventListener('click', () => electronAPI.minimizeWindow());
    document.getElementById('maximize-btn').addEventListener('click', () => electronAPI.maximizeWindow());
    document.getElementById('close-btn').addEventListener('click', () => electronAPI.closeWindow());

    // --- 视图切换 ---
    settingsBtn.addEventListener('click', () => {
        mainView.classList.remove('active');
        settingsView.classList.add('active');
    });
    backBtn.addEventListener('click', () => {
        settingsView.classList.remove('active');
        mainView.classList.add('active');
    });

    // --- 设置变量 ---
    const usernameInput = document.getElementById('username-input');
    const avatarUrlInput = document.getElementById('avatar-url-input');
    const avatarSettingImg = document.getElementById('user-avatar-setting');
    const avatarFileInput = document.getElementById('avatar-file-input');
    const usernameMain = document.getElementById('username-main');
    const avatarMainImg = document.getElementById('user-avatar-main');
    const gameDirInput = document.getElementById('game-dir-input');
    const selectDirBtn = document.getElementById('select-dir-btn');
    const versionText = document.getElementById('version-text');
    const launchGameBtn = document.getElementById('launch-game-btn');
    const dxSwitch = document.getElementById('dx-switch');
    const lightThemeBtn = document.getElementById('light-theme-btn');
    const darkThemeBtn = document.getElementById('dark-theme-btn');
    const themeColorPicker = document.getElementById('theme-color-picker');

    // --- 函数定义 ---
    
    // 更新游戏版本 (已加固)
    async function updateGameVersion(gameDir) {
        if (!gameDir) {
            versionText.textContent = '未设置游戏目录';
            return;
        }
        versionText.textContent = '检测中...';
        try {
            const version = await electronAPI.getGameVersion(gameDir);
            // 增加验证步骤，确保返回的是有效的版本字符串
            if (typeof version === 'string' && version.includes('.')) {
                versionText.textContent = version;
            } else {
                // 如果返回的数据无效，则显示错误
                console.error('Received unexpected version data:', version);
                versionText.textContent = '无法读取版本';
            }
        } catch (error) {
            // 捕获IPC通信或其他错误
            console.error('Error fetching game version:', error);
            versionText.textContent = '获取版本失败';
        }
    }

    // 加载设置
    async function loadSettings() {
        // 用户名
        const username = await electronAPI.store.get('username') || 'btm_m';
        usernameInput.value = username;
        usernameMain.textContent = username;

        // 头像
        const avatar = await electronAPI.store.get('avatar') || 'assets/images/default_avatar.jpg';
        updateAvatar(avatar);
        avatarUrlInput.value = (avatar.startsWith('http') || avatar.startsWith('file')) ? avatar : '';

        // 游戏目录
        const gameDir = await electronAPI.store.get('gameDirectory');
        if (gameDir) {
            gameDirInput.value = gameDir;
            updateGameVersion(gameDir); // 初始加载时更新版本
        }
        
        // 主题模式
        const theme = await electronAPI.store.get('theme') || 'light';
        applyTheme(theme);

        // 主题色
        const themeColor = await electronAPI.store.get('themeColor') || '#00838f';
        applyThemeColor(themeColor);
        themeColorPicker.value = themeColor;
    }

    // 更新头像显示
    function updateAvatar(src) {
        avatarSettingImg.src = src;
        avatarMainImg.src = src;
        avatarSettingImg.onerror = () => { // 处理无效URL
            const defaultAvatar = 'assets/images/default_avatar.jpg';
            avatarSettingImg.src = defaultAvatar;
            avatarMainImg.src = defaultAvatar;
            electronAPI.store.set('avatar', defaultAvatar);
        };
    }

    // 应用主题模式
    function applyTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
        lightThemeBtn.classList.toggle('active', theme === 'light');
        darkThemeBtn.classList.toggle('active', theme === 'dark');
    }
    
    // 应用主题色
    function applyThemeColor(color) {
        const style = document.documentElement.style;
        style.setProperty('--primary-color', color);
    }


    // --- 事件监听 ---

    // 用户名设置
    usernameInput.addEventListener('change', () => {
        const newUsername = usernameInput.value.trim();
        if (newUsername) {
            usernameMain.textContent = newUsername;
            electronAPI.store.set('username', newUsername);
        } else {
            usernameInput.value = usernameMain.textContent; // 恢复旧值
        }
    });

    // 头像URL设置
    avatarUrlInput.addEventListener('change', () => {
        const newAvatarUrl = avatarUrlInput.value.trim();
        if (newAvatarUrl) {
            updateAvatar(newAvatarUrl);
            electronAPI.store.set('avatar', newAvatarUrl);
        }
    });

    // 点击头像上传文件
    avatarSettingImg.addEventListener('click', () => {
        avatarFileInput.click();
    });

    // 本地头像文件选择
    avatarFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const filePath = `file://${file.path.replace(/\\/g, '/')}`; // 规范化路径
            updateAvatar(filePath);
            electronAPI.store.set('avatar', filePath);
            avatarUrlInput.value = ''; // 清空URL输入框
        }
    });

    // 选择游戏目录
    selectDirBtn.addEventListener('click', async () => {
        const result = await electronAPI.selectGameDirectory();
        if (result.success) {
            gameDirInput.value = result.path;
            electronAPI.store.set('gameDirectory', result.path);
            // 当用户选择新目录后，立即调用函数更新版本号显示
            updateGameVersion(result.path);
        }
    });

    // 启动游戏
    launchGameBtn.addEventListener('click', async () => {
        const gameDir = await electronAPI.store.get('gameDirectory');
        const isDX9 = !dxSwitch.checked; // switch选中是DX11
        electronAPI.launchGame({ gameDir, isDX9 });
    });

    // 主题模式切换
    lightThemeBtn.addEventListener('click', () => {
        applyTheme('light');
        electronAPI.store.set('theme', 'light');
    });
    darkThemeBtn.addEventListener('click', () => {
        applyTheme('dark');
        electronAPI.store.set('theme', 'dark');
    });
    
    // 主题色选择
    themeColorPicker.addEventListener('input', (e) => {
        applyThemeColor(e.target.value);
    });
    themeColorPicker.addEventListener('change', (e) => {
        electronAPI.store.set('themeColor', e.target.value);
    });


    // --- 初始化 ---
    loadSettings();
});
