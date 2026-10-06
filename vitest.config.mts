import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },                          // lets tests import .tsx files
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },     // same "@/..." shortcut the app uses
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})