import { TICKER_CONTRACT, normalizeTickerSpeed } from '../domain/tickerContract';
import { createTemplateForLayout, checkTemplateLayoutCompatibility, getFrameTemplate } from '../data/templates.js';
import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { FRAMES } from '../data/frames.js';
import { applyDefaultSort, validateDefaultSort } from '../domain/tableSort.js';
import { THEMES } from '../data/themes.js';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useUIEventContext } from '../state/UIEventContext';
import { useUndoRedo } from '../hooks/useUndoRedo';
import WhizFrame from '../components/WhizFrame';
import DragItem from '../components/DragItem';
import GradientEditor from '../components/GradientEditor';
import ImageUpload from '../components/ImageUpload';
import AspectRatioSelector, { RATIOS } from '../components/AspectRatioSelector';
import PatternSelector from '../components/PatternSelector';
import { CONTENT_TEMPLATES } from '../data/templates';
import { createDefaultContent, createDefaultOverrides, createDefaultEditorState } from '../domain/editorDefaults.js';
import { nearestTypeScale, getComplianceIssues, getBrandScore, getEditorValidationReport } from '../utils/editorCompliance';
import { normalizeContentTaxonomy } from '../utils/contentNormalization';
import { buildMutationDispatcher } from './EditorMutations.js';
import { normalizeDateInput, normalizeTimelineEvents } from '../domain/services/dateNormalizationService';
import { SemanticChip } from '../components/primitives';
import { getFramePitfalls } from '../data/framePitfalls';
import { createEditorCommandRegistry, filterCommands, matchesShortcut } from '../domain/editorCommands';

/** @typedef {import('../types/canonical').FrameContent} FrameContent */
/** @typedef {import('../types/canonical').StyleOverrides} StyleOverrides */
/** @typedef {import('../types/editor.js').Theme} Theme */
/** @typedef {import('../types/editor.js').ExportPayload} ExportPayload */

/** @type {FrameContent} */
const DEFAULT_CONTENT = {
  issueNum:'001',date:'05.01.26',desk:'YIELD',volume:'I',topicTag:'STABLECOIN RISK',
  title:'THE END OF MERCENARY YIELD',
  deck:'Why the era of unsustainable APYs is finally closing \u2014 and what comes next.',
  body:'Three years ago, triple-digit APYs were table stakes for any new DeFi protocol. Liquidity mining was the only customer acquisition strategy anyone needed.\n\nThe protocols that survived aren\'t the ones that offered the most \u2014 they\'re the ones that built real revenue.',
  handle:'@0xWhizMiz',socialX:'@X',socialSub:'@SUBSTACK',
  status:'PUBLISHED',
  sourceLinks:'',
  tickerSpeed:28,sparkData:'1.2,1.8,2.9,2.1,1.6,2.4,3.8,4.2,3.6',
  layoutDensity:0.6,layoutSpacing:0.6,
  stats:[{label:'TVL',value:'$4.2B'},{label:'24H VOL',value:'$890M'},{label:'APY',value:'18.4%'},{label:'USERS',value:'142K'},{label:'CHAINS',value:'7'}],
  tableRows:[{col1:'Aave',col2:'USDC',col3:'5.2%',col4:'Low',col5:'A+'},{col1:'Compound',col2:'ETH',col3:'3.8%',col4:'Low',col5:'A'},{col1:'Pendle',col2:'stETH',col3:'14.1%',col4:'Med',col5:'B+'},{col1:'Morpho',col2:'USDT',col3:'7.3%',col4:'Low',col5:'A-'},{col1:'Yearn',col2:'DAI',col3:'9.6%',col4:'Med',col5:'B+'}],
  tableHeaders:['PROTOCOL','ASSET','APY','RISK','WHIZ GRADE'],
  bullPoints:['Real yield is sustainable','Network effects > incentives','Multi-chain reduces risk'],
  bearPoints:['Regulatory pressure rising','TradFi rates compete','Smart contract risk persists'],
  thesis:'',
  mechanismSteps:[],
  riskNotes:[],
  evidencePoints:[],
  bigNumber:'$47B',bigLabel:'TOTAL DeFi TVL',
  verdict:'Position in protocols with proven revenue. Avoid incentive-only models.',
  gridItems:[],timelineEvents:[],
  bracketRound1:[],bracketRound2:[],bracketRound3:[],bracketWinner:{name:'',seed:'',score:''},
};
/** @type {StyleOverrides} */
const DEFAULT_OVERRIDES = {frameBg:null,spineColor:null,tickerColor:null,tickerBg:null,title:{fontSize:52,fontWeight:700,color:'#F4F5F7',italic:false,lineHeight:1.05,letterSpacing:-0.02,textAlign:'left',opacity:1},deck:{fontSize:18,fontWeight:400,color:'#8B95A3',italic:true},body:{fontSize:15,fontWeight:400,color:'#8B95A3',lineHeight:1.75,textAlign:'left',opacity:1},accent:{color:null},tag:{background:null,color:null,borderColor:null},footer:{background:null},statsColor:null,bignumColor:null,avatarColor:null,ruleBg:null,handleColor:null};
const LOCKED_NEUTRALS = ['#8b95a3', '#f4f5f7', '#d0d6de'];
const DEFAULT_EFFECTS = { glow: true, noise: true, intenseAccent: false };
const ELEMENTS = [{key:'frame',label:'Background',icon:'\u25A1'},{key:'spine',label:'Spine',icon:'|'},{key:'ticker',label:'Ticker',icon:'\u2014'},{key:'title',label:'Title',icon:'T'},{key:'deck',label:'Deck',icon:'D'},{key:'tag',label:'Tag',icon:'#'},{key:'body',label:'Body',icon:'B'},{key:'stats',label:'Stats',icon:'S'},{key:'bignum',label:'Big #',icon:'N'},{key:'footer',label:'Footer',icon:'F'},{key:'accent',label:'Accent',icon:'\u25CF'}];
const WORKFLOW_PHASES=['draft','review','publish-ready'];
function ColorRow({label,value,defaultVal,onChange}){const col=value||defaultVal;return(<div className="prop-color-row"><span className="prop-label-text">{label}</span><div className="prop-color-swatch" style={{background:col,position:'relative'}}><input type="color" value={col} onChange={e=>onChange(e.target.value)} aria-label={`${label} color`} style={{position:'absolute',inset:0,opacity:0,cursor:'pointer',width:'100%',height:'100%'}}/></div><input type="text" className="prop-hex" value={col} onChange={e=>{const v=e.target.value;if(/^#[0-9A-Fa-f]{0,6}$/.test(v)||v==='')onChange(v||null);}}/><button className="btn btn-ghost btn-sm editor-btn-reset" onClick={()=>onChange(null)} title="Reset">\u21BA</button></div>);}
function SliderRow({label,value,min,max,step,unit,onChange}){return(<div className="editor-panel-row"><div className="editor-panel-row-head"><span className="prop-label-text">{label}</span><span className="size-val">{value}{unit}</span></div><input type="range" min={min} max={max} step={step||1} value={value} onChange={e=>onChange(Number(e.target.value))} aria-label={label}/></div>);}
function WeightRow({label,value,weights,onChange}){return(<div className="editor-panel-row"><div className="prop-label-text editor-panel-label">{label}</div><div className="ww-grid">{weights.map(w=>(<button key={w} className={`ww-btn ${value===w?'on':''}`} onClick={()=>onChange(w)} style={{fontWeight:w}}>{w}</button>))}</div></div>);}

function DesignPanel({selectedEl,setSelectedEl,overrides,setOverrides,theme,bgGradient,setBgGradient,showToast,resetOverrides,setPatternOverlay,strictMode}){
  const currentOverrides = overrides;
  const setOverrideValue = (key, value) => setOverrides((previousOverrides) => ({ ...previousOverrides, [key]: value }));
  const setNestedOverrideValue = (group, key, value) => {
    const strictPath = `${group}.${key}`;
    if (strictMode && !isStrictStylePathAllowed(strictPath)) {
      showToast(getStrictStyleBlockReason(strictPath), 'warning');
      return;
    }
    if (strictMode && key === 'color' && ['body', 'deck', 'title'].includes(group) && value && !LOCKED_NEUTRALS.includes(value.toLowerCase())) {
      showToast('Strict Whiz Mode locks neutral palette tokens.', 'warning');
      return;
    }
    setOverrides((previousOverrides) => ({ ...previousOverrides, [group]: { ...(previousOverrides[group] || {}), [key]: value === '' ? null : value } }));
  };
  const resetOverrideSection = (key) => setOverrides((previousOverrides) => ({ ...previousOverrides, [key]: DEFAULT_OVERRIDES[key] }));
  const themeAccent = theme.accent;
  const themeBase = theme.base;
  const renderSelectedElementControls = () => {
    if (!selectedEl) return <div className="hint-box">Enable Edit Mode then click a frame element.</div>;
    switch(selectedEl){
      case'frame':return<div className="design-section"><div className="design-section-title">Background</div><ColorRow label="Solid" value={currentOverrides.frameBg} defaultVal={themeBase} onChange={v=>{setOverrideValue('frameBg',v);setBgGradient(null);}}/><div style={{marginTop:12}}><GradientEditor value={bgGradient} onChange={setBgGradient} themeBase={themeBase}/></div><button className="btn btn-ghost btn-sm w-full" style={{marginTop:6}} onClick={()=>{setOverrideValue('frameBg',null);setBgGradient(null);}}>↺ Reset</button></div>;
      case'spine':return<div className="design-section"><div className="design-section-title">Spine</div>{strictMode?<ColorRow label="Color" value={currentOverrides.spineColor} defaultVal={themeAccent} onChange={v=>setOverrideValue('spineColor',v)}/>:<div className="hint-box">Spine primitives are immutable in normal mode. Enable Strict mode to edit spine color only.</div>}</div>;
      case'ticker':return<div className="design-section"><div className="design-section-title">Ticker</div><ColorRow label="Text" value={currentOverrides.tickerColor} defaultVal={themeAccent} onChange={v=>setOverrideValue('tickerColor',v)}/><ColorRow label="BG" value={currentOverrides.tickerBg} defaultVal="rgba(0,0,0,0.35)" onChange={v=>setOverrideValue('tickerBg',v)}/></div>;
      case'title':return<div className="design-section"><div className="design-section-title">Title</div><ColorRow label="Color" value={currentOverrides.title?.color} defaultVal="#F4F5F7" onChange={v=>setNestedOverrideValue('title','color',v)}/><SliderRow label="Size" value={currentOverrides.title?.fontSize||52} min={28} max={80} unit="px" onChange={v=>setNestedOverrideValue('title','fontSize',v)}/><WeightRow label="Weight" value={currentOverrides.title?.fontWeight||700} weights={[300,400,500,600,700]} onChange={v=>setNestedOverrideValue('title','fontWeight',v)}/><SliderRow label="Line Height" value={currentOverrides.title?.lineHeight||1.1} min={0.8} max={2} step={0.05} unit="" onChange={v=>setNestedOverrideValue('title','lineHeight',v)}/><SliderRow label="Spacing" value={currentOverrides.title?.letterSpacing||-0.03} min={-0.05} max={0.15} step={0.01} unit="em" onChange={v=>setNestedOverrideValue('title','letterSpacing',v)}/><div style={{marginBottom:10}}><div className="prop-label-text" style={{marginBottom:6}}>Align</div><div className="ww-grid">{['left','center','right'].map(a=>(<button key={a} className={`ww-btn ${(currentOverrides.title?.textAlign||'left')===a?'on':''}`} onClick={()=>setNestedOverrideValue('title','textAlign',a)}>{a}</button>))}</div></div><SliderRow label="Opacity" value={currentOverrides.title?.opacity??1} min={0} max={1} step={0.05} unit="" onChange={v=>setNestedOverrideValue('title','opacity',v)}/><button className="btn btn-ghost btn-sm w-full" style={{marginTop:6}} onClick={()=>resetOverrideSection('title')}>↺ Reset</button></div>;
      case'deck':return<div className="design-section"><div className="design-section-title">Deck</div><ColorRow label="Color" value={currentOverrides.deck?.color} defaultVal="#8B95A3" onChange={v=>setNestedOverrideValue('deck','color',v)}/><SliderRow label="Size" value={currentOverrides.deck?.fontSize||18} min={12} max={32} unit="px" onChange={v=>setNestedOverrideValue('deck','fontSize',v)}/><WeightRow label="Weight" value={currentOverrides.deck?.fontWeight||400} weights={[300,400,500,600]} onChange={v=>setNestedOverrideValue('deck','fontWeight',v)}/><button className="btn btn-ghost btn-sm w-full" onClick={()=>resetOverrideSection('deck')}>↺ Reset</button></div>;
      case'body':return<div className="design-section"><div className="design-section-title">Body</div><ColorRow label="Color" value={currentOverrides.body?.color} defaultVal="#8B95A3" onChange={v=>setNestedOverrideValue('body','color',v)}/><SliderRow label="Size" value={currentOverrides.body?.fontSize||15} min={11} max={22} unit="px" onChange={v=>setNestedOverrideValue('body','fontSize',v)}/><SliderRow label="Height" value={currentOverrides.body?.lineHeight||1.7} min={1} max={2.5} step={0.1} unit="" onChange={v=>setNestedOverrideValue('body','lineHeight',v)}/><SliderRow label="Opacity" value={currentOverrides.body?.opacity??1} min={0} max={1} step={0.05} unit="" onChange={v=>setNestedOverrideValue('body','opacity',v)}/><button className="btn btn-ghost btn-sm w-full" onClick={()=>resetOverrideSection('body')}>↺ Reset</button></div>;
      case'tag':return<div className="design-section"><div className="design-section-title">Tag</div><ColorRow label="Text" value={currentOverrides.tag?.color} defaultVal={themeAccent} onChange={v=>setNestedOverrideValue('tag','color',v)}/><ColorRow label="Border" value={currentOverrides.tag?.borderColor} defaultVal={themeAccent} onChange={v=>setNestedOverrideValue('tag','borderColor',v)}/><ColorRow label="BG" value={currentOverrides.tag?.background} defaultVal={`${themeAccent}20`} onChange={v=>setNestedOverrideValue('tag','background',v)}/><button className="btn btn-ghost btn-sm w-full" onClick={()=>resetOverrideSection('tag')}>↺ Reset</button></div>;
      case'stats':return<div className="design-section"><div className="design-section-title">Stats</div><ColorRow label="Color" value={currentOverrides.statsColor} defaultVal={themeAccent} onChange={v=>setOverrideValue('statsColor',v)}/></div>;
      case'bignum':return<div className="design-section"><div className="design-section-title">Big Number</div><ColorRow label="Color" value={currentOverrides.bignumColor} defaultVal={themeAccent} onChange={v=>setOverrideValue('bignumColor',v)}/></div>;
      case'footer':return<div className="design-section"><div className="design-section-title">Footer</div><ColorRow label="BG" value={currentOverrides.footer?.background} defaultVal="rgba(0,0,0,0.3)" onChange={v=>setNestedOverrideValue('footer','background',v)}/><ColorRow label="Avatar" value={currentOverrides.avatarColor} defaultVal={themeAccent} onChange={v=>setOverrideValue('avatarColor',v)}/><button className="btn btn-ghost btn-sm w-full" onClick={()=>{resetOverrideSection('footer');setOverrideValue('avatarColor',null);}}>↺ Reset</button></div>;
      case'accent':return<div className="design-section"><div className="design-section-title">Accent</div><p style={{fontSize:11,color:'var(--muted)',marginBottom:12,lineHeight:1.6}}>Global accent override.</p><ColorRow label="Accent" value={currentOverrides.accent?.color} defaultVal={themeAccent} onChange={v=>setNestedOverrideValue('accent','color',v)}/><button className="btn btn-ghost btn-sm w-full" onClick={()=>setOverrideValue('accent',{color:null})}>↺ Reset</button></div>;
      default:return null;
    }
  };
  return(<div><div className="design-section"><div className="design-section-title">Select Element</div><div className="el-select-grid">{ELEMENTS.map(el=>(<button key={el.key} className={`el-select-item ${selectedEl===el.key?'sel':''}`} onClick={()=>setSelectedEl(selectedEl===el.key?null:el.key)}><span className="el-icon">{el.icon}</span>{el.label}</button>))}</div></div>{renderSelectedElementControls()}<div style={{padding:'12px 14px'}}><div style={{display:'flex',gap:6,marginBottom:8}}>
      <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={()=>{try{localStorage.setItem('whiz-copied-style',JSON.stringify(overrides));showToast('Style copied');}catch(e){showToast('Copy failed','error');}}}>Copy Style</button>
      <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={()=>{try{const s=localStorage.getItem('whiz-copied-style');if(s){const parsed=JSON.parse(s);const next=strictMode?sanitizeStrictStyleOverrides(parsed):parsed;setOverrides(next);if(strictMode&&JSON.stringify(next)!==JSON.stringify(parsed)){showToast('Strict mode removed blocked style overrides.','warning');}else{showToast('Style pasted');}}else showToast('Nothing copied yet','info');}catch(e){showToast('Paste failed','error');}}}>Paste</button>
    </div>
    <button className="btn btn-danger w-full btn-sm" onClick={()=>{
      if(window.confirm('Reset all design overrides? This cannot be undone.')){
        resetDesignState({
          resetOverrides,
          defaultOverrides: DEFAULT_OVERRIDES,
          setBgGradient,
          setPatternOverlay,
          showToast,
        });
      }
    }}>Reset All</button></div></div>);
}

/**
 * @param {{ activeFontPairing?: {body?:string}|null, showToast: (message:string, kind?:string)=>void, activeTheme: Theme, setActiveTheme: (theme:Theme)=>void, editingFrame?: any, clearEditingFrame?: ()=>void, newFrameSignal:number, isActive:boolean }} props
 */
export default function Editor({ activeFontPairing,showToast,activeTheme,setActiveTheme,editingFrame,clearEditingFrame,newFrameSignal,isActive}){
  const[saves,setSaves]=useLocalStorage('whiz-saves',[]);
  const[frameId,setFrameId]=useState(editingFrame||4);
  const[theme,setTheme]=useState(activeTheme);
  const{state:content,set:setContent,undo,redo,canUndo,canRedo,reset:resetContent,commit:commitContent,history:contentHistory,cursor:contentCursor,jumpTo:jumpToContentSnapshot}=useUndoRedo(DEFAULT_CONTENT,120);
  const[_savedOverrides,_persistOverrides]=useLocalStorage('whiz-overrides',DEFAULT_OVERRIDES);
  const{state:overrides,set:setOverrides,undo:undoOverride,redo:redoOverride,reset:resetOverrides,commit:commitOverrides}=useUndoRedo(_savedOverrides);
  // Persist overrides to localStorage whenever they change
  useEffect(()=>{ _persistOverrides(overrides); },[overrides]);
  const[zoom,setZoom]=useState(0.35);const[saveName,setSaveName]=useState('');
  const[showSaveModal,setShowSaveModal]=useState(false);const[showLoadModal,setShowLoadModal]=useState(false);const[selectedSaveForLoad,setSelectedSaveForLoad]=useState(null);
  const[frameSearch,setFrameSearch]=useState('');const frameListRef=useRef(null);const[exporting,setExporting]=useState(false);
  const[showGrid,setShowGrid]=useState(false);const[editMode,setEditMode]=useState(false);
  const[selectedEl,setSelectedEl]=useState(null);const[rightTab,setRightTab]=useState('content');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyScrollTop, setHistoryScrollTop] = useState(0);
  const[mobileTab,setMobileTab]=useState('preview');const[aspectRatio,setAspectRatio]=useState(RATIOS[0]);
  const[showActionOverflow,setShowActionOverflow]=useState(false);
  const [_savedMedia, persistMedia] = useLocalStorage('whiz-media',{uploadedImages:{logo:null,hero:null,badge:null},bgGradient:null,patternOverlay:null});
  const { state: mediaState, set: setMediaState, reset: resetMediaState, commit: commitMedia } = useUndoRedo(_savedMedia);
  const uploadedImages = mediaState.uploadedImages;
  const bgGradient = mediaState.bgGradient;
  const patternOverlay = mediaState.patternOverlay;
  useEffect(()=>{persistMedia(mediaState);},[mediaState,persistMedia]);
  const setBgGradient = (value) => setMediaState(prev => ({...prev, bgGradient: value}), { immediate: true });
  const setPatternOverlay = (value) => setMediaState(prev => ({...prev, patternOverlay: value}), { immediate: true });

  const[showDeleteConfirm,setShowDeleteConfirm]=useState(null);const[saveSearch,setSaveSearch]=useState('');
  const[saveTagsInput,setSaveTagsInput]=useState('');const[saveFolder,setSaveFolder]=useState('');const[saveStatus,setSaveStatus]=useState('');
  const[loadTagFilter,setLoadTagFilter]=useState('');const[loadFolderFilter,setLoadFolderFilter]=useState('');const[loadFrameFilter,setLoadFrameFilter]=useState('');
  const[loadDateFrom,setLoadDateFrom]=useState('');const[loadDateTo,setLoadDateTo]=useState('');
  const[strictMode,setStrictMode]=useLocalStorage('whiz-strict-mode',true);
  const[showCommandPalette,setShowCommandPalette]=useState(false);
  const[paletteQuery,setPaletteQuery]=useState('');
  const[whizEffects,setWhizEffects]=useLocalStorage('whiz-effects',DEFAULT_EFFECTS);
  const [workflowPhase,setWorkflowPhase]=useState('draft');
  const [phaseChecklist,setPhaseChecklist]=useState({draftAt:Date.now(),reviewAt:null,publishReadyAt:null,lastTransitionAt:Date.now()});
  const frameRef=useRef(null);const centerRef=useRef(null);
  const { registerHandlers } = useUIEventContext();
  const[showAutosavePrompt,setShowAutosavePrompt]=useState(false);const autosaveDataRef=useRef(null);

  // NOTE: editingFrame is now {frameId, serial, issue}; compare serial to detect re-opens
  useEffect(()=>{
    if(!editingFrame)return;
    setFrameId(editingFrame.frameId);
    // NOTE: Pre-fill content from issue if provided
    if(editingFrame.issue){
      const iss=editingFrame.issue;
      const base=createDefaultContent();
      if(iss.topic)base.title=iss.topic.toUpperCase();
      if(iss.caption)base.deck=iss.caption;
      if(iss.notes)base.body=iss.notes;
      resetContent(base);
      // Pre-fill theme if issue has one
      if(iss.themeId){const t=THEMES.find(th=>th.id===iss.themeId);if(t){setTheme(t);setActiveTheme(t);}}
    }
    clearEditingFrame?.();
  },[editingFrame?.serial]);
  // NOTE: True "New Frame" action — reset all state
  useEffect(()=>{
    if(newFrameSignal===0)return;
    const nextFrameId=4;
    setFrameId(nextFrameId);
    resetContent(DEFAULT_CONTENT);
    // NOTE: Load frame-specific content template
    const tmpl=getFrameTemplate(nextFrameId,DEFAULT_CONTENT);
    resetContent(tmpl);
    resetOverrides(DEFAULT_OVERRIDES);
    resetMediaState({ uploadedImages: { logo:null, hero:null, badge:null }, bgGradient:null, patternOverlay:null });
    setTheme(activeTheme);
    setAspectRatio(RATIOS[0]);
    showToast('New frame started');
  },[newFrameSignal]);

  useEffect(()=>{try{const r=localStorage.getItem('whiz-autosave');if(r){const d=JSON.parse(r);if(d.savedAt&&Date.now()-d.savedAt<86400000){autosaveDataRef.current=d;setShowAutosavePrompt(true);}}}catch(e){}},[]);
  const restoreAutosave=()=>{const d=autosaveDataRef.current;if(d){d.frameId&&setFrameId(d.frameId);d.theme&&(setTheme(d.theme),setActiveTheme(d.theme));d.content&&resetContent(d.content);d.overrides&&setOverrides(d.overrides);d.aspectRatio&&setAspectRatio(d.aspectRatio);d.bgGradient&&updateMedia(prev=>({...prev,bgGradient:d.bgGradient}));d.patternOverlay&&updateMedia(prev=>({...prev,patternOverlay:d.patternOverlay}));showToast('Restored');}setShowAutosavePrompt(false);};
  const selectedFrame=FRAMES.find(f=>f.id===frameId)||FRAMES[0];
  const activeFramePitfalls = useMemo(() => getFramePitfalls(frameId), [frameId]);
  const preExportChecklist = useMemo(() => ({
    blocking: activeFramePitfalls.filter(p => p.severity === 'high'),
    nonBlocking: activeFramePitfalls.filter(p => p.severity !== 'high'),
  }), [activeFramePitfalls]);
  const runPitfallPreflight = () => {
    if (!activeFramePitfalls.length) return true;
    const highRiskLines = preExportChecklist.blocking.map((p) => `• ${p.warning}`);
    const mediumRiskLines = preExportChecklist.nonBlocking.map((p) => `• ${p.warning}`);
    if (highRiskLines.length) {
      showToast(`Export blocked: ${highRiskLines[0]}`, 'error');
      alert(`High-risk frame pitfalls detected:\n\n${highRiskLines.join('\n')}\n\nHints:\n${preExportChecklist.blocking.map((p) => `- ${p.triggerHint}`).join('\n')}`);
      return false;
    }
    if (mediumRiskLines.length && !window.confirm(`Non-blocking frame pitfalls:\n\n${mediumRiskLines.join('\n')}\n\nContinue export?`)) return false;
    return true;
  };
  const track = useMemo(() => createTelemetry({ frameId, layout: selectedFrame?.layout }), [frameId, selectedFrame?.layout]);
  useEffect(() => {
    const layoutBase = createTemplateForLayout(selectedFrame.layout);
    const frameTemplate = getFrameTemplate(frameId, layoutBase);
    const compatibility = checkTemplateLayoutCompatibility(frameTemplate, selectedFrame.layout);

    const nextContent = {
      ...layoutBase,
      ...content,
      ...frameTemplate,
    };

    if (selectedFrame?.defaultSort && Array.isArray(nextContent.tableHeaders) && Array.isArray(nextContent.tableRows)) {
      validateDefaultSort({ defaultSort: selectedFrame.defaultSort, tableHeaders: nextContent.tableHeaders, tableRows: nextContent.tableRows });
      nextContent.tableRows = applyDefaultSort(nextContent.tableRows, nextContent.tableHeaders, selectedFrame.defaultSort);
    }

    resetContent(nextContent);

    if (!compatibility.isCompatible) {
      showToast(`Template missing layout fields: ${compatibility.missingFields.join(', ')}`, 'warning');
    }
  }, [frameId]);
  const complianceIssues = useMemo(
    () => getComplianceIssues({ overrides, content }),
    [overrides, content],
  );
  const hasBlockingSpineContrastIssue = useMemo(() => complianceIssues.some((issue) => issue.startsWith('Rotated-spine contrast checks:')), [complianceIssues]);
  const previewOverflow = useMemo(() => applyOverflowPolicy({ family: selectedFrame?.tier > 2 ? 'extended' : 'core', aspectRatio, content, ov: overrides, policy: content?.truncationPolicy || {} }), [selectedFrame?.tier, aspectRatio, content, overrides]);
  const overflowMeta = { actions: previewOverflow?.actions, truncation: previewOverflow?.truncation };
  const fallbackTruncation = Boolean(overflowMeta?.truncation?.hasFallback);
  const truncationSuggestions = overflowMeta?.truncation?.suggestions || [];
  const editorValidation = useMemo(() => getEditorValidationReport({ overrides, content }), [overrides, content]);
  const complianceAnchors = useMemo(() => {
    const byId = {
      'field-issueNum': { id: 'field-issueNum', label: 'Issue #', reason: 'Issue numbering powers archive sequencing + exported filenames.' },
      'field-title': { id: 'field-title', label: 'Title', reason: 'Title drives the card headline and downstream indexing/search.' },
      'field-topicTag': { id: 'field-topicTag', label: 'Topic tag', reason: 'Topic tags normalize taxonomy and slug generation for distribution.' },
      'field-tickerSpeed': { id: 'field-tickerSpeed', label: 'Ticker speed', reason: 'Ticker cadence affects readability and contract-safe motion.' },
      'field-sourceLinks': { id: 'field-sourceLinks', label: 'Source links', reason: 'Sources are required for publish-grade trust and fact traceability.' },
      'field-nextDrop': { id: 'field-nextDrop', label: 'Next drop date', reason: 'Scheduling metadata keeps editorial calendars machine-readable.' },
    };

    const mapIssueToAnchor = (message) => {
      if (message.includes('Title is required')) return 'field-title';
      if (message.includes('Topic tag is required') || message.includes('Topic-tag normalization') || message.includes('Slug format drift')) return 'field-topicTag';
      if (message.includes('Issue number')) return 'field-issueNum';
      if (message.includes('Ticker speed') || message.includes('Ticker fidelity variance')) return 'field-tickerSpeed';
      if (message.includes('Source links are required')) return 'field-sourceLinks';
      if (message.includes('Next drop date')) return 'field-nextDrop';
      return null;
    };

    const mapSeverity = (message) => {
      if (message.includes('required') || message.includes('must')) return 'blocking';
      if (message.includes('drift') || message.includes('normalization') || message.includes('format')) return 'warning';
      return 'info';
    };

    const entries = [];
    [...complianceIssues, ...(editorValidation?.errors || []), ...(editorValidation?.warnings || [])].forEach((message) => {
      const anchorId = mapIssueToAnchor(message);
      if (!anchorId) return;
      entries.push({ ...byId[anchorId], message, severity: mapSeverity(message) });
    });
    return entries;
  }, [complianceIssues, editorValidation]);
  const complianceByAnchor = useMemo(() => complianceAnchors.reduce((acc, entry) => {
    acc[entry.id] = acc[entry.id] || [];
    acc[entry.id].push(entry);
    return acc;
  }, {}), [complianceAnchors]);
  const brandScore = useMemo(
    () => getBrandScore({ overrides, content }),
    [overrides, content],
  );
  const jumpToField = useCallback((id) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.focus?.({ preventScroll: true });
  }, []);
  const getSeverityStyle = useCallback((severity) => ({
    blocking: { color: '#FFB3B3', border: '1px solid rgba(255,90,90,.45)', background: 'rgba(70,10,10,.7)' },
    warning: { color: '#FFDFA8', border: '1px solid rgba(229,178,58,.45)', background: 'rgba(61,44,5,.6)' },
    info: { color: '#B6D5FF', border: '1px solid rgba(95,163,255,.45)', background: 'rgba(8,29,61,.55)' },
  }[severity] || { color: 'var(--muted)', border: '1px solid var(--border)', background: 'var(--bg-3)' }), []);
  const renderFieldCompliance = useCallback((anchorId) => {
    const entries = complianceByAnchor[anchorId] || [];
    if (!entries.length) return null;
    return (<div style={{display:'grid',gap:6,marginTop:6}}>{entries.map((entry, idx) => {
      const style = getSeverityStyle(entry.severity);
      return <div key={`${anchorId}-${idx}`} style={{...style,padding:'6px 8px',borderRadius:6,fontSize:10,lineHeight:1.5}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}><strong style={{fontFamily:'var(--font-m)',fontSize:9,letterSpacing:'0.06em',textTransform:'uppercase'}}>{entry.severity}</strong><button className="btn btn-ghost btn-sm" style={{fontSize:9,padding:'1px 6px'}} onClick={()=>jumpToField(anchorId)}>Fix now</button></div><div>{entry.message}</div><div style={{opacity:0.8}}>Why this matters: {entry.reason}</div><div style={{opacity:0.9}}>Suggested fix: {entry.message.includes('Autofix:') ? entry.message.split('Autofix:')[1].trim() : `Update ${entry.label.toLowerCase()} to satisfy the validation rule.`}</div></div>;
    })}</div>);
  }, [complianceByAnchor, getSeverityStyle, jumpToField]);

  const applyStrictPolish = () => {
    updateStyle((prev) => ({
      ...prev,
      title: { ...(prev.title || {}), fontSize: nearestTypeScale(prev.title?.fontSize ?? 52) },
      deck: { ...(prev.deck || {}), fontSize: nearestTypeScale(prev.deck?.fontSize ?? 18) },
      body: { ...(prev.body || {}), fontSize: nearestTypeScale(prev.body?.fontSize ?? 15) },
    }));
    showToast('Strict polish applied (type scale snapped).');
  };
  const updateZoom=useCallback(()=>{if(!centerRef.current)return;const{width:w,height:h}=centerRef.current.getBoundingClientRect();if(w<10||h<10)return;const p=w<640?16:40;setZoom(+(Math.min((w-p)/(aspectRatio?.w||1080),(h-p)/(aspectRatio?.h||1350),1)).toFixed(3));},[aspectRatio]);
  useEffect(()=>{updateZoom();const ro=new ResizeObserver(updateZoom);centerRef.current&&ro.observe(centerRef.current);return()=>ro.disconnect();},[updateZoom]);
  // NOTE: re-trigger zoom when Editor tab becomes visible
  useEffect(()=>{if(isActive)setTimeout(updateZoom,50);},[isActive,updateZoom]);
  const doSaveRef=useRef(null);const undoRef=useRef(null);const redoRef=useRef(null);const undoOverrideRef=useRef(null);const redoOverrideRef=useRef(null);
  // NOTE: useLayoutEffect runs after every render commit (post-render) so
  // doSave/undo/redo are already defined and stable before refs are assigned.
  // This also works correctly in React Strict Mode and concurrent features.
  useLayoutEffect(()=>{
    doSaveRef.current=doSave;
    undoRef.current=undo;
    redoRef.current=redo;
    undoOverrideRef.current=undoOverride;
    redoOverrideRef.current=redoOverride;
  });

  const runUndo=useCallback(()=>{const didUndo=undoRef.current?.();if(!didUndo){undoOverrideRef.current?.();track(TELEMETRY_EVENTS.UNDO,{scope:'overrides'});}else track(TELEMETRY_EVENTS.UNDO,{scope:'content'});},[track]);
  const runRedo=useCallback(()=>{const didRedo=redoRef.current?.();if(!didRedo){redoOverrideRef.current?.();track(TELEMETRY_EVENTS.REDO,{scope:'overrides'});}else track(TELEMETRY_EVENTS.REDO,{scope:'content'});},[track]);


  useEffect(() => {
    if (!isActive) return undefined;
    return registerHandlers({
      onEscape: () => {
        setSelectedEl(null);
        setEditMode(false);
        setShowSaveModal(false);
        setShowLoadModal(false);
      },
      onGlobalAction: (action, payload) => {
        if (action === 'lockSection') setSectionLocks(prev => ({ ...prev, [payload?.section]: true }));
        if (action === 'unlockSection') setSectionLocks(prev => ({ ...prev, [payload?.section]: false }));
      },
    });
  }, [isActive, registerHandlers]);
  useEffect(()=>{if(editMode||selectedEl)setRightTab('design');},[editMode,selectedEl]);
  const buildSave=()=>buildFrameSave({frameId,theme,content,overrides,aspectRatio,bgGradient,patternOverlay,workflowPhase,phaseChecklist});
  const doSave=()=>{const n=saveName.trim()||`${content.topicTag} \u2014 ${new Date().toLocaleDateString()}`;setSaves(p=>[...p,{id:`s_${Date.now()}`,title:n,...buildSave()}]);setShowSaveModal(false);setSaveName('');showToast(`Saved "${n}"`);};
  const loadSave=s=>{setFrameId(s.frameId);setTheme(s.theme);resetContent(s.content);setWorkflowPhase(WORKFLOW_PHASES.includes(s.workflowPhase)?s.workflowPhase:'draft');setPhaseChecklist(s.phaseChecklist||{draftAt:s.savedAt||Date.now(),reviewAt:null,publishReadyAt:null,lastTransitionAt:s.savedAt||Date.now()});if(s.overrides){const validation=validateEditorState({frameId:s.frameId,theme:s.theme,content:s.content||{},overrides:s.overrides},{strictMode:Boolean(strictMode),sanitizeStrictStyle:true});const next=validation.sanitizedOverrides||s.overrides;setOverrides(next);if(strictMode&&validation.codes.includes('STRICT_STYLE_OVERRIDE_BLOCKED')){showToast('Loaded with strict-style sanitization.','warning');}}s.aspectRatio&&setAspectRatio(s.aspectRatio);s.bgGradient&&updateMedia(prev=>({...prev,bgGradient:s.bgGradient}));s.patternOverlay&&updateMedia(prev=>({...prev,patternOverlay:s.patternOverlay}));setShowLoadModal(false);showToast(`Loaded`);};
  const confirmDel=()=>{if(showDeleteConfirm){setSaves(p=>p.filter(s=>s.id!==showDeleteConfirm));showToast('Deleted','info');setShowDeleteConfirm(null);}};
  const runNormalizationPreflight=()=>{
    const result=normalizeContentTaxonomy(content);
    const taxonomyAutoCorrected=result.compliance.autoCorrected.length>0;
    if(taxonomyAutoCorrected){showToast(`Auto-corrected: ${result.compliance.autoCorrected.join(' ')}`,'info');}
    if(result.compliance.hasInvalid){track(TELEMETRY_EVENTS.VALIDATION_ERROR,{context:'export',count:result.compliance.invalid.length,issues:result.compliance.invalid,taxonomyAutoCorrected});showToast(`Invalid taxonomy: ${result.compliance.invalid.join(' ')}`,'error');return null;}
    if(result.content.topicTag!==content.topicTag||result.content.slug!==content.slug){setContent(result.content,{immediate:true});}
    return { normalizedContent: result.content, taxonomyAutoCorrected };
  };

  const stateValidation = useMemo(() => validateEditorState({frameId,theme,content,overrides,uploadedImages},{strictMode:Boolean(strictMode)}), [frameId, theme, content, overrides, uploadedImages, strictMode]);
  const phaseCriteria = useMemo(() => ({
    draft:[{label:'Basic state is valid',done:stateValidation.valid}],
    review:[{label:'Basic state is valid',done:stateValidation.valid},{label:'No blocking editor errors',done:editorValidation.errors.length===0}],
    'publish-ready':[{label:'Basic state is valid',done:stateValidation.valid},{label:'No blocking editor errors',done:editorValidation.errors.length===0},{label:'No compliance issues',done:complianceIssues.length===0},{label:'Has source links',done:Boolean((content.sourceLinks||'').trim())}],
  }), [stateValidation.valid, editorValidation.errors.length, complianceIssues.length, content.sourceLinks]);
  const canTransitionTo=(phase)=> (phaseCriteria[phase]||[]).every((c)=>c.done);
  const attemptPhaseTransition=(phase)=>{if(!canTransitionTo(phase)){showToast(`Cannot move to ${phase} until checklist criteria are met.`,'warning');return;}setWorkflowPhase(phase);setPhaseChecklist(prev=>({...prev,lastTransitionAt:Date.now(),reviewAt:phase==='review'||phase==='publish-ready'?(prev.reviewAt||Date.now()):prev.reviewAt,publishReadyAt:phase==='publish-ready'?(prev.publishReadyAt||Date.now()):prev.publishReadyAt}));showToast(`Workflow phase set to ${phase}`);};
  const ensureActionAllowed=(action)=>{if(action==='publish'&&workflowPhase!=='publish-ready'){showToast('Publish actions require publish-ready phase.','error');return false;}if(action==='export'&&workflowPhase==='draft'){showToast('Export actions require review or publish-ready phase.','error');return false;}if(!stateValidation.valid){showToast(`Blocked by validation: ${stateValidation.codes.join(', ')}`,'error');return false;}if(action==='publish'&&complianceIssues.length){showToast(`Blocked by compliance: ${complianceIssues[0]}`,'error');return false;}return true;};

  const exportJSON=()=>{if(!ensureActionAllowed('export'))return;const normalized=runNormalizationPreflight();if(!normalized)return;const d=JSON.stringify({...buildSave(),content:{...content,...normalized}},null,2);const b=new Blob([d],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${normalized.slug||'whiz_export'}.json`;a.click();URL.revokeObjectURL(u);showToast('JSON exported');};
  const exportManifest=()=>{if(!ensureActionAllowed('publish'))return;if(hasBlockingSpineContrastIssue){showToast('Publish blocked: rotated spine contrast is below threshold.','error');return;}if(editorValidation.errors.length){showToast(`Export blocked: ${editorValidation.errors.join(' | ')}`,'error');return;}if(editorValidation.warnings.length&&!window.confirm(`Editor validation warnings:\n- ${editorValidation.warnings.join('\n- ')}\n\nExport anyway?`))return;const normalized=runNormalizationPreflight();if(!normalized)return;const payload={issueNum:content.issueNum,topic:normalized.topicTag,slug:normalized.slug,title:content.title,date:content.date,frameId,themeId:theme.id,strictMode,brandScore,complianceIssues,sources:(content.sourceLinks||'').split(',').map(s=>s.trim()).filter(Boolean),targetMetric:content.targetMetric||'',metricConfidence:content.metricConfidence||'',metricProvenance:Array.isArray(content.metricProvenance)?content.metricProvenance:(content.metricProvenance?[content.metricProvenance]:[]),exportedAt:new Date().toISOString()};const d=JSON.stringify(payload,null,2);const b=new Blob([d],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`whiz_issue${content.issueNum||'000'}_manifest.json`;a.click();URL.revokeObjectURL(u);showToast('Manifest exported');};
  const importJSON=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=parseImportedState(JSON.parse(ev.target.result));d.frameId&&setFrameId(d.frameId);d.theme&&(setTheme(d.theme),setActiveTheme(d.theme));d.content&&resetContent(d.content);d.overrides&&setOverrides(d.overrides);d.aspectRatio&&setAspectRatio(d.aspectRatio);d.bgGradient&&setBgGradient(d.bgGradient);d.patternOverlay&&setPatternOverlay(d.patternOverlay);setWorkflowPhase(WORKFLOW_PHASES.includes(d.workflowPhase)?d.workflowPhase:'draft');setPhaseChecklist(d.phaseChecklist||{draftAt:d.savedAt||Date.now(),reviewAt:null,publishReadyAt:null,lastTransitionAt:d.savedAt||Date.now()});showToast('Imported');}catch(err){showToast('Invalid JSON','error');}};r.readAsText(f);e.target.value='';};
  const exportHTML=()=>{const el=frameRef.current;if(!el)return;const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Inter:wght@300..700&family=JetBrains+Mono:wght@400..700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0F1318;display:flex;justify-content:center;align-items:center;min-height:100vh}.whiz-frame{position:relative;overflow:hidden;flex-shrink:0}.wf-spine{position:absolute;left:0;top:0;bottom:0;width:3px;z-index:5}.wf-corner{position:absolute;width:16px;height:16px;z-index:6;opacity:.5}.wf-corner.tl{top:12px;left:12px;border-top:1.5px solid currentColor;border-left:1.5px solid currentColor}.wf-corner.tr{top:12px;right:12px;border-top:1.5px solid currentColor;border-right:1.5px solid currentColor}.wf-corner.bl{bottom:12px;left:12px;border-bottom:1.5px solid currentColor;border-left:1.5px solid currentColor}.wf-corner.br{bottom:12px;right:12px;border-bottom:1.5px solid currentColor;border-right:1.5px solid currentColor}.wf-content{position:relative;z-index:4;padding:40px 36px 32px 44px;display:flex;flex-direction:column;height:100%;box-sizing:border-box}.wf-title{font-family:'Space Grotesk',sans-serif;font-weight:700;letter-spacing:-.02em;line-height:1.05}.wf-deck{font-family:'Inter',sans-serif;line-height:1.6}.wf-body{font-family:'Inter',sans-serif;line-height:1.75}.wf-stat{display:flex;flex-direction:column;gap:4;padding:12px 14px;border-radius:6px}.wf-stat-val{font-family:'Space Grotesk',sans-serif;font-weight:700;line-height:1}.wf-stat-label{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.1em}.wf-ticker{overflow:hidden;white-space:nowrap;height:${TICKER_CONTRACT.heightPx}px;display:flex;align-items:center;width:100%;position:relative;z-index:4}.wf-ticker-scroll{display:inline-block;animation:whiz-ticker-scroll ${TICKER_CONTRACT.speed.default}s linear infinite;font-family:${TICKER_CONTRACT.typography.fontFamily};font-size:${TICKER_CONTRACT.typography.fontSizePx}px;letter-spacing:${TICKER_CONTRACT.typography.letterSpacingEm}em;font-weight:${TICKER_CONTRACT.typography.fontWeight};text-transform:${TICKER_CONTRACT.typography.textTransform};padding-left:${TICKER_CONTRACT.padding.textInlineStartPct}%}.wf-section-head{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.15em;text-transform:uppercase;display:flex;align-items:center;gap:8px;margin-bottom:12px}.wf-section-head::before{content:'';width:12px;height:1.5px;background:currentColor;opacity:.5}.wf-handle{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.08em}.wf-table{width:100%;border-collapse:collapse}.wf-table th{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;text-align:left;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.06)}.wf-table td{font-family:'Inter',sans-serif;font-size:12px;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.04)}@keyframes whiz-ticker-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style></head><body>${el.outerHTML}</body></html>`;const b=new Blob([html],{type:'text/html'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`whiz_export.html`;a.click();URL.revokeObjectURL(u);showToast('HTML exported');};
  const exportPNG=async()=>{if(!frameRef.current||exporting)return;if(!ensureActionAllowed('publish'))return;if(hasBlockingSpineContrastIssue){showToast('Publish blocked: rotated spine contrast is below threshold.','error');return;}const normalized=runNormalizationPreflight();if(!normalized)return;if(editorValidation.errors.length){showToast(`Export blocked: ${editorValidation.errors.join(' | ')}`,'error');return;}if(strictMode&&complianceIssues.length){showToast(`Strict mode blocked export (${complianceIssues.length} issues)`,'error');return;}if(!strictMode&&complianceIssues.length&&!window.confirm(`Whiz compliance warnings:\\n- ${complianceIssues.join('\\n- ')}\\n\\nExport anyway?`))return;if(editorValidation.warnings.length&&!window.confirm(`Editor validation warnings:\\n- ${editorValidation.warnings.join('\\n- ')}\\n\\nExport anyway?`))return;setExporting(true);showToast('Generating PNG...','info');try{const sceneModel=createSceneModel({frameId,theme,content:{...content,...normalized},overrides,aspectRatio,bgGradient});const{canvas,usedFallback}=await exportFrame({contractInput:{format:'png',dimensions:{width:aspectRatio.w,height:aspectRatio.h},quality:1,background:overrides.frameBg||theme.base,version:'1.0.0'},sceneModel,sceneRenderer:renderSceneToCanvas,domFallbackRenderer:(contract)=>renderDomSnapshotToCanvas(frameRef.current,{width:contract.dimensions.width,height:contract.dimensions.height,backgroundColor:contract.background})});try{canvas.toBlob(bl=>{bl&&navigator.clipboard?.write&&navigator.clipboard.write([new ClipboardItem({'image/png':bl})]).catch(()=>{});});}catch(e){}const u=canvas.toDataURL('image/png');const a=document.createElement('a');a.href=u;a.download=`${normalized.slug||'whiz_export'}.png`;a.click();showToast(`PNG exported at 2x${usedFallback?' (DOM fallback)':''}`);}catch(e){console.error(e);showToast(`Export failed: ${e.message||'unknown error'}`,'error');}setExporting(false);}
  const exportWebP=async()=>{
    if(!frameRef.current||exporting)return;
    if(!ensureActionAllowed('export'))return;
    if(!runPitfallPreflight())return;
    if(hasBlockingSpineContrastIssue){showToast('Publish blocked: rotated spine contrast is below threshold.','error');return;}
    const preflight=runNormalizationPreflight();if(!preflight)return;const { normalizedContent, taxonomyAutoCorrected }=preflight;
    const v=validateEditorState({frameId,theme,content,overrides,uploadedImages});
    if(!v.valid){showToast(`Export blocked (${v.codes.join(', ')})`,'error');return;}
    setExporting(true);showToast('Generating WebP…');
    try{
      const sceneModel=createSceneModel({frameId,theme,content:{...content,...normalizedContent},overrides,aspectRatio,bgGradient});
      const {canvas:cv,usedFallback}=await exportFrame({contractInput:{format:'webp',dimensions:{width:aspectRatio.w,height:aspectRatio.h},quality:0.92,background:overrides.frameBg||theme.base,version:'1.0.0'},sceneModel,sceneRenderer:renderSceneToCanvas,domFallbackRenderer:(contract)=>renderDomSnapshotToCanvas(frameRef.current,{width:contract.dimensions.width,height:contract.dimensions.height,backgroundColor:contract.background})});
      await new Promise((res,rej)=>cv.toBlob(b=>{
        if(!b){rej(new Error('WebP blob empty'));return;}
        const u=URL.createObjectURL(b);const a=document.createElement('a');
        a.href=u;a.download=`${normalizedContent.slug||'whiz_export'}.webp`;a.click();URL.revokeObjectURL(u);
        track(TELEMETRY_EVENTS.EXPORT_SUCCESS,{format:'webp',strictMode,taxonomyAutoCorrected});showToast(`WebP exported${usedFallback?' (DOM fallback)':''}`);res();
      },'image/webp',0.92));
    }catch(e){track(TELEMETRY_EVENTS.EXPORT_FAILURE,{format:'webp',reason:e.message||'error',strictMode});showToast(`WebP failed: ${e.message||'error'}`,'error');}
    setExporting(false);
  };
  const mutations = useMemo(() => buildMutationDispatcher({ setContent, setOverrides, setMedia: setMediaState, commitContent, commitOverrides, commitMedia }), [setContent, setOverrides, setMediaState, commitContent, commitOverrides, commitMedia]);
  const updateContent=(k,v,forceImmediate=false)=>mutations.content(k,c=>{const next={...c,[k]:v};if(k==='date'){const normalized=normalizeDateInput(v);if(normalized.valid)return{...next,date:normalized.displayDate};}if(k==='timelineEvents'){return{...next,timelineEvents:normalizeTimelineEvents(v)};}if(k==='topicTag'||k==='slug'){return normalizeContentTaxonomy(next).content;}return next;},forceImmediate);
  const isSectionLocked = (key) => Boolean(sectionLocks?.[key]);
  const toggleSectionLock = (sectionKey) => setSectionLocks(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  const updateStyle=(updater)=>mutations.style(updater);
  const updateMedia=(updater)=>mutations.image(updater);
  const strictWhizMode = Boolean(strictMode);
  const trackActionBar = (action, group, surface) => track(TELEMETRY_EVENTS.ACTION_BAR, { action, group, surface });
  const handleUndo = (surface='desktop') => {
    const did = undo();
    track(TELEMETRY_EVENTS.UNDO,{scope:did?'content':'overrides'});
    trackActionBar('undo', 'primary', surface);
  };
  const handleRedo = (surface='desktop') => {
    const did = redo();
    track(TELEMETRY_EVENTS.REDO,{scope:did?'content':'overrides'});
    trackActionBar('redo', 'primary', surface);
  };
  const handleDuplicate = (surface='desktop') => {
    const n=`${content.title||'Frame'} (copy)`;setSaves(p=>[...p,{id:`s_${Date.now()}`,title:n,...buildSave()}]);showToast('Duplicated');
    trackActionBar('duplicate', 'overflow', surface);
  };
  const triggerImport = () => document.getElementById('editor-action-import')?.click();
  const toggleEffectWithCompliance = (effectKey, nextValue) => {
    if (strictWhizMode && nextValue) {
      showToast('Strict Whiz Mode blocks non-essential effects.', 'warning');
      return;
    }
    if (!strictWhizMode && nextValue && !window.confirm(`Enable ${effectKey}? This can trigger Whiz compliance warnings.`)) return;
    setWhizEffects(prev => ({ ...prev, [effectKey]: nextValue }));
  };
  useEffect(()=>{if(!isActive)return;const t=setTimeout(()=>{try{localStorage.setItem('whiz-autosave',JSON.stringify({frameId,theme,content,overrides,aspectRatio,bgGradient,patternOverlay,savedAt:Date.now()}));}catch(e){}},3000);return()=>clearTimeout(t);},[content,overrides,frameId,theme,aspectRatio,bgGradient,patternOverlay]);
  const applyTheme=t=>{setTheme(t);setActiveTheme(t);};
  const applyTemplate=t=>{
    const layoutBase = createTemplateForLayout(selectedFrame.layout);
    const merged = { ...layoutBase, ...t.content };
    const compatibility = checkTemplateLayoutCompatibility(merged, selectedFrame.layout);
    resetContent(merged);
    if (!compatibility.isCompatible) {
      showToast(`Template incompatibility: missing ${compatibility.missingFields.join(', ')}`, 'warning');
      return;
    }
    showToast(`Template: ${t.name}`);
  };
  const checklistGroups = useMemo(() => {
    const stateValidation = validateEditorState({ frameId, theme, content, overrides, uploadedImages }, { strictMode: strictWhizMode });
    const strictViolations = strictWhizMode ? stateValidation.errors.filter((error) => error.code === 'STRICT_STYLE_OVERRIDE_BLOCKED') : [];
    return [
      {
        id: 'schema',
        label: 'Schema Validation',
        checks: [
          {
            id: 'state-valid',
            label: 'Editor state contract',
            passed: stateValidation.valid,
            blocking: true,
            details: stateValidation.errors[0]?.message || '',
            action: 'content',
            actionLabel: 'Open Content',
          },
        ],
      },
      {
        id: 'compliance',
        label: 'Style / Compliance',
        checks: [
          {
            id: 'compliance-rules',
            label: 'Brand and style compliance',
            passed: complianceIssues.length === 0,
            blocking: strictWhizMode,
            details: complianceIssues[0] || '',
            action: 'design',
            actionLabel: 'Open Design',
          },
        ],
      },
      {
        id: 'strict-mode',
        label: 'Strict Mode Constraints',
        checks: [
          {
            id: 'strict-overrides',
            label: strictWhizMode ? 'Strict allowlist overrides' : 'Strict mode currently disabled',
            passed: !strictWhizMode || strictViolations.length === 0,
            blocking: strictWhizMode,
            details: strictViolations[0]?.message || (strictWhizMode ? '' : 'Enable strict mode to enforce allowlisted style paths.'),
            action: 'design',
            actionLabel: strictWhizMode ? 'Fix Override' : 'Open Design',
          },
        ],
      },
    ];
  }, [frameId, theme, content, overrides, uploadedImages, strictWhizMode, complianceIssues]);

  const readinessSummary = useMemo(() => {
    const checks = checklistGroups.flatMap((group) => group.checks);
    const failed = checks.filter((check) => !check.passed);
    return {
      total: checks.length,
      failed: failed.length,
      blocking: failed.filter((check) => check.blocking).length,
      ready: failed.length === 0,
    };
  }, [checklistGroups]);

  const jumpToChecklistFix = useCallback((action) => {
    if (action === 'design') {
      setRightTab('design');
      setMobileTab('edit');
      return;
    }
    setRightTab('content');
    setMobileTab('edit');
  }, []);

  const filteredFrames=useMemo(()=>{if(!frameSearch)return FRAMES;const q=frameSearch.toLowerCase();return FRAMES.filter(f=>f.name.toLowerCase().includes(q)||f.tags.some(t=>t.includes(q))||f.layout.includes(q));},[frameSearch]);
  const runValidationCheck = useCallback(() => {
    if (editorValidation.errors.length) return showToast(`Validation errors: ${editorValidation.errors.join(' | ')}`, 'error');
    if (editorValidation.warnings.length) return showToast(`Validation warnings: ${editorValidation.warnings.join(' | ')}`, 'warning');
    showToast('Validation passed', 'info');
  }, [editorValidation, showToast]);
  const commandRegistry = useMemo(() => createEditorCommandRegistry({
    openPalette: () => { setShowCommandPalette(true); setPaletteQuery(''); },
    save: () => doSaveRef.current?.(),
    load: () => { setSaveSearch(''); setShowLoadModal(true); },
    exportPng: exportPNG,
    exportWebp: exportWebP,
    duplicate: () => { const n=`${content.title||'Frame'} (copy)`;setSaves(p=>[...p,{id:`s_${Date.now()}`,title:n,...buildSave()}]);showToast('Duplicated'); },
    nextFrame: () => setFrameId((prev) => { const i = FRAMES.findIndex((f) => f.id === prev); return FRAMES[(i + 1) % FRAMES.length].id; }),
    prevFrame: () => setFrameId((prev) => { const i = FRAMES.findIndex((f) => f.id === prev); return FRAMES[(i - 1 + FRAMES.length) % FRAMES.length].id; }),
    validate: runValidationCheck,
    toggleStrict: () => setStrictMode(v => !v),
    undo: runUndo,
    redo: runRedo,
    hasSaves: () => saves.length > 0,
    canUndoAny: () => canUndo,
    canRedoAny: () => canRedo,
  }), [exportPNG, exportWebP, content.title, showToast, runValidationCheck, runUndo, runRedo, saves.length, canUndo, canRedo]);
  useEffect(()=>{const h=e=>{if(!isActive)return;const command=commandRegistry.find(c=>matchesShortcut(e,c.shortcut)||matchesShortcut(e,c.shortcut.replace('Cmd','Ctrl')));if(!command||!command.enabled())return;e.preventDefault();command.handler();};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);},[isActive,commandRegistry]);
  // NOTE: Scroll frame list to top when search changes
  useEffect(()=>{if(frameListRef.current)frameListRef.current.scrollTop=0;},[frameSearch,filteredFrames]);

  const HISTORY_WINDOW = 60;
  const HISTORY_ROW_HEIGHT = 62;
  const historyCap = useMemo(() => contentHistory.slice(-HISTORY_WINDOW), [contentHistory]);
  const virtualStart = Math.max(0, Math.floor(historyScrollTop / HISTORY_ROW_HEIGHT) - 6);
  const virtualCount = Math.min(historyCap.length - virtualStart, 18);
  const virtualRows = historyCap.slice(virtualStart, virtualStart + virtualCount);
  const virtualTopPad = virtualStart * HISTORY_ROW_HEIGHT;
  const virtualBottomPad = Math.max(0, (historyCap.length - (virtualStart + virtualCount)) * HISTORY_ROW_HEIGHT);

  return(
    <div className="editor-wrap">
      <div className="editor-action-bar">
        <div className="editor-action-group">
          <button className="btn btn-primary btn-sm" onClick={()=>{setShowSaveModal(true);trackActionBar('save','primary',mobileTab==='preview'?'mobile':'desktop');}}>Save</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setSaveSearch('');setShowLoadModal(true);trackActionBar('load','primary',mobileTab==='preview'?'mobile':'desktop');}}>Load</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>{handleUndo(mobileTab==='preview'?'mobile':'desktop');}} disabled={!canUndo}>Undo</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>{handleRedo(mobileTab==='preview'?'mobile':'desktop');}} disabled={!canRedo}>Redo</button>
        </div>
        <div className="editor-action-group">
          <button className="btn btn-secondary btn-sm" onClick={()=>{exportPNG();trackActionBar('export','primary',mobileTab==='preview'?'mobile':'desktop');}} disabled={exporting}>Export</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>{triggerImport();trackActionBar('import','overflow',mobileTab==='preview'?'mobile':'desktop');}}>Import</button>
          <div className="editor-action-overflow">
            <button className="btn btn-ghost btn-sm" onClick={()=>setShowActionOverflow(v=>!v)}>More ▾</button>
            {showActionOverflow && <div className="editor-action-overflow-menu">
              <button className="btn btn-ghost btn-sm" onClick={()=>{handleDuplicate(mobileTab==='preview'?'mobile':'desktop');setShowActionOverflow(false);}}>Duplicate</button>
            </div>}
          </div>
        </div>
        <input id="editor-action-import" type="file" accept=".json" onChange={importJSON} style={{display:'none'}} />
      </div>
      <div className="editor-mob-tabs">{[{id:'frame',label:'Frame'},{id:'preview',label:'Preview'},{id:'content',label:'Content'}].map(t=>(<div key={t.id} className={`editor-mob-tab ${mobileTab===t.id?'active':''}`} onClick={()=>setMobileTab(t.id)}>{t.label}</div>))}</div>
      {/* LEFT */}
      <div className={`editor-left ${mobileTab==='frame'?'mob-active':''}`}>
        <div className="editor-panel-header"><span>Frame &amp; Theme</span><span style={{color:'var(--theme-accent)',fontWeight:700}}>#{String(frameId).padStart(2,'0')}</span></div>
        <div className="editor-section"><div className="editor-section-title">Template</div><input className="frame-search-mini" placeholder="Search frames..." onChange={e=>setFrameSearch(e.target.value)} value={frameSearch}/><div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:260,overflowY:'auto'}}>{filteredFrames.map(f=>(<div key={f.id} onClick={()=>setFrameId(f.id)} style={{padding:'7px 10px',borderRadius:'var(--r)',cursor:'pointer',background:frameId===f.id?`color-mix(in srgb,${theme.accent} 12%,transparent)`:'transparent',border:`1px solid ${frameId===f.id?theme.accent:'transparent'}`,transition:'all 0.15s'}}><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontFamily:'var(--font-m)',fontSize:9,color:'var(--dim)',width:22}}>{String(f.id).padStart(2,'0')}</span><SemanticChip kind="category" value={`tier-${f.tier}`} style={{fontSize:8,padding:'1px 5px'}}>T{f.tier}</SemanticChip><span style={{fontSize:12,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span><SemanticChip kind="category" value={f.layout} style={{fontSize:8,padding:'1px 5px'}}>{f.layout}</SemanticChip></div></div>))}</div></div>
        <div className="editor-section"><div className="editor-section-title">Color Theme</div><div className="theme-grid">{THEMES.map(t=>(<div key={t.id} className={`theme-btn ${theme.id===t.id?'active':''}`} style={{borderColor:theme.id===t.id?t.accent:'var(--border)'}} onClick={()=>applyTheme(t)}><span className="theme-dot" style={{background:t.accent}}/><span className="theme-name" style={{color:theme.id===t.id?t.accent:'var(--muted)'}}>{t.name}</span></div>))}</div></div>
        <div className="editor-section" style={{flex:1}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><span className="editor-section-title" style={{marginBottom:0}}>Saves ({saves.length})</span><button className="btn btn-primary btn-sm" onClick={()=>setShowSaveModal(true)}>Save</button></div>{saves.length===0?<div style={{fontSize:11,color:'var(--dim)',textAlign:'center',padding:'16px 0'}}>No saves yet</div>:<div className="saves-list">{saves.slice().reverse().map(s=>(<div key={s.id} className="save-item" onClick={()=>loadSave(s)}><div style={{width:24,height:24,borderRadius:4,background:s.theme?.base||'var(--bg-3)',border:`2px solid ${s.theme?.accent||'var(--border)'}`,flexShrink:0}}/><div className="save-item-info"><div className="save-item-name">{s.title}</div><div className="save-item-meta">#{s.frameId} · {new Date(s.savedAt).toLocaleDateString()}</div></div><button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setShowDeleteConfirm(s.id);}}>✕</button></div>))}</div>}</div>
      </div>
      {/* CENTER */}
      <div className={`editor-center ${mobileTab==='preview'?'mob-active':''}`} ref={centerRef}>
        <div className="frame-scale-wrap" style={{transform:`scale(${zoom})`}}><WhizFrame frameRef={frameRef} frame={selectedFrame} theme={theme} content={content} editMode={editMode} selectedEl={selectedEl} onSelectEl={k=>{setSelectedEl(k);k&&setRightTab('design');}} styleOverrides={overrides} showGrid={showGrid} aspectRatio={aspectRatio} uploadedImages={uploadedImages} bgGradient={bgGradient} patternOverlay={patternOverlay} strictWhizMode={strictWhizMode} whizEffects={whizEffects}
            fontPairing={activeFontPairing}/></div>
        <div className="zoom-bar"><button className="zoom-btn" onClick={()=>setZoom(z=>Math.max(0.1,+(z-0.05).toFixed(2)))}>−</button><span className="zoom-pct">{Math.round(zoom*100)}%</span><button className="zoom-btn" onClick={()=>setZoom(z=>Math.min(1,+(z+0.05).toFixed(2)))}>+</button><button className="zoom-btn" onClick={updateZoom} style={{fontSize:10}}>⊡</button><div style={{width:1,height:16,background:'var(--border)'}}/><button className={`zoom-btn ${showGrid?'active':''}`} onClick={()=>setShowGrid(g=>!g)} style={{color:showGrid?'var(--theme-accent)':undefined}}>▦</button><button className={`zoom-btn ${editMode?'active':''}`} onClick={()=>{setEditMode(m=>!m);editMode&&setSelectedEl(null);}} style={{color:editMode?'var(--theme-accent)':undefined}}>✎</button><div style={{width:1,height:16,background:'var(--border)'}}/><button className="zoom-btn" onClick={()=>handleUndo(mobileTab==='preview'?'mobile':'desktop')} disabled={!canUndo} style={{opacity:canUndo?1:0.3}}>↶</button><button className="zoom-btn" onClick={()=>handleRedo(mobileTab==='preview'?'mobile':'desktop')} disabled={!canRedo} style={{opacity:canRedo?1:0.3}}>↷</button></div>
        <div style={{position:'absolute',top:10,left:10,fontFamily:'var(--font-m)',fontSize:9,color:'var(--dim)',background:'rgba(0,0,0,0.6)',padding:'4px 8px',borderRadius:'var(--r)',backdropFilter:'blur(4px)'}}>{String(frameId).padStart(2,'0')} — {selectedFrame.name} · {aspectRatio.w}×{aspectRatio.h}</div>
        <div style={{position:'absolute',top:12,right:12,display:'flex',gap:6,background:'var(--glass)',padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--glass-border)',backdropFilter:'blur(12px)'}}><button className="btn btn-ghost btn-sm" onClick={exportJSON} style={{fontSize:10}}>JSON</button><button className="btn btn-ghost btn-sm" onClick={exportManifest} style={{fontSize:10}}>Manifest</button><button className="btn btn-secondary btn-sm" onClick={exportHTML} style={{fontSize:10}}>HTML</button><button className="btn btn-secondary btn-sm" onClick={applyStrictPolish} style={{fontSize:10}}>Polish</button><button className="btn btn-primary btn-sm" data-format="png" onClick={exportPNG} disabled={exporting} style={{fontSize:10}}>{exporting?'⟳':'↓'} PNG</button></div>
        <div style={{position:'absolute',top:52,right:12,fontFamily:'var(--font-m)',fontSize:10,color:readinessSummary.ready?'#8EF0B0':'#FFB3B3',background:readinessSummary.ready?'rgba(11,36,20,.9)':'rgba(42,10,10,.9)',padding:'6px 8px',borderRadius:6,border:`1px solid ${readinessSummary.ready?'#2BAE6666':'#FF5A5A66'}`,maxWidth:320}}>Readiness: {readinessSummary.ready?'Ready to publish':`${readinessSummary.failed}/${readinessSummary.total} checks failing`} {readinessSummary.blocking>0?`· ${readinessSummary.blocking} blocking`:''}</div>
        {editMode&&<div style={{position:'absolute',bottom:52,left:'50%',transform:'translateX(-50%)',fontFamily:'var(--font-m)',fontSize:9,color:'var(--theme-accent)',background:'rgba(0,0,0,0.75)',padding:'4px 10px',borderRadius:20,whiteSpace:'nowrap'}}>{selectedEl?`Selected: ${selectedEl}`:'Click any element'}</div>}
      </div>
      {/* RIGHT */}
      <div className={`editor-right ${mobileTab==='content'?'mob-active':''}`}>
        <div className="editor-right-tabs"><button className={`editor-right-tab ${rightTab==='design'?'active':''}`} onClick={()=>setRightTab('design')}>Design</button><button className={`editor-right-tab ${rightTab==='content'?'active':''}`} onClick={()=>setRightTab('content')}>Content</button></div>
        {rightTab==='design'?(<><div className={`edit-toggle-row ${editMode?'on':''}`} onClick={()=>{setEditMode(m=>!m);editMode&&setSelectedEl(null);}}><div className={`toggle-pill ${editMode?'on':''}`}><div className="toggle-dot"/></div><span className="toggle-label">{editMode?'Edit ON':'Edit OFF'}</span><span className="toggle-hint">{editMode?'Click elements':'Toggle to edit'}</span></div><DesignPanel selectedEl={selectedEl} setSelectedEl={setSelectedEl} overrides={overrides} setOverrides={setOverrides} theme={theme} bgGradient={bgGradient} setBgGradient={setBgGradient} showToast={showToast} resetOverrides={resetOverrides} setPatternOverlay={setPatternOverlay} strictMode={strictMode}/>
          <div className="editor-section">
            <div className="editor-section-title">Brand Score
              <span style={{float:'right',fontFamily:'var(--font-m)',fontSize:10,fontWeight:700,color:brandScore.score>=80?'var(--accent)':brandScore.score>=50?'#E5B23A':'#FF5A5A'}}>{brandScore.score}%</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontFamily:'var(--font-m)',fontSize:10,color:'var(--dim)'}}>Strict mode</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>setStrictMode(v=>!v)} style={{fontSize:10,color:strictMode?'var(--accent)':'var(--dim)'}}>{strictMode?'ON':'OFF'}</button>
            </div>
            <div style={{height:4,background:'var(--bg-3)',borderRadius:3,marginBottom:8,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${brandScore.score}%`,borderRadius:3,transition:'width 0.35s',background:brandScore.score>=80?'var(--accent)':brandScore.score>=50?'#E5B23A':'#FF5A5A'}}/>
            </div>
            {brandScore.checks.map((c,i)=><div key={i} style={{fontFamily:'var(--font-m)',fontSize:10,color:c.pass?'var(--dim)':'#FFB3B3',marginBottom:3}}>{c.pass?'✓':'✗'} {c.label}</div>)}
          </div>
          </>):(<>
          <div className="editor-panel-header"><span>Content</span><div style={{display:'flex',gap:6}}><button className="btn btn-ghost btn-sm" onClick={()=>setShowHistoryDrawer(v=>!v)}>{showHistoryDrawer?'Hide':'History'}</button><button className="btn btn-ghost btn-sm" onClick={()=>resetContent(DEFAULT_CONTENT)}>Reset</button></div></div>
          {showHistoryDrawer&&<div className="editor-section"><div className="editor-section-title">History ({contentHistory.length})</div><div style={{fontSize:10,color:'var(--dim)',marginBottom:8}}>Newest last · cursor #{contentCursor+1}</div><div style={{maxHeight:360,overflowY:'auto',border:'1px solid var(--border)',borderRadius:8}} onScroll={e=>setHistoryScrollTop(e.currentTarget.scrollTop)}><div style={{paddingTop:virtualTopPad,paddingBottom:virtualBottomPad}}>{virtualRows.map((entry,idx)=>{const absoluteIndex=contentHistory.length-historyCap.length+virtualStart+idx;const isActive=absoluteIndex===contentCursor;return <button key={entry.id} onClick={()=>jumpToContentSnapshot(absoluteIndex)} style={{display:'block',width:'100%',textAlign:'left',padding:'8px 10px',border:'none',borderBottom:'1px solid var(--border)',background:isActive?'color-mix(in srgb,var(--theme-accent) 14%,transparent)':'transparent',cursor:'pointer'}}><div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:11}}><strong style={{color:isActive?'var(--theme-accent)':'var(--text)'}}>{entry.label||'Snapshot'}</strong><span style={{color:'var(--dim)',fontFamily:'var(--font-m)'}}>{new Date(entry.timestamp).toLocaleTimeString()}</span></div><div style={{fontSize:10,color:'var(--dim)',marginTop:4}}>Δ {entry.changedKeys?.length||0} keys{entry.changedKeys?.length?`: ${entry.changedKeys.slice(0,5).join(', ')}`:''}</div></button>;})}</div></div></div>}
          <div className="editor-section"><div className="editor-section-title">Quick Start</div><div className="template-list">{CONTENT_TEMPLATES.map(t=>(<div key={t.id} className="template-item" onClick={()=>applyTemplate(t)}><div className="template-item-name">{t.name}</div><div className="template-item-desc">{t.desc}</div></div>))}</div></div>
          <div className="editor-section"><div className="editor-section-title">Aspect Ratio</div><AspectRatioSelector value={aspectRatio.id} onChange={r=>{setAspectRatio(r);showToast(`${r.w}×${r.h}`);}}/></div>
          <div className="editor-section">
            <div className="editor-section-title">Layout Controls</div>
            <div className="form-group">
              <label className="form-label">Density — {(Number(content.layoutDensity ?? 0.6)).toFixed(2)}</label>
              <input type="range" min={0.35} max={1.4} step={0.05} value={Number(content.layoutDensity ?? 0.6)}
                onChange={e=>updateContent('layoutDensity',Number(e.target.value))}
                style={{width:'100%',accentColor:'var(--accent)'}} />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Spacing — {(Number(content.layoutSpacing ?? 0.6)).toFixed(2)}</label>
              <input type="range" min={0.35} max={1.4} step={0.05} value={Number(content.layoutSpacing ?? 0.6)}
                onChange={e=>updateContent('layoutSpacing',Number(e.target.value))}
                style={{width:'100%',accentColor:'var(--accent)'}} />
            </div>
          </div>
          <div className="editor-section"><div className="editor-section-title">Pattern</div>{strictWhizMode?<div style={{fontSize:10,color:'var(--dim)',marginBottom:6}}>Strict Whiz Mode hides non-essential pattern styling.</div>:<PatternSelector value={patternOverlay?.id||null} onChange={p=>updateMedia(prev=>({...prev,patternOverlay:p}))}/>}</div>
          <div className="editor-section"><div className="editor-section-title">Effects</div>
            <div style={{display:'grid',gap:6}}>
              {[
                ['glow', 'Glow'],
                ['noise', 'Noise'],
                ['intenseAccent', 'Intense Accent'],
              ].map(([key, label]) => (
                <label key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11,color:'var(--muted)'}}>
                  <span>{label}</span>
                  <input type="checkbox" checked={strictWhizMode ? false : !!whizEffects[key]} disabled={strictWhizMode} onChange={e=>toggleEffectWithCompliance(key,e.target.checked)} />
                </label>
              ))}
            </div>
            {strictWhizMode && <div style={{fontSize:10,color:'var(--dim)',marginTop:6}}>Effects are disabled in Strict Whiz Mode.</div>}
          </div>
          <div className="editor-section"><div className="editor-section-title">Metadata</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['Issue #','issueNum'],['Date','date'],['Desk','desk'],['Volume','volume']].map(([l,k])=>(<div key={k} className="form-group" style={{marginBottom:0}}><label className="form-label">{l}</label><input id={`field-${k}`} value={content[k]} onChange={e=>updateContent(k,e.target.value)}/></div>))}</div>{renderFieldCompliance('field-issueNum')}<div className="form-group" style={{marginTop:8}}><label className="form-label">Topic Tag</label><input id="field-topicTag" value={content.topicTag} onChange={e=>{const next=normalizeContentTaxonomy({...content,topicTag:e.target.value});updateContent('topicTag',next.content.topicTag);updateContent('slug',next.content.slug);if(next.compliance.autoCorrected.length)showToast('Topic/slug normalized on input.','info');if(next.compliance.hasInvalid)showToast(next.compliance.invalid.join(' '),'error');}}/>{renderFieldCompliance('field-topicTag')}</div>
      <div className="form-group">
        <label className="form-label">Ticker Speed (seconds) — {normalizeTickerSpeed(content.tickerSpeed)}s</label>
        <input id="field-tickerSpeed" type="range" min={TICKER_CONTRACT.speed.min} max={TICKER_CONTRACT.speed.max} step={TICKER_CONTRACT.speed.step} value={normalizeTickerSpeed(content.tickerSpeed)}
          onChange={e=>updateContent('tickerSpeed',normalizeTickerSpeed(parseInt(e.target.value, 10)))}
          style={{width:'100%',accentColor:'var(--accent)'}}/>
        {renderFieldCompliance('field-tickerSpeed')}
      </div>
<div className="form-group"><label className="form-label">Handle</label><input value={content.handle} onChange={e=>updateContent('handle',e.target.value)}/></div>
      {/* NOTE: Extended metadata fields */}
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-control" value={content.status||'PUBLISHED'} onChange={e=>updateContent('status',e.target.value)}>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="EMBARGOED">EMBARGOED</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Source Links</label>
        <textarea id="field-sourceLinks" className="form-control" rows={2} value={content.sourceLinks||''} onChange={e=>updateContent('sourceLinks',e.target.value)} placeholder="https://defillama.com/protocol/...\nhttps://dune.com/..." />
        {(content.status||'PUBLISHED')==='PUBLISHED' && !(content.sourceLinks||'').trim() && (
          <div style={{marginTop:4,fontFamily:'var(--font-m)',fontSize:10,color:'#FFB3B3'}}>Source links are required when status is PUBLISHED.</div>
        )}
        {renderFieldCompliance('field-sourceLinks')}
      </div>
      <div className="form-group">
        <label className="form-label">Next Drop Date</label>
        <input id="field-nextDrop" className="form-control" type="date" value={content.nextDrop||''} onChange={e=>updateContent('nextDrop',e.target.value)} />
        {renderFieldCompliance('field-nextDrop')}
      </div>
      <div className="form-group">
        <label className="form-label">Pull Quote</label>
        <textarea className="form-control" rows={2} value={content.pullQuote||''} onChange={e=>updateContent('pullQuote',e.target.value)} placeholder="Key insight for pull-quote layout..." />
      </div>
      <div className="form-group">
        <label className="form-label">Hero / Logo URL</label>
        <input className="form-control" type="url" value={content.heroUrl||content.logoUrl||''} onChange={e=>{updateContent('heroUrl',e.target.value);updateContent('logoUrl',e.target.value);}} placeholder="https://example.com/logo.png" />
      </div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div className="form-group" style={{marginBottom:0}}><label className="form-label">@X</label><input value={content.socialX||''} onChange={e=>updateContent('socialX',e.target.value)}/></div><div className="form-group" style={{marginBottom:0}}><label className="form-label">@Sub</label><input value={content.socialSub||''} onChange={e=>updateContent('socialSub',e.target.value)}/></div></div></div>
          <div className="editor-section"><div className="editor-section-title">Editorial</div><div className="form-group"><label className="form-label">Title</label><textarea id="field-title" value={content.title} onChange={e=>updateContent('title',e.target.value)} rows={2}/><div className={`char-count ${content.title.length>60?'warn':''} ${content.title.length>80?'over':''}`}>{content.title.length}/60</div>{renderFieldCompliance('field-title')}</div><div className="form-group"><label className="form-label">Deck</label><textarea value={content.deck} onChange={e=>updateContent('deck',e.target.value)} rows={2}/><div className={`char-count ${content.deck.length>120?'warn':''}`}>{content.deck.length}/120</div></div><div className="form-group"><label className="form-label">Body</label><textarea value={content.body} onChange={e=>updateContent('body',e.target.value)} rows={4}/><div className={`char-count ${content.body.length>400?'warn':''}`}>{content.body.length}/400</div></div></div>
          <div className="editor-section">
            <div className="editor-section-title">Deep-Dive Scaffold</div>
            <div className="form-group"><label className="form-label">Thesis</label><textarea value={content.thesis||''} onChange={e=>updateContent('thesis',e.target.value)} rows={2} placeholder="What is the core investment/research claim?"/></div>
            <div className="form-label" style={{marginBottom:6}}>Mechanism Steps</div>
            {(content.mechanismSteps||[]).map((step,i)=>(<div key={`ms-${i}`} style={{display:'flex',gap:4,marginBottom:4,alignItems:'center'}}><input value={step} style={{fontSize:11}} onChange={e=>{const a=[...(content.mechanismSteps||[])];a[i]=e.target.value;updateContent('mechanismSteps',a);}}/><button className="btn btn-danger btn-sm" style={{padding:'0 8px'}} onClick={()=>updateContent('mechanismSteps',(content.mechanismSteps||[]).filter((_,r)=>r!==i))}>✕</button></div>))}
            <button className="btn btn-secondary btn-sm w-full" style={{marginBottom:10}} onClick={()=>updateContent('mechanismSteps',[...(content.mechanismSteps||[]),''])}>+ Mechanism Step</button>
            <div className="form-label" style={{marginBottom:6}}>Risk Notes</div>
            {(content.riskNotes||[]).map((note,i)=>(<div key={`rn-${i}`} style={{display:'flex',gap:4,marginBottom:4,alignItems:'center'}}><input value={note} style={{fontSize:11}} onChange={e=>{const a=[...(content.riskNotes||[])];a[i]=e.target.value;updateContent('riskNotes',a);}}/><button className="btn btn-danger btn-sm" style={{padding:'0 8px'}} onClick={()=>updateContent('riskNotes',(content.riskNotes||[]).filter((_,r)=>r!==i))}>✕</button></div>))}
            <button className="btn btn-secondary btn-sm w-full" style={{marginBottom:10}} onClick={()=>updateContent('riskNotes',[...(content.riskNotes||[]),''])}>+ Risk Note</button>
            <div className="form-label" style={{marginBottom:6}}>Evidence Points</div>
            {(content.evidencePoints||[]).map((point,i)=>(<div key={`ep-${i}`} style={{display:'flex',gap:4,marginBottom:4,alignItems:'center'}}><input value={point} style={{fontSize:11}} onChange={e=>{const a=[...(content.evidencePoints||[])];a[i]=e.target.value;updateContent('evidencePoints',a);}}/><button className="btn btn-danger btn-sm" style={{padding:'0 8px'}} onClick={()=>updateContent('evidencePoints',(content.evidencePoints||[]).filter((_,r)=>r!==i))}>✕</button></div>))}
            <button className="btn btn-secondary btn-sm w-full" onClick={()=>updateContent('evidencePoints',[...(content.evidencePoints||[]),''])}>+ Evidence Point</button>
          </div>
          <div className="editor-section" style={{opacity:isSectionLocked('stats')?0.55:1}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div className="editor-section-title">Stats</div><button className="btn btn-ghost btn-sm" onClick={()=>toggleSectionLock('stats')}>{isSectionLocked('stats')?'🔒 Locked':'🔓 Unlock'}</button></div><div role="list">{content.stats.map((s,i)=>(<DragItem key={`s-${i}`} index={i} id={`s-${i}`} onMove={(f,t)=>{if(isSectionLocked('stats'))return;const a=[...content.stats];const[it]=a.splice(f,1);a.splice(t,0,it);updateContent('stats',a);}}><div style={{display:'grid',gridTemplateColumns:'auto 1fr 1fr auto',gap:6,marginBottom:4,alignItems:'center'}}><span style={{color:'var(--dim)',fontSize:10,cursor:'grab',padding:'0 4px'}}>⋮⋮</span><input disabled={isSectionLocked('stats')} value={s.label} placeholder="LABEL" style={{fontSize:11}} onChange={e=>{const a=[...content.stats];a[i]={...a[i],label:e.target.value};updateContent('stats',a);}}/><input disabled={isSectionLocked('stats')} value={s.value} placeholder="VALUE" style={{fontSize:11}} onChange={e=>{const a=[...content.stats];a[i]={...a[i],value:e.target.value};updateContent('stats',a);}}/><button className="btn btn-danger btn-sm" style={{padding:'0 6px',height:28}} disabled={isSectionLocked('stats')} onClick={()=>updateContent('stats',content.stats.filter((_,r)=>r!==i))}>✕</button></div></DragItem>))}</div><button className="btn btn-secondary btn-sm w-full" style={{marginTop:4}} disabled={isSectionLocked('stats')} onClick={()=>updateContent('stats',[...content.stats,{label:'',value:''}])}>+ Stat</button></div>
          <div className="editor-section"><div className="editor-section-title">Bull / Bear</div><div className="form-label" style={{marginBottom:6,color:'var(--theme-accent)'}}>BULL</div>{(content.bullPoints||[]).map((p,i)=>(<DragItem key={`bu-${i}`} index={i} id={`bu-${i}`} onMove={(f,t)=>{const a=[...content.bullPoints];const[it]=a.splice(f,1);a.splice(t,0,it);updateContent('bullPoints',a);}}><div style={{display:'flex',gap:4,marginBottom:4,alignItems:'center'}}><span style={{color:'var(--dim)',fontSize:10,cursor:'grab'}}>⋮⋮</span><input value={p} style={{fontSize:11}} onChange={e=>{const a=[...content.bullPoints];a[i]=e.target.value;updateContent('bullPoints',a);}}/><button className="btn btn-danger btn-sm" style={{padding:'0 8px'}} onClick={()=>updateContent('bullPoints',content.bullPoints.filter((_,r)=>r!==i))}>✕</button></div></DragItem>))}<button className="btn btn-secondary btn-sm w-full" style={{marginBottom:10}} onClick={()=>updateContent('bullPoints',[...(content.bullPoints||[]),''])}>+ Bull</button><div className="form-label" style={{marginBottom:6,color:'#FF5A5A'}}>BEAR</div>{(content.bearPoints||[]).map((p,i)=>(<DragItem key={`be-${i}`} index={i} id={`be-${i}`} onMove={(f,t)=>{const a=[...content.bearPoints];const[it]=a.splice(f,1);a.splice(t,0,it);updateContent('bearPoints',a);}}><div style={{display:'flex',gap:4,marginBottom:4,alignItems:'center'}}><span style={{color:'var(--dim)',fontSize:10,cursor:'grab'}}>⋮⋮</span><input value={p} style={{fontSize:11}} onChange={e=>{const a=[...content.bearPoints];a[i]=e.target.value;updateContent('bearPoints',a);}}/><button className="btn btn-danger btn-sm" style={{padding:'0 8px'}} onClick={()=>updateContent('bearPoints',content.bearPoints.filter((_,r)=>r!==i))}>✕</button></div></DragItem>))}<button className="btn btn-secondary btn-sm w-full" style={{marginBottom:10}} onClick={()=>updateContent('bearPoints',[...(content.bearPoints||[]),''])}>+ Bear</button><div className="form-group"><label className="form-label">Verdict</label><textarea value={content.verdict||''} onChange={e=>updateContent('verdict',e.target.value)} rows={2}/></div></div>
          
      {/* NOTE: Table Column Headers */}
      <div className="editor-section">
        <div className="editor-section-title">Column Headers</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(content.tableHeaders || ['NAME','VALUE','CHANGE','RISK','GRADE']).map((h, hIdx) => (
            <input key={hIdx} className="form-control" value={h}
              style={{ flex: 1, fontFamily: 'var(--font-m)', fontSize: 10, padding: '3px 5px', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 0 }}
              onChange={e => {
                const newH = [...(content.tableHeaders || ['NAME','VALUE','CHANGE','RISK','GRADE'])];
                newH[hIdx] = e.target.value.toUpperCase();
                updateContent('tableHeaders', newH);
              }} />
          ))}
        </div>
      </div>
<div className="editor-section" style={{opacity:isSectionLocked('table')?0.55:1}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div className="editor-section-title">Table</div><button className="btn btn-ghost btn-sm" onClick={()=>toggleSectionLock('table')}>{isSectionLocked('table')?'🔒 Locked':'🔓 Unlock'}</button></div><div className="form-group"><label className="form-label">Headers (comma-sep)</label><input disabled={isSectionLocked('table')} value={(content.tableHeaders||[]).join(', ')} onChange={e=>updateContent('tableHeaders',e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}/></div>{(content.tableRows||[]).map((row,i)=>(<DragItem key={`tr-${i}`} index={i} id={`tr-${i}`} onMove={(f,t)=>{if(isSectionLocked('table'))return;const a=[...content.tableRows];const[it]=a.splice(f,1);a.splice(t,0,it);updateContent('tableRows',a);}}><div style={{display:'grid',gridTemplateColumns:`auto repeat(${Object.keys(row).length},1fr) auto`,gap:3,marginBottom:3,alignItems:'center'}}><span style={{color:'var(--dim)',fontSize:10,cursor:'grab'}}>⋮⋮</span>{Object.keys(row).map(k=>(<input disabled={isSectionLocked('table')} key={k} value={row[k]} style={{fontSize:10,padding:'5px 6px'}} onChange={e=>{const a=[...content.tableRows];a[i]={...a[i],[k]:e.target.value};updateContent('tableRows',a);}}/>))}<button className="btn btn-danger btn-sm" style={{padding:'0 7px',height:30}} disabled={isSectionLocked('table')} onClick={()=>updateContent('tableRows',content.tableRows.filter((_,r)=>r!==i))}>✕</button></div></DragItem>))}<button className="btn btn-secondary btn-sm w-full" style={{marginTop:6}} disabled={isSectionLocked('table')} onClick={()=>{const c=(content.tableHeaders||[]).length||5;const r={};for(let j=1;j<=c;j++)r[`col${j}`]='';updateContent('tableRows',[...(content.tableRows||[]),r]);}}>+ Row</button></div>
          <div className="editor-section">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div className="editor-section-title" style={{marginBottom:0}}>Grid Items</div>
              <button className="btn btn-secondary btn-sm" style={{fontSize:9,padding:'2px 8px'}} onClick={()=>updateContent('gridItems',[...(content.gridItems||[]),{title:'',value:'',sub:''}])}>+ Item</button>
            </div>
            {(content.gridItems||[]).map((item,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:4,marginBottom:4,alignItems:'center'}}>
                <input value={item.title||''} placeholder="Title" style={{fontSize:10,padding:'4px 6px'}} onChange={e=>{const a=[...(content.gridItems||[])];a[i]={...a[i],title:e.target.value};updateContent('gridItems',a);}}/>
                <input value={item.value||''} placeholder="Value" style={{fontSize:10,padding:'4px 6px'}} onChange={e=>{const a=[...(content.gridItems||[])];a[i]={...a[i],value:e.target.value};updateContent('gridItems',a);}}/>
                <input value={item.sub||''} placeholder="Sub" style={{fontSize:10,padding:'4px 6px'}} onChange={e=>{const a=[...(content.gridItems||[])];a[i]={...a[i],sub:e.target.value};updateContent('gridItems',a);}}/>
                <button className="btn btn-danger btn-sm" style={{padding:'0 6px',height:28}} onClick={()=>updateContent('gridItems',(content.gridItems||[]).filter((_,r)=>r!==i))}>✕</button>
              </div>
            ))}
            {(content.gridItems||[]).length===0&&<div style={{fontFamily:'var(--font-m)',fontSize:10,color:'var(--dim)',padding:'8px 0'}}>No items yet — click + Item to add</div>}
          </div>
          <div className="editor-section" style={{opacity:isSectionLocked('timeline')?0.55:1}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><div className="editor-section-title" style={{marginBottom:0}}>Timeline Events</div><button className="btn btn-ghost btn-sm" onClick={()=>toggleSectionLock('timeline')}>{isSectionLocked('timeline')?'🔒 Locked':'🔓 Unlock'}</button>
              <button className="btn btn-secondary btn-sm" style={{fontSize:9,padding:'2px 8px'}} disabled={isSectionLocked('timeline')} onClick={()=>updateContent('timelineEvents',[...(content.timelineEvents||[]),{date:'',label:'',sub:''}])}>+ Event</button>
            </div>
            {(content.timelineEvents||[]).map((ev,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'80px 1fr 1fr auto',gap:4,marginBottom:4,alignItems:'center'}}>
                <input disabled={isSectionLocked('timeline')} value={ev.date||''} placeholder="Date" style={{fontSize:10,padding:'4px 6px'}} onChange={e=>{const raw=e.target.value;const normalized=normalizeDateInput(raw);const a=[...(content.timelineEvents||[])];a[i]={...a[i],date:normalized.valid?normalized.displayDate:raw};updateContent('timelineEvents',a);if(raw&&!normalized.valid){showToast(`Invalid timeline date. ${normalized.suggestions.join(' ')}`,'warning');}}}/>
                <input disabled={isSectionLocked('timeline')} value={ev.label||''} placeholder="Event" style={{fontSize:10,padding:'4px 6px'}} onChange={e=>{const a=[...(content.timelineEvents||[])];a[i]={...a[i],label:e.target.value};updateContent('timelineEvents',a);}}/>
                <input disabled={isSectionLocked('timeline')} value={ev.sub||''} placeholder="Note" style={{fontSize:10,padding:'4px 6px'}} onChange={e=>{const a=[...(content.timelineEvents||[])];a[i]={...a[i],sub:e.target.value};updateContent('timelineEvents',a);}}/>
                <button className="btn btn-danger btn-sm" style={{padding:'0 6px',height:28}} disabled={isSectionLocked('timeline')} onClick={()=>updateContent('timelineEvents',(content.timelineEvents||[]).filter((_,r)=>r!==i))}>✕</button>
              </div>
            ))}
            {(content.timelineEvents||[]).length===0&&<div style={{fontFamily:'var(--font-m)',fontSize:10,color:'var(--dim)',padding:'8px 0'}}>No events yet — click + Event to add</div>}
          </div>
          <div className="editor-section"><div className="editor-section-title">Big Number</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div className="form-group" style={{marginBottom:0}}><label className="form-label">Label</label><input value={content.bigLabel||''} onChange={e=>updateContent('bigLabel',e.target.value)}/></div><div className="form-group" style={{marginBottom:0}}><label className="form-label">Value</label><input value={content.bigNumber||''} onChange={e=>updateContent('bigNumber',e.target.value)}/></div></div></div>
          <div className="editor-section"><div className="editor-section-title">Images</div><ImageUpload label="Logo" value={uploadedImages.logo} onChange={v=>updateMedia(p=>({...p,uploadedImages:{...p.uploadedImages,logo:v}}))} maxSize={2} showToast={showToast}/><ImageUpload label="Hero" value={uploadedImages.hero} onChange={v=>updateMedia(p=>({...p,uploadedImages:{...p.uploadedImages,hero:v}}))} maxSize={4} showToast={showToast}/><ImageUpload label="Badge" value={uploadedImages.badge} onChange={v=>updateMedia(p=>({...p,uploadedImages:{...p.uploadedImages,badge:v}}))} maxSize={1} showToast={showToast}/></div>
          <div className="editor-section"><div className="editor-section-title">Frame Warnings</div>{activeFramePitfalls.length===0?<div style={{fontSize:11,color:'var(--dim)'}}>No known pitfalls for this frame.</div>:<div style={{display:'flex',flexDirection:'column',gap:6}}>{activeFramePitfalls.map(p=>(<div key={p.id} style={{fontSize:11,padding:'7px 8px',borderRadius:6,border:`1px solid ${p.severity==='high'?'rgba(235,87,87,0.45)':'rgba(229,178,58,0.45)'}`,background:p.severity==='high'?'rgba(235,87,87,0.08)':'rgba(229,178,58,0.1)'}}><div style={{fontFamily:'var(--font-m)',fontSize:9,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>{p.severity==='high'?'Blocking':'Non-blocking'}</div><div>{p.warning}</div><div style={{opacity:0.75,marginTop:4}}>Hint: {p.triggerHint}</div></div>))}</div>}</div><div className="editor-section"><div className="editor-section-title">Export</div><div style={{fontFamily:'var(--font-m)',fontSize:9,color:'var(--dim)',marginBottom:8,lineHeight:1.7}}>⌘S Save · ⌘Z Undo · ⌘⇧Z Redo</div><div style={{display:'flex',flexDirection:'column',gap:8}}><div style={{display:'flex',gap:6}}><button className="btn btn-primary btn-sm" style={{flex:1}} onClick={exportPNG} disabled={exporting}>{exporting?'…':`PNG`}</button><button className="btn btn-secondary btn-sm editor-action-btn" onClick={exportWebP} disabled={exporting}>WebP</button></div><div style={{display:'flex',gap:6}}><button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={exportHTML}>HTML</button><button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={exportJSON}>JSON</button></div><label className="import-label">↑ Import <input type="file" accept=".json" onChange={importJSON}/></label><button className="btn btn-secondary w-full" onClick={()=>setShowSaveModal(true)}>Save</button><button className="btn btn-ghost w-full" onClick={()=>commandRegistry.find(c=>c.id==='duplicate')?.handler()}>Duplicate</button>{saves.length>0&&<button className="btn btn-ghost w-full" onClick={()=>commandRegistry.find(c=>c.id==='load')?.handler()}>Load ({saves.length})</button>}</div></div>
        </>)}
      </div>
      {showCommandPalette&&<div className="modal-overlay open" onClick={e=>e.target===e.currentTarget&&setShowCommandPalette(false)}><div className="modal" style={{maxWidth:640}}><div className="modal-header"><span className="modal-title">Command Palette</span><button className="modal-close" onClick={()=>setShowCommandPalette(false)}>✕</button></div><input className="form-control" autoFocus placeholder="Type a command..." value={paletteQuery} onChange={e=>setPaletteQuery(e.target.value)} style={{marginBottom:12}}/>{Object.entries(filterCommands(commandRegistry.filter(c=>c.id!=='palette.open'),paletteQuery).reduce((groups,cmd)=>{(groups[cmd.category] ||= []).push(cmd);return groups;},{})).map(([group,items])=>(<div key={group} style={{marginBottom:10}}><div style={{fontSize:11,color:'var(--dim)',marginBottom:6,textTransform:'uppercase'}}>{group}</div><div style={{display:'flex',flexDirection:'column',gap:4}}>{items.map(cmd=>(<button key={cmd.id} className="btn btn-ghost" style={{justifyContent:'space-between',display:'flex',width:'100%'}} disabled={!cmd.enabled()} onClick={()=>{cmd.handler();setShowCommandPalette(false);}}><span>{cmd.label}</span><span style={{fontFamily:'var(--font-m)',fontSize:10,color:'var(--dim)'}}>{cmd.shortcut}</span></button>))}</div></div>))}</div></div>}
      {/* MODALS */}
      {showSaveModal&&<div className="modal-overlay open" onClick={e=>e.target===e.currentTarget&&setShowSaveModal(false)}><div className="modal"><div className="modal-header"><span className="modal-title">Save</span><button className="modal-close" onClick={()=>setShowSaveModal(false)}>✕</button></div><div className="form-group"><label className="form-label">Name</label><input value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder={`${content.topicTag}`} onKeyDown={e=>e.key==='Enter'&&doSave()} autoFocus/></div><div className="form-group"><label className="form-label">Tags (comma-separated)</label><input value={saveTagsInput} onChange={e=>setSaveTagsInput(e.target.value)} placeholder="alpha, defi"/></div><div className="form-group"><label className="form-label">Folder</label><input value={saveFolder} onChange={e=>setSaveFolder(e.target.value)} placeholder="Research"/></div><div className="form-group"><label className="form-label">Status (optional)</label><input value={saveStatus} onChange={e=>setSaveStatus(e.target.value)} placeholder="Draft"/></div><div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowSaveModal(false)}>Cancel</button><button className="btn btn-primary" onClick={doSave}>Save</button></div></div></div>}
      {showLoadModal&&<div className="modal-overlay open" onClick={e=>e.target===e.currentTarget&&setShowLoadModal(false)}><div className="modal"><div className="modal-header"><span className="modal-title">Load</span><button className="modal-close" onClick={()=>setShowLoadModal(false)}>✕</button></div><div className="form-group"><label className="form-label">Name</label><input value={saveSearch} onChange={e=>setSaveSearch(e.target.value)} placeholder="Search name"/></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div className="form-group"><label className="form-label">Tag</label><input value={loadTagFilter} onChange={e=>setLoadTagFilter(e.target.value)} placeholder="defi"/></div><div className="form-group"><label className="form-label">Folder</label><input value={loadFolderFilter} onChange={e=>setLoadFolderFilter(e.target.value)} placeholder="Research"/></div><div className="form-group"><label className="form-label">Frame</label><input value={loadFrameFilter} onChange={e=>setLoadFrameFilter(e.target.value.replace(/[^0-9]/g,''))} placeholder="4"/></div><div className="form-group"><label className="form-label">From</label><input type="date" value={loadDateFrom} onChange={e=>setLoadDateFrom(e.target.value)}/></div><div className="form-group"><label className="form-label">To</label><input type="date" value={loadDateTo} onChange={e=>setLoadDateTo(e.target.value)}/></div></div>{filteredSaves.length===0?<div className="empty-state">No matching saves.</div>:<div className="saves-list" style={{maxHeight:400,overflowY:'auto'}}>{filteredSaves.map(s=>(<div key={s.id} className="save-item" onClick={()=>loadSave(s)}><div style={{width:32,height:32,borderRadius:6,background:s.theme?.base||'var(--bg-3)',border:`2px solid ${s.theme?.accent||'var(--border)'}`,flexShrink:0}}/><div className="save-item-info"><div className="save-item-name">{s.title}</div><div className="save-item-meta">#{s.frameId} · {(s.folder||'Root')} · {Array.isArray(s.tags)&&s.tags.length?s.tags.join(', '):'No tags'} · {new Date(s.savedAt).toLocaleDateString()}</div></div><button className="btn btn-danger btn-sm" onClick={e=>{e.stopPropagation();setShowDeleteConfirm(s.id);}}>✕</button></div>))}</div>}</div></div>}
            {showDeleteConfirm&&<div className="confirm-overlay" onClick={()=>setShowDeleteConfirm(null)}><div className="confirm-box" onClick={e=>e.stopPropagation()}><div className="confirm-title">Delete?</div><div className="confirm-actions"><button className="btn btn-secondary btn-sm" onClick={()=>setShowDeleteConfirm(null)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={confirmDel}>Delete</button></div></div></div>}
      {showAutosavePrompt&&<div className="confirm-overlay" onClick={()=>setShowAutosavePrompt(false)}><div className="confirm-box" onClick={e=>e.stopPropagation()}><div className="confirm-title">Restore Session?</div><div className="confirm-msg">Found autosave from last session.</div><div className="confirm-actions"><button className="btn btn-secondary btn-sm" onClick={()=>setShowAutosavePrompt(false)}>Discard</button><button className="btn btn-primary btn-sm" onClick={restoreAutosave}>Restore</button></div></div></div>}
    </div>
  );
}
