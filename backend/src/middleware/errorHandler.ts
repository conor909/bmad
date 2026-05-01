import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? 'Validation failed'
    res.status(400).json({ error: message, code: 'VALIDATION_ERROR' })
    return
  }

  if (err instanceof Error && 'status' in err) {
    const raw = (err as Error & { status: unknown }).status
    const status =
      Number.isInteger(raw) && (raw as number) >= 100 && (raw as number) <= 599
        ? (raw as number)
        : 500
    const code = status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'
    res.status(status).json({ error: err.message, code })
    return
  }

  console.error(err)
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
}
