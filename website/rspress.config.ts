import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginSitemap } from '@rspress/plugin-sitemap';
import * as path from 'node:path';

const PUBLISH_URL = 'https://docs.bloque.app';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Bloque SDK',
  description: 'The official SDK for building apps on Bloque',
  lang: 'es',
  logoText: 'Bloque SDK',
  icon: '/bloque-icon.png',
  logo: {
    light: '/bloque-icon.png',
    dark: '/bloque-icon.png',
  },
  plugins: [
    pluginPreview({
      previewLanguages: ['tsx', 'jsx', 'mdx'],
      iframeOptions: {
        devPort: 7778,
      },
    }),
    pluginSitemap({
      siteUrl: PUBLISH_URL,
    }),
  ],
  route: {
    cleanUrls: true,
    exclude: ['**/fragments/**', 'components/**'],
  },
  themeConfig: {
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
        'https://github.com/bloque-app/sdk/tree/main/website/docs',
    },
    locales: [
      {
        lang: 'es',
        title: 'Bloque SDK',
        label: 'Español',
      },
      {
        lang: 'en',
        title: 'Bloque SDK',
        label: 'English',
      },
    ],
  },
  languageParity: {
    enabled: false,
    include: [],
    exclude: [],
  },
});
