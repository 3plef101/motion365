import { useRef, useState } from 'react'
import { ArrowDown, ArrowRight, Code2, Film, Pause, Play, Sparkles } from 'lucide-react'
import sampleReel from '../out/fieldnotes.mp4'
import './Home.css'

const steps = [
  {
    number: '01',
    title: 'Write React scenes',
    description: 'Edit src/video/Video.tsx in your code editor. Build scenes with React, CSS, SVG, or WebGL.',
    icon: Code2,
  },
  {
    number: '02',
    title: 'Preview while coding',
    description: 'The browser player refreshes as you edit. Play or scrub to inspect each frame.',
    icon: Film,
  },
  {
    number: '03',
    title: 'Render and download',
    description: 'Click Render MP4. Motion365 exports the same composition and data shown in the preview.',
    icon: ArrowDown,
  },
]

const sceneExample = `// Inside src/video/Video.tsx
import { useCurrentFrame } from 'remotion'

export function Scene() {
  const frame = useCurrentFrame()
  return (
    <h1 style={{ opacity: Math.min(frame / 20, 1) }}>
      Hello motion
    </h1>
  )
}`

function Home() {
  const reelRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)

  const toggleReel = () => {
    const reel = reelRef.current
    if (!reel) return
    if (reel.paused) {
      void reel.play()
      setIsPlaying(true)
    } else {
      reel.pause()
      setIsPlaying(false)
    }
  }

  return (
    <main className="home-page">
      <header className="home-nav">
        <a className="home-brand" href="/" aria-label="Motion365 home">
          <span className="home-brand-mark"><Sparkles size={17} /></span>
          <span>motion<span>365</span></span>
        </a>
        <nav className="home-links" aria-label="Main navigation">
          <a href="#workflow">Workflow</a>
          <a href="#data">Data-driven</a>
          <a className="nav-studio-link" href="/studio">Open studio <ArrowRight size={14} /></a>
        </nav>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <video
          ref={reelRef}
          className="hero-reel"
          src={sampleReel}
          autoPlay
          loop
          muted
          playsInline
          aria-label="Silent preview of the Fieldnotes sample composition"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="hero-kicker"><span /> VIDEO PRODUCTION FOR REACT DEVELOPERS</div>
          <h1 id="home-title">Motion365</h1>
          <p className="hero-copy">Build videos in React.<br />Download them as MP4.</p>
          <p className="hero-detail">Start from a brief to draft an editable storyboard, or build scenes directly with React. Preview in the browser and render an MP4 when you are ready.</p>
          <div className="hero-actions">
            <a className="primary-link" href="/create">Create from a prompt <ArrowRight size={16} /></a>
            <a className="text-link" href="/studio">Open developer studio <Code2 size={15} /></a>
          </div>
        </div>
        <div className="hero-caption"><span>FIELDNOTES / SAMPLE COMPOSITION</span><button onClick={toggleReel} aria-label={isPlaying ? 'Pause silent sample reel' : 'Play silent sample reel'} title={isPlaying ? 'Pause sample reel' : 'Play sample reel'}>{isPlaying ? <Pause size={15} /> : <Play size={15} />}</button><span className="silent-label">SILENT SAMPLE</span></div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="section-intro"><div className="section-kicker">HOW MOTION365 WORKS</div><h2>Your code defines the video.</h2><p>Motion365 does not invent footage from a prompt. You write a React composition; the player previews it, and the render service exports it as an MP4.</p></div>
        <div className="workflow-steps">{steps.map(({ number, title, description, icon: Icon }) => <article className="workflow-step" key={number}><div className="step-top"><span>{number}</span><Icon size={18} /></div><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="data-section-home" id="data">
        <div className="data-copy"><div className="section-kicker">A VIDEO IS STILL A REACT COMPONENT</div><h2>Change the code.<br />Change the motion.</h2><p>Use typed props or API data to make a composition dynamic. The preview and MP4 render use the same component and current input values.</p><a className="text-link dark-link" href="/studio">Try the sample composition <ArrowRight size={15} /></a></div>
        <pre className="code-sample"><code>{sceneExample}</code></pre>
      </section>

      <footer className="home-footer"><a className="home-brand" href="/" aria-label="Motion365 home"><span className="home-brand-mark"><Sparkles size={15} /></span><span>motion<span>365</span></span></a><span>React components in. MP4 out.</span><a href="/studio">Open studio <ArrowRight size={14} /></a></footer>
    </main>
  )
}

export default Home