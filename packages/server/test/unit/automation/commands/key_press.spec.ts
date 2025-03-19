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
      await cdpKeyPress({ key: 'Tab' }, sendFn)

      expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
        type: 'rawKeyDown',
        keyIdentifier: CDP_KEYCODE.Tab,
        key: 'Tab',
        code: 'Tab',
      })

      expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
        type: 'keyUp',
        keyIdentifier: CDP_KEYCODE.Tab,
        key: 'Tab',
        code: 'Tab',
      })
    })

    describe('when supplied an invalid key', () => {
      it('errors', async () => {
        // typescript would keep this from happening, but it hasn't yet
        // been checked for correctness since being received by automation
        // @ts-expect-error
        await expect(cdpKeyPress({ key: 'foo' })).to.be.rejectedWith('foo is not supported by \'cy.press()\'.')
      })
    })
  })
})
