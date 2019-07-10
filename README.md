# ProtoTS

> Generate typescript interfaces from protobuf files

## Summary

- [ProtoTS](#ProtoTS)
  - [Summary](#Summary)
  - [Installation](#Installation)
  - [Usage](#Usage)
    - [Options](#Options)
    - [Streams](#Streams)
    - [Example file](#Example-file)

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

### Options

ProtoTS has an options object wich allows you to define some behaviours you might want to change. These options are:

- `keepComments?: boolean`
  - Default: `false`
  - Description: Wether to keep the comment lines. This is false by default, since the output is not intented to be human-readable
- `streamBehaviour?: 'strip' | 'generic' | 'native'`
  - Default: `native`
  - Description: How to handle `stream` request and response types in RPCs. See [Streams](#Streams).
- `stripEmtpyLines?: boolean`
  - Default: `true`
  - Wether to remove emtpy lines (all of them). This is `true` by default, since the output is not intended to be human-readable

### Streams

The included typescript `Stream` type is not generic and, apperently, [it won't be](https://github.com/Microsoft/TypeScript/issues/25277). That leaves us with a problem: how to handle gRPC `stream` inputs and outputs?

This library offers three options, which are explained below, together with examples of the output produced by each of them given the following input:

```proto
rpc RouteChat(stream RouteNote) returns (stream RouteNote) {}
```

- Native (`streamBehaviour: 'native'`):

Uses the default, included typescript `Stream` types, wich will actually leave that stream's content with an any type.

Turns the example RPC into this:

```ts
routeChat (routeNoteStream: Stream): Stream
```

- Generic (`streamBehaviour: 'generic'`):

Uses (https://npmjs.org/packages/ts-stream)[ts-stream]'s `Stream` types, which are generic.

Turns the example RPC into this:

```ts
routeChat (routeNoteStream: Stream<RouteNote>): Stream<RouteNote>
```

> Note: this depends on the manual addition, by you, of the ts-stream package to your project's dependencies

- Strip (`streamBehaviour: 'generic'`):

Does not handle input and output as streams, assumes that one request will come and be returned at a time.

Turns the example RPC into this:

```ts
routeChat (routeNote: RouteNote): RouteNote
```

### Example file

Take this as an example protobuf file (taken from [gRPC's repository](https://github.com/grpc/grpc/blob/v1.22.0/examples/protos/route_guide.proto/)):

```proto
// Copyright 2015 gRPC authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

syntax = "proto3";

option java_multiple_files = true;
option java_package = "io.grpc.examples.routeguide";
option java_outer_classname = "RouteGuideProto";
option objc_class_prefix = "RTG";

package routeguide;

// Interface exported by the server.
service RouteGuide {
  // A simple RPC.
  //
  // Obtains the feature at a given position.
  //
  // A feature with an empty name is returned if there's no feature at the given
  // position.
  rpc GetFeature(Point) returns (Feature) {}
  // A server-to-client streaming RPC.
  //
  // Obtains the Features available within the given Rectangle.  Results are
  // streamed rather than returned at once (e.g. in a response message with a
  // repeated field), as the rectangle may cover a large area and contain a
  // huge number of features.
  rpc ListFeatures(Rectangle) returns (stream Feature) {}
  // A client-to-server streaming RPC.
  //
  // Accepts a stream of Points on a route being traversed, returning a
  // RouteSummary when traversal is completed.
  rpc RecordRoute(stream Point) returns (RouteSummary) {}
  // A Bidirectional streaming RPC.
  //
  // Accepts a stream of RouteNotes sent while a route is being traversed,
  // while receiving other RouteNotes (e.g. from other users).
  rpc RouteChat(stream RouteNote) returns (stream RouteNote) {}
}

// Points are represented as latitude-longitude pairs in the E7 representation
// (degrees multiplied by 10**7 and rounded to the nearest integer).
// Latitudes should be in the range +/- 90 degrees and longitude should be in
// the range +/- 180 degrees (inclusive).
message Point {
  int32 latitude = 1;
  int32 longitude = 2;
}

// A latitude-longitude rectangle, represented as two diagonally opposite
// points "lo" and "hi".
message Rectangle {
  // One corner of the rectangle.
  Point lo = 1;
  // The other corner of the rectangle.
  Point hi = 2;
}

// A feature names something at a given point.
//
// If a feature could not be named, the name is empty.
message Feature {
  // The name of the feature.
  string name = 1;
  // The point where the feature is detected.
  Point location = 2;
}

// A RouteNote is a message sent while at a given point.
message RouteNote {
  // The location from which the message is sent.
  Point location = 1;
  // The message to be sent.
  string message = 2;
}

// A RouteSummary is received in response to a RecordRoute rpc.
//
// It contains the number of individual points received, the number of
// detected features, and the total distance covered as the cumulative sum of
// the distance between each point.
message RouteSummary {
  // The number of points received.
  int32 point_count = 1;
  // The number of known features passed while traversing the route.
  int32 feature_count = 2;
  // The distance covered in metres.
  int32 distance = 3;
  // The duration of the traversal in seconds.
  int32 elapsed_time = 4;
}
```

ProtoTS will (with the default options) convert it into:

```ts
export namespace Routeguide {
export interface RouteGuideService {
getFeature (point: Point): Feature
listFeatures (rectangle: Rectangle): Feature
recordRoute (point: Point): RouteSummary
routeChat (routeNote: RouteNote): RouteNote
}
export interface PointService {
latitude?: number
longitude?: number
}
export interface RectangleService {
lo?: Point
hi?: Point
}
export interface FeatureService {
name?: string
location?: Point
}
export interface RouteNoteService {
location?: Point
message?: string
}
export interface RouteSummaryService {
pointCount?: number
featureCount?: number
distance?: number
elapsedTime?: number
}
}

```

> Note that indentation was not preserved, since the generated output shuold not be considered a source code file, and should not be edited by hand, and thus doesn't need to be human-readable
