import md5 from 'md5'
import { fs } from 'memfs'
import path from 'path'
import webpack from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import resolve from '../../util/resolve.mjs'

fs.join = path.join

const processCallback = async ({ file, fn, projectRoot }) => {
  const { getFullWebpackOptions } = (await import('@cypress/webpack-batteries-included-preprocessor')).default

  const source = fn.replace(/Cypress\.require/g, 'require')
  const typescriptPath = resolve.typescript(projectRoot)
  const webpackOptions = getFullWebpackOptions(file, typescriptPath)

  const inputFileName = md5(source)
  const inputDir = path.dirname(file)
  const inputPath = path.join(inputDir, inputFileName)
  const outputDir = '/'
  const outputFileName = 'output'
  const outputPath = `${outputDir}${outputFileName}.js`

  const modifiedWebpackOptions = {
    ...webpackOptions,
    entry: {
      [outputFileName]: inputPath,
    },
    output: {
      path: outputDir,
    },
    plugins: [
      new VirtualModulesPlugin({
        [inputPath]: source,
      }),
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
  }

  const compiler = webpack(modifiedWebpackOptions)

  compiler.outputFileSystem = fs

  return new Promise((resolve, reject) => {
    const handle = (err) => {
      if (err) {
        return reject(err)
      }

      // this won't throw an EMFILE error since it's using an in-memory file
      // system, so the usual restrictions on sync methods don't apply
      // eslint-disable-next-line no-restricted-syntax
      const result = fs.readFileSync(outputPath).toString()

      resolve(result)
    }

    compiler.run(handle)
  })
}

export default {
  processCallback,
}
