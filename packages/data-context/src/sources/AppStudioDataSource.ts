import type { AppStudioShape, CloudApi } from '@packages/types'
import type { DataContext } from '../DataContext'
import { AppStudio } from './app-studio'
import path from 'path'
import os from 'os'
import tar from 'tar'

export class AppStudioDataSource {
  private studioPath: string
  private bundlePath: string
  private serverFilePath: string

  constructor (private ctx: DataContext) {
    this.studioPath = path.join(os.tmpdir(), 'cypress', 'studio')
    this.bundlePath = path.join(this.studioPath, 'bundle.tar')
    this.serverFilePath = path.join(this.studioPath, 'server', 'index.js')
  }

  async getAppStudio (cloudApi: CloudApi): Promise<AppStudioShape> {
    let script: string

    if (process.env.CYPRESS_LOCAL_APP_STUDIO_PATH) {
      const appPath = path.join(process.env.CYPRESS_LOCAL_APP_STUDIO_PATH, 'app')
      const serverPath = path.join(process.env.CYPRESS_LOCAL_APP_STUDIO_PATH, 'server')

      await this.ctx.fs.ensureDir(this.studioPath)
      await this.ctx.fs.copy(appPath, path.join(this.studioPath, 'app'))
      await this.ctx.fs.copy(serverPath, path.join(this.studioPath, 'server'))
    } else {
      await this.writeAppStudioBundleToTempDirectory(cloudApi)

      await tar.extract({
        file: this.bundlePath,
        cwd: this.studioPath,
      })
    }

    script = await this.ctx.fs.readFile(this.serverFilePath, 'utf8')

    const appStudio = new AppStudio(this.ctx)

    await appStudio.setup({ script, cloudApi, studioPath: this.studioPath })

    return appStudio
  }

  private async writeAppStudioBundleToTempDirectory (cloudApi: CloudApi): Promise<void> {
    const { retryWithBackoff, requestPromise, publicKeyVersion, enc } = cloudApi

    const res = await retryWithBackoff(async (attemptIndex) => {
      return requestPromise.get({
        url: `${cloudApi.baseUrl}studio/bundle/current.tgz`,
        headers: {
          'x-route-version': '1',
          'x-cypress-request-attempt': attemptIndex,
          'x-cypress-signature': publicKeyVersion,
        },
        encrypt: 'signed',
        resolveWithFullResponse: true,
      })
    })

    const verified = enc.verifySignature(res.body, res.headers['x-cypress-signature'])

    if (!verified) {
      throw new Error('Unable to verify studio signature')
    }

    await this.ctx.fs.ensureDir(this.studioPath)
    await this.ctx.fs.writeFile(this.bundlePath, res.body)
  }
}
