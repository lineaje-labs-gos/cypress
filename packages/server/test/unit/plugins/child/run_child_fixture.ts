import childProcess from 'child_process'
import type { ChildProcess } from 'child_process'
import path from 'path'

const REQUIRE_ASYNC_CHILD_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child.ts')

let proc: ChildProcess

process.on('message', (msg: any) => {
  if (msg.msg === 'spawn') {
    proc = childProcess.fork(REQUIRE_ASYNC_CHILD_PATH, ['--projectRoot', msg.data.projectRoot, '--file', path.join(msg.data.projectRoot, 'cypress.config.js')])
    proc.on('message', (msg: any) => {
      process.send!({ childMessage: msg })
    })

    process.send!({ childPid: proc.pid })
  }

  if (msg.msg === 'toChild') {
    proc.send(msg.data)
  }
})

// Just incase the test exits
process.on('disconnect', () => {
  process.exit()
})
