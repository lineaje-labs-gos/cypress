/// <reference types="cypress" />

import type { CyPromptServerShape, CyPromptServerDefaultShape } from '@packages/types'
import type { Router } from 'express'

class CyPromptServer implements CyPromptServerShape {
  initializeRoutes (router: Router): void {
    // This is a test implementation that does nothing
  }

  handleBackendRequest (eventName: string, ...args: any[]): Promise<any> {
    return Promise.resolve()
  }
}

const cyPromptServerDefault: CyPromptServerDefaultShape = {
  createCyPromptServer (): Promise<CyPromptServer> {
    return Promise.resolve(new CyPromptServer())
  },
  MOUNT_VERSION: 1,
}

export default cyPromptServerDefault
