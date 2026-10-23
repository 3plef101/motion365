import type { ReactNode } from 'react'
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

export type VideoProps = {
  brand: string
  period: string
  growth: number
  customers: number
  accent: string
}

const sceneLength = [116, 132, 112]

function SceneFrame({ children, label, number }: { children: ReactNode; label: string; number: string }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#101410',
        color: '#f3f1e8',
        padding: '70px 82px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 17,
          textTransform: 'uppercase',
        }}
      >
        <span style={{ color: '#c8fa62' }}>● &nbsp;{label}</span>
        <span style={{ color: '#81877d' }}>{number} / 03</span>
      </div>
      {children}
      <div
        style={{
          position: 'absolute',
          bottom: 44,
          left: 82,
          right: 82,
          display: 'flex',
          justifyContent: 'space-between',
          color: '#858a80',
          fontSize: 15,
          textTransform: 'uppercase',
        }}
      >
        <span>Independent by nature</span>
        <span>FIELDNOTES&nbsp;&nbsp; / &nbsp;&nbsp;2025</span>
      </div>
    </AbsoluteFill>
  )
}

function Opening({ brand, period }: VideoProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 95 } })
  const rotate = interpolate(frame, [0, 115], [-12, 18])
  const titleOpacity = interpolate(frame, [0, 10], [0.62, 1], { extrapolateRight: 'clamp' })

  return (
    <SceneFrame label="Quarterly field report" number="01">
      <div
        style={{
          position: 'absolute',
          top: 215,
          left: 82,
          width: 780,
          opacity: titleOpacity,
          transform: `translateY(${interpolate(enter, [0, 1], [34, 0])}px)`,
        }}
      >
        <div style={{ color: '#a8aea2', fontSize: 23, marginBottom: 24 }}>
          {period} &nbsp; / &nbsp; ISSUE NO. 08
        </div>
        <div style={{ fontSize: 108, lineHeight: 0.94, fontWeight: 700 }}>
          {brand}
          <br />
          <span style={{ color: '#c8fa62' }}>in motion.</span>
        </div>
        <div style={{ marginTop: 37, fontSize: 24, color: '#a8aea2' }}>
          A quarter of quiet, compounding progress.
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 135,
          top: 250,
          width: 420,
          height: 420,
          border: '1px solid #525a4c',
          borderRadius: '50%',
          transform: `rotate(${rotate}deg) scale(${0.76 + enter * 0.24})`,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            width: 300,
            height: 300,
            border: '1px solid #c8fa62',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              width: 145,
              height: 145,
              background: '#c8fa62',
              borderRadius: '50%',
              opacity: 0.88,
            }}
          />
        </div>
        <span style={{ position: 'absolute', top: 18, right: 47, color: '#c8fa62', fontSize: 20 }}>
          ✳
        </span>
      </div>
    </SceneFrame>
  )
}

function Growth({ brand, growth, customers }: VideoProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = spring({ frame, fps, config: { damping: 20, stiffness: 80 } })
  const heights = [95, 132, 118, 181, 164, 230, 211, 294]

  return (
    <SceneFrame label="The numbers" number="02">
      <div
        style={{
          position: 'absolute',
          top: 185,
          left: 82,
          fontSize: 76,
          lineHeight: 1,
          fontWeight: 600,
        }}
      >
        Growing on
        <br />
        our own terms.
      </div>
      <div
        style={{
          position: 'absolute',
          right: 82,
          top: 206,
          width: 610,
          height: 360,
          borderBottom: '1px solid #42483e',
          borderLeft: '1px solid #42483e',
          display: 'flex',
          alignItems: 'end',
          justifyContent: 'space-around',
          padding: '0 20px',
        }}
      >
        {heights.map((height, index) => (
          <div
            key={index}
            style={{
              width: 48,
              height: height * progress,
              background: index === heights.length - 1 ? '#c8fa62' : '#526046',
              borderRadius: '3px 3px 0 0',
              opacity: interpolate(frame, [index * 4, index * 4 + 12], [0.3, 1], {
                extrapolateRight: 'clamp',
              }),
            }}
          />
        ))}
        <svg
          viewBox="0 0 600 220"
          style={{
            position: 'absolute',
            width: '95%',
            height: '78%',
            left: '2.5%',
            top: '5%',
            overflow: 'visible',
          }}
          role="img"
          aria-label="Upward trend line"
        >
          <path
            d="M 12 198 C 100 178, 136 154, 210 160 S 330 110, 386 124 S 484 60, 588 10"
            fill="none"
            stroke="#f3f1e8"
            strokeWidth="3"
            strokeDasharray="700"
            strokeDashoffset={700 * (1 - progress)}
          />
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 82, top: 570, display: 'flex', gap: 100 }}>
        <div>
          <div style={{ fontSize: 74, color: '#c8fa62', fontWeight: 600 }}>+{growth}%</div>
          <div style={{ color: '#a8aea2', fontSize: 18, textTransform: 'uppercase' }}>
            Revenue growth
          </div>
        </div>
        <div>
          <div style={{ fontSize: 74, color: '#f3f1e8', fontWeight: 600 }}>
            {customers.toLocaleString('en-US')}
          </div>
          <div style={{ color: '#a8aea2', fontSize: 18, textTransform: 'uppercase' }}>
            People choosing {brand}
          </div>
        </div>
      </div>
    </SceneFrame>
  )
}

function Closing({ brand, accent }: VideoProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 90 } })

  return (
    <SceneFrame label="Looking ahead" number="03">
      <div
        style={{
          position: 'absolute',
          left: 82,
          top: 235,
          width: 1050,
          transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
          opacity: enter,
        }}
      >
        <div style={{ fontSize: 83, lineHeight: 1.08, fontWeight: 600 }}>
          Good things take time.
          <br />
          <span style={{ color: accent }}>We have plenty.</span>
        </div>
        <div style={{ marginTop: 46, fontSize: 27, color: '#a8aea2' }}>
          Thank you for being part of the story.
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 110,
          bottom: 178,
          width: 155,
          height: 155,
          borderRadius: '50%',
          border: `2px solid ${accent}`,
          transform: `scale(${0.7 + enter * 0.3}) rotate(${frame * 0.55}deg)`,
          display: 'grid',
          placeItems: 'center',
          color: accent,
          fontSize: 52,
        }}
      >
        ✳
      </div>
      <div
        style={{
          position: 'absolute',
          left: 82,
          bottom: 135,
          color: accent,
          fontSize: 22,
          textTransform: 'uppercase',
        }}
      >
        {brand}.com &nbsp; ↗
      </div>
    </SceneFrame>
  )
}

export function Video(props: VideoProps) {
  const secondStart = sceneLength[0]
  const thirdStart = secondStart + sceneLength[1]

  return (
    <AbsoluteFill style={{ backgroundColor: '#101410' }}>
      <Sequence durationInFrames={sceneLength[0]}>
        <Opening {...props} />
      </Sequence>
      <Sequence from={secondStart} durationInFrames={sceneLength[1]}>
        <Growth {...props} />
      </Sequence>
      <Sequence from={thirdStart} durationInFrames={sceneLength[2]}>
        <Closing {...props} />
      </Sequence>
    </AbsoluteFill>
  )
}