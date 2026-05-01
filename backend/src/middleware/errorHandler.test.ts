import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { ZodError, z } from 'zod'
import { errorHandler } from './errorHandler'

function makeApp(thrownError: unknown) {
  const testApp = express()
  testApp.get('/test', (_req, _res, next) => next(thrownError))
  testApp.use(errorHandler)
  return testApp
}

describe('errorHandler middleware', () => {
  it('returns 400 VALIDATION_ERROR for ZodError', async () => {
    let zodErr!: ZodError
    try { z.string().parse(42) } catch (e) { zodErr = e as ZodError }
    const res = await request(makeApp(zodErr)).get('/test')
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
    expect(typeof res.body.error).toBe('string')
  })

  it('returns 500 INTERNAL_ERROR for generic Error', async () => {
    const res = await request(makeApp(new Error('boom'))).get('/test')
    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
    expect(res.body.error).toBe('Internal server error')
  })

  it('returns 404 NOT_FOUND for status:404 error', async () => {
    const err = Object.assign(new Error('not found'), { status: 404 })
    const res = await request(makeApp(err)).get('/test')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns INTERNAL_ERROR for non-404 status errors', async () => {
    const err = Object.assign(new Error('forbidden'), { status: 403 })
    const res = await request(makeApp(err)).get('/test')
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('INTERNAL_ERROR')
  })

  it('returns 500 INTERNAL_ERROR for non-Error thrown values', async () => {
    const res = await request(makeApp('raw string error')).get('/test')
    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
    expect(res.body.error).toBe('Internal server error')
  })

  it('returns 500 INTERNAL_ERROR for invalid status code on error', async () => {
    const err = Object.assign(new Error('bad status'), { status: 9999 })
    const res = await request(makeApp(err)).get('/test')
    expect(res.status).toBe(500)
    expect(res.body.code).toBe('INTERNAL_ERROR')
  })
})
