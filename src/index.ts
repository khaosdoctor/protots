import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { Readable } from 'stream'
import isPathValid from 'is-valid-path'
const writeAsync = promisify(fs.writeFile)

type ParsedStruct = {
  toString: () => string
  toFile: (path: string) => Promise<void>
}
type ProtobufTypes = {
  'double': string
  'float': string
  'int32': string
  'int64': string
  'uint32': string
  'uint64': string
  'sint32': string
  'sint64': string
  'fixed32': string
  'fixed64': string
  'sfixed32': string
  'sfixed64': string
  'bool': string
  'string': string
  'bytes': string
}

function convertToTypescriptTypes (token: keyof ProtobufTypes) {
  const types: ProtobufTypes = {
    'double': 'number',
    'float': 'number',
    'int32': 'number',
    'int64': 'number',
    'uint32': 'number',
    'uint64': 'number',
    'sint32': 'number',
    'sint64': 'number',
    'fixed32': 'number',
    'fixed64': 'number',
    'sfixed32': 'number',
    'sfixed64': 'number',
    'bool': 'boolean',
    'string': 'string',
    'bytes': 'string'
  }

  return types[token] || token
}

async function readFileStream (stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
  })
}

async function readFile (file: string | Buffer | Readable): Promise<string[]> {
  let content = null
  if (file instanceof Readable) {
    const stream = await readFileStream(file)
    return stream.split('\n')
  }
  if (typeof file === 'string' && isPathValid(file)) return readFile(fs.createReadStream(path.resolve(file)))
  if (file instanceof Buffer) content = file.toString('utf-8')
  if (typeof file === 'string') content = file
  if (!file || !content) return []

  return content.split('\n')
}

function parseLine (line: string): string {
  if (!line) return ''
  const indent = line.length - line.trimLeft().length
  const indentChar = line[0]

  const tokens = line.trim().split(' ').filter(Boolean)
  let isRepeated = false
  let isOptional = false

  switch (tokens[0]) {
    case '//':
      return line
    case '}':
      return '}'
    case 'message':
      return `interface ${tokens[1]} {`
    case 'required':
      tokens.shift()
      break
    case 'optional':
      isOptional = true
      tokens.shift()
      break
    case 'repeated':
      isRepeated = true
      tokens.shift()
  }

  return `${indentChar.repeat(indent)}${tokens[1]}${isOptional ? '?' : ''}: ${convertToTypescriptTypes(tokens[0] as any)}${isRepeated ? '[]' : ''}`
}

async function parse (file: string | Buffer | Readable): Promise<ParsedStruct> {
  const fileContents = await readFile(file)
  let parsed = ''

  for (const line of fileContents) {
    parsed += `${parseLine(line)}\n`
  }

  return {
    toString: () => parsed,
    toFile (path: string) {
      return writeAsync(path, parsed)
    }
  }
}

module.exports = parse
export default parse
export { parse }
