import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { PromptStoryboardProps, StoryboardScene } from './promptStoryboard'

function GeneratedBackdrop({ accent, sceneNumber }: { accent: string; sceneNumber: number }) {
  const frame = useCurrentFrame()
  const drift = interpolate(frame, [0, 90], [0, 26], { extrapolateRight: 'clamp' })
  const gradientId = `scene-gradient-${sceneNumber}`

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #18211a 0%, #111713 58%, #263120 100%)' }}>
      <svg viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: '0 0 0 auto', width: '70%', height: '100%' }} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={accent} stopOpacity="0.34" />
            <stop offset="1" stopColor={accent} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <circle cx={625 + drift} cy="290" r="245" fill={`url(#${gradientId})`} />
        <circle cx={625 + drift} cy="290" r="180" fill="none" stroke={accent} strokeOpacity="0.6" strokeWidth="2" />
        <circle cx={625 + drift} cy="290" r="112" fill="none" stroke="#f4f4ec" strokeOpacity="0.48" strokeWidth="1" />
        <path d={`M ${95 + drift} 485 C 270 435, 365 512, 510 375 S 704 190, 880 88`} fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="3" />
        <path d="M 95 0V600 M 275 0V600 M 455 0V600 M 635 0V600 M 815 0V600 M 0 120H900 M 0 300H900 M 0 480H900" fill="none" stroke="#f4f4ec" strokeOpacity="0.08" strokeWidth="1" />
      </svg>
    </AbsoluteFill>
  )
}

function StoryScene({ scene, sceneNumber, accent }: { scene: StoryboardScene; sceneNumber: number; accent: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 75 } })
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' })
  const y = interpolate(enter, [0, 1], [28, 0])

  return (
    <AbsoluteFill style={{ backgroundColor: '#101410', color: '#f4f4ec', fontFamily: 'Arial, sans-serif', padding: '7% 8%' }}>
      {scene.imageUrl
        ? <Img src={scene.imageUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.58 }} />
        : <GeneratedBackdrop accent={accent} sceneNumber={sceneNumber} />}
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(10, 14, 10, .9) 0%, rgba(10, 14, 10, .68) 52%, rgba(10, 14, 10, .2) 100%)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', color: accent, fontSize: 17, textTransform: 'uppercase' }}>
        <span>Motion365 storyboard</span>
        <span>{String(sceneNumber).padStart(2, '0')}</span>
      </div>
      <div style={{ position: 'absolute', top: '27%', left: '8%', right: '12%', opacity, transform: `translateY(${y}px)` }}>
        <h1 style={{ maxWidth: 1350, margin: 0, fontSize: 92, lineHeight: 1.06, fontWeight: 650, overflowWrap: 'break-word' }}>
          {scene.title}
        </h1>
        <p style={{ maxWidth: 1050, marginTop: 34, color: '#b9c0b3', fontSize: 34, lineHeight: 1.4 }}>
          {scene.body}
        </p>
      </div>
      <div style={{ position: 'absolute', right: '8%', bottom: '8%', width: 92, height: 4, backgroundColor: accent, transform: `scaleX(${Math.min(frame / Math.max(scene.durationInFrames, 1), 1)})`, transformOrigin: 'left' }} />
    </AbsoluteFill>
  )
}

export function PromptVideo({ scenes, accent }: PromptStoryboardProps) {
  const starts = scenes.map((_, index) =>
    scenes.slice(0, index).reduce((total, scene) => total + scene.durationInFrames, 0),
  )
  return (
    <AbsoluteFill style={{ backgroundColor: '#101410' }}>
      {scenes.map((scene, index) => (
          <Sequence key={scene.id} from={starts[index]} durationInFrames={scene.durationInFrames}>
            <StoryScene scene={scene} sceneNumber={index + 1} accent={accent} />
          </Sequence>
      ))}
    </AbsoluteFill>
  )
}