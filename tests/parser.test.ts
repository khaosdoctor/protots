import { describe, it } from 'mocha'
import fs from 'fs'
import protots from '../src/'

describe('Parser', () => {
  describe('Parsing via buffer', () => {
    describe('parse with no package descriptor', () => {
      it('should not have namespace declarations', async () => {
        //
      })
    })

    describe('parse with no service descriptor', () => {
      it('should not have service declarations', async () => {
        //
      })
    })

    describe('parse with no useless syntaxes', () => {
      it('should not have comments or options', async () => {
        //
      })
    })

    describe('parse with useless syntaxes', () => {
      it('should not have comments or options', async () => {
        //
      })
    })

    describe('parse with proto2', () => {
      it('should support proto2 keywords like required and optional', async () => {
        //
      })
    })

    describe('parse with native streams', () => {
      it('should have stream as result of rpc', async () => {
        //
      })
    })

    describe('parse with generic streams', () => {
      it('should have a generic stream as result of rpc', async () => {
        //
      })
    })

    describe('parse with no streams', () => {
      it('should have no streams as result of rpc', async () => {
        //
      })
    })
  })

  describe('Parsing via stream', () => {
    //
  })

  describe('Parsing via file path', () => {
    //
  })
})
