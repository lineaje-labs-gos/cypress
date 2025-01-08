export const stringifyActual = (val) => {
  // @ts-expect-error - this exists, but not in TypeScript.
  return Cypress.utils.stringifyActual(val)
}

export const generateLog = ({ testId, hookId, id, name, message, type, number }: { testId?: string, hookId: string, id: `s${string}`, name: string, message: unknown, type: 'parent' | 'child', number?: number }) => {
  return {
    id,
    testId,
    hookId,
    name,
    message: message ? stringifyActual(message) : undefined,
    type,
    state: 'passed',
    instrument: 'command',
    number,
    numElements: 1,
    isStudio: true,
  }
}

export const generateBothLogs = ({ log, hookId, testId }) => {
  return [
    generateLog({
      testId,
      hookId,
      id: `s${log.id}-get`,
      name: 'get',
      message: log.selector,
      type: 'parent',
      number: log.id,
    }),
    generateLog({
      testId,
      hookId,
      id: `s${log.id}`,
      name: log.name,
      message: log.message,
      type: 'child',
    }),
  ]
}
