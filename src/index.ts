import fs from 'fs'
import path from 'path'
import toCase from 'change-case'
import { promisify } from 'util'
import { Readable } from 'stream'
import isPathValid from 'is-valid-path'

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

export enum StreamBehaviour {
  Strip = 'strip',
  Generic = 'generic',
  Native = 'native'
}

export interface PrototsOptions {
  keepComments?: boolean,
  streamBehaviour?: StreamBehaviour,
  stripEmtpyLines?: boolean
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
  return contents.replace(/syntax.*|option.*/gmi, '--remove--')
}

function tokenize (line: string): string[] {
  return line.trim().split(' ').filter(Boolean)
}

function getRpcType (type: string, isStream: boolean, behaviour: StreamBehaviour) {
  if (!isStream || behaviour === StreamBehaviour.Strip) return type

  return behaviour === StreamBehaviour.Native ? 'Stream' : `Stream<${type}>`
}

function parseRpcLine (line: string, streamBehaviour: StreamBehaviour) {
  const rpcRegex = /rpc (?<methodName>[^(]+)\((?<requestStream>stream)? ?(?<requestType>[^)]+)\) ?returns ?\((?<responseStream>stream)? ?(?<responseType>[^)]+)\) ?{}/igm

  const result = rpcRegex.exec(line)

  if (!result || !result.groups) {
    console.log(line, result)
    return line
  }

  const {
    methodName: _methodName,
    requestStream: _requestStream,
    requestType: _requestType,
    responseStream: _responseStream,
    responseType: _responseType
  } = result.groups

  const methodName = toCase.camel(_methodName)

  const requestVariableName = _requestStream && streamBehaviour !== StreamBehaviour.Strip
    ? `${toCase.camel(_requestType)}Stream`
    : toCase.camel(_requestType)

  const requestType = getRpcType(_requestType, Boolean(_requestStream), streamBehaviour)
  const responseType = getRpcType(_responseType, Boolean(_responseStream), streamBehaviour)

  return `${methodName} (${requestVariableName}: ${requestType}): ${responseType}`

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

function getLineParser (keepComments: boolean, streamBehaviour: StreamBehaviour, stripEmptyLines: boolean) {
  return (line: string) => parseLine(line, keepComments, streamBehaviour, stripEmptyLines)
}

function parseLine (line: string, keepComments: boolean, streamBehaviour: StreamBehaviour, stripEmptyLines: boolean): string {
  if (!line) return stripEmptyLines ? '--remove--' : ''

  const tokens = tokenize(line)
  let isRepeated = false
  let isOptional = syntax === 'proto3' ? true : false

  switch (tokens[0]) {
    case '//':
      return keepComments ? line : '--remove--'
    case '}':
      return `}`
    case 'message':
    case 'service':
      return `export interface ${tokens[1]}Service {`
    case 'rpc':
      return parseRpcLine(line, streamBehaviour)
    case 'package':
      hasPackage = true
      return `export namespace ${toCase.pascal(tokens[1].replace(';', ''))} {`
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

  return `${toCase.camel(tokens[1])}${isOptional ? '?' : ''}: ${convertToTypescriptTypes(tokens[0] as any)}${isRepeated ? '[]' : ''}`
}

async function parse (file: string | Buffer | Readable, options: PrototsOptions = {}): Promise<ParsedStruct> {
  const { keepComments = false, streamBehaviour = StreamBehaviour.Native, stripEmtpyLines = true } = options

  if (!(Object.values(StreamBehaviour).includes(streamBehaviour))) {
    throw new Error(`"${streamBehaviour}" is not a valid stream behaviour!`)
  }

  if (!file) throw new Error('No file specified')
  const fileContents = await readFile(file)

  syntax = getProtoVersion(fileContents) || syntax
  const clean = stripUselessSyntax(fileContents)
  const streamImportLine = `import Stream from '${streamBehaviour === StreamBehaviour.Native ? 'stream' : 'ts-stream'}'`

  const lines = clean.split('\n')
    .map(getLineParser(keepComments, streamBehaviour, stripEmtpyLines))
    .filter(line => !(/--remove--/.test(line)))

  const result = /stream/igm.test(clean) && streamBehaviour !== StreamBehaviour.Strip
    ? [streamImportLine, '', ...lines]
    : lines

  if (hasPackage) result.push('}')

  const parsed = result.join('\n')

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
