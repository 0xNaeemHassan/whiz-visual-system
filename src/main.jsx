import { FRAMES } from './data/frames';
import { FRAME_TEMPLATES } from './data/templates';
import { validateFrameData } from './domain/frameSchema';
import { FRAME_GUIDANCE_BY_ID } from './data/frameGuidance';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);


if (import.meta.env.DEV) {
  validateFrameData({ frames: FRAMES, templates: FRAME_TEMPLATES, guidanceById: FRAME_GUIDANCE_BY_ID });
}
