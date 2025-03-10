// fails tslint even though this is a built-in
// tslint:disable-next-line:no-implicit-dependencies
import nodeUtil from 'node:util'

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
// does not prevent garbage collection, which eventually removes references to the key object

/**
   *
   */
const classInstanceCache = new WeakMap()

/**
 * A cached decorator means the value is lazily evaluated once and
 * the result is cached on the class instance.
 *
 * This decorator is the Stage 3 / Official implementation, which is the de facto implementation
 * in TypeScript 5 when "experimentalDecorators" is false. When "experimentalDecorators" is set to true,
 * this decorator will not work.
 *
 * @see https://github.com/tc39/proposal-decorators?tab=readme-ov-file
 */
export const cached = (
  target: any,
  context: {
    kind: 'class' | 'method' | 'getter' | 'setter' | 'field' | 'accessor'
    name: string
    metadata: { [key: string]: any} | undefined
    // access: {
    //   get?(): any
    //   has?(value: any): void
    // }
    private?: boolean
    static?: boolean
    addInitializer(initializer: () => void): void
  },
): any => {
  if (context.static) {
    throw new Error(`Don't use @cached decorator on static properties`)
  }

  if (context.kind !== 'getter') {
    throw new Error('@cached can only decorate getters!')
  }

  return function (this: any, ...args: any) {
    let methodMap: Map<string, any>

    if (classInstanceCache.has(this)) {
      methodMap = classInstanceCache.get(this)
    } else if (nodeUtil.types.isProxy(this)) {
      // if we have a Proxy object, we need to get the target object.
      // we are doing a bit of a hack in @packages/graphql/src/makeGraphQLServer.ts
      // where we are creating a symbol on the proxy object for the original object
      // as we need a way to look up the original object here.
      const proxySymbol = Object.getOwnPropertySymbols(this).find((symbol) => {
        return symbol.description === 'PROXY_SOURCE_SYM'
      })

      if (proxySymbol) {
        methodMap = classInstanceCache.get(this[proxySymbol])
      } else {
        throw new Error('Could not find proxy symbol on object. @cached decorator does not know how to handle this Proxy object...')
      }
    } else {
      methodMap = new Map<string, any>()
      classInstanceCache.set(this, methodMap)
    }

    if (methodMap.has(context.name)) {
      return methodMap.get(context.name)
    }

    const result = target.apply(this, args)

    methodMap.set(context.name, result)

    return result
  }
}
