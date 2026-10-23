# Motion365

Motion365 is a code-first video tool for React developers. You write scenes as React components, preview and scrub them in the browser, then click **Render MP4** to download the video. It does not generate footage from a text prompt; your code defines what appears.

Scenes can use CSS, SVG, canvas, or WebGL. Remotion drives frame-based animation and renders the same React composition used by the browser preview.

The public homepage is at `/`; the interactive composition studio is at `/studio`.
The prompt storyboard creator is at `/create`.

## Start

```sh
npm install
npm run dev
```

This starts Vite and the local Remotion render service together. Open the local URL printed in the terminal to use the player and scrubber. Vite provides fast refresh while editing.

## Create a composition

Edit `src/video/Video.tsx`. `Video` is a regular React component; `Sequence` places scene components on the frame timeline, and Remotion hooks such as `useCurrentFrame`, `spring`, and `interpolate` drive deterministic animation. Keep the composition free of browser-only state so the same component works in the preview and renderer.

The example accepts typed `VideoProps`. Update its defaults in `videoProps`, pass alternate props to the player, or use the studio's JSON endpoint field to fetch props while previewing. The endpoint must allow browser CORS requests and return JSON matching `VideoProps`.

## Create from a brief

Open `/create`, enter a brief, and choose a target duration from 5 seconds to 30 minutes. Motion365 locally turns the brief into a three-scene editable storyboard. Edit each scene's title, on-screen text, duration, and optional image; preview it, then render the MP4. JPEG, PNG, and WebP uploads are limited to 8 MB and stored under `out/uploads`.

This first version is a template-based storyboard drafter, not an AI model: it uses no external API, and it does not generate photo/video footage, voice, or React source code. Empty image slots use procedural animated SVG artwork. A real AI prompt interpreter or generative media requires connecting a model provider and configuring credentials on the server. Thirty-minute exports are allowed, but at 30 fps they contain up to 54,000 frames and may take many minutes to render.

## Render MP4

In the studio, click **Render MP4**. Motion365 sends the current typed input props to the local render service, shows progress, then provides a download link when the video is complete.

For batch rendering from the command line:

```sh
npm run render
```

The CLI renders `FieldnotesQuarterly` from `src/remotion.tsx` to `out/fieldnotes.mp4` using H.264 at CRF 16. To render with a props JSON file, pass it through to Remotion:

```sh
npm run render -- --props=./data/fieldnotes.json
```

For API-driven batch renders, fetch the API response to a JSON file first, then pass that file as `--props`. Rendering requires a supported local Chromium installation; Remotion will guide you through browser setup if needed.
Remotion displays a license notice in the player. Review its current license terms for your intended production use before shipping.

`npm start` serves the built site and render API locally after `npm run build`. The render service binds to `127.0.0.1`; before exposing it publicly, add authentication, rate limits, persistent job storage, and isolated render workers.

## Project map

- `src/video/Video.tsx`: reusable scenes and video props.
- `src/remotion.tsx`: CLI composition registration and output dimensions.
- `src/App.tsx`: browser player, transport controls, timeline scrubber, and API data preview.
- `src/App.css`: studio layout and responsive styles.