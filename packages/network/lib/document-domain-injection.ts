// utility to help determine if document.domain should be injected, or related logic invoked
// this class isn't necessarily network related, but it is used from a wide ranging number
// of packages. It should probably be its own ./package.
/*

  behaviors controlled:

  - whether to inject document.domain in the server render of top (server/lib/controllers/files)
  - whether to inject document.domain in proxied files (proxy/lib/http/response-middleware)
  - how to verify stack traces of privileged commands in chrome
*/

//TODO: lift and/or simplify this logic
import { getSuperDomainOrigin } from './cors'

export class DocumentDomainInjection {
  constructor (
    private config: { injectDocumentDomain: boolean },
  ) {}

  // primarily used by `packages/server/lib/remote_states` to determine ??
  public getOriginKey (url: string) {
    if (this.config.injectDocumentDomain || url.includes('localhost')) {
      return getSuperDomainOrigin(url)
    }

    return new URL(url).origin
  }
}
