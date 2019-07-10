import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { Readable } from 'stream'
import isPathValid from 'is-valid-path'
import toCase from 'change-case'

let syntax = 'proto3'
let hasPackage = false
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

async function readFileStream (stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
  })
}

async function readFile (file: string | Buffer | Readable): Promise<string> {
  let content = null
  if (file instanceof Readable) {
    const stream = await readFileStream(file)
    return stream
  }
  if (typeof file === 'string' && isPathValid(file)) return readFile(fs.createReadStream(path.resolve(file)))
  if (file instanceof Buffer) content = file.toString('utf-8')
  if (typeof file === 'string') content = file
  if (!file || !content) return ''

  return content
}

function getProtoVersion (contents: string): string | null {
  const obtainedSyntax = /(?!syntax = ")(proto[0-9])(?=";)/gmi.exec(contents)
  return obtainedSyntax ? obtainedSyntax.shift() as string : null
}

function stripUselessSyntax (contents: string): string {
  return contents.replace(/syntax.*|option.*/gmi, '')
}


function tokenize (line: string): string[] {
  return line.trim().split(' ').filter(Boolean)
}

function firstToLower (word: string) {
  return `${word[0].toLowerCase()}${word.slice(1)}`
}

function readIndentation (line: string) {
  const indent = line.length - line.trimLeft().length
  const indentChar = line[0]

  return { indent, indentChar }
}

function parseRpcLine (line: string) {
  const { indent, indentChar } = readIndentation(line)
  const [, methodWithParams, , responseType] = tokenize(line.replace(/stream /ig, ''))
  const [methodName, requestType] = methodWithParams.replace(')', '').split('(')

  return `${indentChar.repeat(indent)}${firstToLower(methodName)} (${firstToLower(requestType)}: ${requestType}): ${responseType.replace(/\(|\)/ig, '')}`
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

function parseLine (line: string): string {
  if (!line) return ''
  const { indent, indentChar } = readIndentation(line)

  const tokens = tokenize(line)
  let isRepeated = false
  let isOptional = syntax === 'proto3' ? true : false

  switch (tokens[0]) {
    case '//':
      return line
    case '}':
      return `${' '.repeat(hasPackage ? 2 : 0)}}`
    case 'message':
    case 'service':
      return `${' '.repeat(hasPackage ? 2 : 0)}interface ${tokens[1]} {`
    case 'rpc':
      return parseRpcLine(line)
    case 'package':
      hasPackage = true
      return `namespace ${toCase.pascal(tokens[1].replace(';', ''))} {`
    case 'required':
      isOptional = false
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

  return `${indentChar.repeat(indent + (hasPackage ? 2 : 0))}${tokens[1]}${isOptional ? '?' : ''}: ${convertToTypescriptTypes(tokens[0] as any)}${isRepeated ? '[]' : ''}`
}

async function parse (file: string | Buffer | Readable): Promise<ParsedStruct> {
  if (!file) throw new Error('No file specified')
  const fileContents = await readFile(file)

  syntax = getProtoVersion(fileContents) || syntax

  let parsed = ''
  for (const line of stripUselessSyntax(fileContents).split('\n')) {
    parsed += `${parseLine(line)}\n`
  }

  parsed += hasPackage ? '}\n' : ''

  return {
    toString: () => parsed,
    toFile (path: string) {
      return writeAsync(path, parsed)
    }
  }
}

module.exports = parse
module.exports.parseRpcLine = parseRpcLine
export default parse
export { parse, parseRpcLine }
