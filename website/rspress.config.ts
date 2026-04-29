import type { UserConfig } from '@rspress/core';

// Use import.meta.url to get absolute paths without importing node:path
const __dir = new URL('.', import.meta.url).pathname.replace(/\/$/, '');

const config: UserConfig = {
  root: `${__dir}/content`,
  title: 'Bloque SDK',
  description: 'The official SDK for building on Bloque financial infrastructure.',
  lang: 'es',
  logoText: 'Bloque',
  icon: '/bloque-icon.svg',
  logo: {
    light: '/bloque-icon.svg',
    dark: '/bloque-icon.svg',
  },
  themeDir: `${__dir}/theme`,
  globalStyles: `${__dir}/theme/styles/global.css`,
  route: {
    cleanUrls: true,
    exclude: ['**/fragments/**'],
  },
  markdown: {
    link: {
      checkDeadLinks: false,
    },
  },
  themeConfig: {
    darkMode: true,
    lastUpdated: true,
    footer: {
      message: '© 2025-present Bloque Copilot Inc.',
    },
    enableAppearanceAnimation: true,
    hideNavbar: 'auto',
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/bloque-app/sdk',
      },
      {
        icon: 'npm',
        mode: 'link',
        content: 'https://www.npmjs.com/package/@bloque/sdk',
      },
      {
        icon: 'x',
        mode: 'link',
        content: 'https://x.com/bloque_app',
      },
    ],
    editLink: {
      docRepoBaseUrl:
        'https://github.com/bloque-app/sdk/tree/main/website',
    },
    locales: [
      {
        lang: 'es',
        title: 'Bloque SDK',
        label: 'Español',
        description:
          'El SDK oficial para construir sobre infraestructura financiera Bloque.',
      },
      {
        lang: 'en',
        title: 'Bloque SDK',
        label: 'English',
        description:
          'The official SDK for building on Bloque financial infrastructure.',
      },
    ],
  },
  builderConfig: {
    resolve: {
      alias: {
        '@theme': `${__dir}/theme`,
      },
    },
  },
};

export default config;
