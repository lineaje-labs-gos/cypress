import debugFn from 'debug'
import module from 'module'
import type { ViteDevServerConfig } from './devServer'

const debug = debugFn('cypress:vite-dev-server:getVite')

export type Vite = typeof import('vite-6')

// "vite-dev-server" is bundled in the binary, so we need to require.resolve "vite"
// from root of the active project since we don't bundle vite internally but rather
// use the version the user has installed
export async function getVite (config: ViteDevServerConfig): Promise<Vite> {
  try {
    try {
      const esmViteImportPath = import.meta.resolve('vite', config.cypressConfig.projectRoot)

      debug('resolved esmViteImportPath as %s', esmViteImportPath)

      const viteImport = await import(esmViteImportPath)

      return viteImport
    } catch (err) {
      const require = module.createRequire(import.meta.url)

      const cjsViteImportPath = require.resolve('vite', { paths: [config.cypressConfig.projectRoot] })

      debug('resolved cjsViteImportPath as %s', cjsViteImportPath)

      const viteImport = (await import(cjsViteImportPath)).default

      return viteImport
    }
  } catch (err) {
    throw new Error(`Could not find "vite" in your project's dependencies. Please install "vite" to fix this error.\n\n${err}`)
  }
}
