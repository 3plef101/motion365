import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import express from 'express'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'

const rootDir = process.cwd()
const renderDir = resolve(rootDir, 'out', 'renders')
const uploadDir = resolve(rootDir, 'out', 'uploads')
const port = Number(process.env.RENDER_PORT ?? 3001)
const jobs = new Map()
let activeJobId = null
let serveUrlPromise

const app = express()
app.use(express.json({ limit: '32kb' }))

const uploadTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

app.post('/api/uploads', express.raw({ type: [...uploadTypes.keys()], limit: '8mb' }), async (request, response) => {
  const extension = uploadTypes.get(request.headers['content-type']?.split(';')[0] ?? '')
  if (!extension || !Buffer.isBuffer(request.body) || request.body.length === 0) {
    response.status(415).json({ error: 'Upload a JPEG, PNG, or WebP image under 8 MB.' })
    return
  }

  try {
    await mkdir(uploadDir, { recursive: true })
    const filename = `${randomUUID()}.${extension}`
    await writeFile(resolve(uploadDir, filename), request.body, { flag: 'wx' })
    response.status(201).json({ url: `http://127.0.0.1:${port}/uploads/${filename}` })
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Image upload failed.' })
  }
})

app.use('/uploads', express.static(uploadDir, { fallthrough: false, maxAge: '1h' }))

function validateProps(props) {
  return props &&
    typeof props.brand === 'string' && props.brand.length > 0 && props.brand.length <= 80 &&
    typeof props.period === 'string' && props.period.length > 0 && props.period.length <= 40 &&
    Number.isFinite(props.growth) && Math.abs(props.growth) <= 100000 &&
    Number.isInteger(props.customers) && props.customers >= 0 && props.customers <= 1000000000 &&
    typeof props.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(props.accent)
}

function validateStoryboard(props) {
  if (!props || typeof props.prompt !== 'string' || props.prompt.trim().length === 0 || props.prompt.length > 2000) return false
  if (typeof props.accent !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(props.accent)) return false
  if (!Array.isArray(props.scenes) || props.scenes.length === 0 || props.scenes.length > 60) return false

  const validScenes = props.scenes.every((scene) =>
    scene && typeof scene.id === 'string' && scene.id.length <= 80 &&
    typeof scene.title === 'string' && scene.title.trim().length > 0 && scene.title.length <= 120 &&
    typeof scene.body === 'string' && scene.body.length <= 1200 &&
    Number.isInteger(scene.durationInFrames) && scene.durationInFrames >= 30 &&
    (scene.imageUrl === undefined || (typeof scene.imageUrl === 'string' && scene.imageUrl.startsWith(`http://127.0.0.1:${port}/uploads/`))),
  )
  const totalFrames = props.scenes.reduce((total, scene) => total + (scene?.durationInFrames || 0), 0)
  return validScenes && totalFrames <= 54000
}

function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
  }
}

async function getServeUrl() {
  serveUrlPromise ??= bundle({ entryPoint: resolve(rootDir, 'src/remotion.tsx') })
  return serveUrlPromise
}

async function runRender(job) {
  activeJobId = job.id
  job.status = 'rendering'

  try {
    await mkdir(renderDir, { recursive: true })
    const serveUrl = await getServeUrl()
    const composition = await selectComposition({
      serveUrl,
      id: job.compositionId,
      inputProps: job.inputProps,
    })

    await renderMedia({
      composition,
      serveUrl,
      inputProps: job.inputProps,
      codec: 'h264',
      crf: 16,
      outputLocation: job.outputPath,
      logLevel: 'error',
      onProgress: ({ progress }) => {
        job.progress = Math.round(progress * 100)
      },
    })

    job.status = 'completed'
    job.progress = 100
  } catch (error) {
    job.status = 'failed'
    job.error = error instanceof Error ? error.message.slice(0, 500) : 'Render failed'
  } finally {
    activeJobId = null
  }
}

app.post('/api/renders', (request, response) => {
  const compositionId = request.body?.compositionId ?? 'FieldnotesQuarterly'
  const inputProps = request.body?.inputProps
  const isValid = compositionId === 'FieldnotesQuarterly'
    ? validateProps(inputProps)
    : compositionId === 'PromptStoryboard'
      ? validateStoryboard(inputProps)
      : false
  if (!isValid) {
    response.status(400).json({ error: 'Composition props are invalid or exceed the 30-minute limit.' })
    return
  }

  if (activeJobId) {
    response.status(409).json({ error: 'A render is already in progress. Try again when it finishes.' })
    return
  }

  const id = randomUUID()
  const job = {
    id,
    compositionId,
    inputProps,
    outputPath: resolve(renderDir, `${id}.mp4`),
    status: 'queued',
    progress: 0,
    error: null,
  }
  jobs.set(id, job)
  void runRender(job)
  response.status(202).json(publicJob(job))
})

app.get('/api/renders/:id', (request, response) => {
  const job = jobs.get(request.params.id)
  if (!job) {
    response.status(404).json({ error: 'Render job not found.' })
    return
  }
  response.json(publicJob(job))
})

app.get('/api/renders/:id/download', (request, response) => {
  const job = jobs.get(request.params.id)
  if (!job || job.status !== 'completed') {
    response.status(404).json({ error: 'Rendered video is not available.' })
    return
  }
  response.download(job.outputPath, 'motion365.mp4')
})

if (process.env.NODE_ENV === 'production' || process.argv.includes('--production')) {
  const distDir = resolve(rootDir, 'dist')
  app.use(express.static(distDir))
  app.use((request, response, next) => {
    if (request.method !== 'GET' || request.path.startsWith('/api/')) {
      next()
      return
    }
    response.sendFile(resolve(distDir, 'index.html'))
  })
}

app.listen(port, '127.0.0.1', () => {
  console.log(`Motion365 render service listening at http://127.0.0.1:${port}`)
})