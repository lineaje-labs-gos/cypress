process.env.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV ?? 'production'

import path from 'path'
import fs from 'fs-extra'
import { retrieveAndExtractStudioBundle, studioPath } from '@packages/server/lib/cloud/api/studio/get_and_initialize_studio_manager'
import { postStudioSession } from '@packages/server/lib/cloud/api/studio/post_studio_session'
import { ensureCyPromptBundle } from '@packages/server/lib/cloud/cy-prompt/ensure_cy_prompt_bundle'
import { postCyPromptSession } from '@packages/server/lib/cloud/api/cy-prompt/post_cy_prompt_session'
import os from 'os'
import chokidar from 'chokidar'

export const downloadStudioTypes = async (): Promise<void> => {
  const studioSession = await postStudioSession({ projectId: 'ypt4pf' })

  await retrieveAndExtractStudioBundle({ studioUrl: studioSession.studioUrl, projectId: 'ypt4pf' })

  await fs.copyFile(
    path.join(studioPath, 'app', 'types.ts'),
    path.join(__dirname, '..', '..', '..', 'packages', 'app', 'src', 'studio', 'studio-app-types.ts'),
  )

  await fs.copyFile(
    path.join(studioPath, 'server', 'types.ts'),
    path.join(__dirname, '..', '..', '..', 'packages', 'types', 'src', 'studio', 'studio-server-types.ts'),
  )
}

export const downloadPromptTypes = async (): Promise<void> => {
  if (!process.env.CYPRESS_LOCAL_CY_PROMPT_PATH) {
    const cyPromptSession = await postCyPromptSession({ projectId: 'ypt4pf' })
    // The cy prompt hash is the last part of the cy prompt URL, after the last slash and before the extension
    const cyPromptHash = cyPromptSession.cyPromptUrl.split('/').pop()?.split('.')[0]
    const cyPromptPath = path.join(os.tmpdir(), 'cypress', 'cy-prompt', cyPromptHash)

    await ensureCyPromptBundle({ cyPromptUrl: cyPromptSession.cyPromptUrl, cyPromptPath, projectId: 'ypt4pf' })

    await fs.copyFile(
      path.join(cyPromptPath, 'driver', 'types.ts'),
      path.join(__dirname, '..', '..', '..', 'packages', 'driver', 'src', 'cy', 'commands', 'prompt', 'prompt-driver-types.ts'),
    )

    await fs.copyFile(
      path.join(cyPromptPath, 'server', 'types.ts'),
      path.join(__dirname, '..', '..', '..', 'packages', 'types', 'src', 'cy-prompt', 'cy-prompt-server-types.ts'),
    )
  } else {
    const copyDriverTypes = async () => {
      await fs.copyFile(
        path.join(process.env.CYPRESS_LOCAL_CY_PROMPT_PATH!, 'driver', 'types.ts'),
        path.join(__dirname, '..', '..', '..', 'packages', 'driver', 'src', 'cy', 'commands', 'prompt', 'prompt-driver-types.ts'),
      )
    }
    const copyServerTypes = async () => {
      await fs.copyFile(
        path.join(process.env.CYPRESS_LOCAL_CY_PROMPT_PATH!, 'server', 'types.ts'),
        path.join(__dirname, '..', '..', '..', 'packages', 'types', 'src', 'cy-prompt', 'cy-prompt-server-types.ts'),
      )
    }

    const driverWatcher = chokidar.watch(path.join(process.env.CYPRESS_LOCAL_CY_PROMPT_PATH, 'driver', 'types.ts'), {
      awaitWriteFinish: true,
    })

    driverWatcher.on('ready', copyDriverTypes)
    driverWatcher.on('change', copyDriverTypes)

    const serverWatcher = chokidar.watch(path.join(process.env.CYPRESS_LOCAL_CY_PROMPT_PATH, 'server', 'types.ts'), {
      awaitWriteFinish: true,
    })

    serverWatcher.on('ready', copyServerTypes)
    serverWatcher.on('change', copyServerTypes)
  }
}
