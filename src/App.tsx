import { useEffect, useRef, useState } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { Activity, ChevronDown, CircleHelp, Code2, Command, Download, Expand, Layers3, Pause, Play, Plus, Settings2, SkipBack, Volume2 } from 'lucide-react'
import { Video, type VideoProps } from './video/Video'
import { videoProps } from './video/videoProps'
import Home from './Home'
import CreateVideo from './CreateVideo'
import './App.css'

const fps = 30
const durationInFrames = 360
const tracks = [
  { name: 'Opening title', color: 'mint', start: 0, length: 116 },
  { name: 'Growth story', color: 'coral', start: 116, length: 132 },
  { name: 'Closing card', color: 'blue', start: 248, length: 112 },
]

const formatTime = (frame: number) => {
  const seconds = Math.floor(frame / fps)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

type RenderJob = {
  id: string
  status: 'queued' | 'rendering' | 'completed' | 'failed'
  progress: number
  error: string | null
}

function Studio() {
  const playerRef = useRef<PlayerRef>(null)
  const [frame, setFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [inputProps, setInputProps] = useState(videoProps)
  const [dataUrl, setDataUrl] = useState('')
  const [dataStatus, setDataStatus] = useState('')
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null)
  const [renderError, setRenderError] = useState('')
  const renderJobId = renderJob?.id
  const renderJobStatus = renderJob?.status
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    const onFrame = ({ detail }: { detail: { frame: number } }) => setFrame(detail.frame)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    player.addEventListener('frameupdate', onFrame)
    player.addEventListener('play', onPlay)
    player.addEventListener('pause', onPause)
    return () => {
      player.removeEventListener('frameupdate', onFrame)
      player.removeEventListener('play', onPlay)
      player.removeEventListener('pause', onPause)
    }
  }, [])
  useEffect(() => {
    if (!renderJobId || renderJobStatus === 'completed' || renderJobStatus === 'failed') return
    let cancelled = false
    let timer = 0
    const poll = async () => {
      try {
        const response = await fetch(`/api/renders/${renderJobId}`)
        const job = await response.json() as RenderJob & { error?: string }
        if (!response.ok) throw new Error(job.error ?? 'Could not check render status')
        if (cancelled) return
        setRenderJob(job)
        if (job.status === 'queued' || job.status === 'rendering') {
          timer = window.setTimeout(poll, 800)
        }
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
  const seek = (next: number) => {
    const safeFrame = Math.max(0, Math.min(durationInFrames - 1, next))
    playerRef.current?.seekTo(safeFrame)
    setFrame(safeFrame)
  }
  const togglePlayback = () => {
    if (isPlaying) playerRef.current?.pause()
    else playerRef.current?.play()
    setIsPlaying(!isPlaying)
  }
  const loadApiData = async () => {
    try {
      setDataStatus('Loading...')
      const response = await fetch(dataUrl)
      if (!response.ok) throw new Error(`Request failed (${response.status})`)
      const data = await response.json() as Partial<VideoProps>
      setInputProps((current) => ({ ...current, ...data }))
      setDataStatus('Preview updated')
    } catch (error) {
      setDataStatus(error instanceof Error ? error.message : 'Could not load JSON')
    }
  }
  const startRender = async () => {
    setRenderError('')
    setRenderJob(null)
    try {
      const response = await fetch('/api/renders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputProps }),
      })
      const result = await response.json() as RenderJob & { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Could not start render')
      setRenderJob(result)
    } catch (error) {
      setRenderError(error instanceof Error ? error.message : 'Could not start render')
    }
  }

  return <main className="studio-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="Motion365 home"><span className="brand-mark"><Activity size={17} /></span><span>motion<span className="brand-light">365</span></span></a><div className="project-switcher"><span className="project-dot" />Fieldnotes / Q3 launch<ChevronDown size={14} /></div><div className="topbar-actions"><span className="save-state"><span /> All changes saved</span><button className="icon-button" title="Help" aria-label="Help"><CircleHelp size={17} /></button>{renderJob?.status === 'completed' && <a className="download-button" href={`/api/renders/${renderJob.id}/download`}><Download size={15} /> Download MP4</a>}<button className="export-button" onClick={startRender} disabled={renderJob?.status === 'queued' || renderJob?.status === 'rendering'}><Download size={15} />{renderJob?.status === 'rendering' ? `Rendering ${renderJob.progress}%` : renderJob?.status === 'queued' ? 'Starting render' : renderJob?.status === 'completed' ? 'Render again' : 'Render MP4'}</button></div></header>
    <div className="workspace" id="studio">
      <aside className="sidebar"><div className="side-label">PROJECT</div><button className="side-item active"><Layers3 size={16} /> Compositions <span className="side-count">1</span></button><button className="side-item"><Code2 size={16} /> Assets <span className="side-count">4</span></button><div className="side-divider" /><div className="side-label scene-label">COMPOSITIONS <button aria-label="Add composition"><Plus size={14} /></button></div><button className="composition-item selected"><span className="composition-thumb"><span /></span><span className="composition-copy"><strong>Q3 / Fieldnotes</strong><small>00:12 · 1920 × 1080</small></span><span className="live-dot" /></button><div className="side-bottom"><span className="avatar">JD</span><span className="user-copy"><strong>Jamie Doe</strong><small>Personal workspace</small></span><Settings2 size={16} /></div></aside>
      <section className="editor">
        <div className="editor-heading"><div><div className="eyebrow">COMPOSITION <span>/</span> LANDSCAPE</div><h1>Q3 / Fieldnotes</h1></div><button className="settings-button"><Settings2 size={15} /> Composition settings</button></div>
        <div className="preview-stage"><div className="stage-toolbar"><span className="stage-name"><span className="record-dot" /> Preview</span><span className="stage-size">1920 × 1080 <span>·</span> 30 fps</span><button className="icon-button" title="Fit preview" aria-label="Fit preview"><Expand size={15} /></button></div><div className="player-frame"><Player ref={playerRef} component={Video} inputProps={inputProps} durationInFrames={durationInFrames} compositionWidth={1920} compositionHeight={1080} fps={fps} loop controls={false} clickToPlay={false} moveToBeginningWhenEnded className="remotion-player" style={{ width: '100%' }} /></div><div className="player-controls"><div className="transport"><button className="icon-button" onClick={() => seek(0)} title="Go to start" aria-label="Go to start"><SkipBack size={16} /></button><button className="play-button" onClick={togglePlayback} title={isPlaying ? 'Pause' : 'Play'} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button><button className="icon-button" title="Volume" aria-label="Volume"><Volume2 size={16} /></button></div><div className="time-readout"><strong>{formatTime(frame)}</strong><span> / {formatTime(durationInFrames)}</span></div><button className="quality-button">1× <ChevronDown size={13} /></button></div></div>
        {(renderJob || renderError) && <div className={`render-feedback ${renderJob?.status ?? 'failed'}`} role="status">{renderError ? <span>{renderError}</span> : <><span>{renderJob?.status === 'completed' ? 'MP4 ready to download' : renderJob?.status === 'failed' ? renderJob.error : renderJob?.status === 'queued' ? 'Preparing render…' : `Rendering MP4 · ${renderJob?.progress ?? 0}%`}</span>{renderJob?.status !== 'failed' && <progress max={100} value={renderJob?.progress ?? 0} />}</>}</div>}
        <section className="timeline-panel" aria-label="Timeline"><div className="timeline-heading"><div className="timeline-title"><strong>Timeline</strong><span className="timeline-duration">12.0 sec</span></div><div className="timeline-actions"><button className="icon-button" title="Timeline settings" aria-label="Timeline settings"><Settings2 size={15} /></button><button className="icon-button" title="Add track" aria-label="Add track"><Plus size={16} /></button></div></div><div className="timeline-body"><div className="track-labels">{tracks.map((track) => <div className="track-label" key={track.name}><span className={`track-swatch ${track.color}`} />{track.name}</div>)}</div><div className="track-area"><div className="ruler">{[0, 2, 4, 6, 8, 10, 12].map((second) => <button key={second} onClick={() => seek(second * fps)} style={{ left: `${(second / 12) * 100}%` }}>{String(second).padStart(2, '0')}:00</button>)}</div><div className="clip-lanes">{tracks.map((track) => <button className={`clip ${track.color}`} key={track.name} style={{ left: `${(track.start / durationInFrames) * 100}%`, width: `${(track.length / durationInFrames) * 100}%` }} onClick={() => seek(track.start)}>{track.name}</button>)}</div><div className="playhead" style={{ left: `${(frame / (durationInFrames - 1)) * 100}%` }}><span /><input aria-label="Scrub timeline" type="range" min={0} max={durationInFrames - 1} value={frame} onChange={(event) => seek(Number(event.target.value))} /></div></div></div><div className="timeline-footer"><span>30 FPS</span><span>00:00:12:00 <span className="footer-divider">·</span> 3 scenes</span></div></section>
      </section>
      <aside className="inspector"><div className="inspector-tabs"><button className="inspector-tab active">Properties</button><button className="inspector-tab">Data</button></div><section className="inspector-section"><div className="inspector-title">Composition <ChevronDown size={14} /></div><div className="property-row"><span>Name</span><strong>Q3 / Fieldnotes</strong></div><div className="property-row"><span>Duration</span><strong>12 sec</strong></div><div className="property-row"><span>Frame rate</span><strong>30 fps</strong></div></section><section className="inspector-section"><div className="inspector-title">Video format <ChevronDown size={14} /></div><div className="format-options"><button className="format-option selected"><span className="landscape-icon" /><span><strong>Landscape</strong><small>16:9 · 1920 × 1080</small></span><span className="radio-check" /></button><button className="format-option"><span className="portrait-icon" /><span><strong>Portrait</strong><small>9:16 · 1080 × 1920</small></span><span className="radio-check" /></button></div></section><section className="inspector-section data-section"><div className="inspector-title">Input data <span className="data-live"><span /> LIVE</span><ChevronDown size={14} /></div><div className="data-card"><div><span className="data-key">brand</span><span className="data-value">{inputProps.brand}</span></div><div><span className="data-key">growth</span><span className="data-value">+{inputProps.growth}%</span></div><div><span className="data-key">period</span><span className="data-value">{inputProps.period}</span></div><label className="api-label" htmlFor="api-url">JSON endpoint</label><div className="api-load"><input id="api-url" type="url" placeholder="https://api.example.com/data" value={dataUrl} onChange={(event) => setDataUrl(event.target.value)} /><button onClick={loadApiData} disabled={!dataUrl}>Load</button></div>{dataStatus && <div className="data-status" role="status">{dataStatus}</div>}</div></section><div className="inspector-hint"><Command size={14} /><span>Composition powered by React</span></div></aside>
    </div>
  </main>
}

function App() {
  if (window.location.pathname === '/studio') return <Studio />
  if (window.location.pathname === '/create') return <CreateVideo />
  return <Home />
}

export default App
