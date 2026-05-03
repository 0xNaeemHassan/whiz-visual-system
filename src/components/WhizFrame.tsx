import { memo } from 'react';
import { FrameShell } from './whizframe/FrameShell';
import type { FrameContent, StyleOverrides } from '../types/canonical';

type WhizFrameProps = {
  frame?: { id?: number };
  theme?: { accent?: string; base?: string };
  content: FrameContent;
  styleOverrides: StyleOverrides;
  uploadedImages?: unknown;
  whizEffects?: unknown;
  editMode?: boolean;
  selectedEl?: string | null;
  showGrid?: boolean;
  aspectRatio?: { w: number; h: number };
  bgGradient?: string | null;
  patternOverlay?: { id?: string } | null;
  strictWhizMode?: boolean;
  trustLevel?: string;
} & Record<string, unknown>;

function WhizFrame(props: WhizFrameProps) {
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
  prev.trustLevel === next.trustLevel &&
  JSON.stringify(prev.whizEffects) === JSON.stringify(next.whizEffects) &&
  JSON.stringify(prev.content) === JSON.stringify(next.content) &&
  JSON.stringify(prev.styleOverrides) === JSON.stringify(next.styleOverrides) &&
  JSON.stringify(prev.uploadedImages) === JSON.stringify(next.uploadedImages)
));
