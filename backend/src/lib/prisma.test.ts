import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from './prisma'

describe('Prisma singleton', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('creates, reads, and deletes a Todo', async () => {
    const created = await prisma.todo.create({
      data: { text: 'smoke test todo' },
    })

    try {
      expect(created.id).toBeTruthy()
      expect(created.text).toBe('smoke test todo')
      expect(created.completed).toBe(false)
      expect(created.userId).toBeNull()
      expect(created.createdAt).toBeInstanceOf(Date)
      expect(created.updatedAt).toBeInstanceOf(Date)

      const fetched = await prisma.todo.findUniqueOrThrow({
        where: { id: created.id },
      })
      expect(fetched.id).toBe(created.id)
    } finally {
      await prisma.todo.delete({ where: { id: created.id } })
    }

    const gone = await prisma.todo.findUnique({ where: { id: created.id } })
    expect(gone).toBeNull()
  })
})
