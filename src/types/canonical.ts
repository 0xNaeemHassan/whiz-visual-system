export type FontStyle = {
  fontSize?: number;
  fontWeight?: number;
  color?: string | null;
  italic?: boolean;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
};

export type StyleOverrides = {
  frameBg: string | null;
  spineColor: string | null;
  tickerColor: string | null;
  tickerBg: string | null;
  title?: FontStyle;
  deck?: FontStyle;
  body?: FontStyle;
  accent?: { color?: string | null };
  tag?: { background?: string | null; color?: string | null; borderColor?: string | null };
  footer?: { background?: string | null };
  statsColor: string | null;
  bignumColor: string | null;
  avatarColor: string | null;
  ruleBg: string | null;
  handleColor: string | null;
};

export type FrameContent = Record<string, unknown> & {
  title?: string;
  deck?: string;
  body?: string;
  tableHeaders?: string[];
  tableRows?: Array<Record<string, string>>;
};

export type EditorState = {
  frameId: number;
  content: FrameContent;
  styleOverrides: StyleOverrides;
  aspectRatio: { w: number; h: number; label?: string };
};

export type ExportContract = {
  format: 'png' | 'jpeg' | 'webp';
  dimensions: { width: number; height: number };
  quality: number;
  background: string | null;
  version: string;
};

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  enabled?: boolean;
  entry?: string;
};
