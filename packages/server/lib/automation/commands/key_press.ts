import type { KeyPressParams, KeyPressSupportedKeys } from '@packages/types'
import type { SendDebuggerCommand } from '../../browsers/cdp_automation'
import Debug from 'debug'

const debug = Debug('cypress:server:automation:command:keypress')

interface KeyCodeLookup extends Record<KeyPressSupportedKeys, string> {}

export const CDP_KEYCODE: KeyCodeLookup = {
  'Tab': 'U+000009',
}

export async function cdpKeyPress ({ key }: KeyPressParams, send: SendDebuggerCommand): Promise<void> {
  debug('cdp keypress', { key })
  if (!CDP_KEYCODE[key]) {
    throw new Error(`${key} is not supported by 'cy.press()'.`)
  }

  const keyIdentifier = CDP_KEYCODE[key]

  try {
    await send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key,
      code: key,
      keyIdentifier,
    })

    await new Promise((resolve) => setTimeout(resolve, 20))

    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code: key,
      keyIdentifier,
    })
  } catch (e) {
    debug(e)
    throw e
  }
}
