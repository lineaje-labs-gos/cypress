import type { KeyPressSupportedKeys } from '@packages/types'
import type { SendDebuggerCommand } from '../../browsers/cdp_automation'

interface KeyCodeLookup extends Record<KeyPressSupportedKeys, string> {}

export const CDP_KEYCODE: KeyCodeLookup = {
  'TAB': 'U+000009',
}

/*
const BIDI_KEYCODE: KeyCodeLookup = {
  'TAB': '\uE004',
}
*/

export async function cdpKeyPress ({ key }: { key: KeyPressSupportedKeys }, send: SendDebuggerCommand): Promise<void> {
  const keyIdentifier = CDP_KEYCODE[key]

  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    keyIdentifier,
  })

  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    keyIdentifier,
  })
}
