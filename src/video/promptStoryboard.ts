export type StoryboardScene = {
  id: string
  title: string
  body: string
  durationInFrames: number
  imageUrl?: string
}

export type PromptStoryboardProps = {
  prompt: string
  accent: string
  scenes: StoryboardScene[]
}

export const defaultPromptStoryboard: PromptStoryboardProps = {
  prompt: 'A short introduction to creative video',
  accent: '#d9f49c',
  scenes: [
    { id: 'scene-1', title: 'Start with an idea', body: 'Every video begins with a point of view.', durationInFrames: 600 },
    { id: 'scene-2', title: 'Shape the story', body: 'Turn your message into a sequence of clear, memorable scenes.', durationInFrames: 600 },
    { id: 'scene-3', title: 'Make it move', body: 'Build each moment with React, then render the finished video.', durationInFrames: 600 },
  ],
}

export const getStoryboardDurationInFrames = (scenes: StoryboardScene[]) =>
  scenes.reduce((total, scene) => total + scene.durationInFrames, 0)