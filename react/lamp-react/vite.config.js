import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'
import { promises as fs } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUT_DIR = path.resolve(__dirname, '../../www')

function cleanOldBuildPlugin() {
  async function deleteIfExists(target) {
    try {
      await fs.unlink(target)
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  }

  async function removeRootAssets(dir, extensions) {
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch (err) {
      if (err.code === 'ENOENT') return
      throw err
    }

    for (const entry of entries) {
      if (!entry.isFile()) continue
      if (!extensions.has(path.extname(entry.name))) continue
      await fs.unlink(path.join(dir, entry.name))
    }
  }

  return {
    name: 'clean-old-build',
    async buildStart() {
      await deleteIfExists(path.join(OUT_DIR, 'index.html'))
      await removeRootAssets(OUT_DIR, new Set(['.js', '.css']))
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cleanOldBuildPlugin()],
  base: '/',
  build: {
    outDir: '../../www',
    assetsDir: '.',
    emptyOutDir: false
  }
})
