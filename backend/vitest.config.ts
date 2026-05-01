import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

config({ path: '.env' })

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
})
