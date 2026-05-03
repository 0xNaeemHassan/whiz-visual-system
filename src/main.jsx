import { FRAMES } from './data/frames';
import { FRAME_TEMPLATES } from './data/templates';
import { validateFrameData } from './domain/frameSchema';
import { FRAME_GUIDANCE_BY_ID } from './data/frameGuidance';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { IntlProvider } from './i18n/IntlProvider';
import { waitForCriticalFonts } from './utils/fontLoading';

async function bootstrap() {
  await waitForCriticalFonts({ profile: 'firstPaint' });
  ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><IntlProvider><App /></IntlProvider></React.StrictMode>);
}

bootstrap();

if (import.meta.env.DEV) {
  validateFrameData({ frames: FRAMES, templates: FRAME_TEMPLATES, guidanceById: FRAME_GUIDANCE_BY_ID });
}
