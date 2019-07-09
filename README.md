# ProtoTS

> Generate typescript interfaces from protobuf files

## Summary

- [ProtoTS](#ProtoTS)
  - [Summary](#Summary)
  - [Installation](#Installation)
  - [Usage](#Usage)

## Installation

```
npm install protots
```

## Usage

ProtoTS exports only one method `parse` which can receive either a `Buffer`, a string with the file Path, the file string itself or a readable stream (of type `Readable`). And returns a promise with an object with two entries:

```ts
{
  toString: () => string,
  toFile: (path: string) => Promise<void>
}
```

So if you want to parse a file and get the string do this:

```ts
import {parse} from 'protots'
import fs from 'fs'

// From a buffer
const fileBuffer = fs.readFileSync('path/to/file')
const fileString = parse(fileBuffer).then(result => result.toString())

// From a stream
const fileStream = fs.createReadStream('path/to/file')
const fileString = parse(fileStream).then(result => result.toString())

// From a path
const fileString = parse('./path/to/file').then(result => result.toString())
```

And, if you want to save it to a file:

```ts
import {parse} from 'protots'
import fs from 'fs'

// From a buffer
const fileBuffer = fs.readFileSync('path/to/file')
const fileString = parse(fileBuffer).then(result => result.toFile('your/file/path.ts'))

// From a stream
const fileStream = fs.createReadStream('path/to/file')
const fileString = parse(fileStream).then(result => result.toFile('your/file/path.ts'))

// From a path
const fileString = parse('./path/to/file').then(result => result.toFile('your/file/path.ts'))
```
