import minimist from 'minimist'
import gracefulFs from 'graceful-fs'
import fs from 'fs'
import { suppress } from '../../util/suppress_warnings.js'
import util from '../util.js'
import { run } from './run_require_async_child.mjs'

process.title = 'Cypress: Config Manager'

async function main () {
  const { telemetry, OTLPTraceExporterIpc, decodeTelemetryContext } = await import('@packages/telemetry')

  const { file, projectRoot, telemetryCtx } = minimist(process.argv.slice(2))

  const { context, version } = decodeTelemetryContext(telemetryCtx)

  const exporter = new OTLPTraceExporterIpc()

  if (version && context) {
    telemetry.init({ namespace: 'cypress:child:process', context, version, exporter })
  }

  const span = telemetry.startSpan({ name: 'child:process', active: true })

  suppress()

  process.on('disconnect', () => {
    process.exit()
  })

  gracefulFs.gracefulify(fs)
  const ipc = util.wrapIpc(process)

  exporter.attachIPC(ipc)

  ipc.on('main:process:will:disconnect', async () => {
    if (span) {
      span.end()
    }

    await telemetry.shutdown()
    ipc.send('main:process:will:disconnect:ack')
  })

  run(ipc, file, projectRoot)
}

main()
