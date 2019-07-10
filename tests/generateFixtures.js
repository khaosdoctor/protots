const parse = require('../dist')
const fs = require('fs')

const protoFiles = [
  'full',
  'noPackage',
  'noService',
  'noSyntax',
  'proto2'
]

// Removes all files
fs.readdirSync(`${__dirname}/fixtures`)
  .filter((file) => /.*\.interface\.ts/gi.test(file))
  .map((file) => fs.unlinkSync(`${__dirname}/fixtures/${file}`))

for (let file of protoFiles) {
  const parserOptions = {
    keepComments: true,
    streamBehaviour: 'generic',
    stripEmtpyLines: true
  }

  parse(`${__dirname}/fixtures/${file}.proto`)
    .then((r) => r.toFile(`${__dirname}/fixtures/${file}_default_options.interface.ts`))
    .catch(console.error)

  parse(`${__dirname}/fixtures/${file}.proto`, parserOptions)
    .then((r) => r.toFile(`${__dirname}/fixtures/${file}_comments_generic_nolines.interface.ts`))
    .catch(console.error)

  parserOptions.keepComments = false
  parse(`${__dirname}/fixtures/${file}.proto`, parserOptions)
    .then((r) => r.toFile(`${__dirname}/fixtures/${file}_nocomments_generic_nolines.interface.ts`))
    .catch(console.error)

  parserOptions.keepComments = false
  parserOptions.streamBehaviour = 'native'
  parse(`${__dirname}/fixtures/${file}.proto`, parserOptions)
    .then((r) => r.toFile(`${__dirname}/fixtures/${file}_nocomments_native_nolines.interface.ts`))
    .catch(console.error)

  parserOptions.keepComments = false
  parserOptions.streamBehaviour = 'strip'
  parserOptions.stripEmtpyLines = false
  parse(`${__dirname}/fixtures/${file}.proto`, parserOptions)
    .then((r) => r.toFile(`${__dirname}/fixtures/${file}_nocomments_strip_lines.interface.ts`))
    .catch(console.error)
}
