const DEFAULT_CONTENT = {
  issueNum:'001',date:'05.01.26',desk:'YIELD',volume:'I',topicTag:'STABLECOIN RISK',
  title:'THE END OF MERCENARY YIELD',
  deck:'Why the era of unsustainable APYs is finally closing — and what comes next.',
  body:'Three years ago, triple-digit APYs were table stakes for any new DeFi protocol. Liquidity mining was the only customer acquisition strategy anyone needed.\n\nThe protocols that survived aren\'t the ones that offered the most — they\'re the ones that built real revenue.',
  handle:'@0xWhizMiz',socialX:'@X',socialSub:'@SUBSTACK',
  status:'PUBLISHED',
  tickerSpeed:28,sparkData:'1.2,1.8,2.9,2.1,1.6,2.4,3.8,4.2,3.6',
  stats:[{label:'TVL',value:'$4.2B'},{label:'24H VOL',value:'$890M'},{label:'APY',value:'18.4%'},{label:'USERS',value:'142K'},{label:'CHAINS',value:'7'}],
  tableRows:[{col1:'Aave',col2:'USDC',col3:'5.2%',col4:'Low',col5:'A+'},{col1:'Compound',col2:'ETH',col3:'3.8%',col4:'Low',col5:'A'},{col1:'Pendle',col2:'stETH',col3:'14.1%',col4:'Med',col5:'B+'},{col1:'Morpho',col2:'USDT',col3:'7.3%',col4:'Low',col5:'A-'},{col1:'Yearn',col2:'DAI',col3:'9.6%',col4:'Med',col5:'B+'}],
  tableHeaders:['PROTOCOL','ASSET','APY','RISK','WHIZ GRADE'],
  bullPoints:['Real yield is sustainable','Network effects > incentives','Multi-chain reduces risk'],
  bearPoints:['Regulatory pressure rising','TradFi rates compete','Smart contract risk persists'],
  bigNumber:'$47B',bigLabel:'TOTAL DeFi TVL',
  verdict:'Position in protocols with proven revenue. Avoid incentive-only models.',
  gridItems:[],timelineEvents:[],
  bracketRound1:[
    {leftSeed:'1',leftName:'Pendle PT-USDe',leftScore:'78',rightSeed:'8',rightName:'Curve crvUSD',rightScore:'65'},
    {leftSeed:'4',leftName:'Aave USDC',leftScore:'71',rightSeed:'5',rightName:'Morpho Prime',rightScore:'74'},
    {leftSeed:'2',leftName:'Ethena sUSDe',leftScore:'82',rightSeed:'7',rightName:'Spark sDAI',rightScore:'61'},
    {leftSeed:'3',leftName:'Euler Boosted',leftScore:'69',rightSeed:'6',rightName:'Fluid Vault',rightScore:'67'},
  ],
  bracketRound2:[
    {leftSeed:'',leftName:'',leftScore:'73',rightSeed:'',rightName:'',rightScore:'76'},
    {leftSeed:'',leftName:'',leftScore:'84',rightSeed:'',rightName:'',rightScore:'79'},
  ],
  bracketRound3:[{leftSeed:'',leftName:'',leftScore:'88',rightSeed:'',rightName:'',rightScore:'85'}],
  bracketWinner:{name:'',seed:'',score:''},
};

const DEFAULT_OVERRIDES = {frameBg:null,spineColor:null,tickerColor:null,tickerBg:null,title:{fontSize:52,fontWeight:700,color:'#F4F5F7',italic:false,lineHeight:1.05,letterSpacing:-0.02,textAlign:'left',opacity:1},deck:{fontSize:18,fontWeight:400,color:'#8B95A3',italic:true},body:{fontSize:15,fontWeight:400,color:'#8B95A3',lineHeight:1.75,textAlign:'left',opacity:1},accent:{color:null},tag:{background:null,color:null,borderColor:null},footer:{background:null},statsColor:null,bignumColor:null,avatarColor:null,ruleBg:null,handleColor:null};

const clone = (value) => structuredClone(value);

export function createDefaultContent() {
  return clone(DEFAULT_CONTENT);
}

export function createDefaultOverrides() {
  return clone(DEFAULT_OVERRIDES);
}

export function createDefaultEditorState() {
  return {
    frameId: 4,
    content: createDefaultContent(),
    overrides: createDefaultOverrides(),
    strictWhizMode: true,
    aspectRatioIndex: 0,
    bgGradient: null,
    patternOverlay: null,
    effects: {
      glow: true,
      noise: true,
      intenseAccent: false,
    },
  };
}

export const REQUIRED_CONTENT_KEYS = Object.freeze(Object.keys(DEFAULT_CONTENT));

export function hasRequiredContentShape(content) {
  return REQUIRED_CONTENT_KEYS.every((key) => Object.hasOwn(content, key));
}
