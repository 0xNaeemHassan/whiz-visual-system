import { memo } from 'react';
import { FrameShell } from './whizframe/FrameShell';

function WhizFrame(props) {
  return <FrameShell {...props} />;
}

export default memo(WhizFrame, (prev, next) => (
  prev.frame?.id === next.frame?.id &&
  prev.theme?.accent === next.theme?.accent &&
  prev.theme?.base === next.theme?.base &&
  prev.editMode === next.editMode &&
  prev.selectedEl === next.selectedEl &&
  prev.showGrid === next.showGrid &&
  prev.aspectRatio?.w === next.aspectRatio?.w &&
  prev.aspectRatio?.h === next.aspectRatio?.h &&
  prev.bgGradient === next.bgGradient &&
  prev.patternOverlay?.id === next.patternOverlay?.id &&
  prev.strictWhizMode === next.strictWhizMode &&
  JSON.stringify(prev.whizEffects) === JSON.stringify(next.whizEffects) &&
  JSON.stringify(prev.content) === JSON.stringify(next.content) &&
  JSON.stringify(prev.styleOverrides) === JSON.stringify(next.styleOverrides) &&
  JSON.stringify(prev.uploadedImages) === JSON.stringify(next.uploadedImages)
));
