import path from 'path'
import fs from 'fs-extra'

const snapshotFile = (filename: string) => path.join(__dirname, '..', 'e2e', 'runner', 'snapshots', `${filename}.json`)

export const writeMochaEventSnapshot = ({ filename, snapshots }) => {
  const jsonFile = snapshotFile(filename)

  // eslint-disable-next-line no-restricted-syntax
  fs.ensureFileSync(jsonFile)
  // eslint-disable-next-line no-restricted-syntax
  fs.writeFileSync(jsonFile, JSON.stringify(snapshots, null, 2))

  return null
}

export const readMochaEventSnapshot = ({ filename }) => {
  const jsonFile = snapshotFile(filename)

  if (!fs.existsSync(jsonFile)) {
    return null
  }

  // eslint-disable-next-line no-restricted-syntax
  return fs.readJsonSync(jsonFile)
}
