import { expect } from 'chai'
import { describe, it } from 'mocha'
import { parseRpcLine } from '../src'

describe('Parse RPC line', () => {
  const parsed = parseRpcLine('rpc ListFeatures(Rectangle) returns (stream Feature) {}')
  it('should be a valid typescript interface method', () => {
    expect(parsed).to.be.equal('listFeatures (rectangle: Rectangle): Feature')
  })
})
