import { Composition } from 'remotion'
import { PromptVideo } from './video/PromptVideo'
import { defaultPromptStoryboard, getStoryboardDurationInFrames } from './video/promptStoryboard'
import { Video } from './video/Video'
import { videoProps } from './video/videoProps'

function RemotionRoot() {
  return (
    <>
    <Composition
      id="FieldnotesQuarterly"
      component={Video}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={videoProps}
    />
    <Composition
      id="PromptStoryboard"
      component={PromptVideo}
      durationInFrames={getStoryboardDurationInFrames(defaultPromptStoryboard.scenes)}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaultPromptStoryboard}
      calculateMetadata={({ props }) => ({ durationInFrames: getStoryboardDurationInFrames(props.scenes) })}
    />
    </>
  )
}

export default RemotionRoot