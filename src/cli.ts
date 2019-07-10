#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import caporal from 'caporal'
import { promisify } from 'util'
const pkg = require('../package.json')
import parse, { PrototsOptions } from '.'

const mkdir = promisify(fs.mkdir)
const stat = promisify(fs.stat)

async function ensurePathExists (path: string) {
  try {
    const stats = await stat(path)

    if (!(stats.isDirectory())) throw new Error('Specified path exists and is not a directory, but multiple input files were given')

    return
  } catch (err) {
    if (err.code === 'ENOENT') {
      await mkdir(path, { recursive: true })
      return
    }

    throw err
  }
}

caporal.version(pkg.version)
  .option('-c, --keepComments', 'Wether to keep comment lines', caporal.BOOLEAN, false, false)
  .option('-s, --streamBehaviour [behaviour]', 'How to convert streams', ['strip', 'native', 'generic'], 'native', false)
  .option('-e, --keepEmptyLines', 'Wether to keep empty lines', caporal.BOOLEAN, true, false)
  .option('-o, --output [path]', 'Path of the generated output (folder if more than one file is passed)', caporal.STRING, 'stdout', false)
  .argument('<files...>', 'File name(s) to parse')
  .action(async (args, options, logger) => {
    logger.debug(`args: ${args}`)
    logger.debug(`options: ${options}`)

    const files: string[] = args.files

    const printResult = options.output === 'stdout'
    const output = options.output

    const parseOptions: PrototsOptions = {
      keepComments: options.keepComments,
      stripEmtpyLines: !options.keepEmptyLines,
      streamBehaviour: options.streamBehaviour
    }

    const parseWithOptions = (options: PrototsOptions) => async (file: string) => ({ result: await parse(file, options), file })

    if (files.length === 1) {
      const [ filePath ] = files
      const result = await parse(filePath, parseOptions)

      if (printResult) return console.log(result.toString())

      await result.toFile(output)
      return console.log('Done :D')
    }

    const results = await Promise.all(files.map(parseWithOptions(parseOptions)))

    if (printResult) {
      return results.forEach(({ result, file }) => {
        console.log(`// ----- ${file} -----\n\n`)
        console.log(result.toString())
      })
    }

    await ensurePathExists(output)

    await Promise.all(results.map(({ result, file }) => {
      const destinationFileName = `${path.basename(file, '.proto')}.ts`
      const outputPath = path.join(output, destinationFileName)

      return result.toFile(outputPath)
    }))

    console.log('Done :D')
  })

caporal.parse(process.argv)
