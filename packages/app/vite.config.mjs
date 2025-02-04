import { makeConfig } from '../frontend-shared/vite.config.mjs'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'
import Copy from 'rollup-plugin-copy'
import Legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'
import { federation } from '@module-federation/vite'

export default makeConfig({
  // Necessary for module federation. Good for chrome >= 89
  esbuild: {
    supported: {
      'top-level-await': true,
    },
  },
  optimizeDeps: {
    include: [
      'javascript-time-ago',
      'ansi-to-html',
      'fuzzysort',
      '@cypress-design/**',
      '@cypress-design/vue-button',
      'debug',
      'p-defer',
      'bluebird',
      'events',
      '@popperjs/core',
      '@opentelemetry/*',
    ],
  },
}, {
  pluginsToProcessFirst: [
    federation({
      name: 'host',
      remotes: {
        'app-studio': {
          type: 'module',
          name: 'app-studio',
          entryGlobalName: 'app-studio',
          entry: '/__cypress-studio/app-studio.js',
          shareScope: 'default',
        },
      },
      filename: 'app-studio.js',
    }),
  ],
  plugins: [
    Layouts(),
    Pages({ extensions: ['vue'] }),
    Copy({
      targets: [{
        src: resolve(__dirname, '../frontend-shared/src/assets/logos/favicon.png'),
        dest: 'dist',
      }],
    }),
    Legacy({
      targets: ['Chrome >= 80', 'Firefox >= 86', 'Edge >= 80'],
      modernPolyfills: true,
      renderLegacyChunks: false,
    }),
  ],
})
