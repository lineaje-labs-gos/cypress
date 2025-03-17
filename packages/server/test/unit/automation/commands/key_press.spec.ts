import type Sinon from 'sinon'
import type { SendDebuggerCommand } from '../../../../lib/browsers/cdp_automation'
import { cdpKeyPress, CDP_KEYCODE } from '../../../../lib/automation/commands/key_press'
const { expect, sinon } = require('../../../spec_helper')

describe('key:press automation command', () => {
  describe('cdp codepath', () => {
    let sendFn: Sinon.SinonStub<Parameters<SendDebuggerCommand>, ReturnType<SendDebuggerCommand>>

    beforeEach(() => {
      sendFn = sinon.stub()
    })

    it('dispaches a keydown followed by a keyup event to the provided send fn with the tab keycode', async () => {
      await cdpKeyPress({ key: 'TAB' }, sendFn)

      expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
        type: 'keyDown',
        keyIdentifier: CDP_KEYCODE.TAB,
      })

      expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
        type: 'keyUp',
        keyIdentifier: CDP_KEYCODE.TAB,
      })
    })
  })
})
