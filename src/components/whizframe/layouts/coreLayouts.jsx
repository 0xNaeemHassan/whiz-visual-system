import {
  BodyLayout, StatsLayout, TableLayout, BullBearLayout, GridLayout, TimelineLayout, NetworkLayout, EditorialLayout,
  HeatmapLayout, CompareLayout, ScoreCardLayout, QuoteLayout
} from '../FrameShell';

export const coreLayouts = {
  body: BodyLayout,
  stats: StatsLayout,
  table: TableLayout,
  'bull-bear': BullBearLayout,
  grid: GridLayout,
  timeline: TimelineLayout,
  network: NetworkLayout,
  editorial: EditorialLayout,
  heatmap: HeatmapLayout,
  compare: CompareLayout,
  scorecard: ScoreCardLayout,
  quote: QuoteLayout,
};

export const coreLayoutKeys = new Set(Object.keys(coreLayouts));
