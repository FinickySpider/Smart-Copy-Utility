module.exports = {
  packagerConfig: {
    asar: true,
    icon: './icon',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: './icon.ico',
        iconUrl: 'https://raw.githubusercontent.com/FinickySpider/Smart-Copy-Utility/main/icon.ico',
        authors: 'FinickySpider',
        description: 'Windows desktop utility to copy large folder trees using robocopy with hierarchical .copyignore/.copyinclude rule files',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main/index.ts',
            config: 'vite.main.config.ts',
            target: 'main',
          },
          {
            entry: 'src/preload/index.ts',
            config: 'vite.preload.config.ts',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.ts',
            html: 'src/renderer/index.html',
          },
        ],
      },
    },
  ],
};
