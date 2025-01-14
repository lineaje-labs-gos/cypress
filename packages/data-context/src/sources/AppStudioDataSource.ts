import { AppStudioShape, CloudApi } from '@packages/types'
import { DataContext } from '../DataContext'
import { AppStudio } from './app-studio'
import { agent } from '@packages/network'

export class AppStudioDataSource {
  constructor (private ctx: DataContext) {}

  async getAppStudio (cloudApi: CloudApi): Promise<AppStudioShape> {
    const script = await this.getAppStudioScript(cloudApi)

    const appStudio = new AppStudio(this.ctx)

    await appStudio.setup(script, cloudApi)

    return appStudio
  }

  private async getAppStudioScript (cloudApi: CloudApi): Promise<string> {
    if (process.env.CYPRESS_LOCAL_APP_STUDIO_PATH) {
      return this.ctx.fs.readFile(process.env.CYPRESS_LOCAL_APP_STUDIO_PATH, 'utf8')
    }

    const { retryWithBackoff, requestPromise, publicKeyVersion, enc } = cloudApi

    const res = await retryWithBackoff(async (attemptIndex) => {
      return requestPromise.get({
        // TODO: figure out this URL
        url: 'https://cloud.cypress.io/app/v1/app-studio.js',
        headers: {
          'x-route-version': '1',
          'x-cypress-request-attempt': attemptIndex,
          'x-cypress-signature': publicKeyVersion,
        },
        agent,
        encrypt: 'signed',
        resolveWithFullResponse: true,
      })
    })

    const verified = enc.verifySignature(res.body, res.headers['x-cypress-signature'])

    if (!verified) {
      throw new Error('Unable to verify studio signature')
    }

    return res.body
  }
}
