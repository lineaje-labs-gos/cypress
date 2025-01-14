import { AppStudioShape, CloudApi } from '@packages/types'
import { Router } from 'express'
import path from 'path'
import os from 'os'
import Module from 'module'
import { DataContext } from '../../DataContext'

const requireScript = (script: string) => {
  const mod = new Module('id', module)

  mod.filename = ''
  // _compile is a private method
  // @ts-expect-error
  mod._compile(script, mod.filename)

  module.children.splice(module.children.indexOf(mod), 1)

  return mod.exports
}

export class AppStudio implements AppStudioShape {
  private _appStudio: AppStudioShape | undefined

  constructor (private ctx: DataContext) {}

  async setup (script: string, cloudApi: CloudApi): Promise<void> {
    if (script) {
      const cypressProtocolDirectory = path.join(os.tmpdir(), 'cypress', 'protocol')

      await this.ctx.fs.ensureDir(cypressProtocolDirectory)

      const { AppStudio } = requireScript(script)

      this._appStudio = new AppStudio(cloudApi)
    }
  }

  initializeRoutes (router: Router): void {
    if (this._appStudio) {
      this.invokeSync('initializeRoutes', { isEssential: true }, router)
    }
  }

  /**
   * Abstracts invoking a synchronous method on the AppStudio instance, so we can handle
   * errors in a uniform way
   */
  private invokeSync<K extends AppStudioSyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<AppStudioShape[K]>): any | void {
    if (!this._appStudio) {
      return
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      return this._appStudio[method].apply(this._protocol, args)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('error', error)
      // TODO: Figure out errors
    }
  }

  /**
   * Abstracts invoking a synchronous method on the AppCaptureProtocol instance, so we can handle
   * errors in a uniform way
   */
  private async invokeAsync <K extends AppStudioAsyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<AppStudioShape[K]>): Promise<ReturnType<AppStudioShape[K]> | undefined> {
    if (!this._appStudio) {
      return undefined
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      return await this._appStudio[method].apply(this._protocol, args)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('error', error)

      // TODO: Figure out errors
      return undefined
    }
  }
}

// Helper types for invokeSync / invokeAsync
type AppStudioSyncMethods = {
  [K in keyof AppStudioShape]: ReturnType<AppStudioShape[K]> extends Promise<any> ? never : K
}[keyof AppStudioShape]

type AppStudioAsyncMethods = {
  [K in keyof AppStudioShape]: ReturnType<AppStudioShape[K]> extends Promise<any> ? K : never
}[keyof AppStudioShape]
