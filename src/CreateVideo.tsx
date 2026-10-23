import { useEffect, useRef, useState } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { ArrowLeft, Download, ImagePlus, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { PromptVideo } from './video/PromptVideo'
import { type PromptStoryboardProps, type StoryboardScene } from './video/promptStoryboard'
import './CreateVideo.css'

const fps = 30
const maxDurationSeconds = 30 * 60

type RenderJob = {
  id: string
  status: 'queued' | 'rendering' | 'completed' | 'failed'
  progress: number
  error: string | null
}

function distributeFrames(totalSeconds: number, count: number) {
  const totalFrames = Math.round(totalSeconds * fps)
  const perScene = Math.floor(totalFrames / count)
  return Array.from({ length: count }, (_, index) => perScene + (index < totalFrames % count ? 1 : 0))
}

function draftStoryboard(prompt: string, durationSeconds: number): PromptStoryboardProps {
  const promptLines = prompt.split(/[\r\n]+|(?<=[.!?])\s+/).map((line) => line.trim()).filter(Boolean)
  const frames = distributeFrames(durationSeconds, 3)
  const fallbackBodies = [
    prompt.trim(),
    'Explain the most important benefit or idea in one clear moment.',
    'End with a memorable takeaway or a next step for the viewer.',
  ]

  return {
    prompt: prompt.trim(),
    accent: '#d9f49c',
    scenes: [
      { id: crypto.randomUUID(), title: 'Open with the idea', body: promptLines[0] || fallbackBodies[0], durationInFrames: frames[0] },
      { id: crypto.randomUUID(), title: 'Show why it matters', body: promptLines[1] || fallbackBodies[1], durationInFrames: frames[1] },
      { id: crypto.randomUUID(), title: 'Close with clarity', body: promptLines[2] || fallbackBodies[2], durationInFrames: frames[2] },
    ],
  }
}

function secondsForScene(scene: StoryboardScene) {
  return Number((scene.durationInFrames / fps).toFixed(1))
}

function formatDuration(frames: number) {
  const totalSeconds = Math.round(frames / fps)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds}s`
}

function CreateVideo() {
  const playerRef = useRef<PlayerRef>(null)
  const [prompt, setPrompt] = useState('A calm launch video for a new neighborhood coffee shop. Highlight the handmade drinks and invite people to visit.')
  const [durationSeconds, setDurationSeconds] = useState(30)
  const [storyboard, setStoryboard] = useState<PromptStoryboardProps | null>(null)
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null)
  const [renderError, setRenderError] = useState('')
  const [imageError, setImageError] = useState('')
  const [uploadingSceneId, setUploadingSceneId] = useState<string | null>(null)
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)

  const durationInFrames = storyboard?.scenes.reduce((total, scene) => total + scene.durationInFrames, 0) ?? 0

  const renderJobId = renderJob?.id
  const renderJobStatus = renderJob?.status
  useEffect(() => {
    if (!renderJobId || renderJobStatus === 'completed' || renderJobStatus === 'failed') return
    let cancelled = false
    let timer = 0
    const poll = async () => {
      try {
        const response = await fetch(`/api/renders/${renderJobId}`)
        const result = await response.json() as RenderJob & { error?: string }
        if (!response.ok) throw new Error(result.error ?? 'Could not check render status')
        if (cancelled) return
        setRenderJob(result)
        if (result.status === 'queued' || result.status === 'rendering') timer = window.setTimeout(poll, 900)
      } catch (error) {
        if (!cancelled) setRenderError(error instanceof Error ? error.message : 'Could not check render status')
      }
    }
    timer = window.setTimeout(poll, 500)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [renderJobId, renderJobStatus])

  const handleDraft = () => {
    const nextStoryboard = draftStoryboard(prompt, durationSeconds)
    setStoryboard(nextStoryboard)
    setActiveSceneId(nextStoryboard.scenes[0].id)
    setRenderJob(null)
    setRenderError('')
  }

  const updateScene = (sceneId: string, update: Partial<StoryboardScene>) => {
    setStoryboard((current) => {
      if (!current) return current
      const otherFrames = current.scenes.reduce((total, scene) => total + (scene.id === sceneId ? 0 : scene.durationInFrames), 0)
      const sceneFrameLimit = Math.max(30, maxDurationSeconds * fps - otherFrames)
      return {
        ...current,
        scenes: current.scenes.map((scene) => scene.id === sceneId
          ? { ...scene, ...update, durationInFrames: Math.min(update.durationInFrames ?? scene.durationInFrames, sceneFrameLimit) }
          : scene),
      }
    })
    setRenderJob(null)
  }

  const uploadSceneImage = async (sceneId: string, file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError('Images must be smaller than 8 MB.')
      return
    }
    setImageError('')
    setUploadingSceneId(sceneId)
    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const result = await response.json() as { url?: string; error?: string }
      if (!response.ok || !result.url) throw new Error(result.error ?? 'Image upload failed.')
      updateScene(sceneId, { imageUrl: result.url })
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Image upload failed.')
    } finally {
      setUploadingSceneId(null)
    }
  }

  const addScene = () => {
    if (!storyboard || storyboard.scenes.length >= 60 || durationInFrames + fps > maxDurationSeconds * fps) return
    const remainingFrames = maxDurationSeconds * fps - durationInFrames
    const scene: StoryboardScene = {
      id: crypto.randomUUID(),
      title: 'New scene',
      body: 'Describe the next moment in your story.',
      durationInFrames: Math.min(10 * fps, remainingFrames),
    }
    setStoryboard((current) => current && ({ ...current, scenes: [...current.scenes, scene] }))
    setActiveSceneId(scene.id)
    setRenderJob(null)
  }

  const removeScene = (sceneId: string) => {
    if (!storyboard || storyboard.scenes.length <= 1) return
    const scenes = storyboard.scenes.filter((scene) => scene.id !== sceneId)
    setStoryboard({ ...storyboard, scenes })
    if (activeSceneId === sceneId) setActiveSceneId(scenes[0].id)
    setRenderJob(null)
  }

  const startRender = async () => {
    if (!storyboard) return
    setRenderError('')
    setRenderJob(null)
    try {
      const response = await fetch('/api/renders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compositionId: 'PromptStoryboard', inputProps: storyboard }),
      })
      const result = await response.json() as RenderJob & { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Could not start render')
      setRenderJob(result)
    } catch (error) {
      setRenderError(error instanceof Error ? error.message : 'Could not start render')
    }
  }

  return (
    <main className="create-page">
      <header className="topbar create-topbar">
        <a className="brand" href="/" aria-label="Motion365 home"><span className="brand-mark">M</span><span>motion<span className="brand-light">365</span></span></a>
        <div className="create-breadcrumb">CREATE VIDEO <span>/</span> PROMPT STORYBOARD</div>
        <div className="topbar-actions">
          <a className="back-link" href="/studio"><ArrowLeft size={14} /> Developer studio</a>
          {renderJob?.status === 'completed' && <a className="download-button" href={`/api/renders/${renderJob.id}/download`}><Download size={14} /> Download MP4</a>}
          <button className="export-button" disabled={!storyboard || renderJob?.status === 'queued' || renderJob?.status === 'rendering'} onClick={startRender}>
            <Download size={14} />{renderJob?.status === 'rendering' ? `Rendering ${renderJob.progress}%` : renderJob?.status === 'queued' ? 'Starting render' : renderJob?.status === 'completed' ? 'Render again' : 'Render MP4'}
          </button>
        </div>
      </header>

      <div className="create-layout">
        <aside className="prompt-panel">
          <div className="create-eyebrow">LOCAL STORYBOARD DRAFTER</div>
          <h1>What video do you want to make?</h1>
          <p className="create-description">Describe the message and audience. Motion365 turns it into an editable scene outline using a local template.</p>
          <label className="create-label" htmlFor="video-prompt">Video brief</label>
          <textarea id="video-prompt" maxLength={2000} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the video, its audience, and the key message." />
          <div className="prompt-count">{prompt.length} / 2,000 characters</div>
          <label className="create-label duration-label" htmlFor="target-duration">Target duration</label>
          <div className="duration-input"><input id="target-duration" type="number" min={5} max={maxDurationSeconds} step={5} value={durationSeconds} onChange={(event) => setDurationSeconds(Math.min(maxDurationSeconds, Math.max(5, Number(event.target.value) || 5)))} /><span>seconds (up to 30 minutes)</span></div>
          <button className="draft-button" disabled={!prompt.trim()} onClick={handleDraft}><RefreshCw size={15} /> Draft editable scenes</button>
          <div className="local-note"><strong>No AI API is used.</strong><span>This drafts an outline from your text. Upload images per scene, or use the animated SVG artwork fallback. It does not generate photo/video assets or narration.</span></div>
          <div className="estimate-note">At 30 fps, 30 minutes is 54,000 frames. Long exports can take many minutes and need substantial disk space.</div>
        </aside>

        <section className="storyboard-workspace">
          <div className="storyboard-heading"><div><div className="create-eyebrow">STORYBOARD</div><h2>{storyboard ? `${storyboard.scenes.length} editable scenes` : 'Your draft will appear here'}</h2></div>{storyboard && <div className="storyboard-duration">{formatDuration(durationInFrames)} total</div>}</div>

          {storyboard ? <>
            <div className="storyboard-content">
              <div className="scene-list">
                {storyboard.scenes.map((scene, index) => <article className={`scene-card ${activeSceneId === scene.id ? 'selected' : ''}`} key={scene.id}>
                  <button className="scene-select" onClick={() => { setActiveSceneId(scene.id); playerRef.current?.seekTo(storyboard.scenes.slice(0, index).reduce((sum, item) => sum + item.durationInFrames, 0)) }} aria-label={`Preview scene ${index + 1}`}>
                    <span className="scene-number">{String(index + 1).padStart(2, '0')}</span><span className="scene-time">{secondsForScene(scene)}s</span>
                  </button>
                  <div className="scene-fields"><label><span>Scene title</span><input value={scene.title} maxLength={120} onChange={(event) => updateScene(scene.id, { title: event.target.value })} /></label><label><span>On-screen text</span><textarea value={scene.body} maxLength={1200} rows={2} onChange={(event) => updateScene(scene.id, { body: event.target.value })} /></label><div className="scene-image-field"><span>Scene image</span><div className="scene-image-control">{scene.imageUrl ? <img src={scene.imageUrl} alt={`Scene ${index + 1} image`} /> : <div className="generated-image-label">SVG art</div>}<label className="scene-image-pick"><ImagePlus size={12} />{uploadingSceneId === scene.id ? 'Uploading' : scene.imageUrl ? 'Replace' : 'Add image'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingSceneId === scene.id} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void uploadSceneImage(scene.id, file) }} /></label>{scene.imageUrl && <button className="remove-scene-image" onClick={() => updateScene(scene.id, { imageUrl: undefined })} aria-label="Remove scene image" title="Remove image"><X size={12} /></button>}</div></div><label className="scene-duration"><span>Seconds</span><input type="number" min={1} max={maxDurationSeconds} step={0.1} value={secondsForScene(scene)} onChange={(event) => updateScene(scene.id, { durationInFrames: Math.max(1, Math.round((Number(event.target.value) || 1) * fps)) })} /></label></div>
                  <button className="remove-scene" onClick={() => removeScene(scene.id)} disabled={storyboard.scenes.length <= 1} title="Remove scene" aria-label="Remove scene"><Trash2 size={14} /></button>
                </article>)}
              </div>
              <button className="add-scene" onClick={addScene} disabled={storyboard.scenes.length >= 60 || durationInFrames + fps > maxDurationSeconds * fps}><Plus size={14} /> Add scene</button>
              {imageError && <div className="image-upload-error" role="alert">{imageError}</div>}
              <div className="create-player-shell"><div className="create-player-heading"><span>LIVE PREVIEW</span><span>{storyboard.scenes.length} scenes · 30 fps · 1920 × 1080</span></div><Player ref={playerRef} component={PromptVideo} inputProps={storyboard} durationInFrames={durationInFrames} compositionWidth={1920} compositionHeight={1080} fps={fps} controls loop style={{ width: '100%' }} /></div>
            </div>
            {(renderJob || renderError) && <div className={`create-render-feedback ${renderJob?.status ?? 'failed'}`} role="status">{renderError ? renderError : renderJob?.status === 'completed' ? 'MP4 ready to download.' : renderJob?.status === 'failed' ? renderJob.error : renderJob?.status === 'queued' ? 'Preparing render…' : `Rendering MP4 · ${renderJob?.progress ?? 0}%`}{renderJob && renderJob.status !== 'failed' && <progress max={100} value={renderJob.progress} />}</div>}
          </> : <div className="empty-storyboard"><span>01</span><strong>Describe it. Draft it. Shape it.</strong><p>Your prompt becomes an editable 3-scene title-card outline. You can edit every line and duration before rendering.</p></div>}
        </section>
      </div>
    </main>
  )
}

export default CreateVideo