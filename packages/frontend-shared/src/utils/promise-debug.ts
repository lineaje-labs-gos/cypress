// Utility to patch the global Promise and warn if a Promise takes too long to settle
// Usage: import { patchGlobalPromise } from './promise-debug'; patchGlobalPromise();

export function patchGlobalPromise (timeout: number = 5000): void {
  const OriginalPromise = Promise

  function PatchedPromise<T> (
    this: any,
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void
    ) => void,
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout>
    const stack = new Error('Long-running Promise detected').stack

    return new OriginalPromise<T>((resolve, reject) => {
      timer = setTimeout(() => {
        if (Cypress) {
          // @ts-expect-error
          Cypress.backend('log', `[Promise Debug] Promise exceeded ${timeout}ms:\n`, stack)
        } else {
          // eslint-disable-next-line no-console
          console.warn(`[Promise Debug] Promise exceeded ${timeout}ms:\n`, stack)
        }
      }, timeout)

      executor(
        (value) => {
          clearTimeout(timer); resolve(value)
        },
        (err) => {
          clearTimeout(timer); reject(err)
        },
      )
    })
  }

  PatchedPromise.prototype = OriginalPromise.prototype

  // Copy static methods
  Object.getOwnPropertyNames(OriginalPromise).forEach((key) => {
    // @ts-ignore
    if (!(key in PatchedPromise)) {
      // @ts-ignore
      PatchedPromise[key] = (OriginalPromise as any)[key]
    }
  });

  // @ts-ignore
  (globalThis as any).Promise = PatchedPromise
}
